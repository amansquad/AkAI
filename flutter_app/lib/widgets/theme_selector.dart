import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../app/theme/app_theme.dart';
import '../app/theme/live_theme_background.dart';
import 'theme_marketplace.dart';

class ThemeSelector extends StatefulWidget {
  const ThemeSelector({super.key});

  @override
  State<ThemeSelector> createState() => _ThemeSelectorState();
}

class _ThemeSelectorState extends State<ThemeSelector> {
  String _selectedCategory = 'all';

  final List<String> _categories = [
    'all',
    'faith',
    'culture',
    'football',
    'live',
    'solid',
    'custom'
  ];

  String _formatCategoryName(String category) {
    switch (category) {
      case 'all': return '✨ All';
      case 'faith': return '☪️ Faith';
      case 'culture': return '🇪🇹 Culture';
      case 'football': return '⚽ Football';
      case 'live': return '⚡ Live';
      case 'solid': return '🎨 Solid';
      case 'custom': return '🖌️ Custom';
      default: return category;
    }
  }

  void _showMarketplace() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.95,
        decoration: const BoxDecoration(
          color: Color(0xFF141026),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Drag handle
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Marketplace content
            const Expanded(child: ThemeMarketplace()),
          ],
        ),
      ),
    ).then((_) {
      // Refresh theme list after closing marketplace
      final themeProvider = context.read<ThemeProvider>();
      themeProvider.loadDownloadedThemes();
    });
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final currentPalette = themeProvider.currentTheme;

    // Filter themes from provider's allThemes (includes downloaded themes)
    final filteredThemes = _selectedCategory == 'all'
        ? themeProvider.allThemes
        : themeProvider.allThemes.where((t) => t.category == _selectedCategory).toList();

    return Container(
      color: currentPalette.background,
      child: Column(
        children: [
          // Elegant Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: currentPalette.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: currentPalette.accent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.palette_outlined, color: currentPalette.accent, size: 20),
                ),
                const SizedBox(width: 12),
                Text(
                  'Choose Theme',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                    color: currentPalette.keyText,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: currentPalette.surfaceVariant,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${filteredThemes.length}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: currentPalette.keySecondaryText,
                    ),
                  ),
                ),
                const Spacer(),
                // Glowy Download More button
                GestureDetector(
                  onTap: _showMarketplace,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [currentPalette.accent.withOpacity(0.8), currentPalette.accent],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: currentPalette.accent.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.local_mall_outlined,
                          size: 14,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 6),
                        const Text(
                          'Store',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Category selector strip
          Container(
            height: 56,
            color: currentPalette.background,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = _selectedCategory == category;
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedCategory = category;
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected ? currentPalette.accent : currentPalette.surfaceVariant.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: isSelected ? currentPalette.accent : currentPalette.surfaceVariant.withOpacity(0.2),
                        ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: currentPalette.accent.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                )
                              ]
                            : [],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _formatCategoryName(category),
                        style: TextStyle(
                          color: isSelected ? Colors.white : currentPalette.keyText,
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Theme grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              physics: const BouncingScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 4,
                mainAxisSpacing: 4,
                childAspectRatio: 0.72, // Slightly taller for more density
              ),
              itemCount: filteredThemes.length,
              itemBuilder: (context, index) {
                final palette = filteredThemes[index];
                final isSelected = palette.name == currentPalette.name;

                return GestureDetector(
                  onTap: () {
                    themeProvider.setTheme(palette);
                    context.read<KeyboardProvider>().setMode(KeyboardMode.keyboard);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: isSelected
                            ? currentPalette.accent
                            : currentPalette.accent.withOpacity(0.1),
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: currentPalette.accent.withOpacity(0.4),
                                blurRadius: 16,
                                spreadRadius: -2,
                                offset: const Offset(0, 4),
                              ),
                            ]
                          : [],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Theme preview
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              color: palette.background,
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(15),
                              ),
                            ),
                            child: Stack(
                              children: [
                                // Animated backdrop for live & team themes — a static
                                // representative frame, matching the keyboard's own preview.
                                if (palette.liveTheme != null)
                                  Positioned.fill(
                                    child: ClipRRect(
                                      borderRadius: const BorderRadius.vertical(
                                        top: Radius.circular(15),
                                      ),
                                      child: Opacity(
                                        opacity: 0.55,
                                        child: LiveThemeBackground(
                                          key: ValueKey('grid_preview_${palette.id}'),
                                          palette: palette,
                                          animate: false,
                                        ),
                                      ),
                                    ),
                                  ),

                                // Live / Team indicator — football themes read as a squad,
                                // not a generic effect, so they get their own badge.
                                if (palette.liveTheme != null)
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: _ThemeBadge(
                                      isTeam: palette.category == 'football',
                                      color: palette.accent,
                                    ),
                                  ),

                                // Selected badge
                                if (isSelected)
                                  Positioned(
                                    top: 10,
                                    left: 10,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: currentPalette.accent,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: currentPalette.accent.withOpacity(0.5),
                                            blurRadius: 6,
                                          )
                                        ],
                                      ),
                                      child: const Icon(
                                        Icons.check_rounded,
                                        size: 16,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                
                                // Abstract Preview keys, scrimmed so they stay legible
                                // over an animated live/team backdrop.
                                if (palette.liveTheme != null)
                                  Positioned.fill(
                                    child: DecoratedBox(
                                      decoration: BoxDecoration(
                                        gradient: RadialGradient(
                                          colors: [
                                            palette.background.withOpacity(0.55),
                                            palette.background.withOpacity(0.0),
                                          ],
                                          radius: 0.9,
                                        ),
                                      ),
                                    ),
                                  ),
                                Center(
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      _buildPreviewKey(palette, 'A'),
                                      const SizedBox(width: 6),
                                      _buildPreviewKey(palette, 'K'),
                                      const SizedBox(width: 6),
                                      _buildPreviewSpecialKey(palette),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        
                        // Theme name
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                          decoration: BoxDecoration(
                            color: palette.surface,
                            borderRadius: const BorderRadius.vertical(
                              bottom: Radius.circular(15),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                palette.emoji,
                                style: const TextStyle(fontSize: 18),
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  palette.name,
                                  style: TextStyle(
                                    color: palette.keyText,
                                    fontSize: 14,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                  maxLines: 1,
                                ),
                              ),
                            ],
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

  Widget _buildPreviewKey(AkaiPalette palette, String label) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: palette.key,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            offset: const Offset(0, 2),
            blurRadius: 2,
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: TextStyle(
          color: palette.keyText,
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildPreviewSpecialKey(AkaiPalette palette) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: palette.keySecondary,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            offset: const Offset(0, 2),
            blurRadius: 2,
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Icon(
        Icons.backspace_outlined,
        size: 18,
        color: palette.keyText,
      ),
    );
  }
}

/// LIVE for animated-effect themes, TEAM for football club themes —
/// same shape and weight so the grid stays consistent, different enough
/// to read at a glance which promise each card is making.
class _ThemeBadge extends StatelessWidget {
  final bool isTeam;
  final Color color;

  const _ThemeBadge({required this.isTeam, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.5), blurRadius: 8),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isTeam ? Icons.shield_rounded : Icons.bolt_rounded,
            size: 14,
            color: Colors.white,
          ),
          const SizedBox(width: 4),
          Text(
            isTeam ? 'TEAM' : 'LIVE',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
