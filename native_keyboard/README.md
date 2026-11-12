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
  or phonetic typing ("selam" gives ሰላም), chosen in settings; one language key
  switches English and Amharic, and holding it flips fidel and phonetic.
  Symbols boards for both languages
- Number, phone and date pads chosen from the focused field's type, with a
  "123" key to come back to the pad after leaving it
- Email, URL and password fields: English only, no auto-capitals, no
  suggestions, nothing learned
- Swipe typing: slide across the letters to type a word; the other readings
  appear in the suggestion strip. In English; in phonetic Amharic over the
  word's Latin spelling ("selam", or the usual "salam" for ሰላም); and on the
  fidel board over its consonants, whatever their vowels (ሰ ለ መ gives ሰላም)
- Auto-correct for English (common typos, missing apostrophes, one-letter
  slips); backspace straight after a correction puts back what you typed, and
  that word is then left alone
- Amharic completions from a 20,000-word list, allowing for the vowel not yet
  chosen (ሰለ or phonetic "sel" already offers ሰላም). A misspelt Amharic word
  (a wrong vowel, or a sound-alike letter such as ሰ for ሠ) gets its fix
  offered first; fixing it on space is a setting, off by default, since the
  list holds only some of the forms an Amharic word can take
- Toolbar and suggestion strip: line icons in the theme's colours; choose which
  buttons show (emoji, stickers, GIFs, clipboard, handwriting, translate,
  themes, voice; settings is always there). With more than three, the toolbar
  folds behind one button while there are suggestions. Up to three suggestions
  from your own words and a 20,000-word English list
- Word of the day on its own row above the toolbar (tap it to type the word)
- Panels: emoji (categories, recents, skin tones, search), stickers (the web
  keyboard's twelve sets, Ethiopia included), GIFs, clipboard history with
  pinning, handwriting, translate, themes
- Emoji search: type a word ("dog", "lol", "ethiopia") into the strip and tap a
  result
- Long-press bubble: a letter's accents, or a consonant's whole vowel family
- Shift, caps lock, auto-capitals, double-space period, optional space after
  punctuation, hold-backspace to delete the sentence (optional), space-bar
  swipe to move the cursor, and an optional row of cursor keys (⇤ ◀ ▲ ▼ ▶ ⇥)
- Enter shows the field's action (Go, Search, Send, Next, Done)
- 98 themes in five groups (live, solid, cultural, faith, football); live
  themes animate behind the keys at four times the Flutter app's pace, which
  otherwise looked frozen. Key height, spacing, corner roundness,
  label size, letter weight and borders; one-handed mode with an adjustable
  width; number row, corner hints, long-press delay, vibration strength,
  click sound and volume
- TalkBack support: every key is announced and can be activated

## GIFs and the Giphy key
The GIF tab works with no setup, using a built-in catalogue of ~90 GIFs. To get
the full Giphy library, paste your own API key in the app's settings (free at
developers.giphy.com). The key is stored only on the phone, never in this repo.
If Giphy rejects the key, is unreachable or rate-limits, the tab says so and
falls back to the built-in GIFs. GIFs are sent as images where the app accepts
them, otherwise as a link.

## Handwriting and translation
Handwriting is read on the phone with Google ML Kit's digital ink recognition,
in English or Amharic. The first time you write in a language, the keyboard
downloads that language's model (about 20 MB); after that it works offline and
your strokes stay on the phone. If that fails and a server address is set, it
falls back to the AkAI web server.

Translation runs on the AkAI web server (`/api/translate`, which uses OpenAI),
because ML Kit's on-device translation has no Amharic. It uses the AkAI website
(`Net.SITE`) unless another server address is entered in settings; the site
needs `OPENAI_API_KEY` set in Vercel. Nothing is sent anywhere until you use it.

## Updates
Settings → Help → Check for updates reads `app-version.json` from the Vercel
site, `https://ak-ai-opal.vercel.app` (`Net.SITE`; it's the web app's
`public/app-version.json`), whatever server address is set. If its
`versionCode` is higher than the installed one, the app offers to download `url`
(by default `/AkAI-keyboard.apk`). The website's download is this keyboard.
To ship a release: raise `versionCode`/`versionName` in `app/build.gradle`,
build the signed release, copy it over `public/AkAI-keyboard.apk`, then from the
repository root run `npm run apk:info`. That writes `public/app-version.json`
and the download button's version and size from the same numbers (add `notes`
to `app-version.json` by hand if you want them).

## Community themes
Themes → Community lists themes people shared, most installed or newest
first. Tapping one copies it into Mine and uses it. Long-press one of your own
themes under Mine and choose Share to publish it, with an optional name for
credit; Stop sharing (or deleting it) takes it down. Long-press a community
theme to report it. A theme is a few hundred bytes of JSON (name, emoji,
animation, five colours), so previews are drawn from the colours, with no
pictures to host.

The website keeps them in Neon Postgres (added to the Vercel project through
the Marketplace; `DATABASE_URL`). The routes are under `src/app/api/themes`.
There are no accounts: the app sends a random id it makes once
(`X-AkAI-Device`), which the site stores only as a hash. That id allows five
shares a day, one install and one report per theme, and taking down its own
themes. Names go through a word filter, and three reports hide a theme until
it is looked at. From the repository root (reads `.env.local`, which
`vercel env pull` writes):

    npm run themes:db -- setup          # make the tables
    npm run themes:db -- stats
    npm run themes:db -- hidden         # themes hidden by reports
    npm run themes:db -- restore <id>   # or: delete <id>

