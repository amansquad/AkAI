import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'keyboard_layout.dart';

class AkaiKey extends StatefulWidget {
  final KeyDef def;
  final AkaiPalette palette;
  final bool shifted;
  final bool isCapsLock;
  final bool isActionKey;
  final bool isAccent;
  final String enterLabel;
  final VoidCallback onTap;
  final VoidCallback? onLongPressStart;
  final VoidCallback? onLongPressEnd;
  final VoidCallback? onSecondaryTap;
  final double keyHeight;

  const AkaiKey({
    super.key,
    required this.def,
    required this.palette,
    required this.shifted,
    required this.isCapsLock,
    required this.isActionKey,
    required this.isAccent,
    required this.enterLabel,
    required this.onTap,
    this.onLongPressStart,
    this.onLongPressEnd,
    this.onSecondaryTap,
    this.keyHeight = 52,
  });

  @override
  State<AkaiKey> createState() => _AkaiKeyState();
}

class _AkaiKeyState extends State<AkaiKey>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      reverseDuration: const Duration(milliseconds: 180),
    );
    _scale = Tween<double>(begin: 1.0, end: 0.93).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeOutBack,
      ),
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

    // Samsung-style: action keys get the secondary color treatment
    Color bg;
    Color textColor;
    if (isAccent) {
      bg = palette.keyAccent;
      textColor = Colors.white;
    } else if (isSecondary) {
      bg = palette.keySecondary;
      textColor = palette.keySecondaryText;
    } else {
      bg = palette.key;
      textColor = palette.keyText;
    }

    final showAsUpper = (widget.shifted || widget.isCapsLock) && isChar && widget.def.primary != null;
    final displayText = _getDisplayText();

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (details) => _onTapDown(details),
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
            // When pressed, interpolate to the pressed variant
            final t = _scale.value;
            final lerpFactor = (1.0 - t) /
                0.07; // 0.07 = 1.0 - 0.93 (the scale range)

            Color resolvedBg;
            Color resolvedText;
            if (isAccent) {
              resolvedBg = Color.lerp(
                  palette.keyAccent, palette.keyAccentPressed, lerpFactor)!;
              resolvedText = Colors.white;
            } else if (isSecondary) {
              resolvedBg = Color.lerp(
                  palette.keySecondary,
                  palette.keySecondaryPressed,
                  lerpFactor)!;
              resolvedText = palette.keySecondaryText;
            } else {
              resolvedBg =
                  Color.lerp(palette.key, palette.keyPressed, lerpFactor)!;
              resolvedText = palette.keyText;
            }

            return Transform.scale(
              scale: t,
              child: Container(
                margin:
                    const EdgeInsets.symmetric(horizontal: 2.0, vertical: 2.5),
                decoration: BoxDecoration(
                  color: resolvedBg,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: palette.surfaceVariant.withOpacity(0.15),
                    width: 0.35,
                  ),
                  // Samsung-style: subtle shadow and soft key depth
                  boxShadow: palette.liveTheme == null
                      ? [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.10),
                            blurRadius: 4,
                            offset: const Offset(0, 1.8),
                          ),
                        ]
                      : null,
                ),
                child: Stack(
                  children: [
                    // Main content (centered)
                    Center(
                      child: _buildKeyContent(
                          resolvedText, showAsUpper, displayText),
                    ),
                    // Secondary character hint (top-right, Samsung-style)
                    if (widget.def.secondary != null &&
                        (widget.def.kind == KeyKind.char ||
                            widget.def.kind == KeyKind.comma ||
                            widget.def.kind == KeyKind.period))
                      Positioned(
                        top: 3,
                        right: 6,
                        child: Text(
                          widget.def.secondary!,
                          style: TextStyle(
                            color: resolvedText.withOpacity(0.45),
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    if (widget.def.kind == KeyKind.space)
                      Positioned(
                        top: 8,
                        right: 12,
                        child: Icon(
                          Icons.mic_none_outlined,
                          color: resolvedText.withOpacity(0.8),
                          size: 16,
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      );
  }

  Widget _buildKeyContent(Color textColor, bool upper, String text) {
    final palette = widget.palette;
    switch (widget.def.kind) {
      case KeyKind.shift:
        // Samsung-style: show arrow for one-shot shift, caps-lock icon only when caps lock is active
        final isCaps = widget.isCapsLock;
        final highlight = widget.shifted || widget.isCapsLock;
        return Icon(
          isCaps ? Icons.keyboard_capslock_rounded : Icons.keyboard_arrow_up_rounded,
          color: highlight ? palette.glow : textColor,
          size: 20,
        );
      case KeyKind.backspace:
        return Icon(
          Icons.backspace_outlined,
          color: textColor,
          size: 20,
        );
      case KeyKind.enter:
        final label = widget.enterLabel.toLowerCase();
        if (label != 'return') {
          return Text(
            widget.enterLabel.toUpperCase(),
            style: TextStyle(
              color: textColor,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          );
        }
        return Icon(
          Icons.keyboard_return_rounded,
          color: textColor,
          size: 20,
        );
      case KeyKind.globe:
        return Icon(Icons.language_rounded, color: textColor, size: 20);
      case KeyKind.mic:
        return Icon(Icons.mic_none_rounded, color: textColor, size: 20);
      case KeyKind.comma:
      case KeyKind.period:
        // Samsung-style: slightly smaller than letters, with secondary char shown via Stack
        return Text(
          widget.def.primary ?? '',
          style: TextStyle(
            color: textColor,
            fontSize: 19,
            fontWeight: FontWeight.w500,
          ),
        );
      case KeyKind.space:
        // Samsung shows nothing on space bar
        return const SizedBox.shrink();
      case KeyKind.symbols:
        return Text(
          widget.def.primary ?? widget.def.secondary ?? '!#1',
          style: TextStyle(
            color: textColor,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.1,
          ),
        );
      case KeyKind.alphabet:
        return Text(
          'ABC',
          style: TextStyle(
            color: textColor,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        );
      case KeyKind.char:
        // Samsung-style: center the primary character
        return Text(
          upper ? text.toUpperCase() : text,
          style: TextStyle(
            color: textColor,
            fontSize: 19,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.12,
          ),
        );
    }
  }

  String _getDisplayText() {
    return widget.def.primary ?? '';
  }
}
