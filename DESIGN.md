---
name: AkAI
description: A bilingual Amharic/English keyboard, presented as a letter home on an airmail sheet of perforated stamps.
colors:
  ultramarine-ink: "oklch(0.27 0.13 268)"
  ultramarine-deep: "oklch(0.2 0.1 268)"
  ultramarine-lifted: "oklch(0.36 0.15 268)"
  stamp-paper: "oklch(0.965 0.02 95)"
  print-ink: "oklch(0.22 0.06 268)"
  highland-green: "oklch(0.52 0.14 152)"
  teff-yellow: "oklch(0.86 0.17 92)"
  signal-red: "oklch(0.58 0.21 27)"
  on-ink: "oklch(0.96 0.015 95)"
  on-ink-dim: "oklch(0.84 0.04 265)"
typography:
  display:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "clamp(2.5rem, 7.6vw, 5.8rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "-0.015em"
  geez:
    fontFamily: "Noto Serif Ethiopic, serif"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.68rem"
    fontWeight: 400
    letterSpacing: "0.14em"
rounded:
  button: "4px"
  phone: "38px"
spacing:
  gutter: "16px"
  section: "clamp(64px, 9vw, 120px)"
components:
  button-primary:
    backgroundColor: "{colors.teff-yellow}"
    textColor: "{colors.print-ink}"
    rounded: "{rounded.button}"
    height: "56px"
    padding: "0 1.6rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.button}"
    height: "56px"
  stamp:
    backgroundColor: "{colors.stamp-paper}"
    textColor: "{colors.print-ink}"
    padding: "14px"
---

# Design System: AkAI

## Overview

**Creative North Star: "The Letter Home"**

AkAI is for people who write in two scripts and often to someone far away. The landing world is an airmail sheet: a drenched ultramarine ground, a red/white/blue chevron border, and perforated postage stamps printed in the flag inks. English and Amharic are always set as equal stamps, never as a language and its translation. The one authoritative mark is a dark circular postmark, which is how translation is shown happening.

The page is bold and flat. Depth comes from overlap, tilt, and soft drop shadows under stamps, never from glass, glow, or gradient. Colour commits at page scale: whole bands and whole stamps are one ink.

**Key Characteristics:**
- Ultramarine ground carries the whole page; stamps are the only light objects on it.
- Both scripts at identical weight and size.
- Every container is either a stamp or a bare band; there are no generic cards.
- One authored motion: the postmark dropping on the stamp pair.

## Colors

Drenched ultramarine with three flag inks on cream stamp paper.

### Primary
- **Ultramarine Ink** (oklch(0.27 0.13 268)): the page ground. **Ultramarine Lifted** (oklch(0.36 0.15 268)) alternates as a band background (fidel and themes sections). **Ultramarine Deep** (oklch(0.2 0.1 268)): phone bezel, postmark, demo keyboard ground.
- **Teff Yellow** (oklch(0.86 0.17 92)): the action colour. Primary buttons, headline emphasis, selected chips.

### Secondary
- **Highland Green** (oklch(0.52 0.14 152)) and **Signal Red** (oklch(0.58 0.21 27)): stamp print fields, alternating. Text on them is white.

### Neutral
- **Stamp Paper** (oklch(0.965 0.02 95)): stamp surface and chevron stripes only. **Print Ink** (oklch(0.22 0.06 268)): text on paper and on yellow. **On-Ink** (oklch(0.96 0.015 95)) and **On-Ink Dim** (oklch(0.84 0.04 265)): text on the ground.

### Named Rules
**The Flag-Ink Rule.** Green, yellow, and red appear only as stamp print fields or the yellow action colour, never as a tinted wash, glow, or gradient.

**The Yellow-Means-Act Rule.** Yellow marks things to press or choose; do not use it as decoration beyond one emphasised phrase per headline.

## Typography

**Display Font:** Archivo (width axis, set condensed to about 66–72%)
**Body Font:** Geist
**Ge'ez Font:** Noto Serif Ethiopic for display Ge'ez, Noto Sans Ethiopic in UI text
**Label Font:** Geist Mono, for stamp inscriptions only

