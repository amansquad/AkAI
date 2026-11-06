import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
///
/// To regenerate this file, run `flutterfire configure`.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  // Values mirror android/app/google-services.json (project akai-cfb0f).
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDoqmOmCRizVgyrEh36fAql9yTrVT-aEXU',
    appId: '1:187820402931:android:c37503e910ee6d82936f86',
    messagingSenderId: '187820402931',
    projectId: 'akai-cfb0f',
    storageBucket: 'akai-cfb0f.firebasestorage.app',
  );

  // iOS is not a shipping target; no iOS app is registered in Firebase.
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'YOUR_IOS_API_KEY',
    appId: 'YOUR_IOS_APP_ID',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    iosBundleId: 'com.example.akaiApp',
  );
}
