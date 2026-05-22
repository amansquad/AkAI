'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard, Smile, Image, ClipboardList, Languages,
  Delete, CornerDownLeft, Copy, Trash2, Plus,
  ArrowRightLeft, Loader2, Sparkles, Send, Globe,
  ArrowUp, Pen, Palette, X, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type KeyboardMode = 'keyboard' | 'stickers' | 'gifs' | 'clipboard' | 'translate' | 'handwriting' | 'settings';
export type Language = 'english' | 'amharic';
export type ThemeName = 'default' | 'midnight' | 'ocean' | 'sunset' | 'forest' | 'ethiopian' | 'rose' | 'neon' | 'candy' | 'arctic' | 'cherry' | 'sand';

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
  rose: {
    name: 'Rose', flag: '🌹',
    bg: 'bg-rose-950', card: 'bg-rose-900', key: 'bg-rose-800', keyHover: 'hover:bg-rose-700',
    keyActive: 'bg-pink-500 text-white', keyText: 'text-rose-50',
    specialKey: 'bg-rose-700', accent: 'bg-pink-500', accentText: 'text-white',
    border: 'border-rose-700/50', tabBar: 'bg-rose-900', tabActive: 'bg-pink-500', tabActiveText: 'text-white',
    suggestion: 'bg-rose-800',
  },
  neon: {
    name: 'Neon', flag: '💜',
    bg: 'bg-gray-950', card: 'bg-gray-900', key: 'bg-gray-800', keyHover: 'hover:bg-gray-700',
    keyActive: 'bg-lime-400 text-gray-950', keyText: 'text-gray-100',
    specialKey: 'bg-gray-700', accent: 'bg-lime-400', accentText: 'text-gray-950',
    border: 'border-gray-700/50', tabBar: 'bg-gray-900', tabActive: 'bg-lime-400', tabActiveText: 'text-gray-950',
    suggestion: 'bg-gray-800',
  },
  candy: {
    name: 'Candy', flag: '🍬',
    bg: 'bg-fuchsia-950', card: 'bg-fuchsia-900', key: 'bg-fuchsia-800', keyHover: 'hover:bg-fuchsia-700',
    keyActive: 'bg-pink-400 text-white', keyText: 'text-fuchsia-50',
    specialKey: 'bg-fuchsia-700', accent: 'bg-pink-400', accentText: 'text-white',
    border: 'border-fuchsia-700/50', tabBar: 'bg-fuchsia-900', tabActive: 'bg-pink-400', tabActiveText: 'text-white',
    suggestion: 'bg-fuchsia-800',
  },
  arctic: {
    name: 'Arctic', flag: '❄️',
    bg: 'bg-sky-950', card: 'bg-sky-900', key: 'bg-sky-800', keyHover: 'hover:bg-sky-700',
    keyActive: 'bg-sky-400 text-sky-950', keyText: 'text-sky-50',
    specialKey: 'bg-sky-700', accent: 'bg-sky-400', accentText: 'text-sky-950',
    border: 'border-sky-700/50', tabBar: 'bg-sky-900', tabActive: 'bg-sky-400', tabActiveText: 'text-sky-950',
    suggestion: 'bg-sky-800',
  },
  cherry: {
    name: 'Cherry', flag: '🍒',
    bg: 'bg-red-950', card: 'bg-red-900', key: 'bg-red-800', keyHover: 'hover:bg-red-700',
    keyActive: 'bg-red-400 text-white', keyText: 'text-red-50',
    specialKey: 'bg-red-700', accent: 'bg-red-400', accentText: 'text-white',
    border: 'border-red-700/50', tabBar: 'bg-red-900', tabActive: 'bg-red-400', tabActiveText: 'text-white',
    suggestion: 'bg-red-800',
  },
  sand: {
    name: 'Sand', flag: '🏜️',
    bg: 'bg-amber-950', card: 'bg-amber-900', key: 'bg-amber-800', keyHover: 'hover:bg-amber-700',
    keyActive: 'bg-amber-400 text-amber-950', keyText: 'text-amber-50',
    specialKey: 'bg-amber-700', accent: 'bg-amber-400', accentText: 'text-amber-950',
    border: 'border-amber-700/50', tabBar: 'bg-amber-900', tabActive: 'bg-amber-400', tabActiveText: 'text-amber-950',
    suggestion: 'bg-amber-800',
  },
};

