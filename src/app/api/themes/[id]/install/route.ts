import { NextRequest } from 'next/server';
import { deviceOf, json, sql } from '@/lib/community-themes';

export const dynamic = 'force-dynamic';

/** POST /api/themes/:id/install counts an install, once per phone. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const device = deviceOf(request);
  if (!device) return json({ error: 'Missing device id' }, 400);
  try {
    // The first install from this phone adds one; any later one changes nothing.
    const rows = await sql()`
      with added as (
        insert into community_theme_installs (theme_id, device)
        select id, ${device} from community_themes where id = ${id}
        on conflict do nothing
        returning theme_id
      )
      update community_themes set installs = installs + 1
      where id in (select theme_id from added)
      returning installs`;
    return json({ ok: true, counted: rows.length > 0 });
  } catch (error) {
    console.error('Community themes install error:', error);
    return json({ error: 'Unavailable right now' }, 503);
  }
}
