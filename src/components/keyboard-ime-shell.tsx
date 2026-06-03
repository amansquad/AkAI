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
      playHaptic: () => void;
    };
  }
}

function isAndroidIme(): boolean {
  return typeof window !== 'undefined' && !!window.AkaiKeyboard;
}

export default function KeyboardImeShell() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Re-render after mount so isAndroidIme() can read window
    forceUpdate(n => n + 1);
    // Tell Android the page is ready
    if (window.AkaiKeyboard) {
      // Optionally signal readiness
    }
  }, []);

  // Intercept text changes from the keyboard and relay to Android IME
  const handleTextChange = useCallback((newText: string) => {
    if (!isAndroidIme()) return;
    // KeyboardApp accumulates text; we only want the *delta*
    // We track the previous value in a ref to compute the diff
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
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
    if (!kb) return; // Not inside Android IME — let normal state flow

    const prev = textRef.current;
    textRef.current = newText;

    if (newText.length > prev.length) {
      // Characters were added
      const added = newText.slice(prev.length);
      kb.commitText(added);
    } else if (newText.length < prev.length) {
      // Characters were deleted
      const deletedCount = prev.length - newText.length;
      kb.deleteSurroundingText(deletedCount);
    }
    // Reset local text to empty so the keyboard stays clean
    textRef.current = '';
  }, []);

  return (
    <KeyboardApp onTextChange={handleTextChange} />
  );
}
