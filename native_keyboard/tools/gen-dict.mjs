// Builds an offline word dictionary between English and one of the keyboard's
// languages, which the translate tab falls back on when the AkAI server can't be
// reached:
//   app/src/main/assets/dict_en_<code>.txt  "english<TAB>word, word"        (up to 3)
//   app/src/main/assets/dict_<code>_en.txt  "word<TAB>meaning; meaning"     (up to 3)
//
// Source: English Wiktionary (CC BY-SA 4.0, so these files are too):
//   - the translation tables on English entries, kept in tools/data/wiktionary-en-<code>.tsv
//     (node tools/fetch-wiktionary-translations.mjs <code> refreshes it)
//   - optionally, the meanings given on that language's own entries, as extracted by
//     Wiktextract: https://kaikki.org/dictionary/<Language>/kaikki.org-dictionary-<Language>.jsonl
//     (Amharic, Tigrinya, Oromo, Somali; Arabic's is too large to be worth it)
// Run from native_keyboard/:
//   node tools/gen-dict.mjs <am|ti|om|so|ar> [path/to/kaikki.org-dictionary-<Language>.jsonl]
//
// Translation tables come first for an English word (they were written for it);
// a word's own meanings come first for it.
import fs from 'node:fs';

const [code, entriesPath] = process.argv.slice(2);
const ETHIOPIC = /^[ሀ-ፚᎀ-ᎏⶀ-⷟ ]+$/;
const ARABIC = /^[ء-يٱ ]+$/;
const QUBEE = /^[a-z][a-z' -]*[a-z]$/;
const SCRIPTS = { am: ETHIOPIC, ti: ETHIOPIC, ar: ARABIC, om: QUBEE, so: QUBEE };
const script = SCRIPTS[code];
if (!script) throw new Error(`usage: node tools/gen-dict.mjs <${Object.keys(SCRIPTS).join('|')}> [kaikki.jsonl]`);
const latin = script === QUBEE;
const PAIRS = `tools/data/wiktionary-en-${code}.tsv`;
const PER_WORD = 3;
const LATIN = /^[a-z][a-z' -]*[a-z]$|^[a-z]$/;

/** A word as the dictionary keeps it: Arabic without vowel marks, Latin in lower case. */
const norm = (w) => {
  let s = (w ?? '').trim().replace(/[ً-ٰٟـ]/g, '');
  // A phrase may end in its punctuation (كيف حالك؟); the dictionary keeps the words.
  s = s.replace(/[؟?!.،,።፧]+$/, '').trim();
  if (latin) s = s.toLowerCase();
  return s;
};

/** word -> ordered, de-duplicated list. */
const enX = new Map();
const xEn = new Map();
const add = (map, key, value) => {
  if (!key || !value) return;
  const list = map.get(key) ?? [];
  if (!list.includes(value)) list.push(value);
  map.set(key, list);
};

/** A Wiktionary meaning trimmed to what fits in the translate box, or null for a cross-reference. */
function cleanGloss(g) {
  if (!g) return null;
  if (/^(alternative|obsolete|archaic|misspelling|plural|feminine|masculine|definite|inflection|romanization)\b.* (form|spelling|of)\b/i.test(g)) return null;
  if (/\bof [ሀ-ፚ]/.test(g)) return null; // "plural of ቤት" and the like
  const s = g.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim().replace(/[.;:,]+$/, '');
  if (!s || s.length > 40) return null;
  return s;
}

// ─── English entries: their translations ───
for (const line of fs.readFileSync(PAIRS, 'utf8').split('\n')) {
  const [word, raw] = line.split('\t');
  const en = word?.toLowerCase();
  const x = norm(raw);
  if (!en || !x || !LATIN.test(en) || !script.test(x) || x.split(' ').length > 3) continue;
  add(enX, en, x);
}
const pairEnglish = new Map([...enX].map(([k, v]) => [k, [...v]]));

// ─── The language's own entries: their meanings, and short ones back the other way ───
let fromEntries = 0;
if (entriesPath) {
  for (const line of fs.readFileSync(entriesPath, 'utf8').split('\n')) {
    if (!line) continue;
    const e = JSON.parse(line);
    const x = norm(e.word);
    if (!script.test(x) || e.pos === 'name' || e.pos === 'prefix' || e.pos === 'suffix') continue;
    for (const sense of e.senses ?? []) {
      const g = cleanGloss(sense.glosses?.[0]);
      if (!g) continue;
      add(xEn, x, g);
      // "house" -> ቤት; "to come" -> መጣ (a verb's English starts with "to").
      const en = g.toLowerCase().replace(/^to /, '');
      if (LATIN.test(en) && en.split(' ').length <= 3) add(enX, en, x);
    }
  }
  fromEntries = xEn.size;
}

// A word in a translation table, without an entry (or meaning) of its own, means that English word.
for (const [en, xs] of pairEnglish) for (const x of xs) add(xEn, x, en);

// Translation tables sometimes hold a rare or misspelt form first (ኣመሰገናልሎ for
// "thank you"), so words the language's word list knows come first, most common first;
// the order is otherwise kept (sort is stable).
const rank = new Map(fs.readFileSync(`app/src/main/assets/words_${code}.txt`, 'utf8').split('\n').map((w, i) => [w.trim(), i]));
for (const [en, xs] of enX) enX.set(en, [...xs].sort((a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity)));

const write = (file, map, sep) => {
  const lines = [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}\t${v.slice(0, PER_WORD).join(sep)}`);
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return lines.length;
};
const nEnX = write(`app/src/main/assets/dict_en_${code}.txt`, enX, ', ');
const nXEn = write(`app/src/main/assets/dict_${code}_en.txt`, xEn, '; ');
console.log(`dict_en_${code}.txt: ${nEnX} English words; dict_${code}_en.txt: ${nXEn} words (${fromEntries} from ${code} entries)`);
