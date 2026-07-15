import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/keyboard_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/settings_provider.dart';
import '../../widgets/samsung_keyboard_layout.dart';
import '../../widgets/bottom_navigation_bar.dart';
import '../../widgets/suggestion_bar.dart';
import '../../app/theme/live_theme_background.dart';
import '../../widgets/emoji_panel.dart';
import '../../widgets/gif_panel.dart';
import '../../widgets/clipboard_panel.dart';
import '../../widgets/translate_panel.dart';
import '../../widgets/settings_panel.dart';
import '../../widgets/handwriting_panel.dart';

class AkaiKeyboardHost extends StatelessWidget {
  const AkaiKeyboardHost({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => KeyboardProvider(imeMode: true)),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
      ],
      child: const _ImeLiveSync(child: _KeyboardHostView()),
    );
  }
}

/// Reloads theme + settings from disk every time the keyboard is opened, so
/// changes made in the companion app apply instantly without restarting the
/// IME service.
class _ImeLiveSync extends StatefulWidget {
  final Widget child;
  const _ImeLiveSync({required this.child});

  @override
  State<_ImeLiveSync> createState() => _ImeLiveSyncState();
}

class _ImeLiveSyncState extends State<_ImeLiveSync> {
  @override
  void initState() {
    super.initState();
    final keyboard = context.read<KeyboardProvider>();
    final theme = context.read<ThemeProvider>();
    final settings = context.read<SettingsProvider>();
    keyboard.ime.editorStream.listen((_) {
      theme.reload();
      settings.reload();
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

class _KeyboardHostView extends StatelessWidget {
  const _KeyboardHostView();

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          final theme = themeProvider.currentTheme;
          return MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: themeProvider.currentThemeData,
            home: Material(
              color: Colors.transparent,
              child: Align(
                alignment: Alignment.bottomCenter,
                // OverflowBox lets the content lay out at its natural height
                // even when the IME window is currently shorter (e.g. when
                // switching from the keyboard to a taller panel), so the
                // size reporter can measure the desired height and grow the
                // window instead of being clamped by it.
                child: OverflowBox(
                  alignment: Alignment.bottomCenter,
                  minHeight: 0,
                  maxHeight: double.infinity,
                  child: _ImeWindowSizeReporter(
                  // Stack is sized by the keyboard content, so the live
                  // theme is confined to the keyboard area and cannot bleed
                  // out behind the keyboard.
                  child: Stack(
                    children: [
                      if (theme.liveTheme != null)
                        Positioned.fill(
                          child: LiveThemeBackground(
                            key: ValueKey('live_${theme.liveTheme}'),
                            palette: theme,
                          ),
                        )
                      else
                        Positioned.fill(
                          child: Container(
                            key: const ValueKey('solid_bg'),
                            color: theme.background,
                          ),
                        ),

                      // Keyboard content
                      Consumer<SettingsProvider>(
                        builder: (context, settings, _) {
                          return Container(
                            color: theme.background
                                .withOpacity(settings.backgroundOpacity),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const SizedBox(
                                    height: 42, child: SuggestionBar()),
                                const KeyboardBottomNavigationBar(),
                                Consumer<KeyboardProvider>(
                                  builder: (context, provider, _) {
                                    switch (provider.mode) {
                                      case KeyboardMode.keyboard:
                                        // Intrinsic height: no dead space
                                        // below the keys.
                                        return const SamsungKeyboardLayout(
                                            key: ValueKey('keyboard'));
                                      case KeyboardMode.stickers:
                                        return const SizedBox(
                                            height: 340,
                                            child: EmojiPanel(
                                                key: ValueKey('stickers')));
                                      case KeyboardMode.gifs:
                                        return const SizedBox(
                                            height: 340,
                                            child: GifPanel(
                                                key: ValueKey('gifs')));
                                      case KeyboardMode.clipboard:
                                        return const SizedBox(
                                            height: 340,
                                            child: ClipboardPanel(
                                                key: ValueKey('clipboard')));
                                      case KeyboardMode.translate:
                                        return const SizedBox(
                                            height: 340,
                                            child: TranslatePanel(
                                                key: ValueKey('translate')));
                                      case KeyboardMode.settings:
                                        return const SizedBox(
                                            height: 340,
                                            child: SettingsPanel(
                                                key: ValueKey('settings')));
                                      case KeyboardMode.handwriting:
                                        return const SizedBox(
                                            height: 340,
                                            child: HandwritingPanel(
                                                key: ValueKey('handwriting')));
                                    }
                                  },
                                ),
                                // Cushion below the bottom key row so keys
                                // (?123, period) don't sit flush against the
                                // system gesture bar and its hide-keyboard
                                // chevron — taps there dismissed the IME.
                                SizedBox(
                                    height: math.max(
                                        MediaQuery.viewPaddingOf(context)
                                            .bottom,
                                        14.0)),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  ),
                ),
              ),
            ),
          );
        },
    );
  }
}

/// Measures the keyboard content and asks the Android IME service to resize
/// its window to exactly this height, so nothing (live theme, solid color)
/// is drawn outside the keyboard itself.
class _ImeWindowSizeReporter extends SingleChildRenderObjectWidget {
  const _ImeWindowSizeReporter({required Widget child}) : super(child: child);

  @override
  RenderObject createRenderObject(BuildContext context) =>
      _RenderImeWindowSizeReporter(
          MediaQuery.maybeDevicePixelRatioOf(context) ??
              View.of(context).devicePixelRatio);

  @override
  void updateRenderObject(
      BuildContext context, _RenderImeWindowSizeReporter renderObject) {
    renderObject.devicePixelRatio =
        MediaQuery.maybeDevicePixelRatioOf(context) ??
            View.of(context).devicePixelRatio;
  }
}

class _RenderImeWindowSizeReporter extends RenderProxyBox {
  _RenderImeWindowSizeReporter(this.devicePixelRatio);

  static const MethodChannel _channel =
      MethodChannel('com.akai.keyboard/control');

  double devicePixelRatio;
  int? _lastReportedPx;

  @override
  void performLayout() {
    super.performLayout();
    final heightPx = (size.height * devicePixelRatio).ceil();
    if (heightPx > 0 && heightPx != _lastReportedPx) {
      _lastReportedPx = heightPx;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _channel.invokeMethod('updateHeight', {'heightPx': heightPx}).catchError(
            (_) => null); // IME not attached (e.g. running as an app)
      });
    }
  }
}
