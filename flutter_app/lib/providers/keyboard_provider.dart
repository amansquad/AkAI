import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/clipboard_item.dart';
import '../app/emoji/emoji_suggestions.dart';
import '../app/keyboard/english_dictionary.dart';
import '../app/keyboard/keyboard_service.dart';
import '../services/gif_service.dart';

enum KeyboardMode {
  keyboard,
  stickers,
  gifs,
  clipboard,
  translate,
  settings,
  handwriting,
}

/// Previous word → likely next words, used for predictions after a space.
const Map<String, List<String>> _nextWords = {
  'i': ['am', 'will', 'have', 'love'],
  "i'm": ['not', 'so', 'good', 'on'],
  'im': ['not', 'so', 'good', 'on'],
  'how': ['are', 'is', 'do', 'was'],
  'you': ['are', 'can', 'know', 'will'],
  'we': ['are', 'can', 'will', 'have'],
  'they': ['are', 'will', 'have'],
  'thank': ['you', 'god'],
  'thanks': ['for', 'so', 'a'],
  'good': ['morning', 'night', 'luck', 'job'],
  'see': ['you', 'it', 'the'],
  'let': ['me', 'us', 'it'],
  'what': ['is', 'are', 'do', 'about'],
  'where': ['are', 'is', 'do'],
  'when': ['are', 'is', 'will'],
  'can': ['you', 'i', 'we'],
  'will': ['be', 'you', 'not'],
  'would': ['you', 'be', 'like'],
  'love': ['you', 'it', 'this'],
  'miss': ['you', 'it'],
  'happy': ['birthday', 'to', 'for'],
  'no': ['problem', 'way', 'one'],
  'not': ['sure', 'yet', 'now'],
  'be': ['there', 'back', 'careful'],
  'have': ['a', 'to', 'you'],
  'had': ['a', 'to', 'no'],
  'has': ['been', 'a', 'to'],
  'was': ['it', 'that', 'a'],
  'is': ['it', 'that', 'the'],
  'are': ['you', 'we', 'they'],
  'it': ['is', 'was', 'will'],
  'this': ['is', 'was', 'one'],
  'that': ['is', 'was', 'sounds'],
  'so': ['much', 'good', 'i'],
  'very': ['good', 'nice', 'much'],
  'my': ['name', 'phone', 'house'],
  'your': ['name', 'turn', 'phone'],
  'the': ['best', 'same', 'one'],
  'a': ['lot', 'bit', 'few'],
  'in': ['the', 'a', 'my'],
  'on': ['the', 'my', 'a'],
  'at': ['the', 'home', 'work'],
  'to': ['be', 'the', 'get', 'go'],
  'of': ['the', 'course', 'my'],
  'for': ['the', 'you', 'me'],
  'and': ['then', 'the', 'i'],
  'talk': ['to', 'soon', 'later'],
  'call': ['me', 'you', 'back'],
  'text': ['me', 'you', 'back'],
  'come': ['on', 'over', 'back'],
  'go': ['to', 'home', 'back'],
  'going': ['to', 'home', 'out'],
  'want': ['to', 'it', 'some'],
  'need': ['to', 'a', 'you'],
  'right': ['now', 'away', 'there'],
  'about': ['it', 'the', 'you'],
  'sounds': ['good', 'great', 'like'],
  'looking': ['forward', 'for', 'at'],
  'nice': ['to', 'one', 'work'],
  'great': ['job', 'work', 'news'],
  'well': ['done', 'said'],
  'take': ['care', 'it', 'a'],
  'on my': ['way'],
};

