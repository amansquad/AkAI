# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Ethiopian, Amharic–English bilingual mobile users — people who type in both Ge'ez script and English daily, in Ethiopia or diaspora, and want a keyboard that handles both natively rather than switching apps or fighting a bolted-on transliteration layer.

## Product Purpose

AkAI is a custom Android keyboard (IME) for bilingual Amharic/English typing. It exists so switching languages, translating on the fly, and expressing yourself (stickers, GIFs, handwriting input) all happen inside the keyboard itself, without leaving the app you're typing into. Success is measured by adoption as a user's default keyboard and by typing/translation actually feeling faster and more natural than the stock options.

## Positioning

Full native Ge'ez-script QWERTY plus English in one keyboard, with AI translation built into the typing surface itself (not a separate translator app) and canvas-based AI handwriting recognition for entering Amharic characters by hand. A neighboring keyboard app can offer one language or bolt on translation as a feature; it can't truthfully claim the bilingual-native + in-keyboard-AI combination as its mechanism.

## Operating Context

- The web project (this repo root: Next.js + Tailwind + shadcn) serves two distinct roles:
  - `src/app/page.tsx` — the public marketing/landing site: explains the app, shows features, drives Play Store downloads. **This is the surface in scope for the current redesign.**
  - `/keyboard-ime`, `/mobile` — the actual functional keyboard UI, runnable in-browser and wrapped for Android via Capacitor. **Out of scope for this redesign** — left as-is, since it's an Operate surface (density, native-feeling affordances) with different constraints than a marketing page.
- A separate native Flutter app (`flutter_app/`) also ships the keyboard for Android; not part of this web redesign.
- Users discover AkAI via the marketing site, install from the Play Store, then live inside the keyboard itself day to day — the marketing site's job is the one-time conversion moment, not ongoing use.

## Capabilities and Constraints

- Bilingual typing: full QWERTY (English) + complete Ge'ez script with all vowel forms (Amharic).
- AI-powered translation between English and Amharic, inline in the keyboard.
- Canvas-based AI handwriting recognition for Amharic character entry.
- Stickers and GIFs, including Ethiopian-themed collections (Giphy-backed).
- 20+ themes including live/animated themes and football-club (team) themes; theming is a real, differentiated feature, not decoration.
- Privacy-first: on-device, no keylogging, no data collection — an explicit, repeated claim in current marketing copy.
- Distribution: Android via Play Store (primary); the web app also self-hosts a browser-runnable version of the keyboard.

## Brand Commitments

- The name **AkAI** is fixed and must be preserved.
- Existing brand assets on hand: `public/logo.svg`, `public/akai-icon.png`, `public/keyboard-icon.png`.
- Everything else — color, typography, imagery, layout, tone — is open for the redesign. No requirement to keep current Ethiopian-flag-gradient treatment or any other current visual choice; cultural signal (if any) is a new-work decision, not a constraint carried over from today's implementation.

## Evidence on Hand

- Feature set and copy in `src/app/page.tsx` (FEATURES, HOW_IT_WORKS, STATS, TRANSLATION_EXAMPLES arrays) — real product content, not placeholder.
- Real Amharic translation example pairs (e.g. "Hello, how are you?" → "ሰላም፣ እንዴት ነህ?").
- Theme preview assets in `public/themes/*.png` and `public/judah_lion.png`.
- No customer testimonials, press mentions, or usage-count claims currently exist — do not fabricate any; the current "20+ themes" / stat-row style claims are counts of real shipped features, not invented social proof.

## Product Principles

1. Bilingual is the point, not an afterthought — Amharic and English get equal visual and functional weight; nothing should read as "English app with Amharic bolted on."
2. Privacy-first is a real claim, not marketing filler — the redesign should state it plainly rather than burying it as one feature tile among six identical ones.
3. Theming is a differentiator — with 20+ themes including live/animated and team themes, the marketing site should show real theme variety, not one generic screenshot.
4. Ship for the actual device — most users will view this on a phone browser before ever opening the Play Store; mobile is the primary viewport, not an afterthought to a desktop design.
5. The AI features (translation, handwriting) are the mechanism that differentiates AkAI from a plain bilingual keyboard — they should read as the product's core intelligence, not a bullet in a feature grid.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established beyond standard web accessibility (contrast, keyboard navigation, readable Ge'ez-script typography at real sizes).
