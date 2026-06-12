enum KeyKind {
  char,
  shift,
  backspace,
  symbols,
  alphabet,
  enter,
  space,
  globe,
  comma,
  period,
  mic
}
class KeyDef {
  final KeyKind kind;
  final String? primary;
  final String? secondary;
  final String? tertiary;
  final double flex;
  final KeyDef? popup;

  const KeyDef({
    required this.kind,
    this.primary,
    this.secondary,
    this.tertiary,
    this.flex = 1,
    this.popup,
  });

  String get display {
    return primary ?? '';
  }
}

class KeyboardLayout {
  // ── Samsung-style: number row always visible in letters mode ──────────
  static const numberRow = [
    KeyDef(kind: KeyKind.char, primary: '1', secondary: '!'),
    KeyDef(kind: KeyKind.char, primary: '2', secondary: '@'),
    KeyDef(kind: KeyKind.char, primary: '3', secondary: '#'),
    KeyDef(kind: KeyKind.char, primary: '4', secondary: '\$'),
    KeyDef(kind: KeyKind.char, primary: '5', secondary: '%'),
    KeyDef(kind: KeyKind.char, primary: '6', secondary: '^'),
    KeyDef(kind: KeyKind.char, primary: '7', secondary: '&'),
    KeyDef(kind: KeyKind.char, primary: '8', secondary: '*'),
    KeyDef(kind: KeyKind.char, primary: '9', secondary: '('),
    KeyDef(kind: KeyKind.char, primary: '0', secondary: ')'),
  ];

  // ── Samsung-style letters (QWERTY) ────────────────────────────────────
  // Each char key shows a secondary long-press hint matching Samsung layout
  static const letters = [
    [
      KeyDef(kind: KeyKind.char, primary: 'q', secondary: '1'),
      KeyDef(kind: KeyKind.char, primary: 'w', secondary: '2'),
      KeyDef(kind: KeyKind.char, primary: 'e', secondary: '3'),
      KeyDef(kind: KeyKind.char, primary: 'r', secondary: '4'),
      KeyDef(kind: KeyKind.char, primary: 't', secondary: '5'),
      KeyDef(kind: KeyKind.char, primary: 'y', secondary: '6'),
      KeyDef(kind: KeyKind.char, primary: 'u', secondary: '7'),
      KeyDef(kind: KeyKind.char, primary: 'i', secondary: '8'),
      KeyDef(kind: KeyKind.char, primary: 'o', secondary: '9'),
      KeyDef(kind: KeyKind.char, primary: 'p', secondary: '0'),
    ],
    [
      KeyDef(kind: KeyKind.char, primary: 'a', secondary: '@'),
      KeyDef(kind: KeyKind.char, primary: 's', secondary: '#'),
      KeyDef(kind: KeyKind.char, primary: 'd', secondary: '\$'),
      KeyDef(kind: KeyKind.char, primary: 'f', secondary: '%'),
      KeyDef(kind: KeyKind.char, primary: 'g', secondary: '_'),
      KeyDef(kind: KeyKind.char, primary: 'h', secondary: '&'),
      KeyDef(kind: KeyKind.char, primary: 'j', secondary: '-'),
      KeyDef(kind: KeyKind.char, primary: 'k', secondary: '+'),
      KeyDef(kind: KeyKind.char, primary: 'l', secondary: '/'),
    ],
    [
      KeyDef(kind: KeyKind.shift, flex: 1.3),
      KeyDef(kind: KeyKind.char, primary: 'z', secondary: ','),
      KeyDef(kind: KeyKind.char, primary: 'x', secondary: '.'),
      KeyDef(kind: KeyKind.char, primary: 'c', secondary: '!'),
      KeyDef(kind: KeyKind.char, primary: 'v', secondary: '?'),
      KeyDef(kind: KeyKind.char, primary: 'b', secondary: '\''),
      KeyDef(kind: KeyKind.char, primary: 'n', secondary: '"'),
      KeyDef(kind: KeyKind.char, primary: 'm', secondary: ';'),
      KeyDef(kind: KeyKind.backspace, flex: 1.3),
    ],
    [
      KeyDef(kind: KeyKind.symbols, primary: '?123', flex: 1.2),
      KeyDef(kind: KeyKind.comma, primary: ',', secondary: '\''),
      KeyDef(kind: KeyKind.space, primary: 'space', flex: 7.2),
      KeyDef(kind: KeyKind.period, primary: '.', secondary: '?', flex: 1.2),
      KeyDef(kind: KeyKind.enter, flex: 2.0),
    ],
  ];

