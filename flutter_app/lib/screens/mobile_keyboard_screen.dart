import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/text_display_area.dart';
import '../widgets/suggestion_bar.dart';
import '../widgets/samsung_keyboard_layout.dart';
import '../widgets/bottom_navigation_bar.dart';
import '../widgets/emoji_panel.dart';
import '../widgets/gif_panel.dart';
import '../widgets/clipboard_panel.dart';
import '../widgets/translate_panel.dart';
import '../widgets/theme_selector.dart';
import '../widgets/settings_panel.dart';
import '../widgets/handwriting_panel.dart';
import '../app/theme/live_theme_background.dart';

class MobileKeyboardScreen extends StatelessWidget {
  const MobileKeyboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Text display area (no live background)
        const Expanded(
          child: TextDisplayArea(),
        ),

        // Keyboard area with live theme background
        Consumer<ThemeProvider>(
          builder: (context, themeProvider, _) {
            final theme = themeProvider.currentTheme;
            return Container(
              child: Stack(
                children: [
                  // Live theme background layer
                  if (theme.liveTheme != null)
                    Positioned.fill(
                      child: LiveThemeBackground(
                        key: ValueKey('live_test_${theme.liveTheme}'),
                        palette: theme,
                      ),
                    )
                  else
                    // Solid background for non-live themes
                    Positioned.fill(
                      child: Container(
                        key: const ValueKey('solid_test_bg'),
                        color: theme.background,
                      ),
                    ),

                  // Keyboard content - semi-transparent overlay
                  Consumer<SettingsProvider>(
                    builder: (context, settings, _) {
                      return Container(
                        color: theme.background
                            .withOpacity(settings.backgroundOpacity),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const SizedBox(height: 42, child: SuggestionBar()),
                            const KeyboardBottomNavigationBar(),

                            // Main content area (keyboard or panels)
                            _buildContentArea(context),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildContentArea(BuildContext context) {
    final provider = context.watch<KeyboardProvider>();
    final mode = provider.mode;
    final isSearching = provider.isSearching;

    if (isSearching) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Search results area
          Container(
            height: 180, // Height for search results
            child: _getContentForMode(provider.searchSourceMode),
          ),
          // Divider or subtle gap
          Container(
              height: 1,
              color: context
                  .watch<ThemeProvider>()
                  .currentTheme
                  .surfaceVariant
                  .withOpacity(0.5)),
          // Keyboard for typing
          const SamsungKeyboardLayout(key: ValueKey('keyboard_search')),
        ],
      );
    }

    // Keyboard sizes itself; only the tool panels need a fixed height.
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: mode == KeyboardMode.keyboard
          ? const SamsungKeyboardLayout(key: ValueKey('keyboard'))
          : SizedBox(
              key: ValueKey('panel_wrapper_$mode'),
              height: 340,
              child: _getContentForMode(mode),
            ),
    );
  }

  Widget _getContentForMode(KeyboardMode mode) {
    switch (mode) {
      case KeyboardMode.keyboard:
        return const SamsungKeyboardLayout(key: ValueKey('keyboard'));
      case KeyboardMode.stickers:
        return const EmojiPanel(key: ValueKey('stickers'));
      case KeyboardMode.gifs:
        return const GifPanel(key: ValueKey('gifs'));
      case KeyboardMode.clipboard:
        return const ClipboardPanel(key: ValueKey('clipboard'));
      case KeyboardMode.translate:
        return const TranslatePanel(key: ValueKey('translate'));
      case KeyboardMode.settings:
        return const SettingsPanel(key: ValueKey('settings'));
      case KeyboardMode.handwriting:
        return const HandwritingPanel(key: ValueKey('handwriting'));
    }
  }
}
