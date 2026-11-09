package com.akai.nativekb

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.text.InputType
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.Spinner
import android.widget.AdapterView
import android.widget.Switch
import android.widget.TextView

/**
 * A box that accepts GIFs from the keyboard, so the GIF tab can be tried here:
 * it reports how big the received image was. (Most text boxes only take text,
 * and then the GIF tab types the link instead.)
 */
class GifTestField(context: Context) : EditText(context) {
    init { hint = "Try the GIF tab here" }

    override fun onCreateInputConnection(info: android.view.inputmethod.EditorInfo): android.view.inputmethod.InputConnection? {
        val ic = super.onCreateInputConnection(info) ?: return null
        androidx.core.view.inputmethod.EditorInfoCompat.setContentMimeTypes(info, arrayOf("image/gif", "image/png", "image/jpeg"))
        return androidx.core.view.inputmethod.InputConnectionCompat.createWrapper(ic, info) { content, flags, _ ->
            if (android.os.Build.VERSION.SDK_INT >= 25 &&
                (flags and androidx.core.view.inputmethod.InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION) != 0) {
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

/** Set-up and settings: turn the keyboard on, pick it, adjust it, and try it. */
class MainActivity : Activity() {

    private val prefs by lazy { getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE) }
    private val d by lazy { resources.displayMetrics.density }

    private fun label(text: String, size: Float = 15f) = TextView(this).apply {
        this.text = text
        textSize = size
        setPadding(0, (10 * d).toInt(), 0, (4 * d).toInt())
    }

    private fun toggle(title: String, key: String, default: Boolean) = Switch(this).apply {
        text = title
        isChecked = prefs.getBoolean(key, default)
        setPadding(0, (6 * d).toInt(), 0, (6 * d).toInt())
        setOnCheckedChangeListener { _, on -> prefs.edit().putBoolean(key, on).apply() }
    }

    /** A slider with its current value in the title. */
    private fun slider(title: String, key: String, min: Int, max: Int, default: Int, unit: String): View {
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val value = prefs.getInt(key, default).coerceIn(min, max)
        val heading = label("$title: $value$unit")
        box.addView(heading)
        box.addView(SeekBar(this).apply {
            this.max = max - min
            progress = value - min
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(bar: SeekBar?, p: Int, fromUser: Boolean) {
                    heading.text = "$title: ${p + min}$unit"
                    if (fromUser) prefs.edit().putInt(key, p + min).apply()
                }
                override fun onStartTrackingTouch(bar: SeekBar?) {}
                override fun onStopTrackingTouch(bar: SeekBar?) {}
            })
        })
        return box
    }

    private fun choice(title: String, key: String, options: List<String>, current: Int, save: (Int) -> Unit): View {
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        box.addView(label(title))
        box.addView(Spinner(this).apply {
            adapter = ArrayAdapter(context, android.R.layout.simple_spinner_dropdown_item, options)
            setSelection(current)
            onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, v: View?, pos: Int, id: Long) = save(pos)
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
        })
        return box
    }

