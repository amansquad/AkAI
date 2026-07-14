import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Per-club style: kit colors + signature animated motif.
class TeamStyle {
  final Color primary;
  final Color secondary;
  final String motif;
  const TeamStyle(this.primary, this.secondary, this.motif);
}

/// Paints a distinct animated stadium scene per football club.
/// Every club has its own kit colors, aura and a signature motif —
/// e.g. Arsenal fires a cannon with muzzle flash, fire and drifting smoke.
class FootballScene {
  static const Map<String, TeamStyle> styles = {
    // ── Ethiopian clubs ────────────────────────────────────────────────
    'fb_stgeorge': TeamStyle(Color(0xFFFFD100), Color(0xFFD7191C), 'knight'),
    'fb_coffee': TeamStyle(Color(0xFF8B4513), Color(0xFFFFC107), 'coffee'),
    'club_sidama': TeamStyle(Color(0xFF2E7D32), Color(0xFF795548), 'branch'),
    'fb_mekelle': TeamStyle(Color(0xFFE53935), Color(0xFFFFD600), 'fireworks'),
    'fb_diredawa': TeamStyle(Color(0xFFFF7043), Color(0xFF1E88E5), 'train'),
    'club_awash': TeamStyle(Color(0xFF1976D2), Color(0xFFE3F2FD), 'rapids'),
    'club_arba': TeamStyle(Color(0xFF43A047), Color(0xFFB2DFDB), 'springs'),
    'fb_hawassa': TeamStyle(Color(0xFF00ACC1), Color(0xFF01579B), 'fish'),
    'club_bahirdar': TeamStyle(Color(0xFF00ACC1), Color(0xFF1A237E), 'waves'),
    'club_electric': TeamStyle(Color(0xFFFFD600), Color(0xFF00B0FF), 'bolt'),
    'fb_leipzig': TeamStyle(Color(0xFFDD0741), Color(0xFF001F47), 'bull'),
    'club_insurance': TeamStyle(Color(0xFF2E7D32), Color(0xFFFFC107), 'shield'),
    'club_mekel': TeamStyle(Color(0xFF4E6E33), Color(0xFFC62828), 'swords'),
    'club_dicha': TeamStyle(Color(0xFF1565C0), Color(0xFFC62828), 'eagle'),
    'fb_cbe': TeamStyle(Color(0xFF7B1FA2), Color(0xFFFFC107), 'coins'),
    'club_cbe': TeamStyle(Color(0xFF7B1FA2), Color(0xFFFFC107), 'coins'),
    'club_negede': TeamStyle(Color(0xFFB71C1C), Color(0xFFFFD600), 'caravan'),
    'fb_negele_arsi': TeamStyle(Color(0xFF388E3C), Color(0xFFD32F2F), 'wheat'),
    'club_shire': TeamStyle(Color(0xFF1565C0), Color(0xFFE3F2FD), 'obelisk'),
    'club_welwalo': TeamStyle(Color(0xFFC62828), Color(0xFFFFF8E1), 'temple'),
    'club_fasil': TeamStyle(Color(0xFFC62828), Color(0xFFFFD600), 'castle'),
    'club_woldia': TeamStyle(Color(0xFF2E7D32), Color(0xFFFFD600), 'sunrise'),
    'club_hamb': TeamStyle(Color(0xFF00897B), Color(0xFFE0F2F1), 'peaks'),
    'club_adama': TeamStyle(Color(0xFFF57C00), Color(0xFF388E3C), 'windmill'),
    'club_hadiya': TeamStyle(Color(0xFFF9A825), Color(0xFFC62828), 'lion'),
    // ── European clubs ─────────────────────────────────────────────────
    'fb_arsenal': TeamStyle(Color(0xFFEF0107), Color(0xFFFFF3E0), 'cannon'),
    'fb_manutd': TeamStyle(Color(0xFFDA020E), Color(0xFFFBE122), 'devil'),
    'fb_milan': TeamStyle(Color(0xFFFB090B), Color(0xFF1A1A1A), 'devil'),
    'fb_realmadrid': TeamStyle(Color(0xFFF5F5F5), Color(0xFFFEBE10), 'crown'),
    'fb_monaco': TeamStyle(Color(0xFFE63312), Color(0xFFF5F5F5), 'crown'),
    'fb_barca': TeamStyle(Color(0xFF004D98), Color(0xFFA50044), 'stripes'),
    'fb_juventus': TeamStyle(Color(0xFFF5F5F5), Color(0xFF141414), 'stripes'),
    'fb_inter': TeamStyle(Color(0xFF0068A8), Color(0xFF10141C), 'serpent'),
    'fb_mancity': TeamStyle(Color(0xFF6CABDD), Color(0xFFFFFFFF), 'clouds'),
    'fb_liverpool': TeamStyle(Color(0xFFC8102E), Color(0xFF00B2A9), 'wings'),
    'fb_chelsea': TeamStyle(Color(0xFF034694), Color(0xFFFFC107), 'rays'),
    'fb_psg': TeamStyle(Color(0xFF004170), Color(0xFFDA291C), 'eiffel'),
    'fb_bayern': TeamStyle(Color(0xFFDC052D), Color(0xFF0066B2), 'diamonds'),
    'fb_dortmund': TeamStyle(Color(0xFFFDE100), Color(0xFF16161A), 'wall'),
  };

  static void paint(Canvas canvas, Size size, double time, String type) {
    final style = styles[type] ??
        const TeamStyle(Color(0xFF2E7D32), Color(0xFFFFFFFF), 'sunburst');
    _backdrop(canvas, size, time, style);
    switch (style.motif) {
      case 'cannon':
        _cannon(canvas, size, time, style);
        break;
      case 'devil':
        _devil(canvas, size, time, style);
        break;
      case 'crown':
        _crown(canvas, size, time, style);
        break;
      case 'stripes':
        _stripes(canvas, size, time, style);
        break;
      case 'serpent':
        _serpent(canvas, size, time, style);
        break;
      case 'clouds':
        _clouds(canvas, size, time, style);
        break;
      case 'wings':
        _wings(canvas, size, time, style);
        break;
      case 'rays':
        _rays(canvas, size, time, style);
        break;
      case 'eiffel':
        _eiffel(canvas, size, time, style);
        break;
      case 'diamonds':
        _diamonds(canvas, size, time, style);
        break;
      case 'wall':
        _wall(canvas, size, time, style);
        break;
      case 'bolt':
        _bolt(canvas, size, time, style);
        break;
      case 'knight':
        _knight(canvas, size, time, style);
        break;
      case 'coffee':
        _coffee(canvas, size, time, style);
        break;
      case 'waves':
        _waves(canvas, size, time, style);
        break;
      case 'castle':
        _castle(canvas, size, time, style);
        break;
      case 'coins':
        _coins(canvas, size, time, style);
        break;
      case 'shield':
        _shield(canvas, size, time, style);
        break;
      case 'windmill':
        _windmill(canvas, size, time, style);
        break;
      case 'fireworks':
        _fireworks(canvas, size, time, style);
        break;
      case 'train':
        _train(canvas, size, time, style);
        break;
      case 'wheat':
        _wheat(canvas, size, time, style);
        break;
      case 'sunrise':
        _sunrise(canvas, size, time, style);
        break;
      case 'peaks':
        _peaks(canvas, size, time, style);
        break;
      case 'lion':
        _lion(canvas, size, time, style);
        break;
      case 'springs':
        _springs(canvas, size, time, style);
        break;
      case 'fish':
        _fish(canvas, size, time, style);
        break;
      case 'rapids':
        _rapids(canvas, size, time, style);
        break;
      case 'obelisk':
        _obelisk(canvas, size, time, style);
        break;
      case 'temple':
        _temple(canvas, size, time, style);
        break;
      case 'swords':
        _swords(canvas, size, time, style);
        break;
      case 'eagle':
        _eagle(canvas, size, time, style);
        break;
      case 'caravan':
        _caravan(canvas, size, time, style);
        break;
      case 'branch':
        _branch(canvas, size, time, style);
        break;
      case 'bull':
        _bull(canvas, size, time, style);
        break;
      default:
        _sunburst(canvas, size, time, style);
    }
    _pitch(canvas, size, time);
    _confetti(canvas, size, time, style);
    _vignette(canvas, size);
  }

  // ── Shared stage ─────────────────────────────────────────────────────

