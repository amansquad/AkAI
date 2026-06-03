import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import '../theme/app_theme.dart';
import 'key_widget.dart';
import 'keyboard_controller.dart';
import 'keyboard_layout.dart';
import 'keyboard_service.dart';
import 'emoji_picker.dart';

class AkaiKeyboard extends StatefulWidget {
  final AkaiKeyboardController controller;
  const AkaiKeyboard({super.key, required this.controller});

  @override
  State<AkaiKeyboard> createState() => _AkaiKeyboardState();
}

class _AkaiKeyboardState extends State<AkaiKeyboard> {
  bool _showEmojiPicker = false;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AkaiKeyboardController>.value(
      value: widget.controller,
      child: Consumer<AkaiKeyboardController>(
        builder: (context, ctrl, _) {
          final settings = context.watch<AkaiSettingsProvider>();
          final palette = settings.palette;
          return Container(
            decoration: BoxDecoration(
              color: palette.background,
              border: Border(
                top: BorderSide(color: palette.surfaceVariant, width: 0.5),
              ),
            ),
            padding: EdgeInsets.only(
              left: 4,
              right: 4,
              top: 4,
              bottom: MediaQuery.of(context).viewPadding.bottom + 4,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _SuggestionBar(
                  palette: palette,
                  settings: settings,
                  onEmojiToggle: () {
                    setState(() {
                      _showEmojiPicker = !_showEmojiPicker;
                    });
                  },
                ),
                const SizedBox(height: 4),
                if (_showEmojiPicker)
                  EmojiPicker(
                    palette: palette,
                    onEmojiSelected: (emoji) async {
                      await ctrl.service.commitText(emoji);
                    },
                  )
                else
                  _KeyboardRows(palette: palette, controller: ctrl),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SuggestionBar extends StatefulWidget {
  final AkaiPalette palette;
  final AkaiSettingsProvider settings;
  final VoidCallback onEmojiToggle;
  const _SuggestionBar({
    required this.palette,
    required this.settings,
    required this.onEmojiToggle,
  });

  @override
  State<_SuggestionBar> createState() => _SuggestionBarState();
}

class _SuggestionBarState extends State<_SuggestionBar> {
  final _service = AkaiKeyboardService();

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.settings.showSuggestions) {
      return const SizedBox(height: 4);
    }
    return Container(
      height: 42,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: [
          if (widget.settings.showClipboard)
            _CircleIconButton(
              palette: widget.palette,
              icon: Icons.emoji_emotions_rounded,
              onTap: widget.onEmojiToggle,
            ),
          if (widget.settings.showClipboard) const SizedBox(width: 6),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: widget.palette.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: widget.palette.surfaceVariant, width: 0.6),
              ),
              alignment: Alignment.centerLeft,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: [
                  Icon(
                    Icons.auto_awesome,
                    size: 14,
                    color: widget.palette.accent,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    widget.settings.showSuggestions ? 'Akai AI' : '',
                    style: TextStyle(
                      color: widget.palette.keySecondaryText,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: widget.palette.accent.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Tap to enable',
                      style: TextStyle(
                        color: widget.palette.accent,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 6),
          _CircleIconButton(
            palette: widget.palette,
            icon: Icons.keyboard_hide_rounded,
            onTap: () => _service.hideKeyboard(),
          ),
        ],
      ),
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  final AkaiPalette palette;
  final IconData icon;
  final VoidCallback onTap;
  const _CircleIconButton(
      {required this.palette, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: palette.surface,
          shape: BoxShape.circle,
          border: Border.all(color: palette.surfaceVariant, width: 0.6),
        ),
        child: Icon(icon, size: 18, color: palette.keySecondaryText),
      ),
    );
  }
}

class _KeyboardRows extends StatelessWidget {
  final AkaiPalette palette;
  final AkaiKeyboardController controller;
  const _KeyboardRows({required this.palette, required this.controller});

  List<List<KeyDef>> _getRows() {
    switch (controller.mode) {
      case KeyboardMode.letters:
        return controller.shifted
            ? KeyboardLayout.lettersShifted
            : KeyboardLayout.letters;
      case KeyboardMode.numbers:
        return KeyboardLayout.numbers;
      case KeyboardMode.symbols:
        return KeyboardLayout.symbols;
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
            child: Row(
              children: [
                for (final def in rows[i])
                  Expanded(
                    flex: def.flex.toInt(),
                    child: _KeySlot(
                      def: def,
                      palette: palette,
                      controller: controller,
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

class _KeySlot extends StatelessWidget {
  final KeyDef def;
  final AkaiPalette palette;
  final AkaiKeyboardController controller;
  const _KeySlot(
      {required this.def, required this.palette, required this.controller});

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
          if (def.secondary == '#+=') {
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

    return AkaiKey(
      def: def,
      palette: palette,
      shifted: controller.shifted,
      isActionKey: isAction,
      isAccent: isAccent,
      enterLabel: controller.enterLabel,
      onTap: onTap,
      onLongPressStart: onLongStart,
      onLongPressEnd: onLongEnd,
    );
  }
}
