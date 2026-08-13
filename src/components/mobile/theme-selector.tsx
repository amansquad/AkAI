'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Palette, Shield, Check } from 'lucide-react';
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
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex items-center justify-between p-4 border-b border-border/30 bg-card/50 backdrop-blur-sm"
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, -12, 12, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
          >
            <Palette className="w-5 h-5" />
          </motion.span>
          Choose Theme
        </h2>
        <motion.div whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9 }}>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Category Tabs */}
      <ScrollArea className="w-full whitespace-nowrap bg-muted/20">
        <div className="flex gap-2 p-4">
          {CATEGORY_TABS.map((tab) => {
            const count = countFor(tab.id);
            if (tab.id !== 'all' && tab.id !== 'live' && tab.id !== 'solid' && count === 0) return null;
            const active = category === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className={`relative shrink-0 inline-flex items-center px-3 h-9 rounded-md text-sm font-medium transition-colors ${
                  active ? 'text-primary-foreground' : 'text-foreground/80 border border-input hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="theme-tab-pill"
                    className="absolute inset-0 rounded-md bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center">
                  {tab.icon}
                  {tab.label} ({count})
                </span>
              </motion.button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Theme Grid */}
      <ScrollArea className="flex-1 p-4">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={category}
            className="grid grid-cols-2 gap-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.035 } },
            }}
          >
            {filteredThemes.map(([themeKey, theme]) => {
              const selected = currentTheme === themeKey;
              return (
                <motion.div
                  key={themeKey}
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 14, scale: 0.94 },
                    show: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <button
                    onClick={() => onSelectTheme(themeKey)}
                    className={`
                      w-full rounded-xl overflow-hidden
                      border-2 transition-colors duration-200
                      ${selected
                        ? 'border-primary shadow-lg'
                        : 'border-border/30 hover:border-border/60'
                      }
                    `}
                  >
                    {/* Selected glow ring — breathing halo instead of a static ring */}
                    {selected && (
                      <motion.div
                        className="absolute -inset-0.5 rounded-xl pointer-events-none z-20"
                        style={{ boxShadow: '0 0 0 4px var(--primary)' }}
                        animate={{ opacity: [0, 0.35, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}

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
                        <motion.div
                          className="absolute top-2 right-2"
                          animate={{ opacity: [0.85, 1, 0.85] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
                            {theme.category === 'football' ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <Zap className="w-3 h-3" />
                            )}
                            {theme.category === 'football' ? 'TEAM' : 'LIVE'}
                          </div>
                        </motion.div>
                      )}

                      {/* Current theme checkmark */}
                      <AnimatePresence>
                        {selected && (
                          <motion.div
                            className="absolute top-2 left-2 z-30"
                            initial={{ scale: 0, rotate: -90, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          >
                            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
              );
            })}
          </motion.div>
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
