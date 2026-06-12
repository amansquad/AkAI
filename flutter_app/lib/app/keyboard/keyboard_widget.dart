import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import '../theme/app_theme.dart';
import 'emoji_picker.dart';
import 'key_widget.dart';
import 'keyboard_controller.dart';
import 'keyboard_layout.dart';
import 'emoji_gif_keyboard_bar.dart';
import 'gif/gif_picker.dart';

class AkaiKeyboard extends StatefulWidget {
  final AkaiKeyboardController controller;
  final VoidCallback? onThemeToggle;
  const AkaiKeyboard({super.key, required this.controller, this.onThemeToggle});

  @override
  State<AkaiKeyboard> createState() => _AkaiKeyboardState();
}

class _AkaiKeyboardState extends State<AkaiKeyboard>
    with SingleTickerProviderStateMixin {
  late AnimationController _themeAnimController;
  late Animation<double> _themeOpacity;

  @override
  void initState() {
    super.initState();
    _themeAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _themeOpacity = Tween<double>(begin: 1.0, end: 1.0).animate(
      CurvedAnimation(parent: _themeAnimController, curve: Curves.easeInOutCubic),
    );
  }

  @override
  void dispose() {
    _themeAnimController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.controller,
      builder: (context, _) {
        final ctrl = widget.controller;
        final settings = context.watch<AkaiSettingsProvider>();
        final palette = settings.palette;

        return Container(
          decoration: BoxDecoration(
            color: palette.liveTheme != null ? Colors.transparent : palette.background,
            border: Border(
              top: BorderSide(color: palette.surfaceVariant, width: 0.5),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              EmojiGifKeyboardBar(
                palette: palette,
                settings: settings,
                controller: ctrl,
                onOpenSettings: widget.onThemeToggle,
                onEmojiToggle: () {
                  if (ctrl.mode == KeyboardMode.emoji) {
                    ctrl.setMode(KeyboardMode.letters);
                  } else {
                    ctrl.setMode(KeyboardMode.emoji);
                  }
                },
                onGifToggle: () {
                  if (ctrl.mode == KeyboardMode.gif) {
                    ctrl.setMode(KeyboardMode.letters);
                  } else {
                    ctrl.setMode(KeyboardMode.gif);
                  }
                },
                onStickerToggle: () {
                  if (ctrl.mode == KeyboardMode.stickers) {
                    ctrl.setMode(KeyboardMode.letters);
                  } else {
                    ctrl.setMode(KeyboardMode.stickers);
                  }
                },
                onAiToggle: () {
                  if (ctrl.mode == KeyboardMode.ai) {
                    ctrl.setMode(KeyboardMode.letters);
                  } else {
                    ctrl.setMode(KeyboardMode.ai);
                  }
                },
                onThemeToggle: () {
                  if (ctrl.mode == KeyboardMode.themes) {
                    ctrl.setMode(KeyboardMode.letters);
                  } else {
                    ctrl.setMode(KeyboardMode.themes);
                  }
                },
              ),
              const SizedBox(height: 4),
              if (ctrl.mode == KeyboardMode.gif)
                Expanded(
                  child: GifPicker(
                    palette: palette,
                    onGifSelected: (gifUrl) async {
                      await ctrl.service.commitText(gifUrl);
                      ctrl.setMode(KeyboardMode.letters);
                    },
                  ),
                )
              else if (ctrl.mode == KeyboardMode.emoji)
                Expanded(
                  child: EmojiPicker(
                    palette: palette,
                    onEmojiSelected: (emoji) async {
                      await ctrl.service.commitText(emoji);
                    },
                  ),
                )
              else if (ctrl.mode == KeyboardMode.stickers)
                Expanded(
                  child: _StickerPanel(
                    palette: palette,
                    onStickerSelected: (sticker) async {
                      await ctrl.service.commitText(sticker);
                      ctrl.setMode(KeyboardMode.letters);
                    },
                  ),
                )
              else if (ctrl.mode == KeyboardMode.ai)
                Expanded(
                  child: _AiTranslationPanel(
                    palette: palette,
                    controller: ctrl,
                  ),
                )
              else if (ctrl.mode == KeyboardMode.themes)
                Expanded(
                  child: _ThemePickerPanel(
                    palette: palette,
                    settings: settings,
                  ),
                )
              else ...[
                // Amharic Vowel Row
                if (ctrl.isAmharic && ctrl.activeAmharicBase != null) ...[
                  _VowelRow(
                    palette: palette,
                    controller: ctrl,
                    keyHeight: settings.keyHeight,
                  ),
                  const SizedBox(height: 5),
                ],
                // Samsung-style: number row always visible in all text modes
                if ((ctrl.mode == KeyboardMode.letters ||
                        ctrl.mode == KeyboardMode.numbers ||
                        ctrl.mode == KeyboardMode.symbols) &&
                    settings.showNumberRow) ...[
                  _NumberRow(
                      palette: palette,
                      controller: ctrl,
                      keyHeight: settings.keyHeight),
                  const SizedBox(height: 5),
                ],
                _KeyboardRows(
                    palette: palette,
                    controller: ctrl,
                    keyHeight: settings.keyHeight),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _NumberRow extends StatelessWidget {
  final AkaiPalette palette;
  final AkaiKeyboardController controller;
  final double keyHeight;
  const _NumberRow({
    required this.palette,
    required this.controller,
    this.keyHeight = 52,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: keyHeight,
      child: Row(
        children: [
          for (final def in KeyboardLayout.numberRow)
            Expanded(
              child: _KeySlot(
                def: def,
                palette: palette,
                controller: controller,
                keyHeight: keyHeight,
              ),
            ),
        ],
      ),
    );
  }
}

class _VowelRow extends StatelessWidget {
  final AkaiPalette palette;
  final AkaiKeyboardController controller;
  final double keyHeight;
  const _VowelRow({
    required this.palette,
    required this.controller,
    this.keyHeight = 52,
  });

  @override
  Widget build(BuildContext context) {
    final baseChar = controller.activeAmharicBase;
    if (baseChar == null) return const SizedBox();
    
    final vowels = KeyboardLayout.amharicVowels[baseChar] ?? [];
    if (vowels.isEmpty) return const SizedBox();

    return SizedBox(
      height: keyHeight,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (final v in vowels)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: GestureDetector(
                  onTap: () => controller.commitVowel(v),
                  child: Container(
                    decoration: BoxDecoration(
                      color: palette.accent,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      v,
                      style: TextStyle(
                        fontSize: 22,
                        color: palette.background,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _KeyboardRows extends StatelessWidget {
  final AkaiPalette palette;
  final AkaiKeyboardController controller;
  final double keyHeight;
  const _KeyboardRows({
    required this.palette,
    required this.controller,
    this.keyHeight = 52,
  });

  List<List<KeyDef>> _getRows() {
    switch (controller.mode) {
      case KeyboardMode.letters:
        if (controller.isAmharic) {
          return KeyboardLayout.amharicLetters;
        }
        return controller.shifted
            ? KeyboardLayout.lettersShifted
            : KeyboardLayout.letters;
      case KeyboardMode.numbers:
        return KeyboardLayout.numbers;
      case KeyboardMode.symbols:
        return KeyboardLayout.symbols;
      case KeyboardMode.gif:
      case KeyboardMode.emoji:
      case KeyboardMode.stickers:
      case KeyboardMode.ai:
      case KeyboardMode.themes:
        return const []; // Rows are ignored in expanded panels
    }
  }

  @override
  Widget build(BuildContext context) {
    final rows = _getRows();
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (int i = 0; i < rows.length; i++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 1.5),
            child: SizedBox(
              height: keyHeight,
              child: Row(
                children: [
                  if (i == 1) const SizedBox(width: 10),
                  if (i == 2) const SizedBox(width: 18),
                  for (final def in rows[i])
                    Expanded(
                      flex: (def.flex * 100).round(),
                      child: _KeySlot(
                        def: def,
                        palette: palette,
                        controller: controller,
                        keyHeight: keyHeight,
                      ),
                    ),
                  if (i == 1) const SizedBox(width: 10),
                  if (i == 2) const SizedBox(width: 18),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _StickerPanel extends StatefulWidget {
  final AkaiPalette palette;
  final ValueChanged<String> onStickerSelected;

  const _StickerPanel({required this.palette, required this.onStickerSelected});

  @override
  State<_StickerPanel> createState() => _StickerPanelState();
}

class _StickerPanelState extends State<_StickerPanel> {
  static const _stickerCategories = {
    'Trending': ['🎉', '😎', '🔥', '✨', '💫', '🥳'],
    'Love': ['❤️', '😍', '💖', '😘', '🥰', '💌'],
    'Food': ['🍕', '🍔', '🍟', '🍣', '🍩', '🍉'],
    'Ethiopian': ['🇪🇹', '☕', '🍲', '🎶', '🌍', '🕊️'],
  };

  String _activeCategory = 'Trending';

  @override
  Widget build(BuildContext context) {
    final stickers = _stickerCategories[_activeCategory]!;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      color: widget.palette.surface.withOpacity(0.95),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _stickerCategories.keys.map((category) {
                final isActive = category == _activeCategory;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(category),
                    selected: isActive,
                    selectedColor: widget.palette.accent,
                    backgroundColor: widget.palette.background.withOpacity(0.8),
                    labelStyle: TextStyle(
                      color: isActive ? widget.palette.background : widget.palette.keyText,
                    ),
                    onSelected: (_) {
                      setState(() {
                        _activeCategory = category;
                      });
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: GridView.count(
              crossAxisCount: 5,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              children: stickers.map((sticker) {
                return GestureDetector(
                  onTap: () => widget.onStickerSelected(sticker),
                  child: Container(
                    decoration: BoxDecoration(
                      color: widget.palette.background.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: widget.palette.surfaceVariant.withOpacity(0.6)),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      sticker,
                      style: const TextStyle(fontSize: 28),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

enum _TranslationTarget { english, amharic }

class _AiTranslationPanel extends StatefulWidget {
  final AkaiPalette palette;
  final AkaiKeyboardController controller;

  const _AiTranslationPanel({
    required this.palette,
    required this.controller,
  });

  @override
  State<_AiTranslationPanel> createState() => _AiTranslationPanelState();
}

class _AiTranslationPanelState extends State<_AiTranslationPanel> {
  final TextEditingController _textController = TextEditingController();
  String _translated = '';
  String _status = 'Type English or Amharic text to translate.';
  bool _isLoading = false;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  bool _containsAmharic(String text) {
    return RegExp(r'[\u1200-\u137F]').hasMatch(text);
  }

  _TranslationTarget _detectTarget(String text) {
    return _containsAmharic(text) ? _TranslationTarget.english : _TranslationTarget.amharic;
  }

  String _mockTranslate(String text, _TranslationTarget target) {
    final normalized = text.toLowerCase().trim();
    final englishToAmharic = {
      'hello': 'ሰላም',
      'how are you': 'እንዴት ነህ?',
      'good morning': 'እንደምን አደርክ',
      'thank you': 'አመሰግናለሁ',
      'i love you': 'እወድሃለሁ',
      'yes': 'አዎ',
      'no': 'አይ',
    };
    final amharicToEnglish = {
      'ሰላም': 'hello',
      'እንዴት ነህ?': 'how are you?',
      'እንደምን አደርክ': 'good morning',
      'አመሰግናለሁ': 'thank you',
      'እወድሃለሁ': 'i love you',
      'አዎ': 'yes',
      'አይ': 'no',
    };

    if (target == _TranslationTarget.amharic) {
      return englishToAmharic[normalized] ?? 'እባክዎን ይህን ጽሁፍ በአማርኛ ይተረጉሙ።';
    }

    return amharicToEnglish[text.trim()] ?? 'Translate to English: $text';
  }

  Future<void> _translateText() async {
    var text = _textController.text.trim();
    if (text.isEmpty) {
      setState(() {
        _status = 'Fetching current cursor context...';
      });
      final contextText = await widget.controller.service.getCursorContext();
      final before = contextText?['textBefore'] as String? ?? '';
      final after = contextText?['textAfter'] as String? ?? '';
      text = (before + ' ' + after).trim();
      if (text.isNotEmpty) {
        _textController.text = text;
      }
    }

    if (text.isEmpty) {
      setState(() {
        _status = 'No text found. Type a phrase or place your cursor in a text field.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _status = 'Translating...';
    });

    final target = _detectTarget(text);
    await Future.delayed(const Duration(milliseconds: 400));
    final result = _mockTranslate(text, target);

    if (!mounted) return;

    setState(() {
      _translated = result;
      _status = target == _TranslationTarget.amharic
          ? 'Inserted Amharic translation.'
          : 'Inserted English translation.';
      _isLoading = false;
    });

    await widget.controller.service.commitText(result);
    widget.controller.setMode(KeyboardMode.letters);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      color: widget.palette.surface.withOpacity(0.95),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'AI Translation',
            style: TextStyle(
              color: widget.palette.keyText,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _textController,
            style: TextStyle(color: widget.palette.keyText),
            decoration: InputDecoration(
              filled: true,
              fillColor: widget.palette.key.withOpacity(0.9),
              hintText: 'Type text to translate',
              hintStyle: TextStyle(color: widget.palette.keySecondaryText),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
            ),
            minLines: 1,
            maxLines: 3,
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: widget.palette.accent,
              foregroundColor: widget.palette.background,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: _isLoading ? null : _translateText,
            child: Text(_isLoading ? 'Translating...' : 'Translate & Insert'),
          ),
          const SizedBox(height: 10),
          Text(
            _status,
            style: TextStyle(
              color: widget.palette.keySecondaryText,
              fontSize: 12,
            ),
          ),
          if (_translated.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: widget.palette.key.withOpacity(0.8),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                _translated,
                style: TextStyle(color: widget.palette.keyText),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ThemePickerPanel extends StatefulWidget {
  final AkaiPalette palette;
  final AkaiSettingsProvider settings;

  const _ThemePickerPanel({required this.palette, required this.settings});

  @override
  State<_ThemePickerPanel> createState() => _ThemePickerPanelState();
}

class _ThemePickerPanelState extends State<_ThemePickerPanel> {
  late AkaiPalette _previewPalette;

  @override
  void initState() {
    super.initState();
    _previewPalette = widget.settings.palette;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: widget.palette.surface.withOpacity(0.95),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Live Theme Picker',
            style: TextStyle(
              color: widget.palette.keyText,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          // Live preview container showing the selected theme
          Container(
            height: 50,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              gradient: LinearGradient(
                colors: [
                  _previewPalette.surface,
                  _previewPalette.background,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(
                color: _previewPalette.accent.withOpacity(0.6),
                width: 1.5,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _previewPalette.key,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      'A',
                      style: TextStyle(
                        color: _previewPalette.keyText,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _previewPalette.keySecondary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      '123',
                      style: TextStyle(
                        color: _previewPalette.keySecondaryText,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _previewPalette.keyAccent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.keyboard_return_outlined,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '${_previewPalette.emoji} ${_previewPalette.name}',
            style: TextStyle(
              color: widget.palette.keyText,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.35,
              children: AkaiThemes.all.map((option) {
                final isSelected = option == _previewPalette;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _previewPalette = option;
                    });
                    widget.settings.setPalette(option);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutCubic,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      gradient: LinearGradient(
                        colors: [
                          option.surface.withOpacity(0.95),
                          option.background.withOpacity(0.95),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      border: Border.all(
                        color: isSelected
                            ? option.accent
                            : option.surfaceVariant.withOpacity(0.5),
                        width: isSelected ? 2 : 1,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: option.accent.withOpacity(0.4),
                                blurRadius: 12,
                                spreadRadius: 1,
                              ),
                            ]
                          : null,
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(option.emoji,
                                style: const TextStyle(fontSize: 22)),
                            if (isSelected)
                              Icon(
                                Icons.check_circle,
                                color: option.accent,
                                size: 20,
                              ),
                          ],
                        ),
                        const Spacer(),
                        Text(
                          option.name,
                          style: TextStyle(
                            color: option.keyText,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: option.accent.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            option.liveTheme != null
                                ? '✨ Live'
                                : 'Static',
                            style: TextStyle(
                              color: option.liveTheme != null
                                  ? option.accent
                                  : option.keySecondaryText,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _KeySlot extends StatelessWidget {
  final KeyDef def;
  final AkaiPalette palette;
  final AkaiKeyboardController controller;
  final double keyHeight;
  const _KeySlot({
    required this.def,
    required this.palette,
    required this.controller,
    this.keyHeight = 52,
  });

  @override
  Widget build(BuildContext context) {
    final isChar = def.kind == KeyKind.char;
    final isAccent = def.kind == KeyKind.enter;
    final isAction = !isChar;

    VoidCallback? onTap;
    VoidCallback? onLongStart;
    VoidCallback? onLongEnd;

    switch (def.kind) {
      case KeyKind.char:
        onTap = () => controller.pressChar(def.primary ?? '');
        break;
      case KeyKind.shift:
        onTap = () => controller.toggleShift();
        break;
      case KeyKind.backspace:
        onTap = () => controller.backspace();
        onLongStart = () => controller.backspaceLongPress();
        break;
      case KeyKind.space:
        onTap = () => controller.space();
        onLongStart = () => controller.mic();
        break;
      case KeyKind.comma:
        onTap = () => controller.comma();
        break;
      case KeyKind.period:
        onTap = () => controller.period();
        break;
      case KeyKind.enter:
        onTap = () => controller.enter();
        break;
      case KeyKind.symbols:
        onTap = () {
          if (def.primary == '#+=' || def.secondary == '#+=') {
            controller.setMode(KeyboardMode.symbols);
          } else {
            controller.setMode(KeyboardMode.numbers);
          }
        };
        break;
      case KeyKind.alphabet:
        onTap = () => controller.setMode(KeyboardMode.letters);
        break;
      case KeyKind.globe:
        onTap = () => controller.switchKeyboard();
        break;
      case KeyKind.mic:
        onTap = () {};
        break;
    }

    Widget keyWidget = AkaiKey(
      def: def,
      palette: palette,
      shifted: controller.shifted,
      isCapsLock: controller.capsLock,
      isActionKey: isAction,
      isAccent: isAccent,
      enterLabel: controller.enterLabel,
      onTap: onTap ?? () {},
      onLongPressStart: onLongStart,
      onLongPressEnd: onLongEnd,
      keyHeight: keyHeight,
    );

    if (def.kind == KeyKind.space) {
      return GestureDetector(
        behavior: HitTestBehavior.translucent,
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity != null && details.primaryVelocity!.abs() > 300) {
            controller.toggleLanguage();
          }
        },
        child: keyWidget,
      );
    }

    return keyWidget;
  }
}
