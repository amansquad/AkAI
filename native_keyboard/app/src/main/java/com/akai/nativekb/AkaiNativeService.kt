package com.akai.nativekb

import android.content.Context
import android.inputmethodservice.InputMethodService
import android.media.AudioManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.text.InputType
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.FrameLayout
import androidx.core.view.WindowCompat

enum class FieldKind { TEXT, NUMBER, PHONE, DATETIME, EMAIL, URL, PASSWORD, NONE }

class AkaiNativeService : InputMethodService(), KeyListener {

    private lateinit var keys: KeyboardView
    private lateinit var container: FrameLayout

    private var amharic = false
    private var symbols = false
    private var padDismissed = false
    private var field = FieldKind.TEXT
    private var info: EditorInfo? = null

    private var lastSpaceAt = 0L
    private var lastShiftAt = 0L

    private var vibrate = true
    private var sound = false
    private var vibrator: Vibrator? = null
    private var audio: AudioManager? = null

    override fun onCreateInputView(): View {
        // targetSdk 36 is edge-to-edge by default, which clips this window's
        // frame unless it opts out and manages its own insets.
        window?.window?.let { WindowCompat.setDecorFitsSystemWindows(it, true) }

        keys = KeyboardView(this).also { it.listener = this }
        container = FrameLayout(this).apply {
            addView(keys, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT))
            // Lift the keys clear of the system navigation bar.
            setPadding(0, 0, 0, navigationBarHeightPx())
        }
        loadPrefs()
        refreshLayout()
        return container
    }

    private fun navigationBarHeightPx(): Int {
        val density = resources.displayMetrics.density
        val id = resources.getIdentifier("navigation_bar_height", "dimen", "android")
        val px = if (id > 0) resources.getDimensionPixelSize(id) else 0
        return maxOf(px, (24 * density).toInt())
    }

    private fun loadPrefs() {
        val p = getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
        vibrate = p.getBoolean(Prefs.VIBRATE, true)
        sound = p.getBoolean(Prefs.SOUND, false)
        amharic = p.getBoolean(Prefs.AMHARIC, false)
    }

    override fun onStartInputView(editor: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(editor, restarting)
        info = editor
        field = classify(editor)
        padDismissed = false
        loadPrefs()
        refreshLayout()
        updateAutoCaps()
    }

    private fun classify(e: EditorInfo?): FieldKind {
        val type = e?.inputType ?: return FieldKind.TEXT
        return when (type and InputType.TYPE_MASK_CLASS) {
            InputType.TYPE_CLASS_NUMBER -> FieldKind.NUMBER
            InputType.TYPE_CLASS_PHONE -> FieldKind.PHONE
            InputType.TYPE_CLASS_DATETIME -> FieldKind.DATETIME
            InputType.TYPE_CLASS_TEXT -> when (type and InputType.TYPE_MASK_VARIATION) {
                InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS,
                InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS -> FieldKind.EMAIL
                InputType.TYPE_TEXT_VARIATION_URI -> FieldKind.URL
                InputType.TYPE_TEXT_VARIATION_PASSWORD,
                InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD,
                InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD -> FieldKind.PASSWORD
                else -> FieldKind.TEXT
            }
            else -> if (type == InputType.TYPE_NULL) FieldKind.NONE else FieldKind.TEXT
        }
    }

    /** Email, address and password fields never want Amharic or auto-capitals. */
    private val plainField get() = field == FieldKind.EMAIL || field == FieldKind.URL || field == FieldKind.PASSWORD

    private fun refreshLayout() {
        if (!::keys.isInitialized) return
        val digits = field == FieldKind.NUMBER || field == FieldKind.PHONE || field == FieldKind.DATETIME
        val showAmharic = amharic && !plainField && !digits
        val id = when {
            digits && !padDismissed -> when (field) {
                FieldKind.PHONE -> LayoutId.PHONE
                FieldKind.DATETIME -> LayoutId.DATETIME
                else -> LayoutId.NUMBER
            }
            symbols -> LayoutId.SYMBOLS
            showAmharic -> LayoutId.FIDEL
            else -> LayoutId.LETTERS
        }
        keys.setLayout(Layouts.build(id, showAmharic, enterLabel()))
    }

    private fun enterLabel(): String {
        val opts = info?.imeOptions ?: 0
        if ((opts and EditorInfo.IME_FLAG_NO_ENTER_ACTION) != 0) return "↵"
        return when (opts and EditorInfo.IME_MASK_ACTION) {
            EditorInfo.IME_ACTION_GO -> "Go"
            EditorInfo.IME_ACTION_SEARCH -> "Search"
            EditorInfo.IME_ACTION_SEND -> "Send"
            EditorInfo.IME_ACTION_NEXT -> "Next"
            EditorInfo.IME_ACTION_DONE -> "Done"
            else -> "↵"
        }
    }

    /** Capital at the start of a sentence, as the field asks for. */
    private fun updateAutoCaps() {
        if (!::keys.isInitialized || plainField) return
        if (keys.shiftState == 2) return // caps lock stays
        val ic = currentInputConnection
        val e = info
        val caps = if (ic != null && e != null && e.inputType != InputType.TYPE_NULL) {
            ic.getCursorCapsMode(e.inputType) != 0
        } else false
        keys.shiftState = if (caps) 1 else 0
    }

    // ─── Keys ────────────────────────────────────────────────────────────

    override fun onText(text: String) {
        currentInputConnection?.commitText(text, 1)
        if (keys.shiftState == 1) keys.shiftState = 0
        // Asking the app about the cursor costs a round trip, so only do it
        // where a new sentence could have started.
        if (text == "." || text == "!" || text == "?" || text == "።") updateAutoCaps()
    }

    override fun onReplaceLast(text: String) {
        val ic = currentInputConnection ?: return
        ic.deleteSurroundingTextInCodePoints(1, 0)
        ic.commitText(text, 1)
        onKeyFeedback()
    }

    override fun onBackspace() {
        val ic = currentInputConnection ?: return
        if (!ic.getSelectedText(0).isNullOrEmpty()) ic.commitText("", 1)
        else ic.deleteSurroundingTextInCodePoints(1, 0)
    }

    override fun onSpace() {
        val ic = currentInputConnection ?: return
        val now = System.currentTimeMillis()
        // Two quick spaces after a word make ". ".
        if (now - lastSpaceAt < 350 && !plainField) {
            val before = ic.getTextBeforeCursor(2, 0)
            if (before != null && before.length == 2 && before[1] == ' ' &&
                !before[0].isWhitespace() && before[0] != '.') {
                ic.deleteSurroundingText(1, 0)
                ic.commitText(". ", 1)
                lastSpaceAt = 0L
                updateAutoCaps()
                return
            }
        }
        ic.commitText(" ", 1)
        lastSpaceAt = now
    }

    override fun onEnter() {
        val e = info
        val opts = e?.imeOptions ?: 0
        val action = opts and EditorInfo.IME_MASK_ACTION
        if ((opts and EditorInfo.IME_FLAG_NO_ENTER_ACTION) == 0 &&
            action != EditorInfo.IME_ACTION_NONE && action != EditorInfo.IME_ACTION_UNSPECIFIED) {
            currentInputConnection?.performEditorAction(action)
        } else {
            sendDownUpKeyEvents(KeyEvent.KEYCODE_ENTER)
            updateAutoCaps()
        }
    }

    override fun onShift() {
        val now = System.currentTimeMillis()
        keys.shiftState = when {
            now - lastShiftAt < 350 -> 2 // double tap: caps lock
            keys.shiftState == 0 -> 1
            else -> 0
        }
        lastShiftAt = now
    }

    override fun onSymbols() {
        symbols = !symbols
        refreshLayout()
    }

    override fun onLanguage() {
        amharic = !amharic
        symbols = false
        getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).edit().putBoolean(Prefs.AMHARIC, amharic).apply()
        keys.shiftState = 0
        refreshLayout()
        if (!amharic) updateAutoCaps()
    }

    override fun onPadAbc() {
        padDismissed = true
        refreshLayout()
        updateAutoCaps()
    }

    override fun onCursorMove(delta: Int) {
        sendDownUpKeyEvents(if (delta < 0) KeyEvent.KEYCODE_DPAD_LEFT else KeyEvent.KEYCODE_DPAD_RIGHT)
        onKeyFeedback()
    }

    override fun onKeyFeedback() {
        if (vibrate) {
            val v = vibrator ?: systemVibrator().also { vibrator = it }
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(12, if (v.hasAmplitudeControl()) 90 else VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION") v.vibrate(12)
                }
            }
        }
        if (sound) {
            val a = audio ?: (getSystemService(Context.AUDIO_SERVICE) as AudioManager).also { audio = it }
            a.playSoundEffect(AudioManager.FX_KEYPRESS_STANDARD, -1f)
        }
    }

    private fun systemVibrator(): Vibrator? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION") getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
}

object Prefs {
    const val NAME = "akai_native"
    const val VIBRATE = "vibrate"
    const val SOUND = "sound"
    const val AMHARIC = "amharic"
}
