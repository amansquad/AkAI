import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
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

  // Optional Tenor v2 API key (free at https://developers.google.com/tenor).
  // When empty, the panel falls back to keyless animated emoji GIFs.
  static const String _tenorApiKey = '';

  // Animated emoji sets served from Google's keyless Noto emoji CDN.
  // Each entry: emoji char, Noto codepoint path, label + search keywords.
  static const List<Map<String, String>> _emojiGifCatalog = [
    {'e': '😂', 'c': '1f602', 't': 'LOL!', 'k': 'laugh funny lol haha joy'},
    {'e': '🤣', 'c': '1f923', 't': 'Rolling!', 'k': 'laugh funny rofl haha'},
    {'e': '🥰', 'c': '1f970', 't': 'Adore', 'k': 'love adore heart cute'},
    {'e': '😍', 'c': '1f60d', 't': 'Love it!', 'k': 'love heart eyes wow'},
    {'e': '😘', 'c': '1f618', 't': 'Muah!', 'k': 'love kiss muah'},
    {'e': '🥳', 'c': '1f973', 't': 'Party!', 'k': 'party celebrate birthday yay'},
    {'e': '🎉', 'c': '1f389', 't': 'Congrats!', 'k': 'party celebrate congrats confetti'},
    {'e': '🔥', 'c': '1f525', 't': 'Fire!', 'k': 'fire lit hot cool'},
    {'e': '✨', 'c': '2728', 't': 'Sparkle', 'k': 'sparkle magic shine cool'},
    {'e': '💯', 'c': '1f4af', 't': '100!', 'k': 'hundred perfect cool score'},
    {'e': '😎', 'c': '1f60e', 't': 'Cool', 'k': 'cool sunglasses chill'},
    {'e': '🤩', 'c': '1f929', 't': 'Starstruck', 'k': 'wow star amazing omg'},
    {'e': '😭', 'c': '1f62d', 't': 'Crying!', 'k': 'sad cry tears'},
    {'e': '🥺', 'c': '1f97a', 't': 'Please!', 'k': 'sad please pleading cute'},
    {'e': '😢', 'c': '1f622', 't': 'So sad', 'k': 'sad cry tear'},
    {'e': '😡', 'c': '1f621', 't': 'Furious', 'k': 'angry mad rage'},
    {'e': '🤔', 'c': '1f914', 't': 'Hmm...', 'k': 'think hmm wonder'},
    {'e': '😴', 'c': '1f634', 't': 'Zzz', 'k': 'sleep tired zzz night'},
    {'e': '👋', 'c': '1f44b', 't': 'Hello!', 'k': 'hello hi bye wave'},
    {'e': '👍', 'c': '1f44d', 't': 'Nice!', 'k': 'ok yes thumbs good nice'},
    {'e': '👏', 'c': '1f44f', 't': 'Bravo!', 'k': 'clap bravo congrats'},
    {'e': '🙏', 'c': '1f64f', 't': 'Thanks!', 'k': 'thanks thank you pray please'},
    {'e': '💪', 'c': '1f4aa', 't': 'Strong!', 'k': 'strong flex power gym'},
    {'e': '🕺', 'c': '1f57a', 't': 'Dance!', 'k': 'dance party groove'},
    {'e': '💃', 'c': '1f483', 't': 'Dancing', 'k': 'dance party salsa'},
    {'e': '🤗', 'c': '1f917', 't': 'Hugs!', 'k': 'hug love warm'},
    {'e': '😅', 'c': '1f605', 't': 'Phew!', 'k': 'laugh sweat awkward phew'},
    {'e': '🤯', 'c': '1f92f', 't': 'Mind blown', 'k': 'wow omg shocked mind'},
    {'e': '😉', 'c': '1f609', 't': 'Wink', 'k': 'wink flirt hey'},
    {'e': '⚽', 'c': '26bd', 't': 'Goal!', 'k': 'football soccer goal sport'},
  ];

  List<Map<String, dynamic>> _emojiGifs(String? query) {
    final q = (query ?? '').toLowerCase().trim();
    final matches = q.isEmpty
        ? _emojiGifCatalog
        : _emojiGifCatalog
            .where((it) =>
                it['k']!.contains(q) ||
                it['t']!.toLowerCase().contains(q) ||
                q.split(' ').any((word) => word.isNotEmpty && it['k']!.contains(word)))
            .toList();
    final list = matches.isEmpty ? _emojiGifCatalog : matches;
    return list
        .map<Map<String, dynamic>>((it) => {
              'id': 'noto_${it['c']}',
              'title': it['t']!,
              'emoji': it['e']!,
              'url':
                  'https://fonts.gstatic.com/s/e/notoemoji/latest/${it['c']}/512.webp',
            })
        .toList();
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

    // Live Tenor GIFs when an API key is configured
    if (_tenorApiKey.isNotEmpty) {
      try {
        final uri = query != null && query.isNotEmpty
            ? Uri.parse(
                'https://tenor.googleapis.com/v2/search?q=${Uri.encodeComponent(query)}&key=$_tenorApiKey&client_key=akai_keyboard&limit=24&media_filter=tinygif&contentfilter=medium')
            : Uri.parse(
                'https://tenor.googleapis.com/v2/featured?key=$_tenorApiKey&client_key=akai_keyboard&limit=24&media_filter=tinygif&contentfilter=medium');

        final response = await http.get(uri).timeout(const Duration(seconds: 8));
        if (response.statusCode == 200) {
          final data = json.decode(response.body) as Map<String, dynamic>;
          final results = (data['results'] as List<dynamic>? ?? []);
          final gifs = <Map<String, dynamic>>[];
          for (final item in results) {
            final url = ((item['media_formats']
                as Map<String, dynamic>?)?['tinygif']
                as Map<String, dynamic>?)?['url'] as String?;
            if (url == null) continue;
            gifs.add({
              'id': item['id'] ?? url,
              'title': (item['content_description'] as String?) ?? 'GIF',
              'url': url,
            });
          }
          if (gifs.isNotEmpty && mounted) {
            setState(() {
              _gifs = gifs;
              _loading = false;
            });
            return;
          }
        }
      } catch (e) {
        debugPrint('GifPanel: Tenor failed, using emoji GIFs: $e');
      }
    }

    // Keyless fallback: animated emoji GIFs
    if (mounted) {
      setState(() {
        _gifs = _emojiGifs(query);
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
          Container(
            height: 36,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                _buildTab('Recent', theme, Icons.history),
                const SizedBox(width: 8),
                _buildTab('Trending', theme, Icons.trending_up),
                const SizedBox(width: 8),
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
                            final emoji = gif['emoji'] as String?;
                            if (emoji != null) {
                              provider.appendText(emoji);
                            } else {
                              provider.appendText(' [GIF: ${gif['title']}] ');
                            }
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
                                    Image.network(
                                      gif['url'],
                                      fit: BoxFit.cover,
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
                                    Positioned(
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        color: Colors.black.withOpacity(0.4),
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
