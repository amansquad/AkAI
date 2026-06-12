import 'package:flutter/material.dart';

import 'faith_themes.dart';
import 'cultural_themes.dart';



class AkaiPalette {

  final Color background;
  final Color surface;
  final Color surfaceVariant;
  final Color key;
  final Color keyPressed;
  final Color keySecondary;
  final Color keySecondaryPressed;
  final Color keyAccent;
  final Color keyAccentPressed;
  final Color keyText;
  final Color keySecondaryText;
  final Color accent;
  final Color accentMuted;
  final Color glow;
  final String name;
  final String emoji;
  final String? liveTheme;
  final String category;

  const AkaiPalette({
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.key,
    required this.keyPressed,
    required this.keySecondary,
    required this.keySecondaryPressed,
    required this.keyAccent,
    required this.keyAccentPressed,
    required this.keyText,
    required this.keySecondaryText,
    required this.accent,
    required this.accentMuted,
    required this.glow,
    required this.name,
    required this.emoji,
    this.liveTheme,
    this.category = 'solid',
  });
}


class AkaiThemes {

  // Core themes (built-in)
  static const akaiObsidian = AkaiPalette(
    name: 'Obsidian',
    emoji: '⬛',
    liveTheme: 'aurora',
    category: 'live',
    background: Color(0xA0141026),
    surface: Color(0xA01F1A33),
    surfaceVariant: Color(0xA02B2247),
    key: Color(0xA0382D5C),
    keyPressed: Color(0xA04A3C7D),
    keySecondary: Color(0xA02B2247),
    keySecondaryPressed: Color(0xA0382D5C),
    keyAccent: Color(0xFFE4A11B),
    keyAccentPressed: Color(0xFFF0B432),
    keyText: Color(0xFFF5F5FA),
    keySecondaryText: Color(0xFFB8B8C8),
    accent: Color(0xFFE4A11B),
    accentMuted: Color(0xFFC08A15),
    glow: Color(0xFFFFD700),
  );

