// Builds app/src/main/assets/words_so.txt, the Somali word list
// behind Somali completions and the spell checker: one word per line, most
// common first.
//
// Source: the text of Somali Wikipedia (CC BY-SA 4.0), from
// https://dumps.wikimedia.org/sowiki/latest/sowiki-latest-pages-articles.xml.bz2
// Download and unpack that file, then run from native_keyboard/:
//   node tools/gen-words-so.mjs path/to/sowiki-latest-pages-articles.xml
//
// Somali and English are both Latin, and Wikipedia pages mix them, so words that
// are common English words (words_en.txt) are left out unless Somali uses them
// very often (in, ma): the wiki's own text has them far more often than English quotes do. The everyday words from
// SomaliData.kt are slotted in near the top.
import fs from 'node:fs';

const input = process.argv[2];
if (!input) throw new Error('usage: node tools/gen-words-so.mjs sowiki-latest-pages-articles.xml');
const LIMIT = 20000;
const MIN_COUNT = 8;

// Latin letters, with ' (the letter ayn) inside a word: sa'ad, ba'an.
const word = /[a-z]+(?:'[a-z]+)*/g;

const xml = fs.readFileSync(input, 'utf8');
const counts = new Map();
let pages = 0;
for (const page of xml.matchAll(/<page>([\s\S]*?)<\/page>/g)) {
  // Articles only: not templates, modules (code), categories or talk pages.
  if (!/<ns>0<\/ns>/.test(page[1])) continue;
  const m = page[1].match(/<text[^>]*>([\s\S]*?)<\/text>/);
  if (!m) continue;
  let t = m[1];
  if (/^#(REDIRECT|WAREEJIN)/i.test(t)) continue;
  pages++;
  for (let i = 0; i < 6; i++) t = t.replace(/\{\{[^{}]*\}\}/g, ' ');
  t = t
    .replace(/&lt;ref[\s\S]*?(\/&gt;|&lt;\/ref&gt;)/g, ' ')
    .replace(/&lt;[^&]*?&gt;/g, ' ')
    .replace(/\{\|[\s\S]*?\|\}/g, ' ')
    .replace(/\[\[(?:[^\]|]*:)[^\]]*\]\]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[’‘`]/g, "'")
    .toLowerCase();
  for (const w of t.match(word) ?? []) counts.set(w, (counts.get(w) ?? 0) + 1);
}

// Common English words, which the Somali text mostly has as quotations and names.
const english = new Set(
  fs.readFileSync('app/src/main/assets/words_en.txt', 'utf8').split('\n').slice(0, 8000).map((w) => w.trim()),
);

const everyday = [];
const od = fs.readFileSync('app/src/main/java/com/akai/nativekb/SomaliData.kt', 'utf8');
for (const w of od.match(word) ?? []) if (w.length > 1 && !everyday.includes(w)) everyday.push(w);

const ranked = [...counts]
  .filter(([w, n]) => n >= MIN_COUNT && w.length >= 2 && /[aeiou]/.test(w) && (n >= 200 || !english.has(w)))
  .sort((a, b) => b[1] - a[1])
  .map(([w]) => w);
const out = [];
const seen = new Set();
const add = (w) => { if (!seen.has(w)) { seen.add(w); out.push(w); } };
for (const w of ranked) {
  add(w);
  if (out.length === 100) everyday.forEach(add);
  if (out.length >= LIMIT) break;
}

fs.writeFileSync('app/src/main/assets/words_so.txt', out.join('\n') + '\n');
console.log(`${pages} pages, ${counts.size} distinct words, ${everyday.length} everyday; wrote ${out.length}`);
