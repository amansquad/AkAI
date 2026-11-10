package com.akai.nativekb

import android.content.Context
import androidx.core.graphics.ColorUtils

/**
 * The colours the keyboard and the app screens are drawn with. They come from
 * the Flutter app's themes, so a theme looks the same in both.
 */
class Palette(
    val background: Int, val surface: Int, val surfaceVariant: Int,
    val key: Int, val pressed: Int,
    val special: Int, val specialPressed: Int,
    /** The Enter key's colour and its pressed colour. */
    val keyAccent: Int, val accentPressed: Int,
    /** The colour for highlights and buttons (not the same as the Enter key's). */
    val accent: Int,
    val text: Int, val specialText: Int,
    val accentMuted: Int, val glow: Int,
    val def: PaletteDef,
) {
    /** The accent key's label colour: white, as in the Flutter keyboard, unless the key is very light. */
    val accentText: Int = if (ColorUtils.calculateLuminance(keyAccent) > 0.7) 0xFF111111.toInt() else 0xFFFFFFFF.toInt()
    val hint: Int get() = specialText
    val popup: Int get() = surfaceVariant

    /** True for light themes, where text on the background is dark. */
    val isLight: Boolean = ColorUtils.calculateLuminance(background) > 0.55
    val isLive: Boolean get() = def.live.isNotEmpty()
}

object Themes {
    const val DEFAULT = "obsidian"

    /** The person's own themes first, then the Flutter app's, then the extra solids. */
    val all: List<PaletteDef> get() = CustomThemes.defs + ThemeData.all + SolidThemes.all

    /** Old ids from before the Flutter themes were brought over. */
    private fun migrate(id: String) = when (id) {
        "system", "dark", "" -> DEFAULT
        "ocean" -> "ocean-wave"
        else -> id
    }

    fun find(id: String): PaletteDef =
        all.firstOrNull { it.id == migrate(id) } ?: all.first { it.id == DEFAULT }

    fun label(id: String) = find(id).name

    // Live themes use translucent colours so an animation shows through. Until
    // that animation is painted, blend them onto a dark base so they are solid.
    private val base = 0xFF0B0B12.toInt()
    private fun solid(c: Int): Int = ColorUtils.compositeColors(c, base)
    private fun keep(c: Int, bg: Int, live: Boolean): Int = if (live) c else ColorUtils.compositeColors(c, bg)
    /**
     * The cultural themes with a scene of their own were designed with solid
     * keys; at about 80% the scene shows through them while letters stay clear.
     */
    private fun seeThrough(c: Int): Int = ColorUtils.setAlphaComponent(c, minOf(android.graphics.Color.alpha(c), 0xCC))

    fun palette(context: Context, id: String): Palette {
        CustomThemes.refresh(context)
        return palette(find(id))
    }

    /** The colours for a theme that need not be saved yet (the theme editor's preview). */
    fun palette(d: PaletteDef): Palette {
        val bg = solid(d.background)
        val live = d.live.isNotEmpty()
        // Themes whose scene or picture was hidden behind solid keys: the cultural
        // and faith scenes, the pictures, and every football club's stage.
        val scene = CulturalScenes.has(d.live) || Backdrops.isPicture(d.live) || d.category == "football" || d.category == "faith"
        fun k(c: Int) = if (scene) seeThrough(c) else keep(c, bg, live)
        return Palette(
            background = bg, surface = solid(d.surface), surfaceVariant = solid(d.surfaceVariant),
            // A live theme's keys stay translucent so its animation shows through them.
            key = k(d.key), pressed = keep(d.keyPressed, bg, live),
            special = k(d.keySecondary),
            specialPressed = keep(d.keySecondaryPressed, bg, live),
            keyAccent = d.keyAccent, accentPressed = d.keyAccentPressed, accent = d.accent,
            text = d.keyText, specialText = d.keySecondaryText,
            accentMuted = d.accentMuted, glow = d.glow,
            def = d,
        )
    }
}
