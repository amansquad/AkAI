import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/settings_provider.dart';
import '../app/theme/app_theme.dart';

class KeyboardBottomNavigationBar extends StatelessWidget {
  const KeyboardBottomNavigationBar({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<KeyboardProvider>();
    final settings = context.watch<SettingsProvider>();
    final AkaiPalette theme = context.watch<ThemeProvider>().currentTheme;

    if (!settings.toolbarVisible) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 1),
      decoration: BoxDecoration(
        color: Colors.transparent,
        border: Border(
          bottom: BorderSide(
            color: theme.accent.withOpacity(0.1),
            width: 0.5,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildLanguageItem(context, provider, theme),
          if (settings.showStickersButton)
            _buildNavItem(
              context,
              Icons.emoji_emotions_outlined,
              KeyboardMode.stickers,
              provider,
              theme,
            ),
          if (settings.showGifButton)
            _buildNavItem(
              context,
              Icons.gif_box_outlined,
              KeyboardMode.gifs,
              provider,
              theme,
            ),
          _buildNavItem(
            context,
            Icons.content_paste_rounded,
            KeyboardMode.clipboard,
            provider,
            theme,
          ),
          _buildNavItem(
            context,
            Icons.translate_rounded,
            KeyboardMode.translate,
            provider,
            theme,
          ),
          _buildNavItem(
            context,
            Icons.gesture_rounded,
            KeyboardMode.handwriting,
            provider,
            theme,
          ),
          _buildNavItem(
            context,
            Icons.settings_outlined,
            KeyboardMode.settings,
            provider,
            theme,
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageItem(BuildContext context, KeyboardProvider provider, AkaiPalette theme) {
    final language = provider.language;
    return GestureDetector(
      onTap: () {
        provider.toggleLanguage();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: theme.surface.withOpacity(0.3),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.language,
              size: 20,
              color: theme.accent.withOpacity(0.8),
            ),
            const SizedBox(height: 1),
            Text(
              language == KeyboardLanguage.english ? 'EN' : 'አማ',
              style: TextStyle(
                fontSize: 8,
                color: theme.accent,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context,
    IconData icon,
    KeyboardMode mode,
    KeyboardProvider provider,
    AkaiPalette theme,
  ) {
    bool isActive = provider.mode == mode;

    return GestureDetector(
      onTap: () {
        if (isActive) {
          provider.setMode(KeyboardMode.keyboard);
        } else {
          provider.setMode(mode);
        }
      },
  child: AnimatedContainer(
    duration: const Duration(milliseconds: 300),
    curve: Curves.easeOutBack,
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
    decoration: BoxDecoration(
      color: isActive 
          ? (theme.name == 'Matrix' ? theme.accent : theme.accent.withOpacity(0.2)) 
          : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isActive ? [
            BoxShadow(
              color: theme.accent.withOpacity(0.2),
              blurRadius: 8,
              spreadRadius: -2,
            )
          ] : null,
        ),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: Icon(
            icon,
            key: ValueKey('${icon.toString()}_$isActive'),
            color: isActive 
                ? (theme.name == 'Matrix' ? Colors.black : theme.accent) 
                : theme.keySecondaryText.withOpacity(0.7),
            size: isActive ? 22 : 20,
          ),
        ),
      ),
    );
  }
}
