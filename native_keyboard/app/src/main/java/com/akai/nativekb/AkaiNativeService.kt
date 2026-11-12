package com.akai.nativekb

import android.content.ClipData
import android.content.ClipDescription
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
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
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
    /** On the symbols board, whether the second page (=\<) is showing. */
    private var symbolsPage2 = false
    private var padDismissed = false
    private var field = FieldKind.TEXT
    private var info: EditorInfo? = null
    private var layoutId = LayoutId.LETTERS
    private var translit = Translit.EMPTY

    private var lastSpaceAt = 0L
    private var lastShiftAt = 0L

    /** Emoji search: the query being typed into the strip, or null when not searching. */
    private var emojiQuery: String? = null
    /** Other readings of the last swipe, offered in the strip until the next key. */
    private var glideAlts: List<String> = emptyList()
    /** The last auto-correction (typed, fixed, separator), so backspace can undo it. */
    private var lastCorrection: Triple<String, String, String>? = null
    /** Words the user un-corrected; left alone from then on. */
    private val keepAsTyped = HashSet<String>()
    /** Punctuation was just typed; a space goes in before the next letter. */
    private var spaceBeforeNextLetter = false

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
    private var liveBg = true
    private var longPress = true
    private var learnOn = true
    private var englishLayout = "qwerty"
    private var amharicLayout = "traditional"
    private var holdClear = false
    private var holdClearMs = 800
    private var skinTone = 0
    private var serverUrl = ""
    private var giphyKey = ""
    private var oneHandWidth = 80
    private var longPressMs = 250
    private var keyGap = 5
    private var keyRadius = 8
    private var labelSize = 100
    private var keyWeight = 400
    private var keyBorders = false
    private var autoSpace = false
    private var soundVolume = 60
    private var cursorRow = false
    private var langKey = LangKey.SYMBOLS
    private var tools = Tools.parse(Tools.DEFAULT)
    private var wordOfDayOn = true
    private var autoCorrect = true
    private var autoCorrectAm = false
    private var glide = true

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
        Words.load(this)
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
        CustomThemes.refresh(this)
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
        liveBg = p.getBoolean(Prefs.LIVE_BG, true)
        longPress = p.getBoolean(Prefs.LONG_PRESS, true)
        englishLayout = p.getString(Prefs.ENGLISH_LAYOUT, "qwerty") ?: "qwerty"
        amharicLayout = p.getString(Prefs.AMHARIC_LAYOUT, "traditional") ?: "traditional"
        holdClear = p.getBoolean(Prefs.HOLD_CLEAR, false)
        holdClearMs = p.getInt(Prefs.HOLD_CLEAR_MS, 800)
        skinTone = p.getInt(Prefs.SKIN_TONE, 0)
        // Blank means the AkAI website, which serves /api/translate itself.
        serverUrl = (p.getString(Prefs.SERVER_URL, "") ?: "").trim().ifBlank { Net.SITE }
        giphyKey = p.getString(Prefs.GIPHY_KEY, "") ?: ""
        oneHandWidth = p.getInt(Prefs.ONE_HAND_WIDTH, 80)
        longPressMs = p.getInt(Prefs.LONG_PRESS_MS, 250)
        keyGap = p.getInt(Prefs.KEY_GAP, 5)
        keyRadius = p.getInt(Prefs.KEY_RADIUS, 8)
        labelSize = p.getInt(Prefs.LABEL_SIZE, 100)
        keyWeight = p.getInt(Prefs.KEY_WEIGHT, 400)
        keyBorders = p.getBoolean(Prefs.KEY_BORDERS, false)
        autoSpace = p.getBoolean(Prefs.AUTO_SPACE, false)
        soundVolume = p.getInt(Prefs.SOUND_VOLUME, 60)
        cursorRow = p.getBoolean(Prefs.CURSOR_ROW, false)
        langKey = LangKey.parse(p.getString(Prefs.LANG_KEY, LangKey.SYMBOLS))
        tools = Tools.parse(p.getString(Prefs.TOOLBAR, Tools.DEFAULT) ?: Tools.DEFAULT)
        wordOfDayOn = p.getBoolean(Prefs.WORD_OF_DAY, true)
        autoCorrect = p.getBoolean(Prefs.AUTOCORRECT, true)
        autoCorrectAm = p.getBoolean(Prefs.AUTOCORRECT_AM, false)
        glide = p.getBoolean(Prefs.GLIDE, true)
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
            keys.applySettings(look())
            keys.setTools(tools)
            panel.applyTheme(theme)
            container.setBackgroundColor(Themes.palette(this, theme).background)
        }
    }

    private fun look() = KeyLook(
        theme, heightPercent, hints, oneHand, oneHandWidth, pressAnim, longPress, liveBg,
        longPressMs, keyGap, keyRadius, labelSize, keyWeight, keyBorders, glide,
    )

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
        emojiQuery = null
        glideAlts = emptyList()
        lastCorrection = null
        spaceBeforeNextLetter = false
        closePanel(animate = false)
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
        val searching = emojiQuery != null
        // Emoji names are English, so searching always uses the English letters.
        val showAmharic = amharic && !plainField && !digitField && !searching
        val id = when {
            searching -> LayoutId.LETTERS
            digitField && !padDismissed -> when (field) {
                FieldKind.PHONE -> LayoutId.PHONE
                FieldKind.DATETIME -> LayoutId.DATETIME
                else -> LayoutId.NUMBER
            }
            symbols -> if (symbolsPage2) LayoutId.SYMBOLS2 else LayoutId.SYMBOLS
            showAmharic -> if (phonetic) LayoutId.PHONETIC else LayoutId.FIDEL
            else -> LayoutId.LETTERS
        }
        layoutId = id
        val options = LayoutOptions(
            enterLabel(), numberRow, backToPad = digitField && padDismissed,
            englishLayout = englishLayout, amharicLayout = amharicLayout, cursorRow = cursorRow && !searching,
            langKey = langKey,
        )
        val layout = Layouts.build(id, showAmharic, options, if (phonetic) LayoutId.PHONETIC else LayoutId.FIDEL)
        // The toolbar's language button, on the boards that have a language key.
        val letterBoard = id == LayoutId.LETTERS || id == LayoutId.PHONETIC || id == LayoutId.FIDEL
        keys.setLanguageTool(if (langKey == LangKey.TOOLBAR && letterBoard && !searching) (if (id == LayoutId.LETTERS) "አማ" else "EN") else null)
        keys.spaceSwitch = langKey == LangKey.SPACE
        keys.setVowels(emptyList())
        keys.setSearch(emojiQuery, searchResults())
        // Its own row above the toolbar, the same whether or not you have typed,
        // so the keyboard never changes height mid-sentence.
        keys.setWordOfDay(if (wordOfDayOn && !plainField && !layout.isPad) wordOfDay() else null)
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
        if (!::keys.isInitialized || plainField || !autoCap || emojiQuery != null) return
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
        if (glideAlts.isNotEmpty()) { keys.setSuggestions(glideAlts); return@Runnable }
        val before = currentInputConnection?.getTextBeforeCursor(40, 0)
        keys.setSuggestions(
            if (before == null) emptyList()
            else Suggest.forText(before, amharic, if (learnOn) learned else emptyMap(), if (amharic) Words.am else Words.en),
        )
    }

    private fun wordOfDay(): Pair<String, String>? {
        val list = if (amharic) KeyboardData.wordOfTheDayAm else KeyboardData.wordOfTheDayEn
        if (list.isEmpty()) return null
        return list[java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_MONTH) % list.size]
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
        glideAlts = emptyList()
        lastCorrection = null
        spaceBeforeNextLetter = false
        keys.setVowels(emptyList())
        if (keys.shiftState == 1) keys.shiftState = 0
    }

    // ─── Keys ────────────────────────────────────────────────────────────

    private val phoneticActive get() = layoutId == LayoutId.PHONETIC

    override fun onText(text: String) {
        val ic = currentInputConnection ?: return
        if (emojiQuery != null) { typeIntoSearch(text); return }
        glideAlts = emptyList()
        lastCorrection = null
        val c = text.singleOrNull()
        val sentenceEnd = text == "." || text == "!" || text == "?" || text == "።"
        // Punctuation ends a word, so it may need correcting first.
        if (c != null && c in ".,!?;:" ) correctWordBefore("")
        if (spaceBeforeNextLetter) {
            spaceBeforeNextLetter = false
            if (c != null && c.isLetter()) ic.commitText(" ", 1)
        }
        if (phoneticActive && text.length == 1) {
            applyTranslit(Translit.press(translit, text[0]))
        } else {
            ic.commitText(text, 1)
            translit = Translit.EMPTY
        }
        if (keys.shiftState == 1) keys.shiftState = 0

        // A consonant just typed: the next vowel-row tap turns it into that form.
        vowelChanges = layoutId == LayoutId.FIDEL && KeyboardData.amharicVowels.containsKey(text)
        if (layoutId == LayoutId.FIDEL) {
            keys.setVowels(KeyboardData.amharicVowels[text].orEmpty())
        }
        // Asking the app about the cursor costs a round trip, so only do it
        // where a new sentence could have started.
        if (sentenceEnd) updateAutoCaps()
        // Auto-space after punctuation: the space waits for the next letter, so
        // "3.5", "..." and a following space or newline come out right.
        if (autoSpace && !plainField && !digitField && c != null && (c in ".!?;:" || text == "።" || text == "፣")) {
            spaceBeforeNextLetter = true
            if (sentenceEnd && autoCap && !amharic && keys.shiftState == 0) keys.shiftState = 1
        }
    }

    // ─── Auto-correct ────────────────────────────────────────────────────

    private val correcting get() = !plainField && !digitField && when (layoutId) {
        LayoutId.LETTERS -> autoCorrect && !amharic
        // Off unless asked for: the Amharic list is small next to all the forms a word can take.
        LayoutId.FIDEL, LayoutId.PHONETIC -> autoCorrectAm
        else -> false
    }

    /** Fixes the word just before the cursor, before [separator] is typed after it. */
    private fun correctWordBefore(separator: String) {
        if (!correcting) return
        val ic = currentInputConnection ?: return
        val before = ic.getTextBeforeCursor(48, 0)?.toString() ?: return
        var i = before.length
        while (i > 0 && (before[i - 1].isLetter() || before[i - 1] == '\'')) i--
        val typed = before.substring(i)
        if (typed.isEmpty() || typed.lowercase() in keepAsTyped) return
        // Part of a longer token such as an address or a number: leave it.
        if (i > 0 && (before[i - 1].isLetterOrDigit() || before[i - 1] in "@/_.-#")) return
        val known = if (learnOn) learned else emptyMap()
        val fix = (if (amharic) Amharic.correct(typed, Words.am, known) else AutoCorrect.correct(typed, Words.en, known)) ?: return
        if (fix == typed) return
        ic.beginBatchEdit()
        ic.deleteSurroundingText(typed.length, 0)
        ic.commitText(fix, 1)
        ic.endBatchEdit()
        lastCorrection = Triple(typed, fix, separator)
    }

    /** Backspace straight after a correction puts back what was typed. */
    private fun undoCorrection(): Boolean {
        val (typed, fix, sep) = lastCorrection ?: return false
        lastCorrection = null
        val ic = currentInputConnection ?: return false
        val before = ic.getTextBeforeCursor(fix.length + sep.length, 0)?.toString() ?: return false
        if (before != fix + sep) return false
        ic.beginBatchEdit()
        ic.deleteSurroundingText(before.length, 0)
        ic.commitText(typed, 1)
        ic.endBatchEdit()
        keepAsTyped.add(typed.lowercase())
        return true
    }

    private fun applyTranslit(step: Translit.Step) {
        val ic = currentInputConnection ?: return
        ic.beginBatchEdit()
        if (step.replaceLast > 0) ic.deleteSurroundingText(step.replaceLast, 0)
        if (step.insert.isNotEmpty()) ic.commitText(step.insert, 1)
        ic.endBatchEdit()
        translit = step.next
    }

    /**
     * True straight after a consonant key. The first vowel-row tap then changes
     * that letter (ለ → ሉ); every tap after it types a new one, so tapping ሉ
     * twice gives ሉሉ without going back to ለ.
     */
    private var vowelChanges = false

    override fun onVowel(vowel: String) {
        val ic = currentInputConnection ?: return
        val family = keys.vowelForms()
        val last = ic.getTextBeforeCursor(1, 0)?.toString()
        // Only change the letter if it is still the one the row belongs to:
        // after a backspace or a cursor move it may be something else.
        if (vowelChanges && last != null && last in family) replaceLast(vowel)
        else {
            if (spaceBeforeNextLetter) { spaceBeforeNextLetter = false; ic.commitText(" ", 1) }
            ic.commitText(vowel, 1)
            translit = Translit.EMPTY
        }
        vowelChanges = false
    }

    override fun onReplaceLast(text: String) {
        replaceLast(text)
        // The form is chosen, so the vowel row types new letters from here.
        vowelChanges = false
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
        if (emojiQuery != null) {
            emojiQuery = emojiQuery!!.dropLast(1)
            keys.setSearch(emojiQuery, searchResults())
            return
        }
        glideAlts = emptyList()
        spaceBeforeNextLetter = false
        if (undoCorrection()) return
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
        if (emojiQuery != null) { typeIntoSearch(" "); return }
        glideAlts = emptyList()
        // The space is typed here instead of waiting for a letter.
        if (spaceBeforeNextLetter) {
            spaceBeforeNextLetter = false
            ic.commitText(" ", 1)
            lastSpaceAt = 0L
            updateAutoCaps()
            return
        }
        lastCorrection = null
        correctWordBefore(" ")
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
                lastCorrection = null
                updateAutoCaps()
                return
            }
        }
        ic.commitText(" ", 1)
        lastSpaceAt = now
        updateAutoCaps()
    }

    override fun onEnter() {
        if (emojiQuery != null) { onSearchClose(); return }
        glideAlts = emptyList()
        spaceBeforeNextLetter = false
        correctWordBefore("")
        lastCorrection = null
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
        if (emojiQuery != null) return
        symbols = !symbols
        symbolsPage2 = false
        translit = Translit.EMPTY
        refreshLayout()
    }

    override fun onSymbolsPage() {
        symbolsPage2 = !symbolsPage2
        refreshLayout()
    }

    override fun onLanguage() {
        if (emojiQuery != null) emojiQuery = null
        amharic = !amharic
        symbols = false
        translit = Translit.EMPTY
        savePref { putBoolean(Prefs.AMHARIC, amharic) }
        keys.shiftState = 0
        refreshLayout()
        if (!amharic) updateAutoCaps()
    }

    /** Holding the language key: flip Amharic between fidel and phonetic (going to Amharic if needed). */
    override fun onPhonetic() {
        if (emojiQuery != null) emojiQuery = null
        if (!amharic) { amharic = true; symbols = false; keys.shiftState = 0; savePref { putBoolean(Prefs.AMHARIC, true) } }
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
        glideAlts = emptyList()
        lastCorrection = null
        spaceBeforeNextLetter = false
        sendDownUpKeyEvents(if (delta < 0) KeyEvent.KEYCODE_DPAD_LEFT else KeyEvent.KEYCODE_DPAD_RIGHT)
        onKeyFeedback()
    }

    override fun onCursorKey(dir: String) {
        translit = Translit.EMPTY
        glideAlts = emptyList()
        lastCorrection = null
        spaceBeforeNextLetter = false
        keys.setVowels(emptyList())
        sendDownUpKeyEvents(when (dir) {
            "home" -> KeyEvent.KEYCODE_MOVE_HOME
            "end" -> KeyEvent.KEYCODE_MOVE_END
            "up" -> KeyEvent.KEYCODE_DPAD_UP
            "down" -> KeyEvent.KEYCODE_DPAD_DOWN
            "left" -> KeyEvent.KEYCODE_DPAD_LEFT
            else -> KeyEvent.KEYCODE_DPAD_RIGHT
        })
    }

    // ─── Swipe typing ────────────────────────────────────────────────────

    /** The touch that started the swipe typed a letter on landing; take it back. */
    override fun onGlideStart() {
        // Phonetically the letter may have re-spelt the word ("se" + l is ሰል), so step the spelling back.
        val step = if (phoneticActive) Translit.backspace(translit) else null
        if (step != null) applyTranslit(step)
        else currentInputConnection?.deleteSurroundingTextInCodePoints(1, 0)
        vowelChanges = false
        keys.setVowels(emptyList())
    }

    override fun onGlide(xs: FloatArray, ys: FloatArray, keys: Map<Char, FloatArray>, keyW: Float, shifted: Boolean) {
        val ic = currentInputConnection ?: return
        val spelling = when (layoutId) {
            LayoutId.FIDEL -> Amharic.FIDEL
            LayoutId.PHONETIC -> Amharic.PHONETIC
            else -> Spelling.LETTERS
        }
        val english = spelling == Spelling.LETTERS
        val words = Glide.decode(xs, ys, keys, keyW, if (english) Words.en else Words.am,
            if (learnOn) learned else emptyMap(), spelling = spelling)
        if (words.isEmpty()) { onKeyFeedback(); return }
        // Capitals mean other letters in phonetic typing, and fidel has none.
        val caps = english && (shifted || this.keys.shiftState > 0)
        fun shape(w: String) = when {
            !english -> w
            w == "i" || w.startsWith("i'") -> "I" + w.drop(1)
            this.keys.shiftState == 2 -> w.uppercase()
            caps -> w.replaceFirstChar { it.uppercase() }
            else -> w
        }
        // A swiped word is its own word: it gets a space before it unless one is there.
        val prev = ic.getTextBeforeCursor(1, 0)
        val space = !prev.isNullOrEmpty() && !prev[0].isWhitespace() && prev[0] !in "([{\"'/@#-"
        ic.commitText((if (space) " " else "") + shape(words[0]), 1)
        translit = Translit.EMPTY
        lastCorrection = null
        spaceBeforeNextLetter = false
        if (this.keys.shiftState == 1) this.keys.shiftState = 0
        glideAlts = words.drop(1).map { shape(it) }
        scheduleSuggestions()
        onKeyFeedback()
    }

    // ─── Emoji search ────────────────────────────────────────────────────

    private fun searchResults(): List<String> {
        val q = emojiQuery ?: return emptyList()
        val found = if (q.isBlank()) recents.ifEmpty { listOf("😂", "❤️", "😍", "🙏", "👍", "😊", "🔥", "😭", "🥰", "🇪🇹") } else EmojiSearch.search(q)
        return found.map { EmojiData.withTone(it, skinTone) }
    }

    private fun typeIntoSearch(text: String) {
        val q = emojiQuery ?: return
        val c = text.singleOrNull() ?: return
        if (!c.isLetterOrDigit() && c != ' ' && c != '\'') return
        if (c == ' ' && (q.isEmpty() || q.endsWith(' '))) return
        emojiQuery = (q + c.lowercaseChar()).take(40)
        keys.shiftState = 0
        keys.setSearch(emojiQuery, searchResults())
    }

    override fun onPanelEmojiSearch() {
        closePanel()
        emojiQuery = ""
        symbols = false
        keys.shiftState = 0
        refreshLayout()
    }

    override fun onSearchPick(emoji: String) {
        currentInputConnection?.commitText(emoji, 1)
        recents = (listOf(emoji) + recents.filter { it != emoji }).take(24)
        savePref { putString(Prefs.RECENTS, recents.joinToString(" ")) }
    }

    override fun onSearchClose() {
        emojiQuery = null
        refreshLayout()
        updateAutoCaps()
    }

    // ─── Toolbar, panels, clipboard, voice ───────────────────────────────

    override fun onToolbar(action: Int) {
        when (action) {
            TOOL_LANGUAGE -> onLanguage()
            TOOL_EMOJI -> showPanel(PanelView.Tab.EMOJI)
            TOOL_STICKERS -> showPanel(PanelView.Tab.STICKERS)
            TOOL_GIF -> showPanel(PanelView.Tab.GIF)
            TOOL_CLIPBOARD -> showPanel(PanelView.Tab.CLIPBOARD)
            TOOL_WRITE -> showPanel(PanelView.Tab.WRITE)
            TOOL_TRANSLATE -> showPanel(PanelView.Tab.TRANSLATE)
            TOOL_THEMES -> showPanel(PanelView.Tab.THEMES)
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
        val rise = 18 * resources.displayMetrics.density
        panel.animate().cancel(); keys.animate().cancel()
        panel.alpha = 0f
        panel.translationY = rise
        panel.visibility = View.VISIBLE
        // The panel rises and fades in while the keys fade out beneath it.
        panel.animate().alpha(1f).translationY(0f).setDuration(190).setInterpolator(DecelerateInterpolator(1.6f)).start()
        keys.animate().alpha(0f).setDuration(130).withEndAction { keys.visibility = View.INVISIBLE; keys.alpha = 1f }.start()
    }

    private fun closePanel(animate: Boolean = true) {
        if (!::panel.isInitialized || panel.visibility != View.VISIBLE) return
        panel.animate().cancel(); keys.animate().cancel()
        if (!animate) {
            panel.visibility = View.GONE; panel.alpha = 1f; panel.translationY = 0f
            keys.visibility = View.VISIBLE; keys.alpha = 1f
            return
        }
        val drop = 14 * resources.displayMetrics.density
        keys.alpha = 0f
        keys.visibility = View.VISIBLE
        keys.animate().alpha(1f).setDuration(170).start()
        panel.animate().alpha(0f).translationY(drop).setDuration(140).setInterpolator(AccelerateInterpolator())
            .withEndAction { panel.visibility = View.GONE; panel.alpha = 1f; panel.translationY = 0f }.start()
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

    /** Never hands a password to the panels, so translate can't send one off the phone. */
    override fun panelTextBefore(): String =
        if (field == FieldKind.PASSWORD) ""
        else currentInputConnection?.getTextBeforeCursor(300, 0)?.toString().orEmpty()

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
        keys.applySettings(look())
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

    /**
     * Sends a sticker as a PNG where the app takes images. A plain text box can't
     * hold a picture, so there it types the sticker's emoji and caption instead.
     */
    override fun onPanelSticker(sticker: Stickers.Sticker) {
        val ic = currentInputConnection ?: return
        val editor = info ?: return
        onKeyFeedback()
        val accepts = EditorInfoCompat.getContentMimeTypes(editor).any { it == Stickers.MIME || it == "image/*" }
        val asText = "${sticker.emoji} ${sticker.caption}".trim()
        if (!accepts) {
            ic.commitText(asText, 1)
            Toast.makeText(this, "This app doesn't take stickers here, so it was sent as text", Toast.LENGTH_SHORT).show()
            return
        }
        Stickers.export(this, sticker) { uri ->
            val live = currentInputConnection ?: return@export
            if (uri == null) { live.commitText(asText, 1); return@export }
            val flags = if (Build.VERSION.SDK_INT >= 25) InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION else 0
            val sent = InputConnectionCompat.commitContent(
                live, editor, InputContentInfoCompat(uri, ClipDescription(sticker.caption, arrayOf(Stickers.MIME)), null), flags, null,
            )
            if (!sent) live.commitText(asText, 1)
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
            a.playSoundEffect(AudioManager.FX_KEYPRESS_STANDARD, soundVolume.coerceIn(0, 100) / 100f)
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
    const val LIVE_BG = "live_backgrounds"
    const val LONG_PRESS = "long_press_popup"
    const val PRESS_ANIM = "press_animation"
    const val AUTOCAP = "auto_capitalize"
    const val DOUBLE_SPACE = "double_space_period"
    const val ONE_HAND_WIDTH = "one_hand_width"
    const val LONG_PRESS_MS = "long_press_ms"
    const val KEY_GAP = "key_gap"
    const val KEY_RADIUS = "key_radius"
    const val LABEL_SIZE = "label_size"
    const val KEY_WEIGHT = "key_weight"
    const val KEY_BORDERS = "key_borders"
    const val AUTO_SPACE = "auto_space_punctuation"
    const val SOUND_VOLUME = "sound_volume"
    const val CURSOR_ROW = "cursor_row"
    /** Where the language switch lives; see [LangKey]. */
    const val LANG_KEY = "language_key_position"
    /** Toolbar buttons, as a comma list of names from [Tools]. */
    const val TOOLBAR = "toolbar"
    const val WORD_OF_DAY = "word_of_day"
    const val AUTOCORRECT = "autocorrect"
    const val AUTOCORRECT_AM = "autocorrect_amharic"
    /** Swipe across the letters to type a word. */
    const val GLIDE = "glide_typing"
}
