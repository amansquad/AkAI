import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class EmojiPicker extends StatefulWidget {
  final AkaiPalette palette;
  final Function(String) onEmojiSelected;

  const EmojiPicker({
    super.key,
    required this.palette,
    required this.onEmojiSelected,
  });

  @override
  State<EmojiPicker> createState() => _EmojiPickerState();
}

class _EmojiPickerState extends State<EmojiPicker> {
  late TextEditingController _searchController;
  late List<String> _filteredEmojis;
  int _selectedCategory = 0;

  final Map<int, List<String>> _emojiCategories = {
    0: _smileys,
    1: _gestures,
    2: _hearts,
    3: _animals,
    4: _food,
    5: _activities,
    6: _travel,
    7: _objects,
  };

  static const _smileys = [
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
    '🫡',
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
    '🥵',
    '🥶',
    '🥴',
    '😵',
    '🤯',
    '🤠',
    '🥳',
    '🥸',
    '😎',
    '🤓',
    '🧐',
    '😕',
    '😟',
    '🙁',
    '😮',
    '😯',
    '😲',
    '😳',
    '🥺',
    '🥹',
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
    '😈',
    '👿',
    '💀',
    '☠️',
    '💩',
  ];

  static const _gestures = [
    '👋',
    '🤚',
    '🖐️',
    '✋',
    '🖖',
    '🫱',
    '🫲',
    '🫳',
    '🫴',
    '👌',
    '🤌',
    '🤏',
    '✌️',
    '🤞',
    '🫰',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '🖕',
    '👇',
    '☝️',
    '🫵',
    '👍',
    '👎',
    '✊',
    '👊',
    '🤛',
    '🤜',
    '👏',
    '🙌',
    '🫶',
    '👐',
    '🤲',
    '🤝',
    '🙏',
    '✍️',
    '💪',
  ];

  static const _hearts = [
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
    '♥️',
    '💋',
    '💌',
  ];

  static const _animals = [
    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐻‍❄️',
    '🐨',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐸',
    '🐵',
    '🙈',
    '🙉',
    '🙊',
    '🐒',
    '🐔',
    '🐧',
    '🐦',
    '🐤',
    '🐣',
    '🐥',
    '🦆',
    '🦅',
    '🦉',
    '🦇',
    '🐺',
    '🐗',
  ];

  static const _food = [
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
    '🥑',
    '🍆',
    '🥔',
    '🥕',
    '🌽',
    '🌶️',
    '🫑',
    '🥒',
    '🥬',
    '🥦',
    '🧄',
    '🧅',
    '🍄',
    '🥜',
    '🫘',
  ];

  static const _activities = [
    '⚽',
    '🏀',
    '🏈',
    '⚾',
    '🥎',
    '🎾',
    '🏐',
    '🏉',
    '🥏',
    '🎱',
    '🪀',
    '🏓',
    '🏸',
    '🏒',
    '🏑',
    '🥍',
    '🏏',
    '🪃',
    '🥅',
    '⛳',
    '🪁',
    '🏹',
    '🎣',
    '🤿',
    '🥊',
    '🥋',
    '🎽',
    '🛹',
    '🛼',
    '🛷',
    '⛸️',
    '🥌',
  ];

  static const _travel = [
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
    '🛵',
    '🏍️',
    '🛺',
    '🚲',
    '🛴',
    '🛹',
    '🛼',
    '🚏',
    '🛣️',
    '🛤️',
    '✈️',
    '🛫',
    '🛬',
    '🛩️',
    '💺',
    '🛰️',
    '🚀',
    '🛸',
  ];

