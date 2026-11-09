package com.akai.nativekb

import android.content.Context
import android.content.Intent
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.widget.EditText
import android.widget.LinearLayout
import androidx.core.graphics.ColorUtils
import androidx.core.view.inputmethod.EditorInfoCompat
import androidx.core.view.inputmethod.InputConnectionCompat

/**
 * A box that accepts GIFs from the keyboard, so the GIF tab can be tried here:
 * it reports how big the received image was. (Most text boxes only take text,
 * and then the GIF tab types the link instead.)
 */
class GifTestField(context: Context) : EditText(context) {
    init { hint = "Try the GIF tab here" }

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
            setText(if (size != null) "GIF received: ${content.description.getMimeType(0)}, $size bytes" else "GIF received but unreadable")
            size != null
        }
    }
}

class SettingsActivity : ThemedActivity() {

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        build()
    }

    override fun onResume() {
        super.onResume()
        // The theme may have been changed on the themes screen.
        if (themeReady) { loadTheme(); build() }
    }

    private val wrap = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

    private fun put(key: String, v: Boolean) = prefs.edit().putBoolean(key, v).apply()
    private fun put(key: String, v: Int) = prefs.edit().putInt(key, v).apply()
    private fun put(key: String, v: String) = prefs.edit().putString(key, v).apply()

    private fun field(title: String, key: String, hint: String, secret: Boolean, note: String): View {
        val box = EditText(this).apply {
            this.hint = hint
            setHintTextColor(ui.faint)
            setTextColor(palette.text)
            textSize = 15f
            setSingleLine()
            setText(prefs.getString(key, ""))
            inputType = InputType.TYPE_CLASS_TEXT or if (secret) InputType.TYPE_TEXT_VARIATION_PASSWORD else InputType.TYPE_TEXT_VARIATION_URI
            setPadding(ui.dp(14f), ui.dp(11f), ui.dp(14f), ui.dp(11f))
            background = ui.round(ColorUtils.setAlphaComponent(palette.text, 0x10), 12f, ColorUtils.setAlphaComponent(palette.text, 0x22))
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

    private fun testField(h: String, type: Int = InputType.TYPE_CLASS_TEXT): EditText = EditText(this).apply {
        hint = h
        setHintTextColor(ui.faint)
        setTextColor(palette.text)
        textSize = 15f
        inputType = type
        setPadding(ui.dp(14f), ui.dp(11f), ui.dp(14f), ui.dp(11f))
        background = ui.round(ColorUtils.setAlphaComponent(palette.text, 0x10), 12f, ColorUtils.setAlphaComponent(palette.text, 0x22))
    }

    private fun build() {
        val c = column()
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        header.addView(ui.ghostButton("←") { finish() })
        header.addView(ui.title("Settings", 28f))
        c.addView(header, wrap)

        // ── Look
        c.addView(ui.section("Look"))
        val current = Themes.find(prefs.getString(Prefs.THEME, Themes.DEFAULT) ?: Themes.DEFAULT)
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
        c.addView(themeCard, wrap)
        c.addView(ui.gap(10f))
        c.addView(ui.card(
            ui.sliderRow("Key height", 70, 140, prefs.getInt(Prefs.HEIGHT, 100), "%") { put(Prefs.HEIGHT, it) },
            ui.segmented("One-handed mode", listOf("Off", "Left hand", "Right hand"), prefs.getInt(Prefs.ONE_HAND, 0)) { put(Prefs.ONE_HAND, it) },
            ui.switchRow("Number row", "Always visible in text mode", prefs.getBoolean(Prefs.NUMBER_ROW, false)) { put(Prefs.NUMBER_ROW, it) },
            ui.switchRow("Corner hints", "Show the digit or symbol on letter keys", prefs.getBoolean(Prefs.HINTS, true)) { put(Prefs.HINTS, it) },
            ui.switchRow("Smooth key press", "Keys shrink slightly when pressed", prefs.getBoolean(Prefs.PRESS_ANIM, true)) { put(Prefs.PRESS_ANIM, it) },
            ui.switchRow("Animated backgrounds", "Live themes move behind the keys (pauses while you type)", prefs.getBoolean(Prefs.LIVE_BG, true)) { put(Prefs.LIVE_BG, it) },
        ), wrap)

        // ── Layouts
        c.addView(ui.section("Layouts"))
        val english = listOf("qwerty", "dvorak", "azerty", "colemak", "qwertz")
        val amharic = listOf("traditional", "frequency")
        c.addView(ui.card(
            ui.segmented("English layout", english.map { it.replaceFirstChar { ch -> ch.uppercase() } },
                english.indexOf(prefs.getString(Prefs.ENGLISH_LAYOUT, "qwerty")).coerceAtLeast(0)) { put(Prefs.ENGLISH_LAYOUT, english[it]) },
            ui.segmented("Amharic letter order", listOf("Traditional ሀ ለ ሐ", "Most-used first"),
                amharic.indexOf(prefs.getString(Prefs.AMHARIC_LAYOUT, "traditional")).coerceAtLeast(0)) { put(Prefs.AMHARIC_LAYOUT, amharic[it]) },
        ), wrap)

        // ── Typing
        c.addView(ui.section("Typing"))
        c.addView(ui.card(
            ui.switchRow("Show suggestions", "Akai suggestions bar", prefs.getBoolean(Prefs.SUGGEST, true)) { put(Prefs.SUGGEST, it) },
            ui.switchRow("Learn the words I type", "Never in password, email or number fields", prefs.getBoolean(Prefs.LEARN, true)) { put(Prefs.LEARN, it) },
            ui.switchRow("Auto-capitalization", "Capital at the start of a sentence", prefs.getBoolean(Prefs.AUTOCAP, true)) { put(Prefs.AUTOCAP, it) },
            ui.switchRow("Double-space period", "Two spaces after a word make a full stop", prefs.getBoolean(Prefs.DOUBLE_SPACE, true)) { put(Prefs.DOUBLE_SPACE, it) },
            ui.switchRow("Long-press popups", "Hold a key for accents and vowel forms", prefs.getBoolean(Prefs.LONG_PRESS, true)) { put(Prefs.LONG_PRESS, it) },
            ui.switchRow("Hold backspace to delete the sentence", "", prefs.getBoolean(Prefs.HOLD_CLEAR, false)) { put(Prefs.HOLD_CLEAR, it) },
            ui.sliderRow("Hold time", 300, 2000, prefs.getInt(Prefs.HOLD_CLEAR_MS, 800), " ms") { put(Prefs.HOLD_CLEAR_MS, it) },
            Ui(this, palette).let { u ->
                u.label("Forget learned words", 15f, palette.accent, bold = true).apply {
                    setPadding(0, u.dp(12f), 0, u.dp(4f))
                    setOnClickListener {
                        prefs.edit().remove(Prefs.LEARNED).apply()
                        android.widget.Toast.makeText(context, "Learned words cleared", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            },
        ), wrap)

        // ── Feedback
        c.addView(ui.section("Feedback"))
        c.addView(ui.card(
            ui.switchRow("Haptic feedback", "Feel every tap", prefs.getInt(Prefs.HAPTIC, 3) > 0) { put(Prefs.HAPTIC, if (it) 3 else 0) },
            ui.sliderRow("Vibration strength", 1, 5, prefs.getInt(Prefs.HAPTIC, 3).coerceAtLeast(1), "") { put(Prefs.HAPTIC, it) },
            ui.switchRow("Key sounds", "Subtle click on tap", prefs.getBoolean(Prefs.SOUND, false)) { put(Prefs.SOUND, it) },
        ), wrap)

        // ── Emoji, GIFs and AI tools
        c.addView(ui.section("Emoji, GIFs and AI tools"))
        c.addView(ui.card(
            ui.segmented("Emoji skin tone", listOf("Default", "1", "2", "3", "4", "5"), prefs.getInt(Prefs.SKIN_TONE, 0)) { put(Prefs.SKIN_TONE, it) },
            field("Giphy API key", Prefs.GIPHY_KEY, "Paste your key", true,
                "Free at developers.giphy.com. Kept on this phone only. Leave blank to use the built-in GIFs."),
            field("Akai server address", Prefs.SERVER_URL, "https://your-site.example", false,
                "Handwriting and translation run on the Akai web server. Leave blank to turn them off."),
        ), wrap)

        // ── Keyboard set-up and test fields
        c.addView(ui.section("Keyboard"))
        c.addView(ui.card(
            ui.primaryButton("Turn the keyboard on") { startActivity(Intent(android.provider.Settings.ACTION_INPUT_METHOD_SETTINGS)) },
            ui.gap(8f),
            ui.primaryButton("Choose Akai as your keyboard") {
                (getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager).showInputMethodPicker()
            },
        ), wrap)

        c.addView(ui.section("Try it"))
        c.addView(ui.card(
            GifTestField(this).apply {
                setHintTextColor(ui.faint); setTextColor(palette.text); textSize = 15f
                setPadding(ui.dp(14f), ui.dp(11f), ui.dp(14f), ui.dp(11f))
                background = ui.round(ColorUtils.setAlphaComponent(palette.text, 0x10), 12f, ColorUtils.setAlphaComponent(palette.text, 0x22))
            },
            ui.gap(8f), testField("Text"),
            ui.gap(8f), testField("Phone number", InputType.TYPE_CLASS_PHONE),
            ui.gap(8f), testField("Number", InputType.TYPE_CLASS_NUMBER),
            ui.gap(8f), testField("Email", InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS),
        ), wrap)

        show(c)
    }
}
