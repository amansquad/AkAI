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

            addView(label("Typing", 18f))
            addView(toggle("Word suggestions", Prefs.SUGGEST, true))

            addView(label("Feedback", 18f))
            addView(slider("Vibration strength (0 is off)", Prefs.HAPTIC, 0, 5, 3, ""))
            addView(toggle("Click sound", Prefs.SOUND, false))

            addView(label("Try it here", 18f))
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
