import 'dart:math' as math;
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'app_theme.dart';
import 'football_live_theme.dart';

class LiveThemeBackground extends StatefulWidget {
  final AkaiPalette? palette;
  final String? type;

  /// When false, paints a single static frame (no animation ticker).
  /// Use for preview thumbnails — dozens of animated instances freeze the UI.
  final bool animate;

  const LiveThemeBackground(
      {super.key, this.palette, this.type, this.animate = true});

  @override
  State<LiveThemeBackground> createState() => _LiveThemeBackgroundState();
}

class _LiveThemeBackgroundState extends State<LiveThemeBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  File? _bgImage;
  bool _imageExists = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    );
    if (widget.animate) {
      _controller.repeat();
    } else {
      _controller.value = 0.35; // representative mid-animation frame
    }
    _checkImage();
  }

  Future<void> _checkImage() async {
    final liveType = widget.type ?? widget.palette?.liveTheme;
    if (liveType == null) return;

    try {
      final dir = await getApplicationDocumentsDirectory();
      // Sanitize the filename for local storage (replace slashes with underscores)
      final localName = liveType.replaceAll('/', '_');
      final file = File('${dir.path}/themes/$localName.png');
      final exists = await file.exists();
      debugPrint('LiveThemeBackground: Checking for $liveType.png at ${file.path} - Exists: $exists');
      
      if (exists) {
        if (mounted) {
          setState(() {
            _bgImage = file;
            _imageExists = true;
          });
        }
      } else {
        if (mounted && _imageExists) {
          setState(() {
            _imageExists = false;
            _bgImage = null;
          });
        }
      }
    } catch (e) {
      debugPrint('LiveThemeBackground: Error checking theme image: $e');
    }
  }

  @override
  void didUpdateWidget(LiveThemeBackground oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.type != oldWidget.type || widget.palette?.liveTheme != oldWidget.palette?.liveTheme) {
      _checkImage();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final liveType = widget.type ?? widget.palette?.liveTheme;
    
    // If no live type, return empty to ensure no leftovers
    if (liveType == null) return const SizedBox.shrink();

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Stack(
          fit: StackFit.expand,
          children: [
            if (_imageExists && _bgImage != null)
              Transform.scale(
                scale: 1.1 + (math.sin(_controller.value * 2 * math.pi) * 0.05),
                child: Image.file(
                  _bgImage!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
            CustomPaint(
              painter: _LiveThemePainter(
                time: _controller.value,
                type: liveType,
                hasImage: _imageExists,
              ),
              child: Container(),
            ),
          ],
        );
      },
    );
  }
}

class _LiveThemePainter extends CustomPainter {
  final double time;
  final String? type;
  final bool hasImage;

  _LiveThemePainter({required this.time, this.type, this.hasImage = false});

  // Pre-laid-out matrix glyphs, keyed by char + head/trail + opacity level.
  // TextPainter.layout() is the expensive part; caching it keeps the matrix
  // animation from saturating the UI thread.
  static const int _opacityLevels = 8;
  static final Map<String, TextPainter> _glyphCache = {};

  static TextPainter _cachedGlyph(String char, bool isHead, int level) {
    final key = isHead ? '$char|h' : '$char|$level';
    return _glyphCache.putIfAbsent(key, () {
      final color = isHead
          ? Colors.white.withOpacity(0.9)
          : const Color(0xFF00FF41).withOpacity((level / _opacityLevels) * 0.7);
      final painter = TextPainter(
        textDirection: TextDirection.ltr,
        text: TextSpan(
          text: char,
          style: TextStyle(
            color: color,
            fontSize: isHead ? 12.0 : 10.0,
            fontFamily: 'monospace',
            fontWeight: FontWeight.bold,
            shadows: isHead
                ? [Shadow(color: const Color(0xFF00FF41).withOpacity(0.4), blurRadius: 4)]
                : null,
          ),
        ),
      );
      painter.layout();
      return painter;
    });
  }

