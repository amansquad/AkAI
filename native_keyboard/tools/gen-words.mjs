// Builds app/src/main/assets/words_en.txt, the English word list behind swipe
// typing and auto-correct: one word per line, most common first.
//
// Source: FrequencyWords by Hermit Dave (content CC BY-SA 4.0),
// https://github.com/hermitdave/FrequencyWords - content/2018/en/en_50k.txt.
// Download that file, then run from native_keyboard/:
//   node tools/gen-words.mjs path/to/en_50k.txt
import fs from 'node:fs';

const input = process.argv[2];
if (!input) throw new Error('usage: node tools/gen-words.mjs en_50k.txt');
const LIMIT = 20000;

// The source splits contractions ("don" + "t"), so its halves are dropped and
// the whole words are added near the top instead.
const fragments = new Set(['don', 'isn', 'didn', 'doesn', 'wasn', 'couldn', 'wouldn', 'shouldn', 'aren',
  'hasn', 'weren', 'ain', 'll', 've', 're', 'mustn', 'needn', 'hadn', 'mightn', 'shan']);
const contractions = ["i'm", "don't", "it's", "that's", "you're", "can't", "i'll", "didn't", "we're",
  "won't", "i've", "let's", "he's", "what's", "there's", "they're", "doesn't", "isn't", "she's",
  "wasn't", "you've", "i'd", "we'll", "you'll", "couldn't", "wouldn't", "haven't", "aren't",
  "we've", "shouldn't", "they'll", "who's", "here's", "you'd", "he'll", "she'll", "hasn't",
  "weren't", "they've", "we'd", "he'd", "she'd", "they'd", "ain't", "where's", "how's", "it'll"];
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
  if (out.length >= LIMIT) break;
}

fs.mkdirSync('app/src/main/assets', { recursive: true });
fs.writeFileSync('app/src/main/assets/words_en.txt', out.join('\n') + '\n');
console.log(`wrote ${out.length} words`);
