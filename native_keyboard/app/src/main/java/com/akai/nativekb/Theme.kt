package com.akai.nativekb

import android.content.Context
import android.content.res.Configuration

class Palette(
    val background: Int, val key: Int, val special: Int, val pressed: Int,
    val text: Int, val hint: Int, val accent: Int, val accentText: Int, val popup: Int,
)

object Themes {
    val names = listOf("system", "light", "dark", "ocean", "forest", "rose")

    fun label(name: String) = when (name) {
        "light" -> "Light"
        "dark" -> "Dark"
        "ocean" -> "Ocean"
        "forest" -> "Forest"
        "rose" -> "Rose"
        else -> "System"
    }

    private fun p(
        bg: Long, key: Long, special: Long, pressed: Long, text: Long,
        hint: Long, accent: Long, accentText: Long, popup: Long,
    ) = Palette(
        bg.toInt(), key.toInt(), special.toInt(), pressed.toInt(), text.toInt(),
        hint.toInt(), accent.toInt(), accentText.toInt(), popup.toInt(),
    )

    private val DARK = p(0xFF1B1B1F, 0xFF3A3A40, 0xFF2A2A2F, 0xFF5A5A62, 0xFFEDEDED, 0xFF9A9AA2, 0xFF6C8CFF, 0xFF0B1230, 0xFF2E2E34)
    private val LIGHT = p(0xFFD9DBE0, 0xFFFFFFFF, 0xFFB9BDC6, 0xFFC4C8D0, 0xFF1B1B1F, 0xFF6B6F78, 0xFF3F5BD9, 0xFFFFFFFF, 0xFFFFFFFF)
    private val OCEAN = p(0xFF0E2233, 0xFF1F3F57, 0xFF16304A, 0xFF35607F, 0xFFE6F3FF, 0xFF8FB3CF, 0xFF3DC1D3, 0xFF04222B, 0xFF1A3A52)
    private val FOREST = p(0xFF14231A, 0xFF28422F, 0xFF1D3324, 0xFF3F6A4B, 0xFFE9F5EC, 0xFF93B49B, 0xFF7BD389, 0xFF06220E, 0xFF223A29)
    private val ROSE = p(0xFFF3DDE2, 0xFFFFFFFF, 0xFFE3B9C3, 0xFFF0C9D2, 0xFF3A1A22, 0xFF8E5A66, 0xFFD6336C, 0xFFFFFFFF, 0xFFFFFFFF)

    fun palette(context: Context, name: String): Palette = when (name) {
        "light" -> LIGHT
        "dark" -> DARK
        "ocean" -> OCEAN
        "forest" -> FOREST
        "rose" -> ROSE
        else -> {
            val night = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
            if (night == Configuration.UI_MODE_NIGHT_YES) DARK else LIGHT
        }
    }
}
