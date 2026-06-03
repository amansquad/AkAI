import 'dart:async';

import 'package:flutter/services.dart';

enum ImeAction { done, search, go, send, next, previous, unknown }

class EditorState {
  final int inputType;
  final int imeOptions;
  final String? actionLabel;
  final String? packageName;
  final String? hintText;

  const EditorState({
    this.inputType = 0,
    this.imeOptions = 0,
    this.actionLabel,
    this.packageName,
    this.hintText,
  });

  bool get isNumeric => (inputType & 0x0000000F) == 2;

  bool get isPassword =>
      (inputType & 0x000000FF) == 0x12 ||
      (inputType & 0x000000FF) == 0x1F ||
      (inputType & 0x000000FF) == 0x91;

  bool get isEmail => (inputType & 0x0000000F) == 0x21;

  bool get isUri => (inputType & 0x0000000F) == 0x11;

  ImeAction get action {
    if ((imeOptions & 0x00000003) == EditorInfo.imeActionSearchValue) {
      return ImeAction.search;
    } else if ((imeOptions & 0x00000003) == EditorInfo.imeActionGoValue) {
      return ImeAction.go;
    } else if ((imeOptions & 0x00000003) == EditorInfo.imeActionSendValue) {
      return ImeAction.send;
    } else if ((imeOptions & 0x00000003) == EditorInfo.imeActionNextValue) {
      return ImeAction.next;
    } else if ((imeOptions & 0x00000003) == EditorInfo.imeActionPreviousValue) {
      return ImeAction.previous;
    } else if ((imeOptions & 0x00000003) == EditorInfo.imeActionDoneValue) {
      return ImeAction.done;
    }
    return ImeAction.unknown;
  }
}

class EditorInfo {
  static const int imeActionUnspecifiedValue = 0x00000000;
  static const int imeActionNoneValue = 0x00000001;
  static const int imeActionGoValue = 0x00000002;
  static const int imeActionSearchValue = 0x00000003;
  static const int imeActionSendValue = 0x00000004;
  static const int imeActionNextValue = 0x00000005;
  static const int imeActionDoneValue = 0x00000006;
  static const int imeActionPreviousValue = 0x00000007;
}

class AkaiKeyboardService {
  static const MethodChannel _channel =
      MethodChannel('com.akai.keyboard/control');
  static const EventChannel _eventChannel =
      EventChannel('com.akai.keyboard/events');

  final _editorController = StreamController<EditorState>.broadcast();
  final _selectionController =
      StreamController<({int start, int end})>.broadcast();
  final _hapticController = StreamController<void>.broadcast();

  Stream<EditorState> get editorStream => _editorController.stream;
  Stream<({int start, int end})> get selectionStream =>
      _selectionController.stream;
  Stream<void> get hapticStream => _hapticController.stream;

  bool _isImeAttached = false;
  bool get isImeAttached => _isImeAttached;

  void initialize() {
    _eventChannel.receiveBroadcastStream().listen((event) {
      if (event is! Map) return;
      final type = event['type'] as String?;
      switch (type) {
        case 'inputStart':
          _editorController.add(EditorState(
            inputType: event['inputType'] as int? ?? 0,
            imeOptions: event['imeOptions'] as int? ?? 0,
            actionLabel: event['actionLabel'] as String?,
            packageName: event['packageName'] as String?,
            hintText: event['hintText'] as String?,
          ));
          _isImeAttached = true;
          break;
        case 'inputFinish':
          _isImeAttached = false;
          break;
        case 'selectionUpdate':
          _selectionController.add((
            start: event['selectionStart'] as int? ?? 0,
            end: event['selectionEnd'] as int? ?? 0,
          ));
          break;
        case 'haptic':
          _hapticController.add(null);
          break;
      }
    }, onError: (_) {
      _isImeAttached = false;
    });
  }

  Future<void> commitText(String text) async {
    try {
      await _channel.invokeMethod('commitText', {'text': text});
    } on PlatformException {
      // IME not attached
    } on MissingPluginException {
      // IME not attached
    }
  }

  Future<void> deleteText([int count = 1]) async {
    try {
      await _channel.invokeMethod('deleteText', {'count': count});
    } on PlatformException {
      // ignored
    } on MissingPluginException {
      // ignored
    }
  }

  Future<void> deleteWord() async {
    try {
      await _channel.invokeMethod('deleteWord');
    } on PlatformException {
      // ignored
    } on MissingPluginException {
      // ignored
    }
  }

  Future<void> performAction(String action) async {
    try {
      await _channel.invokeMethod('performAction', {'action': action});
    } on PlatformException {
      // ignored
    } on MissingPluginException {
      // ignored
    }
  }

  Future<void> switchKeyboard() async {
    try {
      await _channel.invokeMethod('switchKeyboard');
    } on PlatformException {
      // ignored
    } on MissingPluginException {
      // ignored
    }
  }

  Future<void> hideKeyboard() async {
    try {
      await _channel.invokeMethod('hideKeyboard');
    } on PlatformException {
      // ignored
    } on MissingPluginException {
      // ignored
    }
  }

  Future<Map<String, dynamic>?> getEditorState() async {
    try {
      final res = await _channel.invokeMethod('getEditorState');
      if (res is Map) return Map<String, dynamic>.from(res);
    } on PlatformException {
      // ignored
    } on MissingPluginException {
      // ignored
    }
    return null;
  }

  Future<Map<String, String>?> getCursorContext() async {
    try {
      final res = await _channel.invokeMethod('getCursorInfo');
      if (res is Map) {
        return {
          'textBefore': (res['textBefore'] as String?) ?? '',
          'textAfter': (res['textAfter'] as String?) ?? '',
        };
      }
    } on PlatformException {
      // ignored
    } on MissingPluginException {
      // ignored
    }
    return null;
  }

  Future<void> sendKey(int keyCode) async {
    try {
      await _channel.invokeMethod('sendKey', {'keyCode': keyCode});
    } on PlatformException {
      // ignored
    } on MissingPluginException {
      // ignored
    }
  }

  Future<void> playHaptic() async {
    try {
      await _channel.invokeMethod('playHaptic');
    } on PlatformException {
      // ignored
    } on MissingPluginException {
      // ignored
    }
  }
}
