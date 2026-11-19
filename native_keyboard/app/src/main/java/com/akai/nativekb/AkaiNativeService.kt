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

class AkaiNativeService : InputMethodService(), KeyListener, PanelHost, VoiceListener {
    // (Prefs keys live in the Prefs object below.)

    private lateinit var keys: KeyboardView
    private lateinit var panel: PanelView
    private lateinit var container: FrameLayout
    /** Holds the keys and panels; floats over the app in floating mode. */
    private lateinit var card: FrameLayout
    private lateinit var handle: View
    private var floating = false
    private val handler = Handler(Looper.getMainLooper())

    // ─── State ───────────────────────────────────────────────────────────
    private var lang = Lang.EN
    /** Typing in a Ge'ez-script language (Amharic or Tigrinya). */
    private val geez get() = lang.geez
    /** Tigrinya is in the language key's cycle. */
    private var tigrinyaLang = false
    private var oromoLang = false
    private var amharicLang = true
    private var arabicLang = false
    /** Arabic typed from Latin letters instead of the Arabic board. */
    private var arabicPhonetic = false
    private var somaliLang = false
    private fun enabledLangs() = Lang.enabled(tigrinyaLang, oromoLang, amharicLang, arabicLang, somaliLang)
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
    /**
     * What the strip search is for: GIFs or stickers (run on Enter, then shown
     * in that panel), or null for emoji (live, in the strip).
     */
    private var searchTab: PanelView.Tab? = null
    private fun searchLabel() = when (searchTab) {
        PanelView.Tab.GIF -> "GIFs"
        PanelView.Tab.STICKERS -> "stickers"
        PanelView.Tab.LYRICS -> "songs"
        else -> null
    }
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
    private var learnPref = true
    private var incognito = false
    /** Text shortcuts: a typed abbreviation (lower case) and what it becomes. */
    private var shortcuts: Map<String, String> = emptyMap()
    /** The app asked for no personalised learning (Chrome incognito tabs, banking apps). */
    private var appNoLearn = false
    private val learnOn get() = learnPref && !incognito && !appNoLearn
    private var englishLayout = "qwerty"
    private var amharicLayout = "traditional"
    private var tigrinya = false
    private var holdClear = false
    private var holdClearMs = 800
    private var skinTone = 0
    private var emojiCols = 8
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
    private val habits = Habits()
    private val learned get() = habits.words
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
        voice?.destroy()
        speaker?.destroy()
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
        chips = InlineChips(this)
        handle = floatHandle()
        card = FrameLayout(this).apply {
            addView(keys, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT))
            addView(panel, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT))
            addView(chips.view, chips.layoutParams())
            addView(handle, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, handleH(), android.view.Gravity.TOP))
            // Rows come and go (word of the day, suggestions, panels): keep a floating card on screen.
            addOnLayoutChangeListener { v, _, top, _, bottom, _, oldTop, _, oldBottom ->
                if (floating && bottom - top != oldBottom - oldTop) v.post { placeCard(v.translationX, v.translationY) }
            }
        }
        container = FrameLayout(this).apply {
            addView(card, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, android.view.Gravity.BOTTOM))
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
        tigrinyaLang = p.getBoolean(Prefs.TIGRINYA_LANG, false)
        oromoLang = p.getBoolean(Prefs.OROMO_LANG, false)
        amharicLang = p.getBoolean(Prefs.AMHARIC_LANG, true)
        arabicLang = p.getBoolean(Prefs.ARABIC_LANG, false)
        arabicPhonetic = p.getBoolean(Prefs.ARABIC_PHONETIC, false)
        somaliLang = p.getBoolean(Prefs.SOMALI_LANG, false)
        lang = Lang.fromCode(p.getString(Prefs.LANG, null)) ?: if (p.getBoolean(Prefs.AMHARIC, false)) Lang.AM else Lang.EN
        if (lang !in enabledLangs()) lang = Lang.EN
        phonetic = p.getBoolean(Prefs.PHONETIC, false)
        theme = p.getString(Prefs.THEME, "system") ?: "system"
        heightPercent = p.getInt(Prefs.HEIGHT, 100)
        oneHand = p.getInt(Prefs.ONE_HAND, 0)
        hints = p.getBoolean(Prefs.HINTS, true)
        numberRow = p.getBoolean(Prefs.NUMBER_ROW, false)
        suggestOn = p.getBoolean(Prefs.SUGGEST, true)
        recents = (p.getString(Prefs.RECENTS, "") ?: "").split(' ').filter { it.isNotEmpty() }
        learnPref = p.getBoolean(Prefs.LEARN, true)
        incognito = p.getBoolean(Prefs.INCOGNITO, false)
        shortcuts = Shortcuts.parse(p.getString(Prefs.SHORTCUTS, "").orEmpty())
        autoCap = p.getBoolean(Prefs.AUTOCAP, true)
        doubleSpace = p.getBoolean(Prefs.DOUBLE_SPACE, true)
        pressAnim = p.getBoolean(Prefs.PRESS_ANIM, true)
        liveBg = p.getBoolean(Prefs.LIVE_BG, true)
        longPress = p.getBoolean(Prefs.LONG_PRESS, true)
        englishLayout = p.getString(Prefs.ENGLISH_LAYOUT, "qwerty") ?: "qwerty"
        amharicLayout = p.getString(Prefs.AMHARIC_LAYOUT, "traditional") ?: "traditional"
        tigrinya = p.getBoolean(Prefs.TIGRINYA, false)
        holdClear = p.getBoolean(Prefs.HOLD_CLEAR, false)
        holdClearMs = p.getInt(Prefs.HOLD_CLEAR_MS, 800)
        skinTone = p.getInt(Prefs.SKIN_TONE, 0)
        floating = p.getBoolean(Prefs.FLOATING, false)
        emojiCols = p.getInt(Prefs.EMOJI_COLS, 8)
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
        // "Forget learned words" removes the saved copy; drop the one in memory too.
        if (habits.dirty == 0 && !p.contains(Prefs.LEARNED)) habits.clear()
        if (habits.words.isEmpty() && habits.pairs.isEmpty() && habits.emoji.isEmpty()) {
            Habits.decode(p.getString(Prefs.LEARNED, "") ?: "", habits.words)
            Habits.decode(p.getString(Prefs.LEARNED_PAIRS, "") ?: "", habits.pairs)
            Habits.decode(p.getString(Prefs.LEARNED_EMOJI, "") ?: "", habits.emoji)
        }
        if (::keys.isInitialized) {
            keys.holdClearMs = if (holdClear) holdClearMs.toLong() else 0L
            panel.serverUrl = serverUrl
            panel.giphyKey = giphyKey
            panel.skinTone = skinTone
            panel.emojiCols = emojiCols
            panel.themeId = Themes.find(theme).id
            keys.applySettings(look())
            keys.setTools(tools)
            panel.applyTheme(theme)
            applyFloating()
        }
    }

    private fun look() = KeyLook(
        theme, heightPercent, hints, if (floating) 0 else oneHand, oneHandWidth, pressAnim, longPress, liveBg,
        longPressMs, keyGap, keyRadius, labelSize, keyWeight, keyBorders, glide,
    )

    private fun savePref(block: android.content.SharedPreferences.Editor.() -> Unit) {
        getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).edit().apply(block).apply()
    }

    override fun onStartInputView(editor: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(editor, restarting)
        info = editor
        field = classify(editor)
        appNoLearn = editor != null && (editor.imeOptions and 0x1000000) != 0 // IME_FLAG_NO_PERSONALIZED_LEARNING
        padDismissed = false
        symbols = false
        translit = Translit.EMPTY
        emojiQuery = null
        searchTab = null
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
        val showAmharic = geez && !plainField && !digitField && !searching
        val id = when {
            searching -> LayoutId.LETTERS
            digitField && !padDismissed -> when (field) {
                FieldKind.PHONE -> LayoutId.PHONE
                FieldKind.DATETIME -> LayoutId.DATETIME
                else -> LayoutId.NUMBER
            }
            symbols -> if (symbolsPage2) LayoutId.SYMBOLS2 else LayoutId.SYMBOLS
            showAmharic -> if (phonetic) LayoutId.PHONETIC else LayoutId.FIDEL
            lang == Lang.AR && !plainField -> if (arabicPhonetic) LayoutId.PHONETIC else LayoutId.ARABIC
            else -> LayoutId.LETTERS
        }
        layoutId = id
        val options = LayoutOptions(
            enterLabel(), numberRow, backToPad = digitField && padDismissed,
            englishLayout = englishLayout, amharicLayout = amharicLayout, cursorRow = cursorRow && !searching,
            langKey = langKey, tigrinya = tigrinya || lang == Lang.TI,
            // Email, search and number fields type English whatever the language.
            lang = if (plainField || digitField || searching) Lang.EN else lang, nextLang = Lang.next(lang, enabledLangs()),
        )
        val layout = Layouts.build(id, showAmharic, options, if (phonetic) LayoutId.PHONETIC else LayoutId.FIDEL)
        // The toolbar's language button, on the boards that have a language key.
        val letterBoard = id == LayoutId.LETTERS || id == LayoutId.PHONETIC || id == LayoutId.FIDEL || id == LayoutId.ARABIC
        keys.setLanguageTool(if (langKey == LangKey.TOOLBAR && letterBoard && !searching) Lang.next(lang, enabledLangs()).key else null)
        keys.spaceSwitch = langKey == LangKey.SPACE
        keys.setVowels(emptyList())
        keys.setSearch(emojiQuery, searchResults(), searchLabel())
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
        if (lang.caseless) { keys.shiftState = 0; return }
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
            else Suggest.forText(
                before, geez, if (learnOn) learned else emptyMap(), Words.of(lang),
                pairs = if (learnOn) habits.pairs else emptyMap(), emojiHabits = if (learnOn) habits.emoji else emptyMap(),
                lang = lang, nextWords = if (lang == Lang.AM) Words.nextAm else null,
            ),
        )
    }

    private fun wordOfDay(): Pair<String, String>? {
        // Only Amharic and English have a word of the day so far.
        if (lang == Lang.TI) return null
        val list = if (geez) KeyboardData.wordOfTheDayAm else KeyboardData.wordOfTheDayEn
        if (list.isEmpty()) return null
        return list[java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_MONTH) % list.size]
    }

    /** Remembers the word just finished, so it can be suggested next time. */
    private fun learnWordBefore() {
        if (!learnOn || plainField || digitField) return
        val before = currentInputConnection?.getTextBeforeCursor(40, 0) ?: return
        val (word, prev) = Suggest.lastTwo(before)
        if (word == null) return
        habits.learnWord(word, prev)
        if (habits.dirty >= 20) saveLearned()
    }

    /** Remembers that the emoji [emoji] was put after the word just before the cursor. */
    private fun learnEmojiBefore(before: CharSequence, emoji: String) {
        if (!learnOn || plainField || digitField) return
        val word = Suggest.lastTwo(before).first ?: return
        habits.learnEmoji(word, emoji)
        if (habits.dirty >= 20) saveLearned()
    }

    private fun saveLearned() {
        habits.dirty = 0
        savePref {
            putString(Prefs.LEARNED, Habits.encode(habits.words))
            putString(Prefs.LEARNED_PAIRS, Habits.encode(habits.pairs))
            putString(Prefs.LEARNED_EMOJI, Habits.encode(habits.emoji))
        }
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        if (::chips.isInitialized) chips.hide()
        super.onFinishInputView(finishingInput)
        voice?.cancel()
        if (habits.dirty > 0) saveLearned()
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
        if (Suggest.isEmoji(word)) {
            // An emoji goes after the word, not in place of it.
            learnEmojiBefore(before, word)
            val gap = if (before.isNotEmpty() && !before.last().isWhitespace()) " " else ""
            ic.commitText("$gap$word ", 1)
            recents = (listOf(word) + recents.filter { it != word }).take(24)
            savePref { putString(Prefs.RECENTS, recents.joinToString(" ")) }
            translit = Translit.EMPTY
            glideAlts = emptyList()
            lastCorrection = null
            spaceBeforeNextLetter = false
            keys.setVowels(emptyList())
            return
        }
        val n = Suggest.currentWordLength(before)
        if (learnOn && !plainField && !digitField) {
            // Picking a suggestion counts as typing the word.
            val (_, prev) = Suggest.lastTwo(before.substring(0, before.length - n) + word)
            val clean = Suggest.clean(word)
            if (Suggest.isWord(clean)) habits.learnWord(clean, prev)
        }
        val capitalised = n > 0 && before[before.length - n].isUpperCase() && !lang.caseless
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
            applyTranslit(Translit.press(translit, text[0], lang))
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
        if (autoSpace && !plainField && !digitField && c != null && (c in ".!?;:" || text == "።" || text == "፣" || text == "،" || text == "؟" || text == "؛")) {
            spaceBeforeNextLetter = true
            if (sentenceEnd && autoCap && !lang.caseless && keys.shiftState == 0) keys.shiftState = 1
        }
    }

    // ─── Auto-correct ────────────────────────────────────────────────────

    private val correcting get() = !plainField && !digitField && when (layoutId) {
        // English only: its fixes and word list are not Oromo's.
        LayoutId.LETTERS -> autoCorrect && lang == Lang.EN
        // Off unless asked for: the Amharic list is small next to all the forms a word can take.
        LayoutId.FIDEL, LayoutId.PHONETIC -> autoCorrectAm && geez
        else -> false
    }

    /** Fixes the word just before the cursor, before [separator] is typed after it. */
    /** Turns a typed abbreviation into its full text. True when it did, so no spell-fix follows. */
    private fun expandShortcut(separator: String): Boolean {
        if (shortcuts.isEmpty() || plainField || digitField || emojiQuery != null) return false
        val ic = currentInputConnection ?: return false
        val before = ic.getTextBeforeCursor(48, 0)?.toString() ?: return false
        var i = before.length
        while (i > 0 && (before[i - 1].isLetterOrDigit() || before[i - 1] == '\'')) i--
        val typed = before.substring(i)
        if (typed.isEmpty()) return false
        if (i > 0 && before[i - 1] in "@/_.-#") return false
        val full = shortcuts[typed.lowercase()] ?: return false
        ic.beginBatchEdit()
        ic.deleteSurroundingText(typed.length, 0)
        ic.commitText(full, 1)
        ic.endBatchEdit()
        lastCorrection = Triple(typed, full, separator)
        return true
    }

    private fun correctWordBefore(separator: String) {        if (!correcting) return
        val ic = currentInputConnection ?: return
        val before = ic.getTextBeforeCursor(48, 0)?.toString() ?: return
        var i = before.length
        while (i > 0 && (before[i - 1].isLetter() || before[i - 1] == '\'')) i--
        val typed = before.substring(i)
        if (typed.isEmpty() || typed.lowercase() in keepAsTyped) return
        // Part of a longer token such as an address or a number: leave it.
        if (i > 0 && (before[i - 1].isLetterOrDigit() || before[i - 1] in "@/_.-#")) return
        val known = if (learnOn) learned else emptyMap()
        val fix = (if (geez) Amharic.correct(typed, Words.of(lang), known) else AutoCorrect.correct(typed, Words.en, known)) ?: return
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
            keys.setSearch(emojiQuery, searchResults(), searchLabel())
            return
        }
        glideAlts = emptyList()
        spaceBeforeNextLetter = false
        if (undoCorrection()) return
        if (phoneticActive) {
            val step = Translit.backspace(translit, lang)
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
        if (!expandShortcut(" ")) correctWordBefore(" ")
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
                ic.commitText(lang.sentenceEnd, 1)
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
        if (emojiQuery != null) { if (searchTab != null) onSearchSubmit() else onSearchClose(); return }
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
        if (emojiQuery != null) { emojiQuery = null; searchTab = null }
        lang = Lang.next(lang, enabledLangs())
        symbols = false
        translit = Translit.EMPTY
        savePref { putString(Prefs.LANG, lang.code); putBoolean(Prefs.AMHARIC, geez) }
        keys.shiftState = 0
        refreshLayout()
        if (!geez) updateAutoCaps()
    }

    /** Holding the language key: flip Amharic between fidel and phonetic (going to Amharic if needed). */
    override fun onPhonetic() {
        if (emojiQuery != null) { emojiQuery = null; searchTab = null }
        // Arabic has its own standard and phonetic boards.
        if (lang == Lang.AR) {
            arabicPhonetic = !arabicPhonetic
            translit = Translit.EMPTY
            savePref { putBoolean(Prefs.ARABIC_PHONETIC, arabicPhonetic) }
            refreshLayout()
            return
        }
        if (!geez) { lang = enabledLangs().firstOrNull { it.geez } ?: return; symbols = false; keys.shiftState = 0; savePref { putString(Prefs.LANG, lang.code); putBoolean(Prefs.AMHARIC, true) } }
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
        val step = if (phoneticActive) Translit.backspace(translit, lang) else null
        if (step != null) applyTranslit(step)
        else currentInputConnection?.deleteSurroundingTextInCodePoints(1, 0)
        vowelChanges = false
        keys.setVowels(emptyList())
    }

    override fun onGlide(xs: FloatArray, ys: FloatArray, keys: Map<Char, FloatArray>, keyW: Float, shifted: Boolean) {
        val ic = currentInputConnection ?: return
        // Swipe typing knows Latin and fidel spellings only.
        if (lang == Lang.AR) { onKeyFeedback(); return }
        val spelling = when (layoutId) {
            LayoutId.FIDEL -> Amharic.FIDEL
            LayoutId.PHONETIC -> Amharic.PHONETIC
            else -> Spelling.LETTERS
        }
        val english = spelling == Spelling.LETTERS
        val words = Glide.decode(xs, ys, keys, keyW,
            // Latin letters in an Amharic or Tigrinya session (an email field) are English.
            Words.of(if (english && geez) Lang.EN else lang),
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
        if (searchTab != null) return emptyList()
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
        keys.setSearch(emojiQuery, searchResults(), searchLabel())
    }

    override fun onPanelEmojiSearch() = startSearch(null, start = "")

    override fun onPanelAddStickers() {
        closePanel()
        requestHideSelf(0)
        startActivity(Intent(this, StickerMarketActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    override fun onPanelGifSearch(current: String) = startSearch(PanelView.Tab.GIF, start = current)

    override fun onPanelStickerSearch(current: String) = startSearch(PanelView.Tab.STICKERS, start = current)

    override fun onPanelLyricsSearch(current: String) = startSearch(PanelView.Tab.LYRICS, start = current)

    private fun startSearch(tab: PanelView.Tab?, start: String) {
        closePanel()
        searchTab = tab
        emojiQuery = start
        symbols = false
        keys.shiftState = 0
        refreshLayout()
    }

    override fun onSearchPick(emoji: String) {
        currentInputConnection?.let { ic ->
            ic.getTextBeforeCursor(40, 0)?.let { learnEmojiBefore(it, emoji) }
            ic.commitText(emoji, 1)
        }
        recents = (listOf(emoji) + recents.filter { it != emoji }).take(24)
        savePref { putString(Prefs.RECENTS, recents.joinToString(" ")) }
    }

    override fun onSearchClose() {
        val back = searchTab
        emojiQuery = null
        searchTab = null
        refreshLayout()
        updateAutoCaps()
        if (back != null) showPanel(back)
    }

    /** Enter, or "Search" in the strip, while searching GIFs or stickers: show what's found. */
    override fun onSearchSubmit() {
        val q = emojiQuery?.trim().orEmpty()
        val tab = searchTab
        if (tab == null || q.isEmpty()) return
        emojiQuery = null
        searchTab = null
        refreshLayout()
        when (tab) {
            PanelView.Tab.STICKERS -> panel.searchStickers(q)
            PanelView.Tab.LYRICS -> panel.searchLyrics(q)
            else -> panel.searchGifs(q)
        }
        showPanel(tab)
    }

    // ─── Floating keyboard ───────────────────────────────────────────────

    private fun handleH() = (20 * resources.displayMetrics.density).toInt()

    /** The bar along the top of the floating keyboard: drag it to move the keyboard. */
    private fun floatHandle(): View = object : View(this) {
        private val pill = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
        private var downX = 0f
        private var downY = 0f
        private var startX = 0f
        private var startY = 0f

        override fun onDraw(c: android.graphics.Canvas) {
            pill.color = Themes.palette(context, theme).text
            pill.alpha = 90
            val d = resources.displayMetrics.density
            val w = 36 * d
            c.drawRoundRect(width / 2f - w / 2f, height / 2f - 2 * d, width / 2f + w / 2f, height / 2f + 2 * d, 2 * d, 2 * d, pill)
        }

        @android.annotation.SuppressLint("ClickableViewAccessibility")
        override fun onTouchEvent(e: android.view.MotionEvent): Boolean {
            when (e.actionMasked) {
                android.view.MotionEvent.ACTION_DOWN -> { downX = e.rawX; downY = e.rawY; startX = card.translationX; startY = card.translationY }
                android.view.MotionEvent.ACTION_MOVE -> placeCard(startX + e.rawX - downX, startY + e.rawY - downY)
                android.view.MotionEvent.ACTION_UP, android.view.MotionEvent.ACTION_CANCEL ->
                    savePref { putInt(Prefs.FLOAT_X, card.translationX.toInt()); putInt(Prefs.FLOAT_Y, card.translationY.toInt()) }
            }
            return true
        }
    }.apply { contentDescription = "Drag to move the keyboard" }

    /** Moves the floating keyboard, keeping it on screen. */
    private fun placeCard(x: Float, y: Float) {
        val maxX = (container.width - card.width).coerceAtLeast(0).toFloat()
        val maxY = (container.height - container.paddingBottom - card.height).coerceAtLeast(0).toFloat()
        card.translationX = x.coerceIn(0f, maxX)
        card.translationY = y.coerceIn(0f, maxY)
    }

    /** Lays the keyboard out docked along the bottom, or as a smaller card over the app. */
    private fun applyFloating() {
        if (!::card.isInitialized) return
        val bg = Themes.palette(this, theme).background
        val dm = resources.displayMetrics
        val lp = card.layoutParams as FrameLayout.LayoutParams
        val top = if (floating) handleH() else 0
        for (v in listOf(keys, panel, chips.view)) (v.layoutParams as FrameLayout.LayoutParams).topMargin = top
        handle.visibility = if (floating) View.VISIBLE else View.GONE
        if (floating) {
            container.setBackgroundColor(android.graphics.Color.TRANSPARENT)
            container.minimumHeight = dm.heightPixels
            card.background = android.graphics.drawable.GradientDrawable().apply {
                setColor(bg); cornerRadius = 18 * dm.density
            }
            card.clipToOutline = true
            card.elevation = 8 * dm.density
            lp.width = (dm.widthPixels * 0.8f).toInt()
            lp.gravity = android.view.Gravity.TOP or android.view.Gravity.START
            card.layoutParams = lp
            val p = getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
            container.post {
                val x = p.getInt(Prefs.FLOAT_X, -1).takeIf { it >= 0 }?.toFloat() ?: ((container.width - card.width) / 2f)
                val y = p.getInt(Prefs.FLOAT_Y, -1).takeIf { it >= 0 }?.toFloat() ?: Float.MAX_VALUE
                placeCard(x, y)
            }
        } else {
            container.setBackgroundColor(bg)
            container.minimumHeight = 0
            card.background = null
            card.elevation = 0f
            card.translationX = 0f
            card.translationY = 0f
            lp.width = FrameLayout.LayoutParams.MATCH_PARENT
            lp.gravity = android.view.Gravity.BOTTOM
            card.layoutParams = lp
        }
    }

    /** Floating: the app keeps its full size, and only the card takes touches. */
    override fun onComputeInsets(outInsets: Insets) {
        super.onComputeInsets(outInsets)
        if (!floating || !::card.isInitialized || !card.isShown) return
        val h = window?.window?.decorView?.height ?: return
        outInsets.contentTopInsets = h
        outInsets.visibleTopInsets = h
        val at = IntArray(2)
        card.getLocationInWindow(at)
        outInsets.touchableInsets = Insets.TOUCHABLE_INSETS_REGION
        outInsets.touchableRegion.set(at[0], at[1], at[0] + card.width, at[1] + card.height)
    }

    // ─── Toolbar, panels, clipboard, voice ───────────────────────────────

    private var speaker: Speaker? = null
    private lateinit var chips: InlineChips

    /** Asks the password manager for autofill chips (Android 11+). */
    override fun onCreateInlineSuggestionsRequest(uiExtras: android.os.Bundle): android.view.inputmethod.InlineSuggestionsRequest? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && ::chips.isInitialized) chips.request() else null

    override fun onInlineSuggestionsResponse(response: android.view.inputmethod.InlineSuggestionsResponse): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R || !::chips.isInitialized) return false
        chips.setBackground(Themes.palette(this, theme).background)
        return chips.show(response)
    }

    /** Reads the selection, or else the field's text, aloud; a second tap stops it. */
    private fun readAloud() {
        val s = speaker ?: Speaker(this).also { speaker = it }
        if (s.speaking) { s.stop(); return }
        val ic = currentInputConnection ?: return
        val text = ic.getSelectedText(0)?.takeIf { it.isNotBlank() }
            ?: ((ic.getTextBeforeCursor(4000, 0) ?: "").toString() + (ic.getTextAfterCursor(4000, 0) ?: ""))
        // Never read a password field out loud.
        if (field == FieldKind.PASSWORD) return
        s.speak(text.toString())
    }

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
            TOOL_LYRICS -> showPanel(PanelView.Tab.LYRICS)
            TOOL_SPEAK -> readAloud()
            TOOL_VOICE -> {
                voiceLang = lang
                showPanel(PanelView.Tab.VOICE)
                voiceInput().start(voiceTag())
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
        voice?.cancel()
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

    // ─── Voice typing ────────────────────────────────────────────────────

    private var voice: VoiceInput? = null
    private fun voiceInput() = voice ?: VoiceInput(this, this).also { voice = it }
    /** The voice tab's language, which starts as the keyboard's and can be switched there. */
    private var voiceLang = Lang.EN
    private fun voiceNext() = Lang.next(voiceLang, enabledLangs())
    private fun voiceTag() = voiceLang.voiceTag
    /** What goes before the words being spoken (a space or nothing); null when nothing is being spoken. */
    private var voicePrefix: String? = null

    private fun startVoicePrefix(): String {
        voicePrefix?.let { return it }
        val prev = currentInputConnection?.getTextBeforeCursor(1, 0)
        val space = spaceBeforeNextLetter || !prev.isNullOrEmpty() && !prev[0].isWhitespace() && prev[0] !in "([{\"'/@#-"
        spaceBeforeNextLetter = false
        return (if (space) " " else "").also { voicePrefix = it }
    }

    override fun onPanelVoice(action: PanelView.VoiceAction) {
        val v = voiceInput()
        when (action) {
            PanelView.VoiceAction.MIC -> if (v.status.active) v.stop() else v.start(voiceTag())
            PanelView.VoiceAction.LANGUAGE -> {
                voiceLang = voiceNext()
                if (v.status.active) { v.cancel(); v.start(voiceTag()) }
                else panel.setVoice(v.status, voiceLang, voiceNext())
            }
            PanelView.VoiceAction.SETUP -> {
                val screen = if (v.status.phase == VoiceStatus.Phase.NEEDS_PERMISSION) Intent(this, MicPermissionActivity::class.java)
                // No speech service the keyboard can use: the system's own voice screen may still work.
                else Intent(this, VoiceActivity::class.java).putExtra(VoiceActivity.EXTRA_LANGUAGE, voiceTag())
                startActivity(screen.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION))
            }
            PanelView.VoiceAction.LEAVE -> v.cancel()
        }
    }

    override fun onVoiceStatus(status: VoiceStatus) {
        if (::panel.isInitialized) panel.setVoice(status, voiceLang, voiceNext())
    }

    override fun onVoiceLevel(level: Float) {
        if (::panel.isInitialized) panel.setVoiceLevel(level)
    }

    /** The words so far go into the field as underlined, still-changing text. */
    override fun onVoicePartial(text: String) {
        val ic = currentInputConnection ?: return
        ic.setComposingText(startVoicePrefix() + text, 1)
    }

    /**
     * With "Tidy up voice typing" on, the server adds punctuation and drops filler
     * words. The words go in at once; the tidy version replaces them only if they
     * are still the last thing in the field when it comes back.
     */
    private fun tidyVoice(typed: String) {
        val p = getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
        if (!p.getBoolean(Prefs.VOICE_TIDY, false) || incognito || serverUrl.isBlank() || plainField) return
        val words = typed.trimStart()
        if (words.split(' ').size < 3) return
        Net.rewrite(serverUrl, words, "voice") { tidy ->
            val ic = currentInputConnection ?: return@rewrite
            if (tidy == null || tidy == words) return@rewrite
            val before = ic.getTextBeforeCursor(words.length, 0)?.toString() ?: return@rewrite
            if (before != words) return@rewrite
            ic.beginBatchEdit()
            ic.deleteSurroundingText(words.length, 0)
            ic.commitText(tidy, 1)
            ic.endBatchEdit()
        }
    }

    override fun onVoiceDone(text: String?) {
        val ic = currentInputConnection
        if (ic != null) {
            if (text != null) {
                val typed = startVoicePrefix() + text
                ic.commitText(typed, 1)
                tidyVoice(typed)
            }
            // Nothing more is coming: the words so far stay as typed.
            else if (voicePrefix != null) ic.finishComposingText()
        }
        voicePrefix = null
        translit = Translit.EMPTY
        glideAlts = emptyList()
        lastCorrection = null
        if (text != null) scheduleSuggestions()
    }

    override fun onPanelText(text: String, isEmoji: Boolean) {
        val ic = currentInputConnection ?: return
        translit = Translit.EMPTY
        if (text == "\b") {
            ic.deleteSurroundingTextInCodePoints(1, 0)
            onKeyFeedback()
            return
        }
        if (isEmoji) ic.getTextBeforeCursor(40, 0)?.let { learnEmojiBefore(it, text) }
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

    override fun panelAmharic() = geez
    override fun panelLang() = lang
    override fun panelLangs() = enabledLangs()
    override fun panelVoiceNext() = voiceNext()

    /** A theme was picked in the keyboard's Themes tab: save it and recolour right away. */
    override fun onPanelTheme(id: String) {
        savePref { putString(Prefs.THEME, id) }
        theme = id
        keys.applySettings(look())
        panel.applyTheme(theme)
        panel.themeId = id
        applyFloating()
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
            Toast.makeText(this, UiText.t(this, "This field can't take images, so the link was typed"), Toast.LENGTH_SHORT).show()
            return
        }
        Gifs.fetch(this, item) { uri ->
            val live = currentInputConnection
            if (uri == null || live == null) {
                Toast.makeText(this, UiText.t(this, "Couldn't download that GIF"), Toast.LENGTH_SHORT).show()
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
        val mimes = EditorInfoCompat.getContentMimeTypes(editor)
        val accepts = mimes.any { it == Stickers.MIME || it == "image/*" }
        val asText = "${sticker.emoji} ${sticker.caption}".trim()
        if (sticker.anim != null && sendMoving(sticker, mimes, asText)) return
        if (!accepts) {
            ic.commitText(asText, 1)
            Toast.makeText(this, UiText.t(this, "This app doesn't take stickers here, so it was sent as text"), Toast.LENGTH_SHORT).show()
            return
        }
        Stickers.export(this, sticker) { uri ->
            val live = currentInputConnection ?: return@export
            if (uri == null) { live.commitText(asText, 1); return@export }
            val flags = if (Build.VERSION.SDK_INT >= 25) InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION else 0
            val sent = InputConnectionCompat.commitContent(
                live, editor, InputContentInfoCompat(uri, ClipDescription(sticker.caption.ifEmpty { "Sticker" }, arrayOf(Stickers.MIME)), null), flags, null,
            )
            if (!sent) live.commitText(asText, 1)
        }
    }

    /**
     * Sends a video sticker so it moves: as its own animated WebP where the app
     * names WebP, else as a GIF from the Akai website where the app takes GIFs,
     * else as WebP where it takes any image. False when the app takes none of
     * these, so the still picture goes instead. Falls back to the still if a step fails.
     */
    private fun sendMoving(sticker: Stickers.Sticker, mimes: Array<String>, asText: String): Boolean {
        val editor = info ?: return false
        val webp = "image/webp"
        val any = mimes.any { it == "image/*" || it == "*/*" }
        val gif = sticker.gif != null && (mimes.contains("image/gif") || any)
        fun commit(uri: Uri?, mime: String): Boolean {
            val live = currentInputConnection ?: return true
            if (uri == null) return false
            val flags = if (Build.VERSION.SDK_INT >= 25) InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION else 0
            return InputConnectionCompat.commitContent(
                live, editor, InputContentInfoCompat(uri, ClipDescription("Sticker", arrayOf(mime)), null), flags, null,
            )
        }
        fun still() = sendStill(sticker, asText)
        fun asWebp() = StickerPacks.exportAnimated(this, sticker) { if (!commit(it, webp)) still() }
        when {
            mimes.contains(webp) -> asWebp()
            gif -> StickerPacks.fetchGif(this, sticker) { uri ->
                if (!commit(uri, "image/gif")) { if (any) asWebp() else still() }
            }
            any -> asWebp()
            else -> return false
        }
        return true
    }

    /** The still picture, or the emoji where the app takes no pictures. */
    private fun sendStill(sticker: Stickers.Sticker, asText: String) {
        val editor = info ?: return
        val accepts = EditorInfoCompat.getContentMimeTypes(editor).any { it == Stickers.MIME || it == "image/*" }
        if (!accepts) { currentInputConnection?.commitText(asText, 1); return }
        Stickers.export(this, sticker) { uri ->
            val live = currentInputConnection ?: return@export
            if (uri == null) { live.commitText(asText, 1); return@export }
            val flags = if (Build.VERSION.SDK_INT >= 25) InputConnectionCompat.INPUT_CONTENT_GRANT_READ_URI_PERMISSION else 0
            val sent = InputConnectionCompat.commitContent(
                live, editor, InputContentInfoCompat(uri, ClipDescription("Sticker", arrayOf(Stickers.MIME)), null), flags, null,
            )
            if (!sent) live.commitText(asText, 1)
        }
    }

    private fun readClipboard() {
        if (incognito) return
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
    const val INCOGNITO = "incognito"
    const val FLOATING = "floating"
    const val FLOAT_X = "float_x"
    const val FLOAT_Y = "float_y"
    const val VOICE_TIDY = "voice_tidy"
    const val TIGRINYA = "tigrinya_letters"
    const val TIGRINYA_LANG = "tigrinya_language"
    const val OROMO_LANG = "oromo_language"
    const val AMHARIC_LANG = "amharic_language"
    const val ARABIC_LANG = "arabic_language"
    const val ARABIC_PHONETIC = "arabic_phonetic"
    const val SOMALI_LANG = "somali_language"
    const val LANG = "language"
    const val SHORTCUTS = "text_shortcuts"
    const val LEARNED = "learned_words"
    const val PINNED = "pinned_clips"
    const val ENGLISH_LAYOUT = "english_layout"
    const val AMHARIC_LAYOUT = "amharic_layout"
    /** Which word follows which, and which emoji goes with a word, as the user types. */
    const val LEARNED_PAIRS = "learned_pairs"
    const val LEARNED_EMOJI = "learned_emoji"
    const val HOLD_CLEAR = "hold_backspace_clears"
    const val HOLD_CLEAR_MS = "hold_backspace_ms"
    const val SKIN_TONE = "skin_tone"
    const val EMOJI_COLS = "emoji_columns"
    /** Where handwriting and translation are sent. Blank turns those two off. */
    const val SERVER_URL = "server_url"
    /** The language of the app's own screens (not the typing language). */
    const val UI_LANG = "ui_lang"
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
