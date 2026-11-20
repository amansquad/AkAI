// Input checks on the routes that cost money or store things. None of these
// reach OpenAI or the database: each request is refused before that.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as translate } from './translate/route';
import { POST as rewrite } from './rewrite/route';
import { POST as handwriting } from './handwriting-recognize/route';
import { POST as crash } from './crash/route';
import { GET as crashDigest } from './cron/crash-digest/route';

const post = (body: unknown) =>
  new NextRequest('https://x.test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const saved = { ...process.env };
beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.DATABASE_URL;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { process.env = { ...saved }; vi.restoreAllMocks(); });

describe('/api/translate', () => {
  it('needs text and both languages', async () => {
    expect((await translate(post({ text: 'hi' }))).status).toBe(400);
  });
  it('refuses text over 2000 characters', async () => {
    const res = await translate(post({ text: 'a'.repeat(2001), sourceLang: 'english', targetLang: 'amharic' }));
    expect(res.status).toBe(413);
  });
});

describe('/api/rewrite', () => {
  it('needs a known style', async () => {
    expect((await rewrite(post({ text: 'hi', style: 'pirate' }))).status).toBe(400);
  });
  it('refuses text over 1500 characters', async () => {
    expect((await rewrite(post({ text: 'a'.repeat(1501), style: 'fix' }))).status).toBe(413);
  });
  it('says so when OpenAI is not set up', async () => {
    expect((await rewrite(post({ text: 'hi', style: 'fix' }))).status).toBe(503);
  });
  it('rejects a body that is not JSON', async () => {
    expect((await rewrite(post('{oops'))).status).toBe(400);
  });
});

describe('/api/handwriting-recognize', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  it('needs an image', async () => {
    expect((await handwriting(post({ language: 'amharic' }))).status).toBe(400);
  });
  it('refuses a web address instead of a drawing', async () => {
    expect((await handwriting(post({ image: 'https://example.com/big.png' }))).status).toBe(413);
  });
  it('refuses an image over the size limit', async () => {
    expect((await handwriting(post({ image: png + 'A'.repeat(1_600_000) }))).status).toBe(413);
  });
  it('says so when OpenAI is not set up', async () => {
    expect((await handwriting(post({ image: png }))).status).toBe(503);
  });
});

describe('/api/cron/crash-digest', () => {
  it('refuses callers without the cron secret', async () => {
    process.env.CRON_SECRET = 'right';
    expect((await crashDigest(new Request('https://x.test', { headers: { authorization: 'Bearer wrong' } }))).status).toBe(401);
    delete process.env.CRON_SECRET;
    expect((await crashDigest(new Request('https://x.test', { headers: { authorization: 'Bearer ' } }))).status).toBe(401);
  });
  it('says so when alerts are not set up', async () => {
    process.env.CRON_SECRET = 'right';
    const res = await crashDigest(new Request('https://x.test', { headers: { authorization: 'Bearer right' } }));
    expect(res.status).toBe(503);
  });
});

describe('/api/crash', () => {
  it('needs a trace', async () => {
    expect((await crash(post({ app: '1.0.23' }))).status).toBe(400);
  });
  it('says so when the database is not set up', async () => {
    expect((await crash(post({ trace: 'java.lang.Foo\n\tat a.b(C.kt:1)' }))).status).toBe(503);
  });
});
