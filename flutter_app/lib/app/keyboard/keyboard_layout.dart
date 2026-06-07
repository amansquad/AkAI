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
  static const numberRow = [
    KeyDef(kind: KeyKind.char, primary: '1'),
    KeyDef(kind: KeyKind.char, primary: '2'),
    KeyDef(kind: KeyKind.char, primary: '3'),
    KeyDef(kind: KeyKind.char, primary: '4'),
    KeyDef(kind: KeyKind.char, primary: '5'),
    KeyDef(kind: KeyKind.char, primary: '6'),
    KeyDef(kind: KeyKind.char, primary: '7'),
    KeyDef(kind: KeyKind.char, primary: '8'),
    KeyDef(kind: KeyKind.char, primary: '9'),
    KeyDef(kind: KeyKind.char, primary: '0'),
  ];

  static const letters = [
    [
      KeyDef(kind: KeyKind.char, primary: 'q'),
      KeyDef(kind: KeyKind.char, primary: 'w'),
      KeyDef(kind: KeyKind.char, primary: 'e'),
      KeyDef(kind: KeyKind.char, primary: 'r'),
      KeyDef(kind: KeyKind.char, primary: 't'),
      KeyDef(kind: KeyKind.char, primary: 'y'),
      KeyDef(kind: KeyKind.char, primary: 'u'),
      KeyDef(kind: KeyKind.char, primary: 'i'),
      KeyDef(kind: KeyKind.char, primary: 'o'),
      KeyDef(kind: KeyKind.char, primary: 'p'),
    ],
    [
      KeyDef(kind: KeyKind.char, primary: 'a'),
      KeyDef(kind: KeyKind.char, primary: 's'),
      KeyDef(kind: KeyKind.char, primary: 'd'),
      KeyDef(kind: KeyKind.char, primary: 'f'),
      KeyDef(kind: KeyKind.char, primary: 'g'),
      KeyDef(kind: KeyKind.char, primary: 'h'),
      KeyDef(kind: KeyKind.char, primary: 'j'),
      KeyDef(kind: KeyKind.char, primary: 'k'),
      KeyDef(kind: KeyKind.char, primary: 'l'),
    ],
    [
      KeyDef(kind: KeyKind.shift, flex: 1.4),
      KeyDef(kind: KeyKind.char, primary: 'z'),
      KeyDef(kind: KeyKind.char, primary: 'x'),
      KeyDef(kind: KeyKind.char, primary: 'c'),
      KeyDef(kind: KeyKind.char, primary: 'v'),
      KeyDef(kind: KeyKind.char, primary: 'b'),
      KeyDef(kind: KeyKind.char, primary: 'n'),
      KeyDef(kind: KeyKind.char, primary: 'm'),
      KeyDef(kind: KeyKind.backspace, flex: 1.4),
    ],
    [
      KeyDef(kind: KeyKind.symbols, flex: 1.5),
      KeyDef(kind: KeyKind.comma, primary: ','),
      KeyDef(kind: KeyKind.space, primary: 'space', flex: 5.0),
      KeyDef(kind: KeyKind.period, primary: '.'),
      KeyDef(kind: KeyKind.enter, flex: 1.8),
    ],
  ];

  static const lettersShifted = [
    [
      KeyDef(kind: KeyKind.char, primary: 'Q'),
      KeyDef(kind: KeyKind.char, primary: 'W'),
      KeyDef(kind: KeyKind.char, primary: 'E'),
      KeyDef(kind: KeyKind.char, primary: 'R'),
      KeyDef(kind: KeyKind.char, primary: 'T'),
      KeyDef(kind: KeyKind.char, primary: 'Y'),
      KeyDef(kind: KeyKind.char, primary: 'U'),
      KeyDef(kind: KeyKind.char, primary: 'I'),
      KeyDef(kind: KeyKind.char, primary: 'O'),
      KeyDef(kind: KeyKind.char, primary: 'P'),
    ],
    [
      KeyDef(kind: KeyKind.char, primary: 'A'),
      KeyDef(kind: KeyKind.char, primary: 'S'),
      KeyDef(kind: KeyKind.char, primary: 'D'),
      KeyDef(kind: KeyKind.char, primary: 'F'),
      KeyDef(kind: KeyKind.char, primary: 'G'),
      KeyDef(kind: KeyKind.char, primary: 'H'),
      KeyDef(kind: KeyKind.char, primary: 'J'),
      KeyDef(kind: KeyKind.char, primary: 'K'),
      KeyDef(kind: KeyKind.char, primary: 'L'),
    ],
    [
      KeyDef(kind: KeyKind.shift, flex: 1.4),
      KeyDef(kind: KeyKind.char, primary: 'Z'),
      KeyDef(kind: KeyKind.char, primary: 'X'),
      KeyDef(kind: KeyKind.char, primary: 'C'),
      KeyDef(kind: KeyKind.char, primary: 'V'),
      KeyDef(kind: KeyKind.char, primary: 'B'),
      KeyDef(kind: KeyKind.char, primary: 'N'),
      KeyDef(kind: KeyKind.char, primary: 'M'),
      KeyDef(kind: KeyKind.backspace, flex: 1.4),
    ],
    [
      KeyDef(kind: KeyKind.symbols, flex: 1.5),
      KeyDef(kind: KeyKind.comma, primary: ','),
      KeyDef(kind: KeyKind.space, primary: 'space', flex: 5.0),
      KeyDef(kind: KeyKind.period, primary: '.'),
      KeyDef(kind: KeyKind.enter, flex: 1.8),
    ],
  ];

  static const numbers = [
    [
      KeyDef(kind: KeyKind.char, primary: '1'),
      KeyDef(kind: KeyKind.char, primary: '2'),
      KeyDef(kind: KeyKind.char, primary: '3'),
      KeyDef(kind: KeyKind.char, primary: '4'),
      KeyDef(kind: KeyKind.char, primary: '5'),
      KeyDef(kind: KeyKind.char, primary: '6'),
      KeyDef(kind: KeyKind.char, primary: '7'),
      KeyDef(kind: KeyKind.char, primary: '8'),
      KeyDef(kind: KeyKind.char, primary: '9'),
      KeyDef(kind: KeyKind.char, primary: '0'),
    ],
    [
      KeyDef(kind: KeyKind.char, primary: '-'),
      KeyDef(kind: KeyKind.char, primary: '/'),
      KeyDef(kind: KeyKind.char, primary: ':'),
      KeyDef(kind: KeyKind.char, primary: ';'),
      KeyDef(kind: KeyKind.char, primary: '('),
      KeyDef(kind: KeyKind.char, primary: ')'),
      KeyDef(kind: KeyKind.char, primary: '\$'),
      KeyDef(kind: KeyKind.char, primary: '&'),
      KeyDef(kind: KeyKind.char, primary: '@'),
    ],
    [
      KeyDef(kind: KeyKind.symbols, secondary: '#+=', flex: 1.4),
      KeyDef(kind: KeyKind.char, primary: '"'),
      KeyDef(kind: KeyKind.char, primary: "'"),
      KeyDef(kind: KeyKind.char, primary: '!'),
      KeyDef(kind: KeyKind.char, primary: '?'),
      KeyDef(kind: KeyKind.char, primary: '%'),
      KeyDef(kind: KeyKind.char, primary: '*'),
      KeyDef(kind: KeyKind.char, primary: '+'),
      KeyDef(kind: KeyKind.backspace, flex: 1.4),
    ],
    [
      KeyDef(kind: KeyKind.alphabet, flex: 1.5),
      KeyDef(kind: KeyKind.comma, primary: ','),
      KeyDef(kind: KeyKind.space, primary: 'space', flex: 5.0),
      KeyDef(kind: KeyKind.period, primary: '.'),
      KeyDef(kind: KeyKind.enter, flex: 1.8),
    ],
  ];

  static const symbols = [
    [
      KeyDef(kind: KeyKind.char, primary: '['),
      KeyDef(kind: KeyKind.char, primary: ']'),
      KeyDef(kind: KeyKind.char, primary: '{'),
      KeyDef(kind: KeyKind.char, primary: '}'),
      KeyDef(kind: KeyKind.char, primary: '#'),
      KeyDef(kind: KeyKind.char, primary: '%'),
      KeyDef(kind: KeyKind.char, primary: '^'),
      KeyDef(kind: KeyKind.char, primary: '*'),
      KeyDef(kind: KeyKind.char, primary: '+'),
      KeyDef(kind: KeyKind.char, primary: '='),
    ],
    [
      KeyDef(kind: KeyKind.char, primary: '_'),
      KeyDef(kind: KeyKind.char, primary: '\\'),
      KeyDef(kind: KeyKind.char, primary: '|'),
      KeyDef(kind: KeyKind.char, primary: '~'),
      KeyDef(kind: KeyKind.char, primary: '<'),
      KeyDef(kind: KeyKind.char, primary: '>'),
      KeyDef(kind: KeyKind.char, primary: '€'),
      KeyDef(kind: KeyKind.char, primary: '£'),
      KeyDef(kind: KeyKind.char, primary: '¥'),
    ],
    [
      KeyDef(kind: KeyKind.symbols, secondary: '123', flex: 1.4),
      KeyDef(kind: KeyKind.char, primary: '.'),
      KeyDef(kind: KeyKind.char, primary: ','),
      KeyDef(kind: KeyKind.char, primary: '?'),
      KeyDef(kind: KeyKind.char, primary: '!'),
      KeyDef(kind: KeyKind.char, primary: '\''),
      KeyDef(kind: KeyKind.char, primary: '"'),
      KeyDef(kind: KeyKind.char, primary: ';'),
      KeyDef(kind: KeyKind.backspace, flex: 1.4),
    ],
    [
      KeyDef(kind: KeyKind.alphabet, flex: 1.5),
      KeyDef(kind: KeyKind.comma, primary: ','),
      KeyDef(kind: KeyKind.space, primary: 'space', flex: 5.0),
      KeyDef(kind: KeyKind.period, primary: '.'),
      KeyDef(kind: KeyKind.enter, flex: 1.8),
    ],
  ];
}
