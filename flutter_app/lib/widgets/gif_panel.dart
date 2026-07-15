import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../services/gif_service.dart';
import '../app/theme/app_theme.dart';

class GifPanel extends StatefulWidget {
  const GifPanel({super.key});

  @override
  State<GifPanel> createState() => _GifPanelState();
}

class _GifPanelState extends State<GifPanel> {
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _gifs = [];
  bool _loading = false;
  String _activeCategory = 'Trending';
  String _lastSearch = '';

  @override
  void initState() {
    super.initState();
    _loadGifs();
  }

  Future<void> _loadGifs({String? query}) async {
    setState(() => _loading = true);

    if (_activeCategory == 'Recent') {
      final recentUrls = context.read<KeyboardProvider>().recentGifs;
      setState(() {
        _gifs = recentUrls
            .map((url) => {'id': url, 'title': 'Recent GIF', 'url': url})
            .toList();
        _loading = false;
      });
      return;
    }

    final results = (query != null && query.isNotEmpty)
        ? await GifService.search(query)
        : await GifService.byCategory(_activeCategory);

    if (mounted) {
      setState(() {
        _gifs = results;
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<KeyboardProvider>();
    final AkaiPalette theme = context.watch<ThemeProvider>().currentTheme;

    return Container(
      height: provider.isSearching ? 180 : 320,
      color: theme.background,
      child: Column(
        children: [
          // If we just came back from a search, ensure we show results
          if (provider.searchQuery.isNotEmpty && (provider.searchQuery != _lastSearch || _activeCategory != 'Search'))
             Builder(builder: (context) {
               Future.microtask(() {
                 if (mounted) {
                   setState(() {
                     _activeCategory = 'Search';
                     _lastSearch = provider.searchQuery;
                   });
                   _loadGifs(query: provider.searchQuery);
                 }
               });
               return const SizedBox.shrink();
             }),
          // Search bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: GestureDetector(
              onTap: () => provider.startSearch(KeyboardMode.gifs),
              child: Container(
                height: 40,
                decoration: BoxDecoration(
                  color: theme.surface.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 12),
                    Icon(Icons.search, color: theme.accent.withOpacity(0.5), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        provider.searchQuery.isEmpty ? 'Search Giphy...' : provider.searchQuery,
                        style: TextStyle(
                          color: provider.searchQuery.isEmpty
                            ? theme.keySecondaryText.withOpacity(0.5)
                            : theme.keyText,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    if (provider.searchQuery.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.close, size: 16),
                        onPressed: () => provider.updateSearchQuery(''),
                      ),
                  ],
                ),
              ),
            ),
          ),

          // Categories
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _buildTab('Recent', theme, Icons.history),
                const SizedBox(width: 8),
                for (final cat in GifService.categories) ...[
                  _buildTab(cat, theme, _categoryIcon(cat)),
                  const SizedBox(width: 8),
                ],
                if (_activeCategory == 'Search')
                  _buildTab('Results', theme, Icons.search),
              ],
            ),
          ),

          // GIF grid
          Expanded(
            child: _loading
                ? Center(child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(theme.accent)))
                : _gifs.isEmpty
                  ? Center(
                      child: Text(
                        _activeCategory == 'Recent'
                            ? 'No recent GIFs yet'
                            : 'No GIFs found — check your connection',
                        style: TextStyle(color: theme.keySecondaryText, fontSize: 12),
                      ),
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.all(8),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                        childAspectRatio: 1.4,
                      ),
                      itemCount: _gifs.length,
                      itemBuilder: (context, index) {
                        final gif = _gifs[index];
                        return GestureDetector(
                          onTap: () {
                            // Inline image where supported, URL text elsewhere
                            provider.insertGif(
                              gif['url'] as String,
                              title: (gif['title'] as String?) ?? 'GIF',
                              id: '${gif['id']}',
                            );
                            provider.addGifToRecent(gif['url']);
                            provider.setMode(KeyboardMode.keyboard);
                          },
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              decoration: BoxDecoration(
                                color: theme.key.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: theme.accent.withOpacity(0.1)),
                              ),
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: Image.network(
                                        gif['url'],
                                        fit: BoxFit.cover,
                                        gaplessPlayback: true,
                                        loadingBuilder: (context, child, progress) {
                                          if (progress == null) return child;
                                          return Center(
                                            child: CircularProgressIndicator(
                                              value: progress.expectedTotalBytes != null
                                                  ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                                                  : null,
                                              strokeWidth: 2,
                                              valueColor: AlwaysStoppedAnimation<Color>(theme.accent.withOpacity(0.3)),
                                            ),
                                          );
                                        },
                                        errorBuilder: (context, error, stackTrace) => Center(
                                          child: Icon(Icons.broken_image_outlined, size: 30, color: theme.keySecondaryText),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(
                                          color: Colors.black45,
                                          borderRadius: BorderRadius.vertical(bottom: Radius.circular(12)),
                                        ),
                                        child: Text(
                                          gif['title'],
                                          style: const TextStyle(color: Colors.white, fontSize: 10),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
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

  IconData _categoryIcon(String cat) {
    switch (cat) {
      case 'Trending':
        return Icons.trending_up;
      case 'Reactions':
        return Icons.emoji_emotions_outlined;
      case 'Hype':
        return Icons.celebration_outlined;
      case 'Funny':
        return Icons.sentiment_very_satisfied_outlined;
      case 'Animals':
        return Icons.pets_outlined;
      case 'Mood':
        return Icons.nightlight_outlined;
      default:
        return Icons.gif_box_outlined;
    }
  }

  Widget _buildTab(String label, AkaiPalette theme, IconData icon) {
    final isActive = _activeCategory == label;
    return GestureDetector(
      onTap: () {
        setState(() => _activeCategory = label);
        _loadGifs();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isActive ? theme.accent.withOpacity(0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: isActive ? theme.accent : theme.keySecondaryText),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(color: isActive ? theme.accent : theme.keySecondaryText, fontSize: 12, fontWeight: isActive ? FontWeight.bold : FontWeight.normal)),
          ],
        ),
      ),
    );
  }
}
