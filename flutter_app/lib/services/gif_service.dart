import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

/// Fetches real Giphy GIFs for the keyboard's GIF panel.
///
/// Two modes:
///  1. Live Giphy API (search + trending) when [giphyApiKey] is set.
///     Get a free key at https://developers.giphy.com (create app → API key)
///     and paste it below.
///  2. Keyless fallback: a curated catalog of real Giphy GIFs served straight
///     from the public media.giphy.com CDN (no key required). Every entry has
///     been verified to load, and carries tags so search + category chips
///     still work offline from the API.
class GifService {
  GifService._();

  /// Paste your Giphy API key here to enable live search & trending.
  static const String giphyApiKey = '';

  static const List<String> categories = [
    'Trending',
    'Reactions',
    'Hype',
    'Funny',
    'Animals',
    'Mood',
  ];

  /// Curated real Giphy GIFs (media.giphy.com CDN, keyless).
  /// id, title, category, tags — url is derived from id.
  static const List<Map<String, String>> _catalog = [
    {'id': '26ufdipQqU2lhNA4g', 't': 'Mind Blown', 'c': 'Reactions', 'k': 'mind blown wow omg shocked crazy'},
    {'id': 'l3q2K5jinAlChoCLS', 't': 'Blinking Guy', 'c': 'Reactions', 'k': 'what confused really wow blink huh'},
    {'id': 'BlVnrxJgTGsUw', 't': 'So Excited!', 'c': 'Reactions', 'k': 'excited omg yes happy dance seinfeld'},
    {'id': '10JhviFuU2gWD6', 't': 'LOL', 'c': 'Reactions', 'k': 'laugh lol haha funny hilarious'},
    {'id': '111ebonMs90YLu', 't': 'Thumbs Up', 'c': 'Reactions', 'k': 'thumbs up nice good ok great computer kid'},
    {'id': '26tPplGWjN0xLybiU', 't': 'Woohoo!', 'c': 'Reactions', 'k': 'woohoo excited happy yes bart simpsons'},
    {'id': 'l0HlvtIPzPdt2usKs', 't': 'Not Impressed', 'c': 'Reactions', 'k': 'no nah side eye doubt smh really'},
    {'id': '3oz8xAFtqoOUUrsh7W', 't': 'Yeah!', 'c': 'Reactions', 'k': 'yes yeah agree happy flower'},
    {'id': '26gsjCZpPolPr3sBy', 't': 'Thank You!', 'c': 'Reactions', 'k': 'thank you thanks grateful appreciate'},
    {'id': '26xBwdIuRJiAIqHwA', 't': 'Hola!', 'c': 'Reactions', 'k': 'hello hi hola wave hey greetings'},
    {'id': '4T7e4DmcrP9du', 't': 'Fist Bump', 'c': 'Reactions', 'k': 'fist bump bro respect nice deal'},
    {'id': 'xT4uQulxzV39haRFjG', 't': 'Party Time', 'c': 'Hype', 'k': 'party fun taco drink weekend'},
    {'id': 'l0MYt5jPR6QX5pnqM', 't': 'Happy Dance', 'c': 'Hype', 'k': 'dance happy office excited party moves'},
    {'id': '11sBLVxNs7v6WA', 't': 'Minions Cheer', 'c': 'Hype', 'k': 'minions cheer yay celebrate happy woo'},
    {'id': '26u4cqiYI30juCOGY', 't': 'Winner!', 'c': 'Hype', 'k': 'win trophy celebrate congrats champion confetti'},
    {'id': '12XDYvMJNcmLgQ', 't': 'Rooting For You', 'c': 'Hype', 'k': 'support good luck cheer you got this patrick'},
    {'id': '3o7abKhOpu0NwenH3O', 't': 'Pumped Up', 'c': 'Hype', 'k': 'excited pumped lets go hype spongebob'},
    {'id': '26tOZ42Mg6pbTUPHW', 't': 'Fireworks', 'c': 'Hype', 'k': 'fireworks celebrate congrats party new year'},
    {'id': 'rY93u9tQbybks', 't': 'Cheers!', 'c': 'Hype', 'k': 'cheers congrats toast classy gatsby well done'},
    {'id': '26BRuo6sLetdllPAQ', 't': 'Peeking', 'c': 'Funny', 'k': 'hello curious spying peek hi sneaky'},
    {'id': 'xUPGcguWZHRC2HyBRS', 't': 'Busy Bots', 'c': 'Funny', 'k': 'robots busy work cute cartoon machines'},
    {'id': 'l46Cy1rHbQ92uuLXa', 't': 'Investigating', 'c': 'Funny', 'k': 'search look data hmm detective charts'},
    {'id': '26AHONQ79FdWZhAI0', 't': 'Typing Fast', 'c': 'Funny', 'k': 'typing busy work fast deadline keyboard'},
    {'id': '1BXa2alBjrCXC', 't': 'Hilarious', 'c': 'Funny', 'k': 'laugh lol funny hysterical wine'},
    {'id': 'oF5oUYTOhvFnO', 't': 'Big Smile', 'c': 'Funny', 'k': 'happy smile cute grin spongebob'},
    {'id': '13CoXDiaCcCoyk', 't': 'Ready to Pounce', 'c': 'Animals', 'k': 'cat funny wiggle ready pounce game'},
    {'id': 'JIX9t2j0ZTN9S', 't': 'Cat Typing', 'c': 'Animals', 'k': 'cat typing busy work computer keyboard'},
    {'id': 'mlvseq9yvZhba', 't': 'Sassy Cat', 'c': 'Animals', 'k': 'cat sassy whatever bored nails'},
    {'id': '3o6Zt6ML6BklcajjsA', 't': 'Cat vs Computer', 'c': 'Animals', 'k': 'cat oops delete computer funny keyboard'},
    {'id': '3og0IPxMM0erATueVW', 't': 'Guilty Dogs', 'c': 'Animals', 'k': 'dog guilty sorry oops funny puppy'},
    {'id': '3oEduQAsYcJKQH2XsI', 't': 'Space Cat', 'c': 'Animals', 'k': 'cat crazy space laser wow trippy'},
    {'id': '8vQSQ3cNXuDGo', 't': 'Incoming Puppy', 'c': 'Animals', 'k': 'dog puppy run excited zoomies funny'},
    {'id': '3oEjI6SIIHBdRxXI40', 't': 'Loading…', 'c': 'Mood', 'k': 'loading wait hold on brb hmm'},
    {'id': '26FPJGjhefSJuaRhu', 't': 'Typing…', 'c': 'Mood', 'k': 'typing chat text wait bubbles messages'},
    {'id': '3o7aD2saalBwwftBIY', 't': 'Happy Friday', 'c': 'Mood', 'k': 'friday weekend cat happy tgif'},
    {'id': 'xTiTnxpQ3ghPiB2Hp6', 't': 'Cyber Vibes', 'c': 'Mood', 'k': 'tech cool matrix blue vibes hacker'},
    {'id': 'l0Iy5fjHyedk9aDGU', 't': 'Rainy Mood', 'c': 'Mood', 'k': 'rain sad mood cozy weather relax'},
  ];

