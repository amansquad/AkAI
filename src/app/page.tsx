'use client';

import React, { useEffect, useId, useState, lazy, Suspense } from 'react';
import Image from 'next/image';
import { ArrowDown, Download, Languages, PenLine, ShieldCheck, Smile } from 'lucide-react';
import apkInfo from '@/lib/apk-info.json';
import './landing.css';

// The demo is the shipping keyboard itself, not a lookalike, so every tab,
// theme and setting behaves exactly as it does in the app.
const DemoKeyboard = lazy(() => import('@/components/keyboard-app'));

const APK = '/AkAI-keyboard.apk';
// The saved file is named with its version, so it can be told apart from an
// older download in the phone's Downloads folder.
const APK_FILE = `AkAI-keyboard-v${apkInfo.version}.apk`;
const APK_SIZE_MB = Math.round(apkInfo.sizeBytes / 1_000_000);

/** What the visitor is about to download: the version, the size, and what it runs on. */
function ApkNote({ style }: { style?: React.CSSProperties }) {
  return (
    <p className="land-version" style={style}>
      Version {apkInfo.version} · {APK_SIZE_MB} MB · Android {apkInfo.minAndroid}+
    </p>
  );
}

const PAIRS = [
  { en: 'Hello, how are you?', am: 'ሰላም፣ እንዴት ነህ?' },
  { en: 'Thank you very much', am: 'በጣም አመሰግናለሁ' },
  { en: 'I love Ethiopia', am: 'ኢትዮጵያን እወዳለሁ' },
  { en: 'Good morning', am: 'እንደምን አደሩ' },
];

/* The seven orders of the fidel, by their traditional names. */
const ORDERS = ['ግዕዝ', 'ካዕብ', 'ሣልስ', 'ራብዕ', 'ኀምስ', 'ሳድስ', 'ሳብዕ'];
const FIDEL: Record<string, string[]> = {
  'ሀ': ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'],
  'ለ': ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ'],
  'መ': ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ'],
  'ሰ': ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ'],
  'ቀ': ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ'],
  'በ': ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ'],
};

const THEMES = [
  { name: 'Addis Ababa', src: '/themes/addis_ababa.png', tag: 'Ethiopian' },
  { name: 'Nebula', src: '/themes/nebula_live.png', tag: 'Live' },
  { name: 'Aurora', src: '/themes/aurora.png', tag: 'Theme' },
  { name: 'St. George', src: '/themes/fb_stgeorge.png', tag: 'Club' },
  { name: 'Starfield', src: '/themes/starfield_live.png', tag: 'Live' },
  { name: 'Lava', src: '/themes/lava.png', tag: 'Theme' },
  { name: 'Galaxy', src: '/themes/galaxy.png', tag: 'Theme' },
  { name: 'Neon Pulse', src: '/themes/neon-pulse.png', tag: 'Theme' },
];

