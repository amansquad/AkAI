import { NextRequest } from 'next/server';
import { deviceOf, json, sql } from '@/lib/community-themes';

export const dynamic = 'force-dynamic';

/** POST /api/stickers/market/:name/install counts an install, once per phone. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const device = deviceOf(request);
  if (!device) return json({ error: 'Missing device id' }, 400);
  try {
    // The first install from this phone adds one; any later one changes nothing.
    const rows = await sql()`
      with added as (
        insert into sticker_market_installs (name, device)
        select name, ${device} from sticker_market where name = ${name}
        on conflict do nothing
        returning name
      )
      update sticker_market set installs = installs + 1
      where name in (select name from added)
      returning installs`;
    return json({ ok: true, counted: rows.length > 0 });
  } catch (error) {
    console.error('Sticker market install error:', error);
    return json({ error: 'Unavailable right now' }, 503);
  }
}
