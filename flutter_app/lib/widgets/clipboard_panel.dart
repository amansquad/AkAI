import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../models/clipboard_item.dart';
import '../app/theme/app_theme.dart';

class ClipboardPanel extends StatelessWidget {
  const ClipboardPanel({super.key});

  String _formatTimestamp(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inMinutes < 1) return 'Just now';
    if (difference.inMinutes < 60) return '${difference.inMinutes}m ago';
    if (difference.inHours < 24) return '${difference.inHours}h ago';
    if (difference.inDays < 7) return '${difference.inDays}d ago';
    return '${date.month}/${date.day}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<KeyboardProvider>();
    final AkaiPalette theme = context.watch<ThemeProvider>().currentTheme;
    final clips = provider.clipboardHistory;

    return Container(
      height: 320,
      color: theme.background,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: theme.surface,
              border: Border(bottom: BorderSide(color: theme.accent.withOpacity(0.1))),
            ),
            child: Row(
              children: [
                Icon(Icons.content_paste_rounded, color: theme.accent, size: 20),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Clipboard', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: theme.keyText)),
                    Text('${clips.length} items', style: TextStyle(fontSize: 10, color: theme.keySecondaryText)),
                  ],
                ),
                const Spacer(),
                if (clips.any((i) => !i.isPinned))
                  TextButton.icon(
                    onPressed: () => provider.clearUnpinnedClips(),
                    icon: Icon(Icons.delete_sweep_rounded, size: 16, color: theme.accent),
                    label: Text('Clear', style: TextStyle(color: theme.accent, fontSize: 12)),
                  ),
              ],
            ),
          ),

          // Clipboard Content
          Expanded(
            child: clips.isEmpty
                ? _buildEmptyState(theme)
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: clips.length,
                    itemBuilder: (context, index) {
                      final item = clips[index];
                      return _buildClipItem(context, item, provider, theme);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildClipItem(BuildContext context, ClipboardItem item, KeyboardProvider provider, AkaiPalette theme) {
    final isText = item.type == ClipboardType.text;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: theme.surface.withOpacity(0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: item.isPinned ? theme.accent.withOpacity(0.5) : theme.accent.withOpacity(0.05),
          width: item.isPinned ? 1.5 : 1,
        ),
        boxShadow: [
          if (item.isPinned)
            BoxShadow(color: theme.accent.withOpacity(0.1), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            if (isText) {
              provider.appendText(item.content);
              provider.setMode(KeyboardMode.keyboard);
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: isText 
                        ? Text(
                            item.content,
                            style: TextStyle(color: theme.keyText, fontSize: 13, height: 1.4),
                            maxLines: 4,
                            overflow: TextOverflow.ellipsis,
                          )
                        : _buildImageMock(item.content, theme),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      children: [
                        IconButton(
                          icon: Icon(
                            item.isPinned ? Icons.push_pin_rounded : Icons.push_pin_outlined,
                            size: 18,
                            color: item.isPinned ? theme.accent : theme.keySecondaryText.withOpacity(0.5),
                          ),
                          onPressed: () => provider.togglePinClip(item),
                          constraints: const BoxConstraints(),
                          padding: const EdgeInsets.all(4),
                        ),
                        IconButton(
                          icon: Icon(Icons.delete_outline_rounded, size: 18, color: theme.keySecondaryText.withOpacity(0.3)),
                          onPressed: () => provider.deleteClip(item),
                          constraints: const BoxConstraints(),
                          padding: const EdgeInsets.all(4),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.schedule_rounded, size: 10, color: theme.keySecondaryText),
                    const SizedBox(width: 4),
                    Text(
                      _formatTimestamp(item.timestamp),
                      style: TextStyle(color: theme.keySecondaryText, fontSize: 10),
                    ),
                    const Spacer(),
                    if (isText)
                      GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: item.content));
                        },
                        child: Icon(Icons.copy_rounded, size: 14, color: theme.accent.withOpacity(0.7)),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildImageMock(String url, AkaiPalette theme) {
    return Container(
      height: 80,
      width: double.infinity,
      decoration: BoxDecoration(
        color: theme.key.withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
        image: const DecorationImage(
          image: NetworkImage('https://via.placeholder.com/400x200/00FF41/FFFFFF?text=Screenshot+Captured'),
          fit: BoxFit.cover,
        ),
      ),
      child: Center(
        child: Icon(Icons.image_rounded, color: theme.accent.withOpacity(0.5)),
      ),
    );
  }

  Widget _buildEmptyState(AkaiPalette theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history_rounded, size: 48, color: theme.keySecondaryText.withOpacity(0.2)),
          const SizedBox(height: 12),
          Text('Nothing here yet', style: TextStyle(color: theme.keySecondaryText, fontSize: 14)),
          Text('Copied items will appear here', style: TextStyle(color: theme.keySecondaryText.withOpacity(0.5), fontSize: 11)),
        ],
      ),
    );
  }
}
