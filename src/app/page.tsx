'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Keyboard, Globe, Sparkles, Smile, Image, ClipboardList,
  Languages, Shield, Zap, Star,
  ArrowRight, Check, Pen, Palette, Sun, Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import KeyboardApp from '@/components/keyboard-app';

const FEATURES = [
  {
    icon: Globe,
    title: 'English & Amharic',
    description: 'Full QWERTY keyboard for English and complete Ge\'ez script for Amharic with all vowel forms.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Sparkles,
    title: 'AI Translation',
    description: 'Instant AI-powered translation between English and Amharic. Just type and translate.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Smile,
    title: 'Stickers & GIFs',
    description: 'Hundreds of stickers and animated GIFs including Ethiopian-themed collections.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Pen,
    title: 'Handwriting Input',
    description: 'Draw characters directly on screen with canvas-based handwriting support.',
    color: 'from-cyan-500 to-sky-600',
  },
  {
    icon: Palette,
    title: '20+ Beautiful Themes',
    description: 'Classic, Midnight, Ocean, Sunset, Forest, Ethiopian, Neon, Candy, and many more keyboard styles.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays on your device. No keylogging, no data collection.',
    color: 'from-green-500 to-emerald-600',
  },
];

const STATS = [
  { value: '2', label: 'Languages' },
  { value: '200+', label: 'Stickers' },
  { value: '20+', label: 'Themes' },
  { value: 'AI', label: 'Translator' },
];

