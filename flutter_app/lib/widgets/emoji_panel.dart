import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../app/theme/app_theme.dart';

class EmojiPanel extends StatefulWidget {
  const EmojiPanel({super.key});

  @override
  State<EmojiPanel> createState() => _EmojiPanelState();
}

class _EmojiPanelState extends State<EmojiPanel> {
  String _activeCategory = 'Recent';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  List<String> _favoriteEmojis = [];

  static const Map<String, String> _emojiKeywords = {
    '😀': 'happy smile grin joy glad',
    '😂': 'laugh lol lmao tears funny',
    '😍': 'love heart eyes crush adore',
    '🥰': 'love kiss hug warm sweet',
    '😢': 'sad cry tear unhappy upset',
    '😡': 'angry mad rage furious annoyed',
    '👍': 'thumbs up good ok approve',
    '❤️': 'love heart red romance passion',
    '🎉': 'party celebrate congrats yay',
    '🙏': 'pray thanks please namaste',
    '☕': 'coffee tea hot drink buna',
    '🔥': 'fire lit hot flame burn',
    '💪': 'strong muscle workout power',
    '✨': 'sparkle magic glitter shine new',
    '🌊': 'water wave ocean sea surf',
    '🎵': 'music note song melody tune',
    '📱': 'phone mobile call cell',
    '💻': 'computer laptop code work',
    '✈️': 'travel fly plane trip',
    '🇪🇹': 'ethiopia ethiopian habesha addis',
    '😊': 'blush smile happy pleased shy',
    '🤔': 'think hmm wonder consider',
    '😱': 'scream shock scared fear omg',
    '🥳': 'party celebrate birthday yay',
    '😭': 'cry sob weep bawling tears',
    '🤣': 'rofl lmao laugh hilarious',
    '💯': '100 perfect full score',
    '🫶': 'heart hands love appreciate',
  };

  static const Map<String, List<String>> _contextEmojiMap = {
    'love': ['❤️', '😍', '🥰', '💕', '💖', '💗', '💘', '💝', '🫶', '💋'],
    'happy': ['😊', '😄', '😁', '🥳', '🎉', '🎊', '✨', '💫', '🌟', '😃'],
    'sad': ['😢', '😭', '😞', '💔', '🥺', '😔', '😥', '😪', '😿', '😫'],
    'angry': ['😡', '😠', '🤬', '💢', '😤', '🔥', '👊', '💥', '👿', '🙈'],
    'thanks': ['🙏', '❤️', '💕', '✨', '🤝', '💯', '🌟', '🫶', '💝', '🎶'],
    'hello': ['👋', '🤗', '😊', '✨', '🙌', '🫶', '👋', '💪', '🎉', '😄'],
    'goodbye': ['👋', '🥲', '💪', '🫡', '🙌', '✨', '🌟', '💛', '🙏', '😥'],
    'food': ['🍕', '🍔', '🌮', '🍜', '🍣', '☕', '🍰', '🍩', '🍪', '🍫'],
    'party': ['🎉', '🎊', '🥳', '🍾', '🎈', '🎆', '🎇', '✨', '💫', '🕺'],
    'fire': ['🔥', '💥', '⚡', '🌟', '☄️', '✨', '💫', '🌪️'],
    'cool': ['😎', '🥳', '💯', '✌️', '🤩', '🔥', '💪', '🎶'],
    'pray': ['🙏', '✝️', '⛪', '🕊️', '💛', '✨', '💫', '🌟'],
    'music': ['🎵', '🎶', '🎤', '🎧', '🎸', '🎹', '🥁', '🎺'],
    'ethiopia': ['🇪🇹', '☕', '🦁', '🏔️', '🌍', '🎶', '🥁', '💪'],
    'amharic': ['🇪🇹', '☕', '🎶', '🥁', '🏔️', '🌍', '🦁', '🦅'],
  };

