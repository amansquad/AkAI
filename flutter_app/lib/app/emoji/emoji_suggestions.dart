

class EmojiSuggestion {
  final String emoji;
  final double score;

  const EmojiSuggestion({required this.emoji, required this.score});
}

/// A lightweight keyword->emoji matcher for keyboard suggestions.
///
/// Supports English + Amharic (basic mappings + common slang).
/// Extend anytime by adding new keys to the maps below.
class EmojiSuggestionEngine {
  static final Map<String, String> _en = {
    // Love / affection
    'love': '❤️',
    'loves': '❤️',
    'luv': '❤️',
    'heart': '❤️',
    'hearts': '❤️',
    'crush': '😍',
    'miss': '🥺',
    'love you': '❤️',
    'ily': '❤️',
    'bae': '😍',
    'hug': '🤗',
    'hugging': '🤗',
    'kisses': '💋',
    'kiss': '💋',

    // Laugh / happy
    'lol': '😂',
    'lmao': '😂',
    'rofl': '🤣',
    'haha': '😄',
    'hehe': '😅',
    'funny': '😂',
    'laugh': '😂',
    'smile': '😊',
    'happy': '😊',
    'joy': '🥳',
    'excited': '🤩',
    'yay': '🥳',
    'woo': '🥳',
    'great': '😄',
    'awesome': '🤩',

    // Sad / cry
    'sad': '😢',
    'cry': '😭',
    'tears': '🥲',
    'angry': '😡',
'upset': '😞',
    'heartbreak': '💔',
    'broken': '💔',

    // Angry / annoyed
    'mad bro': '😡',
    'wtf': '😬',
    'annoyed': '😠',
    'mad': '😡',
    'furious': '😡',

    // Surprise
    'wow': '😮',
    'surprised': '😲',
    'shocked': '😱',
    'omg': '😱',

    // Cool / approval
    'cool': '😎',
    'nice': '👌',
    'ok': '👌',
    'okay': '👌',
    'perfect': '👌',

    // Thanks / respect
    'thanks': '🙏',
    'thank you': '🙏',
    'thx': '🙏',
    'pls': '🙏',
    'please': '🙏',
    'sorry': '🙇',
    'apology': '🙇',

    // Greetings
    'hi': '👋',
    'hello': '👋',
    'hey': '👋',
    'good morning': '☀️',
    'morning': '☀️',
    'good night': '🌙',
    'night': '🌙',

    // Questions / confusion
    'what': '🤔',
    'why': '🤔',
    'huh': '🤔',
    'idk': '🤷',
    'dont know': '🤷',
    'confused': '🤔',

    // Food / drink (common shortcuts)
    'coffee': '☕️',
    'tea': '🫖',
    'pizza': '🍕',
    'burger': '🍔',
    'food': '🍽️',

    // Emojis for “typing vibe”
    'sleep': '😴',
    'tired': '🥱',
    'work': '💪',
    'party': '🥳',

    // General punctuation words sometimes used
    'question': '❓',
    'answer': '✅',
  };

