import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../keyboard/keyboard_controller.dart';
import '../keyboard/keyboard_service.dart';
import '../keyboard/keyboard_widget.dart';
import '../settings/settings_provider.dart';

import '../theme/live_theme_background.dart';

class AkaiKeyboardHost extends StatefulWidget {
  const AkaiKeyboardHost({super.key});

  @override
  State<AkaiKeyboardHost> createState() => _AkaiKeyboardHostState();
}

class _AkaiKeyboardHostState extends State<AkaiKeyboardHost> {
  late final AkaiKeyboardService _service;
  late final AkaiKeyboardController _controller;
  late final AkaiSettingsProvider _settings;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.dark);
    _service = AkaiKeyboardService();
    _service.initialize();
    _controller = AkaiKeyboardController(_service);
    _settings = AkaiSettingsProvider();
    _settings.load();
  }

  @override
  void dispose() {
    _controller.dispose();
    _settings.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Akai Keyboard',
      debugShowCheckedModeBanner: false,
      home: ChangeNotifierProvider<AkaiSettingsProvider>.value(
        value: _settings,
        builder: (context, _) {
          final palette = _settings.palette;
          return Scaffold(
            backgroundColor: Colors.transparent,
            resizeToAvoidBottomInset: false,
            body: Stack(
              children: [
                if (palette.liveTheme != null)
                  Positioned.fill(
                    child: LiveThemeBackground(palette: palette),
                  ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    width: double.infinity,
                    color: palette.liveTheme != null
                        ? Colors.transparent
                        : palette.background,
                    child: AkaiKeyboard(controller: _controller),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