  @override
  void paint(Canvas canvas, Size size) {
    final typeStr = type?.toLowerCase() ?? '';
    
    // If we have an image, we only draw overlays (scanlines, particles, etc.)
    if (hasImage) {
      _drawOverlays(canvas, size, typeStr);
      return;
    }
    // Dedicated scenes first — their names can contain generic words
    // ("fireflies" contains "fire") so they must win before the fallbacks.
    if (typeStr.contains('prism')) {
      _drawPrism(canvas, size);
    } else if (typeStr.contains('fireflies')) {
      _drawFireflies(canvas, size);
    } else if (typeStr.contains('lava_lamp')) {
      _drawLavaLamp(canvas, size);
    } else if (typeStr.contains('circuit')) {
      _drawCircuitBoard(canvas, size);
    } else if (typeStr.contains('geometric')) {
      _drawGeometricFlow(canvas, size);
    } else if (typeStr.contains('starfield') || typeStr.contains('hyperspace')) {
      _drawStarfield(canvas, size);
    } else if (typeStr.contains('meteor')) {
      _drawMeteorShower(canvas, size);
    } else if (typeStr.contains('firework')) {
      _drawFireworks(canvas, size);
    } else if (typeStr.contains('bokeh')) {
      _drawBokeh(canvas, size);
    } else if (typeStr.contains('ripple') || typeStr.contains('zen')) {
      _drawRipples(canvas, size);
    } else if (typeStr.contains('glitch')) {
      _drawGlitch(canvas, size);
    } else if (typeStr.startsWith('fb_') || typeStr.startsWith('club_')) {
      _drawFootball(canvas, size, typeStr);
    } else if (typeStr.contains('cyberpunk')) {
      _drawCyberpunk(canvas, size);
    } else if (typeStr.contains('matrix') || typeStr.contains('binary')) {
      _drawMatrix(canvas, size);
    } else if (typeStr.contains('fire') || typeStr.contains('lava') || typeStr.contains('flame') || typeStr.contains('fb_stgeorge') || typeStr.contains('fb_coffee') || typeStr.contains('fb_fasil') || typeStr.contains('fb_mekelle')) {
      _drawFire(canvas, size);
    } else if (typeStr.contains('storm') || typeStr.contains('thunder')) {
      _drawThunderstorm(canvas, size);
    } else if (typeStr.contains('petal') || typeStr.contains('blossom') || typeStr.contains('cherry')) {
      _drawCherryBlossom(canvas, size);
    } else if (typeStr.contains('rainbow')) {
      _drawRainbow(canvas, size);
    } else if (typeStr.contains('snow') || typeStr.contains('crystal')) {
      _drawSnowfall(canvas, size);
    } else if (typeStr.contains('autumn') || typeStr.contains('leaf')) {
      _drawAutumn(canvas, size);
    } else if (typeStr.contains('aurora') || typeStr.contains('nebula') || typeStr.contains('galaxy') || typeStr.contains('star') || typeStr.contains('reg_') || typeStr.contains('ortho_lalibela') || typeStr.contains('fb_realmadrid') || typeStr.contains('fb_mancity')) {
      _drawAurora(canvas, size);
    } else if (typeStr.contains('ocean') || typeStr.contains('water') || typeStr.contains('bubble') || typeStr.contains('sea') || typeStr.contains('fb_bahirdar') || typeStr.contains('fb_hawassa') || typeStr.contains('fb_inter')) {
      _drawOcean(canvas, size);
    } else if (typeStr.contains('solar') || typeStr.contains('eth_flag') || typeStr.contains('ortho_axum') || typeStr.contains('fb_realmadrid')) {
      _drawSolar(canvas, size);
    } else if (typeStr.contains('neon') || typeStr.contains('pulse') || typeStr.contains('geo') || typeStr.contains('fb_barca') || typeStr.contains('fb_manutd')) {
      _drawNeonPulse(canvas, size);
    } else if (typeStr.startsWith('ortho_') ||
        typeStr.contains('meskel') ||
        typeStr.contains('timkat') ||
        typeStr.startsWith('faith')) {
      _drawHolyRays(canvas, size);
    } else if (typeStr.startsWith('islam_') || typeStr.contains('lantern')) {
      _drawCrescentNight(canvas, size);
    } else {
      // Never show a static color: unknown live types fall back to aurora
      _drawAurora(canvas, size);
    }
  }

