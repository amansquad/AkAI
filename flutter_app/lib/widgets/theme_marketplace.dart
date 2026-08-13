import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/theme_download_service.dart';
import '../services/firestore_theme_service.dart';
import '../providers/theme_provider.dart';
import '../app/theme/app_theme.dart';
import '../app/theme/live_theme_background.dart';
import 'motion_helpers.dart';
import 'dart:async';

class ThemeMarketplace extends StatefulWidget {
  const ThemeMarketplace({super.key});

  @override
  State<ThemeMarketplace> createState() => _ThemeMarketplaceState();
}

class _ThemeMarketplaceState extends State<ThemeMarketplace> {
  List<Map<String, dynamic>> _availableThemes = [];
  Set<String> _downloadedThemes = {};
  Map<String, bool> _downloading = {};
  String _selectedCategory = 'all';
  bool _loading = true;

  final List<Map<String, String>> _categories = [
    {'id': 'all', 'name': 'All', 'icon': '✨'},
    {'id': 'faith', 'name': 'Faith', 'icon': '☪️'},
    {'id': 'culture', 'name': 'Culture', 'icon': '🇪🇹'},
    {'id': 'football', 'name': 'Football', 'icon': '⚽'},
    {'id': 'live', 'name': 'Live', 'icon': '⚡'},
    {'id': 'solid', 'name': 'Solid', 'icon': '🎨'},
  ];

  @override
  void initState() {
    super.initState();
    _loadThemes();
  }

