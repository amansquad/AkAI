package com.akai.nativekb

import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.provider.Settings
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.GridLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.graphics.ColorUtils

private val LP_MATCH_WRAP = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

/** Is this keyboard switched on in system settings, and is it the one in use? */
object ImeStatus {
    fun enabled(c: Context): Boolean =
        (c.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager)
            .enabledInputMethodList.any { it.packageName == c.packageName }

    fun selected(c: Context): Boolean =
        Settings.Secure.getString(c.contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD)
            ?.startsWith(c.packageName + "/") == true
}

// ─── Launcher: onboarding the first time, home afterwards ───────────────────

class MainActivity : android.app.Activity() {
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        val done = getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).getBoolean(Prefs.ONBOARDED, false)
        val ready = ImeStatus.enabled(this) && ImeStatus.selected(this)
        startActivity(Intent(this, if (done || ready) HomeActivity::class.java else OnboardingActivity::class.java))
        finish()
    }
}

// ─── Onboarding: Welcome, Enable, Default, Done ─────────────────────────────

class OnboardingActivity : ThemedActivity() {
    private var step = 0

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        render()
    }

    override fun onResume() {
        super.onResume()
        // Coming back from system settings: move on if that step is now done.
        if (step == 1 && ImeStatus.enabled(this)) step = 2
        if (step == 2 && ImeStatus.selected(this)) step = 3
        if (themeReady) render()
    }

    private fun render() {
        val c = column()
        c.gravity = Gravity.CENTER_HORIZONTAL
        c.addView(ui.brandPill(), LinearLayout.LayoutParams(-2, -2).apply { topMargin = ui.dp(8f) })
        c.addView(ui.gap(18f))
        c.addView(tracker())
        c.addView(ui.gap(28f))
        when (step) {
            0 -> welcome(c)
            1 -> action(c, "STEP 2 OF 4", "Enable Akai",
                if (ImeStatus.enabled(this)) "Akai is enabled" else "Tap to enable Akai",
                "Turn on Akai in the list of keyboards.",
                if (ImeStatus.enabled(this)) "Continue" else "Open keyboard settings") {
                if (ImeStatus.enabled(this)) { step = 2; render() } else startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS))
            }
            2 -> action(c, "STEP 3 OF 4", "Choose Akai",
                if (ImeStatus.selected(this)) "Akai is active" else "Switch to Akai",
                "Tap to open the keyboard picker.",
                if (ImeStatus.selected(this)) "Continue" else "Open picker") {
                if (ImeStatus.selected(this)) { step = 3; render() }
                else (getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager).showInputMethodPicker()
            }
            else -> done(c)
        }
        show(c)
    }

    private fun tracker(): View {
        val names = listOf("Welcome", "Enable", "Default", "Done")
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        names.forEachIndexed { i, n ->
            val col = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER_HORIZONTAL }
            col.addView(View(this).apply {
                background = ui.round(if (i <= step) palette.accent else ColorUtils.setAlphaComponent(palette.text, 0x22), 99f)
            }, LinearLayout.LayoutParams(-1, ui.dp(4f)))
            col.addView(ui.gap(8f))
            col.addView(ui.label(n, 12f, if (i == step) palette.accent else ui.faint, bold = i == step, spacing = 0.1f, gravity = Gravity.CENTER))
            row.addView(col, LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = ui.dp(3f); marginEnd = ui.dp(3f) })
        }
        return row
    }

    private fun welcome(c: LinearLayout) {
        c.addView(ui.gap(30f))
        c.addView(badge("⌨️"), LinearLayout.LayoutParams(ui.dp(150f), ui.dp(150f)))
        c.addView(ui.gap(22f))
        c.addView(ui.title("Akai", 54f).apply { gravity = Gravity.CENTER }, LP_MATCH_WRAP)
        c.addView(ui.gap(6f))
        c.addView(ui.label("The keyboard built for Ethiopia and the world.", 16f, ui.dim, gravity = Gravity.CENTER), LP_MATCH_WRAP)
        c.addView(ui.gap(28f))
        val chips = GridLayout(this).apply { columnCount = 3 }
        listOf("🇪🇹 Amharic", "🌈 100+ Themes", "🤖 AI Translate", "😀 Stickers", "⌨️ Swipe & Type").forEach {
            chips.addView(ui.chip(it), GridLayout.LayoutParams().apply { setMargins(ui.dp(4f), ui.dp(4f), ui.dp(4f), ui.dp(4f)) })
        }
        c.addView(chips)
        c.addView(ui.gap(40f))
        val bar = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        bar.addView(ui.ghostButton("Skip") { finishOnboarding() })
        bar.addView(View(this), LinearLayout.LayoutParams(0, 1, 1f))
        bar.addView(ui.primaryButton("Continue  →") { step = 1; render() })
        c.addView(bar, LP_MATCH_WRAP)
    }

    private fun badge(emoji: String): View = FrameLayout(this).apply {
        background = object : android.graphics.drawable.Drawable() {
            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            override fun draw(canvas: Canvas) {
                val cx = bounds.exactCenterX(); val cy = bounds.exactCenterY(); val r = bounds.width() / 2f
                paint.style = Paint.Style.FILL
                paint.shader = android.graphics.RadialGradient(cx, cy, r, intArrayOf(ColorUtils.setAlphaComponent(palette.accent, 0x44), 0), null, android.graphics.Shader.TileMode.CLAMP)
                canvas.drawCircle(cx, cy, r, paint)
                paint.shader = null
                paint.style = Paint.Style.STROKE
                paint.strokeWidth = ui.d * 1.5f
                paint.color = ColorUtils.setAlphaComponent(palette.accent, 0x66)
                canvas.drawCircle(cx, cy, r - ui.d, paint)
            }
            override fun setAlpha(a: Int) {}
            override fun setColorFilter(f: android.graphics.ColorFilter?) {}
            @Suppress("OVERRIDE_DEPRECATION") override fun getOpacity() = android.graphics.PixelFormat.TRANSLUCENT
        }
        addView(TextView(context).apply { text = emoji; textSize = 58f; gravity = Gravity.CENTER }, FrameLayout.LayoutParams(-1, -1))
    }

    private fun action(c: LinearLayout, kicker: String, headline: String, cardTitle: String, cardText: String, button: String, onClick: () -> Unit) {
        c.gravity = Gravity.START
        c.addView(ui.label(kicker, 12f, palette.accent, bold = true, spacing = 0.15f), LP_MATCH_WRAP)
        c.addView(ui.gap(6f))
        c.addView(ui.title(headline, 34f), LP_MATCH_WRAP)
        c.addView(ui.gap(22f))
        c.addView(ui.card(ui.label(cardTitle, 18f, palette.text, bold = true), ui.gap(4f), ui.label(cardText, 14f, ui.dim)), LP_MATCH_WRAP)
        c.addView(ui.gap(40f))
        val bar = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        bar.addView(ui.ghostButton("Skip for now") { step++; render() })
        bar.addView(View(this), LinearLayout.LayoutParams(0, 1, 1f))
        bar.addView(ui.primaryButton(button) { onClick() })
        c.addView(bar, LP_MATCH_WRAP)
    }

    private fun done(c: LinearLayout) {
        c.addView(ui.gap(40f))
        c.addView(badge("✅"), LinearLayout.LayoutParams(ui.dp(130f), ui.dp(130f)))
        c.addView(ui.gap(22f))
        c.addView(ui.title("You're all set", 34f).apply { gravity = Gravity.CENTER }, LP_MATCH_WRAP)
        c.addView(ui.gap(8f))
        c.addView(ui.label("Open any app and start typing in English or አማርኛ.", 16f, ui.dim, gravity = Gravity.CENTER), LP_MATCH_WRAP)
        c.addView(ui.gap(40f))
        c.addView(ui.primaryButton("Open Akai") { finishOnboarding() }, LP_MATCH_WRAP)
    }

    private fun finishOnboarding() {
        prefs.edit().putBoolean(Prefs.ONBOARDED, true).apply()
        startActivity(Intent(this, HomeActivity::class.java))
        finish()
    }
}

