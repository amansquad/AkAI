import 'dart:async';
import 'package:flutter/foundation.dart';
import 'keyboard_service.dart';
import 'keyboard_layout.dart';

enum KeyboardMode { letters, numbers, symbols, gif, emoji, stickers, ai, themes }

class AkaiKeyboardController extends ChangeNotifier {
  final AkaiKeyboardService service;
  KeyboardMode _mode = KeyboardMode.letters;
  bool _shifted = false;
  bool _capsLock = false;
  bool _isShiftOneShot = true;
  bool _isAmharic = true; // default to Amharic as per Next.js
  String? _activeAmharicBase;
  String _activeEditorHint = '';
  ImeAction _imeAction = ImeAction.unknown;
  int _inputType = 0;

  AkaiKeyboardController(this.service) {
    service.editorStream.listen(_onEditor);
  }

  KeyboardMode get mode => _mode;
  bool get shifted => _shifted;
  bool get capsLock => _capsLock;
  bool get isAmharic => _isAmharic;
  String? get activeAmharicBase => _activeAmharicBase;
  String get activeEditorHint => _activeEditorHint;
  ImeAction get imeAction => _imeAction;
  int get inputType => _inputType;

  void _onEditor(EditorState state) {
    _activeEditorHint = state.hintText ?? '';
    _imeAction = state.action;
    _inputType = state.inputType;
    // Always reset to letters (or numbers) when a new input field is focused.
    // This ensures the keyboard doesn't stay stuck in emoji/gif/sticker panels
    // after returning from Settings or switching apps.
    if (state.isNumeric) {
      _mode = KeyboardMode.numbers;
    } else {
      _mode = KeyboardMode.letters;
    }
    notifyListeners();
  }

  void setShifted(bool value) {
    _shifted = value;
    notifyListeners();
  }

  void toggleLanguage() {
    _isAmharic = !_isAmharic;
    _activeAmharicBase = null;
    notifyListeners();
  }

  void setActiveAmharicBase(String? base) {
    _activeAmharicBase = base;
    notifyListeners();
  }

  void toggleShift() {
    if (!_shifted && !_capsLock) {
      _shifted = true;
      _isShiftOneShot = true;
    } else if (_shifted && !_capsLock) {
      _capsLock = true;
      _isShiftOneShot = false;
    } else {
      _shifted = false;
      _capsLock = false;
      _isShiftOneShot = false;
    }
    unawaited(service.playHaptic());
    notifyListeners();
  }

  void setMode(KeyboardMode mode) {
    _mode = mode;
    if (mode != KeyboardMode.letters) {
      _shifted = false;
      _capsLock = false;
      _isShiftOneShot = false;
    }
    unawaited(service.playHaptic());
    notifyListeners();
  }

  Future<void> commitVowel(String vowel) async {
    await service.commitText(vowel);
    _activeAmharicBase = null;
    unawaited(service.playHaptic());
    if (_isShiftOneShot) {
      _shifted = false;
      _isShiftOneShot = false;
    }
    notifyListeners();
  }

  Future<void> pressChar(String char) async {
    if (_isAmharic && KeyboardLayout.amharicVowels.containsKey(char)) {
      if (_activeAmharicBase == char) {
        // Tapping the same base character again commits it
        await commitVowel(char);
      } else {
        _activeAmharicBase = char;
        unawaited(service.playHaptic());
        notifyListeners();
      }
      return; 
    }

    _activeAmharicBase = null;

    final text = (_capsLock || _shifted) ? char.toUpperCase() : char;
    await service.commitText(text);
    unawaited(service.playHaptic());
    if (_isShiftOneShot) {
      _shifted = false;
      _isShiftOneShot = false;
      notifyListeners();
    }
  }

  Future<void> backspace() async {
    await service.deleteText(1);
    unawaited(service.playHaptic());
    if (_isShiftOneShot) {
      _shifted = false;
      _isShiftOneShot = false;
      notifyListeners();
    }
  }

  Future<void> backspaceLongPress() async {
    await service.deleteWord();
    unawaited(service.playHaptic());
  }

  Future<void> space() async {
    _activeAmharicBase = null;
    await service.commitText(' ');
    unawaited(service.playHaptic());
    if (_isShiftOneShot) {
      _shifted = false;
      _isShiftOneShot = false;
      notifyListeners();
    }
  }

  Future<void> comma() async {
    await service.commitText(',');
    unawaited(service.playHaptic());
    if (_isShiftOneShot) {
      _shifted = false;
      _isShiftOneShot = false;
      notifyListeners();
    }
  }

  Future<void> period() async {
    await service.commitText('.');
    unawaited(service.playHaptic());
    if (_isShiftOneShot) {
      _shifted = false;
      _isShiftOneShot = false;
      notifyListeners();
    }
  }

  Future<void> enter() async {
    final action = _imeAction;
    if (action == ImeAction.search) {
      await service.performAction('search');
    } else if (action == ImeAction.go) {
      await service.performAction('go');
    } else if (action == ImeAction.send) {
      await service.performAction('send');
    } else if (action == ImeAction.next) {
      await service.performAction('next');
    } else if (action == ImeAction.previous) {
      await service.performAction('previous');
    } else if (action == ImeAction.done || action == ImeAction.unknown) {
      await service.commitText('\n');
    }
    unawaited(service.playHaptic());
  }

  Future<void> switchKeyboard() async {
    await service.switchKeyboard();
  }

  Future<void> mic() async {
    await service.performAction('mic');
  }

  Future<void> hide() async {
    await service.hideKeyboard();
  }

  Future<void> commitSwipeWord(String word) async {
    await service.commitText(word);
    unawaited(service.playHaptic());
  }

  String get enterLabel {
    switch (_imeAction) {
      case ImeAction.search:
        return 'search';
      case ImeAction.go:
        return 'go';
      case ImeAction.send:
        return 'send';
      case ImeAction.next:
        return 'next';
      case ImeAction.previous:
        return 'prev';
      case ImeAction.done:
        return 'done';
      case ImeAction.unknown:
        return 'return';
    }
  }
}