  static const Map<String, List<String>> emojiCategories = {
    'Smileys': [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😙',
      '🥲',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '😏',
      '😒',
      '🙄',
      '😬',
      '🤥',
      '😌',
      '😔',
      '😪',
      '🤤',
      '😴',
      '😷',
      '🤒',
      '🤕',
      '🤢',
      '🤮',
      '🤧',
      '🥵',
      '🥶',
      '🥴',
      '😵',
      '🤯',
      '🤠',
      '🥳',
      '😎',
      '🤓',
      '🧐',
      '😕',
      '😟',
      '🙁',
      '☹️',
      '😮',
      '😯',
      '😲',
      '😳',
      '🥺',
      '😦',
      '😧',
      '😨',
      '😰',
      '😥',
      '😢',
      '😭',
      '😱',
      '😖',
      '😣',
      '😞',
      '😓',
      '😩',
      '😫',
      '🥱',
      '😤',
      '😡',
      '😠',
      '🤬',
    ],
    'Gestures': [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '👐',
      '🤲',
      '🤝',
      '✍️',
      '🤳',
      '💅',
      '🙏',
      '🦾',
      '🦿',
      '🦵',
      '🦶',
      '👂',
      '🦻',
      '👃',
      '🧠',
      '🫀',
      '🫁',
      '🦷',
      '🦴',
      '👀',
      '👁️',
      '👅',
      '👄',
    ],
    'Hearts': [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❤️‍🔥',
      '❤️‍🩹',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '💌',
      '💍',
      '💎',
      '🫂',
      '💋',
      '💏',
      '💑',
      '🌹',
      '🌷',
    ],
    'Animals': [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🦆',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🐛',
      '🦋',
      '🐙',
      '🦑',
      '🦐',
      '🦀',
      '🐡',
      '🐠',
      '🐟',
      '🐬',
      '🐳',
      '🐋',
      '🦈',
      '🐊',
      '🐅',
      '🐆',
      '🦓',
      '🦍',
      '🦧',
      '🦣',
      '🐘',
      '🦛',
    ],
    'Nature': [
      '🌵',
      '🎄',
      '🌲',
      '🌳',
      '🌴',
      '🌱',
      '🌿',
      '☘️',
      '🍀',
      '🎍',
      '🎋',
      '🍃',
      '🍂',
      '🍁',
      '🍄',
      '🐚',
      '🌾',
      '💐',
      '🌷',
      '🌹',
      '🥀',
      '🌺',
      '🌸',
      '🌼',
      '🌻',
      '🌞',
      '🌝',
      '🌛',
      '🌜',
      '🌚',
      '🌕',
      '🌖',
      '🌗',
      '🌘',
      '🌑',
      '🌒',
      '🌓',
      '🌔',
      '🌙',
      '🌎',
      '🌍',
      '🌏',
      '🪐',
      '💫',
      '⭐️',
      '🌟',
      '✨',
      '⚡️',
      '☄️',
      '💥',
      '🔥',
      '🌪️',
      '🌈',
      '☀️',
      '🌤️',
      '⛅️',
      '🌥️',
      '☁️',
      '🌦️',
      '🌧️',
    ],
    'Food': [
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🫐',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🍆',
      '🥑',
      '🥦',
      '🥬',
      '🥒',
      '🌶️',
      '🫑',
      '🌽',
      '🥕',
      '🧄',
      '🧅',
      '🥔',
      '🍠',
      '🥐',
      '🥯',
      '🍞',
      '🥖',
      '🥨',
      '🧀',
      '🥚',
      '🍳',
      '🧈',
      '🥞',
      '🧇',
      '🥓',
      '🥩',
      '🍗',
      '🍖',
      '🦴',
      '🌭',
      '🍔',
      '🍟',
      '🍕',
      '🌮',
      '🌯',
      '🫔',
      '🥙',
      '🧆',
      '🥘',
      '🍲',
      '🥣',
      '🥗',
      '🍿',
    ],
    'Travel': [
      '🚗',
      '🚕',
      '🚙',
      '🚌',
      '🚎',
      '🏎️',
      '🚓',
      '🚑',
      '🚒',
      '🚐',
      '🛻',
      '🚚',
      '🚛',
      '🚜',
      '🏍️',
      '🛵',
      '🚲',
      '🛴',
      '🛺',
      '🚔',
      '🚍',
      '🚘',
      '🚖',
      '🚡',
      '🚠',
      '🚟',
      '🚃',
      '🚋',
      '🚞',
      '🚝',
      '🚁',
      '🛸',
      '🚀',
      '🛰️',
      '⛵️',
      '🛶',
      '🚤',
      '🛳️',
      '⛴️',
      '🚢',
      '⚓️',
      '🚧',
      '⛽️',
      '🚏',
      '🗺️',
      '🗿',
      '🗽',
      '🗼',
      '🕍',
      '🕌',
      '⛪️',
      '⛩️',
      '🏬',
      '🏰',
      '🏯',
      '🏟️',
      '🎡',
      '🎢',
      '🎠',
      '🎢',
    ],
    'Flags': [
      '🇪🇹',
      '🇺🇸',
      '🇬🇧',
      '🇨🇳',
      '🇯🇵',
      '🇩🇪',
      '🇫🇷',
      '🇮🇹',
      '🇷🇺',
      '🇰🇷',
      '🇮🇳',
      '🇧🇷',
      '🇿🇦',
      '🇰🇪',
      '🇳🇬',
      '🇪🇬',
      '🇸🇦',
      '🇦🇪',
      '🇨🇦',
      '🇲🇽',
      '🇦🇺',
      '🇮🇱',
      '🇹🇷',
      '🏳️',
      '🏴',
      '🏁',
      '🚩',
      '⚧️',
      '🏳️‍🌈',
      '🏳️‍⚧️',
    ],
  };