  static const lettersShifted = [
    [
      KeyDef(kind: KeyKind.char, primary: 'Q', secondary: '1'),
      KeyDef(kind: KeyKind.char, primary: 'W', secondary: '2'),
      KeyDef(kind: KeyKind.char, primary: 'E', secondary: '3'),
      KeyDef(kind: KeyKind.char, primary: 'R', secondary: '4'),
      KeyDef(kind: KeyKind.char, primary: 'T', secondary: '5'),
      KeyDef(kind: KeyKind.char, primary: 'Y', secondary: '6'),
      KeyDef(kind: KeyKind.char, primary: 'U', secondary: '7'),
      KeyDef(kind: KeyKind.char, primary: 'I', secondary: '8'),
      KeyDef(kind: KeyKind.char, primary: 'O', secondary: '9'),
      KeyDef(kind: KeyKind.char, primary: 'P', secondary: '0'),
    ],
    [
      KeyDef(kind: KeyKind.char, primary: 'A', secondary: '@'),
      KeyDef(kind: KeyKind.char, primary: 'S', secondary: '#'),
      KeyDef(kind: KeyKind.char, primary: 'D', secondary: '\$'),
      KeyDef(kind: KeyKind.char, primary: 'F', secondary: '%'),
      KeyDef(kind: KeyKind.char, primary: 'G', secondary: '_'),
      KeyDef(kind: KeyKind.char, primary: 'H', secondary: '&'),
      KeyDef(kind: KeyKind.char, primary: 'J', secondary: '-'),
      KeyDef(kind: KeyKind.char, primary: 'K', secondary: '+'),
      KeyDef(kind: KeyKind.char, primary: 'L', secondary: '/'),
    ],
    [
      KeyDef(kind: KeyKind.shift, flex: 1.3),
      KeyDef(kind: KeyKind.char, primary: 'Z', secondary: ','),
      KeyDef(kind: KeyKind.char, primary: 'X', secondary: '.'),
      KeyDef(kind: KeyKind.char, primary: 'C', secondary: '!'),
      KeyDef(kind: KeyKind.char, primary: 'V', secondary: '?'),
      KeyDef(kind: KeyKind.char, primary: 'B', secondary: '\''),
      KeyDef(kind: KeyKind.char, primary: 'N', secondary: '"'),
      KeyDef(kind: KeyKind.char, primary: 'M', secondary: ';'),
      KeyDef(kind: KeyKind.backspace, flex: 1.3),
    ],
    [
      KeyDef(kind: KeyKind.symbols, primary: '?123', flex: 1.2),
      KeyDef(kind: KeyKind.comma, primary: ',', secondary: '\''),
      KeyDef(kind: KeyKind.space, primary: 'space', flex: 7.2),
      KeyDef(kind: KeyKind.period, primary: '.', secondary: '?', flex: 1.2),
      KeyDef(kind: KeyKind.enter, flex: 2.0),
    ],
  ];

  // ── Samsung-style numbers/symbols pages ───────────────────────────────
  static const numbers = [
    [
      KeyDef(kind: KeyKind.char, primary: '1', secondary: '!'),
      KeyDef(kind: KeyKind.char, primary: '2', secondary: '@'),
      KeyDef(kind: KeyKind.char, primary: '3', secondary: '#'),
      KeyDef(kind: KeyKind.char, primary: '4', secondary: '\$'),
      KeyDef(kind: KeyKind.char, primary: '5', secondary: '%'),
      KeyDef(kind: KeyKind.char, primary: '6', secondary: '^'),
      KeyDef(kind: KeyKind.char, primary: '7', secondary: '&'),
      KeyDef(kind: KeyKind.char, primary: '8', secondary: '*'),
      KeyDef(kind: KeyKind.char, primary: '9', secondary: '('),
      KeyDef(kind: KeyKind.char, primary: '0', secondary: ')'),
    ],
    [
      KeyDef(kind: KeyKind.char, primary: '-', secondary: '_'),
      KeyDef(kind: KeyKind.char, primary: '/', secondary: '\\'),
      KeyDef(kind: KeyKind.char, primary: ':', secondary: ';'),
      KeyDef(kind: KeyKind.char, primary: ';', secondary: ':'),
      KeyDef(kind: KeyKind.char, primary: '(', secondary: '['),
      KeyDef(kind: KeyKind.char, primary: ')', secondary: ']'),
      KeyDef(kind: KeyKind.char, primary: '\$', secondary: '€'),
      KeyDef(kind: KeyKind.char, primary: '&', secondary: '@'),
      KeyDef(kind: KeyKind.char, primary: '@', secondary: '+'),
    ],
    [
      KeyDef(kind: KeyKind.symbols, primary: '#+=', secondary: '#+=', flex: 1.3),
      KeyDef(kind: KeyKind.char, primary: '"', secondary: '\''),
      KeyDef(kind: KeyKind.char, primary: '\'', secondary: '"'),
      KeyDef(kind: KeyKind.char, primary: '!', secondary: '?'),
      KeyDef(kind: KeyKind.char, primary: '?', secondary: '!'),
      KeyDef(kind: KeyKind.char, primary: '%', secondary: '‰'),
      KeyDef(kind: KeyKind.char, primary: '*', secondary: '^'),
      KeyDef(kind: KeyKind.char, primary: '+', secondary: '='),
      KeyDef(kind: KeyKind.backspace, flex: 1.3),
    ],
    [
      KeyDef(kind: KeyKind.alphabet, flex: 1.2),
      KeyDef(kind: KeyKind.comma, primary: ',', secondary: '\''),
      KeyDef(kind: KeyKind.space, primary: 'space', flex: 7.2),
      KeyDef(kind: KeyKind.period, primary: '.', secondary: '?', flex: 1.2),
      KeyDef(kind: KeyKind.enter, flex: 2.0),
    ],
  ];

