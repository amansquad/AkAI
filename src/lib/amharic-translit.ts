/**
 * Phonetic Amharic input: Latin letters in, fidel out.
 *
 * This is the input method the highest-rated Amharic keyboards use — you type
 * "selam" and get ሰላም — and it sits alongside the fidel board rather than
 * replacing it. The romanisation follows SERA, the convention Keyman and
 * Google Input Tools also use, so anyone who already types Amharic on a
 * computer does not have to learn a second scheme.
 *
 * The rules, in short:
 *
 *   - A consonant on its own is the sixth order (the bare consonant sound):
 *     "s" → ስ.
 *   - A vowel after it picks the order: e u i a E (none) o
 *     → ሰ ሱ ሲ ሳ ሴ ስ ሶ. "ee" is accepted for E.
 *   - "wa" after a consonant gives the labialised form where one exists:
 *     "lwa" → ሏ.
 *   - A vowel with no consonant in front of it is the አ series: a u i A E I o
 *     → አ ኡ ኢ ኣ ኤ እ ኦ.
 *   - Digraphs cover the sounds English has no single letter for: sh ch zh
 *     gn/ny kh ts. Capitals cover the ejectives: T ጠ, C ጨ, P ጰ, S ጸ, and the
 *     archaic letters double up: hh ሐ, ss ሠ, aa ዐ, hn ኀ, tss ፀ.
 *
 * The engine converts a whole Latin run at once rather than keystroke by
 * keystroke, so the caller can re-render the current word after every key,
 * including after a backspace, without tracking any state of its own.
 */

import { AMHARIC_VOWELS } from '@/components/keyboard-data';

/** Order of the vowel forms in AMHARIC_VOWELS, which follows Unicode. */
const ORDER_AE = 0; // ä — "e"
const ORDER_U = 1; // u
const ORDER_I = 2; // i
const ORDER_A = 3; // a
const ORDER_E = 4; // e (ee)
const ORDER_SCHWA = 5; // ə — the bare consonant
const ORDER_O = 6; // o
const ORDER_WA = 7; // labialised, where the letter has one

/**
 * Latin spelling → base fidel. Matched longest-first, so "sh" wins over "s"
 * and "tss" over "ts" over "t".
 */
const CONSONANTS: Record<string, string> = {
  // Plain consonants.
  h: 'ሀ',
  l: 'ለ',
  m: 'መ',
  r: 'ረ',
  s: 'ሰ',
  q: 'ቀ',
  b: 'በ',
  v: 'ቨ',
  t: 'ተ',
  n: 'ነ',
  k: 'ከ',
  w: 'ወ',
  z: 'ዘ',
  y: 'የ',
  d: 'ደ',
  j: 'ጀ',
  g: 'ገ',
  f: 'ፈ',
  p: 'ፐ',

  // Sounds English spells with two letters. Deliberately no "gn" for ኘ:
  // it would swallow the g-then-n that words like amesegnalehu (አመሰግናለሑ)
  // are built from, and ኘ is far rarer than that sequence. Same reason
  // there is no "hn" — it would break dehna (ደህና).
  sh: 'ሸ',
  ch: 'ቸ',
  zh: 'ዠ',
  ny: 'ኘ',
  kh: 'ኸ',
  ts: 'ጸ',
  hh: 'ሐ',
  tss: 'ፀ',

  // Ejectives and the rest of the sounds, on the capitals — the keyboard
  // has a shift key, and this is what SERA uses.
  T: 'ጠ',
  C: 'ጨ',
  P: 'ጰ',
  S: 'ጸ',
  X: 'ሸ',
  N: 'ኘ',
  K: 'ኸ',
  Z: 'ዠ',
  H: 'ሐ',
};

// ሠ, ዐ and ኀ have no spelling of their own. Each shares its sound with a
// commoner letter in modern Amharic, so any spelling for them would have to
// steal a sequence that the commoner letter needs; they stay on the fidel
// board, one tap away, where there is no ambiguity to resolve.

/** Vowel spelling → order, when it follows a consonant. */
const VOWELS_AFTER_CONSONANT: Record<string, number> = {
  e: ORDER_AE,
  u: ORDER_U,
  i: ORDER_I,
  a: ORDER_A,
  E: ORDER_E,
  ee: ORDER_E,
  o: ORDER_O,
  wa: ORDER_WA,
  W: ORDER_WA,
};

/** Vowel spelling → order, when it opens a syllable (the አ series). */
const VOWELS_STANDALONE: Record<string, number> = {
  a: ORDER_AE, // አ
  u: ORDER_U, // ኡ
  i: ORDER_I, // ኢ
  A: ORDER_A, // ኣ
  E: ORDER_E, // ኤ
  I: ORDER_SCHWA, // እ
  o: ORDER_O, // ኦ
  e: ORDER_SCHWA, // እ — "e" alone is far more often ə than ä
};

