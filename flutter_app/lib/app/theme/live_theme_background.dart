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
      _drawMatrix(canvas, size);
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

  void _drawMatrix(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // ── Step 1: Dark background with subtle radial green vignette ──
    final bgPaint = Paint()
      ..shader = RadialGradient(
        center: Alignment.center,
        radius: 1.0,
        colors: const [
          Color(0xFF001800),
          Color(0xFF000500),
        ],
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), bgPaint);

    // ── Step 2: Animated glowing dot grid overlay ──
    final dotPaint = Paint()..style = PaintingStyle.fill;
    const gridSpacing = 20.0;
    const dotRadius = 1.2;

    for (double x = gridSpacing / 2; x < w; x += gridSpacing) {
      for (double y = gridSpacing / 2; y < h; y += gridSpacing) {
        final pulseSeed =
            (x * 0.1 + y * 0.13 + time * 80) % (math.pi * 2);
        final pulse = 0.5 + 0.5 * math.sin(pulseSeed);
        final opacity = (0.06 + 0.06 * pulse).clamp(0.0, 1.0);
        dotPaint.color = Color.fromARGB(
          (opacity * 255).round().clamp(0, 255),
          0,
          255,
          50,
        );
        canvas.drawCircle(Offset(x, y), dotRadius, dotPaint);
      }
    }

    // ── Step 3: Falling Ethiopic / Matrix characters ──
    const charSize = 18.0;
    final cols = (w / charSize).ceil();

    const characters = [
      'ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ',
      'ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ',
      'ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ',
      'መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ',
      'ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ',
      'ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ',
      'ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ',
      'ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ',
      'በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ',
      'ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ',
      'ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ',
      'አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ',
      'ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ',
      'ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ',
      'ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ',
      'የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ',
      'ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ',
      'ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ',
      'ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    ];

    const trailLength = 18;
    const charFontSize = 14.0;
    const headFontSize = 16.0;

    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    for (int i = 0; i < cols; i++) {
      final speed = 1.2 + ((i * 7 + 3) % 12) / 5.0;
      final phaseOffset = ((i * 53) % 1000).toDouble();
      final totalY = (time * 500 * speed + phaseOffset) %
          (h + trailLength * charSize + 200);
      final headY = totalY - (trailLength * charSize);

      for (int j = 0; j < trailLength; j++) {
        final charY = headY + (j * charSize);
        if (charY < -charSize || charY > h + charSize) continue;

        final isHead = j == 0;
        Color charColor;
        double opacity;

        if (isHead) {
          // White-hot leading character
          opacity = 1.0;
          charColor = const Color(0xFFCCFFCC);
        } else {
          final fade = 1.0 - (j / trailLength.toDouble());
          opacity = (fade * fade * 0.9).clamp(0.0, 1.0);
          final gLevel = (fade * 255).round().clamp(50, 255);
          charColor = Color.fromARGB(
            (opacity * 255).round().clamp(0, 255),
            0,
            gLevel,
            (gLevel * 0.25).round(),
          );
        }

        final charIndex =
            (i * 3 + j + (time * 40).toInt()) % characters.length;

        textPainter.text = TextSpan(
          text: characters[charIndex],
          style: TextStyle(
            color: charColor.withOpacity(opacity),
            fontSize: isHead ? headFontSize : charFontSize,
            fontWeight:
                isHead ? FontWeight.bold : FontWeight.w400,
          ),
        );
        textPainter.layout();
        textPainter.paint(
          canvas,
          Offset(
            i * charSize + (charSize - textPainter.width) / 2,
            charY,
          ),
        );
      }
    }

    // ── Step 4: Subtle top-glow green gradient overlay ──
    final scanPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: const [
          Color(0x1200FF41),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, w, h * 0.4));
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h * 0.4), scanPaint);
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
  bool shouldRepaint(covariant _LiveThemePainter oldDelegate) =>
      oldDelegate.time != time || oldDelegate.theme != theme;
}
