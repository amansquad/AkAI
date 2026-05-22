'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard, Smile, Image, ClipboardList, Languages,
  Delete, CornerDownLeft, Copy, Trash2, Plus,
  ArrowRightLeft, Loader2, Sparkles, Send, Globe,
  ArrowUp, Pen, Palette, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type KeyboardMode = 'keyboard' | 'stickers' | 'gifs' | 'clipboard' | 'translate' | 'handwriting';
export type Language = 'english' | 'amharic';
export type ThemeName = 'default' | 'midnight' | 'ocean' | 'sunset' | 'forest' | 'ethiopian';

interface KeyboardAppProps {
  onTextChange?: (text: string) => void;
}

// ─── Theme Definitions ────────────────────────────────────────────────────
const THEMES: Record<ThemeName, {
  name: string; flag: string;
  bg: string; card: string; key: string; keyHover: string; keyActive: string; keyText: string;
  specialKey: string; accent: string; accentText: string; border: string;
  tabBar: string; tabActive: string; tabActiveText: string; suggestion: string;
}> = {
  default: {
    name: 'Classic', flag: '⬜',
    bg: 'bg-background', card: 'bg-card', key: 'bg-card', keyHover: 'hover:bg-accent',
    keyActive: 'bg-primary text-primary-foreground', keyText: 'text-foreground',
    specialKey: 'bg-muted/80', accent: 'bg-primary', accentText: 'text-primary-foreground',
    border: 'border-border/50', tabBar: 'bg-muted/20', tabActive: 'bg-primary', tabActiveText: 'text-primary-foreground',
    suggestion: 'bg-muted/60',
  },
  midnight: {
    name: 'Midnight', flag: '🌙',
    bg: 'bg-slate-950', card: 'bg-slate-900', key: 'bg-slate-800', keyHover: 'hover:bg-slate-700',
    keyActive: 'bg-violet-600 text-white', keyText: 'text-slate-100',
    specialKey: 'bg-slate-700', accent: 'bg-violet-600', accentText: 'text-white',
    border: 'border-slate-700/50', tabBar: 'bg-slate-900', tabActive: 'bg-violet-600', tabActiveText: 'text-white',
    suggestion: 'bg-slate-800',
  },
  ocean: {
    name: 'Ocean', flag: '🌊',
    bg: 'bg-cyan-950', card: 'bg-cyan-900', key: 'bg-cyan-800', keyHover: 'hover:bg-cyan-700',
    keyActive: 'bg-teal-500 text-white', keyText: 'text-cyan-50',
    specialKey: 'bg-cyan-700', accent: 'bg-teal-500', accentText: 'text-white',
    border: 'border-cyan-700/50', tabBar: 'bg-cyan-900', tabActive: 'bg-teal-500', tabActiveText: 'text-white',
    suggestion: 'bg-cyan-800',
  },
  sunset: {
    name: 'Sunset', flag: '🌅',
    bg: 'bg-orange-950', card: 'bg-orange-900', key: 'bg-orange-800', keyHover: 'hover:bg-orange-700',
    keyActive: 'bg-amber-500 text-white', keyText: 'text-orange-50',
    specialKey: 'bg-orange-700', accent: 'bg-amber-500', accentText: 'text-white',
    border: 'border-orange-700/50', tabBar: 'bg-orange-900', tabActive: 'bg-amber-500', tabActiveText: 'text-white',
    suggestion: 'bg-orange-800',
  },
  forest: {
    name: 'Forest', flag: '🌿',
    bg: 'bg-green-950', card: 'bg-green-900', key: 'bg-green-800', keyHover: 'hover:bg-green-700',
    keyActive: 'bg-emerald-500 text-white', keyText: 'text-green-50',
    specialKey: 'bg-green-700', accent: 'bg-emerald-500', accentText: 'text-white',
    border: 'border-green-700/50', tabBar: 'bg-green-900', tabActive: 'bg-emerald-500', tabActiveText: 'text-white',
    suggestion: 'bg-green-800',
  },
  ethiopian: {
    name: 'Ethiopian', flag: '🇪🇹',
    bg: 'bg-gradient-to-b from-green-900 to-yellow-900', card: 'bg-green-800/80', key: 'bg-green-700', keyHover: 'hover:bg-yellow-600',
    keyActive: 'bg-yellow-500 text-green-900', keyText: 'text-green-50',
    specialKey: 'bg-yellow-700', accent: 'bg-yellow-500', accentText: 'text-green-900',
    border: 'border-yellow-600/50', tabBar: 'bg-green-900', tabActive: 'bg-yellow-500', tabActiveText: 'text-green-900',
    suggestion: 'bg-green-700',
  },
};

// ─── Amharic Character Data ───────────────────────────────────────────────
const AMHARIC_ROWS: string[][] = [
  ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ'],
  ['ተ', 'ቸ', 'ኀ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ', 'ዘ'],
  ['ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጠ', 'ጨ', 'ጰ', 'ፀ', 'ፈ'],
  ['ፐ', 'ቨ', 'ሟ', 'ኟ', 'ዟ', 'ጟ', '፟'],
];

