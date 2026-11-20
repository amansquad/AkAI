import { NextRequest } from 'next/server';
import { HIDE_AFTER_REPORTS, deviceOf, json, sql } from '@/lib/community-themes';
import { alertOwner } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

/** Why someone can report a pack; anything else is stored as "other". */
const REASONS: readonly string[] = ['offensive', 'sexual', 'spam', 'broken'];

/**
 * POST /api/stickers/market/:name/report flags a marketplace pack, once per
 * phone, with an optional { reason }. Reports from HIDE_AFTER_REPORTS phones
 * hide the pack, and the owner is told on Telegram. Look with
 * `npm run stickers:db -- reported`, then `show <name>` or `delete <name>`.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const device = deviceOf(request);
  if (!device) return json({ error: 'Missing device id' }, 400);
  if (!/^[A-Za-z0-9_]{1,64}$/.test(name)) return json({ error: 'Bad pack name' }, 400);
  let reason = 'other';
  try {
    const body = await request.json();
    if (typeof body?.reason === 'string' && REASONS.includes(body.reason)) reason = body.reason;
  } catch { /* no body: a report without a reason */ }

  try {
    const rows = await sql()`
      with added as (
        insert into sticker_market_reports (name, device, reason)
        select name, ${device}, ${reason} from sticker_market where name = ${name}
        on conflict do nothing
        returning name
      )
      update sticker_market m
      set reports = reports + 1, hidden = hidden or reports + 1 >= ${HIDE_AFTER_REPORTS}
      where name in (select name from added)
      returning m.title, m.reports, m.hidden`;
    const r = rows[0];
    // Tell the owner the moment a pack is hidden (exactly at the threshold, so once).
    if (r && r.hidden && Number(r.reports) === HIDE_AFTER_REPORTS) {
      const reasons = await sql()`select reason, count(*)::int as n from sticker_market_reports where name = ${name} group by reason`;
      await alertOwner(
        `AkAI Sticker Marketplace: "${r.title}" [${name}] was hidden after ${r.reports} reports ` +
          `(${reasons.map((x) => `${x.n}× ${x.reason}`).join(', ')}).\n\n` +
          `Put it back: npm run stickers:db -- show ${name}\nRemove it: npm run stickers:db -- delete ${name}`,
      );
    }
    return json({ ok: true });
  } catch (error) {
    console.error('Sticker market report error:', error);
    return json({ error: 'Unavailable right now' }, 503);
  }
}
