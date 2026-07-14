import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/settings_provider.dart';
import '../app/theme/app_theme.dart';
import '../models/clipboard_item.dart';

class SamsungKeyboardLayout extends StatefulWidget {
  const SamsungKeyboardLayout({super.key});

  @override
  State<SamsungKeyboardLayout> createState() => _SamsungKeyboardLayoutState();
}

class _SamsungKeyboardLayoutState extends State<SamsungKeyboardLayout> {
  String? _longPressKey;
  Offset? _longPressPosition;
  String? _selectedConsonant;
  int _symbolPage = 0; // 0 = first page, 1 = second page

  static const List<List<String>> qwertyRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  static const List<String> numberRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  static const List<List<String>> symbolRows1 = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['!', '@', '#', r'$', '%', '^', '&', '*', '+', '='],
    ['-', '_', '/', '\\', '|', '(', ')', '[', ']', '{', '}'],
    ['🇪🇹', '❤️', '🤝', '🙌', '🙏', '👏', '💪', '🚀', '🌈', '📍'],
  ];
 
  static const List<List<String>> symbolRows2 = [
    ['~', '`', '¡', '¿', '§', '¶', '·', '°', '±', '÷', '×'],
    ['£', '€', '¥', '¢', '₹', '₽', '₩', '₪', '฿', '₦'],
    ['<', '>', '«', '»', '‹', '›', '≤', '≥', '≠', '≈'],
    ['♪', '♫', '🥁', '🎸', '🎨', '⚽', '🏆', '👑', '🔥', '✨'],
  ];
 
  static const List<List<String>> symbolRows3 = [
    ['√', 'π', '∆', 'Ω', 'μ', 'λ', 'θ', 'φ', '∞', '∂'],
    ['©', '®', '™', '℅', '№', '†', '‡', '¤', '¦', '…'],
    ['°', '•', '○', '●', '□', '■', '♤', '♡', '◇', '♧'],
    ['🦁', '🏛️', '⛪', '🕌', '🕍', '✝️', '☪️', '✡️', '⭐', '💎'],
  ];
 
  static const List<List<String>> amharicSymbolRows1 = [
    ['፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱', '፲'],
    ['!', '@', '#', r'$', '%', '^', '&', '*', '+', '='],
    ['፡', '።', '፤', '፥', '፦', '፧', '፨', '[', ']', '{', '}'],
    ['🇪🇹', '❤️', '🤝', '🙌', '🙏', '👏', '💪', '🚀', '🌈', '📍'],
  ];
 
  static const List<List<String>> amharicSymbolRows2 = [
    ['~', '`', '¡', '¿', '§', '¶', '·', '°', '±', '÷', '×'],
    ['£', '€', '¥', '¢', '₹', '₽', '₩', '₪', '฿', '₦'],
    ['<', '>', '«', '»', '‹', '›', '≤', '≥', '≠', '≈'],
    ['♪', '♫', '🥁', '🎸', '🎨', '⚽', '🏆', '👑', '🔥', '✨'],
  ];
 
  static const List<List<String>> amharicSymbolRows3 = [
    ['√', 'π', '∆', 'Ω', 'μ', 'λ', 'θ', 'φ', '∞', '∂'],
    ['©', '®', '™', '℅', '№', '†', '‡', '¤', '¦', '…'],
    ['°', '•', '○', '●', '□', '■', '♤', '♡', '◇', '♧'],
    ['🦁', '🏛️', '⛪', '🕌', '🕍', '✝️', '☪️', '✡️', '⭐', '💎'],
  ];

  static const List<List<String>> amharicRows = [
    ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ'],
    ['ተ', 'ቸ', 'ኀ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ', 'ዐ'],
    ['ዘ', 'ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጐ', 'ጠ', 'ጨ', 'ጰ'],
    ['ጸ', 'ፀ', 'ፐ', 'ቨ', 'ፈ', 'ጘ', 'ኰ', 'ጐ'],
  ];

  static const Map<String, List<String>> longPressAlternates = {
    'q': ['!', 'q'],
    'w': ['@', 'w'],
    'e': ['#', 'e', 'è', 'é', 'ê', 'ë', '€'],
    'r': [r'$', 'r'],
    't': ['%', 't'],
    'y': ['^', 'y', 'ÿ'],
    'u': ['&', 'u', 'û', 'ü', 'ù', 'ú'],
    'i': ['*', 'i', 'î', 'ï', 'ì', 'í'],
    'o': ['(', 'o', 'ô', 'ö', 'ò', 'ó', 'œ', 'ø'],
    'p': [')', 'p'],
    'a': ['a', 'à', 'á', 'â', 'ã', 'ä', 'å', 'æ'],
    's': ['s', 'ß', 'ś', 'š'],
    'd': ['d', 'ð'],
    'z': ['z', 'ź', 'ž'],
    'c': ['c', 'ç', 'ć', 'č'],
    'n': ['n', 'ñ', 'ń'],
    '-': ['–', '—', '•', '·'],
    '\$': ['€', '£', '¥', '₹', '₩', '₽', '¢', '₪'],
    '!': ['¡', '‼', '⁉'],
    '?': ['¿', '⁇', '⁈', '⁉'],
    '%': ['‰', 'ⱱ'],
    '+': ['±', '∓'],
    '=': ['≈', '≠', '≡', '≤', '≥'],
    'ሀ': ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'],
    'ለ': ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ', 'ሏ'],
    'ሐ': ['ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ', 'ሗ'],
    'መ': ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ', 'ሟ'],
    'ሠ': ['ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ', 'ሧ'],
    'ረ': ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ', 'ሯ'],
    'ሰ': ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ', 'ሷ'],
    'ሸ': ['ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ', 'ሿ'],
    'ቀ': ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ', 'ቇ'],
    'በ': ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ', 'ቧ'],
    'ተ': ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ', 'ቷ'],
    'ቸ': ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ', 'ቿ'],
    'ነ': ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ', 'ኗ'],
    'ኘ': ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ', 'ኟ'],
    'አ': ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ', 'ኧ'],
    'ከ': ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ', 'ኯ'],
    'ዘ': ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ', 'ዟ'],
    'ዠ': ['ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ', 'ዧ'],
    'የ': ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ', 'ዯ'],
    'ደ': ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ', 'ዷ'],
    'ጀ': ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ', 'ጇ'],
    'ገ': ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ', 'ጏ'],
    'ጠ': ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ', 'ጧ'],
    'ጨ': ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ', 'ጯ'],
    'ጰ': ['ጰ', 'ጱ', 'ጲ', 'ጳ', 'ጴ', 'ጵ', 'ጶ', 'ጷ'],
    'ጸ': ['ጸ', 'ጹ', 'ጺ', 'ጻ', 'ጼ', 'ጽ', 'ጾ', 'ጿ'],
    'ፀ': ['ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ', 'ፆ', 'ፇ'],
    'ፈ': ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ', 'ፏ'],
    'ፐ': ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ', 'ፗ'],
  };

  @override
  Widget build(BuildContext context) {
    final language = context.watch<KeyboardProvider>().language;
    final symbolsActive = context.watch<KeyboardProvider>().symbolsActive;
    final showNumberRow = context.watch<SettingsProvider>().showNumberRow;
    final theme = context.watch<ThemeProvider>().currentTheme;
    final isAmharic = language == KeyboardLanguage.amharic;

    List<List<String>> rows;
    if (symbolsActive) {
      if (_symbolPage == 0) rows = isAmharic ? amharicSymbolRows1 : symbolRows1;
      else if (_symbolPage == 1) rows = isAmharic ? amharicSymbolRows2 : symbolRows2;
      else rows = isAmharic ? amharicSymbolRows3 : symbolRows3;
    } else {
      rows = isAmharic ? amharicRows : qwertyRows;
    }
    
    // Dynamic Height Calculation: 
    // Amharic (4 rows) + Number Row + Bottom = 6 rows. 6 * 52 = 312 (Overflow!)
    // We adjust height if row count > 5.
    final totalRows = (showNumberRow && !symbolsActive ? 1 : 0) + rows.length + 1;
    final double keyHeight = totalRows > 5 ? 38.0 : 44.0;

    return Stack(
      children: [
        Column(
          children: [
            if (showNumberRow && !symbolsActive)
              _buildNumberRow(context, theme, isAmharic, keyHeight),
            ...rows.asMap().entries.map((entry) => _buildKeyRow(context, theme, entry.value, entry.key, keyHeight)),
            _buildBottomRow(context, theme, language, symbolsActive, keyHeight),
            // Zero bottom gap for flush appearance
          ],
        ),
        if (_longPressKey != null && _longPressPosition != null)
          _buildLongPressPopup(context, theme),
      ],
    );
  }

  Widget _buildNumberRow(BuildContext context, AkaiPalette theme, bool isAmharic, double keyHeight) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 1.0, vertical: 0.5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: (isAmharic ? amharicSymbolRows1[0] : numberRow).map((num) => Expanded(child: _buildKey(context, theme, num, keyHeight))).toList(),
      ),
    );
  }

  Widget _buildKeyRow(BuildContext context, AkaiPalette theme, List<String> row, int rowIndex, double keyHeight) {
    final provider = context.watch<KeyboardProvider>();
    final isQwerty = !provider.symbolsActive && provider.language == KeyboardLanguage.english;
    final isAmharic = !provider.symbolsActive && provider.language == KeyboardLanguage.amharic;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isQwerty && rowIndex == 1) const Spacer(flex: 5),
        if (isQwerty && rowIndex == 2) ...[
          if (context.watch<SettingsProvider>().showShiftKey)
            Expanded(flex: 12, child: _buildSpecialKey(context, theme, 'shift', '⇧', keyHeight)),
          const SizedBox(width: 2),
        ],
        ...row.map((key) => Expanded(flex: 10, child: _buildKey(context, theme, key, keyHeight))),
        if (isQwerty && rowIndex == 1) const Spacer(flex: 5),
        if (isQwerty && rowIndex == 2) ...[
          const SizedBox(width: 2),
          if (context.watch<SettingsProvider>().showBackspaceKey)
            Expanded(flex: 12, child: _buildSpecialKey(context, theme, 'backspace', '⌫', keyHeight)),
        ],
        if (isAmharic && rowIndex == 3) ...[
          const SizedBox(width: 2),
          if (context.watch<SettingsProvider>().showBackspaceKey)
            Expanded(flex: 15, child: _buildSpecialKey(context, theme, 'backspace', '⌫', keyHeight)),
        ],
      ],
    );
  }

  Widget _buildBottomRow(BuildContext context, AkaiPalette theme, KeyboardLanguage language, bool symbolsActive, double keyHeight) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 0.5),
      child: Row(
        children: [
          if (context.watch<SettingsProvider>().showSymbolsKey) ...[
            Expanded(
              flex: 4,
              child: _buildSpecialKey(context, theme, symbolsActive ? 'symbol_page' : 'symbols', symbolsActive ? '${_symbolPage + 1}/3' : '?123', keyHeight),
            ),
            const SizedBox(width: 2),
          ],
          if (context.watch<SettingsProvider>().showLanguageKey) ...[
            Expanded(
              flex: 3,
              child: _buildSpecialKey(context, theme, 'language', language == KeyboardLanguage.english ? 'EN' : 'አማ', keyHeight),
            ),
            const SizedBox(width: 2),
          ],
          if (context.watch<SettingsProvider>().showCommaKey) ...[
            Expanded(flex: 3, child: _buildSpecialKey(context, theme, 'comma', ',', keyHeight)),
            const SizedBox(width: 2),
          ],
          Expanded(
            flex: 14,
            child: _buildSpecialKey(context, theme, 'space', 'Space', keyHeight),
          ),
          if (context.watch<SettingsProvider>().showPeriodKey) ...[
            const SizedBox(width: 2),
            Expanded(flex: 3, child: _buildSpecialKey(context, theme, 'period', '.', keyHeight)),
          ],
          if (context.watch<SettingsProvider>().showEnterKey) ...[
            const SizedBox(width: 2),
            Expanded(flex: 4, child: _buildSpecialKey(context, theme, 'enter', '↵', keyHeight)),
          ],
        ],
      ),
    );
  }

  Widget _buildKey(BuildContext context, AkaiPalette theme, String key, double keyHeight) {
    final provider = context.watch<KeyboardProvider>();
    final label = provider.shiftActive ? key.toUpperCase() : key;
    final hasAlts = longPressAlternates.containsKey(key);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 1.0, vertical: 1.0),
      child: GestureDetector(
        onTap: () => _handleKeyPress(context, key),
        onLongPressStart: (details) {
          if (hasAlts) {
            setState(() {
              _longPressKey = key;
              _longPressPosition = details.globalPosition;
            });
          }
        },
        child: Container(
          height: keyHeight,
          decoration: BoxDecoration(
            color: theme.name == 'Matrix' ? theme.key.withOpacity(0.3) : theme.key,
            borderRadius: BorderRadius.circular(8),
            boxShadow: theme.name == 'Matrix' 
                ? [BoxShadow(color: theme.accent.withOpacity(0.1), blurRadius: 2, spreadRadius: 0)]
                : [BoxShadow(color: Colors.black26, blurRadius: 1, offset: const Offset(0, 1))],
          ),
          child: Stack(
            children: [
              Center(
                child: Text(label, style: TextStyle(color: theme.keyText, fontSize: 18, fontWeight: FontWeight.w500)),
              ),
              if (hasAlts)
                Positioned(
                  top: 2,
                  right: 4,
                  child: Text(
                    longPressAlternates[key]![0],
                    style: TextStyle(color: theme.accent.withOpacity(0.5), fontSize: 8, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSpecialKey(BuildContext context, AkaiPalette theme, String key, String label, double keyHeight) {
    final provider = context.watch<KeyboardProvider>();
    Widget content;

    if (key == 'backspace') {
      content = Icon(Icons.backspace_outlined, color: theme.keyText, size: 19);
    } else if (key == 'shift') {
      content = Icon(
        provider.shiftActive ? Icons.keyboard_capslock_rounded : Icons.keyboard_arrow_up_rounded,
        color: provider.shiftActive ? theme.accent : theme.keyText,
        size: 24,
      );
    } else if (key == 'enter') {
      content = Icon(Icons.keyboard_return_rounded, color: theme.keyText, size: 22);
    } else if (key == 'language') {
      content = Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.language_rounded, size: 14, color: theme.keyText.withOpacity(0.7)),
          Text(label, style: TextStyle(color: theme.keyText, fontSize: 9, fontWeight: FontWeight.bold)),
        ],
      );
    } else {
      content = Text(
        label,
        style: TextStyle(
          color: theme.keyText,
          fontSize: key == 'space' ? 14 : 16,
          fontWeight: FontWeight.bold,
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 1.2, vertical: 1.0),
      child: GestureDetector(
        onTap: () => _handleKeyPress(context, key),
        child: Container(
          height: keyHeight,
          decoration: BoxDecoration(
            color: theme.keySecondary,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 1,
                offset: const Offset(0, 1),
              )
            ],
          ),
          child: Center(child: content),
        ),
      ),
    );
  }

  void _handleKeyPress(BuildContext context, String key) {
    final provider = context.read<KeyboardProvider>();
    if (key == 'shift') provider.toggleShift();
    else if (key == 'backspace') provider.deleteCharacter();
    else if (key == 'symbols') provider.toggleSymbols();
    else if (key == 'symbol_page') {
      setState(() => _symbolPage = (_symbolPage + 1) % 3);
    }
    else if (key == 'language') provider.toggleLanguage();
    else if (key == 'space') provider.insertSpace();
    else if (key == 'enter') provider.insertNewline();
    else if (key == 'comma') provider.insertCharacter(',');
    else if (key == 'period') provider.insertCharacter('.');
    else provider.insertCharacter(key);
  }

  Widget _buildLongPressPopup(BuildContext context, AkaiPalette theme) {
    final alts = longPressAlternates[_longPressKey]!;
    return Positioned.fill(
      child: GestureDetector(
        onTap: () => setState(() => _longPressKey = null),
        child: Container(
          color: Colors.black45,
          child: Center(
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: theme.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: theme.accent.withOpacity(0.3))),
              child: Wrap(
                spacing: 8,
                children: alts.map((alt) => GestureDetector(
                  onTap: () {
                    _handleKeyPress(context, alt);
                    setState(() => _longPressKey = null);
                  },
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(color: theme.key, borderRadius: BorderRadius.circular(8)),
                    child: Center(child: Text(alt, style: TextStyle(color: theme.keyText, fontSize: 18))),
                  ),
                )).toList(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