/// Suggestions offered when there is nothing to complete or predict yet.
const List<String> _starterWords = ['I', 'The', 'Hello', 'Thanks', 'How', 'What'];

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

  KeyboardProvider({this.imeMode = false}) {
    _loadStoredData();
    if (imeMode) _initImeBridge();
  }

  /// True when running inside the Android IME service. Every edit is then
  /// also committed to the focused app through the platform channel — the
  /// local [_text] acts as a mirror used for suggestions and auto-shift.
  final bool imeMode;
  final AkaiKeyboardService ime = AkaiKeyboardService();

  bool _autoCapEnabled = true;
  bool _hapticsEnabled = true;
  double _vibrationIntensity = 0.5;
  bool _doubleSpacePeriodEnabled = true;
  DateTime? _lastSpaceAt;
  Map<String, int> _learnedWords = {};

  void _initImeBridge() {
    ime.initialize();
    ime.editorStream.listen((_) => _onInputStart());
  }

  /// A new field gained focus: seed the mirror with the field's existing
  /// text and refresh setting mirrors (they may have changed in the app).
  Future<void> _onInputStart() async {
    await _reloadTypingSettings();
    final ctx = await ime.getCursorContext();
    _text = ctx?['textBefore'] ?? '';
    _lastSpaceAt = null;
    _capsLockActive = false;
    _shiftActive = false;
    _updateAutoShift();
    _updateSuggestions();
    notifyListeners();
  }

  Future<void> _reloadTypingSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.reload();
      _autoCapEnabled = prefs.getBool('auto_capitalization') ?? true;
      _hapticsEnabled = prefs.getBool('vibrate_on_key_press') ?? true;
      _vibrationIntensity = prefs.getDouble('vibration_intensity') ?? 0.5;
      _doubleSpacePeriodEnabled = prefs.getBool('double_space_period') ?? true;
    } catch (_) {}
  }

  void _haptic() {
    if (!_hapticsEnabled) return;
    if (imeMode) {
      ime.playHaptic();
    } else if (_vibrationIntensity < 0.4) {
      HapticFeedback.lightImpact();
    } else if (_vibrationIntensity < 0.75) {
      HapticFeedback.mediumImpact();
    } else {
      HapticFeedback.heavyImpact();
    }
  }

  /// Enable shift at sentence starts when auto-capitalization is on.
  void _updateAutoShift() {
    if (!_autoCapEnabled ||
        _capsLockActive ||
        _language != KeyboardLanguage.english) {
      return;
    }
    if (_text.isEmpty ||
        _text.endsWith('\n') ||
        RegExp(r'[.!?]\s+$').hasMatch(_text)) {
      _shiftActive = true;
    }
  }

  // ── Personal dictionary ────────────────────────────────────────────────

  void _learnLastWord() {
    final m = RegExp(r'([A-Za-zሀ-፿]{3,})$').firstMatch(_text);
    if (m != null) _learnWord(m.group(1)!);
  }

  void _learnWord(String word) {
    final w = word.toLowerCase();
    if (!RegExp(r'^[a-zሀ-፿]{3,}$').hasMatch(w)) return;
    _learnedWords[w] = (_learnedWords[w] ?? 0) + 1;
    if (_learnedWords.length > 600) {
      final entries = _learnedWords.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      _learnedWords = Map.fromEntries(entries.take(400));
    }
    _saveLearnedWords();
  }

  Future<void> _saveLearnedWords() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('learned_words_v1', jsonEncode(_learnedWords));
  }

  void updateText(String newText) {
    _text = newText;
    _updateSuggestions();
    notifyListeners();
  }

  void appendText(String addition) {
    _text += addition;
    if (imeMode) ime.commitText(addition);
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

  /// Insert a GIF like Gboard does: as real inline image content when the
  /// focused editor accepts image/gif (chat apps), otherwise fall back to
  /// committing the Giphy link as text.
  Future<void> insertGif(String url, {String title = 'GIF', String? id}) async {
    if (imeMode && await ime.canCommitImage()) {
      final path = await GifService.downloadToCache(url, id ?? title);
      if (path != null && await ime.commitGifFile(path, description: title)) {
        return;
      }
    }
    appendText('$url ');
  }

  void deleteCharacter() {
    if (_isSearching) {
      if (_searchQuery.isNotEmpty) {
        _searchQuery = _searchQuery.substring(0, _searchQuery.length - 1);
        notifyListeners();
      }
      return;
    }
    _haptic();
    if (_text.isNotEmpty) {
      _text = _text.substring(0, _text.length - 1);
    }
    // The focused app may hold more text than our mirror — always forward.
    if (imeMode) ime.deleteText(1);
    _updateAutoShift();
    _updateSuggestions();
    notifyListeners();
  }

  void insertCharacter(String char) {
    String finalChar = char;
    if (_shiftActive || _capsLockActive) {
      if (char.length == 1 && RegExp(r'[a-z]').hasMatch(char)) {
        finalChar = char.toUpperCase();
      }
    }

    _haptic();
    if (_isSearching) {
      _searchQuery += finalChar;
      notifyListeners();
      return;
    }

    _text += finalChar;
    if (imeMode) ime.commitText(finalChar);
    if (_shiftActive && !_capsLockActive) {
      _shiftActive = false;
    }
    _updateAutoShift();
    _updateSuggestions();
    notifyListeners();
  }

  void insertSpace() {
    if (_isSearching) {
      _searchQuery += ' ';
      notifyListeners();
      return;
    }
    _haptic();

    // Double-space within 450ms turns "word " into "word. "
    final now = DateTime.now();
    final isDoubleSpace = _doubleSpacePeriodEnabled &&
        _lastSpaceAt != null &&
        now.difference(_lastSpaceAt!) < const Duration(milliseconds: 450) &&
        _text.length >= 2 &&
        _text.endsWith(' ') &&
        RegExp(r'[A-Za-z0-9ሀ-፿]').hasMatch(_text[_text.length - 2]);

    if (isDoubleSpace) {
      _text = '${_text.substring(0, _text.length - 1)}. ';
      if (imeMode) {
        ime.deleteText(1);
        ime.commitText('. ');
      }
      _lastSpaceAt = null;
    } else {
      _learnLastWord();
      _text += ' ';
      if (imeMode) ime.commitText(' ');
      _lastSpaceAt = now;
    }
    _updateAutoShift();
    _updateSuggestions();
    notifyListeners();
  }

  void insertNewline() {
    if (_isSearching) {
      finishSearch(_searchSourceMode);
      return;
    }
    _haptic();
    _learnLastWord();
    _text += '\n';
    // Let the editor decide: performs its IME action (search/send/…) or
    // inserts a newline when no action is set.
    if (imeMode) ime.performAction('enter');
    _updateAutoShift();
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
    _haptic();
    // Emoji suggestions carry no letters; they insert without a trailing
    // space and don't replace a finished word.
    final isEmoji = !RegExp(r'[A-Za-z0-9ሀ-፿]').hasMatch(suggestion);

    // Replace the word currently being composed (if any) with the suggestion.
    // Same boundary rule as _updateSuggestions, so "🍕how" only replaces "how".
    final lastWord = _composingWord;
    if (lastWord.isNotEmpty) {
      _text = _text.substring(0, _text.length - lastWord.length);
    }
    final insert = isEmoji ? suggestion : '$suggestion ';
    _text += insert;
    if (imeMode) {
      if (lastWord.isNotEmpty) ime.deleteText(lastWord.length);
      ime.commitText(insert);
    }
    if (isEmoji) {
      addEmojiToRecent(suggestion);
    } else {
      _learnWord(suggestion);
    }
    _updateAutoShift();
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
    // The word being composed is the trailing run of word characters, so an
    // emoji or punctuation just typed counts as a boundary ("🍕how" → "how").
    final lastWord = _composingWord;
    _suggestions =
        lastWord.isEmpty ? _predictNextWords() : _completeWord(lastWord);
  }

  String get _composingWord =>
      RegExp(r"[A-Za-z0-9ሀ-፿']+$").firstMatch(_text)?.group(0) ?? '';

  /// Completions + emoji for the word currently being typed.
  /// Emoji appear right after the top completion, Gboard-style.
  List<String> _completeWord(String lastWord) {
    final lower = lastWord.toLowerCase();
    final firstChar = lastWord[0];
    final isCapitalized = firstChar.toUpperCase() == firstChar &&
        firstChar.toLowerCase() != firstChar;
    final isAllCaps = lastWord.length > 1 && lastWord.toUpperCase() == lastWord;
    String cased(String w) => isAllCaps
        ? w.toUpperCase()
        : isCapitalized
            ? '${w[0].toUpperCase()}${w.substring(1)}'
            : w;

    final words = <String>[];

    // 1. Personal dictionary: words this user actually types, best first.
    final personal = _learnedWords.keys
        .where((word) => word.startsWith(lower) && word != lower)
        .toList()
      ..sort((a, b) => _learnedWords[b]!.compareTo(_learnedWords[a]!));
    words.addAll(personal.take(2));

    // 2. Built-in dictionary — list order is frequency order.
    for (final word in englishWords) {
      if (words.length >= 4) break;
      final lw = word.toLowerCase();
      if (lw.startsWith(lower) && lw != lower && !words.contains(lw)) {
        words.add(lw);
      }
    }

    // 3. Emoji for the exact word typed so far ("pizza" → 🍕).
    final emojis = EmojiSuggestionEngine.forWord(lastWord).take(2).toList();

    final out = <String>[
      if (words.isNotEmpty) cased(words.first),
      ...emojis,
      ...words.skip(1).map(cased),
    ];
    return out.take(6).toList();
  }

  /// After a word is finished (space typed): emoji for the word just written,
  /// then likely next words.
  List<String> _predictNextWords() {
    final out = <String>[];

    // Strip everything that isn't a word character, so "Pizza." and "🍕how"
    // still resolve to the word they contain.
    String clean(String w) =>
        w.toLowerCase().replaceAll(RegExp(r"[^a-z0-9ሀ-፿']"), '');

    final trailing =
        RegExp(r'(?:(\S+)\s+)?(\S+)\s*$').firstMatch(_text.trimRight());
    final prev = clean(trailing?.group(2) ?? '');
    final prev2 = clean(trailing?.group(1) ?? '');

    // Emoji for the word just completed ("pizza " → 🍕).
    out.addAll(EmojiSuggestionEngine.forWord(prev).take(2));

    // The predictions below are English; in Amharic mode show only emoji.
    if (_language == KeyboardLanguage.amharic) return out.take(6).toList();

    // At the start of a sentence offer capitalized openers instead of
    // continuations of the previous sentence.
    final sentenceStart = _text.trim().isEmpty ||
        RegExp(r'''[.!?]["')\]]*\s*$''').hasMatch(_text);
    if (sentenceStart) {
      return [...out, ..._starterWords].take(6).toList();
    }

    // Next-word predictions: two-word context first, then one-word.
    final bigram = _nextWords['$prev2 $prev'];
    final unigram = _nextWords[prev];
    for (final w in [...?bigram, ...?unigram]) {
      if (!out.contains(w)) out.add(w);
    }

    // Top up with frequent words so the strip is never empty.
    for (final w in const ['the', 'I', 'and', 'to', 'you', 'a']) {
      if (out.length >= 5) break;
      if (!out.contains(w)) out.add(w);
    }
    return out.take(6).toList();
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

    final learned = prefs.getString('learned_words_v1');
    if (learned != null) {
      try {
        _learnedWords = Map<String, int>.from(jsonDecode(learned));
      } catch (_) {}
    }
    _autoCapEnabled = prefs.getBool('auto_capitalization') ?? true;
    _hapticsEnabled = prefs.getBool('vibrate_on_key_press') ?? true;
    _vibrationIntensity = prefs.getDouble('vibration_intensity') ?? 0.5;
    _doubleSpacePeriodEnabled = prefs.getBool('double_space_period') ?? true;
    _updateAutoShift();
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
