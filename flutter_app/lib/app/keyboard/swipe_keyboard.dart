import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'keyboard_layout.dart';

class SwipeTrail {
  final List<Offset> points;
  final Color color;

  SwipeTrail({required this.points, required this.color});
}

class SwipeKeyboard extends StatefulWidget {
  final AkaiPalette palette;
  final List<List<KeyDef>> rows;
  final Function(String) onSwipeComplete;
  final VoidCallback onSwipeCancel;

  const SwipeKeyboard({
    super.key,
    required this.palette,
    required this.rows,
    required this.onSwipeComplete,
    required this.onSwipeCancel,
  });

  @override
  State<SwipeKeyboard> createState() => _SwipeKeyboardState();
}

class _SwipeKeyboardState extends State<SwipeKeyboard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  List<Offset> _currentPath = [];
  List<String> _detectedChars = [];
  bool _isSwiping = false;

  final GlobalKey _keyboardKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Rect? _getKeyRect(int row, int col, double keyWidth, double keyHeight) {
    final rows = widget.rows;
    if (row >= rows.length || col >= rows[row].length) return null;

    double xOffset = 0;
    for (int i = 0; i < col; i++) {
      xOffset += keyWidth * (rows[row][i].flex / 4.0);
    }

    final key = rows[row][col];
    final width = keyWidth * (key.flex / 4.0);

    return Rect.fromLTWH(
      xOffset,
      row * keyHeight,
      width,
      keyHeight,
    );
  }

  String? _findKeyAtPosition(Offset position) {
    final renderBox =
        _keyboardKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null) return null;

    final size = renderBox.size;
    final keyWidth = size.width / 4.0;
    final keyHeight = size.height / widget.rows.length;

    for (int row = 0; row < widget.rows.length; row++) {
      for (int col = 0; col < widget.rows[row].length; col++) {
        final rect = _getKeyRect(row, col, keyWidth, keyHeight);
        if (rect != null && rect.contains(position)) {
          final key = widget.rows[row][col];
          if (key.kind == KeyKind.char && key.primary != null) {
            return key.primary;
          }
        }
      }
    }
    return null;
  }

  void _onPanStart(DragStartDetails details) {
    final localPosition = _keyboardKey.currentContext
                ?.findRenderObject()
                ?.paintBounds
                .contains(details.localPosition) ==
            true
        ? details.localPosition
        : null;

    if (localPosition != null) {
      setState(() {
        _isSwiping = true;
        _currentPath = [localPosition];
        _detectedChars = [];
      });
      _controller.forward();
    }
  }

  void _onPanUpdate(DragUpdateDetails details) {
    if (!_isSwiping) return;

    final localPosition = _keyboardKey.currentContext
                ?.findRenderObject()
                ?.paintBounds
                .contains(details.localPosition) ==
            true
        ? details.localPosition
        : null;

    if (localPosition != null) {
      setState(() {
        _currentPath.add(localPosition);
      });

      final char = _findKeyAtPosition(localPosition);
      if (char != null && !_detectedChars.contains(char)) {
        setState(() {
          _detectedChars.add(char);
        });
      }
    }
  }

  void _onPanEnd(DragEndDetails details) {
    if (!_isSwiping) return;

    final swipeWord = _detectedChars.join();
    if (swipeWord.isNotEmpty) {
      widget.onSwipeComplete(swipeWord);
    } else {
      widget.onSwipeCancel();
    }

    setState(() {
      _isSwiping = false;
      _currentPath = [];
      _detectedChars = [];
    });
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanStart: _onPanStart,
      onPanUpdate: _onPanUpdate,
      onPanEnd: _onPanEnd,
      child: CustomPaint(
        painter: _SwipeTrailPainter(
          path: _currentPath,
          color: widget.palette.accent,
          detectedChars: _detectedChars,
          palette: widget.palette,
        ),
        child: Container(
          key: _keyboardKey,
          color: Colors.transparent,
        ),
      ),
    );
  }
}

class _SwipeTrailPainter extends CustomPainter {
  final List<Offset> path;
  final Color color;
  final List<String> detectedChars;
  final AkaiPalette palette;

  _SwipeTrailPainter({
    required this.path,
    required this.color,
    required this.detectedChars,
    required this.palette,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (path.isEmpty) return;

    final paint = Paint()
      ..color = color.withOpacity(0.6)
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final glowPaint = Paint()
      ..color = color.withOpacity(0.3)
      ..strokeWidth = 12.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);

    if (path.length > 1) {
      final pathObj = ui.Path();
      pathObj.moveTo(path[0].dx, path[0].dy);

      for (int i = 1; i < path.length; i++) {
        pathObj.lineTo(path[i].dx, path[i].dy);
      }

      canvas.drawPath(pathObj, glowPaint);
      canvas.drawPath(pathObj, paint);
    }

    // Draw start point
    if (path.isNotEmpty) {
      final startPaint = Paint()
        ..color = color
        ..style = PaintingStyle.fill;
      canvas.drawCircle(path.first, 8, startPaint);

      final innerPaint = Paint()
        ..color = palette.background
        ..style = PaintingStyle.fill;
      canvas.drawCircle(path.first, 4, innerPaint);
    }

    // Draw current point
    if (path.isNotEmpty) {
      final currentPaint = Paint()
        ..color = color
        ..style = PaintingStyle.fill;
      canvas.drawCircle(path.last, 12, currentPaint);

      final innerPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      canvas.drawCircle(path.last, 6, innerPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _SwipeTrailPainter oldDelegate) {
    return oldDelegate.path != path || oldDelegate.color != color;
  }
}
