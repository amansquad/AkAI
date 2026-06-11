import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import '../settings/settings_screen.dart';
import '../theme/app_theme.dart';
import '../keyboard/keyboard_controller.dart';
import '../keyboard/keyboard_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final AkaiKeyboardService _service;
  late final AkaiKeyboardController _controller;
  final TextEditingController _demo = TextEditingController();
  final FocusNode _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _service = AkaiKeyboardService();
    _controller = AkaiKeyboardController(_service);
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  @override
  void dispose() {
    _controller.dispose();
    _demo.dispose();
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<AkaiSettingsProvider>();
    final palette = settings.palette;
    return Scaffold(
      backgroundColor: palette.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _Header(
                palette: palette,
                onSettings: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const SettingsScreen()),
                  );
                }),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _DemoCard(
                        palette: palette, controller: _demo, focus: _focus),
                    const SizedBox(height: 24),
                    _FeatureGrid(palette: palette),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final AkaiPalette palette;
  final VoidCallback onSettings;
  const _Header({required this.palette, required this.onSettings});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [palette.glow, palette.accent],
              ),
            ),
            child: const Center(
              child: Text('A',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800)),
            ),
          ),
          const SizedBox(width: 12),
          Text('Akai',
              style: TextStyle(
                  color: palette.keyText,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5)),
          const Spacer(),
          IconButton(
            icon: Icon(Icons.tune_rounded, color: palette.keyText),
            onPressed: onSettings,
          ),
        ],
      ),
    );
  }
}

class _DemoCard extends StatelessWidget {
  final AkaiPalette palette;
  final TextEditingController controller;
  final FocusNode focus;
  const _DemoCard(
      {required this.palette, required this.controller, required this.focus});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: palette.surfaceVariant, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Try Akai',
              style: TextStyle(
                  color: palette.keyText,
                  fontSize: 18,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Tap below and use Akai as your keyboard.',
              style: TextStyle(color: palette.keySecondaryText, fontSize: 13)),
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            focusNode: focus,
            minLines: 3,
            maxLines: 6,
            style: TextStyle(color: palette.keyText, fontSize: 15, height: 1.5),
            cursorColor: palette.accent,
            decoration: InputDecoration(
              hintText: 'Type something beautiful\u2026',
              hintStyle:
                  TextStyle(color: palette.keySecondaryText.withOpacity(0.6)),
              filled: true,
              fillColor: palette.surfaceVariant,
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureGrid extends StatelessWidget {
  final AkaiPalette palette;
  const _FeatureGrid({required this.palette});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Features',
            style: TextStyle(
                color: palette.keyText,
                fontSize: 18,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.5)),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.0,
          children: [
            _FeatureCard(
              palette: palette,
              emoji: '🎨',
              title: 'Live Themes',
              description: '30+ stunning themes to choose from',
              color: palette.accent,
            ),
            _FeatureCard(
              palette: palette,
              emoji: '😊',
              title: 'Emojis',
              description: 'Rich emoji picker & search',
              color: const Color(0xFFFFD93D),
            ),
            _FeatureCard(
              palette: palette,
              emoji: '🎬',
              title: 'GIFs',
              description: 'Animated GIF integration',
              color: const Color(0xFF6BCB77),
            ),
            _FeatureCard(
              palette: palette,
              emoji: '✨',
              title: 'Stickers',
              description: 'Fun sticker categories',
              color: const Color(0xFF4D96FF),
            ),
            _FeatureCard(
              palette: palette,
              emoji: '🤖',
              title: 'AI Tools',
              description: 'English-Amharic translation',
              color: const Color(0xFFFF6B6B),
            ),
            _FeatureCard(
              palette: palette,
              emoji: '⚙️',
              title: 'Customization',
              description: 'Adjust size, haptics, sounds',
              color: const Color(0xFFA78BFA),
            ),
          ],
        ),
        const SizedBox(height: 28),
        _KeyboardFeatures(palette: palette),
      ],
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final AkaiPalette palette;
  final String emoji;
  final String title;
  final String description;
  final Color color;

  const _FeatureCard({
    required this.palette,
    required this.emoji,
    required this.title,
    required this.description,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: palette.surfaceVariant),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 28)),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: palette.keyText,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  color: palette.keySecondaryText,
                  fontSize: 11,
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _KeyboardFeatures extends StatelessWidget {
  final AkaiPalette palette;
  const _KeyboardFeatures({required this.palette});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: palette.surfaceVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Samsung Keyboard',
            style: TextStyle(
              color: palette.keyText,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          _FeatureRow(
            palette: palette,
            icon: Icons.dialpad_rounded,
            title: 'Number Row',
            description: 'Always visible for quick digit access',
          ),
          const SizedBox(height: 10),
          _FeatureRow(
            palette: palette,
            icon: Icons.touch_app_rounded,
            title: 'Long-Press',
            description: 'Hold keys for alternate characters',
          ),
          const SizedBox(height: 10),
          _FeatureRow(
            palette: palette,
            icon: Icons.swipe_rounded,
            title: 'Smooth Transitions',
            description: 'Fluid mode switching with animations',
          ),
          const SizedBox(height: 10),
          _FeatureRow(
            palette: palette,
            icon: Icons.height_rounded,
            title: 'Adjustable Size',
            description: 'Customize keyboard height (40-70pt)',
          ),
        ],
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  final AkaiPalette palette;
  final IconData icon;
  final String title;
  final String description;

  const _FeatureRow({
    required this.palette,
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: palette.accent.withOpacity(0.15),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: palette.accent, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: palette.keyText,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: TextStyle(
                  color: palette.keySecondaryText,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
