import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../app/theme/app_theme.dart';
import '../services/theme_download_service.dart';

class ThemeProvider with ChangeNotifier {
  AkaiPalette _currentPalette = AkaiThemes.akaiObsidian;
  List<AkaiPalette> _allThemes = List.from(AkaiThemes.all);
  
  AkaiPalette get currentTheme => _currentPalette;
  ThemeData get currentThemeData => AkaiTheme.buildTheme(_currentPalette);
  bool get hasLiveBackground => _currentPalette.liveTheme != null;
  List<AkaiPalette> get allThemes => _allThemes;

  ThemeProvider() {
    _loadTheme();
  }

  /// Re-read the persisted theme from disk. Used by the IME service so theme
  /// changes made in the companion app apply the next time the keyboard opens.
  Future<void> reload() => _loadTheme();

  void setTheme(AkaiPalette palette) {
    _currentPalette = palette;
    _saveTheme();
    notifyListeners();
  }

  Future<void> loadDownloadedThemes() async {
    try {
      final downloadedIds = await ThemeDownloadService.getDownloadedThemeIds();
      final downloadedThemes = <AkaiPalette>[];
      
      for (final themeId in downloadedIds) {
        final palette = await ThemeDownloadService.loadDownloadedTheme(themeId);
        if (palette != null) {
          downloadedThemes.add(palette);
        }
      }
      
      // Combine bundled themes + downloaded themes
      _allThemes = [...AkaiThemes.all, ...downloadedThemes];
      
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading downloaded themes: $e');
    }
  }

  Future<void> _loadTheme() async {
    // First load downloaded themes
    await loadDownloadedThemes();
    
    final prefs = await SharedPreferences.getInstance();
    // The app and the IME are separate isolates with separate caches —
    // re-read from disk so cross-process changes are seen.
    await prefs.reload();
    final themeId = prefs.getString('current_theme_id') ?? 'akai-obsidian';
    
    // Try to find theme in all themes (bundled + downloaded)
    _currentPalette = _allThemes.firstWhere(
      (palette) => palette.id == themeId,
      orElse: () {
        // Fallback to name-based lookup for migration from older versions if exists
        final legacyName = prefs.getString('current_theme');
        if (legacyName != null) {
          return _allThemes.firstWhere(
            (p) => p.name == legacyName,
            orElse: () => AkaiThemes.akaiObsidian,
          );
        }
        return AkaiThemes.akaiObsidian;
      },
    );
    
    notifyListeners();
  }

  Future<void> _saveTheme() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('current_theme_id', _currentPalette.id);
    // Keep legacy name for safety during transitions
    await prefs.setString('current_theme', _currentPalette.name);
  }
}