/* Circular postmark with bilingual ring text. `n` re-keys the drop animation. */
function Seal({ n, size = 150 }: { n: number; size?: number }) {
  const id = useId();
  return (
    <svg
      key={n}
      className="land-seal land-seal--drop"
      width={size}
      height={size}
      viewBox="0 0 160 160"
      aria-hidden="true"
    >
      <defs>
        <path id={id} d="M80,80 m-58,0 a58,58 0 1,1 116,0 a58,58 0 1,1 -116,0" />
      </defs>
      <circle cx="80" cy="80" r="74" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="80" cy="80" r="42" fill="none" stroke="currentColor" strokeWidth="2" />
      <text fill="currentColor" fontSize="13" fontWeight="800" letterSpacing="3.2" style={{ fontFamily: 'var(--f-display)' }}>
        <textPath href={`#${id}`} startOffset="0">
          AKAI · TRANSLATED · ትርጉም ·
        </textPath>
      </text>
      <text x="80" y="76" textAnchor="middle" fill="currentColor" fontSize="21" fontWeight="900" style={{ fontFamily: 'var(--f-display)' }}>
        EN→አማ
      </text>
      <path d="M52 94 q9 -8 18 0 t18 0 t18 0" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

function Hero() {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(PAIRS[0].en);
  const [sent, setSent] = useState(true);
  const [mark, setMark] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const run = (idx: number) => {
      if (!alive) return;
      const text = PAIRS[idx].en;
      setI(idx);
      setSent(false);
      setTyped('');
      let n = 0;
      const tick = () => {
        if (!alive) return;
        n += 1;
        setTyped(text.slice(0, n));
        if (n < text.length) {
          timer = setTimeout(tick, 55);
        } else {
          timer = setTimeout(() => {
            if (!alive) return;
            setSent(true);
            setMark((m) => m + 1);
            timer = setTimeout(() => run((idx + 1) % PAIRS.length), 3600);
          }, 450);
        }
      };
      timer = setTimeout(tick, 500);
    };
    timer = setTimeout(() => run(1), 3200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const pair = PAIRS[i];

  return (
    <section className="land-wrap" style={{ paddingBlock: 'clamp(28px, 5vw, 56px) clamp(56px, 8vw, 112px)' }}>
      <header className="flex items-center justify-between" style={{ marginBottom: 'clamp(36px, 6vw, 72px)' }}>
        <a href="#top" className="flex items-center gap-3 no-underline" aria-label="AkAI home">
          <Image src="/akai-icon.png" alt="" width={44} height={44} className="rounded-[10px]" priority />
          <span className="land-display" style={{ fontSize: '2rem', }}>AkAI</span>
        </a>
        <a href={APK} download={APK_FILE} title={`AkAI ${apkInfo.version} for Android`} className="land-btn land-btn--ghost" style={{ minHeight: 44, padding: '0 1.1rem', fontSize: '0.9rem' }}>
          <Download size={18} aria-hidden="true" /> Download
        </a>
      </header>

      <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-8" id="top">
        <div>
          <h1 className="land-display" style={{ fontSize: 'clamp(2.5rem, 7.6vw, 5.8rem)', textWrap: 'nowrap' }}>
            One keyboard.
            <br />
            <span style={{ color: 'var(--saffron)' }}>Both languages.</span>
            <br />
            No compromise.
          </h1>
          <p className="land-lede" style={{ marginTop: 'clamp(20px, 3vw, 32px)' }}>
            Native Ge&apos;ez script and English QWERTY, with AI translation built into the typing surface. Made for
            Ethiopia&apos;s bilingual reality.
          </p>
          <div className="flex flex-wrap gap-3" style={{ marginTop: 32 }}>
            <a href={APK} download={APK_FILE} className="land-btn land-btn--primary">
              <Download size={20} aria-hidden="true" /> Download for Android
            </a>
            <a href="#try" className="land-btn land-btn--ghost">
              Try it here <ArrowDown size={20} aria-hidden="true" />
            </a>
          </div>
          <ApkNote style={{ marginTop: 14 }} />
        </div>

        {/* The pair: one sentence, two scripts, equal weight. */}
        <div className="relative mx-auto w-full max-w-[520px]" style={{ paddingBottom: 40 }}>
          <p className="sr-only">
            Example: &quot;{pair.en}&quot; becomes &quot;{pair.am}&quot;.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-5" aria-hidden="true">
            <div className="land-sign-shadow" style={{ transform: 'rotate(-3deg)' }}>
              <div className="land-sign">
                <div
                  className="land-sign__art flex flex-col justify-between"
                  style={{ background: 'var(--vermilion)', color: '#fff', minHeight: 'clamp(220px, 34vw, 300px)', padding: 14 }}
                >
                  <span className="land-sign__cap">English · QWERTY</span>
                  <p className="land-display" style={{ fontSize: 'clamp(1.5rem, 4.2vw, 2.3rem)', lineHeight: 1 }}>
                    {typed}
                    <span className="land-caret" />
                  </p>
                </div>
                <div className="flex items-end justify-between" style={{ marginTop: 10 }}>
                  <span className="land-sign__cap">Ethiopia</span>
                  <span className="land-sign__val" style={{ fontSize: '1.9rem' }}>EN</span>
                </div>
              </div>
            </div>
            <div className="land-sign-shadow" style={{ transform: 'rotate(2.5deg) translateY(18px)' }}>
              <div className="land-sign">
                <div
                  className="land-sign__art flex flex-col justify-between"
                  style={{ background: 'var(--saffron)', color: 'var(--ink)', minHeight: 'clamp(220px, 34vw, 300px)', padding: 14 }}
                >
                  <span className="land-sign__cap">አማርኛ · ግዕዝ</span>
                  <p
                    className="land-geez"
                    style={{
                      fontSize: 'clamp(1.6rem, 4.6vw, 2.5rem)',
                      lineHeight: 1.15,
                      opacity: sent ? 1 : 0.18,
                      transition: 'opacity 300ms var(--ease)',
                    }}
                  >
                    {sent ? pair.am : '· · ·'}
                  </p>
                </div>
                <div className="flex items-end justify-between" style={{ marginTop: 10 }}>
                  <span className="land-sign__cap">ኢትዮጵያ</span>
                  <span className="land-sign__val land-geez" style={{ fontSize: '1.9rem', }}>አማ</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2" style={{ marginLeft: 6 }}>
            {sent && <Seal n={mark} size={150} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function Fidel() {
  const [pick, setPick] = useState('ሀ');
  return (
    <section style={{ background: 'var(--ground-soft)' }}>
      <div className="land-wrap" style={{ paddingBlock: 'clamp(64px, 9vw, 120px)' }}>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="land-display land-h2">
              Every fidel.
              <br />
              <span style={{ color: 'var(--saffron)' }}>All seven forms.</span>
            </h2>
            <p className="land-lede" style={{ marginTop: 24 }}>
              The complete Ge&apos;ez script, each consonant with its vowel forms, typed natively. Amharic is not a
              layer on top of an English keyboard here. Pick a letter and see its family.
            </p>
            <div role="group" aria-label="Choose a consonant" className="flex flex-wrap gap-2" style={{ marginTop: 28 }}>
              {Object.keys(FIDEL).map((c) => (
                <button key={c} type="button" className="land-chip" aria-pressed={pick === c} onClick={() => setPick(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 content-start gap-3 sm:gap-5" key={pick}>
            {FIDEL[pick].map((g, k) => (
              <div key={k} className="land-sign-shadow">
                <div className="land-sign" style={{ ['--s' as string]: '11px', ['--r' as string]: '3.5px', padding: 9 }}>
                  <div
                    className="land-sign__art flex items-center justify-center"
                    style={{
                      aspectRatio: '4 / 5',
                      background: k % 2 ? 'var(--vermilion)' : 'var(--sky)',
                      color: '#fff',
                    }}
                  >
                    <span className="land-geez" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4rem)' }}>{g}</span>
                  </div>
                  <div className="land-sign__cap land-geez" style={{ marginTop: 7, textAlign: 'center', letterSpacing: '0.04em', fontSize: '0.8rem' }}>
                    {ORDERS[k]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Sign({
  className = '',
  bg,
  fg,
  cap,
  val,
  children,
  mark,
}: {
  className?: string;
  bg: string;
  fg: string;
  cap: string;
  val: React.ReactNode;
  children: React.ReactNode;
  mark?: string;
}) {
  return (
    <div className={`land-sign-shadow ${className}`}>
      <div className="land-sign h-full">
        <div className="land-sign__art flex h-full flex-col justify-between gap-8" style={{ background: bg, color: fg, padding: 'clamp(18px, 3vw, 32px)' }}>
          <div className="flex items-start justify-between gap-4">
            <span className="land-sign__cap">{cap}</span>
            <span className="land-sign__val" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}>{val}</span>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

function Sheet() {
  const h = { fontSize: 'clamp(1.9rem, 4.2vw, 3.1rem)', } as const;
  const p = { marginTop: 14, maxWidth: '40ch', lineHeight: 1.5, fontSize: '1.02rem' } as const;
  return (
    <section className="land-wrap" style={{ paddingBlock: 'clamp(64px, 9vw, 120px)' }}>
      <h2 className="land-display land-h2" style={{ marginBottom: 'clamp(32px, 5vw, 56px)', maxWidth: '14ch' }}>
        Built for <span style={{ color: 'var(--saffron)' }}>bilingual</span> speed
      </h2>
      <div className="grid gap-5 md:grid-cols-12 md:gap-7">
        <Sign className="md:col-span-7" bg="var(--vermilion)" fg="#fff" cap="AI · Inline" val={<Languages size={46} aria-hidden="true" />} mark="Translation">
          <h3 className="land-display" style={h}>Translate without leaving the keyboard</h3>
          <p style={p}>English to Amharic and back, right where you type. No separate translator app, no copy and paste.</p>
        </Sign>
        <Sign className="md:col-span-5" bg="var(--saffron)" fg="var(--ink)" cap="Canvas · AI" val={<PenLine size={46} aria-hidden="true" />} mark="Handwriting">
          <h3 className="land-display" style={h}>Draw a letter, get the fidel</h3>
          <p style={p}>Canvas handwriting recognition for the characters you don&apos;t want to hunt for.</p>
        </Sign>
        <Sign className="md:col-span-8" bg="var(--sky)" fg="#fff" cap="Privacy" val={<ShieldCheck size={46} aria-hidden="true" />} mark="Sealed">
          <h3 className="land-display" style={{ ...h, fontSize: 'clamp(2rem, 5vw, 3.8rem)' }}>
            Your typing stays on your phone.
          </h3>
          <p style={p}>
            No keylogging, no accounts, no ads, no tracking. Translation, GIF search and voice send only what you give
            them, only when you use them. <a href="/privacy" style={{ color: 'inherit' }}>Read exactly what goes where.</a>
          </p>
        </Sign>
        <Sign className="md:col-span-4" bg="var(--enamel)" fg="var(--ink)" cap="Stickers · GIFs" val={<Smile size={46} aria-hidden="true" />} mark="Expression">
          <h3 className="land-display" style={h}>Say it with a sticker</h3>
          <p style={p}>Ethiopian collections and Giphy GIFs, inside the keyboard.</p>
        </Sign>
      </div>
    </section>
  );
}

function Themes() {
  return (
    <section style={{ background: 'var(--ground-soft)' }}>
      <div className="land-wrap" style={{ paddingBlock: 'clamp(64px, 9vw, 120px)' }}>
        <div className="flex flex-wrap items-end justify-between gap-6" style={{ marginBottom: 'clamp(32px, 5vw, 56px)' }}>
          <h2 className="land-display land-h2">
            Themes that <span style={{ color: 'var(--saffron)' }}>move</span>
          </h2>
          <p className="land-lede" style={{ maxWidth: '38ch' }}>
            Live-animated backgrounds, Ethiopian themes and club colors. Your keyboard, repainted whenever you like.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
          {THEMES.map((t, k) => (
            <div key={t.name} className="land-sign-shadow" style={{ transform: `rotate(${[-1.2, 0.8, -0.5, 1.1][k % 4]}deg)` }}>
              <div className="land-sign" style={{ padding: 10 }}>
                <div className="land-sign__art" style={{ aspectRatio: '3 / 4' }}>
                  <Image src={t.src} alt={`${t.name} theme preview`} fill sizes="(max-width: 768px) 46vw, 22vw" className="object-cover" />
                </div>
                <div className="flex items-baseline justify-between" style={{ marginTop: 8 }}>
                  <span className="land-display" style={{ fontSize: '1.05rem', }}>{t.name}</span>
                  <span
                    className="land-sign__cap"
                    style={t.tag === 'Live' ? { color: 'var(--vermilion)', fontWeight: 700 } : undefined}
                  >
                    {t.tag}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Try() {
  return (
    <section id="try" className="land-wrap" style={{ paddingBlock: 'clamp(64px, 9vw, 120px)' }}>
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-24">
        <div>
          <h2 className="land-display land-h2">
            Type a line <span style={{ color: 'var(--saffron)' }}>home</span>
          </h2>
          <p className="land-lede" style={{ marginTop: 24 }}>
            This is the real AkAI keyboard running in your browser, not a mock-up. Switch between English and
            Amharic, tap a consonant for its vowel forms, then try the themes, stickers, GIFs and AI translate tabs.
          </p>
          <ul className="land-hints">
            <li><span className="land-hints__key land-geez" aria-hidden="true">ሀ</span> Tap a consonant to see its seven vowel forms.</li>
            <li><span className="land-hints__key" aria-hidden="true">🌐</span> The globe key switches between English and አማርኛ.</li>
            <li><span className="land-hints__key" aria-hidden="true">🎨</span> The palette opens the themes, live and still.</li>
          </ul>
          <a href={APK} download={APK_FILE} className="land-btn land-btn--primary" style={{ marginTop: 32 }}>
            <Download size={20} aria-hidden="true" /> Download for Android
          </a>
          <ApkNote style={{ marginTop: 14 }} />
        </div>
        <div className="mx-auto w-full" style={{ maxWidth: 360 }}>
        <p className="land-tab" aria-hidden="true">Live · the real keyboard</p>
        <div className="land-phone" style={{ maxWidth: "calc(100vw - 32px)" }}>
          <div className="land-phone__screen">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center" style={{ color: 'var(--ink)' }}>
                  <span className="land-sign__cap">Loading keyboard…</span>
                </div>
              }
            >
              <DemoKeyboard />
            </Suspense>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

function Close() {
  return (
    <section className="land-wrap" style={{ paddingBlock: 'clamp(32px, 6vw, 80px) clamp(64px, 9vw, 120px)' }}>
      <div className="land-sign-shadow">
        <div className="land-sign" style={{ padding: 'clamp(14px, 2.4vw, 24px)', ['--s' as string]: '18px', ['--r' as string]: '6px' }}>
          <div
            className="land-sign__art flex flex-col items-start justify-between gap-10 md:flex-row md:items-end"
            style={{ background: 'var(--vermilion)', color: '#fff', padding: 'clamp(24px, 5vw, 64px)' }}
          >
            <h2 className="land-display" style={{ fontSize: 'clamp(3rem, 9vw, 7rem)', }}>
              Stop compromising.
              <br />
              Start typing.
            </h2>
            <div className="shrink-0">
              <a href={APK} download={APK_FILE} className="land-btn land-btn--primary">
                <Download size={20} aria-hidden="true" /> Download for Android
              </a>
              <ApkNote style={{ marginTop: 14, color: '#fff' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="land">
      <div className="land-ribs" aria-hidden="true" />
      <Hero />
      <Fidel />
      <Sheet />
      <Themes />
      <Try />
      <Close />
      <footer>
        <div className="land-ribs" aria-hidden="true" />
        <div className="land-wrap flex flex-wrap items-center justify-between gap-4" style={{ paddingBlock: 28 }}>
          <span className="land-display" style={{ fontSize: '1.5rem', }}>AkAI</span>
          <span style={{ color: 'var(--on-ink-dim)', fontSize: '0.9rem' }}>
            English &amp; Amharic keyboard · <a href="/privacy">Privacy policy</a> · &copy; 2026 AkAI
          </span>
        </div>
      </footer>
    </main>
  );
}
