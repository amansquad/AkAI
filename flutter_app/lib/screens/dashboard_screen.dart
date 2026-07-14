import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/settings_provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/settings_panel.dart';
import '../widgets/theme_selector.dart';
import 'mobile_keyboard_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final theme = themeProvider.currentTheme;
    final settings = context.watch<SettingsProvider>();

    return Scaffold(
      backgroundColor: theme.background,
      appBar: AppBar(
        backgroundColor: theme.surface,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: theme.accent.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.keyboard_outlined, color: theme.accent, size: 20),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AkAI Keyboard',
                  style: TextStyle(color: theme.keyText, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Version ${settings.appVersion}',
                  style: TextStyle(color: theme.keySecondaryText, fontSize: 10),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.info_outline_rounded, color: theme.keySecondaryText),
            onPressed: () => _showAbout(context, theme),
          ),
        ],
      ),
      body: _buildPage(_selectedIndex, theme),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: theme.accent.withOpacity(0.1))),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) => setState(() => _selectedIndex = index),
          backgroundColor: theme.surface,
          selectedItemColor: theme.accent,
          unselectedItemColor: theme.keySecondaryText.withOpacity(0.5),
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.palette_rounded), label: 'Themes'),
            BottomNavigationBarItem(icon: Icon(Icons.settings_rounded), label: 'Settings'),
            BottomNavigationBarItem(icon: Icon(Icons.text_fields_rounded), label: 'Test'),
          ],
        ),
      ),
    );
  }

  Widget _buildPage(int index, var theme) {
    switch (index) {
      case 0: return _buildHomePage(theme);
      case 1: return const ThemeSelector();
      case 2: return const SettingsPanel();
      case 3: return const MobileKeyboardScreen();
      default: return _buildHomePage(theme);
    }
  }

  Widget _buildHomePage(var theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSetupCard(theme),
          const SizedBox(height: 24),
          Text(
            'Quick Actions',
            style: TextStyle(color: theme.keyText, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildActionCard('Customize Keys', Icons.touch_app_rounded, Colors.blue, theme, () => setState(() => _selectedIndex = 2))),
              const SizedBox(width: 12),
              Expanded(child: _buildActionCard('Theme Store', Icons.storefront_rounded, Colors.pink, theme, () => setState(() => _selectedIndex = 1))),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildActionCard('Clipboard Manager', Icons.content_paste_rounded, Colors.orange, theme, () => setState(() => _selectedIndex = 3))),
              const SizedBox(width: 12),
              Expanded(child: _buildActionCard('Try it Out', Icons.edit_note_rounded, Colors.green, theme, () => setState(() => _selectedIndex = 3))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSetupCard(var theme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [theme.accent.withOpacity(0.8), theme.accent],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: theme.accent.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 32),
          const SizedBox(height: 16),
          const Text(
            'Setup AkAI Keyboard',
            style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Follow 3 simple steps to start using the most advanced Amharic & English keyboard.',
            style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13),
          ),
          const SizedBox(height: 20),
          _buildStep('1. Enable in Settings', true),
          _buildStep('2. Select AkAI as Default', false),
          _buildStep('3. Customize your Style', false),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _openKeyboardSettings,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: theme.accent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: const Text('Start Setup', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildStep(String title, bool done) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(done ? Icons.check_circle_rounded : Icons.circle_outlined, color: Colors.white, size: 16),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildActionCard(String title, IconData icon, Color color, var theme, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: theme.accent.withOpacity(0.05)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Text(title, style: TextStyle(color: theme.keyText, fontSize: 13, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Future<void> _openKeyboardSettings() async {
    final Uri url = Uri.parse('package:android.settings.INPUT_METHOD_SETTINGS');
    try {
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      } else {
        // Fallback for some Android versions
        await launchUrl(Uri.parse('intent:#Intent;action=android.settings.INPUT_METHOD_SETTINGS;end'));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open settings. Please go to Language & Input manually.')),
        );
      }
    }
  }

  void _showAbout(BuildContext context, var theme) {
    showAboutDialog(
      context: context,
      applicationName: 'AkAI Keyboard',
      applicationVersion: '1.0.7',
      applicationIcon: Icon(Icons.keyboard, color: theme.accent, size: 48),
      children: [
        const Text('The ultimate Amharic & English keyboard solution with live themes and advanced productivity tools.'),
      ],
    );
  }
}
