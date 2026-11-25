// Refreshes tools/data/wiktionary-en-am.tsv: every Amharic translation in the
// translation tables of English Wiktionary's English entries (CC BY-SA 4.0),
// one "english<TAB>አማርኛ" pair per line, in the order the tables give them.
// gen-dict-am.mjs builds the offline dictionary from it.
//
// Run from native_keyboard/:  node tools/fetch-wiktionary-en-am.mjs
//
// It finds the pages with a search for the "Amharic: {{t|am|…}}" line, then
// reads their wikitext 25 at a time, two seconds apart (waiting longer when
// Wiktionary asks), to stay light on it.
// If Node's fetch times out on a network without working IPv6, run it with
// NODE_OPTIONS=--no-network-family-autoselection.
import fs from 'node:fs';

const OUT = 'tools/data/wiktionary-en-am.tsv';
const API = 'https://en.wiktionary.org/w/api.php';
const HEADERS = { 'user-agent': 'AkAI-dictionary-builder/1.0' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => sleep(2000);

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: HEADERS });
      if (res.ok) return await res.json();
    } catch (error) {
      // A dropped connection: try again after a pause.
      if (attempt >= 8) throw error;
      process.stderr.write(`\n${error.cause?.code || error.message}: retrying\n`);
      await sleep(5000 * attempt);
      continue;
    }
    // Too many requests: wait as long as Wiktionary asks (or longer each time), then try again.
    if ((res.status === 429 || res.status >= 500) && attempt < 8) {
      const wait = Number(res.headers.get('retry-after')) || 15 * attempt;
      process.stderr.write(`\n${res.status}: waiting ${wait}s\n`);
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`${res.status} from Wiktionary`);
  }
}

// ─── The pages ───
const titles = [];
for (let offset = 0; offset !== undefined;) {
  const body = await api({
    action: 'query', list: 'search', srnamespace: '0', srlimit: '500', srprop: '', sroffset: String(offset),
    srsearch: 'insource:"Amharic" insource:/Amharic: \\{\\{tt?\\+?\\|am\\|/',
  });
  titles.push(...body.query.search.map((s) => s.title));
  offset = body.continue?.sroffset;
  process.stderr.write(`\r${titles.length} pages found`);
  await pause();
}
process.stderr.write('\n');

/** The English part of a page: from ==English== to the next language. A /translations page is all English. */
function englishPart(title, text) {
  if (title.endsWith('/translations')) return text;
  const start = text.search(/^==\s*English\s*==\s*$/m);
  if (start < 0) return '';
  const rest = text.slice(start + 1);
  const next = rest.search(/^==[^=].*==\s*$/m);
  return next < 0 ? rest : rest.slice(0, next);
}

// ─── Their Amharic translations ───
const pairs = [];
const T = /\{\{tt?\+?\|am\|([^|}]+)/g;
for (let i = 0; i < titles.length; i += 25) {
  const batch = titles.slice(i, i + 25);
  const body = await api({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: batch.join('|') });
  for (const page of body.query.pages) {
    const text = page.revisions?.[0]?.slots?.main?.content;
    if (!text) continue;
    const en = page.title.replace(/\/translations$/, '');
    for (const line of englishPart(page.title, text).split('\n')) {
      if (!/^\*:?\s*Amharic:/.test(line)) continue;
      for (const m of line.matchAll(T)) {
        const am = m[1].replace(/\[\[|\]\]/g, '').trim();
        if (am && !am.includes('=')) pairs.push(`${en}\t${am}`);
      }
    }
  }
  process.stderr.write(`\r${Math.min(i + 50, titles.length)} of ${titles.length} pages read`);
  await pause();
}
process.stderr.write('\n');

const unique = [...new Set(pairs)];
fs.mkdirSync('tools/data', { recursive: true });
fs.writeFileSync(OUT, unique.join('\n') + '\n');
console.log(`${titles.length} pages, ${unique.length} pairs; wrote ${OUT}`);
