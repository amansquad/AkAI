import 'package:flutter/material.dart';

import '../emoji/emoji_suggestions.dart';
import '../settings/settings_provider.dart';
import '../theme/app_theme.dart';
import 'gif/gif_picker.dart';
import 'keyboard_controller.dart';

/// Callback type used to request opening the Settings screen from within the
/// keyboard (the keyboard itself cannot navigate, so the host must handle it).
typedef OnOpenSettings = void Function();

class EmojiGifKeyboardBar extends StatefulWidget {
  final AkaiPalette palette;
  final AkaiSettingsProvider settings;
  final AkaiKeyboardController controller;

  /// Optional callback invoked when the user taps "Set" in the toolbar.
  final OnOpenSettings? onOpenSettings;

  const EmojiGifKeyboardBar({
    super.key,
    required this.palette,
    required this.settings,
    required this.controller,
    this.onOpenSettings,
  });

  @override
  State<EmojiGifKeyboardBar> createState() => _EmojiGifKeyboardBarState();
}

class _EmojiGifKeyboardBarState extends State<EmojiGifKeyboardBar> {
  bool _showGifPicker = false;
  String _typedBuffer = '';
  List<EmojiSuggestion> _suggestions = const [];

  void _onTapGifToggle() {
    setState(() {
      _showGifPicker = !_showGifPicker;
    });
  }

  Future<void> _commitSuggestion(EmojiSuggestion s) async {
    setState(() => _typedBuffer = '');
    await widget.controller.service.commitText(s.emoji);
  }

  Future<void> _refreshTypedContext() async {
    final cursor = await widget.controller.service.getCursorContext();
    final before = cursor?['textBefore'] ?? '';
    _typedBuffer =
        before.length <= 50 ? before : before.substring(before.length - 50);
    setState(() {
      _suggestions = EmojiSuggestionEngine.suggest(_typedBuffer, limit: 3);
    });
  }

  @override
  void initState() {
    super.initState();
    widget.controller.service.editorStream.listen((_) {
      _refreshTypedContext();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.settings.showSuggestions) {
      return const SizedBox(height: 4);
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _GBoardToolbar(
          palette: widget.palette,
          controller: widget.controller,
          suggestions: _suggestions,
          onCommitSuggestion: _commitSuggestion,
          onGifToggle: _onTapGifToggle,
          onOpenSettings: widget.onOpenSettings,
        ),
        if (_showGifPicker)
          GifPicker(
            palette: widget.palette,
            onGifSelected: (gifUrl) async {
              await widget.controller.service.commitText(gifUrl);
            },
          ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GBoard-style dual-section toolbar
// ─────────────────────────────────────────────────────────────────────────────

class _GBoardToolbar extends StatelessWidget {
  final AkaiPalette palette;
  final AkaiKeyboardController controller;
  final List<EmojiSuggestion> suggestions;
  final ValueChanged<EmojiSuggestion> onCommitSuggestion;
  final VoidCallback onGifToggle;
  final OnOpenSettings? onOpenSettings;

  const _GBoardToolbar({
    required this.palette,
    required this.controller,
    required this.suggestions,
    required this.onCommitSuggestion,
    required this.onGifToggle,
    this.onOpenSettings,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: Row(
        children: [
          // ── Left: horizontally scrollable icon buttons ──────────────────
          Expanded(
            child: ListView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 2),
              children: [
                // ABC → switch keyboard / change language
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.keyboard_alt_outlined,
                  label: 'ABC',
                  highlighted: true,
                  onTap: () => controller.switchKeyboard(),
                ),
                // Stickers / Emoji
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.emoji_emotions_outlined,
                  label: 'Stickers',
                  onTap: () {
                    // Emoji picker via suggestion bar below — no-op here
                  },
                ),
                // GIFs
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.gif_box_outlined,
                  label: 'GIFs',
                  onTap: onGifToggle,
                ),
                // Clipboard
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.content_paste_outlined,
                  label: 'Clip',
                  onTap: () {},
                ),
                // AI suggestions area (displayed inline; button is shortcut)
                _ToolbarSuggestionsOrAI(
                  palette: palette,
                  suggestions: suggestions,
                  onCommit: onCommitSuggestion,
                ),
                // Draw (future)
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.draw_outlined,
                  label: 'Draw',
                  onTap: () {},
                ),
                // Settings
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.tune_rounded,
                  label: 'Set',
                  onTap: () => onOpenSettings?.call(),
                ),
              ],
            ),
          ),

          // ── Divider ─────────────────────────────────────────────────────
          Container(
            width: 0.5,
            height: 28,
            color: palette.surfaceVariant,
            margin: const EdgeInsets.symmetric(horizontal: 4),
          ),

          // ── Right: fixed action icons ────────────────────────────────────
          _ToolbarIconButton(
            palette: palette,
            icon: Icons.palette_outlined,
            label: '',
            onTap: () {},
          ),
          _ToolbarIconButton(
            palette: palette,
            icon: Icons.hide_image_outlined,
            label: '',
            onTap: () async {
              await controller.service.hideKeyboard();
            },
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single icon + label button in the toolbar
// ─────────────────────────────────────────────────────────────────────────────

class _ToolbarIconButton extends StatelessWidget {
  final AkaiPalette palette;
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool highlighted;

  const _ToolbarIconButton({
    required this.palette,
    required this.icon,
    required this.label,
    required this.onTap,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    final iconColor =
        highlighted ? palette.accent : palette.keySecondaryText;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 22, color: iconColor),
            if (label.isNotEmpty) ...[
              const SizedBox(height: 1),
              Text(
                label,
                style: TextStyle(
                  fontSize: 9,
                  color: iconColor,
                  fontWeight:
                      highlighted ? FontWeight.w700 : FontWeight.w500,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline AI / emoji suggestion chip area (sits between Clip and Draw)
// ─────────────────────────────────────────────────────────────────────────────

class _ToolbarSuggestionsOrAI extends StatelessWidget {
  final AkaiPalette palette;
  final List<EmojiSuggestion> suggestions;
  final ValueChanged<EmojiSuggestion> onCommit;

  const _ToolbarSuggestionsOrAI({
    required this.palette,
    required this.suggestions,
    required this.onCommit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.center,
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: suggestions.isEmpty
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.auto_awesome_rounded,
                    size: 15, color: palette.accent),
                const SizedBox(width: 4),
                Text(
                  'AI',
                  style: TextStyle(
                    fontSize: 9,
                    color: palette.accent,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            )
          : Row(
              mainAxisSize: MainAxisSize.min,
              children: suggestions.map((s) {
                return GestureDetector(
                  onTap: () => onCommit(s),
                  child: Container(
                    margin: const EdgeInsets.only(right: 4),
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: palette.accent.withOpacity(0.14),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(s.emoji,
                          style: const TextStyle(fontSize: 16)),
                    ),
                  ),
                );
              }).toList(),
            ),
    );
  }
}

