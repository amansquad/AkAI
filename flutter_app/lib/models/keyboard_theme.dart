import 'package:flutter/material.dart';

enum ThemeCategory {
  solid,
  live,
  custom,
}

class KeyboardTheme {
  final String id;
  final String name;
  final String emoji;
  final ThemeCategory category;
  final Color backgroundColor;
  final Color cardColor;
  final Color keyColor;
  final Color keyHoverColor;
  final Color keyActiveColor;
  final Color keyTextColor;
  final Color specialKeyColor;
  final Color accentColor;
  final Color accentTextColor;
  final Color borderColor;
  final Color suggestionColor;
  final bool isLive;
  final String? liveAnimationClass;

  const KeyboardTheme({
    required this.id,
    required this.name,
    required this.emoji,
    required this.category,
    required this.backgroundColor,
    required this.cardColor,
    required this.keyColor,
    required this.keyHoverColor,
    required this.keyActiveColor,
    required this.keyTextColor,
    required this.specialKeyColor,
    required this.accentColor,
    required this.accentTextColor,
    required this.borderColor,
    required this.suggestionColor,
    this.isLive = false,
    this.liveAnimationClass,
  });
}

class KeyboardThemes {
  // Default Theme
  static const defaultTheme = KeyboardTheme(
    id: 'default',
    name: 'Classic',
    emoji: '⬜',
    category: ThemeCategory.solid,
    backgroundColor: Color(0xFF0A0A0A),
    cardColor: Color(0xFF1A1A1A),
    keyColor: Color(0xFF2A2A2A),
    keyHoverColor: Color(0xFF3A3A3A),
    keyActiveColor: Color(0xFF4A7BFF),
    keyTextColor: Color(0xFFFFFFFF),
    specialKeyColor: Color(0xFF252525),
    accentColor: Color(0xFF4A7BFF),
    accentTextColor: Color(0xFFFFFFFF),
    borderColor: Color(0xFF3A3A3A),
    suggestionColor: Color(0xFF353535),
  );

  // Solid Themes
  static const midnight = KeyboardTheme(
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    category: ThemeCategory.solid,
    backgroundColor: Color(0xFF020617),
    cardColor: Color(0xFF0F172A),
    keyColor: Color(0xFF1E293B),
    keyHoverColor: Color(0xFF334155),
    keyActiveColor: Color(0xFF7C3AED),
    keyTextColor: Color(0xFFF1F5F9),
    specialKeyColor: Color(0xFF334155),
    accentColor: Color(0xFF7C3AED),
    accentTextColor: Color(0xFFFFFFFF),
    borderColor: Color(0xFF334155),
    suggestionColor: Color(0xFF1E293B),
  );

  static const ocean = KeyboardTheme(
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    category: ThemeCategory.solid,
    backgroundColor: Color(0xFF164E63),
    cardColor: Color(0xFF155E75),
    keyColor: Color(0xFF0E7490),
    keyHoverColor: Color(0xFF0891B2),
    keyActiveColor: Color(0xFF14B8A6),
    keyTextColor: Color(0xFFECFEFF),
    specialKeyColor: Color(0xFF0891B2),
    accentColor: Color(0xFF14B8A6),
    accentTextColor: Color(0xFFFFFFFF),
    borderColor: Color(0xFF0891B2),
    suggestionColor: Color(0xFF0E7490),
  );

  static const sunset = KeyboardTheme(
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    category: ThemeCategory.solid,
    backgroundColor: Color(0xFF7C2D12),
    cardColor: Color(0xFF9A3412),
    keyColor: Color(0xFFC2410C),
    keyHoverColor: Color(0xFFEA580C),
    keyActiveColor: Color(0xFFF59E0B),
    keyTextColor: Color(0xFFFFF7ED),
    specialKeyColor: Color(0xFFEA580C),
    accentColor: Color(0xFFF59E0B),
    accentTextColor: Color(0xFFFFFFFF),
    borderColor: Color(0xFFEA580C),
    suggestionColor: Color(0xFFC2410C),
  );

  static const forest = KeyboardTheme(
    id: 'forest',
    name: 'Forest',
    emoji: '🌿',
    category: ThemeCategory.solid,
    backgroundColor: Color(0xFF14532D),
    cardColor: Color(0xFF166534),
    keyColor: Color(0xFF15803D),
    keyHoverColor: Color(0xFF16A34A),
    keyActiveColor: Color(0xFF10B981),
    keyTextColor: Color(0xFFF0FDF4),
    specialKeyColor: Color(0xFF16A34A),
    accentColor: Color(0xFF10B981),
    accentTextColor: Color(0xFFFFFFFF),
    borderColor: Color(0xFF16A34A),
    suggestionColor: Color(0xFF15803D),
  );

  static const rose = KeyboardTheme(
    id: 'rose',
    name: 'Rose',
    emoji: '🌹',
    category: ThemeCategory.solid,
    backgroundColor: Color(0xFF881337),
    cardColor: Color(0xFF9F1239),
    keyColor: Color(0xFFBE123C),
    keyHoverColor: Color(0xFFE11D48),
    keyActiveColor: Color(0xFFF472B6),
    keyTextColor: Color(0xFFFFF1F2),
    specialKeyColor: Color(0xFFE11D48),
    accentColor: Color(0xFFF472B6),
    accentTextColor: Color(0xFFFFFFFF),
    borderColor: Color(0xFFE11D48),
    suggestionColor: Color(0xFFBE123C),
  );

