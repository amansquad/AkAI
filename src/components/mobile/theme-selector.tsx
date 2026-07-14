'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Zap, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { THEMES, type ThemeDef } from '@/components/keyboard-data';

interface ThemeSelectorProps {
  currentTheme: string;
  onSelectTheme: (themeKey: string) => void;
  onClose: () => void;
}

type ThemeCategory = 'all' | 'solid' | 'live';

export function ThemeSelector({ currentTheme, onSelectTheme, onClose }: ThemeSelectorProps) {
  const [category, setCategory] = useState<ThemeCategory>('all');

  const themeEntries = Object.entries(THEMES);
  
  const filteredThemes = themeEntries.filter(([_, theme]) => {
    if (category === 'all') return true;
    if (category === 'solid') return !theme.isLive;
    if (category === 'live') return theme.isLive;
    return true;
  });

  const solidThemes = themeEntries.filter(([_, theme]) => !theme.isLive);
  const liveThemes = themeEntries.filter(([_, theme]) => theme.isLive);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Choose Theme
        </h2>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 p-4 bg-muted/20">
        <Button
          size="sm"
          variant={category === 'all' ? 'default' : 'outline'}
          onClick={() => setCategory('all')}
          className="flex-1"
        >
          <Palette className="w-4 h-4 mr-2" />
          All ({themeEntries.length})
        </Button>
        <Button
          size="sm"
          variant={category === 'solid' ? 'default' : 'outline'}
          onClick={() => setCategory('solid')}
          className="flex-1"
        >
          Solid ({solidThemes.length})
        </Button>
        <Button
          size="sm"
          variant={category === 'live' ? 'default' : 'outline'}
          onClick={() => setCategory('live')}
          className="flex-1"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Live ({liveThemes.length})
        </Button>
      </div>

      {/* Theme Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredThemes.map(([themeKey, theme]) => (
            <motion.div
              key={themeKey}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <button
                onClick={() => onSelectTheme(themeKey)}
                className={`
                  w-full rounded-xl overflow-hidden
                  border-2 transition-all
                  ${currentTheme === themeKey
                    ? 'border-primary shadow-lg ring-2 ring-primary/20'
                    : 'border-border/30 hover:border-border/60'
                  }
                `}
              >
                {/* Theme Preview */}
                <div className={`${theme.bg} h-24 relative overflow-hidden`}>
                  {/* Animated background for live themes */}
                  {theme.isLive && (
                    <div className="absolute inset-0">
                      <motion.div
                        className={`absolute inset-0 ${theme.accent} opacity-20`}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    </div>
                  )}

                  {/* Sample Keys */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 p-2">
                    <div className={`${theme.key} rounded-md w-10 h-10 ${theme.keyText} flex items-center justify-center text-xs font-medium shadow-sm`}>
                      A
                    </div>
                    <div className={`${theme.key} rounded-md w-10 h-10 ${theme.keyText} flex items-center justify-center text-xs font-medium shadow-sm`}>
                      B
                    </div>
                    <div className={`${theme.specialKey} rounded-md w-10 h-10 ${theme.keyText} flex items-center justify-center text-xs font-medium shadow-sm`}>
                      ⌫
                    </div>
                  </div>

                  {/* Live indicator */}
                  {theme.isLive && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        LIVE
                      </div>
                    </div>
                  )}

                  {/* Current theme checkmark */}
                  {currentTheme === themeKey && (
                    <div className="absolute top-2 left-2">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                        ✓
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Name */}
                <div className="p-3 bg-card">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <span>{theme.flag}</span>
                    <span>{theme.name}</span>
                  </p>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
