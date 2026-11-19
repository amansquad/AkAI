// Builds app/src/main/assets/words_en.txt, the English word list behind swipe
// typing and auto-correct: one word per line, most common first.
//
// Source: FrequencyWords by Hermit Dave (content CC BY-SA 4.0),
// https://github.com/hermitdave/FrequencyWords - content/2018/en/en_50k.txt.
// Download that file, then run from native_keyboard/:
//   node tools/gen-words.mjs path/to/en_50k.txt
import fs from 'node:fs';
import { contractions, moreContractions, slang } from './words-extra.mjs';

const input = process.argv[2];
if (!input) throw new Error('usage: node tools/gen-words.mjs en_50k.txt');
const LIMIT = 20000;

// The source splits contractions ("don" + "t"), so its halves are dropped and
// the whole words are added near the top instead.
const fragments = new Set(['don', 'isn', 'didn', 'doesn', 'wasn', 'couldn', 'wouldn', 'shouldn', 'aren',
  'hasn', 'weren', 'ain', 'll', 've', 're', 'mustn', 'needn', 'hadn', 'mightn', 'shan']);
// Never offered while swiping or suggested as a correction.
const blocked = /^(fuck|shit|bitch|cunt|cock|dick|pussy|nigg|fag|whore|slut|bastard|asshole|motherf|retard|twat|wank|prick|ass$|asses$|damn)/;

const out = [];
const seen = new Set();
const add = (w) => { if (!seen.has(w)) { seen.add(w); out.push(w); } };

for (const line of fs.readFileSync(input, 'utf8').split(/\r?\n/)) {
  const w = line.split(' ')[0];
  if (!w || !/^[a-z]+$/.test(w)) continue;
  if (w.length === 1 && w !== 'a' && w !== 'i') continue;
  if (fragments.has(w) || blocked.test(w)) continue;
  add(w);
  // Slot the contractions in among the most common words.
  if (out.length === 60) contractions.forEach(add);
  if (out.length === 400) moreContractions.forEach(add);
  if (out.length === 4000) slang.filter((w) => w.length > 1).forEach(add);
  if (out.length >= LIMIT) break;
}

fs.mkdirSync('app/src/main/assets', { recursive: true });
fs.writeFileSync('app/src/main/assets/words_en.txt', out.join('\n') + '\n');
console.log(`wrote ${out.length} words`);