  static const akaiLight = AkaiPalette(
    name: 'Light',
    emoji: '☁️',
    background: Color(0xFFF5F5F7),
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFEFEFF4),
    key: Color(0xFFFFFFFF),
    keyPressed: Color(0xFFE5E5EA),
    keySecondary: Color(0xFFB8B8C2),
    keySecondaryPressed: Color(0xFFA0A0AC),
    keyAccent: Color(0xFF007AFF),
    keyAccentPressed: Color(0xFF4DA3FF),
    keyText: Color(0xFF1C1C1E),
    keySecondaryText: Color(0xFF5C5C70),
    accent: Color(0xFF007AFF),
    accentMuted: Color(0xFF0055B3),
    glow: Color(0xFF7DBCFF),
  );

  static const akaiOcean = AkaiPalette(
    name: 'Ocean Wave',
    emoji: '🌊',
    liveTheme: 'ocean',
    category: 'live',
    background: Color(0xA0051428),
    surface: Color(0xA00A1F3A),
    surfaceVariant: Color(0xA0102A4A),
    key: Color(0xA01A3A5C),
    keyPressed: Color(0xA0254B70),
    keySecondary: Color(0xA00F2A48),
    keySecondaryPressed: Color(0xA01A3A60),
    keyAccent: Color(0xFF00D4FF),
    keyAccentPressed: Color(0xFF4DE5FF),
    keyText: Color(0xFFE0F2FF),
    keySecondaryText: Color(0xFFA0C8E0),
    accent: Color(0xFF00D4FF),
    accentMuted: Color(0xFF0090BB),
    glow: Color(0xFF7DEEFF),
  );

  static const akaiMint = AkaiPalette(
    name: 'Mint',
    emoji: '🍃',
    background: Color(0xFF0D1F1A),
    surface: Color(0xFF142B24),
    surfaceVariant: Color(0xFF1C372E),
    key: Color(0xFF244338),
    keyPressed: Color(0xFF2C4F42),
    keySecondary: Color(0xFF183028),
    keySecondaryPressed: Color(0xFF203C32),
    keyAccent: Color(0xFF10B981),
    keyAccentPressed: Color(0xFF34D399),
    keyText: Color(0xFFECFDF5),
    keySecondaryText: Color(0xFFA7F3D0),
    accent: Color(0xFF10B981),
    accentMuted: Color(0xFF059669),
    glow: Color(0xFF6EE7B7),
  );

  static const akaiCandy = AkaiPalette(
    name: 'Candy',
    emoji: '🍬',
    background: Color(0xFF1A0D1F),
    surface: Color(0xFF26142B),
    surfaceVariant: Color(0xFF321C37),
    key: Color(0xFF3E2443),
    keyPressed: Color(0xFF4A2C4F),
    keySecondary: Color(0xFF281830),
    keySecondaryPressed: Color(0xFF34203C),
    keyAccent: Color(0xFFEC4899),
    keyAccentPressed: Color(0xFFF472B6),
    keyText: Color(0xFFFDF2F8),
    keySecondaryText: Color(0xFFFBCFE8),
    accent: Color(0xFFEC4899),
    accentMuted: Color(0xFFDB2777),
    glow: Color(0xFFF9A8D4),
  );

  static const akaiSunset = AkaiPalette(
    name: 'Sunset Glow',
    emoji: '🌇',
    liveTheme: 'fire',
    category: 'live',
    background: Color(0xA01A0E1A),
    surface: Color(0xA0251525),
    surfaceVariant: Color(0xA02F1F2F),
    key: Color(0xA03D2D3D),
    keyPressed: Color(0xA04D3A4D),
    keySecondary: Color(0xA02A1A2A),
    keySecondaryPressed: Color(0xA0382538),
    keyAccent: Color(0xFFFF6B6B),
    keyAccentPressed: Color(0xFFFF8E8E),
    keyText: Color(0xFFFFEEEE),
    keySecondaryText: Color(0xFFD0B8C0),
    accent: Color(0xFFFF8E8E),
    accentMuted: Color(0xFFCC4A4A),
    glow: Color(0xFFFFB0B0),
  );

  static const akaiMatrix = AkaiPalette(
    name: 'Matrix',
    emoji: '🟩',
    liveTheme: 'matrix',
    category: 'live',
    background: Color(0xFF000800),     
    surface: Color(0xF0000E00),        // More opaque for top bars
    surfaceVariant: Color(0xFF001500),
    key: Color(0x66001800),            
    keyPressed: Color(0xFF00FF41),     // Bright neon green when pressed (Identical to REF)
    keySecondary: Color(0x55001000),   
    keySecondaryPressed: Color(0xFF00CC30),
    keyAccent: Color(0xFF00FF41),      
    keyAccentPressed: Color(0xFF39FF14),
    keyText: Color(0xFF00FF41),        
    keySecondaryText: Color(0xFF00C030),
    accent: Color(0xFF00FF41),         // Active highlights are green
    accentMuted: Color(0xFF00661A),
    glow: Color(0xFF00FF41),
  );

  static const akaiAurora = AkaiPalette(
    name: 'Aurora',
    emoji: '🌌',
    liveTheme: 'aurora',
    category: 'live',
    background: Color(0xA0020617),
    surface: Color(0xA00F172A),
    surfaceVariant: Color(0xA01E293B),
    key: Color(0xA0334155),
    keyPressed: Color(0xA0475569),
    keySecondary: Color(0xA01E293B),
    keySecondaryPressed: Color(0xA0334155),
    keyAccent: Color(0xFF22D3EE),
    keyAccentPressed: Color(0xFF67E8F9),
    keyText: Color(0xFFECFEFF),
    keySecondaryText: Color(0xFFA5F3FC),
    accent: Color(0xFF22D3EE),
    accentMuted: Color(0xFF0891B2),
    glow: Color(0xFF67E8F9),
  );

  static const akaiLava = AkaiPalette(
    name: 'Lava',
    emoji: '🌋',
    liveTheme: 'fire',
    category: 'live',
    background: Color(0xA07F1D1D),
    surface: Color(0xA0991B1B),
    surfaceVariant: Color(0xA0B91C1C),
    key: Color(0xA0DC2626),
    keyPressed: Color(0xA0EF4444),
    keySecondary: Color(0xA0B91C1C),
    keySecondaryPressed: Color(0xA0DC2626),
    keyAccent: Color(0xFFFB923C),
    keyAccentPressed: Color(0xFFFBBF24),
    keyText: Color(0xFFFFF7ED),
    keySecondaryText: Color(0xFFFED7AA),
    accent: Color(0xFFFB923C),
    accentMuted: Color(0xFFEA580C),
    glow: Color(0xFFFBBF24),
  );

  static const akaiNeonPulse = AkaiPalette(
    name: 'Neon Pulse',
    emoji: '⚡',
    liveTheme: 'aurora',
    category: 'live',
    background: Color(0xA0030712),
    surface: Color(0xA0111827),
    surfaceVariant: Color(0xA01F2937),
    key: Color(0xA0374151),
    keyPressed: Color(0xA04B5563),
    keySecondary: Color(0xA01F2937),
    keySecondaryPressed: Color(0xA0374151),
    keyAccent: Color(0xFFA78BFA),
    keyAccentPressed: Color(0xFFC4B5FD),
    keyText: Color(0xFFDDD6FE),
    keySecondaryText: Color(0xFFA78BFA),
    accent: Color(0xFFA78BFA),
    accentMuted: Color(0xFF7C3AED),
    glow: Color(0xFFC4B5FD),
  );

  static const akaiForest = AkaiPalette(
    name: 'Forest',
    emoji: '🌿',
    background: Color(0xFF0A1810),
    surface: Color(0xFF122518),
    surfaceVariant: Color(0xFF1A3022),
    key: Color(0xFF244030),
    keyPressed: Color(0xFF305040),
    keySecondary: Color(0xFF182A1F),
    keySecondaryPressed: Color(0xFF243828),
    keyAccent: Color(0xFF4ADE80),
    keyAccentPressed: Color(0xFF6FE89C),
    keyText: Color(0xFFE8F5EC),
    keySecondaryText: Color(0xFFA8C8B5),
    accent: Color(0xFF4ADE80),
    accentMuted: Color(0xFF2BA85B),
    glow: Color(0xFF8FE9B0),
  );

  static const akaiRose = AkaiPalette(
    name: 'Rose',
    emoji: '🌸',
    background: Color(0xFF1F0F1A),
    surface: Color(0xFF2A1825),
    surfaceVariant: Color(0xFF352030),
    key: Color(0xFF45303F),
    keyPressed: Color(0xFF553D4F),
    keySecondary: Color(0xFF2F1F2A),
    keySecondaryPressed: Color(0xFF3D2A35),
    keyAccent: Color(0xFFEC4899),
    keyAccentPressed: Color(0xFFF472B6),
    keyText: Color(0xFFFCE7F3),
    keySecondaryText: Color(0xFFD8B8C8),
    accent: Color(0xFFF472B6),
    accentMuted: Color(0xFFBD2D78),
    glow: Color(0xFFFBB6D9),
  );

  static const akaiRainbow = AkaiPalette(
    name: 'Rainbow',
    emoji: '🌈',
    liveTheme: 'rainbow',
    category: 'live',
    background: Color(0xA0030712), // gray-950
    surface: Color(0xA0111827), // gray-900/80 approximate
    surfaceVariant: Color(0xA01F2937),
    key: Color(0xA01F2937), // gray-800
    keyPressed: Color(0xA0374151), // gray-700
    keySecondary: Color(0xA0111827),
    keySecondaryPressed: Color(0xA01F2937),
    keyAccent: Color(0xFFFFFFFF),
    keyAccentPressed: Color(0xFFE5E7EB),
    keyText: Color(0xFFF9FAFB),
    keySecondaryText: Color(0xFFD1D5DB),
    accent: Color(0xFFFFFFFF),
    accentMuted: Color(0xFFD1D5DB),
    glow: Color(0xFFFFFFFF),
  );

  static const akaiFire = AkaiPalette(
    name: 'Fire',
    emoji: '🔥',
    liveTheme: 'fire',
    category: 'live',
    background: Color(0xA0450A0A), // red-950
    surface: Color(0xA07F1D1D),
    surfaceVariant: Color(0xA0991B1B),
    key: Color(0xA0991B1B),
    keyPressed: Color(0xA0B45309), // yellow-700
    keySecondary: Color(0xA0B91C1C),
    keySecondaryPressed: Color(0xA0991B1B),
    keyAccent: Color(0xFFFACC15), // yellow-400
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFEFCE8),
    keySecondaryText: Color(0xFFFEF08A),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiGalaxy = AkaiPalette(
    name: 'Galaxy',
    emoji: '🪐',
    liveTheme: 'aurora',
    category: 'live',
    background: Color(0xA03B0764), // purple-950
    surface: Color(0xA0581C87),
    surfaceVariant: Color(0xA07E22CE),
    key: Color(0xA06B21A8),
    keyPressed: Color(0xA04338CA), // indigo-700
    keySecondary: Color(0xA07E22CE),
    keySecondaryPressed: Color(0xA06B21A8),
    keyAccent: Color(0xFF818CF8), // indigo-400
    keyAccentPressed: Color(0xFFA5B4FC),
    keyText: Color(0xFFF3E8FF),
    keySecondaryText: Color(0xFFE0E7FF),
    accent: Color(0xFF818CF8),
    accentMuted: Color(0xFF6366F1),
    glow: Color(0xFFA5B4FC),
  );

  static const akaiWaterfall = AkaiPalette(
    name: 'Waterfall',
    emoji: '💧',
    liveTheme: 'ocean',
    category: 'live',
    background: Color(0xA0042F2E), // teal-950
    surface: Color(0xA0134E4A),
    surfaceVariant: Color(0xA0115E59),
    key: Color(0xA0115E59),
    keyPressed: Color(0xA00891B2), // cyan-600
    keySecondary: Color(0xA00F766E),
    keySecondaryPressed: Color(0xA0115E59),
    keyAccent: Color(0xFF67E8F9), // cyan-300
    keyAccentPressed: Color(0xFF22D3EE),
    keyText: Color(0xFFF0FDFA),
    keySecondaryText: Color(0xFFCFFAFE),
    accent: Color(0xFF67E8F9),
    accentMuted: Color(0xFF06B6D4),
    glow: Color(0xFF22D3EE),
  );

  static const akaiAutumn = AkaiPalette(
    name: 'Autumn',
    emoji: '🍂',
    liveTheme: 'fire',
    category: 'live',
    background: Color(0xA0431407), // orange-950
    surface: Color(0xA07C2D12),
    surfaceVariant: Color(0xA09A3412),
    key: Color(0xA09A3412),
    keyPressed: Color(0xA0D97706), // amber-600
    keySecondary: Color(0xA0C2410C),
    keySecondaryPressed: Color(0xA09A3412),
    keyAccent: Color(0xFFFBBF24), // amber-400
    keyAccentPressed: Color(0xFFFCD34D),
    keyText: Color(0xFFFFF7ED),
    keySecondaryText: Color(0xFFFEF3C7),
    accent: Color(0xFFFBBF24),
    accentMuted: Color(0xFFF59E0B),
    glow: Color(0xFFFCD34D),
  );

  static const akaiCyberpunk = AkaiPalette(
    name: 'Cyberpunk',
    emoji: '🤖',
    liveTheme: 'matrix',
    category: 'live',
    background: Color(0xA0030712), // gray-950
    surface: Color(0xA0111827),
    surfaceVariant: Color(0xA01F2937),
    key: Color(0xA01F2937), // gray-800
    keyPressed: Color(0xA0BE185D), // pink-700
    keySecondary: Color(0xA0374151),
    keySecondaryPressed: Color(0xA01F2937),
    keyAccent: Color(0xFFF472B6), // pink-400
    keyAccentPressed: Color(0xFFF9A8D4),
    keyText: Color(0xFFCCFBF1), // cyan-100
    keySecondaryText: Color(0xFFFBCFE8),
    accent: Color(0xFFF472B6),
    accentMuted: Color(0xFFEC4899),
    glow: Color(0xFFF9A8D4),
  );

  static const akaiSnowfall = AkaiPalette(
    name: 'Snowfall',
    emoji: '❄️',
    liveTheme: 'aurora',
    category: 'live',
    background: Color(0xA0020617), // slate-950
    surface: Color(0xA00F172A),
    surfaceVariant: Color(0xA01E293B),
    key: Color(0xA01E293B), // slate-800
    keyPressed: Color(0xA02563EB), // blue-600
    keySecondary: Color(0xA0334155), // slate-700
    keySecondaryPressed: Color(0xA01E293B),
    keyAccent: Color(0xFF93C5FD), // blue-300
    keyAccentPressed: Color(0xFFBFDBFE),
    keyText: Color(0xFFF0F9FF),
    keySecondaryText: Color(0xFFDBEAFE),
    accent: Color(0xFF93C5FD),
    accentMuted: Color(0xFF3B82F6),
    glow: Color(0xFFBFDBFE),
  );

  static const akaiBubbles = AkaiPalette(
    name: 'Bubbles',
    emoji: '🫧',
    liveTheme: 'ocean',
    category: 'live',
    background: Color(0xA0042F2E), // teal-950
    surface: Color(0xA0134E4A),
    surfaceVariant: Color(0xA0115E59),
    key: Color(0xA0115E59), // teal-800
    keyPressed: Color(0xA006B6D4), // cyan-500
    keySecondary: Color(0xA00F766E),
    keySecondaryPressed: Color(0xA0115E59),
    keyAccent: Color(0xFF67E8F9), // cyan-300
    keyAccentPressed: Color(0xFF22D3EE),
    keyText: Color(0xFFF0FDFA),
    keySecondaryText: Color(0xFFCFFAFE),
    accent: Color(0xFF67E8F9),
    accentMuted: Color(0xFF0891B2),
    glow: Color(0xFF22D3EE),
  );

  static const akaiPlasma = AkaiPalette(
    name: 'Plasma',
    emoji: '🧪',
    liveTheme: 'fire',
    category: 'live',
    background: Color(0xA04A044E), // fuchsia-950
    surface: Color(0xA0701A75),
    surfaceVariant: Color(0xA086198F),
    key: Color(0xA086198F), // fuchsia-800
    keyPressed: Color(0xA0EC4899), // pink-500
    keySecondary: Color(0xA0A21CAF),
    keySecondaryPressed: Color(0xA086198F),
    keyAccent: Color(0xFFF472B6), // pink-400
    keyAccentPressed: Color(0xFFF9A8D4),
    keyText: Color(0xFFFDF2F8),
    keySecondaryText: Color(0xFFFBCFE8),
    accent: Color(0xFFF472B6),
    accentMuted: Color(0xFFDB2777),
    glow: Color(0xFFF9A8D4),
  );

  static const akaiDeepSea = AkaiPalette(
    name: 'Deep Sea',
    emoji: '🦑',
    liveTheme: 'ocean',
    category: 'live',
    background: Color(0xA01E1B4B), // indigo-950
    surface: Color(0xA0312E81),
    surfaceVariant: Color(0xA03730A3),
    key: Color(0xA03730A3), // indigo-800
    keyPressed: Color(0xA014B8A6), // teal-500
    keySecondary: Color(0xA04338CA),
    keySecondaryPressed: Color(0xA03730A3),
    keyAccent: Color(0xFF5EEAD4), // teal-300
    keyAccentPressed: Color(0xFF99F6E4),
    keyText: Color(0xFFF0FDFA),
    keySecondaryText: Color(0xFFCCFBF1),
    accent: Color(0xFF5EEAD4),
    accentMuted: Color(0xFF0D9488),
    glow: Color(0xFF99F6E4),
  );

  // Core built-in themes + all downloadable themes
  static const all = [
    // Faith
    ...FaithPalettes.all,
    // Cultural & Teams
    ...CulturalPalettes.all,
    // Core
    akaiObsidian,
    akaiLight,
    akaiMint,
    akaiCandy,
    akaiForest,
    akaiRose,
    // Live - standard
    akaiOcean,
    akaiAurora,
    akaiMatrix,
    akaiLava,
    akaiNeonPulse,
    akaiFire,
    akaiSunset,
    akaiRainbow,
    akaiGalaxy,
    akaiWaterfall,
    akaiAutumn,
    akaiCyberpunk,
    akaiSnowfall,
    akaiBubbles,
    akaiPlasma,
    akaiDeepSea,
    // Premium Live Themes
    akaiFireflies,
    akaiBinaryRain,
    akaiGeometricFlow,
    akaiNebula,
    akaiOceanWaves,
    akaiLavaLamp,
    akaiCircuitBoard,
  ];

  static const akaiFireflies = AkaiPalette(
    name: 'Fireflies',
    emoji: '🧚',
    liveTheme: 'fireflies_live',
    background: Color(0xFF031D03),
    surface: Color(0xFF052E16),
    surfaceVariant: Color(0xFF064E3B),
    key: Color(0xFF065F46),
    keyPressed: Color(0xFF059669),
    keySecondary: Color(0xFF031D03),
    keySecondaryPressed: Color(0xFF052E16),
    keyAccent: Color(0xFFEAB308),
    keyAccentPressed: Color(0xFFFACC15),
    keyText: Color(0xFFF0FDF4),
    keySecondaryText: Color(0xFFFEF9C3),
    accent: Color(0xFFEAB308),
    accentMuted: Color(0xFF854D0E),
    glow: Color(0xFFFDE047),
  );

  static const akaiBinaryRain = AkaiPalette(
    name: 'Binary Rain',
    emoji: '🔢',
    liveTheme: 'binary_rain_live',
    background: Color(0xFF020617),
    surface: Color(0xFF0F172A),
    surfaceVariant: Color(0xFF1E293B),
    key: Color(0xFF334155),
    keyPressed: Color(0xFF475569),
    keySecondary: Color(0xFF020617),
    keySecondaryPressed: Color(0xFF0F172A),
    keyAccent: Color(0xFF22D3EE),
    keyAccentPressed: Color(0xFF67E8F9),
    keyText: Color(0xFFF8FAFC),
    keySecondaryText: Color(0xFFCFFAFE),
    accent: Color(0xFF22D3EE),
    accentMuted: Color(0xFF0891B2),
    glow: Color(0xFF67E8F9),
  );

  static const akaiGeometricFlow = AkaiPalette(
    name: 'Geometric Flow',
    emoji: '📐',
    liveTheme: 'geometric_flow_live',
    background: Color(0xFF0A0A0A),
    surface: Color(0xFF171717),
    surfaceVariant: Color(0xFF262626),
    key: Color(0xFF404040),
    keyPressed: Color(0xFF525252),
    keySecondary: Color(0xFF0A0A0A),
    keySecondaryPressed: Color(0xFF171717),
    keyAccent: Color(0xFF3B82F6),
    keyAccentPressed: Color(0xFF60A5FA),
    keyText: Color(0xFFFAFAFA),
    keySecondaryText: Color(0xFFDBEAFE),
    accent: Color(0xFF3B82F6),
    accentMuted: Color(0xFF1D4ED8),
    glow: Color(0xFF60A5FA),
  );

  static const akaiNebula = AkaiPalette(
    name: 'Nebula Space',
    emoji: '🌌',
    liveTheme: 'nebula_live',
    background: Color(0xFF1E1B4B),
    surface: Color(0xFF312E81),
    surfaceVariant: Color(0xFF3730A3),
    key: Color(0xFF4338CA),
    keyPressed: Color(0xFF4F46E5),
    keySecondary: Color(0xFF1E1B4B),
    keySecondaryPressed: Color(0xFF312E81),
    keyAccent: Color(0xFFE879F9),
    keyAccentPressed: Color(0xFFF0ABFC),
    keyText: Color(0xFFEEF2FF),
    keySecondaryText: Color(0xFFFAE8FF),
    accent: Color(0xFFE879F9),
    accentMuted: Color(0xFFC026D3),
    glow: Color(0xFFF0ABFC),
  );

  static const akaiOceanWaves = AkaiPalette(
    name: 'Ocean Waves',
    emoji: '🌊',
    liveTheme: 'ocean_waves_live',
    background: Color(0xFF083344),
    surface: Color(0xFF164E63),
    surfaceVariant: Color(0xFF155E75),
    key: Color(0xFF0E7490),
    keyPressed: Color(0xFF0891B2),
    keySecondary: Color(0xFF083344),
    keySecondaryPressed: Color(0xFF164E63),
    keyAccent: Color(0xFF14B8A6),
    keyAccentPressed: Color(0xFF5EEAD4),
    keyText: Color(0xFFECFEFF),
    keySecondaryText: Color(0xFFF0FDFA),
    accent: Color(0xFF14B8A6),
    accentMuted: Color(0xFF0D9488),
    glow: Color(0xFF5EEAD4),
  );

  static const akaiLavaLamp = AkaiPalette(
    name: 'Lava Lamp',
    emoji: '🌋',
    liveTheme: 'lava_lamp_live',
    background: Color(0xFF451A03),
    surface: Color(0xFF78350F),
    surfaceVariant: Color(0xFF92400E),
    key: Color(0xFFB45309),
    keyPressed: Color(0xFFD97706),
    keySecondary: Color(0xFF451A03),
    keySecondaryPressed: Color(0xFF78350F),
    keyAccent: Color(0xFFF87171),
    keyAccentPressed: Color(0xFFFCA5A5),
    keyText: Color(0xFFFFF7ED),
    keySecondaryText: Color(0xFFFEF2F2),
    accent: Color(0xFFF87171),
    accentMuted: Color(0xFFDC2626),
    glow: Color(0xFFFCA5A5),
  );

  static const akaiCircuitBoard = AkaiPalette(
    name: 'Circuit Board',
    emoji: '🔌',
    liveTheme: 'circuit_board_live',
    background: Color(0xFF020617),
    surface: Color(0xFF0F172A),
    surfaceVariant: Color(0xFF1E293B),
    key: Color(0xFF334155),
    keyPressed: Color(0xFF475569),
    keySecondary: Color(0xFF020617),
    keySecondaryPressed: Color(0xFF0F172A),
    keyAccent: Color(0xFF4ADE80),
    keyAccentPressed: Color(0xFF86EFAC),
    keyText: Color(0xFFF8FAFC),
    keySecondaryText: Color(0xFFF0FDF4),
    accent: Color(0xFF4ADE80),
    accentMuted: Color(0xFF16A34A),
    glow: Color(0xFF86EFAC),
  );
}

class AkaiTheme {
  static ThemeData buildTheme(AkaiPalette palette) {
    final isLight = palette.name == 'Light';
    final brightness = isLight ? Brightness.light : Brightness.dark;
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: palette.background,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: palette.accent,
        onPrimary: isLight ? Colors.white : Colors.white,
        secondary: palette.glow,
        onSecondary: isLight ? Colors.white : Colors.black,
        error: const Color(0xFFFF5252),
        onError: Colors.white,
        surface: palette.surface,
        onSurface: palette.keyText,
      ),
      textTheme: const TextTheme(
        displayLarge:
            TextStyle(fontWeight: FontWeight.w800, letterSpacing: -1.5),
        displayMedium:
            TextStyle(fontWeight: FontWeight.w800, letterSpacing: -1),
        headlineLarge:
            TextStyle(fontWeight: FontWeight.w700, letterSpacing: -0.5),
        headlineMedium: TextStyle(fontWeight: FontWeight.w700),
        titleLarge: TextStyle(fontWeight: FontWeight.w700),
        bodyLarge: TextStyle(fontWeight: FontWeight.w500),
      ),
    );
  }
}
