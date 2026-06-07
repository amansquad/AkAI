import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'app_theme.dart';

class LiveThemeBackground extends StatefulWidget {
  final AkaiPalette palette;
  const LiveThemeBackground({super.key, required this.palette});

  @override
  State<LiveThemeBackground> createState() => _LiveThemeBackgroundState();
}

class _LiveThemeBackgroundState extends State<LiveThemeBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = widget.palette.liveTheme;
    if (theme == null) return Container(color: widget.palette.background);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: _LiveThemePainter(
            theme: theme,
            palette: widget.palette,
            time: _controller.value,
          ),
          child: Container(),
        );
      },
    );
  }
}

class _LiveThemePainter extends CustomPainter {
  final String theme;
  final AkaiPalette palette;
  final double time;

  _LiveThemePainter({
    required this.theme,
    required this.palette,
    required this.time,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final w = size.width;
    final h = size.height;

    // Background color
    paint.color = palette.background;
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), paint);

    if (theme == 'aurora') {
      _drawAurora(canvas, size, paint);
    } else if (theme == 'matrix') {
      _drawMatrix(canvas, size, paint);
    } else if (theme == 'ocean') {
      _drawOcean(canvas, size, paint);
    } else if (theme == 'fire') {
      _drawFire(canvas, size, paint);
    }
  }

  void _drawAurora(Canvas canvas, Size size, Paint paint) {
    final w = size.width;
    final h = size.height;

    for (int layer = 0; layer < 3; layer++) {
      final path = Path();
      path.moveTo(0, h);
      final baseY = h * (0.2 + layer * 0.15);
      final hue = [140.0, 180.0, 260.0][layer];

      for (double x = 0; x <= w; x += 10) {
        final wave1 = math.sin((x + time * 1000) * 0.008 + layer) * 40;
        final wave2 = math.sin((x - time * 500) * 0.012 + layer * 2) * 20;
        path.lineTo(x, baseY + wave1 + wave2);
      }
      path.lineTo(w, h);
      path.close();

      final grad = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          HSLColor.fromAHSL(0.2, hue, 0.9, 0.6).toColor(),
          HSLColor.fromAHSL(0.1, hue, 0.8, 0.4).toColor(),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, baseY - 50, w, 200));

      paint.shader = grad;
      canvas.drawPath(path, paint);
      paint.shader = null;
    }
  }

  void _drawMatrix(Canvas canvas, Size size, Paint paint) {
    final w = size.width;
    final h = size.height;
    const charSize = 14.0;
    final cols = (w / charSize).ceil();

    final random = math.Random(42);
    for (int i = 0; i < cols; i++) {
      final speed = 1.0 + random.nextDouble() * 2.0;
      double y = ((time * 100 * speed) + (i * 37)) % (h + 100);

      final alpha = (math.sin(time * 5 + i) + 1.0) / 2.0;
      paint.color = palette.accent.withOpacity(0.1 * alpha);

      for (int j = 0; j < 5; j++) {
        canvas.drawCircle(Offset(i * charSize, y - j * 15), 1.5, paint);
      }
    }
  }

  void _drawOcean(Canvas canvas, Size size, Paint paint) {
    final w = size.width;
    final h = size.height;

    for (int layer = 0; layer < 3; layer++) {
      final path = Path();
      path.moveTo(0, h);
      final baseY = h * (0.4 + layer * 0.1);

      for (double x = 0; x <= w; x += 10) {
        final wave = math.sin((x + time * 800) * 0.015 + layer) * 15;
        path.lineTo(x, baseY + wave);
      }
      path.lineTo(w, h);
      path.close();

      paint.color = palette.accent.withOpacity(0.1 - (layer * 0.02));
      canvas.drawPath(path, paint);
    }
  }

  void _drawFire(Canvas canvas, Size size, Paint paint) {
    final w = size.width;
    final h = size.height;

    for (int i = 0; i < 20; i++) {
      final x = (i * 20.0 + math.sin(time * 5 + i) * 10) % w;
      final life = (time * 2 + i / 20.0) % 1.0;
      final y = h - (life * h * 0.6);
      final sizeFlame = (1.0 - life) * 15.0;

      paint.color = palette.keyAccent.withOpacity(0.3 * (1.0 - life));
      canvas.drawCircle(Offset(x, y), sizeFlame, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _LiveThemePainter oldDelegate) => true;
}
