/**
 * CSS Loader - Dynamically loads CSS for live themes
 *
 * This utility lazy loads the live-themes.css file only when
 * a user selects a live theme, reducing initial CSS bundle by ~50KB
 */

let liveThemesLoaded = false;

export async function loadLiveThemeCSS(): Promise<void> {
  // Only load once
  if (liveThemesLoaded) {
    return;
  }

  try {
    // Dynamically import the CSS file
    await import('@/app/live-themes.css');
    liveThemesLoaded = true;
    console.log('✓ Live theme animations loaded');
  } catch (error) {
    console.error('Failed to load live theme CSS:', error);
  }
}

/**
 * Check if a theme requires live animations
 */
export function isLiveTheme(themeName: string): boolean {
  return themeName.includes('_live') ||
         themeName.includes('live') ||
         ['aurora', 'lava', 'ocean', 'galaxy', 'neon', 'matrix', 'fire', 'rainbow'].some(
           name => themeName.toLowerCase().includes(name)
         );
}

/**
 * Preload live theme CSS on user intent
 * Call this when user hovers over themes panel or opens theme selector
 */
export function preloadLiveThemeCSS(): void {
  if (!liveThemesLoaded) {
    // Preload the CSS file without blocking
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/live-themes.css';
    link.as = 'style';
    document.head.appendChild(link);
  }
}

/**
 * Usage in keyboard-app or theme selector:
 *
 * import { loadLiveThemeCSS, isLiveTheme, preloadLiveThemeCSS } from '@/lib/css-loader';
 *
 * // When user selects a theme:
 * const handleThemeChange = async (themeName: string) => {
 *   if (isLiveTheme(themeName)) {
 *     await loadLiveThemeCSS();
 *   }
 *   setActiveTheme(themeName);
 * };
 *
 * // On theme selector open:
 * const handleThemeSelectorOpen = () => {
 *   preloadLiveThemeCSS(); // Start preloading
 * };
 */
