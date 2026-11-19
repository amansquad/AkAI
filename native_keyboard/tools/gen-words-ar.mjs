// Builds app/src/main/assets/words_ar.txt, the Arabic word list behind
// completions: one word per line, most common first.
//
// Source: FrequencyWords by Hermit Dave (content CC BY-SA 4.0),
// https://github.com/hermitdave/FrequencyWords - content/2018/ar/ar_50k.txt,
// which is counted from film and TV subtitles, so it is everyday speech.
// Download that file, then run from native_keyboard/:
//   node tools/gen-words-ar.mjs path/to/ar_50k.txt
//
// Words are kept without vowel marks (harakat), the way people type them, and
// the starter words from ArabicData.kt are slotted near the top. The list is
// not filtered for rude words: have a native speaker review it.
import fs from 'node:fs';

const input = process.argv[2];
if (!input) throw new Error('usage: node tools/gen-words-ar.mjs ar_50k.txt');
const LIMIT = 20000;

// Arabic letters only (hamza forms, alef variants, ta marbuta, alef maksura, ya); no marks, digits or Latin.
const letters = /^[ء-ي]+$/;
const marks = /[ً-ٰٟـ]/g;
const word = /[ء-ي]+/g;

const everyday = [];
const ad = fs.readFileSync('app/src/main/java/com/akai/nativekb/ArabicData.kt', 'utf8');
for (const w of ad.match(word) ?? []) if (w.length > 1 && !everyday.includes(w)) everyday.push(w);

const out = [];
const seen = new Set();
const add = (w) => { if (!seen.has(w)) { seen.add(w); out.push(w); } };
for (const line of fs.readFileSync(input, 'utf8').split(/\r?\n/)) {
  const w = line.split(' ')[0]?.replace(marks, '');
  if (!w || w.length < 2 || !letters.test(w)) continue;
  add(w);
  if (out.length === 100) everyday.forEach(add);
  if (out.length >= LIMIT) break;
}

fs.writeFileSync('app/src/main/assets/words_ar.txt', out.join('\n') + '\n');
console.log(`${everyday.length} everyday; wrote ${out.length}`);
