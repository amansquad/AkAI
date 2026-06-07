import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';

class AkaiSettingsProvider extends ChangeNotifier {
  static const _kPalette = 'palette_index';
  static const _kHaptic = 'haptic_enabled';
  static const _kSound = 'sound_enabled';
  static const _kSuggestions = 'suggestions_enabled';
  static const _kClipboard = 'clipboard_enabled';
  static const _kKeyHeight = 'key_height';
  static const _kNumberRow = 'number_row_enabled';

  AkaiPalette _palette = AkaiThemes.akaiObsidian;
  bool _hapticEnabled = true;
  bool _soundEnabled = true;
  bool _showSuggestions = true;
  bool _showClipboard = true;
  bool _showNumberRow = true;
  double _keyHeight = 52;
  bool _loaded = false;

  AkaiPalette get palette => _palette;
  bool get hapticEnabled => _hapticEnabled;
  bool get soundEnabled => _soundEnabled;
  bool get showSuggestions => _showSuggestions;
  bool get showClipboard => _showClipboard;
  bool get showNumberRow => _showNumberRow;
  double get keyHeight => _keyHeight;
  bool get loaded => _loaded;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final paletteIdx = prefs.getInt(_kPalette) ?? AkaiThemes.all.indexOf(AkaiThemes.akaiObsidian);
    if (paletteIdx >= 0 && paletteIdx < AkaiThemes.all.length) {
      _palette = AkaiThemes.all[paletteIdx];
    }
    _hapticEnabled = prefs.getBool(_kHaptic) ?? true;
    _soundEnabled = prefs.getBool(_kSound) ?? true;
    _showSuggestions = prefs.getBool(_kSuggestions) ?? true;
    _showClipboard = prefs.getBool(_kClipboard) ?? true;
    _showNumberRow = prefs.getBool(_kNumberRow) ?? true;
    _keyHeight = prefs.getDouble(_kKeyHeight) ?? 52;
    _loaded = true;
    notifyListeners();
  }

  Future<void> setPalette(AkaiPalette palette) async {
    _palette = palette;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    final idx = AkaiThemes.all.indexOf(palette);
    if (idx >= 0) {
      await prefs.setInt(_kPalette, idx);
    }
  }

  Future<void> setHaptic(bool value) async {
    _hapticEnabled = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kHaptic, value);
  }

  Future<void> setSound(bool value) async {
    _soundEnabled = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kSound, value);
  }

  Future<void> setShowSuggestions(bool value) async {
    _showSuggestions = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kSuggestions, value);
  }

  Future<void> setShowClipboard(bool value) async {
    _showClipboard = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kClipboard, value);
  }

  Future<void> setShowNumberRow(bool value) async {
    _showNumberRow = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kNumberRow, value);
  }

  Future<void> setKeyHeight(double value) async {
    _keyHeight = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble(_kKeyHeight, value);
  }
}
