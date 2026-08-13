'use client';

import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';

/**
 * Live Wallpaper Loader - Dynamically loads animations on demand
 *
 * This wrapper component replaces the massive 4,719-line live-wallpaper.tsx
 * by loading only the active animation instead of all 40+ animations upfront.
 */

interface LiveWallpaperProps {
  theme: string;
  className?: string;
  static?: boolean;
}

// Animation loader - dynamically imports only the needed animation
const loadAnimation = async (theme: string) => {
  try {
    // Attempt to load specific animation module
    const module = await import(`./animations/${theme}`);
    return module.default || module;
  } catch (error) {
    // Fallback to full live-wallpaper if animation not split yet
    const { default: LiveWallpaper } = await import('./live-wallpaper');
    return LiveWallpaper;
  }
};

export default function LiveWallpaperLoader({ theme, className, static: isStatic }: LiveWallpaperProps) {
  const [Animation, setAnimation] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const AnimationComponent = await loadAnimation(theme);
        if (mounted) {
          setAnimation(() => AnimationComponent);
        }
      } catch (error) {
        console.error(`Failed to load animation for theme: ${theme}`, error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [theme]);

  if (isLoading || !Animation) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950`}>
        <div className="text-white/40 text-sm">Loading animation...</div>
      </div>
    );
  }

  return <Animation theme={theme} className={className} static={isStatic} />;
}

/**
 * Usage in keyboard-app.tsx:
 *
 * Replace:
 *   import { LiveWallpaper } from '@/components/keyboard/live-wallpaper';
 *
 * With:
 *   import LiveWallpaperLoader from '@/components/keyboard/live-wallpaper-loader';
 *
 * Then use:
 *   <LiveWallpaperLoader theme={activeTheme} />
 */
