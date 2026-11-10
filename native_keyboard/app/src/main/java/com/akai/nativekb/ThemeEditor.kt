package com.akai.nativekb

import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.GridLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import androidx.core.graphics.ColorUtils

/**
 * A small keyboard drawn in a theme's colours, letters and all, with its
 * animation running behind when it has one: the editor's live preview.
 */
class ThemeEditorPreview(context: Context) : View(context) {
    var palette: Palette? = null
        set(v) { field = v; invalidate() }

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
    }
    private val r = RectF()
    private val start = System.currentTimeMillis()
    private val rows = listOf("qwertyuiop", "asdfghjkl", "zxcvbnm")

    override fun onDraw(canvas: Canvas) {
        val p = palette ?: return
        val d = resources.displayMetrics.density
        val w = width.toFloat(); val h = height.toFloat()
        r.set(0f, 0f, w, h)
        paint.color = p.background
        canvas.drawRoundRect(r, 16 * d, 16 * d, paint)
        if (p.isLive) {
            canvas.save()
            canvas.clipRect(0f, 0f, w, h)
            canvas.scale(d, d)
            LiveScenes.paint(canvas, w / d, h / d, ((System.currentTimeMillis() - start) % 600_000L) / 5000f, p.def.live)
            canvas.restore()
            postInvalidateOnAnimation()
        }
        val pad = 6 * d; val gap = 5 * d
        val rowH = (h - 2 * pad - 3 * gap) / 4
        val unit = (w - 2 * pad - 9 * gap) / 10
        textPaint.textSize = rowH * 0.42f
        fun key(x: Float, y: Float, kw: Float, fill: Int, label: String, color: Int) {
            r.set(x, y, x + kw, y + rowH)
            paint.color = fill
            canvas.drawRoundRect(r, 6 * d, 6 * d, paint)
            textPaint.color = color
            canvas.drawText(label, r.centerX(), r.centerY() - (textPaint.descent() + textPaint.ascent()) / 2, textPaint)
        }
        rows.forEachIndexed { i, letters ->
            val y = pad + i * (rowH + gap)
            val n = letters.length
            var x = pad + (w - 2 * pad - n * unit - (n - 1) * gap) / 2
            if (i == 2) {
                val side = (x - pad - gap).coerceAtLeast(unit)
                key(pad, y, side, p.special, "⇧", p.specialText)
                key(w - pad - side, y, side, p.special, "⌫", p.specialText)
            }
            letters.forEach { ch -> key(x, y, unit, p.key, ch.toString(), p.text); x += unit + gap }
        }
        val y = pad + 3 * (rowH + gap)
        val side = unit * 1.6f
        key(pad, y, side, p.special, "?123", p.specialText)
        key(pad + side + gap, y, unit, p.special, "🌐", p.specialText)
        key(w - pad - side, y, side, p.keyAccent, "↵", p.accentText)
        val sx = pad + side + unit + 2 * gap
        key(sx, y, w - pad - side - gap - sx, p.key, "space", p.text)
    }
}

/**
 * Make a theme or change one of your own: five colours, a name, an emoji and
 * an optional animation, with the keyboard previewed above as you go.
 * Open with [edit] for one of your themes, or [copy] to start from any theme.
 */
class ThemeEditorActivity : ThemedActivity() {

