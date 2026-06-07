import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import '../theme/app_theme.dart';
import 'key_widget.dart';
import 'keyboard_controller.dart';
import 'keyboard_layout.dart';
import 'emoji_gif_keyboard_bar.dart';

class AkaiKeyboard extends StatefulWidget {
  final AkaiKeyboardController controller;
  const AkaiKeyboard({super.key, required this.controller});

  @override
  State<AkaiKeyboard> createState() => _AkaiKeyboardState();
}

class _AkaiKeyboardState extends State<AkaiKeyboard> {

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AkaiKeyboardController>.value(
      value: widget.controller,
      child: Consumer<AkaiKeyboardController>(
        builder: (context, ctrl, _) {
          final settings = context.watch<AkaiSettingsProvider>();
          final palette = settings.palette;
          final hasLive = palette.liveTheme != null;

          return Container(
            decoration: BoxDecoration(
              color: hasLive ? Colors.transparent : palette.background,
              border: Border(
                top: BorderSide(color: palette.surfaceVariant, width: 0.5),
              ),
            ),
            padding: const EdgeInsets.only(
              left: 2,
              right: 2,
              top: 4,
              bottom: 4,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                EmojiGifKeyboardBar(
                  palette: palette,
                  settings: settings,
                  controller: ctrl,
                  // Optional: pass onOpenSettings here if needed,
                  // but host doesn't pass it yet.
                ),
                const SizedBox(height: 4),
                if (settings.showNumberRow && ctrl.mode == KeyboardMode.letters) ...[
                  _NumberRow(palette: palette, controller: ctrl),
                  const SizedBox(height: 4),
                ],
                _KeyboardRows(palette: palette, controller: ctrl),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _NumberRow extends StatelessWidget {
  final AkaiPalette palette;
  final AkaiKeyboardController controller;
  const _NumberRow({required this.palette, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final def in KeyboardLayout.numberRow)
          Expanded(
            child: _KeySlot(
              def: def,
              palette: palette,
              controller: controller,
            ),
          ),
      ],
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
                    flex: (def.flex * 100).round(),
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
