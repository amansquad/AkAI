import 'dart:io';
import 'dart:convert';
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
  final String id;
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
    required this.id,
    required this.emoji,
    this.liveTheme,
    this.category = 'solid',
  });

  static Future<AkaiPalette?> loadFromFile(File file, String themeId) async {
    if (!await file.exists()) {
      // Fallback: check if it's a native theme
      try {
        final native = CulturalPalettes.all.firstWhere((t) => t.id == themeId);
        return native;
      } catch (_) {
        try {
          final native = FaithPalettes.all.firstWhere((t) => t.id == themeId);
          return native;
        } catch (_) {}
      }
      return null;
    }
    
    final String contents = await file.readAsString();
    final Map<String, dynamic> json = jsonDecode(contents);
    
    return _parseThemeFromJson(json);
  }

  static AkaiPalette _parseThemeFromJson(Map<String, dynamic> json) {
    return AkaiPalette(
      name: json['name'] as String,
      id: json['id'] as String? ?? (json['name'] as String).toLowerCase().replaceAll(' ', '-'),
      emoji: json['emoji'] as String,
      background: Color(json['background'] as int),
      surface: Color(json['surface'] as int),
      surfaceVariant: Color(json['surfaceVariant'] as int),
      key: Color(json['key'] as int),
      keyPressed: Color(json['keyPressed'] as int),
      keySecondary: Color(json['keySecondary'] as int),
      keySecondaryPressed: Color(json['keySecondaryPressed'] as int),
      keyAccent: Color(json['keyAccent'] as int),
      keyAccentPressed: Color(json['keyAccentPressed'] as int),
      keyText: Color(json['keyText'] as int),
      keySecondaryText: Color(json['keySecondaryText'] as int),
      accent: Color(json['accent'] as int),
      accentMuted: Color(json['accentMuted'] as int),
      glow: Color(json['glow'] as int),
      liveTheme: json['liveTheme'] as String?,
      category: json['category'] as String? ?? 'solid',
    );
  }
}


class AkaiThemes {

