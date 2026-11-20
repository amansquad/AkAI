import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The database is replaced by a stand-in that counts like ai_usage does.
const counts = new Map<string, number>();
let failing = false;
vi.mock('./community-themes', async (importOriginal) => {
  const real = await importOriginal<typeof import('./community-themes')>();
  const db = (strings: TemplateStringsArray, ...values: unknown[]) => {
    if (failing) return Promise.reject(new Error('database down'));
    const text = strings.join('?');
    if (text.startsWith('\n      insert into ai_usage') || text.includes('insert into ai_usage')) {
      const key = `${values[0]}|${values[1]}`;
      const n = (counts.get(key) ?? 0) + 1;
      counts.set(key, n);
      return Promise.resolve([{ calls: n }]);
    }
    return Promise.resolve([]);
  };
  return { ...real, sql: () => db };
});

const { callerOf, checkAiLimit, PER_CALLER } = await import('./ai-limits');

const req = (headers: Record<string, string> = {}) => new Request('https://x.test/api/translate', { method: 'POST', headers });
const PHONE = { 'x-akai-device': '0123456789abcdef-phone' };

beforeEach(() => {
  counts.clear();
  failing = false;
  process.env.DATABASE_URL = 'postgres://test';
  delete process.env.AI_DAILY_CAP;
});
afterEach(() => { delete process.env.DATABASE_URL; });

describe('callerOf', () => {
  it('uses the phone id when there is one, hashed', () => {
    const c = callerOf(req({ ...PHONE, 'x-forwarded-for': '1.2.3.4' }));
    expect(c).toMatch(/^d:[0-9a-f]{64}$/);
    expect(c).not.toContain('0123456789abcdef');
  });
  it('falls back to the first forwarded IP, hashed', () => {
    const a = callerOf(req({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }));
    expect(a).toMatch(/^i:[0-9a-f]{64}$/);
    expect(callerOf(req({ 'x-forwarded-for': '1.2.3.4' }))).toBe(a);
  });
  it('ignores a malformed phone id', () => {
    expect(callerOf(req({ 'x-akai-device': 'short', 'x-real-ip': '5.6.7.8' }))).toMatch(/^i:/);
  });
  it('is null with nothing to go on', () => {
    expect(callerOf(req())).toBeNull();
  });
});

describe('checkAiLimit', () => {
  it('lets every call through without a database', async () => {
    delete process.env.DATABASE_URL;
    expect(await checkAiLimit(req(PHONE), 'translate')).toBeNull();
  });

  it('allows the daily allowance, then answers 429 with Retry-After', async () => {
    for (let i = 0; i < PER_CALLER.rewrite; i++) expect(await checkAiLimit(req(PHONE), 'rewrite')).toBeNull();
    const res = await checkAiLimit(req(PHONE), 'rewrite');
    expect(res?.status).toBe(429);
    expect(Number(res?.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await res?.json()).toMatchObject({ limited: true });
  });

  it('counts each feature and each phone separately', async () => {
    for (let i = 0; i < PER_CALLER.crash; i++) await checkAiLimit(req(PHONE), 'crash');
    expect((await checkAiLimit(req(PHONE), 'crash'))?.status).toBe(429);
    expect(await checkAiLimit(req(PHONE), 'translate')).toBeNull();
    expect(await checkAiLimit(req({ 'x-akai-device': 'another-phone-id-1234' }), 'crash')).toBeNull();
  });

  it('stops everyone once the overall cap is reached', async () => {
    process.env.AI_DAILY_CAP = '2';
    expect(await checkAiLimit(req({ 'x-akai-device': 'phone-aaaaaaaaaaaaaa' }), 'translate')).toBeNull();
    expect(await checkAiLimit(req({ 'x-akai-device': 'phone-bbbbbbbbbbbbbb' }), 'translate')).toBeNull();
    expect((await checkAiLimit(req({ 'x-akai-device': 'phone-cccccccccccccc' }), 'translate'))?.status).toBe(429);
  });

  it('lets calls through when the database fails', async () => {
    failing = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await checkAiLimit(req(PHONE), 'translate')).toBeNull();
  });
});
