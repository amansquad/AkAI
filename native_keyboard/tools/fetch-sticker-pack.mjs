// Builds a Telegram sticker pack into the app (app/src/main/assets/sticker_packs/<name>),
// so it ships with the keyboard and works offline.
//
//   node native_keyboard/tools/fetch-sticker-pack.mjs https://t.me/addstickers/PackName
//
// Asks Telegram directly when TELEGRAM_BOT_TOKEN is set (in the environment,
// .env.local or .env), otherwise the Akai website's /api/stickers, which holds
// the token. --site <url> picks another website. Running it again replaces the pack.
//
// Every sticker gets a still picture. A video sticker (.webm) also gets an
// animated WebP, which the keyboard plays and sends, and a link to the website's
// GIF of it, for apps that only take GIFs. Converting locally needs ffmpeg on the
// PATH; it uses the same settings as src/lib/telegram-stickers.ts.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const out = resolve(here, '../app/src/main/assets/sticker_packs');

const args = process.argv.slice(2);
const siteAt = args.indexOf('--site');
const site = (siteAt >= 0 ? args.splice(siteAt, 2)[1] : 'https://ak-ai-opal.vercel.app').replace(/\/+$/, '');
const link = args[0];
const m = link?.match(/(?:t\.me|telegram\.me)\/addstickers\/([A-Za-z0-9_]+)/i);
const name = m ? m[1] : link;
if (!name || !/^[A-Za-z0-9_]{1,64}$/.test(name)) {
  console.error('Usage: node fetch-sticker-pack.mjs <t.me/addstickers/PackName> [--site <url>]');
  process.exit(1);
}

function token() {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN.trim();
  for (const f of ['.env.local', '.env']) {
    const p = join(root, f);
    if (!existsSync(p)) continue;
    const line = readFileSync(p, 'utf8').split(/\r?\n/).find((l) => l.startsWith('TELEGRAM_BOT_TOKEN='));
    const v = line?.slice('TELEGRAM_BOT_TOKEN='.length).trim().replace(/^["']|["']$/g, '');
    if (v) return v;
  }
  return '';
}

const TOKEN = token();
const FFMPEG = spawnSync('ffmpeg', ['-version']).status === 0;

const SETTINGS = {
  still: ['-frames:v', '1', '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '85', '-f', 'webp'],
  anim: [
    '-vf', 'fps=12,scale=288:288:force_original_aspect_ratio=decrease',
    '-c:v', 'libwebp_anim', '-loop', '0', '-quality', '55', '-compression_level', '3', '-pix_fmt', 'yuva420p', '-f', 'webp',
  ],
};

/** A VP9 .webm sticker as a still or animated WebP with its transparency, or null. */
function convert(webm, kind) {
  const dir = mkdtempSync(join(tmpdir(), 'akai-sticker-'));
  try {
    writeFileSync(join(dir, 'in.webm'), webm);
    // libvpx-vp9 is the decoder that keeps the alpha channel.
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-c:v', 'libvpx-vp9', '-i', join(dir, 'in.webm'), ...SETTINGS[kind], join(dir, 'out')]);
    return r.status === 0 && existsSync(join(dir, 'out')) ? readFileSync(join(dir, 'out')) : null;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function bot(method, params) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}?${new URLSearchParams(params)}`);
  const body = await r.json();
  if (!body.ok) throw new Error(`${method}: ${body.description}`);
  return body.result;
}

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/** The website's GIF of a video sticker: a path the keyboard asks its server for. */
const gifPath = (pack, id) => `/api/stickers/file?pack=${pack}&sticker=${id}&as=gif`;

/** { key, title, stickers: [{ id, emoji, still(), anim()?, gif? }] } */
async function load() {
  if (TOKEN) {
    if (!FFMPEG) console.warn('ffmpeg is not on the PATH: video stickers will be stills only');
    const set = await bot('getStickerSet', { name });
    const file = async (fileId) => get(`https://api.telegram.org/file/bot${TOKEN}/${(await bot('getFile', { file_id: fileId })).file_path}`);
    const stickers = set.stickers.flatMap((s) => {
      const preview = s.thumbnail?.file_id;
      if (s.is_animated && !preview) return [];
      let video;
      const webm = async () => (video ??= await file(s.file_id));
      const moving = s.is_video && FFMPEG;
      return [{
        id: s.file_unique_id, emoji: s.emoji || '',
        still: async () => {
          if (!s.is_video && !s.is_animated) return file(s.file_id);
          if (moving) { const f = convert(await webm(), 'still'); if (f) return f; }
          if (!preview) throw new Error('no still picture');
          return file(preview);
        },
        ...(moving ? { anim: async () => convert(await webm(), 'anim'), gif: gifPath(set.name, s.file_unique_id) } : {}),
      }];
    });
    return { key: set.name, title: set.title, stickers };
  }
  console.log(`No TELEGRAM_BOT_TOKEN here; asking ${site}`);
  const r = await fetch(`${site}/api/stickers?pack=${encodeURIComponent(name)}`);
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
  return {
    key: body.name, title: body.title,
    stickers: body.stickers.map((s) => ({
      id: s.id, emoji: s.emoji, gif: s.gif,
      still: () => get(site + s.still),
      ...(s.anim ? { anim: () => get(site + s.anim) } : {}),
    })),
  };
}

const kindOf = (b) => (b.subarray(8, 12).toString() === 'WEBP' ? 'webp' : b[0] === 0x89 ? 'png' : b[0] === 0xff ? 'jpg' : null);

const pack = await load();
const dir = join(out, pack.key);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const saved = [];
let moving = 0;
for (const [i, s] of pack.stickers.slice(0, 120).entries()) {
  const id = s.id.replace(/[^A-Za-z0-9_-]/g, '') || `s${i}`;
  try {
    const still = await s.still();
    const ext = kindOf(still);
    if (!ext) throw new Error('not a still picture');
    const entry = { id, emoji: s.emoji, file: `${id}.${ext}` };
    writeFileSync(join(dir, entry.file), still);
    const anim = s.anim ? await s.anim() : null;
    if (anim) {
      entry.anim = `${id}.anim.webp`;
      writeFileSync(join(dir, entry.anim), anim);
      if (s.gif) entry.gif = s.gif;
      moving++;
    }
    saved.push(entry);
    process.stdout.write(`\r${saved.length} of ${pack.stickers.length}`);
  } catch (e) {
    console.warn(`\nSkipped ${id}: ${e.message}`);
  }
}
writeFileSync(join(dir, 'pack.json'), JSON.stringify({ name: pack.key, title: pack.title, stickers: saved }, null, 1) + '\n');
console.log(`\nSaved "${pack.title}" (${saved.length} stickers, ${moving} moving) to ${dir}`);
