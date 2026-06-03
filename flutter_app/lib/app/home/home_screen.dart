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
    final features = [
      (Icons.palette_rounded, 'Themes', '7 beautiful palettes'),
      (Icons.vibration_rounded, 'Haptics', 'Feel every key'),
      (Icons.swipe_rounded, 'Swipe', 'Glide through words'),
      (Icons.auto_awesome_rounded, 'Akai AI', 'Coming soon'),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 2.0,
      children: features.map((f) {
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: palette.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: palette.surfaceVariant),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: palette.accent.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(f.$1, color: palette.accent, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(f.$2,
                        style: TextStyle(
                            color: palette.keyText,
                            fontSize: 15,
                            fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(f.$3,
                        style: TextStyle(
                            color: palette.keySecondaryText, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
