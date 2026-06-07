import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../theme/app_theme.dart';
import 'giphy_service.dart';

class GifPicker extends StatefulWidget {
  final AkaiPalette palette;
  final Future<void> Function(String gifUrl) onGifSelected;
  const GifPicker({super.key, required this.palette, required this.onGifSelected});

  @override
  State<GifPicker> createState() => _GifPickerState();
}

class _GifPickerState extends State<GifPicker> {
  final _service = GiphyService();
  final _searchCtrl = TextEditingController();

  List<GiphyGif> _results = [];
  List<GiphyGif> _trending = [];
  List<String> _recentIds = [];

  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    _recentIds = prefs.getStringList('recent_gif_ids') ?? [];

    setState(() => _loading = true);
    final trending = await _service.trending();

    setState(() {
      _trending = trending;
      _results = trending;
      _loading = false;
    });
  }

  Future<void> _search(String q) async {
    if (q.trim().isEmpty) {
      setState(() => _results = _trending);
      return;
    }

    setState(() => _loading = true);
    final res = await _service.search(query: q.trim());
    setState(() {
      _results = res;
      _loading = false;
    });
  }

  Future<void> _select(GiphyGif gif) async {
    final prefs = await SharedPreferences.getInstance();
    _recentIds = prefs.getStringList('recent_gif_ids') ?? [];
    _recentIds.removeWhere((id) => id == gif.id);
    _recentIds.insert(0, gif.id);
    _recentIds = _recentIds.take(20).toList();
    await prefs.setStringList('recent_gif_ids', _recentIds);

    await widget.onGifSelected(gif.url);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 360,
      decoration: BoxDecoration(
        color: widget.palette.surface,
        border: Border(top: BorderSide(color: widget.palette.surfaceVariant, width: 0.5)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              controller: _searchCtrl,
              onChanged: _search,
              style: TextStyle(color: widget.palette.keyText),
              decoration: InputDecoration(
                hintText: 'Search GIFs...',
                hintStyle: TextStyle(color: widget.palette.keySecondaryText),
                prefixIcon: Icon(Icons.search, color: widget.palette.keySecondaryText),
                filled: true,
                fillColor: widget.palette.surfaceVariant,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? Center(child: CircularProgressIndicator(color: widget.palette.accent))
                : GridView.builder(
                    padding: const EdgeInsets.all(8),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                      mainAxisSpacing: 6,
                      crossAxisSpacing: 6,
                    ),
                    itemCount: _results.length,
                    itemBuilder: (context, i) {
                      final gif = _results[i];
                      return GestureDetector(
                        onTap: () => _select(gif),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.network(
                            gif.url,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(color: widget.palette.surfaceVariant),
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
}

