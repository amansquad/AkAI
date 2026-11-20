// Refreshes tools/data/wiktionary-am-lemmas.txt: the single-word entries of
// English Wiktionary's "Amharic lemmas" category (CC BY-SA 4.0), one per line.
// gen-words-am.mjs adds them to the Amharic word list, since Wikipedia's formal
// text misses many everyday words and verbs in their dictionary form.
//
// Run from native_keyboard/:  node tools/fetch-wiktionary-am.mjs
//
// It pages with MediaWiki's own cursor (cmcontinue): starting a page at the last
// title skips entries whose sort key differs from their spelling.
// If Node's fetch times out on a network without working IPv6, run it with
// NODE_OPTIONS=--no-network-family-autoselection.
import fs from 'node:fs';

const OUT = 'tools/data/wiktionary-am-lemmas.txt';
const API = 'https://en.wiktionary.org/w/api.php?action=query&list=categorymembers'
  + '&cmtitle=Category:Amharic_lemmas&cmnamespace=0&cmlimit=500&format=json';
// Ethiopic letters only, two or more: no phrases, prefixes or suffixes.
const word = /^[ሀ-ፚᎀ-ᎏⶀ-⷟]{2,}$/u;

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
