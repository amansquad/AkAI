'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { ThemeDef } from '@/components/keyboard-data';

interface StickerPanelProps {
  onSelect: (sticker: string) => void;
  theme: ThemeDef;
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗'],
  'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄'],
  'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹'],
  'Travel': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃'],
  'Objects': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️'],
  'Symbols': ['❤️', '💯', '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💥', '✅', '❌', '⭕', '🚫', '💢', '♨️', '🔰', '⚠️', '🚸', '⛔', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗']
};

export function StickerPanel({ onSelect, theme }: StickerPanelProps) {
  const [activeCategory, setActiveCategory] = useState('Smileys');

  return (
    <div className="h-full flex flex-col">
      {/* Category tabs */}
      <ScrollArea className={`${theme.card} backdrop-blur-sm border-b border-border/30`}>
        <div className="flex gap-2 p-2">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <Button
              key={category}
              size="sm"
              variant={activeCategory === category ? 'default' : 'ghost'}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap ${activeCategory === category ? theme.tabActive : ''}`}
            >
              {category}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Emoji grid */}
      <ScrollArea className={`flex-1 ${theme.card} backdrop-blur-sm`}>
        <div className="grid grid-cols-8 gap-2 p-4">
          {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(emoji)}
              className={`
                ${theme.key} ${theme.keyHover}
                rounded-lg aspect-square
                flex items-center justify-center
                text-2xl
                transition-colors
              `}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
