# AkAI Native Keyboard

A standalone Android keyboard drawn natively in Kotlin, for typing speed. It is
separate from the web-based keyboard in `../android` and from `../flutter_app`,
and installs next to them (`com.akai.nativekb`).

Why it is faster: the keys are one custom `View` drawing on a canvas. A touch
finds its key from plain arrays and the letter is committed on touch-down;
vibration and sound come after. No WebView, JavaScript, React or bridge.

## What it has
- English layouts: QWERTY, Dvorak, AZERTY, Colemak, QWERTZ
- Amharic: fidel board (traditional or most-used-first order) with a vowel row,
  phonetic typing ("selam" gives ሰላም), and symbols boards for both languages
- Number, phone and date pads chosen from the focused field's type, with a
  "123" key to come back to the pad after leaving it
- Email, URL and password fields: English only, no auto-capitals, no
  suggestions, nothing learned
- Toolbar and suggestion strip: emoji/GIF panel, voice typing, settings, and
  three word suggestions that learn the words you type
- Panels: emoji (categories, recents, skin tones), GIFs, clipboard history with
  pinning, handwriting, translate
- Long-press bubble: a letter's accents, or a consonant's whole vowel family
- Shift, caps lock, auto-capitals, double-space period, hold-backspace to
  delete the sentence (optional), space-bar swipe to move the cursor
- Enter shows the field's action (Go, Search, Send, Next, Done)
- Themes (system, light, dark, ocean, forest, rose), key height, one-handed
  mode, number row, corner hints, vibration strength, click sound
- TalkBack support: every key is announced and can be activated

## GIFs and the Giphy key
The GIF tab works with no setup, using a built-in catalogue of ~90 GIFs. To get
the full Giphy library, paste your own API key in the app's settings (free at
developers.giphy.com). The key is stored only on the phone, never in this repo.
If Giphy rejects the key, is unreachable or rate-limits, the tab says so and
falls back to the built-in GIFs. GIFs are sent as images where the app accepts
them, otherwise as a link.

## Handwriting and translation
Both run on the AkAI web server (`/api/handwriting-recognize`, `/api/translate`,
which use OpenAI). Enter the server's address in settings; with it blank those
two tabs say so and do nothing. Nothing is sent anywhere until you use them.

## Privacy
- Clipboard history is kept in memory only. Pinned items are saved, because you
  pinned them. Anything the source marks sensitive is skipped.
- Learned words are saved on the phone (`Forget learned words` clears them) and
  are never learned in email, URL, password or number fields.

## Not here
Auto-correct (suggestions only), emoji search, live-wallpaper themes, and
handwriting/translation that work without a server.

Voice typing opens the system speech recogniser (a keyboard cannot use the
microphone itself), so it needs a recogniser app such as Google's installed.

## Build
Needs the Android SDK and a JDK 17-21 (Gradle 8.14 does not run on Java 26;
Android Studio's bundled JDK works).

    export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
    export ANDROID_HOME="C:/Users/HP/AppData/Local/Android/Sdk"
    ./gradlew.bat :app:assembleDebug

The APK is `app/build/outputs/apk/debug/app-debug.apk`. Install it, open the
app, turn the keyboard on, then choose it.

### Release
`./gradlew.bat :app:assembleRelease` makes a shrunk APK (about 170 KB). To sign
it, create `keystore.properties` next to `settings.gradle` (git-ignored):

    storeFile=../my-release.jks
    storePassword=...
    keyAlias=...
    keyPassword=...

Without that file the release APK is left unsigned.

## Tests

    ./gradlew.bat :app:testDebugUnitTest

Covers the phonetic engine, skin tones, learned suggestions and that every
layout builds.

## Amharic data
`KeyboardData.kt` is generated from the web keyboard's `keyboard-data.ts` and
`giphy-catalog.ts`:

    node native_keyboard/tools/gen-data.mjs
