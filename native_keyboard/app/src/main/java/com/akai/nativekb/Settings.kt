package com.akai.nativekb

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.pm.PackageInfoCompat
import androidx.core.graphics.ColorUtils
import androidx.core.view.inputmethod.EditorInfoCompat
import androidx.core.view.inputmethod.InputConnectionCompat

/**
 * A box that accepts images from the keyboard, so GIFs and stickers can be tried here:
 * it reports how big the received image was. (Most text boxes only take text,
 * and then a GIF is typed as its link and a sticker as its emoji and caption.)
 */
class GifTestField(context: Context) : EditText(context) {
    init { hint = "Try GIFs and stickers here" }

    override fun onCreateInputConnection(info: EditorInfo): InputConnection? {
        val ic = super.onCreateInputConnection(info) ?: return null
        EditorInfoCompat.setContentMimeTypes(info, arrayOf("image/gif", "image/png", "image/jpeg"))
        return InputConnectionCompat.createWrapper(ic, info) { content, flags, _ ->
            if (android.os.Build.VERSION.SDK_INT >= 25 &&
                (flags and InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION) != 0) {
                try { content.requestPermission() } catch (e: Exception) { return@createWrapper false }
            }
            val size = try {
                context.contentResolver.openInputStream(content.contentUri)?.use { it.readBytes().size }
            } catch (e: Exception) { null }
            setText(if (size != null) "Image received: ${content.description.getMimeType(0)}, $size bytes" else "Image received but unreadable")
            size != null
        }
    }
}

/**
 * Settings: a short list of topics, each opening its own page. Other screens can
 * open a page directly with [open].
 */
class SettingsActivity : ThemedActivity() {

    companion object {
        const val EXTRA_PAGE = "page"
        const val THEME = "theme"
        const val SIZE = "size"
        const val KEYS = "keys"
        const val LANGUAGES = "languages"
        const val TYPING = "typing"
        const val FEEDBACK = "feedback"
        const val TOOLBAR = "toolbar"
        const val EMOJI = "emoji"
        const val AI = "ai"
        const val SETUP = "setup"
        const val ABOUT = "about"

        fun open(c: Context, page: String? = null) =
            c.startActivity(Intent(c, SettingsActivity::class.java).putExtra(EXTRA_PAGE, page))
    }

    private class Page(val id: String, val icon: String, val title: String, val group: String)

    private val pages = listOf(
        Page(THEME, "🎨", "Theme", "Look"),
        Page(KEYS, "🔤", "Keys", "Look"),
        Page(SIZE, "📐", "Size and rows", "Look"),
        Page(LANGUAGES, "🌍", "Languages and layouts", "Typing"),
        Page(TYPING, "✏️", "Typing and correction", "Typing"),
        Page(FEEDBACK, "📳", "Sound and vibration", "Typing"),
        Page(TOOLBAR, "🧰", "Toolbar", "Extras"),
        Page(EMOJI, "😀", "Emoji and GIFs", "Extras"),
        Page(AI, "🤖", "Translation and handwriting", "Extras"),
        Page(SETUP, "🛠️", "Set up and test", "Help"),
        Page(ABOUT, "ℹ️", "About Akai", "Help"),
    )

