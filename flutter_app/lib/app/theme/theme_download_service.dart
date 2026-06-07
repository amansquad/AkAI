import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import '../theme/app_theme.dart';

class DownloadableTheme {
  final String id;
  final String name;
  final String emoji;
  final String description;
  final String downloadUrl;
  final bool isDownloaded;
  final bool isPremium;

  const DownloadableTheme({
    required this.id,
    required this.name,
    required this.emoji,
    required this.description,
    required this.downloadUrl,
    this.isDownloaded = false,
    this.isPremium = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'emoji': emoji,
        'description': description,
        'downloadUrl': downloadUrl,
        'isDownloaded': isDownloaded,
        'isPremium': isPremium,
      };

  factory DownloadableTheme.fromJson(Map<String, dynamic> json) =>
      DownloadableTheme(
        id: json['id'] as String,
        name: json['name'] as String,
        emoji: json['emoji'] as String,
        description: json['description'] as String,
        downloadUrl: json['downloadUrl'] as String,
        isDownloaded: json['isDownloaded'] as bool? ?? false,
        isPremium: json['isPremium'] as bool? ?? false,
      );
}

class ThemeDownloadService {
  // Next.js hosting URL - UPDATE THIS with your Vercel URL or local dev server
  static const String _themesBaseUrl =
      'https://ak-ai-opal.vercel.app';
  static const String _manifestUrl = '$_themesBaseUrl/themes.json';
  static const String _downloadedThemesKey = 'downloaded_themes';

  final SharedPreferences _prefs;

  ThemeDownloadService(this._prefs);

  // Get list of all available themes from GitHub
  Future<List<DownloadableTheme>> getAvailableThemes() async {
    try {
      final response = await http.get(Uri.parse(_manifestUrl));

      if (response.statusCode == 200) {
        final manifest = jsonDecode(response.body) as Map<String, dynamic>;
        final themesList = manifest['themes'] as List;

        return themesList.map((themeJson) {
          final theme =
              DownloadableTheme.fromJson(themeJson as Map<String, dynamic>);
          return DownloadableTheme(
            id: theme.id,
            name: theme.name,
            emoji: theme.emoji,
            description: theme.description,
            downloadUrl: theme.downloadUrl.startsWith('http') 
                ? theme.downloadUrl 
                : '$_themesBaseUrl${theme.downloadUrl}',
            isDownloaded: _isThemeDownloaded(theme.id),
            isPremium: theme.isPremium,
          );
        }).toList();
      }

      // If manifest fails, try to load individual theme files
      return _loadThemesFromFallback();
    } catch (e) {
      debugPrint('Error fetching themes manifest: $e');
      return _loadThemesFromFallback();
    }
  }

  // Fallback: load themes from known list
  Future<List<DownloadableTheme>> _loadThemesFromFallback() async {
    // Expanded fallback list (used only when remote themes.json is unavailable).
    // Keep this in sync with akai-themes/themes/*.json.
    final themeIds = [
      'sunset',
      'forest',
      'rose',
      'mint',
      'candy',
      'sakura',
      'retro',
      'pastel',
      'monochrome',
      'solar',
      'aurora',
      'cyberpunk',
      'neon-pulse',
      'matrix',
      'rainbow',
      'fire',
      'lava',
      'waterfall',
      'galaxy',
      'autumn',
      'royal',
      'midnight',
      'nordic',
      'ember',
      'jade',
      'cosmic',
      'neon-green',
      'ocean-deep',
      'sunset-blaze',
    ];

    final themeNames = [
      'Sunset',
      'Forest',
      'Rose',
      'Mint',
      'Candy',
      'Sakura',
      'Retro',
      'Pastel',
      'Monochrome',
      'Solar',
      'Aurora',
      'Cyberpunk',
      'Neon Pulse',
      'Matrix',
      'Rainbow',
      'Fire',
      'Lava',
      'Waterfall',
      'Galaxy',
      'Autumn',
      'Royal',
      'Midnight',
      'Nordic',
      'Ember',
      'Jade',
      'Cosmic',
      'Neon Green',
      'Ocean Deep',
      'Sunset Blaze',
    ];

    final themeEmojis = [
      '🌅',
      '🌿',
      '🌸',
      '🍃',
      '🍬',
      '🌸',
      '📺',
      '🎨',
      '⚫',
      '☀️',
      '🌌',
      '🤖',
      '💜',
      '🔢',
      '🌈',
      '🔥',
      '🌋',
      '💧',
      '🌌',
      '🍂',
      '👑',
      '🌙',
      '❄️',
      '🔥',
      '💎',
      '🚀',
      '💚',
      '🐋',
      '🌄',
    ];

    final themeDescriptions = [
      'Warm sunset colors with orange and pink accents',
      'Deep forest green with natural tones',
      'Elegant rose gold with pink accents',
      'Fresh mint green with cool tones',
      'Sweet candy pink with playful vibes',
      'Delicate cherry blossom pink',
      'Vintage retro with warm CRT tones',
      'Soft pastel colors for a gentle feel',
      'Pure black and white minimalist',
      'Golden solar theme with warm amber tones',
      'Northern lights inspired with teal and purple',
      'Neon cyberpunk style with electric blue and pink',
      'Dark theme with vibrant neon purple pulse',
      'Classic Matrix green on black',
      'Colorful rainbow gradient theme',
      'Intense fire theme with red and orange',
      'Volcanic lava theme with deep reds',
      'Cascading waterfall with blue gradients',
      'Deep space galaxy with purple nebulas',
      'Cozy autumn colors with orange and brown',
      'Majestic royal purple with gold accents',
      'Deep midnight blue with silver stars',
      'Scandinavian inspired icy blue',
      'Glowing ember orange with warmth',
      'Precious jade green with elegance',
      'Deep space cosmic with nebula colors',
      'Electric neon green on dark',
      'Deep ocean abyss with bioluminescent glow',
      'Intense sunset with blazing oranges',
    ];

    final isPremium = [
      false, // sunset
      false, // forest
      false, // rose
      false, // mint
      false, // candy
      false, // sakura
      false, // retro
      false, // pastel
      false, // monochrome
      true, // solar
      true, // aurora
      true, // cyberpunk
      true, // neon-pulse
      true, // matrix
      true, // rainbow
      true, // fire
      true, // lava
      true, // waterfall
      true, // galaxy
      true, // autumn
      true, // royal
      true, // midnight
      true, // nordic
      true, // ember
      true, // jade
      true, // cosmic
      true, // neon-green
      true, // ocean-deep
      true, // sunset-blaze
    ];

    final List<DownloadableTheme> themes = [];
    for (int i = 0; i < themeIds.length; i++) {
      themes.add(DownloadableTheme(
        id: themeIds[i],
        name: themeNames[i],
        emoji: themeEmojis[i],
        description: themeDescriptions[i],
        downloadUrl: '$_themesBaseUrl/themes/${themeIds[i]}.json',
        isDownloaded: _isThemeDownloaded(themeIds[i]),
        isPremium: isPremium[i],
      ));
    }
    return themes;
  }