## Theme pictures
Eight cultural themes (the region flags, Southern Ethiopia, Addis Ababa, the
Judah lion) are a picture rather than an animation. As in the Flutter app the
picture fills the keyboard with a slow zoom and a warm glow, but here the
pictures are bundled (`app/src/main/assets/backdrops/`, 173 KB) instead of
downloaded, so they work offline. They come from the website's `public/`
folder; the region flags there are SVG, which this step turns into images:

    node native_keyboard/tools/gen-backdrops.mjs

The other twelve cultural themes (Ethiopian Flag, Aksum Empire, Lalibela Stone,
Sidama, Gambella, Harari, Benishangul Gumuz, Adey Abeba, Black Gold, and the
Meskel, Timket and South West Ethiopia themes) have animated scenes of their
own in `CulturalScenes.kt`: the flag waving, the Aksum stele under turning sun
rays, the Lalibela cross church, a jebena steaming, a canoe on the river, the
Harar wall at dusk, gold glinting in a river, swaying adey abeba, a honeycomb
with dripping honey and bees, the Demera bonfire, the Timket umbrellas and holy
water, and a misty forest.

The faith themes have scenes of their own too, on the web keyboard's subjects:
the ornate Ethiopian cross with incense and candles, the Meskel cross above
the flames, the Al-Najashi mosque at dusk, the coloured houses of Harar Jegol,
swinging Ramadan lanterns, and the Timkat dove over the blessed water. Holy
Maryam shows the Maryam icon picture with turning light rays.

Every picture theme also has gold sparkles drifting up. The cultural, faith and
football themes, and the picture themes, have keys about 80% opaque so their
scene or picture shows through.

`tools/gen-themes.mjs` rebuilds `ThemeData.kt` from the Flutter palettes. It
files the Flutter faith palettes under "faith" (they carry no category) and
makes the Matrix keys more opaque so the letters stay readable over the rain.

## Word list
`app/src/main/assets/words_en.txt` (swipe typing, auto-correct, completions) is
the top 20,000 words of [FrequencyWords](https://github.com/hermitdave/FrequencyWords)
by Hermit Dave, licensed CC BY-SA 4.0, with contractions rejoined and
profanity removed. That file is under the same licence. To rebuild it, download
`content/2018/en/en_50k.txt` from that repository and run, from this folder:

    node tools/gen-words.mjs path/to/en_50k.txt

`app/src/main/assets/words_am.txt`, the Amharic list, is the 20,000 most
frequent words in the text of [Amharic Wikipedia](https://am.wikipedia.org),
licensed CC BY-SA 4.0 (so this file is too), with the everyday words from the
web keyboard's suggestion lists placed near the top, since Wikipedia is formal.
To rebuild it, download and unpack
`https://dumps.wikimedia.org/amwiki/latest/amwiki-latest-pages-articles.xml.bz2`,
then run, from this folder:

    node tools/gen-words-am.mjs path/to/amwiki-latest-pages-articles.xml

## Privacy
- Clipboard history is kept in memory only. Pinned items are saved, because you
  pinned them. Anything the source marks sensitive is skipped.
- Learned words are saved on the phone (`Forget learned words` clears them) and
  are never learned in email, URL, password or number fields.

## Not here
Translation without a server, and a desktop-style layout (the web keyboard's desktop view has no use on a phone).

Voice typing needs a speech service on the phone, such as Google's, and the
internet for Amharic.

## Voice typing
The mic button opens a voice tab in the keyboard and starts listening through
the phone's speech service (`SpeechRecognizer`), in the keyboard's language;
the tab's top button switches between English and Amharic. The words appear in
the field, underlined, as they are recognised, and are typed when you stop
speaking or tap the mic. The first time, the tab asks for the microphone, which
a small see-through screen (`MicPermissionActivity`) requests, since a keyboard
cannot show the request itself. The keyboard only listens while the voice tab
is open and the mic is lit; leaving the tab or the field stops it. A phone with
no speech service the keyboard can use gets a button for the system's own voice
screen (`VoiceActivity`) instead.

## Build
Needs the Android SDK and a JDK 17-21 (Gradle 8.14 does not run on Java 26;
Android Studio's bundled JDK works).

    export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
    export ANDROID_HOME="C:/Users/HP/AppData/Local/Android/Sdk"
    ./gradlew.bat :app:assembleDebug

The APK is `app/build/outputs/apk/debug/app-debug.apk`. Install it, open the
app, turn the keyboard on, then choose it.

### Release
`./gradlew.bat :app:assembleRelease` makes a shrunk APK of about 13 MB, almost
all of it the handwriting recognizer's native code. The release carries only
the arm builds of that code (every phone); debug builds carry all four, so the
x86 emulator can run handwriting too. To sign
it, create `keystore.properties` next to `settings.gradle` (git-ignored):

    storeFile=../my-release.jks
    storePassword=...
    keyAlias=...
    keyPassword=...

Without that file the release APK is left unsigned. Every update must be
signed with the same key, or phones refuse to install it over the old one, so
keep a backup of the keystore and its passwords.

## Tests

    ./gradlew.bat :app:testDebugUnitTest

Covers the phonetic engine, skin tones, learned suggestions, that every layout
builds, the cursor row, toolbar choices, auto-correct, swipe decoding on a
QWERTY board, dictionary completions and emoji search, and for Amharic: swipe paths on
both boards, phonetic and fidel swipes, completions and corrections.

## Amharic data
`KeyboardData.kt` is generated from the web keyboard's `keyboard-data.ts` and
`giphy-catalog.ts` (Amharic letters, suggestions, layouts, GIFs, sticker sets
and words of the day):

    node native_keyboard/tools/gen-data.mjs
