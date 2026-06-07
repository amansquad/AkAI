import 'dart:convert';
import 'package:http/http.dart' as http;

class GiphyGif {
  final String id;
  final String url;
  final String title;

  const GiphyGif({required this.id, required this.url, required this.title});
}

class GiphyService {
  // Put your API key here or fetch from remote config later.
  // Set to your GIPHY API key (provided by the project user).
  static const String apiKey = 'zQokRZXOdASULoLiSOuTkLCIhDZf5XMZ';
  static const String _base = 'https://api.giphy.com/v1/gifs';

  Future<List<GiphyGif>> search({
    required String query,
    int limit = 24,
  }) async {
    if (apiKey == 'YOUR_GIPHY_API_KEY') {
      return const [];
    }

    final uri = Uri.parse(
      '$_base/search?api_key=$apiKey&q=${Uri.encodeQueryComponent(query)}&limit=$limit&rating=pg-13&lang=en',
    );

    final res = await http.get(uri);
    if (res.statusCode != 200) return const [];

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final data = body['data'] as List<dynamic>? ?? [];

    return data.map((e) {
      final m = e as Map<String, dynamic>;
      final images = m['images'] as Map<String, dynamic>;
      final url = (images['fixed_width_small'] ?? images['downsized_small'] ?? {})['url'] as String? ?? '';
      return GiphyGif(
        id: m['id'] as String,
        url: url,
        title: (m['title'] as String?) ?? (m['username'] as String?) ?? '',
      );
    }).where((g) => g.url.isNotEmpty).toList();
  }

  Future<List<GiphyGif>> trending({
    int limit = 24,
  }) async {
    if (apiKey == 'YOUR_GIPHY_API_KEY') {
      return const [];
    }

    final uri = Uri.parse('$_base/trending?api_key=$apiKey&limit=$limit&rating=pg-13');
    final res = await http.get(uri);
    if (res.statusCode != 200) return const [];

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final data = body['data'] as List<dynamic>? ?? [];

    return data.map((e) {
      final m = e as Map<String, dynamic>;
      final images = m['images'] as Map<String, dynamic>;
      final url = (images['fixed_width_small'] ?? images['downsized_small'] ?? {})['url'] as String? ?? '';
      return GiphyGif(
        id: m['id'] as String,
        url: url,
        title: (m['title'] as String?) ?? (m['username'] as String?) ?? '',
      );
    }).where((g) => g.url.isNotEmpty).toList();
  }
}

