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
}
