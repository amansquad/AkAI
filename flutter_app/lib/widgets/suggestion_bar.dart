import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../app/theme/app_theme.dart';

class SuggestionBar extends StatelessWidget {
  const SuggestionBar({super.key});

  @override
  Widget build(BuildContext context) {
    final keyboardProvider = context.watch<KeyboardProvider>();
    final AkaiPalette theme = context.watch<ThemeProvider>().currentTheme;
    final suggestions = keyboardProvider.suggestions;

    if (keyboardProvider.mode != KeyboardMode.keyboard) {
      return const SizedBox.shrink();
    }

    final isMatrix = theme.name == 'Matrix';

    final bool isSearching = keyboardProvider.isSearching;
    
    return Container(
      height: 38,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isMatrix ? Colors.black.withOpacity(0.85) : Colors.transparent,
        borderRadius: isMatrix ? const BorderRadius.vertical(top: Radius.circular(12)) : null,
      ),
      child: isSearching 
        ? Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.amber,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text('SEARCHING', style: TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  keyboardProvider.searchQuery,
                  style: TextStyle(color: theme.keyText, fontSize: 16, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              TextButton(
                onPressed: () => keyboardProvider.finishSearch(KeyboardMode.stickers), // Default back to stickers
                style: TextButton.styleFrom(
                  backgroundColor: theme.accent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                child: const Text('FINISH', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11)),
              ),
            ],
          )
        : ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: suggestions.length,
            itemBuilder: (context, index) {
              final suggestion = suggestions[index];
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Material(
                  color: index == 0 && theme.name == 'Matrix' 
                      ? theme.accent.withOpacity(0.95) 
                      : theme.key.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(20),
                  child: InkWell(
                    onTap: () => keyboardProvider.applySuggestion(suggestion),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                      child: Text(
                        suggestion,
                        style: TextStyle(
                          color: index == 0 && theme.name == 'Matrix' 
                              ? Colors.black 
                              : theme.keyText,
                          fontSize: 16,
                          shadows: [
                            if (index == 0 && theme.name == 'Matrix')
                              const Shadow(color: Colors.white24, blurRadius: 4),
                          ],
                          letterSpacing: 0.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
    );
  }
}
