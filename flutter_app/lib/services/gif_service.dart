import 'dart:convert';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

  static String? _cachedKey;

  /// Resolve the Giphy key: compile-time constant → local prefs → a one-time
  /// Firestore lookup (`app_config/gifs` doc, `giphyApiKey` field) so a key
  /// added in the Firebase console unlocks full live search without an app
  /// update. Cached in prefs after the first successful fetch.
  static Future<String> _apiKey() async {
    if (giphyApiKey.isNotEmpty) return giphyApiKey;
    if (_cachedKey != null) return _cachedKey!;
    try {
      final prefs = await SharedPreferences.getInstance();
      final stored = prefs.getString('giphy_api_key') ?? '';
      if (stored.isNotEmpty) return _cachedKey = stored;

      final doc = await FirebaseFirestore.instance
          .collection('app_config')
          .doc('gifs')
          .get()
          .timeout(const Duration(seconds: 4));
      final key = (doc.data()?['giphyApiKey'] as String?)?.trim() ?? '';
      if (key.isNotEmpty) {
        await prefs.setString('giphy_api_key', key);
        return _cachedKey = key;
      }
    } catch (_) {
      // Firebase unavailable / offline — curated catalog still works.
    }
    return _cachedKey = '';
  }

  /// Casual search words → the tag vocabulary used in the curated catalog.
  static const Map<String, String> _aliases = {
    'lol': 'laugh', 'lmao': 'laugh', 'rofl': 'laugh', 'haha': 'laugh',
    'hahaha': 'laugh', 'hilarious': 'laugh',
    'hi': 'hello', 'hey': 'hello', 'sup': 'hello', 'howdy': 'hello',
    'luv': 'love', 'romance': 'love', 'crush': 'love', 'hearts': 'love',
    'sob': 'cry', 'tear': 'cry', 'tears': 'cry', 'sobbing': 'cry',
    'mad': 'angry', 'furious': 'angry', 'rage': 'angry',
    'yay': 'celebrate', 'woo': 'celebrate', 'woohoo': 'celebrate',
    'congratulations': 'congrats', 'grats': 'congrats',
    'ok': 'yes', 'okay': 'yes', 'yep': 'yes', 'yeah': 'yes', 'agree': 'yes',
    'nope': 'no', 'nah': 'no', 'never': 'no',
    'kitty': 'cat', 'kitten': 'cat', 'meow': 'cat', 'cats': 'cat',
    'puppy': 'dog', 'doggo': 'dog', 'woof': 'dog', 'dogs': 'dog',
    'soccer': 'football', 'goal': 'football', 'messi': 'football',
    'ty': 'thank', 'thx': 'thank', 'thanks': 'thank', 'thankyou': 'thank',
    'cya': 'bye', 'goodbye': 'bye', 'farewell': 'bye',
    'hungry': 'food', 'yum': 'food', 'yummy': 'food', 'eat': 'food',
    'sleepy': 'tired', 'zzz': 'tired', 'exhausted': 'tired',
    'workout': 'gym', 'exercise': 'gym', 'strong': 'gym',
    'wtf': 'confused', 'huh': 'confused', 'what': 'confused',
    'omg': 'shocked surprised', 'whoa': 'shocked', 'woah': 'shocked',
    'highfive': 'high five', 'hi5': 'high five',
    'gg': 'win congrats', 'victory': 'win',
    'coding': 'code', 'dev': 'code developer',
    'clapping': 'clap', 'applause': 'clap',
    'idk': 'confused', 'dunno': 'confused',
    'chill': 'relax', 'brb': 'wait', 'hurryup': 'hurry',
  };

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
    {'id': 'XsUtdIeJ0MWMo', 't': 'Picard Serious', 'c': 'Reactions', 'k': 'serious unimpressed star trek listen hmm'},
    {'id': '7rj2ZgttvgomY', 't': 'Shia Clap', 'c': 'Reactions', 'k': 'clap applause bravo well done congrats'},
    {'id': 'ASd0Ukj0y3qMM', 't': 'Ralph Wave', 'c': 'Reactions', 'k': 'hi hello wave bye greet simpsons'},
    {'id': '1zSz5MVw4zKg0', 't': 'Approving Nod', 'c': 'Reactions', 'k': 'nod nice impressed approve yes respect'},
    {'id': '3o7btPCcdNniyf0ArS', 't': 'Confused Math', 'c': 'Reactions', 'k': 'confused thinking math what huh calculating'},
    {'id': 'osjgQPWRx3cac', 't': 'Pusheen Thanks', 'c': 'Reactions', 'k': 'thank you thanks grateful ty cute cat'},
    {'id': '3oz8xLd9DJq2l2VFtu', 't': 'Wrong', 'c': 'Reactions', 'k': 'wrong no nope disagree'},
    {'id': '3rgXBOmTlzyFCURutG', 't': 'Nicholson Yes', 'c': 'Reactions', 'k': 'yes nod approve agree smile'},
    {'id': 'JzOyy8vKMCwvK', 't': 'Hurry Up', 'c': 'Reactions', 'k': 'hurry time late waiting watch fast judge'},
    {'id': 'Rhhr8D5mKSX7O', 't': 'Eye Roll', 'c': 'Reactions', 'k': 'eye roll annoyed whatever ugh judge'},
    {'id': '1M9fmo1WAFVK0', 't': 'But Why?', 'c': 'Reactions', 'k': 'why doctor confused mask ryan reynolds'},
    {'id': 'l41lFw057lAJQMwg0', 't': 'Panicked Morty', 'c': 'Reactions', 'k': 'panic shocked stress idk what rick morty'},
    {'id': '3o7abGQa0aRJUurpII', 't': 'Many Thumbs Up', 'c': 'Reactions', 'k': 'thumbs up good great approve nice spongebob'},
    {'id': '3og0INyCmHlNylks9O', 't': 'Picard Thinking', 'c': 'Reactions', 'k': 'thinking hmm consider decide star trek'},
    {'id': '42D3CxaINsAFemFuId', 't': 'Seriously?', 'c': 'Reactions', 'k': 'seriously really doubt unimpressed girl'},
    {'id': 'xT9IgG50Fb7Mi0prBC', 't': 'Gump Smile', 'c': 'Reactions', 'k': 'happy smile proud forrest gump'},
    {'id': '10LKovKon8DENq', 't': 'Pikachu High Five', 'c': 'Hype', 'k': 'high five pokemon eevee friends team yay'},
    {'id': 'DYH297XiCS2Ck', 't': 'Kermit Yay', 'c': 'Hype', 'k': 'excited yay happy celebrate woohoo kermit'},
    {'id': 'g9582DNuQppxC', 't': 'Leo Toast', 'c': 'Hype', 'k': 'cheers toast congrats celebrate classy party'},
    {'id': 'y8Mz1yj13s3kI', 't': 'Oprah Excited', 'c': 'Hype', 'k': 'excited scream celebrate win happy'},
    {'id': 'BQAk13taTaKYw', 't': 'Minions Party', 'c': 'Hype', 'k': 'minions cheer crowd yay celebrate party'},
    {'id': '3o6fJ1BM7R2EBRDnxK', 't': 'Congrats!', 'c': 'Hype', 'k': 'congrats congratulations champagne celebrate win office'},
    {'id': 'xT5LMHxhOfscxPfIfm', 't': 'Homer Woohoo', 'c': 'Hype', 'k': 'woohoo yes win happy excited simpsons'},
    {'id': '6nWhy3ulBL7GSCvKw6', 't': 'Surprised Pikachu', 'c': 'Funny', 'k': 'shocked surprised wow omg pokemon meme'},
    {'id': 'BzyTuYCmvSORqs1ABM', 't': 'Lightning Cat', 'c': 'Funny', 'k': 'cat power epic lightning storm'},
    {'id': '5xtDarmwsuR9sDRObyU', 't': 'Office High Five', 'c': 'Funny', 'k': 'office high five team work meeting michael'},
    {'id': '3oEjHAUOqG3lSS0f1C', 't': 'Muttley Laugh', 'c': 'Funny', 'k': 'laugh lol haha giggle snicker hehe'},
    {'id': 'd2Z9QYzA2aidiWn6', 't': 'Fanboy Excited', 'c': 'Funny', 'k': 'excited omg toys nerd happy star wars'},
    {'id': '3o85xIO33l7RlmLR4I', 't': 'Side Eye', 'c': 'Funny', 'k': 'side eye awkward hmm suspicious smirk girl'},
    {'id': '8fen5LSZcHQ5O', 't': 'Excellent', 'c': 'Funny', 'k': 'excellent perfect scheming evil burns simpsons'},
    {'id': '13d2jHlSlxklVe', 't': 'Nothing To See Here', 'c': 'Funny', 'k': 'nothing to see here explosion fine move along'},
    {'id': '3ohhwytHcusSCXXOUg', 't': 'Sneaky Watch', 'c': 'Funny', 'k': 'sneaky hiding spying watching peek stalker'},
    {'id': 'JltOMwYmi0VrO', 't': 'Flex Workout', 'c': 'Funny', 'k': 'workout gym strong flex muscle exercise'},
    {'id': 'l0MYGb1LuZ3n7dRnO', 't': 'Welcome to the Party', 'c': 'Funny', 'k': 'welcome party pal join die hard'},
    {'id': '26u4lOMA8JKSnL9Uk', 't': 'Chef Kiss', 'c': 'Funny', 'k': 'perfect chef kiss beautiful nice spongebob'},
    {'id': 'cXblnKXr2BQOaYnTni', 't': 'Michael Giddy', 'c': 'Funny', 'k': 'excited giddy happy smile office michael'},
    {'id': 'UO5elnTqo4vSg', 't': 'Shaq Smirk', 'c': 'Funny', 'k': 'smirk nod wiggle shaq sneaky'},
    {'id': 'MOWPkhRAUbR7i', 't': 'Minions Laugh', 'c': 'Funny', 'k': 'minions laugh lol haha happy'},
    {'id': 'MDJ9IbxxvDUQM', 't': 'Curious Cat', 'c': 'Animals', 'k': 'cat cute paw hello kitty pet'},
    {'id': 'mCRJDo24UvJMA', 't': 'Dog Typing', 'c': 'Animals', 'k': 'dog typing laptop work busy email shiba'},
    {'id': 'vFKqnCdLPNOKc', 't': 'Lazy Cat', 'c': 'Animals', 'k': 'lazy cat relax tired chill stretch sleepy'},
    {'id': 'l0Exk8EUzSLsrErEQ', 't': 'Puppy Sold', 'c': 'Animals', 'k': 'puppy dog cute adopt shop'},
    {'id': '3o6ZtaO9BZHcOjmErm', 't': 'Zoomies', 'c': 'Animals', 'k': 'run fast puppy dog zoom hurry'},
    {'id': 'LmNwrBhejkK9EFP504', 't': 'Speed Typing Cat', 'c': 'Animals', 'k': 'cat typing laptop fast hacker busy work'},
    {'id': '3o752nnUPE7OzLeSVW', 't': 'Office Dog', 'c': 'Animals', 'k': 'dog office computer work typing boss tie'},
    {'id': 'H4DjXQXamtTiIuCcRU', 't': 'Startled Cat', 'c': 'Animals', 'k': 'cat stare wide eyes surprised omg cute'},
    {'id': '13borq7Zo2kulO', 't': 'Mop Cat', 'c': 'Animals', 'k': 'cat mop cleaning ride funny sweep'},
    {'id': '26tn33aiTi1jkl6H6', 't': 'Coding', 'c': 'Mood', 'k': 'code programming developer hacker work computer'},
    {'id': '3o7TKtnuHOHHUjR38Y', 't': 'Buffering', 'c': 'Mood', 'k': 'loading wait buffering slow spinner brb'},
    {'id': 'QMHoU66sBXqqLqYvGO', 't': 'This Is Fine', 'c': 'Mood', 'k': 'fine fire stress okay chaos meme dog'},
    {'id': '26ufnwz3wDUli7GU0', 't': 'Do Nothing', 'c': 'Mood', 'k': 'lazy nothing todo weekend chill spongebob patrick'},
    {'id': '26ybw6AltpBRmyS76', 't': 'Skate', 'c': 'Mood', 'k': 'skate skateboard trick cool street'},
    {'id': 'l3vRfNA1p0rvhMSvS', 't': 'HTML', 'c': 'Mood', 'k': 'html code web developer programming'},
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

  /// Trending GIFs — live Giphy trending when a key is available, otherwise
  /// the full curated catalog.
  static Future<List<Map<String, dynamic>>> trending() async {
    final key = await _apiKey();
    if (key.isNotEmpty) {
      final live = await _giphyRequest(
          'https://api.giphy.com/v1/gifs/trending?api_key=$key&limit=24&rating=pg-13');
      if (live.isNotEmpty) return live;
    }
    return _fromCatalog(_catalog);
  }

  /// Search GIFs — live Giphy search when a key is available, otherwise
  /// alias/prefix keyword matching against the curated catalog.
  static Future<List<Map<String, dynamic>>> search(String query) async {
    final q = query.toLowerCase().trim();
    if (q.isEmpty) return trending();

    final key = await _apiKey();
    if (key.isNotEmpty) {
      final live = await _giphyRequest(
          'https://api.giphy.com/v1/gifs/search?api_key=$key&q=${Uri.encodeComponent(q)}&limit=24&rating=pg-13');
      if (live.isNotEmpty) return live;
    }

    final words = <String>{};
    for (final raw in q.split(RegExp(r'\s+'))) {
      if (raw.isEmpty) continue;
      words.add(raw);
      final alias = _aliases[raw];
      if (alias != null) words.addAll(alias.split(' '));
      // Light stemming: "celebrations" should still hit "celebrate".
      if (raw.length > 4) words.add(raw.substring(0, 4));
    }

    final matches = _catalog.where((it) {
      final haystack =
          '${it['t']!.toLowerCase()} ${it['k']!} ${it['c']!.toLowerCase()}';
      return words.any((w) => w.length >= 2 && haystack.contains(w));
    });
    final result = _fromCatalog(matches);
    return result.isEmpty ? _fromCatalog(_catalog) : result;
  }

  /// GIFs for a category chip. With an API key the category name becomes a
  /// live search; keyless it filters the curated catalog.
  static Future<List<Map<String, dynamic>>> byCategory(String category) async {
    if (category == 'Trending') return trending();

    final key = await _apiKey();
    if (key.isNotEmpty) {
      final live = await _giphyRequest(
          'https://api.giphy.com/v1/gifs/search?api_key=$key&q=${Uri.encodeComponent(category)}&limit=24&rating=pg-13');
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
