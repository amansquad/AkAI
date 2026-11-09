package com.akai.nativekb

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.inputmethodservice.InputMethodService
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.text.InputType
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.FrameLayout
import android.widget.Toast
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.inputmethod.EditorInfoCompat
import androidx.core.view.inputmethod.InputConnectionCompat
import androidx.core.view.inputmethod.InputContentInfoCompat
import kotlin.math.abs

enum class FieldKind { TEXT, NUMBER, PHONE, DATETIME, EMAIL, URL, PASSWORD, NONE }

class AkaiNativeService : InputMethodService(), KeyListener, PanelHost {
    // (Prefs keys live in the Prefs object below.)

    private lateinit var keys: KeyboardView
    private lateinit var panel: PanelView
    private lateinit var container: FrameLayout
    private val handler = Handler(Looper.getMainLooper())

    // ─── State ───────────────────────────────────────────────────────────
    private var amharic = false
    private var phonetic = false
    private var symbols = false
    private var padDismissed = false
    private var field = FieldKind.TEXT
    private var info: EditorInfo? = null
    private var layoutId = LayoutId.LETTERS
    private var translit = Translit.EMPTY

    private var lastSpaceAt = 0L
    private var lastShiftAt = 0L

    // ─── Settings (see MainActivity) ─────────────────────────────────────
    private var hapticLevel = 3 // 0 is off
    private var sound = false
    private var theme = "system"
    private var heightPercent = 100
    private var oneHand = 0
    private var hints = true
    private var numberRow = false
    private var suggestOn = true
    private var autoCap = true
    private var doubleSpace = true
    private var pressAnim = true
    private var longPress = true
    private var learnOn = true
    private var englishLayout = "qwerty"
    private var amharicLayout = "traditional"
    private var holdClear = false
    private var holdClearMs = 800
    private var skinTone = 0
    private var serverUrl = ""
    private var giphyKey = ""

    private var vibrator: Vibrator? = null
    private var audio: AudioManager? = null

    private var recents: List<String> = emptyList()
    /** Clipboard history, newest first. Memory only: copied text is never written to disk. */
    private val clips = ArrayList<String>()
    /** Items the user pinned. These are saved, because pinning them is a deliberate choice. */
    private val pinned = LinkedHashSet<String>()
    /** Words the user has typed, with how often. */
    private val learned = HashMap<String, Int>()
    private var learnedDirty = 0
    private var clipboard: ClipboardManager? = null
    private val clipListener = ClipboardManager.OnPrimaryClipChangedListener { readClipboard() }

    override fun onCreate() {
        super.onCreate()
        VoiceBridge.onResult = { spoken ->
            currentInputConnection?.commitText(spoken, 1)
            translit = Translit.EMPTY
        }
        clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        clipboard?.addPrimaryClipChangedListener(clipListener)
    }

    override fun onDestroy() {
        super.onDestroy()
        VoiceBridge.onResult = null
        clipboard?.removePrimaryClipChangedListener(clipListener)
        handler.removeCallbacksAndMessages(null)
    }

