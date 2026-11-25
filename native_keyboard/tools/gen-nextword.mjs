// Builds app/src/main/assets/nextword_<lang>.txt, a next-word table for English,
// Tigrinya, Oromo, Somali or Arabic, like nextword_am.txt (gen-nextword-am.mjs):
// one line per word, "word<TAB>next1 next2 next3", the words that most often
// follow it. The keyboard offers them after a finished word and a space, after
// the user's own habits (which always come first).
//
// Source: that language's Wikipedia (CC BY-SA 4.0, so these files are too), from
// https://dumps.wikimedia.org/<code>wiki/latest/<code>wiki-latest-pages-articles.xml.bz2
// For English, Simple English Wikipedia (simplewiki), whose plainer sentences suit
// typing better. Arabic's and Simple English's dumps are large, so the start of the
// file is enough: curl -r 0-149999999 <url> | bunzip2 > ar.xml (bunzip2 complains
// at the cut; what came before is fine).
// Then run from native_keyboard/:
//   node tools/gen-nextword.mjs <en|ti|om|so|ar> path/to/<code>wiki-latest-pages-articles.xml
//
// Only words in that language's word list (words_<lang>.txt) are used, on both
// sides, so the table never suggests a rare or misspelt word. Pairs never cross a
// sentence end.
import fs from 'node:fs';

const [lang, input] = process.argv.slice(2);
const ETHIOPIC = /^[ሀ-ፚᎀ-ᎏⶀ-⷟]{2,}$/;
const LATIN = /^[a-z]+(?:'[a-z]+)*$/;
const LANGS = {
  en: { letters: LATIN, lower: true, minPair: 5 },
  ti: { letters: ETHIOPIC, lower: false, minPair: 3 },
  om: { letters: LATIN, lower: true, minPair: 3 },
  so: { letters: LATIN, lower: true, minPair: 3 },
  // Vowel marks and the tatweel are stripped before matching.
  ar: { letters: /^[ء-ي]{2,}$/, lower: false, minPair: 4 },
};
const cfg = LANGS[lang];
if (!cfg || !input) throw new Error(`usage: node tools/gen-nextword.mjs <${Object.keys(LANGS).join('|')}> wiki.xml`);
const PER_WORD = 3;      // suggestions kept per word
const MAX_WORDS = 9000;  // words that get a line (the most common ones)

const vocab = fs.readFileSync(`app/src/main/assets/words_${lang}.txt`, 'utf8').split('\n').map((w) => w.trim()).filter(Boolean);
const rank = new Map(vocab.map((w, i) => [w, i]));
const pairs = new Map(); // prev -> Map(next -> count)

function page(t) {
  if (/^#(REDIRECT|تحويل|መምሪያ|ማዘዋወሪያ)/i.test(t)) return;
  t = t
    .replace(/&lt;ref[\s\S]*?(\/&gt;|&lt;\/ref&gt;)/g, ' ')
    .replace(/\{\|[\s\S]*?\|\}/g, ' ')
    .replace(/\[\[(?:[^\]|]*:)[^\]]*\]\]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[\[\]|=*#]/g, ' ')
    .replace(/[ً-ٰٟـ]/g, '');
  if (cfg.lower) t = t.toLowerCase();
  // A sentence ends at . ! ? (and ። ፧ ؟) or a line break; a comma or other mark also ends a chain.
  for (const chunk of t.split(/[.!?\n,;:()"“”«»–—።፧፣፤፡؟،؛]+/)) {
    let prev = null;
    for (const raw of chunk.split(/\s+/)) {
      const w = raw.replace(/^'+|'+$/g, '');
      if (!w) continue;
      if (!cfg.letters.test(w) || !rank.has(w)) { prev = null; continue; }
      if (prev) {
        let m2 = pairs.get(prev);
        if (!m2) pairs.set(prev, (m2 = new Map()));
        m2.set(w, (m2.get(w) ?? 0) + 1);
      }
      prev = w;
    }
  }
}

// Streamed, so a large dump needn't fit in memory: each <text>…</text> is one page.
let pages = 0;
let buf = '';
for await (const chunk of fs.createReadStream(input, { encoding: 'utf8', highWaterMark: 1 << 20 })) {
  buf += chunk;
  let end;
  while ((end = buf.indexOf('</text>')) >= 0) {
    const start = buf.lastIndexOf('<text', end);
    if (start >= 0) { page(buf.slice(buf.indexOf('>', start) + 1, end)); pages++; }
    buf = buf.slice(end + 7);
  }
  if (buf.length > 50_000_000) buf = buf.slice(-1_000_000); // a runaway page
}

const lines = [];
for (const [prev, nexts] of [...pairs].sort((a, b) => rank.get(a[0]) - rank.get(b[0]))) {
  if (lines.length >= MAX_WORDS) break;
  const top = [...nexts].filter(([w, c]) => c >= cfg.minPair && w !== prev)
    .sort((a, b) => b[1] - a[1] || rank.get(a[0]) - rank.get(b[0]))
    .slice(0, PER_WORD).map(([w]) => w);
  if (top.length) lines.push(`${prev}\t${top.join(' ')}`);
}
fs.writeFileSync(`app/src/main/assets/nextword_${lang}.txt`, lines.join('\n') + '\n');
console.log(`${pages} pages; wrote ${lines.length} words to nextword_${lang}.txt`);