  static const _objects = [
    '⌚',
    '📱',
    '📲',
    '💻',
    '⌨️',
    '🖥️',
    '🖨️',
    '🖱️',
    '🖲️',
    '🕹️',
    '🗜️',
    '💽',
    '💾',
    '💿',
    '📀',
    '📼',
    '📷',
    '📸',
    '📹',
    '🎥',
    '📽️',
    '🎞️',
    '📞',
    '☎️',
    '📟',
    '📠',
    '📺',
    '📻',
    '🎙️',
    '🎚️',
    '🎛️',
    '🧭',
  ];

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _filteredEmojis = _emojiCategories[0]!;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filterEmojis(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredEmojis = _emojiCategories[_selectedCategory]!;
      } else {
        _filteredEmojis = _emojiCategories.values
            .expand((emojis) => emojis)
            .where((emoji) => emoji.contains(query))
            .toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 320,
      decoration: BoxDecoration(
        color: widget.palette.surface,
        border: Border(
          top: BorderSide(color: widget.palette.surfaceVariant, width: 0.5),
        ),
      ),
      child: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              controller: _searchController,
              onChanged: _filterEmojis,
              style: TextStyle(color: widget.palette.keyText),
              decoration: InputDecoration(
                hintText: 'Search emojis...',
                hintStyle: TextStyle(color: widget.palette.keySecondaryText),
                prefixIcon:
                    Icon(Icons.search, color: widget.palette.keySecondaryText),
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

          // Category tabs
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              children: [
                _CategoryTab(
                  emoji: '😀',
                  isSelected: _selectedCategory == 0,
                  onTap: () => _selectCategory(0),
                  palette: widget.palette,
                ),
                _CategoryTab(
                  emoji: '👋',
                  isSelected: _selectedCategory == 1,
                  onTap: () => _selectCategory(1),
                  palette: widget.palette,
                ),
                _CategoryTab(
                  emoji: '❤️',
                  isSelected: _selectedCategory == 2,
                  onTap: () => _selectCategory(2),
                  palette: widget.palette,
                ),
                _CategoryTab(
                  emoji: '🐶',
                  isSelected: _selectedCategory == 3,
                  onTap: () => _selectCategory(3),
                  palette: widget.palette,
                ),
                _CategoryTab(
                  emoji: '🍎',
                  isSelected: _selectedCategory == 4,
                  onTap: () => _selectCategory(4),
                  palette: widget.palette,
                ),
                _CategoryTab(
                  emoji: '⚽',
                  isSelected: _selectedCategory == 5,
                  onTap: () => _selectCategory(5),
                  palette: widget.palette,
                ),
                _CategoryTab(
                  emoji: '✈️',
                  isSelected: _selectedCategory == 6,
                  onTap: () => _selectCategory(6),
                  palette: widget.palette,
                ),
                _CategoryTab(
                  emoji: '💻',
                  isSelected: _selectedCategory == 7,
                  onTap: () => _selectCategory(7),
                  palette: widget.palette,
                ),
              ],
            ),
          ),

          // Emoji grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(8),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 8,
                mainAxisSpacing: 4,
                crossAxisSpacing: 4,
              ),
              itemCount: _filteredEmojis.length,
              itemBuilder: (context, index) {
                final emoji = _filteredEmojis[index];
                return GestureDetector(
                  onTap: () => widget.onEmojiSelected(emoji),
                  child: Container(
                    decoration: BoxDecoration(
                      color: widget.palette.surfaceVariant.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        emoji,
                        style: const TextStyle(fontSize: 24),
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

  void _selectCategory(int index) {
    setState(() {
      _selectedCategory = index;
      _searchController.clear();
      _filteredEmojis = _emojiCategories[index]!;
    });
  }
}

class _CategoryTab extends StatelessWidget {
  final String emoji;
  final bool isSelected;
  final VoidCallback onTap;
  final AkaiPalette palette;

  const _CategoryTab({
    required this.emoji,
    required this.isSelected,
    required this.onTap,
    required this.palette,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color:
              isSelected ? palette.accent.withValues(alpha: 0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: isSelected
              ? Border.all(color: palette.accent.withValues(alpha: 0.5))
              : null,
        ),
        child: Center(
          child: Text(emoji, style: const TextStyle(fontSize: 20)),
        ),
      ),
    );
  }
}
