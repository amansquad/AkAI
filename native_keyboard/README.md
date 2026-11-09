# AkAI Native Keyboard

A standalone Android keyboard drawn natively in Kotlin, for typing speed. It is
separate from the web-based keyboard in `../android` and from `../flutter_app`,
and installs next to them (`com.akai.nativekb`).

Why it is faster: the keys are one custom `View` drawing on a canvas. A touch
finds its key from plain arrays and the letter is committed on touch-down;
vibration and sound come after. No WebView, JavaScript, React or bridge.

## What it has
- English QWERTY, Amharic fidel board (with the vowel row), phonetic Amharic
  (type "selam", get ሰላም), and symbols boards for both languages
- Number, phone and date pads, chosen from the focused field's type, with a
  "123" key to come back to the pad after leaving it
- Email, URL and password fields: English only, no auto-capitals, no suggestions
- Toolbar and suggestion strip: emoji, voice typing, settings, three word
  suggestions (same word lists as the web keyboard)
- Emoji panel (categories, recents, scrolling) and clipboard history
- Long-press bubble: a letter's accents, or a consonant's whole vowel family
  (slide to one and let go)
- Shift, double-tap caps lock, auto-capitals, double-space period
- Hold-to-repeat backspace that speeds up, space-bar swipe to move the cursor
- Enter shows the field's action (Go, Search, Send, Next, Done)
- Settings screen: theme (system, light, dark, ocean, forest, rose), key
  height, one-handed mode, number row, corner hints, suggestions, vibration
  strength, click sound

## Not here
Handwriting, GIFs, translation and live-wallpaper themes. Handwriting needs a
recognition service and GIFs need an online catalogue; both live in the web
keyboard.

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

## Tests

    ./gradlew.bat :app:testDebugUnitTest

Covers the phonetic transliteration engine.

## Amharic data
`KeyboardData.kt` is generated from the web keyboard's `keyboard-data.ts`:

    node native_keyboard/tools/gen-data.mjs
