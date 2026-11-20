// POST /api/crash: a crash report the person chose to send from the app's
// Settings. It holds the error trace (with exception messages already
// stripped on the phone), app and Android versions and the phone model.
// Read them with `npm run themes:db -- crashes`.
import { sql, json } from '@/lib/community-themes';
import { checkAiLimit } from '@/lib/ai-limits';

const MAX_TRACE = 12_000;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1e9 ? v : 0);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Send the report as JSON' }, 400);
  }
  const trace = str(body.trace, MAX_TRACE);
  if (!trace) return json({ error: 'The report has no trace' }, 400);
  if (!process.env.DATABASE_URL) return json({ error: 'Crash reports are not set up on this server' }, 503);

  const limited = await checkAiLimit(request, 'crash');
  if (limited) return limited;

  try {
    await sql()`
      insert into crash_reports (app, app_code, android, sdk, model, trace)
      values (${str(body.app, 20)}, ${int(body.appCode)}, ${str(body.android, 20)}, ${int(body.sdk)}, ${str(body.model, 80)}, ${trace})`;
    return json({ ok: true }, 201);
  } catch (err) {
    console.error('Saving a crash report failed:', err);
    return json({ error: 'Could not save the report' }, 500);
  }
}