// ─── Home ───────────────────────────────────────────────────────────────────

class HomeActivity : ThemedActivity() {
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        build()
    }

    override fun onResume() {
        super.onResume()
        // The theme may have been changed on the themes screen.
        if (themeReady) { loadTheme(); build() }
    }

    private fun build() {
        val c = column()
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        header.addView(ui.label("A", 20f, android.graphics.Color.WHITE, bold = true, gravity = Gravity.CENTER).apply {
            background = ui.round(palette.accent, 13f)
        }, LinearLayout.LayoutParams(ui.dp(42f), ui.dp(42f)))
        header.addView(ui.title("Akai", 26f), LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = ui.dp(12f) })
        header.addView(ui.ghostButton("⚙") { startActivity(Intent(this, SettingsActivity::class.java)) })
        c.addView(header, LP_MATCH_WRAP)
        c.addView(ui.gap(18f))

        val tryBox = EditText(this).apply {
            hint = "Tap here and type…"
            setHintTextColor(ui.faint)
            setTextColor(palette.text)
            textSize = 16f
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE
            minLines = 3
            gravity = Gravity.TOP
            setPadding(ui.dp(14f), ui.dp(12f), ui.dp(14f), ui.dp(12f))
            background = ui.round(ColorUtils.setAlphaComponent(palette.text, 0x10), 14f, ColorUtils.setAlphaComponent(palette.text, 0x22))
        }
        c.addView(ui.card(
            ui.label("Try Akai", 20f, palette.text, bold = true),
            ui.label("Tap below and use Akai as your keyboard.", 14f, ui.dim),
            ui.gap(12f), tryBox,
        ), LP_MATCH_WRAP)

        c.addView(ui.section("Features"))
        val grid = GridLayout(this).apply { columnCount = 2 }
        fun feature(icon: String, name: String, sub: String, go: Class<*>?) {
            val card = ui.card(
                ui.label(icon, 26f), ui.gap(6f),
                ui.label(name, 16f, palette.text, bold = true), ui.label(sub, 12f, ui.dim),
            )
            if (go != null) card.setOnClickListener { startActivity(Intent(this, go)) }
            ui.pressable(card)
            grid.addView(card, GridLayout.LayoutParams(
                GridLayout.spec(GridLayout.UNDEFINED, 1f), GridLayout.spec(GridLayout.UNDEFINED, 1f),
            ).apply { width = 0; setMargins(ui.dp(5f), ui.dp(5f), ui.dp(5f), ui.dp(5f)) })
        }
        feature("🎨", "Live Themes", "${Themes.all.size} themes", ThemesActivity::class.java)
        feature("😀", "Emojis", "With skin tones", SettingsActivity::class.java)
        feature("🎞️", "GIFs", "Send as images", SettingsActivity::class.java)
        feature("🤖", "AI Tools", "Translate, handwriting", SettingsActivity::class.java)
        feature("⌨️", "Layouts", "QWERTY, Dvorak, fidel…", SettingsActivity::class.java)
        feature("⚙️", "Customization", "Size, feedback, more", SettingsActivity::class.java)
        c.addView(grid, LP_MATCH_WRAP)

        c.addView(ui.section("Quick settings"))
        c.addView(ui.card(
            ui.switchRow("Number row", "Digits above the letters", prefs.getBoolean(Prefs.NUMBER_ROW, false)) { prefs.edit().putBoolean(Prefs.NUMBER_ROW, it).apply() },
            ui.switchRow("Long-press popups", "Hold a key for accents and vowel forms", prefs.getBoolean(Prefs.LONG_PRESS, true)) { prefs.edit().putBoolean(Prefs.LONG_PRESS, it).apply() },
            ui.switchRow("Smooth key press", "Keys shrink slightly when pressed", prefs.getBoolean(Prefs.PRESS_ANIM, true)) { prefs.edit().putBoolean(Prefs.PRESS_ANIM, it).apply() },
            ui.sliderRow("Key height", 70, 140, prefs.getInt(Prefs.HEIGHT, 100), "%") { prefs.edit().putInt(Prefs.HEIGHT, it).apply() },
        ), LP_MATCH_WRAP)
        show(c)
    }
}

