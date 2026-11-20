// Turns the day's crash reports into one short Telegram message: identical
// crashes (same error and first app-code line) grouped, most frequent first.

export interface CrashRow {
  app: string;
  android: string;
  model: string;
  trace: string;
}

export interface CrashGroup {
  error: string;
  where: string;
  count: number;
  versions: string[];
  example: string;
}

/** "java.lang.Foo" and the first line in our own code (or the first "at" line). */
export function signature(trace: string): { error: string; where: string } {
  const lines = trace.split('\n').map((l) => l.trim()).filter(Boolean);
  const error = lines.find((l) => !l.startsWith('Thread:') && !l.startsWith('at ')) ?? 'Unknown error';
  const ats = lines.filter((l) => l.startsWith('at '));
  const where = (ats.find((l) => l.includes('com.akai.')) ?? ats[0] ?? 'at ?').replace(/^at /, '');
  return { error, where };
}

export function groupCrashes(rows: CrashRow[]): CrashGroup[] {
  const groups = new Map<string, CrashGroup>();
  for (const r of rows) {
    const { error, where } = signature(r.trace);
    const key = `${error}|${where}`;
    const g = groups.get(key) ?? { error, where, count: 0, versions: [], example: `${r.model}, Android ${r.android}` };
    g.count++;
    if (r.app && !g.versions.includes(r.app)) g.versions.push(r.app);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count);
}

/** The message, or null when there is nothing to say. Kept under Telegram's 4096 characters. */
export function digestMessage(rows: CrashRow[], hours = 24): string | null {
  if (!rows.length) return null;
  const groups = groupCrashes(rows);
  const head = `AkAI keyboard: ${rows.length} crash report${rows.length === 1 ? '' : 's'} in the last ${hours} hours, ${groups.length} kind${groups.length === 1 ? '' : 's'}.`;
  const parts = groups.slice(0, 8).map((g, i) =>
    `\n${i + 1}. ${g.count}× ${g.error}\n   at ${g.where}\n   v${g.versions.sort().join(', v')} · e.g. ${g.example}`);
  let text = head + parts.join('\n');
  if (groups.length > 8) text += `\n\n…and ${groups.length - 8} more kinds.`;
  text += '\n\nDetails: npm run themes:db -- crashes';
  return text.length > 4000 ? text.slice(0, 3990) + '…' : text;
}
