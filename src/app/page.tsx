'use client';

import React, { useState, useSyncExternalStore, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Keyboard, Globe, Sparkles, Smile, Image, ClipboardList,
  Languages, Shield, Zap, Star,
  ArrowRight, Check, Pen, Palette, Sun, Moon,
  Download, MessageCircle, Type, Wand2, Layers, MousePointer2,
  ChevronRight, Play, X, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import KeyboardApp from '@/components/keyboard-app';

const FEATURES = [
  {
    icon: Globe,
    title: 'Bilingual Typing',
    description: 'Full QWERTY for English & complete Ge\'ez script for Amharic with all vowel forms.',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-600',
    span: 'col-span-1',
  },
  {
    icon: Wand2,
    title: 'AI Translation',
    description: 'Instant AI-powered translation between English and Amharic. Type and translate seamlessly.',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    span: 'col-span-1',
  },
  {
    icon: Smile,
    title: 'Stickers & GIFs',
    description: 'Hundreds of stickers and animated GIFs including Ethiopian-themed collections to express yourself.',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-600',
    span: 'col-span-1',
  },
  {
    icon: Pen,
    title: 'Handwriting Input',
    description: 'Draw characters directly on screen with AI-powered canvas-based handwriting recognition.',
    color: 'from-cyan-500 to-sky-600',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-600',
    span: 'col-span-1',
  },
  {
    icon: Palette,
    title: '20+ Beautiful Themes',
    description: 'Classic, Midnight, Ocean, Sunset, Forest, Ethiopian, Neon, Candy, and live 3D animated themes.',
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-600',
    span: 'col-span-1 lg:col-span-2',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays on your device. No keylogging, no data collection, ever.',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600',
    span: 'col-span-1',
  },
];

const STATS = [
  { value: '2', label: 'Languages', icon: Languages },
  { value: '200+', label: 'Stickers', icon: Smile },
  { value: '20+', label: 'Themes', icon: Palette },
  { value: 'AI', label: 'Translator', icon: Sparkles },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Install & Enable',
    description: 'Download AkAI from the Play Store and enable it as your default keyboard.',
    icon: Download,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    step: '02',
    title: 'Choose Your Language',
    description: 'Switch between English and Amharic with a single tap on the globe key.',
    icon: Languages,
    color: 'from-amber-500 to-orange-600',
  },
  {
    step: '03',
    title: 'Type & Translate',
    description: 'Type naturally and use AI translation to convert between languages instantly.',
    icon: Wand2,
    color: 'from-pink-500 to-rose-600',
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
];

const TRANSLATION_EXAMPLES = [
  { en: 'Hello, how are you?', am: 'ሰላም፣ እንዴት ነህ?' },
  { en: 'Thank you very much', am: 'በጣም አመሰግናለሁ' },
  { en: 'I love Ethiopia', am: 'ኢትዮጵያን እወዳለሁ' },
  { en: 'Good morning', am: 'እንደምን አደሩ' },
];

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function FloatingBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className={`absolute z-20 hidden lg:flex items-center gap-2 px-3 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border/50 shadow-lg ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ badge, title, highlight, highlightColor, description }: {
  badge?: string;
  title: string;
  highlight?: string;
  highlightColor?: string;
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
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <Sparkles className="w-3 h-3" />
            {badge}
          </span>
        )}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          {title}{' '}
          {highlight && (
            <span className={`bg-gradient-to-r ${highlightColor || 'from-emerald-500 to-teal-600'} bg-clip-text text-transparent`}>
              {highlight}
            </span>
          )}
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

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [translationIdx, setTranslationIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTranslationIdx(i => (i + 1) % TRANSLATION_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <header ref={heroRef} className="relative overflow-hidden">
        {/* Animated background mesh */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-amber-400/15 to-orange-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-gradient-to-br from-green-400/10 to-yellow-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }} />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-12 sm:mb-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="/akai-icon.png" alt="AkAI" className="w-10 h-10 rounded-xl shadow-lg" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight leading-none">AkAI</span>
                <span className="text-[10px] text-muted-foreground tracking-wide">AMHARIC KEYBOARD + AI</span>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDemo(!showDemo)}
                className="gap-1.5 hidden sm:flex"
              >
                {showDemo ? 'Hide Demo' : 'Try Demo'}
                <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showDemo ? 'rotate-90' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowDemo(true)}
                className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-3.5 h-3.5" />
                Live Demo
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left max-w-xl">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium mb-6 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered Bilingual Keyboard
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                  <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 bg-clip-text text-transparent">AkAI</span>
                  <br />
                  <span className="text-4xl sm:text-5xl lg:text-6xl">Keyboard</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground mb-3 leading-relaxed">
                  The smartest bilingual keyboard for English and Amharic.
                </p>
                <p className="text-sm text-muted-foreground/80 mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
                  AI translation • Stickers & GIFs • Handwriting • 20+ Themes • Ethiopian numbers • Word suggestions • Dark mode
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                  <Button size="lg" onClick={() => setShowDemo(true)}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/25 text-white h-12 px-8 text-base">
                    <Keyboard className="w-5 h-5" />
                    Try Interactive Demo
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6">
                    <Star className="w-4 h-4" />
                    See Features
                  </Button>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-8 sm:gap-10 mt-10 justify-center lg:justify-start">
                {STATS.map((stat, i) => (
                  <div key={i} className="text-center group">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Phone Mockup */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="flex-shrink-0 relative">
              {/* Floating badges around phone */}
              <FloatingBadge className="top-8 -left-20">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium">EN ↔ AM</span>
              </FloatingBadge>
              <FloatingBadge className="top-1/3 -right-24">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium">AI Translate</span>
              </FloatingBadge>
              <FloatingBadge className="bottom-20 -left-16">
                <Palette className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-medium">20+ Themes</span>
              </FloatingBadge>

              <div className="relative">
                {/* Glow behind phone */}
                <div className="absolute -inset-8 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-amber-500/20 rounded-[3.5rem] blur-2xl" />

                {/* Phone frame */}
                <div className="relative w-[300px] sm:w-[340px] lg:w-[360px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-2 shadow-2xl shadow-black/40 border border-gray-700/30">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
                  {/* Screen */}
                  <div className="relative bg-background rounded-[2rem] overflow-hidden" style={{ height: '560px' }}>
                    {/* Status bar */}
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
                  {/* Home indicator */}
                  <div className="flex justify-center py-1.5">
                    <div className="w-28 h-1 rounded-full bg-gray-600" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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
                <div className="flex items-center gap-2">
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

      {/* ─── Logos / Trust Bar ────────────────────────────────────────── */}
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

      {/* ─── Features (Bento Grid) ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <SectionHeading
          badge="Features"
          title="Everything You"
          highlight="Need"
          highlightColor="from-emerald-500 to-teal-600"
          description="A complete keyboard experience with modern features designed for bilingual users."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`group relative p-6 sm:p-7 rounded-2xl bg-card border border-border/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-border/60 hover:-translate-y-0.5 ${feature.span}`}
            >
              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-muted/30 to-background py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Getting Started"
            title="How It"
            highlight="Works"
            highlightColor="from-amber-500 to-orange-600"
            description="Get up and running with AkAI in just three simple steps."
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
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border/50" />
                )}
                <div className="relative">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-5 shadow-xl`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs font-bold text-muted-foreground/50 tracking-widest mb-2">{item.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
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
              <SectionHeading
                badge="Ge'ez Script"
                title="Full"
                highlight="Amharic Script"
                highlightColor="from-emerald-500 to-teal-600"
                description="Complete Amharic keyboard with 33 base consonants and their vowel families. Click any consonant to see its vowel forms."
              />
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
              <div className="grid grid-cols-5 gap-2.5 p-5 bg-card rounded-2xl border border-border/30 shadow-xl">
                {['ሀ','ለ','ሐ','መ','ሠ','ረ','ሰ','ሸ','ቀ','በ',
                  'ተ','ቸ','ኀ','ነ','ኘ','አ','ከ','ኸ','ወ','ዘ',
                  'ዠ','የ','ደ','ጀ','ገ','ጠ','ጨ','ጰ','ፀ','ፈ',
                  'ፐ','ቨ','ሟ','ኟ','ዟ'].map((char, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.2, y: -3 }}
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-accent/50 text-lg font-medium hover:bg-emerald-500 hover:text-white transition-colors cursor-default shadow-sm hover:shadow-md"
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
            badge="Live Themes"
            title="Stunning 3D"
            highlight="Live Wallpapers"
            highlightColor="from-violet-500 to-purple-600"
            description="Animate your keyboard with immersive 3D backgrounds that move and shimmer as you type."
          />

          {/* Live theme cards */}
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

          {/* Classic themes */}
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
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${themeItem.colors} flex items-center justify-center text-xl shadow-md`}>
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
            {/* Left: Animated demo card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex-shrink-0 order-2 lg:order-1"
            >
              <div className="w-[340px] bg-card rounded-2xl border border-border/30 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-border/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Languages className="w-4 h-4 text-amber-600" />
                      AI Translator
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">Live</span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                    <p className="text-[10px] text-emerald-600 font-semibold mb-1.5 uppercase tracking-wider">English</p>
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
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-amber-600 rotate-90" />
                    </motion.div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                    <p className="text-[10px] text-amber-600 font-semibold mb-1.5 uppercase tracking-wider">አማርኛ</p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={translationIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm font-medium"
                      >
                        &quot;{TRANSLATION_EXAMPLES[translationIdx].am}&quot;
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Text content */}
            <div className="flex-1 text-center lg:text-left order-1 lg:order-2">
              <SectionHeading
                badge="AI Powered"
                title="Instant"
                highlight="Translation"
                highlightColor="from-amber-500 to-orange-600"
                description="Translate any word or phrase between English and Amharic instantly with context-aware AI."
              />
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
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-amber-600" />
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
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-10 sm:p-16 text-center text-white"
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                Ready to Type Smarter?
              </h2>
              <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of bilingual users who type faster and translate smarter with AkAI.
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
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/30 text-white hover:bg-white/10 h-12 px-8"
                >
                  <Download className="w-4 h-4" />
                  Download App
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
            {/* Brand */}
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
            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Features</h4>
              <ul className="space-y-2">
                {['AI Translation', 'Handwriting', 'Stickers & GIFs', 'Themes', 'Word Suggestions'].map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default">{item}</li>
                ))}
              </ul>
            </div>
            {/* Languages */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Languages</h4>
              <ul className="space-y-2">
                {['English (QWERTY)', 'Amharic (Ge\'ez)', 'Ethiopian Numbers', 'Ge\'ez Punctuation'].map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default">{item}</li>
                ))}
              </ul>
            </div>
            {/* Company */}
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
