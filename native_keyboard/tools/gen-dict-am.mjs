// Builds the offline English↔Amharic word dictionary the translate tab falls
// back on when the AkAI server can't be reached:
//   app/src/main/assets/dict_en_am.txt  "english<TAB>አማርኛ, አማርኛ"   (up to 3)
//   app/src/main/assets/dict_am_en.txt  "አማርኛ<TAB>meaning; meaning"  (up to 3)
//
// Source: English Wiktionary (CC BY-SA 4.0, so these files are too):
//   - the Amharic translation tables on English entries, kept in
//     tools/data/wiktionary-en-am.tsv (node tools/fetch-wiktionary-en-am.mjs refreshes it)
//   - the meanings given on Amharic entries, as extracted by Wiktextract:
//     https://kaikki.org/dictionary/Amharic/kaikki.org-dictionary-Amharic.jsonl
// Download that file, then run from native_keyboard/:
//   node tools/gen-dict-am.mjs path/to/kaikki.org-dictionary-Amharic.jsonl
//
// Translation tables come first for an English word (they were written for it);
// an Amharic word's own meanings come first for it.
import fs from 'node:fs';

const amharicPath = process.argv[2];
if (!amharicPath) throw new Error('usage: node tools/gen-dict-am.mjs kaikki.org-dictionary-Amharic.jsonl');
const PAIRS = 'tools/data/wiktionary-en-am.tsv';
const PER_WORD = 3;
const ETHIOPIC = /^[ሀ-ፚᎀ-ᎏⶀ-⷟ ]+$/;
const LATIN = /^[a-z][a-z' -]*[a-z]$|^[a-z]$/;

/** word -> ordered, de-duplicated list. */
const enAm = new Map();
const amEn = new Map();
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
  let s = g.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim().replace(/[.;:,]+$/, '');
  if (!s || s.length > 40) return null;
  return s;
}

// ─── English entries: their Amharic translations ───
for (const line of fs.readFileSync(PAIRS, 'utf8').split('\n')) {
  const [word, am] = line.split('\t');
  const en = word?.toLowerCase();
  if (!en || !am || !LATIN.test(en) || !ETHIOPIC.test(am) || am.split(' ').length > 3) continue;
  add(enAm, en, am);
}
const pairEnglish = new Map([...enAm].map(([k, v]) => [k, [...v]]));

// ─── Amharic entries: their meanings, and short ones back the other way ───
for (const line of fs.readFileSync(amharicPath, 'utf8').split('\n')) {
  if (!line) continue;
  const e = JSON.parse(line);
  if (!ETHIOPIC.test(e.word) || e.pos === 'name' || e.pos === 'prefix' || e.pos === 'suffix') continue;
  for (const sense of e.senses ?? []) {
    const g = cleanGloss(sense.glosses?.[0]);
    if (!g) continue;
    add(amEn, e.word, g);
    // "house" -> ቤት; "to come" -> መጣ (a verb's English starts with "to").
    const en = g.toLowerCase().replace(/^to /, '');
    if (LATIN.test(en) && en.split(' ').length <= 3) add(enAm, en, e.word);
  }
}
const fromAmharic = amEn.size;

// An Amharic word in a translation table, without an entry (or meaning) of its own, means that English word.
for (const [en, ams] of pairEnglish) for (const am of ams) add(amEn, am, en);

// Translation tables sometimes hold a rare or misspelt form first (ኣመሰገናልሎ for
// "thank you"), so Amharic words the word list knows come first, most common first;
// the order is otherwise kept (sort is stable).
const amRank = new Map(fs.readFileSync('app/src/main/assets/words_am.txt', 'utf8').split('\n').map((w, i) => [w.trim(), i]));
for (const [en, ams] of enAm) enAm.set(en, [...ams].sort((a, b) => (amRank.get(a) ?? Infinity) - (amRank.get(b) ?? Infinity)));

const write = (file, map) => {
  const lines = [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}\t${v.slice(0, PER_WORD).join(file.includes('en_am') ? ', ' : '; ')}`);
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return lines.length;
};
const nEnAm = write('app/src/main/assets/dict_en_am.txt', enAm);
const nAmEn = write('app/src/main/assets/dict_am_en.txt', amEn);
console.log(`dict_en_am.txt: ${nEnAm} English words; dict_am_en.txt: ${nAmEn} Amharic words (${fromAmharic} from Amharic entries)`);