    companion object {
        private const val EXTRA_EDIT = "edit"
        private const val EXTRA_FROM = "from"

        fun edit(c: Context, customId: String) =
            c.startActivity(Intent(c, ThemeEditorActivity::class.java).putExtra(EXTRA_EDIT, customId))

        fun copy(c: Context, fromThemeId: String) =
            c.startActivity(Intent(c, ThemeEditorActivity::class.java).putExtra(EXTRA_FROM, fromThemeId))

        private val ANIMATIONS = listOf(
            "" to "None", "aurora" to "Aurora", "ocean" to "Ocean", "fire" to "Fire", "snow" to "Snow",
            "cherry_blossom" to "Blossom", "autumn" to "Leaves", "rainbow" to "Rainbow", "starfield" to "Stars",
            "fireflies" to "Fireflies", "bokeh" to "Bokeh", "ripples" to "Ripples", "lava_lamp" to "Lava lamp",
            "fireworks" to "Fireworks", "meteor" to "Meteors", "storm" to "Storm", "matrix" to "Matrix",
            "cyberpunk" to "Cyberpunk", "neon_pulse" to "Neon",
        )

        private val EMOJIS = listOf("🎨", "✨", "🌙", "☀️", "🌊", "🔥", "🌸", "🍃", "💎", "🖤", "💜", "💙", "💚", "🧡", "❤️", "⭐", "🦁", "☕", "🎵", "🇪🇹")

        private val SWATCHES = listOf(
            0xFF000000, 0xFF111111, 0xFF1E1E24, 0xFF2E2E36, 0xFF52525B, 0xFF9CA3AF, 0xFFE5E7EB, 0xFFF5F5F4, 0xFFFFFFFF,
            0xFF0B1120, 0xFF1E3A8A, 0xFF2563EB, 0xFF38BDF8, 0xFF0F766E, 0xFF14B8A6, 0xFF14532D, 0xFF16A34A, 0xFF84CC16,
            0xFF3B0764, 0xFF7C3AED, 0xFFA78BFA, 0xFF831843, 0xFFDB2777, 0xFFF9A8D4, 0xFF7F1D1D, 0xFFDC2626, 0xFFF97316,
            0xFFEAB308, 0xFFFDE68A, 0xFF78350F, 0xFFC08552, 0xFFFDF0E6, 0xFF078930, 0xFFFCDD09, 0xFFDA121A,
        ).map { it.toInt() }
    }

    private lateinit var theme: CustomTheme
    private var isNew = true
    private lateinit var preview: ThemeEditorPreview
    private val wrap = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

