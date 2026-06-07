import 'package:flutter/material.dart';

import 'app_theme.dart' show AkaiPalette;

/// Adds built-in "live" faith/culture themed palettes so users can apply them
/// without downloading marketplace themes.
///
/// Note: These are simple palettes; you can refine colors later.
class FaithPalettes {
  static const akaiEthiopianOrthodox = AkaiPalette(
    name: 'Ethiopian Orthodox',
    emoji: '✝️',
    liveTheme: 'matrix',
    background: Color(0xFF1B0F2E),
    surface: Color(0xFF2A1A44),
    surfaceVariant: Color(0xFF3B2B5A),
    key: Color(0xFF4B356F),
    keyPressed: Color(0xFF5A447E),
    keySecondary: Color(0xFF2F1B4D),
    keySecondaryPressed: Color(0xFF3B275F),
    keyAccent: Color(0xFFDAA520),
    keyAccentPressed: Color(0xFFE0C060),
    keyText: Color(0xFFF6F0FF),
    keySecondaryText: Color(0xFFCBB9E5),
    accent: Color(0xFFDAA520),
    accentMuted: Color(0xFFB8860B),
    glow: Color(0xFFFFD36B),
  );

  static const akaiCopticSun = AkaiPalette(
    name: 'Coptic Sun',
    emoji: '☀️',
    background: Color(0xFF1A1206),
    surface: Color(0xFF2A1D0C),
    surfaceVariant: Color(0xFF3A2A12),
    key: Color(0xFF4A3518),
    keyPressed: Color(0xFF593F1F),
    keySecondary: Color(0xFF332312),
    keySecondaryPressed: Color(0xFF46301B),
    keyAccent: Color(0xFFFFA000),
    keyAccentPressed: Color(0xFFFFC266),
    keyText: Color(0xFFFFF5E8),
    keySecondaryText: Color(0xFFFFD9B0),
    accent: Color(0xFFFFA000),
    accentMuted: Color(0xFFCC7A00),
    glow: Color(0xFFFFD27D),
  );

  static const akaiIslamicGreen = AkaiPalette(
    name: 'Islamic Green',
    emoji: '🕌',
    background: Color(0xFF061B16),
    surface: Color(0xFF0B2B22),
    surfaceVariant: Color(0xFF114136),
    key: Color(0xFF173F32),
    keyPressed: Color(0xFF214F3F),
    keySecondary: Color(0xFF0E2A20),
    keySecondaryPressed: Color(0xFF16352A),
    keyAccent: Color(0xFF1B8F6A),
    keyAccentPressed: Color(0xFF3BCB9C),
    keyText: Color(0xFFEFFBF6),
    keySecondaryText: Color(0xFFBFE8D8),
    accent: Color(0xFF3BCB9C),
    accentMuted: Color(0xFF1B8F6A),
    glow: Color(0xFF6EF2C5),
  );

  static const akaiQuranBlue = AkaiPalette(
    name: 'Quran Blue',
    emoji: '📖',
    background: Color(0xFF061326),
    surface: Color(0xFF0A2143),
    surfaceVariant: Color(0xFF123258),
    key: Color(0xFF1B3D6A),
    keyPressed: Color(0xFF275084),
    keySecondary: Color(0xFF0E2A50),
    keySecondaryPressed: Color(0xFF17365F),
    keyAccent: Color(0xFF4DA3FF),
    keyAccentPressed: Color(0xFF7DC2FF),
    keyText: Color(0xFFEAF4FF),
    keySecondaryText: Color(0xFFC6DEFF),
    accent: Color(0xFF4DA3FF),
    accentMuted: Color(0xFF1F7FD8),
    glow: Color(0xFF8CD3FF),
  );

  static const akaiSaintsGold = AkaiPalette(
    name: 'Saints Gold',
    emoji: '🙏',
    background: Color(0xFF1F1406),
    surface: Color(0xFF2D1E0A),
    surfaceVariant: Color(0xFF3B2A14),
    key: Color(0xFF4A3518),
    keyPressed: Color(0xFF5A431F),
    keySecondary: Color(0xFF332311),
    keySecondaryPressed: Color(0xFF46301B),
    keyAccent: Color(0xFFFFC107),
    keyAccentPressed: Color(0xFFFFDA4D),
    keyText: Color(0xFFFFF8ED),
    keySecondaryText: Color(0xFFFFE0A6),
    accent: Color(0xFFFFC107),
    accentMuted: Color(0xFFCC9A06),
    glow: Color(0xFFFFF1A6),
  );

  static const all = [
    akaiEthiopianOrthodox,
    akaiCopticSun,
    akaiIslamicGreen,
    akaiQuranBlue,
    akaiSaintsGold,
  ];
}