  static const symbols = [
    [
      KeyDef(kind: KeyKind.char, primary: '[', secondary: '{'),
      KeyDef(kind: KeyKind.char, primary: ']', secondary: '}'),
      KeyDef(kind: KeyKind.char, primary: '{', secondary: '['),
      KeyDef(kind: KeyKind.char, primary: '}', secondary: ']'),
      KeyDef(kind: KeyKind.char, primary: '#', secondary: '~'),
      KeyDef(kind: KeyKind.char, primary: '%', secondary: '‰'),
      KeyDef(kind: KeyKind.char, primary: '^', secondary: '…'),
      KeyDef(kind: KeyKind.char, primary: '*', secondary: '×'),
      KeyDef(kind: KeyKind.char, primary: '+', secondary: '±'),
      KeyDef(kind: KeyKind.char, primary: '=', secondary: '≠'),
    ],
    [
      KeyDef(kind: KeyKind.char, primary: '_', secondary: '–'),
      KeyDef(kind: KeyKind.char, primary: '\\', secondary: '|'),
      KeyDef(kind: KeyKind.char, primary: '|', secondary: '/'),
      KeyDef(kind: KeyKind.char, primary: '~', secondary: '`'),
      KeyDef(kind: KeyKind.char, primary: '<', secondary: '≤'),
      KeyDef(kind: KeyKind.char, primary: '>', secondary: '≥'),
      KeyDef(kind: KeyKind.char, primary: '€', secondary: '£'),
      KeyDef(kind: KeyKind.char, primary: '£', secondary: '¥'),
      KeyDef(kind: KeyKind.char, primary: '¥', secondary: '₩'),
    ],
    [
      KeyDef(kind: KeyKind.symbols, primary: '123', secondary: '123', flex: 1.2),
      KeyDef(kind: KeyKind.char, primary: '.', secondary: '•'),
      KeyDef(kind: KeyKind.char, primary: ',', secondary: '…'),
      KeyDef(kind: KeyKind.char, primary: '?', secondary: '¿'),
      KeyDef(kind: KeyKind.char, primary: '!', secondary: '¡'),
      KeyDef(kind: KeyKind.char, primary: '\'', secondary: '`'),
      KeyDef(kind: KeyKind.char, primary: '"', secondary: '«'),
      KeyDef(kind: KeyKind.char, primary: ';', secondary: '»'),
      KeyDef(kind: KeyKind.backspace, flex: 1.8),
    ],
    [
      KeyDef(kind: KeyKind.alphabet, flex: 1.2),
      KeyDef(kind: KeyKind.comma, primary: ',', secondary: '\''),
      KeyDef(kind: KeyKind.space, primary: 'space', flex: 7.2),
      KeyDef(kind: KeyKind.period, primary: '.', secondary: '?', flex: 1.2),
      KeyDef(kind: KeyKind.enter, flex: 2.0),
    ],
  ];

