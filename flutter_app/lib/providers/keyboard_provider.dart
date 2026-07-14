import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/clipboard_item.dart';
import '../app/keyboard/english_dictionary.dart';

enum KeyboardMode {
  keyboard,
  stickers,
  gifs,
  clipboard,
  translate,
  settings,
  handwriting,
}

const Map<String, List<String>> wordToEmoji = {
  'fire': ['🔥', '🧨', '💥'],
  'love': ['❤️', '😍', '🥰', '💖'],
  'heart': ['❤️', '💙', '💜'],
  'cool': ['😎', '🆒', '🧊'],
  'cat': ['🐱', '🐈', '😸'],
  'dog': ['🐶', '🐕', '🐩'],
  'sun': ['☀️', '🌞', '🌅'],
  'moon': ['🌙', '🌕', '🌛'],
  'star': ['⭐', '🌟', '✨'],
  'happy': ['😀', '😊', '🥳'],
  'sad': ['😢', '😔', '😭'],
  'angry': ['😡', '😠', '🤬'],
  'laugh': ['😂', '🤣', '😆'],
  'cry': ['😭', '😢', '😿'],
  'clap': ['👏', '🙌', '👏👏'],
  'food': ['🍎', '🍔', '🍕', '🥘'],
  'coffee': ['☕', '🍵', '🍩'],
  'beer': ['🍺', '🍻', '🥂'],
  'car': ['🚗', '🏎️', '🚓'],
  'home': ['🏠', '🏡', '🏘️'],
  'work': ['💼', '💻', '🏢'],
  'code': ['💻', '📜', '👾'],
  'music': ['🎵', '🎶', '🎸'],
  'game': ['🎮', '🕹️', '🎲'],
  'book': ['📖', '📚', '🔖'],
  'time': ['⏰', '⏳', '⌚'],
  'phone': ['📱', '📞', '☎️'],
  'money': ['💰', '💵', '💸'],
  'gift': ['🎁', '🎈', '🎉'],
  'party': ['🎉', '🥳', '🎈'],
  'flag': ['🏴', '🏳️', '🚩'],
};

enum KeyboardLanguage {
  english,
  amharic,
}

class KeyboardProvider with ChangeNotifier {
  String _text = '';
  KeyboardMode _mode = KeyboardMode.keyboard;
  KeyboardLanguage _language = KeyboardLanguage.english;
  bool _shiftActive = false;
  bool _symbolsActive = false;
  bool _capsLockActive = false;
  List<String> _suggestions = [];
  List<ClipboardItem> _clipboardHistory = [];
  
  // Recent Content
  List<String> _recentEmojis = [];
  List<String> _recentGifs = [];
  
  // Search State
  String _searchQuery = '';
  bool _isSearching = false;
  KeyboardMode _searchSourceMode = KeyboardMode.stickers;

  String get text => _text;
  KeyboardMode get mode => _mode;
  KeyboardLanguage get language => _language;
  bool get shiftActive => _shiftActive;
  bool get symbolsActive => _symbolsActive;
  bool get capsLockActive => _capsLockActive;
  List<String> get suggestions => _suggestions;
  List<ClipboardItem> get clipboardHistory => _clipboardHistory;
  List<String> get recentEmojis => _recentEmojis;
  List<String> get recentGifs => _recentGifs;
  String get searchQuery => _searchQuery;
  bool get isSearching => _isSearching;
  KeyboardMode get searchSourceMode => _searchSourceMode;

  KeyboardProvider() {
    _loadStoredData();
  }

  void updateText(String newText) {
    _text = newText;
    _updateSuggestions();
    notifyListeners();
  }

  void appendText(String addition) {
    _text += addition;
    _updateSuggestions();
    notifyListeners();
  }

  void addEmojiToRecent(String emoji) {
    _recentEmojis.remove(emoji);
    _recentEmojis.insert(0, emoji);
    if (_recentEmojis.length > 32) _recentEmojis = _recentEmojis.sublist(0, 32);
    _saveRecentContent();
    notifyListeners();
  }

  void addGifToRecent(String gifUrl) {
    _recentGifs.remove(gifUrl);
    _recentGifs.insert(0, gifUrl);
    if (_recentGifs.length > 20) _recentGifs = _recentGifs.sublist(0, 20);
    _saveRecentContent();
    notifyListeners();
  }

  void deleteCharacter() {
    if (_isSearching) {
      if (_searchQuery.isNotEmpty) {
        _searchQuery = _searchQuery.substring(0, _searchQuery.length - 1);
        notifyListeners();
      }
      return;
    }
    if (_text.isNotEmpty) {
      _text = _text.substring(0, _text.length - 1);
      _updateSuggestions();
      notifyListeners();
    }
  }

  void insertCharacter(String char) {
    String finalChar = char;
    if (_shiftActive || _capsLockActive) {
      if (char.length == 1 && RegExp(r'[a-z]').hasMatch(char)) {
        finalChar = char.toUpperCase();
      }
    }
    
    if (_isSearching) {
      _searchQuery += finalChar;
      notifyListeners();
      return;
    }

    _text += finalChar;
    if (_shiftActive && !_capsLockActive) {
      _shiftActive = false;
    }
    _updateSuggestions();
    notifyListeners();
  }

  void insertSpace() {
    if (_isSearching) {
      _searchQuery += ' ';
      notifyListeners();
      return;
    }
    _text += ' ';
    _updateSuggestions();
    notifyListeners();
  }

