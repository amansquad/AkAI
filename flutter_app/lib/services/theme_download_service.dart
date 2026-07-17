import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../app/theme/app_theme.dart';

class ThemeDownloadService {
  static const String baseUrl = 'https://ak-ai-opal.vercel.app/themes';
  static const String _unlockedThemesKey = 'unlocked_native_themes';
  
  /// Check if a theme is downloaded
  static Future<bool> isThemeDownloaded(String themeId) async {
    try {
      // 1. Check persistent local list first
      final prefs = await SharedPreferences.getInstance();
      final unlocked = prefs.getStringList(_unlockedThemesKey) ?? [];
      if (unlocked.contains(themeId)) return true;

      // 2. Check physical file
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/themes/$themeId.json');
      return await file.exists();
    } catch (e) {
      debugPrint('Error checking theme: $e');
      return false;
    }
  }

  /// Download a theme from the server
  static Future<bool> downloadTheme(String themeId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/$themeId.json'));
      
      if (response.statusCode == 200) {
        final dir = await getApplicationDocumentsDirectory();
        final themeDir = Directory('${dir.path}/themes');
        
        // Create themes directory if it doesn't exist
        if (!await themeDir.exists()) {
          await themeDir.create(recursive: true);
        }
        
        final file = File('${themeDir.path}/$themeId.json');
        await file.writeAsString(response.body);
        
        return true;
      }
      
      return false;
    } catch (e) {
      debugPrint('Error downloading theme: $e');
      return false;
    }
  }

  /// Download theme background background image (for live themes)
  static Future<bool> downloadThemeImage(String themeId) async {
    try {
      // Handle root-relative paths or default theme paths
      final url = themeId.startsWith('/') 
          ? 'https://ak-ai-opal.vercel.app$themeId.png'
          : '$baseUrl/$themeId.png';
      
      // Remove any double slashes except after https://
      final sanitizedUrl = url.replaceAll(RegExp(r'(?<!:)/+'), '/');
      
      debugPrint('ThemeDownloadService: Downloading background image from $sanitizedUrl');
      final response = await http.get(Uri.parse(sanitizedUrl));
      
      if (response.statusCode == 200) {
        final dir = await getApplicationDocumentsDirectory();
        final themeDir = Directory('${dir.path}/themes');
        
        if (!await themeDir.exists()) {
          await themeDir.create(recursive: true);
        }
        
        // Sanitize the filename for local storage (replace slashes with underscores)
        final localName = themeId.replaceAll('/', '_');
        final file = File('${themeDir.path}/$localName.png');
        await file.writeAsBytes(response.bodyBytes);
        debugPrint('ThemeDownloadService: Image saved successfully to ${file.path}');
        return true;
      }
      
      debugPrint('ThemeDownloadService: Failed to download image. Status: ${response.statusCode}');
      return false;
    } catch (e) {
      debugPrint('ThemeDownloadService: Error downloading theme image: $e');
      return false;
    }
  }

  /// Delete a downloaded theme
  static Future<bool> deleteTheme(String themeId) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      
      // Delete JSON file
      final jsonFile = File('${dir.path}/themes/$themeId.json');
      if (await jsonFile.exists()) {
        await jsonFile.delete();
      }
      
      // Delete image file if exists
      final imageFile = File('${dir.path}/themes/$themeId.png');
      if (await imageFile.exists()) {
        await imageFile.delete();
      }
      
      return true;
    } catch (e) {
      debugPrint('Error deleting theme: $e');
      return false;
    }
  }

  /// Bundled theme list — always available, no network needed.
  static const List<Map<String, dynamic>> _bundledThemes = [
    // ── Solid / Core ──────────────────────────────────────────────────────
    {'id': 'obsidian',   'name': 'Obsidian',        'emoji': '⬛', 'description': 'Deep space dark purple with aurora glow',  'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'aurora'},
    {'id': 'light',      'name': 'Light',           'emoji': '☁️', 'description': 'Clean bright white keyboard',              'category': 'solid',    'isPremium': false, 'size': 512,  'liveTheme': null},
    {'id': 'mint',       'name': 'Mint',            'emoji': '🍃', 'description': 'Fresh emerald green tones',                'category': 'solid',    'isPremium': false, 'size': 512,  'liveTheme': null},
    {'id': 'candy',      'name': 'Candy',           'emoji': '🍬', 'description': 'Sweet pink & purple gradients',            'category': 'solid',    'isPremium': false, 'size': 512,  'liveTheme': null},
    {'id': 'forest',     'name': 'Forest',          'emoji': '🌿', 'description': 'Deep forest green tones',                  'category': 'solid',    'isPremium': false, 'size': 512,  'liveTheme': null},
    {'id': 'rose',       'name': 'Rose',            'emoji': '🌸', 'description': 'Elegant rose pink palette',                'category': 'solid',    'isPremium': false, 'size': 512,  'liveTheme': null},
    
    // ── Live ─────────────────────────────────────────────────────────────
    {'id': 'fire',       'name': 'Fire',            'emoji': '🔥', 'description': 'Blazing fire animation',                   'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'fire'},
    {'id': 'sunset-glow', 'name': 'Sunset Glow',    'emoji': '🌇', 'description': 'Warm sunset with fire animation',          'category': 'live',     'isPremium': false, 'size': 768,  'liveTheme': 'fire'},
    {'id': 'rainbow',    'name': 'Rainbow',         'emoji': '🌈', 'description': 'Vibrant rainbow animation',                'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'rainbow'},
    {'id': 'galaxy',     'name': 'Galaxy',          'emoji': '🪐', 'description': 'Purple galaxy with aurora effects',        'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'aurora'},
    {'id': 'waterfall',  'name': 'Waterfall',       'emoji': '💧', 'description': 'Flowing water animation',                  'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'ocean'},
    {'id': 'autumn',     'name': 'Autumn',          'emoji': '🍂', 'description': 'Warm autumn leaves with fire effects',     'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'fire'},
    {'id': 'cyberpunk',  'name': 'Cyberpunk',       'emoji': '🤖', 'description': 'Futuristic neon pink and cyan',            'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'cyberpunk'},
    {'id': 'snowfall',   'name': 'Snowfall',        'emoji': '❄️', 'description': 'Icy blue with aurora animation',           'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'aurora'},
    {'id': 'bubbles',    'name': 'Bubbles',         'emoji': '🫧', 'description': 'Underwater bubbles animation',             'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'ocean'},
    {'id': 'plasma',     'name': 'Plasma',          'emoji': '🧪', 'description': 'Electric plasma effects',                  'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'fire'},
    {'id': 'deep-sea',   'name': 'Deep Sea',        'emoji': '🦑', 'description': 'Deep ocean with teal highlights',          'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'ocean'},
    
    // ── Premium Live ─────────────────────────────────────────────────────
    {'id': 'matrix',     'name': 'Matrix Rain',     'emoji': '🌧️', 'description': 'Digital Ethiopic matrix code rain',       'category': 'live',     'isPremium': true,  'size': 2048, 'liveTheme': 'matrix'},
    {'id': 'aurora',     'name': 'Aurora Borealis', 'emoji': '🌌', 'description': 'Stunning polar lights sky',                'category': 'live',     'isPremium': true,  'size': 2048, 'liveTheme': 'aurora'},
    {'id': 'lava',       'name': 'Volcanic Lava',   'emoji': '🌋', 'description': 'Flowing magma background',                 'category': 'live',     'isPremium': true,  'size': 2048, 'liveTheme': 'lava'},
    {'id': 'neon-pulse', 'name': 'Neon Pulse',      'emoji': '💫', 'description': 'Pulsing neon glowing lines',               'category': 'live',     'isPremium': true,  'size': 1536, 'liveTheme': 'neon-pulse'},
    {'id': 'solar',      'name': 'Solar Flare',     'emoji': '☀️', 'description': 'Intense solar fire animation',             'category': 'live',     'isPremium': true,  'size': 2048, 'liveTheme': 'solar'},
    {'id': 'fireflies',      'name': 'Fireflies',      'emoji': '🧚', 'description': 'Blinking fireflies in a night forest',     'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'fireflies_live'},
    {'id': 'binary-rain',    'name': 'Binary Rain',    'emoji': '🔢', 'description': 'Falling streams of digital code',          'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'binary_rain_live'},
    {'id': 'geometric-flow', 'name': 'Geometric Flow', 'emoji': '📐', 'description': 'Wireframe shapes drifting in space',       'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'geometric_flow_live'},
    {'id': 'nebula',         'name': 'Nebula Space',   'emoji': '🌌', 'description': 'Deep space nebula colors',                 'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'nebula_live'},
    {'id': 'ocean-waves',    'name': 'Ocean Waves',    'emoji': '🌊', 'description': 'Rolling teal ocean waves',                 'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'ocean_waves_live'},
    {'id': 'lava-lamp',      'name': 'Lava Lamp',      'emoji': '🌋', 'description': 'Goopy retro lava lamp blobs',              'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'lava_lamp_live'},
    {'id': 'circuit-board',  'name': 'Circuit Board',  'emoji': '🔌', 'description': 'PCB traces with live signal pulses',       'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'circuit_board_live'},
    {'id': 'starfield',      'name': 'Starfield',      'emoji': '🚀', 'description': 'Warp-speed stars streaking past',          'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'starfield_live'},
    {'id': 'meteor-shower',  'name': 'Meteor Shower',  'emoji': '☄️', 'description': 'Shooting stars over a twinkling sky',      'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'meteor_live'},
    {'id': 'fireworks',      'name': 'Fireworks',      'emoji': '🎆', 'description': 'Rockets bursting into colorful sparks',    'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'fireworks_live'},
    {'id': 'city-lights',    'name': 'City Lights',    'emoji': '🌃', 'description': 'Soft bokeh lights of a city at night',     'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'bokeh_live'},
    {'id': 'zen-pond',       'name': 'Zen Pond',       'emoji': '🪷', 'description': 'Calm rain ripples on still water',         'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'ripples_live'},
    {'id': 'glitch',         'name': 'Glitch',         'emoji': '📺', 'description': 'RGB-split glitches and static noise',      'category': 'live',     'isPremium': false, 'size': 1024, 'liveTheme': 'glitch_live'},

    // ── Faith ────────────────────────────────────────────────────────────
    {'id': 'faith_orthodox', 'name': 'Ethiopian Orthodox', 'emoji': '✝️', 'description': 'Deep purple with gold accents',   'category': 'faith',    'isPremium': false, 'size': 512, 'liveTheme': 'ortho_maryam'},
    {'id': 'faith_maryam',   'name': 'Holy Maryam',         'emoji': '🙏', 'description': 'Sacred icon with blue accents',      'category': 'faith',    'isPremium': false, 'size': 512, 'liveTheme': 'ortho_maryam'},
    {'id': 'faith_meskel',   'name': 'Meskel Fire',         'emoji': '🔥', 'description': 'Sacred bonfire celebration',         'category': 'faith',    'isPremium': false, 'size': 512, 'liveTheme': 'reg_meskel'},
    {'id': 'faith_najashi',  'name': 'Al-Najashi',          'emoji': '🕌', 'description': 'Islamic heritage of Al-Najashi',     'category': 'faith',    'isPremium': false, 'size': 512, 'liveTheme': 'islam_najashi'},
    {'id': 'faith_harar',    'name': 'Harar Jegol',         'emoji': '🕌', 'description': 'Historic walls of Harar',            'category': 'faith',    'isPremium': false, 'size': 512, 'liveTheme': 'islam_harar'},
    {'id': 'faith_ramadan',  'name': 'Ramadan Lanterns',    'emoji': '🏮', 'description': 'Holy month of Ramadan',              'category': 'faith',    'isPremium': false, 'size': 512, 'liveTheme': 'islam_lantern'},
    {'id': 'faith_timkat',   'name': 'Timkat Holy',         'emoji': '🕊️', 'description': 'Epiphany celebration in Gondar',      'category': 'faith',    'isPremium': false, 'size': 512, 'liveTheme': 'ortho_timkat'},
    
    // ── Ethiopian Cultural ────────────────────────────────────────────────
    {'id': 'ethiopian-flag', 'name': 'Ethiopian Flag',     'emoji': '🇪🇹', 'description': 'Green, gold & red pride',            'category': 'culture',  'isPremium': false, 'size': 512, 'liveTheme': 'eth_flag'},
    {'id': 'addis-ababa',    'name': 'Addis Ababa',        'emoji': '🌆', 'description': 'City of flowers night',              'category': 'culture',  'isPremium': false, 'size': 512, 'liveTheme': 'reg_addis'},
    {'id': 'aksum-empire',   'name': 'Aksum Empire',       'emoji': '🏛️', 'description': 'Ancient Aksumite heritage',         'category': 'culture',  'isPremium': false, 'size': 512, 'liveTheme': 'ortho_axum'},
    {'id': 'lalibela-stone', 'name': 'Lalibela Stone',     'emoji': '⛪', 'description': 'Rock-hewn church stone',             'category': 'culture',  'isPremium': false, 'size': 512, 'liveTheme': 'ortho_lalibela'},
    {'id': 'abyssinian-flag','name': 'Abyssinian Flag',    'emoji': '🦁', 'description': 'Historical imperial colors',          'category': 'culture',  'isPremium': false, 'size': 512, 'liveTheme': 'eth_flag'},
    {'id': 'adey-abeba',     'name': 'Adey Abeba',         'emoji': '🌼', 'description': 'Enkutatash yellow flowers',          'category': 'culture',  'isPremium': false, 'size': 512, 'liveTheme': 'reg_adey'},
    {'id': 'black-gold',     'name': 'Black Gold',         'emoji': '🍯', 'description': 'Premium black and gold texture',     'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_blackgold'},
    {'id': 'judah-lion',     'name': 'Judah Lion',         'emoji': '🦁', 'description': 'Conquering Lion of Judah pride',    'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_judah'},
    
    // ── Regions ──────────────────────────────────────────────────────────
    {'id': 'afar-region',    'name': 'Afar',               'emoji': '🐪', 'description': 'Danakil depression colors',          'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_afar'},
    {'id': 'amhara-region',  'name': 'Amhara',             'emoji': '⚔️', 'description': 'Mountaineous regional pride',       'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_amhara'},
    {'id': 'oromia-region',  'name': 'Oromia',             'emoji': '🌳', 'description': 'Oda tree and regional heritage',    'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_oromia'},
    {'id': 'somali-region',  'name': 'Somali',             'emoji': '🐪', 'description': 'Eastern region heritage',            'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_somali'},
    {'id': 'tigray-region',  'name': 'Tigray',             'emoji': '⛰️', 'description': 'Ancient Christian heritage',         'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_tigray'},
    {'id': 'reg_sidama',     'name': 'Sidama',             'emoji': '☕', 'description': 'Coffee and cultural heritage',       'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_sidama'},
    {'id': 'reg_gambella',   'name': 'Gambella',           'emoji': '🚣', 'description': 'Western waters and regional pride',  'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_gambella'},
    {'id': 'reg_harari',     'name': 'Harari',             'emoji': '🏰', 'description': 'Walled city cultural heritage',      'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_harari'},
    {'id': 'reg_bgumuz',     'name': 'Benishangul Gumuz',  'emoji': '⛰️', 'description': 'Western regional colors',           'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_bgumuz'},
    {'id': 'reg_meskel_fest','name': 'Meskel Festival',    'emoji': '🔥', 'description': 'True Cross celebration colors',      'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_meskel'},
    {'id': 'reg_timket_fest','name': 'Timket Festival',    'emoji': '⛪', 'description': 'Baptism celebration heritage',       'category': 'culture',  'isPremium': false, 'size': 512,  'liveTheme': 'reg_timket'},
    {'id': 'southern-ethiopia', 'name': 'Southern Regions', 'emoji': '🌄', 'description': 'Diverse cultural heritage',          'category': 'culture',  'isPremium': false, 'size': 512, 'liveTheme': 'reg_south'},
    
    // ── Ethiopian Football ────────────────────────────────────────────────
    {'id': 'saint-george-fc',    'name': 'Saint George FC',   'emoji': '🐎', 'description': 'The Horsemen club colors',          'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_stgeorge'},
    {'id': 'ethiopia-bunna',     'name': 'Ethiopia Bunna',     'emoji': '☕', 'description': 'Coffee Coffee Bunna!',               'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_coffee'},
    {'id': 'fb_mekelle',         'name': 'Mekelle 70 Enderta', 'emoji': '🌅', 'description': 'Red and yellow stripes',             'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_mekelle'},
    {'id': 'fb_diredawa',        'name': 'Dire Dawa City',     'emoji': '🚂', 'description': 'Orange and blue heritage',           'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_diredawa'},
    {'id': 'club_awash',         'name': 'Awash Ketema',       'emoji': '🌊', 'description': 'River city colors',                  'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_awash'},
    {'id': 'club_arba',          'name': 'Arba Minch City',    'emoji': '💦', 'description': 'Forty springs club colors',          'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_arba'},
    {'id': 'club_electric',      'name': 'Ethio Electric',     'emoji': '⚡', 'description': 'Thunder and lighting colors',        'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_electric'},
    {'id': 'club_insurance',     'name': 'Ethio Insurance',    'emoji': '🛡️', 'description': 'Solid defense colors',               'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_insurance'},
    {'id': 'fb_hawassa',         'name': 'Hawassa City',       'emoji': '🐠', 'description': 'Lakeside club colors',               'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_hawassa'},
    {'id': 'fb_cbe',             'name': 'Nigd Bank (CBE)',    'emoji': '💰', 'description': 'Commercial Bank of Ethiopia FC',    'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_cbe'},
    {'id': 'fb_negele_arsi',     'name': 'Negele Arsi',        'emoji': '🌾', 'description': 'Regional powerhouse colors',         'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_negele_arsi'},
    {'id': 'dedebit-fc',         'name': 'Dedebit FC',         'emoji': '💥', 'description': 'Historical powerhouse colors',       'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_arsenal'},
    {'id': 'club_shire',         'name': 'Shire Endaselassie', 'emoji': '🏰', 'description': 'Tigray regional club colors',        'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_shire'},
    {'id': 'club_welwalo',       'name': 'Welwalo Adigrat',    'emoji': '🏛️', 'description': 'Ancient heritage club colors',       'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_welwalo'},
    {'id': 'club_woldia',        'name': 'Woldia SC',          'emoji': '🌄', 'description': 'Regional growth colors',             'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_woldia'},
    {'id': 'club_mekel',         'name': 'Mekelakeya (Defense)','emoji': '⚔️', 'description': 'Defense force pride',               'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_mekel'},
    {'id': 'club_hamb',          'name': 'Hambericho City',    'emoji': '⛰️', 'description': 'Southern regional pride',            'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_hamb'},
    {'id': 'club_bahirdar',      'name': 'Bahir Dar Kenema',   'emoji': '⛵', 'description': 'Tana waves colors',                  'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_bahirdar'},
    {'id': 'club_fasil',         'name': 'Fasil Kenema',       'emoji': '🏯', 'description': 'The Emperors at Gondar',             'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_fasil'},
    {'id': 'club_adama',         'name': 'Adama City',         'emoji': '🌬️', 'description': 'Oromia industrial hub colors',       'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_adama'},
    {'id': 'club_sidama',        'name': 'Sidama Coffee',      'emoji': '🫘', 'description': 'Sidama region coffee pride',         'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_sidama'},
    {'id': 'club_dicha',         'name': 'Wolaita Dicha',      'emoji': '🦅', 'description': 'Tona birds pride',                   'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_dicha'},
    {'id': 'club_cbe',           'name': 'CBE (Bank)',         'emoji': '🪙', 'description': 'Commercial Bank of Ethiopia',       'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_cbe'},
    {'id': 'club_negede',        'name': 'Negede Amhara',      'emoji': '🐫', 'description': 'Regional trade and pride',           'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_negede'},
    {'id': 'club_hadiya',        'name': 'Hadiya Hossana',     'emoji': '🐯', 'description': 'Hadiya region lions',                'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'club_hadiya'},

    // ── European Football ─────────────────────────────────────────────────
    {'id': 'fb_manutd',         'name': 'Manchester United',  'emoji': '😈', 'description': 'The Red Devils',                    'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_manutd'},
    {'id': 'fb_barca',          'name': 'Barcelona',          'emoji': '🔷', 'description': 'Blaugrana pride',                   'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_barca'},
    {'id': 'fb_realmadrid',     'name': 'Real Madrid',        'emoji': '👑', 'description': 'Los Blancos',                       'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_realmadrid'},
    {'id': 'fb_liverpool',      'name': 'Liverpool',          'emoji': '🕊️', 'description': 'The Reds (YNWA)',                   'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_liverpool'},
    {'id': 'fb_mancity',        'name': 'Man City',           'emoji': '☁️', 'description': 'Cityzens of Manchester',            'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_mancity'},
    {'id': 'fb_arsenal',        'name': 'Arsenal',            'emoji': '💣', 'description': 'The Gunners pride',                 'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_arsenal'},
    {'id': 'fb_chelsea',        'name': 'Chelsea',            'emoji': '🦁', 'description': 'The Blues heritage',                'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_chelsea'},
    {'id': 'fb_psg',            'name': 'Paris SG',           'emoji': '🗼', 'description': 'Parisian pride',                    'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_psg'},
    {'id': 'fb_bayern',         'name': 'Bayern Munich',      'emoji': '💠', 'description': 'German giants colors',               'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_bayern'},
    {'id': 'fb_dortmund',       'name': 'Borussia Dortmund',  'emoji': '🐝', 'description': 'The Black and Yellows',             'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_dortmund'},
    {'id': 'fb_juventus',       'name': 'Juventus',           'emoji': '🦓', 'description': 'The Old Lady (Bianconeri)',          'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_juventus'},
    {'id': 'fb_inter',          'name': 'Inter Milan',        'emoji': '🐍', 'description': 'Nerazzurri heritage',               'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_inter'},
    {'id': 'fb_milan',          'name': 'AC Milan',           'emoji': '👹', 'description': 'Rossoneri pride',                   'category': 'football', 'isPremium': false, 'size': 512, 'liveTheme': 'fb_milan'},
  ];

  /// Get list of all available themes — the full bundled catalog, with any
  /// server entries merged on top (by id). The server can add or override
  /// themes but never hides the bundled ones.
  static Future<List<Map<String, dynamic>>> getAvailableThemes() async {
    List<Map<String, dynamic>> serverList = [];
    try {
      final response = await http.get(Uri.parse('$baseUrl/themes.json'))
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final List<dynamic> themes = json.decode(response.body);
        serverList = themes.cast<Map<String, dynamic>>();
      }
    } catch (_) {
      // Network unavailable — bundled list only
    }

    return mergeThemeLists(_bundledThemes, serverList);
  }

  /// Merge [overlay] onto [base] by theme id: overlay entries override or
  /// extend base entries, base entries are never dropped.
  static List<Map<String, dynamic>> mergeThemeLists(
      List<Map<String, dynamic>> base, List<Map<String, dynamic>> overlay) {
    final byId = <String, Map<String, dynamic>>{
      for (final t in base)
        if (t['id'] is String) t['id'] as String: Map<String, dynamic>.from(t),
    };
    for (final t in overlay) {
      final id = t['id'];
      if (id is! String) continue;
      byId[id] = {...?byId[id], ...t};
    }
    return byId.values.toList();
  }

  /// Load a downloaded theme
  static Future<AkaiPalette?> loadDownloadedTheme(String themeId) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/themes/$themeId.json');
      
      if (!await file.exists()) {
        return null;
      }
      
      final String contents = await file.readAsString();
      final Map<String, dynamic> json = jsonDecode(contents);
      
      return _parseThemeFromJson(json);
    } catch (e) {
      debugPrint('Error loading theme: $e');
      return null;
    }
  }

  /// Parse theme from JSON
  static AkaiPalette _parseThemeFromJson(Map<String, dynamic> json) {
    final colors = json['colors'] as Map<String, dynamic>;
    
    // Helper to parse color value (handles both int and string hex)
    int parseColor(String key, {int defaultValue = 0xFF000000}) {
      try {
        final value = colors[key];
        if (value == null) return defaultValue;
        if (value is int) return value;
        if (value is String) return int.parse(value.replaceFirst('#', ''), radix: 16);
        return defaultValue;
      } catch (e) {
        debugPrint('Error parsing color $key: $e');
        return defaultValue;
      }
    }
    
    return AkaiPalette(
      id: json['id'] as String? ?? 'unknown',
      name: json['name'] as String,
      emoji: json['emoji'] as String,
      category: json['category'] as String? ?? 'solid',
      liveTheme: json['liveTheme'] as String?,
      background: Color(parseColor('background')),
      surface: Color(parseColor('surface')),
      surfaceVariant: Color(parseColor('surfaceVariant')),
      key: Color(parseColor('key')),
      keyPressed: Color(parseColor('keyPressed')),
      keySecondary: Color(parseColor('keySecondary')),
      keySecondaryPressed: Color(parseColor('keySecondaryPressed')),
      keyAccent: Color(parseColor('keyAccent')),
      keyAccentPressed: Color(parseColor('keyAccentPressed')),
      keyText: Color(parseColor('keyText', defaultValue: 0xFFFFFFFF)),
      keySecondaryText: Color(parseColor('keySecondaryText', defaultValue: 0xFFBBBBBB)),
      accent: Color(parseColor('accent')),
      accentMuted: Color(parseColor('accentMuted')),
      glow: Color(parseColor('glow')),
    );
  }

  /// Get downloaded themes
  static Future<List<String>> getDownloadedThemeIds() async {
    try {
      final List<String> themeIds = [];
      
      // 1. Get from persistent local list (native unlocks)
      final prefs = await SharedPreferences.getInstance();
      final unlocked = prefs.getStringList(_unlockedThemesKey) ?? [];
      themeIds.addAll(unlocked);

      // 2. Get from filesystem (external downloads)
      final dir = await getApplicationDocumentsDirectory();
      final themeDir = Directory('${dir.path}/themes');
      
      if (await themeDir.exists()) {
        final files = await themeDir.list().toList();
        final fileIds = files
            .where((f) => f.path.endsWith('.json'))
            .map((f) => f.path.split('/').last.replaceAll('.json', ''));
        
        for (final id in fileIds) {
          if (!themeIds.contains(id)) themeIds.add(id);
        }
      }
      
      return themeIds;
    } catch (e) {
      debugPrint('Error getting downloaded themes: $e');
      return [];
    }
  }

  /// Mark a native theme as unlocked persistently
  static Future<void> saveUnlockedThemeId(String themeId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final unlocked = prefs.getStringList(_unlockedThemesKey) ?? [];
      if (!unlocked.contains(themeId)) {
        unlocked.add(themeId);
        await prefs.setStringList(_unlockedThemesKey, unlocked);
      }
    } catch (e) {
      debugPrint('Error saving unlocked theme: $e');
    }
  }
}