  Future<void> _loadThemes() async {
    setState(() => _loading = true);
    
    try {
      // 1. Load downloaded IDs first (stable)
      final downloaded = await ThemeDownloadService.getDownloadedThemeIds();
      
      // 2. Full local catalog (bundled + server overrides) is always the base
      var available = await ThemeDownloadService.getAvailableThemes();

      // 3. Merge Firestore themes on top — they can add or override entries,
      //    but never hide the bundled catalog
      try {
        final remote = await FirestoreThemeService.getAvailableThemes();
        available = ThemeDownloadService.mergeThemeLists(available, remote);
      } catch (e) {
        debugPrint('Firestore unavailable, using local catalog: $e');
      }
      
      setState(() {
        _availableThemes = available;
        _downloadedThemes = downloaded.toSet();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      // Final desperation fallback
      final available = await ThemeDownloadService.getAvailableThemes();
      if (mounted) {
        setState(() => _availableThemes = available);
      }
    }
  }

  /// Resolve a store entry to a bundled palette by id, falling back to name —
  /// the registry includes core, faith and cultural themes.
  AkaiPalette? _findBundledPalette(String themeId, [String? name]) {
    for (final p in AkaiThemes.all) {
      if (p.id == themeId) return p;
    }
    if (name != null) {
      for (final p in AkaiThemes.all) {
        if (p.name.toLowerCase() == name.toLowerCase()) return p;
      }
    }
    return null;
  }

  Future<void> _downloadTheme(String themeId, bool hasImage, {String? themeName}) async {
    setState(() => _downloading[themeId] = true);
    debugPrint('AKAI Marketplace: Attempting download for theme: $themeId');

    try {
      // 1. Anything in the bundled registry unlocks instantly — no network.
      final bundled = _findBundledPalette(themeId, themeName);
      final liveThemeId = bundled?.liveTheme ?? themeId;

      bool success = false;
      if (bundled != null) {
        debugPrint('AKAI Marketplace: Bundled theme $themeId — instant unlock.');
        if (hasImage) {
          // Best-effort high-fidelity background; the theme works without it.
          try {
            await ThemeDownloadService.downloadThemeImage(liveThemeId);
          } catch (_) {}
        }
        await Future.delayed(const Duration(milliseconds: 400)); // Download feel
        success = true;
      } else {
        // 2. Truly remote theme — fetch from the server.
        success = await ThemeDownloadService.downloadTheme(themeId);
        if (success && hasImage) {
          try {
            await ThemeDownloadService.downloadThemeImage(liveThemeId);
          } catch (_) {}
        }
      }

      if (success) {
        if (bundled != null) {
          // Persist the unlock
          await ThemeDownloadService.saveUnlockedThemeId(themeId);
        }

        setState(() {
          _downloadedThemes.add(themeId);
          _downloading.remove(themeId);
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Theme unlocked successfully!'),
              backgroundColor: Color(0xFF10B981),
            ),
          );
        }
      } else {
        throw Exception('Download unavailable.');
      }
    } catch (e) {
      setState(() => _downloading.remove(themeId));
      debugPrint('AKAI Marketplace: Download error: $e');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_findBundledPalette(themeId) != null
                ? 'Unlocked locally'
                : 'Theme unavailable — check your connection'),
          ),
        );
      }
    }
  }

  Future<void> _deleteTheme(String themeId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Theme'),
        content: const Text('Are you sure you want to delete this theme?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await ThemeDownloadService.deleteTheme(themeId);
      
      if (success) {
        setState(() => _downloadedThemes.remove(themeId));
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Theme deleted')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF130F24), Color(0xFF1B1433)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            spreadRadius: 2,
          )
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE4A11B).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.store_mall_directory_rounded, color: Color(0xFFE4A11B), size: 24),
                  ),
                  const SizedBox(width: 14),
                  const Text(
                    'Theme Store',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  onPressed: _loadThemes,
                  icon: const Icon(Icons.refresh_rounded, color: Colors.white70),
                  tooltip: 'Refresh',
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${_downloadedThemes.length} downloaded  •  ${_availableThemes.length} available',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          
          const SizedBox(height: 12),
          
          // Category chips
          SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final cat = _categories[index];
                final isSelected = _selectedCategory == cat['id'];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text('${cat['icon']} ${cat['name']}'),
                    selected: isSelected,
                    onSelected: (val) => setState(() => _selectedCategory = cat['id']!),
                    backgroundColor: Colors.white.withOpacity(0.05),
                    selectedColor: const Color(0xFF10B981).withOpacity(0.3),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.white70,
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    showCheckmark: false,
                  ),
                );
              },
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Themes grid
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFF10B981)),
                  )
                : _availableThemes.isEmpty
                    ? _buildEmptyState()
                    : GridView.builder(
                        physics: const BouncingScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          childAspectRatio: 0.7,
                        ),
                        itemCount: _availableThemes.where((t) => _selectedCategory == 'all' || t['category'] == _selectedCategory).length,
                        itemBuilder: (context, index) {
                          final filtered = _availableThemes.where((t) => _selectedCategory == 'all' || t['category'] == _selectedCategory).toList();
                          return StaggerIn(index: index, child: _buildThemeGridCard(filtered[index]));
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.cloud_off_rounded, size: 48, color: Colors.white30),
          const SizedBox(height: 16),
          const Text('No themes available', style: TextStyle(color: Colors.white54)),
        ],
      ),
    );
  }

  Widget _buildThemeGridCard(Map<String, dynamic> theme) {
    final themeId = theme['id'] as String;
    final name = theme['name'] as String;
    final emoji = theme['emoji'] as String;
    final isLive = theme['liveTheme'] != null;
    final isTeam = theme['category'] == 'football';
    final isDownloaded = _downloadedThemes.contains(themeId);
    final isDownloading = _downloading[themeId] ?? false;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDownloaded ? const Color(0xFF10B981).withOpacity(0.5) : Colors.white.withOpacity(0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: 3,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                child: Stack(
                  children: [
                    // Dynamic Live Background Preview
                    if (isLive)
                      Positioned.fill(
                        child: LiveThemeBackground(
                          key: ValueKey('preview_$themeId'),
                          type: theme['liveTheme'] as String?,
                          animate: false,
                        ),
                      )
                    else
                      Container(color: Colors.black26),
                      
                    // Emoji / Title overlay
                    Center(child: Text(emoji, style: const TextStyle(fontSize: 40))),
                    
                    if (isLive)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: isTeam ? const Color(0xFFE4A11B) : const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isTeam ? Icons.shield_rounded : Icons.bolt_rounded,
                                size: 8,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                isTeam ? 'TEAM' : 'LIVE',
                                style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
          ),
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                children: [
                  Text(name, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const Spacer(),
                  if (isDownloading)
                    const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF10B981)))
                  else if (isDownloaded)
                    Consumer<ThemeProvider>(
                      builder: (context, tp, _) {
                        final isActive = tp.currentTheme.id == themeId;
                        return GestureDetector(
                          onTap: () async {
                            // Find the palette in registry (id first, then name)
                            final palette = tp.allThemes.firstWhere(
                                (p) => p.id == themeId,
                                orElse: () =>
                                    _findBundledPalette(themeId, name) ??
                                    AkaiThemes.akaiObsidian);
                            
                            // Check if image is missing for live themes and try to download it
                            if (isLive) {
                              final liveThemeId = palette.liveTheme ?? themeId;
                              debugPrint('AKAI Marketplace: Ensuring high-fidelity image for $liveThemeId on APPLY');
                              ThemeDownloadService.downloadThemeImage(liveThemeId);
                            }

                            tp.setTheme(palette);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('${palette.name} applied!'), duration: const Duration(seconds: 1)),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: isActive ? const Color(0xFF10B981) : Colors.transparent,
                              border: Border.all(color: const Color(0xFF10B981)),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              isActive ? 'ACTIVE' : 'APPLY',
                              style: TextStyle(
                                color: isActive ? Colors.white : const Color(0xFF10B981),
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        );
                      }
                    )
                  else
                    GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () {
                        debugPrint('AkAI Marketplace: Attempting download for theme: $themeId');
                        _downloadTheme(themeId, isLive, themeName: name);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          border: Border.all(color: const Color(0xFF10B981)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text('FREE', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
