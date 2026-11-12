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
/** The Themes screen's filter for themes other people shared. */
private const val COMMUNITY = "community"

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
            hint = ui.tr("Tap here and type…")
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
        fun feature(icon: String, name: String, sub: String, go: () -> Unit) {
            val card = ui.card(
                ui.label(icon, 26f), ui.gap(6f),
                ui.label(name, 16f, palette.text, bold = true), ui.label(sub, 12f, ui.dim),
            )
            card.setOnClickListener { go() }
            ui.pressable(card)
            grid.addView(card, GridLayout.LayoutParams(
                GridLayout.spec(GridLayout.UNDEFINED, 1f), GridLayout.spec(GridLayout.UNDEFINED, 1f),
            ).apply { width = 0; setMargins(ui.dp(5f), ui.dp(5f), ui.dp(5f), ui.dp(5f)) })
        }
        feature("🎨", "Live Themes", ui.tr("{n} themes", "n" to Themes.all.size)) { startActivity(Intent(this, ThemesActivity::class.java)) }
        feature("😀", "Emojis", "With skin tones") { SettingsActivity.open(this, SettingsActivity.EMOJI) }
        feature("🎞️", "GIFs", "Send as images") { SettingsActivity.open(this, SettingsActivity.EMOJI) }
        feature("🛍️", "Stickers", "Sticker Marketplace") { StickerMarketActivity.open(this) }
        feature("🤖", "AI Tools", "Translate, handwriting") { SettingsActivity.open(this, SettingsActivity.AI) }
        feature("⌨️", "Layouts", "QWERTY, Dvorak, fidel…") { SettingsActivity.open(this, SettingsActivity.LANGUAGES) }
        feature("⚙️", "Customization", "Size, feedback, more") { SettingsActivity.open(this) }
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
    // From the definition itself: a shared theme being browsed isn't installed, so it can't be found by id.
    private val pal = run { CustomThemes.refresh(context); Themes.palette(def) }
    override fun onDraw(canvas: Canvas) = MiniKeyboard.draw(canvas, 0f, 0f, width.toFloat(), height.toFloat(), pal)
}