// ─── Themes ─────────────────────────────────────────────────────────────────

/** Draws a tiny keyboard in a theme's colours, so themes can be judged at a glance. */
object MiniKeyboard {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val r = RectF()

    fun draw(canvas: Canvas, left: Float, top: Float, w: Float, h: Float, pal: Palette) {
        paint.color = pal.background
        r.set(left, top, left + w, top + h)
        canvas.drawRoundRect(r, h * 0.1f, h * 0.1f, paint)
        val pad = w * 0.05f
        val rows = 4
        val gap = h * 0.04f
        val rh = (h - 2 * pad - gap * (rows - 1)) / rows
        for (row in 0 until rows) {
            val n = if (row == 3) 5 else 9 - row
            val kw = (w - 2 * pad - gap * (n - 1)) / n
            for (k in 0 until n) {
                paint.color = when {
                    row == 3 && k == n - 1 -> pal.keyAccent
                    row == 3 && (k == 0 || k == 1) -> pal.special
                    row == 2 && (k == 0 || k == n - 1) -> pal.special
                    else -> pal.key
                }
                val x = left + pad + k * (kw + gap)
                val y = top + pad + row * (rh + gap)
                r.set(x, y, x + kw, y + rh)
                canvas.drawRoundRect(r, rh * 0.3f, rh * 0.3f, paint)
            }
        }
    }
}

