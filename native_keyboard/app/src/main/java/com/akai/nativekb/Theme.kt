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
    /** Text drawn straight on the background (toolbar, suggestions, word of the day) and its dimmer hint. */
    val barText: Int = text, val barHint: Int = specialText,
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
    const val DEFAULT = "shopfront"

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

    /** True while the phone is in dark mode. */
    fun isNight(context: Context) =
        (context.resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
            android.content.res.Configuration.UI_MODE_NIGHT_YES

    /**
     * Which setting holds the theme in use now: [Prefs.THEME_DARK] while the
     * phone is in dark mode and a dark-mode theme is chosen, else [Prefs.THEME].
     */
    fun activeKey(context: Context): String {
        val p = context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
        return if (isNight(context) && !p.getString(Prefs.THEME_DARK, null).isNullOrBlank()) Prefs.THEME_DARK else Prefs.THEME
    }

    /** The id of the theme in use now (see [activeKey]). */
    fun activeId(context: Context): String =
        context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).getString(activeKey(context), DEFAULT) ?: DEFAULT

    /** A dark theme to start dark mode with: [current] if it is dark, else the first dark built-in one. */
    fun firstDark(current: String): String {
        val c = find(current)
        if (!palette(c).isLight) return c.id
        return (ThemeData.all + SolidThemes.all).first { !palette(it).isLight }.id
    }

    // Live themes use translucent colours so an animation shows through. Until
    // that animation is painted, blend them onto a dark base so they are solid.
    private val base = 0xFF0B0B12.toInt()
    private fun solid(c: Int): Int = ColorUtils.compositeColors(c, base)
    private fun keep(c: Int, bg: Int, live: Boolean): Int = if (live) c else ColorUtils.compositeColors(c, bg)
    /**
     * The cultural themes with a scene of their own were designed with solid
     * keys; at about 80% the scene shows through them while letters stay clear.
     */
    private fun seeThrough(c: Int, max: Int = 0xCC): Int = ColorUtils.setAlphaComponent(c, minOf(android.graphics.Color.alpha(c), max))

    /**
     * How filled football themes' keys are, in percent (Settings › Keys ›
     * Football themes). By default they're nearly clear glass, so the club's
     * motif and crest show through them; the letters stay solid.
     */
    const val FOOTBALL_FILL_DEFAULT = 10
    @Volatile private var footballFill = FOOTBALL_FILL_DEFAULT

    fun palette(context: Context, id: String): Palette {
        CustomThemes.refresh(context)
        footballFill = context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
            .getInt(Prefs.FOOTBALL_FILL, FOOTBALL_FILL_DEFAULT).coerceIn(0, 100)
        return palette(find(id))
    }

    /** The colours for a theme that need not be saved yet (the theme editor's preview). */
    fun palette(d: PaletteDef): Palette {
        val bg = solid(d.background)
        val live = d.live.isNotEmpty()
        // Themes whose scene or picture was hidden behind solid keys: the cultural
        // and faith scenes, the pictures, and every football club's stage.
        val scene = CulturalScenes.has(d.live) || Backdrops.isPicture(d.live) || d.category == "football" || d.category == "faith"
        val football = d.category == "football"
        val keyAlpha = if (football) footballFill * 255 / 100 else 0xCC
        fun k(c: Int) = if (scene) seeThrough(c, keyAlpha) else keep(c, bg, live)
        val key = k(d.key); val special = k(d.keySecondary)
        // A football club's photo is toned dark, so text on it is light, and each
        // key's label is whichever of its own colour or white reads better there.
        val text = if (football) readable(d.keyText, key) else d.keyText
        val specialText = if (football) readable(d.keySecondaryText, special) else d.keySecondaryText
        return Palette(
            background = bg, surface = solid(d.surface), surfaceVariant = solid(d.surfaceVariant),
            // A live theme's keys stay translucent so its animation shows through them.
            key = key, pressed = keep(d.keyPressed, bg, live),
            special = special,
            specialPressed = keep(d.keySecondaryPressed, bg, live),
            keyAccent = d.keyAccent, accentPressed = d.keyAccentPressed, accent = d.accent,
            text = text, specialText = specialText,
            accentMuted = d.accentMuted, glow = d.glow,
            def = d,
            barText = if (football) 0xF2FFFFFF.toInt() else text,
            barHint = if (football) 0xB3FFFFFF.toInt() else specialText,
        )
    }

    /** The dark club background behind a key: what a see-through key really shows over. */
    private const val PHOTO_SHADE = 0xFF141414.toInt()

    /** [label] if it reads clearly on [keyColour] laid over the photo's shade, else white or near-black, whichever reads better. */
    private fun readable(label: Int, keyColour: Int): Int {
        val seen = ColorUtils.compositeColors(keyColour, PHOTO_SHADE)
        if (ColorUtils.calculateContrast(solid(label), seen) >= 4.5) return label
        val white = 0xFFFFFFFF.toInt(); val black = 0xFF111111.toInt()
        return if (ColorUtils.calculateContrast(white, seen) >= ColorUtils.calculateContrast(black, seen)) white else black
    }
}
