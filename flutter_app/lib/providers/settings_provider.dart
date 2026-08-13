import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider with ChangeNotifier {
  bool _vibrateOnKeyPress = true;
  bool _soundOnKeyPress = true;
  bool _autoCapitalization = true;
  bool _showNumberRow = true;
  bool _keyPopupOnLongPress = true;
  double _keyboardHeight = 1.0; // 0.8 = compact, 1.0 = normal, 1.2 = tall
  
  // Advanced Settings
  bool _showGifButton = true;
  bool _showStickersButton = true;
  double _backgroundOpacity = 0.2;
  bool _toolbarVisible = true;
  double _vibrationIntensity = 0.5;

  // New Visibility Toggles
  bool _showShiftKey = true;
  bool _showSymbolsKey = true;
  bool _showEnterKey = true;
  bool _showCommaKey = true;
  bool _showPeriodKey = true;
  bool _showBackspaceKey = true;
  bool _showLanguageKey = false; // Relocated to toolbar, but kept here for dynamic toggle

  // Typing behavior
  bool _doubleSpacePeriod = true;
  String _oneHandedMode = 'off'; // 'off' | 'left' | 'right'

  // App Version (Incremented)
  String get appVersion => '1.1.7';

  // Getters
  bool get vibrateOnKeyPress => _vibrateOnKeyPress;
  bool get soundOnKeyPress => _soundOnKeyPress;
  bool get autoCapitalization => _autoCapitalization;
  bool get showNumberRow => _showNumberRow;
  bool get keyPopupOnLongPress => _keyPopupOnLongPress;
  double get keyboardHeight => _keyboardHeight;
  bool get showGifButton => _showGifButton;
  bool get showStickersButton => _showStickersButton;
  double get backgroundOpacity => _backgroundOpacity;
  bool get toolbarVisible => _toolbarVisible;
  double get vibrationIntensity => _vibrationIntensity;
  
  bool get showShiftKey => _showShiftKey;
  bool get showSymbolsKey => _showSymbolsKey;
  bool get showEnterKey => _showEnterKey;
  bool get showCommaKey => _showCommaKey;
  bool get showPeriodKey => _showPeriodKey;
  bool get showBackspaceKey => _showBackspaceKey;
  bool get showLanguageKey => _showLanguageKey;
  bool get doubleSpacePeriod => _doubleSpacePeriod;
  String get oneHandedMode => _oneHandedMode;

  SettingsProvider() {
    _loadSettings();
  }

  /// Re-read persisted settings from disk (used by the IME on open so
  /// changes made in the companion app apply immediately).
  Future<void> reload() => _loadSettings();

  void setVibrateOnKeyPress(bool value) {
    _vibrateOnKeyPress = value;
    _saveSettings();
    notifyListeners();
  }

  void setSoundOnKeyPress(bool value) {
    _soundOnKeyPress = value;
    _saveSettings();
    notifyListeners();
  }

  void setAutoCapitalization(bool value) {
    _autoCapitalization = value;
    _saveSettings();
    notifyListeners();
  }

  void setShowNumberRow(bool value) {
    _showNumberRow = value;
    _saveSettings();
    notifyListeners();
  }

  void setKeyPopupOnLongPress(bool value) {
    _keyPopupOnLongPress = value;
    _saveSettings();
    notifyListeners();
  }

  void setKeyboardHeight(double value) {
    _keyboardHeight = value;
    _saveSettings();
    notifyListeners();
  }

  void setShowGifButton(bool value) {
    _showGifButton = value;
    _saveSettings();
    notifyListeners();
  }

  void setShowStickersButton(bool value) {
    _showStickersButton = value;
    _saveSettings();
    notifyListeners();
  }

  void setBackgroundOpacity(double value) {
    _backgroundOpacity = value;
    _saveSettings();
    notifyListeners();
  }

  void setToolbarVisible(bool value) {
    _toolbarVisible = value;
    _saveSettings();
    notifyListeners();
  }

  void setVibrationIntensity(double value) {
    _vibrationIntensity = value;
    _saveSettings();
    notifyListeners();
  }

  // New Setters
  void setShowShiftKey(bool value) { _showShiftKey = value; _saveSettings(); notifyListeners(); }
  void setShowSymbolsKey(bool value) { _showSymbolsKey = value; _saveSettings(); notifyListeners(); }
  void setShowEnterKey(bool value) { _showEnterKey = value; _saveSettings(); notifyListeners(); }
  void setShowCommaKey(bool value) { _showCommaKey = value; _saveSettings(); notifyListeners(); }
  void setShowPeriodKey(bool value) { _showPeriodKey = value; _saveSettings(); notifyListeners(); }
  void setShowBackspaceKey(bool value) { _showBackspaceKey = value; _saveSettings(); notifyListeners(); }
  void setShowLanguageKey(bool value) { _showLanguageKey = value; _saveSettings(); notifyListeners(); }
  void setDoubleSpacePeriod(bool value) { _doubleSpacePeriod = value; _saveSettings(); notifyListeners(); }
  void setOneHandedMode(String value) { _oneHandedMode = value; _saveSettings(); notifyListeners(); }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.reload();
    _vibrateOnKeyPress = prefs.getBool('vibrate_on_key_press') ?? true;
    _soundOnKeyPress = prefs.getBool('sound_on_key_press') ?? true;
    _autoCapitalization = prefs.getBool('auto_capitalization') ?? true;
    _showNumberRow = prefs.getBool('show_number_row') ?? true;
    _keyPopupOnLongPress = prefs.getBool('key_popup_on_long_press') ?? true;
    _keyboardHeight = prefs.getDouble('keyboard_height') ?? 1.0;
    
    _showGifButton = prefs.getBool('show_gif_button') ?? true;
    _showStickersButton = prefs.getBool('show_stickers_button') ?? true;
    _backgroundOpacity = prefs.getDouble('background_opacity') ?? 0.2;
    _toolbarVisible = prefs.getBool('toolbar_visible') ?? true;
    _vibrationIntensity = prefs.getDouble('vibration_intensity') ?? 0.5;

    _showShiftKey = prefs.getBool('show_shift_key') ?? true;
    _showSymbolsKey = prefs.getBool('show_symbols_key') ?? true;
    _showEnterKey = prefs.getBool('show_enter_key') ?? true;
    _showCommaKey = prefs.getBool('show_comma_key') ?? true;
    _showPeriodKey = prefs.getBool('show_period_key') ?? true;
    _showBackspaceKey = prefs.getBool('show_backspace_key') ?? true;
    _showLanguageKey = prefs.getBool('show_language_key') ?? false;
    _doubleSpacePeriod = prefs.getBool('double_space_period') ?? true;
    _oneHandedMode = prefs.getString('one_handed_mode') ?? 'off';
    notifyListeners();
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('vibrate_on_key_press', _vibrateOnKeyPress);
    await prefs.setBool('sound_on_key_press', _soundOnKeyPress);
    await prefs.setBool('auto_capitalization', _autoCapitalization);
    await prefs.setBool('show_number_row', _showNumberRow);
    await prefs.setBool('key_popup_on_long_press', _keyPopupOnLongPress);
    await prefs.setDouble('keyboard_height', _keyboardHeight);
    
    await prefs.setBool('show_gif_button', _showGifButton);
    await prefs.setBool('show_stickers_button', _showStickersButton);
    await prefs.setDouble('background_opacity', _backgroundOpacity);
    await prefs.setBool('toolbar_visible', _toolbarVisible);
    await prefs.setDouble('vibration_intensity', _vibrationIntensity);

    await prefs.setBool('show_shift_key', _showShiftKey);
    await prefs.setBool('show_symbols_key', _showSymbolsKey);
    await prefs.setBool('show_enter_key', _showEnterKey);
    await prefs.setBool('show_comma_key', _showCommaKey);
    await prefs.setBool('show_period_key', _showPeriodKey);
    await prefs.setBool('show_backspace_key', _showBackspaceKey);
    await prefs.setBool('show_language_key', _showLanguageKey);
    await prefs.setBool('double_space_period', _doubleSpacePeriod);
    await prefs.setString('one_handed_mode', _oneHandedMode);
  }
}
