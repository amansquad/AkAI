// Theme loader utility - dynamically loads themes on demand
import type { ThemeDef } from './keyboard-data';

// Essential themes loaded immediately (< 10KB)
const ESSENTIAL_THEMES = ['default', 'midnight', 'aurora_live', 'emerald_live'];

// Theme index for lazy loading
const THEME_CATEGORIES = {
  solid: ['default', 'midnight', 'charcoal', 'slate', 'graphite', 'sapphire', 'coral', 'jade', 'ruby', 'amethyst'],
  live: ['aurora_live', 'lava_live', 'ocean_live', 'neon_pulse_live', 'sunset_live', 'matrix_live', 'rainbow_live', 'fire_live', 'galaxy_live', 'waterfall_live', 'autumn_live', 'cyberpunk_live', 'snowfall_live', 'bubbles_live', 'plasma_live', 'deep_sea_live', 'crystal_live', 'storm_live', 'cherry_blossom_live', 'stardust_live', 'vortex_live', 'northern_lights_live', 'fireflies_live', 'binary_rain_live', 'geometric_flow_live', 'nebula_live', 'cosmic_dust_live', 'electric_storm_live', 'coral_reef_live', 'volcano_live', 'moonlight_live', 'jungle_mist_live', 'desert_sunset_live', 'frozen_lake_live', 'sakura_wind_live', 'dragon_fire_live', 'emerald_cave_live', 'aurora_borealis_live', 'mystic_forest_live', 'solar_flare_live', 'midnight_ocean_live', 'purple_haze_live', 'golden_hour_live', 'neon_city_live', 'tropical_storm_live'],
  cultural: ['addis_ababa', 'injera_mesob', 'coffee_ceremony', 'timkat_celebration', 'lucy_fossil', 'lalibela_rock', 'simien_mountains'],
  faith: ['cross_orthodox', 'mosque_green', 'meditation_om', 'star_david'],
  football: ['fb_arsenal', 'fb_chelsea', 'fb_liverpool', 'fb_mancity', 'fb_manunited', 'fb_tottenham', 'fb_barcelona', 'fb_realmadrid', 'fb_bayern', 'fb_psg', 'fb_dortmund', 'fb_juventus', 'fb_inter', 'fb_milan', 'fb_monaco', 'fb_leipzig'],
};

// Cache for loaded themes
const themeCache = new Map<string, ThemeDef>();

/**
 * Get theme - loads on demand if not in cache
 */
export async function getTheme(themeName: string): Promise<ThemeDef | null> {
  // Check cache first
  if (themeCache.has(themeName)) {
    return themeCache.get(themeName)!;
  }

  try {
    // Load all themes (will be tree-shaken if not used)
    const { THEMES } = await import('./keyboard-data');
    const theme = THEMES[themeName];

    if (theme) {
      themeCache.set(themeName, theme);
      return theme;
    }

    return null;
  } catch (error) {
    console.error(`Failed to load theme: ${themeName}`, error);
    return null;
  }
}

/**
 * Get themes by category - loads only what's needed
 */
export async function getThemesByCategory(category: keyof typeof THEME_CATEGORIES): Promise<Record<string, ThemeDef>> {
  const themeNames = THEME_CATEGORIES[category];
  const { THEMES } = await import('./keyboard-data');

  const themes: Record<string, ThemeDef> = {};
  for (const name of themeNames) {
    if (THEMES[name]) {
      themes[name] = THEMES[name];
      themeCache.set(name, THEMES[name]);
    }
  }

  return themes;
}

/**
 * Get all available theme names (lightweight)
 */
export function getAllThemeNames(): string[] {
  return Object.values(THEME_CATEGORIES).flat();
}

/**
 * Preload essential themes (called on app init)
 */
export async function preloadEssentialThemes(): Promise<void> {
  const { THEMES } = await import('./keyboard-data');
  ESSENTIAL_THEMES.forEach(name => {
    if (THEMES[name]) {
      themeCache.set(name, THEMES[name]);
    }
  });
}

/**
 * Get theme category
 */
export function getThemeCategory(themeName: string): string | null {
  for (const [category, themes] of Object.entries(THEME_CATEGORIES)) {
    if (themes.includes(themeName)) {
      return category;
    }
  }
  return null;
}
