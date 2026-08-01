'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Zap, Palette, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { THEMES, type ThemeDef } from '@/components/keyboard-data';
import LiveWallpaper from '@/components/keyboard/live-wallpaper';

interface ThemeSelectorProps {
  currentTheme: string;
  onSelectTheme: (themeKey: string) => void;
  onClose: () => void;
}

type ThemeCategory = 'all' | 'solid' | 'live' | 'football' | 'faith' | 'culture';

const CATEGORY_TABS: { id: ThemeCategory; label: string; icon?: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Palette className="w-4 h-4 mr-1.5" /> },
  { id: 'live', label: 'Live', icon: <Sparkles className="w-4 h-4 mr-1.5" /> },
  { id: 'football', label: 'Teams', icon: <Shield className="w-4 h-4 mr-1.5" /> },
  { id: 'faith', label: 'Faith' },
  { id: 'culture', label: 'Culture' },
  { id: 'solid', label: 'Solid' },
];

export function ThemeSelector({ currentTheme, onSelectTheme, onClose }: ThemeSelectorProps) {
  const [category, setCategory] = useState<ThemeCategory>('all');

  const themeEntries = Object.entries(THEMES);

  const countFor = (c: ThemeCategory) =>
    themeEntries.filter(([_, theme]) =>
      c === 'all' ? true : c === 'solid' ? !theme.isLive : theme.category === c
    ).length;

  const filteredThemes = themeEntries.filter(([_, theme]) => {
    if (category === 'all') return true;
    if (category === 'solid') return !theme.isLive;
    return theme.category === category;
  });

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
      <ScrollArea className="w-full whitespace-nowrap bg-muted/20">
        <div className="flex gap-2 p-4">
          {CATEGORY_TABS.map((tab) => {
            const count = countFor(tab.id);
            if (tab.id !== 'all' && tab.id !== 'live' && tab.id !== 'solid' && count === 0) return null;
            return (
              <Button
                key={tab.id}
                size="sm"
                variant={category === tab.id ? 'default' : 'outline'}
                onClick={() => setCategory(tab.id)}
                className="shrink-0"
              >
                {tab.icon}
                {tab.label} ({count})
              </Button>
            );
          })}
        </div>
      </ScrollArea>

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
                  {/* Real per-theme canvas animation — one still frame, not a
                      generic pulse, so the card shows what the theme actually is. */}
                  {theme.isLive && (
                    <LiveWallpaper theme={themeKey} static className="opacity-60" />
                  )}

                  {/* Sample Keys, scrimmed for legibility over a busy backdrop */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center gap-2 p-2 ${
                      theme.isLive ? 'bg-[radial-gradient(circle,rgba(0,0,0,0)_0%,rgba(0,0,0,0.1)_60%,rgba(0,0,0,0.4)_100%)]' : ''
                    }`}
                  >
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

                  {/* Live / Team indicator — team themes read as a squad, not a
                      generic effect, so they get their own badge. */}
                  {theme.isLive && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        {theme.category === 'football' ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        {theme.category === 'football' ? 'TEAM' : 'LIVE'}
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
