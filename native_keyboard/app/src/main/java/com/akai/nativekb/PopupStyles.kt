package com.akai.nativekb

/**
 * How the long-press bubble (accents, vowel families) enters and looks. It
 * follows the theme's animation, so each live theme has a bubble of its own.
 */
enum class PopupStyle(
    /** How long the entrance takes, in ms. */
    val ms: Long,
) {
    /** Solid themes: a quick pop from the key. */
    POP(80),
    /** Water, ripples, snow: floats up into place. */
    RISE(130),
    /** Fire and lava: letters flare in from the key outward, on a warm glow. */
    FLAME(150),
    /** Matrix, cyberpunk, glitch, circuits: jitters in with a split-colour flicker. */
    GLITCH(120),
    /** Stars, aurora, fireworks, bokeh, rainbow: letters twinkle in from the key outward, with a glowing edge. */
    SPARKLE(160),
    /** Football clubs: slides up like a scoreboard, with a stripe in the club's colour. */
    STADIUM(110),
    /** Faith and cultural scenes: unfolds from the middle, with a soft halo. */
    HALO(140);

    companion object {
        fun of(def: PaletteDef): PopupStyle {
            val t = def.live.lowercase()
            return when {
                t.isEmpty() -> POP
                def.category == "football" || t.startsWith("fb_") || t.startsWith("club_") -> STADIUM
                def.category == "faith" || t.startsWith("ortho_") || t.startsWith("islam_") -> HALO
                listOf("matrix", "binary", "cyberpunk", "glitch", "circuit").any { it in t } -> GLITCH
                listOf("fire", "lava", "flame", "solar").any { it in t } -> FLAME
                listOf("ocean", "water", "bubble", "sea", "ripple", "zen", "snow").any { it in t } -> RISE
                CulturalScenes.has(def.live) || Backdrops.isPicture(def.live) || def.category == "cultural" -> HALO
                else -> SPARKLE
            }
        }
    }
}
