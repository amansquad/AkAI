'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { GIF_CATEGORIES, GIF_ITEMS, type ThemeDef, type GiphyGif } from '@/components/keyboard-data';

interface KeyboardGifsPanelProps {
  t: ThemeDef;
  text: string;
  giphyQuery: string;
  setGiphyQuery: (query: string) => void;
  giphyLoading: boolean;
  giphyResults: GiphyGif[] | null;
  activeGifCategory: string;
  updateText: (newText: string) => void;
  addRecentEmoji: (emoji: string) => void;
}

export default function KeyboardGifsPanel({
  t, text, giphyQuery, setGiphyQuery, giphyLoading, giphyResults,
  activeGifCategory, updateText, addRecentEmoji,
}: KeyboardGifsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className={`flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide border-b border-border/30`}>
        {/* Search bar */}
        <div className={`flex items-center gap-1 flex-1 px-2 py-1 rounded-lg ${t.card} ${t.border} border`}>
          <input
            type="text"
            value={giphyQuery}
            onChange={e => setGiphyQuery(e.target.value)}
            placeholder="Search GIFs..."
            className={`flex-1 bg-transparent text-xs outline-none ${t.keyText} placeholder:opacity-40`}
          />
          {giphyQuery && (
            <button onClick={() => setGiphyQuery('')} className="opacity-50 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {GIF_CATEGORIES.slice(0, 6).map(cat => (
          <motion.button key={cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGiphyQuery(cat.name.toLowerCase())}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              giphyQuery === cat.name.toLowerCase() ? `${t.tabActive} ${t.tabActiveText} shadow-sm` : `${t.suggestion} ${t.keyText}`}`}>
            <span>{cat.emoji}</span><span className="hidden sm:inline">{cat.name}</span>
          </motion.button>
        ))}
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        {giphyLoading ? (
          <div className={`flex items-center justify-center h-full ${t.keyText}`}>
            <Loader2 className="w-6 h-6 animate-spin opacity-50" />
          </div>
        ) : giphyResults && giphyResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {giphyResults.map((gif, i) => (
              <motion.button key={gif.id || i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const emoji = gif._fallback?.emoji || '🖼️';
                  updateText(text + emoji + ' ');
                  addRecentEmoji(emoji);
                }}
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl ${t.key} ${t.border} border shadow-sm aspect-video overflow-hidden`}
              >
                {gif.images?.fixed_height?.url && !gif._fallback ? (
                  <img
                    src={gif.images.fixed_height.url}
                    alt={gif.title || 'GIF'}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <motion.span className="text-3xl"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                    {gif._fallback?.emoji || '🖼️'}
                  </motion.span>
                )}
                <span className={`text-[9px] font-medium mt-1 ${t.keyText} opacity-70 truncate w-full text-center`}>
                  {gif._fallback?.label || gif.title?.slice(0, 15) || 'GIF'}
                </span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(GIF_ITEMS[activeGifCategory] || GIF_ITEMS.hello).map((gif, i) => (
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
        )}
      </div>
    </div>
  );
}
