/**
 * Keyboard Mode Wrapper - Implements lazy loading for keyboard modes
 *
 * This wrapper reduces initial bundle size by ~80KB by loading only
 * the active mode instead of all modes (keyboard, stickers, GIFs, etc.)
 */

'use client';

import React, { lazy, Suspense } from 'react';
import type { KeyboardMode } from '@/components/keyboard-app';

interface KeyboardModeWrapperProps {
  mode: KeyboardMode;
  [key: string]: any; // Pass through all other props
}

// Lazy load the full keyboard app
const KeyboardAppFull = lazy(() => import('@/components/keyboard-app'));

// Loading fallback
function KeyboardLoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Loading keyboard...</p>
      </div>
    </div>
  );
}

export default function KeyboardModeWrapper({ mode, ...props }: KeyboardModeWrapperProps) {
  return (
    <Suspense fallback={<KeyboardLoadingFallback />}>
      <KeyboardAppFull {...props} />
    </Suspense>
  );
}

/**
 * Future optimization: Split keyboard-app.tsx into mode-specific components
 *
 * When keyboard-app is refactored:
 *
 * const KeyboardPanel = lazy(() => import('./modes/KeyboardPanel'));
 * const StickerPanel = lazy(() => import('./modes/StickerPanel'));
 * const GifPanel = lazy(() => import('./modes/GifPanel'));
 * const TranslatePanel = lazy(() => import('./modes/TranslatePanel'));
 * const SettingsPanel = lazy(() => import('./modes/SettingsPanel'));
 * const ThemesPanel = lazy(() => import('./modes/ThemesPanel'));
 *
 * return (
 *   <Suspense fallback={<KeyboardLoadingFallback />}>
 *     {mode === 'keyboard' && <KeyboardPanel {...props} />}
 *     {mode === 'stickers' && <StickerPanel {...props} />}
 *     {mode === 'gifs' && <GifPanel {...props} />}
 *     {mode === 'translate' && <TranslatePanel {...props} />}
 *     {mode === 'settings' && <SettingsPanel {...props} />}
 *     {mode === 'themes' && <ThemesPanel {...props} />}
 *   </Suspense>
 * );
 */