const MAX_CONSONANT_LEN = Math.max(...Object.keys(CONSONANTS).map(k => k.length));
const MAX_VOWEL_LEN = Math.max(
  ...Object.keys(VOWELS_AFTER_CONSONANT).map(k => k.length),
  ...Object.keys(VOWELS_STANDALONE).map(k => k.length),
);

/**
 * The fidel for a base letter in a given order. Falls back to the next best
 * order when a letter has no form for the one asked for — only the labialised
 * eighth is ever missing.
 */
function formOf(base: string, order: number): string {
  const forms = AMHARIC_VOWELS[base];
  if (!forms) return base;
  return forms[order] ?? forms[ORDER_SCHWA] ?? forms[0] ?? base;
}

/** Longest key in `table` that `input` starts with at `at`, or null. */
function matchLongest(
  input: string,
  at: number,
  table: Record<string, unknown>,
  maxLen: number,
): string | null {
  const limit = Math.min(maxLen, input.length - at);
  for (let len = limit; len > 0; len--) {
    const candidate = input.slice(at, at + len);
    if (candidate in table) return candidate;
  }
  return null;
}

/**
 * Convert a run of Latin letters to fidel. Anything the scheme does not
 * recognise — digits, punctuation, spaces — is passed through unchanged, so a
 * caller can hand this whole words or whole sentences.
 */
export function latinToFidel(latin: string): string {
  let out = '';
  let i = 0;

  while (i < latin.length) {
    const consonant = matchLongest(latin, i, CONSONANTS, MAX_CONSONANT_LEN);

    if (consonant) {
      i += consonant.length;
      const base = CONSONANTS[consonant];
      const vowel = matchLongest(latin, i, VOWELS_AFTER_CONSONANT, MAX_VOWEL_LEN);

      if (vowel) {
        i += vowel.length;
        out += formOf(base, VOWELS_AFTER_CONSONANT[vowel]);
      } else {
        out += formOf(base, ORDER_SCHWA);
      }
      continue;
    }

    const standalone = matchLongest(latin, i, VOWELS_STANDALONE, MAX_VOWEL_LEN);
    if (standalone) {
      i += standalone.length;
      out += formOf('አ', VOWELS_STANDALONE[standalone]);
      continue;
    }

    // Not part of the scheme: a space, a digit, punctuation. Pass it through.
    out += latin[i];
    i += 1;
  }

  return out;
}

/** Characters that end a word, and so flush the Latin buffer. */
export function isWordBoundary(char: string): boolean {
  return /[\s.,!?;:'"()\[\]{}\-–—/\\፡።፣፤፥፦፧፨]/.test(char);
}

/**
 * One keystroke of phonetic input.
 *
 * The caller keeps the Latin buffer for the word being typed and the fidel it
 * last rendered for that buffer. Each keystroke returns the new buffer and the
 * new fidel, so the caller replaces the tail of the text rather than appending
 * to it — which is what makes a vowel able to change the letter already on
 * screen, and backspace able to walk back through the Latin spelling.
 */
export interface TranslitState {
  /** Latin letters typed since the last word boundary. */
  buffer: string;
  /** The fidel currently on screen for that buffer. */
  rendered: string;
}

export const EMPTY_TRANSLIT: TranslitState = { buffer: '', rendered: '' };

export interface TranslitStep {
  /** What to remove from the end of the text before appending. */
  replaceLast: number;
  /** What to append. */
  insert: string;
  /** The state to keep for the next keystroke. */
  next: TranslitState;
}

/** Feed one character to the engine. */
export function pressKey(state: TranslitState, char: string): TranslitStep {
  if (isWordBoundary(char)) {
    // The word is finished: commit it and start a fresh buffer.
    return { replaceLast: 0, insert: char, next: EMPTY_TRANSLIT };
  }

  const buffer = state.buffer + char;
  const rendered = latinToFidel(buffer);
  return {
    replaceLast: state.rendered.length,
    insert: rendered,
    next: { buffer, rendered },
  };
}

/**
 * Feed a backspace to the engine. Inside a word this walks back one Latin
 * letter, which can turn ሰ back into ስ rather than deleting it outright.
 * Outside one it reports that the caller should delete a character itself.
 */
export function pressBackspace(state: TranslitState): TranslitStep | null {
  if (!state.buffer) return null;

  const buffer = state.buffer.slice(0, -1);
  const rendered = latinToFidel(buffer);
  return {
    replaceLast: state.rendered.length,
    insert: rendered,
    next: { buffer, rendered },
  };
}