  // Iridescent holographic sheen: rotating diagonal spectrum bands plus
  // twinkling glints — the Flutter counterpart of the web "Prism Flow" theme.
  void _drawPrism(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final base = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF0B0A1A), Color(0xFF120A1E), Color(0xFF0A0F1E)],
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), base);

    const bandCount = 7;
    canvas.save();
    canvas.translate(w / 2, h / 2);
    canvas.rotate(math.pi / 5 + math.sin(time * 0.08) * 0.15);
    final bandW = w * 1.6;
    for (int i = 0; i < bandCount; i++) {
      final hue = (time * 26 + i * (360 / bandCount)) % 360;
      final offset = math.sin(time * 0.3 + i) * 40;
      final color = HSLColor.fromAHSL(0.16, hue, 0.9, 0.62).toColor();
      final bandPaint = Paint()
        ..shader = LinearGradient(
          colors: [color.withOpacity(0), color, color.withOpacity(0)],
        ).createShader(Rect.fromLTWH(-bandW / 2, 0, bandW, h / bandCount + 10));
      canvas.drawRect(
        Rect.fromLTWH(-bandW / 2, -h + (i * (2 * h) / bandCount) + offset,
            bandW, h / bandCount + 10),
        bandPaint,
      );
    }
    canvas.restore();

    // Twinkling glints
    final rnd = math.Random(7);
    for (int i = 0; i < 50; i++) {
      final gx = rnd.nextDouble() * w;
      final gy = rnd.nextDouble() * h;
      final hue = (rnd.nextDouble() * 360 + time * 40) % 360;
      final twinkle = 0.4 + 0.6 * (math.sin(time * 3 + gx * 0.05).abs());
      final glintPaint = Paint()
        ..color = HSLColor.fromAHSL(0.75 * twinkle, hue, 0.9, 0.85).toColor()
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 1.5);
      canvas.drawCircle(Offset(gx, gy), (0.6 + rnd.nextDouble() * 1.6) * twinkle, glintPaint);
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

    const trailLength = 20;

    for (int i = 0; i < cols; i++) {
      final speedFactor = 1.0 + ((i * 13 + i * i) % 20) / 15.0;
      final baseSpeed = 450.0 * speedFactor;

      // 3 staggered segments per column for non-stop flow
      for (int segment = 0; segment < 3; segment++) {
        final phaseOffset = (i * 157 + segment * (h / 1.5)) % 4000;
        final totalY = (time * baseSpeed + phaseOffset) % (h + trailLength * charSize + 500);
        final headY = totalY - (trailLength * charSize);

        for (int j = 0; j < trailLength; j++) {
          final charY = headY + (j * charSize);
          if (charY < -charSize || charY > h + charSize) continue;

          final isHead = j == trailLength - 1;
          // Quantize trail opacity so glyph painters can be cached & reused
          final level = ((j / trailLength) * _opacityLevels).round();
          final char = characters[(i + j + (time * 5).toInt()) % characters.length];
          _cachedGlyph(char, isHead, level).paint(canvas, Offset(i * charSize, charY));
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

  void _drawFire(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final paint = Paint();
    final random = math.Random(42);

    // Dark reddish background
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF0F0404));

    for (int i = 0; i < 40; i++) {
      final t = (time + random.nextDouble()) % 1.0;
      final x = random.nextDouble() * w;
      final baseY = h - (t * h * 1.2);
      final sizePulse = 20.0 + random.nextDouble() * 40.0;
      
      paint.shader = RadialGradient(
        colors: [
          const Color(0xFFFF4D00).withOpacity(0.4 * (1.0 - t)),
          const Color(0xFFFF9500).withOpacity(0.0),
        ],
      ).createShader(Rect.fromCircle(center: Offset(x, baseY), radius: sizePulse));
      
      canvas.drawCircle(Offset(x, baseY), sizePulse, paint);
    }
  }

  void _drawRainbow(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = LinearGradient(
        colors: const [
          Colors.red, Colors.orange, Colors.yellow, 
          Colors.green, Colors.blue, Colors.indigo, Colors.purple
        ],
        begin: Alignment(-2.0 + (time * 4), -1.0),
        end: Alignment(2.0 + (time * 4), 1.0),
        tileMode: TileMode.mirror,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);
  }

  void _drawAurora(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final paint = Paint();

    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF020024));

    for (int i = 0; i < 3; i++) {
        final t = time + (i * 0.3);
        final path = Path();
        path.moveTo(0, h * 0.5);
        for (double x = 0; x < w; x += 10) {
            final y = h * 0.5 + math.sin(x * 0.01 + t * 2) * 50 * math.cos(t + x * 0.005);
            path.lineTo(x, y);
        }
        path.lineTo(w, h);
        path.lineTo(0, h);
        path.close();

        paint.shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
                [const Color(0xFF00D4FF), const Color(0xFF09FF00), const Color(0xFFBD00FF)][i].withOpacity(0.3),
                Colors.transparent
            ],
        ).createShader(Rect.fromLTWH(0, 0, w, h));
        canvas.drawPath(path, paint);
    }
  }

  void _drawOcean(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final paint = Paint();

    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF001233));

    for (int i = 0; i < 4; i++) {
        final t = time * 0.5 + (i * 0.2);
        final path = Path();
        final baseY = h * 0.6 + (i * 40);
        path.moveTo(0, baseY);
        for (double x = 0; x <= w; x += 20) {
            final y = baseY + math.sin(x * 0.02 + t * 5) * 15;
            path.lineTo(x, y);
        }
        path.lineTo(w, h);
        path.lineTo(0, h);
        path.close();

        paint.color = const Color(0xFF0077B6).withOpacity(0.2);
        canvas.drawPath(path, paint);
    }
  }

  void _drawSolar(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final center = Offset(w * 0.5, h * 0.4);
    
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF1A0000));

    final paint = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFFFFD700).withOpacity(0.6 + math.sin(time * 10) * 0.1),
          const Color(0xFFFF4500).withOpacity(0.3),
          Colors.transparent,
        ],
      ).createShader(Rect.fromCircle(center: center, radius: w * 0.8));
    
    canvas.drawCircle(center, w * 0.8, paint);
  }

  void _drawLava(Canvas canvas, Size size) {
    _drawFire(canvas, size); // Lava uses enhanced fire logic
  }

  void _drawSnowfall(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final random = math.Random(123);
    final paint = Paint()..color = Colors.white.withOpacity(0.6);

    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF000814));

    for (int i = 0; i < 60; i++) {
        final t = (time * 0.2 + random.nextDouble()) % 1.0;
        final x = (random.nextDouble() * w + math.sin(time * 2 + i) * 30) % w;
        final y = t * h;
        canvas.drawCircle(Offset(x, y), 1.0 + random.nextDouble() * 2, paint);
    }
  }

  void _drawAutumn(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final random = math.Random(456);
    
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF1C0A00));

    for (int i = 0; i < 20; i++) {
        final t = (time * 0.15 + random.nextDouble()) % 1.0;
        final x = (random.nextDouble() * w + math.cos(time + i) * 50) % w;
        final y = t * h;
        
        final leafPaint = Paint()..color = [
          const Color(0xFFD4A017), 
          const Color(0xFF8B4513), 
          const Color(0xFFA52A2A)
        ][i % 3].withOpacity(0.7 * (1.0 - t * 0.5));
        
        canvas.save();
        canvas.translate(x, y);
        canvas.rotate(time * 2 + i);
        canvas.drawOval(const Rect.fromLTWH(0, 0, 12, 6), leafPaint);
        canvas.restore();
    }
  }

  void _drawCyberpunk(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    
    // Deep dark background
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF0D0208));

    final gridPaint = Paint()
      ..color = const Color(0xFFFF00FF).withOpacity(0.3)
      ..strokeWidth = 1.5;
    
    // 1. Perspective Horizontal Lines (Moving)
    final horizonY = h * 0.4;
    final speed = (time * 100) % 60;
    
    for (double y = horizonY; y < h + 60; y += 30) {
        final adjustedY = y + speed;
        if (adjustedY <= horizonY) continue;
        
        // Perspective adjustment (lines get further apart as they come forward)
        final double perspectiveFactor = (adjustedY - horizonY) / (h - horizonY);
        final paint = Paint()
          ..color = const Color(0xFFFF00FF).withOpacity(0.2 + (perspectiveFactor * 0.4))
          ..strokeWidth = 1 + perspectiveFactor * 2;
          
        canvas.drawLine(Offset(0, adjustedY), Offset(w, adjustedY), paint);
    }
    
    // 2. Perspective Vertical Lines
    for (double x = -w; x < w * 2; x += 40) {
        final double centerX = w / 2;
        canvas.drawLine(
          Offset(centerX, horizonY),
          Offset(x, h),
          gridPaint..color = const Color(0xFF00FFFF).withOpacity(0.2),
        );
    }
    
    // 3. Neon Horizon Glow
    final horizonPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          const Color(0xFFFF00FF).withOpacity(0),
          const Color(0xFFFF00FF).withOpacity(0.8),
          const Color(0xFF00FFFF).withOpacity(0.4),
        ],
      ).createShader(Rect.fromLTWH(0, horizonY - 40, w, 80));
    
    canvas.drawRect(Rect.fromLTWH(0, horizonY - 2, w, 4), horizonPaint);
    
    // 4. Scanlines / Glitch Static
    if (math.sin(time * 20) > 0.8) {
        canvas.drawRect(
          Rect.fromLTWH(0, (time * 300) % h, w, 2),
          Paint()..color = Colors.white.withOpacity(0.1),
        );
    }
  }

  void _drawThunderstorm(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final random = math.Random(time.toInt());
    
    // Dark stormy sky
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF0A0A0F));

    // Periodic lightning flash
    if (math.sin(time * 15) > 0.95 && random.nextDouble() > 0.5) {
        canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = Colors.white.withOpacity(0.15));
        
        final lightningPaint = Paint()..color = Colors.white.withOpacity(0.5)..strokeWidth = 2..style = PaintingStyle.stroke;
        final path = Path();
        path.moveTo(random.nextDouble() * w, 0);
        path.lineTo(random.nextDouble() * w, h * 0.4);
        path.lineTo(random.nextDouble() * w, h * 0.7);
        path.lineTo(random.nextDouble() * w, h);
        canvas.drawPath(path, lightningPaint);
    }

    // Heavy rain
    final rainPaint = Paint()..color = Colors.white24..strokeWidth = 1;
    for (int i = 0; i < 40; i++) {
        final r = math.Random(i);
        final x = (r.nextDouble() * w + time * 50) % w;
        final y = (r.nextDouble() * h + time * 600) % h;
        canvas.drawLine(Offset(x, y), Offset(x + 2, y + 10), rainPaint);
    }
  }

  void _drawCherryBlossom(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final random = math.Random(789);
    
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF1A050D));

    for (int i = 0; i < 25; i++) {
        final t = (time * 0.12 + random.nextDouble()) % 1.0;
        final x = (random.nextDouble() * w + math.sin(time + i) * 40) % w;
        final y = t * h;
        
        final petalPaint = Paint()..color = const Color(0xFFFFB7C5).withOpacity(0.6 * (1.0 - t * 0.3));
        
        canvas.save();
        canvas.translate(x, y);
        canvas.rotate(time * 1.5 + i);
        canvas.drawOval(const Rect.fromLTWH(0, 0, 8, 5), petalPaint);
        canvas.restore();
    }
  }

  void _drawNeonPulse(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final paint = Paint()
      ..color = const Color(0xFFBD00FF).withOpacity(0.1 + math.sin(time * 5).abs() * 0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF0D0208));
    
    for (int i = 0; i < 10; i++) {
        final radius = (time * 500 + i * 50) % 600.0;
        canvas.drawCircle(Offset(w * 0.5, h * 0.5), radius, paint);
    }
  }

  /// Football themes: each club has its own signature animated scene.
  void _drawFootball(Canvas canvas, Size size, String typeStr) {
    FootballScene.paint(canvas, size, time, typeStr);
  }

  /// Orthodox faith themes: golden god-rays and floating holy light.
  void _drawHolyRays(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h),
        Paint()..color = const Color(0xFF120A02));
    final c = Offset(w * 0.5, -h * 0.1);
    final rot = time * 2 * math.pi * 0.15;
    final ray = Paint()..blendMode = BlendMode.plus;
    for (int i = 0; i < 9; i++) {
      final a = rot + i * math.pi / 4.5 + math.pi * 0.25;
      ray.shader = RadialGradient(colors: [
        const Color(0xFFFFD700).withOpacity(0.14),
        Colors.transparent,
      ]).createShader(Rect.fromCircle(center: c, radius: h * 1.2));
      canvas.drawPath(
        Path()
          ..moveTo(c.dx, c.dy)
          ..lineTo(c.dx + math.cos(a) * h * 1.4, c.dy + math.sin(a) * h * 1.4)
          ..lineTo(c.dx + math.cos(a + 0.16) * h * 1.4,
              c.dy + math.sin(a + 0.16) * h * 1.4)
          ..close(),
        ray,
      );
    }
    // Floating holy light motes
    final rand = math.Random(41);
    for (int i = 0; i < 22; i++) {
      final t = (time * 0.4 + rand.nextDouble()) % 1.0;
      final mx = (rand.nextDouble() * w + math.sin(time * 2 + i) * 18) % w;
      final my = h - t * h;
      final tw = math.sin((time * 4 + i) * math.pi) * 0.5 + 0.5;
      canvas.drawCircle(
          Offset(mx, my),
          1.5 + tw,
          Paint()
            ..color = const Color(0xFFFFE082).withOpacity(0.5 * tw * (1 - t)));
    }
    // Soft central halo
    canvas.drawCircle(
        Offset(w * 0.5, h * 0.4),
        w * 0.3,
        Paint()
          ..shader = RadialGradient(colors: [
            const Color(0xFFFFD700).withOpacity(0.12),
            Colors.transparent
          ]).createShader(
              Rect.fromCircle(center: Offset(w * 0.5, h * 0.4), radius: w * 0.3)));
  }

  /// Islamic faith themes: crescent moon, stars and warm lantern light.
  void _drawCrescentNight(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h),
        Paint()
          ..shader = const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF07103A), Color(0xFF040817)],
          ).createShader(Rect.fromLTWH(0, 0, w, h)));
    // Crescent moon
    final mc = Offset(w * 0.72, h * 0.24);
    canvas.drawCircle(mc, 22, Paint()..color = const Color(0xFFFFF3D6));
    canvas.drawCircle(
        mc + const Offset(9, -4), 19, Paint()..color = const Color(0xFF07103A));
    canvas.drawCircle(
        mc,
        40,
        Paint()
          ..shader = RadialGradient(colors: [
            const Color(0xFFFFF3D6).withOpacity(0.2),
            Colors.transparent
          ]).createShader(Rect.fromCircle(center: mc, radius: 40)));
    // Twinkling stars
    final rand = math.Random(43);
    for (int i = 0; i < 30; i++) {
      final sx = rand.nextDouble() * w;
      final sy = rand.nextDouble() * h * 0.55;
      final tw = math.sin((time * 4 + rand.nextDouble() * 4) * math.pi) * 0.5 + 0.5;
      canvas.drawCircle(Offset(sx, sy), 0.8 + tw,
          Paint()..color = Colors.white.withOpacity(0.25 + 0.55 * tw));
    }
    // Warm lanterns drifting upward
    for (int i = 0; i < 6; i++) {
      final rand2 = math.Random(i * 11 + 3);
      final t = (time * 0.5 + rand2.nextDouble()) % 1.0;
      final lx = rand2.nextDouble() * w + math.sin(time * 2 * math.pi + i) * 14;
      final ly = h - t * h * 1.1;
      final glow = math.sin((time * 6 + i) * math.pi) * 0.5 + 0.5;
      canvas.drawCircle(
          Offset(lx, ly),
          14,
          Paint()
            ..shader = RadialGradient(colors: [
              const Color(0xFFFFB74D).withOpacity(0.35 * (0.6 + glow * 0.4)),
              Colors.transparent
            ]).createShader(Rect.fromCircle(center: Offset(lx, ly), radius: 14)));
      canvas.drawRRect(
          RRect.fromRectAndRadius(
              Rect.fromCenter(center: Offset(lx, ly), width: 7, height: 11),
              const Radius.circular(3)),
          Paint()..color = const Color(0xFFFF9800).withOpacity(0.8 * (1 - t * 0.4)));
    }
  }

  /// Fireflies: drifting motes over a dark forest, each blinking on its own
  /// rhythm.
  void _drawFireflies(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h),
        Paint()
          ..shader = const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF01140A), Color(0xFF06301C)],
          ).createShader(Rect.fromLTWH(0, 0, w, h)));

    // Faint silhouetted grass line at the bottom
    final grass = Paint()..color = const Color(0xFF010D06);
    final grassPath = Path()..moveTo(0, h);
    for (double x = 0; x <= w; x += 24) {
      grassPath.lineTo(x, h - 14 - math.sin(x * 0.08) * 8);
    }
    grassPath
      ..lineTo(w, h)
      ..close();
    canvas.drawPath(grassPath, grass);

    final rand = math.Random(7);
    for (int i = 0; i < 24; i++) {
      final sx = rand.nextDouble(), sy = rand.nextDouble();
      final phase = rand.nextDouble() * 2 * math.pi;
      final x = (sx * w +
              math.sin(time * 2 * math.pi * 0.6 + phase) * 42 +
              math.cos(time * 2 * math.pi * 0.23 + phase * 2) * 26) %
          w;
      final y = (sy * h + math.cos(time * 2 * math.pi * 0.4 + phase) * 30) % h;
      final blink = math
          .pow(math.sin(time * 2 * math.pi * (1.2 + sx) + phase) * 0.5 + 0.5, 3)
          .toDouble();
      if (blink < 0.05) continue;
      final p = Offset(x, y);
      canvas.drawCircle(
          p,
          9 + blink * 6,
          Paint()
            ..shader = RadialGradient(colors: [
              const Color(0xFFD4FF50).withOpacity(0.30 * blink),
              Colors.transparent,
            ]).createShader(Rect.fromCircle(center: p, radius: 9 + blink * 6)));
      canvas.drawCircle(p, 1.4 + blink * 1.2,
          Paint()..color = const Color(0xFFF4FFB0).withOpacity(0.3 + 0.7 * blink));
    }
  }

  /// Lava lamp: slow goopy blobs rising and sinking in warm light.
  void _drawLavaLamp(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h),
        Paint()
          ..shader = const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF2A0A02), Color(0xFF48120A)],
          ).createShader(Rect.fromLTWH(0, 0, w, h)));

    final blob = Paint()..blendMode = BlendMode.plus;
    final rand = math.Random(11);
    for (int i = 0; i < 6; i++) {
      final sx = 0.12 + rand.nextDouble() * 0.76;
      final speed = 0.25 + rand.nextDouble() * 0.35;
      final phase = rand.nextDouble() * 2 * math.pi;
      // Ping-pong vertical travel
      final tt = (time * speed + phase / (2 * math.pi)) % 1.0;
      final yy = 0.5 - 0.42 * math.cos(tt * 2 * math.pi);
      final cx = sx * w + math.sin(time * 2 * math.pi * 0.3 + phase) * 12;
      final cy = yy * h;
      final wobble = 1.0 + math.sin(time * 2 * math.pi * 1.4 + phase) * 0.12;
      final r = (26 + rand.nextDouble() * 26) * wobble;
      blob.shader = RadialGradient(colors: [
        const Color(0xFFFF6B1A).withOpacity(0.55),
        const Color(0xFFFF2E63).withOpacity(0.18),
        Colors.transparent,
      ]).createShader(Rect.fromCircle(center: Offset(cx, cy), radius: r * 1.6));
      canvas.drawCircle(Offset(cx, cy), r * 1.6, blob);
    }
    // Warm light from the base
    canvas.drawRect(
        Rect.fromLTWH(0, h * 0.75, w, h * 0.25),
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              const Color(0xFFFFB01A).withOpacity(0.20),
              Colors.transparent
            ],
          ).createShader(Rect.fromLTWH(0, h * 0.75, w, h * 0.25)));
  }

  /// Circuit board: PCB traces with signal pulses running along them.
  void _drawCircuitBoard(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF03140A));

    const green = Color(0xFF16A34A);
    final trace = Paint()
      ..color = green.withOpacity(0.28)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6;
    final pad = Paint()..color = green.withOpacity(0.5);

    final rand = math.Random(19);
    for (int i = 0; i < 12; i++) {
      // Manhattan-style trace: start point, horizontal run, then vertical.
      final x0 = rand.nextDouble() * w;
      final y0 = rand.nextDouble() * h;
      final dx = (rand.nextDouble() - 0.5) * w * 0.7;
      final dy = (rand.nextDouble() - 0.5) * h * 0.7;
      final p1 = Offset(x0 + dx, y0);
      final p2 = Offset(x0 + dx, y0 + dy);

      canvas.drawLine(Offset(x0, y0), p1, trace);
      canvas.drawLine(p1, p2, trace);
      canvas.drawCircle(Offset(x0, y0), 2.4, pad);
      canvas.drawCircle(p2, 2.4, pad);

      // Signal pulse travelling start → corner → end
      final len1 = dx.abs(), len2 = dy.abs();
      final total = len1 + len2;
      if (total < 1) continue;
      final tt = (time * (0.6 + rand.nextDouble() * 0.8) +
              rand.nextDouble()) %
          1.0;
      final d = tt * total;
      final pos = d < len1
          ? Offset(x0 + dx.sign * d, y0)
          : Offset(x0 + dx, y0 + dy.sign * (d - len1));
      canvas.drawCircle(
          pos,
          5,
          Paint()
            ..shader = RadialGradient(colors: [
              const Color(0xFF4ADE80).withOpacity(0.8),
              Colors.transparent,
            ]).createShader(Rect.fromCircle(center: pos, radius: 5)));
      canvas.drawCircle(pos, 1.6, Paint()..color = const Color(0xFFBBF7D0));
    }
  }

  /// Geometric flow: wireframe shapes drifting upward and slowly rotating.
  void _drawGeometricFlow(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF0A0A0A));

    final rand = math.Random(23);
    for (int i = 0; i < 14; i++) {
      final sx = rand.nextDouble();
      final speed = 0.08 + rand.nextDouble() * 0.12;
      final tt = (time * speed + rand.nextDouble()) % 1.0;
      final cx = sx * w + math.sin(time * 2 * math.pi * 0.2 + i) * 20;
      final cy = h * (1.1 - tt * 1.2);
      final r = 10.0 + rand.nextDouble() * 26;
      final sides = 3 + (i % 4); // triangles, squares, pentagons, hexagons
      final rot = time * 2 * math.pi * (0.1 + rand.nextDouble() * 0.15) +
          rand.nextDouble() * math.pi;
      final color = [
        const Color(0xFF3B82F6),
        const Color(0xFF60A5FA),
        const Color(0xFF93C5FD),
        Colors.white,
      ][i % 4]
          .withOpacity(0.10 + 0.25 * (1 - (tt - 0.5).abs() * 2));

      final path = Path();
      for (int v = 0; v <= sides; v++) {
        final a = rot + v * 2 * math.pi / sides;
        final p = Offset(cx + math.cos(a) * r, cy + math.sin(a) * r);
        v == 0 ? path.moveTo(p.dx, p.dy) : path.lineTo(p.dx, p.dy);
      }
      canvas.drawPath(
          path,
          Paint()
            ..color = color
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.4);
    }
  }

  /// Starfield: warp-speed stars streaking outward from the center.
  void _drawStarfield(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF02030A));

    final center = Offset(w * 0.5, h * 0.42);
    final maxDist = math.max(w, h) * 0.75;
    final rand = math.Random(29);
    for (int i = 0; i < 90; i++) {
      final angle = rand.nextDouble() * 2 * math.pi;
      final speed = 0.35 + rand.nextDouble() * 0.65;
      final tt = (time * speed * 2 + rand.nextDouble()) % 1.0;
      final d = tt * tt * maxDist; // accelerate outward
      final dir = Offset(math.cos(angle), math.sin(angle));
      final pos = center + dir * d;
      final tail = center + dir * math.max(0, d - 6 - tt * 26);
      final o = (0.15 + tt * 0.85).clamp(0.0, 1.0);
      canvas.drawLine(
          tail,
          pos,
          Paint()
            ..color = Color.lerp(const Color(0xFF93C5FD), Colors.white, tt)!
                .withOpacity(o)
            ..strokeWidth = 0.8 + tt * 1.8
            ..strokeCap = StrokeCap.round);
    }
  }

  /// Meteor shower: twinkling night sky with periodic shooting stars.
  void _drawMeteorShower(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h),
        Paint()
          ..shader = const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF060B22), Color(0xFF0B1026)],
          ).createShader(Rect.fromLTWH(0, 0, w, h)));

    // Star bed
    final rand = math.Random(31);
    for (int i = 0; i < 40; i++) {
      final sx = rand.nextDouble() * w;
      final sy = rand.nextDouble() * h * 0.8;
      final tw = math.sin((time * 3 + rand.nextDouble() * 6) * math.pi) * 0.5 + 0.5;
      canvas.drawCircle(Offset(sx, sy), 0.7 + tw * 0.9,
          Paint()..color = Colors.white.withOpacity(0.2 + 0.5 * tw));
    }

    // Meteors: each slot fires on its own cycle
    for (int i = 0; i < 4; i++) {
      final r2 = math.Random(i * 17 + 5);
      final cycle = (time * (0.55 + r2.nextDouble() * 0.3) + r2.nextDouble()) % 1.0;
      if (cycle > 0.30) continue; // visible for the first 30% of its cycle
      final p = cycle / 0.30;
      final startX = r2.nextDouble() * w * 1.2;
      final startY = -20.0 + r2.nextDouble() * h * 0.25;
      final travel = 260.0 + r2.nextDouble() * 160;
      const dirX = -0.82, dirY = 0.57; // fixed diagonal
      final head =
          Offset(startX + dirX * travel * p, startY + dirY * travel * p);
      final tail = head - const Offset(dirX, dirY) * (55 + 40 * (1 - p));
      final fade = (1 - p) * 0.9;
      canvas.drawLine(
          tail,
          head,
          Paint()
            ..shader = LinearGradient(colors: [
              Colors.transparent,
              const Color(0xFFFDE68A).withOpacity(fade),
            ]).createShader(Rect.fromPoints(tail, head))
            ..strokeWidth = 2.2
            ..strokeCap = StrokeCap.round);
      canvas.drawCircle(
          head,
          6,
          Paint()
            ..shader = RadialGradient(colors: [
              Colors.white.withOpacity(fade),
              Colors.transparent,
            ]).createShader(Rect.fromCircle(center: head, radius: 6)));
    }
  }

  /// Fireworks: rockets that burst into fading sparks.
  void _drawFireworks(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h),
        Paint()
          ..shader = const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0B0614), Color(0xFF160B24)],
          ).createShader(Rect.fromLTWH(0, 0, w, h)));

    const colors = [
      Color(0xFFF472B6),
      Color(0xFFFBBF24),
      Color(0xFF60A5FA),
      Color(0xFF4ADE80),
      Color(0xFFF87171),
    ];

    for (int i = 0; i < 3; i++) {
      final speed = 0.45 + i * 0.13;
      final t0 = time * speed + i * 0.37;
      final cycle = t0 % 1.0;
      final burstSeed = t0.floor() * 7 + i * 13;
      final r2 = math.Random(burstSeed);
      final cx = w * (0.15 + r2.nextDouble() * 0.7);
      final cy = h * (0.15 + r2.nextDouble() * 0.35);
      final color = colors[burstSeed.abs() % colors.length];

      if (cycle < 0.28) {
        // Rocket rising
        final p = cycle / 0.28;
        final y = h - (h - cy) * p;
        canvas.drawCircle(Offset(cx, y), 2,
            Paint()..color = Colors.white.withOpacity(0.85));
        canvas.drawLine(
            Offset(cx, y + 4),
            Offset(cx, y + 16),
            Paint()
              ..color = const Color(0xFFFBBF24).withOpacity(0.5 * (1 - p))
              ..strokeWidth = 1.5);
      } else {
        // Burst
        final p = ((cycle - 0.28) / 0.72).clamp(0.0, 1.0);
        final radius = p * (60 + r2.nextDouble() * 40);
        final fade = (1 - p);
        final spark = Paint()
          ..color = color.withOpacity(0.85 * fade)
          ..strokeWidth = 1.6
          ..strokeCap = StrokeCap.round;
        for (int s = 0; s < 18; s++) {
          final a = s * 2 * math.pi / 18 + r2.nextDouble() * 0.2;
          final droop = p * p * 26; // gravity pulls sparks down
          final tip = Offset(
              cx + math.cos(a) * radius, cy + math.sin(a) * radius + droop);
          final inner = Offset(cx + math.cos(a) * radius * 0.72,
              cy + math.sin(a) * radius * 0.72 + droop * 0.8);
          canvas.drawLine(inner, tip, spark);
        }
        canvas.drawCircle(
            Offset(cx, cy),
            radius * 0.35,
            Paint()
              ..shader = RadialGradient(colors: [
                color.withOpacity(0.35 * fade),
                Colors.transparent,
              ]).createShader(
                  Rect.fromCircle(center: Offset(cx, cy), radius: radius * 0.35)));
      }
    }
  }

  /// Bokeh: big soft out-of-focus city lights drifting gently.
  void _drawBokeh(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h),
        Paint()
          ..shader = const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF130C07), Color(0xFF221207)],
          ).createShader(Rect.fromLTWH(0, 0, w, h)));

    const colors = [
      Color(0xFFFFB84D),
      Color(0xFFFF7B9C),
      Color(0xFF7DD3FC),
      Color(0xFFFDE68A),
    ];
    final orb = Paint()..blendMode = BlendMode.plus;
    final rand = math.Random(37);
    for (int i = 0; i < 16; i++) {
      final sx = rand.nextDouble(), sy = rand.nextDouble();
      final phase = rand.nextDouble() * 2 * math.pi;
      final x = sx * w + math.sin(time * 2 * math.pi * 0.15 + phase) * 30;
      final y = sy * h + math.cos(time * 2 * math.pi * 0.11 + phase) * 22;
      final pulse = math.sin(time * 2 * math.pi * 0.5 + phase) * 0.5 + 0.5;
      final r = 16.0 + rand.nextDouble() * 34;
      final color = colors[i % colors.length];
      orb.shader = RadialGradient(colors: [
        color.withOpacity(0.10 + 0.10 * pulse),
        color.withOpacity(0.03),
        Colors.transparent,
      ]).createShader(Rect.fromCircle(center: Offset(x, y), radius: r));
      canvas.drawCircle(Offset(x, y), r, orb);
    }
  }

  /// Zen pond: expanding rain ripples on still dark water.
  void _drawRipples(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h),
        Paint()
          ..shader = const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF032422), Color(0xFF06403A)],
          ).createShader(Rect.fromLTWH(0, 0, w, h)));

    // Soft light caustics
    final caustic = Paint()
      ..color = const Color(0xFF34D399).withOpacity(0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8;
    for (int i = 0; i < 3; i++) {
      final path = Path()..moveTo(0, h * (0.25 + i * 0.25));
      for (double x = 0; x <= w; x += 16) {
        path.lineTo(
            x,
            h * (0.25 + i * 0.25) +
                math.sin(x * 0.02 + time * 2 * math.pi + i * 2) * 10);
      }
      canvas.drawPath(path, caustic);
    }

    // Ripple rings
    final rand = math.Random(41);
    for (int i = 0; i < 7; i++) {
      final cx = rand.nextDouble() * w;
      final cy = rand.nextDouble() * h;
      final speed = 0.35 + rand.nextDouble() * 0.3;
      final tt = (time * speed + rand.nextDouble()) % 1.0;
      final maxR = 40 + rand.nextDouble() * 50;
      final fade = (1 - tt) * 0.4;
      final ring = Paint()
        ..color = const Color(0xFF6EE7B7).withOpacity(fade)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.6 * (1 - tt) + 0.4;
      canvas.drawCircle(Offset(cx, cy), tt * maxR, ring);
      // Trailing inner ring
      if (tt > 0.25) {
        canvas.drawCircle(Offset(cx, cy), (tt - 0.25) * maxR,
            ring..color = const Color(0xFF6EE7B7).withOpacity(fade * 0.5));
      }
    }
  }

  /// Glitch: RGB-split slices, static noise and rolling scanlines.
  void _drawGlitch(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    canvas.drawRect(
        Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFF060606));

    // Subtle scanlines
    final scan = Paint()..color = Colors.white.withOpacity(0.025);
    for (double y = (time * 30) % 6; y < h; y += 6) {
      canvas.drawRect(Rect.fromLTWH(0, y, w, 1), scan);
    }

    // Glitch slices change a few times per second
    final frame = (time * 8).floor();
    final rand = math.Random(frame);
    final sliceCount = 2 + rand.nextInt(3);
    for (int i = 0; i < sliceCount; i++) {
      final y = rand.nextDouble() * h;
      final sh = 4.0 + rand.nextDouble() * 18;
      final shift = (rand.nextDouble() - 0.5) * 44;
      canvas.drawRect(Rect.fromLTWH(shift, y, w, sh),
          Paint()..color = const Color(0xFFFF2E63).withOpacity(0.16));
      canvas.drawRect(Rect.fromLTWH(-shift, y + sh * 0.4, w, sh * 0.7),
          Paint()..color = const Color(0xFF22D3EE).withOpacity(0.16));
    }

    // Static noise specks
    final noise = Paint()..color = Colors.white.withOpacity(0.12);
    for (int i = 0; i < 60; i++) {
      final x = rand.nextDouble() * w;
      final y = rand.nextDouble() * h;
      canvas.drawRect(Rect.fromLTWH(x, y, 1.6, 1.6), noise);
    }

    // Occasional bright tear across the screen
    if (rand.nextDouble() > 0.72) {
      final y = rand.nextDouble() * h;
      canvas.drawRect(Rect.fromLTWH(0, y, w, 2),
          Paint()..color = Colors.white.withOpacity(0.22));
    }
  }

  void _drawOverlays(Canvas canvas, Size size, String typeStr) {
    final w = size.width;
    final h = size.height;

    // Subtle vignettes or scanlines based on theme
    if (typeStr.contains('cyberpunk')) {
      // Glow horizon and scanlines for cyberpunk images
      final horizonY = h * 0.4;
      if (math.sin(time * 20) > 0.8) {
        canvas.drawRect(
          Rect.fromLTWH(0, (time * 300) % h, w, 2),
          Paint()..color = Colors.white.withOpacity(0.1),
        );
      }
    } else if (typeStr.contains('judah_lion') || typeStr.contains('eth_flag') || typeStr.contains('cultural')) {
      // Warm glow for cultural themes
      final paint = Paint()
        ..shader = RadialGradient(
          colors: [
            const Color(0x30FFD700),
            Colors.transparent,
          ],
        ).createShader(Rect.fromLTWH(0, 0, w, h));
      canvas.drawRect(Rect.fromLTWH(0, 0, w, h), paint);
    }
  }

  @override
  bool shouldRepaint(_LiveThemePainter oldDelegate) => true;
}
