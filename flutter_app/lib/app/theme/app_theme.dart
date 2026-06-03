import 'package:flutter/material.dart';

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
  });
}

class AkaiThemes {
  // Core themes (built-in, minimal app size)
  static const akaiObsidian = AkaiPalette(
    name: 'Obsidian',
    emoji: '🌌',
    background: Color(0xFF0A0A0F),
    surface: Color(0xFF14141C),
    surfaceVariant: Color(0xFF1E1E28),
    key: Color(0xFF2A2A38),
    keyPressed: Color(0xFF35354A),
    keySecondary: Color(0xFF1A1A24),
    keySecondaryPressed: Color(0xFF252532),
    keyAccent: Color(0xFF7C3AED),
    keyAccentPressed: Color(0xFF9B5BFF),
    keyText: Color(0xFFF5F5FA),
    keySecondaryText: Color(0xFFB8B8C8),
    accent: Color(0xFF9B5BFF),
    accentMuted: Color(0xFF6B2BD9),
    glow: Color(0xFFB97CFF),
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
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFF007AFF),
    accentMuted: Color(0xFF0055B3),
    glow: Color(0xFF7DBCFF),
  );

  static const akaiOcean = AkaiPalette(
    name: 'Ocean',
    emoji: '🌊',
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

  // Only 3 core themes built-in to minimize app size
  // Additional themes available for download from Theme Marketplace
  static const all = [
    akaiObsidian,
    akaiLight,
    akaiOcean,
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
