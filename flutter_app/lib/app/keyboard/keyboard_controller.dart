import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'keyboard_service.dart';

enum KeyboardMode { letters, numbers, symbols }

class AkaiKeyboardController extends ChangeNotifier {
  final AkaiKeyboardService service;
  KeyboardMode _mode = KeyboardMode.letters;
  bool _shifted = false;
  bool _capsLock = false;
  bool _isShiftOneShot = true;
  String _activeEditorHint = '';
  ImeAction _imeAction = ImeAction.unknown;
  int _inputType = 0;

  AkaiKeyboardController(this.service) {
    service.editorStream.listen(_onEditor);
  }

  KeyboardMode get mode => _mode;
  bool get shifted => _shifted;
  bool get capsLock => _capsLock;
  String get activeEditorHint => _activeEditorHint;
  ImeAction get imeAction => _imeAction;
  int get inputType => _inputType;

  void _onEditor(EditorState state) {
    _activeEditorHint = state.hintText ?? '';
    _imeAction = state.action;
    _inputType = state.inputType;
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

  void toggleShift() {
    if (_shifted && !_capsLock) {
      _shifted = false;
    } else if (!_shifted) {
      _shifted = true;
    } else {
      _capsLock = !_capsLock;
    }
    _isShiftOneShot = _shifted && !_capsLock;
    notifyListeners();
  }

  void setMode(KeyboardMode mode) {
    _mode = mode;
    if (mode != KeyboardMode.letters) {
      _shifted = false;
    }
    notifyListeners();
  }

  Future<void> pressChar(String char) async {
    final text = _shifted ? char.toUpperCase() : char;
    await service.commitText(text);
    HapticFeedback.selectionClick();
    if (_isShiftOneShot) {
      _shifted = false;
      _isShiftOneShot = false;
      notifyListeners();
    }
  }

  Future<void> backspace() async {
    await service.deleteText(1);
    HapticFeedback.selectionClick();
    if (_isShiftOneShot) {
      _shifted = false;
      _isShiftOneShot = false;
      notifyListeners();
    }
  }

  Future<void> backspaceLongPress() async {
    await service.deleteWord();
    HapticFeedback.mediumImpact();
  }

  Future<void> space() async {
    await service.commitText(' ');
    if (_isShiftOneShot) {
      _shifted = false;
      _isShiftOneShot = false;
      notifyListeners();
    }
  }

  Future<void> comma() async {
    await service.commitText(',');
    if (_isShiftOneShot) {
      _shifted = false;
      _isShiftOneShot = false;
      notifyListeners();
    }
  }

  Future<void> period() async {
    await service.commitText('.');
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
    HapticFeedback.lightImpact();
  }

  Future<void> switchKeyboard() async {
    await service.switchKeyboard();
  }

  Future<void> hide() async {
    await service.hideKeyboard();
  }

  Future<void> commitSwipeWord(String word) async {
    await service.commitText(word);
    HapticFeedback.selectionClick();
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
