import 'package:flutter/material.dart';

import 'faith_themes.dart';



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
  });
}


class AkaiThemes {

  // Core themes (built-in)
  static const akaiObsidian = AkaiPalette(
    name: 'Obsidian',
    emoji: '🌌',
    liveTheme: 'aurora',
    background: Color(0xFF141026),
    surface: Color(0xFF1F1A33),
    surfaceVariant: Color(0xFF2B2247),
    key: Color(0xFF382D5C),
    keyPressed: Color(0xFF4A3C7D),
    keySecondary: Color(0xFF2B2247),
    keySecondaryPressed: Color(0xFF382D5C),
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
    name: 'Ocean',
    emoji: '🌊',
    liveTheme: 'ocean',
    background: Color(0xFF051428),
    surface: Color(0xFF0A1F3A),
    surfaceVariant: Color(0xFF102A4A),
    key: Color(0xFF1A3A5C),
    keyPressed: Color(0xFF254B70),
    keySecondary: Color(0xFF0F2A48),
    keySecondaryPressed: Color(0xFF1A3A60),
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
    name: 'Sunset',
    emoji: '🌅',
    liveTheme: 'fire',
    background: Color(0xFF1A0E1A),
    surface: Color(0xFF251525),
    surfaceVariant: Color(0xFF2F1F2F),
    key: Color(0xFF3D2D3D),
    keyPressed: Color(0xFF4D3A4D),
    keySecondary: Color(0xFF2A1A2A),
    keySecondaryPressed: Color(0xFF382538),
    keyAccent: Color(0xFFFF6B6B),
    keyAccentPressed: Color(0xFFFF8E8E),
    keyText: Color(0xFFFFEEEE),
    keySecondaryText: Color(0xFFD0B8C0),
    accent: Color(0xFFFF8E8E),
    accentMuted: Color(0xFFCC4A4A),
    glow: Color(0xFFFFB0B0),
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

  // 8 built-in themes (minimal size)
  // 20+ more themes available for download from Theme Marketplace
  static const all = [
    ...FaithPalettes.all,
    akaiObsidian,

    akaiLight,
    akaiOcean,
    akaiMint,
    akaiCandy,
    akaiSunset,
    akaiForest,
    akaiRose,
  ];
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
