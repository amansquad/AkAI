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
// keyboard's suggestion lists (KeyboardData.kt) are slotted in near the top.
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

const ranked = [...counts].filter(([, n]) => n >= MIN_COUNT).sort((a, b) => b[1] - a[1]).map(([w]) => w);
const out = [];
const seen = new Set();
const add = (w) => { if (!seen.has(w)) { seen.add(w); out.push(w); } };
for (const w of ranked) {
  add(w);
  if (out.length === 100) everyday.forEach(add);
  if (out.length >= LIMIT) break;
}

fs.writeFileSync('app/src/main/assets/words_am.txt', out.join('\n') + '\n');
console.log(`${pages} pages, ${counts.size} distinct words, ${everyday.length} everyday; wrote ${out.length}`);
