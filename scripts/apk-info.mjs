// Records what the site says about the APK it serves, public/AkAI-keyboard.apk,
// which is the native Kotlin keyboard (native_keyboard/). Run it whenever that
// APK is replaced (`npm run apk:info`). It writes:
//   - src/lib/apk-info.json: version, size and minimum Android for the
//     landing page's download button
//   - public/app-version.json: what the app's "Check for updates" reads
//
// Both take the version and minSdk from native_keyboard/app/build.gradle, so
// the page, the update check and the app itself always agree.
import { readFileSync, statSync, writeFileSync } from 'node:fs';

const gradle = readFileSync('native_keyboard/app/build.gradle', 'utf8');
const read = (re, what) => {
  const m = re.exec(gradle);
  if (!m) throw new Error(`apk-info: no ${what} in native_keyboard/app/build.gradle`);
  return m[1];
};
const versionCode = Number(read(/versionCode\s*=?\s*(\d+)/, 'versionCode'));
const versionName = read(/versionName\s*=?\s*"([^"]+)"/, 'versionName');
const minSdk = Number(read(/minSdk\s*=?\s*(\d+)/, 'minSdk'));

// API level -> the Android version people know it by.
const ANDROID_BY_API = { 24: '7.0', 25: '7.1', 26: '8.0', 27: '8.1', 28: '9', 29: '10', 30: '11', 31: '12', 32: '12L', 33: '13', 34: '14', 35: '15', 36: '16' };

const info = {
  version: versionName,
  sizeBytes: statSync('public/AkAI-keyboard.apk').size,
  minAndroid: ANDROID_BY_API[minSdk] ?? String(minSdk),
};
writeFileSync('src/lib/apk-info.json', JSON.stringify(info, null, 2) + '\n');

// Keep any release notes already written for this version.
let notes = '';
try {
  const prev = JSON.parse(readFileSync('public/app-version.json', 'utf8'));
  if (prev.versionCode === versionCode) notes = prev.notes ?? '';
} catch {}
const release = { versionCode, versionName, url: '/AkAI-keyboard.apk', notes };
writeFileSync('public/app-version.json', JSON.stringify(release, null, 2) + '\n');

console.log('apk-info:', info, release);
