package com.akai.nativekb

import android.content.Context
import androidx.core.graphics.ColorUtils
import org.json.JSONArray
import org.json.JSONObject

/**
 * Builds a full 14-colour theme from the five colours a person actually picks:
 * background, letter keys, function keys, accent (the Enter key) and text.
 * The in-between shades (pressed keys, surfaces, glow) are mixed from those.
 */
object ThemeMaker {
    // Plain arithmetic rather than ColorUtils, so themes build in JVM unit tests too.
    private fun mix(a: Int, b: Int, t: Float): Int {
        fun ch(shift: Int) = Math.round(((a ushr shift) and 0xFF) * (1 - t) + ((b ushr shift) and 0xFF) * t)
        return (ch(24) shl 24) or (ch(16) shl 16) or (ch(8) shl 8) or ch(0)
    }
    private fun withAlpha(c: Int, alpha: Int) = (c and 0x00FFFFFF) or (alpha shl 24)
    private fun opaque(c: Int) = withAlpha(c, 0xFF)

    fun def(
        id: String, name: String, emoji: String, category: String, live: String,
        background: Int, key: Int, special: Int, accent: Int, text: Int,
    ): PaletteDef {
        val bg = opaque(background); val k = opaque(key); val s = opaque(special)
        val a = opaque(accent); val t = opaque(text)
        // With an animation behind it, the keys let some of it show through.
        fun keyAlpha(c: Int) = if (live.isEmpty()) c else withAlpha(c, 0xB8)
        return PaletteDef(
            id, name, emoji, category, live,
            background = bg,
            surface = mix(bg, t, 0.06f), surfaceVariant = mix(bg, t, 0.11f),
            key = keyAlpha(k), keyPressed = keyAlpha(mix(k, t, 0.16f)),
            keySecondary = keyAlpha(s), keySecondaryPressed = keyAlpha(mix(s, t, 0.16f)),
            keyAccent = a, keyAccentPressed = mix(a, 0xFFFFFFFF.toInt(), 0.2f),
            keyText = t, keySecondaryText = mix(t, s, 0.3f),
            accent = a, accentMuted = mix(a, 0xFF000000.toInt(), 0.25f), glow = mix(a, 0xFFFFFFFF.toInt(), 0.35f),
        )
    }
}

/** Solid themes made for the native keyboard (the Flutter app only has five). */
object SolidThemes {
    private fun s(id: String, name: String, emoji: String, bg: Long, key: Long, special: Long, accent: Long, text: Long) =
        ThemeMaker.def(id, name, emoji, "solid", "", bg.toInt(), key.toInt(), special.toInt(), accent.toInt(), text.toInt())

    val all: List<PaletteDef> = listOf(
        // Dark
        s("midnight", "Midnight", "🌙", 0xFF0B1120, 0xFF1E293B, 0xFF141C2E, 0xFF3B82F6, 0xFFF1F5F9),
        s("graphite", "Graphite", "✏️", 0xFF121214, 0xFF2A2A2E, 0xFF1E1E21, 0xFFF97316, 0xFFF4F4F5),
        s("amoled", "AMOLED Black", "🖤", 0xFF000000, 0xFF161616, 0xFF0C0C0C, 0xFFFFFFFF, 0xFFFFFFFF),
        s("lavender", "Lavender", "💜", 0xFF17121F, 0xFF2A2140, 0xFF201933, 0xFFA78BFA, 0xFFF3EEFF),
        s("coffee", "Coffee", "☕", 0xFF1C1410, 0xFF33251D, 0xFF281D17, 0xFFC08552, 0xFFF5E9DF),
        s("crimson", "Crimson", "🍷", 0xFF1A0B0E, 0xFF3A161C, 0xFF2A1015, 0xFFE11D48, 0xFFFDECEF),
        s("teal", "Teal", "🦚", 0xFF071A1C, 0xFF123437, 0xFF0D2729, 0xFF14B8A6, 0xFFE6FFFB),
        s("sunflower", "Sunflower", "🌻", 0xFF15130B, 0xFF2C2816, 0xFF211E10, 0xFFEAB308, 0xFFFFF8DB),
        // Light
        s("paper", "Paper", "📜", 0xFFF3EFE7, 0xFFFFFDF8, 0xFFDDD5C7, 0xFFB45309, 0xFF2B2118),
        s("sky", "Sky", "🌤️", 0xFFE8F1FB, 0xFFFFFFFF, 0xFFC7DBF2, 0xFF2563EB, 0xFF0F2440),
        s("blush", "Blush", "🌷", 0xFFFBEFF3, 0xFFFFFFFF, 0xFFF1CFDB, 0xFFDB2777, 0xFF3A1426),
        s("sage", "Sage", "🌱", 0xFFEAF1EA, 0xFFFFFFFF, 0xFFCDDCCD, 0xFF2F855A, 0xFF1C2B1F),
        s("slate", "Slate", "🪨", 0xFFE5E7EB, 0xFFF9FAFB, 0xFFCBD5E1, 0xFF334155, 0xFF111827),
        s("peach", "Peach", "🍑", 0xFFFDF0E6, 0xFFFFFFFF, 0xFFF5D3BC, 0xFFEA580C, 0xFF3B1D0B),
    )
}

