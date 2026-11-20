# Publishing on Google Play

The website APK and the Play build come from the same code. The only
difference is the `-Pplay=true` switch: in the Play build, Settings → Check for
updates opens the Play listing instead of downloading the APK from the site
(Play doesn't allow apps to update themselves from anywhere else).

## Build the bundle

Play takes an app bundle (`.aab`), not an APK.

- **From GitHub:** pushing a version tag (`git tag v1.0.23 && git push origin v1.0.23`)
  attaches `AkAI-keyboard-v1.0.23-play.aab` to the release.
- **Locally** (with Android Studio's JDK, as for any release build):

      cd native_keyboard
      JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew -Pplay=true :app:bundleRelease
      # → app/build/outputs/bundle/release/app-release.aab

The bundle is signed with the release key (`akai-release.jks`). On Play it
becomes the **upload key**: when Play asks, choose "Use Google-generated key"
for Play App Signing. Keep the `.jks`. Losing it means asking Google to reset
the upload key, which takes days.

Every upload needs a higher `versionCode` than the last one, the same rule as
the website's update check.

Already checked for this app: target SDK 36 (Play wants 35 or newer), and
the 64-bit handwriting library is aligned for 16 KB memory pages.

## One-time Play Console setup

1. Create the app: name **AkAI Keyboard**, app (not game), free.
2. **Privacy policy:** `https://ak-ai-opal.vercel.app/privacy`
3. **App access:** everything works without signing in.
4. **Ads:** no ads.
5. **Content rating questionnaire:** a utility. Answer "yes" to *users can
   interact or exchange content* only if you count the Community themes and
   the Sticker Marketplace, which show content other people added. It's safest
   to answer yes and mention that shared theme names are word-filtered and
   reportable.
6. **Target audience:** 13 and over (the privacy policy says it isn't for
   children under 13).
7. **Permissions:** `RECORD_AUDIO` is for voice typing. The app asks for it the
   first time the mic is used; say so in the declaration.
8. **Data safety:** see below.
9. Upload the `.aab` to **Internal testing** first, install it from the
   testing link on a phone, and turn the keyboard on to check it, before
   promoting to production.

New personal developer accounts must run a closed test with at least 12
testers for 14 days before production is unlocked.

## Store listing

**Short description** (80 characters max):

> Type Amharic, Tigrinya, Oromo, Somali, Arabic & English. Translate as you type.

**Full description:**

> AkAI is a keyboard for people who write in more than one language. Type in
> Amharic and Tigrinya (Ge'ez fidel or phonetic: "selam" gives ሰላም), Afaan
> Oromoo, Somali, Arabic and English, and switch with one key.
>
> • Fidel board with every vowel form, or phonetic typing
> • Swipe typing, suggestions and auto-correct, learned on your phone
> • Translate and rewrite (fix, formal, friendly, shorter) inside the keyboard
> • Handwriting for Amharic and English, read on your phone
> • Emoji, GIFs, Telegram sticker packs and song lyrics
> • 98 themes: live, cultural, faith and football, or make your own
> • One-handed and floating modes, cursor keys, adjustable key size and sound
>
> Private by design: what you type stays on your phone. No accounts, no ads,
> no tracking. Online features send only what you give them, when you use
> them. See the privacy policy for exactly what goes where.

**Graphics:** 512×512 icon (`public/akai-icon.png`, resized), a 1024×500
feature graphic, and at least two phone screenshots. Real captures from the app
are in `public/themes/`.

**Category:** Tools. **Tags:** keyboard, Amharic.

## Data safety answers

These match `/privacy`. If a feature changes what it sends, update both.

**Does the app collect or share user data?** Yes (collected; not shared, since
the services below process data on AkAI's behalf).

| Data type | Collected | Why | Optional? |
|---|---|---|---|
| Messages → Other in-app messages *(text sent to Translate / Rewrite)* | Yes, not stored | App functionality | Yes, only when the user asks |
| App activity → Other user-generated content *(handwriting drawings the phone couldn't read)* | Yes, not stored | App functionality | Yes |
| Audio → Voice | **No.** Android's own speech service handles it, not AkAI | n/a | n/a |
| App activity → In-app search history *(GIF, lyrics and sticker searches)* | Yes, not stored | App functionality | Yes |
| App activity → Other user-generated content *(shared community themes)* | Yes, stored and public | App functionality | Yes |
| Device or other IDs *(random id the app makes; stored hashed)* | Yes | Fraud prevention / security (daily limits, one install and report per phone) | No, sent with the features above |

- **Is data encrypted in transit?** Yes (HTTPS only).
- **Can users request deletion?** There are no accounts. Users can take down
  their shared themes in the app; daily counts expire after a week.
- **Data is not used for** advertising, analytics or personalisation by a server.
- **Typed text in general:** not collected. Say this plainly in the listing,
  since keyboards get extra scrutiny.