const AMHARIC_VOWELS: Record<string, string[]> = {
  'ሀ': ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'],
  'ለ': ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ', 'ሏ'],
  'ሐ': ['ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ', 'ሗ'],
  'መ': ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ', 'ሟ'],
  'ሠ': ['ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ', 'ሧ'],
  'ረ': ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ', 'ሯ'],
  'ሰ': ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ', 'ሷ'],
  'ሸ': ['ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ', 'ሿ'],
  'ቀ': ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ', 'ቋ'],
  'በ': ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ', 'ቧ'],
  'ተ': ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ', 'ቷ'],
  'ቸ': ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ', 'ቿ'],
  'ኀ': ['ኀ', 'ኁ', 'ኂ', 'ኃ', 'ኄ', 'ኅ', 'ኆ', 'ኋ'],
  'ነ': ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ', 'ኗ'],
  'ኘ': ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ', 'ኟ'],
  'አ': ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ'],
  'ከ': ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ', 'ኳ'],
  'ኸ': ['ኸ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'],
  'ወ': ['ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ', 'ዏ'],
  'ዘ': ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ', 'ዟ'],
  'ዠ': ['ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ', 'ዧ'],
  'የ': ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'],
  'ደ': ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ', 'ዷ'],
  'ጀ': ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ', 'ጇ'],
  'ገ': ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ', 'ጓ'],
  'ጠ': ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ', 'ጧ'],
  'ጨ': ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ', 'ጯ'],
  'ጰ': ['ጰ', 'ጱ', 'ጲ', 'ጳ', 'ጴ', 'ጵ', 'ጶ', 'ጷ'],
  'ፀ': ['ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ', 'ፆ'],
  'ፈ': ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ', 'ፏ'],
  'ፐ': ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ', 'ፗ'],
  'ቨ': ['ቨ', 'ቩ', 'ቪ', 'ቫ', 'ቬ', 'ቭ', 'ቮ'],
  'ሟ': ['ሟ'],
  'ኟ': ['ኟ'],
  'ዟ': ['ዟ'],
  'ጟ': ['ጟ'],
  '፟': ['፟'],
};

// Ethiopian / Ge'ez numbers
const ETHIOPIAN_NUMBERS = ['፩','፪','፫','፬','፭','፮','፯','፰','፱','፲','፳','፴','፵','፶','፷','፸','፹','፺','፻','፼'];
const ETHIOPIAN_SYMBOLS = ['፣','።','፤','፡','፥','፦','፧','፨','—','«','»','′','″'];

