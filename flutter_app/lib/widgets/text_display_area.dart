import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/keyboard_provider.dart';
import '../providers/theme_provider.dart';
import '../app/theme/app_theme.dart';

class TextDisplayArea extends StatelessWidget {
  const TextDisplayArea({super.key});

  @override
  Widget build(BuildContext context) {
    final keyboardProvider = context.watch<KeyboardProvider>();
    final AkaiPalette theme = context.watch<ThemeProvider>().currentTheme;

    return Container(
      color: theme.background.withOpacity(0.95), // slightly darker
      child: Column(
        children: [
          // App-like Header bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: theme.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: SafeArea(
              bottom: false,
              child: Row(
                children: [
                  Icon(Icons.chat_bubble_outline, color: theme.accent, size: 22),
                  const SizedBox(width: 12),
                  Text(
                    'Preview Workspace',
                    style: TextStyle(
                      color: theme.keyText,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: theme.accent.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${keyboardProvider.wordCount} words',
                      style: TextStyle(
                        color: theme.accent,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              reverse: true, // Content grows from bottom
              children: [
                // Sender mock profile piece
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Chat Bubble container
                    Expanded(
                      child: Container(
                        margin: const EdgeInsets.only(left: 40),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              theme.accent.withOpacity(0.9),
                              theme.accent,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(20),
                            topRight: Radius.circular(20),
                            bottomLeft: Radius.circular(20),
                            bottomRight: Radius.circular(4),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: theme.accent.withOpacity(0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            )
                          ],
                        ),
                        child: TextField(
                          controller: TextEditingController(text: keyboardProvider.text),
                          maxLines: null,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            height: 1.4,
                          ),
                          cursorColor: Colors.white,
                          decoration: InputDecoration(
                            hintText: 'Start typing to see live previews...',
                            hintStyle: TextStyle(
                              color: Colors.white.withOpacity(0.6),
                            ),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                          onChanged: (value) {
                            keyboardProvider.updateText(value);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
                
                // Add a welcome mock message above it
                if (keyboardProvider.text.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 24.0, right: 40, top: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: theme.surfaceVariant,
                          child: Icon(Icons.smart_toy, size: 18, color: theme.keyText),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: theme.surface,
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(20),
                              topRight: Radius.circular(20),
                              bottomLeft: Radius.circular(4),
                              bottomRight: Radius.circular(20),
                            ),
                            border: Border.all(
                              color: theme.surfaceVariant,
                            ),
                          ),
                          child: Text(
                            'Hey! Use the keyboard below\nto try writing in Amharic 🇪🇹',
                            style: TextStyle(
                              color: theme.keyText,
                              fontSize: 15,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