const ALL_THEMES = [
  { name: 'Classic', emoji: '⬜', colors: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900' },
  { name: 'Midnight', emoji: '🌙', colors: 'from-slate-800 to-slate-950' },
  { name: 'Ocean', emoji: '🌊', colors: 'from-cyan-700 to-cyan-950' },
  { name: 'Sunset', emoji: '🌅', colors: 'from-orange-700 to-orange-950' },
  { name: 'Forest', emoji: '🌿', colors: 'from-green-700 to-green-950' },
  { name: 'Ethiopian', emoji: '🇪🇹', colors: 'from-green-700 via-yellow-500 to-red-600' },
  { name: 'Rose', emoji: '🌹', colors: 'from-rose-700 to-rose-950' },
  { name: 'Neon', emoji: '💜', colors: 'from-gray-800 to-lime-400' },
  { name: 'Candy', emoji: '🍬', colors: 'from-fuchsia-700 to-fuchsia-950' },
  { name: 'Arctic', emoji: '❄️', colors: 'from-sky-700 to-sky-950' },
  { name: 'Cherry', emoji: '🍒', colors: 'from-red-700 to-red-950' },
  { name: 'Sand', emoji: '🏜️', colors: 'from-amber-700 to-amber-950' },
  { name: 'Lavender', emoji: '💜', colors: 'from-purple-700 to-purple-950' },
  { name: 'Teal', emoji: '🦚', colors: 'from-teal-700 to-teal-950' },
  { name: 'Crimson', emoji: '🔮', colors: 'from-rose-800 to-rose-950' },
  { name: 'Moss', emoji: '🌿', colors: 'from-lime-700 to-lime-950' },
  { name: 'Storm', emoji: '⛈️', colors: 'from-zinc-700 to-zinc-950' },
  { name: 'Peach', emoji: '🍑', colors: 'from-orange-600 to-orange-950' },
  { name: 'Indigo', emoji: '🔵', colors: 'from-blue-700 to-blue-950' },
  { name: 'Gold', emoji: '👑', colors: 'from-yellow-600 to-yellow-950' },
];

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-gradient-to-br from-green-400/10 to-yellow-400/10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <nav className="flex items-center justify-between mb-8 sm:mb-16">
            <div className="flex items-center gap-2">
              <img src="/akai-icon.png" alt="AkAI" className="w-9 h-9 rounded-xl shadow-lg" />
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight leading-none">AkAI</span>
                <span className="text-[10px] text-muted-foreground">Amharic Keyboard + AI</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="gap-1.5"
                title="Toggle dark mode"
              >
                {mounted && resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDemo(!showDemo)} className="gap-1.5">
                {showDemo ? 'Hide Demo' : 'Try Demo'}
                <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showDemo ? 'rotate-90' : ''}`} />
              </Button>
            </div>
          </nav>

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium mb-4 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered Bilingual Keyboard
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">AkAI</span>
                  {' '}Keyboard
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-2 leading-relaxed">
                  The smartest bilingual keyboard for English and Amharic.
                </p>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-6 leading-relaxed">
                  AI translation • Stickers & GIFs • Handwriting • 20+ Themes • Ethiopian numbers • Word suggestions • Dark mode
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                  <Button size="lg" onClick={() => setShowDemo(true)}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 text-white">
                    <Keyboard className="w-4 h-4" />
                    Try Interactive Demo
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Star className="w-4 h-4" />
                    Features
                  </Button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-6 sm:gap-8 mt-8 justify-center lg:justify-start">
                {STATS.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Phone Mockup */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-shrink-0">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/20 via-transparent to-amber-500/20 rounded-[3rem] blur-xl" />
                <div className="relative w-[300px] sm:w-[340px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-2 shadow-2xl shadow-black/40">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
                  <div className="relative bg-background rounded-[2rem] overflow-hidden" style={{ height: '540px' }}>
                    <div className="flex items-center justify-between px-6 pt-3 pb-1 bg-background">
                      <span className="text-[10px] font-medium">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3.5 h-2 border border-foreground/50 rounded-sm relative">
                          <div className="absolute inset-0.5 bg-emerald-500 rounded-[1px]" style={{ width: '70%' }} />
                        </div>
                      </div>
                    </div>
                    <div className="h-[calc(100%-28px)]">
                      <KeyboardApp />
                    </div>
                  </div>
                  <div className="flex justify-center py-1.5">
                    <div className="w-28 h-1 rounded-full bg-gray-600" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Interactive Demo */}
      <AnimatePresence>
        {showDemo && (
          <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }} className="overflow-hidden">
            <div className="max-w-2xl mx-auto px-4 py-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Interactive Demo</h2>
                <p className="text-sm text-muted-foreground">Try the AkAI keyboard right here in your browser</p>
              </div>
              <div className="bg-card rounded-3xl border border-border/50 shadow-xl overflow-hidden">
                <div className="h-[540px]">
                  <KeyboardApp />
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Everything You Need</h2>
            <p className="text-base text-muted-foreground max-w-lg mx-auto">
              A complete keyboard experience with modern features designed for bilingual users.
            </p>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group relative p-6 rounded-2xl bg-card border border-border/30 shadow-sm hover:shadow-md transition-all duration-300 hover:border-border/60">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Amharic Script Showcase */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Full <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Ge&apos;ez Script</span>
                </h2>
                <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                  Complete Amharic keyboard with 33 base consonants and their vowel families.
                  Click any consonant to see its vowel forms in the sidebar.
                </p>
                <div className="space-y-3">
                  {[
                    '33 base consonants (ሀ-ፐ)',
                    '7 vowel forms per consonant in sidebar',
                    'Ethiopian numbers (፩፪፫፬፭፮)',
                    'Ge\'ez punctuation & sentence symbols',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0">
              <div className="grid grid-cols-5 gap-2 p-4 bg-card rounded-2xl border border-border/30 shadow-lg">
                {['ሀ','ለ','ሐ','መ','ሠ','ረ','ሰ','ሸ','ቀ','በ',
                  'ተ','ቸ','ኀ','ነ','ኘ','አ','ከ','ኸ','ወ','ዘ',
                  'ዠ','የ','ደ','ጀ','ገ','ጠ','ጨ','ጰ','ፀ','ፈ',
                  'ፐ','ቨ','ሟ','ኟ','ዟ'].map((char, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.2, y: -2 }}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-accent/50 text-lg font-medium hover:bg-emerald-500 hover:text-white transition-colors cursor-default">
                    {char}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Themes Showcase */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              20+ Beautiful <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">Themes</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-lg mx-auto">
              Customize your keyboard with themes that match your style. Including a special Ethiopian flag theme, dark mode, and many more!
            </p>
          </motion.div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {ALL_THEMES.map((themeItem, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/30 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${themeItem.colors} flex items-center justify-center text-xl shadow-md`}>
                {themeItem.emoji}
              </div>
              <span className="text-xs font-medium">{themeItem.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Translation */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                AI-Powered <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Translation</span>
              </h2>
              <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                Translate any word or phrase between English and Amharic instantly.
              </p>
              <div className="space-y-3">
                {['Context-aware translations', 'Word suggestions for both languages', 'Next word prediction', 'Use translations directly in text'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-amber-600" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0">
              <div className="w-[300px] bg-card rounded-2xl border border-border/30 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-border/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Languages className="w-4 h-4 text-amber-600" />AI Translator
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                    <p className="text-xs text-emerald-600 font-medium mb-1">English</p>
                    <p className="text-sm">&quot;Hello, how are you?&quot;</p>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-amber-600 rotate-90" />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                    <p className="text-xs text-amber-600 font-medium mb-1">አማርኛ</p>
                    <p className="text-sm">&quot;ሰላም፣ እንዴት ነህ?&quot;</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Type Smarter?</h2>
            <p className="text-base text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of bilingual users who type faster and translate smarter with AkAI.
            </p>
            <Button size="lg" onClick={() => setShowDemo(true)}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 text-white">
              <Keyboard className="w-4 h-4" />
              Try the Demo Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/30 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/akai-icon.png" alt="AkAI" className="w-7 h-7 rounded-lg" />
              <span className="text-sm font-semibold">AkAI</span>
              <span className="text-xs text-muted-foreground">• Amharic Keyboard + AI</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>English & Amharic</span>
              <span>•</span>
              <span>20+ Themes</span>
              <span>•</span>
              <span>AI Translation</span>
              <span>•</span>
              <span>Dark Mode</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
