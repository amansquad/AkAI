import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';
import '../theme/theme_marketplace.dart';
import '../theme/theme_download_service.dart';
import 'settings_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<AkaiSettingsProvider>();
    final palette = settings.palette;
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Settings',
            style: TextStyle(
                color: palette.keyText,
                fontWeight: FontWeight.w800,
                fontSize: 24)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: palette.keyText),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          _SectionLabel(palette: palette, label: 'Theme'),
          const SizedBox(height: 12),
          _ThemeGallery(
              palette: palette, current: palette, onPick: settings.setPalette),
          const SizedBox(height: 12),
          // Theme Marketplace Button
          _MarketplaceButton(palette: palette),
          const SizedBox(height: 28),
          _SectionLabel(palette: palette, label: 'Keyboard'),
          const SizedBox(height: 12),
          _SettingTile(
            palette: palette,
            icon: Icons.vibration_rounded,
            title: 'Haptic feedback',
            subtitle: 'Feel every tap',
            value: settings.hapticEnabled,
            onChanged: settings.setHaptic,
          ),
          _SettingTile(
            palette: palette,
            icon: Icons.volume_up_rounded,
            title: 'Key sounds',
            subtitle: 'Subtle click on tap',
            value: settings.soundEnabled,
            onChanged: settings.setSound,
          ),
          _SettingTile(
            palette: palette,
            icon: Icons.auto_awesome_rounded,
            title: 'Show suggestions',
            subtitle: 'Akai AI suggestions bar',
            value: settings.showSuggestions,
            onChanged: settings.setShowSuggestions,
          ),
          _SettingTile(
            palette: palette,
            icon: Icons.content_paste_rounded,
            title: 'Clipboard button',
            subtitle: 'Quick paste from the bar',
            value: settings.showClipboard,
            onChanged: settings.setShowClipboard,
          ),
          const SizedBox(height: 28),
          _SectionLabel(palette: palette, label: 'About'),
          const SizedBox(height: 12),
          _AboutCard(palette: palette),
        ],
      ),
    );
  }
}

class _MarketplaceButton extends StatelessWidget {
  final AkaiPalette palette;
  const _MarketplaceButton({required this.palette});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        final prefs = await SharedPreferences.getInstance();
        final downloadService = ThemeDownloadService(prefs);

        if (context.mounted) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ThemeMarketplace(
                downloadService: downloadService,
              ),
            ),
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [palette.accent, palette.glow],
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.store_rounded, color: Colors.white, size: 22),
            const SizedBox(width: 10),
            Text(
              'Theme Marketplace',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(width: 8),
            Icon(Icons.arrow_forward_ios_rounded,
                color: Colors.white, size: 16),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final AkaiPalette palette;
  final String label;
  const _SectionLabel({required this.palette, required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: TextStyle(
        color: palette.accent,
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.5,
      ),
    );
  }
}

class _ThemeGallery extends StatelessWidget {
  final AkaiPalette palette;
  final AkaiPalette current;
  final ValueChanged<AkaiPalette> onPick;
  const _ThemeGallery(
      {required this.palette, required this.current, required this.onPick});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.7,
      children: AkaiThemes.all.map((p) {
        final selected = p.name == current.name;
        return GestureDetector(
          onTap: () => onPick(p),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: p.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: selected ? p.accent : p.surfaceVariant,
                width: selected ? 2 : 1,
              ),
              boxShadow: selected
                  ? [
                      BoxShadow(
                          color: p.glow.withValues(alpha: 0.3),
                          blurRadius: 20,
                          spreadRadius: -2)
                    ]
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(p.emoji, style: const TextStyle(fontSize: 18)),
                    const Spacer(),
                    if (selected)
                      Icon(Icons.check_circle_rounded,
                          color: p.accent, size: 18),
                  ],
                ),
                const Spacer(),
                Text(p.name,
                    style: TextStyle(
                        color: p.keyText,
                        fontSize: 15,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _Dot(p.key),
                    _Dot(p.keySecondary),
                    _Dot(p.accent),
                    _Dot(p.glow),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _Dot extends StatelessWidget {
  final Color color;
  const _Dot(this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 4),
      width: 14,
      height: 14,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withValues(alpha: 0.08), width: 0.5),
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  final AkaiPalette palette;
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _SettingTile({
    required this.palette,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.surfaceVariant),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: palette.accent.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: palette.accent, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        color: palette.keyText,
                        fontSize: 15,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: TextStyle(
                        color: palette.keySecondaryText, fontSize: 12)),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
            activeTrackColor: palette.accent.withValues(alpha: 0.5),
            activeThumbColor: palette.accent,
          ),
        ],
      ),
    );
  }
}

class _AboutCard extends StatelessWidget {
  final AkaiPalette palette;
  const _AboutCard({required this.palette});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: palette.surfaceVariant),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
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
                      fontSize: 28,
                      fontWeight: FontWeight.w800)),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Akai Keyboard',
                    style: TextStyle(
                        color: palette.keyText,
                        fontSize: 16,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text('Version 1.0.0 \u2022 Made with care',
                    style: TextStyle(
                        color: palette.keySecondaryText, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
