/**
 * The keyboard's user preferences and their defaults, in one place so the
 * keyboard, the settings panel and "Reset to defaults" all agree on them.
 */

export interface KeyboardPrefs {
  // Layout
  keyboardHeight: 'compact' | 'normal' | 'tall';
  keyboardSpacing: 'compact' | 'normal' | 'spacious';
  keyTextSize: 'small' | 'medium' | 'large';
  oneHandedMode: 'off' | 'left' | 'right';
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
  keyShape: 'rounded' | 'square' | 'pill';
  keyFontWeight: 'light' | 'normal' | 'bold';
  showKeyBorders: boolean;

  // Typing
  autoCapitalization: boolean;
  doubleSpacePeriod: boolean;
  autoSpaceAfterPunctuation: boolean;
  keyPopupOnLongPress: boolean;
  longPressDelay: 'short' | 'normal' | 'long';
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
  keyboardHeight: 'normal',
  keyboardSpacing: 'normal',
  keyTextSize: 'medium',
  oneHandedMode: 'off',
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

  keyShape: 'rounded',
  keyFontWeight: 'normal',
  showKeyBorders: true,

  autoCapitalization: true,
  doubleSpacePeriod: true,
  autoSpaceAfterPunctuation: true,
  keyPopupOnLongPress: true,
  longPressDelay: 'normal',
  spacebarCursorControl: false,

  vibrateOnKeyPress: true,
  hapticLevel: 3,
  soundOnKeyPress: false,
  soundVolume: 50,
  keyAnimations: true,
};

/** Milliseconds a key has to be held before its long-press popup opens. */
export const LONG_PRESS_MS: Record<KeyboardPrefs['longPressDelay'], number> = {
  short: 200,
  normal: 300,
  long: 500,
};

/**
 * Vibration length per strength level, for the browser fallback. The
 * keyboard service on Android uses its own table, which also varies the
 * amplitude where the hardware supports it. Index 0 is unused.
 */
export const HAPTIC_MS = [0, 8, 12, 18, 26, 36];

/** Tailwind classes for the key label, the gap between keys and between rows. */
export const KEY_TEXT_CLASS: Record<KeyboardPrefs['keyTextSize'], string> = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
};

export const KEY_GAP_CLASS: Record<KeyboardPrefs['keyboardSpacing'], string> = {
  compact: 'gap-px',
  normal: 'gap-0.5',
  spacious: 'gap-1.5',
};

export const ROW_GAP_CLASS: Record<KeyboardPrefs['keyboardSpacing'], string> = {
  compact: 'gap-0.5',
  normal: 'gap-1',
  spacious: 'gap-2',
};

export const KEY_SHAPE_CLASS: Record<KeyboardPrefs['keyShape'], string> = {
  rounded: 'rounded-lg',
  square: 'rounded',
  pill: 'rounded-2xl',
};

export const KEY_FONT_CLASS: Record<KeyboardPrefs['keyFontWeight'], string> = {
  light: 'font-light',
  normal: 'font-medium',
  bold: 'font-bold',
};