class ThemesActivity : ThemedActivity() {
    private var filter = "all"
    private var resumed = false

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        build()
    }

    override fun onResume() {
        super.onResume()
        // Back from the theme editor: show the new or changed theme.
        if (resumed && themeReady) { loadTheme(); build() }
        resumed = true
    }

    /** Long-press menu: edit, share or delete your own themes, or start a new one from any theme. */
    private fun themeActions(def: PaletteDef) {
        val custom = if (def.category == CustomThemes.CATEGORY) CustomThemes.get(this, def.id) else null
        val items = when {
            custom == null -> arrayOf("Customize a copy")
            custom.shared.isNotEmpty() -> arrayOf("Edit", "Make a copy", "Stop sharing", "Delete")
            // A theme from the community is someone else's to share.
            custom.source.isNotEmpty() -> arrayOf("Edit", "Make a copy", "Delete")
            else -> arrayOf("Edit", "Make a copy", "Share to community", "Delete")
        }
        android.app.AlertDialog.Builder(this)
            .setTitle(def.name)
            .setItems(items.map { ui.tr(it) }.toTypedArray()) { _, i ->
                when (items[i]) {
                    "Edit" -> ThemeEditorActivity.edit(this, def.id)
                    "Share to community" -> custom?.let(::share)
                    "Stop sharing" -> custom?.let(::unshare)
                    "Delete" -> android.app.AlertDialog.Builder(this)
                        .setTitle(ui.tr("Delete {name}?", "name" to def.name))
                        .setMessage(if (custom?.shared?.isNotEmpty() == true) ui.tr("It also stops being shared with the community.") else null)
                        .setPositiveButton(ui.tr("Delete")) { _, _ ->
                            custom?.shared?.takeIf { it.isNotEmpty() }?.let { Community.unshare(this, it) {} }
                            CustomThemes.delete(this, def.id); loadTheme(); build()
                        }
                        .setNegativeButton(ui.tr("Cancel"), null)
                        .show()
                    else -> ThemeEditorActivity.copy(this, def.id)
                }
            }
            .show()
    }

    private fun toast(s: String) = android.widget.Toast.makeText(this, s, android.widget.Toast.LENGTH_LONG).show()

    /** Asks for an optional name to credit, then shares the theme. */
    private fun share(t: CustomTheme) {
        val field = android.widget.EditText(this).apply {
            hint = ui.tr("Your name (optional)")
            setText(prefs.getString(Community.AUTHOR, ""))
            setSingleLine()
            filters = arrayOf(android.text.InputFilter.LengthFilter(24))
        }
        val box = LinearLayout(this).apply { setPadding(ui.dp(22f), ui.dp(4f), ui.dp(22f), 0); addView(field, LP_MATCH_WRAP) }
        android.app.AlertDialog.Builder(this)
            .setTitle(ui.tr("Share {name}?", "name" to t.name))
            .setMessage(ui.tr("Everyone using AkAI will see its name, emoji, colours and the name you give here. You can stop sharing it any time."))
            .setView(box)
            .setPositiveButton(ui.tr("Share")) { _, _ ->
                val author = field.text.toString().trim()
                prefs.edit().putString(Community.AUTHOR, author).apply()
                Community.share(this, t, author) { id, error ->
                    if (id == null) { toast(error ?: ui.tr("Couldn't share it")); return@share }
                    CustomThemes.save(this, t.copy(shared = id))
                    toast(ui.tr("Shared. It's in Community now"))
                    loadTheme(); build()
                }
            }
            .setNegativeButton(ui.tr("Cancel"), null)
            .show()
    }

    private fun unshare(t: CustomTheme) {
        Community.unshare(this, t.shared) { ok ->
            if (!ok) { toast(ui.tr("No connection. Try again")); return@unshare }
            CustomThemes.save(this, t.copy(shared = ""))
            toast(ui.tr("No longer shared"))
            loadTheme(); build()
        }
    }

    // ─── Community ───────────────────────────────────────────────────────

    private var popular = true
    private val shared = ArrayList<SharedTheme>()
    private var nextOffset: Int? = null
    private var loading = false
    /** The first page has come back, so an empty list means nothing is shared yet. */
    private var communityLoaded = false
    private var communityError: String? = null
    /** The grid and "Load more" button on screen, so another page adds to them instead of redrawing. */
    private var communityGrid: GridLayout? = null
    private var moreButton: View? = null

    private fun loadCommunity(reset: Boolean) {
        if (loading) return
        if (reset) { shared.clear(); nextOffset = null; communityLoaded = false }
        loading = true
        communityError = null
        val wanted = popular
        Community.list(this, popular, if (reset) 0 else nextOffset ?: 0) { page, error ->
            if (wanted != popular || isFinishing) { loading = false; return@list }
            loading = false
            if (page == null) { communityError = error; if (filter == COMMUNITY) build(); return@list }
            nextOffset = page.next
            communityLoaded = true
            val grid = communityGrid
            if (!reset && grid != null && filter == COMMUNITY) {
                addCards(grid, page.themes)
                shared.addAll(page.themes)
                moreButton?.visibility = if (nextOffset != null) View.VISIBLE else View.GONE
            } else {
                shared.addAll(page.themes)
                if (filter == COMMUNITY) build()
            }
        }
    }

    // Columns share the width; rows take their own height (a row weight would stretch them to fill the screen).
    private fun gridCell() = GridLayout.LayoutParams(
        GridLayout.spec(GridLayout.UNDEFINED), GridLayout.spec(GridLayout.UNDEFINED, 1f),
    ).apply { width = 0; setMargins(ui.dp(5f), ui.dp(5f), ui.dp(5f), ui.dp(5f)) }

    /** Filler that keeps an odd last card at half width; always the grid's last cell. */
    private var gridFiller: View? = null

    private fun addCards(grid: GridLayout, themes: List<SharedTheme>) {
        gridFiller?.let(grid::removeView)
        themes.forEach { grid.addView(sharedCard(it), gridCell()) }
        if (grid.childCount % 2 == 1) grid.addView(View(this).also { gridFiller = it }, gridCell()) else gridFiller = null
    }

    private fun installed(t: SharedTheme) = CustomThemes.themes.firstOrNull { it.source == t.id || it.shared == t.id }

    private fun sharedCard(t: SharedTheme): View {
        val have = installed(t)
        val label = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            addView(ui.label(t.emoji, 16f))
            addView(ui.label(t.name, 14f, palette.text, bold = true).apply { maxLines = 1; ellipsize = android.text.TextUtils.TruncateAt.END },
                LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = ui.dp(6f) })
            if (t.live.isNotEmpty()) addView(ui.label("LIVE", 9f, palette.accent, bold = true, spacing = 0.1f))
            if (have != null) addView(ui.label(" ✓", 14f, palette.accent, bold = true))
        }
        val installs = if (t.installs == 1) "1 install" else "${t.installs} installs"
        val credit = ui.label(if (t.author.isNotEmpty()) "${t.author} · $installs" else installs, 12f, ui.dim).apply {
            maxLines = 1; ellipsize = android.text.TextUtils.TruncateAt.END
        }
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(ui.dp(10f), ui.dp(10f), ui.dp(10f), ui.dp(10f))
            background = ui.round(ColorUtils.setAlphaComponent(palette.surface, 0xDD), 16f, ColorUtils.setAlphaComponent(palette.text, 0x1A), 1f)
            addView(ThemePreview(this@ThemesActivity, t.toDef()), LinearLayout.LayoutParams(-1, ui.dp(84f)))
            addView(ui.gap(8f))
            addView(label)
            addView(credit)
            setOnClickListener {
                // Added before: just use it. Otherwise it joins Mine and is used straight away.
                val custom = installed(t) ?: t.toCustom().also {
                    CustomThemes.save(this@ThemesActivity, it)
                    Community.countInstall(this@ThemesActivity, t.id)
                    toast("${t.name} added to Mine and in use")
                }
                prefs.edit().putString(Prefs.THEME, custom.id).apply()
                loadTheme()
                build()
            }
            setOnLongClickListener {
                // Your own shared theme: offer to take it down rather than report it.
                val own = CustomThemes.themes.firstOrNull { it.shared == t.id }
                if (own != null) android.app.AlertDialog.Builder(this@ThemesActivity)
                    .setTitle(t.name)
                    .setItems(arrayOf(ui.tr("Stop sharing"))) { _, _ -> unshare(own); shared.removeAll { it.id == t.id } }
                    .show()
                else reportDialog(t)
                true
            }
        }
    }

    private fun reportDialog(t: SharedTheme) {
        android.app.AlertDialog.Builder(this)
            .setTitle(ui.tr("Report {name}?", "name" to t.name))
            .setMessage(ui.tr("For an offensive name or anything that shouldn't be here. A theme reported by a few people is hidden until it's checked."))
            .setPositiveButton(ui.tr("Report")) { _, _ ->
                Community.report(this, t.id) { ok ->
                    if (!ok) { toast(ui.tr("No connection. Try again")); return@report }
                    shared.removeAll { it.id == t.id }
                    toast(ui.tr("Thanks for reporting it"))
                    build()
                }
            }
            .setNegativeButton(ui.tr("Cancel"), null)
            .show()
    }

    private fun buildCommunity(c: LinearLayout) {
        val sortRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        listOf(true to "Popular", false to "New").forEach { (value, name) ->
            val on = value == popular
            sortRow.addView(ui.label(name, 13f, if (on) palette.text else ui.dim, bold = on, gravity = Gravity.CENTER).apply {
                setPadding(ui.dp(14f), ui.dp(7f), ui.dp(14f), ui.dp(7f))
                background = if (on) ui.round(ColorUtils.setAlphaComponent(palette.text, 0x14), 999f) else null
                setOnClickListener { if (popular != value) { popular = value; loadCommunity(reset = true); build() } }
            }, LinearLayout.LayoutParams(-2, -2).apply { marginEnd = ui.dp(6f) })
        }
        c.addView(sortRow, LP_MATCH_WRAP)
        c.addView(ui.label("Themes people made and shared. Tap one to add it to Mine; long-press to report it. To share yours, long-press it under Mine.", 13f, ui.dim).apply {
            setPadding(ui.dp(4f), ui.dp(8f), ui.dp(4f), ui.dp(6f))
        }, LP_MATCH_WRAP)

        val error = communityError
        when {
            error != null && shared.isEmpty() -> {
                c.addView(ui.label(error, 14f, palette.text).apply { setPadding(ui.dp(4f), ui.dp(16f), ui.dp(4f), ui.dp(10f)) }, LP_MATCH_WRAP)
                c.addView(ui.ghostButton("Try again") { loadCommunity(reset = true); build() })
            }
            shared.isEmpty() && !communityLoaded ->
                c.addView(ui.label("Loading…", 14f, ui.dim).apply { setPadding(ui.dp(4f), ui.dp(16f), 0, 0) }, LP_MATCH_WRAP)
            shared.isEmpty() ->
                c.addView(ui.label("Nothing shared yet. Be the first: long-press one of your themes under Mine and choose Share.", 14f, ui.dim).apply {
                    setPadding(ui.dp(4f), ui.dp(16f), ui.dp(4f), 0)
                }, LP_MATCH_WRAP)
        }
        val grid = GridLayout(this).apply { columnCount = 2 }
        gridFiller = null
        addCards(grid, shared)
        c.addView(grid, LP_MATCH_WRAP)
        communityGrid = grid
        val more = ui.ghostButton("Load more") { loadCommunity(reset = false) }
        more.visibility = if (nextOffset != null) View.VISIBLE else View.GONE
        c.addView(more)
        moreButton = more
    }

    private fun build() {
        val c = column()
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        header.addView(ui.ghostButton("←") { finish() })
        header.addView(ui.title("Themes", 28f))
        c.addView(header, LP_MATCH_WRAP)
        c.addView(ui.label(ui.tr("{n} themes. Tap one to use it; long-press to customize it.", "n" to Themes.all.size), 14f, ui.dim), LP_MATCH_WRAP)
        c.addView(ui.gap(14f))

        val cats = listOf("all" to "All", CustomThemes.CATEGORY to "Mine", COMMUNITY to "Community", "live" to "Live", "solid" to "Solid", "cultural" to "Cultural", "faith" to "Faith", "football" to "Football")
        val chipRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        cats.forEach { (id, name) ->
            val on = id == filter
            chipRow.addView(ui.label(name, 13f, if (on) android.graphics.Color.WHITE else ui.dim, bold = true, gravity = Gravity.CENTER).apply {
                setPadding(ui.dp(16f), ui.dp(9f), ui.dp(16f), ui.dp(9f))
                background = ui.round(if (on) palette.accent else ColorUtils.setAlphaComponent(palette.text, 0x14), 999f)
                setOnClickListener {
                    filter = id
                    if (id == COMMUNITY && shared.isEmpty() && !loading) loadCommunity(reset = true)
                    build()
                }
            }, LinearLayout.LayoutParams(-2, -2).apply { marginEnd = ui.dp(8f) })
        }
        c.addView(HorizontalScrollView(this).apply { isHorizontalScrollBarEnabled = false; addView(chipRow) }, LP_MATCH_WRAP)
        c.addView(ui.gap(14f))

        communityGrid = null; moreButton = null
        if (filter == COMMUNITY) { buildCommunity(c); show(c); return }

        val current = Themes.find(prefs.getString(Prefs.THEME, Themes.DEFAULT) ?: Themes.DEFAULT).id
        val grid = GridLayout(this).apply { columnCount = 2 }
        fun cell() = GridLayout.LayoutParams(
            GridLayout.spec(GridLayout.UNDEFINED, 1f), GridLayout.spec(GridLayout.UNDEFINED, 1f),
        ).apply { width = 0; setMargins(ui.dp(5f), ui.dp(5f), ui.dp(5f), ui.dp(5f)) }
        if (filter == "all" || filter == CustomThemes.CATEGORY) {
            val create = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                setPadding(ui.dp(10f), ui.dp(10f), ui.dp(10f), ui.dp(10f))
                background = ui.round(ColorUtils.setAlphaComponent(palette.accent, 0x14), 16f, ColorUtils.setAlphaComponent(palette.accent, 0x66), 1.5f)
                addView(ui.label("+", 34f, palette.accent, bold = true, gravity = Gravity.CENTER), LinearLayout.LayoutParams(-1, ui.dp(84f)))
                addView(ui.gap(8f))
                addView(ui.label("Create theme", 14f, palette.text, bold = true, gravity = Gravity.CENTER), LinearLayout.LayoutParams(-1, -2))
                setOnClickListener { ThemeEditorActivity.copy(this@ThemesActivity, current) }
            }
            ui.pressable(create)
            grid.addView(create, cell())
        }
        Themes.all.filter { filter == "all" || it.category == filter }.forEach { def ->
            val selected = def.id == current
            val preview = ThemePreview(this, def)
            val label = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                addView(ui.label(def.emoji, 16f))
                addView(ui.label(def.name, 14f, palette.text, bold = true).apply { maxLines = 1; ellipsize = android.text.TextUtils.TruncateAt.END },
                    LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = ui.dp(6f) })
                if (def.category == CustomThemes.CATEGORY) addView(ui.label("MINE ", 9f, palette.accent, bold = true, spacing = 0.1f))
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
                setOnLongClickListener { themeActions(def); true }
            }
            grid.addView(card, cell())
        }
        c.addView(grid, LP_MATCH_WRAP)
        if (filter == CustomThemes.CATEGORY && CustomThemes.defs.isEmpty())
            c.addView(ui.label("Themes you make show up here. Tap Create theme, or long-press any theme to start from its colours.", 13f, ui.dim).apply {
                setPadding(ui.dp(6f), ui.dp(10f), ui.dp(6f), 0)
            }, LP_MATCH_WRAP)
        show(c)
    }
}
