/**
 * The keyboard's user preferences and their defaults, in one place so the
 * keyboard, the settings panel and "Reset to defaults" all agree on them.
 */

export interface KeyboardPrefs {
  // Layout
  /** Height of one key row, in px. The rest of the keyboard scales with it. */
  keyHeight: number;
  /** Gap between keys, in px. Rows are spaced at twice this. */
  keyGap: number;
  /** Key label size, in px. */
  keyTextSize: number;
  oneHandedMode: 'off' | 'left' | 'right';
  /** How much of the width the keyboard takes in one-handed mode, in %. */
  oneHandedWidth: number;
  desktopView: boolean;
  /** English key layout: QWERTY, Dvorak, AZERTY, Colemak, or QWERTZ. */
  englishLayout: 'qwerty' | 'dvorak' | 'azerty' | 'colemak' | 'qwertz';
  /** Amharic fidel layout: traditional Ge'ez order, frequency-based, or phonetic. */
  amharicLayout: 'traditional' | 'frequency' | 'phonetic';

  // What is shown
  showSuggestionBar: boolean;
  showWordOfTheDay: boolean;
  showNumberRow: boolean;
  showKeyHints: boolean;
  showMicKey: boolean;
  toolbarStyle: 'active' | 'all' | 'icons';
  /** Toolbar buttons that can be hidden. Keyboard and Settings always show. */
  visibleButtons: Record<string, boolean>;
  /** Show a row of arrow keys above the control row for cursor movement. */
  showCursorRow: boolean;

  // Key appearance
  /** Key corner radius, in px. 0 is square. */
  keyRadius: number;
  /** Key label weight, 100 (thin) to 900 (black). */
  keyWeight: number;
  showKeyBorders: boolean;

  // Typing
  autoCapitalization: boolean;
  doubleSpacePeriod: boolean;
  autoSpaceAfterPunctuation: boolean;
  keyPopupOnLongPress: boolean;
  /** How long a key is held before its popup opens, in ms. */
  longPressDelay: number;
  /** Swipe left/right on the spacebar to move the cursor. */
  spacebarCursorControl: boolean;

  // Feedback
  vibrateOnKeyPress: boolean;
  /** 1 (barely there) to 5 (strongest). */
  hapticLevel: number;
  soundOnKeyPress: boolean;
  /** 0 to 100. */
  soundVolume: number;
  keyAnimations: boolean;
}

export const DEFAULT_PREFS: KeyboardPrefs = {
  keyHeight: 36,
  keyGap: 2,
  keyTextSize: 14,
  oneHandedMode: 'off',
  oneHandedWidth: 72,
  desktopView: false,
  englishLayout: 'qwerty',
  amharicLayout: 'traditional',

  showSuggestionBar: true,
  showWordOfTheDay: true,
  showNumberRow: true,
  showKeyHints: true,
  showMicKey: true,
  toolbarStyle: 'active',
  visibleButtons: {
    stickers: true,
    gifs: true,
    clipboard: true,
    translate: true,
    handwriting: true,
    themes: true,
  },
  showCursorRow: false,

  keyRadius: 8,
  keyWeight: 500,
  showKeyBorders: true,

  autoCapitalization: true,
  doubleSpacePeriod: true,
  autoSpaceAfterPunctuation: true,
  keyPopupOnLongPress: true,
  longPressDelay: 300,
  spacebarCursorControl: false,

  vibrateOnKeyPress: true,
  hapticLevel: 3,
  soundOnKeyPress: false,
  soundVolume: 50,
  keyAnimations: true,
};

/**
 * Vibration length per strength level, for the browser fallback. The
 * keyboard service on Android uses its own table, which also varies the
 * amplitude where the hardware supports it. Index 0 is unused.
 */
export const HAPTIC_MS = [0, 8, 12, 18, 26, 36];

/**
 * The allowed range of every numeric setting. The settings screen uses these
 * for its sliders and its typed input; stored values are clamped to them.
 */
