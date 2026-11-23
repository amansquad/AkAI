// Generates ThemeData.kt from the Flutter app's palettes, so the native
// keyboard offers exactly the same themes in the same order.
// Run from the repo root:  node native_keyboard/tools/gen-themes.mjs
import fs from 'node:fs';

const dir = 'flutter_app/lib/app/theme/';
const files = ['app_theme.dart', 'cultural_themes.dart', 'faith_themes.dart'];

const COLORS = [
  'background', 'surface', 'surfaceVariant', 'key', 'keyPressed', 'keySecondary',
  'keySecondaryPressed', 'keyAccent', 'keyAccentPressed', 'keyText', 'keySecondaryText',
  'accent', 'accentMuted', 'glow',
];

const q = (s) => JSON.stringify(s).split('$').join('\\$');

// The faith palettes carry no category of their own; without this they were
// filed as "solid" and the Faith filter came up empty.
const DEFAULT_CATEGORY = { 'faith_themes.dart': 'faith' };

// Native-only adjustments. Matrix: Flutter's keys are 40% opaque over a dense
// rain, which makes the letters hard to read; these are about 85% opaque.
const OVERRIDES = {
  matrix: { key: 'DA002900', keySecondary: 'D0001000' },
  // In Flutter both of these use "ortho_maryam"; the web gives each its own,
  // so do the same: the ornate cross, and the Maryam icon picture.
  faith_orthodox: { live: 'ortho_cross' },
  faith_maryam: { live: '/faith/maryam' },
  // Flutter gives sixteen live themes only three animations between them
  // (aurora, fire, ocean), so Snowfall looked exactly like Aurora. Each gets a
  // scene of its own: the first four already existed, the rest are in
  // MoreLiveScenes.kt.
  snowfall: { live: 'snow' },
  autumn: { live: 'autumn' },
  'neon-pulse': { live: 'neon_pulse' },
  'sunset-glow': { live: 'solar' },
  galaxy: { live: 'galaxy_spiral' },
  obsidian: { live: 'obsidian_live' },
  waterfall: { live: 'waterfall_live' },
  lava: { live: 'magma_live' },
  plasma: { live: 'plasma_live' },
  bubbles: { live: 'bubbles_live' },
  'deep-sea': { live: 'deep_sea_live' },
  // Nebula's bright, solid keys hid almost all of its scene; at about 80% (as
  // the cultural scene themes) the nebula shows through and letters stay clear.
  nebula: { key: 'CC4338CA', keySecondary: 'CC1E1B4B' },
  // nebula_live and ocean_waves_live are Flutter's own names; they now have
  // scenes in MoreLiveScenes instead of falling into aurora and ocean.
};

/** Palettes in the order the Flutter app lists them (its `all` lists). */
const out = [];
const seen = new Set();

