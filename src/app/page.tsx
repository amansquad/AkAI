'use client';

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Download, Globe, Sparkles, Keyboard, Check, ChevronRight,
  Zap, Shield, Palette, Star, ArrowRight, Play, Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy load heavy components
const DemoKeyboard = lazy(() => import('@/components/demo-keyboard'));

/*
  <!--
  THESIS: AkAI as Ethiopia's keyboard export — the design confidence of Ethiopian Airlines
  applied to software. Bilingual is the mechanism, not a feature checkbox. Both scripts
  are first-class from the first pixel.

  OWN-WORLD: Deep charcoal ground (rgb(18, 18, 20)), brilliant emerald green primary
  (rgb(16, 185, 129) — Ethiopian Airlines signature), crisp white text, warm gold accents
  (rgb(251, 191, 36)) for AI/premium features. Clean geometric sans (system-ui stack),
  confident scale jumps, sharp corners, purposeful motion. No decorative texture.

  STORY: Hero demonstrates live bilingual typing with inline AI translation → visitor sees
  both scripts as equals → explores interactive features → sees 20+ real themes → downloads
  or tries demo immediately.

  FIRST VIEWPORT: Interactive split-view typing demonstration. Left: English keyboard typing
  live. Right: Amharic keyboard. Center: Real-time AI translation with emerald highlights.
  Immediate CTA. Phone mockup showing actual product below. No multi-tap nostalgia — the
  mechanism is now, not the problem it replaced.

  FORM: Modern tech product landing (Ethiopian Airlines confidence applied to software),
  seed key 0b120b1b.

  FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
  the verdict, and DESIGN.md
  -->
*/

const TRANSLATION_PAIRS = [
  { en: 'Hello', am: 'ሰላም', enFull: 'Hello, how are you?', amFull: 'ሰላም፣ እንዴት ነህ?' },
  { en: 'Thank you', am: 'አመሰግናለሁ', enFull: 'Thank you very much', amFull: 'በጣም አመሰግናለሁ' },
  { en: 'I love Ethiopia', am: 'ኢትዮጵያን እወዳለሁ', enFull: 'I love Ethiopia', amFull: 'ኢትዮጵያን እወዳለሁ' },
  { en: 'Good morning', am: 'እንደምን አደሩ', enFull: 'Good morning', amFull: 'እንደምን አደሩ' },
];

const FEATURES = [
  {
    icon: Globe,
    title: 'Native Bilingual',
    description: 'Full QWERTY + complete Ge\'ez script. Neither language is the add-on.',
    stat: '2 Scripts'
  },
  {
    icon: Sparkles,
    title: 'Inline AI Translation',
    description: 'Translate between English and Amharic without leaving your keyboard.',
    stat: 'Real-time'
  },
  {
    icon: Palette,
    title: 'Live Themes',
    description: 'Animated backgrounds, team colors, cultural themes. Not screenshots.',
    stat: '20+ Themes'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'On-device processing. No keylogging. Your words stay yours.',
    stat: '0 Data Sent'
  }
];

const THEME_SHOWCASE = [
  { name: 'Aurora', color: 'from-purple-600 to-blue-600', image: '/themes/aurora.png' },
  { name: 'Lava', color: 'from-orange-600 to-red-600', image: '/themes/lava.png' },
  { name: 'Ocean', color: 'from-blue-600 to-cyan-600', image: '/themes/ocean.png' },
  { name: 'Galaxy', color: 'from-indigo-600 to-purple-600', image: '/themes/galaxy.png' },
  { name: 'Neon', color: 'from-pink-600 to-purple-600', image: '/themes/neon-pulse.png' },
  { name: 'Ethiopian', color: 'from-green-600 to-yellow-500', image: '/themes/addis_ababa.png' },
];

