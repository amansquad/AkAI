import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../app/theme/app_theme.dart';

class TranslatePanel extends StatefulWidget {
  const TranslatePanel({super.key});

  @override
  State<TranslatePanel> createState() => _TranslatePanelState();
}

class _TranslatePanelState extends State<TranslatePanel> {
  final TextEditingController _sourceController = TextEditingController();
  String _translatedText = '';
  bool _isTranslating = false;
  String _sourceLang = 'English';
  String _targetLang = 'Amharic';

  Future<void> _translate() async {
    if (_sourceController.text.isEmpty) return;

    setState(() => _isTranslating = true);

    try {
      // Mock translation - replace with actual API call
      await Future.delayed(const Duration(seconds: 1));
      
      setState(() {
        if (_sourceLang == 'English' && _targetLang == 'Amharic') {
          _translatedText = 'ሰላም (Translation of: ${_sourceController.text})';
        } else {
          _translatedText = 'Hello (Translation of: ${_sourceController.text})';
        }
        _isTranslating = false;
      });
    } catch (e) {
      setState(() {
        _translatedText = 'Translation error. Please try again.';
        _isTranslating = false;
      });
    }
  }

  void _swapLanguages() {
    setState(() {
      final temp = _sourceLang;
      _sourceLang = _targetLang;
      _targetLang = temp;
      
      final tempText = _sourceController.text;
      _sourceController.text = _translatedText;
      _translatedText = tempText;
    });
  }

  @override
  void dispose() {
    _sourceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.read<KeyboardProvider>();
    final AkaiPalette theme = context.watch<ThemeProvider>().currentTheme;

    return Container(
      height: 320,
      color: theme.background,
      child: Column(
        children: [
          // Header with language selector
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.surface,
              border: Border(
                bottom: BorderSide(
                  color: theme.accent.withOpacity(0.2),
                ),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: theme.key,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _sourceLang,
                      style: TextStyle(
                        color: theme.keyText,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: Icon(Icons.swap_horiz, color: theme.accent),
                  onPressed: _swapLanguages,
                  padding: EdgeInsets.zero,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: theme.key,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _targetLang,
                      style: TextStyle(
                        color: theme.keyText,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Source text input
          Container(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _sourceController,
              style: TextStyle(color: theme.keyText),
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Enter text to translate...',
                hintStyle: TextStyle(color: theme.keySecondaryText),
                filled: true,
                fillColor: theme.key.withOpacity(0.5),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Translate button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isTranslating ? null : _translate,
                icon: _isTranslating
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(theme.keyText),
                        ),
                      )
                    : Icon(Icons.translate, color: theme.keyText),
                label: Text(
                  _isTranslating ? 'Translating...' : 'Translate',
                  style: TextStyle(
                    color: theme.keyText,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.accent,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ),

          // Translation result
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.key.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: theme.accent.withOpacity(0.2),
                ),
              ),
              child: _translatedText.isEmpty
                  ? Center(
                      child: Text(
                        'Translation will appear here',
                        style: TextStyle(
                          color: theme.keySecondaryText,
                          fontSize: 14,
                        ),
                      ),
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: SingleChildScrollView(
                            child: Text(
                              _translatedText,
                              style: TextStyle(
                                color: theme.keyText,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton.icon(
                              onPressed: () {
                                provider.appendText(_translatedText);
                                provider.setMode(KeyboardMode.keyboard);
                              },
                              icon: Icon(Icons.check, size: 16, color: theme.accent),
                              label: Text(
                                'Use Translation',
                                style: TextStyle(color: theme.accent),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
