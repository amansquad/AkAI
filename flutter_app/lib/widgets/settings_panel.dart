import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../app/theme/app_theme.dart';

class SettingsPanel extends StatelessWidget {
  const SettingsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final AkaiPalette theme = context.watch<ThemeProvider>().currentTheme;

    return Container(
      color: theme.background,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: theme.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.12),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: theme.accent.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.settings_outlined, color: theme.accent, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Settings & Style',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                        color: theme.keyText,
                      ),
                    ),
                  ],
                ),
                Text(
                  'v${settings.appVersion}',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: theme.accent.withOpacity(0.5),
                  ),
                ),
              ],
            ),
          ),

          // Settings list
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              physics: const BouncingScrollPhysics(),
              children: [
                // Group 1: Visibility Controls (New)
                _buildSectionHeader('Key Visibility', theme),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: theme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: theme.surfaceVariant.withOpacity(0.5)),
                  ),
                  child: Column(
                    children: [
                      _buildSwitchTile(context, 'Shift Key', 'Show/hide the shift button', Icons.upgrade_rounded, const Color(0xFF3B82F6), settings.showShiftKey, (v) => settings.setShowShiftKey(v), theme, isFirst: true, isLast: false),
                      _buildDivider(theme),
                      _buildSwitchTile(context, 'Symbols Key', 'Show/hide the ?123 button', Icons.numbers_rounded, const Color(0xFFF59E0B), settings.showSymbolsKey, (v) => settings.setShowSymbolsKey(v), theme, isFirst: false, isLast: false),
                      _buildDivider(theme),
                      _buildSwitchTile(context, 'Enter Key', 'Show/hide the return button', Icons.keyboard_return_rounded, const Color(0xFF10B981), settings.showEnterKey, (v) => settings.setShowEnterKey(v), theme, isFirst: false, isLast: false),
                      _buildDivider(theme),
                      _buildSwitchTile(context, 'Comma Key', 'Show/hide the comma button', Icons.format_quote_rounded, const Color(0xFFEC4899), settings.showCommaKey, (v) => settings.setShowCommaKey(v), theme, isFirst: false, isLast: false),
                      _buildDivider(theme),
                      _buildSwitchTile(context, 'Period Key', 'Show/hide the period button', Icons.fiber_manual_record_rounded, const Color(0xFF8B5CF6), settings.showPeriodKey, (v) => settings.setShowPeriodKey(v), theme, isFirst: false, isLast: false),
                      _buildDivider(theme),
                      _buildSwitchTile(context, 'Backspace', 'Show/hide the delete key', Icons.backspace_rounded, const Color(0xFFF43F5E), settings.showBackspaceKey, (v) => settings.setShowBackspaceKey(v), theme, isFirst: false, isLast: false),
                      _buildDivider(theme),
                      _buildSwitchTile(context, 'Language Toggle', 'Show language switcher on bottom row', Icons.translate_rounded, const Color(0xFF14B8A6), settings.showLanguageKey, (v) => settings.setShowLanguageKey(v), theme, isFirst: false, isLast: true),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Group 2: Advanced Customization
                _buildSectionHeader('Toolbar & Glass', theme),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: theme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: theme.surfaceVariant.withOpacity(0.5)),
                  ),
                  child: Column(
                    children: [
                      _buildSwitchTile(context, 'GIF Search', 'Toggle GIF button in toolbar', Icons.gif_box, const Color(0xFF14B8A6), settings.showGifButton, (v) => settings.setShowGifButton(v), theme, isFirst: true, isLast: false),
                      _buildDivider(theme),
                      _buildSwitchTile(context, 'Sticker Panel', 'Toggle Emoji button in toolbar', Icons.emoji_emotions_rounded, const Color(0xFFF59E0B), settings.showStickersButton, (v) => settings.setShowStickersButton(v), theme, isFirst: false, isLast: false),
                      _buildDivider(theme),
                      _buildSwitchTile(context, 'Main Toolbar', 'Hide entire top navigation bar', Icons.view_headline_rounded, const Color(0xFF8B5CF6), settings.toolbarVisible, (v) => settings.setToolbarVisible(v), theme, isFirst: false, isLast: true),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Sliders
                _buildSectionHeader('Fine Tuning', theme),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: theme.surfaceVariant.withOpacity(0.5)),
                  ),
                  child: Column(
                    children: [
                      _buildHeightSelector(settings, theme),
                      const SizedBox(height: 16),
                      _buildSliderTile('Glass Opacity', settings.backgroundOpacity, 0.05, 0.6, (v) => settings.setBackgroundOpacity(v), theme, Icons.blur_on_rounded),
                      const SizedBox(height: 16),
                      _buildSliderTile('Vibe Intensity', settings.vibrationIntensity, 0.1, 1.0, (v) => settings.setVibrationIntensity(v), theme, Icons.vibration_rounded),
                    ],
                  ),
                ),
                
                const SizedBox(height: 40),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeightSelector(SettingsProvider settings, AkaiPalette theme) {
    const options = [
      ('Compact', 0.85),
      ('Normal', 1.0),
      ('Tall', 1.15),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.height_rounded, size: 14, color: theme.accent.withOpacity(0.6)),
            const SizedBox(width: 8),
            Text('Keyboard Height',
                style: TextStyle(color: theme.keyText, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: options.map((opt) {
            final selected = (settings.keyboardHeight - opt.$2).abs() < 0.01;
            return Expanded(
              child: GestureDetector(
                onTap: () => settings.setKeyboardHeight(opt.$2),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: selected ? theme.accent.withOpacity(0.2) : theme.surfaceVariant.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: selected ? theme.accent : Colors.transparent,
                      width: 1.4,
                    ),
                  ),
                  child: Text(
                    opt.$1,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: selected ? theme.accent : theme.keySecondaryText,
                      fontSize: 12,
                      fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSliderTile(String label, double value, double min, double max, Function(double) onChanged, AkaiPalette theme, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(icon, size: 14, color: theme.accent.withOpacity(0.6)),
                const SizedBox(width: 8),
                Text(label, style: TextStyle(color: theme.keyText, fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
            Text('${(value * 100).toInt()}%', style: TextStyle(color: theme.accent, fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
        SliderTheme(
          data: SliderThemeData(
            trackHeight: 2,
            activeTrackColor: theme.accent,
            inactiveTrackColor: theme.surfaceVariant,
            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
          ),
          child: Slider(value: value, min: min, max: max, onChanged: onChanged),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title, AkaiPalette theme) {
    return Padding(
      padding: const EdgeInsets.only(left: 12, bottom: 4),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          color: theme.accent.withOpacity(0.8),
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 2.0,
        ),
      ),
    );
  }
  
  Widget _buildDivider(AkaiPalette theme) {
    return Divider(height: 1, thickness: 1, indent: 52, color: theme.surfaceVariant.withOpacity(0.3));
  }

  Widget _buildSwitchTile(BuildContext context, String title, String subtitle, IconData icon, Color iconColor, bool value, Function(bool) onChanged, AkaiPalette theme, {required bool isFirst, required bool isLast}) {
    return InkWell(
      onTap: () => onChanged(!value),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: iconColor.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(color: theme.keyText, fontSize: 14, fontWeight: FontWeight.w600)),
                  Text(subtitle, style: TextStyle(color: theme.keySecondaryText, fontSize: 11)),
                ],
              ),
            ),
            Switch.adaptive(value: value, onChanged: onChanged, activeTrackColor: theme.accent),
          ],
        ),
      ),
    );
  }
}
