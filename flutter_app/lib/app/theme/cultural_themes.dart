import 'package:flutter/material.dart';
import 'app_theme.dart' show AkaiPalette;

/// Ethiopian cultural, football team, and national pride themes.
class CulturalPalettes {
  // ─── Ethiopian National & Cultural ─────────────────────────────────────
  static const akaiEthiopianFlag = AkaiPalette(
    name: 'Ethiopian Flag',
    id: 'ethiopian-flag',
    emoji: '🇪🇹',
    category: 'cultural',
    liveTheme: 'eth_flag',
    background: Color(0xFF062E00),
    surface: Color(0xFF0A4200),
    surfaceVariant: Color(0xFF104E05),
    key: Color(0xFF1A6010),
    keyPressed: Color(0xFF237015),
    keySecondary: Color(0xFF0D4400),
    keySecondaryPressed: Color(0xFF165510),
    keyAccent: Color(0xFFFFD700),
    keyAccentPressed: Color(0xFFFFE44D),
    keyText: Color(0xFFFFFDE7),
    keySecondaryText: Color(0xFFFFE082),
    accent: Color(0xFFFFD700),
    accentMuted: Color(0xFFCC9A00),
    glow: Color(0xFFFFEE58),
  );

  static const akaiAddisAbaba = AkaiPalette(
    name: 'Addis Ababa',
    id: 'addis-ababa',
    emoji: '🌆',
    category: 'cultural',
    liveTheme: '/themes/addis_ababa',
    background: Color(0xFF0D1B2A),
    surface: Color(0xFF152636),
    surfaceVariant: Color(0xFF1E3347),
    key: Color(0x59000000), // Semi-transparent black
    keyPressed: Color(0x8C000000),
    keySecondary: Color(0x73000000),
    keySecondaryPressed: Color(0x8C000000),
    keyAccent: Color(0xFFFFFFFF),
    keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFB3E5FC),
    accent: Color(0xFF4FC3F7),
    accentMuted: Color(0xFF0288D1),
    glow: Color(0xFF81D4FA),
  );

  static const akaiAutumn = AkaiPalette(
    name: 'Autumn',
    id: 'autumn',
    emoji: '🍂',
    liveTheme: 'fire',
    category: 'live',
    background: Color(0xA0431407), // orange-950
    surface: Color(0xA07C2D12),
    surfaceVariant: Color(0xA09A3412),
    key: Color(0xFF4A3818),
    keyPressed: Color(0xFF5A4620),
    keySecondary: Color(0xFF302210),
    keySecondaryPressed: Color(0xFF422E16),
    keyAccent: Color(0xFFD4AF37),
    keyAccentPressed: Color(0xFFE8CC60),
    keyText: Color(0xFFFFF8E1),
    keySecondaryText: Color(0xFFFFE0B2),
    accent: Color(0xFFD4AF37),
    accentMuted: Color(0xFF9A7B26),
    glow: Color(0xFFF0D060),
  );

  static const akaiAksum = AkaiPalette(
    name: 'Aksum Empire',
    id: 'aksum-empire',
    emoji: '🏛️',
    category: 'cultural',
    liveTheme: 'ortho_axum',
    background: Color(0xFF1C1206),
    surface: Color(0xFF2A1C0A),
    surfaceVariant: Color(0xFF382810),
    key: Color(0xFF4A3818),
    keyPressed: Color(0xFF5A4620),
    keySecondary: Color(0xFF302210),
    keySecondaryPressed: Color(0xFF422E16),
    keyAccent: Color(0xFFD4AF37),
    keyAccentPressed: Color(0xFFE8CC60),
    keyText: Color(0xFFFFF8E1),
    keySecondaryText: Color(0xFFFFE0B2),
    accent: Color(0xFFD4AF37),
    accentMuted: Color(0xFF9A7B26),
    glow: Color(0xFFF0D060),
  );

  static const akaiLalibela = AkaiPalette(
    name: 'Lalibela Stone',
    id: 'lalibela-stone',
    emoji: '⛪',
    category: 'cultural',
    liveTheme: 'ortho_lalibela',
    background: Color(0xFF1A120E),
    surface: Color(0xFF261A14),
    surfaceVariant: Color(0xFF32221B),
    key: Color(0xFF3E2C22),
    keyPressed: Color(0xFF4D3628),
    keySecondary: Color(0xFF2A1E15),
    keySecondaryPressed: Color(0xFF38281D),
    keyAccent: Color(0xFFBF8040),
    keyAccentPressed: Color(0xFFD4A070),
    keyText: Color(0xFFFAF0E6),
    keySecondaryText: Color(0xFFDEB887),
    accent: Color(0xFFBF8040),
    accentMuted: Color(0xFF8B5E20),
    glow: Color(0xFFD4A070),
  );

  static const akaiWaterfall = AkaiPalette(
    name: 'Waterfall',
    id: 'waterfall',
    emoji: '💧',
    liveTheme: 'ocean',
    category: 'live',
    background: Color(0xA0042F2E), // teal-950
    surface: Color(0xA0134E4A),
    surfaceVariant: Color(0xA0115E59),
    key: Color(0xFF002E6D),
    keyPressed: Color(0xFF004099),
    keySecondary: Color(0xFF000000),
    keySecondaryPressed: Color(0xFF1A1A1A),
    keyAccent: Color(0xFFB8951D),
    keyAccentPressed: Color(0xFFD4AF37),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFB8951D),
    accent: Color(0xFFF4F4F5),
    accentMuted: Color(0xFFA1A1AA),
    glow: Color(0xFFFFFFFF),
  );

  // ─── Ethiopian Football Clubs ───────────────────────────────────────────
  static const akaiSaintGeorge = AkaiPalette(
    name: 'Saint George FC', id: 'saint-george-fc',
    emoji: '🐎',
    category: 'football',
    liveTheme: 'fb_stgeorge',
    background: Color(0xFF1A0000),
    surface: Color(0xFF240000),
    surfaceVariant: Color(0xFF2E0000),
    key: Color(0xFF3D0000),
    keyPressed: Color(0xFF4D0000),
    keySecondary: Color(0xFF290000),
    keySecondaryPressed: Color(0xFF3A0000),
    keyAccent: Color(0xFFFFD700),
    keyAccentPressed: Color(0xFFFFE44D),
    keyText: Color(0xFFFFF9C4),
    keySecondaryText: Color(0xFFFFE082),
    accent: Color(0xFFFFD700),
    accentMuted: Color(0xFFCC9900),
    glow: Color(0xFFFFEE58),
  );

  static const akaiEthiopiaCoffee = AkaiPalette(
    name: 'Ethiopia Bunna', id: 'ethiopia-bunna',
    emoji: '☕',
    category: 'football',
    liveTheme: 'fb_coffee',
    background: Color(0xFF1A0D00),
    surface: Color(0xFF261500),
    surfaceVariant: Color(0xFF331C00),
    key: Color(0xFF472600),
    keyPressed: Color(0xFF583000),
    keySecondary: Color(0xFF2E1900),
    keySecondaryPressed: Color(0xFF3D2100),
    keyAccent: Color(0xFFFF9800),
    keyAccentPressed: Color(0xFFFFB74D),
    keyText: Color(0xFFFFF3E0),
    keySecondaryText: Color(0xFFFFCCBC),
    accent: Color(0xFFFF9800),
    accentMuted: Color(0xFFE65100),
    glow: Color(0xFFFFB74D),
  );

  static const akaiMekelle70 = AkaiPalette(
    name: 'Mekelle 70', id: 'fb_mekelle',
    emoji: '🌅',
    category: 'football',
    liveTheme: 'fb_mekelle',
    background: Color(0xFF1A0000),
    surface: Color(0xFF240000),
    surfaceVariant: Color(0xFF2E0000),
    key: Color(0xFFDC2626),
    keyPressed: Color(0xFFEF4444),
    keySecondary: Color(0xFF7F1D1D),
    keySecondaryPressed: Color(0xFF991B1B),
    keyAccent: Color(0xFFFACC15),
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFEFCE8),
    keySecondaryText: Color(0xFFFEF08A),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiDireDawaCity = AkaiPalette(
    name: 'Dire Dawa City', id: 'fb_diredawa',
    emoji: '🚂',
    category: 'football',
    liveTheme: 'fb_diredawa',
    background: Color(0xFF001F3F),
    surface: Color(0xFF003366),
    surfaceVariant: Color(0xFF004080),
    key: Color(0xFF0074D9),
    keyPressed: Color(0xFF1CA1E1),
    keySecondary: Color(0xFF001021),
    keySecondaryPressed: Color(0xFF001F3F),
    keyAccent: Color(0xFFFF851B),
    keyAccentPressed: Color(0xFFFF9F4D),
    keyText: Color(0xFFFDFDFD),
    keySecondaryText: Color(0xFFDDDDDD),
    accent: Color(0xFFFF851B),
    accentMuted: Color(0xFFE65100),
    glow: Color(0xFFFF9F4D),
  );

  static const akaiAwashKetema = AkaiPalette(
    name: 'Awash Ketema', id: 'club_awash', emoji: '🌊', category: 'football', liveTheme: 'club_awash',
    background: Color(0xFF064E3B), surface: Color(0xFF065F46), surfaceVariant: Color(0xFF047857),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFF064E3B),
    keySecondaryPressed: Color(0xFF065F46), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFFFFFF), accentMuted: Color(0xFFCCCCCC), glow: Color(0xFFDDDDDD),
  );

  static const akaiArbaMinchCity = AkaiPalette(
    name: 'Arba Minch City', id: 'club_arba', emoji: '💦', category: 'football', liveTheme: 'club_arba',
    background: Color(0xFF1E3A8A), surface: Color(0xFF1E40AF), surfaceVariant: Color(0xFF1D4ED8),
    key: Color(0xFF16A34A), keyPressed: Color(0xFF22C55E), keySecondary: Color(0xFF1E3A8A),
    keySecondaryPressed: Color(0xFF1E40AF), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFDCFCE7), accent: Color(0xFF16A34A), accentMuted: Color(0xFF15803D), glow: Color(0xFF4ADE80),
  );

  static const akaiEthioElectric = AkaiPalette(
    name: 'Ethio Electric', id: 'club_electric', emoji: '⚡', category: 'football', liveTheme: 'club_electric',
    background: Color(0xFF1A1A1A), surface: Color(0xFF262626), surfaceVariant: Color(0xFF333333),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFF1A1A1A),
    keySecondaryPressed: Color(0xFF262626), keyAccent: Color(0xFFB91C1C), keyAccentPressed: Color(0xFFDC2626),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFB91C1C), accentMuted: Color(0xFF991B1B), glow: Color(0xFFDC2626),
  );

  static const akaiEthiopianInsurance = AkaiPalette(
    name: 'Ethiopian Insurance', id: 'club_insurance', emoji: '🛡️', category: 'football', liveTheme: 'club_insurance',
    background: Color(0xFF0C4A6E), surface: Color(0xFF075985), surfaceVariant: Color(0xFF0369A1),
    key: Color(0xFFFFFFFF), keyPressed: Color(0xFFF3F4F6), keySecondary: Color(0xFF0C4A6E),
    keySecondaryPressed: Color(0xFF075985), keyAccent: Color(0xFFB91C1C), keyAccentPressed: Color(0xFFDC2626),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFB91C1C), accentMuted: Color(0xFF991B1B), glow: Color(0xFFDC2626),
  );

  static const akaiHawassaCity = AkaiPalette(
    name: 'Hawassa City', id: 'fb_hawassa',
    emoji: '🐠',
    category: 'football',
    liveTheme: 'fb_hawassa',
    background: Color(0xFF001F33),
    surface: Color(0xFF002E4D),
    surfaceVariant: Color(0xFF003D66),
    key: Color(0xFF0C4A6E),
    keyPressed: Color(0xFF075985),
    keySecondary: Color(0xFF001021),
    keySecondaryPressed: Color(0xFF001F33),
    keyAccent: Color(0xFF38BDF8),
    keyAccentPressed: Color(0xFF7DD3FC),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFBAE6FD),
    accent: Color(0xFF38BDF8),
    accentMuted: Color(0xFF0284C7),
    glow: Color(0xFF7DD3FC),
  );

  static const akaiNigdBank = AkaiPalette(
    name: 'Nigd Bank (CBE)', id: 'fb_cbe',
    emoji: '💰',
    category: 'football',
    liveTheme: 'fb_cbe',
    background: Color(0xFF001B3F),
    surface: Color(0xFF002B5E),
    surfaceVariant: Color(0xFF003B7F),
    key: Color(0xFF2563EB),
    keyPressed: Color(0xFF3B82F6),
    keySecondary: Color(0xFF1E3A8A),
    keySecondaryPressed: Color(0xFF1E40AF),
    keyAccent: Color(0xFFFFFFFF),
    keyAccentPressed: Color(0xFFE0E0E0),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFDBEAFE),
    accent: Color(0xFFFFFFFF),
    accentMuted: Color(0xFFCCCCCC),
    glow: Color(0xFFDBEAFE),
  );

  static const akaiNegeleArsi = AkaiPalette(
    name: 'Negele Arsi', id: 'fb_negele_arsi',
    emoji: '🌾',
    category: 'football',
    liveTheme: 'fb_negele_arsi',
    background: Color(0xFF2D0000),
    surface: Color(0xFF450000),
    surfaceVariant: Color(0xFF5C0000),
    key: Color(0xFF991B1B),
    keyPressed: Color(0xFFB91C1C),
    keySecondary: Color(0xFF1A0000),
    keySecondaryPressed: Color(0xFF2A0000),
    keyAccent: Color(0xFFFACC15),
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFFEF08A),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiDedebit = AkaiPalette(
    name: 'Dedebit FC', id: 'dedebit-fc',
    emoji: '💥',
    category: 'football',
    liveTheme: 'fb_arsenal',
    background: Color(0xFF7F1D1D),
    surface: Color(0xFF991B1B),
    surfaceVariant: Color(0xFFB91C1C),
    key: Color(0xFFFFFFFF),
    keyPressed: Color(0xFFF3F4F6),
    keySecondary: Color(0xFFEF4444),
    keySecondaryPressed: Color(0xFFDC2626),
    keyAccent: Color(0xFFFACC15),
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFF991B1B),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  // ─── European Football Clubs ────────────────────────────────────────────
  static const akaiRealMadrid = AkaiPalette(
    name: 'Real Madrid', id: 'fb_realmadrid',
    emoji: '👑',
    category: 'football',
    liveTheme: 'fb_realmadrid',
    background: Color(0xFF0F172A),
    surface: Color(0xFF1E293B),
    surfaceVariant: Color(0xFF334155),
    key: Color(0xFFFFFFFF),
    keyPressed: Color(0xFFF1F5F9),
    keySecondary: Color(0xFF1E40AF),
    keySecondaryPressed: Color(0xFF1E3A8A),
    keyAccent: Color(0xFFFDE047),
    keyAccentPressed: Color(0xFFFACC15),
    keyText: Color(0xFF0F172A),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFFFDE047),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiBarcelona = AkaiPalette(
    name: 'FC Barcelona', id: 'fb_barca',
    emoji: '🔷',
    category: 'football',
    liveTheme: 'fb_barca',
    background: Color(0xFF172554),
    surface: Color(0xFF1E3A8A),
    surfaceVariant: Color(0xFF1E40AF),
    key: Color(0xFFA50044),
    keyPressed: Color(0xFFC40052),
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

  static const akaiManUnited = AkaiPalette(
    name: 'Man United', id: 'fb_manutd',
    emoji: '😈',
    category: 'football',
    liveTheme: 'fb_manutd',
    background: Color(0xFF7F1D1D),
    surface: Color(0xFF991B1B),
    surfaceVariant: Color(0xFFB91C1C),
    key: Color(0xFFDC2626),
    keyPressed: Color(0xFFEF4444),
    keySecondary: Color(0xFF000000),
    keySecondaryPressed: Color(0xFF1A1A1A),
    keyAccent: Color(0xFFF59E0B),
    keyAccentPressed: Color(0xFFFBBF24),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFF59E0B),
    accent: Color(0xFFF59E0B),
    accentMuted: Color(0xFFD97706),
    glow: Color(0xFFF59E0B),
  );

  static const akaiArsenal = AkaiPalette(
    name: 'Arsenal FC', id: 'fb_arsenal',
    emoji: '💣',
    category: 'football',
    liveTheme: 'fb_arsenal',
    background: Color(0xFF7F1D1D),
    surface: Color(0xFF991B1B),
    surfaceVariant: Color(0xFFB91C1C),
    key: Color(0xFFFFFFFF),
    keyPressed: Color(0xFFF3F4F6),
    keySecondary: Color(0xFFEF4444),
    keySecondaryPressed: Color(0xFFDC2626),
    keyAccent: Color(0xFFFACC15),
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFF991B1B),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiManCity = AkaiPalette(
    name: 'Man City', id: 'fb_mancity',
    emoji: '☁️',
    category: 'football',
    liveTheme: 'fb_mancity',
    background: Color(0xFF0C4A6E),
    surface: Color(0xFF075985),
    surfaceVariant: Color(0xFF0369A1),
    key: Color(0xFFFFFFFF),
    keyPressed: Color(0xFFF0F9FF),
    keySecondary: Color(0xFF0EA5E9),
    keySecondaryPressed: Color(0xFF0284C7),
    keyAccent: Color(0xFF0C4A6E),
    keyAccentPressed: Color(0xFF075985),
    keyText: Color(0xFF0C4A6E),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFF0EA5E9),
    accentMuted: Color(0xFF0284C7),
    glow: Color(0xFF7DD3FC),
  );

  static const akaiChelseaFC = AkaiPalette(
    name: 'Chelsea FC', id: 'fb_chelsea',
    emoji: '🦁',
    category: 'football',
    liveTheme: 'fb_chelsea',
    background: Color(0xFF1E3A8A),
    surface: Color(0xFF1E40AF),
    surfaceVariant: Color(0xFF1D4ED8),
    key: Color(0xFFFFFFFF),
    keyPressed: Color(0xFFEFF6FF),
    keySecondary: Color(0xFF2563EB),
    keySecondaryPressed: Color(0xFF1D4ED8),
    keyAccent: Color(0xFFFACC15),
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFF1E3A8A),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiLiverpool = AkaiPalette(
    name: 'Liverpool FC', id: 'fb_liverpool',
    emoji: '🕊️',
    category: 'football',
    liveTheme: 'fb_liverpool',
    background: Color(0xFF7F1D1D),
    surface: Color(0xFF991B1B),
    surfaceVariant: Color(0xFFB91C1C),
    key: Color(0xFFDC2626),
    keyPressed: Color(0xFFEF4444),
    keySecondary: Color(0xFF0D9488),
    keySecondaryPressed: Color(0xFF0F766E),
    keyAccent: Color(0xFF5EEAD4),
    keyAccentPressed: Color(0xFF99F6E4),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFF5EEAD4),
    accent: Color(0xFF5EEAD4),
    accentMuted: Color(0xFF0D9488),
    glow: Color(0xFF99F6E4),
  );

  static const akaiPSG = AkaiPalette(
    name: 'Paris SG', id: 'fb_psg',
    emoji: '🗼',
    category: 'football',
    liveTheme: 'fb_psg',
    background: Color(0xFF172554),
    surface: Color(0xFF1E3A8A),
    surfaceVariant: Color(0xFF1E40AF),
    key: Color(0xFFDC2626),
    keyPressed: Color(0xFFEF4444),
    keySecondary: Color(0xFF172554),
    keySecondaryPressed: Color(0xFF1E3A8A),
    keyAccent: Color(0xFFFFFFFF),
    keyAccentPressed: Color(0xFFF1F5F9),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFFDC2626),
    accentMuted: Color(0xFFB91C1C),
    glow: Color(0xFFEF4444),
  );

  static const akaiBayernMunich = AkaiPalette(
    name: 'Bayern Munich', id: 'fb_bayern',
    emoji: '💠',
    category: 'football',
    liveTheme: 'fb_bayern',
    background: Color(0xFF7F1D1D),
    surface: Color(0xFF991B1B),
    surfaceVariant: Color(0xFFB91C1C),
    key: Color(0xFFFFFFFF),
    keyPressed: Color(0xFFFEF2F2),
    keySecondary: Color(0xFF1D4ED8),
    keySecondaryPressed: Color(0xFF1E40AF),
    keyAccent: Color(0xFF1D4ED8),
    keyAccentPressed: Color(0xFF2563EB),
    keyText: Color(0xFFDC2626),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFF1D4ED8),
    accentMuted: Color(0xFF1E3A8A),
    glow: Color(0xFF3B82F6),
  );

  static const akaiDortmund = AkaiPalette(
    name: 'Dortmund', id: 'fb_dortmund',
    emoji: '🐝',
    category: 'football',
    liveTheme: 'fb_dortmund',
    background: Color(0xFF422006),
    surface: Color(0xFF713F12),
    surfaceVariant: Color(0xFF854D0E),
    key: Color(0xFF000000),
    keyPressed: Color(0xFF171717),
    keySecondary: Color(0xFFFACC15),
    keySecondaryPressed: Color(0xFFFDE047),
    keyAccent: Color(0xFFFACC15),
    keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFF000000),
    accent: Color(0xFFFACC15),
    accentMuted: Color(0xFFEAB308),
    glow: Color(0xFFFDE047),
  );

  static const akaiJuventus = AkaiPalette(
    name: 'Juventus', id: 'fb_juventus',
    emoji: '🦓',
    category: 'football',
    liveTheme: 'fb_juventus',
    background: Color(0xFF18181B),
    surface: Color(0xFF27272A),
    surfaceVariant: Color(0xFF3F3F46),
    key: Color(0xFFF4F4F5),
    keyPressed: Color(0xFFFFFFFF),
    keySecondary: Color(0xFF000000),
    keySecondaryPressed: Color(0xFF1A1A1A),
    keyAccent: Color(0xFF000000),
    keyAccentPressed: Color(0xFF1A1A1A),
    keyText: Color(0xFF000000),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFFF4F4F5),
    accentMuted: Color(0xFFA1A1AA),
    glow: Color(0xFFFFFFFF),
  );

  static const akaiInterMilan = AkaiPalette(
    name: 'Inter Milan', id: 'fb_inter',
    emoji: '🐍',
    category: 'football',
    liveTheme: 'fb_inter',
    background: Color(0xFF1E3A8A),
    surface: Color(0xFF1E40AF),
    surfaceVariant: Color(0xFF1D4ED8),
    key: Color(0xFF002E6D),
    keyPressed: Color(0xFF004099),
    keySecondary: Color(0xFF000000),
    keySecondaryPressed: Color(0xFF1A1A1A),
    keyAccent: Color(0xFFB8951D),
    keyAccentPressed: Color(0xFFD4AF37),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFB8951D),
    accent: Color(0xFFB8951D),
    accentMuted: Color(0xFF9A7B26),
    glow: Color(0xFFB8951D),
  );

  static const akaiACMilan = AkaiPalette(
    name: 'AC Milan', id: 'fb_milan',
    emoji: '👹',
    category: 'football',
    liveTheme: 'fb_milan',
    background: Color(0xFF7F1D1D),
    surface: Color(0xFF991B1B),
    surfaceVariant: Color(0xFFB91C1C),
    key: Color(0xFFDB080A),
    keyPressed: Color(0xFFFF1A1C),
    keySecondary: Color(0xFF000000),
    keySecondaryPressed: Color(0xFF1A1A1A),
    keyAccent: Color(0xFFFFFFFF),
    keyAccentPressed: Color(0xFFF1F5F9),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFFFFFFFF),
    accentMuted: Color(0xFFCCCCCC),
    glow: Color(0xFFFFFFFF),
  );

  static const akaiMonaco = AkaiPalette(
    name: 'AS Monaco', id: 'fb_monaco',
    emoji: '🎰',
    category: 'football',
    liveTheme: 'fb_monaco',
    background: Color(0xFFDC2626),
    surface: Color(0xFFEF4444),
    surfaceVariant: Color(0xFFF87171),
    key: Color(0xFFFFFFFF),
    keyPressed: Color(0xFFFEE2E2),
    keySecondary: Color(0xFF991B1B),
    keySecondaryPressed: Color(0xFF7F1D1D),
    keyAccent: Color(0xFFFFFFFF),
    keyAccentPressed: Color(0xFFF1F5F9),
    keyText: Color(0xFFDC2626),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFFFFFFFF),
    accentMuted: Color(0xFFCCCCCC),
    glow: Color(0xFFFFFFFF),
  );

  static const akaiLeipzig = AkaiPalette(
    name: 'RB Leipzig', id: 'fb_leipzig',
    emoji: '🐂',
    category: 'football',
    liveTheme: 'fb_leipzig',
    background: Color(0xFFFFFFFF),
    surface: Color(0xFFF8FAFC),
    surfaceVariant: Color(0xFFF1F5F9),
    key: Color(0xFFDC2626),
    keyPressed: Color(0xFFEF4444),
    keySecondary: Color(0xFF1E3A8A),
    keySecondaryPressed: Color(0xFF1E40AF),
    keyAccent: Color(0xFFDC2626),
    keyAccentPressed: Color(0xFFEF4444),
    keyText: Color(0xFFFFFFFF),
    keySecondaryText: Color(0xFFFFFFFF),
    accent: Color(0xFFDC2626),
    accentMuted: Color(0xFFB91C1C),
    glow: Color(0xFFEF4444),
  );

  static const akaiAbyssinianFlag = AkaiPalette(
    name: 'Abyssinian Flag', id: 'abyssinian-flag', emoji: '🇪🇹', category: 'cultural', liveTheme: '/flags/Flag_of_Ethiopia',
    background: Color(0xFF1A1A1A), surface: Color(0xFF262626), surfaceVariant: Color(0xFF333333),
    key: Color(0xFF1A6010), keyPressed: Color(0xFF237015), keySecondary: Color(0xFFFFFFFF),
    keySecondaryPressed: Color(0xFFF3F4F6), keyAccent: Color(0xFFFACC15), keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFACC15), accentMuted: Color(0xFFEAB308), glow: Color(0xFFFDE047),
  );

  static const akaiAdeyAbeba = AkaiPalette(
    name: 'Adey Abeba', id: 'adey-abeba', emoji: '🌼', category: 'cultural', liveTheme: 'adey',
    background: Color(0xFF064E3B), surface: Color(0xFF065F46), surfaceVariant: Color(0xFF047857),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFF064E3B),
    keySecondaryPressed: Color(0xFF065F46), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFF064E3B), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFACC15), accentMuted: Color(0xFFEAB308), glow: Color(0xFFFDE047),
  );

  static const akaiBlackGold = AkaiPalette(
    name: 'Black Gold', id: 'black-gold', emoji: '🍯', category: 'cultural', liveTheme: 'reg_blackgold',
    background: Color(0xFF000000), surface: Color(0xFF1A1A1A), surfaceVariant: Color(0xFF262626),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFF1A1A1A),
    keySecondaryPressed: Color(0xFF262626), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFACC15), accentMuted: Color(0xFFEAB308), glow: Color(0xFFFDE047),
  );

  // Matches the web theme's zinc/black/amber palette (keyboard-data.ts `lion`).
  static const akaiJudahLion = AkaiPalette(
    name: 'Judah Lion', id: 'judah-lion', emoji: '🦁', category: 'cultural', liveTheme: '/judah_lion',
    background: Color(0xFF09090B), surface: Color(0x80000000), surfaceVariant: Color(0x66000000),
    key: Color(0x59000000), keyPressed: Color(0x8C000000), keySecondary: Color(0x73000000),
    keySecondaryPressed: Color(0x8C000000), keyAccent: Color(0xFFFCD34D), keyAccentPressed: Color(0xFFFDE68A),
    keyText: Color(0xFFFEF3C7), keySecondaryText: Color(0xFFFDE68A), accent: Color(0xFFFCD34D), accentMuted: Color(0xFFFBBF24), glow: Color(0xFFFDE68A),
  );

  static const akaiSouthernEthiopia = AkaiPalette(
    name: 'Southern Ethiopia', id: 'southern-ethiopia', emoji: '🌄', category: 'cultural', liveTheme: '/flags/Flag_of_Southern_Ethiopia',
    background: Color(0xFF0C4A6E), surface: Color(0x4D000000), surfaceVariant: Color(0x66000000),
    key: Color(0x59000000), keyPressed: Color(0x8C000000), keySecondary: Color(0x73000000),
    keySecondaryPressed: Color(0x8C000000), keyAccent: Color(0xFFFACC15), keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFFFFFFF), accent: Color(0xFFFACC15), accentMuted: Color(0xFFEAB308), glow: Color(0xFFFDE047),
  );

  static const akaiSouthWestEthiopia = AkaiPalette(
    name: 'South West Ethiopia', id: 'south-west-ethiopia', emoji: '🌲', category: 'cultural', liveTheme: 'reg_southwest',
    background: Color(0xFF064E3B), surface: Color(0xFF065F46), surfaceVariant: Color(0xFF047857),
    key: Color(0xFFD97706), keyPressed: Color(0xFFF59E0B), keySecondary: Color(0xFF064E3B),
    keySecondaryPressed: Color(0xFF065F46), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFDDDDDD), accent: Color(0xFFF59E0B), accentMuted: Color(0xFFD97706), glow: Color(0xFFFBBF24),
  );

  static const akaiAfar = AkaiPalette(
    name: 'Afar Region', id: 'afar-region', emoji: '🐪', category: 'cultural', liveTheme: '/flags/Flag_of_the_Afar_Region',
    background: Color(0xFF1A1206), surface: Color(0xFF2A1C0A), surfaceVariant: Color(0xFF382810),
    key: Color(0xFFD97706), keyPressed: Color(0xFFF59E0B), keySecondary: Color(0xFF1A1206),
    keySecondaryPressed: Color(0xFF2A1C0A), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFFFE0B2), accent: Color(0xFFF59E0B), accentMuted: Color(0xFFD97706), glow: Color(0xFFFBBF24),
  );

  static const akaiAmhara = AkaiPalette(
    name: 'Amhara Region', id: 'amhara-region', emoji: '🌾', category: 'cultural', liveTheme: '/flags/Flag_of_the_Amhara_Region',
    background: Color(0xFF062E00), surface: Color(0xFF0A4200), surfaceVariant: Color(0xFF104E05),
    key: Color(0xFFF59E0B), keyPressed: Color(0xFFFBBF24), keySecondary: Color(0xFF062E00),
    keySecondaryPressed: Color(0xFF0A4200), keyAccent: Color(0xFFB91C1C), keyAccentPressed: Color(0xFFDC2626),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFFEE2E2), accent: Color(0xFFB91C1C), accentMuted: Color(0xFF991B1B), glow: Color(0xFFDC2626),
  );

  static const akaiOromia = AkaiPalette(
    name: 'Oromia Region', id: 'oromia-region', emoji: '🌳', category: 'cultural', liveTheme: '/flags/Flag_of_the_Oromia_Region',
    background: Color(0xFF1A1A1A), surface: Color(0xFF262626), surfaceVariant: Color(0xFF333333),
    key: Color(0xFFB91C1C), keyPressed: Color(0xFFDC2626), keySecondary: Color(0xFF1A1A1A),
    keySecondaryPressed: Color(0xFF262626), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFDDDDDD), accent: Color(0xFFFFFFFF), accentMuted: Color(0xFFCCCCCC), glow: Color(0xFFDDDDDD),
  );

  static const akaiSomali = AkaiPalette(
    name: 'Somali Region', id: 'somali-region', emoji: '⭐', category: 'cultural', liveTheme: '/flags/Flag_of_the_Somali_Region_(1994-2008,_2018-)',
    background: Color(0xFF0038A8), surface: Color(0xFF0044CC), surfaceVariant: Color(0xFF0055EE),
    key: Color(0xFFFFFFFF), keyPressed: Color(0xFFF3F4F6), keySecondary: Color(0xFF0038A8),
    keySecondaryPressed: Color(0xFF0044CC), keyAccent: Color(0xFF0038A8), keyAccentPressed: Color(0xFF0044CC),
    keyText: Color(0xFF0038A8), keySecondaryText: Color(0xFFFFFFFF), accent: Color(0xFFFFFFFF), accentMuted: Color(0xFFCCCCCC), glow: Color(0xFFDDDDDD),
  );

  static const akaiTigray = AkaiPalette(
    name: 'Tigray Region', id: 'tigray-region', emoji: '⛰️', category: 'cultural', liveTheme: '/flags/Flag_of_the_Tigray_Region',
    background: Color(0xFFB91C1C), surface: Color(0xFFDC2626), surfaceVariant: Color(0xFFEF4444),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFFB91C1C),
    keySecondaryPressed: Color(0xFFDC2626), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFACC15), accentMuted: Color(0xFFEAB308), glow: Color(0xFFFDE047),
  );

  static const akaiSidamaRegion = AkaiPalette(
    name: 'Sidama', id: 'reg_sidama', emoji: '☕', category: 'cultural', liveTheme: 'reg_sidama',
    background: Color(0xFF064E3B), surface: Color(0xFF065F46), surfaceVariant: Color(0xFF047857),
    key: Color(0xFFB91C1C), keyPressed: Color(0xFFDC2626), keySecondary: Color(0xFF064E3B),
    keySecondaryPressed: Color(0xFF065F46), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFDDDDDD), accent: Color(0xFFB91C1C), accentMuted: Color(0xFF991B1B), glow: Color(0xFFDC2626),
  );

  static const akaiGambella = AkaiPalette(
    name: 'Gambella', id: 'reg_gambella', emoji: '🚣', category: 'cultural', liveTheme: 'reg_gambella',
    background: Color(0xFF064E3B), surface: Color(0xFF065F46), surfaceVariant: Color(0xFF047857),
    key: Color(0xFFFFFFFF), keyPressed: Color(0xFFF3F4F6), keySecondary: Color(0xFF064E3B),
    keySecondaryPressed: Color(0xFF065F46), keyAccent: Color(0xFF0038A8), keyAccentPressed: Color(0xFF0044CC),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFF0038A8), accentMuted: Color(0xFF002D86), glow: Color(0xFF0044CC),
  );

  static const akaiHarari = AkaiPalette(
    name: 'Harari', id: 'reg_harari', emoji: '🏰', category: 'cultural', liveTheme: 'reg_harari',
    background: Color(0xFF1A1A1A), surface: Color(0xFF262626), surfaceVariant: Color(0xFF333333),
    key: Color(0xFFB91C1C), keyPressed: Color(0xFFDC2626), keySecondary: Color(0xFF062E00),
    keySecondaryPressed: Color(0xFF0A4200), keyAccent: Color(0xFFFACC15), keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFDDDDDD), accent: Color(0xFFB91C1C), accentMuted: Color(0xFF991B1B), glow: Color(0xFFDC2626),
  );

  static const akaiBGumuz = AkaiPalette(
    name: 'Benishangul Gumuz', id: 'reg_bgumuz', emoji: '⛰️', category: 'cultural', liveTheme: 'reg_bgumuz',
    background: Color(0xFF062E00), surface: Color(0xFF0A4200), surfaceVariant: Color(0xFF104E05),
    key: Color(0xFFFFFFFF), keyPressed: Color(0xFFF3F4F6), keySecondary: Color(0xFF062E00),
    keySecondaryPressed: Color(0xFF0A4200), keyAccent: Color(0xFF000000), keyAccentPressed: Color(0xFF1A1A1A),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFFFFFF), accentMuted: Color(0xFFCCCCCC), glow: Color(0xFFDDDDDD),
  );

  static const akaiMeskelFestival = AkaiPalette(
    name: 'Meskel Festival', id: 'reg_meskel_fest', emoji: '🔥', category: 'cultural', liveTheme: 'reg_meskel',
    background: Color(0xFF450A0A), surface: Color(0xFF7F1D1D), surfaceVariant: Color(0xFF991B1B),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFF450A0A),
    keySecondaryPressed: Color(0xFF7F1D1D), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFF450A0A), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFACC15), accentMuted: Color(0xFFEAB308), glow: Color(0xFFFDE047),
  );

  static const akaiTimketFestival = AkaiPalette(
    name: 'Timket Festival', id: 'reg_timket_fest', emoji: '⛪', category: 'cultural', liveTheme: 'reg_timket',
    background: Color(0xFF1E3A8A), surface: Color(0xFF1E40AF), surfaceVariant: Color(0xFF1D4ED8),
    key: Color(0xFFFFFFFF), keyPressed: Color(0xFFF3F4F6), keySecondary: Color(0xFFFACC15),
    keySecondaryPressed: Color(0xFFFDE047), keyAccent: Color(0xFFFACC15), keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFF1E3A8A), keySecondaryText: Color(0xFFFFFFFF), accent: Color(0xFFFACC15), accentMuted: Color(0xFFEAB308), glow: Color(0xFFFDE047),
  );

  static const akaiShireEndaselassie = AkaiPalette(
    name: 'Shire Endaselassie', id: 'club_shire', emoji: '🏰', category: 'football', liveTheme: 'club_shire',
    background: Color(0xFF450A0A), surface: Color(0xFF7F1D1D), surfaceVariant: Color(0xFF991B1B),
    key: Color(0xFF059669), keyPressed: Color(0xFF10B981), keySecondary: Color(0xFF450A0A),
    keySecondaryPressed: Color(0xFF7F1D1D), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFD1FAE5), accent: Color(0xFF10B981), accentMuted: Color(0xFF059669), glow: Color(0xFF34D399),
  );

  static const akaiWelwaloAdigrat = AkaiPalette(
    name: 'Welwalo Adigrat Univ.', id: 'club_welwalo', emoji: '🏛️', category: 'football', liveTheme: 'club_welwalo',
    background: Color(0xFF0C4A6E), surface: Color(0xFF075985), surfaceVariant: Color(0xFF0369A1),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFF0C4A6E),
    keySecondaryPressed: Color(0xFF075985), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFFFFFF), accentMuted: Color(0xFFCCCCCC), glow: Color(0xFFDDDDDD),
  );

  static const akaiWoldiaSC = AkaiPalette(
    name: 'Woldia SC', id: 'club_woldia', emoji: '🌄', category: 'football', liveTheme: 'club_woldia',
    background: Color(0xFF062E00), surface: Color(0xFF0A4200), surfaceVariant: Color(0xFF104E05),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFF062E00),
    keySecondaryPressed: Color(0xFF0A4200), keyAccent: Color(0xFFB91C1C), keyAccentPressed: Color(0xFFDC2626),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFB91C1C), accentMuted: Color(0xFF991B1B), glow: Color(0xFFDC2626),
  );

  static const akaiMekelakeya = AkaiPalette(
    name: 'Mekelakeya', id: 'club_mekel', emoji: '⚔️', category: 'football', liveTheme: 'club_mekel',
    background: Color(0xFF450A0A), surface: Color(0xFF7F1D1D), surfaceVariant: Color(0xFF991B1B),
    key: Color(0xFF1A6010), keyPressed: Color(0xFF237015), keySecondary: Color(0xFF450A0A),
    keySecondaryPressed: Color(0xFF7F1D1D), keyAccent: Color(0xFFFACC15), keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFFEF08A), accent: Color(0xFFFACC15), accentMuted: Color(0xFFEAB308), glow: Color(0xFFFDE047),
  );

  static const akaiHamberichoCity = AkaiPalette(
    name: 'Hambericho City', id: 'club_hamb', emoji: '⛰️', category: 'football', liveTheme: 'club_hamb',
    background: Color(0xFF0C4A6E), surface: Color(0xFF075985), surfaceVariant: Color(0xFF0369A1),
    key: Color(0xFFFFFFFF), keyPressed: Color(0xFFF3F4F6), keySecondary: Color(0xFF0C4A6E),
    keySecondaryPressed: Color(0xFF075985), keyAccent: Color(0xFFB91C1C), keyAccentPressed: Color(0xFFDC2626),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFB91C1C), accentMuted: Color(0xFF991B1B), glow: Color(0xFFDC2626),
  );

  static const akaiBahirDarKenema = AkaiPalette(
    name: 'Bahir Dar Kenema', id: 'club_bahirdar', emoji: '⛵', category: 'football', liveTheme: 'club_bahirdar',
    background: Color(0xFF0C4A6E), surface: Color(0xFF075985), surfaceVariant: Color(0xFF0369A1),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFF0C4A6E),
    keySecondaryPressed: Color(0xFF075985), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFFFFFF), accentMuted: Color(0xFFCCCCCC), glow: Color(0xFFDDDDDD),
  );

  static const akaiFasilKenema = AkaiPalette(
    name: 'Fasil Kenema', id: 'club_fasil', emoji: '🏯', category: 'football', liveTheme: 'club_fasil',
    background: Color(0xFF450A0A), surface: Color(0xFF7F1D1D), surfaceVariant: Color(0xFF991B1B),
    key: Color(0xFFFFFFFF), keyPressed: Color(0xFFF3F4F6), keySecondary: Color(0xFF450A0A),
    keySecondaryPressed: Color(0xFF7F1D1D), keyAccent: Color(0xFFD97706), keyAccentPressed: Color(0xFFF59E0B),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFD97706), accentMuted: Color(0xFFB45309), glow: Color(0xFFFBBF24),
  );

  static const akaiAdamaCity = AkaiPalette(
    name: 'Adama City', id: 'club_adama', emoji: '🌬️', category: 'football', liveTheme: 'club_adama',
    background: Color(0xFF064E3B), surface: Color(0xFF065F46), surfaceVariant: Color(0xFF047857),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFFB91C1C),
    keySecondaryPressed: Color(0xFFDC2626), keyAccent: Color(0xFFB91C1C), keyAccentPressed: Color(0xFFDC2626),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFB91C1C), accentMuted: Color(0xFF991B1B), glow: Color(0xFFDC2626),
  );

  static const akaiSidamaCoffee = AkaiPalette(
    name: 'Sidama Coffee', id: 'club_sidama', emoji: '🫘', category: 'football', liveTheme: 'club_sidama',
    background: Color(0xFF450A0A), surface: Color(0xFF7F1D1D), surfaceVariant: Color(0xFF991B1B),
    key: Color(0xFF1A6010), keyPressed: Color(0xFF237015), keySecondary: Color(0xFF450A0A),
    keySecondaryPressed: Color(0xFF7F1D1D), keyAccent: Color(0xFF0C4A6E), keyAccentPressed: Color(0xFF075985),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFFEF08A), accent: Color(0xFF0C4A6E), accentMuted: Color(0xFF075985), glow: Color(0xFF0EA5E9),
  );

  static const akaiWolaitaDicha = AkaiPalette(
    name: 'Wolaita Dicha', id: 'club_dicha', emoji: '🦅', category: 'football', liveTheme: 'club_dicha',
    background: Color(0xFFD97706), surface: Color(0xFFF59E0B), surfaceVariant: Color(0xFFFBBF24),
    key: Color(0xFF0C4A6E), keyPressed: Color(0xFF075985), keySecondary: Color(0xFFFFFFFF),
    keySecondaryPressed: Color(0xFFF3F4F6), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFFFFFFFF), keySecondaryText: Color(0xFFDDDDDD), accent: Color(0xFFFFFFFF), accentMuted: Color(0xFFCCCCCC), glow: Color(0xFFDDDDDD),
  );

  static const akaiNigidBank = AkaiPalette(
    name: 'Nigid Bank (CBE)', id: 'club_cbe', emoji: '🪙', category: 'football', liveTheme: 'club_cbe',
    background: Color(0xFF0C4A6E), surface: Color(0xFF075985), surfaceVariant: Color(0xFF0369A1),
    key: Color(0xFFFACC15), keyPressed: Color(0xFFFDE047), keySecondary: Color(0xFFFFFFFF),
    keySecondaryPressed: Color(0xFFF3F4F6), keyAccent: Color(0xFFFFFFFF), keyAccentPressed: Color(0xFFF3F4F6),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFFFFFF), accentMuted: Color(0xFFCCCCCC), glow: Color(0xFFDDDDDD),
  );

  static const akaiNegedeAmhara = AkaiPalette(
    name: 'Negede Amhara FC', id: 'club_negede', emoji: '🐫', category: 'football', liveTheme: 'club_negede',
    background: Color(0xFF062E00), surface: Color(0xFF0A4200), surfaceVariant: Color(0xFF104E05),
    key: Color(0xFFFFFFFF), keyPressed: Color(0xFFF3F4F6), keySecondary: Color(0xFF062E00),
    keySecondaryPressed: Color(0xFF0A4200), keyAccent: Color(0xFFB91C1C), keyAccentPressed: Color(0xFFDC2626),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFB91C1C), accentMuted: Color(0xFF991B1B), glow: Color(0xFFDC2626),
  );

  static const akaiHadiyaHossana = AkaiPalette(
    name: 'Hadiya Hossana', id: 'club_hadiya', emoji: '🐯', category: 'football', liveTheme: 'club_hadiya',
    background: Color(0xFF450A0A), surface: Color(0xFF7F1D1D), surfaceVariant: Color(0xFF991B1B),
    key: Color(0xFFFFFFFF), keyPressed: Color(0xFFF3F4F6), keySecondary: Color(0xFF450A0A),
    keySecondaryPressed: Color(0xFF7F1D1D), keyAccent: Color(0xFFFACC15), keyAccentPressed: Color(0xFFFDE047),
    keyText: Color(0xFF000000), keySecondaryText: Color(0xFF333333), accent: Color(0xFFFACC15), accentMuted: Color(0xFFEAB308), glow: Color(0xFFFDE047),
  );

  static final List<AkaiPalette> all = [
    // Ethiopian cultural
    akaiEthiopianFlag,
    akaiAddisAbaba,
    akaiAksum,
    akaiLalibela,
    akaiAfar,
    akaiAmhara,
    akaiOromia,
    akaiSomali,
    akaiTigray,
    akaiSidamaRegion,
    akaiGambella,
    akaiHarari,
    akaiBGumuz,
    akaiAdeyAbeba,
    akaiBlackGold,
    akaiJudahLion,
    akaiMeskelFestival,
    akaiTimketFestival,
    akaiSouthernEthiopia,
    akaiSouthWestEthiopia,
    // Ethiopian clubs
    akaiSaintGeorge,
    akaiEthiopiaCoffee,
    akaiAwashKetema,
    akaiArbaMinchCity,
    akaiEthioElectric,
    akaiEthiopianInsurance,
    akaiShireEndaselassie,
    akaiWelwaloAdigrat,
    akaiWoldiaSC,
    akaiMekelakeya,
    akaiHamberichoCity,
    akaiBahirDarKenema,
    akaiFasilKenema,
    akaiAdamaCity,
    akaiSidamaCoffee,
    akaiWolaitaDicha,
    akaiNigidBank,
    akaiNegedeAmhara,
    akaiHadiyaHossana,
    akaiNegeleArsi,
    // European clubs
    akaiRealMadrid,
    akaiBarcelona,
    akaiManUnited,
    akaiArsenal,
    akaiManCity,
    akaiChelseaFC,
    akaiLiverpool,
    akaiPSG,
    akaiBayernMunich,
    akaiDortmund,
    akaiJuventus,
    akaiInterMilan,
    akaiACMilan,
    akaiMonaco,
    akaiLeipzig,
  ];
}