// ─── Long Press Alternates ────────────────────────────────────────────────
const LONG_PRESS_ALTERNATES: Record<string, string[]> = {
  'a': ['@', 'á', 'à', 'ä', 'ã', 'â'],
  'e': ['é', 'è', 'ë', 'ê', '3'],
  'i': ['í', 'ì', 'ï', 'î', '8'],
  'o': ['ó', 'ò', 'ö', 'õ', 'ô', '9'],
  'u': ['ú', 'ù', 'ü', 'û', '7'],
  'c': ['ç', 'ć', 'č'],
  'n': ['ñ', 'ń', 'ň'],
  's': ['ß', 'ś', 'š'],
  '.': [',', ';', ':', '!', '?'],
  ',': [';', ':', '!', '?', '.'],
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
  { id: 'smileys', name: 'Smileys', icon: '😀', stickers: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'] },
  { id: 'hearts', name: 'Love', icon: '❤️', stickers: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫶','🤝','💏','💑','🏩','💒','💍','💎','🌹','🌷','💐','🌸','🌺','🦋','✨','💫','🌟','⭐'] },
  { id: 'hands', name: 'Gestures', icon: '👍', stickers: ['👍','👎','👊','✊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄'] },
  { id: 'animals', name: 'Animals', icon: '🐱', stickers: ['🐱','🐶','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔'] },
  { id: 'food', name: 'Food', icon: '☕', stickers: ['☕','🍲','🫓','🍕','🍔','🍟','🌮','🍜','🍣','🍩','🍪','🎂','🍰','🧃','🍎','🍇','🍊','🍋','🍌','🍉','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🫛','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯'] },
  { id: 'nature', name: 'Nature', icon: '🌸', stickers: ['🌸','🌺','🌻','🌹','🌷','💐','🌳','🌴','🌵','🍀','🌈','⭐','🌙','☀️','❄️','🔥','🌦️','🌤️','⛅','🌥️','🌦️','🌧️','⛈️','🌩️','🌪️','🌫️','🌬️','🌀','🌊','💧','💦','☔','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🌍','🌎','🌏','🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','🌙','🌚','🌛','🌜','☀️','🌝','🌞','⭐','🌟','🌠','🌌','☁️','⛅','⛈️','🌤️','🌥️','🌦️','🌧️','🌨️','🌩️','🌪️'] },
  { id: 'travel', name: 'Travel', icon: '✈️', stickers: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','⛽','🛞','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🛶','🚤','🛳️','⛴️','🛥️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🗺️','🧭','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏟️','🏛️','🏗️','🧱','🪨','🪵','🛖','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩️','🕋'] },
  { id: 'sports', name: 'Sports', icon: '⚽', stickers: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤸','🤺','⛹️','🤾','🏌️','🏇','🧘','🛀','🛌','🤱','👩‍🍼','👨‍🍼','🧑‍🍼','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🪈','🎲','♟️','🎯','🎳','🎮','🕹️','🧩','🪄','🎰'] },
  { id: 'objects', name: 'Objects', icon: '💡', stickers: ['💡','🔦','🕯️','💎','🔑','🗝️','🪤','🧲','💰','💳','💴','💵','💶','💷','🪙','💸','🧾','💼','📁','📂','📅','📆','🗒️','🗓️','📇','📈','📉','📊','📋','📌','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','🗑️','🔒','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','🛠️','🗡️','⚔️','💣','🪃','🏹','🛡️','🪚','🔧','🪛','🔩','⚙️','🗜️','⚖️','🦯','🔗','⛓️','🪝','🧰','🧲','🪜','🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🩻','🚪','🛗','🪞','🪟','🛏️','🛋️','🪑','🚽','🪠','🚿','🛁','🪤','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪥','🧽','🧯','🛒','🚬','⚰️','🪦','⚱️','🧿','🪬','🗿','🪧','🪪'] },
  { id: 'symbols', name: 'Symbols', icon: '💫', stickers: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','👁️‍🗨️','🔚','🔙','🔛','🔝','🔜','〰️','➰','➿','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛'] },
  { id: 'flags', name: 'Flags', icon: '🏁', stickers: ['🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇪🇹','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇵🇹','🇧🇷','🇷🇺','🇨🇳','🇯🇵','🇰🇷','🇮🇳','🇦🇺','🇨🇦','🇲🇽','🇦🇷','🇿🇦','🇳🇬','🇰🇪','🇪🇬','🇸🇦','🇦🇪','🇶🇦','🇮🇱','🇹🇷','🇬🇷','🇳🇱','🇧🇪','🇨🇭','🇦🇹','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇵🇱','🇺🇦','🇨🇿','🇮🇪','🇮🇸','🇳🇿','🇸🇬','🇹🇭','🇻🇳','🇲🇾','🇵🇭','🇮🇩','🇵🇰','🇧🇩','🇱🇰','🇲🇲','🇰🇭','🇱🇦'] },
  { id: 'ethiopian', name: 'Ethiopia', icon: '🇪🇹', stickers: ['🇪🇹','☕','🎶','🥁','🏔️','🌍','🦁','🦅','☀️','🌿','🍲','🫓','🎭','💃','🕺','🎪','💪','🔥','👑','💎','✨','💫','🌟','🙏','❤️','🫶','🎊','🥳','🎉','⭐','🌈','🦋','🌸','🌺','🎵','🎤','🪘','🪇','🎺','🎶','🎵','🎼','🏙️','🕌','⛪','🗺️','📖','🪡','🧵','🧶','🪆','🏺','🌍','🌎','🌏'] },
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
  { id: 'angry', name: 'Angry', emoji: '😡' },
  { id: 'sleepy', name: 'Sleepy', emoji: '😴' },
  { id: 'thinking', name: 'Think', emoji: '🤔' },
  { id: 'shocked', name: 'Shocked', emoji: '😱' },
  { id: 'peace', name: 'Peace', emoji: '✌️' },
  { id: 'hug', name: 'Hug', emoji: '🤗' },
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
  angry: [
    { emoji: '😡', label: 'Angry!', animation: 'shake' },
    { emoji: '🤬', label: 'Furious!', animation: 'shake' },
    { emoji: '😤', label: 'Huff!', animation: 'pulse' },
    { emoji: '💢', label: 'Mad!', animation: 'shake' },
    { emoji: '👊', label: 'Fight!', animation: 'bounce' },
    { emoji: '👹', label: 'Demon!', animation: 'pulse' },
  ],
  sleepy: [
    { emoji: '😴', label: 'Sleeping!', animation: 'pulse' },
    { emoji: '🥱', label: 'Yawn!', animation: 'bounce' },
    { emoji: '😪', label: 'Tired!', animation: 'pulse' },
    { emoji: '🛌', label: 'Bed time!', animation: 'wave' },
    { emoji: '💤', label: 'Zzz!', animation: 'bounce' },
    { emoji: '🌙', label: 'Night!', animation: 'sparkle' },
  ],
  thinking: [
    { emoji: '🤔', label: 'Hmm...', animation: 'pulse' },
    { emoji: '🧐', label: 'Inspect!', animation: 'wave' },
    { emoji: '🤨', label: 'Really?', animation: 'pulse' },
    { emoji: '💡', label: 'Idea!', animation: 'sparkle' },
    { emoji: '💭', label: 'Thinking...', animation: 'pulse' },
    { emoji: '🫤', label: 'Not sure', animation: 'wave' },
  ],
  shocked: [
    { emoji: '😱', label: 'OMG!', animation: 'shake' },
    { emoji: '😲', label: 'What?!', animation: 'bounce' },
    { emoji: '😨', label: 'Scared!', animation: 'shake' },
    { emoji: '🫢', label: 'Gasp!', animation: 'pulse' },
    { emoji: '😯', label: 'Wow!', animation: 'bounce' },
    { emoji: '🙀', label: 'Shocked!', animation: 'shake' },
  ],
  peace: [
    { emoji: '✌️', label: 'Peace!', animation: 'wave' },
    { emoji: '🕊️', label: 'Dove!', animation: 'bounce' },
    { emoji: '☮️', label: 'Harmony!', animation: 'sparkle' },
    { emoji: '🤞', label: 'Fingers!', animation: 'pulse' },
    { emoji: '🌍', label: 'World!', animation: 'sparkle' },
    { emoji: '🌸', label: 'Calm!', animation: 'pulse' },
  ],
  hug: [
    { emoji: '🤗', label: 'Hug!', animation: 'heartbeat' },
    { emoji: '🫂', label: 'Cuddle!', animation: 'pulse' },
    { emoji: '🤗', label: 'Comfort!', animation: 'bounce' },
    { emoji: '💕', label: 'Care!', animation: 'heartbeat' },
    { emoji: '🥰', label: 'Sweet!', animation: 'pulse' },
    { emoji: '💝', label: 'Warmth!', animation: 'heartbeat' },
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
  const [prevMode, setPrevMode] = useState<KeyboardMode>('keyboard');
  const [language, setLanguage] = useState<Language>('english');
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
  const [showThemePicker, setShowThemePicker] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPaths, setDrawingPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  // New state for Change 1: Long press
  const [longPressKey, setLongPressKey] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New state for Change 2: Recent emojis
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // New state for Change 4: Handwriting suggestions
  const [hwSuggestions, setHwSuggestions] = useState<string[]>([]);
  const [selectedHwSuggestion, setSelectedHwSuggestion] = useState<string | null>(null);

  // New state for Change 6: Settings
  const [keyPressFeedback, setKeyPressFeedback] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState<'compact' | 'normal' | 'tall'>('normal');
  const [showNumberRow, setShowNumberRow] = useState(true);
  const [autoSpaceAfterPunctuation, setAutoSpaceAfterPunctuation] = useState(true);
  const [keyPopupOnLongPress, setKeyPopupOnLongPress] = useState(true);

  // Animation state for Change 7
  const [textBounce, setTextBounce] = useState(false);
  const [rippleKey, setRippleKey] = useState<string | null>(null);

  const t = THEMES[theme];

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

  // Change 2: Add emoji to recent
  const addRecentEmoji = useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 24);
    });
  }, []);

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
    // Ripple effect
    setRippleKey(key);
    setTimeout(() => setRippleKey(null), 400);

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
      setShiftActive(false);
      setSelectedConsonant(null);
    } else {
      let char = key;
      if (shiftActive && key.length === 1 && key.match(/[a-z]/)) {
        char = key.toUpperCase();
      }
      let newText = text + char;
      // Auto-space after punctuation
      if (autoSpaceAfterPunctuation && key.length === 1 && ['.','!','?',';',':'].includes(key)) {
        newText = text + char + ' ';
      }
      updateText(newText);
      if (shiftActive) setShiftActive(false);
    }
  }, [text, shiftActive, symbolsActive, updateText, autoSpaceAfterPunctuation]);

  const handleAmharicPress = useCallback((consonant: string) => {
    const vowels = AMHARIC_VOWELS[consonant];
    if (vowels && vowels.length > 0) {
      setSelectedConsonant(consonant);
      updateText(text + vowels[0]);
    }
  }, [text, updateText]);

  const handleVowelSelect = useCallback((vowel: string) => {
    const lastChar = text.slice(-1);
    const currentConsonant = selectedConsonant;
    if (currentConsonant && AMHARIC_VOWELS[currentConsonant]?.includes(lastChar)) {
      updateText(text.slice(0, -1) + vowel);
    } else {
      updateText(text + vowel);
    }
  }, [text, selectedConsonant, updateText]);

  // Change 1: Long press handlers
  const handlePointerDown = useCallback((key: string) => {
    if (language !== 'english') return;
    if (!keyPopupOnLongPress) return;
    if (!LONG_PRESS_ALTERNATES[key]) return;
    longPressTimerRef.current = setTimeout(() => {
      setLongPressKey(key);
    }, 300);
  }, [language, keyPopupOnLongPress]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleAlternateSelect = useCallback((alt: string) => {
    updateText(text + alt);
    setLongPressKey(null);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [text, updateText]);

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
      // Change 4: Generate suggestions when path is completed
      const suggestions = language === 'english'
        ? ['a','b','c','d','e','f'].sort(() => Math.random() - 0.5).slice(0, 5)
        : ['ሀ','ለ','መ','ሰ','በ','ወ'].sort(() => Math.random() - 0.5).slice(0, 5);
      setHwSuggestions(suggestions);
      if (suggestions.length > 0) setSelectedHwSuggestion(suggestions[0]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [currentPath, language]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingPaths([]);
    setCurrentPath([]);
    setHwSuggestions([]);
    setSelectedHwSuggestion(null);
  }, []);

  const confirmHwSuggestion = useCallback(() => {
    if (selectedHwSuggestion) {
      updateText(text + selectedHwSuggestion);
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
  // Change 3: Language button moved into bottom row
  const ENGLISH_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['symbols', 'language', 'space', '.', 'enter'],
  ];

  const SYMBOL_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '%', '&', '-', '+', '(', ')', '/'],
    ['shift', '*', '"', "'", ':', ';', '!', '?', '~', 'backspace'],
    ['symbols', 'language', 'space', '\\', 'enter'],
  ];

  const ETHIOPIAN_NUM_ROW_1 = ['፩','፪','፫','፬','፭','፮','፯','፰','፱','፲'];
  const ETHIOPIAN_NUM_ROW_2 = ['፳','፴','፵','፶','፷','፸','፹','፺','፻','፼'];
  const ETHIOPIAN_SYM_ROW = ['፣','።','፤','፡','፥','፦','፧','፨','«','»'];

  // Change 3: Language toggle handler (now from keyboard row)
  const handleLanguageToggle = useCallback(() => {
    setLanguage(language === 'english' ? 'amharic' : 'english');
    setSelectedConsonant(null);
    setSymbolsActive(false);
    if (mode !== 'keyboard') setMode('keyboard');
  }, [language, mode]);

  const renderEnglishKey = (key: string) => {
    const isSpecial = ['shift', 'backspace', 'symbols', 'space', 'enter', 'language'].includes(key);
    const isWide = key === 'space';
    const isMedium = key === 'shift' || key === 'backspace' || key === 'symbols' || key === 'enter' || key === 'language';
    let displayKey = key;
    if (key === 'backspace') displayKey = '⌫';
    if (key === 'symbols') displayKey = symbolsActive ? (language === 'amharic' ? 'አማ' : 'ABC') : (language === 'amharic' ? '፩፪' : '?123');
    if (key === 'space') displayKey = language === 'amharic' ? 'አማርኛ' : 'English';
    if (key === 'enter') displayKey = '↵';
    if (key === 'language') displayKey = language === 'english' ? '🌐 አማ' : '🌐 EN';
    if (shiftActive && !isSpecial && key.length === 1 && key.match(/[a-z]/)) displayKey = key.toUpperCase();
    const isHovered = hoveredKey === key;
    const isLongPressed = longPressKey === key;
    const isRippled = rippleKey === key;

    return (
      <motion.button
        key={key}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05, y: -1 }}
        onMouseEnter={() => setHoveredKey(key)}
        onMouseLeave={() => { setHoveredKey(null); handlePointerUp(); }}
        onClick={() => {
          if (key === 'language') {
            handleLanguageToggle();
          } else {
            handleKeyPress(key);
          }
        }}
        onPointerDown={() => handlePointerDown(key)}
        onPointerUp={handlePointerUp}
        className={`
          relative flex items-center justify-center rounded-xl font-medium
          transition-all duration-150 select-none overflow-visible
          ${isWide ? 'flex-[3] h-11' : isMedium ? 'flex-[1.5] h-11' : 'flex-1 h-11'}
          ${isHovered ? `${t.keyHover} shadow-md` : ''}
          ${isSpecial ? `${t.specialKey} ${t.keyText}` : `${t.key} ${t.keyText} ${t.border} border shadow-sm`}
        `}
      >
        {/* Ripple effect */}
        {isRippled && (
          <motion.span
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 rounded-xl ${t.accent} pointer-events-none`}
          />
        )}
        {key === 'shift' && <ArrowUp className={`w-4 h-4 ${shiftActive ? 'text-yellow-500' : ''}`} />}
        {key === 'backspace' && <Delete className="w-4 h-4" />}
        {key === 'enter' && <CornerDownLeft className="w-4 h-4" />}
        {key === 'language' && <span className="text-[10px] font-bold">{displayKey}</span>}
        {key !== 'shift' && key !== 'backspace' && key !== 'enter' && key !== 'language' && (
          <span className={isWide ? 'text-xs' : 'text-sm'}>{displayKey}</span>
        )}
        {/* Change 1: Long press popup */}
        {isLongPressed && LONG_PRESS_ALTERNATES[key] && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 ${t.card} ${t.border} border rounded-xl shadow-2xl p-1.5 z-50 flex gap-1 min-w-max`}
          >
            {LONG_PRESS_ALTERNATES[key].map((alt, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleAlternateSelect(alt); }}
                className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium ${t.key} ${t.keyText} ${t.keyHover} ${t.border} border shadow-sm`}
              >
                {alt}
              </motion.button>
            ))}
          </motion.div>
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

  // Change 2: Stickers with recent emojis
  const renderStickers = () => {
    const category = activeStickerCategory === 'recent'
      ? { id: 'recent', name: 'Recent', icon: '🕐', stickers: recentEmojis }
      : STICKER_CATEGORIES.find(c => c.id === activeStickerCategory);
    const allCategories = [
      ...(recentEmojis.length > 0 ? [{ id: 'recent', name: 'Recent', icon: '🕐', stickers: recentEmojis }] : []),
      ...STICKER_CATEGORIES,
    ];
    return (
      <div className="flex flex-col h-full">
        <div className="flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide border-b border-border/30">
          {allCategories.map(cat => (
            <motion.button key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveStickerCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeStickerCategory === cat.id ? `${t.tabActive} ${t.tabActiveText} shadow-sm` : `${t.suggestion} ${t.keyText}`}`}>
              <span>{cat.icon}</span><span>{cat.name}</span>
            </motion.button>
          ))}
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          {activeStickerCategory === 'recent' && recentEmojis.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${t.keyText} opacity-50`}>
              <span className="text-2xl mb-2">🕐</span>
              <span className="text-xs">No recent emojis yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {category?.stickers.map((sticker, i) => (
                <motion.button key={i} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
                  onClick={() => { updateText(text + sticker); addRecentEmoji(sticker); }}
                  className={`flex items-center justify-center p-2 rounded-xl ${t.key} ${t.border} border shadow-sm text-2xl aspect-square`}>
                  {sticker}
                </motion.button>
              ))}
            </div>
          )}
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
            <motion.button key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveGifCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeGifCategory === cat.id ? `${t.tabActive} ${t.tabActiveText} shadow-sm` : `${t.suggestion} ${t.keyText}`}`}>
              <span>{cat.emoji}</span><span>{cat.name}</span>
            </motion.button>
          ))}
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {category.map((gif, i) => (
              <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                onClick={() => { updateText(text + gif.emoji + ' '); addRecentEmoji(gif.emoji); }}
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
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm" onClick={() => { if (text.trim()) setClipboardItems(prev => [{ id: Date.now().toString(), text: text.trim(), timestamp: Date.now() }, ...prev]); }}
            className={`h-7 text-xs gap-1 ${t.keyText}`}>
            <Plus className="w-3 h-3" />Add Current
          </Button>
        </motion.div>
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
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" onClick={() => updateText(text + item.text)} className="h-7 w-7 p-0"><Copy className="w-3 h-3" /></Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" onClick={() => setClipboardItems(prev => prev.filter(i => i.id !== item.id))} className="h-7 w-7 p-0 text-red-500"><Trash2 className="w-3 h-3" /></Button>
                  </motion.div>
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
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm"
            onClick={() => { setTranslateFrom(translateFrom === 'English' ? 'Amharic' : 'English'); setTranslateInput(''); setTranslateOutput(''); }}
            className={`h-7 text-xs gap-1 ${t.keyText}`}>
            <ArrowRightLeft className="w-3 h-3" />Switch
          </Button>
        </motion.div>
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
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleTranslate} disabled={isTranslating || !translateInput.trim()}
              className={`w-full gap-2 ${t.accent} ${t.accentText}`} size="sm">
              {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
              {isTranslating ? 'Translating...' : 'Translate'}
            </Button>
          </motion.div>
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
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" onClick={handleUseTranslation} className="h-7 w-7 p-0"><Send className="w-3 h-3" /></Button>
                  </motion.div>
                </TooltipTrigger><TooltipContent>Use in text</TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(translateOutput)} className="h-7 w-7 p-0"><Copy className="w-3 h-3" /></Button>
                  </motion.div>
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

  // Change 4: Enhanced handwriting with suggestions and confirm
  const renderHandwriting = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
        <span className={`text-xs font-medium ${t.keyText} opacity-70`}>Handwriting Input</span>
        <div className="flex gap-1">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="sm" onClick={clearCanvas} className={`h-7 text-xs gap-1 ${t.keyText}`}>
              <Trash2 className="w-3 h-3" />Clear & Try Again
            </Button>
          </motion.div>
        </div>
      </div>
      <div className="flex-1 p-2">
        <canvas
          ref={canvasRef}
          width={280}
          height={160}
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
      {/* Suggested characters row */}
      {hwSuggestions.length > 0 && (
        <div className={`px-3 py-2 border-t ${t.border}`}>
          <p className={`text-[10px] font-medium mb-1.5 ${t.keyText} opacity-60`}>Suggested characters:</p>
          <div className="flex gap-1.5">
            {hwSuggestions.map((sug, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedHwSuggestion(sug)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg text-base font-medium border shadow-sm transition-all
                  ${selectedHwSuggestion === sug ? `${t.accent} ${t.accentText} border-transparent` : `${t.key} ${t.keyText} ${t.border}`}`}
              >
                {sug}
              </motion.button>
            ))}
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-2">
            <Button onClick={confirmHwSuggestion} disabled={!selectedHwSuggestion}
              className={`w-full gap-2 ${t.accent} ${t.accentText}`} size="sm">
              Confirm & Insert
            </Button>
          </motion.div>
        </div>
      )}
      {hwSuggestions.length === 0 && (
        <div className={`px-3 py-2 text-center ${t.keyText} opacity-50`}>
          <p className="text-[10px]">Draw a character or word in the canvas above</p>
          <p className="text-[10px]">Supports both English and Amharic script</p>
        </div>
      )}
    </div>
  );

  // Change 6: Settings panel
  const renderSettings = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
        <span className={`text-xs font-medium ${t.keyText} opacity-70`}>Keyboard Settings</span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-4">
        {/* Theme Picker */}
        <div>
          <p className={`text-xs font-semibold mb-2 ${t.keyText}`}>Theme</p>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(THEMES).map(([key, tData]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(key as ThemeName)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                  theme === key ? `${t.accent} ${t.accentText} border-transparent` : `${t.card} ${t.border} border`
                }`}
              >
                <span className="text-lg">{tData.flag}</span>
                <span className="text-[9px] font-medium">{tData.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Key press feedback toggle */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Key Press Feedback</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Visual feedback on key press</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setKeyPressFeedback(!keyPressFeedback)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${keyPressFeedback ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div
              animate={{ x: keyPressFeedback ? 16 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </div>

        {/* Keyboard height selector */}
        <div className={`p-3 rounded-xl ${t.card} ${t.border} border`}>
          <p className={`text-xs font-medium mb-2 ${t.keyText}`}>Keyboard Height</p>
          <div className="flex gap-2">
            {(['compact', 'normal', 'tall'] as const).map(h => (
              <motion.button
                key={h}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setKeyboardHeight(h)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  keyboardHeight === h ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
                }`}
              >
                {h}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Show number row toggle */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Show Number Row</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Always show number row above letters</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNumberRow(!showNumberRow)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${showNumberRow ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div
              animate={{ x: showNumberRow ? 16 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </div>

        {/* Auto-space after punctuation toggle */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Auto-Space After Punctuation</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Add space after . ! ? ; :</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setAutoSpaceAfterPunctuation(!autoSpaceAfterPunctuation)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${autoSpaceAfterPunctuation ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div
              animate={{ x: autoSpaceAfterPunctuation ? 16 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </div>

        {/* Key popup on long press toggle */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Key Popup on Long Press</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Show alternate characters on long press</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setKeyPopupOnLongPress(!keyPopupOnLongPress)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${keyPopupOnLongPress ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div
              animate={{ x: keyPopupOnLongPress ? 16 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </div>
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
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowThemePicker(false)} className={`${t.keyText} opacity-50 hover:opacity-100`}>
              <X className="w-4 h-4" />
            </motion.button>
          </div>
          <div className="grid grid-cols-4 gap-2">
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

  // ─── Vowel Family Row (above keyboard) ────────────────────────────
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
          >
            {v}
          </motion.button>
        ))}
      </motion.div>
    );
  };

  // ─── Panel transition direction (Change 7) ─────────────────────────
  const modeOrder: KeyboardMode[] = ['keyboard', 'stickers', 'gifs', 'clipboard', 'translate', 'handwriting', 'settings'];
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

  // Keyboard height class
  const kbHeightClass = keyboardHeight === 'compact' ? 'min-h-[180px]' : keyboardHeight === 'tall' ? 'min-h-[280px]' : 'min-h-[220px]';
  const kbPanelHeight = keyboardHeight === 'compact' ? 'h-[200px]' : keyboardHeight === 'tall' ? 'h-[300px]' : 'h-[240px]';
  const kbKeyHeight = keyboardHeight === 'compact' ? 'h-9' : keyboardHeight === 'tall' ? 'h-13' : 'h-11';

  // ─── Main Render ────────────────────────────────────────────────────
  const currentRows = symbolsActive ? SYMBOL_ROWS : ENGLISH_ROWS;

  return (
    <div className={`flex flex-col h-full ${t.bg} rounded-lg overflow-hidden transition-colors duration-300`}>
      {/* Text Display Area */}
      <div className="flex-1 min-h-[60px] p-2">
        <div className={`h-full rounded-xl ${t.card} ${t.border} border p-2.5 overflow-y-auto`}>
          {text ? (
            <motion.p
              key={text.slice(-1)}
              initial={textBounce ? { scale: 1.02 } : {}}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${t.keyText}`}
            >{text}</motion.p>
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
          { id: 'settings' as KeyboardMode, label: 'Set', icon: Settings },
        ].map(tab => (
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
          >
            {/* Change 7: Subtle pulse on active tab */}
            {mode === tab.id && (
              <motion.div
                className={`absolute inset-0 rounded-xl ${t.accent} opacity-20`}
                animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.1, 0.2] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
            )}
            <tab.icon className="w-3.5 h-3.5 relative z-10" />
            <span className="text-[10px] font-medium relative z-10">{tab.label}</span>
          </motion.button>
        ))}
        {/* Change 3: Language toggle REMOVED from tab bar - now in keyboard bottom row */}
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
      <div className={`${t.bg} border-t ${t.border}`} style={{ minHeight: mode === 'keyboard' ? undefined : undefined }}>
        <AnimatePresence mode="wait">
          {mode === 'keyboard' && (
            <motion.div
              key="keyboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <div className="flex flex-col gap-1.5 p-2">
                {/* ─── Number Row (conditionally visible based on settings) ─── */}
                {!symbolsActive && showNumberRow && (
                  <div className="flex gap-1">
                    {(language === 'english'
                      ? ['1','2','3','4','5','6','7','8','9','0']
                      : ETHIOPIAN_NUM_ROW_1
                    ).map((num, i) => (
                      <motion.button key={i}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => updateText(text + num)}
                        className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-xl text-sm font-medium ${t.suggestion} ${t.keyText} ${t.keyHover} ${t.border} border`}
                      >
                        {num}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* ─── Vowel Family Row (when Amharic consonant selected) ─── */}
                {renderVowelRow()}

                {/* ─── English Keyboard ─── */}
                {language === 'english' && currentRows && currentRows.map((row, ri) => (
                  <div key={ri} className={`flex gap-1 ${ri === 1 ? 'px-4' : ''}`}>
                    {row.map(key => renderEnglishKey(key))}
                  </div>
                ))}

                {/* ─── Amharic Letter Keyboard ─── */}
                {language === 'amharic' && !symbolsActive && (
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
                                relative flex items-center justify-center flex-1 ${kbKeyHeight} rounded-xl font-medium
                                transition-all duration-150 select-none text-base
                                ${isSelected ? `ring-2 ring-yellow-500/60` : ''}
                                ${isHovered ? `${t.keyHover} shadow-md` : ''}
                                ${t.key} ${t.keyText} ${t.border} border shadow-sm
                              `}
                            >
                              {/* Change 7: Glow effect on active consonant */}
                              {isSelected && (
                                <motion.div
                                  className="absolute inset-0 rounded-xl"
                                  animate={{ boxShadow: ['0 0 0px rgba(234,179,8,0)', '0 0 12px rgba(234,179,8,0.4)', '0 0 0px rgba(234,179,8,0)'] }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                />
                              )}
                              {consonant}
                            </motion.button>
                          );
                        })}
                      </div>
                    ))}
                    {/* Change 3: Amharic special keys row with language button */}
                    <div className="flex gap-1">
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => { setSymbolsActive(true); setSelectedConsonant(null); }}
                        className={`flex-[1.5] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.specialKey} ${t.keyText} text-xs font-medium`}>
                        ፩፪
                      </motion.button>
                      {/* Language toggle button in Amharic row */}
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                        onClick={handleLanguageToggle}
                        className={`flex-[1.5] flex items-center justify-center gap-1 ${kbKeyHeight} rounded-xl ${t.accent} ${t.accentText} text-[10px] font-bold shadow-sm`}
                        title={`Switch to ${language === 'english' ? 'Amharic' : 'English'}`}
                      >
                        <Globe className="w-3 h-3" />EN
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('space')}
                        className={`flex-[3] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.key} ${t.keyText} ${t.border} border shadow-sm text-xs font-medium`}>
                        አማርኛ
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('backspace')}
                        className={`flex-[1.5] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.specialKey} ${t.keyText}`}>
                        <Delete className="w-4 h-4" />
                      </motion.button>
                    </div>

                  </>
                )}

                {/* ─── Amharic Symbols Mode (Ethiopian numbers + symbols) ─── */}
                {language === 'amharic' && symbolsActive && (
                  <>
                    <div className="flex gap-1 justify-center">
                      {ETHIOPIAN_NUM_ROW_1.map((num, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + num)}
                          className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-xl text-base font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                          {num}
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex gap-1 justify-center">
                      {ETHIOPIAN_NUM_ROW_2.map((num, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + num)}
                          className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-xl text-base font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                          {num}
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex gap-1 justify-center">
                      {ETHIOPIAN_SYM_ROW.map((sym, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + sym)}
                          className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-xl text-sm font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                          {sym}
                        </motion.button>
                      ))}
                    </div>
                    {/* More Ethiopian punctuation & common symbols */}
                    <div className="flex gap-1 justify-center">
                      {['′','″','«','»','—','…','·','⟐'].map((sym, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + sym)}
                          className={`flex-1 flex items-center justify-center h-9 rounded-lg text-sm font-medium ${t.suggestion} ${t.keyText} ${t.keyHover}`}>
                          {sym}
                        </motion.button>
                      ))}
                    </div>
                    {/* Change 3: Amharic symbols bottom row with language button */}
                    <div className="flex gap-1">
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => setSymbolsActive(false)}
                        className={`flex-[1.5] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.specialKey} ${t.keyText} text-xs`}>
                        አማ
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                        onClick={handleLanguageToggle}
                        className={`flex-[1.5] flex items-center justify-center gap-1 ${kbKeyHeight} rounded-xl ${t.accent} ${t.accentText} text-[10px] font-bold shadow-sm`}
                      >
                        <Globe className="w-3 h-3" />EN
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('space')}
                        className={`flex-[3] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.key} ${t.keyText} ${t.border} border shadow-sm text-xs`}>
                        አማርኛ
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('backspace')}
                        className={`flex-[1.5] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.specialKey} ${t.keyText}`}>
                        <Delete className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </>
                )}

                {/* ─── English extra symbols when in symbols mode ─── */}
                {language === 'english' && symbolsActive && (
                  <div className="flex gap-1">
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
            <motion.div key="handwriting" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={keyboardHeight === 'compact' ? 'h-[220px]' : keyboardHeight === 'tall' ? 'h-[320px]' : 'h-[260px]'}>
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
    </div>
  );
}
