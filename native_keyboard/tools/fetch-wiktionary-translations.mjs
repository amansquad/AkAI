// Refreshes tools/data/wiktionary-en-<code>.tsv: the translations into one of the
// keyboard's languages in the translation tables of English Wiktionary's English
// entries (CC BY-SA 4.0), one "english<TAB>translation" pair per line, in the order
// the tables give them. gen-dict.mjs builds the offline dictionary from it.
//
// Run from native_keyboard/:  node tools/fetch-wiktionary-translations.mjs <am|ti|om|so|ar> [--phrases-only]
//
// For most languages it finds the pages with a search for the "<Language>: {{t|<code>|…}}"
// line. Arabic is on over 20,000 pages, more than a search returns, so for it the
// pages of the 8,000 most common English words (words_en.txt) are read instead,
// with the "/translations" pages that hold the tables of very common words.
// Pages are read 25 at a time, two seconds apart (longer when Wiktionary asks).
// If Node's fetch times out on a network without working IPv6, run it with
// NODE_OPTIONS=--no-network-family-autoselection.
import fs from 'node:fs';

const LANGS = { am: 'Amharic', ti: 'Tigrinya', om: 'Oromo', so: 'Somali', ar: 'Arabic' };
const code = process.argv[2];
const language = LANGS[code];
if (!language) throw new Error(`usage: node tools/fetch-wiktionary-translations.mjs <${Object.keys(LANGS).join('|')}>`);
const BY_WORD_LIST = code === 'ar';
const TOP_WORDS = 8000;
/** Everyday phrases read too when going by the word list, which holds single words only. */
const PHRASES = [
  'thank you', 'thanks', 'good morning', 'good evening', 'good night', 'how are you', 'excuse me',
  "you're welcome", 'i love you', 'see you later', 'goodbye', 'happy birthday', 'congratulations',
  'welcome', 'sorry', 'please', 'of course', 'no problem', 'what is your name',
];
// --phrases-only: read just PHRASES and add their pairs to the existing file (no full re-read).
const PHRASES_ONLY = process.argv.includes('--phrases-only');

const OUT = `tools/data/wiktionary-en-${code}.tsv`;
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
let titles = [];
if (PHRASES_ONLY) {
  titles = [...PHRASES];
} else if (BY_WORD_LIST) {
  titles = fs.readFileSync('app/src/main/assets/words_en.txt', 'utf8').split('\n')
    .map((w) => w.trim()).filter((w) => /^[a-z]+$/.test(w)).slice(0, TOP_WORDS);
  titles.push(...PHRASES.filter((p) => !titles.includes(p)));
} else {
  for (let offset = 0; offset !== undefined;) {
    const body = await api({
      action: 'query', list: 'search', srnamespace: '0', srlimit: '500', srprop: '', sroffset: String(offset),
      srsearch: `insource:"${language}" insource:/${language}: \\{\\{tt?\\+?\\|${code}\\|/`,
    });
    titles.push(...body.query.search.map((s) => s.title));
    offset = body.continue?.sroffset;
    process.stderr.write(`\r${titles.length} pages found`);
    await pause();
  }
  process.stderr.write('\n');
}

/** The English part of a page: from ==English== to the next language. A /translations page is all English. */
function englishPart(title, text) {
  if (title.endsWith('/translations')) return text;
  const start = text.search(/^==\s*English\s*==\s*$/m);
  if (start < 0) return '';
  const rest = text.slice(start + 1);
  const next = rest.search(/^==[^=].*==\s*$/m);
  return next < 0 ? rest : rest.slice(0, next);
}

// ─── Their translations ───
const pairs = [];
const LINE = new RegExp(`^\\*:?\\s*${language}:`);
const T = new RegExp(`\\{\\{tt?\\+?\\|${code}\\|([^|}]+)`, 'g');
const queue = [...titles];
const seen = new Set(queue);
for (let i = 0; i < queue.length; i += 25) {
  const batch = queue.slice(i, i + 25);
  const body = await api({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: batch.join('|') });
  for (const page of body.query.pages ?? []) {
    const text = page.revisions?.[0]?.slots?.main?.content;
    if (!text) continue;
    const en = page.title.replace(/\/translations$/, '');
    const part = englishPart(page.title, text);
    // A very common word keeps its tables on a page of their own.
    if (/\{\{(see translation subpage|trans-see)/i.test(part) && !page.title.endsWith('/translations')) {
      const sub = `${page.title}/translations`;
      if (!seen.has(sub)) { seen.add(sub); queue.push(sub); }
    }
    for (const line of part.split('\n')) {
      if (!LINE.test(line)) continue;
      for (const m of line.matchAll(T)) {
        const tr = m[1].replace(/\[\[|\]\]/g, '').trim();
        if (tr && !tr.includes('=')) pairs.push(`${en}\t${tr}`);
      }
    }
  }
  process.stderr.write(`\r${Math.min(i + 25, queue.length)} of ${queue.length} pages read, ${pairs.length} pairs`);
  await pause();
}
process.stderr.write('\n');

const before = PHRASES_ONLY && fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean) : [];
const unique = [...new Set([...before, ...pairs])];
fs.mkdirSync('tools/data', { recursive: true });
fs.writeFileSync(OUT, unique.join('\n') + '\n');
console.log(`${queue.length} pages, ${unique.length} pairs; wrote ${OUT}`);
