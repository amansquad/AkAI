import { NextRequest } from 'next/server';
import { SHARES_PER_DAY, deviceOf, json, newId, sql, toTheme, validate } from '@/lib/community-themes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/themes?sort=popular|new&offset=0&limit=30 lists shared themes.
 * With ?mine=1 and the phone's X-AkAI-Device header, lists that phone's own
 * themes instead (hidden ones included), so it can take them down.
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(p.get('limit')) || 30, 1), 60);
  const offset = Math.min(Math.max(Number(p.get('offset')) || 0, 0), 5000);
  try {
    if (p.get('mine') === '1') {
      const device = deviceOf(request);
      if (!device) return json({ error: 'Missing device id' }, 400);
      const rows = await sql()`select * from community_themes where device = ${device} order by created_at desc limit 100`;
      return json({ themes: rows.map((r) => ({ ...toTheme(r), hidden: Boolean(r.hidden) })) });
    }
    const rows = p.get('sort') === 'new'
      ? await sql()`select * from community_themes where not hidden order by created_at desc limit ${limit + 1} offset ${offset}`
      : await sql()`select * from community_themes where not hidden order by installs desc, created_at desc limit ${limit + 1} offset ${offset}`;
    const more = rows.length > limit;
    return json(
      { themes: rows.slice(0, limit).map(toTheme), next: more ? offset + limit : null },
      200,
      // Lists can be a few seconds old; this keeps the database quiet.
      { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' },
    );
  } catch (error) {
    console.error('Community themes list error:', error);
    return json({ error: 'Themes are unavailable right now' }, 503);
  }
}

/** POST /api/themes shares a theme. Needs the X-AkAI-Device header. */
export async function POST(request: NextRequest) {
  const device = deviceOf(request);
  if (!device) return json({ error: 'Missing device id' }, 400);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: 'Send the theme as JSON' }, 400); }
  const checked = validate(body);
  if ('error' in checked) return json({ error: checked.error }, 400);
  const t = checked.theme;
  try {
    const [{ n }] = await sql()`select count(*)::int as n from community_themes where device = ${device} and created_at > now() - interval '1 day'`;
    if (n >= SHARES_PER_DAY) return json({ error: `You can share ${SHARES_PER_DAY} themes a day. Try again tomorrow` }, 429);
    const id = newId();
    const [row] = await sql()`
      insert into community_themes (id, name, emoji, live, colors, author, device)
      values (${id}, ${t.name}, ${t.emoji}, ${t.live}, ${JSON.stringify(t.colors)}::jsonb, ${t.author}, ${device})
      returning *`;
    return json({ theme: toTheme(row) }, 201);
  } catch (error) {
    console.error('Community themes share error:', error);
    return json({ error: 'Sharing is unavailable right now' }, 503);
  }
}
