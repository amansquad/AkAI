import { NextRequest } from 'next/server';
import { HIDE_AFTER_REPORTS, deviceOf, json, sql } from '@/lib/community-themes';

export const dynamic = 'force-dynamic';

/**
 * POST /api/themes/:id/report flags a theme, once per phone. Reports from
 * HIDE_AFTER_REPORTS phones hide it until it is looked at
 * (`npm run themes:db -- hidden`, then `restore` or `delete`).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const device = deviceOf(request);
  if (!device) return json({ error: 'Missing device id' }, 400);
  try {
    await sql()`
      with added as (
        insert into community_theme_reports (theme_id, device)
        select id, ${device} from community_themes where id = ${id}
        on conflict do nothing
        returning theme_id
      )
      update community_themes
      set reports = reports + 1, hidden = hidden or reports + 1 >= ${HIDE_AFTER_REPORTS}
      where id in (select theme_id from added)`;
    return json({ ok: true });
  } catch (error) {
    console.error('Community themes report error:', error);
    return json({ error: 'Unavailable right now' }, 503);
  }
}