  List<String> _getContextSuggestions(String text) {
    if (text.length < 2) return [];
    final words = text.toLowerCase().split(RegExp(r'\s+'));
    final lastWord = words.isNotEmpty ? words.last : '';
    final prevWord = words.length >= 2 ? words[words.length - 2] : '';
    final bigram = '$prevWord $lastWord';

    final suggestions = <String>[];
    for (final entry in _contextEmojiMap.entries) {
      if (entry.key.contains(bigram) || bigram.contains(entry.key)) {
        suggestions.addAll(entry.value.take(3));
      } else if (entry.key.contains(lastWord) || lastWord.contains(entry.key)) {
        suggestions.addAll(entry.value.take(2));
      }
    }
    return suggestions.toSet().take(8).toList();
  }

  List<String> _searchEmojis(String query) {
    if (query.isEmpty) return [];
    final q = query.toLowerCase();
    final results = <String>[];

    for (final entry in emojiCategories.entries) {
      for (final emoji in entry.value) {
        final keywords = _emojiKeywords[emoji] ?? '';
        if (keywords.toLowerCase().contains(q) || emoji.contains(query)) {
          results.add(emoji);
        }
      }
    }
    return results.toSet().toList();
  }

  void _toggleFavorite(String emoji) {
    setState(() {
      if (_favoriteEmojis.contains(emoji)) {
        _favoriteEmojis.remove(emoji);
      } else {
        _favoriteEmojis.insert(0, emoji);
        if (_favoriteEmojis.length > 30)
          _favoriteEmojis = _favoriteEmojis.sublist(0, 30);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<KeyboardProvider>();
    final theme = context.watch<ThemeProvider>().currentTheme;
    final contextSuggestions = _getContextSuggestions(provider.text);
    final isSearching = _searchQuery.isNotEmpty;

    List<String> displayEmojis;
    if (isSearching) {
      displayEmojis = _searchEmojis(_searchQuery);
    } else if (_activeCategory == 'Recent') {
      displayEmojis = provider.recentEmojis;
    } else if (_activeCategory == 'Favorites') {
      displayEmojis = _favoriteEmojis;
    } else {
      displayEmojis = emojiCategories[_activeCategory] ?? [];
    }

    return Container(
      height: 340,
      color: theme.background,
      child: Column(children: [
        // Predictive emoji bar
        if (contextSuggestions.isNotEmpty)
          Container(
            height: 42,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: theme.surface.withValues(alpha: 0.15),
              border: Border(
                  bottom:
                      BorderSide(color: theme.accent.withValues(alpha: 0.1))),
            ),
            child: Row(children: [
              Text('Suggest',
                  style: TextStyle(
                      color: theme.keySecondaryText.withValues(alpha: 0.5),
                      fontSize: 9,
                      fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              Expanded(
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: contextSuggestions.length,
                  itemBuilder: (ctx, i) {
                    final emoji = contextSuggestions[i];
                    return GestureDetector(
                      onTap: () {
                        provider.appendText(emoji);
                        provider.addEmojiToRecent(emoji);
                      },
                      child: Container(
                        width: 32,
                        height: 32,
                        margin: const EdgeInsets.only(right: 4),
                        alignment: Alignment.center,
                        child:
                            Text(emoji, style: const TextStyle(fontSize: 22)),
                      ),
                    );
                  },
                ),
              ),
            ]),
          ),

        // Search bar
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Container(
            height: 34,
            decoration: BoxDecoration(
              color: theme.surface.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(17),
            ),
            child: Row(children: [
              const SizedBox(width: 10),
              Icon(Icons.search,
                  color: theme.accent.withValues(alpha: 0.5), size: 16),
              const SizedBox(width: 6),
              Expanded(
                child: TextField(
                  controller: _searchController,
                  onChanged: (v) => setState(() => _searchQuery = v),
                  style: TextStyle(color: theme.keyText, fontSize: 12),
                  textAlignVertical: TextAlignVertical.center,
                  decoration: InputDecoration(
                    hintText: 'Search emojis...',
                    hintStyle: TextStyle(
                        color: theme.keySecondaryText.withValues(alpha: 0.5),
                        fontSize: 12),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                ),
              ),
              if (_searchQuery.isNotEmpty)
                GestureDetector(
                  onTap: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Icon(Icons.close,
                        size: 14, color: theme.keySecondaryText),
                  ),
                ),
            ]),
          ),
        ),

        // Category tabs
        if (!isSearching)
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              children: [
                _categoryTab('Recent', theme, Icons.history_rounded),
                if (_favoriteEmojis.isNotEmpty)
                  _categoryTab('Favorites', theme, Icons.star_rounded),
                ...emojiCategories.keys
                    .map((cat) => _categoryTab(cat, theme, null)),
              ],
            ),
          ),

        const SizedBox(height: 4),

        // Emoji grid
        Expanded(
          child: displayEmojis.isEmpty
              ? Center(
                  child: Text(
                    _searchQuery.isNotEmpty
                        ? 'No emojis found'
                        : (_activeCategory == 'Recent'
                            ? 'No recent emojis yet'
                            : 'No favorites yet'),
                    style: TextStyle(
                        color: theme.keySecondaryText.withValues(alpha: 0.5),
                        fontSize: 12),
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(6),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 7,
                    crossAxisSpacing: 2,
                    mainAxisSpacing: 2,
                  ),
                  itemCount: displayEmojis.length,
                  itemBuilder: (ctx, i) {
                    final emoji = displayEmojis[i];
                    final isFav = _favoriteEmojis.contains(emoji);
                    return GestureDetector(
                      onTap: () {
                        provider.appendText(emoji);
                        provider.addEmojiToRecent(emoji);
                      },
                      onLongPress: () => _toggleFavorite(emoji),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              color: theme.key.withValues(alpha: 0.4),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            alignment: Alignment.center,
                            child: Text(emoji,
                                style: const TextStyle(fontSize: 22)),
                          ),
                          if (isFav)
                            Positioned(
                              top: 1,
                              right: 1,
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: Colors.amber,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: theme.background, width: 1),
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ]),
    );
  }

  Widget _categoryTab(String category, AkaiPalette theme, IconData? icon) {
    final isActive = _activeCategory == category;
    return GestureDetector(
      onTap: () => setState(() => _activeCategory = category),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        margin: const EdgeInsets.only(right: 2),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border(
              bottom: BorderSide(
                  color: isActive ? theme.accent : Colors.transparent,
                  width: 2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon,
                  size: 14,
                  color: isActive ? theme.accent : theme.keySecondaryText),
              const SizedBox(width: 3),
            ],
            Text(
              category,
              style: TextStyle(
                color: isActive ? theme.accent : theme.keySecondaryText,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