  static void _backdrop(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    canvas.drawRect(
      Rect.fromLTWH(0, 0, w, h),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color.lerp(const Color(0xFF05070F), st.primary, 0.25)!,
            const Color(0xFF04060C),
            Color.lerp(const Color(0xFF04060C), st.primary, 0.10)!,
          ],
          stops: const [0.0, 0.55, 1.0],
        ).createShader(Rect.fromLTWH(0, 0, w, h)),
    );
    // Floodlight beams
    final beamPaint = Paint()..blendMode = BlendMode.plus;
    for (int i = 0; i < 2; i++) {
      final origin = Offset(i == 0 ? -w * 0.05 : w * 1.05, -h * 0.05);
      final sweep = math.sin(time * 2 * math.pi + i * math.pi) * 0.15;
      final angle = (i == 0 ? 0.9 : math.pi - 0.9) + sweep;
      final dir = Offset(math.cos(angle), math.sin(angle));
      final tip = origin + dir * (h * 1.3);
      final perp = Offset(-dir.dy, dir.dx) * (w * 0.20);
      beamPaint.shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [const Color(0xFFFFF8E1).withOpacity(0.13), Colors.transparent],
      ).createShader(Rect.fromPoints(origin, tip));
      canvas.drawPath(
        Path()
          ..moveTo(origin.dx, origin.dy)
          ..lineTo(tip.dx + perp.dx, tip.dy + perp.dy)
          ..lineTo(tip.dx - perp.dx, tip.dy - perp.dy)
          ..close(),
        beamPaint,
      );
    }
    // Crowd camera flashes
    final rand = math.Random(7);
    final flash = Paint();
    for (int i = 0; i < 40; i++) {
      final fx = rand.nextDouble() * w;
      final fy = h * 0.06 + rand.nextDouble() * h * 0.26;
      final tw = math.sin((time * 6 + rand.nextDouble()) * 2 * math.pi);
      if (tw < 0.55) continue;
      final o = ((tw - 0.55) / 0.45).clamp(0.0, 1.0);
      flash.color =
          (i % 3 == 0 ? st.secondary : Colors.white).withOpacity(0.5 * o);
      canvas.drawCircle(Offset(fx, fy), 1.2 + o * 1.2, flash);
    }
  }

  static void _pitch(Canvas canvas, Size size, double time) {
    final w = size.width, h = size.height;
    final top = h * 0.78;
    final rect = Rect.fromLTWH(0, top, w, h - top);
    canvas.drawRect(
      rect,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: const [Color(0xFF0A3D1E), Color(0xFF072B15)],
        ).createShader(rect),
    );
    final stripe = Paint()..color = const Color(0xFF0E4B26).withOpacity(0.55);
    const n = 9;
    for (int s = 0; s < n; s += 2) {
      final a = s / n, b = (s + 1) / n;
      canvas.drawPath(
        Path()
          ..moveTo(w * 0.5 + (a - 0.5) * w * 0.9, top)
          ..lineTo(w * 0.5 + (b - 0.5) * w * 0.9, top)
          ..lineTo(w * 0.5 + (b - 0.5) * w * 1.25, h)
          ..lineTo(w * 0.5 + (a - 0.5) * w * 1.25, h)
          ..close(),
        stripe,
      );
    }
    final line = Paint()
      ..color = Colors.white.withOpacity(0.45)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    canvas.drawLine(Offset(0, top + 1), Offset(w, top + 1), line);
    canvas.drawOval(
      Rect.fromCenter(
          center: Offset(w * 0.5, top), width: w * 0.3, height: h * 0.07),
      line..color = Colors.white.withOpacity(0.3),
    );
    // Ball arcing with trail
    final t = (time * 3) % 1.0;
    final bx = w * (0.12 + t * 0.76);
    final by = top + (h - top) * 0.45 - math.sin(t * math.pi * 3).abs() * h * 0.08;
    canvas.drawCircle(
      Offset(bx, by),
      6,
      Paint()
        ..color = Colors.white.withOpacity(0.25)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5),
    );
    canvas.drawCircle(Offset(bx, by), 4.5, Paint()..color = Colors.white);
    final spin = t * 10 * math.pi;
    for (int d = 0; d < 3; d++) {
      final a = spin + d * (2 * math.pi / 3);
      canvas.drawCircle(Offset(bx, by) + Offset(math.cos(a), math.sin(a)) * 2.2,
          1.0, Paint()..color = const Color(0xFF1A1A1A));
    }
  }

  static void _confetti(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final rand = math.Random(21);
    for (int i = 0; i < 22; i++) {
      final t = (time * 0.5 + rand.nextDouble()) % 1.0;
      final cx = (rand.nextDouble() * w + math.sin(time * 2 * math.pi + i) * 24) % w;
      final cy = t * h;
      canvas.save();
      canvas.translate(cx, cy);
      canvas.rotate(time * 4 * math.pi + i);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
            const Rect.fromLTWH(-3, -1.5, 6, 3), const Radius.circular(1)),
        Paint()
          ..color = (i.isEven ? st.primary : st.secondary)
              .withOpacity(0.7 * (1.0 - t * 0.6)),
      );
      canvas.restore();
    }
  }

  static void _vignette(Canvas canvas, Size size) {
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()
        ..shader = RadialGradient(
          radius: 1.1,
          colors: [Colors.transparent, Colors.black.withOpacity(0.35)],
          stops: const [0.6, 1.0],
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height)),
    );
  }

  // ── Signature motifs ─────────────────────────────────────────────────

  /// Arsenal: a cannon that fires — recoil, muzzle flash, fire and smoke.
  static void _cannon(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final cycle = (time * 10) % 1.0; // one shot every 2 seconds
    const angle = -0.32;
    final dir = Offset(math.cos(angle), math.sin(angle));
    final recoil =
        cycle < 0.12 ? -math.sin(cycle / 0.12 * math.pi) * 12.0 : 0.0;
    final base = Offset(w * 0.20 + dir.dx * recoil, h * 0.56 + dir.dy * recoil);
    final barrelLen = w * 0.22;

    // Wheel (behind the barrel)
    final wheelC = Offset(w * 0.245, h * 0.56 + 22);
    canvas.drawCircle(
        wheelC,
        20,
        Paint()
          ..color = const Color(0xFF3B2B18)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 6);
    final spokes = Paint()
      ..color = const Color(0xFF4E3A22)
      ..strokeWidth = 3.5;
    for (int i = 0; i < 4; i++) {
      final a = i * math.pi / 4 + recoil * 0.01;
      canvas.drawLine(wheelC - Offset(math.cos(a), math.sin(a)) * 18,
          wheelC + Offset(math.cos(a), math.sin(a)) * 18, spokes);
    }
    canvas.drawCircle(wheelC, 5, Paint()..color = const Color(0xFF241708));

    // Barrel — dark gunmetal with a highlight
    canvas.save();
    canvas.translate(base.dx, base.dy);
    canvas.rotate(angle);
    final barrel = RRect.fromRectAndRadius(
        Rect.fromLTWH(-8, -12, barrelLen, 24), const Radius.circular(11));
    canvas.drawRRect(
      barrel,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF80838D), Color(0xFF34363E), Color(0xFF0E0F13)],
          stops: [0.0, 0.45, 1.0],
        ).createShader(barrel.outerRect),
    );
    // Reinforcement bands + muzzle lip
    final band = Paint()..color = const Color(0xFF14151A);
    canvas.drawRect(Rect.fromLTWH(barrelLen * 0.30, -13, 5, 26), band);
    canvas.drawRect(Rect.fromLTWH(barrelLen * 0.62, -13, 5, 26), band);
    canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(barrelLen - 14, -14, 8, 28), const Radius.circular(3)),
        Paint()..color = const Color(0xFF1C1D24));
    // Breech
    canvas.drawCircle(Offset(-10, 0), 14,
        Paint()..shader = const RadialGradient(colors: [Color(0xFF5C5F68), Color(0xFF17181D)]).createShader(Rect.fromCircle(center: const Offset(-10, 0), radius: 14)));
    canvas.restore();

    final muzzle = base + dir * (barrelLen - 10);

    // Fire: muzzle flash + burning particles (first ~0.2 of the cycle)
    if (cycle < 0.20) {
      final ft = cycle / 0.20;
      final punch = 1.0 - ft;
      final flash = Paint()..blendMode = BlendMode.plus;
      flash.shader = RadialGradient(colors: [
        Colors.white.withOpacity(0.95 * punch),
        const Color(0xFFFFD54F).withOpacity(0.75 * punch),
        const Color(0xFFFF6D00).withOpacity(0.35 * punch),
        Colors.transparent,
      ], stops: const [0.0, 0.3, 0.6, 1.0])
          .createShader(Rect.fromCircle(center: muzzle, radius: 34 + ft * 40));
      canvas.drawCircle(muzzle, 34 + ft * 40, flash);
      // Flash spikes
      final spike = Paint()
        ..color = const Color(0xFFFFECB3).withOpacity(0.8 * punch)
        ..blendMode = BlendMode.plus;
      for (int i = 0; i < 5; i++) {
        final sa = angle + (i - 2) * 0.22;
        final sd = Offset(math.cos(sa), math.sin(sa));
        final len = (26 + ft * 60) * (i == 2 ? 1.5 : 1.0);
        final p = Offset(-sd.dy, sd.dx) * (3.0 * (1 - ft));
        canvas.drawPath(
          Path()
            ..moveTo(muzzle.dx + p.dx, muzzle.dy + p.dy)
            ..lineTo(muzzle.dx + sd.dx * len, muzzle.dy + sd.dy * len)
            ..lineTo(muzzle.dx - p.dx, muzzle.dy - p.dy)
            ..close(),
          spike,
        );
      }
      // Fireball embers streaking out
      final rand = math.Random(3);
      final ember = Paint()..blendMode = BlendMode.plus;
      for (int i = 0; i < 14; i++) {
        final spread = (rand.nextDouble() - 0.5) * 0.5;
        final ea = angle + spread;
        final ed = Offset(math.cos(ea), math.sin(ea));
        final dist = (30 + rand.nextDouble() * 110) * ft;
        final pos = muzzle + ed * dist;
        final r = (4.5 - ft * 3.5) * (0.6 + rand.nextDouble() * 0.8);
        ember.color = Color.lerp(const Color(0xFFFFE082),
                const Color(0xFFFF3D00), rand.nextDouble())!
            .withOpacity((1 - ft) * 0.9);
        canvas.drawCircle(pos, r.clamp(0.5, 5.0), ember);
      }
    }

    // Smoke: soft gray puffs that rise, expand and fade
    final smokeRand = math.Random(11);
    for (int i = 0; i < 9; i++) {
      final st0 = i * 0.055 + 0.02;
      final t = cycle - st0;
      if (t < 0 || t > 0.75) continue;
      final n = t / 0.75;
      final drift = smokeRand.nextDouble() - 0.5;
      final pos = muzzle +
          dir * (14 + n * 95) +
          Offset(drift * 26 * n + math.sin((time * 6 + i) * math.pi) * 4,
              -n * 60 - i * 2.0);
      final r = 7 + n * 30 + smokeRand.nextDouble() * 4;
      final gray = 0.55 + smokeRand.nextDouble() * 0.25;
      canvas.drawCircle(
        pos,
        r,
        Paint()
          ..color = Color.fromRGBO((gray * 255).round(), (gray * 255).round(),
              (gray * 255).round(), (0.30 * (1 - n)).clamp(0.0, 1.0))
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8),
      );
    }
  }

  /// Man United / Milan: rising devil flames and a glinting trident.
  static void _devil(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    // Flame tongues along the mid band
    for (int i = 0; i < 9; i++) {
      final fx = w * (0.06 + i * 0.11);
      final flick = math.sin((time * 8 + i * 0.7) * math.pi) * 0.5 + 0.5;
      final fh = h * (0.10 + 0.09 * flick);
      final baseY = h * 0.66;
      final path = Path()
        ..moveTo(fx - 12, baseY)
        ..quadraticBezierTo(fx - 10, baseY - fh * 0.5, fx + math.sin(time * 10 + i) * 6, baseY - fh)
        ..quadraticBezierTo(fx + 10, baseY - fh * 0.5, fx + 12, baseY)
        ..close();
      canvas.drawPath(
        path,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              st.primary.withOpacity(0.85),
              const Color(0xFFFF9800).withOpacity(0.75),
              const Color(0xFFFFE082).withOpacity(0.5),
            ],
          ).createShader(Rect.fromLTWH(fx - 12, baseY - fh, 24, fh))
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
      );
    }
    // Trident rising behind the flames
    final tx = w * 0.5, ty = h * 0.30 + math.sin(time * 2 * math.pi) * 6;
    final trident = Paint()
      ..color = st.secondary.withOpacity(0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(tx, ty + h * 0.05), Offset(tx, ty + h * 0.30), trident);
    for (int p = -1; p <= 1; p++) {
      final px = tx + p * 16.0;
      canvas.drawLine(Offset(px, ty + h * 0.10), Offset(px, ty + h * 0.02), trident);
      canvas.drawPath(
        Path()
          ..moveTo(px - 5, ty + h * 0.03)
          ..lineTo(px, ty - 6)
          ..lineTo(px + 5, ty + h * 0.03)
          ..close(),
        Paint()..color = st.secondary.withOpacity(0.9),
      );
    }
    canvas.drawLine(
        Offset(tx - 16, ty + h * 0.10), Offset(tx + 16, ty + h * 0.10), trident);
    // Glow aura
    canvas.drawCircle(
      Offset(tx, ty + h * 0.12),
      w * 0.22,
      Paint()
        ..shader = RadialGradient(colors: [
          st.primary.withOpacity(0.25),
          Colors.transparent,
        ]).createShader(
            Rect.fromCircle(center: Offset(tx, ty + h * 0.12), radius: w * 0.22)),
    );
  }

  /// Real Madrid / Monaco: royal crown with galactic sparkles.
  static void _crown(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final cx = w * 0.5, cy = h * 0.34 + math.sin(time * 2 * math.pi) * 8;
    final gold = const Color(0xFFFEBE10);
    // Halo
    canvas.drawCircle(
      Offset(cx, cy),
      w * 0.26,
      Paint()
        ..shader = RadialGradient(colors: [
          gold.withOpacity(0.30),
          Colors.transparent,
        ]).createShader(Rect.fromCircle(center: Offset(cx, cy), radius: w * 0.26)),
    );
    // Crown body
    final cw = w * 0.24, ch = h * 0.075;
    final body = Path()
      ..moveTo(cx - cw / 2, cy + ch / 2)
      ..lineTo(cx - cw / 2, cy - ch * 0.2)
      ..lineTo(cx - cw * 0.30, cy + ch * 0.05)
      ..lineTo(cx - cw * 0.12, cy - ch * 0.75)
      ..lineTo(cx, cy - ch * 0.1)
      ..lineTo(cx + cw * 0.12, cy - ch * 0.75)
      ..lineTo(cx + cw * 0.30, cy + ch * 0.05)
      ..lineTo(cx + cw / 2, cy - ch * 0.2)
      ..lineTo(cx + cw / 2, cy + ch / 2)
      ..close();
    canvas.drawPath(
      body,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [const Color(0xFFFFE082), gold, const Color(0xFFB8860B)],
        ).createShader(Rect.fromLTWH(cx - cw / 2, cy - ch, cw, ch * 1.6)),
    );
    // Jewels
    final jewel = Paint()..color = st.primary == const Color(0xFFF5F5F5) ? const Color(0xFF7B1FA2) : st.primary;
    for (final dx in [-cw * 0.30, 0.0, cw * 0.30]) {
      canvas.drawCircle(Offset(cx + dx, cy + ch * 0.15), 3.4, jewel);
    }
    for (final dx in [-cw * 0.12, cw * 0.12, -cw / 2, cw / 2]) {
      canvas.drawCircle(Offset(cx + dx, cy - ch * 0.72), 2.6,
          Paint()..color = const Color(0xFFFFF8E1));
    }
    // Sparkles orbiting
    final rand = math.Random(5);
    for (int i = 0; i < 14; i++) {
      final a = rand.nextDouble() * 2 * math.pi + time * 2 * math.pi * 0.5;
      final r = w * (0.14 + rand.nextDouble() * 0.20);
      final p = Offset(cx + math.cos(a) * r, cy + math.sin(a) * r * 0.6);
      final tw = (math.sin((time * 5 + i) * 2 * math.pi) * 0.5 + 0.5);
      final sp = Paint()..color = Colors.white.withOpacity(0.7 * tw);
      canvas.drawLine(p - Offset(3.5 * tw, 0), p + Offset(3.5 * tw, 0), sp..strokeWidth = 1.2);
      canvas.drawLine(p - Offset(0, 3.5 * tw), p + Offset(0, 3.5 * tw), sp);
    }
  }

  /// Barcelona / Juventus: iconic kit stripes with a light sheen + star.
  static void _stripes(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final top = h * 0.16, bottom = h * 0.72;
    const n = 7;
    for (int i = 0; i < n; i++) {
      final x = w * i / n;
      canvas.drawRect(
        Rect.fromLTWH(x, top, w / n, bottom - top),
        Paint()
          ..color = (i.isEven ? st.primary : st.secondary).withOpacity(0.35),
      );
    }
    // Moving sheen
    final sx = ((time * 2) % 1.0) * (w * 1.6) - w * 0.3;
    canvas.drawRect(
      Rect.fromLTWH(0, top, w, bottom - top),
      Paint()
        ..shader = LinearGradient(colors: [
          Colors.transparent,
          Colors.white.withOpacity(0.10),
          Colors.transparent,
        ]).createShader(Rect.fromLTWH(sx, top, w * 0.28, bottom - top)),
    );
    // Champion star pulsing
    final cx = w * 0.5, cy = h * 0.28;
    final pulse = 0.8 + math.sin(time * 4 * math.pi) * 0.2;
    final star = Path();
    for (int i = 0; i < 10; i++) {
      final r = (i.isEven ? 16.0 : 7.0) * pulse;
      final a = -math.pi / 2 + i * math.pi / 5;
      final p = Offset(cx + math.cos(a) * r, cy + math.sin(a) * r);
      if (i == 0) {
        star.moveTo(p.dx, p.dy);
      } else {
        star.lineTo(p.dx, p.dy);
      }
    }
    star.close();
    canvas.drawPath(
        star,
        Paint()
          ..color = const Color(0xFFFFD700).withOpacity(0.9)
          ..maskFilter = const MaskFilter.blur(BlurStyle.solid, 3));
  }

  /// Inter: the biscione — a serpent slithering across the keys.
  static void _serpent(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final phase = time * 2 * math.pi;
    final headX = w * (((time * 2) % 1.0) * 1.4 - 0.2);
    Offset bodyPoint(double s) {
      final x = headX - s * w * 0.5;
      final y = h * 0.40 + math.sin(x / w * 4 * math.pi + phase) * h * 0.06;
      return Offset(x, y);
    }

    // Body: tapering segments
    for (int i = 24; i >= 0; i--) {
      final s = i / 24;
      final p = bodyPoint(s);
      final r = 12.0 * (1 - s * 0.75);
      canvas.drawCircle(
        p,
        r,
        Paint()
          ..color = Color.lerp(st.primary, st.secondary, s * 0.7)!
              .withOpacity(0.75),
      );
      if (i % 4 == 0) {
        canvas.drawCircle(
            p, r * 0.55, Paint()..color = Colors.white.withOpacity(0.12));
      }
    }
    // Head + eyes + tongue
    final head = bodyPoint(0);
    canvas.drawCircle(head, 13, Paint()..color = st.primary);
    canvas.drawCircle(head + const Offset(4, -4), 2.4,
        Paint()..color = const Color(0xFFFFD700));
    final tongueOut = math.sin(time * 12 * math.pi) > 0.4;
    if (tongueOut) {
      final t = Paint()
        ..color = const Color(0xFFFF5252)
        ..strokeWidth = 2;
      canvas.drawLine(head + const Offset(12, 0), head + const Offset(24, -3), t);
      canvas.drawLine(head + const Offset(24, -3), head + const Offset(29, -7), t);
      canvas.drawLine(head + const Offset(24, -3), head + const Offset(29, 1), t);
    }
  }

  /// Man City: sky-blue sky, drifting clouds, sailing ship glint.
  static void _clouds(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    // Soft sky glow
    canvas.drawRect(
      Rect.fromLTWH(0, 0, w, h * 0.7),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [st.primary.withOpacity(0.30), Colors.transparent],
        ).createShader(Rect.fromLTWH(0, 0, w, h * 0.7)),
    );
    // Clouds drifting
    final cloud = Paint()
      ..color = Colors.white.withOpacity(0.20)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12);
    for (int i = 0; i < 4; i++) {
      final cx = ((time * 0.5 + i * 0.27) % 1.2 - 0.1) * w;
      final cy = h * (0.16 + i * 0.10);
      canvas.drawOval(Rect.fromCenter(center: Offset(cx, cy), width: w * 0.34, height: h * 0.06), cloud);
      canvas.drawOval(Rect.fromCenter(center: Offset(cx + w * 0.07, cy - h * 0.02), width: w * 0.2, height: h * 0.05), cloud);
    }
    // Golden ship hull + sail (crest nod), bobbing
    final sx = w * 0.5, sy = h * 0.5 + math.sin(time * 4 * math.pi) * 4;
    final gold = Paint()..color = const Color(0xFFFFD700).withOpacity(0.85);
    canvas.drawPath(
      Path()
        ..moveTo(sx - 34, sy)
        ..quadraticBezierTo(sx, sy + 22, sx + 34, sy)
        ..lineTo(sx + 26, sy - 4)
        ..lineTo(sx - 26, sy - 4)
        ..close(),
      gold,
    );
    canvas.drawLine(Offset(sx, sy - 4), Offset(sx, sy - 40),
        Paint()..color = const Color(0xFFFFD700)..strokeWidth = 3);
    canvas.drawPath(
      Path()
        ..moveTo(sx + 2, sy - 38)
        ..quadraticBezierTo(sx + 26 + math.sin(time * 6 * math.pi) * 3, sy - 24, sx + 2, sy - 8)
        ..close(),
      Paint()..color = Colors.white.withOpacity(0.8),
    );
  }

  /// Liverpool: the liver bird — beating wings and a torch flame.
  static void _wings(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final cx = w * 0.5, cy = h * 0.38;
    final flap = math.sin(time * 6 * math.pi) * 0.18;
    for (int side = -1; side <= 1; side += 2) {
      canvas.save();
      canvas.translate(cx, cy);
      canvas.rotate(flap * side);
      final wing = Path()..moveTo(0, 0);
      for (int f = 0; f < 4; f++) {
        final span = w * (0.30 - f * 0.05) * side;
        final lift = -h * (0.10 + f * 0.035);
        wing.quadraticBezierTo(span * 0.5, lift * 1.6, span, lift);
        wing.quadraticBezierTo(span * 0.55, lift * 0.55 , 0, 0);
      }
      canvas.drawPath(
        wing,
        Paint()
          ..color = st.primary.withOpacity(0.65)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
      );
      canvas.restore();
    }
    // Body + head
    canvas.drawOval(
        Rect.fromCenter(center: Offset(cx, cy + 6), width: 22, height: 34),
        Paint()..color = st.primary.withOpacity(0.9));
    canvas.drawCircle(Offset(cx, cy - 14), 8, Paint()..color = st.primary);
    // Torch flame above (eternal flame)
    final fx = cx, fy = cy - h * 0.16;
    final flick = math.sin(time * 10 * math.pi) * 3;
    canvas.drawPath(
      Path()
        ..moveTo(fx - 8, fy)
        ..quadraticBezierTo(fx - 6 + flick, fy - 18, fx, fy - 26 - flick.abs())
        ..quadraticBezierTo(fx + 6 + flick, fy - 14, fx + 8, fy)
        ..close(),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            st.secondary.withOpacity(0.9),
            const Color(0xFFFFC107).withOpacity(0.8),
            Colors.white.withOpacity(0.6),
          ],
        ).createShader(Rect.fromLTWH(fx - 8, fy - 28, 16, 28))
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
    );
  }

  /// Chelsea: royal rotating rays with golden lions' glint.
  static void _rays(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final c = Offset(w * 0.5, h * 0.36);
    final rot = time * 2 * math.pi * 0.4;
    final ray = Paint()..blendMode = BlendMode.plus;
    for (int i = 0; i < 10; i++) {
      final a = rot + i * math.pi / 5;
      final gold = i.isEven;
      ray.shader = RadialGradient(colors: [
        (gold ? const Color(0xFFFFC107) : st.primary).withOpacity(0.20),
        Colors.transparent,
      ]).createShader(Rect.fromCircle(center: c, radius: w * 0.5));
      canvas.drawPath(
        Path()
          ..moveTo(c.dx, c.dy)
          ..lineTo(c.dx + math.cos(a) * w * 0.6, c.dy + math.sin(a) * w * 0.6)
          ..lineTo(c.dx + math.cos(a + 0.28) * w * 0.6,
              c.dy + math.sin(a + 0.28) * w * 0.6)
          ..close(),
        ray,
      );
    }
    // Center royal orb
    canvas.drawCircle(
        c,
        18,
        Paint()
          ..shader = RadialGradient(colors: [
            const Color(0xFFFFE082),
            const Color(0xFFFFC107),
            st.primary,
          ]).createShader(Rect.fromCircle(center: c, radius: 18)));
    canvas.drawCircle(
        c,
        24 + math.sin(time * 4 * math.pi) * 3,
        Paint()
          ..color = const Color(0xFFFFC107).withOpacity(0.5)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2);
  }

  /// PSG: Eiffel Tower silhouette, city lights, sweeping beacon.
  static void _eiffel(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final cx = w * 0.5;
    final baseY = h * 0.70, topY = h * 0.16;
    final tower = Paint()
      ..color = const Color(0xFF0A1B33).withOpacity(0.95)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    // Legs
    canvas.drawPath(
      Path()
        ..moveTo(cx - w * 0.16, baseY)
        ..quadraticBezierTo(cx - w * 0.05, h * 0.40, cx - 6, topY)
        ..moveTo(cx + w * 0.16, baseY)
        ..quadraticBezierTo(cx + w * 0.05, h * 0.40, cx + 6, topY),
      tower,
    );
    // Cross platforms + lattice
    for (final fy in [0.62, 0.50, 0.38, 0.27]) {
      final y = h * fy;
      final half = (baseY - y) / (baseY - topY);
      final hw = w * 0.155 * half + 8;
      canvas.drawLine(Offset(cx - hw, y), Offset(cx + hw, y), tower);
    }
    canvas.drawLine(Offset(cx, topY), Offset(cx, topY - 14), tower);
    // Beacon sweep
    final beamA = time * 2 * math.pi;
    canvas.drawPath(
      Path()
        ..moveTo(cx, topY - 10)
        ..lineTo(cx + math.cos(beamA) * w * 0.7,
            topY - 10 + math.sin(beamA) * w * 0.20)
        ..lineTo(cx + math.cos(beamA + 0.10) * w * 0.7,
            topY - 10 + math.sin(beamA + 0.10) * w * 0.20)
        ..close(),
      Paint()
        ..shader = LinearGradient(colors: [
          Colors.white.withOpacity(0.35),
          Colors.transparent,
        ]).createShader(Rect.fromLTWH(cx - w * 0.5, topY - 40, w, 80))
        ..blendMode = BlendMode.plus,
    );
    // Paris city lights + red pulse
    final rand = math.Random(9);
    for (int i = 0; i < 26; i++) {
      final lx = rand.nextDouble() * w;
      final ly = h * 0.64 + rand.nextDouble() * h * 0.10;
      final tw = math.sin((time * 4 + rand.nextDouble()) * 2 * math.pi) * 0.5 + 0.5;
      canvas.drawCircle(
          Offset(lx, ly),
          1.3,
          Paint()
            ..color = (i % 4 == 0 ? st.secondary : const Color(0xFFFFE082))
                .withOpacity(0.4 + 0.4 * tw));
    }
  }

  /// Bayern: scrolling Bavarian diamonds with a red energy pulse.
  static void _diamonds(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final dSize = w / 7;
    final scroll = time * dSize * 4;
    final diamond = Paint()
      ..color = st.secondary.withOpacity(0.25)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    for (double y = -dSize * 2; y < h; y += dSize) {
      for (double x = -dSize * 2; x < w + dSize; x += dSize) {
        final ox = x + (scroll % (dSize * 2)) * 0.5;
        final oy = y + (scroll % (dSize * 2)) * 0.5;
        canvas.drawPath(
          Path()
            ..moveTo(ox, oy - dSize * 0.7)
            ..lineTo(ox + dSize * 0.5, oy)
            ..lineTo(ox, oy + dSize * 0.7)
            ..lineTo(ox - dSize * 0.5, oy)
            ..close(),
          diamond,
        );
      }
    }
    // Red central pulse
    final pulse = math.sin(time * 4 * math.pi) * 0.5 + 0.5;
    canvas.drawCircle(
      Offset(w * 0.5, h * 0.40),
      w * (0.18 + 0.05 * pulse),
      Paint()
        ..shader = RadialGradient(colors: [
          st.primary.withOpacity(0.45),
          Colors.transparent,
        ]).createShader(Rect.fromCircle(
            center: Offset(w * 0.5, h * 0.40), radius: w * 0.25))
        ..blendMode = BlendMode.plus,
    );
  }

  /// Dortmund: the Yellow Wall — pulsing crowd blocks and bouncing scarves.
  static void _wall(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    const cols = 12, rows = 5;
    final bw = w / cols, bh = h * 0.36 / rows;
    final top = h * 0.20;
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final wave = math.sin((time * 6 + c * 0.5 + r * 0.3) * math.pi);
        final o = 0.20 + 0.30 * (wave * 0.5 + 0.5);
        final jump = wave > 0.75 ? -3.0 : 0.0;
        canvas.drawRRect(
          RRect.fromRectAndRadius(
              Rect.fromLTWH(c * bw + 2, top + r * bh + 2 + jump, bw - 4, bh - 4),
              const Radius.circular(3)),
          Paint()..color = st.primary.withOpacity(o),
        );
      }
    }
    // Scarf banner waving across the wall
    final path = Path()..moveTo(-10, top + h * 0.18);
    for (double x = -10; x <= w + 10; x += w / 12) {
      path.lineTo(
          x, top + h * 0.18 + math.sin(x / w * 3 * math.pi + time * 4 * math.pi) * 10);
    }
    path.lineTo(w + 10, top + h * 0.22);
    for (double x = w + 10; x >= -10; x -= w / 12) {
      path.lineTo(
          x, top + h * 0.22 + math.sin(x / w * 3 * math.pi + time * 4 * math.pi + 0.4) * 10);
    }
    path.close();
    canvas.drawPath(path, Paint()..color = st.secondary.withOpacity(0.75));
  }

  /// Ethio Electric / Leipzig: lightning strikes with flash.
  static void _bolt(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final cycle = (time * 10) % 1.0;
    if (cycle < 0.25) {
      final punch = 1.0 - cycle / 0.25;
      final rand = math.Random((time * 10).floor());
      // Sky flash
      canvas.drawRect(Rect.fromLTWH(0, 0, w, h),
          Paint()..color = st.primary.withOpacity(0.10 * punch));
      for (int b = 0; b < 2; b++) {
        final sx = w * (0.25 + rand.nextDouble() * 0.5);
        var p = Offset(sx, 0);
        final bolt = Path()..moveTo(p.dx, p.dy);
        while (p.dy < h * 0.62) {
          p = Offset(p.dx + (rand.nextDouble() - 0.5) * w * 0.12,
              p.dy + h * (0.06 + rand.nextDouble() * 0.07));
          bolt.lineTo(p.dx, p.dy);
        }
        canvas.drawPath(
            bolt,
            Paint()
              ..color = st.primary.withOpacity(0.8 * punch)
              ..style = PaintingStyle.stroke
              ..strokeWidth = 5
              ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6));
        canvas.drawPath(
            bolt,
            Paint()
              ..color = Colors.white.withOpacity(0.9 * punch)
              ..style = PaintingStyle.stroke
              ..strokeWidth = 2);
      }
    }
    // Ambient electric arcs orbiting a core
    final c = Offset(w * 0.5, h * 0.40);
    final arc = Paint()
      ..color = st.primary.withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6;
    for (int i = 0; i < 3; i++) {
      final r = 26.0 + i * 14 + math.sin((time * 8 + i) * math.pi) * 4;
      canvas.drawArc(Rect.fromCircle(center: c, radius: r),
          time * 2 * math.pi * (i.isEven ? 2 : -2), math.pi * 0.8, false, arc);
    }
    canvas.drawCircle(
        c,
        10 + math.sin(time * 8 * math.pi) * 2,
        Paint()
          ..shader = RadialGradient(colors: [
            Colors.white.withOpacity(0.9),
            st.primary.withOpacity(0.4),
            Colors.transparent
          ]).createShader(Rect.fromCircle(center: c, radius: 20)));
  }

  /// Saint George: the golden lance, halo and dragon-fire.
  static void _knight(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    // Halo of the saint
    final halo = Offset(w * 0.35, h * 0.28);
    canvas.drawCircle(
        halo,
        w * 0.20,
        Paint()
          ..shader = RadialGradient(colors: [
            st.primary.withOpacity(0.35),
            Colors.transparent,
          ]).createShader(Rect.fromCircle(center: halo, radius: w * 0.20)));
    // Golden lance diagonal with travelling glint
    final tip = Offset(w * 0.78, h * 0.62);
    final tail = Offset(w * 0.18, h * 0.22);
    canvas.drawLine(
        tail,
        tip,
        Paint()
          ..shader = LinearGradient(colors: [
            const Color(0xFFB8860B),
            st.primary,
            const Color(0xFFFFF8E1),
          ]).createShader(Rect.fromPoints(tail, tip))
          ..strokeWidth = 5
          ..strokeCap = StrokeCap.round);
    // Lance head
    final dirv = (tip - tail);
    final len = dirv.distance;
    final u = Offset(dirv.dx / len, dirv.dy / len);
    final perp = Offset(-u.dy, u.dx);
    canvas.drawPath(
      Path()
        ..moveTo(tip.dx + u.dx * 16, tip.dy + u.dy * 16)
        ..lineTo(tip.dx + perp.dx * 7, tip.dy + perp.dy * 7)
        ..lineTo(tip.dx - perp.dx * 7, tip.dy - perp.dy * 7)
        ..close(),
      Paint()..color = const Color(0xFFFFF8E1),
    );
    // Glint sweeping along the lance
    final gt = (time * 4) % 1.0;
    final gp = Offset.lerp(tail, tip, gt)!;
    canvas.drawCircle(
        gp,
        7,
        Paint()
          ..color = Colors.white.withOpacity(0.8 * (1 - (gt - 0.5).abs() * 2))
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4));
    // Dragon fire rising from the right corner
    final rand = math.Random(13);
    final fire = Paint()..blendMode = BlendMode.plus;
    for (int i = 0; i < 16; i++) {
      final t = (time * 2 + rand.nextDouble()) % 1.0;
      final fx = w * 0.86 + (rand.nextDouble() - 0.5) * w * 0.14 - t * w * 0.10;
      final fy = h * 0.72 - t * h * 0.30;
      fire.color = Color.lerp(st.secondary, const Color(0xFFFF9800), t)!
          .withOpacity(0.5 * (1 - t));
      canvas.drawCircle(Offset(fx, fy), 6 + (1 - t) * 10, fire);
    }
  }

  /// Bunna / Sidama Coffee: steaming cup and falling beans.
  static void _coffee(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final cx = w * 0.5, cy = h * 0.46;
    // Warm glow
    canvas.drawCircle(
        Offset(cx, cy),
        w * 0.28,
        Paint()
          ..shader = RadialGradient(colors: [
            st.secondary.withOpacity(0.22),
            Colors.transparent
          ]).createShader(Rect.fromCircle(center: Offset(cx, cy), radius: w * 0.28)));
    // Jebena-style cup: body + handle + saucer
    final cup = Paint()..color = st.primary.withOpacity(0.95);
    canvas.drawPath(
      Path()
        ..moveTo(cx - 26, cy - 14)
        ..lineTo(cx + 26, cy - 14)
        ..quadraticBezierTo(cx + 24, cy + 22, cx, cy + 24)
        ..quadraticBezierTo(cx - 24, cy + 22, cx - 26, cy - 14)
        ..close(),
      cup,
    );
    canvas.drawArc(Rect.fromCircle(center: Offset(cx + 30, cy), radius: 12),
        -math.pi / 2, math.pi, false,
        Paint()
          ..color = st.primary
          ..style = PaintingStyle.stroke
          ..strokeWidth = 5);
    canvas.drawOval(
        Rect.fromCenter(center: Offset(cx, cy + 28), width: 74, height: 12),
        Paint()..color = st.primary.withOpacity(0.6));
    // Coffee surface shimmer
    canvas.drawOval(
        Rect.fromCenter(center: Offset(cx, cy - 14), width: 48, height: 10),
        Paint()..color = const Color(0xFF3E2010));
    // Steam: three wavering wisps
    final steam = Paint()
      ..color = Colors.white.withOpacity(0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
    for (int i = -1; i <= 1; i++) {
      final sx = cx + i * 14.0;
      final ph = time * 4 * math.pi + i;
      final p = Path()..moveTo(sx, cy - 22);
      for (int seg = 1; seg <= 4; seg++) {
        p.lineTo(sx + math.sin(ph + seg) * 7, cy - 22 - seg * 13.0);
      }
      canvas.drawPath(p, steam);
    }
    // Beans falling
    final rand = math.Random(17);
    for (int i = 0; i < 10; i++) {
      final t = (time * 0.7 + rand.nextDouble()) % 1.0;
      final bx = (rand.nextDouble() * w + math.sin(time * 4 + i) * 16) % w;
      final by = t * h * 0.7;
      canvas.save();
      canvas.translate(bx, by);
      canvas.rotate(time * 6 + i);
      canvas.drawOval(const Rect.fromLTWH(-5, -3.5, 10, 7),
          Paint()..color = const Color(0xFF5D4037).withOpacity(0.9 * (1 - t * 0.4)));
      canvas.drawLine(const Offset(0, -3), const Offset(0, 3),
          Paint()..color = const Color(0xFF3E2723)..strokeWidth = 1.4);
      canvas.restore();
    }
  }

  /// Lakeside clubs: layered waves and a bobbing tankwa boat.
  static void _waves(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    for (int i = 0; i < 3; i++) {
      final baseY = h * (0.46 + i * 0.09);
      final p = Path()..moveTo(0, baseY);
      for (double x = 0; x <= w; x += w / 16) {
        p.lineTo(
            x,
            baseY +
                math.sin(x / w * 4 * math.pi + time * 2 * math.pi * (1 + i * 0.3)) *
                    (8.0 + i * 3));
      }
      p.lineTo(w, h * 0.78);
      p.lineTo(0, h * 0.78);
      p.close();
      canvas.drawPath(
          p,
          Paint()
            ..color = Color.lerp(st.primary, st.secondary, i / 3)!
                .withOpacity(0.30 - i * 0.06));
    }
    // Moon glints on the water
    final rand = math.Random(23);
    for (int i = 0; i < 12; i++) {
      final gx = rand.nextDouble() * w;
      final gy = h * (0.5 + rand.nextDouble() * 0.24);
      final tw = math.sin((time * 5 + i) * 2 * math.pi) * 0.5 + 0.5;
      canvas.drawOval(
          Rect.fromCenter(center: Offset(gx, gy), width: 10 * tw + 2, height: 2),
          Paint()..color = Colors.white.withOpacity(0.30 * tw));
    }
    // Tankwa reed boat bobbing
    final bx = w * (0.2 + ((time * 0.8) % 1.0) * 0.6);
    final by = h * 0.44 + math.sin(time * 4 * math.pi) * 5;
    canvas.drawPath(
      Path()
        ..moveTo(bx - 30, by)
        ..quadraticBezierTo(bx, by + 14, bx + 30, by)
        ..quadraticBezierTo(bx + 36, by - 8, bx + 30, by - 4)
        ..lineTo(bx - 30, by - 4)
        ..quadraticBezierTo(bx - 36, by - 8, bx - 30, by)
        ..close(),
      Paint()..color = const Color(0xFFC8A165).withOpacity(0.9),
    );
  }

  /// Fasil / Shire / Welwalo: castle skyline with glowing windows.
  static void _castle(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final baseY = h * 0.66;
    final castle = Paint()..color = const Color(0xFF14100C).withOpacity(0.95);
    // Moonlight
    final moon = Offset(w * 0.76, h * 0.18);
    canvas.drawCircle(moon, 16, Paint()..color = const Color(0xFFFFF8E1).withOpacity(0.9));
    canvas.drawCircle(
        moon,
        34,
        Paint()
          ..shader = RadialGradient(colors: [
            const Color(0xFFFFF8E1).withOpacity(0.25),
            Colors.transparent
          ]).createShader(Rect.fromCircle(center: moon, radius: 34)));
    // Towers with battlements (Fasil Ghebbi silhouette)
    void tower(double cx, double tw2, double th) {
      final r = Rect.fromLTWH(cx - tw2 / 2, baseY - th, tw2, th);
      canvas.drawRect(r, castle);
      const merW = 8.0;
      for (double mx = r.left; mx < r.right - 2; mx += merW * 2) {
        canvas.drawRect(Rect.fromLTWH(mx, r.top - 7, merW, 7), castle);
      }
      // Dome
      canvas.drawArc(Rect.fromLTWH(r.left, r.top - tw2 * 0.5, tw2, tw2 * 0.7), math.pi,
          math.pi, true, castle);
    }

    tower(w * 0.2, w * 0.13, h * 0.22);
    tower(w * 0.5, w * 0.18, h * 0.30);
    tower(w * 0.8, w * 0.12, h * 0.18);
    // Connecting wall
    canvas.drawRect(Rect.fromLTWH(0, baseY - h * 0.08, w, h * 0.08), castle);
    // Glowing windows twinkle
    final rand = math.Random(29);
    for (int i = 0; i < 10; i++) {
      final wx = [w * 0.2, w * 0.5, w * 0.8][i % 3] +
          (rand.nextDouble() - 0.5) * w * 0.07;
      final wy = baseY - rand.nextDouble() * h * 0.20 - 10;
      final tw = math.sin((time * 3 + rand.nextDouble()) * 2 * math.pi) * 0.5 + 0.5;
      canvas.drawRRect(
          RRect.fromRectAndRadius(
              Rect.fromCenter(center: Offset(wx, wy), width: 5, height: 8),
              const Radius.circular(2)),
          Paint()..color = st.secondary.withOpacity(0.4 + 0.5 * tw));
    }
    // Royal banner glow
    canvas.drawCircle(
        Offset(w * 0.5, baseY - h * 0.34),
        w * 0.16,
        Paint()
          ..shader = RadialGradient(colors: [
            st.primary.withOpacity(0.25),
            Colors.transparent
          ]).createShader(
              Rect.fromCircle(center: Offset(w * 0.5, baseY - h * 0.34), radius: w * 0.16)));
  }

  /// Banks & traders: golden coins raining with sparkle.
  static void _coins(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final rand = math.Random(31);
    for (int i = 0; i < 14; i++) {
      final t = (time * 0.8 + rand.nextDouble()) % 1.0;
      final cx = (rand.nextDouble() * w + math.sin(time * 3 + i) * 12) % w;
      final cy = t * h * 0.75;
      final flip = math.sin((time * 6 + i) * math.pi);
      final cw = 16.0 * flip.abs().clamp(0.15, 1.0);
      canvas.drawOval(
        Rect.fromCenter(center: Offset(cx, cy), width: cw, height: 16),
        Paint()
          ..shader = LinearGradient(colors: [
            const Color(0xFFFFE082),
            st.secondary,
            const Color(0xFFB8860B),
          ]).createShader(Rect.fromCenter(center: Offset(cx, cy), width: 16, height: 16)),
      );
      canvas.drawOval(
          Rect.fromCenter(center: Offset(cx, cy), width: cw * 0.6, height: 10),
          Paint()
            ..color = const Color(0xFF8D6E63).withOpacity(0.5)
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.2);
    }
    // Vault glow
    canvas.drawCircle(
        Offset(w * 0.5, h * 0.42),
        w * 0.24,
        Paint()
          ..shader = RadialGradient(colors: [
            st.primary.withOpacity(0.28),
            Colors.transparent
          ]).createShader(
              Rect.fromCircle(center: Offset(w * 0.5, h * 0.42), radius: w * 0.24)));
    // Sparkles
    for (int i = 0; i < 8; i++) {
      final rand2 = math.Random(i * 7);
      final p = Offset(rand2.nextDouble() * w, h * (0.2 + rand2.nextDouble() * 0.4));
      final tw = (math.sin((time * 5 + i) * 2 * math.pi) * 0.5 + 0.5);
      final sp = Paint()
        ..color = st.secondary.withOpacity(0.8 * tw)
        ..strokeWidth = 1.4;
      canvas.drawLine(p - Offset(4 * tw, 0), p + Offset(4 * tw, 0), sp);
      canvas.drawLine(p - Offset(0, 4 * tw), p + Offset(0, 4 * tw), sp);
    }
  }

  /// Defense & insurance clubs: shield with a radar sweep.
  static void _shield(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final c = Offset(w * 0.5, h * 0.40);
    final sw = w * 0.24, sh = h * 0.26;
    final shieldPath = Path()
      ..moveTo(c.dx - sw, c.dy - sh * 0.55)
      ..lineTo(c.dx + sw, c.dy - sh * 0.55)
      ..lineTo(c.dx + sw, c.dy + sh * 0.1)
      ..quadraticBezierTo(c.dx + sw * 0.8, c.dy + sh * 0.6, c.dx, c.dy + sh * 0.85)
      ..quadraticBezierTo(c.dx - sw * 0.8, c.dy + sh * 0.6, c.dx - sw, c.dy + sh * 0.1)
      ..close();
    canvas.drawPath(
        shieldPath,
        Paint()
          ..color = st.primary.withOpacity(0.30)
          ..style = PaintingStyle.fill);
    canvas.drawPath(
        shieldPath,
        Paint()
          ..color = st.secondary.withOpacity(0.8)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3);
    // Radar sweep inside the shield
    canvas.save();
    canvas.clipPath(shieldPath);
    final a = time * 2 * math.pi * 1.5;
    canvas.drawPath(
      Path()
        ..moveTo(c.dx, c.dy)
        ..lineTo(c.dx + math.cos(a) * sw * 2, c.dy + math.sin(a) * sw * 2)
        ..lineTo(c.dx + math.cos(a - 0.8) * sw * 2, c.dy + math.sin(a - 0.8) * sw * 2)
        ..close(),
      Paint()
        ..shader = SweepGradient(
          center: Alignment.center,
          startAngle: a - 0.8,
          endAngle: a,
          colors: [Colors.transparent, st.secondary.withOpacity(0.45)],
          transform: GradientRotation(0),
        ).createShader(Rect.fromCircle(center: c, radius: sw * 2)),
    );
    // Radar rings + blips
    final ring = Paint()
      ..color = st.secondary.withOpacity(0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    for (int i = 1; i <= 3; i++) {
      canvas.drawCircle(c, sw * i / 3, ring);
    }
    final rand = math.Random(37);
    for (int i = 0; i < 4; i++) {
      final ba = rand.nextDouble() * 2 * math.pi;
      final br = rand.nextDouble() * sw * 0.9;
      final bp = Offset(c.dx + math.cos(ba) * br, c.dy + math.sin(ba) * br);
      final vis = (math.sin((time * 3 + i) * 2 * math.pi) * 0.5 + 0.5);
      canvas.drawCircle(bp, 2.5, Paint()..color = Colors.white.withOpacity(vis));
    }
    canvas.restore();
  }

  /// Adama: wind-farm turbines spinning against an orange dusk.
  static void _windmill(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    // Dusk glow
    canvas.drawRect(
      Rect.fromLTWH(0, 0, w, h * 0.7),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [st.primary.withOpacity(0.30), Colors.transparent],
        ).createShader(Rect.fromLTWH(0, 0, w, h * 0.7)),
    );
    void turbine(double cx, double baseY, double scale, double phase) {
      final hubY = baseY - h * 0.22 * scale;
      canvas.drawLine(
          Offset(cx, baseY),
          Offset(cx, hubY),
          Paint()
            ..color = st.secondary.withOpacity(0.85)
            ..strokeWidth = 4 * scale);
      final rot = time * 2 * math.pi * 3 + phase;
      for (int b = 0; b < 3; b++) {
        final a = rot + b * 2 * math.pi / 3;
        final tipX = cx + math.cos(a) * w * 0.11 * scale;
        final tipY = hubY + math.sin(a) * w * 0.11 * scale;
        canvas.drawPath(
          Path()
            ..moveTo(cx, hubY)
            ..lineTo(tipX + math.cos(a + math.pi / 2) * 3,
                tipY + math.sin(a + math.pi / 2) * 3)
            ..lineTo(tipX - math.cos(a + math.pi / 2) * 3,
                tipY - math.sin(a + math.pi / 2) * 3)
            ..close(),
          Paint()..color = st.secondary.withOpacity(0.9),
        );
      }
      canvas.drawCircle(Offset(cx, hubY), 4 * scale,
          Paint()..color = st.primary);
    }

    turbine(w * 0.25, h * 0.72, 1.0, 0);
    turbine(w * 0.55, h * 0.70, 1.3, 1.8);
    turbine(w * 0.85, h * 0.73, 0.9, 3.6);
    // Wind streaks
    final wind = Paint()
      ..color = Colors.white.withOpacity(0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    for (int i = 0; i < 4; i++) {
      final wy = h * (0.2 + i * 0.09);
      final wx = ((time * 2 + i * 0.3) % 1.0) * w * 1.4 - w * 0.2;
      canvas.drawArc(Rect.fromLTWH(wx, wy, w * 0.16, 10), 0.2, 2.2, false, wind);
    }
  }

  /// Generic Ethiopian clubs: rotating sunburst in club colors + heat shimmer.
  static void _sunburst(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final c = Offset(w * 0.5, h * 0.44);
    final rot = time * 2 * math.pi * 0.3;
    final ray = Paint()..blendMode = BlendMode.plus;
    for (int i = 0; i < 12; i++) {
      final a = rot + i * math.pi / 6;
      ray.shader = RadialGradient(colors: [
        (i.isEven ? st.primary : st.secondary).withOpacity(0.16),
        Colors.transparent,
      ]).createShader(Rect.fromCircle(center: c, radius: w * 0.55));
      canvas.drawPath(
        Path()
          ..moveTo(c.dx, c.dy)
          ..lineTo(c.dx + math.cos(a) * w * 0.65, c.dy + math.sin(a) * w * 0.65)
          ..lineTo(c.dx + math.cos(a + 0.22) * w * 0.65,
              c.dy + math.sin(a + 0.22) * w * 0.65)
          ..close(),
        ray,
      );
    }
    // Rising sun core
    final pulse = math.sin(time * 4 * math.pi) * 0.5 + 0.5;
    canvas.drawCircle(
        c,
        w * (0.085 + 0.012 * pulse),
        Paint()
          ..shader = RadialGradient(colors: [
            Colors.white.withOpacity(0.85),
            st.primary.withOpacity(0.6),
            Colors.transparent,
          ]).createShader(Rect.fromCircle(center: c, radius: w * 0.12)));
  }

  /// Mekelle 70 Enderta: celebration fireworks in red and yellow.
  static void _fireworks(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    for (int i = 0; i < 3; i++) {
      final cycle = (time * 5 + i * 0.33) % 1.0;
      final launchX = w * (0.25 + i * 0.25);
      final burstY = h * (0.22 + (i % 2) * 0.10);
      if (cycle < 0.35) {
        // Rocket rising with a bright trail
        final t = cycle / 0.35;
        final y = h * 0.72 - (h * 0.72 - burstY) * t;
        canvas.drawLine(
            Offset(launchX, y + 14),
            Offset(launchX, y),
            Paint()
              ..shader = LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [Colors.transparent, st.secondary.withOpacity(0.9)],
              ).createShader(Rect.fromLTWH(launchX - 1, y, 2, 14))
              ..strokeWidth = 2.5);
        canvas.drawCircle(Offset(launchX, y), 2.5,
            Paint()..color = Colors.white.withOpacity(0.95));
      } else {
        // Burst: radial sparks with gravity droop
        final t = (cycle - 0.35) / 0.65;
        final r = w * 0.16 * Curves.easeOut.transform(t);
        final fade = (1 - t).clamp(0.0, 1.0);
        final spark = Paint()
          ..strokeWidth = 2
          ..strokeCap = StrokeCap.round
          ..blendMode = BlendMode.plus;
        for (int s = 0; s < 14; s++) {
          final a = s * 2 * math.pi / 14 + i;
          final droop = t * t * 22;
          final p1 = Offset(launchX + math.cos(a) * r * 0.6,
              burstY + math.sin(a) * r * 0.6 + droop * 0.5);
          final p2 = Offset(launchX + math.cos(a) * r,
              burstY + math.sin(a) * r + droop);
          spark.color =
              (s.isEven ? st.primary : st.secondary).withOpacity(0.85 * fade);
          canvas.drawLine(p1, p2, spark);
        }
        canvas.drawCircle(
            Offset(launchX, burstY),
            10 * fade,
            Paint()
              ..color = Colors.white.withOpacity(0.5 * fade)
              ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8));
      }
    }
  }

  /// Dire Dawa: the legendary railway — steam train crossing at night.
  static void _train(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final railY = h * 0.60;
    // Track
    canvas.drawLine(Offset(0, railY + 12), Offset(w, railY + 12),
        Paint()..color = const Color(0xFF6D5843).withOpacity(0.8)..strokeWidth = 3);
    final sleeper = Paint()..color = const Color(0xFF4E3E2E).withOpacity(0.7);
    final scroll = (time * w * 3) % 26;
    for (double x = -scroll; x < w; x += 26) {
      canvas.drawRect(Rect.fromLTWH(x, railY + 15, 14, 4), sleeper);
    }
    // Train crossing
    final tx = ((time * 2) % 1.4 - 0.2) * w;
    final body = Paint()..color = st.primary;
    final trim = Paint()..color = st.secondary;
    // Locomotive
    canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(tx, railY - 34, 74, 34), const Radius.circular(6)),
        body);
    canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(tx + 46, railY - 56, 28, 24), const Radius.circular(4)),
        body);
    canvas.drawRect(Rect.fromLTWH(tx + 52, railY - 52, 16, 10), trim);
    // Chimney + boiler front
    canvas.drawRect(Rect.fromLTWH(tx + 8, railY - 48, 10, 14), trim);
    canvas.drawCircle(Offset(tx + 4, railY - 17), 7,
        Paint()..color = const Color(0xFFFFF59D));
    // Headlamp beam
    canvas.drawPath(
      Path()
        ..moveTo(tx - 2, railY - 17)
        ..lineTo(tx - w * 0.22, railY - 34)
        ..lineTo(tx - w * 0.22, railY)
        ..close(),
      Paint()
        ..shader = LinearGradient(colors: [
          const Color(0xFFFFF59D).withOpacity(0.30),
          Colors.transparent,
        ]).createShader(Rect.fromLTWH(tx - w * 0.22, railY - 34, w * 0.22, 34))
        ..blendMode = BlendMode.plus,
    );
    // Coaches
    for (int c2 = 0; c2 < 2; c2++) {
      final cx = tx + 82 + c2 * 64;
      canvas.drawRRect(
          RRect.fromRectAndRadius(
              Rect.fromLTWH(cx, railY - 30, 56, 30), const Radius.circular(5)),
          Paint()..color = st.secondary.withOpacity(0.9));
      for (int wdw = 0; wdw < 3; wdw++) {
        canvas.drawRect(Rect.fromLTWH(cx + 6 + wdw * 17, railY - 24, 11, 9),
            Paint()..color = const Color(0xFFFFF59D).withOpacity(0.9));
      }
    }
    // Wheels with rotating spokes
    final wheelRot = time * 2 * math.pi * 8;
    for (final wx in [tx + 16.0, tx + 40.0, tx + 62.0, tx + 96.0, tx + 130.0, tx + 160.0, tx + 194.0]) {
      canvas.drawCircle(Offset(wx, railY), 8,
          Paint()..color = const Color(0xFF22242C));
      canvas.drawCircle(
          Offset(wx, railY),
          8,
          Paint()
            ..color = const Color(0xFF9AA0AC)
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.6);
      canvas.drawLine(
          Offset(wx - math.cos(wheelRot) * 6, railY - math.sin(wheelRot) * 6),
          Offset(wx + math.cos(wheelRot) * 6, railY + math.sin(wheelRot) * 6),
          Paint()..color = const Color(0xFF9AA0AC)..strokeWidth = 1.6);
    }
    // Steam puffs drifting back
    for (int p = 0; p < 6; p++) {
      final t = (time * 3 + p * 0.16) % 1.0;
      final px = tx + 13 - t * 60;
      final py = railY - 52 - t * 46;
      canvas.drawCircle(
          Offset(px, py),
          5 + t * 14,
          Paint()
            ..color = Colors.white.withOpacity(0.25 * (1 - t))
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6));
    }
  }

  /// Negele Arsi: golden wheat field swaying in the wind.
  static void _wheat(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    // Warm sun
    canvas.drawCircle(
        Offset(w * 0.78, h * 0.20),
        26,
        Paint()
          ..shader = RadialGradient(colors: [
            const Color(0xFFFFF59D),
            const Color(0xFFFFB300).withOpacity(0.4),
            Colors.transparent
          ]).createShader(
              Rect.fromCircle(center: Offset(w * 0.78, h * 0.20), radius: 40)));
    // Wheat stalks
    for (int i = 0; i < 16; i++) {
      final baseX = w * (i + 0.5) / 16;
      final sway = math.sin(time * 2 * math.pi + i * 0.6) * 10;
      final topX = baseX + sway;
      final baseY = h * 0.74;
      final topY = h * 0.46 + (i % 3) * 12;
      canvas.drawPath(
        Path()
          ..moveTo(baseX, baseY)
          ..quadraticBezierTo(baseX + sway * 0.4, (baseY + topY) / 2, topX, topY),
        Paint()
          ..color = const Color(0xFFD4A017).withOpacity(0.8)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.4,
      );
      // Grain head: clustered kernels
      for (int k = 0; k < 5; k++) {
        canvas.drawOval(
            Rect.fromCenter(
                center: Offset(topX + (k.isEven ? -3.0 : 3.0), topY - k * 4.5),
                width: 5,
                height: 8),
            Paint()..color = const Color(0xFFF2C230).withOpacity(0.9));
      }
    }
    // Drifting grain motes
    final rand = math.Random(51);
    for (int i = 0; i < 12; i++) {
      final t = (time * 0.8 + rand.nextDouble()) % 1.0;
      final gx = t * w * 1.2 - w * 0.1;
      final gy = h * (0.3 + rand.nextDouble() * 0.3) + math.sin(t * 6) * 8;
      canvas.drawCircle(Offset(gx, gy), 1.6,
          Paint()..color = const Color(0xFFF2C230).withOpacity(0.5 * (1 - t)));
    }
  }

  /// Woldia: sunrise over the highlands with passing birds.
  static void _sunrise(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final rise = math.sin(time * 2 * math.pi) * 0.5 + 0.5;
    final sunY = h * 0.52 - rise * h * 0.16;
    // Glow sky band
    canvas.drawRect(
      Rect.fromLTWH(0, h * 0.2, w, h * 0.5),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            st.secondary.withOpacity(0.20 + rise * 0.12),
          ],
        ).createShader(Rect.fromLTWH(0, h * 0.2, w, h * 0.5)),
    );
    // Sun with rotating rays
    final sun = Offset(w * 0.5, sunY);
    final rot = time * 2 * math.pi * 0.25;
    for (int i = 0; i < 10; i++) {
      final a = rot + i * math.pi / 5;
      canvas.drawLine(
          sun + Offset(math.cos(a), math.sin(a)) * 30,
          sun + Offset(math.cos(a), math.sin(a)) * (42 + rise * 8),
          Paint()
            ..color = st.secondary.withOpacity(0.6)
            ..strokeWidth = 3
            ..strokeCap = StrokeCap.round);
    }
    canvas.drawCircle(
        sun,
        22,
        Paint()
          ..shader = RadialGradient(colors: [
            Colors.white,
            st.secondary,
            st.secondary.withOpacity(0.0)
          ], stops: const [0.0, 0.55, 1.0])
              .createShader(Rect.fromCircle(center: sun, radius: 30)));
    // Mountain silhouettes in front
    final mount = Paint()..color = const Color(0xFF0B1F10).withOpacity(0.95);
    canvas.drawPath(
      Path()
        ..moveTo(0, h * 0.74)
        ..lineTo(w * 0.22, h * 0.52)
        ..lineTo(w * 0.45, h * 0.74)
        ..close(),
      mount,
    );
    canvas.drawPath(
      Path()
        ..moveTo(w * 0.35, h * 0.74)
        ..lineTo(w * 0.65, h * 0.46)
        ..lineTo(w * 0.95, h * 0.74)
        ..close(),
      mount,
    );
    // Birds gliding across
    for (int b = 0; b < 3; b++) {
      final t = (time * 1.2 + b * 0.3) % 1.0;
      final bx = t * w * 1.2 - w * 0.1;
      final by = h * (0.24 + b * 0.06) + math.sin(t * 4 * math.pi) * 6;
      final flap = math.sin((time * 8 + b) * math.pi).abs() * 4;
      final bird = Paint()
        ..color = const Color(0xFF1A1A1A).withOpacity(0.8)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round;
      canvas.drawPath(
        Path()
          ..moveTo(bx - 8, by - flap)
          ..quadraticBezierTo(bx - 3, by + 2, bx, by)
          ..quadraticBezierTo(bx + 3, by + 2, bx + 8, by - flap),
        bird,
      );
    }
  }

  /// Hambericho: misty mountain peaks with drifting fog.
  static void _peaks(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    // Stars
    final rand = math.Random(53);
    for (int i = 0; i < 16; i++) {
      final tw = math.sin((time * 4 + rand.nextDouble() * 3) * math.pi) * 0.5 + 0.5;
      canvas.drawCircle(
          Offset(rand.nextDouble() * w, rand.nextDouble() * h * 0.3),
          1 + tw,
          Paint()..color = Colors.white.withOpacity(0.3 + 0.4 * tw));
    }
    // Three layered ridges
    final shades = [0.85, 0.65, 0.45];
    for (int layer = 0; layer < 3; layer++) {
      final baseY = h * (0.50 + layer * 0.10);
      final peakH = h * (0.22 - layer * 0.05);
      final ridge = Path()..moveTo(0, h * 0.78);
      for (double x = 0; x <= w; x += w / 6) {
        final peakY = baseY -
            peakH * (0.5 + 0.5 * math.sin(x / w * math.pi * (2 + layer) + layer * 2));
        ridge.lineTo(x, peakY);
      }
      ridge.lineTo(w, h * 0.78);
      ridge.close();
      canvas.drawPath(
          ridge,
          Paint()
            ..color = Color.lerp(st.primary, const Color(0xFF04110E),
                    shades[layer])!
                .withOpacity(0.9));
    }
    // Fog bands drifting in opposite directions
    for (int f = 0; f < 2; f++) {
      final fx = ((time * (f == 0 ? 0.6 : -0.4)) % 1.0 + 1.0) % 1.0;
      final y = h * (0.52 + f * 0.12);
      canvas.drawOval(
        Rect.fromCenter(
            center: Offset((fx * 1.4 - 0.2) * w, y),
            width: w * 0.7,
            height: h * 0.05),
        Paint()
          ..color = st.secondary.withOpacity(0.14)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 14),
      );
    }
  }

  /// Hadiya Hossana: golden lion — blazing mane and watchful eyes.
  static void _lion(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final c = Offset(w * 0.5, h * 0.38);
    // Mane: two rings of flame-like rays slowly rotating
    for (int ring = 0; ring < 2; ring++) {
      final n = 14 + ring * 4;
      final rot = time * 2 * math.pi * (ring.isEven ? 0.15 : -0.1);
      for (int i = 0; i < n; i++) {
        final a = rot + i * 2 * math.pi / n;
        final flick = math.sin((time * 5 + i) * math.pi) * 4;
        final inner = 34.0 + ring * 16;
        final outer = inner + 22 + flick;
        canvas.drawPath(
          Path()
            ..moveTo(c.dx + math.cos(a - 0.09) * inner,
                c.dy + math.sin(a - 0.09) * inner)
            ..lineTo(c.dx + math.cos(a) * outer, c.dy + math.sin(a) * outer)
            ..lineTo(c.dx + math.cos(a + 0.09) * inner,
                c.dy + math.sin(a + 0.09) * inner)
            ..close(),
          Paint()
            ..color = Color.lerp(st.primary, st.secondary, ring * 0.5)!
                .withOpacity(0.55 - ring * 0.15),
        );
      }
    }
    // Face
    canvas.drawCircle(c, 30, Paint()..color = const Color(0xFFC98A2B));
    // Ears
    canvas.drawCircle(c + const Offset(-20, -24), 9,
        Paint()..color = const Color(0xFFB37722));
    canvas.drawCircle(c + const Offset(20, -24), 9,
        Paint()..color = const Color(0xFFB37722));
    // Eyes that blink
    final blink = math.sin(time * 2 * math.pi * 3);
    final eyeH = blink > 0.92 ? 1.0 : 5.0;
    final glow = Paint()
      ..color = const Color(0xFFFFB300)
      ..maskFilter = const MaskFilter.blur(BlurStyle.solid, 2);
    canvas.drawOval(
        Rect.fromCenter(center: c + const Offset(-11, -6), width: 8, height: eyeH),
        glow);
    canvas.drawOval(
        Rect.fromCenter(center: c + const Offset(11, -6), width: 8, height: eyeH),
        glow);
    // Muzzle + nose
    canvas.drawOval(
        Rect.fromCenter(center: c + const Offset(0, 12), width: 22, height: 16),
        Paint()..color = const Color(0xFFE0AC50));
    canvas.drawPath(
      Path()
        ..moveTo(c.dx - 5, c.dy + 7)
        ..lineTo(c.dx + 5, c.dy + 7)
        ..lineTo(c.dx, c.dy + 13)
        ..close(),
      Paint()..color = const Color(0xFF57330F),
    );
    // Whiskers
    final wsk = Paint()
      ..color = const Color(0xFF57330F).withOpacity(0.7)
      ..strokeWidth = 1.2;
    for (int side = -1; side <= 1; side += 2) {
      for (int i = 0; i < 3; i++) {
        canvas.drawLine(c + Offset(side * 8.0, 12.0 + i - 1),
            c + Offset(side * 26.0, 9.0 + i * 3), wsk);
      }
    }
  }

  /// Arba Minch: the forty springs — fountains and ripples.
  static void _springs(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    // Pool
    canvas.drawOval(
        Rect.fromCenter(center: Offset(w * 0.5, h * 0.66), width: w * 0.9, height: h * 0.10),
        Paint()..color = st.primary.withOpacity(0.25));
    // Expanding ripple rings
    for (int r = 0; r < 3; r++) {
      final t = (time * 1.5 + r * 0.33) % 1.0;
      canvas.drawOval(
        Rect.fromCenter(
            center: Offset(w * 0.5, h * 0.66),
            width: w * 0.2 + w * 0.6 * t,
            height: (h * 0.02 + h * 0.07 * t)),
        Paint()
          ..color = st.secondary.withOpacity(0.4 * (1 - t))
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2,
      );
    }
    // Four fountains with parabolic droplets
    for (int f = 0; f < 4; f++) {
      final fx = w * (0.2 + f * 0.2);
      final power = 0.8 + math.sin((time * 3 + f) * math.pi) * 0.2;
      final rand = math.Random(f * 13 + 1);
      for (int d = 0; d < 9; d++) {
        final t = (time * 2.2 + d * 0.11 + f * 0.07) % 1.0;
        final spread = (rand.nextDouble() - 0.5) * 26;
        final dx = fx + spread * t;
        final dy = h * 0.66 - (4 * t * (1 - t)) * h * 0.22 * power;
        canvas.drawCircle(
            Offset(dx, dy),
            2.2 * (1 - t * 0.5),
            Paint()
              ..color = Color.lerp(st.secondary, Colors.white, t)!
                  .withOpacity(0.8 * (1 - t * 0.4)));
      }
      // Jet core
      canvas.drawLine(
          Offset(fx, h * 0.66),
          Offset(fx, h * 0.66 - h * 0.10 * power),
          Paint()
            ..color = Colors.white.withOpacity(0.5)
            ..strokeWidth = 3
            ..strokeCap = StrokeCap.round);
    }
  }

  /// Hawassa: fish leaping from the lake at dusk.
  static void _fish(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final waterY = h * 0.58;
    // Water body with gentle waves
    final p = Path()..moveTo(0, waterY);
    for (double x = 0; x <= w; x += w / 14) {
      p.lineTo(x, waterY + math.sin(x / w * 4 * math.pi + time * 2 * math.pi) * 5);
    }
    p.lineTo(w, h * 0.78);
    p.lineTo(0, h * 0.78);
    p.close();
    canvas.drawPath(p, Paint()..color = st.primary.withOpacity(0.30));
    // Two fish jumping in staggered arcs
    for (int f2 = 0; f2 < 2; f2++) {
      final t = (time * 1.6 + f2 * 0.5) % 1.0;
      final fx = w * (0.18 + f2 * 0.42) + t * w * 0.22;
      final arc = 4 * t * (1 - t); // 0..1..0
      final fy = waterY - arc * h * 0.16;
      if (arc > 0.05) {
        final angle = (0.5 - t) * 1.6; // rising then diving
        canvas.save();
        canvas.translate(fx, fy);
        canvas.rotate(-angle);
        // Body
        canvas.drawOval(Rect.fromCenter(center: Offset.zero, width: 26, height: 11),
            Paint()..color = st.secondary.withOpacity(0.95));
        // Tail
        canvas.drawPath(
          Path()
            ..moveTo(-13, 0)
            ..lineTo(-21, -6)
            ..lineTo(-21, 6)
            ..close(),
          Paint()..color = st.secondary.withOpacity(0.95),
        );
        // Eye + shine
        canvas.drawCircle(const Offset(7, -2), 1.6, Paint()..color = Colors.white);
        canvas.drawLine(const Offset(-6, -3), const Offset(5, -4),
            Paint()..color = Colors.white.withOpacity(0.4)..strokeWidth = 1.5);
        canvas.restore();
        // Splash droplets near the surface
        if (t < 0.25 || t > 0.75) {
          final sx = t < 0.25 ? fx : fx;
          for (int d = 0; d < 5; d++) {
            final da = math.pi * (0.25 + d * 0.125);
            final dr = 8.0 + (t < 0.25 ? t : 1 - t) * 30;
            canvas.drawCircle(
                Offset(sx + math.cos(da) * dr, waterY - math.sin(da) * dr * 0.6),
                1.8,
                Paint()..color = Colors.white.withOpacity(0.5));
          }
        }
      }
    }
    // Surface glints
    final rand = math.Random(57);
    for (int i = 0; i < 10; i++) {
      final gx = rand.nextDouble() * w;
      final gy = waterY + rand.nextDouble() * h * 0.16;
      final tw = math.sin((time * 5 + i) * 2 * math.pi) * 0.5 + 0.5;
      canvas.drawOval(
          Rect.fromCenter(center: Offset(gx, gy), width: 8 * tw + 2, height: 2),
          Paint()..color = Colors.white.withOpacity(0.3 * tw));
    }
  }

  /// Awash Ketema: rushing river rapids with foam.
  static void _rapids(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    // River band flowing diagonally
    for (int lane = 0; lane < 4; lane++) {
      final laneY = h * (0.34 + lane * 0.10);
      final flow = Path()..moveTo(-20, laneY);
      for (double x = -20; x <= w + 20; x += w / 10) {
        flow.lineTo(
            x,
            laneY +
                math.sin(x / w * 5 * math.pi + time * 2 * math.pi * 3 + lane) *
                    (5.0 + lane));
      }
      canvas.drawPath(
          flow,
          Paint()
            ..color = Color.lerp(st.primary, st.secondary, lane / 4)!
                .withOpacity(0.5 - lane * 0.08)
            ..style = PaintingStyle.stroke
            ..strokeWidth = 8.0 - lane);
    }
    // Boulders with foam bursts
    for (int b = 0; b < 3; b++) {
      final bx = w * (0.22 + b * 0.28);
      final by = h * (0.42 + (b % 2) * 0.14);
      canvas.drawOval(
          Rect.fromCenter(center: Offset(bx, by), width: 30, height: 20),
          Paint()..color = const Color(0xFF37414C));
      // Foam spray upstream of each boulder
      final rand = math.Random(b * 19 + 2);
      for (int s = 0; s < 7; s++) {
        final t = (time * 4 + s * 0.14 + b * 0.2) % 1.0;
        canvas.drawCircle(
            Offset(bx - 16 - t * 14 + rand.nextDouble() * 6,
                by - 8 - t * 12),
            2.5 * (1 - t) + 0.5,
            Paint()..color = Colors.white.withOpacity(0.6 * (1 - t)));
      }
    }
  }

  /// Shire: ancient Tigray stelae under moonlight.
  static void _obelisk(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    // Back beams pulsing
    final pulse = math.sin(time * 2 * math.pi) * 0.5 + 0.5;
    canvas.drawCircle(
        Offset(w * 0.5, h * 0.42),
        w * (0.24 + pulse * 0.04),
        Paint()
          ..shader = RadialGradient(colors: [
            st.secondary.withOpacity(0.20),
            Colors.transparent,
          ]).createShader(
              Rect.fromCircle(center: Offset(w * 0.5, h * 0.42), radius: w * 0.3)));
    // Main stele + two smaller ones
    void stele(double cx, double sw2, double sh2) {
      final p = Path()
        ..moveTo(cx - sw2 / 2, h * 0.70)
        ..lineTo(cx - sw2 / 2.6, h * 0.70 - sh2)
        ..quadraticBezierTo(
            cx, h * 0.70 - sh2 - 14, cx + sw2 / 2.6, h * 0.70 - sh2)
        ..lineTo(cx + sw2 / 2, h * 0.70)
        ..close();
      canvas.drawPath(p, Paint()..color = const Color(0xFF1B2430));
      // Carved false-door lines
      final carve = Paint()
        ..color = st.secondary.withOpacity(0.35)
        ..strokeWidth = 1.4;
      for (int i = 1; i <= 4; i++) {
        final y = h * 0.70 - sh2 * i / 5;
        canvas.drawLine(Offset(cx - sw2 / 3.2, y), Offset(cx + sw2 / 3.2, y), carve);
      }
    }

    stele(w * 0.5, w * 0.13, h * 0.34);
    stele(w * 0.28, w * 0.09, h * 0.20);
    stele(w * 0.72, w * 0.09, h * 0.16);
    // Rising light motes
    final rand = math.Random(59);
    for (int i = 0; i < 12; i++) {
      final t = (time * 0.5 + rand.nextDouble()) % 1.0;
      canvas.drawCircle(
          Offset(w * (0.3 + rand.nextDouble() * 0.4), h * 0.7 - t * h * 0.4),
          1.5,
          Paint()..color = st.secondary.withOpacity(0.5 * (1 - t)));
    }
  }

  /// Welwalo Adigrat: temple columns with a glowing sanctum.
  static void _temple(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final baseY = h * 0.68;
    final glow = math.sin(time * 2 * math.pi) * 0.5 + 0.5;
    // Sanctum glow between columns
    canvas.drawRect(
      Rect.fromLTWH(w * 0.25, baseY - h * 0.26, w * 0.5, h * 0.26),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            st.secondary.withOpacity(0.18 + glow * 0.12),
            Colors.transparent,
          ],
        ).createShader(Rect.fromLTWH(w * 0.25, baseY - h * 0.26, w * 0.5, h * 0.26)),
    );
    final stone = Paint()..color = const Color(0xFF221A16);
    // Steps
    canvas.drawRect(Rect.fromLTWH(w * 0.18, baseY, w * 0.64, 8), stone);
    canvas.drawRect(Rect.fromLTWH(w * 0.14, baseY + 8, w * 0.72, 8), stone);
    // Columns with capitals
    for (int i = 0; i < 4; i++) {
      final cx = w * (0.28 + i * 0.148);
      canvas.drawRect(
          Rect.fromLTWH(cx - 7, baseY - h * 0.24, 14, h * 0.24), stone);
      canvas.drawRect(
          Rect.fromLTWH(cx - 11, baseY - h * 0.24 - 7, 22, 7), stone);
      canvas.drawRect(Rect.fromLTWH(cx - 10, baseY - 6, 20, 6), stone);
      // Column edge highlight
      canvas.drawLine(
          Offset(cx - 5, baseY - h * 0.24),
          Offset(cx - 5, baseY),
          Paint()
            ..color = st.secondary.withOpacity(0.20 + glow * 0.15)
            ..strokeWidth = 2);
    }
    // Pediment
    canvas.drawPath(
      Path()
        ..moveTo(w * 0.22, baseY - h * 0.24 - 7)
        ..lineTo(w * 0.5, baseY - h * 0.24 - 7 - h * 0.07)
        ..lineTo(w * 0.78, baseY - h * 0.24 - 7)
        ..close(),
      stone,
    );
    // Floating embers of incense
    final rand = math.Random(61);
    for (int i = 0; i < 10; i++) {
      final t = (time * 0.6 + rand.nextDouble()) % 1.0;
      canvas.drawCircle(
          Offset(w * (0.3 + rand.nextDouble() * 0.4) + math.sin(t * 8) * 6,
              baseY - t * h * 0.36),
          1.4,
          Paint()..color = st.secondary.withOpacity(0.55 * (1 - t)));
    }
  }

  /// Mekelakeya (Defense): crossed swords clashing with sparks.
  static void _swords(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final c = Offset(w * 0.5, h * 0.40);
    final cycle = (time * 6) % 1.0;
    // Swing toward each other, clash at cycle == 0.5
    final open = 0.55 - 0.25 * math.sin(cycle * math.pi);
    for (int side = -1; side <= 1; side += 2) {
      final a = side * open + (side == 1 ? math.pi : 0);
      final dir = Offset(math.cos(a - math.pi / 2), math.sin(a - math.pi / 2));
      final hiltP = c - dir * 24;
      final tipP = c + dir * (h * 0.16);
      // Blade with metallic gradient
      canvas.drawLine(
          hiltP,
          tipP,
          Paint()
            ..shader = LinearGradient(colors: const [
              Color(0xFFE8EBF0),
              Color(0xFF8F97A3),
            ]).createShader(Rect.fromPoints(hiltP, tipP))
            ..strokeWidth = 7
            ..strokeCap = StrokeCap.round);
      // Fuller line
      canvas.drawLine(hiltP, tipP,
          Paint()..color = const Color(0xFF5E6672)..strokeWidth = 1.6);
      // Guard + grip + pommel
      final perp = Offset(-dir.dy, dir.dx);
      canvas.drawLine(hiltP + perp * 12, hiltP - perp * 12,
          Paint()..color = st.secondary..strokeWidth = 5);
      canvas.drawLine(hiltP, hiltP - dir * 18,
          Paint()..color = const Color(0xFF4A2E12)..strokeWidth = 6);
      canvas.drawCircle(hiltP - dir * 21, 4, Paint()..color = st.secondary);
    }
    // Clash sparks at the crossing point
    final clash = (1 - (cycle - 0.5).abs() * 8).clamp(0.0, 1.0);
    if (clash > 0) {
      final rand = math.Random(67);
      final spark = Paint()
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round
        ..blendMode = BlendMode.plus;
      for (int s = 0; s < 10; s++) {
        final a = rand.nextDouble() * 2 * math.pi;
        final len = 8 + rand.nextDouble() * 20 * clash;
        spark.color = Color.lerp(Colors.white, st.secondary, rand.nextDouble())!
            .withOpacity(0.9 * clash);
        canvas.drawLine(c + Offset(math.cos(a), math.sin(a)) * 6,
            c + Offset(math.cos(a), math.sin(a)) * (6 + len), spark);
      }
      canvas.drawCircle(
          c,
          10 * clash,
          Paint()
            ..color = Colors.white.withOpacity(0.8 * clash)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6));
    }
  }

  /// Wolaita Dicha: an eagle soaring across the sky.
  static void _eagle(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final t = (time * 1.2) % 1.0;
    final ex = w * (t * 1.3 - 0.15);
    final ey = h * 0.32 + math.sin(t * 3 * math.pi) * h * 0.05;
    final flap = math.sin(time * 8 * math.pi) * 0.35;
    // Wind streaks
    final wind = Paint()
      ..color = Colors.white.withOpacity(0.12)
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    for (int i = 0; i < 4; i++) {
      final wy = h * (0.22 + i * 0.08);
      final wx = ((time * 2.4 + i * 0.26) % 1.0) * w * 1.4 - w * 0.2;
      canvas.drawLine(Offset(wx, wy), Offset(wx - w * 0.10, wy), wind);
    }
    // Wings: two large beziers that beat
    for (int side = -1; side <= 1; side += 2) {
      final span = w * 0.20 * side;
      final lift = -h * 0.09 - flap * h * 0.05 * side.sign;
      canvas.drawPath(
        Path()
          ..moveTo(ex, ey)
          ..quadraticBezierTo(ex + span * 0.4, ey + lift * 1.5, ex + span, ey + lift)
          ..quadraticBezierTo(ex + span * 0.75, ey + lift * 0.3 + 8, ex + span * 0.3, ey + 5)
          ..close(),
        Paint()..color = st.primary.withOpacity(0.85),
      );
      // Feather tips
      for (int f = 0; f < 3; f++) {
        canvas.drawLine(
            Offset(ex + span * (0.75 + f * 0.08), ey + lift * (0.9 - f * 0.1)),
            Offset(ex + span * (0.9 + f * 0.08), ey + lift * (1.05 - f * 0.1)),
            Paint()
              ..color = st.primary.withOpacity(0.7)
              ..strokeWidth = 3
              ..strokeCap = StrokeCap.round);
      }
    }
    // Body + tail + head
    canvas.drawOval(
        Rect.fromCenter(center: Offset(ex, ey + 4), width: 20, height: 30),
        Paint()..color = st.primary);
    canvas.drawPath(
      Path()
        ..moveTo(ex - 4, ey + 18)
        ..lineTo(ex, ey + 32)
        ..lineTo(ex + 4, ey + 18)
        ..close(),
      Paint()..color = st.primary.withOpacity(0.9),
    );
    canvas.drawCircle(Offset(ex, ey - 12), 7, Paint()..color = Colors.white);
    // Beak + eye
    canvas.drawPath(
      Path()
        ..moveTo(ex + 6, ey - 13)
        ..lineTo(ex + 13, ey - 10)
        ..lineTo(ex + 6, ey - 8)
        ..close(),
      Paint()..color = st.secondary,
    );
    canvas.drawCircle(Offset(ex + 2, ey - 13), 1.5,
        Paint()..color = const Color(0xFF1A1A1A));
  }

  /// Negede: camel caravan crossing moonlit dunes.
  static void _caravan(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    // Moon + stars
    canvas.drawCircle(Offset(w * 0.2, h * 0.18), 14,
        Paint()..color = const Color(0xFFFFF3D6).withOpacity(0.95));
    final rand = math.Random(71);
    for (int i = 0; i < 14; i++) {
      final tw = math.sin((time * 4 + rand.nextDouble() * 3) * math.pi) * 0.5 + 0.5;
      canvas.drawCircle(
          Offset(rand.nextDouble() * w, rand.nextDouble() * h * 0.3),
          0.8 + tw,
          Paint()..color = Colors.white.withOpacity(0.3 + 0.4 * tw));
    }
    // Dunes
    canvas.drawPath(
      Path()
        ..moveTo(0, h * 0.62)
        ..quadraticBezierTo(w * 0.3, h * 0.52, w * 0.6, h * 0.62)
        ..quadraticBezierTo(w * 0.85, h * 0.70, w, h * 0.60)
        ..lineTo(w, h * 0.78)
        ..lineTo(0, h * 0.78)
        ..close(),
      Paint()..color = const Color(0xFF6B4E2E).withOpacity(0.6),
    );
    // Camels walking in a line
    final walk = (time * 1.0) % 1.0;
    for (int cml = 0; cml < 3; cml++) {
      final cx = w * (walk * 1.3 - 0.15) - cml * 74;
      final cy = h * 0.58 - math.sin(cx / w * 2 * math.pi) * 6;
      final body = Paint()..color = const Color(0xFF17110B);
      // Body with two humps
      canvas.drawOval(
          Rect.fromCenter(center: Offset(cx, cy), width: 44, height: 18), body);
      canvas.drawCircle(Offset(cx - 8, cy - 10), 8, body);
      canvas.drawCircle(Offset(cx + 8, cy - 9), 7, body);
      // Neck + head
      canvas.drawPath(
        Path()
          ..moveTo(cx + 20, cy - 4)
          ..quadraticBezierTo(cx + 32, cy - 18, cx + 34, cy - 26)
          ..lineTo(cx + 40, cy - 24)
          ..quadraticBezierTo(cx + 36, cy - 14, cx + 26, cy),
        body,
      );
      // Legs with a walking gait
      for (int leg = 0; leg < 4; leg++) {
        final phase = math.sin((time * 6) * math.pi + leg * math.pi / 2) * 5;
        final lx = cx - 15 + leg * 10.0;
        canvas.drawLine(Offset(lx, cy + 6), Offset(lx + phase, cy + 24),
            Paint()..color = const Color(0xFF17110B)..strokeWidth = 3.5);
      }
      // Cargo in team colors
      canvas.drawRRect(
          RRect.fromRectAndRadius(
              Rect.fromCenter(center: Offset(cx, cy - 14), width: 16, height: 9),
              const Radius.circular(2)),
          Paint()..color = st.secondary.withOpacity(0.9));
    }
    // Drifting sand
    for (int i = 0; i < 8; i++) {
      final t = (time * 1.4 + i * 0.12) % 1.0;
      canvas.drawCircle(
          Offset(t * w, h * 0.64 + math.sin(t * 8) * 5),
          1.3,
          Paint()..color = const Color(0xFFD9B380).withOpacity(0.4 * (1 - t)));
    }
  }

  /// Sidama Coffee: a coffee branch with ripening cherries.
  static void _branch(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final sway = math.sin(time * 2 * math.pi) * 6;
    // Main branch from the left
    canvas.drawPath(
      Path()
        ..moveTo(-4, h * 0.30)
        ..quadraticBezierTo(w * 0.3, h * 0.34 + sway * 0.4, w * 0.62,
            h * 0.42 + sway),
      Paint()
        ..color = const Color(0xFF4E342E)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6
        ..strokeCap = StrokeCap.round,
    );
    // Leaves along the branch
    for (int i = 0; i < 7; i++) {
      final t = 0.12 + i * 0.13;
      final lx = w * t * 0.62 / 0.9;
      final ly = h * (0.30 + t * 0.13) + sway * t;
      final la = math.sin(time * 2 * math.pi + i) * 0.12 +
          (i.isEven ? 0.9 : -0.9);
      canvas.save();
      canvas.translate(lx, ly);
      canvas.rotate(la);
      canvas.drawOval(
          Rect.fromCenter(center: const Offset(16, 0), width: 34, height: 13),
          Paint()..color = st.primary.withOpacity(0.85));
      canvas.drawLine(const Offset(2, 0), const Offset(30, 0),
          Paint()..color = const Color(0xFF1B5E20)..strokeWidth = 1.2);
      canvas.restore();
    }
    // Cherry clusters ripening (green → red shimmer)
    final rand = math.Random(73);
    for (int c2 = 0; c2 < 3; c2++) {
      final bx = w * (0.22 + c2 * 0.16);
      final by = h * (0.34 + c2 * 0.035) + sway * (0.3 + c2 * 0.2);
      for (int b = 0; b < 4; b++) {
        final ripe =
            (math.sin((time + c2 * 0.2 + b * 0.1) * 2 * math.pi) * 0.5 + 0.5);
        canvas.drawCircle(
            Offset(bx + (b % 2) * 9.0 - 4, by + (b ~/ 2) * 9.0 + 6),
            5,
            Paint()
              ..color = Color.lerp(
                  const Color(0xFF7CB342), const Color(0xFFD32F2F), ripe)!);
        canvas.drawCircle(
            Offset(bx + (b % 2) * 9.0 - 6, by + (b ~/ 2) * 9.0 + 4),
            1.4,
            Paint()..color = Colors.white.withOpacity(0.5));
      }
    }
    // Falling leaf
    final ft = (time * 0.8) % 1.0;
    canvas.save();
    canvas.translate(w * 0.5 + math.sin(ft * 4 * math.pi) * 24, h * 0.4 + ft * h * 0.3);
    canvas.rotate(ft * 6);
    canvas.drawOval(const Rect.fromLTWH(-9, -4, 18, 8),
        Paint()..color = st.primary.withOpacity(0.7 * (1 - ft)));
    canvas.restore();
    // Warm aroma glow
    canvas.drawCircle(
        Offset(w * 0.4, h * 0.38),
        w * 0.24,
        Paint()
          ..shader = RadialGradient(colors: [
            st.secondary.withOpacity(0.14),
            Colors.transparent
          ]).createShader(
              Rect.fromCircle(center: Offset(w * 0.4, h * 0.38), radius: w * 0.24)));
  }

  /// Leipzig: a charging bull kicking up dust.
  static void _bull(Canvas canvas, Size size, double time, TeamStyle st) {
    final w = size.width, h = size.height;
    final t = (time * 1.5) % 1.0;
    final bx = w * (t * 1.4 - 0.2);
    final by = h * 0.46 + math.sin(t * 6 * math.pi).abs() * -6; // gallop bounce
    final gallop = math.sin(time * 10 * math.pi);
    final dark = Paint()..color = const Color(0xFF15100E);
    // Speed lines
    for (int i = 0; i < 3; i++) {
      canvas.drawLine(
          Offset(bx - 40 - i * 16, by - 8 + i * 8),
          Offset(bx - 70 - i * 20, by - 8 + i * 8),
          Paint()
            ..color = st.primary.withOpacity(0.35 - i * 0.09)
            ..strokeWidth = 3
            ..strokeCap = StrokeCap.round);
    }
    // Body leaning forward
    canvas.save();
    canvas.translate(bx, by);
    canvas.rotate(-0.08);
    canvas.drawOval(
        Rect.fromCenter(center: Offset.zero, width: 62, height: 30), dark);
    // Shoulder hump
    canvas.drawCircle(const Offset(14, -14), 13, dark);
    // Head lowered for the charge
    canvas.drawOval(
        Rect.fromCenter(center: const Offset(34, -2), width: 24, height: 18), dark);
    // Horns
    final horn = Paint()
      ..color = const Color(0xFFE8E2D6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(Rect.fromCircle(center: const Offset(40, -14), radius: 10),
        math.pi * 0.9, -math.pi * 0.8, false, horn);
    canvas.drawArc(Rect.fromCircle(center: const Offset(34, -12), radius: 12),
        math.pi * 0.95, -math.pi * 0.7, false, horn);
    // Glowing red eye
    canvas.drawCircle(const Offset(38, -4), 2.2,
        Paint()
          ..color = st.primary
          ..maskFilter = const MaskFilter.blur(BlurStyle.solid, 2));
    // Legs galloping
    for (int leg = 0; leg < 4; leg++) {
      final phase = gallop * (leg.isEven ? 10 : -10);
      final lx = -22.0 + leg * 14;
      canvas.drawLine(Offset(lx, 10), Offset(lx + phase, 30),
          Paint()..color = const Color(0xFF15100E)..strokeWidth = 5);
    }
    // Tail whipping
    canvas.drawPath(
      Path()
        ..moveTo(-30, -6)
        ..quadraticBezierTo(-44, -12 + gallop * 6, -50, -2 + gallop * 4),
      Paint()
        ..color = const Color(0xFF15100E)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.5,
    );
    canvas.restore();
    // Dust clouds behind hooves
    final rand = math.Random(79);
    for (int d = 0; d < 8; d++) {
      final dt = (time * 3 + d * 0.12) % 1.0;
      canvas.drawCircle(
          Offset(bx - 26 - dt * 46 + rand.nextDouble() * 10,
              by + 26 - dt * 14),
          4 + dt * 10,
          Paint()
            ..color = const Color(0xFF8D7B65).withOpacity(0.25 * (1 - dt))
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5));
    }
    // Red energy aura
    canvas.drawCircle(
        Offset(bx + 10, by - 6),
        w * 0.16,
        Paint()
          ..shader = RadialGradient(colors: [
            st.primary.withOpacity(0.18),
            Colors.transparent
          ]).createShader(
              Rect.fromCircle(center: Offset(bx + 10, by - 6), radius: w * 0.16))
          ..blendMode = BlendMode.plus);
  }
}
