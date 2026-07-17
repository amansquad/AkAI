

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
  /// Word → candidate emojis, shown in the suggestion strip while typing.
  /// Keys are single lowercase tokens (the strip matches word-by-word).
  static const Map<String, List<String>> _wordEn = {
    // Emotions / reactions
    'love': ['❤️', '😍'], 'loved': ['❤️'], 'loves': ['❤️'],
    'heart': ['❤️', '💕'], 'hearts': ['💕'],
    'happy': ['😊', '🥳'], 'happiness': ['😊'],
    'sad': ['😢', '😔'], 'cry': ['😭'], 'crying': ['😭'],
    'laugh': ['😂'], 'laughing': ['😂', '🤣'],
    'lol': ['😂'], 'lmao': ['🤣'], 'haha': ['😂'], 'hehe': ['😅'],
    'funny': ['😂', '🤣'], 'joke': ['😜'], 'smile': ['😊'],
    'angry': ['😡'], 'mad': ['😡', '🤬'], 'upset': ['😞'],
    'tired': ['🥱', '😴'], 'sleep': ['😴', '🌙'], 'sleepy': ['😴'],
    'wow': ['😮', '🤯'], 'omg': ['😱'], 'shocked': ['😱'],
    'surprise': ['🎉', '😮'], 'surprised': ['😲'],
    'scared': ['😱', '😨'], 'crazy': ['🤪'], 'weird': ['🤨'],
    'cool': ['😎'], 'nice': ['👍', '😊'], 'good': ['👍', '😊'],
    'great': ['👏', '🔥'], 'awesome': ['🤩'], 'amazing': ['🤩', '✨'],
    'perfect': ['👌'], 'ok': ['👌'], 'okay': ['👌'],
    'yes': ['✅', '👍'], 'no': ['❌'], 'sure': ['👍'],
    'think': ['🤔'], 'thinking': ['🤔', '💭'],
    'why': ['🤔'], 'question': ['❓'], 'idea': ['💡'],
    'strong': ['💪'], 'fire': ['🔥'], 'lit': ['🔥'],
    'hot': ['🔥', '🥵'], 'cold': ['🥶', '❄️'],
    'sick': ['🤒', '🤧'], 'pain': ['😣'], 'hurt': ['🤕'],
    'clap': ['👏'], 'pray': ['🙏'], 'luck': ['🍀', '🤞'],
    'dead': ['💀', '😂'], 'skull': ['💀'],

    // Greetings / courtesy
    'hello': ['👋'], 'hi': ['👋'], 'hey': ['👋', '😊'],
    'bye': ['👋'], 'goodbye': ['👋', '😢'], 'welcome': ['🤗'],
    'selam': ['👋'],
    'please': ['🙏'], 'thanks': ['🙏', '😊'], 'thank': ['🙏'],
    'sorry': ['😔', '🙏'],
    'morning': ['☀️', '🌅'], 'night': ['🌙', '😴'], 'goodnight': ['🌙'],

    // Celebrations
    'congrats': ['🎉', '👏'], 'congratulations': ['🎉', '🥳'],
    'birthday': ['🎂', '🥳'], 'party': ['🥳', '🎉'],
    'celebrate': ['🎉', '🍾'], 'win': ['🏆', '🎉'], 'winner': ['🏆'],
    'gift': ['🎁'], 'christmas': ['🎄'], 'easter': ['🐣'],

    // Activities
    'dance': ['💃', '🕺'], 'music': ['🎵', '🎶'], 'sing': ['🎤'],
    'song': ['🎵'], 'movie': ['🎬', '🍿'], 'game': ['🎮'],
    'play': ['🎮', '⚽'], 'read': ['📖'], 'write': ['✍️'],
    'study': ['📚', '✍️'], 'exam': ['📝', '😰'], 'test': ['📝'],
    'homework': ['📚'], 'school': ['🏫', '📚'], 'book': ['📖'],
    'work': ['💼', '💻'], 'working': ['💻'], 'busy': ['😅', '⏰'],
    'meeting': ['📅', '💼'], 'code': ['💻'], 'coding': ['👨‍💻'],
    'gym': ['💪', '🏋️'], 'workout': ['💪', '🔥'],
    'run': ['🏃', '💨'], 'running': ['🏃'], 'walk': ['🚶'],
    'football': ['⚽'], 'soccer': ['⚽'], 'basketball': ['🏀'],
    'goal': ['⚽', '🥅'], 'ball': ['⚽'],
    'travel': ['✈️', '🧳'], 'trip': ['✈️'], 'flight': ['✈️'],
    'beach': ['🏖️'], 'swim': ['🏊'], 'shopping': ['🛍️'],

    // Food / drink
    'food': ['🍔', '🍕'], 'eat': ['🍽️', '😋'], 'hungry': ['😋', '🍔'],
    'breakfast': ['🍳', '☕'], 'lunch': ['🍱'], 'dinner': ['🍽️'],
    'pizza': ['🍕'], 'burger': ['🍔'], 'chicken': ['🍗'],
    'rice': ['🍚'], 'bread': ['🍞'], 'cake': ['🎂'],
    'coffee': ['☕'], 'buna': ['☕'], 'tea': ['🍵'],
    'beer': ['🍺'], 'wine': ['🍷'], 'water': ['💧'], 'milk': ['🥛'],
    'injera': ['🍽️'], 'egg': ['🥚'], 'apple': ['🍎'],
    'banana': ['🍌'], 'mango': ['🥭'], 'avocado': ['🥑'],
    'sweet': ['🍬', '😋'], 'delicious': ['😋', '🤤'], 'yummy': ['😋'],

    // Animals / nature
    'cat': ['🐱'], 'dog': ['🐶'], 'bird': ['🐦'], 'fish': ['🐟'],
    'lion': ['🦁'], 'horse': ['🐴'], 'cow': ['🐄'], 'goat': ['🐐'],
    'sun': ['☀️'], 'sunny': ['☀️', '😎'], 'rain': ['🌧️', '☔'],
    'raining': ['🌧️'], 'snow': ['❄️', '☃️'], 'storm': ['⛈️'],
    'weather': ['🌤️'], 'moon': ['🌙'], 'star': ['⭐', '✨'],
    'stars': ['✨'], 'flower': ['🌸', '🌹'], 'rose': ['🌹'],
    'tree': ['🌳'], 'sea': ['🌊'], 'ocean': ['🌊'], 'mountain': ['⛰️'],

    // People
    'baby': ['👶'], 'family': ['👨‍👩‍👧‍👦'], 'friend': ['🤝', '😊'],
    'friends': ['👯'], 'team': ['🤝'], 'mom': ['👩', '❤️'], 'dad': ['👨'],
    'kiss': ['💋', '😘'], 'hug': ['🤗'], 'miss': ['🥺', '💔'],

    // Things / daily life
    'phone': ['📱'], 'call': ['📞'], 'message': ['💬'],
    'email': ['📧'], 'photo': ['📷'], 'picture': ['📷'],
    'video': ['🎥'], 'camera': ['📷'], 'computer': ['💻'],
    'money': ['💰', '💵'], 'cash': ['💵'], 'pay': ['💳'],
    'buy': ['🛒'], 'car': ['🚗'], 'bus': ['🚌'], 'train': ['🚆'],
    'bike': ['🚲'], 'home': ['🏠'], 'house': ['🏠'], 'key': ['🔑'],
    'time': ['⏰'], 'late': ['⏰', '😅'], 'wait': ['⏳'],
    'waiting': ['⏳'], 'today': ['📅'], 'tomorrow': ['📅'],
    'help': ['🙏'], 'stop': ['🛑', '✋'], 'fast': ['⚡', '💨'],
    'slow': ['🐌'], 'new': ['✨'], 'warning': ['⚠️'],
    'doctor': ['👨‍⚕️'], 'hospital': ['🏥'], 'medicine': ['💊'],
  };

  /// Amharic single-word → emojis (multi-word phrases live in [_am] and are
  /// used by the free-text matcher, not the word strip).
  static const Map<String, List<String>> _wordAm = {
    'ፍቅር': ['❤️', '😍'], 'ልብ': ['❤️'],
    'ሳቅ': ['😂'], 'እስቂኝ': ['😂', '🤣'],
    'ደስታ': ['🥳', '😊'], 'ደስተኛ': ['😄'],
    'እንባ': ['😭'], 'ልቅሶ': ['😢'], 'አዝናለሁ': ['😞'],
    'ቁጣ': ['😡'], 'ተናዳ': ['😠'],
    'ዋው': ['😮'],
    'ጥሩ': ['👍', '👌'], 'እሺ': ['👌'], 'አዎ': ['✅', '👍'], 'አይ': ['❌'],
    'አመሰግናለሁ': ['🙏'], 'እባክህ': ['🙏'], 'እባክሽ': ['🙏'], 'ይቅርታ': ['🙇', '😔'],
    'ሰላም': ['👋'], 'ሄሎ': ['👋'], 'ጧት': ['☀️'], 'ማለዳ': ['☀️'], 'ምሽት': ['🌙'],
    'ለምን': ['🤔'], 'ምንድን': ['🤔'], 'አላውቅም': ['🤷'],
    'ቡና': ['☕'], 'ሻይ': ['🍵'], 'ምግብ': ['🍽️'], 'እንጀራ': ['🍽️'],
    'ውሃ': ['💧'], 'ወተት': ['🥛'],
    'ቤት': ['🏠'], 'ስራ': ['💼'], 'ትምህርት': ['📚'], 'መኪና': ['🚗'],
    'ልደት': ['🎂', '🥳'], 'እንኳን': ['🎉'],
    'ፀሐይ': ['☀️'], 'ዝናብ': ['🌧️'], 'ጨረቃ': ['🌙'], 'ኮከብ': ['⭐'],
    'ውሻ': ['🐶'], 'ድመት': ['🐱'], 'አንበሳ': ['🦁'],
    'እናት': ['👩', '❤️'], 'አባት': ['👨'], 'ጓደኛ': ['🤝', '😊'],
    'ገንዘብ': ['💰'], 'ስልክ': ['📱'], 'ሙዚቃ': ['🎵'],
    'እግር': ['⚽'], 'ኳስ': ['⚽'],
  };

  /// Emojis to suggest for a single typed word, best first.
  /// Handles case, surrounding punctuation, and simple English plurals.
  static List<String> forWord(String rawWord) {
    var word = rawWord.trim().replaceAll(
        RegExp('''^[.,!?;:'"()\\[\\]]+|[.,!?;:'"()\\[\\]]+\$'''), '');
    if (word.isEmpty) return const [];

    final am = _wordAm[word];
    if (am != null) return am;

    word = word.toLowerCase();
    var en = _wordEn[word];
    if (en == null && word.length > 3 && word.endsWith('s')) {
      en = _wordEn[word.substring(0, word.length - 1)];
    }
    return en ?? const [];
  }

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