for (const f of files) {
  const src = fs.readFileSync(dir + f, 'utf8');

  // static const akaiX = AkaiPalette( ... );
  const defs = new Map();
  const re = /static const (\w+) = AkaiPalette\(([\s\S]*?)\n\s*\);/g;
  let m;
  while ((m = re.exec(src))) {
    const body = m[2];
    const str = (k) => (new RegExp(`\\b${k}:\\s*'([^']*)'`).exec(body) || [])[1];
    const p = {
      name: str('name'),
      id: str('id'),
      emoji: str('emoji'),
      live: str('liveTheme') ?? '',
      category: str('category') ?? DEFAULT_CATEGORY[f] ?? 'solid',
    };
    for (const c of COLORS) {
      const cm = new RegExp(`\\b${c}:\\s*Color\\(0x([0-9A-Fa-f]{8})\\)`).exec(body);
      if (!cm) throw new Error(`${f} ${m[1]} is missing ${c}`);
      p[c] = cm[1].toUpperCase();
    }
    Object.assign(p, OVERRIDES[p.id] ?? {});
    defs.set(m[1], p);
  }

  // The `all` list names the ones that are actually offered, and their order.
  const listM = /static final List<AkaiPalette> all = \[([\s\S]*?)\];/.exec(src);
  const names = listM ? [...listM[1].matchAll(/\b(\w+)\b/g)].map(x => x[1]).filter(n => defs.has(n)) : [...defs.keys()];
  for (const n of names) {
    const p = defs.get(n);
    // The same id can appear twice across files; the first one wins.
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
}

// Native-only faith themes: a photo of a church, mosque or saint's icon from
// public/faith (bundled by gen-backdrops.mjs) with a verse over it, Amharic
// for the Christian ones and Arabic for the Islamic ones (FaithQuotes.kt).
// The colours follow the faith palettes above: gold on purple for icons, gold
// on warm stone for rock and stone churches, gold on navy, and Islamic green.
const PALETTES = {
  icon: ['1B0F2E', '2A1A44', '3B2B5A', '4B356F', '5A447E', '2F1B4D', '3B275F', 'DAA520', 'E0C060', 'F6F0FF', 'CBB9E5', 'DAA520', 'B8860B', 'FFD36B'],
  stone: ['1C130B', '2B1D10', '3D2A17', '4A3320', '5C4129', '2E2013', '3B2918', 'DAA520', 'E0C060', 'FFF8EC', 'E8D3B0', 'DAA520', 'B8860B', 'FFD36B'],
  navy: ['0F172A', '1E293B', '334155', '1E3A8A', '1E40AF', '0F172A', '1E293B', 'FACC15', 'FDE047', 'FFFFFF', 'A5F3FC', 'FACC15', 'EAB308', 'FDE047'],
  night: ['020617', '0F172A', '1E293B', '1E293B', '334155', '020617', '0F172A', 'FACC15', 'FDE047', 'FFFFFF', 'FDE047', 'FACC15', 'EAB308', 'FDE047'],
  green: ['064E3B', '065F46', '047857', '059669', '10B981', '064E3B', '065F46', '34D399', '6EE7B7', 'ECFDF5', 'A7F3D0', '34D399', '059669', '6EE7B7'],
};
const NATIVE_FAITH = [
  ['faith_lalibela', 'Bete Giyorgis', '⛪', 'stone'],
  ['faith_debre_berhan', 'Debre Berhan Selassie', '👼', 'icon'],
  ['faith_trinity', 'Holy Trinity Cathedral', '⛪', 'navy'],
  ['faith_zion', 'St Mary of Zion', '✝️', 'stone'],
  ['faith_giorgis', 'Kidus Giorgis', '🐎', 'icon'],
  ['faith_abo', 'Abune Gebre Menfes Kidus', '🦁', 'icon'],
  // Protestant
  ['faith_mekane_yesus', 'Mekane Yesus', '⛪', 'navy'],
  ['faith_wittenberg', 'Wittenberg Castle Church', '📖', 'night'],
  ['faith_cross', 'The Cross at Dawn', '✝️', 'stone'],
  // Catholic
  ['faith_nativity_addis', 'Nativity Cathedral, Addis', '⛪', 'icon'],
  ['faith_st_peter', "St Peter's Basilica", '⛪', 'navy'],
  ['faith_creation', 'The Creation of Adam', '🎨', 'stone'],
  // Islamic
  ['faith_kaaba', 'The Kaaba', '🕋', 'night'],
  ['faith_nabawi', "The Prophet's Mosque", '🕌', 'green'],
  ['faith_anwar', 'Anwar Mosque', '🕌', 'green'],
  ['faith_negash', 'Negash Mosque', '🕌', 'green'],
  ['faith_jamia_harar', 'Jamia Mosque, Harar', '🕌', 'navy'],
];
for (const [id, name, emoji, pal] of NATIVE_FAITH) {
  if (seen.has(id)) continue;
  seen.add(id);
  const p = { id, name, emoji, category: 'faith', live: '/faith/' + id.replace(/^faith_/, '') };
  COLORS.forEach((c, i) => { p[c] = 'FF' + PALETTES[pal][i]; });
  // After the last faith theme, so the Faith filter lists them together.
  const lastFaith = out.map(x => x.category).lastIndexOf('faith');
  out.splice(lastFaith + 1, 0, p);
}

const hex = (h) => `0x${h}.toInt()`;
const rows = out.map(p =>
  `        PaletteDef(${q(p.id)}, ${q(p.name)}, ${q(p.emoji)}, ${q(p.category)}, ${q(p.live)},\n` +
  `            ${COLORS.map(c => hex(p[c])).join(', ')})`).join(',\n');

fs.writeFileSync('native_keyboard/app/src/main/java/com/akai/nativekb/ThemeData.kt',
`// GENERATED by tools/gen-themes.mjs from the Flutter app's palettes. Do not edit by hand.
package com.akai.nativekb

/** One theme: the same 14 colours the Flutter app uses, in the same order. */
class PaletteDef(
    val id: String, val name: String, val emoji: String,
    /** solid, live, cultural, faith. */
    val category: String,
    /** Which animated background it has, or empty for none. */
    val live: String,
    val background: Int, val surface: Int, val surfaceVariant: Int,
    val key: Int, val keyPressed: Int,
    val keySecondary: Int, val keySecondaryPressed: Int,
    val keyAccent: Int, val keyAccentPressed: Int,
    val keyText: Int, val keySecondaryText: Int,
    val accent: Int, val accentMuted: Int, val glow: Int,
)

object ThemeData {
    val all: List<PaletteDef> = listOf(
${rows}
    )
}
`);
console.log(`wrote ThemeData.kt with ${out.length} themes:`, out.map(p => p.id).join(', '));
