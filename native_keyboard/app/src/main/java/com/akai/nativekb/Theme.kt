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
    /** The accent key's label colour (the Flutter keyboard always uses white). */
    val accentText: Int = 0xFFFFFFFF.toInt()
    val hint: Int get() = specialText
    val popup: Int get() = surfaceVariant

    /** True for light themes, where text on the background is dark. */
    val isLight: Boolean = ColorUtils.calculateLuminance(background) > 0.55
    val isLive: Boolean get() = def.live.isNotEmpty()
}

object Themes {
    const val DEFAULT = "obsidian"

    val all: List<PaletteDef> get() = ThemeData.all

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

    fun palette(@Suppress("UNUSED_PARAMETER") context: Context, id: String): Palette {
        val d = find(id)
        val bg = solid(d.background)
        return Palette(
            background = bg, surface = solid(d.surface), surfaceVariant = solid(d.surfaceVariant),
            key = ColorUtils.compositeColors(d.key, bg), pressed = ColorUtils.compositeColors(d.keyPressed, bg),
            special = ColorUtils.compositeColors(d.keySecondary, bg),
            specialPressed = ColorUtils.compositeColors(d.keySecondaryPressed, bg),
            keyAccent = d.keyAccent, accentPressed = d.keyAccentPressed, accent = d.accent,
            text = d.keyText, specialText = d.keySecondaryText,
            accentMuted = d.accentMuted, glow = d.glow,
            def = d,
        )
    }
}
