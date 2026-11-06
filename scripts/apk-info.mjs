// Records what the download button should say about the APK the site serves:
// its version and size. Run it whenever public/AkAI-keyboard.apk is rebuilt
// (`npm run apk:info`); the landing page reads the result.
//
// The version is package.json's, which android/app/build.gradle also reads, so
// the number on the page is the number inside the app. The minimum Android
// version is read from the same Gradle variables.
import { readFileSync, statSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const vars = readFileSync('android/variables.gradle', 'utf8');
const minSdk = Number(/minSdkVersion\s*=\s*(\d+)/.exec(vars)?.[1]);

// API level -> the Android version people know it by.
const ANDROID_BY_API = { 24: '7.0', 25: '7.1', 26: '8.0', 27: '8.1', 28: '9', 29: '10', 30: '11', 31: '12', 32: '12L', 33: '13', 34: '14' };

const info = {
  version: pkg.version,
  sizeBytes: statSync('public/AkAI-keyboard.apk').size,
  minAndroid: ANDROID_BY_API[minSdk] ?? String(minSdk),
};

writeFileSync('src/lib/apk-info.json', JSON.stringify(info, null, 2) + '\n');
console.log('apk-info:', info);
