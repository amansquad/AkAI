// Builds app/src/main/assets/nextword_am.txt, the Amharic next-word table:
// one line per word, "word<TAB>next1 next2 next3", the words that most often
// follow it. The keyboard offers them as soon as a word is finished and a space
// is typed, before the user's own habits (which always come first).
//
// Source: the text of Amharic Wikipedia (CC BY-SA 4.0, so this file is too), the
// same dump as words_am.txt:
// https://dumps.wikimedia.org/amwiki/latest/amwiki-latest-pages-articles.xml.bz2
// Download and unpack it, then run from native_keyboard/:
//   node tools/gen-nextword-am.mjs path/to/amwiki-latest-pages-articles.xml
//
// Only words in words_am.txt are used, on both sides, so the table never
// suggests a rare or misspelt word. Pairs never cross a sentence end.
import fs from 'node:fs';

const input = process.argv[2];
if (!input) throw new Error('usage: node tools/gen-nextword-am.mjs amwiki-latest-pages-articles.xml');
const MIN_PAIR = 4;      // a pair must be seen this often
const PER_WORD = 3;      // suggestions kept per word
const MAX_WORDS = 9000;  // words that get a line (the most common ones)

const vocab = fs.readFileSync('app/src/main/assets/words_am.txt', 'utf8').split('\n').filter(Boolean);
const rank = new Map(vocab.map((w, i) => [w, i]));
const letters = /^[ሀ-ፚᎀ-ᎏⶀ-⷟]{2,}$/;

const xml = fs.readFileSync(input, 'utf8');
const pairs = new Map(); // prev -> Map(next -> count)
for (const m of xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)) {
  let t = m[1];
  if (/^#(REDIRECT|መምሪያ|ማዘዋወሪያ)/i.test(t)) continue;
  t = t
    .replace(/&lt;ref[\s\S]*?(\/&gt;|&lt;\/ref&gt;)/g, ' ')
    .replace(/\{\|[\s\S]*?\|\}/g, ' ')
    .replace(/\[\[(?:[^\]|]*:)[^\]]*\]\]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/[\[\]'|=*#]/g, ' ');
  // A sentence ends at ። ፧ ! ? or a line break; a comma (፣) or other mark also ends a chain.
  for (const chunk of t.split(/[።፧!?\n፣፤፡;:,()"“”«»–—]+/)) {
    let prev = null;
    for (const raw of chunk.split(/\s+/)) {
      if (!raw) continue;
      if (!letters.test(raw) || !rank.has(raw)) { prev = null; continue; }
      if (prev) {
        let m2 = pairs.get(prev);
        if (!m2) pairs.set(prev, (m2 = new Map()));
        m2.set(raw, (m2.get(raw) ?? 0) + 1);
      }
      prev = raw;
    }
  }
}

const lines = [];
for (const [prev, nexts] of [...pairs].sort((a, b) => rank.get(a[0]) - rank.get(b[0]))) {
  if (lines.length >= MAX_WORDS) break;
  const top = [...nexts].filter(([w, c]) => c >= MIN_PAIR && w !== prev)
    .sort((a, b) => b[1] - a[1] || rank.get(a[0]) - rank.get(b[0]))
    .slice(0, PER_WORD).map(([w]) => w);
  if (top.length) lines.push(`${prev}\t${top.join(' ')}`);
}
fs.writeFileSync('app/src/main/assets/nextword_am.txt', lines.join('\n') + '\n');
console.log(`wrote ${lines.length} words`);