export const NUMBER_LIMITS = {
  keyHeight: { min: 24, max: 96, step: 1, unit: 'px' },
  keyGap: { min: 0, max: 16, step: 1, unit: 'px' },
  keyTextSize: { min: 8, max: 28, step: 1, unit: 'px' },
  keyRadius: { min: 0, max: 28, step: 1, unit: 'px' },
  keyWeight: { min: 100, max: 900, step: 50, unit: '' },
  longPressDelay: { min: 100, max: 1000, step: 10, unit: 'ms' },
  oneHandedWidth: { min: 50, max: 95, step: 1, unit: '%' },
} as const;

export type NumericPref = keyof typeof NUMBER_LIMITS;

export function clampPref(key: NumericPref, value: number): number {
  const { min, max } = NUMBER_LIMITS[key];
  if (!Number.isFinite(value)) return DEFAULT_PREFS[key];
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * These settings used to be a choice of three words and are now numbers.
 * Saved settings from before still hold the words, so each maps to the
 * number it meant.
 */
const LEGACY_WORDS: Record<NumericPref, Record<string, number>> = {
  keyHeight: { compact: 32, normal: 36, tall: 44 },
  keyGap: { compact: 1, normal: 2, spacious: 6 },
  keyTextSize: { small: 12, medium: 14, large: 16 },
  keyRadius: { square: 4, rounded: 8, pill: 16 },
  keyWeight: { light: 300, normal: 500, bold: 700 },
  longPressDelay: { short: 200, normal: 300, long: 500 },
  oneHandedWidth: {},
};

/** A saved value, number or old word, as a valid number; the default if it is neither. */
export function readNumericPref(key: NumericPref, saved: unknown): number {
  if (typeof saved === 'number') return clampPref(key, saved);
  if (typeof saved === 'string' && saved in LEGACY_WORDS[key]) return LEGACY_WORDS[key][saved];
  return DEFAULT_PREFS[key];
}

/**
 * The numeric settings as CSS variables on the keyboard's root. Keys, rows
 * and panels size themselves from these, so any value works rather than one
 * of a few prepared classes.
 */
export function keyboardCssVars(p: Pick<KeyboardPrefs, 'keyHeight' | 'keyGap' | 'keyTextSize' | 'keyRadius' | 'keyWeight'>): Record<string, string> {
  // The panels (stickers, GIFs, AI, drawing, settings) are about as tall as
  // the typing area, which is five key rows, so they follow the key height.
  const panel = Math.max(160, 240 + (p.keyHeight - 36) * 6);
  return {
    '--key-h': `${p.keyHeight}px`,
    '--key-gap': `${p.keyGap}px`,
    '--key-row-gap': `${p.keyGap * 2}px`,
    '--key-text': `${p.keyTextSize}px`,
    '--key-radius': `${p.keyRadius}px`,
    '--key-weight': String(p.keyWeight),
    '--panel-h': `${panel}px`,
    '--panel-h-tr': `${panel + 60}px`,
    '--panel-h-xl': `${panel + 80}px`,
  };
}

// Class names for the variables above. They are written out in full so
// Tailwind sees them.
export const KEY_TEXT_CLASS = 'text-[length:var(--key-text)]';
export const KEY_GAP_CLASS = 'gap-[var(--key-gap)]';
export const ROW_GAP_CLASS = 'gap-[var(--key-row-gap)]';
export const KEY_SHAPE_CLASS = 'rounded-[var(--key-radius)]';
export const KEY_FONT_CLASS = 'font-[number:var(--key-weight)]';
export const KEY_HEIGHT_CLASS = 'h-[var(--key-h)]';
export const PANEL_HEIGHT_CLASS = 'h-[var(--panel-h)]';
export const PANEL_HEIGHT_TALL_CLASS = 'h-[var(--panel-h-tr)]';
export const PANEL_HEIGHT_XL_CLASS = 'h-[var(--panel-h-xl)]';
