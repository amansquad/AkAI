import 'package:flutter/material.dart';
import 'app_theme.dart';

/// A reusable widget that provides a live preview of a keyboard theme
class ThemePreviewWidget extends StatelessWidget {
  final AkaiPalette palette;
  final bool isSelected;
  final VoidCallback onSelect;
  final bool showDetails;

  const ThemePreviewWidget({
    super.key,
    required this.palette,
    this.isSelected = false,
    required this.onSelect,
    this.showDetails = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onSelect,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: LinearGradient(
            colors: [
              palette.surface.withOpacity(0.95),
              palette.background.withOpacity(0.95),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: isSelected ? palette.accent : palette.surfaceVariant.withOpacity(0.5),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: palette.accent.withOpacity(0.4),
                    blurRadius: 12,
                    spreadRadius: 1,
                  ),
                ]
              : null,
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Header with emoji and selection indicator
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  palette.emoji,
                  style: const TextStyle(fontSize: 24),
                ),
                if (isSelected)
                  Icon(
                    Icons.check_circle,
                    color: palette.accent,
                    size: 22,
                  ),
              ],
            ),
            // Content section
            if (showDetails)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      palette.name,
                      style: TextStyle(
                        color: palette.keyText,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 6),
                    // Color indicator dots
                    Row(
                      children: [
                        _ColorDot(palette.key),
                        _ColorDot(palette.keySecondary),
                        _ColorDot(palette.accent),
                        _ColorDot(palette.glow),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // Live theme badge
                    if (palette.liveTheme != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: palette.accent.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '✨ Live',
                          style: TextStyle(
                            color: palette.accent,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ColorDot extends StatelessWidget {
  final Color color;
  const _ColorDot(this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 0.5,
        ),
      ),
    );
  }
}

/// A full-screen theme preview with keyboard sample
class FullThemePreview extends StatelessWidget {
  final AkaiPalette palette;
  final VoidCallback? onApply;

  const FullThemePreview({
    super.key,
    required this.palette,
    this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: palette.background,
      child: SingleChildScrollView(
        child: Column(
          children: [
            // Preview area
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${palette.emoji} ${palette.name}',
                    style: TextStyle(
                      color: palette.keyText,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _KeyboardSample(palette: palette),
                  const SizedBox(height: 24),
                  // Color palette display
                  Text(
                    'Color Palette',
                    style: TextStyle(
                      color: palette.keyText,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 4,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                    childAspectRatio: 1,
                    children: [
                      _PaletteColor('Background', palette.background),
                      _PaletteColor('Surface', palette.surface),
                      _PaletteColor('Key', palette.key),
                      _PaletteColor('Accent', palette.accent),
                      _PaletteColor('Key Pressed', palette.keyPressed),
                      _PaletteColor('Secondary', palette.keySecondary),
                      _PaletteColor('Glow', palette.glow),
                      _PaletteColor('Text', palette.keyText),
                    ],
                  ),
                ],
              ),
            ),
            // Action button
            if (onApply != null)
              Padding(
                padding: const EdgeInsets.all(24),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: palette.accent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: onApply,
                    child: const Text(
                      'Apply Theme',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _KeyboardSample extends StatelessWidget {
  final AkaiPalette palette;
  const _KeyboardSample({required this.palette});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.surfaceVariant),
      ),
      child: Column(
        children: [
          // Sample key row
          SizedBox(
            height: 48,
            child: Row(
              children: [
                for (final char in 'QWERTY'.split(''))
                  Expanded(
                    child: Container(
                      margin: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: palette.key,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: palette.surfaceVariant.withOpacity(0.2),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          char,
                          style: TextStyle(
                            color: palette.keyText,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          // Space bar row
          SizedBox(
            height: 48,
            child: Row(
              children: [
                // Symbols button
                Expanded(
                  flex: 1,
                  child: Container(
                    margin: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: palette.keySecondary,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: palette.surfaceVariant.withOpacity(0.2),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '?123',
                        style: TextStyle(
                          color: palette.keySecondaryText,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
                // Space
                Expanded(
                  flex: 5,
                  child: Container(
                    margin: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: palette.key,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: palette.surfaceVariant.withOpacity(0.2),
                      ),
                    ),
                  ),
                ),
                // Return
                Expanded(
                  flex: 2,
                  child: Container(
                    margin: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: palette.keyAccent,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: palette.surfaceVariant.withOpacity(0.2),
                      ),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.keyboard_return_outlined,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PaletteColor extends StatelessWidget {
  final String label;
  final Color color;

  const _PaletteColor(this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: Container(
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: Colors.white.withOpacity(0.1),
          ),
        ),
      ),
    );
  }
}
