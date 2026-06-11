import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

import 'app/app.dart';
import 'mobile_keyboard_app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('Firebase initialization error: $e');
  }
  
  // Run mobile keyboard app
  runApp(const MobileKeyboardApp());
}

@pragma('vm:entry-point')
void keyboardMain() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AkaiKeyboardHost());
}
