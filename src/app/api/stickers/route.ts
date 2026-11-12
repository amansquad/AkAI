import { NextRequest, NextResponse } from 'next/server';
import { TELEGRAM_BOT_TOKEN, canConvert, kindOf, limited, packNameFrom, stickerSet } from '@/lib/telegram-stickers';
import { sql } from '@/lib/community-themes';

/**
 * The name a pack is listed under in the Sticker Marketplace, if it is: Telegram
 * titles are often channel ads, so a pasted link should show the same clean name.
 */
async function marketTitle(name: string): Promise<string | null> {
  try {
    const rows = await sql()`select title from sticker_market where lower(name) = lower(${name}) and not hidden limit 1`;
    return (rows[0]?.title as string) || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/stickers?pack=<name or t.me/addstickers link>
 *
 * A Telegram sticker pack as links the keyboard downloads from /api/stickers/file:
 * every sticker has a still picture; a video sticker also has an animated WebP
 * (to play and send) and a GIF (for apps that only take GIFs). Animated .tgs
 * stickers (vector animations) come as their still preview only. kind is
 * "emoji" for a custom emoji pack (t.me/addemoji), "stickers" otherwise.
 */

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export async function GET(request: NextRequest) {
  const name = packNameFrom(request.nextUrl.searchParams.get('pack') || '');
  if (!name) return json({ error: 'Paste a link like t.me/addstickers/PackName' }, 400);
  if (!TELEGRAM_BOT_TOKEN) return json({ error: "Sticker import isn't set up on this server yet" }, 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(`pack:${ip}`, 30)) return json({ error: 'Too many requests. Try again in a minute' }, 429);

  try {
    const set = await stickerSet(name);
    if (!set) return json({ error: `No Telegram sticker pack called ${name}` }, 404);

    const moving = canConvert();
    const file = (sticker: string, as?: string) =>
      `/api/stickers/file?pack=${encodeURIComponent(set.name)}&sticker=${encodeURIComponent(sticker)}${as ? `&as=${as}` : ''}`;
    const stickers = set.stickers
      .filter((s) => !s.is_animated || s.thumbnail)
      .map((s) => ({
        id: s.file_unique_id,
        emoji: s.emoji || '',
        still: file(s.file_unique_id),
        ...(s.is_video && moving ? { anim: file(s.file_unique_id, 'anim'), gif: file(s.file_unique_id, 'gif') } : {}),
      }));
    if (stickers.length === 0) return json({ error: 'That pack has no stickers the keyboard can use' }, 422);

    return json(
      { name: set.name, title: (await marketTitle(set.name)) || set.title, kind: kindOf(set), stickers },
      200,
      { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' },
    );
  } catch (error) {
    console.error('Sticker pack error:', error);
    return json({ error: "Couldn't reach Telegram. Try again later" }, 502);
  }
}