// ─── Sticker Data ─────────────────────────────────────────────────────────
const STICKER_CATEGORIES = [
  { id: 'featured', name: 'Featured', icon: '⭐', stickers: ['🇪🇹','☕','🎶','✨','💫','🌟','🎊','🥳','🎉','🙏','❤️','🫶','💪','🔥','👑','💎'] },
  { id: 'faces', name: 'Faces', icon: '😀', stickers: ['😀','😂','🥰','😎','🤩','😍','🥳','😏','🤔','😴','😇','🤗','🫠','🥺','😤','😜'] },
  { id: 'hearts', name: 'Love', icon: '❤️', stickers: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💞','💓','💗','💖','💘','💝','💟'] },
  { id: 'hands', name: 'Gestures', icon: '👍', stickers: ['👍','👎','👋','🤝','✌️','🤞','🙏','👏','🫶','🤙','💪','🤘','✊','🤚','👆','👇'] },
  { id: 'animals', name: 'Animals', icon: '🐱', stickers: ['🐱','🐶','🐻','🦊','🐰','🐼','🐨','🦁','🐯','🐸','🐵','🦄','🐝','🦋','🐙','🐧'] },
  { id: 'food', name: 'Food', icon: '☕', stickers: ['☕','🍲','🫓','🍕','🍔','🍟','🌮','🍜','🍣','🍩','🍪','🎂','🍰','🧃','🍎','🍇'] },
  { id: 'nature', name: 'Nature', icon: '🌸', stickers: ['🌸','🌺','🌻','🌹','🌷','💐','🌳','🌴','🌵','🍀','🌈','⭐','🌙','☀️','❄️','🔥'] },
  { id: 'ethiopian', name: 'Ethiopia', icon: '🇪🇹', stickers: ['🇪🇹','☕','🎶','🥁','🏔️','🌍','🦁','🦅','☀️','🌿','🍲','🫓','🎭','💃','🕺','🎪'] },
];

const GIF_CATEGORIES = [
  { id: 'hello', name: 'Hello', emoji: '👋' },
  { id: 'thanks', name: 'Thanks', emoji: '🙏' },
  { id: 'love', name: 'Love', emoji: '❤️' },
  { id: 'laugh', name: 'Laugh', emoji: '😂' },
  { id: 'celebrate', name: 'Celebrate', emoji: '🎉' },
  { id: 'sad', name: 'Sad', emoji: '😢' },
  { id: 'cool', name: 'Cool', emoji: '😎' },
  { id: 'fire', name: 'Fire', emoji: '🔥' },
];

const GIF_ITEMS: Record<string, { emoji: string; label: string; animation: string }[]> = {
  hello: [
    { emoji: '👋', label: 'Hey!', animation: 'wave' },
    { emoji: '🤗', label: 'Hi there!', animation: 'bounce' },
    { emoji: '✨', label: 'Hello!', animation: 'sparkle' },
    { emoji: '🙌', label: 'Yo!', animation: 'pulse' },
    { emoji: '🫶', label: 'Hi love!', animation: 'heartbeat' },
    { emoji: '😊', label: 'Hi!', animation: 'bounce' },
  ],
  thanks: [
    { emoji: '🙏', label: 'Thank you!', animation: 'pulse' },
    { emoji: '💕', label: 'Thanks!', animation: 'heartbeat' },
    { emoji: '✨', label: 'Appreciate it!', animation: 'sparkle' },
    { emoji: '🤝', label: 'Much obliged!', animation: 'wave' },
    { emoji: '💝', label: 'So kind!', animation: 'heartbeat' },
    { emoji: '🌟', label: 'You rock!', animation: 'sparkle' },
  ],
  love: [
    { emoji: '❤️', label: 'Love you!', animation: 'heartbeat' },
    { emoji: '😘', label: 'Muah!', animation: 'bounce' },
    { emoji: '💕', label: 'So much!', animation: 'heartbeat' },
    { emoji: '🥰', label: 'My love!', animation: 'pulse' },
    { emoji: '💗', label: 'Forever!', animation: 'heartbeat' },
    { emoji: '💑', label: 'Together!', animation: 'pulse' },
  ],
  laugh: [
    { emoji: '😂', label: 'LMAO!', animation: 'bounce' },
    { emoji: '🤣', label: 'Haha!', animation: 'shake' },
    { emoji: '😆', label: 'LOL!', animation: 'bounce' },
    { emoji: '😹', label: 'Too funny!', animation: 'shake' },
    { emoji: '🤭', label: 'Hehe!', animation: 'pulse' },
    { emoji: '😜', label: 'Silly!', animation: 'bounce' },
  ],
  celebrate: [
    { emoji: '🎉', label: 'Party!', animation: 'bounce' },
    { emoji: '🎊', label: 'Yay!', animation: 'shake' },
    { emoji: '🥳', label: 'Woohoo!', animation: 'bounce' },
    { emoji: '🍾', label: 'Cheers!', animation: 'sparkle' },
    { emoji: '🏆', label: 'Champion!', animation: 'pulse' },
    { emoji: '✨', label: 'Amazing!', animation: 'sparkle' },
  ],
  sad: [
    { emoji: '😢', label: 'So sad', animation: 'pulse' },
    { emoji: '😭', label: 'Crying!', animation: 'shake' },
    { emoji: '💔', label: 'Heartbroken', animation: 'heartbeat' },
    { emoji: '🥺', label: 'Please!', animation: 'pulse' },
    { emoji: '😞', label: 'Disappointed', animation: 'wave' },
    { emoji: '😔', label: 'Down', animation: 'pulse' },
  ],
  cool: [
    { emoji: '😎', label: 'Cool!', animation: 'bounce' },
    { emoji: '🔥', label: 'Fire!', animation: 'sparkle' },
    { emoji: '💪', label: 'Strong!', animation: 'pulse' },
    { emoji: '✌️', label: 'Peace!', animation: 'wave' },
    { emoji: '🤩', label: 'Awesome!', animation: 'sparkle' },
    { emoji: '💯', label: '100!', animation: 'bounce' },
  ],
  fire: [
    { emoji: '🔥', label: 'Lit!', animation: 'sparkle' },
    { emoji: '💥', label: 'Boom!', animation: 'shake' },
    { emoji: '⚡', label: 'Electric!', animation: 'sparkle' },
    { emoji: '🌟', label: 'Star!', animation: 'pulse' },
    { emoji: '☄️', label: 'Comet!', animation: 'shake' },
    { emoji: '🌪️', label: 'Storm!', animation: 'shake' },
  ],
};

// ─── Suggestions Data ─────────────────────────────────────────────────────
const ENGLISH_SUGGESTIONS: Record<string, string[]> = {
  '': ['the','be','to','of','and'],
  't': ['the','to','that','this','they'],
  'th': ['the','this','that','there','them'],
  'the': ['there','their','them','then','these'],
  'i': ['is','it','in','if','I'],
  'a': ['and','are','as','at','all'],
  'an': ['and','another','any','answer'],
  's': ['so','some','she','said','should'],
  'w': ['was','with','will','we','what'],
  'h': ['have','he','had','his','how'],
  'b': ['but','by','been','be','but'],
  'no': ['not','now','know','nothing'],
  'wh': ['what','when','where','which','who'],
  'ho': ['how','home','hope','house'],
  'go': ['going','good','got','great'],
  'lo': ['love','like','long','look'],
  'he': ['hello','here','help','her'],
  'ha': ['have','has','had','happy'],
  'thi': ['this','think','thing','things'],
  'goo': ['good','going','got','great'],
  'than': ['that','thank','thanks','than'],
  'ple': ['please','place','people','plan'],
};

const AMHARIC_SUGGESTIONS: Record<string, string[]> = {
  '': ['እኔ','አንቺ','እሱ','ይህ','ያ'],
  'እ': ['እኔ','እሱ','እሷ','እንዴት','እሺ'],
  'አ': ['አንቺ','አዎ','አሁን','አለ','አማርኛ'],
  'ሰ': ['ሰላም','ሰው','ሰዓት'],
  'መ': ['መሆን','መጥፎ','መልካም'],
  'ከ': ['ከዚህ','ከትናንት'],
  'ወ': ['ወደ','ወጣ','ወደፊት'],
  'እን': ['እንዴት','እንደ','እንደዚህ'],
  'ሰላ': ['ሰላም','ሰላምና','ሰላምደህ'],
  'አማ': ['አማርኛ','አማራ','አማረን'],
  'መል': ['መልካም','መልዕትት','መልስ'],
  'ጥሩ': ['ጥሩ','ጥሩነት'],
  'ስለ': ['ስለዚህ','ስለው'],
  'ያ': ['ያ','ያም','ያህል'],
};

const NEXT_WORD_EN: Record<string, string[]> = {
  'the': ['world','people','way','day','first'],
  'i': ['am','was','have','will','can'],
  'to': ['the','be','do','make','have'],
  'and': ['then','also','more','now','that'],
  'hello': ['there','friend','world','how','everyone'],
  'good': ['morning','night','luck','job','bye'],
  'thank': ['you','your','for','so','very'],
  'how': ['are','to','do','about','much'],
  'please': ['help','come','call','wait','tell'],
  'we': ['are','will','can','have','should'],
  'they': ['are','were','will','can','have'],
  'it': ['is','was','will','can','has'],
  'is': ['a','the','not','very','so'],
  'love': ['you','it','this','that','her'],
};

const NEXT_WORD_AM: Record<string, string[]> = {
  'ሰላም': ['አለም','ስላሴ','መልካም','ደህና','ሰላምና'],
  'እኔ': ['ነኝ','ነበርኩ','ማለት','እፈልጋለሁ'],
  'መልካም': ['ቀን','ሰዓት','እድል','ሰው'],
  'እንዴት': ['ነህ','ነሽ','ነው','አለ'],
  'ጥሩ': ['ቀን','ሰው','ስራ','ነገር'],
  'አመሰግናለሁ': ['ወድዴህ','በጣም','ሁሉ'],
  'ደህና': ['ሆን','መሆን','ኑር'],
};

// ─── Main Component ───────────────────────────────────────────────────────
export default function KeyboardApp({ onTextChange }: KeyboardAppProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<KeyboardMode>('keyboard');
  const [language, setLanguage] = useState<Language>('english');
  const [shiftActive, setShiftActive] = useState(false);
  const [symbolsActive, setSymbolsActive] = useState(false);
  const [ethiopianNumActive, setEthiopianNumActive] = useState(false);
  const [activeStickerCategory, setActiveStickerCategory] = useState('featured');
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
  const [showThemePicker, setShowThemePicker] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPaths, setDrawingPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  const t = THEMES[theme];

  const updateText = useCallback((newText: string) => {
    setText(newText);
    onTextChange?.(newText);
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

  const handleSuggestionClick = useCallback((word: string) => {
    const words = text.trim().split(/\s+/);
    if (words.length > 0 && words[words.length - 1] !== '') {
      words[words.length - 1] = word;
      updateText(words.join(' ') + ' ');
    } else {
      updateText(text + word + ' ');
    }
  }, [text, updateText]);

  const handleNextWordClick = useCallback((word: string) => {
    updateText(text + word + ' ');
  }, [text, updateText]);

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'backspace') {
      updateText(text.slice(0, -1));
    } else if (key === 'space') {
      updateText(text + ' ');
    } else if (key === 'enter') {
      updateText(text + '\n');
    } else if (key === 'shift') {
      setShiftActive(!shiftActive);
    } else if (key === 'symbols') {
      setSymbolsActive(!symbolsActive);
      setEthiopianNumActive(false);
      setShiftActive(false);
    } else if (key === 'ethiopianNum') {
      setEthiopianNumActive(!ethiopianNumActive);
      setSymbolsActive(false);
      setShiftActive(false);
    } else {
      let char = key;
      if (shiftActive && key.length === 1 && key.match(/[a-z]/)) {
        char = key.toUpperCase();
      }
      updateText(text + char);
      if (shiftActive) setShiftActive(false);
    }
  }, [text, shiftActive, symbolsActive, ethiopianNumActive, updateText]);

  const handleAmharicPress = useCallback((consonant: string) => {
    const vowels = AMHARIC_VOWELS[consonant];
    if (vowels && vowels.length > 0) {
      setSelectedConsonant(consonant);
      updateText(text + vowels[0]);
    }
  }, [text, updateText]);

  const handleVowelSelect = useCallback((vowel: string) => {
    // Replace last character with selected vowel form
    const lastChar = text.slice(-1);
    const currentConsonant = selectedConsonant;
    if (currentConsonant && AMHARIC_VOWELS[currentConsonant]?.includes(lastChar)) {
      updateText(text.slice(0, -1) + vowel);
    } else {
      updateText(text + vowel);
    }
  }, [text, selectedConsonant, updateText]);

  // ─── Handwriting Canvas ─────────────────────────────────────────────
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setCurrentPath([{ x, y }]);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setCurrentPath(prev => [...prev, { x, y }]);

    ctx.strokeStyle = theme === 'default' ? '#333' : '#fff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentPath.length > 0) {
      const lastPoint = currentPath[currentPath.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, [isDrawing, currentPath, theme]);

  const stopDrawing = useCallback(() => {
    if (currentPath.length > 0) {
      setDrawingPaths(prev => [...prev, currentPath]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [currentPath]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingPaths([]);
    setCurrentPath([]);
  }, []);

  // ─── Translation ────────────────────────────────────────────────────
  const handleTranslate = useCallback(async () => {
    if (!translateInput.trim()) return;
    setIsTranslating(true);
    try {
      const sourceLang = translateFrom === 'English' ? 'English' : 'Amharic';
      const targetLang = translateFrom === 'English' ? 'Amharic' : 'English';
      const response = await fetch('/api/translate', {
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

  // ─── English Keyboard Rows ──────────────────────────────────────────
  const ENGLISH_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['symbols', ',', 'space', '.', 'enter'],
  ];

  const SYMBOL_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '%', '&', '-', '+', '(', ')', '/'],
    ['shift', '*', '"', "'", ':', ';', '!', '?', '~', 'backspace'],
    ['symbols', '|', 'space', '\\', 'enter'],
  ];

  const ETHIOPIAN_NUM_ROW_1 = ['፩','፪','፫','፬','፭','፮','፯','፰','፱','፲'];
  const ETHIOPIAN_NUM_ROW_2 = ['፳','፴','፵','፶','፷','፸','፹','፺','፻','፼'];
  const ETHIOPIAN_SYM_ROW = ['፣','።','፤','፡','፥','፦','፧','፨','«','»'];

  const renderEnglishKey = (key: string) => {
    const isSpecial = ['shift', 'backspace', 'symbols', 'space', 'enter'].includes(key);
    const isWide = key === 'space';
    const isMedium = key === 'shift' || key === 'backspace' || key === 'symbols' || key === 'enter';
    let displayKey = key;
    if (key === 'backspace') displayKey = '⌫';
    if (key === 'symbols') displayKey = symbolsActive ? (language === 'amharic' ? '፩፪' : 'ABC') : (language === 'amharic' ? 'አማ' : '?123');
    if (key === 'space') displayKey = language === 'amharic' ? 'አማርኛ' : 'English';
    if (key === 'enter') displayKey = '↵';
    if (shiftActive && !isSpecial && key.length === 1 && key.match(/[a-z]/)) displayKey = key.toUpperCase();
    const isHovered = hoveredKey === key;

    return (
      <motion.button
        key={key}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05, y: -1 }}
        onMouseEnter={() => setHoveredKey(key)}
        onMouseLeave={() => setHoveredKey(null)}
        onClick={() => handleKeyPress(key)}
        className={`
          relative flex items-center justify-center rounded-xl font-medium
          transition-all duration-150 select-none
          ${isWide ? 'flex-[3] h-11' : isMedium ? 'flex-[1.5] h-11' : 'flex-1 h-11'}
          ${isHovered ? `${t.keyHover} shadow-md` : ''}
          ${isSpecial ? `${t.specialKey} ${t.keyText}` : `${t.key} ${t.keyText} ${t.border} border shadow-sm`}
        `}
      >
        {key === 'shift' && <ArrowUp className={`w-4 h-4 ${shiftActive ? 'text-yellow-500' : ''}`} />}
        {key === 'backspace' && <Delete className="w-4 h-4" />}
        {key === 'enter' && <CornerDownLeft className="w-4 h-4" />}
        {key !== 'shift' && key !== 'backspace' && key !== 'enter' && (
          <span className={isWide ? 'text-xs' : 'text-sm'}>{displayKey}</span>
        )}
      </motion.button>
    );
  };

  // ─── Render Panels ─────────────────────────────────────────────────
  const renderSuggestions = () => (
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
      {suggestions.length === 0 && nextWordSuggestions.length === 0 && (
        <span className="text-[10px] text-muted-foreground/50 px-2">
          {language === 'english' ? 'Start typing for suggestions...' : 'ጽፍ ጥቆማ ለማግኘት...'}
        </span>
      )}
    </div>
  );

  const renderStickers = () => {
    const category = STICKER_CATEGORIES.find(c => c.id === activeStickerCategory);
    return (
      <div className="flex flex-col h-full">
        <div className="flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide border-b border-border/30">
          {STICKER_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveStickerCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeStickerCategory === cat.id ? `${t.tabActive} ${t.tabActiveText} shadow-sm` : `${t.suggestion} ${t.keyText}`}`}>
              <span>{cat.icon}</span><span>{cat.name}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2">
            {category?.stickers.map((sticker, i) => (
              <motion.button key={i} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
                onClick={() => updateText(text + sticker)}
                className={`flex items-center justify-center p-2 rounded-xl ${t.key} ${t.border} border shadow-sm text-2xl aspect-square`}>
                {sticker}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGifs = () => {
    const category = GIF_ITEMS[activeGifCategory] || [];
    return (
      <div className="flex flex-col h-full">
        <div className="flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide border-b border-border/30">
          {GIF_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveGifCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeGifCategory === cat.id ? `${t.tabActive} ${t.tabActiveText} shadow-sm` : `${t.suggestion} ${t.keyText}`}`}>
              <span>{cat.emoji}</span><span>{cat.name}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {category.map((gif, i) => (
              <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                onClick={() => updateText(text + gif.emoji + ' ')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl ${t.key} ${t.border} border shadow-sm aspect-video relative overflow-hidden`}
              >
                <motion.span className="text-3xl relative z-10"
                  animate={
                    gif.animation === 'bounce' ? { y: [0, -4, 0] } :
                    gif.animation === 'pulse' ? { scale: [1, 1.1, 1] } :
                    gif.animation === 'shake' ? { x: [0, -2, 2, 0] } :
                    gif.animation === 'sparkle' ? { opacity: [1, 0.7, 1] } :
                    gif.animation === 'wave' ? { rotate: [0, 15, -15, 0] } :
                    gif.animation === 'heartbeat' ? { scale: [1, 1.15, 1, 1.15, 1] } : {}
                  }
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                  {gif.emoji}
                </motion.span>
                <span className={`text-[10px] font-medium mt-1 relative z-10 ${t.keyText} opacity-70`}>{gif.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderClipboard = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
        <span className={`text-xs font-medium ${t.keyText} opacity-70`}>Clipboard History</span>
        <Button variant="ghost" size="sm" onClick={() => { if (text.trim()) setClipboardItems(prev => [{ id: Date.now().toString(), text: text.trim(), timestamp: Date.now() }, ...prev]); }}
          className={`h-7 text-xs gap-1 ${t.keyText}`}>
          <Plus className="w-3 h-3" />Add Current
        </Button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        {clipboardItems.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full ${t.keyText} opacity-50`}>
            <ClipboardList className="w-8 h-8 mb-2" />
            <span className="text-xs">No clipboard items</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {clipboardItems.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 p-2.5 rounded-xl ${t.card} ${t.border} border shadow-sm group`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${t.keyText}`}>{item.text}</p>
                  <p className={`text-[10px] ${t.keyText} opacity-50 mt-0.5`}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => updateText(text + item.text)} className="h-7 w-7 p-0"><Copy className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setClipboardItems(prev => prev.filter(i => i.id !== item.id))} className="h-7 w-7 p-0 text-red-500"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTranslate = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
        <span className={`text-xs font-medium ${t.keyText} opacity-70`}>AI Translator</span>
        <Button variant="ghost" size="sm"
          onClick={() => { setTranslateFrom(translateFrom === 'English' ? 'Amharic' : 'English'); setTranslateInput(''); setTranslateOutput(''); }}
          className={`h-7 text-xs gap-1 ${t.keyText}`}>
          <ArrowRightLeft className="w-3 h-3" />Switch
        </Button>
      </div>
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-center"><span className={`text-xs font-semibold ${t.keyText}`}>{translateFrom}</span></div>
          <ArrowRightLeft className={`w-4 h-4 ${t.keyText} opacity-50`} />
          <div className="flex-1 text-center"><span className={`text-xs font-semibold ${t.keyText}`}>{translateFrom === 'English' ? 'Amharic' : 'English'}</span></div>
        </div>
        <div className="space-y-2">
          <textarea value={translateInput} onChange={e => setTranslateInput(e.target.value)}
            placeholder={translateFrom === 'English' ? 'Type in English...' : 'በአማርኛ ይጻፉ...'}
            className={`w-full p-3 text-sm rounded-xl ${t.card} ${t.border} border focus:outline-none resize-none min-h-[60px] ${t.keyText} placeholder:opacity-40`}
            rows={2} />
          <Button onClick={handleTranslate} disabled={isTranslating || !translateInput.trim()}
            className={`w-full gap-2 ${t.accent} ${t.accentText}`} size="sm">
            {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
            {isTranslating ? 'Translating...' : 'Translate'}
          </Button>
        </div>
        {translateOutput && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl ${t.accent}/10 ${t.border} border`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className={`text-xs font-medium mb-1 ${t.keyText}`}>Translation</p>
                <p className={`text-sm ${t.keyText}`}>{translateOutput}</p>
              </div>
              <div className="flex gap-1">
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleUseTranslation} className="h-7 w-7 p-0"><Send className="w-3 h-3" /></Button>
                </TooltipTrigger><TooltipContent>Use in text</TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(translateOutput)} className="h-7 w-7 p-0"><Copy className="w-3 h-3" /></Button>
                </TooltipTrigger><TooltipContent>Copy</TooltipContent></Tooltip></TooltipProvider>
              </div>
            </div>
          </motion.div>
        )}
        <div className="mt-auto pt-2">
          <p className={`text-[10px] text-center ${t.keyText} opacity-40`}>
            <Sparkles className="w-3 h-3 inline-block mr-1" />Powered by AI • English ↔ Amharic
          </p>
        </div>
      </div>
    </div>
  );

  const renderHandwriting = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
        <span className={`text-xs font-medium ${t.keyText} opacity-70`}>Handwriting Input</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={clearCanvas} className={`h-7 text-xs gap-1 ${t.keyText}`}>
            <Trash2 className="w-3 h-3" />Clear
          </Button>
        </div>
      </div>
      <div className="flex-1 p-2">
        <canvas
          ref={canvasRef}
          width={280}
          height={180}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-full rounded-xl ${t.card} border-2 ${t.border} border-dashed cursor-crosshair touch-none`}
          style={{ touchAction: 'none' }}
        />
      </div>
      <div className={`px-3 py-2 text-center ${t.keyText} opacity-50`}>
        <p className="text-[10px]">Draw a character or word in the canvas above</p>
        <p className="text-[10px]">Supports both English and Amharic script</p>
      </div>
    </div>
  );

  // ─── Theme Picker ───────────────────────────────────────────────────
  const renderThemePicker = () => (
    <AnimatePresence>
      {showThemePicker && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`absolute bottom-full left-2 right-2 mb-2 ${t.card} rounded-xl shadow-xl ${t.border} border p-3 z-50`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${t.keyText}`}>Choose Theme</span>
            <button onClick={() => setShowThemePicker(false)} className={`${t.keyText} opacity-50 hover:opacity-100`}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(THEMES).map(([key, tData]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setTheme(key as ThemeName); setShowThemePicker(false); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                  theme === key ? `${t.accent} ${t.accentText} border-transparent` : `${t.card} ${t.border} border`
                }`}
              >
                <span className="text-lg">{tData.flag}</span>
                <span className="text-[10px] font-medium">{tData.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ─── Vowel Family Sidebar ───────────────────────────────────────────
  const renderVowelSidebar = () => {
    if (language !== 'amharic' || !selectedConsonant) return null;
    const vowels = AMHARIC_VOWELS[selectedConsonant];
    if (!vowels || vowels.length <= 1) return null;
    return (
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: 'auto' }}
        exit={{ opacity: 0, width: 0 }}
        className="flex flex-col gap-1 py-2 px-1.5 border-l border-border/30 overflow-y-auto scrollbar-hide"
        style={{ minWidth: '48px', maxWidth: '56px' }}
      >
        <span className="text-[8px] text-center text-muted-foreground/50 mb-0.5">ድምፅ</span>
        {vowels.map((v, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVowelSelect(v)}
            className={`flex items-center justify-center w-10 h-10 rounded-lg text-base font-medium transition-colors
              ${text.endsWith(v) ? `${t.accent} ${t.accentText}` : `${t.key} ${t.keyText} ${t.keyHover}`}
              ${t.border} border shadow-sm`}
          >
            {v}
          </motion.button>
        ))}
      </motion.div>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────
  const currentRows = ethiopianNumActive ? null : (symbolsActive ? SYMBOL_ROWS : ENGLISH_ROWS);

  return (
    <div className={`flex flex-col h-full ${t.bg} rounded-lg overflow-hidden transition-colors duration-300`}>
      {/* Text Display Area */}
      <div className="flex-1 min-h-[60px] p-2">
        <div className={`h-full rounded-xl ${t.card} ${t.border} border p-2.5 overflow-y-auto`}>
          {text ? (
            <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${t.keyText}`}>{text}</p>
          ) : (
            <p className={`text-sm italic opacity-40 ${t.keyText}`}>{language === 'english' ? 'Tap the keyboard to start typing...' : 'ቁልፉን መታ በማድረግ ይጻፉ...'}</p>
          )}
        </div>
      </div>

      {/* Suggestions Bar */}
      {mode === 'keyboard' && (
        <div className={`${t.tabBar} border-t border-b ${t.border}`}>
          {renderSuggestions()}
        </div>
      )}

      {/* Mode Tab Bar */}
      <div className={`flex items-center gap-0.5 px-2 py-1.5 border-t ${t.border} ${t.tabBar} relative`}>
        {renderThemePicker()}
        {[
          { id: 'keyboard' as KeyboardMode, label: language === 'english' ? 'ABC' : 'አማ', icon: Keyboard },
          { id: 'stickers' as KeyboardMode, label: 'Stickers', icon: Smile },
          { id: 'gifs' as KeyboardMode, label: 'GIFs', icon: Image },
          { id: 'clipboard' as KeyboardMode, label: 'Clip', icon: ClipboardList },
          { id: 'translate' as KeyboardMode, label: 'AI', icon: Sparkles },
          { id: 'handwriting' as KeyboardMode, label: 'Draw', icon: Pen },
        ].map(tab => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              setMode(tab.id);
              if (tab.id === 'keyboard') setSymbolsActive(false);
            }}
            className={`
              flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all duration-200
              ${mode === tab.id
                ? `${t.tabActive} ${t.tabActiveText} shadow-sm`
                : `${t.keyText} opacity-60 hover:opacity-100`}
            `}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </motion.button>
        ))}
        {/* Language Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          onClick={() => {
            setLanguage(language === 'english' ? 'amharic' : 'english');
            setSelectedConsonant(null);
            setSymbolsActive(false);
            setEthiopianNumActive(false);
            if (mode !== 'keyboard') setMode('keyboard');
          }}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-xl ${t.accent} ${t.accentText} shadow-sm`}
          title={`Switch to ${language === 'english' ? 'Amharic' : 'English'}`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">{language === 'english' ? 'አማ' : 'EN'}</span>
        </motion.button>
        {/* Theme Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          onClick={() => setShowThemePicker(!showThemePicker)}
          className={`flex items-center justify-center w-8 h-8 rounded-xl ${t.suggestion} ${t.keyText}`}
          title="Change theme"
        >
          <Palette className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Keyboard Content */}
      <div className={`${t.bg} border-t ${t.border}`} style={{ minHeight: mode === 'keyboard' ? '200px' : '240px' }}>
        <AnimatePresence mode="wait">
          {mode === 'keyboard' && (
            <motion.div key="keyboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              <div className="flex">
                {/* Main Keyboard Area */}
                <div className="flex-1 flex flex-col gap-1.5 p-2">
                  {language === 'english' && currentRows && currentRows.map((row, ri) => (
                    <div key={ri} className={`flex gap-1 ${ri === 1 ? 'px-4' : ''}`}>
                      {row.map(key => renderEnglishKey(key))}
                    </div>
                  ))}
                  {language === 'amharic' && !ethiopianNumActive && (
                    <>
                      {AMHARIC_ROWS.map((row, ri) => (
                        <div key={ri} className="flex gap-1 justify-center">
                          {row.map(consonant => {
                            const isHovered = hoveredKey === consonant;
                            const isSelected = selectedConsonant === consonant;
                            return (
                              <motion.button
                                key={consonant}
                                whileTap={{ scale: 0.92 }}
                                whileHover={{ scale: 1.08, y: -1 }}
                                onMouseEnter={() => setHoveredKey(consonant)}
                                onMouseLeave={() => setHoveredKey(null)}
                                onClick={() => handleAmharicPress(consonant)}
                                className={`
                                  flex items-center justify-center flex-1 h-11 rounded-xl font-medium
                                  transition-all duration-150 select-none text-base
                                  ${isSelected ? `ring-2 ring-yellow-500/60` : ''}
                                  ${isHovered ? `${t.keyHover} shadow-md` : ''}
                                  ${t.key} ${t.keyText} ${t.border} border shadow-sm
                                `}
                              >
                                {consonant}
                              </motion.button>
                            );
                          })}
                        </div>
                      ))}
                      {/* Amharic special keys row */}
                      <div className="flex gap-1">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleKeyPress('backspace')}
                          className={`flex-[1.5] flex items-center justify-center h-11 rounded-xl ${t.specialKey} ${t.keyText}`}>
                          <Delete className="w-4 h-4" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleKeyPress('space')}
                          className={`flex-[3] flex items-center justify-center h-11 rounded-xl ${t.key} ${t.keyText} ${t.border} border shadow-sm text-xs font-medium`}>
                          አማርኛ
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleKeyPress('enter')}
                          className={`flex-[1.5] flex items-center justify-center h-11 rounded-xl ${t.specialKey} ${t.keyText}`}>
                          <CornerDownLeft className="w-4 h-4" />
                        </motion.button>
                      </div>
                      {/* Amharic punctuation + Ethiopian numbers toggle */}
                      <div className="flex gap-1">
                        {[...ETHIOPIAN_SYMBOLS.slice(0, 6), '፩፪'].map((punct, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              if (punct === '፩፪') {
                                setEthiopianNumActive(!ethiopianNumActive);
                                setSymbolsActive(false);
                              } else {
                                updateText(text + punct);
                              }
                            }}
                            className={`flex-1 flex items-center justify-center h-9 rounded-lg text-sm font-medium transition-colors
                              ${punct === '፩፪' && ethiopianNumActive ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`}
                              ${t.keyHover}`}
                          >
                            {punct}
                          </motion.button>
                        ))}
                      </div>
                    </>
                  )}
                  {language === 'amharic' && ethiopianNumActive && (
                    <>
                      <div className="flex gap-1 justify-center">
                        {ETHIOPIAN_NUM_ROW_1.map((num, i) => (
                          <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                            onClick={() => updateText(text + num)}
                            className={`flex-1 flex items-center justify-center h-11 rounded-xl text-base font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                            {num}
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex gap-1 justify-center">
                        {ETHIOPIAN_NUM_ROW_2.map((num, i) => (
                          <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                            onClick={() => updateText(text + num)}
                            className={`flex-1 flex items-center justify-center h-11 rounded-xl text-base font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                            {num}
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex gap-1 justify-center">
                        {ETHIOPIAN_SYM_ROW.map((sym, i) => (
                          <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                            onClick={() => updateText(text + sym)}
                            className={`flex-1 flex items-center justify-center h-11 rounded-xl text-sm font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                            {sym}
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEthiopianNumActive(false)}
                          className={`flex-[1.5] flex items-center justify-center h-11 rounded-xl ${t.specialKey} ${t.keyText} text-xs`}>
                          አማ
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleKeyPress('space')}
                          className={`flex-[3] flex items-center justify-center h-11 rounded-xl ${t.key} ${t.keyText} ${t.border} border shadow-sm text-xs`}>
                          አማርኛ
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleKeyPress('backspace')}
                          className={`flex-[1.5] flex items-center justify-center h-11 rounded-xl ${t.specialKey} ${t.keyText}`}>
                          <Delete className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </>
                  )}
                  {language === 'english' && symbolsActive && (
                    <div className="flex gap-1">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setSymbolsActive(false); setEthiopianNumActive(true); }}
                        className={`flex-[1.5] flex items-center justify-center h-9 rounded-lg ${t.suggestion} ${t.keyText} text-xs ${t.keyHover}`}>
                        ፩፪
                      </motion.button>
                      {['_','=','^','<','>','{','}'].map((sym, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + sym)}
                          className={`flex-1 flex items-center justify-center h-9 rounded-lg text-sm ${t.suggestion} ${t.keyText} ${t.keyHover}`}>
                          {sym}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Vowel Family Sidebar */}
                {renderVowelSidebar()}
              </div>
            </motion.div>
          )}

          {mode === 'stickers' && (
            <motion.div key="stickers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[240px]">
              {renderStickers()}
            </motion.div>
          )}
          {mode === 'gifs' && (
            <motion.div key="gifs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[240px]">
              {renderGifs()}
            </motion.div>
          )}
          {mode === 'clipboard' && (
            <motion.div key="clipboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[240px]">
              {renderClipboard()}
            </motion.div>
          )}
          {mode === 'translate' && (
            <motion.div key="translate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[300px]">
              {renderTranslate()}
            </motion.div>
          )}
          {mode === 'handwriting' && (
            <motion.div key="handwriting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[260px]">
              {renderHandwriting()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
