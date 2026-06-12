import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/keyboard_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/settings_provider.dart';
import '../../widgets/samsung_keyboard_layout.dart';
import '../../widgets/bottom_navigation_bar.dart';
import '../../widgets/suggestion_bar.dart';
import '../../app/theme/live_theme_background.dart';
import '../../widgets/emoji_panel.dart';
import '../../widgets/gif_panel.dart';
import '../../widgets/clipboard_panel.dart';
import '../../widgets/translate_panel.dart';
import '../../widgets/settings_panel.dart';
import '../../widgets/handwriting_panel.dart';

class AkaiKeyboardHost extends StatelessWidget {
  const AkaiKeyboardHost({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => KeyboardProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          final theme = themeProvider.currentTheme;
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: themeProvider.currentThemeData,
            home: Material(
              color: Colors.transparent,
              child: Stack(
                children: [
                  // Live theme background layer
                  if (theme.liveTheme != null)
                    Positioned.fill(
                      child: LiveThemeBackground(palette: theme),
                    )
                  else
                    Positioned.fill(
                      child: Container(color: theme.background),
                    ),
                  
                  // Keyboard content
                  Align(
                    alignment: Alignment.bottomCenter,
                    child: Consumer<SettingsProvider>(
                      builder: (context, settings, _) {
                        return Container(
                          color: theme.background.withOpacity(settings.backgroundOpacity),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const SizedBox(height: 42, child: SuggestionBar()),
                              const KeyboardBottomNavigationBar(),
                              Consumer<KeyboardProvider>(
                                builder: (context, provider, _) {
                                  switch (provider.mode) {
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
                                },
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
