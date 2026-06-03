import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../settings/settings_provider.dart';
import '../theme/app_theme.dart';
import '../onboarding/onboarding_screen.dart';

class OnboardingHost extends StatelessWidget {
  const OnboardingHost({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AkaiSettingsProvider()..load(),
      child: Consumer<AkaiSettingsProvider>(
        builder: (context, settings, _) {
          return MaterialApp(
            title: 'Akai Keyboard',
            debugShowCheckedModeBanner: false,
            theme: AkaiTheme.buildTheme(settings.palette),
            home: const OnboardingScreen(),
          );
        },
      ),
    );
  }
}
