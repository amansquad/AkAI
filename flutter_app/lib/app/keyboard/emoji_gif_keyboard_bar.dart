import 'dart:async';
import 'package:flutter/material.dart';

import '../emoji/emoji_suggestions.dart';
import '../settings/settings_provider.dart';
import '../theme/app_theme.dart';
import 'gif/gif_picker.dart';
import 'gif/gif_picker.dart';
import 'keyboard_controller.dart';
import 'word_engine.dart';

/// Callback type used to request opening the Settings screen from within the
/// keyboard (the keyboard itself cannot navigate, so the host must handle it).
typedef OnOpenSettings = void Function();

class EmojiGifKeyboardBar extends StatefulWidget {
  final AkaiPalette palette;
  final AkaiSettingsProvider settings;
  final AkaiKeyboardController controller;
  final VoidCallback? onEmojiToggle;
  final VoidCallback? onGifToggle;
  final VoidCallback? onStickerToggle;
  final VoidCallback? onAiToggle;
  final VoidCallback? onThemeToggle;
  final OnOpenSettings? onOpenSettings;

  const EmojiGifKeyboardBar({
    super.key,
    required this.palette,
    required this.settings,
    required this.controller,
    this.onEmojiToggle,
    this.onGifToggle,
    this.onStickerToggle,
    this.onAiToggle,
    this.onThemeToggle,
    this.onOpenSettings,
  });

  @override
  State<EmojiGifKeyboardBar> createState() => _EmojiGifKeyboardBarState();
}

class _EmojiGifKeyboardBarState extends State<EmojiGifKeyboardBar> {
  String _typedBuffer = '';
  List<EmojiSuggestion> _emojiSuggestions = const [];
  List<String> _wordSuggestions = const [];
  Timer? _debounceTimer;

  void _onTapGifToggle() {
    if (widget.controller.mode == KeyboardMode.gif) {
      widget.controller.setMode(KeyboardMode.letters);
    } else {
      widget.controller.setMode(KeyboardMode.gif);
    }
  }

  void _onTapEmojiToggle() {
    if (widget.controller.mode == KeyboardMode.emoji) {
      widget.controller.setMode(KeyboardMode.letters);
    } else {
      widget.controller.setMode(KeyboardMode.emoji);
    }
  }

  Future<void> _commitEmojiSuggestion(EmojiSuggestion s) async {
    setState(() => _typedBuffer = '');
    await widget.controller.service.commitText(s.emoji);
  }

  Future<void> _commitWordSuggestion(String word) async {
    final parts = _typedBuffer.split(RegExp(r'\s+'));
    final lastTyped = parts.isNotEmpty ? parts.last : '';
    
    if (lastTyped.isNotEmpty) {
      // Delete the partial word
      await widget.controller.service.deleteText(lastTyped.length);
    }
    
    // Commit the full word and a space
    await widget.controller.service.commitText('$word ');
    setState(() => _typedBuffer = '');
    _refreshTypedContext();
  }

  Future<void> _refreshTypedContext() async {
    if (!widget.controller.service.isImeAttached) return;
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 150), () async {
      if (!mounted) return;
      try {
        final cursor = await widget.controller.service.getCursorContext();
        final before = cursor?['textBefore'] ?? '';
        _typedBuffer =
            before.length <= 50 ? before : before.substring(before.length - 50);
        if (mounted) {
          setState(() {
            _emojiSuggestions = EmojiSuggestionEngine.suggest(_typedBuffer, limit: 2);
            _wordSuggestions = WordSuggestionEngine.suggest(_typedBuffer, limit: 3);
          });
        }
      } catch (_) {
        // IME not ready yet — ignore and wait for next cycle
      }
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    widget.controller.removeListener(_refreshTypedContext);
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant EmojiGifKeyboardBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Trigger a refresh if the controller instance changes.
    if (oldWidget.controller != widget.controller) {
      _refreshTypedContext();
    }
  }


