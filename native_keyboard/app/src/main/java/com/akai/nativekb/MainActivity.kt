package com.akai.nativekb

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Switch
import android.widget.TextView

/** Set-up screen: turn the keyboard on, pick it, adjust feedback, and try it. */
class MainActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val d = resources.displayMetrics.density
        val pad = (20 * d).toInt()
        val prefs = getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)

        fun label(text: String, size: Float = 15f) = TextView(this).apply {
            this.text = text
            textSize = size
            setPadding(0, (8 * d).toInt(), 0, (4 * d).toInt())
        }

        fun toggle(title: String, key: String, default: Boolean) = Switch(this).apply {
            text = title
            isChecked = prefs.getBoolean(key, default)
            setOnCheckedChangeListener { _, on -> prefs.edit().putBoolean(key, on).apply() }
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(pad, pad, pad, pad)
            addView(label("AkAI Native Keyboard", 22f))
            addView(label("A keyboard drawn natively for speed: letters are typed the moment you touch a key."))
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
            addView(toggle("Vibrate on key press", Prefs.VIBRATE, true))
            addView(toggle("Click sound", Prefs.SOUND, false))
            addView(label("Try it here:"))
            addView(EditText(context).apply { hint = "Text" })
            addView(EditText(context).apply {
                hint = "Phone number"
                inputType = android.text.InputType.TYPE_CLASS_PHONE
            })
            addView(EditText(context).apply {
                hint = "Number"
                inputType = android.text.InputType.TYPE_CLASS_NUMBER
            })
            addView(EditText(context).apply {
                hint = "Email"
                inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            })
        }
        setContentView(root)
    }
}
