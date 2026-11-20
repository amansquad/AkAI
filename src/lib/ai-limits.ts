// Daily limits for the routes that cost money per call (translate, rewrite,
// handwriting). Each caller is counted by the phone's own id (X-AkAI-Device,
// hashed as in community themes) or, without one, by its IP address, also
// hashed. A cap on all callers together stops anyone getting round the
// per-caller limit by inventing new ids.
//
// Counts live in Neon (`ai_usage`, made by `npm run themes:db -- setup`).
// If the database is missing or down, calls are let through: a limit outage
// shouldn't take the keyboard's AI features down with it.
import { createHash } from 'node:crypto';
import { sql, deviceOf } from './community-themes';

export type AiFeature = 'translate' | 'rewrite' | 'handwriting';

/** Calls one phone (or IP address) may make a day, per feature. */
export const PER_CALLER: Record<AiFeature, number> = {
  translate: 300,
  rewrite: 150,
  handwriting: 300,
};

/** Calls everyone together may make a day, per feature. AI_DAILY_CAP overrides it. */
function globalCap(): number {
  const n = Number(process.env.AI_DAILY_CAP);
  return Number.isFinite(n) && n > 0 ? n : 20_000;
}

function ipOf(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = fwd || request.headers.get('x-real-ip')?.trim();
  return ip ? createHash('sha256').update(`akai-ip:${ip}`).digest('hex') : null;
}

/** Who is calling, as a stored key; null when neither an id nor an IP is known. */
export function callerOf(request: Request): string | null {
  const device = deviceOf(request);
  if (device) return `d:${device}`;
  const ip = ipOf(request);
  return ip ? `i:${ip}` : null;
}

/**
 * Counts this call and answers whether it may go ahead. Returns null when it
 * may, or a 429 response to send back when a limit is reached.
 */
export async function checkAiLimit(request: Request, feature: AiFeature): Promise<Response | null> {
  if (!process.env.DATABASE_URL) return null;
  const caller = callerOf(request) ?? 'unknown';
  try {
    const db = sql();
    const [mine] = await db`
      insert into ai_usage (caller, feature, day, calls) values (${caller}, ${feature}, current_date, 1)
      on conflict (caller, feature, day) do update set calls = ai_usage.calls + 1
      returning calls`;
    const [all] = await db`
      insert into ai_usage (caller, feature, day, calls) values ('*', ${feature}, current_date, 1)
      on conflict (caller, feature, day) do update set calls = ai_usage.calls + 1
      returning calls`;
    // Now and then, drop counts older than a week so the table stays small.
    if (Math.random() < 0.01) await db`delete from ai_usage where day < current_date - 7`;
    if (Number(mine.calls) > PER_CALLER[feature]) {
      return limited(`You've reached today's ${feature} limit. It resets tomorrow.`);
    }
    if (Number(all.calls) > globalCap()) {
      return limited(`${feature} is busy today. Please try again tomorrow.`);
    }
    return null;
  } catch (err) {
    console.error('AI limit check failed, letting the call through:', err);
    return null;
  }
}

function limited(error: string) {
  // Seconds until midnight UTC, when the counts start again.
  const now = new Date();
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  const retry = Math.max(60, Math.ceil((midnight - now.getTime()) / 1000));
  return Response.json(
    { error, limited: true },
    { status: 429, headers: { 'Retry-After': String(retry), 'Cache-Control': 'no-store' } },
  );
}
