import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import '../theme/app_theme.dart';
import '../home/home_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _step = 0;
  bool _imeEnabled = false;
  bool _imeSelected = false;

  @override
  void initState() {
    super.initState();
    _checkImeStatus();
  }

  Future<void> _checkImeStatus() async {
    if (Platform.isAndroid) {
      final messenger = const MethodChannel('com.akai.keyboard/setup');
      try {
        final enabled =
            await messenger.invokeMethod<bool>('isImeEnabled') ?? false;
        final selected =
            await messenger.invokeMethod<bool>('isImeSelected') ?? false;
        if (mounted) {
          setState(() {
            _imeEnabled = enabled;
            _imeSelected = selected;
          });
        }
      } on PlatformException {
        // ignore
      } on MissingPluginException {
        // ignore
      }
    }
  }

  Future<void> _openImeSettings() async {
    if (Platform.isAndroid) {
      const channel = MethodChannel('com.akai.keyboard/setup');
      try {
        await channel.invokeMethod('openImeSettings');
      } on PlatformException {
        // ignore
      }
    }
    await Future.delayed(const Duration(milliseconds: 800));
    await _checkImeStatus();
  }

  Future<void> _openImePicker() async {
    if (Platform.isAndroid) {
      const channel = MethodChannel('com.akai.keyboard/setup');
      try {
        await channel.invokeMethod('showImePicker');
      } on PlatformException {
        // ignore
      }
    }
    await Future.delayed(const Duration(milliseconds: 500));
    await _checkImeStatus();
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<AkaiSettingsProvider>();
    final palette = settings.palette;
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topRight,
            radius: 1.4,
            colors: [
              palette.accent.withOpacity(0.18),
              palette.background,
            ],
          ),
        ),
        child: SafeArea(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 400),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, animation) {
              return FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.1, 0),
                    end: Offset.zero,
                  ).animate(animation),
                  child: child,
                ),
              );
            },
            child: _buildStep(palette, settings),
          ),
        ),
      ),
    );
  }

  Widget _buildStep(AkaiPalette palette, AkaiSettingsProvider settings) {
    if (_step == 0) {
      return _WelcomeStep(
        key: const ValueKey('welcome'),
        palette: palette,
        onContinue: () => setState(() => _step = 1),
      );
    } else if (_step == 1) {
      return _EnableStep(
        key: const ValueKey('enable'),
        palette: palette,
        imeEnabled: _imeEnabled,
        onOpenSettings: _openImeSettings,
        onRefresh: _checkImeStatus,
        onContinue: _imeEnabled ? () => setState(() => _step = 2) : null,
        onSkip: () => setState(() => _step = 2),
      );
    } else if (_step == 2) {
      return _SelectStep(
        key: const ValueKey('select'),
        palette: palette,
        imeEnabled: _imeEnabled,
        imeSelected: _imeSelected,
        onOpenPicker: _openImePicker,
        onRefresh: _checkImeStatus,
        onContinue: () {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const HomeScreen()),
          );
        },
      );
    }
    return const SizedBox.shrink();
  }
}