  // Download a theme
  Future<bool> downloadTheme(DownloadableTheme theme) async {
    try {
      final response = await http.get(Uri.parse(theme.downloadUrl));

      if (response.statusCode == 200) {
        final themeData = response.body;

        // Save theme data locally
        final directory = await getApplicationDocumentsDirectory();
        final themesDir = Directory('${directory.path}/themes');

        // Create themes directory if it doesn't exist
        if (!await themesDir.exists()) {
          await themesDir.create(recursive: true);
        }

        final file = File('${themesDir.path}/${theme.id}.json');
        await file.writeAsString(themeData);

        // Mark as downloaded
        _markThemeAsDownloaded(theme.id);

        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error downloading theme: $e');
      return false;
    }
  }

  // Delete a downloaded theme
  Future<bool> deleteTheme(String themeId) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final file = File('${directory.path}/themes/$themeId.json');

      if (await file.exists()) {
        await file.delete();
        _removeDownloadedTheme(themeId);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error deleting theme: $e');
      return false;
    }
  }

  // Load a downloaded theme
  Future<AkaiPalette?> loadDownloadedTheme(String themeId) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final file = File('${directory.path}/themes/$themeId.json');

      if (await file.exists()) {
        final data = await file.readAsString();
        final json = jsonDecode(data) as Map<String, dynamic>;
        return _paletteFromJson(json);
      }
      return null;
    } catch (e) {
      debugPrint('Error loading theme: $e');
      return null;
    }
  }

  // Get all downloaded themes
  Future<List<AkaiPalette>> getDownloadedThemes() async {
    final downloadedIds = _getDownloadedThemeIds();
    final List<AkaiPalette> themes = [];

    for (final id in downloadedIds) {
      final theme = await loadDownloadedTheme(id);
      if (theme != null) {
        themes.add(theme);
      }
    }

    return themes;
  }

  // Helper methods
  bool _isThemeDownloaded(String themeId) {
    final downloadedIds = _getDownloadedThemeIds();
    return downloadedIds.contains(themeId);
  }

  List<String> _getDownloadedThemeIds() {
    return _prefs.getStringList(_downloadedThemesKey) ?? [];
  }

  void _markThemeAsDownloaded(String themeId) {
    final downloadedIds = _getDownloadedThemeIds();
    if (!downloadedIds.contains(themeId)) {
      downloadedIds.add(themeId);
      _prefs.setStringList(_downloadedThemesKey, downloadedIds);
    }
  }

  void _removeDownloadedTheme(String themeId) {
    final downloadedIds = _getDownloadedThemeIds();
    downloadedIds.remove(themeId);
    _prefs.setStringList(_downloadedThemesKey, downloadedIds);
  }

  AkaiPalette _paletteFromJson(Map<String, dynamic> json) {
    final colors = json['colors'] as Map<String, dynamic>;
    return AkaiPalette(
      name: json['name'] as String,
      emoji: json['emoji'] as String,
      background: Color(colors['background'] as int),
      surface: Color(colors['surface'] as int),
      surfaceVariant: Color(colors['surfaceVariant'] as int),
      key: Color(colors['key'] as int),
      keyPressed: Color(colors['keyPressed'] as int),
      keySecondary: Color(colors['keySecondary'] as int),
      keySecondaryPressed: Color(colors['keySecondaryPressed'] as int),
      keyAccent: Color(colors['keyAccent'] as int),
      keyAccentPressed: Color(colors['keyAccentPressed'] as int),
      keyText: Color(colors['keyText'] as int),
      keySecondaryText: Color(colors['keySecondaryText'] as int),
      accent: Color(colors['accent'] as int),
      accentMuted: Color(colors['accentMuted'] as int),
      glow: Color(colors['glow'] as int),
    );
  }
}
