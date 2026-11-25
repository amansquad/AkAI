// Refreshes tools/data/wiktionary-<am|ti|om>-lemmas.txt: the single-word entries
// of English Wiktionary's "Amharic lemmas" (or Tigrinya, Oromo) category
// (CC BY-SA 4.0), one per line. gen-words-am.mjs (ti, om) adds them to that
// language's word list, since Wikipedia's formal text misses many everyday words
// and verbs in their dictionary form.
//
// Run from native_keyboard/:  node tools/fetch-wiktionary-am.mjs [am|ti|om]
//
// It pages with MediaWiki's own cursor (cmcontinue): starting a page at the last
// title skips entries whose sort key differs from their spelling.
// If Node's fetch times out on a network without working IPv6, run it with
// NODE_OPTIONS=--no-network-family-autoselection.
import fs from 'node:fs';

const LANGS = {
  am: { category: 'Amharic_lemmas', word: /^[ሀ-ፚᎀ-ᎏⶀ-⷟]{2,}$/u },
  ti: { category: 'Tigrinya_lemmas', word: /^[ሀ-ፚᎀ-ᎏⶀ-⷟]{2,}$/u },
  // Qubee, lower case (no names), with ' (hudhaa) inside a word.
  om: { category: 'Oromo_lemmas', word: /^[a-z]+(?:'[a-z]+)*$/ },
};
const code = process.argv[2] || 'am';
const lang = LANGS[code];
if (!lang) throw new Error(`usage: node tools/fetch-wiktionary-am.mjs [${Object.keys(LANGS).join('|')}]`);
const OUT = `tools/data/wiktionary-${code}-lemmas.txt`;
const API = 'https://en.wiktionary.org/w/api.php?action=query&list=categorymembers'
  + `&cmtitle=Category:${lang.category}&cmnamespace=0&cmlimit=500&format=json`;
// One word only, two letters or more: no phrases, prefixes or suffixes.
const word = lang.word;

const titles = [];
let cursor;
do {
  const url = API + (cursor ? `&cmcontinue=${encodeURIComponent(cursor)}` : '');
  const res = await fetch(url, { headers: { 'user-agent': 'AkAI-wordlist-builder/1.0' } });
  if (!res.ok) throw new Error(`${res.status} from Wiktionary`);
  const body = await res.json();
  titles.push(...body.query.categorymembers.map((m) => m.title));
  cursor = body.continue?.cmcontinue;
  if (cursor) await new Promise((r) => setTimeout(r, 1000)); // stay light on Wiktionary
} while (cursor);

const words = [...new Set(titles.filter((t) => word.test(t)))];
fs.mkdirSync('tools/data', { recursive: true });
fs.writeFileSync(OUT, words.join('\n') + '\n');
console.log(`${titles.length} entries, ${words.length} single words; wrote ${OUT}`);