**Character:** Tall condensed capitals read like stamp denominations; the engraved serif Ge'ez holds its own beside them.

### Hierarchy
- **Display** (800, clamp(2.5rem, 7.6vw, 5.8rem), 0.88): hero headline, uppercase, nowrap lines.
- **Headline** (800, clamp(2.6rem, 7vw, 5.2rem), 0.88): section titles.
- **Stamp title** (800, clamp(1.9rem, 4.2vw, 3.1rem), width 70%): feature stamps.
- **Body** (400, 1.05–1.25rem, 1.55): 54ch maximum; dim ink colour.
- **Label** (400, 0.68rem, 0.14em, uppercase): stamp captions such as language and category.

### Named Rules
**The Equal Script Rule.** English and Ge'ez appear at the same size and weight wherever both are shown. Ge'ez is never smaller, dimmer, or captioned as secondary.

## Layout

A 1240px max container with a 16px minimum gutter. Sections are full-bleed bands alternating Ultramarine Ink and Ultramarine Lifted, with `clamp(64px, 9vw, 120px)` vertical padding. The hero is a 1.3fr / 1fr split on desktop and stacks on mobile with the download button above the stamps. Feature stamps sit on a 12-column grid with unequal spans (7/5, 8/4). Theme stamps are 4 across on desktop, 2 on mobile, each tilted by about 1°.

## Elevation & Depth

Flat objects lifted by overlap. Stamps carry a two-part `drop-shadow` (a 1px contact line plus a 14px/18px soft shadow in deep ultramarine). The page has no glass, blur, or glow. Hover on a stamp lifts it 6px and tilts it 1.2°.

### Named Rules
**The Stamp-Only Shadow Rule.** Only stamps and the phone bezel cast shadows. Bands and text never do.

## Shapes

Stamps have a perforated edge made from four tiled half-circle masks (5px radius, 15px pitch; 3.5px/11px on small fidel stamps), an inset 1.5px keyline around the print area, and a caption row beneath. Buttons are almost square (4px). The phone bezel is the single large radius (38px). The page is framed top and bottom by a 14px red/cream/blue/cream chevron border.

## Components

### Buttons
- **Primary:** Teff Yellow, Print Ink text, Archivo uppercase 800, 56px high, 4px corners, a 2px darker-yellow underside. Hover lifts 2px; active presses to 1px.
- **Ghost:** transparent with a 2px on-ink inset outline; hover adds an 8% white fill.
- **Focus:** 3px yellow outline, 3px offset, on every interactive element.

### Stamps
Stamp paper, 14px padding, a print field in one flag ink, a mono caption top-left, an Archivo denomination or icon top-right, and a caption line beneath. A stamp is the only container on the page.

### Postmark
A dark circular SVG cancel with ring text ("AKAI · TRANSLATED · ትርጉም ·"), set in multiply blend. It drops from above with a 700ms exponential ease-out and settles at -14°.

### Chips
52px square Ge'ez glyph buttons with a 2px outline; selected state fills yellow with Print Ink text.

### Phone
Deep-ultramarine bezel with a 2px light ring around a 640px screen that hosts the live demo keyboard, styled with yellow accents on ultramarine ink to match.

## Do's and Don'ts

### Do:
- **Do** show English and Amharic as a matched pair of stamps.
- **Do** make the stamp the only container; vary stamp size and span rather than repeating identical cards.
- **Do** keep reduced-motion users on static stamps: the postmark and caret animations switch off.
- **Do** keep content visible by default; scroll animations are enhancement only.

### Don't:
- **Don't** return to the old emerald-on-charcoal gradient look or glassmorphism.
- **Don't** add eyebrows or kickers above headings; the stamp's own caption is the only small label.
- **Don't** put a coloured wash, glow, or gradient text anywhere.
- **Don't** invent counts, ratings, or testimonials; theme and feature claims must be real.
