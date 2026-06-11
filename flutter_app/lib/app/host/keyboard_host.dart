import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../keyboard/keyboard_controller.dart';
import '../keyboard/keyboard_service.dart';
import '../keyboard/keyboard_widget.dart';
import '../settings/settings_provider.dart';
import '../theme/app_theme.dart' show AkaiThemes;
import '../theme/live_theme_background.dart';

class AkaiKeyboardHost extends StatefulWidget {
  const AkaiKeyboardHost({super.key});

  @override
  State<AkaiKeyboardHost> createState() => _AkaiKeyboardHostState();
}

class _AkaiKeyboardHostState extends State<AkaiKeyboardHost> {
  late final AkaiKeyboardService _service;
  late final AkaiKeyboardController _controller;
  late final AkaiSettingsProvider _settings;
  bool _showThemePicker = false;

  @override
  void initState() {
    super.initState();
    _service = AkaiKeyboardService();
    _service.initialize();
    _controller = AkaiKeyboardController(_service);
    _settings = AkaiSettingsProvider()..load();
  }

  @override
  void dispose() {
    _controller.dispose();
    _settings.dispose();
    super.dispose();
  }

  void _toggleThemePicker() {
    setState(() => _showThemePicker = !_showThemePicker);
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AkaiSettingsProvider>.value(value: _settings),
        ChangeNotifierProvider<AkaiKeyboardController>.value(value: _controller),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Consumer<AkaiSettingsProvider>(
          builder: (context, settings, _) {
            final palette = settings.palette;
            return Material(
              color: Colors.transparent,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // ── Live theme background — NEVER absorbs touches ──────────
                  if (palette.liveTheme != null)
                    IgnorePointer(
                      child: Positioned.fill(
                        child: LiveThemeBackground(palette: palette),
                      ),
                    )
                  else
                    IgnorePointer(
                      child: Positioned.fill(
                        child: ColoredBox(color: palette.background),
                      ),
                    ),

                  // ── Keyboard column — always at bottom ─────────────────────
                  Align(
                    alignment: Alignment.bottomCenter,
                    child: SafeArea(
                      top: false,
                      child: AkaiKeyboard(
                        controller: _controller,
                        onThemeToggle: _toggleThemePicker,
                      ),
                    ),
                  ),

                  // ── Theme picker panel — slides up from bottom ─────────────
                  if (_showThemePicker)
                    Positioned.fill(
                      child: GestureDetector(
                        onTap: _toggleThemePicker, // dismiss on outside tap
                        child: Container(color: Colors.transparent),
                      ),
                    ),
                  if (_showThemePicker)
                    Align(
                      alignment: Alignment.bottomCenter,
                      child: _InlineThemePicker(
                        settings: settings,
                        onClose: _toggleThemePicker,
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline horizontal theme picker strip
// ─────────────────────────────────────────────────────────────────────────────

class _InlineThemePicker extends StatelessWidget {
  final AkaiSettingsProvider settings;
  final VoidCallback onClose;

  const _InlineThemePicker({required this.settings, required this.onClose});

  @override
  Widget build(BuildContext context) {
    final palette = settings.palette;
    final themes = AkaiThemes.all;

    return Container(
      height: 130,
      width: double.infinity,
      decoration: BoxDecoration(
        color: palette.surface.withOpacity(0.97),
        border: Border(top: BorderSide(color: palette.surfaceVariant)),
      ),
      child: Column(
        children: [
          // Drag handle / close
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: onClose,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Center(
                child: Container(
                  width: 36, height: 4,
                  decoration: BoxDecoration(
                    color: palette.keySecondaryText.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
          ),
          // Theme list
          Expanded(
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: themes.length,
              itemBuilder: (context, i) {
                final theme = themes[i];
                final isSelected = settings.palette == theme;
                return GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    settings.setPalette(theme);
                    onClose();
                  },
                  child: Container(
                    width: 66,
                    margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    child: Column(
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: theme.accent,
                            borderRadius: BorderRadius.circular(14),
                            border: isSelected
                                ? Border.all(color: Colors.white, width: 2.5)
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              theme.emoji,
                              style: const TextStyle(fontSize: 24),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          theme.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 10,
                            color: isSelected
                                ? palette.accent
                                : palette.keySecondaryText,
                            fontWeight: isSelected
                                ? FontWeight.w700
                                : FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
