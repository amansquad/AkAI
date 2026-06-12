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
    liveTheme: 'ortho_maryam',
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

  static const akaiMaryamIcon = AkaiPalette(
    name: 'Holy Maryam',
    emoji: '🙏',
    liveTheme: 'ortho_maryam',
    background: Color(0xFF0F172A),
    surface: Color(0xFF1E293B),
    surfaceVariant: Color(0xFF334155),
    key: Color(0xFF1E3A8A),
    keyPressed: Color(0xFF1E40AF),
    keySecondary: Color(0xFF0F172A),
    keySecondaryPressed: Color(0xFF1E293B),
    keyAccent: Color(0xFFFACC15),
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFA5F3FC),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiMeskel = AkaiPalette(
    name: 'Meskel Fire',
    emoji: '🔥',
    liveTheme: 'ortho_meskel',
    background: Color(0xFF450A0A),
    surface: Color(0xFF7F1D1D),
    surfaceVariant: Color(0xFF991B1B),
    key: Color(0xFF991B1B),
    keyPressed: Color(0xFFB45309),
    keySecondary: Color(0xFFB91C1C),
    keySecondaryPressed: Color(0xFF991B1B),
    keyAccent: Color(0xFFFACC15),
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFEFCE8),
    keySecondaryText: Color(0xFFFEF08A),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiNajashi = AkaiPalette(
    name: 'Al-Najashi',
    emoji: '🕌',
    liveTheme: 'islam_najashi',
    background: Color(0xFF064E3B),
    surface: Color(0xFF065F46),
    surfaceVariant: Color(0xFF047857),
    key: Color(0xFF059669),
    keyPressed: Color(0xFF10B981),
    keySecondary: Color(0xFF064E3B),
    keySecondaryPressed: Color(0xFF065F46),
    keyAccent: Color(0xFF34D399),
    keyAccentPressed: Color(0xFF6EE7B7),
    keyText: Color(0xFFECFDF5),
    keySecondaryText: Color(0xFFA7F3D0),
    accent: Color(0xFF34D399),
    accentMuted: Color(0xFF059669),
    glow: Color(0xFF6EE7B7),
  );

  static const akaiIslamicHarar = AkaiPalette(
    name: 'Harar Jegol',
    emoji: '🕌',
    liveTheme: 'islam_harar',
    background: Color(0xFF1E3A8A),
    surface: Color(0xFF1E40AF),
    surfaceVariant: Color(0xFF1D4ED8),
    key: Color(0xFF2563EB),
    keyPressed: Color(0xFF3B82F6),
    keySecondary: Color(0xFF172554),
    keySecondaryPressed: Color(0xFF1E3A8A),
    keyAccent: Color(0xFFFACC15),
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFFDE047),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiLanterns = AkaiPalette(
    name: 'Ramadan Lanterns',
    emoji: '🏮',
    liveTheme: 'islam_lantern',
    background: Color(0xFF020617),
    surface: Color(0xFF0F172A),
    surfaceVariant: Color(0xFF1E293B),
    key: Color(0xFF1E40AF),
    keyPressed: Color(0xFF2563EB),
    keySecondary: Color(0xFF020617),
    keySecondaryPressed: Color(0xFF0F172A),
    keyAccent: Color(0xFFFACC15),
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFFDE047),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiTimkat = AkaiPalette(
    name: 'Timkat Holy',
    emoji: '🕊️',
    liveTheme: 'ortho_timkat',
    background: Color(0xFF1E3A8A),
    surface: Color(0xFF1E40AF),
    surfaceVariant: Color(0xFF1D4ED8),
    key: Color(0xFF2563EB),
    keyPressed: Color(0xFF3B82F6),
    keySecondary: Color(0xFF172554),
    keySecondaryPressed: Color(0xFF1E3A8A),
    keyAccent: Color(0xFFFDE047),
    keyAccentPressed: Color(0xFFFACC15),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFFFDE047),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const all = [
    akaiEthiopianOrthodox,
    akaiMaryamIcon,
    akaiMeskel,
    akaiNajashi,
    akaiIslamicHarar,
    akaiLanterns,
    akaiTimkat,
  ];
}



