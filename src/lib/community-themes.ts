// Community themes: keyboard themes people share from the app. A theme is
// five colours, a name, an emoji and an optional live animation, so a row is
// a few hundred bytes. There are no accounts: each phone sends a random id it
// made itself, which is stored only as a hash, for rate limits, one install
// and one report per phone, and letting a phone take down its own themes.
import { createHash, randomBytes } from 'node:crypto';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let sqlClient: NeonQueryFunction<false, false> | null = null;

/** Created on first use, so `next build` works without DATABASE_URL. */
export function sql() {
  if (!sqlClient) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    sqlClient = neon(url);
  }
  return sqlClient;
}

// The tables are made by scripts/community-themes.mjs (`npm run themes:db -- setup`).

/** Reports from this many phones hide a theme until it is looked at. */
export const HIDE_AFTER_REPORTS = 3;
/** Themes one phone may share in a day. */
export const SHARES_PER_DAY = 5;

export const COLOR_KEYS = ['bg', 'key', 'special', 'accent', 'text'] as const;
export type Colors = Record<(typeof COLOR_KEYS)[number], string>;

export interface CommunityTheme {
  id: string;
  name: string;
  emoji: string;
  live: string;
  colors: Colors;
  author: string;
  installs: number;
  createdAt: string;
}

/** The phone's own id, hashed; null when missing or malformed. */
export function deviceOf(request: Request): string | null {
  const raw = request.headers.get('x-akai-device')?.trim() ?? '';
  if (!/^[A-Za-z0-9-]{16,64}$/.test(raw)) return null;
  return createHash('sha256').update(`akai-community:${raw}`).digest('hex');
}

export function newId() {
  return randomBytes(6).toString('base64url');
}

// Kept out of names and authors. Look-alike digits and symbols are read as
// the letters they stand for, then only letters are kept, so "Sh1t",
// "f.u.c.k" and "F U C K" match too.
const BLOCKED = /(fuck|shit|bitch|cunt|cock|dick|pussy|nigg|fag|whore|slut|bastard|asshole|motherf|retard|twat|wank|porn|rape|nazi|hitler)/;
const LOOKALIKES: Record<string, string> = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', $: 's', '7': 't', '8': 'b', '9': 'g' };

export function isClean(s: string) {
  const letters = s.toLowerCase().replace(/[0-9!|@$]/g, (c) => LOOKALIKES[c] ?? c).replace(/[^a-z]/g, '');
  return !BLOCKED.test(letters);
}

/** Trims and checks a shared theme; returns the theme or a reason it can't be shared. */
export function validate(body: unknown): { theme: Omit<CommunityTheme, 'id' | 'installs' | 'createdAt'> } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Send the theme as JSON' };
  const b = body as Record<string, unknown>;
  const name = String(b.name ?? '').trim().replace(/\s+/g, ' ');
  const emoji = String(b.emoji ?? '').trim();
  const live = String(b.live ?? '').trim();
  const author = String(b.author ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 1 || name.length > 24) return { error: 'The name must be 1 to 24 characters' };
  if (author.length > 24) return { error: 'Your name can be up to 24 characters' };
  if (!isClean(name) || !isClean(author)) return { error: 'Please choose a different name' };
  if (emoji.length < 1 || emoji.length > 16 || /[\p{L}\p{N}]/u.test(emoji)) return { error: 'Pick one emoji for the theme' };
  if (!/^[a-z0-9_-]{0,32}$/.test(live)) return { error: 'Unknown live animation' };
  const c = (b.colors ?? {}) as Record<string, unknown>;
  const colors = {} as Colors;
  for (const k of COLOR_KEYS) {
    const v = String(c[k] ?? '').trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(v)) return { error: `The ${k} colour must look like #RRGGBB` };
    colors[k] = v.toUpperCase();
  }
  return { theme: { name, emoji, live, colors, author } };
}

/** A database row as the API returns it. */
export function toTheme(r: Record<string, unknown>): CommunityTheme {
  return {
    id: String(r.id),
    name: String(r.name),
    emoji: String(r.emoji),
    live: String(r.live ?? ''),
    colors: r.colors as Colors,
    author: String(r.author ?? ''),
    installs: Number(r.installs ?? 0),
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}