  static const candy = KeyboardTheme(
    id: 'candy',
    name: 'Candy',
    emoji: '🍬',
    category: ThemeCategory.solid,
    backgroundColor: Color(0xFF701A75),
    cardColor: Color(0xFF86198F),
    keyColor: Color(0xFFA21CAF),
    keyHoverColor: Color(0xFFC026D3),
    keyActiveColor: Color(0xFFF0ABFC),
    keyTextColor: Color(0xFFFAF5FF),
    specialKeyColor: Color(0xFFC026D3),
    accentColor: Color(0xFFF0ABFC),
    accentTextColor: Color(0xFFFFFFFF),
    borderColor: Color(0xFFC026D3),
    suggestionColor: Color(0xFFA21CAF),
  );

  static const neon = KeyboardTheme(
    id: 'neon',
    name: 'Neon',
    emoji: '💜',
    category: ThemeCategory.solid,
    backgroundColor: Color(0xFF030712),
    cardColor: Color(0xFF111827),
    keyColor: Color(0xFF1F2937),
    keyHoverColor: Color(0xFF374151),
    keyActiveColor: Color(0xFFBEF264),
    keyTextColor: Color(0xFFF9FAFB),
    specialKeyColor: Color(0xFF374151),
    accentColor: Color(0xFFBEF264),
    accentTextColor: Color(0xFF030712),
    borderColor: Color(0xFF374151),
    suggestionColor: Color(0xFF1F2937),
  );

  // Live Themes
  static const auroraLive = KeyboardTheme(
    id: 'aurora_live',
    name: 'Aurora',
    emoji: '🌌',
    category: ThemeCategory.live,
    backgroundColor: Color(0xFF020617),
    cardColor: Color(0x800F172A),
    keyColor: Color(0x901E293B),
    keyHoverColor: Color(0xFF0E7490),
    keyActiveColor: Color(0xFF22D3EE),
    keyTextColor: Color(0xFFECFEFF),
    specialKeyColor: Color(0xFF334155),
    accentColor: Color(0xFF22D3EE),
    accentTextColor: Color(0xFF030712),
    borderColor: Color(0x300891B2),
    suggestionColor: Color(0x801E293B),
    isLive: true,
    liveAnimationClass: 'aurora',
  );

  static const lavaLive = KeyboardTheme(
    id: 'lava_live',
    name: 'Lava',
    emoji: '🌋',
    category: ThemeCategory.live,
    backgroundColor: Color(0xFF7F1D1D),
    cardColor: Color(0x80991B1B),
    keyColor: Color(0x90B91C1C),
    keyHoverColor: Color(0xFFEA580C),
    keyActiveColor: Color(0xFFFB923C),
    keyTextColor: Color(0xFFFFF7ED),
    specialKeyColor: Color(0xFFDC2626),
    accentColor: Color(0xFFFB923C),
    accentTextColor: Color(0xFF7F1D1D),
    borderColor: Color(0x30EA580C),
    suggestionColor: Color(0x80B91C1C),
    isLive: true,
    liveAnimationClass: 'lava',
  );

  static const neonPulseLive = KeyboardTheme(
    id: 'neon_pulse_live',
    name: 'Neon Pulse',
    emoji: '⚡',
    category: ThemeCategory.live,
    backgroundColor: Color(0xFF030712),
    cardColor: Color(0x80111827),
    keyColor: Color(0x901F2937),
    keyHoverColor: Color(0xFF7C3AED),
    keyActiveColor: Color(0xFFA78BFA),
    keyTextColor: Color(0xFFDDD6FE),
    specialKeyColor: Color(0xFF374151),
    accentColor: Color(0xFFA78BFA),
    accentTextColor: Color(0xFF030712),
    borderColor: Color(0x307C3AED),
    suggestionColor: Color(0x801F2937),
    isLive: true,
    liveAnimationClass: 'neon-pulse',
  );

  static const matrixLive = KeyboardTheme(
    id: 'matrix_live',
    name: 'Matrix',
    emoji: '🟩',
    category: ThemeCategory.live,
    backgroundColor: Color(0xFF000000),
    cardColor: Color(0x80052E16),
    keyColor: Color(0x9014532D),
    keyHoverColor: Color(0xFF16A34A),
    keyActiveColor: Color(0xFF4ADE80),
    keyTextColor: Color(0xFFF0FDF4),
    specialKeyColor: Color(0xFF14532D),
    accentColor: Color(0xFF4ADE80),
    accentTextColor: Color(0xFF000000),
    borderColor: Color(0x3016A34A),
    suggestionColor: Color(0x8014532D),
    isLive: true,
    liveAnimationClass: 'matrix',
  );

  // All themes list
  static final List<KeyboardTheme> allThemes = [
    defaultTheme,
    midnight,
    ocean,
    sunset,
    forest,
    rose,
    candy,
    neon,
    auroraLive,
    lavaLive,
    neonPulseLive,
    matrixLive,
  ];

  static List<KeyboardTheme> get solidThemes =>
      allThemes.where((t) => t.category == ThemeCategory.solid).toList();

  static List<KeyboardTheme> get liveThemes =>
      allThemes.where((t) => t.category == ThemeCategory.live).toList();
}