export default function Home() {
  const [activeTranslation, setActiveTranslation] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showDemo, setShowDemo] = useState(false);
  const { setTheme } = useTheme();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const themesRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });
  const themesInView = useInView(themesRef, { once: true, margin: '-100px' });

  // Auto-cycle translations
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTranslation((prev) => (prev + 1) % TRANSLATION_PAIRS.length);
      setTypingText('');
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Typing animation
  useEffect(() => {
    if (!isTyping) return;
    const text = TRANSLATION_PAIRS[activeTranslation].enFull;
    let index = 0;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (index <= text.length) {
          setTypingText(text.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }, 500);

    return () => clearTimeout(timeout);
  }, [activeTranslation, isTyping]);

  return (
    <div className="min-h-screen bg-[rgb(18,18,20)] text-white overflow-x-hidden">
      {/* Hero Section - Interactive Typing Demo */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Emerald gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

        <div className="relative z-10 max-w-7xl mx-auto w-full py-20 sm:py-32">
          {/* Logo & Nav */}
          <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between mb-20"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image src="/akai-icon.png" alt="AkAI" width={48} height={48} className="rounded-xl" priority />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[rgb(18,18,20)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">AkAI</h1>
                <p className="text-[10px] text-white/40 tracking-widest">KEYBOARD</p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              <a href="/AkAI-keyboard.apk" download>
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
          </motion.nav>

          {/* Main Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Headline & CTA */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">Live AI Translation</span>
              </div>

              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] mb-6">
                One keyboard.
                <br />
                <span className="text-emerald-500">Both languages.</span>
                <br />
                No compromise.
              </h2>

              <p className="text-lg sm:text-xl text-white/60 mb-8 max-w-xl leading-relaxed">
                Native Ge'ez script + English QWERTY with AI translation built into the typing surface.
                Made for Ethiopia's bilingual reality.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setShowDemo(true)}
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-14 px-8 text-base"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Try Interactive Demo
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/5 h-14 px-8 text-base"
                >
                  <a href="/AkAI-keyboard.apk" download>
                    <Download className="w-5 h-5 mr-2" />
                    Download App
                  </a>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/10">
                <div>
                  <div className="text-3xl font-bold text-emerald-500 mb-1">2</div>
                  <div className="text-xs text-white/50">Scripts Native</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-500 mb-1">20+</div>
                  <div className="text-xs text-white/50">Live Themes</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-500 mb-1">0</div>
                  <div className="text-xs text-white/50">Data Sent</div>
                </div>
              </div>
            </motion.div>

            {/* Right: Interactive Translation Demo */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 overflow-hidden">
                {/* Animated gradient orb */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />

                <div className="relative space-y-6">
                  {/* English Input */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <span className="text-sm font-bold">EN</span>
                      </div>
                      <span className="text-sm font-medium text-white/60">English</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 min-h-[4rem] flex items-center">
                      <p className="text-lg font-mono">
                        {typingText}
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="inline-block w-0.5 h-5 bg-emerald-500 ml-0.5"
                        />
                      </p>
                    </div>
                  </div>

                  {/* Translation Arrow */}
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="flex flex-col items-center gap-2"
                    >
                      <Sparkles className="w-6 h-6 text-amber-500" />
                      <div className="h-8 w-px bg-gradient-to-b from-amber-500 to-transparent" />
                      <span className="text-xs text-amber-400 font-medium">AI Translation</span>
                    </motion.div>
                  </div>

                  {/* Amharic Output */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <span className="text-sm font-bold">አማ</span>
                      </div>
                      <span className="text-sm font-medium text-white/60">Amharic</span>
                    </div>
                    <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 min-h-[4rem] flex items-center">
                      <motion.p
                        key={activeTranslation}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-mono"
                      >
                        {TRANSLATION_PAIRS[activeTranslation].amFull}
                      </motion.p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating indicator */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 bg-amber-500 text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-amber-500/50"
              >
                <Zap className="w-3 h-3 inline mr-1" />
                Instant
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Built for bilingual speed
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Everything you need to type faster in both languages. No app switching.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-emerald-500/0 rounded-2xl transition-all duration-300" />

                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-emerald-500" />
                  </div>

                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-white/60 text-sm mb-4 leading-relaxed">{feature.description}</p>

                  <div className="pt-4 border-t border-white/10">
                    <span className="text-2xl font-bold text-emerald-500">{feature.stat}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Themes Showcase */}
      <section ref={themesRef} className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={themesInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Themes that move
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Live-animated backgrounds, not static screenshots. Your keyboard, your style.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {THEME_SHOWCASE.map((theme, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={themesInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
              >
                <Image
                  src={theme.image}
                  alt={theme.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                  loading={i < 3 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{theme.name}</span>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.color}`} />
                  </div>
                </div>

                <div className="absolute inset-0 border-2 border-emerald-500/0 group-hover:border-emerald-500/50 rounded-2xl transition-all duration-300" />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={themesInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 }}
            className="text-center mt-12"
          >
            <Button
              onClick={() => setShowDemo(true)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5"
            >
              Explore All Themes
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Phone Mockup Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute -inset-20 bg-emerald-500/20 rounded-full blur-3xl" />

            {/* Phone frame */}
            <div className="relative w-[340px] mx-auto bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-[2.5rem] p-3 shadow-2xl border border-zinc-600/50">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-10" />

              <div className="relative bg-white rounded-[2rem] overflow-hidden" style={{ height: '640px' }}>
                <Suspense fallback={
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-600 text-sm">Loading keyboard...</p>
                    </div>
                  </div>
                }>
                  <DemoKeyboard />
                </Suspense>
              </div>

              <div className="flex justify-center py-2">
                <div className="w-32 h-1 rounded-full bg-zinc-600" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-12 sm:p-16 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Stop compromising.
                <br />
                Start typing.
              </h2>
              <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
                Join bilingual users who type faster and translate smarter with AkAI.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-14 px-8 text-base"
                >
                  <a href="/AkAI-keyboard.apk" download>
                    <Download className="w-5 h-5 mr-2" />
                    Download for Android
                  </a>
                </Button>
                <Button
                  onClick={() => setShowDemo(true)}
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 h-14 px-8 text-base"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Try Demo First
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo Modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDemo(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[rgb(18,18,20)] rounded-3xl border border-white/10 overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-[rgb(18,18,20)]/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-2xl font-bold">Interactive Demo</h3>
                  <p className="text-sm text-white/60 mt-1">Try the AkAI keyboard right here</p>
                </div>
                <Button
                  onClick={() => setShowDemo(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                >
                  Close
                </Button>
              </div>

              <div className="p-6">
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
                  <div style={{ height: '600px' }}>
                    <Suspense fallback={
                      <div className="h-full flex items-center justify-center bg-gradient-to-br from-[rgb(18,18,20)] to-[rgb(25,25,28)]">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-white/60 text-sm">Loading demo keyboard...</p>
                        </div>
                      </div>
                    }>
                      <DemoKeyboard />
                    </Suspense>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/akai-icon.png" alt="AkAI" width={40} height={40} className="rounded-lg" />
                <div>
                  <h4 className="font-bold">AkAI</h4>
                  <p className="text-xs text-white/40">Keyboard</p>
                </div>
              </div>
              <p className="text-sm text-white/60 max-w-xs">
                The smartest bilingual keyboard for English and Amharic.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm">Features</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>AI Translation</li>
                <li>Handwriting Input</li>
                <li>Live Themes</li>
                <li>Privacy First</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm">Languages</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>English (QWERTY)</li>
                <li>Amharic (Ge'ez)</li>
                <li>Ethiopian Numbers</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm">Download</h4>
              <Button
                asChild
                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full"
              >
                <a href="/AkAI-keyboard.apk" download>
                  <Download className="w-4 h-4 mr-2" />
                  Android APK
                </a>
              </Button>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/40">
            <p>&copy; 2026 AkAI Keyboard. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                English & Amharic
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy First
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
