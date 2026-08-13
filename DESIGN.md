# Design System

<!-- impeccable:design-schema 1 -->

## Visual World

**Ethiopian Airlines Confidence** — AkAI as Ethiopia's keyboard export. The same design confidence that made Ethiopian Airlines globally recognizable, applied to software that treats both scripts as equals from day one.

## Palette

**Ground:**
- Deep charcoal: `rgb(18, 18, 20)` — near-black background, the stage for content
- Subtle overlays: `white/5`, `white/10` for cards and surfaces
- Gradients: emerald washes at 5% opacity for depth

**Primary (Emerald):**
- Main: `rgb(16, 185, 129)` / `emerald-500` — Ethiopian Airlines signature green
- Hover: `rgb(5, 150, 105)` / `emerald-600`
- Accent: emerald at 10% for surfaces, 20% for glows

**Secondary (Gold):**
- Accent: `rgb(251, 191, 36)` / `amber-500` — warm gold for AI/premium features
- Used sparingly: AI indicators, premium badges, "instant" callouts

**Text:**
- Primary: `white` — high contrast on dark ground
- Secondary: `white/60` — body text, descriptions
- Tertiary: `white/40` — labels, metadata
- On emerald: `white` for maximum contrast

**Borders:**
- Subtle: `white/10` — default card borders
- Interactive: `white/20` — hover states
- Emerald: `emerald-500/20` to `emerald-500/50` — active/focused states

## Typography

