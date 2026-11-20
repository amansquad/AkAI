// GET /api/cron/crash-digest: once a day (vercel.json), sends the last 24
// hours of crash reports to the owner's Telegram chat as one short message.
// Nothing is sent on a day without crashes.
//
// Needs, in Vercel: CRON_SECRET (Vercel then sends it with each cron call, and
// anyone else is refused), TELEGRAM_BOT_TOKEN (the sticker bot, already set) and
// TELEGRAM_ALERT_CHAT_ID (find it with `npm run themes:db -- chatid`).
import { sql } from '@/lib/community-themes';
import { digestMessage, type CrashRow } from '@/lib/crash-digest';

export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return json({ error: 'Unauthorized' }, 401);

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chat = process.env.TELEGRAM_ALERT_CHAT_ID?.trim();
  if (!token || !chat || !process.env.DATABASE_URL) return json({ error: 'Crash alerts are not set up' }, 503);

  const rows = (await sql()`
    select app, android, model, trace from crash_reports
    where created_at > now() - interval '24 hours' order by created_at desc limit 500`) as CrashRow[];
  const text = digestMessage(rows);
  if (!text) return json({ sent: false, crashes: 0 });

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
  });
  if (!r.ok) {
    console.error('Crash digest: Telegram refused the message', r.status, await r.text());
    return json({ error: 'Telegram refused the message' }, 502);
  }
  return json({ sent: true, crashes: rows.length });
}