  static final Map<String, String> _am = {
    // Love / affection (Amharic - approximate)
    'እወድ': '❤️',
    'እወድሃለሁ': '❤️',
    'እወድሻለሁ': '❤️',
    'ፍቅር': '❤️',
    'ልብ': '❤️',
    'እቅፍ': '🤗',
    'መሳሳም': '💋',

    // Laugh / happy
    'በጣም እስቂኝ': '😂',
    'እስቂኝ': '😂',
    'ሳቅ': '😂',
    'ደስታ': '🥳',
    'ደስ ይላል': '😊',
    'ተደሰት': '😊',
    'ደስተኛ': '😄',

    // Sad / cry
    'እንባ': '😭',
    'ልቅሶ': '😢',
    'ተስፋ መቁረጥ': '💔',
    'አዝናለሁ': '😞',
    'እያዘነ': '😞',
    'እስካልቻለሁ': '🥺',

    // Angry
    'ቁጣ': '😡',
    'ተበሳጭቻለሁ': '😤',
    'እተቆጣ': '😡',
    'ተናዳ': '😠',

    // Surprise
    'ዋው': '😮',
    'ተገረመኝ': '😲',
    'አስገረመ': '😲',
    'እደነቅል': '😱',

    // Cool / good
    'ጥሩ': '👌',
    'ጥቁር': '😎',
    'አይደለም': '🤔',

    // Thanks / please / sorry
    'አመሰግናለሁ': '🙏',
    'እባክህ': '🙏',
    'እባክሽ': '🙏',
    'እባክህን': '🙏',
    'ይቅርታ': '🙇',

    // Greetings
    'ሰላም': '👋',
    'ሄሎ': '👋',
    'ማለዳ': '☀️',
    'ጧት': '☀️',
    'ምሽት': '🌙',

    // Confusion / question
    'ምንድን': '🤔',
    'ለምን': '🤔',
    'አላውቅም': '🤷',
    'አልተረዳሁም': '🤔',

    // Food / drink
    'ቡና': '☕️',
    'ሻይ': '🫖',
    'ምግብ': '🍽️',
  };

  static final List<String> _emojiOrder = const [
    '❤️',
    '😂',
    '😍',
    '🥺',
    '😢',
    '😡',
    '😮',
    '👌',
    '🙏',
    '🌙',
    '☀️',
    '🤔',
    '🤷',
    '💔',
    '🤗',
    '💋',
  ];

  /// Returns up to [limit] emoji suggestions for the given [text] (current word(s)).
  static List<EmojiSuggestion> suggest(String text, {int limit = 3}) {
    final q = text.trim().toLowerCase();
    if (q.isEmpty) return const [];

    final suggestions = <EmojiSuggestion>[];

    // Prefer exact/phrase matches first.
    void addIfMatches(Map<String, String> dict) {
      dict.forEach((k, v) {
        if (q.contains(k.toLowerCase())) {
          // Slightly higher for longer keys
          final score = (k.length / 10.0) + 1.0;
          suggestions.add(EmojiSuggestion(emoji: v, score: score));
        }
      });
    }

    // English
    addIfMatches(_en);

    // Amharic (don’t lowercase aggressively)
    // We’ll check raw substring containment for each key.
    _am.forEach((k, v) {
      if (q.contains(k)) {
        final score = (k.length / 10.0) + 1.0;
        suggestions.add(EmojiSuggestion(emoji: v, score: score));
      }
    });

    if (suggestions.isEmpty) {
      // Fallback heuristics
      if (q.contains('love') || q.contains('ፍቅር')) suggestions.add(const EmojiSuggestion(emoji: '❤️', score: 0.5));
      if (q.contains('lol') || q.contains('ሳቅ') || q.contains('እስቂኝ')) suggestions.add(const EmojiSuggestion(emoji: '😂', score: 0.5));
      if (q.contains('sad') || q.contains('አዝናለሁ') || q.contains('እንባ')) suggestions.add(const EmojiSuggestion(emoji: '😢', score: 0.5));
      if (q.contains('angry') || q.contains('ቁጣ') || q.contains('ተቆጣ')) suggestions.add(const EmojiSuggestion(emoji: '😡', score: 0.5));
      if (q.contains('thanks') || q.contains('አመሰግናለሁ')) suggestions.add(const EmojiSuggestion(emoji: '🙏', score: 0.5));
    }

    // Merge duplicates by max score.
    final map = <String, EmojiSuggestion>{};
    for (final s in suggestions) {
      final existing = map[s.emoji];
      if (existing == null || s.score > existing.score) {
        map[s.emoji] = s;
      }
    }

    final merged = map.values.toList();

    // Stable sort by score desc, then by predefined emoji order.
    merged.sort((a, b) {
      final ds = b.score.compareTo(a.score);
      if (ds != 0) return ds;
      final ia = _emojiOrder.indexOf(a.emoji);
      final ib = _emojiOrder.indexOf(b.emoji);
      return ia.compareTo(ib);
    });

    return merged.take(limit).toList();
  }
}