**Font Stack:**
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```
Clean geometric sans. System fonts ensure instant load and native feel on every platform.

**Scale:**
- Display (hero): `text-5xl` (48px) → `text-7xl` (72px) on desktop
- Heading: `text-4xl` (36px) → `text-5xl` (48px)
- Subheading: `text-xl` (20px) → `text-2xl` (24px)
- Body: `text-base` (16px) → `text-lg` (18px)
- Small: `text-sm` (14px)
- Metadata: `text-xs` (12px)

**Tracking:**
- Display text: `tracking-tight` (-0.025em) — confident, no letterspacing gaps
- Uppercase labels: `tracking-widest` (0.1em) — "KEYBOARD", "AI TRANSLATION"

**Weight:**
- Bold: `font-bold` (700) — headlines, stats, CTAs
- Semibold: `font-semibold` (600) — subheadings, labels
- Medium: `font-medium` (500) — interactive elements
- Regular: (400) — body text

## Material & Depth

**Surfaces:**
- Cards: `bg-gradient-to-br from-white/[0.07] to-white/[0.02]` with `backdrop-blur-sm`
- Elevated: add `border border-white/10`
- Interactive: `hover:border-emerald-500/30` transition

**Shadows:**
- Soft depth: `shadow-2xl` with `shadow-black/60` for phone mockups
- Glow effects: `blur-3xl` with emerald or amber at 20% opacity
- Card lift: `shadow-md` on hover for interactive cards

**Corners:**
- Hero elements: `rounded-3xl` (24px)
- Cards: `rounded-2xl` (16px)
- Buttons: `rounded-lg` (8px)
- Pills/badges: `rounded-full`

## Motion

**Philosophy:** Confident, purposeful transitions. Motion shows engineering quality, not decoration.

**Timing:**
- Fast interactions: 150ms — hover, active states
- Smooth reveals: 300ms — card hovers, border transitions
- Section reveals: 600-800ms — scroll-triggered animations
- Typewriter: 50ms per character — interactive demo

**Easing:**
- Default: ease-out — deceleration feels natural
- Spring: `type: 'spring', stiffness: 300, damping: 30` — button interactions
- Smooth: `ease: 'easeInOut'` — floating elements, pulse effects

**Patterns:**
- Scroll-parallax: hero moves at 0.3x scroll speed, fades at 0.25 viewport
- Stagger: features reveal with 100ms delay per item
- Pulse: 1.5-3s infinite loops for live indicators
- Float: `y: [0, -10, 0]` over 3s for accent elements

**Prohibited:**
- No scattered entrance effects (everything fading/sliding from same direction)
- No motion on every section (one authored moment per page region)
- No bouncy/elastic springs on large elements

## Components

**Buttons:**
- Primary CTA: emerald-500 background, white text, h-14 height, px-8 padding
- Secondary: outline with white/20 border, hover:bg-white/5
- Ghost: text-only, hover:bg-white/5
- All buttons: font-semibold, rounded-lg, smooth transitions

**Cards (Features):**
- Gradient background: `from-white/[0.07] to-white/[0.02]`
- Border: `border-white/10` → `hover:border-emerald-500/30`
- Icon container: 56px square, rounded-xl, emerald-500/10 background
- Stat display: emerald-500 color, 2xl font size, bottom section

**Interactive Demo:**
- Split sections: English input (white/5 bg) → AI arrow (amber spark) → Amharic output (emerald-500/10 bg)
- Typewriter cursor: 0.5px width, emerald-500, blink every 0.8s
- Language badges: 32px square, rounded-lg, emerald/10 background

**Theme Cards:**
- Aspect ratio: 4:3
- Gradient overlay: `from-black/80 via-black/20 to-transparent`
- Hover: scale(1.05), lift -5px, emerald-500/50 border ring
- Color dot: 32px circle showing theme gradient

**Phone Mockup:**
- Frame: zinc-700 to zinc-900 gradient, 2.5rem border radius
- Notch: 32px width, black, rounded-b-3xl
- Screen: white background (hardcoded light — phones don't follow visitor OS theme)
- Glow: emerald-500/20 blur-3xl, -inset-20

## Layout & Spacing

**Max widths:**
- Hero content: 7xl (1280px)
- Feature sections: 7xl (1280px)
- CTA sections: 4xl (896px)
- Phone mockup: 5xl (1024px)

**Section padding:**
- Vertical: py-32 (128px) on desktop, py-20 (80px) on mobile
- Horizontal: px-4 (16px) mobile → px-6 (24px) tablet → px-8 (32px) desktop

**Grid systems:**
- Features: 4 columns on desktop, 2 on tablet, 1 on mobile, gap-6
- Themes: 3 columns on desktop, 2 on tablet, 2 on mobile, gap-4
- Stats: 3 columns always, gap-6

**Rhythm:**
- Tight groups: mb-2 to mb-4 for labels and paired text
- Section separation: mb-20 between major blocks
- Generous breathing room: sections never touch

## Modes & States

**Hero States:**
- Translation auto-cycles every 4 seconds
- Typewriter animation: 50ms per character, 500ms initial delay
- Scroll-parallax: content moves and fades as user scrolls

**Interactive States:**
- Hover: scale(1.05) for theme cards, border color shift for feature cards
- Active: scale(0.95) for buttons, brightness-90 for keyboard keys
- Focus: visible focus rings (default browser) on all interactive elements
- Loading: pulse animation on live indicator badges

**Modal (Demo):**
- Backdrop: black/80 with backdrop-blur-sm
- Enter: scale from 0.9 to 1, opacity 0 to 1
- Exit: reverse animation
- Sticky header: backdrop-blur-xl, maintains context while scrolling

## Responsive Behavior

**Breakpoints:**
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (sm - lg)
- Desktop: > 1024px (lg+)

**Hero:**
- Mobile: single column, text then demo
- Desktop: two-column grid (text | interactive demo)
- Headline: 48px → 72px scale

**Features:**
- Mobile: 1 column stack
- Tablet: 2 columns
- Desktop: 4 columns in row

**Themes:**
- Mobile/Tablet: 2 columns
- Desktop: 3 columns

**Phone Mockup:**
- Fixed 340px width, scales down proportionally on narrow viewports
- Centered always

## Copy Voice

**Headlines:** Direct, confident claims. No hedging.
- "One keyboard. Both languages. No compromise."
- "Stop compromising. Start typing."

**Body:** Technical clarity, bilingual reality.
- "Native Ge'ez script + English QWERTY with AI translation built into the typing surface."
- "Made for Ethiopia's bilingual reality."

**CTAs:** Action verbs, immediate value.
- "Try Interactive Demo"
- "Download for Android"
- Not: "Learn more", "Get started"

**Stats:** Numbers with context.
- "2 Scripts Native" not "Dual Language"
- "0 Data Sent" not "Private"

## Patterns to Refuse

**Generic SaaS defaults:**
- ❌ Purple-cyan gradients (unless in real theme showcase)
- ❌ "Get started" CTAs
- ❌ Scattered fade-up entrances
- ❌ Three-column feature grids (we use 4)

**AI tells:**
- ❌ Soft/rounded everything
- ❌ Gradient on every surface
- ❌ Motion on every element
- ❌ Placeholder "Lorem ipsum" content

**What we do instead:**
- ✅ Emerald green (Ethiopian Airlines signature)
- ✅ Confident, specific CTAs ("Try Interactive Demo", "Download App")
- ✅ One authored scroll-parallax moment (hero only)
- ✅ Real product content (actual translations, real theme names)

## Assets

**Logo:**
- `akai-icon.png` — 512x512 app icon
- Used: 48px in nav (desktop), 40px in footer

**Theme Screenshots:**
- Located: `/public/themes/*.png`
- Format: actual keyboard screenshots, not mockups
- Used: theme showcase grid at 4:3 aspect ratio

**No placeholder imagery.** Every visual is real product artifact.

## Surface Brief: Homepage (`src/app/page.tsx`)

**Mode:** Persuade

**Goal:** Drive Play Store downloads by proving bilingual is the mechanism, not a feature checkbox.

**Key Proof Points:**
1. Interactive typing demo shows both scripts live
2. AI translation happens inline (not separate app)
3. 20+ themes are real (screenshots shown)
4. Privacy (0 data sent) is measurable

**First Viewport:**
- Headline + interactive translation demo side-by-side
- Immediate CTA (Try Demo + Download)
- Stats row (2 scripts, 20+ themes, 0 data)

**Scroll Flow:**
- Hero (proof) → Features (depth) → Themes (variety) → Phone mockup (real product) → Final CTA

**Success Metric:**
- Visitor understands "native bilingual" within 3 seconds
- Primary action: Download APK or try demo

## Technical Notes

**Framework:** Next.js 16 with TypeScript, Tailwind CSS, Framer Motion
**Theme:** Custom dark mode (hardcoded, not system-dependent for this marketing page)
**Fonts:** System font stack (instant load, native feel)
**Performance:** Static generation, minimal JavaScript, optimized images

**Component Structure:**
- Single-file page component (`src/app/page.tsx`)
- Uses `KeyboardApp` component for embedded demo
- No route splitting (marketing page is one scroll story)

---

**Seed:** 0b120b1b (Global Tech Confidence)  
**Last updated:** 2026-08-13  
**Status:** Production-ready
