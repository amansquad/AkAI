import { NextRequest, NextResponse } from 'next/server';
import {
  PACK_NAME, TELEGRAM_BOT_TOKEN, convert, download, limited, stickerSet, type Output,
} from '@/lib/telegram-stickers';

/**
 * GET /api/stickers/file?pack=<name>&sticker=<file_unique_id>[&as=still|anim|gif]
 *
 * One sticker, fetched from Telegram so the bot token never leaves the server.
 * still (the default): the sticker itself, or for a moving one its first frame
 * (or Telegram's preview). anim and gif: a video sticker converted with ffmpeg.
 * A sticker never changes, so the CDN keeps each answer for a year and the
 * conversion runs once.
 */

export const maxDuration = 60;

const MAX_BYTES = 1024 * 1024;
const TYPES: Record<string, string> = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

const send = (bytes: Buffer, type: string) =>
  new NextResponse(new Uint8Array(bytes), {
    headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' },
  });

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const pack = p.get('pack') || '';
  const id = p.get('sticker') || '';
  const as = (p.get('as') || 'still') as Output;
  if (!PACK_NAME.test(pack) || !/^[A-Za-z0-9_-]{4,64}$/.test(id) || !['still', 'anim', 'gif'].includes(as)) {
    return fail('Bad request', 400);
  }
  if (!TELEGRAM_BOT_TOKEN) return fail("Sticker import isn't set up on this server yet", 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(`file:${ip}`, 400)) return fail('Too many requests. Try again in a minute', 429);

  try {
    const sticker = (await stickerSet(pack))?.stickers.find((s) => s.file_unique_id === id);
    if (!sticker) return fail('No such sticker', 404);

    if (sticker.is_video) {
      const video = await download(sticker.file_id, MAX_BYTES);
      const out = video && (await convert(video.bytes, as));
      if (out) return send(out, as === 'gif' ? 'image/gif' : 'image/webp');
      if (as !== 'still') return fail("This server can't convert moving stickers", 501);
    } else if (as !== 'still') {
      return fail('Not a video sticker', 400);
    }

    // A still sticker as it is; a moving one whose first frame couldn't be made, as its preview.
    const fileId = sticker.is_video || sticker.is_animated ? sticker.thumbnail?.file_id : sticker.file_id;
    const file = fileId ? await download(fileId, MAX_BYTES) : null;
    const type = TYPES[file?.path.split('.').pop()?.toLowerCase() || ''];
    if (!file || !type) return fail("Couldn't fetch the sticker", 502);
    return send(file.bytes, type);
  } catch (error) {
    console.error('Sticker file error:', error);
    return fail("Couldn't reach Telegram. Try again later", 502);
  }
}