  void insertNewline() {
    if (_isSearching) {
      finishSearch(_searchSourceMode);
      return;
    }
    _text += '\n';
    _updateSuggestions();
    notifyListeners();
  }

  void toggleShift() {
    _shiftActive = !_shiftActive;
    notifyListeners();
  }

  void toggleCapsLock() {
    _capsLockActive = !_capsLockActive;
    _shiftActive = _capsLockActive;
    notifyListeners();
  }

  void toggleSymbols() {
    _symbolsActive = !_symbolsActive;
    notifyListeners();
  }

  void setMode(KeyboardMode newMode) {
    _mode = newMode;
    if (newMode == KeyboardMode.keyboard) {
       _isSearching = false;
    }
    notifyListeners();
  }

  void startSearch(KeyboardMode sourceMode) {
    _isSearching = true;
    _searchSourceMode = sourceMode;
    _mode = KeyboardMode.keyboard;
    _searchQuery = '';
    notifyListeners();
  }

  void updateSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void finishSearch(KeyboardMode targetMode) {
    _isSearching = false;
    _mode = targetMode;
    notifyListeners();
  }

  void toggleLanguage() {
    _language = _language == KeyboardLanguage.english
        ? KeyboardLanguage.amharic
        : KeyboardLanguage.english;
    _symbolsActive = false;
    notifyListeners();
  }

  void applySuggestion(String suggestion) {
    final words = _text.trim().split(RegExp(r'\s+'));
    if (words.isNotEmpty && words.last.isNotEmpty && !_text.endsWith(' ')) {
      words[words.length - 1] = suggestion;
      _text = '${words.join(' ')} ';
    } else {
      _text += '$suggestion ';
    }
    _updateSuggestions();
    notifyListeners();
  }

  // Clipboard Overhaul
  void addToClipboard(String content, {ClipboardType type = ClipboardType.text}) {
    if (content.isEmpty) return;
    
    // Remove duplicate if exists (to move it to top)
    _clipboardHistory.removeWhere((item) => item.content == content && item.type == type);
    
    _clipboardHistory.insert(0, ClipboardItem(
      content: content,
      type: type,
      timestamp: DateTime.now(),
    ));

    // Limit unpinned items to 30
    final pinned = _clipboardHistory.where((i) => i.isPinned).toList();
    final unpinned = _clipboardHistory.where((i) => !i.isPinned).take(30).toList();
    _clipboardHistory = [...pinned, ...unpinned];
    
    _saveClipboardHistory();
    notifyListeners();
  }

  void togglePinClip(ClipboardItem item) {
    item.isPinned = !item.isPinned;
    _saveClipboardHistory();
    notifyListeners();
  }

  void deleteClip(ClipboardItem item) {
    _clipboardHistory.remove(item);
    _saveClipboardHistory();
    notifyListeners();
  }

  void clearUnpinnedClips() {
    _clipboardHistory.removeWhere((item) => !item.isPinned);
    _saveClipboardHistory();
    notifyListeners();
  }

  void _updateSuggestions() {
    final words = _text.trim().split(RegExp(r'\s+'));
    final lastWord = words.isNotEmpty ? words.last.toLowerCase() : '';
    
    if (lastWord.isEmpty) {
      _suggestions = [];
      return;
    }

    final List<String> matches = [];

    // 1. Emoji Matches (Exact keyword match)
    if (wordToEmoji.containsKey(lastWord)) {
      matches.addAll(wordToEmoji[lastWord]!);
    }

    // 2. Dictionary Matches (Prefix matching)
    // We prioritize shorter words or exact matches if relevant, 
    // but here we just take the first few alphabetical or common ones.
    final dictionaryMatches = englishWords
        .where((word) => word.toLowerCase().startsWith(lastWord) && word.toLowerCase() != lastWord)
        .take(6)
        .toList();
    
    matches.addAll(dictionaryMatches);

    // 3. Fallback suffix logic (only if we have space)
    if (matches.length < 3) {
      matches.addAll([
        '${lastWord}ing',
        '${lastWord}ed',
        '${lastWord}s',
      ]);
    }
    
    _suggestions = matches.toSet().take(6).toList();
  }

  Future<void> _loadStoredData() async {
    final prefs = await SharedPreferences.getInstance();
    
    final clipsJson = prefs.getString('clipboard_history_v2');
    if (clipsJson != null) {
      final List<dynamic> decoded = jsonDecode(clipsJson);
      _clipboardHistory = decoded.map((j) => ClipboardItem.fromJson(j)).toList();
    } else {
      // Migrate old data if any
      final oldClips = prefs.getStringList('clipboard_history') ?? [];
      _clipboardHistory = oldClips.map((c) => ClipboardItem(content: c, type: ClipboardType.text, timestamp: DateTime.now())).toList();
    }

    _recentEmojis = prefs.getStringList('recent_emojis') ?? [];
    _recentGifs = prefs.getStringList('recent_gifs') ?? [];
    notifyListeners();
  }

  Future<void> _saveClipboardHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(_clipboardHistory.map((i) => i.toJson()).toList());
    await prefs.setString('clipboard_history_v2', encoded);
  }

  Future<void> _saveRecentContent() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('recent_emojis', _recentEmojis);
    await prefs.setStringList('recent_gifs', _recentGifs);
  }

  void clearText() {
    _text = '';
    _suggestions = [];
    notifyListeners();
  }

  int get characterCount => _text.length;
  int get wordCount => _text.trim().split(RegExp(r'\s+')).where((String w) => w.isNotEmpty).length;
}
