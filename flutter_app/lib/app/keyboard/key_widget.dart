import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'keyboard_layout.dart';

class AkaiKey extends StatefulWidget {
  final KeyDef def;
  final AkaiPalette palette;
  final bool shifted;
  final bool isActionKey;
  final bool isAccent;
  final String enterLabel;
  final VoidCallback onTap;
  final VoidCallback? onLongPressStart;
  final VoidCallback? onLongPressEnd;
  final VoidCallback? onSecondaryTap;

  const AkaiKey({
    super.key,
    required this.def,
    required this.palette,
    required this.shifted,
    required this.isActionKey,
    required this.isAccent,
    required this.enterLabel,
    required this.onTap,
    this.onLongPressStart,
    this.onLongPressEnd,
    this.onSecondaryTap,
  });

  @override
  State<AkaiKey> createState() => _AkaiKeyState();
}

class _AkaiKeyState extends State<AkaiKey> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;
  late Animation<double> _glow;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 140),
      reverseDuration: const Duration(milliseconds: 220),
    );
    _scale = Tween<double>(begin: 1.0, end: 0.92).animate(
      CurvedAnimation(
          parent: _controller,
          curve: Curves.easeOutCubic,
          reverseCurve: Curves.easeOutBack),
    );
    _glow = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails _) {
    _controller.forward();
  }

  void _onTapUp(TapUpDetails _) {
    _controller.reverse();
    widget.onTap();
  }

  void _onTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final palette = widget.palette;
    final isChar = widget.def.kind == KeyKind.char;
    final isAccent = widget.isAccent;
    final isSecondary = widget.isActionKey;

    Color bg;
    Color textColor;
    Color borderColor;
    if (isAccent) {
      bg =
          Color.lerp(palette.keyAccent, palette.keyAccentPressed, _glow.value)!;
      textColor = Colors.white;
      borderColor = palette.glow.withValues(alpha: 0.4);
    } else if (isSecondary) {
      bg = Color.lerp(
          palette.keySecondary, palette.keySecondaryPressed, _glow.value)!;
      textColor = palette.keySecondaryText;
      borderColor = palette.surfaceVariant;
    } else {
      bg = Color.lerp(palette.key, palette.keyPressed, _glow.value)!;
      textColor = palette.keyText;
      borderColor = palette.surfaceVariant;
    }

    final showAsUpper = widget.shifted && isChar && widget.def.primary != null;
    final displayText = _getDisplayText();

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      onLongPressStart: widget.onLongPressStart != null
          ? (_) {
              _controller.forward();
              widget.onLongPressStart!();
            }
          : null,
      onLongPressEnd: widget.onLongPressEnd != null
          ? (_) {
              _controller.reverse();
              widget.onLongPressEnd!();
            }
          : null,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.scale(
            scale: _scale.value,
            child: child,
          );
        },
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 2.5, vertical: 3),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: borderColor, width: 0.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
              if (isAccent)
                BoxShadow(
                  color: palette.glow.withValues(alpha: 0.45 * _glow.value),
                  blurRadius: 18 * _glow.value,
                  spreadRadius: 1 * _glow.value,
                ),
            ],
            gradient: isAccent
                ? LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color.lerp(palette.keyAccent, palette.keyAccentPressed,
                          _glow.value)!,
                      Color.lerp(
                          palette.accentMuted, palette.keyAccent, _glow.value)!,
                    ],
                  )
                : null,
          ),
          child: Center(
            child: _buildKeyContent(textColor, showAsUpper, displayText),
          ),
        ),
      ),
    );
  }

  Widget _buildKeyContent(Color textColor, bool upper, String text) {
    final palette = widget.palette;
    switch (widget.def.kind) {
      case KeyKind.shift:
        return Icon(
          widget.shifted
              ? Icons.keyboard_capslock_rounded
              : Icons.keyboard_capslock_outlined,
          color: widget.shifted ? palette.glow : textColor,
          size: 22,
        );
      case KeyKind.backspace:
        return Icon(
          Icons.backspace_outlined,
          color: textColor,
          size: 22,
        );
      case KeyKind.enter:
        return Text(
          widget.enterLabel,
          style: TextStyle(
            color: textColor,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        );
      case KeyKind.globe:
        return Icon(Icons.language_rounded, color: textColor, size: 22);
      case KeyKind.mic:
        return Icon(Icons.mic_none_rounded, color: textColor, size: 22);
      case KeyKind.comma:
      case KeyKind.period:
        return Text(
          widget.def.primary ?? '',
          style: TextStyle(
              color: textColor, fontSize: 22, fontWeight: FontWeight.w600),
        );
      case KeyKind.space:
        return Text(
          'space',
          style: TextStyle(
              color: textColor,
              fontSize: 13,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5),
        );
      case KeyKind.symbols:
        return Text(
          widget.def.secondary ?? '?123',
          style: TextStyle(
              color: textColor, fontSize: 14, fontWeight: FontWeight.w700),
        );
      case KeyKind.alphabet:
        return Text(
          'ABC',
          style: TextStyle(
              color: textColor, fontSize: 14, fontWeight: FontWeight.w700),
        );
      case KeyKind.char:
        return Text(
          upper ? text.toUpperCase() : text,
          style: TextStyle(
            color: textColor,
            fontSize: 23,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.2,
          ),
        );
    }
  }

  String _getDisplayText() {
    return widget.def.primary ?? '';
  }
}