  static String _cdnUrl(String id) => 'https://media.giphy.com/media/$id/200.gif';

  static List<Map<String, dynamic>> _fromCatalog(Iterable<Map<String, String>> items) {
    return items
        .map<Map<String, dynamic>>((it) => {
              'id': it['id']!,
              'title': it['t']!,
              'url': _cdnUrl(it['id']!),
            })
        .toList();
  }

  /// Trending GIFs — live Giphy trending when a key is set, otherwise the
  /// full curated catalog.
  static Future<List<Map<String, dynamic>>> trending() async {
    if (giphyApiKey.isNotEmpty) {
      final live = await _giphyRequest(
          'https://api.giphy.com/v1/gifs/trending?api_key=$giphyApiKey&limit=24&rating=pg-13');
      if (live.isNotEmpty) return live;
    }
    return _fromCatalog(_catalog);
  }

  /// Search GIFs — live Giphy search when a key is set, otherwise keyword
  /// matching against the curated catalog's titles and tags.
  static Future<List<Map<String, dynamic>>> search(String query) async {
    final q = query.toLowerCase().trim();
    if (q.isEmpty) return trending();

    if (giphyApiKey.isNotEmpty) {
      final live = await _giphyRequest(
          'https://api.giphy.com/v1/gifs/search?api_key=$giphyApiKey&q=${Uri.encodeComponent(q)}&limit=24&rating=pg-13');
      if (live.isNotEmpty) return live;
    }

    final words = q.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    final matches = _catalog.where((it) {
      final haystack = '${it['t']!.toLowerCase()} ${it['k']!} ${it['c']!.toLowerCase()}';
      return words.any(haystack.contains);
    });
    final result = _fromCatalog(matches);
    return result.isEmpty ? _fromCatalog(_catalog) : result;
  }

  /// GIFs for a category chip. With an API key the category name becomes a
  /// live search; keyless it filters the curated catalog.
  static Future<List<Map<String, dynamic>>> byCategory(String category) async {
    if (category == 'Trending') return trending();

    if (giphyApiKey.isNotEmpty) {
      final live = await _giphyRequest(
          'https://api.giphy.com/v1/gifs/search?api_key=$giphyApiKey&q=${Uri.encodeComponent(category)}&limit=24&rating=pg-13');
      if (live.isNotEmpty) return live;
    }
    return _fromCatalog(_catalog.where((it) => it['c'] == category));
  }

  /// Download a GIF into the app cache (`<cache>/gifs/`, the directory the
  /// manifest FileProvider exposes) so it can be committed as inline content.
  /// Returns the local file path, or null on failure.
  static Future<String?> downloadToCache(String url, String id) async {
    try {
      final safeId = id.replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '_');
      final cacheDir = await getTemporaryDirectory();
      final gifDir = Directory('${cacheDir.path}/gifs');
      if (!await gifDir.exists()) await gifDir.create(recursive: true);
      final file = File('${gifDir.path}/$safeId.gif');
      if (await file.exists() && await file.length() > 0) return file.path;

      final response =
          await http.get(Uri.parse(url)).timeout(const Duration(seconds: 15));
      if (response.statusCode != 200 || response.bodyBytes.isEmpty) return null;
      await file.writeAsBytes(response.bodyBytes, flush: true);
      return file.path;
    } catch (e) {
      debugPrint('GifService: download failed: $e');
      return null;
    }
  }

  static Future<List<Map<String, dynamic>>> _giphyRequest(String url) async {
    try {
      final response =
          await http.get(Uri.parse(url)).timeout(const Duration(seconds: 8));
      if (response.statusCode != 200) return [];
      final data = json.decode(response.body) as Map<String, dynamic>;
      final results = (data['data'] as List<dynamic>? ?? []);
      final gifs = <Map<String, dynamic>>[];
      for (final item in results) {
        final images = item['images'] as Map<String, dynamic>?;
        final url = ((images?['fixed_height'] ?? images?['downsized'])
            as Map<String, dynamic>?)?['url'] as String?;
        if (url == null || url.isEmpty) continue;
        gifs.add({
          'id': item['id'] ?? url,
          'title': (item['title'] as String?)?.isNotEmpty == true
              ? item['title'] as String
              : 'GIF',
          'url': url,
        });
      }
      return gifs;
    } catch (e) {
      debugPrint('GifService: Giphy request failed: $e');
      return [];
    }
  }
}
