import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dashboard_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool _step1Done = false;
  bool _step2Done = false;

  late AnimationController _orb1Controller;
  late AnimationController _orb2Controller;
  late AnimationController _pulseController;
  late AnimationController _checkController;

  @override
  void initState() {
    super.initState();
    _orb1Controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true);
    _orb2Controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat(reverse: true);
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _checkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _orb1Controller.dispose();
    _orb2Controller.dispose();
    _pulseController.dispose();
    _checkController.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_complete', true);
    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, a, __) => const DashboardScreen(),
          transitionsBuilder: (_, a, __, child) =>
              FadeTransition(opacity: a, child: child),
          transitionDuration: const Duration(milliseconds: 500),
        ),
      );
    }
  }

  void _openImeSettings() {
    try {
      const platform = MethodChannel('com.akai.keyboard/setup');
      platform.invokeMethod('openImeSettings');
    } catch (_) {}
  }

  void _openInputSelection() {
    try {
      const platform = MethodChannel('com.akai.keyboard/setup');
      platform.invokeMethod('showImePicker');
    } catch (_) {}
  }

  void _nextPage() {
    HapticFeedback.lightImpact();
    if (_currentPage < 3) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeOutExpo,
      );
    } else {
      _completeOnboarding();
    }
  }

  // Accent color per page
  Color get _pageColor => const [
        Color(0xFF10B981), // welcome - emerald
        Color(0xFF3B82F6), // step 1 - blue
        Color(0xFF8B5CF6), // step 2 - purple
        Color(0xFFEC4899), // done - pink
      ][_currentPage];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF06091A),
      body: Stack(
        children: [
          // Animated background orbs
          _buildAnimatedBackground(),

          // Main content
          SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 16),

                // Top branding
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            _pageColor.withOpacity(0.2),
                            _pageColor.withOpacity(0.05),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: _pageColor.withOpacity(0.3), width: 1),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('✦',
                              style: TextStyle(
                                  color: _pageColor, fontSize: 11)),
                          const SizedBox(width: 6),
                          Text(
                            'AKAI KEYBOARD',
                            style: TextStyle(
                              color: _pageColor,
                              fontSize: 11,
                              letterSpacing: 3,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Pill progress bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Row(
                    children: List.generate(4, (i) {
                      final isActive = i == _currentPage;
                      final isDone = i < _currentPage;
                      return Expanded(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          curve: Curves.easeOut,
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          height: 4,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4),
                            color: isDone
                                ? _pageColor
                                : isActive
                                    ? _pageColor
                                    : Colors.white.withOpacity(0.1),
                            boxShadow: isActive
                                ? [
                                    BoxShadow(
                                      color: _pageColor.withOpacity(0.6),
                                      blurRadius: 8,
                                    ),
                                  ]
                                : null,
                          ),
                        ),
                      );
                    }),
                  ),
                ),

                const SizedBox(height: 4),

                // Step labels
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  child: Row(
                    children: ['Welcome', 'Enable', 'Default', 'Done'].asMap().entries.map((e) {
                      final isActive = e.key == _currentPage;
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 3),
                          child: Text(
                            e.value,
                            style: TextStyle(
                              color: isActive ? _pageColor : Colors.white24,
                              fontSize: 9,
                              fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                              letterSpacing: 1,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),

                const SizedBox(height: 8),

                // Page content
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    physics: const BouncingScrollPhysics(),
                    onPageChanged: (i) {
                      setState(() => _currentPage = i);
                      HapticFeedback.selectionClick();
                    },
                    children: [
                      _buildWelcomePage(),
                      _buildStep1Page(),
                      _buildStep2Page(),
                      _buildDonePage(),
                    ],
                  ),
                ),

                // Bottom nav
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 0, 28, 32),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Skip / Back
                      if (_currentPage > 0 && _currentPage < 3)
                        GestureDetector(
                          onTap: () {
                            _pageController.previousPage(
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.easeOut,
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 14),
                            child: Text(
                              'Back',
                              style: TextStyle(
                                  color: Colors.white38,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500),
                            ),
                          ),
                        )
                      else if (_currentPage == 0)
                        GestureDetector(
                          onTap: _completeOnboarding,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 14),
                            child: const Text(
                              'Skip',
                              style: TextStyle(
                                  color: Colors.white38,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500),
                            ),
                          ),
                        )
                      else
                        const SizedBox(width: 80),

                      // Next / Get Started
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (_, __) {
                          final pulse = 1.0 + _pulseController.value * 0.04;
                          return Transform.scale(
                            scale: _currentPage == 3 ? pulse : 1.0,
                            child: GestureDetector(
                              onTap: _nextPage,
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 400),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 32, vertical: 16),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      _pageColor,
                                      _pageColor.withBlue(
                                          (_pageColor.blue + 60).clamp(0,255)),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(30),
                                  boxShadow: [
                                    BoxShadow(
                                      color: _pageColor.withOpacity(0.45),
                                      blurRadius: 20,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      _currentPage == 3
                                          ? '🚀  Let\'s Go!'
                                          : 'Continue',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    if (_currentPage < 3) ...[
                                      const SizedBox(width: 8),
                                      const Icon(Icons.arrow_forward_rounded,
                                          color: Colors.white, size: 18),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Animated Background ────────────────────────────────────────────────
  Widget _buildAnimatedBackground() {
    return AnimatedBuilder(
      animation: Listenable.merge([_orb1Controller, _orb2Controller]),
      builder: (_, __) {
        return Stack(
          children: [
            Positioned(
              top: -120 + _orb1Controller.value * 80,
              left: -80 + _orb1Controller.value * 40,
              child: _glow(360, _pageColor, 0.14),
            ),
            Positioned(
              bottom: -120 + _orb2Controller.value * 60,
              right: -80 + _orb2Controller.value * 30,
              child: _glow(280, const Color(0xFF6D28D9), 0.2),
            ),
            Positioned(
              top: 200 - _orb2Controller.value * 30,
              right: -40,
              child: _glow(180, _pageColor, 0.08),
            ),
          ],
        );
      },
    );
  }

  Widget _glow(double size, Color color, double opacity) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withOpacity(opacity),
      ),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
        child: const SizedBox(),
      ),
    );
  }

  // ─── Page 0: Welcome ────────────────────────────────────────────────────
  Widget _buildWelcomePage() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Logo / animated icon
          AnimatedBuilder(
            animation: _pulseController,
            builder: (_, __) {
              final glow = 30 + _pulseController.value * 15;
              return Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF10B981).withOpacity(0.3),
                      const Color(0xFF10B981).withOpacity(0.05),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withOpacity(0.4),
                      blurRadius: glow,
                      spreadRadius: glow / 5,
                    ),
                  ],
                  border: Border.all(
                      color: const Color(0xFF10B981).withOpacity(0.4),
                      width: 1.5),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('⌨️', style: TextStyle(fontSize: 48)),
                    const SizedBox(height: 4),
                    Text(
                      'AkAI',
                      style: TextStyle(
                        color: const Color(0xFF10B981),
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),

          const SizedBox(height: 40),

          Text(
            'Welcome to AkAI Keyboard',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
              height: 1.2,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 16),

          Text(
            'Smart. Bilingual. Beautiful.\nThe keyboard built for Ethiopia and the world.',
            style: TextStyle(
              color: Colors.white.withOpacity(0.55),
              fontSize: 15,
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 36),

          // Feature chips
          Wrap(
            spacing: 10,
            runSpacing: 10,
            alignment: WrapAlignment.center,
            children: [
              _chip('🇪🇹', 'Amharic'),
              _chip('🌈', '20+ Themes'),
              _chip('🤖', 'AI Translate'),
              _chip('😀', 'Stickers'),
              _chip('⌨️', 'Swipe & Type'),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Page 1: Enable Keyboard ────────────────────────────────────────────
  Widget _buildStep1Page() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 8),
          _stepBadge('Step 1 of 2', const Color(0xFF3B82F6)),
          const SizedBox(height: 20),

          Text(
            'Enable AkAI Keyboard',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Allow AkAI to appear in your keyboard list',
            style: TextStyle(
                color: Colors.white.withOpacity(0.5), fontSize: 14),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 28),

          // Visual step cards
          _visualStepCard(
            step: 1,
            icon: Icons.settings_rounded,
            color: const Color(0xFF3B82F6),
            title: 'Open Phone Settings',
            subtitle: 'Go to your device\'s main Settings app',
          ),
          _visualStepCard(
            step: 2,
            icon: Icons.language_rounded,
            color: const Color(0xFF06B6D4),
            title: 'Languages & Input',
            subtitle: 'Tap "General Management" → "Keyboard list & default"',
          ),
          _visualStepCard(
            step: 3,
            icon: Icons.keyboard_rounded,
            color: const Color(0xFF10B981),
            title: 'Toggle AkAI ON',
            subtitle: 'Find "AkAI Keyboard" and enable the switch',
            isLast: true,
          ),

          const SizedBox(height: 24),

          // Action button
          SizedBox(
            width: double.infinity,
            child: GestureDetector(
              onTap: () {
                _openImeSettings();
                setState(() => _step1Done = true);
                HapticFeedback.mediumImpact();
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 400),
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  gradient: _step1Done
                      ? LinearGradient(colors: [
                          const Color(0xFF10B981),
                          const Color(0xFF059669),
                        ])
                      : LinearGradient(colors: [
                          const Color(0xFF3B82F6).withOpacity(0.15),
                          const Color(0xFF1D4ED8).withOpacity(0.1),
                        ]),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _step1Done
                        ? const Color(0xFF10B981)
                        : const Color(0xFF3B82F6).withOpacity(0.5),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _step1Done
                          ? Icons.check_circle_rounded
                          : Icons.open_in_new_rounded,
                      color: _step1Done ? Colors.white : const Color(0xFF3B82F6),
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      _step1Done ? '✓ Settings Opened' : 'Open Keyboard Settings',
                      style: TextStyle(
                        color: _step1Done ? Colors.white : const Color(0xFF3B82F6),
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Page 2: Set as Default ─────────────────────────────────────────────
  Widget _buildStep2Page() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 8),
          _stepBadge('Step 2 of 2', const Color(0xFF8B5CF6)),
          const SizedBox(height: 20),

          Text(
            'Set AkAI as Default',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Make AkAI your primary keyboard',
            style: TextStyle(
                color: Colors.white.withOpacity(0.5), fontSize: 14),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 28),

          // Visual mock keyboard-picker UI
          _buildKeyboardPickerMock(),

          const SizedBox(height: 24),

          _visualStepCard(
            step: 1,
            icon: Icons.touch_app_rounded,
            color: const Color(0xFF8B5CF6),
            title: 'Tap the Globe icon',
            subtitle: 'While typing, long-press or tap the 🌐 globe key',
          ),
          _visualStepCard(
            step: 2,
            icon: Icons.keyboard_rounded,
            color: const Color(0xFFEC4899),
            title: 'Select AkAI Keyboard',
            subtitle: 'Choose "AkAI Keyboard" from the picker that appears',
            isLast: true,
          ),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: GestureDetector(
              onTap: () {
                _openInputSelection();
                setState(() => _step2Done = true);
                HapticFeedback.mediumImpact();
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 400),
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  gradient: _step2Done
                      ? LinearGradient(colors: [
                          const Color(0xFF10B981),
                          const Color(0xFF059669),
                        ])
                      : LinearGradient(colors: [
                          const Color(0xFF8B5CF6).withOpacity(0.15),
                          const Color(0xFF7C3AED).withOpacity(0.1),
                        ]),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _step2Done
                        ? const Color(0xFF10B981)
                        : const Color(0xFF8B5CF6).withOpacity(0.5),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _step2Done
                          ? Icons.check_circle_rounded
                          : Icons.swap_vert_rounded,
                      color: _step2Done ? Colors.white : const Color(0xFF8B5CF6),
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      _step2Done ? '✓ Switcher Opened' : 'Show Keyboard Switcher',
                      style: TextStyle(
                        color: _step2Done ? Colors.white : const Color(0xFF8B5CF6),
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Page 3: All Done ───────────────────────────────────────────────────
  Widget _buildDonePage() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Animated checkmark + sparkles
          AnimatedBuilder(
            animation: _pulseController,
            builder: (_, __) {
              final glow = 30.0 + _pulseController.value * 20;
              return Stack(
                alignment: Alignment.center,
                children: [
                  // Outer glow ring
                  Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFEC4899).withOpacity(0.3),
                          blurRadius: glow,
                          spreadRadius: 5,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 150,
                    height: 150,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          const Color(0xFFEC4899).withOpacity(0.2),
                          const Color(0xFFEC4899).withOpacity(0.03),
                        ],
                      ),
                      border: Border.all(
                          color: const Color(0xFFEC4899).withOpacity(0.4),
                          width: 1.5),
                    ),
                    child: const Center(
                      child: Text('🎉', style: TextStyle(fontSize: 64)),
                    ),
                  ),
                  // Orbiting sparkle dots
                  ...List.generate(6, (i) {
                    final angle = (i / 6) * 2 * math.pi +
                        _pulseController.value * math.pi;
                    final dx = math.cos(angle) * 90;
                    final dy = math.sin(angle) * 90;
                    return Transform.translate(
                      offset: Offset(dx, dy),
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: [
                            const Color(0xFFEC4899),
                            const Color(0xFF10B981),
                            const Color(0xFF3B82F6),
                            const Color(0xFFF59E0B),
                            const Color(0xFF8B5CF6),
                            const Color(0xFF06B6D4),
                          ][i],
                        ),
                      ),
                    );
                  }),
                ],
              );
            },
          ),

          const SizedBox(height: 48),

          const Text(
            'You\'re All Set! 🇪🇹',
            style: TextStyle(
              color: Colors.white,
              fontSize: 30,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 16),

          Text(
            'AkAI is ready. Explore live themes, AI translation, Amharic typing and much more.',
            style: TextStyle(
              color: Colors.white.withOpacity(0.55),
              fontSize: 15,
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 36),

          // Feature previews
          _featureRow(Icons.palette_rounded, 'Themes',
              '20+ live animated themes', const Color(0xFFEC4899)),
          const SizedBox(height: 12),
          _featureRow(Icons.translate_rounded, 'AI Translate',
              'Real-time English ↔ Amharic', const Color(0xFF10B981)),
          const SizedBox(height: 12),
          _featureRow(Icons.keyboard_rounded, 'Bilingual',
              'Tap space to switch languages', const Color(0xFF3B82F6)),
        ],
      ),
    );
  }

  // ─── Helper Widgets ─────────────────────────────────────────────────────

  Widget _chip(String emoji, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border:
            Border.all(color: Colors.white.withOpacity(0.1), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.75),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _visualStepCard({
    required int step,
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Step column
        Column(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [color, color.withOpacity(0.6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: color.withOpacity(0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 32,
                margin: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [color.withOpacity(0.5), Colors.transparent],
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
          ],
        ),
        const SizedBox(width: 16),
        // Text
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(top: 10, bottom: isLast ? 0 : 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildKeyboardPickerMock() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.04),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
                color: Colors.white.withOpacity(0.08), width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Choose Keyboard',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.4),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 12),
              _keyboardRow('Gboard', Icons.keyboard_rounded,
                  Colors.white24, false),
              const Divider(color: Colors.white10, height: 1),
              _keyboardRow('Samsung Keyboard', Icons.keyboard_rounded,
                  Colors.white24, false),
              const Divider(color: Colors.white10, height: 1),
              _keyboardRow(
                  'AkAI Keyboard ✦', Icons.auto_awesome_rounded,
                  const Color(0xFF8B5CF6), true),
            ],
          ),
        ),
      ),
    );
  }

  Widget _keyboardRow(
      String name, IconData icon, Color color, bool selected) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
      decoration: BoxDecoration(
        color: selected
            ? const Color(0xFF8B5CF6).withOpacity(0.1)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              name,
              style: TextStyle(
                color: selected ? Colors.white : Colors.white54,
                fontWeight:
                    selected ? FontWeight.w700 : FontWeight.w400,
                fontSize: 14,
              ),
            ),
          ),
          if (selected)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Selected',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _featureRow(
      IconData icon, String title, String subtitle, Color color) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.04),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: color.withOpacity(0.2), width: 1),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14)),
                  Text(subtitle,
                      style: TextStyle(
                          color: Colors.white.withOpacity(0.45),
                          fontSize: 12)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
