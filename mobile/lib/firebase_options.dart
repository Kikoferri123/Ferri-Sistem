// Firebase options placeholder - replace with real values from Firebase Console
// ignore_for_file: type=lint

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (defaultTargetPlatform == TargetPlatform.android) {
      return android;
    }
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return ios;
    }
    throw UnsupportedError(
      'DefaultFirebaseOptions are not supported for this platform.',
    );
  }

  // TODO: Replace with real Firebase config from console.firebase.google.com
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'YOUR-ANDROID-API-KEY',
    appId: '1:000000000:android:000000000',
    messagingSenderId: '000000000',
    projectId: 'dream-abroad',
    storageBucket: 'dream-abroad.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'YOUR-IOS-API-KEY',
    appId: '1:000000000:ios:000000000',
    messagingSenderId: '000000000',
    projectId: 'dream-abroad',
    storageBucket: 'dream-abroad.appspot.com',
    iosBundleId: 'com.dreamabroad.mobile',
  );
}
