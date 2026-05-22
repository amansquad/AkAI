'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard, Smile, Image, ClipboardList, Languages,
  Delete, CornerDownLeft, Copy, Trash2, Plus,
  ArrowRightLeft, Loader2, Sparkles, Send, Globe,
  ArrowUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type KeyboardMode = 'english' | 'amharic' | 'stickers' | 'gifs' | 'clipboard' | 'translate';

interface KeyboardAppProps {
  onTextChange?: (text: string) => void;
}

// ─── Amharic Character Data ───────────────────────────────────────────────
const AMHARIC_ROWS: string[][] = [
  ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ'],
  ['ተ', 'ቸ', 'ኀ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ', 'ዘ'],
  ['ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጠ', 'ጨ', 'ጰ', 'ፀ', 'ፈ'],
  ['ፐ', 'ቨ', 'ሟ', 'ኟ', 'ዟ', 'ጟ', '፟'],
];

// Vowel forms for each consonant (7 orders)
const AMHARIC_VOWELS: Record<string, string[]> = {
  'ሀ': ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'],
  'ለ': ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ'],
  'ሐ': ['ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ'],
  'መ': ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ'],
  'ሠ': ['ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ'],
  'ረ': ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ'],
  'ሰ': ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ'],
  'ሸ': ['ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ'],
  'ቀ': ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ'],
  'በ': ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ'],
  'ተ': ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ'],
  'ቸ': ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ'],
  'ኀ': ['ኀ', 'ኁ', 'ኂ', 'ኃ', 'ኄ', 'ኅ', 'ኆ'],
  'ነ': ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ'],
  'ኘ': ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ'],
  'አ': ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ'],
  'ከ': ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ'],
  'ኸ': ['ኸ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'],
  'ወ': ['ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ'],
  'ዘ': ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ'],
  'ዠ': ['ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ'],
  'የ': ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'],
  'ደ': ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ'],
  'ጀ': ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ'],
  'ገ': ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ'],
  'ጠ': ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ'],
  'ጨ': ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ'],
  'ጰ': ['ጰ', 'ጱ', 'ጲ', 'ጳ', 'ጴ', 'ጵ', 'ጶ'],
  'ፀ': ['ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ', 'ፆ'],
  'ፈ': ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ'],
  'ፐ': ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ'],
  'ቨ': ['ቨ', 'ቩ', 'ቪ', 'ቫ', 'ቬ', 'ቭ', 'ቮ'],
  'ሟ': ['ሟ'],
  'ኟ': ['ኟ'],
  'ዟ': ['ዟ'],
  'ጟ': ['ጟ'],
  '፟': ['፟'],
};