class _WelcomeStep extends StatelessWidget {
  final AkaiPalette palette;
  final VoidCallback onContinue;
  const _WelcomeStep(
      {super.key, required this.palette, required this.onContinue});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Spacer(),
          _AkaiLogo(palette: palette, size: 120),
          const SizedBox(height: 36),
          ShaderMask(
            shaderCallback: (bounds) => LinearGradient(
              colors: [palette.glow, palette.accent],
            ).createShader(bounds),
            child: const Text(
              'Akai',
              style: TextStyle(
                color: Colors.white,
                fontSize: 64,
                fontWeight: FontWeight.w800,
                height: 1,
                letterSpacing: -2,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Type beautifully.',
            style: TextStyle(
              color: palette.keyText,
              fontSize: 28,
              fontWeight: FontWeight.w300,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'A keyboard crafted for elegance, speed, and joy. Pick a theme, feel the haptics, and make every tap an experience.',
            style: TextStyle(
              color: palette.keySecondaryText,
              fontSize: 15,
              height: 1.5,
            ),
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: onContinue,
              style: ElevatedButton.styleFrom(
                backgroundColor: palette.accent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Get Started',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward_rounded, size: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EnableStep extends StatelessWidget {
  final AkaiPalette palette;
  final bool imeEnabled;
  final VoidCallback onOpenSettings;
  final VoidCallback onRefresh;
  final VoidCallback? onContinue;
  final VoidCallback onSkip;

  const _EnableStep({
    super.key,
    required this.palette,
    required this.imeEnabled,
    required this.onOpenSettings,
    required this.onRefresh,
    required this.onContinue,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text('Step 1 of 2',
              style: TextStyle(
                  color: palette.accent,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  letterSpacing: 1.2)),
          const SizedBox(height: 12),
          Text('Enable Akai',
              style: TextStyle(
                  color: palette.keyText,
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -1)),
          const SizedBox(height: 8),
          Text('Turn on Akai in your device\u2019s keyboard settings.',
              style: TextStyle(
                  color: palette.keySecondaryText, fontSize: 15, height: 1.5)),
          const SizedBox(height: 36),
          _StatusCard(
            palette: palette,
            active: imeEnabled,
            icon: imeEnabled
                ? Icons.check_circle_rounded
                : Icons.power_settings_new_rounded,
            title: imeEnabled ? 'Akai is enabled' : 'Tap to enable Akai',
            subtitle: imeEnabled
                ? 'You\u2019re all set on this step'
                : 'Opens Settings → Languages & input',
            onTap: onOpenSettings,
          ),
          const Spacer(),
          Row(
            children: [
              if (!imeEnabled)
                Expanded(
                  child: OutlinedButton(
                    onPressed: onSkip,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: palette.keySecondaryText,
                      side: BorderSide(color: palette.surfaceVariant),
                      minimumSize: const Size.fromHeight(54),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Skip for now'),
                  ),
                ),
              if (!imeEnabled) const SizedBox(width: 12),
              Expanded(
                flex: imeEnabled ? 1 : 1,
                child: ElevatedButton(
                  onPressed: onContinue ?? onRefresh,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: palette.accent,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(54),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: Text(imeEnabled ? 'Continue' : 'I\u2019ve enabled it'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SelectStep extends StatelessWidget {
  final AkaiPalette palette;
  final bool imeEnabled;
  final bool imeSelected;
  final VoidCallback onOpenPicker;
  final VoidCallback onRefresh;
  final VoidCallback onContinue;

  const _SelectStep({
    super.key,
    required this.palette,
    required this.imeEnabled,
    required this.imeSelected,
    required this.onOpenPicker,
    required this.onRefresh,
    required this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text('Step 2 of 2',
              style: TextStyle(
                  color: palette.accent,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  letterSpacing: 1.2)),
          const SizedBox(height: 12),
          Text('Choose Akai',
              style: TextStyle(
                  color: palette.keyText,
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -1)),
          const SizedBox(height: 8),
          Text('Switch to Akai from the globe key on any keyboard.',
              style: TextStyle(
                  color: palette.keySecondaryText, fontSize: 15, height: 1.5)),
          const SizedBox(height: 36),
          _StatusCard(
            palette: palette,
            active: imeSelected,
            icon: imeSelected
                ? Icons.check_circle_rounded
                : Icons.language_rounded,
            title: imeSelected ? 'Akai is active' : 'Switch to Akai',
            subtitle: imeSelected
                ? 'You\u2019re ready to type beautifully'
                : 'Tap to open the keyboard picker',
            onTap: onOpenPicker,
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: onContinue,
              style: ElevatedButton.styleFrom(
                backgroundColor: palette.accent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: const Text('Open Akai',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  final AkaiPalette palette;
  final bool active;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _StatusCard({
    required this.palette,
    required this.active,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: palette.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active
                ? palette.accent.withOpacity(0.5)
                : palette.surfaceVariant,
            width: active ? 1.5 : 1,
          ),
          boxShadow: active
              ? [
                  BoxShadow(
                      color: palette.glow.withOpacity(0.2),
                      blurRadius: 24,
                      spreadRadius: -4)
                ]
              : null,
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: active ? palette.accent : palette.surfaceVariant,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon,
                  color: active ? Colors.white : palette.keyText, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          color: palette.keyText,
                          fontSize: 17,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(subtitle,
                      style: TextStyle(
                          color: palette.keySecondaryText, fontSize: 13)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: palette.keySecondaryText),
          ],
        ),
      ),
    );
  }
}

class _AkaiLogo extends StatefulWidget {
  final AkaiPalette palette;
  final double size;
  const _AkaiLogo({required this.palette, this.size = 96});

  @override
  State<_AkaiLogo> createState() => _AkaiLogoState();
}

class _AkaiLogoState extends State<_AkaiLogo>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(seconds: 8))
      ..repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        return Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.size * 0.28),
            gradient: SweepGradient(
              startAngle: _c.value * 6.28,
              endAngle: _c.value * 6.28 + 6.28,
              colors: [
                widget.palette.accent,
                widget.palette.glow,
                widget.palette.accentMuted,
                widget.palette.accent,
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: widget.palette.glow.withOpacity(0.4),
                blurRadius: 32,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Center(
            child: Container(
              width: widget.size * 0.85,
              height: widget.size * 0.85,
              decoration: BoxDecoration(
                color: widget.palette.background,
                borderRadius: BorderRadius.circular(widget.size * 0.24),
              ),
              child: Center(
                child: ShaderMask(
                  shaderCallback: (bounds) => LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [widget.palette.glow, widget.palette.accent],
                  ).createShader(bounds),
                  child: const Text(
                    'A',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 60,
                      fontWeight: FontWeight.w800,
                      height: 1,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
