import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'app_theme.dart';

class LiveThemeBackground extends StatefulWidget {
  final AkaiPalette? palette;
  final String? type;
  const LiveThemeBackground({super.key, this.palette, this.type});

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
    final liveType = widget.type ?? widget.palette?.liveTheme;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: _LiveThemePainter(
            time: _controller.value,
            type: liveType,
          ),
          child: Container(),
        );
      },
    );
  }
}

class _LiveThemePainter extends CustomPainter {
  final double time;
  final String? type;

  _LiveThemePainter({required this.time, this.type});

  @override
  void paint(Canvas canvas, Size size) {
    if (type == 'matrix') {
      _drawMatrix(canvas, size);
    } else if (type == 'fire') {
      _drawFire(canvas, size);
    } else if (type == 'rainbow') {
      _drawRainbow(canvas, size);
    } else if (type == 'aurora') {
      _drawAurora(canvas, size);
    } else if (type == 'ocean') {
      _drawOcean(canvas, size);
    } else if (type == 'solar') {
      _drawSolar(canvas, size);
    } else if (type == 'lava') {
      _drawLava(canvas, size);
    } else if (type == 'neon-pulse') {
      _drawNeonPulse(canvas, size);
    } else {
      // Default placeholder
      final paint = Paint()
        ..shader = LinearGradient(
          colors: [
            const Color(0xFF1A1A2E),
            const Color(0xFF16213E).withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
      canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);
    }
  }

  void _drawMatrix(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    
    // Background
    final bgPaint = Paint()..color = const Color(0xFF0D0208);
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), bgPaint);

    // Grid dots (subtle)
    final dotPaint = Paint()..color = const Color(0x0A00FF41);
    const spacing = 20.0;
    for (double x = 0; x < w; x += spacing) {
      for (double y = 0; y < h; y += spacing) {
        final dotRadius = 1.0 + math.sin(time * 6.28 + (x + y) * 0.01) * 0.5;
        canvas.drawCircle(Offset(x, y), dotRadius, dotPaint);
      }
    }

    // Falling characters
    const charSize = 10.0;
    final cols = (w / charSize).ceil();
    const characters = [
      'ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ', 'ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ',
      'ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ', 'መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ',
      'ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ', 'ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ',
      'ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ', 'ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ',
      'በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ', 'ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ',
      'ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ', 'አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ',
      'ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ', 'ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ',
      'ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ', 'የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ',
      'ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ', 'ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ',
      'ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    ];

    const trailLength = 28;
    const charFontSize = 10.0;
    const headFontSize = 12.0;
    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    for (int i = 0; i < cols; i++) {
      final speedFactor = 1.0 + ((i * 13 + i * i) % 20) / 15.0;
      final baseSpeed = 450.0 * speedFactor;
      
      // 5 staggered segments per column for non-stop flow
      for (int segment = 0; segment < 5; segment++) {
        final phaseOffset = (i * 157 + segment * (h / 2.5)) % 4000;
        final totalY = (time * baseSpeed + phaseOffset) % (h + trailLength * charSize + 500);
        final headY = totalY - (trailLength * charSize);

        for (int j = 0; j < trailLength; j++) {
          final charY = headY + (j * charSize);
          if (charY < -charSize || charY > h + charSize) continue;

          final opacity = (j / trailLength).clamp(0.0, 1.0);
          final color = (j == trailLength - 1)
              ? Colors.white.withOpacity(0.9)
              : const Color(0xFF00FF41).withOpacity(opacity * 0.7);

          final char = characters[(i + j + (time * 5).toInt()) % characters.length];
          textPainter.text = TextSpan(
            text: char,
            style: TextStyle(
              color: color,
              fontSize: (j == trailLength - 1) ? headFontSize : charFontSize,
              fontFamily: 'monospace',
              fontWeight: FontWeight.bold,
              shadows: [
                Shadow(color: const Color(0xFF00FF41).withOpacity(0.4), blurRadius: 4),
              ],
            ),
          );
          textPainter.layout();
          textPainter.paint(canvas, Offset(i * charSize, charY));
        }
      }
    }

    // Top glow
    final scanPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: const [Color(0x1500FF41), Colors.transparent],
      ).createShader(Rect.fromLTWH(0, 0, w, h * 0.4));
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h * 0.4), scanPaint);
  }

  void _drawFire(Canvas canvas, Size size) { /* ... stub or existing ... */ }
  void _drawRainbow(Canvas canvas, Size size) { /* ... */ }
  void _drawAurora(Canvas canvas, Size size) { /* ... */ }
  void _drawOcean(Canvas canvas, Size size) { /* ... */ }
  void _drawSolar(Canvas canvas, Size size) { /* ... */ }
  void _drawLava(Canvas canvas, Size size) { /* ... */ }
  void _drawNeonPulse(Canvas canvas, Size size) { /* ... */ }

  @override
  bool shouldRepaint(_LiveThemePainter oldDelegate) => true;
}
