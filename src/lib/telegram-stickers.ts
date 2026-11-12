// Telegram sticker packs, read through a bot (set TELEGRAM_BOT_TOKEN in
// Vercel; make one with @BotFather). The token stays on the server: phones
// ask /api/stickers for a pack and /api/stickers/file for each picture.

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';

/** Telegram pack names are letters, digits and underscores. */
export const PACK_NAME = /^[A-Za-z0-9_]{1,64}$/;

/** "https://t.me/addstickers/Name", "t.me/addstickers/Name" or just "Name". */
export function packNameFrom(input: string): string | null {
  const s = input.trim();
  const m = s.match(/(?:t\.me|telegram\.me|telegram\.dog)\/addstickers\/([A-Za-z0-9_]+)/i);
  const name = m ? m[1] : s;
  return PACK_NAME.test(name) ? name : null;
}

export type TgSticker = {
  file_id: string;
  file_unique_id: string;
  emoji?: string;
  is_animated: boolean;
  is_video: boolean;
  thumbnail?: { file_id: string; width: number; height: number };
};
export type TgStickerSet = { name: string; title: string; stickers: TgSticker[] };

export async function bot<T>(method: string, params: Record<string, string>): Promise<T | null> {
  const qs = new URLSearchParams(params);
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}?${qs}`, {
    next: { revalidate: 3600 },
  });
  if (!r.ok) return null;
  const body = (await r.json()) as { ok: boolean; result?: T };
  return body.ok && body.result !== undefined ? body.result : null;
}

export const stickerSet = (name: string) => bot<TgStickerSet>('getStickerSet', { name });

/** A file the bot can see, as bytes and its path on Telegram's servers, or null. */
export async function download(fileId: string, maxBytes: number): Promise<{ path: string; bytes: Buffer } | null> {
  const file = await bot<{ file_path?: string; file_size?: number }>('getFile', { file_id: fileId });
  const path = file?.file_path || '';
  // Sticker files and their previews only, so this can't read anything else the bot sees.
  if (!/^(stickers|thumbnails)\/[A-Za-z0-9_.-]+$/.test(path)) return null;
  if ((file?.file_size ?? 0) > maxBytes) return null;
  const r = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${path}`, { cache: 'no-store' });
  if (!r.ok) return null;
  const bytes = Buffer.from(await r.arrayBuffer());
  return bytes.length > maxBytes ? null : { path, bytes };
}

// ─── Video stickers ────────────────────────────────────────────────────────
// A keyboard can't send Telegram's .webm stickers, so ffmpeg turns them into an
// animated WebP (played in the keyboard, sent to apps that take WebP), a GIF
// (for apps that only take GIFs) or a still (the first frame, full size).

function ffmpegPath(): string | null {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    return (createRequire(import.meta.url)('ffmpeg-static') as string | null) || null;
  } catch {
    return null;
  }
}

export const canConvert = () => ffmpegPath() !== null;

export type Output = 'still' | 'anim' | 'gif';

// The same settings as native_keyboard/tools/fetch-sticker-pack.mjs, so built-in
// and imported packs look alike.
const FILTERS: Record<Output, string[]> = {
  still: ['-frames:v', '1', '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '85', '-f', 'webp'],
  anim: [
    '-vf', 'fps=12,scale=288:288:force_original_aspect_ratio=decrease',
    '-c:v', 'libwebp_anim', '-loop', '0', '-quality', '55', '-compression_level', '3', '-pix_fmt', 'yuva420p', '-f', 'webp',
  ],
  gif: [
    '-vf',
    'fps=12,scale=240:240:force_original_aspect_ratio=decrease:flags=lanczos,split[a][b];' +
      '[a]palettegen=reserve_transparent=1:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle:alpha_threshold=128',
    '-loop', '0', '-f', 'gif',
  ],
};

/** A .webm sticker converted to [out], or null if ffmpeg is missing or fails. */
export async function convert(webm: Buffer, out: Output): Promise<Buffer | null> {
  const ffmpeg = ffmpegPath();
  if (!ffmpeg) return null;
  const dir = await mkdtemp(join(tmpdir(), 'sticker-'));
  try {
    const input = join(dir, 'in.webm');
    const output = join(dir, 'out');
    await writeFile(input, webm);
    // libvpx-vp9 is the decoder that keeps the transparent background.
    const code = await new Promise<number>((resolve) => {
      const p = spawn(ffmpeg, ['-v', 'error', '-y', '-c:v', 'libvpx-vp9', '-i', input, ...FILTERS[out], output]);
      const timer = setTimeout(() => p.kill('SIGKILL'), 45_000);
      p.on('close', (c) => { clearTimeout(timer); resolve(c ?? 1); });
      p.on('error', () => { clearTimeout(timer); resolve(1); });
    });
    return code === 0 ? await readFile(output) : null;
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { start: number; count: number }>();

/** A per-instance brake on one client, like /api/giphy's. */
export function limited(ip: string, max: number): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.start > RATE_WINDOW_MS) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  h.count++;
  return h.count > max;
}
