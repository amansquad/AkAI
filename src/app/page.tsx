'use client';

import React, { useState, useSyncExternalStore, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Keyboard, Globe, Sparkles, Smile,
  Languages, Shield,
  ArrowRight, Check, Pen, Palette, Sun, Moon,
  Download, Wand2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import KeyboardApp from '@/components/keyboard-app';

const FEATURES = [
  {
    icon: Globe,
    title: 'Bilingual Typing',
    description: 'Full QWERTY for English & complete Ge\'ez script for Amharic with all vowel forms. Neither language is the afterthought.',
    lead: true,
  },
  {
    icon: Wand2,
    title: 'AI Translation',
    description: 'Instant AI-powered translation between English and Amharic. Type and translate seamlessly, inside the keyboard itself.',
    lead: true,
  },
  {
    icon: Smile,
    title: 'Stickers & GIFs',
    description: 'Hundreds of stickers and animated GIFs including Ethiopian-themed collections to express yourself.',
  },
  {
    icon: Pen,
    title: 'Handwriting Input',
    description: 'Draw characters directly on screen with AI-powered canvas-based handwriting recognition.',
  },
  {
    icon: Palette,
    title: '20+ Themes',
    description: 'Classic, live-animated, and team themes — real depth, not one screenshot pretending to be a feature.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays on your device. No keylogging, no data collection, ever.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Install & Enable',
    description: 'Download AkAI from the Play Store and enable it as your default keyboard.',
    icon: Download,
  },
  {
    step: '02',
    title: 'Choose Your Language',
    description: 'Switch between English and Amharic with a single tap on the globe key.',
    icon: Languages,
  },
  {
    step: '03',
    title: 'Type & Translate',
    description: 'Type naturally and use AI translation to convert between languages instantly.',
    icon: Wand2,
  },
];

const LIVE_THEMES = [
  { name: 'Aurora', image: '/themes/aurora.png' },
  { name: 'Lava', image: '/themes/lava.png' },
  { name: 'Ocean', image: '/themes/ocean.png' },
  { name: 'Neon', image: '/themes/neon-pulse.png' },
  { name: 'Galaxy', image: '/themes/galaxy.png' },
  { name: 'Cyberpunk', image: '/themes/cyberpunk.png' },
  { name: 'Sunset', image: '/themes/sunset.png' },
  { name: 'Fire', image: '/themes/fire.png' },
  { name: 'Matrix', image: '/themes/matrix.png' },
  { name: 'Rainbow', image: '/themes/rainbow.png' },
  { name: 'Waterfall', image: '/themes/waterfall.png' },
  { name: 'Autumn', image: '/themes/autumn.png' },
  { name: 'Addis Ababa', image: '/themes/addis_ababa.png' },
  { name: 'Judah Lion', image: '/judah_lion.png' },
];

const CLASSIC_THEMES = [
  { name: 'Classic', emoji: '⬜' },
  { name: 'Midnight', emoji: '🌙' },
  { name: 'Ocean', emoji: '🌊' },
  { name: 'Sunset', emoji: '🌅' },
  { name: 'Forest', emoji: '🌿' },
  { name: 'Ethiopian', emoji: '🇪🇹' },
  { name: 'Rose', emoji: '🌹' },
  { name: 'Neon', emoji: '💜' },
  { name: 'Candy', emoji: '🍬' },
  { name: 'Arctic', emoji: '❄️' },
  { name: 'Cherry', emoji: '🍒' },
  { name: 'Sand', emoji: '🏜️' },
];

const TRANSLATION_EXAMPLES = [
  { en: 'Hello, how are you?', am: 'ሰላም፣ እንዴት ነህ?' },
  { en: 'Thank you very much', am: 'በጣም አመሰግናለሁ' },
  { en: 'I love Ethiopia', am: 'ኢትዮጵያን እወዳለሁ' },
  { en: 'Good morning', am: 'እንደምን አደሩ' },
];

// Multi-tap history: what it actually took to type "ጠ" on a 12-key phone —
// the real, remembered mechanic this whole hero stages and then retires.
const MULTITAP_SEQUENCE = ['ጠ', 'ጡ', 'ጢ', 'ጣ'];

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function SectionHeading({ title, description }: {
  title: React.ReactNode;
  description?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <div ref={ref} className="text-center mb-12 sm:mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          {title}
        </h2>
        {description && (
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </motion.div>
    </div>
  );
}

/** The 12-key multi-tap keypad — the old way, staged so the visitor can feel
 * the tedium before AkAI retires it. Tapping "4" four times (the real
 * mechanic for cycling ጠ's vowel forms on a feature phone) triggers reveal;
 * an unattended visitor gets the same payoff on a short timer. */
function MultiTapKeypad({ tapCount, onTap }: { tapCount: number; onTap: () => void }) {
  const rows: { d: string; l: string }[][] = [
    [{ d: '1', l: '.,?!' }, { d: '2', l: 'ABC' }, { d: '3', l: 'DEF' }],
    [{ d: '4', l: 'GHI' }, { d: '5', l: 'JKL' }, { d: '6', l: 'MNO' }],
    [{ d: '7', l: 'PQRS' }, { d: '8', l: 'TUV' }, { d: '9', l: 'WXYZ' }],
    [{ d: '*', l: '' }, { d: '0', l: 'SPACE' }, { d: '#', l: '' }],
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {rows.map((row) =>
        row.map((key) => {
          const isTarget = key.d === '4';
          return (
            <button
              key={key.d}
              onClick={isTarget ? onTap : undefined}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border flex flex-col items-center justify-center transition-colors ${
                isTarget
                  ? 'border-[#FFB020] bg-[#FFB020]/10 text-[#FFB020] shadow-[0_0_18px_rgba(255,176,32,0.35)] cursor-pointer active:scale-95'
                  : 'border-white/10 bg-white/[0.02] text-white/40'
              }`}
              style={{ fontFamily: 'var(--font-vt323)' }}
              aria-label={isTarget ? `Press 4 (tapped ${tapCount} of 4 times)` : key.d}
            >
              <span className="text-2xl sm:text-3xl leading-none">{key.d}</span>
              {key.l && <span className="text-[9px] sm:text-[10px] tracking-widest mt-1">{key.l}</span>}
              {isTarget && tapCount > 0 && (
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FFB020] text-black text-xs font-bold flex items-center justify-center"
                  style={{ fontFamily: 'var(--font-vt323)' }}
                >
                  {tapCount}
                </motion.span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const [translationIdx, setTranslationIdx] = useState(0);

  // ─── Old Way / New Way reveal ──────────────────────────────────────────
  const reducedMotion = usePrefersReducedMotion();
  const [tapCount, setTapCount] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    const fallback = setTimeout(() => setRevealed(true), reducedMotion ? 0 : 6000);
    return () => clearTimeout(fallback);
  }, [revealed, reducedMotion]);

  const handleTap = () => {
    if (revealed) return;
    setTapCount((c) => {
      const next = c + 1;
      if (next >= 4) setTimeout(() => setRevealed(true), 350);
      return next;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTranslationIdx(i => (i + 1) % TRANSLATION_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* ─── Hero: Old Way / New Way ──────────────────────────────────── */}
      <header ref={heroRef} className="relative overflow-hidden bg-[#0B0C08]">
        <motion.div style={{ y: heroY }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 sm:pb-24">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-12 sm:mb-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="/akai-icon.png" alt="AkAI" className="w-10 h-10 rounded-xl shadow-lg" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0B0C08]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight leading-none text-white">AkAI</span>
                <span className="text-[10px] text-white/40 tracking-wide">AMHARIC KEYBOARD + AI</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="gap-1.5 text-white/70 hover:text-white hover:bg-white/10"
                title="Toggle dark mode"
              >
                {mounted && resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDemo(!showDemo)}
                className="gap-1.5 hidden sm:flex border-white/20 text-white hover:bg-white/10"
              >
                {showDemo ? 'Hide Demo' : 'Try Demo'}
                <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showDemo ? 'rotate-90' : ''}`} />
              </Button>
              <Button
                asChild
                size="sm"
                className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              >
                <a href="/AkAI-keyboard.apk" download>
                  <Download className="w-3.5 h-3.5" />
                  Download App
                </a>
              </Button>
            </div>
          </nav>

          {/* Headline — crossfades old label to real claim */}
          <div className="text-center mb-10 sm:mb-14">
            <AnimatePresence mode="wait">
              {!revealed ? (
                <motion.p
                  key="old-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[#FFB020] text-lg sm:text-xl tracking-[0.3em] mb-3"
                  style={{ fontFamily: 'var(--font-vt323)' }}
                >
                  OLD WAY: PRESS 4 → ×4 FOR ጠ
                </motion.p>
              ) : (
                <motion.p
                  key="new-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-emerald-400 text-xs sm:text-sm tracking-[0.3em] mb-3 font-semibold"
                >
                  NEW WAY
                </motion.p>
              )}
            </AnimatePresence>
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl mx-auto transition-colors duration-500 ${revealed ? 'text-white' : 'text-white/30'}`}>
              One keyboard. <span className={revealed ? 'text-emerald-400' : ''}>Both languages.</span> No compromise.
            </h1>
            {!revealed && (
              <p className="mt-4 text-white/40 text-sm" style={{ fontFamily: 'var(--font-vt323)' }}>
                tap the glowing key four times, or wait
              </p>
            )}
          </div>

          {/* Stage: keypad dissolves into the real, running keyboard */}
          <div className="relative max-w-md mx-auto" style={{ minHeight: 620 }}>
            <AnimatePresence mode="wait">
              {!revealed ? (
                <motion.div
                  key="keypad"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.92, filter: 'blur(6px)' }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* LCD readout */}
                  <div className="w-full rounded-lg border border-[#FFB020]/30 bg-black px-5 py-4 text-center">
                    <span
                      className="text-4xl text-[#FFB020]"
                      style={{ fontFamily: 'var(--font-vt323)', textShadow: '0 0 12px rgba(255,176,32,0.6)' }}
                    >
                      {MULTITAP_SEQUENCE[Math.min(tapCount, 3)]}
                    </span>
                    <div className="text-[#FFB020]/50 text-xs mt-1 tracking-widest" style={{ fontFamily: 'var(--font-vt323)' }}>
                      {tapCount}/4 TAPS
                    </div>
                  </div>
                  <MultiTapKeypad tapCount={tapCount} onTap={handleTap} />
                </motion.div>
              ) : (
                <motion.div
                  key="keyboard"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="relative"
                >
                  {/* Glow behind phone — strong enough to read against the near-black stage */}
                  <div className="absolute -inset-10 bg-emerald-500/25 rounded-[3.5rem] blur-3xl" />
                  <div className="absolute -inset-1 rounded-[2.6rem] ring-1 ring-white/15" />

                  {/* Phone frame running the real product. The screen is a
                      hardcoded lit surface (not bg-background) — a phone
                      doesn't go dark because the visitor's OS is in dark
                      mode, and this is the page's one proof moment. */}
                  <div className="relative w-[300px] sm:w-[340px] mx-auto bg-gradient-to-b from-gray-600 to-gray-800 rounded-[2.5rem] p-2 shadow-2xl shadow-black/60 border border-gray-500/40">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
                    <div className="akai-light-scope relative bg-white rounded-[2rem] overflow-hidden" style={{ height: '560px' }}>
                      <div className="flex items-center justify-between px-6 pt-3 pb-1 bg-white text-gray-900">
                        <span className="text-[10px] font-medium">9:41</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3.5 h-2 border border-gray-900/50 rounded-sm relative">
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

                  {/* Proof chips */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                    className="hidden lg:flex absolute top-8 -left-40 items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-white">EN ↔ AM, natively</span>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 }}
                    className="hidden lg:flex absolute top-1/3 -right-44 items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-white">AI translation, built in</span>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}
                    className="hidden lg:flex absolute bottom-20 -left-36 items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <Palette className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-white">20+ themes</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {revealed && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-3 justify-center mt-10">
              <Button size="lg" onClick={() => setShowDemo(true)}
                className="gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/25 text-white h-12 px-8 text-base">
                <Keyboard className="w-5 h-5" />
                Try Interactive Demo
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 h-12 px-6 border-white/20 text-white hover:bg-white/10">
                <a href="/AkAI-keyboard.apk" download>
                  <Download className="w-4 h-4" />
                  Download App
                </a>
              </Button>
            </motion.div>
          )}
        </motion.div>
      </header>

      {/* ─── Interactive Demo ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showDemo && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="max-w-3xl mx-auto px-4 py-10">
              <div className="flex items-center justify-between mb-6">
                <div className="text-left">
                  <h2 className="text-2xl font-bold mb-1">Interactive Demo</h2>
                  <p className="text-sm text-muted-foreground">Try the AkAI keyboard right here in your browser</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDemo(false)}
                  className="gap-1.5 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>
              <div className="bg-card rounded-3xl border border-border/50 shadow-xl overflow-hidden">
                <div className="h-[560px]">
                  <KeyboardApp />
                </div>
              </div>
              <div className="text-center mt-4">
                <Button variant="ghost" size="sm" onClick={() => setShowDemo(false)} className="gap-1.5 text-muted-foreground">
                  Close Demo
                  <ArrowRight className="w-3 h-3 rotate-90" />
                </Button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── Trust Bar ────────────────────────────────────────────────── */}
      <section className="border-y border-border/30 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-xs text-muted-foreground/60 mb-6 tracking-wider uppercase">Designed for the Ethiopian community worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-muted-foreground/40">
            {['English', 'አማርኛ', 'ትግርኛ', 'ኦሮምኛ', 'Somali'].map((lang, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4" />
                {lang}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <SectionHeading
          title="Everything a bilingual keyboard should have been"
          description="One consistent system, not a checklist — every feature built to serve typing in both languages equally."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`group relative p-6 sm:p-7 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ${
                feature.lead
                  ? 'bg-emerald-500/[0.04] border-emerald-500/20 hover:border-emerald-500/40 sm:col-span-1 lg:col-span-1'
                  : 'bg-card border-border/30 hover:border-border/60'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                feature.lead ? 'bg-emerald-500' : 'bg-foreground/5 border border-border/40'
              }`}>
                <feature.icon className={`w-5 h-5 ${feature.lead ? 'text-white' : 'text-foreground/70'}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-muted/30 to-background py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Three steps, no relearning"
            description="Get up and running with AkAI in a minute."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="relative text-center"
              >
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border/50" />
                )}
                <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/20">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-xs font-bold text-muted-foreground/50 tracking-widest mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Amharic Script Showcase ───────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Full Ge&apos;ez script, no shortcuts
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-6 leading-relaxed">
                Complete Amharic keyboard with 33 base consonants and their vowel families. Click any consonant to see its vowel forms.
              </p>
              <div className="space-y-3 max-w-md mx-auto lg:mx-0">
                {[
                  '33 base consonants (ሀ-ፐ)',
                  '7 vowel forms per consonant in sidebar',
                  'Ethiopian numbers (፩፪፫፬፭፮)',
                  'Ge\'ez punctuation & sentence symbols',
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0"
            >
              <div
                className="grid grid-cols-5 gap-2.5 p-5 bg-card rounded-2xl border border-border/30 shadow-xl"
                style={{ fontFamily: 'var(--font-noto-ethiopic)' }}
              >
                {['ሀ','ለ','ሐ','መ','ሠ','ረ','ሰ','ሸ','ቀ','በ',
                  'ተ','ቸ','ኀ','ነ','ኘ','አ','ከ','ኸ','ወ','ዘ',
                  'ዠ','የ','ደ','ጀ','ገ','ጠ','ጨ','ጰ','ፀ','ፈ',
                  'ፐ','ቨ','ሟ','ኟ','ዟ'].map((char, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.2, y: -3 }}
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-accent/50 text-lg hover:bg-emerald-500 hover:text-white transition-colors cursor-default shadow-sm hover:shadow-md"
                  >
                    {char}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Live Themes Showcase ─────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="20+ themes, real depth"
            description="Live-animated backgrounds and team themes that move and shimmer as you type — not one screenshot standing in for a feature."
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 mb-12">
            {LIVE_THEMES.map((theme, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="group relative overflow-hidden rounded-2xl border border-border/30 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={theme.image}
                    alt={theme.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">{theme.name}</span>
                    <span className="text-[10px] text-white/70 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">LIVE</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <h3 className="text-xl font-bold text-center mb-6">Classic Themes</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {CLASSIC_THEMES.map((themeItem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/30 shadow-sm hover:shadow-md transition-shadow hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl bg-foreground/5 border border-border/40 flex items-center justify-center text-xl">
                  {themeItem.emoji}
                </div>
                <span className="text-xs font-medium">{themeItem.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Translation ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex-shrink-0 order-2 lg:order-1"
            >
              <div className="w-[340px] bg-card rounded-2xl border border-border/30 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Languages className="w-4 h-4 text-emerald-600" />
                      AI Translator
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">Live</span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                    <p className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">English</p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={translationIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm font-medium"
                      >
                        &quot;{TRANSLATION_EXAMPLES[translationIdx].en}&quot;
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600 rotate-90" />
                    </motion.div>
                  </div>
                  <div
                    className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20"
                    style={{ fontFamily: 'var(--font-noto-ethiopic)' }}
                  >
                    <p className="text-[10px] text-emerald-600 font-semibold mb-1.5 uppercase tracking-wider" style={{ fontFamily: 'var(--font-geist-sans)' }}>አማርኛ</p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={translationIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="text-base font-medium"
                      >
                        &quot;{TRANSLATION_EXAMPLES[translationIdx].am}&quot;
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex-1 text-center lg:text-left order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Translation that lives in the keyboard
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-6 leading-relaxed">
                Translate any word or phrase between English and Amharic instantly with context-aware AI — no app-switching.
              </p>
              <div className="space-y-3 max-w-md mx-auto lg:mx-0">
                {['Context-aware translations', 'Word suggestions for both languages', 'Next word prediction', 'Use translations directly in text'].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-emerald-600 p-10 sm:p-16 text-center text-white"
          >
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                No more four taps for one letter.
              </h2>
              <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join bilingual users who type faster and translate smarter with AkAI.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={() => setShowDemo(true)}
                  className="gap-2 bg-white text-emerald-700 hover:bg-white/90 shadow-xl h-12 px-8 text-base"
                >
                  <Keyboard className="w-5 h-5" />
                  Try the Demo Now
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/30 text-white hover:bg-white/10 h-12 px-8"
                >
                  <a href="/AkAI-keyboard.apk" download>
                    <Download className="w-4 h-4" />
                    Download App
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border/30 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/akai-icon.png" alt="AkAI" className="w-8 h-8 rounded-lg" />
                <div>
                  <span className="text-base font-bold">AkAI</span>
                  <span className="text-xs text-muted-foreground ml-1.5">Keyboard</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                The smartest bilingual keyboard for English and Amharic with AI-powered translation.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Features</h4>
              <ul className="space-y-2">
                {['AI Translation', 'Handwriting', 'Stickers & GIFs', 'Themes', 'Word Suggestions'].map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Languages</h4>
              <ul className="space-y-2">
                {['English (QWERTY)', 'Amharic (Ge\'ez)', 'Ethiopian Numbers', 'Ge\'ez Punctuation'].map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">About</h4>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Contact Us', 'Changelog'].map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default">{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} AkAI Keyboard. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> English & Amharic</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> 20+ Themes</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Translation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
