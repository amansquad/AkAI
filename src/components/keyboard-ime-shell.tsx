'use client';

import React, { useState, useCallback, useEffect } from 'react';
import KeyboardApp from '@/components/keyboard-app';

// Detect the native Android JavascriptInterface injected by AkaiImeService
declare global {
  interface Window {
    AkaiKeyboard?: {
      commitText: (text: string) => void;
      deleteSurroundingText: (count: number) => void;
      performEnter: () => void;
      performSpace: () => void;
      // Added after 0.6.0; absent on an older host app. dir: left|right|up|down.
      moveCursor?: (dir: string) => void;
      // Opens the app's settings screen. Absent on an older host app.
      openSettings?: () => void;
      /** Strength 1–5; omitted means medium. */
      playHaptic: (level?: number) => void;
      // Added in 0.6.0; may be absent on an older host app.
      setHeight?: (cssPx: number) => void;
    };
  }
}

function isAndroidIme(): boolean {
  return typeof window !== 'undefined' && !!window.AkaiKeyboard;
}

export default function KeyboardImeShell() {
  const [, forceUpdate] = useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Tell the host how tall the keyboard actually is, and keep telling it as
  // rows come and go (the Amharic vowel family row, the symbol board). The
  // input view used to be a fixed height picked for the tallest layout, which
  // left dead space below the keys for every layout shorter than that one.
  //
  // Resizing the input view resizes this page's viewport, so a naive observer
  // can oscillate between two heights and hammer the JS bridge until the
  // render process is killed. Three things prevent that: reports are
  // coalesced to one per frame, small changes are ignored, and a burst of
  // reports backs the observer off entirely rather than spinning.
  useEffect(() => {
    const el = rootRef.current;
    // Keep the bridge object: an injected method pulled off it and called on
    // its own throws "Java bridge method can't be invoked on a non-injected
    // object", because the WebView requires the receiver to be the object it
    // injected.
    const bridge = window.AkaiKeyboard;
    if (!el || !bridge?.setHeight) return;

    // No scrollbars: one appearing and disappearing as the host resizes the
    // input view is exactly what would make the measurement oscillate.
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';

    const DEADBAND_PX = 6;
    const BURST_LIMIT = 8;
    const BURST_WINDOW_MS = 1000;
    const BACKOFF_MS = 3000;

    let lastReported = -1;
    let frame = 0;
    let recent: number[] = [];
    let mutedUntil = 0;
    let disposed = false;

    const report = () => {
      frame = 0;
      if (disposed) return;

      const now = Date.now();
      if (now < mutedUntil) return;

      recent = recent.filter(t => now - t < BURST_WINDOW_MS);
      if (recent.length >= BURST_LIMIT) {
        // The page and the host are chasing each other. Stop for a while and
        // keep whatever height the host already has.
        mutedUntil = now + BACKOFF_MS;
        recent = [];
        return;
      }

      const height = Math.ceil(el.getBoundingClientRect().height);
      if (height <= 0 || Math.abs(height - lastReported) < DEADBAND_PX) return;

      lastReported = height;
      recent.push(now);
      bridge.setHeight!(height);
    };

    const schedule = () => {
      if (frame || disposed) return;
      frame = requestAnimationFrame(report);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Re-render after mount so isAndroidIme() can read window. Can't be a
    // lazy useState initializer: `window` isn't available during SSR/static
    // prerender, so this must stay deferred to an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    forceUpdate(n => n + 1);
    // Tell Android the page is ready
    if (window.AkaiKeyboard) {
      // Optionally signal readiness
    }
  }, []);

  // The app's settings screen loads this same page with ?view=settings.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'settings') {
    return <KeyboardApp isIme={true} settingsOnly />;
  }

  return (
    <div
      ref={rootRef}
      style={{
        width: '100vw',
        // Deliberately not 100vh: the element hugs its content so the height
        // reported above is the keyboard's real height, and the host can size
        // the input view to it rather than to a fixed guess.
        overflow: 'hidden',
        background: 'transparent',
        // Hide the text preview area — only show the keyboard rows
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* 
        Wrap KeyboardApp.  When running inside the Android IME WebView all key 
        taps hit window.AkaiKeyboard.* instead of updating local state.
        When NOT running in the IME (e.g. Vercel preview) it behaves normally.
      */}
      <AndroidImeKeyboard />
    </div>
  );
}

// ---------------------------------------------------------------------------
// A self-contained keyboard that wires into window.AkaiKeyboard when available
// ---------------------------------------------------------------------------
function AndroidImeKeyboard() {
  // We render the full KeyboardApp but intercept its output via a proxy on
  // window.AkaiKeyboard so that we don't have to fork the large component.
  // The keyboard calls handleTextChange with the full accumulated string;
  // we diff it against the previous value and send only what changed.

  const textRef = React.useRef('');

  const handleTextChange = useCallback((newText: string) => {
    const kb = window.AkaiKeyboard;
    if (!kb) return;

    const prev = textRef.current;
    textRef.current = newText;
    if (prev === newText) return;

    // Diff on the common prefix rather than on length alone. Phonetic Amharic
    // rewrites the word as you type — "s" is ስ until the next key makes it ሰ —
    // so a keystroke can replace a character without changing the length at
    // all, which a length comparison would miss entirely.
    const shared = Math.min(prev.length, newText.length);
    let common = 0;
    while (common < shared && prev[common] === newText[common]) common++;

    const toDelete = prev.length - common;
    if (toDelete > 0) kb.deleteSurroundingText(toDelete);

    const toInsert = newText.slice(common);
    if (toInsert) kb.commitText(toInsert);
  }, []);

  return (
    <KeyboardApp onTextChange={handleTextChange} isIme={true} />
  );
}
