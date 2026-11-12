import { NextRequest } from 'next/server';
import { json, sql } from '@/lib/community-themes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stickers/market?q=&offset=0&limit=20
 *
 * The Sticker Marketplace: packs the keyboard can install, most installed
 * first. q matches a pack's title, name or emoji. Packs are added with
 * scripts/sticker-market.mjs; installing downloads them through /api/stickers.
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(p.get('limit')) || 20, 1), 50);
  const offset = Math.min(Math.max(Number(p.get('offset')) || 0, 0), 5000);
  const q = (p.get('q') || '').trim().slice(0, 40);
  // kind=stickers or kind=emoji shows only that kind; left out, both.
  const kind = ['stickers', 'emoji'].includes(p.get('kind') || '') ? (p.get('kind') as string) : '';
  try {
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const rows = q
      ? await sql()`select * from sticker_market where not hidden and (${kind} = '' or kind = ${kind})
          and (title ilike ${like} or name ilike ${like} or emoji like ${like})
          order by installs desc, added_at desc limit ${limit + 1} offset ${offset}`
      : await sql()`select * from sticker_market where not hidden and (${kind} = '' or kind = ${kind})
          order by installs desc, added_at desc limit ${limit + 1} offset ${offset}`;
    const file = (name: string, id: string) =>
      `/api/stickers/file?pack=${encodeURIComponent(name)}&sticker=${encodeURIComponent(id)}`;
    const packs = rows.slice(0, limit).map((r) => ({
      name: r.name as string,
      title: r.title as string,
      count: r.count as number,
      moving: r.moving as number,
      installs: r.installs as number,
      kind: (r.kind as string) || 'stickers',
      previews: ((r.previews as string[]) || []).map((id) => file(r.name as string, id)),
    }));
    return json(
      { packs, next: rows.length > limit ? offset + limit : null },
      200,
      { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    );
  } catch (error) {
    console.error('Sticker market list error:', error);
    return json({ error: 'The Sticker Marketplace is unavailable right now' }, 503);
  }
}