class ThemePreview(context: Context, def: PaletteDef) : View(context) {
    private val pal = Themes.palette(context, def.id)
    override fun onDraw(canvas: Canvas) = MiniKeyboard.draw(canvas, 0f, 0f, width.toFloat(), height.toFloat(), pal)
}

class ThemesActivity : ThemedActivity() {
    private var filter = "all"

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        build()
    }

    private fun build() {
        val c = column()
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        header.addView(ui.ghostButton("←") { finish() })
        header.addView(ui.title("Themes", 28f))
        c.addView(header, LP_MATCH_WRAP)
        c.addView(ui.label("${Themes.all.size} themes. Tap one to use it on the keyboard and in this app.", 14f, ui.dim), LP_MATCH_WRAP)
        c.addView(ui.gap(14f))

        val cats = listOf("all" to "All", "live" to "Live", "solid" to "Solid", "cultural" to "Cultural", "faith" to "Faith", "football" to "Football")
        val chipRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        cats.forEach { (id, name) ->
            val on = id == filter
            chipRow.addView(ui.label(name, 13f, if (on) android.graphics.Color.WHITE else ui.dim, bold = true, gravity = Gravity.CENTER).apply {
                setPadding(ui.dp(16f), ui.dp(9f), ui.dp(16f), ui.dp(9f))
                background = ui.round(if (on) palette.accent else ColorUtils.setAlphaComponent(palette.text, 0x14), 999f)
                setOnClickListener { filter = id; build() }
            }, LinearLayout.LayoutParams(-2, -2).apply { marginEnd = ui.dp(8f) })
        }
        c.addView(HorizontalScrollView(this).apply { isHorizontalScrollBarEnabled = false; addView(chipRow) }, LP_MATCH_WRAP)
        c.addView(ui.gap(14f))

        val current = Themes.find(prefs.getString(Prefs.THEME, Themes.DEFAULT) ?: Themes.DEFAULT).id
        val grid = GridLayout(this).apply { columnCount = 2 }
        Themes.all.filter { filter == "all" || it.category == filter }.forEach { def ->
            val selected = def.id == current
            val preview = ThemePreview(this, def)
            val label = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                addView(ui.label(def.emoji, 16f))
                addView(ui.label(def.name, 14f, palette.text, bold = true).apply { maxLines = 1; ellipsize = android.text.TextUtils.TruncateAt.END },
                    LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = ui.dp(6f) })
                if (def.live.isNotEmpty()) addView(ui.label("LIVE", 9f, palette.accent, bold = true, spacing = 0.1f))
                if (selected) addView(ui.label(" ✓", 14f, palette.accent, bold = true))
            }
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(ui.dp(10f), ui.dp(10f), ui.dp(10f), ui.dp(10f))
                background = ui.round(ColorUtils.setAlphaComponent(palette.surface, 0xDD), 16f,
                    if (selected) palette.accent else ColorUtils.setAlphaComponent(palette.text, 0x1A), if (selected) 2f else 1f)
                addView(preview, LinearLayout.LayoutParams(-1, ui.dp(84f)))
                addView(ui.gap(8f))
                addView(label)
                setOnClickListener {
                    prefs.edit().putString(Prefs.THEME, def.id).apply()
                    loadTheme()
                    build()
                }
            }
            grid.addView(card, GridLayout.LayoutParams(
                GridLayout.spec(GridLayout.UNDEFINED, 1f), GridLayout.spec(GridLayout.UNDEFINED, 1f),
            ).apply { width = 0; setMargins(ui.dp(5f), ui.dp(5f), ui.dp(5f), ui.dp(5f)) })
        }
        c.addView(grid, LP_MATCH_WRAP)
        show(c)
    }
}
