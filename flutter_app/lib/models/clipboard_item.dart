import 'dart:convert';

enum ClipboardType { text, image }

class ClipboardItem {
  final String content;
  final ClipboardType type;
  final DateTime timestamp;
  bool isPinned;

  ClipboardItem({
    required this.content,
    required this.type,
    required this.timestamp,
    this.isPinned = false,
  });

  Map<String, dynamic> toJson() => {
    'content': content,
    'type': type.index,
    'timestamp': timestamp.toIso8601String(),
    'isPinned': isPinned,
  };

  factory ClipboardItem.fromJson(Map<String, dynamic> json) => ClipboardItem(
    content: json['content'],
    type: ClipboardType.values[json['type']],
    timestamp: DateTime.parse(json['timestamp']),
    isPinned: json['isPinned'] ?? false,
  );
}