    override fun onCreateInputView(): View {
        // targetSdk 36 is edge-to-edge by default, which clips this window's
        // frame unless it opts out and manages its own insets.
        window?.window?.let { WindowCompat.setDecorFitsSystemWindows(it, true) }

        keys = KeyboardView(this).also { it.listener = this }
        panel = PanelView(this).also { it.host = this; it.visibility = View.GONE }
        container = FrameLayout(this).apply {
            addView(keys, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT))
            addView(panel, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT))
            // Leave room only for what the system really draws over the keyboard.
            // Adding the full navigation-bar height blindly left a dead band on
            // phones whose navigation bar already sits below the keyboard.
            val minGap = (8 * resources.displayMetrics.density).toInt()
            setPadding(0, 0, 0, minGap)
            ViewCompat.setOnApplyWindowInsetsListener(this) { v, insets ->
                val bottom = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom
                v.setPadding(0, 0, 0, maxOf(bottom, minGap))
                insets
            }
        }
        loadPrefs()
        refreshLayout()
        return container
    }

    private fun loadPrefs() {
        val p = getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
        hapticLevel = p.getInt(Prefs.HAPTIC, 3)
        sound = p.getBoolean(Prefs.SOUND, false)
        amharic = p.getBoolean(Prefs.AMHARIC, false)
        phonetic = p.getBoolean(Prefs.PHONETIC, false)
        theme = p.getString(Prefs.THEME, "system") ?: "system"
        heightPercent = p.getInt(Prefs.HEIGHT, 100)
        oneHand = p.getInt(Prefs.ONE_HAND, 0)
        hints = p.getBoolean(Prefs.HINTS, true)
        numberRow = p.getBoolean(Prefs.NUMBER_ROW, false)
        suggestOn = p.getBoolean(Prefs.SUGGEST, true)
        recents = (p.getString(Prefs.RECENTS, "") ?: "").split(' ').filter { it.isNotEmpty() }
        learnOn = p.getBoolean(Prefs.LEARN, true)
        autoCap = p.getBoolean(Prefs.AUTOCAP, true)
        doubleSpace = p.getBoolean(Prefs.DOUBLE_SPACE, true)
        pressAnim = p.getBoolean(Prefs.PRESS_ANIM, true)
        longPress = p.getBoolean(Prefs.LONG_PRESS, true)
        englishLayout = p.getString(Prefs.ENGLISH_LAYOUT, "qwerty") ?: "qwerty"
        amharicLayout = p.getString(Prefs.AMHARIC_LAYOUT, "traditional") ?: "traditional"
        holdClear = p.getBoolean(Prefs.HOLD_CLEAR, false)
        holdClearMs = p.getInt(Prefs.HOLD_CLEAR_MS, 800)
        skinTone = p.getInt(Prefs.SKIN_TONE, 0)
        serverUrl = p.getString(Prefs.SERVER_URL, "") ?: ""
        giphyKey = p.getString(Prefs.GIPHY_KEY, "") ?: ""
        if (pinned.isEmpty()) {
            try {
                val a = org.json.JSONArray(p.getString(Prefs.PINNED, "[]"))
                for (i in 0 until a.length()) pinned.add(a.getString(i))
            } catch (e: Exception) { /* a bad value just means nothing is pinned */ }
        }
        if (learned.isEmpty()) {
            (p.getString(Prefs.LEARNED, "") ?: "").split('\n').forEach { line ->
                val i = line.lastIndexOf('\t')
                if (i > 0) line.substring(i + 1).toIntOrNull()?.let { learned[line.substring(0, i)] = it }
            }
        }
        if (::keys.isInitialized) {
            keys.holdClearMs = if (holdClear) holdClearMs.toLong() else 0L
            panel.serverUrl = serverUrl
            panel.giphyKey = giphyKey
            panel.skinTone = skinTone
            panel.themeId = Themes.find(theme).id
            keys.applySettings(theme, heightPercent, hints, oneHand, pressAnim, longPress)
            panel.applyTheme(theme)
            container.setBackgroundColor(Themes.palette(this, theme).background)
        }
    }

    private fun savePref(block: android.content.SharedPreferences.Editor.() -> Unit) {
        getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).edit().apply(block).apply()
    }

    override fun onStartInputView(editor: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(editor, restarting)
        info = editor
        field = classify(editor)
        padDismissed = false
        symbols = false
        translit = Translit.EMPTY
        closePanel()
        loadPrefs()
        refreshLayout()
        updateAutoCaps()
    }

    /** The app moved the cursor (a tap, or its own edit): drop any half-typed phonetic word. */
    override fun onUpdateSelection(
        oldSelStart: Int, oldSelEnd: Int, newSelStart: Int, newSelEnd: Int,
        candidatesStart: Int, candidatesEnd: Int,
    ) {
        super.onUpdateSelection(oldSelStart, oldSelEnd, newSelStart, newSelEnd, candidatesStart, candidatesEnd)
        if (translit.buffer.isNotEmpty() && (newSelStart != newSelEnd || abs(newSelStart - oldSelStart) > 4)) {
            translit = Translit.EMPTY
        }
        scheduleSuggestions()
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

    /** Email, address and password fields never want Amharic, auto-capitals or suggestions. */
    private val plainField get() = field == FieldKind.EMAIL || field == FieldKind.URL || field == FieldKind.PASSWORD
    private val digitField get() = field == FieldKind.NUMBER || field == FieldKind.PHONE || field == FieldKind.DATETIME

    private fun refreshLayout() {
        if (!::keys.isInitialized) return
        val showAmharic = amharic && !plainField && !digitField
        val id = when {
            digitField && !padDismissed -> when (field) {
                FieldKind.PHONE -> LayoutId.PHONE
                FieldKind.DATETIME -> LayoutId.DATETIME
                else -> LayoutId.NUMBER
            }
            symbols -> LayoutId.SYMBOLS
            showAmharic -> if (phonetic) LayoutId.PHONETIC else LayoutId.FIDEL
            else -> LayoutId.LETTERS
        }
        layoutId = id
        val options = LayoutOptions(
            enterLabel(), numberRow, backToPad = digitField && padDismissed,
            englishLayout = englishLayout, amharicLayout = amharicLayout,
        )
        val layout = Layouts.build(id, showAmharic, options)
        keys.setVowels(emptyList())
        keys.setLayout(layout, strip = !layout.isPad)
        scheduleSuggestions()
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
        if (!::keys.isInitialized || plainField || !autoCap) return
        if (keys.shiftState == 2) return // caps lock stays
        // Capitals mean something in phonetic typing (T is ጠ), so never add them.
        if (amharic) { keys.shiftState = 0; return }
        val ic = currentInputConnection
        val e = info
        val caps = if (ic != null && e != null && e.inputType != InputType.TYPE_NULL) {
            ic.getCursorCapsMode(e.inputType) != 0
        } else false
        keys.shiftState = if (caps) 1 else 0
    }

    // ─── Suggestions ─────────────────────────────────────────────────────

    private val suggestTask = Runnable {
        if (!suggestOn || plainField || digitField && !padDismissed) {
            keys.setSuggestions(emptyList())
            return@Runnable
        }
        val before = currentInputConnection?.getTextBeforeCursor(40, 0)
        keys.setSuggestions(
            if (before == null) emptyList() else Suggest.forText(before, amharic, if (learnOn) learned else emptyMap()),
        )
    }

    /** Remembers the word just finished, so it can be suggested next time. */
    private fun learnWordBefore() {
        if (!learnOn || plainField || digitField) return
        val before = currentInputConnection?.getTextBeforeCursor(40, 0) ?: return
        val n = Suggest.currentWordLength(before)
        if (n < 2) return
        val word = before.substring(before.length - n).trim { !it.isLetter() }
        if (word.length < 2 || !word.all { it.isLetter() }) return
        val key = word.lowercase()
        learned[key] = (learned[key] ?: 0) + 1
        if (learned.size > 3000) {
            // Forget the least-used words rather than growing without end.
            learned.entries.sortedBy { it.value }.take(500).forEach { learned.remove(it.key) }
        }
        if (++learnedDirty >= 20) saveLearned()
    }

    private fun saveLearned() {
        learnedDirty = 0
        savePref { putString(Prefs.LEARNED, learned.entries.joinToString("\n") { "${it.key}\t${it.value}" }) }
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        super.onFinishInputView(finishingInput)
        if (learnedDirty > 0) saveLearned()
    }

    override fun onClearSentence() {
        val ic = currentInputConnection ?: return
        val before = ic.getTextBeforeCursor(500, 0)?.toString() ?: return
        var i = before.length
        while (i > 0 && before[i - 1].isWhitespace()) i--
        var j = i
        while (j > 0 && before[j - 1] !in ".!?።፧\n") j--
        if (before.length - j > 0) ic.deleteSurroundingText(before.length - j, 0)
        translit = Translit.EMPTY
        keys.setVowels(emptyList())
    }

    /** Debounced, so working out suggestions never competes with a keystroke. */
    private fun scheduleSuggestions() {
        handler.removeCallbacks(suggestTask)
        handler.postDelayed(suggestTask, 90)
    }

    override fun onSuggestion(word: String) {
        val ic = currentInputConnection ?: return
        val before = ic.getTextBeforeCursor(40, 0) ?: ""
        val n = Suggest.currentWordLength(before)
        val capitalised = n > 0 && before[before.length - n].isUpperCase() && !amharic
        val out = if (capitalised) word.replaceFirstChar { it.uppercase() } else word
        ic.beginBatchEdit()
        if (n > 0) ic.deleteSurroundingText(n, 0)
        ic.commitText("$out ", 1)
        ic.endBatchEdit()
        translit = Translit.EMPTY
        keys.setVowels(emptyList())
    }

    // ─── Keys ────────────────────────────────────────────────────────────

    private val phoneticActive get() = layoutId == LayoutId.PHONETIC

    override fun onText(text: String) {
        val ic = currentInputConnection ?: return
        if (phoneticActive && text.length == 1) {
            applyTranslit(Translit.press(translit, text[0]))
        } else {
            ic.commitText(text, 1)
            translit = Translit.EMPTY
        }
        if (keys.shiftState == 1) keys.shiftState = 0

        if (layoutId == LayoutId.FIDEL) {
            keys.setVowels(KeyboardData.amharicVowels[text].orEmpty())
        }
        // Asking the app about the cursor costs a round trip, so only do it
        // where a new sentence could have started.
        if (text == "." || text == "!" || text == "?" || text == "።") updateAutoCaps()
    }

    private fun applyTranslit(step: Translit.Step) {
        val ic = currentInputConnection ?: return
        ic.beginBatchEdit()
        if (step.replaceLast > 0) ic.deleteSurroundingText(step.replaceLast, 0)
        if (step.insert.isNotEmpty()) ic.commitText(step.insert, 1)
        ic.endBatchEdit()
        translit = step.next
    }

    override fun onVowel(vowel: String) = replaceLast(vowel)

    override fun onReplaceLast(text: String) {
        replaceLast(text)
        // Keep the vowel row in step with the consonant the bubble came from.
        val family = KeyboardData.amharicVowels.values.firstOrNull { text in it }
        if (layoutId == LayoutId.FIDEL && family != null) keys.setVowels(family)
        onKeyFeedback()
    }

    private fun replaceLast(text: String) {
        val ic = currentInputConnection ?: return
        ic.beginBatchEdit()
        ic.deleteSurroundingTextInCodePoints(1, 0)
        ic.commitText(text, 1)
        ic.endBatchEdit()
        translit = Translit.EMPTY
    }

    override fun onBackspace() {
        val ic = currentInputConnection ?: return
        if (phoneticActive) {
            val step = Translit.backspace(translit)
            if (step != null) { applyTranslit(step); return }
        }
        keys.setVowels(emptyList())
        if (!ic.getSelectedText(0).isNullOrEmpty()) ic.commitText("", 1)
        else ic.deleteSurroundingTextInCodePoints(1, 0)
    }

    override fun onSpace() {
        val ic = currentInputConnection ?: return
        learnWordBefore()
        translit = Translit.EMPTY
        keys.setVowels(emptyList())
        val now = System.currentTimeMillis()
        // Two quick spaces after a word make ". ".
        if (doubleSpace && now - lastSpaceAt < 350 && !plainField) {
            val before = ic.getTextBeforeCursor(2, 0)
            if (before != null && before.length == 2 && before[1] == ' ' &&
                !before[0].isWhitespace() && before[0] != '.') {
                ic.deleteSurroundingText(1, 0)
                ic.commitText(if (amharic) "። " else ". ", 1)
                lastSpaceAt = 0L
                updateAutoCaps()
                return
            }
        }
        ic.commitText(" ", 1)
        lastSpaceAt = now
        updateAutoCaps()
    }

    override fun onEnter() {
        learnWordBefore()
        translit = Translit.EMPTY
        keys.setVowels(emptyList())
        val opts = info?.imeOptions ?: 0
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
        translit = Translit.EMPTY
        refreshLayout()
    }

    override fun onLanguage() {
        amharic = !amharic
        symbols = false
        translit = Translit.EMPTY
        savePref { putBoolean(Prefs.AMHARIC, amharic) }
        keys.shiftState = 0
        refreshLayout()
        if (!amharic) updateAutoCaps()
    }

    override fun onPhonetic() {
        phonetic = !phonetic
        translit = Translit.EMPTY
        savePref { putBoolean(Prefs.PHONETIC, phonetic) }
        refreshLayout()
    }

    override fun onPadAbc() {
        padDismissed = !padDismissed
        refreshLayout()
        updateAutoCaps()
    }

    override fun onCursorMove(delta: Int) {
        translit = Translit.EMPTY
        sendDownUpKeyEvents(if (delta < 0) KeyEvent.KEYCODE_DPAD_LEFT else KeyEvent.KEYCODE_DPAD_RIGHT)
        onKeyFeedback()
    }

    // ─── Toolbar, panels, clipboard, voice ───────────────────────────────

    override fun onToolbar(action: Int) {
        when (action) {
            TOOL_EMOJI -> showPanel(PanelView.Tab.EMOJI)
            TOOL_VOICE -> {
                val tag = if (amharic) "am-ET" else "en-US"
                startActivity(
                    Intent(this, VoiceActivity::class.java)
                        .putExtra(VoiceActivity.EXTRA_LANGUAGE, tag)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION),
                )
            }
            TOOL_SETTINGS -> {
                startActivity(Intent(this, SettingsActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                requestHideSelf(0)
            }
        }
    }

    private fun showPanel(tab: PanelView.Tab) {
        readClipboard()
        val h = if (keys.height > 0) keys.height else keys.measuredHeight
        panel.layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, h)
        panel.open(tab, recents, clipList())
        panel.visibility = View.VISIBLE
        keys.visibility = View.INVISIBLE
    }

    private fun closePanel() {
        if (!::panel.isInitialized || panel.visibility != View.VISIBLE) return
        panel.visibility = View.GONE
        keys.visibility = View.VISIBLE
    }

    override fun onPanelClose() = closePanel()

    override fun onPanelText(text: String, isEmoji: Boolean) {
        val ic = currentInputConnection ?: return
        translit = Translit.EMPTY
        if (text == "\b") {
            ic.deleteSurroundingTextInCodePoints(1, 0)
            onKeyFeedback()
            return
        }
        ic.commitText(text, 1)
        if (isEmoji) {
            recents = (listOf(text) + recents.filter { it != text }).take(24)
            savePref { putString(Prefs.RECENTS, recents.joinToString(" ")) }
        }
        onKeyFeedback()
    }

    private fun clipList(): List<Clip> =
        pinned.map { Clip(it, true) } + clips.filter { it !in pinned }.map { Clip(it, false) }

    /** Clears the history; pinned items stay, because pinning them was deliberate. */
    override fun onPanelClearClipboard() {
        clips.clear()
        panel.setClips(clipList())
    }

    override fun onPanelTogglePin(text: String) {
        if (!pinned.remove(text)) pinned.add(text)
        savePref { putString(Prefs.PINNED, org.json.JSONArray(pinned.toList()).toString()) }
        panel.setClips(clipList())
        onKeyFeedback()
    }

    override fun panelTextBefore(): String =
        currentInputConnection?.getTextBeforeCursor(300, 0)?.toString().orEmpty()

    override fun onPanelReplace(oldLength: Int, newText: String) {
        val ic = currentInputConnection ?: return
        translit = Translit.EMPTY
        ic.beginBatchEdit()
        if (oldLength > 0) ic.deleteSurroundingText(oldLength, 0)
        ic.commitText(newText, 1)
        ic.endBatchEdit()
        onKeyFeedback()
    }

    override fun panelAmharic() = amharic

    /** A theme was picked in the keyboard's Themes tab: save it and recolour right away. */
    override fun onPanelTheme(id: String) {
        savePref { putString(Prefs.THEME, id) }
        theme = id
        keys.applySettings(theme, heightPercent, hints, oneHand, pressAnim, longPress)
        panel.applyTheme(theme)
        panel.themeId = id
        container.setBackgroundColor(Themes.palette(this, theme).background)
        onKeyFeedback()
    }

    override fun panelClips(): List<Clip> {
        readClipboard()
        return clipList()
    }

    /**
     * Sends a GIF as an image where the app accepts one, and as a link where it
     * does not (a plain text box has nowhere to put an image).
     */
    override fun onPanelGif(item: GifItem) {
        val ic = currentInputConnection ?: return
        val editor = info ?: return
        val accepts = EditorInfoCompat.getContentMimeTypes(editor).any { it == "image/gif" || it == "image/*" }
        if (!accepts) {
            ic.commitText(item.fullUrl, 1)
            Toast.makeText(this, "This field can't take images, so the link was typed", Toast.LENGTH_SHORT).show()
            return
        }
        Gifs.fetch(this, item) { uri ->
            val live = currentInputConnection
            if (uri == null || live == null) {
                Toast.makeText(this, "Couldn't download that GIF", Toast.LENGTH_SHORT).show()
                return@fetch
            }
            val flags = if (Build.VERSION.SDK_INT >= 25) InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION else 0
            val sent = InputConnectionCompat.commitContent(
                live, editor, InputContentInfoCompat(uri, Gifs.mime, Uri.parse(item.fullUrl)), flags, null,
            )
            if (!sent) live.commitText(item.fullUrl, 1)
        }
    }

    private fun readClipboard() {
        val clip: ClipData = try { clipboard?.primaryClip } catch (e: Exception) { null } ?: return
        if (clip.itemCount == 0) return
        // Never keep what the source marked sensitive, such as a copied password.
        if (clip.description?.extras?.getBoolean("android.content.extra.IS_SENSITIVE") == true) return
        val value = clip.getItemAt(0).coerceToText(this)?.toString()?.trim().orEmpty()
        if (value.isEmpty()) return
        clips.remove(value)
        clips.add(0, value)
        while (clips.size > 20) clips.removeAt(clips.size - 1)
        if (::panel.isInitialized && panel.visibility == View.VISIBLE && panel.tab == PanelView.Tab.CLIPBOARD) {
            panel.setClips(clipList())
        }
    }

    // ─── Feedback ────────────────────────────────────────────────────────

    override fun onKeyFeedback() {
        if (hapticLevel > 0) {
            val v = vibrator ?: systemVibrator().also { vibrator = it }
            if (v != null && v.hasVibrator()) {
                val l = hapticLevel.coerceIn(1, 5)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val amp = if (v.hasAmplitudeControl()) HAPTIC_AMPLITUDE[l] else VibrationEffect.DEFAULT_AMPLITUDE
                    v.vibrate(VibrationEffect.createOneShot(HAPTIC_MS[l], amp))
                } else {
                    @Suppress("DEPRECATION") v.vibrate(HAPTIC_MS[l])
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

    private companion object {
        val HAPTIC_MS = longArrayOf(0, 8, 12, 18, 26, 36)
        val HAPTIC_AMPLITUDE = intArrayOf(0, 40, 80, 130, 190, 255)
    }
}

object Prefs {
    const val NAME = "akai_native"
    const val HAPTIC = "haptic_level"
    const val SOUND = "sound"
    const val AMHARIC = "amharic"
    const val PHONETIC = "phonetic"
    const val THEME = "theme"
    const val HEIGHT = "height_percent"
    const val ONE_HAND = "one_hand"
    const val HINTS = "hints"
    const val NUMBER_ROW = "number_row"
    const val SUGGEST = "suggest"
    const val RECENTS = "recent_emoji"
    const val LEARN = "learn_words"
    const val LEARNED = "learned_words"
    const val PINNED = "pinned_clips"
    const val ENGLISH_LAYOUT = "english_layout"
    const val AMHARIC_LAYOUT = "amharic_layout"
    const val HOLD_CLEAR = "hold_backspace_clears"
    const val HOLD_CLEAR_MS = "hold_backspace_ms"
    const val SKIN_TONE = "skin_tone"
    /** Where handwriting and translation are sent. Blank turns those two off. */
    const val SERVER_URL = "server_url"
    /** The user's own Giphy API key. Blank uses the built-in GIF catalogue. */
    const val GIPHY_KEY = "giphy_key"
    const val ONBOARDED = "onboarded"
    const val LONG_PRESS = "long_press_popup"
    const val PRESS_ANIM = "press_animation"
    const val AUTOCAP = "auto_capitalize"
    const val DOUBLE_SPACE = "double_space_period"
}