    /** Which colour's picker is open, or null. */
    private var openPicker: String? = null

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        val existing = intent.getStringExtra(EXTRA_EDIT)?.let { CustomThemes.get(this, it) }
        theme = if (existing != null) {
            isNew = false
            existing
        } else {
            val from = Themes.find(intent.getStringExtra(EXTRA_FROM) ?: prefs.getString(Prefs.THEME, Themes.DEFAULT) ?: Themes.DEFAULT)
            val name = if (from.category == CustomThemes.CATEGORY) "${from.name} copy" else "My ${from.name}"
            CustomTheme.from(this, from, CustomThemes.newId(), name)
        }
        build()
    }

    private fun refreshPreview() { preview.palette = Themes.palette(theme.toDef()) }

    private fun build() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(ui.dp(20f), ui.dp(38f), ui.dp(20f), 0)
        }
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        header.addView(ui.ghostButton("←") { finish() })
        header.addView(ui.title(if (isNew) "New theme" else "Edit theme", 28f))
        root.addView(header, wrap)

        // The preview stays put while the controls scroll under it.
        preview = ThemeEditorPreview(this)
        refreshPreview()
        root.addView(preview, LinearLayout.LayoutParams(-1, ui.dp(170f)).apply { topMargin = ui.dp(8f); bottomMargin = ui.dp(4f) })

        val c = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 0, 0, ui.dp(40f))
        }
        nameCard(c)
        colorsCard(c)
        animationCard(c)

        c.addView(ui.gap(18f))
        c.addView(ui.primaryButton(if (isNew) "Save and use" else "Save") { save() }, wrap)
        if (!isNew) {
            c.addView(ui.gap(6f))
            c.addView(ui.ghostButton("Delete this theme") { confirmDelete() }.apply { setTextColor(0xFFEF4444.toInt()) }, wrap)
        }
        root.addView(ScrollView(this).apply { isVerticalScrollBarEnabled = false; addView(c) }, LinearLayout.LayoutParams(-1, 0, 1f))
        show(root, scroll = false)
    }

    // ─── Name and emoji ─────────────────────────────────────────────────────

    private fun nameCard(c: LinearLayout) {
        c.addView(ui.section("Name"))
        val name = EditText(this).apply {
            setText(theme.name)
            hint = "Theme name"
            setSingleLine()
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_WORDS
            setHintTextColor(ui.faint); setTextColor(palette.text); textSize = 15f
            setPadding(ui.dp(14f), ui.dp(11f), ui.dp(14f), ui.dp(11f))
            background = ui.round(ColorUtils.setAlphaComponent(palette.text, 0x10), 12f, ColorUtils.setAlphaComponent(palette.text, 0x22))
            addTextChangedListener(object : android.text.TextWatcher {
                override fun afterTextChanged(s: android.text.Editable?) { theme = theme.copy(name = s?.toString().orEmpty()) }
                override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
                override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            })
        }
        val emojiRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val cells = ArrayList<TextView>()
        fun paintEmoji() = cells.forEach { v ->
            v.background = if (v.text == theme.emoji) ui.round(ColorUtils.setAlphaComponent(palette.accent, 0x33), 12f, palette.accent, 2f) else null
        }
        (listOf(theme.emoji) + EMOJIS).distinct().forEach { e ->
            val v = ui.label(e, 22f, gravity = Gravity.CENTER).apply {
                setOnClickListener { theme = theme.copy(emoji = e); paintEmoji() }
            }
            cells.add(v)
            emojiRow.addView(v, LinearLayout.LayoutParams(ui.dp(44f), ui.dp(44f)).apply { marginEnd = ui.dp(4f) })
        }
        paintEmoji()
        c.addView(ui.card(
            name, ui.gap(10f),
            HorizontalScrollView(this).apply { isHorizontalScrollBarEnabled = false; addView(emojiRow) },
        ), wrap)
    }

    // ─── Colours ────────────────────────────────────────────────────────────

    private class Slot(val id: String, val title: String, val sub: String)

    private val slots = listOf(
        Slot("bg", "Background", "Behind and around the keys"),
        Slot("key", "Letter keys", ""),
        Slot("special", "Function keys", "Shift, backspace, ?123, language"),
        Slot("accent", "Accent", "The Enter key and highlights"),
        Slot("text", "Key letters", ""),
    )

    private fun get(slot: String) = when (slot) {
        "bg" -> theme.background; "key" -> theme.key; "special" -> theme.special
        "accent" -> theme.accent; else -> theme.text
    }

    private fun set(slot: String, color: Int) {
        val c = ColorUtils.setAlphaComponent(color, 0xFF)
        theme = when (slot) {
            "bg" -> theme.copy(background = c); "key" -> theme.copy(key = c); "special" -> theme.copy(special = c)
            "accent" -> theme.copy(accent = c); else -> theme.copy(text = c)
        }
        refreshPreview()
    }

    private fun hex(c: Int) = String.format("#%06X", c and 0xFFFFFF)

    /** A warning when the letters would be hard to read on the keys. */
    private fun contrastNote(): String {
        val ratio = ColorUtils.calculateContrast(theme.text, ColorUtils.setAlphaComponent(theme.key, 0xFF))
        return if (ratio < 3.0) "⚠ The letters are hard to read on these keys" else ""
    }

    private fun colorsCard(c: LinearLayout) {
        c.addView(ui.section("Colours"))
        val card = ui.card(pad = 10f)
        val warn = ui.label(contrastNote(), 13f, 0xFFF59E0B.toInt()).apply {
            setPadding(ui.dp(6f), ui.dp(4f), ui.dp(6f), ui.dp(6f))
            visibility = if (text.isEmpty()) View.GONE else View.VISIBLE
        }
        fun updateWarn() { warn.text = contrastNote(); warn.visibility = if (warn.text.isEmpty()) View.GONE else View.VISIBLE }

        val pickers = HashMap<String, View>()
        slots.forEachIndexed { i, s ->
            if (i > 0) card.addView(View(this).apply {
                setBackgroundColor(ColorUtils.setAlphaComponent(palette.text, 0x14))
            }, LinearLayout.LayoutParams(-1, ui.dp(1f)))
            val swatch = View(this)
            val code = ui.label(hex(get(s.id)), 13f, ui.dim)
            fun paintSwatch() {
                swatch.background = ui.round(get(s.id), 999f, ColorUtils.setAlphaComponent(palette.text, 0x44), 1.5f)
                code.text = hex(get(s.id))
            }
            paintSwatch()
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(ui.dp(6f), ui.dp(12f), ui.dp(6f), ui.dp(12f))
                addView(swatch, LinearLayout.LayoutParams(ui.dp(34f), ui.dp(34f)))
                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    addView(ui.label(s.title, 16f, palette.text, bold = true))
                    if (s.sub.isNotEmpty()) addView(ui.label(s.sub, 12f, ui.dim))
                }, LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = ui.dp(12f) })
                addView(code)
            }
            val picker = colorPicker(get(s.id)) { col -> set(s.id, col); paintSwatch(); updateWarn() }
            picker.visibility = if (openPicker == s.id) View.VISIBLE else View.GONE
            pickers[s.id] = picker
            row.setOnClickListener {
                openPicker = if (openPicker == s.id) null else s.id
                pickers.forEach { (id, v) -> v.visibility = if (id == openPicker) View.VISIBLE else View.GONE }
            }
            card.addView(row, wrap)
            card.addView(picker, wrap)
        }
        card.addView(warn, wrap)
        c.addView(card, wrap)
    }

    /** Ready-made swatches, hue / saturation / brightness sliders and a hex box. */
    private fun colorPicker(initial: Int, onPick: (Int) -> Unit): View {
        val hsv = FloatArray(3).also { Color.colorToHSV(initial, it) }
        var syncing = false
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(ui.dp(6f), 0, ui.dp(6f), ui.dp(12f))
        }

        fun bar(max: Int, value: Int, onChange: (Int) -> Unit) = SeekBar(this).apply {
            this.max = max
            progress = value
            progressTintList = ColorStateList.valueOf(palette.accent)
            thumbTintList = ColorStateList.valueOf(palette.accent)
            progressBackgroundTintList = ColorStateList.valueOf(ColorUtils.setAlphaComponent(palette.text, 0x33))
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(b: SeekBar?, v: Int, fromUser: Boolean) { if (fromUser) onChange(v) }
                override fun onStartTrackingTouch(b: SeekBar?) {}
                override fun onStopTrackingTouch(b: SeekBar?) {}
            })
        }

        lateinit var hue: SeekBar
        lateinit var sat: SeekBar
        lateinit var bri: SeekBar
        val hexBox = EditText(this).apply {
            setSingleLine()
            textSize = 14f
            setTextColor(palette.text)
            setText(hex(initial))
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
            setPadding(ui.dp(12f), ui.dp(8f), ui.dp(12f), ui.dp(8f))
            background = ui.round(ColorUtils.setAlphaComponent(palette.text, 0x10), 10f, ColorUtils.setAlphaComponent(palette.text, 0x22))
        }

        fun apply(color: Int, fromHex: Boolean = false) {
            syncing = true
            Color.colorToHSV(color, hsv)
            hue.progress = hsv[0].toInt(); sat.progress = (hsv[1] * 100).toInt(); bri.progress = (hsv[2] * 100).toInt()
            if (!fromHex) hexBox.setText(hex(color))
            syncing = false
            onPick(color)
        }
        fun fromSliders() { if (!syncing) { val col = Color.HSVToColor(hsv); syncing = true; hexBox.setText(hex(col)); syncing = false; onPick(col) } }

        hue = bar(360, hsv[0].toInt()) { hsv[0] = it.toFloat(); fromSliders() }
        sat = bar(100, (hsv[1] * 100).toInt()) { hsv[1] = it / 100f; fromSliders() }
        bri = bar(100, (hsv[2] * 100).toInt()) { hsv[2] = it / 100f; fromSliders() }
        hexBox.addTextChangedListener(object : android.text.TextWatcher {
            override fun afterTextChanged(s: android.text.Editable?) {
                if (syncing) return
                val t = s?.toString()?.trim()?.removePrefix("#") ?: return
                if (t.length == 6) t.toLongOrNull(16)?.let { apply((0xFF000000 or it).toInt(), fromHex = true) }
            }
            override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
        })

        val grid = GridLayout(this).apply { columnCount = 9 }
        SWATCHES.forEach { col ->
            grid.addView(View(this).apply {
                background = ui.round(col, 999f, ColorUtils.setAlphaComponent(palette.text, 0x33))
                setOnClickListener { apply(col) }
            }, GridLayout.LayoutParams(GridLayout.spec(GridLayout.UNDEFINED), GridLayout.spec(GridLayout.UNDEFINED, 1f)).apply {
                width = 0; height = ui.dp(28f); setMargins(ui.dp(3f), ui.dp(3f), ui.dp(3f), ui.dp(3f))
            })
        }
        box.addView(grid, wrap)
        box.addView(ui.gap(8f))
        fun labelled(t: String, v: View) {
            box.addView(LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                addView(ui.label(t, 13f, ui.dim), LinearLayout.LayoutParams(ui.dp(78f), -2))
                addView(v, LinearLayout.LayoutParams(0, -2, 1f))
            }, wrap)
        }
        labelled("Hue", hue)
        labelled("Saturation", sat)
        labelled("Brightness", bri)
        labelled("Hex", hexBox)
        return box
    }

    // ─── Animation ──────────────────────────────────────────────────────────

    private fun animationCard(c: LinearLayout) {
        c.addView(ui.section("Animated background"))
        val options = if (theme.live.isNotEmpty() && ANIMATIONS.none { it.first == theme.live })
            listOf(theme.live to "Original") + ANIMATIONS else ANIMATIONS
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val chips = ArrayList<Pair<String, TextView>>()
        fun paintChips() = chips.forEach { (id, v) ->
            val on = id == theme.live
            v.setTextColor(if (on) (if (ColorUtils.calculateLuminance(palette.accent) > 0.5) Color.BLACK else Color.WHITE) else ui.dim)
            v.background = ui.round(if (on) palette.accent else ColorUtils.setAlphaComponent(palette.text, 0x14), 999f)
        }
        options.forEach { (id, name) ->
            val v = ui.label(name, 13f, ui.dim, bold = true, gravity = Gravity.CENTER).apply {
                setPadding(ui.dp(16f), ui.dp(9f), ui.dp(16f), ui.dp(9f))
                setOnClickListener { theme = theme.copy(live = id); paintChips(); refreshPreview() }
            }
            chips.add(id to v)
            row.addView(v, LinearLayout.LayoutParams(-2, -2).apply { marginEnd = ui.dp(8f) })
        }
        paintChips()
        c.addView(ui.card(
            HorizontalScrollView(this).apply { isHorizontalScrollBarEnabled = false; addView(row) },
            ui.gap(8f),
            ui.label("With an animation, the keys turn slightly see-through so it shows behind them.", 12f, ui.dim),
        ), wrap)
    }

    // ─── Save / delete ──────────────────────────────────────────────────────

    private fun save() {
        if (theme.name.isBlank()) theme = theme.copy(name = "My theme")
        CustomThemes.save(this, theme)
        prefs.edit().putString(Prefs.THEME, theme.id).apply()
        Toast.makeText(this, "${theme.name} is now your theme", Toast.LENGTH_SHORT).show()
        finish()
    }

    private fun confirmDelete() {
        android.app.AlertDialog.Builder(this)
            .setTitle("Delete ${theme.name}?")
            .setMessage("This can't be undone.")
            .setPositiveButton("Delete") { _, _ -> CustomThemes.delete(this, theme.id); finish() }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