// ─── Sticker Data ─────────────────────────────────────────────────────────
const STICKER_CATEGORIES = [
  { id: 'featured', name: 'Featured', icon: '⭐', stickers: ['🇪🇹','☕','🎶','✨','💫','🌟','🎊','🥳','🎉','🙏','❤️','🫶','💪','🔥','👑','💎'] },
  { id: 'faces', name: 'Faces', icon: '😀', stickers: ['😀','😂','🥰','😎','🤩','😍','🥳','😏','🤔','😴','😇','🤗','🫠','🥺','😤','😜'] },
  { id: 'hearts', name: 'Love', icon: '❤️', stickers: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💞','💓','💗','💖','💘','💝','💟'] },
  { id: 'hands', name: 'Gestures', icon: '👍', stickers: ['👍','👎','👋','🤝','✌️','🤞','🙏','👏','🫶','🤙','💪','🤘','✊','🤚','👆','👇'] },
  { id: 'animals', name: 'Animals', icon: '🐱', stickers: ['🐱','🐶','🐻','🦊','🐰','🐼','🐨','🦁','🐯','🐸','🐵','🦄','🐝','🦋','🐙','🐧'] },
  { id: 'food', name: 'Food', icon: '🍕', stickers: ['☕','🍲','🫓','🍕','🍔','🍟','🌮','🍜','🍣','🍩','🍪','🎂','🍰','🧃','🍎','🍇'] },
  { id: 'nature', name: 'Nature', icon: '🌸', stickers: ['🌸','🌺','🌻','🌹','🌷','💐','🌳','🌴','🌵','🍀','🌈','⭐','🌙','☀️','❄️','🔥'] },
  { id: 'ethiopian', name: 'Ethiopia', icon: '🇪🇹', stickers: ['🇪🇹','☕','🎶','🥁','🏔️','🌍','🦁','🦅','☀️','🌿','🍲','🫓','🎭','💃','🕺','🎪'] },
];

// ─── GIF Data (animated sticker-like) ─────────────────────────────────────
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

// ─── Main Keyboard App Component ──────────────────────────────────────────
export default function KeyboardApp({ onTextChange }: KeyboardAppProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<KeyboardMode>('english');
  const [shiftActive, setShiftActive] = useState(false);
  const [symbolsActive, setSymbolsActive] = useState(false);
  const [activeStickerCategory, setActiveStickerCategory] = useState('featured');
  const [activeGifCategory, setActiveGifCategory] = useState('hello');
  const [clipboardItems, setClipboardItems] = useState<{ id: string; text: string; timestamp: number }[]>([
    { id: '1', text: 'Hello, how are you?', timestamp: Date.now() - 60000 },
    { id: '2', text: 'እንዴት ነህ?', timestamp: Date.now() - 30000 },
    { id: '3', text: 'See you tomorrow!', timestamp: Date.now() - 10000 },
  ]);
  const [vowelPopup, setVowelPopup] = useState<string | null>(null);
  const [translateFrom, setTranslateFrom] = useState<'English' | 'Amharic'>('English');
  const [translateInput, setTranslateInput] = useState('');
  const [translateOutput, setTranslateOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [keyPressed, setKeyPressed] = useState<string | null>(null);

  const updateText = useCallback((newText: string) => {
    setText(newText);
    onTextChange?.(newText);
  }, [onTextChange]);

  const handleKeyPress = useCallback((key: string) => {
    setKeyPressed(key);
    setTimeout(() => setKeyPressed(null), 150);

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
    } else {
      let char = key;
      if (shiftActive && key.length === 1 && key.match(/[a-z]/)) {
        char = key.toUpperCase();
      }
      updateText(text + char);
      if (shiftActive) setShiftActive(false);
    }
  }, [text, shiftActive, symbolsActive, updateText]);

  const handleStickerSelect = useCallback((sticker: string) => {
    updateText(text + sticker);
  }, [text, updateText]);

  const handleGifSelect = useCallback((gif: { emoji: string; label: string }) => {
    updateText(text + gif.emoji + ' ');
  }, [text, updateText]);

  const handleClipboardCopy = useCallback((item: string) => {
    updateText(text + item);
  }, [text, updateText]);

  const handleClipboardDelete = useCallback((id: string) => {
    setClipboardItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleClipboardAdd = useCallback(() => {
    if (text.trim()) {
      setClipboardItems(prev => [
        { id: Date.now().toString(), text: text.trim(), timestamp: Date.now() },
        ...prev,
      ]);
    }
  }, [text]);

  const handleAmharicPress = useCallback((consonant: string) => {
    const vowels = AMHARIC_VOWELS[consonant];
    if (vowels && vowels.length > 0) {
      updateText(text + vowels[0]);
    }
  }, [text, updateText]);

  const handleAmharicLongPress = useCallback((consonant: string) => {
    const vowels = AMHARIC_VOWELS[consonant];
    if (vowels && vowels.length > 1) {
      setVowelPopup(consonant);
    }
  }, []);

  const handleVowelSelect = useCallback((vowel: string) => {
    updateText(text + vowel);
    setVowelPopup(null);
  }, [text, updateText, setVowelPopup]);

  const handleTranslate = useCallback(async () => {
    if (!translateInput.trim()) return;
    setIsTranslating(true);
    try {
      const sourceLang = translateFrom === 'English' ? 'English' : 'Amharic';
      const targetLang = translateFrom === 'English' ? 'Amharic' : 'English';
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: translateInput,
          sourceLang,
          targetLang,
        }),
      });
      const data = await response.json();
      if (data.translation) {
        setTranslateOutput(data.translation);
      } else {
        setTranslateOutput('Translation failed. Please try again.');
      }
    } catch {
      setTranslateOutput('Error connecting to translation service.');
    } finally {
      setIsTranslating(false);
    }
  }, [translateInput, translateFrom]);

  const handleUseTranslation = useCallback(() => {
    if (translateOutput) {
      updateText(text + translateOutput + ' ');
    }
  }, [text, translateOutput, updateText]);

  // ─── English Keyboard ───────────────────────────────────────────────────
  const ENGLISH_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['symbols', ',', 'space', '.', 'enter'],
  ];

  const SYMBOL_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '_', '&', '-', '+', '(', ')', '/'],
    ['shift', '*', '"', "'", ':', ';', '!', '?', 'backspace'],
    ['symbols', ',', 'space', '.', 'enter'],
  ];

  const renderEnglishKey = (key: string) => {
    const isSpecial = ['shift', 'backspace', 'symbols', 'space', 'enter'].includes(key);
    const isWide = key === 'space';
    const isMedium = key === 'shift' || key === 'backspace' || key === 'symbols' || key === 'enter';

    let displayKey = key;
    if (key === 'shift') displayKey = shiftActive ? '⇧' : '⇧';
    if (key === 'backspace') displayKey = '⌫';
    if (key === 'symbols') displayKey = symbolsActive ? 'ABC' : '?123';
    if (key === 'space') displayKey = 'English';
    if (key === 'enter') displayKey = '↵';
    if (shiftActive && !isSpecial && key.length === 1 && key.match(/[a-z]/)) {
      displayKey = key.toUpperCase();
    }

    return (
      <motion.button
        key={key}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleKeyPress(key)}
        className={`
          relative flex items-center justify-center rounded-xl font-medium
          transition-all duration-100 select-none
          ${isWide ? 'flex-[3] h-11' : isMedium ? 'flex-[1.5] h-11' : 'flex-1 h-11'}
          ${keyPressed === key ? 'bg-primary text-primary-foreground shadow-inner' : 
            isSpecial ? 'bg-muted/80 text-foreground hover:bg-muted' : 
            'bg-card text-foreground hover:bg-accent shadow-sm border border-border/50'}
        `}
      >
        {key === 'shift' && <ArrowUp className={`w-4 h-4 ${shiftActive ? 'text-primary' : ''}`} />}
        {key === 'backspace' && <Delete className="w-4 h-4" />}
        {key === 'enter' && <CornerDownLeft className="w-4 h-4" />}
        {key !== 'shift' && key !== 'backspace' && key !== 'enter' && (
          <span className={isWide ? 'text-xs' : 'text-sm'}>{displayKey}</span>
        )}
      </motion.button>
    );
  };

  // ─── Render Panels ─────────────────────────────────────────────────────
  const renderStickers = () => {
    const category = STICKER_CATEGORIES.find(c => c.id === activeStickerCategory);
    return (
      <div className="flex flex-col h-full">
        <div className="flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide border-b border-border/30">
          {STICKER_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveStickerCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeStickerCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2">
            {category?.stickers.map((sticker, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => handleStickerSelect(sticker)}
                className="flex items-center justify-center p-2 rounded-xl bg-card hover:bg-accent border border-border/30 shadow-sm text-2xl aspect-square"
              >
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
            <button
              key={cat.id}
              onClick={() => setActiveGifCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeGifCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {category.map((gif, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGifSelect(gif)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl bg-card hover:bg-accent border border-border/30 shadow-sm aspect-video relative overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5`} />
                <motion.span
                  className="text-3xl relative z-10"
                  animate={
                    gif.animation === 'bounce' ? { y: [0, -4, 0] } :
                    gif.animation === 'pulse' ? { scale: [1, 1.1, 1] } :
                    gif.animation === 'shake' ? { x: [0, -2, 2, 0] } :
                    gif.animation === 'sparkle' ? { opacity: [1, 0.7, 1] } :
                    gif.animation === 'wave' ? { rotate: [0, 15, -15, 0] } :
                    gif.animation === 'heartbeat' ? { scale: [1, 1.15, 1, 1.15, 1] } :
                    {}
                  }
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  {gif.emoji}
                </motion.span>
                <span className="text-[10px] font-medium mt-1 relative z-10 text-muted-foreground">{gif.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderClipboard = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-xs font-medium text-muted-foreground">Clipboard History</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClipboardAdd}
          className="h-7 text-xs gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Current
        </Button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        {clipboardItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ClipboardList className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">No clipboard items</span>
            <span className="text-[10px] mt-1">Copied text will appear here</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {clipboardItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/30 shadow-sm group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClipboardCopy(item.text)}
                    className="h-7 w-7 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClipboardDelete(item.id)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-xs font-medium text-muted-foreground">AI Translator</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTranslateFrom(translateFrom === 'English' ? 'Amharic' : 'English');
              setTranslateInput('');
              setTranslateOutput('');
            }}
            className="h-7 text-xs gap-1"
          >
            <ArrowRightLeft className="w-3 h-3" />
            Switch
          </Button>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-center">
            <span className="text-xs font-semibold text-primary">{translateFrom}</span>
          </div>
          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 text-center">
            <span className="text-xs font-semibold text-primary">{translateFrom === 'English' ? 'Amharic' : 'English'}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <textarea
            value={translateInput}
            onChange={e => setTranslateInput(e.target.value)}
            placeholder={translateFrom === 'English' ? 'Type in English...' : 'በአማርኛ ይጻፉ...'}
            className="w-full p-3 text-sm rounded-xl bg-card border border-border/50 focus:border-primary/50 focus:outline-none resize-none min-h-[60px] placeholder:text-muted-foreground/60"
            rows={2}
          />
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || !translateInput.trim()}
            className="w-full gap-2"
            size="sm"
          >
            {isTranslating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Languages className="w-3 h-3" />
            )}
            {isTranslating ? 'Translating...' : 'Translate'}
          </Button>
        </div>

        {translateOutput && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs font-medium text-primary mb-1">Translation</p>
                <p className="text-sm">{translateOutput}</p>
              </div>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUseTranslation}
                        className="h-7 w-7 p-0"
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Use in text</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard?.writeText(translateOutput)}
                        className="h-7 w-7 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-auto pt-2">
          <p className="text-[10px] text-center text-muted-foreground/60">
            <Sparkles className="w-3 h-3 inline-block mr-1" />
            Powered by AI • English ↔ Amharic
          </p>
        </div>
      </div>
    </div>
  );

  // ─── Main Render ───────────────────────────────────────────────────────
  const currentRows = symbolsActive ? SYMBOL_ROWS : ENGLISH_ROWS;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Text Display Area */}
      <div className="flex-1 min-h-[80px] p-3">
        <div className="h-full rounded-2xl bg-card border border-border/30 p-3 overflow-y-auto">
          {text ? (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{text}</p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">Tap the keyboard to start typing...</p>
          )}
        </div>
      </div>

      {/* Vowel Popup for Amharic */}
      <AnimatePresence>
        {vowelPopup && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={() => setVowelPopup(null)}
          >
            <div
              className="bg-card rounded-2xl shadow-2xl border border-border/50 p-3"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-xs text-muted-foreground text-center mb-2">
                Select vowel form of {vowelPopup}
              </p>
              <div className="flex gap-1.5">
                {AMHARIC_VOWELS[vowelPopup]?.map((vowel, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVowelSelect(vowel)}
                    className="flex items-center justify-center w-11 h-11 rounded-xl bg-accent hover:bg-primary hover:text-primary-foreground transition-colors text-lg font-medium"
                  >
                    {vowel}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Tab Bar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-t border-border/30 bg-muted/20">
        {[
          { id: 'english' as KeyboardMode, label: 'ABC', icon: Keyboard },
          { id: 'amharic' as KeyboardMode, label: 'አማ', icon: Globe },
          { id: 'stickers' as KeyboardMode, label: 'Stickers', icon: Smile },
          { id: 'gifs' as KeyboardMode, label: 'GIFs', icon: Image },
          { id: 'clipboard' as KeyboardMode, label: 'Clip', icon: ClipboardList },
          { id: 'translate' as KeyboardMode, label: 'AI', icon: Sparkles },
        ].map(tab => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => setMode(tab.id)}
            className={`
              flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all duration-200
              ${mode === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
            `}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Keyboard Content */}
      <div className="bg-muted/10 border-t border-border/20" style={{ minHeight: mode === 'english' || mode === 'amharic' ? '200px' : '240px' }}>
        <AnimatePresence mode="wait">
          {mode === 'english' && (
            <motion.div
              key="english"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-1.5 p-2"
            >
              {currentRows.map((row, ri) => (
                <div key={ri} className={`flex gap-1 ${ri === 1 ? 'px-4' : ''}`}>
                  {row.map(key => renderEnglishKey(key, ri))}
                </div>
              ))}
            </motion.div>
          )}

          {mode === 'amharic' && (
            <motion.div
              key="amharic"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-1.5 p-2"
            >
              {AMHARIC_ROWS.map((row, ri) => (
                <div key={ri} className="flex gap-1 justify-center">
                  {row.map(consonant => (
                    <motion.button
                      key={consonant}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAmharicPress(consonant)}
                      onContextMenu={e => { e.preventDefault(); handleAmharicLongPress(consonant); }}
                      onMouseDown={() => {
                        const timer = setTimeout(() => handleAmharicLongPress(consonant), 500);
                        return () => clearTimeout(timer);
                      }}
                      className={`
                        flex items-center justify-center flex-1 h-11 rounded-xl font-medium
                        transition-all duration-100 select-none text-lg
                        ${keyPressed === consonant
                          ? 'bg-primary text-primary-foreground shadow-inner'
                          : 'bg-card text-foreground hover:bg-accent shadow-sm border border-border/50'}
                      `}
                    >
                      {consonant}
                    </motion.button>
                  ))}
                </div>
              ))}
              {/* Amharic special keys row */}
              <div className="flex gap-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleKeyPress('backspace')}
                  className="flex-[1.5] flex items-center justify-center h-11 rounded-xl bg-muted/80 text-foreground"
                >
                  <Delete className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleKeyPress('space')}
                  className="flex-[3] flex items-center justify-center h-11 rounded-xl bg-card text-xs font-medium text-muted-foreground border border-border/50 shadow-sm"
                >
                  አማርኛ
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleKeyPress('enter')}
                  className="flex-[1.5] flex items-center justify-center h-11 rounded-xl bg-muted/80 text-foreground"
                >
                  <CornerDownLeft className="w-4 h-4" />
                </motion.button>
              </div>
              {/* Amharic punctuation row */}
              <div className="flex gap-1">
                {['፣', '።', '፤', '፡', '።', '!', '?'].map((punct, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => updateText(text + punct)}
                    className="flex-1 flex items-center justify-center h-9 rounded-lg bg-accent/50 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    {punct}
                  </motion.button>
                ))}
              </div>
              <p className="text-[10px] text-center text-muted-foreground/50 mt-1">
                Right-click or long-press a consonant for vowel forms (ሀ→ሁሂሃሄህሆ)
              </p>
            </motion.div>
          )}

          {mode === 'stickers' && (
            <motion.div
              key="stickers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.15 }}
              className="h-[240px]"
            >
              {renderStickers()}
            </motion.div>
          )}

          {mode === 'gifs' && (
            <motion.div
              key="gifs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.15 }}
              className="h-[240px]"
            >
              {renderGifs()}
            </motion.div>
          )}

          {mode === 'clipboard' && (
            <motion.div
              key="clipboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.15 }}
              className="h-[240px]"
            >
              {renderClipboard()}
            </motion.div>
          )}

          {mode === 'translate' && (
            <motion.div
              key="translate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.15 }}
              className="h-[300px]"
            >
              {renderTranslate()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