    /** A text box that saves as you type. */
    private fun field(title: String, key: String, hint: String, secret: Boolean = false, note: String? = null): View {
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        box.addView(label(title))
        box.addView(EditText(this).apply {
            this.hint = hint
            setText(prefs.getString(key, ""))
            setSingleLine()
            inputType = InputType.TYPE_CLASS_TEXT or
                if (secret) InputType.TYPE_TEXT_VARIATION_PASSWORD else InputType.TYPE_TEXT_VARIATION_URI
            addTextChangedListener(object : android.text.TextWatcher {
                override fun afterTextChanged(s: android.text.Editable?) {
                    prefs.edit().putString(key, s?.toString()?.trim().orEmpty()).apply()
                }
                override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
                override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            })
        })
        if (note != null) box.addView(TextView(this).apply { text = note; textSize = 12f })
        return box
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pad = (20 * d).toInt()

        val themeNames = Themes.names
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(pad, pad, pad, pad)

            addView(label("AkAI Native Keyboard", 22f))
            addView(label("Drawn natively for speed: letters are typed the moment you touch a key."))
            addView(Button(context).apply {
                text = "1. Turn the keyboard on"
                setOnClickListener { startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)) }
            })
            addView(Button(context).apply {
                text = "2. Choose it as your keyboard"
                setOnClickListener {
                    (getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager).showInputMethodPicker()
                }
            })

            addView(label("Look and size", 18f))
            addView(choice("Theme", Prefs.THEME, themeNames.map { Themes.label(it) },
                themeNames.indexOf(prefs.getString(Prefs.THEME, "system")).coerceAtLeast(0)) {
                prefs.edit().putString(Prefs.THEME, themeNames[it]).apply()
            })
            addView(slider("Key height", Prefs.HEIGHT, 70, 140, 100, "%"))
            addView(choice("One-handed mode", Prefs.ONE_HAND, listOf("Off", "Left hand", "Right hand"),
                prefs.getInt(Prefs.ONE_HAND, 0)) { prefs.edit().putInt(Prefs.ONE_HAND, it).apply() })
            addView(toggle("Number row above the letters", Prefs.NUMBER_ROW, false))
            addView(toggle("Show corner hints on letters", Prefs.HINTS, true))

            addView(label("Layouts", 18f))
            val englishLayouts = listOf("qwerty", "dvorak", "azerty", "colemak", "qwertz")
            addView(choice("English layout", Prefs.ENGLISH_LAYOUT, englishLayouts.map { it.uppercase() },
                englishLayouts.indexOf(prefs.getString(Prefs.ENGLISH_LAYOUT, "qwerty")).coerceAtLeast(0)) {
                prefs.edit().putString(Prefs.ENGLISH_LAYOUT, englishLayouts[it]).apply()
            })
            val amharicLayouts = listOf("traditional", "frequency")
            addView(choice("Amharic letter order", Prefs.AMHARIC_LAYOUT,
                listOf("Traditional (ሀ ለ ሐ መ …)", "Most-used letters first"),
                amharicLayouts.indexOf(prefs.getString(Prefs.AMHARIC_LAYOUT, "traditional")).coerceAtLeast(0)) {
                prefs.edit().putString(Prefs.AMHARIC_LAYOUT, amharicLayouts[it]).apply()
            })

            addView(label("Typing", 18f))
            addView(toggle("Word suggestions", Prefs.SUGGEST, true))
            addView(toggle("Learn the words I type", Prefs.LEARN, true))
            addView(Button(context).apply {
                text = "Forget learned words"
                setOnClickListener {
                    prefs.edit().remove(Prefs.LEARNED).apply()
                    android.widget.Toast.makeText(context, "Learned words cleared", android.widget.Toast.LENGTH_SHORT).show()
                }
            })
            addView(toggle("Hold backspace to delete the sentence", Prefs.HOLD_CLEAR, false))
            addView(slider("Hold time", Prefs.HOLD_CLEAR_MS, 300, 2000, 800, " ms"))
            addView(choice("Emoji skin tone", Prefs.SKIN_TONE,
                listOf("Default", "Light", "Medium-light", "Medium", "Medium-dark", "Dark"),
                prefs.getInt(Prefs.SKIN_TONE, 0)) { prefs.edit().putInt(Prefs.SKIN_TONE, it).apply() })

            addView(label("GIFs, handwriting and translation", 18f))
            addView(field("Giphy API key", Prefs.GIPHY_KEY, "Paste your key", secret = true,
                note = "Free at developers.giphy.com. Kept on this phone only. Leave blank to use the built-in GIFs."))
            addView(field("AkAI server address", Prefs.SERVER_URL, "https://your-site.example",
                note = "Handwriting and translation run on the AkAI web server. Leave blank to turn them off."))

            addView(label("Feedback", 18f))
            addView(slider("Vibration strength (0 is off)", Prefs.HAPTIC, 0, 5, 3, ""))
            addView(toggle("Click sound", Prefs.SOUND, false))

            addView(label("Try it here", 18f))
            addView(GifTestField(context))
            addView(EditText(context).apply { hint = "Text" })
            addView(EditText(context).apply { hint = "Phone number"; inputType = InputType.TYPE_CLASS_PHONE })
            addView(EditText(context).apply { hint = "Number"; inputType = InputType.TYPE_CLASS_NUMBER })
            addView(EditText(context).apply {
                hint = "Email"
                inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            })
        }
        setContentView(ScrollView(this).apply { addView(root) })
    }
}
