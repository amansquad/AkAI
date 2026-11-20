// Builds app/src/main/assets/words_am.txt, the Amharic word list behind
// Amharic swipe typing, completions and corrections: one word per line, most
// common first.
//
// Source: the text of Amharic Wikipedia (CC BY-SA 4.0), from
// https://dumps.wikimedia.org/amwiki/latest/amwiki-latest-pages-articles.xml.bz2
// Download and unpack that file, then run from native_keyboard/:
//   node tools/gen-words-am.mjs path/to/amwiki-latest-pages-articles.xml
//
// Wikipedia is written formally, so the everyday words from the web
// keyboard's suggestion lists (KeyboardData.kt) are slotted in near the top,
// and every single-word entry of English Wiktionary's Amharic lemmas
// (CC BY-SA 4.0, tools/data/wiktionary-am-lemmas.txt, refreshed by
// tools/fetch-wiktionary-am.mjs) is kept: one already ranked keeps its place, the
// rest go at the end, most frequent in Wikipedia first, in place of the rarest
// Wikipedia-only words.
import fs from 'node:fs';

const input = process.argv[2];
if (!input) throw new Error('usage: node tools/gen-words-am.mjs amwiki-latest-pages-articles.xml');
const LIMIT = 20000;
const MIN_COUNT = 4;

// Ethiopic letters only: not its punctuation (U+1360-1368) or numerals (U+1369-137C).
const word = /[ሀ-ፚᎀ-ᎏⶀ-⷟]{2,}/g;

const xml = fs.readFileSync(input, 'utf8');
const counts = new Map();
let pages = 0;
for (const m of xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)) {
  let t = m[1];
  if (/^#(REDIRECT|መምሪያ|ማዘዋወሪያ)/i.test(t)) continue;
  pages++;
  t = t
    .replace(/&lt;ref[\s\S]*?(\/&gt;|&lt;\/ref&gt;)/g, ' ') // references
    .replace(/\{\|[\s\S]*?\|\}/g, ' ') // tables
    .replace(/\[\[(?:[^\]|]*:)[^\]]*\]\]/g, ' ') // files, categories, other wikis
    .replace(/https?:\/\/\S+/g, ' ');
  for (const w of t.match(word) ?? []) counts.set(w, (counts.get(w) ?? 0) + 1);
}

// Everyday words from the keyboard's own lists.
const kd = fs.readFileSync('app/src/main/java/com/akai/nativekb/KeyboardData.kt', 'utf8');
const everyday = [];
for (const name of ['suggestionsAm', 'nextWordAm']) {
  const start = kd.indexOf(`val ${name}`);
  const end = kd.indexOf('\n    val ', start + 1);
  for (const w of kd.slice(start, end).match(word) ?? []) if (!everyday.includes(w)) everyday.push(w);
}

// Dictionary headwords from Wiktionary.
const lemmas = fs.readFileSync('tools/data/wiktionary-am-lemmas.txt', 'utf8').split('\n').filter((w) => w.match(word)?.[0] === w);

const ranked = [...counts].filter(([, n]) => n >= MIN_COUNT).sort((a, b) => b[1] - a[1]).map(([w]) => w);
const out = [];
const seen = new Set();
const add = (w) => { if (!seen.has(w)) { seen.add(w); out.push(w); } };
for (const w of ranked) {
  add(w);
  if (out.length === 100) everyday.forEach(add);
}
// The lemmas not ranked, most frequent in Wikipedia first (stable for ties).
const unranked = lemmas.filter((w) => !seen.has(w)).sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
unranked.forEach(add);
// Back to LIMIT by dropping the rarest words that are neither everyday nor lemmas.
const keep = new Set([...everyday, ...lemmas]);
let drop = out.length - LIMIT;
for (let i = out.length - 1; drop > 0 && i >= 0; i--) if (!keep.has(out[i])) { out.splice(i, 1); drop--; }

fs.writeFileSync('app/src/main/assets/words_am.txt', out.join('\n') + '\n');
console.log(`${pages} pages, ${counts.size} distinct words, ${everyday.length} everyday, ${lemmas.length} lemmas (${unranked.length} unranked); wrote ${out.length}`);