  // Core themes (built-in)
  static const akaiObsidian = AkaiPalette(
    name: 'Obsidian',
    id: 'obsidian',
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
    id: 'light',
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
    id: 'ocean-wave',
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
    id: 'mint',
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
    id: 'candy',
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
    id: 'sunset-glow',
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

  // Matches public/themes/matrix.json (the web theme) so the bundled
  // fallback and a downloaded copy of this theme render identically.
  static const akaiMatrix = AkaiPalette(
    name: 'Matrix',
    id: 'matrix',
    emoji: '🟩',
    liveTheme: 'matrix',
    category: 'live',
    background: Color(0xFF000000),
    surface: Color(0xFF000D00),
    surfaceVariant: Color(0xFF001A00),
    key: Color(0x66002900),
    keyPressed: Color(0xFF003600),
    keySecondary: Color(0x55001000),
    keySecondaryPressed: Color(0xFF001E00),
    keyAccent: Color(0xFF004000),
    keyAccentPressed: Color(0xFF004D00),
    keyText: Color(0xFF00FF41),
    keySecondaryText: Color(0xFF00B30A),
    accent: Color(0xFF004000),
    accentMuted: Color(0xFF003000),
    glow: Color(0xFF004D00),
  );

  static const akaiAurora = AkaiPalette(
    name: 'Aurora',
    id: 'aurora',
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
    id: 'lava',
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
    id: 'neon-pulse',
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
    id: 'forest',
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
    id: 'rose',
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
    id: 'rainbow',
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
    id: 'fire',
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
    id: 'galaxy',
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
    id: 'waterfall',
    emoji: '💧',
    liveTheme: 'aurora',
    category: 'live',
    background: Color(0xA0020617), // slate-950
    surface: Color(0xA00F172A),
    surfaceVariant: Color(0xA01E293B),
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
    id: 'autumn',
    emoji: '🍂',
    liveTheme: 'aurora',
    category: 'live',
    background: Color(0xA0020617),
    surface: Color(0xA00F172A),
    surfaceVariant: Color(0xA01E293B),
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
    id: 'cyberpunk',
    emoji: '🤖',
    liveTheme: 'cyberpunk',
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
    id: 'snowfall',
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
    id: 'bubbles',
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
    id: 'plasma',
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
    id: 'deep-sea',
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
  static final List<AkaiPalette> all = [
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
    akaiPrism,
    // Premium Live Themes
    akaiFireflies,
    akaiBinaryRain,
    akaiGeometricFlow,
    akaiNebula,
    akaiOceanWaves,
    akaiLavaLamp,
    akaiCircuitBoard,
    // Scene Live Themes
    akaiStarfield,
    akaiMeteorShower,
    akaiFireworks,
    akaiCityLights,
    akaiZenPond,
    akaiGlitch,
  ];

  static const akaiPrism = AkaiPalette(
    name: 'Prism Flow',
    id: 'prism',
    emoji: '🔮',
    liveTheme: 'prism_live',
    category: 'live',
    background: Color(0xFF0B0A1A),
    surface: Color(0xFF150F24),
    surfaceVariant: Color(0xFF1C1430),
    key: Color(0xFF1C1430),
    keyPressed: Color(0xFF2A1F45),
    keySecondary: Color(0xFF241A3A),
    keySecondaryPressed: Color(0xFF2E2248),
    keyAccent: Color(0xFFE879F9),
    keyAccentPressed: Color(0xFFF0ABFC),
    keyText: Color(0xFFF5F3FF),
    keySecondaryText: Color(0xFFE9D5FF),
    accent: Color(0xFFE879F9),
    accentMuted: Color(0xFFA855F7),
    glow: Color(0xFFF0ABFC),
  );

  static const akaiFireflies = AkaiPalette(
    name: 'Fireflies',
    id: 'fireflies',
    emoji: '🧚',
    liveTheme: 'fireflies_live',
    category: 'live',
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
    id: 'binary-rain',
    emoji: '🔢',
    liveTheme: 'binary_rain_live',
    category: 'live',
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
    id: 'geometric-flow',
    emoji: '📐',
    liveTheme: 'geometric_flow_live',
    category: 'live',
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
    id: 'nebula',
    emoji: '🌌',
    liveTheme: 'nebula_live',
    category: 'live',
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
    id: 'ocean-waves',
    emoji: '🌊',
    liveTheme: 'ocean_waves_live',
    category: 'live',
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
    id: 'lava-lamp',
    emoji: '🌋',
    liveTheme: 'lava_lamp_live',
    category: 'live',
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
    id: 'circuit-board',
    emoji: '🔌',
    liveTheme: 'circuit_board_live',
    category: 'live',
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

  static const akaiStarfield = AkaiPalette(
    name: 'Starfield',
    id: 'starfield',
    emoji: '🚀',
    liveTheme: 'starfield_live',
    category: 'live',
    background: Color(0xFF05070F),
    surface: Color(0xFF0B1020),
    surfaceVariant: Color(0xFF141B33),
    key: Color(0xFF1C2542),
    keyPressed: Color(0xFF2A3763),
    keySecondary: Color(0xFF0B1020),
    keySecondaryPressed: Color(0xFF141B33),
    keyAccent: Color(0xFF7DD3FC),
    keyAccentPressed: Color(0xFFBAE6FD),
    keyText: Color(0xFFF0F9FF),
    keySecondaryText: Color(0xFFBFDBFE),
    accent: Color(0xFF7DD3FC),
    accentMuted: Color(0xFF0EA5E9),
    glow: Color(0xFFBAE6FD),
  );

  static const akaiMeteorShower = AkaiPalette(
    name: 'Meteor Shower',
    id: 'meteor-shower',
    emoji: '☄️',
    liveTheme: 'meteor_live',
    category: 'live',
    background: Color(0xFF080D1F),
    surface: Color(0xFF101830),
    surfaceVariant: Color(0xFF1B2647),
    key: Color(0xFF25335E),
    keyPressed: Color(0xFF334577),
    keySecondary: Color(0xFF101830),
    keySecondaryPressed: Color(0xFF1B2647),
    keyAccent: Color(0xFFFBBF24),
    keyAccentPressed: Color(0xFFFDE68A),
    keyText: Color(0xFFF8FAFC),
    keySecondaryText: Color(0xFFFEF3C7),
    accent: Color(0xFFFBBF24),
    accentMuted: Color(0xFFD97706),
    glow: Color(0xFFFDE68A),
  );

  static const akaiFireworks = AkaiPalette(
    name: 'Fireworks',
    id: 'fireworks',
    emoji: '🎆',
    liveTheme: 'fireworks_live',
    category: 'live',
    background: Color(0xFF0B0614),
    surface: Color(0xFF1A0F2E),
    surfaceVariant: Color(0xFF261745),
    key: Color(0xFF33205C),
    keyPressed: Color(0xFF452D78),
    keySecondary: Color(0xFF1A0F2E),
    keySecondaryPressed: Color(0xFF261745),
    keyAccent: Color(0xFFF472B6),
    keyAccentPressed: Color(0xFFF9A8D4),
    keyText: Color(0xFFFDF4FF),
    keySecondaryText: Color(0xFFFBCFE8),
    accent: Color(0xFFF472B6),
    accentMuted: Color(0xFFDB2777),
    glow: Color(0xFFF9A8D4),
  );

  static const akaiCityLights = AkaiPalette(
    name: 'City Lights',
    id: 'city-lights',
    emoji: '🌃',
    liveTheme: 'bokeh_live',
    category: 'live',
    background: Color(0xFF140D08),
    surface: Color(0xFF241811),
    surfaceVariant: Color(0xFF33231A),
    key: Color(0xFF453023),
    keyPressed: Color(0xFF5C4130),
    keySecondary: Color(0xFF241811),
    keySecondaryPressed: Color(0xFF33231A),
    keyAccent: Color(0xFFF59E0B),
    keyAccentPressed: Color(0xFFFBBF24),
    keyText: Color(0xFFFFF7ED),
    keySecondaryText: Color(0xFFFED7AA),
    accent: Color(0xFFF59E0B),
    accentMuted: Color(0xFFB45309),
    glow: Color(0xFFFCD34D),
  );

  static const akaiZenPond = AkaiPalette(
    name: 'Zen Pond',
    id: 'zen-pond',
    emoji: '🪷',
    liveTheme: 'ripples_live',
    category: 'live',
    background: Color(0xFF03201D),
    surface: Color(0xFF06302C),
    surfaceVariant: Color(0xFF0B453F),
    key: Color(0xFF115E54),
    keyPressed: Color(0xFF17766A),
    keySecondary: Color(0xFF06302C),
    keySecondaryPressed: Color(0xFF0B453F),
    keyAccent: Color(0xFF34D399),
    keyAccentPressed: Color(0xFF6EE7B7),
    keyText: Color(0xFFECFDF5),
    keySecondaryText: Color(0xFFA7F3D0),
    accent: Color(0xFF34D399),
    accentMuted: Color(0xFF059669),
    glow: Color(0xFF6EE7B7),
  );

  static const akaiGlitch = AkaiPalette(
    name: 'Glitch',
    id: 'glitch',
    emoji: '📺',
    liveTheme: 'glitch_live',
    category: 'live',
    background: Color(0xFF0A0A0A),
    surface: Color(0xFF161616),
    surfaceVariant: Color(0xFF222222),
    key: Color(0xFF2E2E2E),
    keyPressed: Color(0xFF444444),
    keySecondary: Color(0xFF161616),
    keySecondaryPressed: Color(0xFF222222),
    keyAccent: Color(0xFFFF2E63),
    keyAccentPressed: Color(0xFFFF7396),
    keyText: Color(0xFFF5F5F5),
    keySecondaryText: Color(0xFF99F6E4),
    accent: Color(0xFFFF2E63),
    accentMuted: Color(0xFFBE123C),
    glow: Color(0xFF22D3EE),
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
