// Telegram sticker packs, read through a bot (set TELEGRAM_BOT_TOKEN in
// Vercel; make one with @BotFather). The token stays on the server: phones
// ask /api/stickers for a pack and /api/stickers/file for each picture.

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';

/** Telegram pack names are letters, digits and underscores. */
export const PACK_NAME = /^[A-Za-z0-9_]{1,64}$/;

/** "https://t.me/addstickers/Name", "t.me/addemoji/Name" (a custom emoji pack) or just "Name". */
export function packNameFrom(input: string): string | null {
  const s = input.trim();
  const m = s.match(/(?:t\.me|telegram\.me|telegram\.dog)\/add(?:stickers|emoji)\/([A-Za-z0-9_]+)/i);
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
export type TgStickerSet = { name: string; title: string; sticker_type?: string; stickers: TgSticker[] };

/** Telegram custom emoji (t.me/addemoji): small, 100 px, and usable as emoji only inside Telegram. */
export const kindOf = (set: TgStickerSet) => (set.sticker_type === 'custom_emoji' ? 'emoji' : 'stickers');

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
// A keyboard can't send Telegram's .webm (or .tgs) stickers, so ffmpeg turns them into an
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

export type Output = 'still' | 'anim' | 'gif' | 'emoji_anim' | 'emoji_gif';

// Custom emoji are 100 px. Sent as they are, Telegram and WhatsApp stretch them
// to sticker size and they come out huge and blurry. To send, each is drawn at
// 160 px in the middle of a clear 512 px sticker, so it shows small and sharp.
// Corners are rounded as in the keyboard's emoji grid (a no-op on cut-outs,
// whose corners are clear already).
const EMOJI_FIT =
  'fps=15:eof_action=pass,scale=160:160:force_original_aspect_ratio=decrease:flags=lanczos,format=rgba,' +
  "geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':" +
  "a='if(gt(hypot(max(0,abs(X-W/2)-(W/2-0.22*W)),max(0,abs(Y-H/2)-(H/2-0.22*W))),0.22*W),0,alpha(X,Y))'," +
  'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0';

// The same settings as native_keyboard/tools/fetch-sticker-pack.mjs, so built-in
// and imported packs look alike. `eof_action=pass` keeps the last frame: some
// "video" emoji are a single 0.03 s frame, which plain fps=12 turned into no
// frames at all, so the WebP encoder failed and the server answered 501.
const FILTERS: Record<Output, string[]> = {
  still: ['-frames:v', '1', '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '85', '-f', 'webp'],
  anim: [
    '-vf', 'fps=12:eof_action=pass,scale=288:288:force_original_aspect_ratio=decrease',
    '-c:v', 'libwebp_anim', '-loop', '0', '-quality', '55', '-compression_level', '3', '-pix_fmt', 'yuva420p', '-f', 'webp',
  ],
  gif: [
    '-vf',
    'fps=12:eof_action=pass,scale=240:240:force_original_aspect_ratio=decrease:flags=lanczos,split[a][b];' +
      '[a]palettegen=reserve_transparent=1:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle:alpha_threshold=128',
    '-loop', '0', '-f', 'gif',
  ],
  emoji_anim: [
    '-vf', EMOJI_FIT,
    '-c:v', 'libwebp_anim', '-loop', '0', '-quality', '70', '-compression_level', '4', '-pix_fmt', 'yuva420p', '-f', 'webp',
  ],
  emoji_gif: [
    '-vf',
    `${EMOJI_FIT},split[a][b];` +
      '[a]palettegen=reserve_transparent=1:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle:alpha_threshold=128',
    '-loop', '0', '-f', 'gif',
  ],
};

// ─── Vector (.tgs) stickers ────────────────────────────────────────────────
// A .tgs sticker is a gzipped Lottie animation. ThorVG (compiled to WebAssembly,
// in @lottiefiles/dotlottie-web) draws its frames into memory, and ffmpeg then
// makes the same WebP, GIF and still as for a video sticker.

const TGS_SIZE = 512;
const TGS_FPS = 12;
/** Telegram allows three seconds; a little room, so a bad file can't run long. */
const TGS_MAX_FRAMES = TGS_FPS * 4;

type DotLottieClass = typeof import('@lottiefiles/dotlottie-web').DotLottie;
let lottieReady: Promise<DotLottieClass> | null = null;

function lottie(): Promise<DotLottieClass> {
  lottieReady ??= (async () => {
    const { DotLottie } = await import('@lottiefiles/dotlottie-web');
    // From the project folder: the bundler rewrites require.resolve, and next.config.ts
    // ships this file with the route (outputFileTracingIncludes).
    const wasmPath = join(process.cwd(), 'node_modules', '@lottiefiles', 'dotlottie-web', 'dist', 'dotlottie-player.wasm');
    // Node's fetch reads data: URLs but not files, so the WebAssembly goes in as one.
    DotLottie.setWasmUrl(`data:application/wasm;base64,${(await readFile(wasmPath)).toString('base64')}`);
    return DotLottie;
  })().catch((e) => {
    lottieReady = null;
    throw e;
  });
  return lottieReady;
}

/**
 * The frames of a .tgs sticker at 12 a second (only the first when firstOnly),
 * as raw RGBA, TGS_SIZE square, one after another; or null if it can't be drawn.
 */
export async function tgsFrames(tgs: Buffer, firstOnly = false): Promise<{ rgba: Buffer; count: number } | null> {
  let player: InstanceType<DotLottieClass> | null = null;
  try {
    const json = gunzipSync(tgs, { maxOutputLength: 4 * 1024 * 1024 }).toString('utf8');
    const fr = Number(JSON.parse(json).fr) || 60;
    const DotLottie = await lottie();
    const p = new DotLottie({ canvas: { width: TGS_SIZE, height: TGS_SIZE }, data: json, autoplay: false });
    player = p;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), 10_000);
      p.addEventListener('load', () => { clearTimeout(timer); resolve(); });
      p.addEventListener('loadError', (e) => { clearTimeout(timer); reject(e.error); });
    });
    const frames: Buffer[] = [];
    const max = firstOnly ? 1 : TGS_MAX_FRAMES;
    for (let f = 0; f < p.totalFrames && frames.length < max; f += fr / TGS_FPS) {
      p.setFrame(f);
      const b = p.buffer;
      if (!b || b.length !== TGS_SIZE * TGS_SIZE * 4) return null;
      frames.push(Buffer.from(b));
    }
    return frames.length ? { rgba: Buffer.concat(frames), count: frames.length } : null;
  } catch (error) {
    console.error('Drawing a .tgs sticker failed:', error);
    return null;
  } finally {
    player?.destroy();
  }
}

/** A .webm or .tgs sticker converted to [out], or null if it can't be. */
export async function convert(sticker: Buffer, out: Output, kind: 'webm' | 'tgs' = 'webm'): Promise<Buffer | null> {
  const ffmpeg = ffmpegPath();
  if (!ffmpeg) return null;
  const frames = kind === 'tgs' ? await tgsFrames(sticker, out === 'still') : null;
  if (kind === 'tgs' && !frames) return null;
  const dir = await mkdtemp(join(tmpdir(), 'sticker-'));
  try {
    const input = join(dir, frames ? 'in.rgba' : 'in.webm');
    const output = join(dir, 'out');
    await writeFile(input, frames ? frames.rgba : sticker);
    const source = frames
      ? ['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${TGS_SIZE}x${TGS_SIZE}`, '-r', String(TGS_FPS), '-i', input]
      // libvpx-vp9 is the decoder that keeps the transparent background.
      : ['-c:v', 'libvpx-vp9', '-i', input];
    const code = await new Promise<number>((resolve) => {
      const p = spawn(ffmpeg, ['-v', 'error', '-y', ...source, ...FILTERS[out], output]);
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