  @override
  void initState() {
    super.initState();
    // Only refresh on editorStream (inputStart) — IME is attached at this point
    widget.controller.service.editorStream.listen((_) {
      _refreshTypedContext();
    });
    widget.controller.service.selectionStream.listen((_) {
      _refreshTypedContext();
    });
    widget.controller.addListener(_refreshTypedContext);
    // Do NOT call _refreshTypedContext() immediately — IME is not attached yet
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.settings.showSuggestions)
          _TopSuggestionBar(
            palette: widget.palette,
            wordSuggestions: _wordSuggestions,
            emojiSuggestions: _emojiSuggestions,
            onCommitWo: _commitWordSuggestion,
            onCommitEm: _commitEmojiSuggestion,
          ),
        _GBoardToolbar(
          palette: widget.palette,
          controller: widget.controller,
          onEmojiToggle: _onTapEmojiToggle,
          onGifToggle: _onTapGifToggle,
          onStickerToggle: widget.onStickerToggle,
          onAiToggle: widget.onAiToggle,
          onThemeToggle: widget.onThemeToggle,
          onOpenSettings: widget.onOpenSettings,
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
  final VoidCallback? onEmojiToggle;
  final VoidCallback onGifToggle;
  final VoidCallback? onStickerToggle;
  final VoidCallback? onAiToggle;
  final VoidCallback? onThemeToggle;
  final OnOpenSettings? onOpenSettings;

  const _GBoardToolbar({
    required this.palette,
    required this.controller,
    this.onEmojiToggle,
    required this.onGifToggle,
    this.onStickerToggle,
    this.onAiToggle,
    this.onThemeToggle,
    this.onOpenSettings,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: Row(
        children: [
          // ── Left: ABC button (always visible, solid accent) ─────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 7),
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => controller.setMode(KeyboardMode.letters),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: palette.accent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'ABC',
                  style: TextStyle(
                    color: palette.background,
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ),

          // ── Middle: scrollable icon buttons ──────────────────────────────────
          Expanded(
            child: ListView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 2),
              children: [
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.emoji_emotions_outlined,
                  label: 'Emoji',
                  active: controller.mode == KeyboardMode.emoji,
                  onTap: onEmojiToggle ?? () {},
                ),
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.gif_box_outlined,
                  label: 'GIFs',
                  active: controller.mode == KeyboardMode.gif,
                  onTap: onGifToggle,
                ),
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.sticky_note_2_outlined,
                  label: 'Stickers',
                  active: controller.mode == KeyboardMode.stickers,
                  onTap: onStickerToggle ?? () {},
                ),
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.translate_outlined,
                  label: 'Translate',
                  active: controller.mode == KeyboardMode.ai,
                  onTap: onAiToggle ?? () {},
                ),
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.palette_outlined,
                  label: 'Themes',
                  active: controller.mode == KeyboardMode.themes,
                  onTap: onThemeToggle ?? () {},
                ),
                _ToolbarIconButton(
                  palette: palette,
                  icon: Icons.settings_rounded,
                  label: 'Settings',
                  active: false,
                  onTap: () => onOpenSettings?.call(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single icon + label middle toolbar button
// ─────────────────────────────────────────────────────────────────────────────

class _ToolbarIconButton extends StatelessWidget {
  final AkaiPalette palette;
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _ToolbarIconButton({
    required this.palette,
    required this.icon,
    required this.label,
    this.active = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: active
                    ? palette.accent.withOpacity(0.18)
                    : palette.surface.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon,
                  size: 20,
                  color: active ? palette.accent : palette.keySecondaryText),
            ),
            if (label.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10,
                  color: active ? palette.accent : palette.keySecondaryText,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      ),    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Circular right-side action icon (with translucent ring background)
// ─────────────────────────────────────────────────────────────────────────────

class _CircularActionButton extends StatelessWidget {
  final AkaiPalette palette;
  final IconData icon;
  final VoidCallback onTap;

  const _CircularActionButton({
    required this.palette,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        margin: const EdgeInsets.symmetric(horizontal: 3, vertical: 6),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: palette.surfaceVariant.withOpacity(0.3),
        ),
        child: Icon(icon, size: 18, color: palette.keySecondaryText),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dedicated Top Suggestion Bar (Pill Chips)
// ─────────────────────────────────────────────────────────────────────────────

class _TopSuggestionBar extends StatelessWidget {
  final AkaiPalette palette;

  final List<String> wordSuggestions;
  final List<EmojiSuggestion> emojiSuggestions;
  final ValueChanged<String> onCommitWo;
  final ValueChanged<EmojiSuggestion> onCommitEm;

  const _TopSuggestionBar({
    required this.palette,
    required this.wordSuggestions,
    required this.emojiSuggestions,
    required this.onCommitWo,
    required this.onCommitEm,
  });

  @override
  Widget build(BuildContext context) {
    List<Widget> items = [];

    // Prioritize emojis if available
    for (var e in emojiSuggestions) {
      items.add(_buildChip(
        e.emoji,
        isEmoji: true,
        onTap: () => onCommitEm(e),
      ));
    }

    // Add word suggestions up to row limits
    final totalMax = 4;
    int wordsAdded = 0;
    while (items.length < totalMax && wordsAdded < wordSuggestions.length) {
      final w = wordSuggestions[wordsAdded];
      items.add(_buildChip(
        w,
        isEmoji: false,
        onTap: () => onCommitWo(w),
      ));
      wordsAdded++;
    }

    if (items.isEmpty) {
      // Fallback placeholders matching screenshot layout
      final placeholders = ['the', 'be', 'to', 'of'];
      for (var w in placeholders) {
        items.add(_buildChip(w, isEmoji: false, onTap: () => onCommitWo(w)));
      }
    }

    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: items,
      ),
    );
  }

  Widget _buildChip(String text, {required bool isEmoji, required VoidCallback onTap}) {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: isEmoji 
                ? palette.accent.withOpacity(0.14) 
                : palette.background.withOpacity(0.4),
            borderRadius: BorderRadius.circular(16),
          ),
          alignment: Alignment.center,
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: isEmoji ? 18 : 14,
              color: palette.keyText,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}