/** A theme someone made: the five picked colours, kept in the settings as JSON. */
data class CustomTheme(
    val id: String, val name: String, val emoji: String, val live: String,
    val background: Int, val key: Int, val special: Int, val accent: Int, val text: Int,
) {
    fun toDef() = ThemeMaker.def(id, name, emoji, CustomThemes.CATEGORY, live, background, key, special, accent, text)

    fun toJson(): JSONObject = JSONObject()
        .put("id", id).put("name", name).put("emoji", emoji).put("live", live)
        .put("bg", background).put("key", key).put("special", special).put("accent", accent).put("text", text)

    companion object {
        fun fromJson(o: JSONObject) = CustomTheme(
            o.getString("id"), o.optString("name", "My theme"), o.optString("emoji", "🎨"), o.optString("live", ""),
            o.getInt("bg"), o.getInt("key"), o.getInt("special"), o.getInt("accent"), o.getInt("text"),
        )

        /** Starts a new theme from an existing one's colours. */
        fun from(context: Context, def: PaletteDef, id: String, name: String): CustomTheme {
            val p = Themes.palette(context, def.id)
            fun solid(c: Int) = ColorUtils.compositeColors(c, p.background)
            return CustomTheme(
                id, name, def.emoji, def.live,
                p.background, solid(p.key), solid(p.special), p.keyAccent, p.text,
            )
        }
    }
}

/**
 * The themes a person made. The list is read from the settings whenever they
 * change, so the app and the keyboard (same process) always agree.
 */
object CustomThemes {
    const val CATEGORY = "custom"
    private const val PREF = "custom_themes"

    private var raw: String? = null
    var themes: List<CustomTheme> = emptyList()
        private set
    var defs: List<PaletteDef> = emptyList()
        private set

    fun refresh(context: Context) {
        val s = context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).getString(PREF, "[]") ?: "[]"
        if (s == raw) return
        raw = s
        themes = try {
            val a = JSONArray(s)
            (0 until a.length()).mapNotNull { i -> try { CustomTheme.fromJson(a.getJSONObject(i)) } catch (e: Exception) { null } }
        } catch (e: Exception) { emptyList() }
        defs = themes.map { it.toDef() }
    }

    fun get(context: Context, id: String): CustomTheme? { refresh(context); return themes.firstOrNull { it.id == id } }

    private fun write(context: Context, list: List<CustomTheme>) {
        val a = JSONArray().apply { list.forEach { put(it.toJson()) } }
        context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).edit().putString(PREF, a.toString()).apply()
        refresh(context)
    }

    /** Adds the theme, or replaces the one with the same id. Newest first. */
    fun save(context: Context, t: CustomTheme) {
        refresh(context)
        write(context, listOf(t) + themes.filter { it.id != t.id })
    }

    fun delete(context: Context, id: String) {
        refresh(context)
        write(context, themes.filter { it.id != id })
        val prefs = context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
        if (prefs.getString(Prefs.THEME, "") == id) prefs.edit().putString(Prefs.THEME, Themes.DEFAULT).apply()
    }

    fun newId() = "custom-" + System.currentTimeMillis().toString(36)
}