    private val page: String? get() = intent.getStringExtra(EXTRA_PAGE)
    private var resumed = false

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        build()
    }

    override fun onResume() {
        super.onResume()
        // Coming back from the themes screen or system settings: refresh the colours
        // and summaries (but not on the first resume, straight after onCreate).
        if (resumed && themeReady) { loadTheme(); build() }
        resumed = true
    }

    private val wrap = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

    private fun put(key: String, v: Boolean) = prefs.edit().putBoolean(key, v).apply()
    private fun put(key: String, v: Int) = prefs.edit().putInt(key, v).apply()
    private fun put(key: String, v: String) = prefs.edit().putString(key, v).apply()
    private fun on(key: String, def: Boolean) = prefs.getBoolean(key, def)
    private val server get() = prefs.getString(Prefs.SERVER_URL, "").orEmpty().trim()

    private val versionName: String
        get() = try { packageManager.getPackageInfo(packageName, 0).versionName ?: "?" } catch (e: Exception) { "?" }
    private val versionCode: Long
        get() = try { PackageInfoCompat.getLongVersionCode(packageManager.getPackageInfo(packageName, 0)) } catch (e: Exception) { 0L }

    private fun build() {
        val c = column()
        val title = pages.firstOrNull { it.id == page }?.title ?: "Settings"
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        header.addView(ui.ghostButton("←") { finish() })
        header.addView(ui.title(title, 28f))
        c.addView(header, wrap)
        when (page) {
            THEME -> themePage(c)
            SIZE -> sizePage(c)
            KEYS -> keysPage(c)
            LANGUAGES -> languagesPage(c)
            TYPING -> typingPage(c)
            FEEDBACK -> feedbackPage(c)
            TOOLBAR -> toolbarPage(c)
            EMOJI -> emojiPage(c)
            AI -> aiPage(c)
            SETUP -> setupPage(c)
            ABOUT -> aboutPage(c)
            else -> hub(c)
        }
        show(c)
    }

    // ─── The hub ────────────────────────────────────────────────────────────

    /** One line under each topic saying how it is set now. */
    private fun summary(id: String): String = when (id) {
        THEME -> Themes.find(prefs.getString(Prefs.THEME, Themes.DEFAULT) ?: Themes.DEFAULT).name
        KEYS -> listOfNotNull(
            "${prefs.getInt(Prefs.LABEL_SIZE, 100)}% labels",
            listOf("Light", "Regular", "Medium", "Bold", "Black")[
                listOf(300, 400, 500, 700, 900).indexOf(prefs.getInt(Prefs.KEY_WEIGHT, 400)).coerceAtLeast(0)],
            if (on(Prefs.KEY_BORDERS, false)) "borders" else null,
        ).joinToString(" · ")
        SIZE -> listOfNotNull(
            "${prefs.getInt(Prefs.HEIGHT, 100)}% height",
            when (prefs.getInt(Prefs.ONE_HAND, 0)) { 1 -> "left hand"; 2 -> "right hand"; else -> null },
            if (on(Prefs.NUMBER_ROW, false)) "number row" else null,
            if (on(Prefs.CURSOR_ROW, false)) "cursor keys" else null,
        ).joinToString(" · ")
        LANGUAGES -> {
            val en = (prefs.getString(Prefs.ENGLISH_LAYOUT, "qwerty") ?: "qwerty").uppercase()
            val am = when {
                on(Prefs.PHONETIC, false) -> "Phonetic"
                prefs.getString(Prefs.AMHARIC_LAYOUT, "traditional") == "frequency" -> "Fidel, most-used"
                else -> "Fidel"
            }
            val switch = when (LangKey.parse(prefs.getString(Prefs.LANG_KEY, null))) {
                LangKey.TOOLBAR -> "switch in toolbar"
                LangKey.SPACE -> "switch on space bar"
                LangKey.RIGHT -> "switch beside space"
                else -> null
            }
            listOfNotNull(en, am, switch).joinToString(" · ")
        }
        TYPING -> listOfNotNull(
            if (on(Prefs.SUGGEST, true)) "suggestions" else null,
            if (on(Prefs.AUTOCORRECT, true)) "auto-correct" else null,
            if (on(Prefs.GLIDE, true)) "swipe" else null,
        ).joinToString(", ").ifEmpty { "all off" }.replaceFirstChar { it.uppercase() }
        FEEDBACK -> listOf(
            if (prefs.getInt(Prefs.HAPTIC, 3) > 0) "Vibration on" else "Vibration off",
            if (on(Prefs.SOUND, false)) "sounds on" else "sounds off",
        ).joinToString(" · ")
        TOOLBAR -> {
            val chosen = (prefs.getString(Prefs.TOOLBAR, Tools.DEFAULT) ?: Tools.DEFAULT).split(',').toSet()
            Tools.all.filter { it.first.first != TOOL_SETTINGS && it.first.second in chosen }
                .joinToString(", ") { it.second }.ifEmpty { "Settings only" }
        }
        EMOJI -> if (prefs.getString(Prefs.GIPHY_KEY, "").isNullOrBlank()) "Built-in GIFs" else "Giphy key set"
        AI -> if (server.isEmpty()) "Akai website" else "Your own server"
        SETUP -> if (ImeStatus.enabled(this) && ImeStatus.selected(this)) "Akai is your keyboard" else "Akai isn't your keyboard yet"
        ABOUT -> "Version $versionName"
        else -> ""
    }

    private fun hub(c: LinearLayout) {
        // Until Akai is switched on and chosen, say so first.
        if (!(ImeStatus.enabled(this) && ImeStatus.selected(this))) {
            c.addView(ui.gap(12f))
            c.addView(ui.card(
                ui.label("Akai isn't your keyboard yet", 16f, palette.text, bold = true),
                ui.label("Turn it on and choose it to use these settings.", 13f, ui.dim),
                ui.gap(10f),
                ui.primaryButton("Set it up") { open(this, SETUP) },
            ), wrap)
        }
        pages.groupBy { it.group }.forEach { (group, list) ->
            c.addView(ui.section(group))
            val card = ui.card(pad = 6f)
            list.forEachIndexed { i, p ->
                if (i > 0) card.addView(divider())
                card.addView(navRow(p.icon, p.title, summary(p.id)) { open(this, p.id) }, wrap)
                if (p.id == SETUP) {
                    card.addView(divider())
                    val row = navRow("🔄", "Check for updates", "You have version $versionName", null)
                    row.setOnClickListener { checkForUpdates(row.findViewWithTag("sub")) }
                    card.addView(row, wrap)
                }
            }
            c.addView(card, wrap)
        }
    }

    private fun divider() = View(this).apply {
        setBackgroundColor(ColorUtils.setAlphaComponent(palette.text, 0x14))
        layoutParams = LinearLayout.LayoutParams(-1, ui.dp(1f)).apply { marginStart = ui.dp(54f) }
    }

    private fun navRow(icon: String, title: String, sub: String, onClick: (() -> Unit)?): LinearLayout =
        LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(ui.dp(10f), ui.dp(12f), ui.dp(10f), ui.dp(12f))
            addView(ui.label(icon, 20f, gravity = Gravity.CENTER), LinearLayout.LayoutParams(ui.dp(32f), -2))
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                addView(ui.label(title, 16f, palette.text, bold = true))
                addView(ui.label(sub, 13f, ui.dim).apply {
                    tag = "sub"
                    maxLines = 2; ellipsize = android.text.TextUtils.TruncateAt.END
                    if (sub.isEmpty()) visibility = View.GONE
                })
            }, LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = ui.dp(12f); marginEnd = ui.dp(8f) })
            if (onClick != null) {
                addView(ui.label("›", 22f, ui.dim))
                setOnClickListener { onClick() }
            }
        }

    // ─── Updates ────────────────────────────────────────────────────────────

    private var checking = false

    /** Asks the Akai website for its newest build and offers it if it is newer. */
    private fun checkForUpdates(status: TextView?) {
        if (checking) return
        checking = true
        status?.text = "Checking…"
        Net.latestRelease { r ->
            checking = false
            if (isFinishing) return@latestRelease
            when {
                r == null -> status?.text = "Couldn't reach the server. Try again later."
                r.code <= versionCode -> status?.text = "You're up to date (version $versionName)"
                else -> {
                    status?.text = "Version ${r.name} is available"
                    android.app.AlertDialog.Builder(this)
                        .setTitle("Update to ${r.name}?")
                        .setMessage(r.notes.ifBlank { "A newer Akai keyboard is ready to download." })
                        .setPositiveButton("Download") { _, _ -> openLink(r.url) }
                        .setNegativeButton("Later", null)
                        .show()
                }
            }
        }
    }

    private fun openLink(url: String) = try {
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    } catch (e: Exception) {
        Toast.makeText(this, "No browser to open $url", Toast.LENGTH_SHORT).show()
    }

    // ─── Page helpers ───────────────────────────────────────────────────────

    /** A heading and a card of rows. */
    private fun group(c: LinearLayout, heading: String, vararg rows: View) {
        c.addView(ui.section(heading))
        c.addView(ui.card(*rows), wrap)
    }

    private fun note(t: String) = ui.label(t, 13f, ui.dim).apply { setPadding(0, ui.dp(4f), 0, ui.dp(4f)) }

    /** A switch followed by rows that only show while it is on. */
    private fun switchWith(
        title: String, sub: String, checked: Boolean, vararg dependents: View, onChange: (Boolean) -> Unit,
    ): Array<View> {
        dependents.forEach { it.visibility = if (checked) View.VISIBLE else View.GONE }
        val row = ui.switchRow(title, sub, checked) { v ->
            onChange(v)
            dependents.forEach { it.visibility = if (v) View.VISIBLE else View.GONE }
        }
        return arrayOf(row, *dependents)
    }

    private fun <T : EditText> styled(v: T): T = v.apply {
        setHintTextColor(ui.faint); setTextColor(palette.text); textSize = 15f
        setPadding(ui.dp(14f), ui.dp(11f), ui.dp(14f), ui.dp(11f))
        background = ui.round(ColorUtils.setAlphaComponent(palette.text, 0x10), 12f, ColorUtils.setAlphaComponent(palette.text, 0x22))
    }

    private fun field(title: String, key: String, hint: String, secret: Boolean, note: String): View {
        val box = styled(EditText(this)).apply {
            this.hint = hint
            setSingleLine()
            setText(prefs.getString(key, ""))
            inputType = InputType.TYPE_CLASS_TEXT or if (secret) InputType.TYPE_TEXT_VARIATION_PASSWORD else InputType.TYPE_TEXT_VARIATION_URI
            addTextChangedListener(object : android.text.TextWatcher {
                override fun afterTextChanged(s: android.text.Editable?) { put(key, s?.toString()?.trim().orEmpty()) }
                override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
                override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            })
        }
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, ui.dp(8f), 0, ui.dp(8f))
            addView(ui.label(title, 15f, palette.text, bold = true))
            addView(ui.gap(6f))
            addView(box, wrap)
            addView(ui.gap(4f))
            addView(ui.label(note, 12f, ui.dim))
        }
    }

    private fun testField(h: String, type: Int = InputType.TYPE_CLASS_TEXT): EditText =
        styled(EditText(this)).apply { hint = h; inputType = type }

    // ─── Pages ──────────────────────────────────────────────────────────────

    private fun themePage(c: LinearLayout) {
        val current = Themes.find(prefs.getString(Prefs.THEME, Themes.DEFAULT) ?: Themes.DEFAULT)
        c.addView(ui.gap(12f))
        val themeCard = ui.card(
            LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                addView(ui.label(current.emoji, 24f))
                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    addView(ui.label(current.name, 17f, palette.text, bold = true))
                    addView(ui.label("Tap to browse all ${Themes.all.size} themes", 13f, ui.dim))
                }, LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = ui.dp(12f) })
                addView(ui.label("›", 24f, ui.dim))
            },
        )
        themeCard.setOnClickListener { startActivity(Intent(this, ThemesActivity::class.java)) }
        ui.pressable(themeCard)
        c.addView(themeCard, wrap)

        c.addView(ui.section("Your themes"))
        val mine = ui.card(pad = 6f)
        mine.addView(navRow("➕", "Create a theme", "Start from ${current.name}'s colours") {
            ThemeEditorActivity.copy(this, current.id)
        }, wrap)
        if (current.category == CustomThemes.CATEGORY) {
            mine.addView(divider())
            mine.addView(navRow("✎", "Edit ${current.name}", "Change its colours, name or animation") {
                ThemeEditorActivity.edit(this, current.id)
            }, wrap)
        }
        CustomThemes.defs.filter { it.id != current.id }.forEach { d ->
            mine.addView(divider())
            mine.addView(navRow(d.emoji, d.name, "Tap to edit") { ThemeEditorActivity.edit(this, d.id) }, wrap)
        }
        c.addView(mine, wrap)

        group(c, "Motion",
            ui.switchRow("Animated backgrounds", "Live themes move behind the keys (pauses while you type)", on(Prefs.LIVE_BG, true)) { put(Prefs.LIVE_BG, it) },
            ui.switchRow("Smooth key press", "Keys shrink slightly when pressed", on(Prefs.PRESS_ANIM, true)) { put(Prefs.PRESS_ANIM, it) },
        )
    }

    private fun sizePage(c: LinearLayout) {
        group(c, "Size",
            ui.sliderRow("Key height", 70, 140, prefs.getInt(Prefs.HEIGHT, 100), "%") { put(Prefs.HEIGHT, it) },
        )
        val oneHand = prefs.getInt(Prefs.ONE_HAND, 0)
        val width = ui.sliderRow("Width", 50, 95, prefs.getInt(Prefs.ONE_HAND_WIDTH, 80), "%") { put(Prefs.ONE_HAND_WIDTH, it) }
        width.visibility = if (oneHand > 0) View.VISIBLE else View.GONE
        group(c, "One-handed mode",
            ui.segmented("Move the keys towards", listOf("Off", "Left hand", "Right hand"), oneHand) {
                put(Prefs.ONE_HAND, it)
                width.visibility = if (it > 0) View.VISIBLE else View.GONE
            },
            width,
        )
        group(c, "Extra rows",
            ui.switchRow("Number row", "Always visible in text mode", on(Prefs.NUMBER_ROW, false)) { put(Prefs.NUMBER_ROW, it) },
            ui.switchRow("Cursor keys", "A row of ⇤ ◀ ▲ ▼ ▶ ⇥ above the space bar", on(Prefs.CURSOR_ROW, false)) { put(Prefs.CURSOR_ROW, it) },
        )
    }

    private fun keysPage(c: LinearLayout) {
        val weights = listOf(300, 400, 500, 700, 900)
        group(c, "Shape",
            ui.sliderRow("Key spacing", 0, 12, prefs.getInt(Prefs.KEY_GAP, 5), " dp") { put(Prefs.KEY_GAP, it) },
            ui.sliderRow("Corner roundness", 0, 24, prefs.getInt(Prefs.KEY_RADIUS, 8), " dp") { put(Prefs.KEY_RADIUS, it) },
            ui.switchRow("Key borders", "A thin outline round every key", on(Prefs.KEY_BORDERS, false)) { put(Prefs.KEY_BORDERS, it) },
        )
        group(c, "Labels",
            ui.sliderRow("Label size", 70, 140, prefs.getInt(Prefs.LABEL_SIZE, 100), "%") { put(Prefs.LABEL_SIZE, it) },
            ui.segmented("Letter weight", listOf("Light", "Regular", "Medium", "Bold", "Black"),
                weights.indexOf(prefs.getInt(Prefs.KEY_WEIGHT, 400)).coerceAtLeast(0)) { put(Prefs.KEY_WEIGHT, weights[it]) },
            ui.switchRow("Corner hints", "Show the digit or symbol on letter keys", on(Prefs.HINTS, true)) { put(Prefs.HINTS, it) },
        )
    }

    private fun languagesPage(c: LinearLayout) {
        val english = listOf("qwerty", "dvorak", "azerty", "colemak", "qwertz")
        val amharic = listOf("traditional", "frequency")
        group(c, "English",
            ui.segmented("Layout", english.map { it.replaceFirstChar { ch -> ch.uppercase() } },
                english.indexOf(prefs.getString(Prefs.ENGLISH_LAYOUT, "qwerty")).coerceAtLeast(0)) { put(Prefs.ENGLISH_LAYOUT, english[it]) },
        )
        // Fidel or phonetic, as on the web keyboard; holding the language key also flips it.
        group(c, "Amharic",
            ui.segmented("Keyboard", listOf("Fidel ሀ ለ ሐ", "Fidel, most-used", "Phonetic"),
                if (on(Prefs.PHONETIC, false)) 2
                else amharic.indexOf(prefs.getString(Prefs.AMHARIC_LAYOUT, "traditional")).coerceAtLeast(0)) {
                if (it == 2) put(Prefs.PHONETIC, true)
                else { put(Prefs.PHONETIC, false); put(Prefs.AMHARIC_LAYOUT, amharic[it]) }
            },
            note("Phonetic types Amharic from Latin letters: \"selam\" gives ሰላም. Hold the language key to switch between fidel and phonetic."),
        )
        val places = listOf(
            LangKey.SYMBOLS to ("Beside ?123" to "A key next to the symbols key"),
            LangKey.TOOLBAR to ("In the toolbar" to "The first button on the top row, before emoji; stays put while you type"),
            LangKey.SPACE to ("On the space bar" to "Hold space until it lights up, then slide left or right. A quick slide still moves the cursor"),
            LangKey.RIGHT to ("Beside the space bar" to "A key between the full stop and Enter, for the right thumb"),
        )
        group(c, "Language switch",
            ui.choiceList(places.map { it.second },
                places.indexOfFirst { it.first == LangKey.parse(prefs.getString(Prefs.LANG_KEY, null)) }.coerceAtLeast(0)) {
                put(Prefs.LANG_KEY, places[it].first)
            },
        )
    }

    private fun typingPage(c: LinearLayout) {
        val forget = ui.label("Forget learned words", 15f, palette.accent, bold = true).apply {
            setPadding(0, ui.dp(12f), 0, ui.dp(4f))
            setOnClickListener {
                prefs.edit().remove(Prefs.LEARNED).apply()
                Toast.makeText(context, "Learned words cleared", Toast.LENGTH_SHORT).show()
            }
        }
        group(c, "Suggestions",
            ui.switchRow("Show suggestions", "Word suggestions above the keys", on(Prefs.SUGGEST, true)) { put(Prefs.SUGGEST, it) },
            ui.switchRow("Auto-correct", "Fixes English typos when you finish a word; backspace undoes it", on(Prefs.AUTOCORRECT, true)) { put(Prefs.AUTOCORRECT, it) },
            ui.switchRow("Learn the words I type", "Never in password, email or number fields", on(Prefs.LEARN, true)) { put(Prefs.LEARN, it) },
            forget,
        )
        group(c, "Gestures",
            ui.switchRow("Swipe typing", "Slide across the English letters to type a word", on(Prefs.GLIDE, true)) { put(Prefs.GLIDE, it) },
            *switchWith("Long-press popups", "Hold a key for accents and vowel forms", on(Prefs.LONG_PRESS, true),
                ui.sliderRow("Long-press delay", 150, 1000, prefs.getInt(Prefs.LONG_PRESS_MS, 330), " ms") { put(Prefs.LONG_PRESS_MS, it) },
            ) { put(Prefs.LONG_PRESS, it) },
            *switchWith("Hold backspace to delete the sentence", "", on(Prefs.HOLD_CLEAR, false),
                ui.sliderRow("Hold time", 300, 2000, prefs.getInt(Prefs.HOLD_CLEAR_MS, 800), " ms") { put(Prefs.HOLD_CLEAR_MS, it) },
            ) { put(Prefs.HOLD_CLEAR, it) },
        )
        group(c, "Punctuation and capitals",
            ui.switchRow("Auto-capitalization", "Capital at the start of a sentence", on(Prefs.AUTOCAP, true)) { put(Prefs.AUTOCAP, it) },
            ui.switchRow("Double-space period", "Two spaces after a word make a full stop", on(Prefs.DOUBLE_SPACE, true)) { put(Prefs.DOUBLE_SPACE, it) },
            ui.switchRow("Space after punctuation", "After . ! ? ; : the next letter starts with a space", on(Prefs.AUTO_SPACE, false)) { put(Prefs.AUTO_SPACE, it) },
        )
    }

    private fun feedbackPage(c: LinearLayout) {
        group(c, "Vibration",
            *switchWith("Haptic feedback", "Feel every tap", prefs.getInt(Prefs.HAPTIC, 3) > 0,
                ui.sliderRow("Strength", 1, 5, prefs.getInt(Prefs.HAPTIC, 3).coerceAtLeast(1), "") { put(Prefs.HAPTIC, it) },
            ) { put(Prefs.HAPTIC, if (it) 3 else 0) },
        )
        group(c, "Sound",
            *switchWith("Key sounds", "Subtle click on tap", on(Prefs.SOUND, false),
                ui.sliderRow("Volume", 10, 100, prefs.getInt(Prefs.SOUND_VOLUME, 60), "%") { put(Prefs.SOUND_VOLUME, it) },
            ) { put(Prefs.SOUND, it) },
        )
    }

    private fun toolbarPage(c: LinearLayout) {
        val chosen = (prefs.getString(Prefs.TOOLBAR, Tools.DEFAULT) ?: Tools.DEFAULT).split(',').toMutableSet()
        val toolRows = Tools.all.filter { it.first.first != TOOL_SETTINGS }.map { (t, spoken) ->
            ui.switchRow("${t.third}   $spoken", "", t.second in chosen) { on ->
                if (on) chosen.add(t.second) else chosen.remove(t.second)
                put(Prefs.TOOLBAR, chosen.filter { it.isNotBlank() }.joinToString(","))
            }
        }
        group(c, "Buttons",
            note("Shown left of the suggestions. Settings is always there, and every tool is also inside the emoji panel. With more than three, the toolbar folds behind one button while you type."),
            *toolRows.toTypedArray(),
        )
        group(c, "Above the toolbar",
            ui.switchRow("Word of the day", "A row above the toolbar; tap it to type the word", on(Prefs.WORD_OF_DAY, true)) { put(Prefs.WORD_OF_DAY, it) },
        )
    }

    private fun emojiPage(c: LinearLayout) {
        group(c, "Emoji",
            ui.segmented("Skin tone", listOf("Default", "1", "2", "3", "4", "5"), prefs.getInt(Prefs.SKIN_TONE, 0)) { put(Prefs.SKIN_TONE, it) },
        )
        group(c, "GIFs",
            field("Giphy API key", Prefs.GIPHY_KEY, "Paste your key", true,
                "Free at developers.giphy.com. Kept on this phone only. Leave blank to use the built-in GIFs."),
        )
    }

    private fun aiPage(c: LinearLayout) {
        group(c, "Server",
            field("Akai server address", Prefs.SERVER_URL, Net.SITE, false,
                "Translation runs on the Akai web server. Leave blank to use the Akai website, or enter your own. Handwriting is read on the phone, and uses the server only if that fails."),
        )
    }

    private fun setupPage(c: LinearLayout) {
        val enabled = ImeStatus.enabled(this)
        val selected = ImeStatus.selected(this)
        group(c, "Keyboard",
            ui.label(if (enabled) "✓  Turned on" else "1.  Turn Akai on in system settings", 15f, palette.text, bold = true),
            ui.gap(8f),
            ui.primaryButton("Turn the keyboard on") { startActivity(Intent(android.provider.Settings.ACTION_INPUT_METHOD_SETTINGS)) },
            ui.gap(14f),
            ui.label(if (selected) "✓  Chosen as your keyboard" else "2.  Choose Akai as your keyboard", 15f, palette.text, bold = true),
            ui.gap(8f),
            ui.primaryButton("Choose Akai as your keyboard") {
                (getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager).showInputMethodPicker()
            },
        )
        group(c, "Try it",
            note("Each box asks for a different kind of keyboard."),
            styled(GifTestField(this)),
            ui.gap(8f), testField("Text"),
            ui.gap(8f), testField("Phone number", InputType.TYPE_CLASS_PHONE),
            ui.gap(8f), testField("Number", InputType.TYPE_CLASS_NUMBER),
            ui.gap(8f), testField("Email", InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS),
        )
    }

    private fun aboutPage(c: LinearLayout) {
        c.addView(ui.gap(12f))
        c.addView(ui.card(
            LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                addView(ui.label("A", 22f, android.graphics.Color.WHITE, bold = true, gravity = Gravity.CENTER).apply {
                    background = ui.round(palette.accent, 14f)
                }, LinearLayout.LayoutParams(ui.dp(48f), ui.dp(48f)))
                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    addView(ui.label("Akai Keyboard", 18f, palette.text, bold = true))
                    addView(ui.label("Version $versionName ($versionCode)", 13f, ui.dim))
                }, LinearLayout.LayoutParams(0, -2, 1f).apply { marginStart = ui.dp(14f) })
            },
            ui.gap(12f),
            ui.label("A bilingual English and Amharic keyboard, with fidel and phonetic typing, live themes, emoji, GIFs, handwriting and translation.", 14f, ui.dim),
        ), wrap)

        val updateRow = navRow("🔄", "Check for updates", "You have version $versionName", null)
        updateRow.setOnClickListener { checkForUpdates(updateRow.findViewWithTag("sub")) }
        val links = ui.card(pad = 6f).apply {
            addView(updateRow, wrap)
            addView(divider())
            addView(navRow("🌐", "Website", Net.SITE.removePrefix("https://")) { openLink(Net.SITE) }, wrap)
        }
        c.addView(ui.section("App"))
        c.addView(links, wrap)

        group(c, "Privacy",
            note("Learned words and settings are kept on this phone, and words are never learned from password, email or number fields. Text goes to your Akai server only when you use Translate, or for handwriting the phone can't read. GIF searches go to Giphy, and voice typing uses your phone's speech service."),
        )
        group(c, "Credits",
            note("English word list from FrequencyWords by Hermit Dave, CC BY-SA 4.0.\nHandwriting by Google ML Kit digital ink recognition.\nGIFs powered by Giphy."),
        )
    }
}
