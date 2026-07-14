import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../app/theme/app_theme.dart';

class FirestoreThemeService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static const String _collectionPath = 'themes';

  /// Get all available themes from Firestore
  static Future<List<Map<String, dynamic>>> getAvailableThemes() async {
    try {
      final snapshot = await _firestore.collection(_collectionPath).get();
      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();
    } catch (e) {
      debugPrint('Error fetching themes from Firestore: $e');
      rethrow;
    }
  }

  /// Listen to theme updates in real-time
  static Stream<List<Map<String, dynamic>>> themesStream() {
    return _firestore.collection(_collectionPath).snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();
    });
  }

  /// Convert Firestore data to AkaiPalette
  static AkaiPalette parseTheme(Map<String, dynamic> data) {
    final colors = data['colors'] as Map<String, dynamic>? ?? {};
    
    int parseColor(String key, {int defaultValue = 0xFF000000}) {
      try {
        final value = colors[key];
        if (value == null) return defaultValue;
        if (value is int) return value;
        if (value is String) return int.parse(value.replaceFirst('#', ''), radix: 16);
        return defaultValue;
      } catch (e) {
        return defaultValue;
      }
    }

    return AkaiPalette(
      id: data['id'] as String? ?? 'unknown',
      name: data['name'] as String? ?? 'Untitled',
      emoji: data['emoji'] as String? ?? '🎨',
      category: data['category'] as String? ?? 'solid',
      liveTheme: data['liveTheme'] as String?,
      background: Color(parseColor('background')),
      surface: Color(parseColor('surface', defaultValue: 0xFF1A1A1A)),
      surfaceVariant: Color(parseColor('surfaceVariant', defaultValue: 0xFF2A2A2A)),
      key: Color(parseColor('key', defaultValue: 0xFF333333)),
      keyPressed: Color(parseColor('keyPressed', defaultValue: 0xFF444444)),
      keySecondary: Color(parseColor('keySecondary', defaultValue: 0xFF222222)),
      keySecondaryPressed: Color(parseColor('keySecondaryPressed', defaultValue: 0xFF333333)),
      keyAccent: Color(parseColor('keyAccent', defaultValue: 0xFF4CAF50)),
      keyAccentPressed: Color(parseColor('keyAccentPressed', defaultValue: 0xFF388E3C)),
      keyText: Color(parseColor('keyText', defaultValue: 0xFFFFFFFF)),
      keySecondaryText: Color(parseColor('keySecondaryText', defaultValue: 0xFFBBBBBB)),
      accent: Color(parseColor('accent', defaultValue: 0xFF4CAF50)),
      accentMuted: Color(parseColor('accentMuted', defaultValue: 0xFF2E7D32)),
      glow: Color(parseColor('glow', defaultValue: 0xFF81C784)),
    );
  }
}