  static const amharicLetters = [
    [
      KeyDef(kind: KeyKind.char, primary: 'ሀ'),
      KeyDef(kind: KeyKind.char, primary: 'ለ'),
      KeyDef(kind: KeyKind.char, primary: 'ሐ'),
      KeyDef(kind: KeyKind.char, primary: 'መ'),
      KeyDef(kind: KeyKind.char, primary: 'ሠ'),
      KeyDef(kind: KeyKind.char, primary: 'ረ'),
      KeyDef(kind: KeyKind.char, primary: 'ሰ'),
      KeyDef(kind: KeyKind.char, primary: 'ሸ'),
      KeyDef(kind: KeyKind.char, primary: 'ቀ'),
      KeyDef(kind: KeyKind.char, primary: 'በ'),
    ],
    [
      KeyDef(kind: KeyKind.char, primary: 'ተ'),
      KeyDef(kind: KeyKind.char, primary: 'ቸ'),
      KeyDef(kind: KeyKind.char, primary: 'ኀ'),
      KeyDef(kind: KeyKind.char, primary: 'ነ'),
      KeyDef(kind: KeyKind.char, primary: 'ኘ'),
      KeyDef(kind: KeyKind.char, primary: 'አ'),
      KeyDef(kind: KeyKind.char, primary: 'ዐ'),
      KeyDef(kind: KeyKind.char, primary: 'ከ'),
      KeyDef(kind: KeyKind.char, primary: 'ኸ'),
      KeyDef(kind: KeyKind.char, primary: 'ወ'),
    ],
    [
      KeyDef(kind: KeyKind.char, primary: 'ዘ'),
      KeyDef(kind: KeyKind.char, primary: 'ዠ'),
      KeyDef(kind: KeyKind.char, primary: 'የ'),
      KeyDef(kind: KeyKind.char, primary: 'ደ'),
      KeyDef(kind: KeyKind.char, primary: 'ጀ'),
      KeyDef(kind: KeyKind.char, primary: 'ገ'),
      KeyDef(kind: KeyKind.char, primary: 'ጘ'),
      KeyDef(kind: KeyKind.char, primary: 'ጠ'),
      KeyDef(kind: KeyKind.char, primary: 'ጨ'),
      KeyDef(kind: KeyKind.char, primary: 'ጰ'),
    ],
    [
      KeyDef(kind: KeyKind.shift, flex: 1.3),
      KeyDef(kind: KeyKind.char, primary: 'ፀ'),
      KeyDef(kind: KeyKind.char, primary: 'ፈ'),
      KeyDef(kind: KeyKind.char, primary: 'ፐ'),
      KeyDef(kind: KeyKind.char, primary: 'ቨ'),
      KeyDef(kind: KeyKind.char, primary: 'ሟ'),
      KeyDef(kind: KeyKind.char, primary: 'ኟ'),
      KeyDef(kind: KeyKind.char, primary: 'ዟ'),
      KeyDef(kind: KeyKind.char, primary: 'ጟ'),
      KeyDef(kind: KeyKind.char, primary: '፟'),
      KeyDef(kind: KeyKind.backspace, flex: 1.3),
    ],
    [
      KeyDef(kind: KeyKind.symbols, primary: '?123', flex: 1.2),
      KeyDef(kind: KeyKind.comma, primary: ',', secondary: '\''),
      KeyDef(kind: KeyKind.space, primary: 'en / አማ', flex: 7.2),
      KeyDef(kind: KeyKind.period, primary: '.', secondary: '?', flex: 1.2),
      KeyDef(kind: KeyKind.enter, flex: 2.0),
    ],
  ];

  static const Map<String, List<String>> amharicVowels = {
    'ሀ': ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'],
    'ለ': ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ', 'ሏ'],
    'ሐ': ['ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ', 'ሗ'],
    'መ': ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ', 'ሟ'],
    'ሠ': ['ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ', 'ሧ'],
    'ረ': ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ', 'ሯ'],
    'ሰ': ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ', 'ሷ'],
    'ሸ': ['ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ', 'ሿ'],
    'ቀ': ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ', 'ቋ'],
    'በ': ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ', 'ቧ'],
    'ተ': ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ', 'ቷ'],
    'ቸ': ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ', 'ቿ'],
    'ኀ': ['ኀ', 'ኁ', 'ኂ', 'ኃ', 'ኄ', 'ኅ', 'ኆ', 'ኋ'],
    'ነ': ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ', 'ኗ'],
    'ኘ': ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ', 'ኟ'],
    'አ': ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ'],
    'ዐ': ['ዐ', 'ዑ', 'ዒ', 'ዓ', 'ዔ', 'ዕ', 'ዖ'],
    'ከ': ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ', 'ኳ'],
    'ኸ': ['ኸ', 'ኹ', 'ኺ', 'ኻ', 'ኼ', 'ኽ', 'ኾ'],
    'ወ': ['ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ', 'ዏ'],
    'ዘ': ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ', 'ዟ'],
    'ዠ': ['ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ', 'ዧ'],
    'የ': ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'],
    'ደ': ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ', 'ዷ'],
    'ጀ': ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ', 'ጇ'],
    'ገ': ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ', 'ጓ'],
    'ጘ': ['ጘ', 'ጙ', 'ጚ', 'ጛ', 'ጜ', 'ጝ', 'ጞ'],
    'ጠ': ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ', 'ጧ'],
    'ጨ': ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ', 'ጯ'],
    'ጰ': ['ጰ', 'ጱ', 'ጲ', 'ጳ', 'ጴ', 'ጵ', 'ጶ', 'ጷ'],
    'ፀ': ['ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ', 'ፆ'],
    'ፈ': ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ', 'ፏ'],
    'ፐ': ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ', 'ፗ'],
    'ቨ': ['ቨ', 'ቩ', 'ቪ', 'ቫ', 'ቬ', 'ቭ', 'ቮ'],
  };
}
