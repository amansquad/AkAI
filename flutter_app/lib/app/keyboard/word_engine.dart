class WordSuggestionEngine {
  static const List<String> _commonWords = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'hello', 'how', 'are', 'yes', 'no', 'please', 'thanks', 'thank', 'sorry', 'love',
    'haha', 'okay', 'great', 'awesome', 'good', 'morning', 'night', 'today', 'tomorrow',
  ];

  static List<String> suggest(String typedContext, {int limit = 5}) {
    // Basic extraction of the last typed word
    if (typedContext.isEmpty) return ['the', 'I', 'and', 'we', 'to'];

    final parts = typedContext.split(RegExp(r'\s+'));
    final lastWord = parts.isNotEmpty ? parts.last.toLowerCase() : '';

    if (lastWord.isEmpty) {
      if (parts.length > 1) {
        final prev = parts[parts.length - 2].toLowerCase();
        if (prev == 'how') return ['are', 'is', 'to'];
        if (prev == 'i') return ['am', 'have', 'will', 'was', 'love'];
        if (prev == 'you') return ['are', 'can', 'will'];
        if (prev == 'thank') return ['you', 'u', 'yous'];
        if (prev == 'let') return ['me', 'us'];
      }
      return ['the', 'to', 'and', 'a', 'is'];
    }

    final matches = _commonWords.where((w) {
      final lw = w.toLowerCase();
      // Match starts with the typed word, but is not EXACTLY the typed word
      // (Unless we have no other suggestions).
      return lw.startsWith(lastWord) && lw.length >= lastWord.length;
    }).toList();

    // Sort by exact match? Or length so shortest words come first.
    matches.sort((a, b) => a.length.compareTo(b.length));

    // If no matches found, offer generic continuations
    if (matches.isEmpty) {
      return ['is', 'the', 'to', 'and', 'for'];
    }

    return matches.take(limit).toList();
  }
}
