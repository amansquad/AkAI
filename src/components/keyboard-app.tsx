'use client';

import React, { useState, useCallback, useRef, useEffect, useSyncExternalStore, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveWallpaper, hasLiveAnimation } from '@/components/keyboard/live-wallpaper';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { loadLiveThemeCSS } from '@/lib/css-loader';
import { useInView } from '@/hooks/use-in-view';
import { DEFAULT_PREFS, LONG_PRESS_MS, HAPTIC_MS, KEY_TEXT_CLASS, KEY_GAP_CLASS, ROW_GAP_CLASS, KEY_SHAPE_CLASS, KEY_FONT_CLASS, type KeyboardPrefs } from '@/components/keyboard/prefs';
import { pressKey as translitPress, pressBackspace as translitBackspace, EMPTY_TRANSLIT, type TranslitState } from '@/lib/amharic-translit';
import {
  Keyboard, Smile, Image, ClipboardList, Languages,
  Delete, CornerDownLeft, Copy, Trash2, Plus,
  ArrowRightLeft, Loader2, Sparkles, Send, Globe,
  ArrowUp, Pen, Palette, X, Settings, Sun, Moon, Monitor, Wand2, ImagePlus,
  SquareCheck, LogOut, Undo2, Redo2, Zap, Smartphone, Mic, MicOff,
  PenTool, RotateCcw, Type, CheckCircle2, Search, Star, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import {
  THEMES, LONG_PRESS_ALTERNATES, AMHARIC_ROWS, AMHARIC_VOWELS,
  ETHIOPIAN_NUMBERS, ETHIOPIAN_SYMBOLS, STICKER_CATEGORIES, GIF_CATEGORIES,
  GIF_ITEMS, ENGLISH_SUGGESTIONS, AMHARIC_SUGGESTIONS, NEXT_WORD_EN, NEXT_WORD_AM,
  WORD_OF_THE_DAY_EN, WORD_OF_THE_DAY_AM,
  ENGLISH_ROWS, SYMBOL_ROWS, ETHIOPIAN_NUM_ROW_1, ETHIOPIAN_NUM_ROW_2,
  ETHIOPIAN_SYM_ROW, NUMBER_SHIFT_CHARS, DESKTOP_QWERTY_ROWS, DESKTOP_SYMBOL_ROWS,
  LAYOUT_ROWS, AMHARIC_LAYOUT_ROWS,
  type ThemeDef, type CustomThemeData, type GiphyGif,
} from '@/components/keyboard-data';
import { trendingGifCatalog, searchGifCatalog } from '@/components/giphy-catalog';

// Mode panels only pay for their own code once the user actually opens that
// mode, instead of all of them loading up front with the rest of the keyboard.
const KeyboardClipboardPanel = lazy(() => import('@/components/keyboard/modes/clipboard-panel'));
const KeyboardGifsPanel = lazy(() => import('@/components/keyboard/modes/gifs-panel'));
const KeyboardTranslatePanel = lazy(() => import('@/components/keyboard/modes/translate-panel'));
const KeyboardHandwritingPanel = lazy(() => import('@/components/keyboard/modes/handwriting-panel'));
const KeyboardSettingsPanel = lazy(() => import('@/components/keyboard/modes/settings-panel'));

export type KeyboardMode = 'keyboard' | 'stickers' | 'gifs' | 'clipboard' | 'translate' | 'handwriting' | 'settings' | 'themes';
export type Language = 'english' | 'amharic';
export type ThemeName = string;

interface KeyboardAppProps {
  onTextChange?: (text: string) => void;
  isIme?: boolean;
}

// ─── Data imported from keyboard-data.ts ──────────────────────────────────
// THEMES, LONG_PRESS_ALTERNATES, AMHARIC_ROWS, AMHARIC_VOWELS,
// ETHIOPIAN_NUMBERS, ETHIOPIAN_SYMBOLS, STICKER_CATEGORIES, GIF_CATEGORIES,
// GIF_ITEMS, ENGLISH_SUGGESTIONS, AMHARIC_SUGGESTIONS, NEXT_WORD_EN, NEXT_WORD_AM,
// ENGLISH_ROWS, SYMBOL_ROWS, ETHIOPIAN_NUM_ROW_1/2, ETHIOPIAN_SYM_ROW,
// NUMBER_SHIFT_CHARS, DESKTOP_QWERTY_ROWS, DESKTOP_SYMBOL_ROWS
// are all imported from @/components/keyboard-data


// ─── Theme picker card ────────────────────────────────────────────────────
//
// Defined at module scope, not inside the picker's render function. A
// component declared during render is a new type on every render, so React
// cannot reconcile it — it unmounts and remounts the whole grid. With every
// theme on screen at once that meant tearing down and rebuilding ~170 cards
// on each keystroke. Memoised so only the cards that actually change re-render,
// and hover/press use CSS transforms rather than per-card animation state.

interface ThemeCardProps {
  tKey: string;
  tData: ThemeDef;
  t: ThemeDef;
  isSelected: boolean;
  customBgColor?: string;
  onSelect: (key: string) => void;
  onDelete: (key: string) => void;
}

const ThemeCard = React.memo(function ThemeCard({
  tKey, tData, t, isSelected, customBgColor, onSelect, onDelete,
}: ThemeCardProps) {
  const isCustom = tKey.startsWith('custom_');
  return (
    <button
      onClick={() => onSelect(tKey)}
      className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border overflow-hidden transition-transform duration-150 hover:scale-[1.06] hover:-translate-y-0.5 active:scale-[0.94] ${
        isSelected ? `${t.accent} ${t.accentText} border-transparent shadow-md ring-2 ring-white/20` : `${t.card} ${t.border} border`
      }`}
    >
      {tData.isLive && (
        <>
          <div className={`absolute inset-0 pointer-events-none ${tData.bg}`} />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)',
            borderRadius: 'inherit',
          }} />
        </>
      )}
      {isCustom && customBgColor && (
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: customBgColor, opacity: 0.3 }} />
      )}
      <span className="text-lg relative z-10">{tData.flag}</span>
      <span className="text-[8px] font-semibold leading-tight relative z-10 text-center max-w-full truncate px-1">{tData.name}</span>
      <div className="flex gap-0.5 mt-0.5 relative z-10">
        <span className={`w-2 h-2 rounded-full ${tData.key.replace('hover:', '').split(' ')[0]}`} />
        <span className={`w-2 h-2 rounded-full ${tData.accent.replace('hover:', '').split(' ')[0]}`} />
        <span className={`w-2 h-2 rounded-full hidden sm:block ${tData.bg.replace('hover:', '').split(' ')[0]}`} />
      </div>
      {tData.isLive && (
        <span className="absolute top-1 right-1 text-[7px] font-bold bg-white/20 text-white rounded px-0.5 z-10 pointer-events-none shadow-sm backdrop-blur-sm border border-white/20">LIVE</span>
      )}
      {isSelected && (
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center z-20 pointer-events-none shadow-md">
          <SquareCheck className="w-2.5 h-2.5" />
        </div>
      )}
      {isCustom && (
        <div
          role="button"
          tabIndex={0}
          onClick={e => { e.stopPropagation(); onDelete(tKey); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onDelete(tKey); } }}
          className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center bg-red-500/70 text-white rounded-full text-[8px] z-20 hover:bg-red-500 cursor-pointer"
        >×</div>
      )}
    </button>
  );
});

// A section of the "All" view. The full catalogue is ~170 cards, and
// mounting every one up front costs far more than the few rows actually on
// screen. Each section mounts its grid once it scrolls near the viewport and
// stays mounted after; until then it reserves the height its rows will take
// so the scrollbar doesn't jump.
const THEME_GRID_COLUMNS = 4;
const THEME_ROW_HEIGHT_PX = 84;

interface ThemeSectionProps {
  label: string;
  themes: [string, ThemeDef][];
  t: ThemeDef;
  selectedTheme: string;
  customBgColorFor?: (key: string) => string | undefined;
  onSelect: (key: string) => void;
  onDelete: (key: string) => void;
}

const ThemeSection = React.memo(function ThemeSection({
  label, themes, t, selectedTheme, customBgColorFor, onSelect, onDelete,
}: ThemeSectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reservedHeight = Math.ceil(themes.length / THEME_GRID_COLUMNS) * THEME_ROW_HEIGHT_PX;

  return (
    <div ref={ref}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[9px] font-bold uppercase tracking-wider ${t.keyText} opacity-40`}>{label}</span>
        <div className={`flex-1 h-px ${t.border} opacity-30`} />
        <span className={`text-[9px] ${t.keyText} opacity-30`}>{themes.length}</span>
      </div>
      {inView ? (
        <div className="grid grid-cols-4 gap-2">
          {themes.map(([key, tData]) => (
            <ThemeCard
              key={key}
              tKey={key}
              tData={tData}
              t={t}
              isSelected={selectedTheme === key}
              customBgColor={customBgColorFor?.(key)}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div style={{ height: reservedHeight }} />
      )}
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────
export default function KeyboardApp({ onTextChange, isIme = false }: KeyboardAppProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<KeyboardMode>('keyboard');
  const [prevMode, setPrevMode] = useState<KeyboardMode>('keyboard');
  const [language, setLanguage] = useState<Language>('english');
  // Phonetic Amharic: the QWERTY board, with what you type turned into fidel
  // as you go ("selam" → ሰላም). The fidel board stays one tap away; this is a
  // second way into Amharic, not a replacement for it.
  const [phonetic, setPhonetic] = useState(false);
  // The Latin spelling of the word being typed, and the fidel on screen for
  // it. Held in a ref because it is bookkeeping for the next keystroke, not
  // something the UI renders.
  const translitRef = useRef<TranslitState>(EMPTY_TRANSLIT);
  const [shiftActive, setShiftActive] = useState(false);
  const [symbolsActive, setSymbolsActive] = useState(false);
  const [activeStickerCategory, setActiveStickerCategory] = useState('smileys');
  const [activeGifCategory, setActiveGifCategory] = useState('hello');
  const [clipboardItems, setClipboardItems] = useState<{ id: string; text: string; timestamp: number }[]>([
    { id: '1', text: 'Hello, how are you?', timestamp: Date.now() - 60000 },
    { id: '2', text: 'እንዴት ነህ?', timestamp: Date.now() - 30000 },
    { id: '3', text: 'See you tomorrow!', timestamp: Date.now() - 10000 },
  ]);
  const [selectedConsonant, setSelectedConsonant] = useState<string | null>(null);
  const [translateFrom, setTranslateFrom] = useState<'English' | 'Amharic'>('English');
  const [translateInput, setTranslateInput] = useState('');
  const [translateOutput, setTranslateOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [nextWordSuggestions, setNextWordSuggestions] = useState<string[]>([]);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeName>('default');
  const { resolvedTheme: appTheme, setTheme: setAppTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  // Gates the persistence effects until saved settings have been restored,
  // so they don't overwrite storage with defaults on mount.
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  // Custom themes
  const [customThemes, setCustomThemes] = useState<CustomThemeData[]>([]);
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [customName, setCustomName] = useState('My Theme');
  const [customBgColor, setCustomBgColor] = useState('#1a1a2e');
  const [customKeyColor, setCustomKeyColor] = useState('#16213e');
  const [customKeyTextColor, setCustomKeyTextColor] = useState('#e0e0ff');
  const [customAccentColor, setCustomAccentColor] = useState('#7c3aed');
  const [customSpecialKeyColor, setCustomSpecialKeyColor] = useState('#2d2d5e');
  const [customBgImageUrl, setCustomBgImageUrl] = useState('');
  const [customBgGifUrl, setCustomBgGifUrl] = useState('');
  const [customBgFile, setCustomBgFile] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(1);
  const [bgBlur, setBgBlur] = useState(0);
  const [keyOpacity, setKeyOpacity] = useState(0.85);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Theme picker category
  const [themeCategory, setThemeCategory] = useState<'all' | 'solid' | 'live' | 'custom' | 'culture' | 'faith' | 'football'>('all');
  // Desktop view
  const [desktopView, setDesktopView] = useState(false);
  // Giphy
  const [giphyResults, setGiphyResults] = useState<GiphyGif[] | null>(null);
  const [giphyLoading, setGiphyLoading] = useState(false);
  const [giphyQuery, setGiphyQuery] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPaths, setDrawingPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [hwUndoStack, setHwUndoStack] = useState<{ x: number; y: number }[][][]>([]);
  const [hwRedoStack, setHwRedoStack] = useState<{ x: number; y: number }[][][]>([]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [hwAutoRecognize, setHwAutoRecognize] = useState(true);
  const hwRecognizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New state for Change 1: Long press
  const [longPressKey, setLongPressKey] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New state for Change 2: Recent emojis
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // Emoji search, favorites, and predictive bar
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [favoriteEmojis, setFavoriteEmojis] = useState<string[]>([]);
  const [emojiBarVisible, setEmojiBarVisible] = useState(true);
  const [contextEmojiSuggestions, setContextEmojiSuggestions] = useState<string[]>([]);

  // New state for Change 4: Handwriting suggestions
  const [hwSuggestions, setHwSuggestions] = useState<string[]>([]);
  const [hwWordSuggestions, setHwWordSuggestions] = useState<string[]>([]);
  const [hwSentenceSuggestions, setHwSentenceSuggestions] = useState<string[]>([]);
  const [selectedHwSuggestion, setSelectedHwSuggestion] = useState<string | null>(null);
  const [hwRecognizing, setHwRecognizing] = useState(false);
  const [hwStrokes, setHwStrokes] = useState(0);

  // New state for Change 6: Settings
  const [keyPressFeedback, setKeyPressFeedback] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState<'compact' | 'normal' | 'tall'>('normal');
  const [showNumberRow, setShowNumberRow] = useState(DEFAULT_PREFS.showNumberRow);
  const [autoSpaceAfterPunctuation, setAutoSpaceAfterPunctuation] = useState(true);
  const [keyPopupOnLongPress, setKeyPopupOnLongPress] = useState(true);
  const [vibrateOnKeyPress, setVibrateOnKeyPress] = useState(true);
  const [soundOnKeyPress, setSoundOnKeyPress] = useState(false);
  const [autoCapitalization, setAutoCapitalization] = useState(true);
  const [recentStickers, setRecentStickers] = useState<string[]>([]);
  // Key-press vibration strength, 1 (barely there) to 5 (strongest). Replaces
  // the old light/medium/strong setting, which is migrated on load.
  const [hapticLevel, setHapticLevel] = useState(DEFAULT_PREFS.hapticLevel);
  // Key-click volume, 0–100.
  const [soundVolume, setSoundVolume] = useState(DEFAULT_PREFS.soundVolume);
  const [showWordOfTheDay, setShowWordOfTheDay] = useState(DEFAULT_PREFS.showWordOfTheDay);
  const [showSuggestionBar, setShowSuggestionBar] = useState(DEFAULT_PREFS.showSuggestionBar);
  const [showKeyHints, setShowKeyHints] = useState(DEFAULT_PREFS.showKeyHints);
  const [showMicKey, setShowMicKey] = useState(DEFAULT_PREFS.showMicKey);
  const [keyTextSize, setKeyTextSize] = useState<KeyboardPrefs['keyTextSize']>(DEFAULT_PREFS.keyTextSize);
  const [longPressDelay, setLongPressDelay] = useState<KeyboardPrefs['longPressDelay']>(DEFAULT_PREFS.longPressDelay);
  const [keyAnimations, setKeyAnimations] = useState(DEFAULT_PREFS.keyAnimations);
  const [doubleSpacePeriod, setDoubleSpacePeriod] = useState(true);
  const [oneHandedMode, setOneHandedMode] = useState<'off' | 'left' | 'right'>('off');
  const lastSpaceTapRef = useRef<number>(0);

  // Animation state for Change 7
  const [textBounce, setTextBounce] = useState(false);
  const [rippleKey, setRippleKey] = useState<string | null>(null);

  // Desktop settings modal state
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);

  // Desktop undo/redo state
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // ─── Voice to Text ─────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  
  const [visibleButtons, setVisibleButtons] = useState<Record<string, boolean>>(DEFAULT_PREFS.visibleButtons);
  const [toolbarStyle, setToolbarStyle] = useState<KeyboardPrefs['toolbarStyle']>(DEFAULT_PREFS.toolbarStyle);
  const [keyboardSpacing, setKeyboardSpacing] = useState<KeyboardPrefs['keyboardSpacing']>(DEFAULT_PREFS.keyboardSpacing);

  // New customisation prefs
  const [englishLayout, setEnglishLayout] = useState<KeyboardPrefs['englishLayout']>(DEFAULT_PREFS.englishLayout);
  const [amharicLayout, setAmharicLayout] = useState<KeyboardPrefs['amharicLayout']>(DEFAULT_PREFS.amharicLayout);
  const [keyShape, setKeyShape] = useState<KeyboardPrefs['keyShape']>(DEFAULT_PREFS.keyShape);
  const [keyFontWeight, setKeyFontWeight] = useState<KeyboardPrefs['keyFontWeight']>(DEFAULT_PREFS.keyFontWeight);
  const [showKeyBorders, setShowKeyBorders] = useState(DEFAULT_PREFS.showKeyBorders);
  const [showCursorRow, setShowCursorRow] = useState(DEFAULT_PREFS.showCursorRow);
  const [spacebarCursorControl, setSpacebarCursorControl] = useState(DEFAULT_PREFS.spacebarCursorControl);

  // Cursor position within text. null = end of text (default append behaviour).
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  // Tracks whether the spacebar was swiped this gesture (suppresses tap-to-space).
  const spaceSwipeRef = useRef<{ x: number; y: number } | null>(null);
  const spaceWasSwipedRef = useRef(false);

  // visibleButtons, toolbarStyle and keyboardSpacing used to be saved under
  // keys of their own, by effects that ran before the saved values had been
  // restored. They now live in the one settings blob below; the old keys are
  // still read once, so nobody loses what they had set.

  useEffect(() => {
    localStorage.setItem('akai_dynamic_buttons', JSON.stringify(visibleButtons));
  }, [visibleButtons]);

  // Automatic Clipboard Fetching
  useEffect(() => {
    if (mode === 'clipboard') {
      const fetchClipboard = async () => {
        try {
          if ((window as any).AkaiKeyboard?.getClipboard) {
            const nativeText = (window as any).AkaiKeyboard.getClipboard();
            if (nativeText && !clipboardItems.some(i => i.text === nativeText)) {
              setClipboardItems(prev => [{ id: Date.now().toString(), text: nativeText, timestamp: Date.now() }, ...prev]);
            }
          } else if (navigator.clipboard?.readText) {
            const webText = await navigator.clipboard.readText();
            if (webText && !clipboardItems.some(i => i.text === webText)) {
              setClipboardItems(prev => [{ id: Date.now().toString(), text: webText, timestamp: Date.now() }, ...prev]);
            }
          }
        } catch (e) {
          console.log("Clipboard check failed", e);
        }
      };

      fetchClipboard(); // initial
      const tid = setInterval(fetchClipboard, 3000);
      return () => clearInterval(tid);
    }
  }, [mode, clipboardItems]);

  useEffect(() => {
    const saved = localStorage.getItem('akai_custom_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.bgOpacity !== undefined) setBgOpacity(parsed.bgOpacity);
        if (parsed.bgBlur !== undefined) setBgBlur(parsed.bgBlur);
        if (parsed.keyOpacity !== undefined) setKeyOpacity(parsed.keyOpacity);
        if (parsed.bgFile) setCustomBgFile(parsed.bgFile);
      } catch (e) { console.error('Failed to load settings', e); }
    }
  }, []);

  useEffect(() => {
    const settings = { bgOpacity, bgBlur, keyOpacity, bgFile: customBgFile };
    localStorage.setItem('akai_custom_settings', JSON.stringify(settings));
  }, [bgOpacity, bgBlur, keyOpacity, customBgFile]);

  // Emoji favorites persistence
  useEffect(() => {
    const saved = localStorage.getItem('akai_favorite_emojis');
    if (saved) try { setFavoriteEmojis(JSON.parse(saved)); } catch(e) {}
  }, []);
  useEffect(() => {
    localStorage.setItem('akai_favorite_emojis', JSON.stringify(favoriteEmojis));
  }, [favoriteEmojis]);

  // Context-aware emoji suggestions engine
  const EMOJI_CONTEXT_MAP: Record<string, string[]> = {
    'love': ['❤️','😍','🥰','💕','💖','💗','💘','💝','🫶','💋'],
    'happy': ['😊','😄','😁','🥳','🎉','🎊','✨','💫','🌟','😃'],
    'sad': ['😢','😭','😞','💔','🥺','😔','😥','😪','😿','😫'],
    'angry': ['😡','😠','🤬','💢','😤','🔥','👊','💥','👿','🙈'],
    'thanks': ['🙏','❤️','💕','✨','🤝','💯','🌟','🫶','💝','🎶'],
    'hello': ['👋','🤗','😊','✨','🙌','🫶','👋','💪','🎉','😄'],
    'goodbye': ['👋','🥲','💪','🫡','🙌','✨','🌟','💛','🙏','😥'],
    'food': ['🍕','🍔','🌮','🍜','🍣','☕','🍰','🍩','🍪','🍫'],
    'party': ['🎉','🎊','🥳','🍾','🎈','🎆','🎇','✨','💫','🕺'],
    'nature': ['🌸','🌺','🌻','🌈','⭐','🌙','☀️','🌿','🦋','🍀'],
    'work': ['💼','📊','📈','💻','📝','🗓️','📌','🔧','⚙️','🏗️'],
    'fire': ['🔥','💥','⚡','🌟','☄️','🔥','✨','💫','🌪️','💥'],
    'cool': ['😎','🥳','💯','✌️','🤩','🔥','💪','🎶','🎸','🎵'],
    'cry': ['😢','😭','🥺','💔','😿','😥','😪','😞','😫','🤧'],
    'laugh': ['😂','🤣','😆','😹','🤭','😜','🤪','😝','😄','😁'],
    'pray': ['🙏','✝️','⛪','🕊️','💛','✨','💫','🌟','🫶','❤️'],
    'music': ['🎵','🎶','🎤','🎧','🎸','🎹','🥁','🎺','🎷','🎼'],
    'travel': ['✈️','🗺️','🧭','🏔️','🌊','🏖️','🚀','🛸','🌍','🗼'],
    'ethiopia': ['🇪🇹','☕','🦁','🏔️','🌍','🎶','🥁','💪','🔥','👑'],
    'amharic': ['🇪🇹','☕','🎶','🥁','🏔️','🌍','🦁','🦅','☀️','🌿'],
  };

  useEffect(() => {
    if (!text || text.length < 2) {
      setContextEmojiSuggestions([]);
      return;
    }
    const words = text.toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1];
    const prevWord = words.length >= 2 ? words[words.length - 2] : '';
    const bigram = prevWord + ' ' + lastWord;
    const suggestions: { emoji: string; score: number }[] = [];
    for (const [key, emojis] of Object.entries(EMOJI_CONTEXT_MAP)) {
      if (key.includes(bigram) || bigram.includes(key)) {
        emojis.slice(0, 3).forEach((e, i) => suggestions.push({ emoji: e, score: 3 - i }));
      } else if (key.includes(lastWord) || lastWord.includes(key)) {
        emojis.slice(0, 2).forEach((e, i) => suggestions.push({ emoji: e, score: 2 - i }));
      }
    }
    const seen = new Set<string>();
    const unique = suggestions.filter(s => { if (seen.has(s.emoji)) return false; seen.add(s.emoji); return true; });
    setContextEmojiSuggestions(unique.sort((a, b) => b.score - a.score).slice(0, 8).map(s => s.emoji));
  }, [text]);

  const toggleFavoriteEmoji = useCallback((emoji: string) => {
    setFavoriteEmojis(prev => prev.includes(emoji) ? prev.filter(e => e !== emoji) : [emoji, ...prev].slice(0, 30));
  }, []);

  const addRecentEmoji = useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 24);
    });
  }, []);

  const getFilteredEmojis = useCallback((emojis: string[]) => {
    if (!emojiSearchQuery) return emojis;
    const q = emojiSearchQuery.toLowerCase();
    return emojis.filter(e => {
      const kw = EMOJI_KEYWORDS[e] || [];
      return kw.some(k => k.includes(q)) || e.includes(q);
    });
  }, [emojiSearchQuery]);

  const startVoiceRecognition = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceError('Voice recognition not supported in this browser.');
      return;
    }
    setVoiceError(null);
    const recognition = new SpeechRec();
    recognition.lang = language === 'english' ? 'en-US' : 'am-ET';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === 'no-speech') setVoiceError('No speech detected. Try again.');
      else if (e.error === 'not-allowed') setVoiceError('Microphone access denied.');
      else setVoiceError(`Voice error: ${e.error}`);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const results: any[] = Array.from(e.results);
      const transcript = results.map((r: any) => r[0].transcript).join('');
      if (results[results.length - 1].isFinal) {
        updateText(text + (text && text[text.length - 1] !== ' ' ? ' ' : '') + transcript);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, language, text]);

  // Mobile view is the default. Desktop mode is only activated manually.
  // (Removed auto-detect so mobile is always the starting view.)

  // Build merged theme (built-in + custom)
  const getCustomThemeDef = (ct: CustomThemeData): ThemeDef => ({
    name: ct.name, flag: '🎨', category: 'custom',
    bg: 'bg-gray-950', card: 'bg-gray-900/80', key: 'bg-gray-800/90', keyHover: 'hover:bg-gray-700',
    keyActive: 'bg-gray-300 text-gray-950', keyText: 'text-gray-100',
    specialKey: 'bg-gray-700', accent: 'bg-gray-300', accentText: 'text-gray-950',
    border: 'border-gray-700/30', tabBar: 'bg-gray-900/80', tabActive: 'bg-gray-300', tabActiveText: 'text-gray-950',
    suggestion: 'bg-gray-800/80',
  });

  const allThemes = { ...THEMES };
  customThemes.forEach(ct => { allThemes[`custom_${ct.id}`] = getCustomThemeDef(ct); });

  const t = allThemes[theme] || THEMES.default;

  // Some live themes (the CSS-gradient ones, t.liveClass) have no canvas
  // animation — load their keyframe CSS on demand instead of bundling it
  // with every theme.
  useEffect(() => {
    if (t.isLive && t.liveClass) {
      loadLiveThemeCSS();
    }
  }, [t.isLive, t.liveClass]);

  // Custom theme style overrides
  const customThemeData = theme.startsWith('custom_') ? customThemes.find(ct => `custom_${ct.id}` === theme) : null;
  const customBgStyle: React.CSSProperties = (theme === 'custom' && customBgFile) ? {
    backgroundImage: `url(${customBgFile})`,
    backgroundSize: 'cover', backgroundPosition: 'center',
  } : customThemeData ? {
    backgroundColor: customThemeData.bgColor,
    backgroundImage: customThemeData.bgGifUrl ? `url(${customThemeData.bgGifUrl})` : customThemeData.bgImageUrl ? `url(${customThemeData.bgImageUrl})` : undefined,
    backgroundSize: 'cover', backgroundPosition: 'center',
  } : {};
  const customKeyStyle: React.CSSProperties = customThemeData ? {
    backgroundColor: customThemeData.keyColor,
    color: customThemeData.keyTextColor
  } : customBgFile ? {
    backgroundColor: `rgba(0, 0, 0, ${keyOpacity * 0.4})`,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
  } : {};
  const customAccentStyle: React.CSSProperties = customThemeData ? { backgroundColor: customThemeData.accentColor } : {};
  const customSpecialStyle: React.CSSProperties = customThemeData ? { backgroundColor: customThemeData.specialKeyColor } : {};

  // Create custom theme
  const handleCreateCustomTheme = useCallback(() => {
    const id = Date.now().toString();
    const newTheme: CustomThemeData = {
      id, name: customName || 'Custom Theme',
      bgColor: customBgColor, keyColor: customKeyColor, keyTextColor: customKeyTextColor,
      accentColor: customAccentColor, specialKeyColor: customSpecialKeyColor,
      bgImageUrl: customBgImageUrl || undefined, bgGifUrl: customBgGifUrl || undefined,
    };
    setCustomThemes(prev => [...prev, newTheme]);
    setTheme(`custom_${id}`);
    setShowCustomCreator(false);
    setMode('keyboard');
  }, [customName, customBgColor, customKeyColor, customKeyTextColor, customAccentColor, customSpecialKeyColor, customBgImageUrl, customBgGifUrl]);

  // Fetch Giphy
  //
  // The Android build ships as a static Capacitor bundle with no server, so
  // /api/giphy only exists on the deployed website — getApiBaseUrl() routes
  // native requests there. Still falls back to a curated, keyless catalog of
  // real Giphy CDN GIFs (the same one the Flutter app ships) if that's
  // unreachable or GIPHY_API_KEY isn't configured server-side.
  const fetchGiphy = useCallback(async (query: string) => {
    setGiphyLoading(true);
    try {
      const type = query ? 'search' : 'trending';
      const res = await fetch(`${getApiBaseUrl()}/api/giphy?type=${type}&q=${encodeURIComponent(query)}&limit=24`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data) && data.data.length > 0 && !data.isFallback) {
          setGiphyResults(data.data);
          return;
        }
      }
    } catch {
      // /api/giphy unavailable in this deployment — use the local catalog.
    } finally {
      setGiphyLoading(false);
    }
    setGiphyResults(query ? searchGifCatalog(query) : trendingGifCatalog());
  }, []);

  useEffect(() => {
    if (mode === 'gifs') fetchGiphy(giphyQuery);
  }, [mode, giphyQuery, fetchGiphy]);

  // Load settings and recents from localStorage
  useEffect(() => {
    const savedCustomThemes = localStorage.getItem('akai-kb-custom-themes');
    if (savedCustomThemes) {
      try { setCustomThemes(JSON.parse(savedCustomThemes)); }
      catch (e) { console.error('Failed to load custom themes', e); }
    }
    const savedSettings = localStorage.getItem('akai-kb-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.vibrate !== undefined) setVibrateOnKeyPress(parsed.vibrate);
        if (parsed.sound !== undefined) setSoundOnKeyPress(parsed.sound);
        if (parsed.autoCap !== undefined) setAutoCapitalization(parsed.autoCap);
        if (parsed.kbHeight !== undefined) setKeyboardHeight(parsed.kbHeight);
        if (parsed.hapticLevel !== undefined) setHapticLevel(parsed.hapticLevel);
        else if (parsed.hapticStrength !== undefined) setHapticLevel({ light: 2, medium: 3, strong: 5 }[parsed.hapticStrength as 'light' | 'medium' | 'strong'] ?? DEFAULT_PREFS.hapticLevel);
        if (parsed.soundVolume !== undefined) setSoundVolume(parsed.soundVolume);
        if (parsed.showWordOfTheDay !== undefined) setShowWordOfTheDay(parsed.showWordOfTheDay);
        if (parsed.showSuggestionBar !== undefined) setShowSuggestionBar(parsed.showSuggestionBar);
        if (parsed.showKeyHints !== undefined) setShowKeyHints(parsed.showKeyHints);
        if (parsed.showMicKey !== undefined) setShowMicKey(parsed.showMicKey);
        if (parsed.keyTextSize !== undefined) setKeyTextSize(parsed.keyTextSize);
        if (parsed.longPressDelay !== undefined) setLongPressDelay(parsed.longPressDelay);
        if (parsed.keyAnimations !== undefined) setKeyAnimations(parsed.keyAnimations);
        if (parsed.showNumberRow !== undefined) setShowNumberRow(parsed.showNumberRow);
        if (parsed.toolbarStyle !== undefined) setToolbarStyle(parsed.toolbarStyle);
        if (parsed.keyboardSpacing !== undefined) setKeyboardSpacing(parsed.keyboardSpacing);
        // Merged over the defaults so a button added later starts visible.
        if (parsed.visibleButtons !== undefined) setVisibleButtons({ ...DEFAULT_PREFS.visibleButtons, ...parsed.visibleButtons });
        if (parsed.doubleSpacePeriod !== undefined) setDoubleSpacePeriod(parsed.doubleSpacePeriod);
        if (parsed.oneHandedMode !== undefined) setOneHandedMode(parsed.oneHandedMode);
        if (parsed.autoSpace !== undefined) setAutoSpaceAfterPunctuation(parsed.autoSpace);
        if (parsed.keyPopup !== undefined) setKeyPopupOnLongPress(parsed.keyPopup);
        // Theme and language matter most as an IME: the keyboard is
        // dismissed and reopened constantly, and without these the user's
        // chosen theme and Ge'ez layout reset on every single open.
        if (parsed.theme !== undefined) setTheme(parsed.theme);
        if (parsed.language !== undefined) setLanguage(parsed.language);
        if (parsed.phonetic !== undefined) setPhonetic(parsed.phonetic);
        if (parsed.englishLayout !== undefined) setEnglishLayout(parsed.englishLayout);
        if (parsed.amharicLayout !== undefined) setAmharicLayout(parsed.amharicLayout);
        if (parsed.keyShape !== undefined) setKeyShape(parsed.keyShape);
        if (parsed.keyFontWeight !== undefined) setKeyFontWeight(parsed.keyFontWeight);
        if (parsed.showKeyBorders !== undefined) setShowKeyBorders(parsed.showKeyBorders);
        if (parsed.showCursorRow !== undefined) setShowCursorRow(parsed.showCursorRow);
        if (parsed.spacebarCursorControl !== undefined) setSpacebarCursorControl(parsed.spacebarCursorControl);
      } catch (e) { console.error('Failed to load settings', e); }
    }
    // One-off migration from the keys these three used to have to themselves.
    {
      const parsed = (() => { try { return JSON.parse(savedSettings || '{}'); } catch { return {}; } })();
      if (parsed.visibleButtons === undefined) {
        const legacy = localStorage.getItem('akai_dynamic_buttons');
        if (legacy) try { setVisibleButtons({ ...DEFAULT_PREFS.visibleButtons, ...JSON.parse(legacy) }); } catch { /* ignore */ }
      }
      if (parsed.toolbarStyle === undefined) {
        const legacy = localStorage.getItem('akai_toolbar_style');
        if (legacy === 'active' || legacy === 'all' || legacy === 'icons') setToolbarStyle(legacy);
      }
      if (parsed.keyboardSpacing === undefined) {
        const legacy = localStorage.getItem('akai_keyboard_spacing');
        if (legacy === 'compact' || legacy === 'normal' || legacy === 'spacious') setKeyboardSpacing(legacy);
      }
    }
    const savedRecents = localStorage.getItem('akai-kb-recents');
    if (savedRecents) {
      try { setRecentEmojis(JSON.parse(savedRecents)); }
      catch (e) { console.error('Failed to load recents', e); }
    }
    setSettingsLoaded(true);
  }, []);

  // Persist settings and recents.
  //
  // Gated on settingsLoaded: effects run in declaration order, so without
  // the gate this one would run in the same flush as the load effect above,
  // before its setState calls have committed — writing the *default* theme
  // and language straight over what was just restored.
  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem('akai-kb-settings', JSON.stringify({
      vibrate: vibrateOnKeyPress,
      sound: soundOnKeyPress,
      autoCap: autoCapitalization,
      kbHeight: keyboardHeight,
      hapticLevel,
      soundVolume,
      showWordOfTheDay,
      showSuggestionBar,
      showKeyHints,
      showMicKey,
      keyTextSize,
      longPressDelay,
      keyAnimations,
      showNumberRow,
      toolbarStyle,
      keyboardSpacing,
      visibleButtons,
      doubleSpacePeriod,
      oneHandedMode,
      autoSpace: autoSpaceAfterPunctuation,
      keyPopup: keyPopupOnLongPress,
      phonetic,
      theme,
      language,
      englishLayout,
      amharicLayout,
      keyShape,
      keyFontWeight,
      showKeyBorders,
      showCursorRow,
      spacebarCursorControl,
    }));
  }, [settingsLoaded, vibrateOnKeyPress, soundOnKeyPress, autoCapitalization, keyboardHeight, hapticLevel, soundVolume, showWordOfTheDay, showSuggestionBar, showKeyHints, showMicKey, keyTextSize, longPressDelay, keyAnimations, showNumberRow, toolbarStyle, keyboardSpacing, visibleButtons, doubleSpacePeriod, oneHandedMode, autoSpaceAfterPunctuation, keyPopupOnLongPress, theme, language, phonetic, englishLayout, amharicLayout, keyShape, keyFontWeight, showKeyBorders, showCursorRow, spacebarCursorControl]);

  // Custom themes are stored separately: a saved theme of "custom_<id>"
  // resolves to THEMES.default unless the matching definition is restored
  // alongside it, so a user's own theme would silently revert.
  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem('akai-kb-custom-themes', JSON.stringify(customThemes));
  }, [settingsLoaded, customThemes]);

  useEffect(() => {
    localStorage.setItem('akai-kb-recents', JSON.stringify(recentEmojis));
  }, [recentEmojis]);

  // One AudioContext for the life of the keyboard. This used to create a new
  // one for every key press, and browsers only allow a handful to exist at
  // once, so the click went silent a few keys in.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playClick = useCallback((volume: number) => {
    if (volume <= 0) return;
    try {
      let ctx = audioCtxRef.current;
      if (!ctx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Ctor = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctor) return;
        ctx = new Ctor() as AudioContext;
        audioCtxRef.current = ctx;
      }
      if (ctx.state === 'suspended') void ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      // A short, high, quickly-decaying tick rather than a 100ms beep.
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, now);
      gain.gain.setValueAtTime(0.35 * (volume / 100), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch { /* audio blocked or unavailable */ }
  }, []);

  const playClickSound = useCallback(() => {
    if (soundOnKeyPress) playClick(soundVolume);
  }, [soundOnKeyPress, soundVolume, playClick]);

  useEffect(() => () => { void audioCtxRef.current?.close(); }, []);

  // Inside the Android keyboard this has to go through the keyboard service:
  // navigator.vibrate needs a permission the WebView does not have, so it
  // used to fail silently and vibration did nothing at all. The browser
  // fallback is only for the web build.
  const vibrateAt = useCallback((level: number) => {
    const clamped = Math.max(1, Math.min(5, Math.round(level)));
    const bridge = window.AkaiKeyboard;
    if (bridge?.playHaptic) {
      bridge.playHaptic(clamped);
      return;
    }
    window.navigator.vibrate?.(HAPTIC_MS[clamped]);
  }, []);

  const doVibrate = useCallback(() => {
    if (vibrateOnKeyPress) vibrateAt(hapticLevel);
  }, [vibrateOnKeyPress, hapticLevel, vibrateAt]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const updateText = useCallback((newText: string) => {
    setText(newText);
    onTextChange?.(newText);
    // Trigger bounce animation
    setTextBounce(true);
    setTimeout(() => setTextBounce(false), 300);
    // Update suggestions
    const words = newText.trim().split(/\s+/);
    const lastWord = words[words.length - 1]?.toLowerCase() || '';
    if (language === 'english') {
      setSuggestions(ENGLISH_SUGGESTIONS[lastWord] || ENGLISH_SUGGESTIONS[lastWord.slice(0, 2)] || []);
      const prevWord = words.length > 1 ? words[words.length - 2]?.toLowerCase() : '';
      setNextWordSuggestions(prevWord ? (NEXT_WORD_EN[prevWord] || []) : []);
    } else {
      setSuggestions(AMHARIC_SUGGESTIONS[lastWord] || AMHARIC_SUGGESTIONS[lastWord.slice(0, 2)] || []);
      const prevWord = words.length > 1 ? words[words.length - 2] || '' : '';
      setNextWordSuggestions(prevWord ? (NEXT_WORD_AM[prevWord] || []) : []);
    }
  }, [onTextChange, language]);

  const EMOJI_KEYWORDS: Record<string, string[]> = {
    '😀': ['happy','smile','grin','joy','glad'],
    '😂': ['laugh','lol','lmao','tears','funny'],
    '😍': ['love','heart','eyes','crush','adore'],
    '🥰': ['love','kiss','hug','warm','sweet'],
    '😢': ['sad','cry','tear','unhappy','upset'],
    '😡': ['angry','mad','rage','furious','annoyed'],
    '👍': ['thumbs','up','good','ok','approve'],
    '❤️': ['love','heart','red','romance','passion'],
    '🎉': ['party','celebrate','congrats','yay','hooray'],
    '🙏': ['pray','thanks','please','namaste','bless'],
    '☕': ['coffee','tea','hot','drink','buna'],
    '🔥': ['fire','lit','hot','flame','burn'],
    '💪': ['strong','muscle','workout','power','flex'],
    '✨': ['sparkle','magic','glitter','shine','new'],
    '🌊': ['water','wave','ocean','sea','surf'],
    '🎵': ['music','note','song','melody','tune'],
    '📱': ['phone','mobile','call','cell','smartphone'],
    '💻': ['computer','laptop','code','work','tech'],
    '✈️': ['travel','fly','plane','trip','vacation'],
    '🇪🇹': ['ethiopia','ethiopian','habesha','addis'],
    '😊': ['blush','smile','happy','pleased','shy'],
    '🤔': ['think','hmm','wonder','consider','doubt'],
    '😱': ['scream','shock','scared','fear','omg'],
    '🥳': ['party','celebrate','birthday','yay','woohoo'],
    '💀': ['dead','skull','death','rip','skeleton'],
    '👀': ['eyes','look','see','watch','stare'],
    '🫶': ['heart','hands','love','appreciate','together'],
    '💯': ['100','perfect','full','score','real'],
    '😭': ['cry','sob','weep','bawling','tears'],
    '🤣': ['rofl','lmao','laugh','hilarious','dying'],
  };

  const handleSuggestionClick = useCallback((word: string) => {
    const words = text.trim().split(/\s+/);
    let finalWord = word;
    // Auto-capitalize suggestion if at start of sentence
    if (autoCapitalization && (text === '' || text.trim().endsWith('.') || text.trim().endsWith('!') || text.trim().endsWith('?'))) {
      finalWord = word.charAt(0).toUpperCase() + word.slice(1);
    }

    if (words.length > 0 && words[words.length - 1] !== '' && text && !text.endsWith(' ')) {
      words[words.length - 1] = finalWord;
      updateText(words.join(' ') + ' ');
    } else {
      updateText(text + finalWord + ' ');
    }
  }, [text, updateText, autoCapitalization]);

  const handleNextWordClick = useCallback((word: string) => {
    updateText(text + word + ' ');
  }, [text, updateText]);

  /**
   * One keystroke of phonetic Amharic. Returns true when it handled the key.
   *
   * Each keystroke re-renders the whole word rather than appending to it,
   * which is what lets a vowel change the letter already on screen (s → ስ,
   * then "se" → ሰ) and lets backspace walk back through the Latin spelling
   * instead of deleting the syllable outright.
   */
  const handlePhoneticKey = useCallback((key: string): boolean => {
    const apply = (step: { replaceLast: number; insert: string; next: TranslitState }) => {
      const kept = step.replaceLast > 0 ? text.slice(0, text.length - step.replaceLast) : text;
      updateText(kept + step.insert);
      translitRef.current = step.next;
    };

    if (key === 'backspace') {
      const step = translitBackspace(translitRef.current);
      if (!step) return false; // Outside a word: let the normal backspace run.
      apply(step);
      return true;
    }

    if (key === 'enter') {
      translitRef.current = EMPTY_TRANSLIT;
      return false;
    }

    const char = key === 'space' ? ' ' : key;
    if (char.length !== 1) return false;

    // No auto-capitalisation here: a capital is meaningful in this scheme
    // (T is ጠ, S is ጸ), so it has to mean exactly what was typed.
    apply(translitPress(translitRef.current, shiftActive ? char.toUpperCase() : char));
    if (shiftActive) setShiftActive(false);
    return true;
  }, [text, updateText, shiftActive]);

  const handleKeyPress = useCallback((key: string) => {
    // Phonetic Amharic takes the letter keys over entirely; everything else
    // (symbols, the language key, voice) falls through to the handling below.
    if (language === 'amharic' && phonetic && !symbolsActive && handlePhoneticKey(key)) {
      playClickSound();
      doVibrate();
      return;
    }

    // Feedback
    doVibrate();
    playClickSound();

    // Ripple effect
    if (keyAnimations) {
      setRippleKey(key);
      setTimeout(() => setRippleKey(null), 400);
    }

    if (key === 'backspace') {
      const pos = cursorPos ?? text.length;
      if (pos > 0) {
        updateText(text.slice(0, pos - 1) + text.slice(pos));
        if (cursorPos !== null) setCursorPos(pos - 1);
      }
    } else if ((key === 'arrowleft' || key === 'arrowright' || key === 'arrowup' || key === 'arrowdown') && isIme && window.AkaiKeyboard?.moveCursor) {
      // In the Android keyboard the host app owns the cursor; move that one.
      window.AkaiKeyboard.moveCursor(key.slice(5));
    } else if (key === 'arrowleft') {
      const pos = cursorPos ?? text.length;
      setCursorPos(pos > 0 ? pos - 1 : 0);
    } else if (key === 'arrowright') {
      if (cursorPos !== null) {
        setCursorPos(cursorPos + 1 >= text.length ? null : cursorPos + 1);
      }
    } else if (key === 'arrowup') {
      setCursorPos(0);
    } else if (key === 'arrowdown') {
      setCursorPos(null);
    } else if (key === 'space') {
      const pos = cursorPos ?? text.length;
      const before = text.slice(0, pos);
      const after = text.slice(pos);
      const now = Date.now();
      const isQuickDoubleTap = now - lastSpaceTapRef.current < 350;
      const endsWithSingleSpace = before.length > 0 && before.endsWith(' ') && !before.endsWith('  ');
      const hasWordBeforeSpace = /\S $/.test(before);
      if (doubleSpacePeriod && isQuickDoubleTap && endsWithSingleSpace && hasWordBeforeSpace) {
        updateText(before.slice(0, -1) + '. ' + after);
        if (cursorPos !== null) setCursorPos(pos + 1);
        lastSpaceTapRef.current = 0;
      } else {
        updateText(before + ' ' + after);
        if (cursorPos !== null) setCursorPos(pos + 1);
        lastSpaceTapRef.current = now;
      }
    } else if (key === 'enter') {
      const pos = cursorPos ?? text.length;
      updateText(text.slice(0, pos) + '\n' + text.slice(pos));
      if (cursorPos !== null) setCursorPos(pos + 1);
    } else if (key === 'shift') {
      setShiftActive(!shiftActive);
    } else if (key === 'symbols') {
      setSymbolsActive(!symbolsActive);
      setShiftActive(false);
      setSelectedConsonant(null);
    } else if (key === 'language') {
      // Without this the key id falls through to the text branch below and
      // literally types "language" instead of switching script.
      setLanguage(l => l === 'english' ? 'amharic' : 'english');
      setShiftActive(false);
      setSymbolsActive(false);
      setSelectedConsonant(null);
      setCursorPos(null);
    } else if (key === 'voice') {
      startVoiceRecognition();
    } else {
      let char = key;
      // Auto-capitalisation only applies when typing at the end of text
      if (autoCapitalization && cursorPos === null && char.length === 1 && char.match(/[a-z]/)) {
        const trimmed = text.trim();
        const shouldCap = text === '' ||
                         trimmed.endsWith('.') ||
                         trimmed.endsWith('!') ||
                         trimmed.endsWith('?') ||
                         text.endsWith('\n');
        if (shouldCap) {
          char = char.toUpperCase();
        }
      } else if (shiftActive && key.length === 1 && key.match(/[a-z]/)) {
        char = key.toUpperCase();
      }

      const pos = cursorPos ?? text.length;
      let insertedText = char;
      // Auto-space after punctuation
      if (autoSpaceAfterPunctuation && key.length === 1 && ['.','!','?',';',':'].includes(key)) {
        insertedText = char + ' ';
      }
      updateText(text.slice(0, pos) + insertedText + text.slice(pos));
      if (cursorPos !== null) setCursorPos(pos + insertedText.length);
      if (shiftActive) setShiftActive(false);
    }
  }, [text, cursorPos, shiftActive, symbolsActive, updateText, autoSpaceAfterPunctuation, autoCapitalization, playClickSound, doVibrate, doubleSpacePeriod, startVoiceRecognition, language, phonetic, handlePhoneticKey, keyAnimations, isIme]);

  const handleAmharicPress = useCallback((consonant: string) => {
    const vowels = AMHARIC_VOWELS[consonant];
    if (vowels && vowels.length > 0) {
      setSelectedConsonant(consonant);
      updateText(text + vowels[0]);
    }
    doVibrate();
    playClickSound();
    if (keyAnimations) {
      setRippleKey(consonant);
      setTimeout(() => setRippleKey(null), 400);
    }
  }, [text, updateText, doVibrate, playClickSound, keyAnimations]);

  const handleVowelSelect = useCallback((vowel: string) => {
    const lastChar = text.slice(-1);
    const currentConsonant = selectedConsonant;
    if (currentConsonant && AMHARIC_VOWELS[currentConsonant]?.includes(lastChar)) {
      updateText(text.slice(0, -1) + vowel);
    } else {
      updateText(text + vowel);
    }
  }, [text, selectedConsonant, updateText]);

  // The alternates a long press reveals. In Amharic that is the key's whole
  // vowel family, so a consonant can be typed in any order with one gesture
  // instead of committing the base form first and then correcting it from the
  // vowel row — the gesture the best-reviewed Ge'ez keyboards are praised for.
  const alternatesFor = useCallback((key: string): string[] | undefined => {
    if (language === 'amharic') return AMHARIC_VOWELS[key];
    return LONG_PRESS_ALTERNATES[key];
  }, [language]);

  // A vowel family is eight keys wide — almost the width of the board — so a
  // popup centred on a key near either edge would hang off screen. Anchor it
  // to whichever edge it is closest to instead.
  const popupAnchor = (index: number, rowLength: number) => {
    if (index <= 1) return 'left-0';
    if (index >= rowLength - 2) return 'right-0';
    return 'left-1/2 -translate-x-1/2';
  };

  // Change 1: Long press handlers
  const handlePointerDown = useCallback((key: string) => {
    if (!keyPopupOnLongPress) return;
    if (!alternatesFor(key)) return;
    longPressTimerRef.current = setTimeout(() => {
      setLongPressKey(key);
    }, LONG_PRESS_MS[longPressDelay]);
  }, [keyPopupOnLongPress, alternatesFor, longPressDelay]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleAlternateSelect = useCallback((alt: string) => {
    updateText(text + alt);
    // In Amharic the popup is a vowel family, so remember which consonant it
    // came from: the vowel row below then stays in sync with what was typed.
    if (language === 'amharic') {
      const base = Object.keys(AMHARIC_VOWELS).find(c => AMHARIC_VOWELS[c].includes(alt));
      if (base) setSelectedConsonant(base);
    }
    setLongPressKey(null);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [text, updateText, language]);

  // ─── Handwriting Canvas ─────────────────────────────────────────────
  const redrawCanvas = useCallback((paths: { x: number; y: number }[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    paths.forEach(path => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        const midX = (path[i - 1].x + path[i].x) / 2;
        const midY = (path[i - 1].y + path[i].y) / 2;
        ctx.quadraticCurveTo(path[i - 1].x, path[i - 1].y, midX, midY);
      }
      ctx.stroke();
    });
  }, [strokeColor, strokeWidth]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    setCurrentPath([{ x, y }]);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    setCurrentPath(prev => {
      const newPath = [...prev, { x, y }];
      if (prev.length > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const lastPoint = prev[prev.length - 1];
        const midX = (lastPoint.x + x) / 2;
        const midY = (lastPoint.y + y) / 2;
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
        ctx.stroke();
      }
      return newPath;
    });
  }, [isDrawing, strokeColor, strokeWidth]);

  const stopDrawing = useCallback(() => {
    if (currentPath.length > 0) {
      setHwUndoStack(prev => [...prev, drawingPaths]);
      setHwRedoStack([]);
      const newPaths = [...drawingPaths, currentPath];
      setDrawingPaths(newPaths);
      setHwStrokes(newPaths.length);
      if (hwAutoRecognize && newPaths.length > 0) {
        if (hwRecognizeTimerRef.current) clearTimeout(hwRecognizeTimerRef.current);
        hwRecognizeTimerRef.current = setTimeout(() => {
          recognizeHandwriting();
        }, 1500);
      }
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [currentPath, drawingPaths, hwAutoRecognize]);

  const undoHwStroke = useCallback(() => {
    if (hwUndoStack.length === 0) return;
    const prev = hwUndoStack[hwUndoStack.length - 1];
    setHwUndoStack(s => s.slice(0, -1));
    setHwRedoStack(r => [...r, drawingPaths]);
    setDrawingPaths(prev);
    redrawCanvas(prev);
    setHwStrokes(prev.length);
  }, [hwUndoStack, drawingPaths, redrawCanvas]);

  const redoHwStroke = useCallback(() => {
    if (hwRedoStack.length === 0) return;
    const next = hwRedoStack[hwRedoStack.length - 1];
    setHwRedoStack(r => r.slice(0, -1));
    setHwUndoStack(u => [...u, drawingPaths]);
    setDrawingPaths(next);
    redrawCanvas(next);
    setHwStrokes(next.length);
  }, [hwRedoStack, drawingPaths, redrawCanvas]);

  // AI-powered handwriting recognition
  const recognizeHandwriting = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || drawingPaths.length === 0) return;

    setHwRecognizing(true);
    try {
      const imageData = canvas.toDataURL('image/png');
      const res = await fetch(`${getApiBaseUrl()}/api/handwriting-recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, language }),
      });

      if (res.ok) {
        const data = await res.json();
        const chars = data.characters || [];
        const words = data.words || [];
        const sentences = data.sentences || [];

        setHwSuggestions(chars);
        setHwWordSuggestions(words);
        setHwSentenceSuggestions(sentences);
        if (chars.length > 0) setSelectedHwSuggestion(chars[0]);
        else if (words.length > 0) setSelectedHwSuggestion(words[0]);
        else if (sentences.length > 0) setSelectedHwSuggestion(sentences[0]);
      } else {
        const fallbackChars = language === 'english'
          ? ['a','e','i','o','u','n','s','t'].sort(() => Math.random() - 0.5).slice(0, 5)
          : ['ሀ','ለ','መ','ሰ','በ','ወ','ነ','ገ'].sort(() => Math.random() - 0.5).slice(0, 5);
        setHwSuggestions(fallbackChars);
        if (fallbackChars.length > 0) setSelectedHwSuggestion(fallbackChars[0]);
      }
    } catch {
      const fallbackChars = language === 'english'
        ? ['a','b','c','d','e'].sort(() => Math.random() - 0.5).slice(0, 5)
        : ['ሀ','ለ','መ','ሰ','በ'].sort(() => Math.random() - 0.5).slice(0, 5);
      setHwSuggestions(fallbackChars);
      if (fallbackChars.length > 0) setSelectedHwSuggestion(fallbackChars[0]);
    } finally {
      setHwRecognizing(false);
    }
  }, [drawingPaths.length, language]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHwUndoStack([]);
    setHwRedoStack([]);
    setDrawingPaths([]);
    setCurrentPath([]);
    setHwSuggestions([]);
    setHwWordSuggestions([]);
    setHwSentenceSuggestions([]);
    setSelectedHwSuggestion(null);
    setHwStrokes(0);
  }, []);

  const confirmHwSuggestion = useCallback(() => {
    if (selectedHwSuggestion) {
      const separator = text.length > 0 && !text.endsWith(' ') ? ' ' : '';
      updateText(text + separator + selectedHwSuggestion);
      clearCanvas();
    }
  }, [selectedHwSuggestion, text, updateText, clearCanvas]);

  // ─── Translation ────────────────────────────────────────────────────
  const handleTranslate = useCallback(async () => {
    if (!translateInput.trim()) return;
    setIsTranslating(true);
    try {
      const sourceLang = translateFrom === 'English' ? 'English' : 'Amharic';
      const targetLang = translateFrom === 'English' ? 'Amharic' : 'English';
      const response = await fetch(`${getApiBaseUrl()}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: translateInput, sourceLang, targetLang }),
      });
      const data = await response.json();
      setTranslateOutput(data.translation || 'Translation failed.');
    } catch {
      setTranslateOutput('Error connecting to translation service.');
    } finally {
      setIsTranslating(false);
    }
  }, [translateInput, translateFrom]);

  const handleUseTranslation = useCallback(() => {
    if (translateOutput) updateText(text + translateOutput + ' ');
  }, [text, translateOutput, updateText]);

  // Change 3: Language toggle handler (now from keyboard row)
  const handlePhoneticToggle = () => {
    setPhonetic(p => !p);
    setSelectedConsonant(null);
    setShiftActive(false);
    translitRef.current = EMPTY_TRANSLIT;
  };

  const handleLanguageToggle = () => {
    translitRef.current = EMPTY_TRANSLIT;
    setLanguage(l => l === 'english' ? 'amharic' : 'english');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomBgFile(event.target?.result as string);
        setTheme('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLanguageToggleEffect = useCallback(() => {
    setSelectedConsonant(null);
    setSymbolsActive(false);
    if (mode !== 'keyboard') setMode('keyboard');
  }, [mode]);

  const renderEnglishKey = (key: string) => {
    const isSpecial = ['shift', 'backspace', 'symbols', 'space', 'enter', 'language', 'voice', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key);
    const isWide = key === 'space';
    const isMedium = key === 'shift' || key === 'backspace' || key === 'symbols' || key === 'enter' || key === 'language' || key === 'voice';
    let displayKey = key;
    if (key === 'backspace') displayKey = '⌫';
    if (key === 'symbols') displayKey = symbolsActive ? (language === 'amharic' ? 'አማ' : 'ABC') : (language === 'amharic' ? '፩፪' : '?123');
    if (key === 'space') displayKey = language === 'amharic' ? 'አማርኛ' : 'English';
    if (key === 'enter') displayKey = '↵';
    if (key === 'language') displayKey = language === 'english' ? '🌐 አማ' : '🌐 EN';
    if (key === 'arrowleft') displayKey = '◀';
    if (key === 'arrowright') displayKey = '▶';
    if (key === 'arrowup') displayKey = '▲';
    if (key === 'arrowdown') displayKey = '▼';
    if (shiftActive && !isSpecial && key.length === 1 && key.match(/[a-z]/)) displayKey = key.toUpperCase();
    const isHovered = hoveredKey === key;
    const isLongPressed = longPressKey === key;
    const isRippled = rippleKey === key;

    return (
      <motion.button
        key={key}
        whileTap={{ scale: 0.93, y: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22, mass: 0.5 }}
        onMouseEnter={() => !isIme && setHoveredKey(key)}
        onMouseLeave={() => { !isIme && setHoveredKey(null); handlePointerUp(); }}
        onClick={() => {
          if (key === 'space') {
            const held = Date.now() - ((window as any).__spaceDown || 0);
            if (held > 600 || spaceWasSwipedRef.current) {
              // voice recognition or cursor swipe — don't insert space
            } else {
              handleKeyPress(key);
            }
            spaceWasSwipedRef.current = false;
          } else {
            handleKeyPress(key);
          }
        }}
        onPointerDown={(e) => {
          if (key === 'space') {
            (window as any).__spaceDown = Date.now();
            if (spacebarCursorControl) spaceSwipeRef.current = { x: e.clientX, y: e.clientY };
          }
          handlePointerDown(key);
        }}
        onPointerMove={key === 'space' && spacebarCursorControl ? (e) => {
          if (!spaceSwipeRef.current) return;
          const dx = e.clientX - spaceSwipeRef.current.x;
          if (Math.abs(dx) > 8) {
            const delta = Math.sign(dx);
            spaceSwipeRef.current = { x: e.clientX, y: spaceSwipeRef.current.y };
            spaceWasSwipedRef.current = true;
            if (isIme && window.AkaiKeyboard?.moveCursor) {
              window.AkaiKeyboard.moveCursor(delta < 0 ? 'left' : 'right');
              return;
            }
            setCursorPos(prev => {
              const p = prev ?? text.length;
              const newP = p + delta;
              if (newP <= 0) return 0;
              if (newP >= text.length) return null;
              return newP;
            });
          }
        } : undefined}
        onPointerUp={(e) => {
          if (key === 'space') {
            const held = Date.now() - ((window as any).__spaceDown || 0);
            if (held > 600) {
              startVoiceRecognition();
              (window as any).__spaceDown = 0;
            }
            spaceSwipeRef.current = null;
          }
          handlePointerUp();
        }}
        className={`
          relative flex items-center justify-center ${KEY_SHAPE_CLASS[keyShape]} ${KEY_FONT_CLASS[keyFontWeight]} text-xs
          transition-all duration-75 select-none overflow-visible
          ${isWide ? 'flex-[3.5]' : isMedium ? 'flex-[1.4]' : 'flex-1'} ${kbKeyHeight}
          ${!isIme && isHovered ? `${t.keyHover} shadow-md` : ''}
          ${isSpecial
            ? `${t.specialKey} ${t.keyText}`
            : `${t.key} ${t.keyText} ${showKeyBorders ? `${t.border} border` : ''} shadow-sm`}
          active:brightness-90
        `}
        style={customKeyStyle}
      >
        {/* Press glow: soft accent halo that blooms out and fades */}
        {isRippled && (
          <motion.span
            initial={{ scale: 0.4, opacity: 0.55 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
            className={`absolute inset-0 rounded-xl ${t.accent} pointer-events-none blur-[2px]`}
            style={{ mixBlendMode: 'screen' }}
          />
        )}
        {/* Press flash: quick bright pulse right at contact */}
        {isRippled && (
          <motion.span
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 rounded-xl bg-white pointer-events-none"
          />
        )}
        {key === 'shift' && <ArrowUp className={`w-4 h-4 ${shiftActive ? 'text-yellow-500' : ''}`} />}
        {key === 'backspace' && <Delete className="w-4 h-4" />}
        {key === 'enter' && <CornerDownLeft className="w-4 h-4" />}
        {key === 'voice' && (isListening ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />)}
        {key === 'language' && <span className="text-[10px] font-bold">{displayKey}</span>}
        {key !== 'shift' && key !== 'backspace' && key !== 'enter' && key !== 'language' && key !== 'voice' && (
          <motion.span
            animate={isRippled ? { scale: [1, 1.22, 1] } : { scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={isWide ? 'text-xs' : KEY_TEXT_CLASS[keyTextSize]}
          >
            {displayKey}
          </motion.span>
        )}
        {/* Spacebar: listening indicator */}
        {key === 'space' && isListening && (
          <span className="absolute right-2 text-red-400 animate-pulse"><Mic className="w-3 h-3" /></span>
        )}
        {/* Symbol hint for long press */}
        {showKeyHints && language === 'english' && !isSpecial && LONG_PRESS_ALTERNATES[key] && (
          <span className="absolute top-0.5 right-1 text-[7px] opacity-40 font-bold pointer-events-none">
            {LONG_PRESS_ALTERNATES[key][0]}
          </span>
        )}
        {/* Change 1: Long press popup */}
        {isLongPressed && alternatesFor(key) && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className={`absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 ${t.card} ${t.border} border rounded-lg shadow-2xl p-1 z-50 flex gap-0.5 min-w-max`}
          >
            {alternatesFor(key)!.map((alt, i) => (
              <motion.div
                key={i}
                role="button"
                tabIndex={0}
                whileHover={{ scale: 1.1, y: -1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleAlternateSelect(alt); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleAlternateSelect(alt); } }}
                className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-medium ${t.key} ${t.keyText} ${t.keyHover} ${t.border} border shadow-sm cursor-pointer`}
              >
                {alt}
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.button>
    );
  };

  // ─── Render Panels ─────────────────────────────────────────────────
  const renderSuggestions = () => {
    const showWotd = showWordOfTheDay && suggestions.length === 0 && nextWordSuggestions.length === 0 && text === '';
    const dayIndex = new Date().getDate() % 5;
    const wotd = language === 'english' ? WORD_OF_THE_DAY_EN[dayIndex] : WORD_OF_THE_DAY_AM[dayIndex];

    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto scrollbar-hide">
        {suggestions.length > 0 && suggestions.map((word, i) => (
          <motion.button
            key={`sug-${i}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSuggestionClick(word)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${t.suggestion} ${t.keyText} hover:opacity-80 transition-opacity`}
          >
            {word}
          </motion.button>
        ))}
        {nextWordSuggestions.length > 0 && (
          <>
            <div className={`w-px h-5 ${t.border}`} />
            {nextWordSuggestions.slice(0, 3).map((word, i) => (
              <motion.button
                key={`next-${i}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNextWordClick(word)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-70 ${t.suggestion} ${t.keyText} hover:opacity-100 transition-opacity`}
              >
                {word}
              </motion.button>
            ))}
          </>
        )}
        {showWotd && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-2"
          >
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.accent} ${t.accentText}`}>Word of the Day</span>
            <span className={`text-xs font-medium ${t.keyText}`}>{wotd.word}</span>
            <span className={`text-[10px] ${t.keyText} opacity-40 italic`}>- {wotd.definition}</span>
          </motion.div>
        )}
        {!showWotd && suggestions.length === 0 && nextWordSuggestions.length === 0 && (
          <span className="text-[10px] text-muted-foreground/50 px-2">
            {language === 'english' ? 'Start typing for suggestions...' : 'ጽፍ ጥቆማ ለማግኘት...'}
          </span>
        )}
      </div>
    );
  };

  const renderAmharicVowelRow = () => {
    if (language !== 'amharic' || !selectedConsonant) return null;
    const vowels = AMHARIC_VOWELS[selectedConsonant] || [];
    
    return (
      <div className={`overflow-x-auto no-scrollbar border-b py-2 px-1 ${t.border}`}
        style={{ 
          // No backdrop blur: over a live wallpaper it would be recomputed
          // every frame. A darker tint does the same job for legibility.
          backgroundColor: 'rgba(0,0,0,0.62)',
          minHeight: '52px' // Prevents height flickering
        }}>
        <div className="flex gap-1.5 px-1 min-w-max">
          {vowels.map((v, i) => (
            <motion.button
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleVowelSelect(v)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm transition-all
                ${t.key} ${t.keyText} ${t.border} border hover:scale-105 active:scale-95`}
            >
              {v}
            </motion.button>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedConsonant(null)}
            className={`w-10 h-10 p-0 rounded-xl ${t.keyText}`}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  // Change 2: Stickers with recent emojis, search, favorites
  const renderStickers = () => {
    const category = activeStickerCategory === 'recent'
      ? { id: 'recent', name: 'Recent', icon: '🕐', stickers: recentEmojis }
      : activeStickerCategory === 'favorites'
        ? { id: 'favorites', name: 'Favorites', icon: '⭐', stickers: favoriteEmojis }
        : STICKER_CATEGORIES.find(c => c.id === activeStickerCategory);

    const displayEmojis = category?.stickers || [];
    const filteredEmojis = getFilteredEmojis(displayEmojis);

    const allCategories = [
      ...(recentEmojis.length > 0 ? [{ id: 'recent', name: 'Recent', icon: '🕐', stickers: recentEmojis }] : []),
      ...(favoriteEmojis.length > 0 ? [{ id: 'favorites', name: 'Favorites', icon: '⭐', stickers: favoriteEmojis }] : []),
      ...STICKER_CATEGORIES.filter(c => c.id !== 'recent'),
    ];

    return (
      <div className="flex flex-col h-full">
        {/* Predictive emoji bar */}
        {emojiBarVisible && contextEmojiSuggestions.length > 0 && (
          <div className="shrink-0 flex gap-1.5 px-3 py-2 border-b overflow-x-auto"
            style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)' }}>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-50 self-center mr-1 shrink-0">
              {language === 'english' ? 'Suggest' : 'ጠቃሚ'}
            </span>
            {contextEmojiSuggestions.map((emoji, i) => (
              <motion.button key={`ctx-${i}`} whileHover={{ scale: 1.2, y: -2 }} whileTap={{ scale: 0.9 }}
                onClick={() => { updateText(text + emoji); addRecentEmoji(emoji); }}
                className="text-xl px-1.5 py-0.5 rounded-lg hover:bg-white/10 transition-all shrink-0">
                {emoji}
              </motion.button>
            ))}
          </div>
        )}

        {/* Search bar */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b" style={{ background: 'rgba(0,0,0,0.1)' }}>
          <Search className={`w-3.5 h-3.5 ${t.keyText} opacity-50 shrink-0`} />
          <input
            type="text"
            value={emojiSearchQuery}
            onChange={e => setEmojiSearchQuery(e.target.value)}
            placeholder={language === 'english' ? 'Search emojis...' : 'ፈልግ ሺሸንፎችን...'}
            className={`flex-1 bg-transparent text-xs outline-none ${t.keyText} placeholder:opacity-30`}
          />
          {emojiSearchQuery && (
            <button onClick={() => setEmojiSearchQuery('')} className="opacity-50 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide border-b border-border/30">
          {allCategories.map(cat => (
            <motion.button key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveStickerCategory(cat.id); setEmojiSearchQuery(''); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeStickerCategory === cat.id ? `${t.tabActive} ${t.tabActiveText} shadow-sm` : `${t.suggestion} ${t.keyText}`}`}>
              <span>{cat.icon}</span><span>{cat.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="flex-1 p-2 overflow-y-auto">
          {activeStickerCategory === 'recent' && recentEmojis.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${t.keyText} opacity-50`}>
              <Clock className="w-6 h-6 mb-2 opacity-40" />
              <span className="text-xs">No recent emojis yet</span>
            </div>
          ) : activeStickerCategory === 'favorites' && favoriteEmojis.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${t.keyText} opacity-50`}>
              <Star className="w-6 h-6 mb-2 opacity-40" />
              <span className="text-xs">Tap ⭐ on any emoji to add to favorites</span>
            </div>
          ) : filteredEmojis.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${t.keyText} opacity-50`}>
              <span className="text-xs">No emojis found</span>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-1.5">
              {filteredEmojis.map((sticker, i) => {
                const isFav = favoriteEmojis.includes(sticker);
                return (
                  <motion.div key={`${activeStickerCategory}-${i}`} className="relative group" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}>
                    <button
                      onClick={() => { updateText(text + sticker); addRecentEmoji(sticker); }}
                      className={`flex items-center justify-center p-1.5 rounded-xl w-full ${t.key} ${t.border} border shadow-sm text-xl aspect-square`}>
                      {sticker}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavoriteEmoji(sticker); }}
                      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] transition-all opacity-0 group-hover:opacity-100 ${isFav ? 'opacity-100 bg-amber-500/90 text-white' : 'bg-black/60 text-white/60 hover:text-amber-400'}`}>
                      {isFav ? '★' : '☆'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGifs = () => (
    <Suspense fallback={null}>
      <KeyboardGifsPanel
        t={t}
        text={text}
        giphyQuery={giphyQuery}
        setGiphyQuery={setGiphyQuery}
        giphyLoading={giphyLoading}
        giphyResults={giphyResults}
        activeGifCategory={activeGifCategory}
        updateText={updateText}
        addRecentEmoji={addRecentEmoji}
      />
    </Suspense>
  );

  const renderClipboard = () => (
    <Suspense fallback={null}>
      <KeyboardClipboardPanel
        t={t}
        text={text}
        clipboardItems={clipboardItems}
        setClipboardItems={setClipboardItems}
        updateText={updateText}
      />
    </Suspense>
  );

  const renderTranslate = () => (
    <Suspense fallback={null}>
      <KeyboardTranslatePanel
        t={t}
        translateFrom={translateFrom}
        setTranslateFrom={setTranslateFrom}
        translateInput={translateInput}
        setTranslateInput={setTranslateInput}
        translateOutput={translateOutput}
        setTranslateOutput={setTranslateOutput}
        isTranslating={isTranslating}
        handleTranslate={handleTranslate}
        handleUseTranslation={handleUseTranslation}
      />
    </Suspense>
  );

  const renderHandwriting = () => (
    <Suspense fallback={null}>
      <KeyboardHandwritingPanel
        t={t}
        language={language}
        text={text}
        updateText={updateText}
        customAccentStyle={customAccentStyle}
        canvasRef={canvasRef}
        drawingPaths={drawingPaths}
        hwUndoStack={hwUndoStack}
        hwRedoStack={hwRedoStack}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        hwAutoRecognize={hwAutoRecognize}
        setHwAutoRecognize={setHwAutoRecognize}
        hwStrokes={hwStrokes}
        hwRecognizing={hwRecognizing}
        hwSuggestions={hwSuggestions}
        hwWordSuggestions={hwWordSuggestions}
        hwSentenceSuggestions={hwSentenceSuggestions}
        selectedHwSuggestion={selectedHwSuggestion}
        setSelectedHwSuggestion={setSelectedHwSuggestion}
        startDrawing={startDrawing}
        draw={draw}
        stopDrawing={stopDrawing}
        undoHwStroke={undoHwStroke}
        redoHwStroke={redoHwStroke}
        recognizeHandwriting={recognizeHandwriting}
        clearCanvas={clearCanvas}
        confirmHwSuggestion={confirmHwSuggestion}
      />
    </Suspense>
  );

  // Change 6: Settings panel (NO theme picker - themes are in themes button)
  // Every preference the settings panel can change, with its setter. Keeping
  // them in one table is what lets the panel take a single object and lets
  // "Reset to defaults" reach all of them.
  const prefs: KeyboardPrefs = {
    keyboardHeight, keyboardSpacing, keyTextSize, oneHandedMode, desktopView,
    englishLayout, amharicLayout,
    showSuggestionBar, showWordOfTheDay, showNumberRow, showKeyHints, showMicKey,
    toolbarStyle, visibleButtons, showCursorRow,
    keyShape, keyFontWeight, showKeyBorders,
    autoCapitalization, doubleSpacePeriod, autoSpaceAfterPunctuation, keyPopupOnLongPress, longPressDelay,
    spacebarCursorControl,
    vibrateOnKeyPress, hapticLevel, soundOnKeyPress, soundVolume, keyAnimations,
  };
  const prefSetters: { [K in keyof KeyboardPrefs]: (v: KeyboardPrefs[K]) => void } = {
    keyboardHeight: setKeyboardHeight, keyboardSpacing: setKeyboardSpacing, keyTextSize: setKeyTextSize,
    oneHandedMode: setOneHandedMode, desktopView: setDesktopView,
    englishLayout: setEnglishLayout, amharicLayout: setAmharicLayout,
    showSuggestionBar: setShowSuggestionBar, showWordOfTheDay: setShowWordOfTheDay, showNumberRow: setShowNumberRow,
    showKeyHints: setShowKeyHints, showMicKey: setShowMicKey,
    toolbarStyle: setToolbarStyle, visibleButtons: setVisibleButtons, showCursorRow: setShowCursorRow,
    keyShape: setKeyShape, keyFontWeight: setKeyFontWeight, showKeyBorders: setShowKeyBorders,
    autoCapitalization: setAutoCapitalization, doubleSpacePeriod: setDoubleSpacePeriod,
    autoSpaceAfterPunctuation: setAutoSpaceAfterPunctuation, keyPopupOnLongPress: setKeyPopupOnLongPress,
    longPressDelay: setLongPressDelay, spacebarCursorControl: setSpacebarCursorControl,
    vibrateOnKeyPress: setVibrateOnKeyPress, hapticLevel: setHapticLevel, soundOnKeyPress: setSoundOnKeyPress,
    soundVolume: setSoundVolume, keyAnimations: setKeyAnimations,
  };
  const setPref = <K extends keyof KeyboardPrefs>(key: K, value: KeyboardPrefs[K]) => {
    prefSetters[key](value);
  };
  const resetPrefs = () => {
    (Object.keys(DEFAULT_PREFS) as (keyof KeyboardPrefs)[]).forEach(key => {
      // Each key is paired with its own setter, which TypeScript cannot see
      // through a loop over the union of keys.
      (prefSetters[key] as (v: unknown) => void)(DEFAULT_PREFS[key]);
    });
  };

  const renderSettings = () => (
    <Suspense fallback={null}>
      <KeyboardSettingsPanel
        t={t}
        prefs={prefs}
        setPref={setPref}
        isIme={isIme}
        previewHaptic={vibrateAt}
        previewSound={playClick}
        onOpenThemes={() => handleModeChange('themes')}
        onReset={resetPrefs}
      />
    </Suspense>
  );

  // ─── Full-Screen Theme Picker ────────────────────────────────────────
  // Stable identities so the memoised ThemeCard actually skips re-rendering.
  const handleSelectTheme = useCallback((key: string) => {
    setTheme(key);
    setMode('keyboard');
  }, []);

  const handleDeleteCustomTheme = useCallback((key: string) => {
    setCustomThemes(prev => prev.filter(ct => `custom_${ct.id}` !== key));
    setTheme(prev => (prev === key ? 'default' : prev));
  }, []);

  const renderThemePickerPanel = () => {
    const filteredThemes = Object.entries(allThemes).filter(([key, tData]) => {
      if (themeCategory === 'all') return true;
      if (themeCategory === 'solid') return tData.category === 'solid';
      if (themeCategory === 'live') return tData.category === 'live';
      if (themeCategory === 'culture') return tData.category === 'culture';
      if (themeCategory === 'faith') return tData.category === 'faith';
      if (themeCategory === 'football') return tData.category === 'football';
      if (themeCategory === 'custom') return key.startsWith('custom_');
      return true;
    });


    // Grouped sections for 'All' view
    const SECTION_ORDER = [
      { key: 'faith', label: '✝️☪️ Faith', emoji: '🕍' },
      { key: 'culture', label: '🇪🇹 Culture & Heritage', emoji: '🏛️' },
      { key: 'football', label: '⚽ Football Clubs', emoji: '⚽' },
      { key: 'live', label: '⚡ Premium Live', emoji: '✨' },
      { key: 'solid', label: '🎨 Solid Colors', emoji: '🎨' },
    ];

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
          <span className={`text-sm font-bold ${t.keyText}`}>🎨 Themes</span>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { fileInputRef.current?.click(); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium ${t.accent} ${t.accentText}`}
            >
              <ImagePlus className="w-3 h-3" />Upload
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowCustomCreator(true); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium ${t.suggestion} ${t.keyText}`}
            >
              <Plus className="w-3 h-3" />Create
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMode('keyboard')}
              className={`${t.keyText} opacity-50 hover:opacity-100`}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Category tabs */}
        <div className={`flex gap-1 px-2 py-1.5 border-b ${t.border} overflow-x-auto scrollbar-hide`}>
          {(['all', 'faith', 'culture', 'football', 'live', 'solid', 'custom'] as const).map(cat => (
            <motion.button key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setThemeCategory(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold capitalize transition-all whitespace-nowrap ${
                themeCategory === cat ? `${t.tabActive} ${t.tabActiveText} shadow-sm` : `${t.suggestion} ${t.keyText}`
              }`}
            >
              {cat === 'all' ? '✨ All' : cat === 'faith' ? '✝️☪️ Faith' : cat === 'culture' ? '🇪🇹 Culture' : cat === 'football' ? '⚽ Football' : cat === 'solid' ? '🎨 Solid' : cat === 'live' ? '⚡ Live' : '🖌️ Custom'}
            </motion.button>
          ))}
        </div>

        {/* Custom Theme Creator */}
        <AnimatePresence>
          {showCustomCreator && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b"
              style={{ borderColor: 'rgba(128,128,128,0.2)' }}
            >
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${t.keyText}`}>Create Custom Theme</span>
                  <button onClick={() => setShowCustomCreator(false)} className="opacity-50 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                </div>
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="Theme name" className={`w-full px-2 py-1.5 rounded-lg text-xs ${t.card} ${t.border} border ${t.keyText} outline-none`} />
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'Background', value: customBgColor, set: setCustomBgColor },
                    { label: 'Keys', value: customKeyColor, set: setCustomKeyColor },
                    { label: 'Text', value: customKeyTextColor, set: setCustomKeyTextColor },
                    { label: 'Accent', value: customAccentColor, set: setCustomAccentColor },
                    { label: 'Special', value: customSpecialKeyColor, set: setCustomSpecialKeyColor },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <label className={`text-[8px] ${t.keyText} opacity-60`}>{label}</label>
                      <input type="color" value={value} onChange={e => set(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                    </div>
                  ))}
                </div>
                <input type="text" value={customBgImageUrl} onChange={e => setCustomBgImageUrl(e.target.value)}
                  placeholder="Background image URL (optional)" className={`w-full px-2 py-1.5 rounded-lg text-[10px] ${t.card} ${t.border} border ${t.keyText} outline-none`} />
                <input type="text" value={customBgGifUrl} onChange={e => setCustomBgGifUrl(e.target.value)}
                  placeholder="Background GIF URL (optional)" className={`w-full px-2 py-1.5 rounded-lg text-[10px] ${t.card} ${t.border} border ${t.keyText} outline-none`} />
                {/* Preview */}
                <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: customBgColor, height: 48 }}>
                  <div className="flex items-center justify-center gap-1 p-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: customKeyColor }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: customAccentColor }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: customSpecialKeyColor }} />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateCustomTheme}
                  className={`w-full py-1.5 rounded-lg text-xs font-medium ${t.accent} ${t.accentText}`}
                >
                  💾 Save &amp; Apply Theme
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Themes grid / grouped view */}
        <div className="flex-1 p-2 overflow-y-auto max-h-[350px] space-y-4">
          {themeCategory === 'custom' && customThemes.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${t.keyText} opacity-50`}>
              <span className="text-2xl mb-2">🎨</span>
              <span className="text-xs">No custom themes yet</span>
              <span className="text-[10px] mt-1">Click &quot;Create&quot; to make one</span>
            </div>
          ) : themeCategory === 'all' ? (
            // Grouped by category
            <>
              {SECTION_ORDER.map(section => {
                const sectionThemes = Object.entries(allThemes).filter(([, td]) => td.category === section.key);
                if (sectionThemes.length === 0) return null;
                return (
                  <ThemeSection
                    key={section.key}
                    label={section.label}
                    themes={sectionThemes}
                    t={t}
                    selectedTheme={theme}
                    onSelect={handleSelectTheme}
                    onDelete={handleDeleteCustomTheme}
                  />
                );
              })}
              {/* Custom section */}
              {customThemes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${t.keyText} opacity-40`}>🖌️ My Themes</span>
                    <div className={`flex-1 h-px ${t.border} opacity-30`} />
                    <span className={`text-[9px] ${t.keyText} opacity-30`}>{customThemes.length}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {customThemes.map(ct => {
                      const key = `custom_${ct.id}`;
                      return <ThemeCard key={key} tKey={key} tData={allThemes[key]} t={t} isSelected={theme === key} customBgColor={ct.bgColor} onSelect={handleSelectTheme} onDelete={handleDeleteCustomTheme} />;
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {filteredThemes.map(([key, tData]) => (
                <ThemeCard
                  key={key}
                  tKey={key}
                  tData={tData}
                  t={t}
                  isSelected={theme === key}
                  customBgColor={key.startsWith('custom_') ? customThemes.find(c => `custom_${c.id}` === key)?.bgColor : undefined}
                  onSelect={handleSelectTheme}
                  onDelete={handleDeleteCustomTheme}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVowelRow = () => {
    if (language !== 'amharic' || !selectedConsonant) return null;
    const vowels = AMHARIC_VOWELS[selectedConsonant];
    if (!vowels || vowels.length <= 1) return null;
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="flex gap-1 justify-center overflow-hidden"
      >
        <span className={`flex items-center text-[9px] ${t.keyText} opacity-40 mr-0.5`}>ድምፅ</span>
        {vowels.map((v, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.08, y: -1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVowelSelect(v)}
            className={`flex items-center justify-center flex-1 h-9 rounded-lg text-sm font-medium transition-colors
              ${text.endsWith(v) ? `${t.accent} ${t.accentText}` : `${t.key} ${t.keyText} ${t.keyHover}`}
              ${t.border} border shadow-sm`}
            style={customKeyStyle}
          >
            {v}
          </motion.button>
        ))}
      </motion.div>
    );
  };

  // ─── Panel transition direction (Change 7) ─────────────────────────
  const modeOrder: KeyboardMode[] = ['keyboard', 'stickers', 'gifs', 'clipboard', 'translate', 'handwriting', 'settings', 'themes'];
  const getPanelVariants = (direction: number) => ({
    initial: { opacity: 0, x: direction > 0 ? 50 : -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction > 0 ? -50 : 50 },
  });

  const handleModeChange = useCallback((newMode: KeyboardMode) => {
    const oldIdx = modeOrder.indexOf(mode);
    const newIdx = modeOrder.indexOf(newMode);
    const direction = newIdx > oldIdx ? 1 : -1;
    setPrevMode(mode);
    setMode(newMode);
    // Store direction for animation
    (window as unknown as Record<string, number>).__panelDirection = direction;
    if (newMode === 'keyboard') {
      setSymbolsActive(false);
      setSelectedConsonant(null);
    }
  }, [mode]);

  const getDirection = () => {
    return (window as unknown as Record<string, number>).__panelDirection || 1;
  };

  // Keyboard height class - optimized for phone frame (300px width)
  const kbHeightClass = keyboardHeight === 'compact' ? 'min-h-[180px]' : keyboardHeight === 'tall' ? 'min-h-[280px]' : 'min-h-[220px]';
  const kbPanelHeight = keyboardHeight === 'compact' ? 'h-[200px]' : keyboardHeight === 'tall' ? 'h-[300px]' : 'h-[240px]';
  const kbKeyHeight = keyboardHeight === 'compact' ? 'h-8' : keyboardHeight === 'tall' ? 'h-11' : 'h-9';

  // ─── Desktop Render Functions ─────────────────────────────────────────

  // Desktop text area with toolbar
  const renderDesktopTextArea = () => {
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    const handleUndo = () => {
      if (undoStack.length > 0) {
        const prev = undoStack[undoStack.length - 1];
        setRedoStack(prev => [...prev, text]);
        setUndoStack(prev => prev.slice(0, -1));
        updateText(prev);
      }
    };
    const handleRedo = () => {
      if (redoStack.length > 0) {
        const next = redoStack[redoStack.length - 1];
        setUndoStack(prev => [...prev, text]);
        setRedoStack(prev => prev.slice(0, -1));
        updateText(next);
      }
    };
    const handleTextChange = (newText: string) => {
      setUndoStack(prev => [...prev, text]);
      setRedoStack([]);
      updateText(newText);
    };

    return (
      <div className="desktop-text-editor">
        {/* Toolbar */}
        <div className={`desktop-toolbar ${t.card} ${t.border} border`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                  onClick={handleUndo}
                  className={`flex items-center justify-center w-7 h-7 rounded-md ${t.suggestion} ${t.keyText} transition-colors`}
                  disabled={undoStack.length === 0}>
                  <Undo2 className="w-3.5 h-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                  onClick={handleRedo}
                  className={`flex items-center justify-center w-7 h-7 rounded-md ${t.suggestion} ${t.keyText} transition-colors`}
                  disabled={redoStack.length === 0}>
                  <Redo2 className="w-3.5 h-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className={`w-px h-4 mx-1 ${t.border} bg-current opacity-20`} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                  onClick={() => navigator.clipboard?.writeText(text)}
                  className={`flex items-center justify-center w-7 h-7 rounded-md ${t.suggestion} ${t.keyText} transition-colors`}
                  disabled={!text}>
                  <Copy className="w-3.5 h-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Copy text</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                  onClick={() => { if (text) updateText(text); /* select all via focus */ }}
                  className={`flex items-center justify-center w-7 h-7 rounded-md ${t.suggestion} ${t.keyText} transition-colors`}
                  disabled={!text}>
                  <SquareCheck className="w-3.5 h-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Select all</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                  onClick={() => handleTextChange('')}
                  className={`flex items-center justify-center w-7 h-7 rounded-md ${t.suggestion} ${t.keyText} transition-colors`}
                  disabled={!text}>
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Clear text</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex-1" />
          <span className={`text-[10px] ${t.keyText} opacity-40`}>
            {charCount} chars · {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
          {/* Language badge with animated border */}
          <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold desktop-language-badge ${t.accent} ${t.accentText}`}
            style={customThemeData ? { backgroundColor: customThemeData.accentColor, color: customThemeData.keyTextColor } : {}}>
            {language === 'english' ? 'EN' : 'አማ'}
          </span>
          {/* Send button with green styling */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => { if (text) { navigator.clipboard?.writeText(text); }}}
            disabled={!text}
            className={`ml-2 flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${text ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
            <Send className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        {/* Separator line between toolbar and text */}
        <div className={`h-px ${t.border} opacity-30`} />
        {/* Text content */}
        <div className={`${t.card} ${t.border} border border-t-0 rounded-t-none p-3 min-h-[80px] max-h-[160px] overflow-y-auto`}
          style={customThemeData ? { backgroundColor: customThemeData.specialKeyColor + '40' } : {}}>
          {text ? (
            <motion.p
              key={text.slice(-1)}
              initial={textBounce ? { scale: 1.01 } : {}}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${t.keyText} desktop-cursor`}
              style={customThemeData ? { color: customThemeData.keyTextColor } : {}}>
              {text}
            </motion.p>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 gap-1">
              <Zap className={`w-5 h-5 opacity-20 ${t.keyText}`} />
              <p className={`text-sm italic opacity-50 ${t.keyText}`}
                style={customThemeData ? { color: customThemeData.keyTextColor } : {}}>
                {language === 'english' ? 'Start typing with the keyboard below...' : 'ከታች በሚገኘው ቁልፍ ይጻፉ...'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Desktop tab bar - streamlined for dashboard
  const renderDesktopTabBar = () => {
    return (
      <div className={`desktop-tab-bar py-0 px-2 flex items-center gap-1 border-b border-white/5`}>
        <div 
          className={`kb-tab ${mode === 'keyboard' ? 'active' : ''}`}
          onClick={() => {
            if (mode === 'keyboard') {
              // Toggle language when clicking ABC/አማ while already in keyboard mode
              handleLanguageToggle();
            } else {
              setMode('keyboard');
            }
          }}
        >
          <span className="kb-tab-icon">
            {language === 'english' ? 'ABC' : 'አማ'}
          </span>
          <span className="kb-tab-label">
            {language === 'english' ? 'English' : 'አማርኛ'}
          </span>
          {mode === 'keyboard' && <motion.div layoutId="activeTab" className="kb-tab-line" />}
        </div>
        
        {/* Other tabs */}
        {[
          { id: 'stickers' as KeyboardMode, label: 'Stickers', icon: Smile },
          { id: 'gifs' as KeyboardMode, label: 'GIFs', icon: Image },
          { id: 'clipboard' as KeyboardMode, label: 'Clipboard', icon: ClipboardList },
          { id: 'translate' as KeyboardMode, label: 'Translate', icon: Sparkles },
          { id: 'handwriting' as KeyboardMode, label: 'Draw', icon: Pen },
        ].map(tab => {
          const isActive = mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleModeChange(tab.id)}
              className={`
                px-6 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all relative
                ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}
              `}
            >
              <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'opacity-40'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" 
                />
              )}
            </button>
          );
        })}
        <div className="flex-1" />
        
        {/* Quick Language Toggle */}
        <button 
           onClick={handleLanguageToggle}
           className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-[10px] font-bold tracking-widest text-white/40 hover:text-white transition-all uppercase"
        >
          <Globe className="w-3 h-3" />
          {language}
        </button>
      </div>
    );
  };

  // Desktop 3D key component
  const renderDesktopKey = (key: string, flex?: string, tooltip?: string) => {
    const isSpecial = ['shift', 'backspace', 'symbols', 'space', 'enter', 'language', 'tab', 'esc', 'caps', 'voice'].includes(key);
    const isWide = key === 'space';
    const isMedium = key === 'shift' || key === 'backspace' || key === 'enter' || key === 'tab' || key === 'caps' || key === 'symbols' || key === 'language' || key === 'voice';
    const isFunction = key === 'esc' || key === 'tab' || key === 'caps' || key === 'language' || key === 'voice';
    let displayKey = key;
    let subLabel = '';

    if (key === 'backspace') displayKey = '⌫';
    if (key === 'symbols') displayKey = symbolsActive ? (language === 'amharic' ? 'አማ' : 'ABC') : (language === 'amharic' ? '፩፪' : '?123');
    if (key === 'space') displayKey = language === 'amharic' ? 'አማርኛ' : 'Space';
    if (key === 'enter') displayKey = 'Enter';
    if (key === 'tab') displayKey = 'Tab';
    if (key === 'esc') displayKey = 'Esc';
    if (key === 'caps') displayKey = 'Caps';
    if (key === 'language') displayKey = language === 'english' ? '🌐 አማ' : '🌐 EN';
    if (shiftActive && !isSpecial && key.length === 1 && key.match(/[a-z]/)) {
      displayKey = key.toUpperCase();
    }
    // Sub-labels for number row
    if (NUMBER_SHIFT_CHARS[key]) {
      subLabel = NUMBER_SHIFT_CHARS[key];
    }
    // Sub-labels for some letter keys
    if (!isSpecial && key.length === 1) {
      const shiftChar = shiftActive ? key : key.toUpperCase();
      if (key.match(/[a-z]/) && !shiftActive) {
        subLabel = key.toUpperCase();
      }
    }

    const flexClass = flex || (isWide ? 'flex-[4]' : isMedium ? 'flex-[1.8]' : 'flex-1');
    const isRippled = rippleKey === key;
    const isLongPressed = longPressKey === key;

    return (
      <motion.button
        key={key}
        whileTap={{ translateY: 1, boxShadow: '0 1px 0 0 rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 3px rgba(0,0,0,0.1)' }}
        onClick={() => {
          if (key === 'space') {
            const pressDuration = Date.now() - ((window as any)[`pressTime_${key}`] || 0);
            if (pressDuration > 500) {
              startVoiceRecognition();
            } else {
              handleKeyPress(key);
            }
          } else if (key === 'language') {
            handleLanguageToggle();
          } else if (key === 'voice') {
            startVoiceRecognition();
          } else if (key === 'tab') {
            updateText(text + '    ');
          } else if (key === 'esc') {
            // Do nothing or close panel
          } else if (key === 'caps') {
            setShiftActive(!shiftActive);
          } else {
            handleKeyPress(key);
          }
        }}
        onPointerDown={() => {
          (window as any)[`pressTime_${key}`] = Date.now();
          handlePointerDown(key);
        }}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`
          desktop-key-3d ${isRippled ? 'desktop-key-press' : ''}
          relative flex items-center justify-center font-medium
          select-none overflow-visible ${flexClass}
          ${isSpecial
            ? `${t.specialKey} ${t.keyText} desktop-key-special`
            : `${t.key} ${t.keyText} ${t.border} border`
          }
          ${isFunction ? 'desktop-key-function' : ''}
        `}
        style={customBgFile ? customKeyStyle : customThemeData && !isSpecial ? { backgroundColor: customThemeData.keyColor, color: customKeyTextColor } : customThemeData && isSpecial ? { backgroundColor: customThemeData.specialKeyColor, color: customKeyTextColor } : {}}
      >
        {/* Tooltip on special keys */}
        {tooltip && (
          <span className={`desktop-key-tooltip ${t.card} ${t.keyText} ${t.border} border shadow-lg`}>
            {tooltip}
          </span>
        )}
        {/* LED indicator for Caps/Shift state */}
        {(key === 'caps' || key === 'shift') && (
          <span className={`desktop-led-indicator ${shiftActive ? 'desktop-led-on' : ''}`} />
        )}
        {/* Sub-label (shift character) */}
        {subLabel && !isSpecial && (
          <span className="desktop-key-sublabel">{subLabel}</span>
        )}
        {/* Icons for special keys */}
        {key === 'shift' && <ArrowUp className={`w-4 h-4 ${shiftActive ? 'text-yellow-500' : ''}`} />}
        {key === 'backspace' && <Delete className="w-4 h-4" />}
        {key === 'enter' && <CornerDownLeft className="w-4 h-4" />}
        {key === 'esc' && <LogOut className="w-3.5 h-3.5" />}
        {key === 'caps' && (
          <div className="flex items-center gap-1">
            <ArrowUp className={`w-3.5 h-3.5 ${shiftActive ? 'text-yellow-500' : ''}`} />
            <span className="text-[10px]">Caps</span>
          </div>
        )}
        {key === 'tab' && <span className="text-[10px] font-medium">Tab</span>}
        {key === 'voice' && (isListening ? <MicOff className="w-4 h-4 text-red-500 animate-pulse" /> : <Mic className="w-4 h-4" />)}
        {key === 'language' && <span className="text-[10px] font-bold">{displayKey}</span>}
        {key !== 'shift' && key !== 'backspace' && key !== 'enter' && key !== 'esc' && key !== 'caps' && key !== 'tab' && key !== 'language' && (
          <span className={isWide ? 'text-xs' : 'text-sm'}>{displayKey}</span>
        )}
        {/* Long press popup */}
        {isLongPressed && alternatesFor(key) && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 ${t.card} ${t.border} border rounded-xl shadow-2xl p-1.5 z-50 flex gap-1 min-w-max`}>
            {alternatesFor(key)!.map((alt, i) => (
              <motion.div
                key={i}
                role="button"
                tabIndex={0}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleAlternateSelect(alt); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleAlternateSelect(alt); } }}
                className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium ${t.key} ${t.keyText} ${t.keyHover} ${t.border} border shadow-sm cursor-pointer`}>
                {alt}
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.button>
    );
  };

  // Desktop keyboard with 3D keys and function row - NO DUPLICATES
  const renderDesktopKeyboard = () => {
    return (
      <div className="desktop-keyboard-chassis">
        {/* Function row */}
        <div className="desktop-key-row desktop-function-row desktop-function-row-styled">
          {renderDesktopKey('esc', 'flex-[1.2]', 'Esc')}
          {renderDesktopKey('tab', 'flex-[1.5]', 'Insert tab')}
          {renderDesktopKey('caps', 'flex-[1.8]', shiftActive ? 'Caps ON' : 'Toggle uppercase')}
          <div className="flex-1" />
          {renderDesktopKey('language', 'flex-[1.5]', 'Switch language')}
        </div>

        {/* Number row - always visible */}
        <div className="desktop-key-row desktop-number-row">
          {['1','2','3','4','5','6','7','8','9','0'].map(k => renderDesktopKey(k))}
        </div>

        {/* Main key area */}
        {language === 'english' ? (
          <>
            {symbolsActive ? (
              <>
                {/* Symbol row 1 */}
                <div className="desktop-key-row desktop-letter-row">
                  {DESKTOP_SYMBOL_ROWS[0].map(key => renderDesktopKey(key))}
                </div>
                {/* Symbol row 2 with shift & backspace */}
                <div className="desktop-key-row desktop-letter-row">
                  {renderDesktopKey('shift', 'flex-[1.5]', 'Toggle shift')}
                  {DESKTOP_SYMBOL_ROWS[1].map(key => renderDesktopKey(key))}
                  {renderDesktopKey('backspace', 'flex-[2]', 'Delete')}
                </div>
              </>
            ) : (
              <>
                {/* QWERTY Row 1 */}
                <div className="desktop-key-row desktop-letter-row">
                  {DESKTOP_QWERTY_ROWS[0].map(key => renderDesktopKey(key))}
                </div>
                {/* QWERTY Row 2 */}
                <div className="desktop-key-row desktop-letter-row">
                  {DESKTOP_QWERTY_ROWS[1].map(key => renderDesktopKey(key))}
                </div>
                {/* QWERTY Row 3 with shift & backspace */}
                <div className="desktop-key-row desktop-letter-row">
                  {renderDesktopKey('shift', 'flex-[1.5]', 'Toggle shift')}
                  {DESKTOP_QWERTY_ROWS[2].map(key => renderDesktopKey(key))}
                  {renderDesktopKey('backspace', 'flex-[2]', 'Delete')}
                </div>
              </>
            )}
            {/* Bottom row */}
            <div className="desktop-key-row desktop-letter-row">
              {renderDesktopKey('symbols', 'flex-[1.5]', 'Toggle symbols')}
              {renderDesktopKey(',', 'flex-[0.8]')}
              {renderDesktopKey('space', 'flex-[4]')}
              {renderDesktopKey('.', 'flex-[0.8]')}
              {renderDesktopKey('enter', 'flex-[2]', 'New line')}
              {/* Mobile View toggle inside keyboard - High visibility */}
              <motion.button
                whileTap={{ translateY: 1 }}
                onClick={() => setDesktopView(false)}
                className="desktop-key-3d flex-[1.8] flex items-center justify-center gap-1.5 text-xs font-black bg-emerald-500 text-white border-emerald-400 border shadow-lg"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-tighter">Mobile View</span>
              </motion.button>
            </div>
          </>
        ) : (
          <>
            {/* Amharic keyboard rows */}
            {AMHARIC_ROWS.map((row, rowIdx) => (
              <div key={rowIdx} className="desktop-key-row desktop-letter-row">
                {row.map((consonant, ci) => {
                  return (
                    <motion.button
                      key={consonant}
                      whileTap={{ translateY: 1, boxShadow: '0 1px 0 0 rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 3px rgba(0,0,0,0.1)' }}
                      onClick={() => { if (longPressKey === consonant) return; handleAmharicPress(consonant); }}
                      onPointerDown={() => handlePointerDown(consonant)}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      className={`desktop-key-3d flex-1 flex items-center justify-center text-sm font-medium select-none overflow-visible
                        ${selectedConsonant === consonant ? `${t.accent} ${t.accentText}` : `${t.key} ${t.keyText} ${t.border} border`}
                      `}
                      style={customThemeData && selectedConsonant !== consonant ? { backgroundColor: customThemeData.keyColor, color: customThemeData.keyTextColor } : customThemeData && selectedConsonant === consonant ? { backgroundColor: customThemeData.accentColor } : {}}
                    >
                      {consonant}
                      {longPressKey === consonant && alternatesFor(consonant) && (
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`absolute bottom-full mb-2 ${popupAnchor(ci, row.length)} ${t.card} ${t.border} border rounded-xl shadow-2xl p-1.5 z-50 flex gap-1 min-w-max`}>
                          {alternatesFor(consonant)!.map((alt, ai) => (
                            <motion.div
                              key={ai}
                              role="button"
                              tabIndex={0}
                              whileHover={{ scale: 1.15, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); handleAlternateSelect(alt); }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleAlternateSelect(alt); } }}
                              className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium ${t.key} ${t.keyText} ${t.keyHover} ${t.border} border shadow-sm cursor-pointer`}>
                              {alt}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ))}
            {/* Vowel row */}
            {renderVowelRow()}
            {/* Bottom row */}
            <div className="desktop-key-row desktop-letter-row">
              {renderDesktopKey('symbols', 'flex-[1.5]', 'Toggle symbols')}
              {renderDesktopKey(',', 'flex-[0.8]')}
              {renderDesktopKey('space', 'flex-[4]')}
              {renderDesktopKey('.', 'flex-[0.8]')}
              {renderDesktopKey('enter', 'flex-[2]', 'New line')}
              {/* Mobile View toggle inside keyboard - High visibility */}
              <motion.button
                whileTap={{ translateY: 1 }}
                onClick={() => setDesktopView(false)}
                className="desktop-key-3d flex-[1.8] flex items-center justify-center gap-1.5 text-xs font-black bg-emerald-500 text-white border-emerald-400 border shadow-lg"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-tighter">Mobile View</span>
              </motion.button>
            </div>
          </>
        )}

        {/* Suggestions bar */}
        {showSuggestionBar && (
          <div className={`mt-1 ${t.tabBar} rounded-lg`}>
            {renderSuggestions()}
          </div>
        )}

        {/* AkAI branding - improved */}
        <span className="desktop-branding desktop-branding-enhanced">
          <span className="desktop-branding-dot" />
          AkAI
        </span>
      </div>
    );
  };

  // Desktop side panel for non-keyboard modes
  const renderDesktopSidePanel = () => {
    if (mode === 'keyboard' || mode === 'settings' || mode === 'themes') return null;
    return (
      <div className={`desktop-side-panel ${t.card} ${t.border} border flex flex-col desktop-side-panel-enhanced`}
        style={customThemeData ? { backgroundColor: customThemeData.specialKeyColor + '30' } : {}}>
        {/* Side panel header with close button - more prominent */}
        <div className={`flex items-center justify-between px-3 py-2.5 border-b ${t.border} ${t.suggestion}`}>
          <div className="flex items-center gap-2">
            {mode === 'stickers' && <Smile className={`w-4 h-4 ${t.keyText} opacity-70`} />}
            {mode === 'gifs' && <Image className={`w-4 h-4 ${t.keyText} opacity-70`} />}
            {mode === 'clipboard' && <ClipboardList className={`w-4 h-4 ${t.keyText} opacity-70`} />}
            {mode === 'translate' && <Sparkles className={`w-4 h-4 ${t.keyText} opacity-70`} />}
            {mode === 'handwriting' && <Pen className={`w-4 h-4 ${t.keyText} opacity-70`} />}
            <span className={`text-xs font-semibold ${t.keyText}`}>
              {mode === 'stickers' && 'Stickers'}
              {mode === 'gifs' && 'GIFs'}
              {mode === 'clipboard' && 'Clipboard'}
              {mode === 'translate' && 'Translate'}
              {mode === 'handwriting' && 'Draw'}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setMode('keyboard')}
            className={`w-6 h-6 flex items-center justify-center rounded-md ${t.suggestion} ${t.keyText}`}>
            <X className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        {/* Side panel content */}
        <div className="desktop-side-panel-content flex-1">
          {mode === 'stickers' && renderStickers()}
          {mode === 'gifs' && renderGifs()}
          {mode === 'clipboard' && renderClipboard()}
          {mode === 'translate' && renderTranslate()}
          {mode === 'handwriting' && renderHandwriting()}
        </div>
      </div>
    );
  };

  // Desktop settings modal
  const renderDesktopSettingsModal = () => {
    if (!showDesktopSettings) return null;
    return (
      <div className="desktop-settings-overlay" onClick={() => setShowDesktopSettings(false)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`desktop-settings-modal ${t.card} ${t.border} border shadow-2xl`}
          onClick={e => e.stopPropagation()}
          style={customThemeData ? { backgroundColor: customThemeData.bgColor } : {}}>
          {/* Modal header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
            <span className={`text-sm font-bold ${t.keyText}`}>⚙️ Settings</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setShowDesktopSettings(false)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg ${t.suggestion} ${t.keyText}`}>
              <X className="w-4 h-4" />
            </motion.button>
          </div>
          {/* Modal content */}
          <div className="p-4 overflow-y-auto max-h-[60vh] flex flex-col gap-3"
            style={customThemeData ? { color: customThemeData.keyTextColor } : {}}>
            {/* Keyboard height selector */}
            <div className={`p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <p className={`text-xs font-medium mb-2 ${t.keyText}`}>Keyboard Height</p>
              <div className="flex gap-2">
                {(['compact', 'normal', 'tall'] as const).map(h => (
                  <motion.button key={h}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setKeyboardHeight(h)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      keyboardHeight === h ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
                    }`}
                    style={keyboardHeight === h && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                    {h}
                  </motion.button>
                ))}
              </div>
            </div>
            {/* Show number row */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <div>
                <p className={`text-xs font-medium ${t.keyText}`}>Show Number Row</p>
                <p className={`text-[10px] ${t.keyText} opacity-50`}>Always show numbers above letters</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setShowNumberRow(!showNumberRow)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${showNumberRow ? t.accent : 'bg-gray-600'}`}
                style={showNumberRow && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                <motion.div animate={{ x: showNumberRow ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </motion.button>
            </div>
            {/* Auto-space */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <div>
                <p className={`text-xs font-medium ${t.keyText}`}>Auto-Space After Punctuation</p>
                <p className={`text-[10px] ${t.keyText} opacity-50`}>Add space after . ! ? ; :</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setAutoSpaceAfterPunctuation(!autoSpaceAfterPunctuation)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${autoSpaceAfterPunctuation ? t.accent : 'bg-gray-600'}`}
                style={autoSpaceAfterPunctuation && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                <motion.div animate={{ x: autoSpaceAfterPunctuation ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </motion.button>
            </div>
            {/* Key popup on long press */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <div>
                <p className={`text-xs font-medium ${t.keyText}`}>Key Popup on Long Press</p>
                <p className={`text-[10px] ${t.keyText} opacity-50`}>Show alternate characters on long press</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setKeyPopupOnLongPress(!keyPopupOnLongPress)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${keyPopupOnLongPress ? t.accent : 'bg-gray-600'}`}
                style={keyPopupOnLongPress && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                <motion.div animate={{ x: keyPopupOnLongPress ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </motion.button>
            </div>
            {/* Vibrate on keypress */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <div>
                <p className={`text-xs font-medium ${t.keyText}`}>Vibrate on Keypress</p>
                <p className={`text-[10px] ${t.keyText} opacity-50`}>Haptic feedback for every key</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setVibrateOnKeyPress(!vibrateOnKeyPress)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${vibrateOnKeyPress ? t.accent : 'bg-gray-600'}`}
                style={vibrateOnKeyPress && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                <motion.div animate={{ x: vibrateOnKeyPress ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </motion.button>
            </div>
            {/* Haptic strength */}
            {vibrateOnKeyPress && (
              <div className={`p-3 rounded-xl ${t.key} ${t.border} border`}
                style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
                <p className={`text-xs font-medium mb-2 ${t.keyText}`}>Haptic Strength</p>
                <div className="flex gap-2">
                  {([['light', 2], ['medium', 3], ['strong', 5]] as const).map(([label, level]) => (
                    <motion.button key={label}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setHapticLevel(level); vibrateAt(level); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                        hapticLevel === level ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
                      }`}
                      style={hapticLevel === level && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            {/* Sound on keypress */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <div>
                <p className={`text-xs font-medium ${t.keyText}`}>Sound on Keypress</p>
                <p className={`text-[10px] ${t.keyText} opacity-50`}>Play a click sound per key</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setSoundOnKeyPress(!soundOnKeyPress)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${soundOnKeyPress ? t.accent : 'bg-gray-600'}`}
                style={soundOnKeyPress && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                <motion.div animate={{ x: soundOnKeyPress ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </motion.button>
            </div>
            {/* Double-space for period */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <div>
                <p className={`text-xs font-medium ${t.keyText}`}>Double-Space for Period</p>
                <p className={`text-[10px] ${t.keyText} opacity-50`}>Tap space twice to insert ". "</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setDoubleSpacePeriod(!doubleSpacePeriod)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${doubleSpacePeriod ? t.accent : 'bg-gray-600'}`}
                style={doubleSpacePeriod && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                <motion.div animate={{ x: doubleSpacePeriod ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </motion.button>
            </div>
            {/* One-handed mode */}
            <div className={`p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <p className={`text-xs font-medium mb-2 ${t.keyText}`}>One-Handed Mode</p>
              <div className="flex gap-2">
                {([
                  { id: 'off', label: 'Off' },
                  { id: 'left', label: 'Left' },
                  { id: 'right', label: 'Right' },
                ] as const).map(opt => (
                  <motion.button key={opt.id}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setOneHandedMode(opt.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      oneHandedMode === opt.id ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
                    }`}
                    style={oneHandedMode === opt.id && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Main desktop view redesign
  const renderDesktopView = () => {
    const isSidePanelOpen = mode !== 'keyboard' && mode !== 'settings' && mode !== 'themes';
    
    return (
      <div className="desktop-dashboard-container font-sans text-white">
        {/* Background Live Wallpaper (Always present on desktop) */}
        <div className="absolute inset-0 z-0">
            <LiveWallpaper theme={theme} />
            <div className="desktop-dashboard-blur-overlay" />
        </div>

        {/* Sidebar Rack */}
        <aside className="desktop-sidebar-rack">
            <div className="flex flex-col items-center gap-6">
                <motion.div 
                   whileHover={{ scale: 1.1 }}
                   className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg mb-4"
                >
                    <span className="font-black text-xs">AkAI</span>
                </motion.div>

                {/* Dashboard Mode */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button 
                                onClick={() => setMode('keyboard')}
                                className={`desktop-rack-icon-btn ${mode === 'keyboard' ? 'active' : ''}`}
                            >
                                <Monitor className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Dashboard</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Themes Mode */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button 
                                onClick={() => setMode('themes')}
                                className={`desktop-rack-icon-btn ${mode === 'themes' ? 'active' : ''}`}
                            >
                                <Palette className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Themes</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Change Wallpaper (direct to custom upload) */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="desktop-rack-icon-btn"
                            >
                                <ImagePlus className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Wallpaper</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Settings Mode */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button 
                                onClick={() => setShowDesktopSettings(true)}
                                className="desktop-rack-icon-btn"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Settings</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="mt-auto flex flex-col items-center gap-4">
                {/* Mobile View Toggle */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button 
                                onClick={() => setDesktopView(false)}
                                className="desktop-rack-icon-btn hover:text-emerald-400"
                            >
                                <Smartphone className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Mobile Mode</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Logout/Exit */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="desktop-rack-icon-btn hover:text-red-400">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Exit</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </aside>

        {/* Main Content Area */}
        <main className="desktop-main-canvas">
            {/* Console Header */}
            <header className="desktop-console-header z-20">
                <div className="flex items-center gap-4">
                    <h1 className="text-sm font-bold tracking-tight opacity-90 capitalize">{mode === 'keyboard' ? '⌨️ Keyboard' : mode === 'themes' ? '🎨 Themes' : mode === 'settings' ? '⚙️ Settings' : `📂 ${mode}`}</h1>
                    <div className="h-4 w-px bg-white/10" />
                    {/* Active theme badge */}
                    {theme !== 'default' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {(allThemes as Record<string, {name: string}>)[theme]?.name || theme}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 opacity-70`}>
                            {language === 'amharic' ? '🇪🇹 AM' : '🇺🇸 EN'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${shiftActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 border border-white/10 opacity-40'}`}>
                            CAPS
                        </span>
                        {isListening && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                            🎙️ LIVE
                          </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Voice Toggle in header */}
                    <button
                      onClick={startVoiceRecognition}
                      className={`flex items-center gap-1.5 text-[10px] font-medium opacity-60 hover:opacity-100 transition-opacity ${isListening ? 'text-red-400 opacity-100' : ''}`}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      {isListening ? 'Stop' : 'Voice'}
                    </button>
                    <div className="h-4 w-px bg-white/10" />
                    {/* Dark mode toggle */}
                    <button
                      onClick={() => setAppTheme(appTheme === 'dark' ? 'light' : 'dark')}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                      {mounted && appTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </button>
                    <div className="h-4 w-px bg-white/10" />
                    {/* Time */}
                    <span className="text-[11px] font-mono opacity-80 select-none">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </header>

            {/* Viewport: Text Area + Keyboard */}
            <div className="flex-1 flex flex-col p-6 gap-6 relative z-10 overflow-hidden">
                {/* Upper Deck: Text Editor */}
                <div className="shrink-0 min-h-[120px] max-h-[160px]">
                    {renderDesktopTextArea()}
                </div>

                {/* Lower Deck: Keyboard + Side Panels */}
                <div className="flex gap-6 flex-1 min-h-0">
                    {/* Keyboard Chassis */}
                    <div className={`flex-1 flex flex-col transition-all duration-500`}>
                        {mode === 'themes' ? (
                            <div className="desktop-glass-card p-0 overflow-hidden flex-1">
                                {renderThemePickerPanel()}
                            </div>
                        ) : mode === 'settings' ? (
                            <div className="desktop-glass-card p-6 overflow-y-auto flex-1">
                                <h2 className="text-xl font-bold mb-6">System Settings</h2>
                                {/* Reuse settings from modal or render inline */}
                            </div>
                        ) : (
                            <div className="desktop-glass-card p-6 flex flex-col bg-black/40 backdrop-blur-3xl shadow-2xl">
                                {renderDesktopKeyboard()}
                            </div>
                        )}
                    </div>

                    {/* Side Panel (Stickers, GIFs, etc.) */}
                    <AnimatePresence>
                        {isSidePanelOpen && (
                            <motion.div 
                                initial={{ width: 0, opacity: 0, x: 20 }}
                                animate={{ width: 340, opacity: 1, x: 0 }}
                                exit={{ width: 0, opacity: 0, x: 20 }}
                                className="h-full overflow-hidden"
                            >
                                <div className="desktop-glass-card h-full flex flex-col overflow-hidden bg-black/30">
                                    {renderDesktopSidePanel()}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Responsive Tab Bar (Bottom Attached in Main Canvas) */}
            <div className="px-6 pb-4">
                {renderDesktopTabBar()}
            </div>
        </main>

        {/* Global Overlays */}
        {renderDesktopSettingsModal()}
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────
  const currentRows = symbolsActive ? SYMBOL_ROWS : (LAYOUT_ROWS[englishLayout] ?? ENGLISH_ROWS);

  const getDynamicLayerStyle = () => {
    if (!customBgFile) return {};
    return {
      backgroundImage: `url(${customBgFile})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: bgOpacity,
      filter: `blur(${bgBlur}px)`,
      transform: 'scale(1.1)', // Prevents edges showing when blurred
    };
  };

  return (
    <div className={`flex flex-col h-full ${t.bg} rounded-lg overflow-hidden transition-colors duration-300 relative ${desktopView ? 'desktop-keyboard-layout' : ''} ${t.isLive ? 'live-keyboard-active' : ''}`}
      style={customBgStyle}>
      {/* Custom image/GIF background layer */}
      {customBgFile && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="w-full h-full" style={getDynamicLayerStyle()} />
          <div className="absolute inset-0 bg-black/20" /> {/* Slight dark overlay for contrast */}
        </div>
      )}
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,image/gif"
        onChange={handleFileUpload}
      />
      {/* Live theme interactive canvas wallpaper */}
      {t.isLive && (
        <>
          {/* A live theme is either a canvas animation or an animated CSS
              background, never both. The CSS one used to sit on the root of
              the keyboard, where its animated filter and opacity forced every
              key to be repainted every frame (and faded the keys along with
              it); and on canvas themes it put a photograph under the
              animation, which made them read as an image rather than as
              something live. It now gets a layer of its own, and only when
              there is no canvas. */}
          {t.liveClass && !hasLiveAnimation(theme) && (
            <div className={`absolute inset-0 pointer-events-none ${t.liveClass}`} style={{ borderRadius: 'inherit' }} aria-hidden="true" />
          )}
          <LiveWallpaper theme={theme} className="absolute inset-0" />
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.4) 100%)',
            borderRadius: 'inherit',
            zIndex: 2
          }} />
        </>
      )}

      {/* ─── DESKTOP VIEW ─── */}
      {desktopView ? (
        <div className="flex-1 flex flex-col relative z-10">
          {renderDesktopView()}
        </div>
      ) : mode === 'themes' ? (
        <div className="flex-1 flex flex-col relative z-10">
          {renderThemePickerPanel()}
        </div>
      ) : (
        <>
          {/* Text Display Area */}
          {!isIme && (
            <div className={`kb-text-area ${desktopView ? 'flex-1 min-h-[80px]' : 'h-[100px]'} p-2 relative z-10`}>
              <div className={`h-full rounded-lg ${t.isLive ? 'border-white/10' : t.border} border p-2 overflow-y-auto`}
                style={customThemeData ? { backgroundColor: customThemeData.specialKeyColor + '40' } : t.isLive ? { backgroundColor: 'rgba(0,0,0,0.52)' } : {}}>
                {text ? (
                  <motion.p
                    key={text.slice(-1)}
                    initial={textBounce ? { scale: 1.02 } : {}}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${t.keyText}`}
                    style={customThemeData ? { color: customThemeData.keyTextColor } : {}}
                  >
                    {cursorPos !== null ? (
                      <>
                        {text.slice(0, cursorPos)}
                        <span className="inline-block w-px h-[1em] bg-current align-middle animate-pulse mx-px" aria-hidden="true" />
                        {text.slice(cursorPos)}
                      </>
                    ) : text}
                  </motion.p>
                ) : (
                  <p className={`text-sm italic opacity-40 ${t.keyText}`}
                    style={customThemeData ? { color: customThemeData.keyTextColor } : {}}
                  >{language === 'english' ? 'Tap the keyboard to start typing...' : 'ቁልፉን መታ በማድረግ ይጻፉ...'}</p>
                )}
              </div>
            </div>
          )}

          {/* Suggestions Bar */}
          {mode === 'keyboard' && showSuggestionBar && (
            <div className={`${t.isLive ? '' : t.tabBar} border-t border-b ${t.isLive ? 'border-white/10' : t.border} relative z-10`}
              style={t.isLive ? { backgroundColor: 'rgba(0,0,0,0.52)' } : {}}>
              {renderSuggestions()}
            </div>
          )}

          {/* Mode Tab Bar */}
          <div className={`flex items-center gap-0.5 px-2 py-1.5 border-t ${t.isLive ? 'border-white/10' : t.border} ${t.isLive ? '' : t.tabBar} relative z-10`}
            style={customThemeData ? { backgroundColor: customThemeData.specialKeyColor + '20' } : t.isLive ? { backgroundColor: 'rgba(0,0,0,0.52)' } : {}}>
            {[
              { id: 'keyboard' as KeyboardMode, label: language === 'english' ? 'ABC' : 'አማ', icon: Keyboard, visible: true },
              { id: 'stickers' as KeyboardMode, label: 'Stickers', icon: Smile, visible: visibleButtons.stickers },
              { id: 'gifs' as KeyboardMode, label: 'GIFs', icon: Image, visible: visibleButtons.gifs },
              { id: 'clipboard' as KeyboardMode, label: 'Clip', icon: ClipboardList, visible: visibleButtons.clipboard },
              { id: 'translate' as KeyboardMode, label: 'AI', icon: Sparkles, visible: visibleButtons.translate },
              { id: 'handwriting' as KeyboardMode, label: 'Draw', icon: Pen, visible: visibleButtons.handwriting },
              { id: 'settings' as KeyboardMode, label: 'Set', icon: Settings, visible: true },
            ].filter(t => t.visible).map(tab => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleModeChange(tab.id)}
                className={`
                  flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all duration-200 relative
                  ${mode === tab.id
                    ? `${t.tabActive} ${t.tabActiveText} shadow-sm`
                    : `${t.keyText} opacity-60 hover:opacity-100`}
                `}
                style={mode === tab.id && customThemeData ? { backgroundColor: customThemeData.accentColor, color: customThemeData.keyTextColor } : customThemeData ? { color: customThemeData.keyTextColor } : {}}
              >
                {/* Toolbar Style Logic */}
                {toolbarStyle === 'all' ? (
                   <div className="flex flex-col items-center gap-0.5">
                     <tab.icon className="w-3 h-3 relative z-10" />
                     <span className="text-[9px] font-medium relative z-10">{tab.label}</span>
                   </div>
                ) : toolbarStyle === 'icons' ? (
                   <tab.icon className="w-5 h-5 relative z-10" />
                ) : mode === tab.id ? (
                  <span className="text-[10px] font-bold relative z-10">{tab.label}</span>
                ) : (
                  <tab.icon className="w-4 h-4 opacity-70 relative z-10" />
                )}
              </motion.button>
            ))}
            {/* Theme Toggle */}
            {visibleButtons.themes !== false && <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => handleModeChange('themes')}
              className={`flex items-center justify-center w-8 h-8 rounded-xl ${t.suggestion} ${t.keyText} ${theme !== 'default' ? 'ring-1 ring-primary/30' : ''}`}
              style={customThemeData ? { color: customThemeData.keyTextColor } : {}}
              title="Change theme"
            >
              <Palette className="w-3.5 h-3.5" />
            </motion.button>}
            {/* Dark Mode Toggle */}
            {!isIme && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                onClick={() => setAppTheme(appTheme === 'dark' ? 'light' : 'dark')}
                className={`flex items-center justify-center w-8 h-8 rounded-xl ${t.suggestion} ${t.keyText}`}
                style={customThemeData ? { color: customThemeData.keyTextColor } : {}}
                title="Toggle dark mode"
              >
                {mounted && appTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </motion.button>
            )}
            {/* Desktop View Toggle */}
            {!isIme && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                onClick={() => setDesktopView(!desktopView)}
                className={`flex items-center justify-center w-8 h-8 rounded-xl ${t.suggestion} ${t.keyText}`}
                style={customThemeData ? { color: customThemeData.keyTextColor } : {}}
                title="Toggle desktop view"
              >
                <Monitor className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>

          {/* Keyboard Content */}
          <div className={`kb-input-area ${t.isLive ? 'bg-transparent' : t.bg} border-t ${t.border} relative z-10`}
            style={{
              ...(customThemeData ? { backgroundColor: customThemeData.bgColor + '80' } : {}),
              ...(t.isLive ? { backgroundColor: 'rgba(0,0,0,0.45)' } : {})
            }}>
            <AnimatePresence mode="wait">
          {mode === 'keyboard' && (
            <motion.div
              key="keyboard"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                width: oneHandedMode === 'off' ? '100%' : '72%',
                marginLeft: oneHandedMode === 'right' ? '28%' : '0%',
                marginRight: oneHandedMode === 'left' ? '28%' : '0%',
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, width: { type: 'spring', stiffness: 300, damping: 30 }, marginLeft: { type: 'spring', stiffness: 300, damping: 30 }, marginRight: { type: 'spring', stiffness: 300, damping: 30 } }}
            >
              <div className={`flex flex-col ${ROW_GAP_CLASS[keyboardSpacing]} p-1.5`}>
                {/* ─── Number Row (conditionally visible based on settings) ─── */}
                {!symbolsActive && showNumberRow && (
                  <div className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                    {(language === 'english' || phonetic
                      ? ['1','2','3','4','5','6','7','8','9','0']
                      : ETHIOPIAN_NUM_ROW_1
                    ).map((num, i) => (
                      <motion.button key={i}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => updateText(text + num)}
                        className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-lg text-xs font-medium ${t.suggestion} ${t.keyText} ${t.keyHover} ${t.border} border`}
                        style={customKeyStyle}
                      >
                        {num}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* ─── Vowel Family Row (when Amharic consonant selected) ─── */}
                {renderAmharicVowelRow()}

                {/* ─── English Keyboard, and the same board for phonetic Amharic ─── */}
                {/* Phonetic Amharic drops QWERTY's own bottom row and keeps the
                    Amharic one below, which carries the ፈደል toggle back to the
                    fidel board and the Amharic space bar. */}
                {(language === 'english' || (language === 'amharic' && phonetic && !symbolsActive))
                  && currentRows
                  && (() => {
                    const displayRows = language === 'amharic' && phonetic ? currentRows.slice(0, -1) : currentRows;
                    return displayRows.map((row, ri) => (
                      <React.Fragment key={ri}>
                        {/* Cursor navigation row injected just before the control row */}
                        {showCursorRow && ri === displayRows.length - 1 && !symbolsActive && (
                          <div className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                            {(['arrowleft', 'arrowup', 'arrowdown', 'arrowright'] as const).map(k => renderEnglishKey(k))}
                          </div>
                        )}
                        <div className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                          {row.filter(k => showMicKey || k !== 'voice').map(k => renderEnglishKey(k))}
                        </div>
                      </React.Fragment>
                    ));
                  })()}

                {/* ─── Amharic Letter Keyboard ─── */}
                {language === 'amharic' && !symbolsActive && (
                  <>
                    {!phonetic && (AMHARIC_LAYOUT_ROWS[amharicLayout] ?? AMHARIC_ROWS).map((row, ri) => (
                      <div key={ri} className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                        {row.map((consonant, ci) => {
                          const isHovered = hoveredKey === consonant;
                          const isSelected = selectedConsonant === consonant;
                          const isRippled = rippleKey === consonant;
                          return (
                            <motion.button
                              key={consonant}
                              whileTap={{ scale: 0.9, y: 1 }}
                              whileHover={{ scale: 1.08, y: -1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 22, mass: 0.5 }}
                              onMouseEnter={() => setHoveredKey(consonant)}
                              onMouseLeave={() => setHoveredKey(null)}
                              onClick={() => { if (longPressKey === consonant) return; handleAmharicPress(consonant); }}
                              onPointerDown={() => handlePointerDown(consonant)}
                              onPointerUp={handlePointerUp}
                              onPointerLeave={handlePointerUp}
                              className={`
                                relative flex items-center justify-center flex-1 ${kbKeyHeight} ${KEY_SHAPE_CLASS[keyShape]} ${KEY_FONT_CLASS[keyFontWeight]}
                                transition-all duration-150 select-none ${KEY_TEXT_CLASS[keyTextSize]} overflow-visible
                                ${isSelected ? `ring-2 ring-yellow-500/60` : ''}
                                ${isHovered ? `${t.keyHover} shadow-md` : ''}
                                ${t.key} ${t.keyText} ${showKeyBorders ? `${t.border} border` : ''} shadow-sm
                                `}
                                style={customKeyStyle}
                              >
                              {/* Glow effect on active consonant */}
                              {isSelected && (
                                <motion.div
                                  className={`absolute inset-0 ${KEY_SHAPE_CLASS[keyShape]}`}
                                  animate={{ boxShadow: ['0 0 0px rgba(234,179,8,0)', '0 0 12px rgba(234,179,8,0.4)', '0 0 0px rgba(234,179,8,0)'] }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                />
                              )}
                              {isRippled && (
                                <motion.span
                                  initial={{ scale: 0.4, opacity: 0.55 }}
                                  animate={{ scale: 1.9, opacity: 0 }}
                                  transition={{ duration: 0.38, ease: 'easeOut' }}
                                  className={`absolute inset-0 ${KEY_SHAPE_CLASS[keyShape]} ${t.accent} pointer-events-none blur-[2px]`}
                                  style={{ mixBlendMode: 'screen' }}
                                />
                              )}
                              <motion.span
                                animate={isRippled ? { scale: [1, 1.22, 1] } : { scale: 1 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="relative"
                              >
                                {consonant}
                              </motion.span>
                              {/* Long press reveals the consonant's whole vowel
                                  family, so any order can be typed in one
                                  gesture without committing the base form. */}
                              {longPressKey === consonant && alternatesFor(consonant) && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5, scale: 0.9 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  className={`absolute bottom-full mb-2 ${popupAnchor(ci, row.length)} ${t.card} ${t.border} border rounded-xl shadow-2xl p-1.5 z-50 flex gap-1 min-w-max`}>
                                  {alternatesFor(consonant)!.map((alt, ai) => (
                                    <motion.div
                                      key={ai}
                                      role="button"
                                      tabIndex={0}
                                      whileHover={{ scale: 1.15, y: -2 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => { e.stopPropagation(); handleAlternateSelect(alt); }}
                                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleAlternateSelect(alt); } }}
                                      className={`flex items-center justify-center w-9 h-9 ${KEY_SHAPE_CLASS[keyShape]} text-sm ${KEY_FONT_CLASS[keyFontWeight]} ${t.key} ${t.keyText} ${t.keyHover} ${showKeyBorders ? `${t.border} border` : ''} shadow-sm cursor-pointer`}>
                                      {alt}
                                    </motion.div>
                                  ))}
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    ))}
                    {/* Cursor navigation row (Amharic fidel board) */}
                    {showCursorRow && (
                      <div className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                        {(['arrowleft', 'arrowup', 'arrowdown', 'arrowright'] as const).map(k => renderEnglishKey(k))}
                      </div>
                    )}

                    {/* Amharic special keys bottom row */}
                    <div className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => { setSymbolsActive(true); setSelectedConsonant(null); }}
                        className={`flex-[1.4] flex items-center justify-center ${kbKeyHeight} ${KEY_SHAPE_CLASS[keyShape]} ${t.specialKey} ${t.keyText} text-xs font-medium`}>
                        ፩፪
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={handleLanguageToggle}
                        className={`flex-[1.4] flex items-center justify-center ${kbKeyHeight} ${KEY_SHAPE_CLASS[keyShape]} ${t.specialKey} ${t.keyText} text-[9px] font-bold`}>
                        🌐 EN
                      </motion.button>
                      {/* Switches between the two ways of writing Amharic:
                          the fidel board, and the QWERTY board with phonetic
                          input. The label names the one it switches TO. */}
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                        onClick={handlePhoneticToggle}
                        title={phonetic ? 'Switch to the fidel board' : 'Type Amharic phonetically'}
                        className={`flex-[1.4] flex items-center justify-center ${kbKeyHeight} ${KEY_SHAPE_CLASS[keyShape]} ${phonetic ? `${t.accent} ${t.accentText}` : `${t.specialKey} ${t.keyText}`} text-[9px] font-bold`}>
                        {phonetic ? 'ፈደል' : 'ABC'}
                      </motion.button>
                      {/* Spacebar with cursor-swipe and long-press voice */}
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                        onPointerDown={(e) => {
                          (window as any).__spaceDown = Date.now();
                          if (spacebarCursorControl) spaceSwipeRef.current = { x: e.clientX, y: e.clientY };
                        }}
                        onPointerMove={spacebarCursorControl ? (e) => {
                          if (!spaceSwipeRef.current) return;
                          const dx = e.clientX - spaceSwipeRef.current.x;
                          if (Math.abs(dx) > 8) {
                            const delta = Math.sign(dx);
                            spaceSwipeRef.current = { x: e.clientX, y: spaceSwipeRef.current.y };
                            spaceWasSwipedRef.current = true;
                            if (isIme && window.AkaiKeyboard?.moveCursor) {
                              window.AkaiKeyboard.moveCursor(delta < 0 ? 'left' : 'right');
                              return;
                            }
                            setCursorPos(prev => {
                              const p = prev ?? text.length;
                              const newP = p + delta;
                              if (newP <= 0) return 0;
                              if (newP >= text.length) return null;
                              return newP;
                            });
                          }
                        } : undefined}
                        onPointerUp={() => {
                          const held = Date.now() - ((window as any).__spaceDown || 0);
                          spaceSwipeRef.current = null;
                          if (held > 600) {
                            startVoiceRecognition();
                          } else if (!spaceWasSwipedRef.current) {
                            handleKeyPress('space');
                          }
                          spaceWasSwipedRef.current = false;
                          (window as any).__spaceDown = 0;
                        }}
                        className={`flex-[3.5] flex items-center justify-center ${kbKeyHeight} ${KEY_SHAPE_CLASS[keyShape]} ${t.key} ${t.keyText} ${showKeyBorders ? `${t.border} border` : ''} shadow-sm text-xs ${KEY_FONT_CLASS[keyFontWeight]}`}
                        style={customKeyStyle}
                      >
                         {language === 'amharic' ? (phonetic ? 'አማርኛ — selam → ሰላም' : 'አማርኛ') : 'Space'}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('backspace')}
                        className={`flex-[1.4] flex items-center justify-center ${kbKeyHeight} ${KEY_SHAPE_CLASS[keyShape]} ${t.specialKey} ${t.keyText}`}>
                        <Delete className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('enter')}
                        className={`flex-[1.4] flex items-center justify-center ${kbKeyHeight} ${KEY_SHAPE_CLASS[keyShape]} ${t.specialKey} ${t.keyText}`}>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                  </>
                )}

                {/* ─── Amharic Symbols Mode (Ethiopian numbers + symbols) ─── */}
                {language === 'amharic' && symbolsActive && (
                  <>
                    <div className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                      {ETHIOPIAN_NUM_ROW_1.map((num, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + num)}
                          className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-lg text-sm font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                          {num}
                        </motion.button>
                      ))}
                    </div>
                    <div className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                      {ETHIOPIAN_NUM_ROW_2.map((num, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + num)}
                          className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-lg text-sm font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                          {num}
                        </motion.button>
                      ))}
                    </div>
                    <div className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                      {ETHIOPIAN_SYM_ROW.map((sym, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + sym)}
                          className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-lg text-xs font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}
                          style={customKeyStyle}>
                          {sym}
                        </motion.button>
                      ))}
                    </div>
                    {/* More Ethiopian punctuation & common symbols */}
                    <div className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                      {['′','″','«','»','—','…','·','⟐'].map((sym, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + sym)}
                          className={`flex-1 flex items-center justify-center h-8 rounded-lg text-xs font-medium ${t.suggestion} ${t.keyText} ${t.keyHover}`}>
                          {sym}
                        </motion.button>
                      ))}
                    </div>
                    {/* Amharic symbols bottom row mapping FIXED */}
                    <div className={`flex ${KEY_GAP_CLASS[keyboardSpacing]} justify-center`}>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => setSymbolsActive(false)}
                        className={`flex-[1.4] flex items-center justify-center ${kbKeyHeight} rounded-lg ${t.specialKey} ${t.keyText} text-xs font-bold`}>
                        አማ
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={handleLanguageToggle}
                        className={`flex-[1.4] flex items-center justify-center ${kbKeyHeight} rounded-lg ${t.specialKey} ${t.keyText} text-[9px] font-bold`}>
                        🌐 EN
                      </motion.button>
                      {/* Unified space bar */}
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                        onPointerDown={() => (window as any).__spaceDown = Date.now()}
                        onPointerUp={() => {
                          const held = Date.now() - ((window as any).__spaceDown || 0);
                          if (held > 600) startVoiceRecognition();
                          else handleKeyPress('space');
                          (window as any).__spaceDown = 0;
                        }}
                        className={`flex-[3.5] flex items-center justify-center ${kbKeyHeight} rounded-lg ${t.key} ${t.keyText} ${t.border} border shadow-sm text-xs font-medium`}
                      >
                        Space
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('backspace')}
                        className={`flex-[1.4] flex items-center justify-center ${kbKeyHeight} rounded-lg ${t.specialKey} ${t.keyText}`}>
                        <Delete className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('enter')}
                        className={`flex-[1.4] flex items-center justify-center ${kbKeyHeight} rounded-lg ${t.specialKey} ${t.keyText}`}>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </>
                )}

                {/* ─── English extra symbols when in symbols mode ─── */}
                {language === 'english' && symbolsActive && (
                  <div className="flex gap-0.5">
                    {['_','=','^','<','>','{','}'].map((sym, i) => (
                      <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                        onClick={() => updateText(text + sym)}
                        className={`flex-1 flex items-center justify-center h-8 rounded-lg text-xs ${t.suggestion} ${t.keyText} ${t.keyHover}`}>
                        {sym}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {mode === 'stickers' && (
            <motion.div key="stickers" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={kbPanelHeight}>
              {renderStickers()}
            </motion.div>
          )}
          {mode === 'gifs' && (
            <motion.div key="gifs" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={kbPanelHeight}>
              {renderGifs()}
            </motion.div>
          )}
          {mode === 'clipboard' && (
            <motion.div key="clipboard" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={kbPanelHeight}>
              {renderClipboard()}
            </motion.div>
          )}
          {mode === 'translate' && (
            <motion.div key="translate" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={keyboardHeight === 'compact' ? 'h-[260px]' : keyboardHeight === 'tall' ? 'h-[360px]' : 'h-[300px]'}>
              {renderTranslate()}
            </motion.div>
          )}
          {mode === 'handwriting' && (
            <motion.div key="handwriting" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={keyboardHeight === 'compact' ? 'h-[280px]' : keyboardHeight === 'tall' ? 'h-[380px]' : 'h-[320px]'}>
              {renderHandwriting()}
            </motion.div>
          )}
          {mode === 'settings' && (
            <motion.div key="settings" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={keyboardHeight === 'compact' ? 'h-[280px]' : keyboardHeight === 'tall' ? 'h-[380px]' : 'h-[320px]'}>
              {renderSettings()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )}
    </div>
  );
}
