package com.akai.nativekb

import android.content.Context
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.PorterDuff
import android.graphics.Region
import android.os.Build
import android.os.SystemClock
import androidx.core.graphics.ColorUtils
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Handler
import android.os.Looper
import android.util.SparseArray
import android.view.MotionEvent
import android.graphics.Rect
import android.os.Bundle
import android.view.View
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.customview.widget.ExploreByTouchHelper
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

// Toolbar buttons. The user picks which show (Settings always does).
const val TOOL_EMOJI = 0
const val TOOL_VOICE = 1
const val TOOL_SETTINGS = 2
const val TOOL_STICKERS = 3
const val TOOL_GIF = 4
const val TOOL_CLIPBOARD = 5
const val TOOL_WRITE = 6
const val TOOL_TRANSLATE = 7
const val TOOL_THEMES = 8

object Tools {
    /** Pref name, icon and spoken name, in the order they appear. */
    val all = listOf(
        Triple(TOOL_EMOJI, "emoji", "😀") to "Emoji",
        Triple(TOOL_STICKERS, "stickers", "🧸") to "Stickers",
        Triple(TOOL_GIF, "gif", "GIF") to "GIFs",
        Triple(TOOL_CLIPBOARD, "clipboard", "📋") to "Clipboard",
        Triple(TOOL_WRITE, "handwriting", "✍️") to "Handwriting",
        Triple(TOOL_TRANSLATE, "translate", "🌐") to "Translate",
        Triple(TOOL_THEMES, "themes", "🎨") to "Themes",
        Triple(TOOL_VOICE, "voice", "🎤") to "Voice typing",
        Triple(TOOL_SETTINGS, "settings", "⚙️") to "Keyboard settings",
    )
    const val DEFAULT = "emoji,voice,settings"

    /** The tools named in a comma list, in toolbar order, always ending with Settings. */
    fun parse(pref: String): IntArray {
        val names = pref.split(',').map { it.trim() }.toSet()
        return all.map { it.first }.filter { it.second in names || it.first == TOOL_SETTINGS }.map { it.first }.toIntArray()
    }
    fun icon(id: Int) = all.first { it.first.first == id }.first.third
    fun spoken(id: Int) = if (id == TOOL_LANGUAGE) "Switch language" else all.first { it.first.first == id }.second
}

/** The language switch, when the user puts it in the toolbar. Never folded away. */
const val TOOL_LANGUAGE = 98

/** How the keys look and behave; set from the user's settings. */
data class KeyLook(
    val theme: String = Themes.DEFAULT,
    val heightPercent: Int = 100,
    val hints: Boolean = true,
    /** 0 off, 1 left hand, 2 right hand. */
    val oneHand: Int = 0,
    /** Width of the one-handed board, as a percentage of the screen. */
    val oneHandWidth: Int = 80,
    val pressAnimation: Boolean = true,
    val longPress: Boolean = true,
    val live: Boolean = true,
    val longPressMs: Int = 330,
    /** Space between keys, in dp. */
    val gap: Int = 5,
    /** Corner radius, in dp. */
    val radius: Int = 8,
    /** Label size, as a percentage of the standard size. */
    val labelSize: Int = 100,
    /** Letter weight, 100 to 900. */
    val weight: Int = 400,
    val borders: Boolean = false,
    /** Swipe across the letters to type a word. */
    val glide: Boolean = true,
)

/** What the keys do; implemented by the input method service. */
interface KeyListener {
    /** Text to type. Called on touch-down, before the finger lifts. */
    fun onText(text: String)
    fun onBackspace()
    fun onEnter()
    fun onSpace()
    fun onShift()
    fun onSymbols()
    fun onLanguage()
    fun onPadAbc()
    fun onPhonetic()
    fun onCursorMove(delta: Int)
    /** A long-press alternate was chosen: replace the letter just typed. */
    fun onReplaceLast(text: String)
    /** A letter from the Amharic vowel row: replace the consonant just typed. */
    fun onVowel(vowel: String)
    fun onSuggestion(word: String)
    /** Backspace was held long enough to wipe the current sentence. */
    fun onClearSentence()
    fun onToolbar(action: Int)
    /** Called after the letter has been sent, so feedback never delays it. */
    fun onKeyFeedback()
    /** A cursor key: home, left, up, down, right or end. */
    fun onCursorKey(dir: String)
    /** A touch turned into a swipe: take back the letter typed when it landed. */
    fun onGlideStart()
    /** The swipe ended. [keys] maps each letter to its key centre, for decoding. */
    fun onGlide(xs: FloatArray, ys: FloatArray, keys: Map<Char, FloatArray>, keyW: Float, shifted: Boolean)
    /** An emoji was tapped in the emoji-search strip. */
    fun onSearchPick(emoji: String)
    fun onSearchClose()
}

/**
 * The whole keyboard, drawn by hand on one canvas. There are no child views,
 * no layout pass per tap and no JavaScript: a touch finds its key from plain
 * arrays and the letter is sent before anything is redrawn.
 */
class KeyboardView(context: Context) : View(context) {

    var listener: KeyListener? = null

    private val density = resources.displayMetrics.density
    private fun dp(v: Float) = v * density

    private val handler = Handler(Looper.getMainLooper())
    private var palette = Themes.palette(context, Themes.DEFAULT)

    private var layout: Layout? = null
    /** Per row, per key: left and right edge in pixels. */
    private var lefts: Array<FloatArray> = emptyArray()
    private var rights: Array<FloatArray> = emptyArray()
    private var rowTop: FloatArray = FloatArray(0)
    private var rowH = 0f
    private var areaLeft = 0f
    private var areaRight = 0f

    // ─── Settings ────────────────────────────────────────────────────────
    private var themeName = Themes.DEFAULT
    private var heightScale = 1f
    private var showHints = true
    /** 0 off, 1 left hand, 2 right hand. */
    private var oneHanded = 0

    private var oneHandWidth = 0.8f

    private var pressAnim = true
    private var liveOn = true
    private var longPressOn = true
    private var longPressMs = 330L
    private var labelScale = 1f
    private var borders = false
    private var glideOn = true
    private var letterFace: Typeface = Typeface.DEFAULT
    private var functionFace: Typeface = Typeface.DEFAULT_BOLD

    private fun face(weight: Int): Typeface =
        if (Build.VERSION.SDK_INT >= 28) Typeface.create(Typeface.DEFAULT, weight.coerceIn(100, 900), false)
        else if (weight >= 600) Typeface.DEFAULT_BOLD else Typeface.DEFAULT

    fun applySettings(look: KeyLook) {
        // A different theme fades in over the old one instead of snapping.
        if (look.theme != themeName) beginCrossfade(240L)
        liveOn = look.live
        pressAnim = look.pressAnimation
        longPressOn = look.longPress
        longPressMs = look.longPressMs.coerceIn(150, 1000).toLong()
        themeName = look.theme
        palette = Themes.palette(context, look.theme)
        cacheValid = false
        heightScale = look.heightPercent.coerceIn(70, 140) / 100f
        showHints = look.hints
        oneHanded = look.oneHand
        oneHandWidth = look.oneHandWidth.coerceIn(50, 95) / 100f
        gapX = dp(look.gap.coerceIn(0, 16).toFloat())
        gapY = gapX + dp(1f)
        radius = dp(look.radius.coerceIn(0, 28).toFloat())
        labelScale = look.labelSize.coerceIn(70, 140) / 100f
        borders = look.borders
        glideOn = look.glide
        letterFace = face(look.weight)
        functionFace = face(max(look.weight, 600))
        setBackgroundColor(palette.background)
        requestLayout()
        computeGeometry(width)
        invalidate()
    }

    /** 0 off, 1 next letter, 2 caps lock. */
    var shiftState = 0
        set(value) {
            if (field != value) { field = value; invalidateCache() }
        }

    /** The vowel forms offered in the Amharic vowel row. */
    private var vowels: List<String> = emptyList()
    fun setVowels(list: List<String>) {
        if (vowels != list) { vowels = list; invalidateCache() }
    }

    private var suggestions: List<String> = emptyList()
    fun setSuggestions(list: List<String>) {
        if (suggestions != list) {
            // Whether the toolbar is folded depends on there being suggestions.
            val folded = TOOL_MORE in shownTools()
            suggestions = list
            toolsOpen = false
            suggestionsAt = SystemClock.uptimeMillis()
            if (folded != TOOL_MORE in shownTools()) invalidateCache() else invalidate()
        }
    }

    private var showStrip = true

    /** Hold backspace this long to delete the sentence; 0 turns it off. */
    var holdClearMs = 0L

    /** Toolbar buttons, left of the suggestions. */
    private var tools = intArrayOf(TOOL_EMOJI, TOOL_VOICE, TOOL_SETTINGS)
    fun setTools(list: IntArray) {
        if (!tools.contentEquals(list)) { tools = list; toolsOpen = false; invalidateCache() }
    }

    /**
     * A long toolbar folds behind one button while there are suggestions, so
     * the words keep their room (as Gboard does); tapping it shows the tools
     * until the suggestions next change.
     */
    private var toolsOpen = false
    private fun foldable() = tools.size > 3
    private fun shownTools(): IntArray {
        val base = if (foldable() && suggestions.isNotEmpty() && !toolsOpen) intArrayOf(TOOL_MORE) else tools
        // The language button stays out of the fold: it is needed mid-sentence.
        return if (langTool != null) intArrayOf(TOOL_LANGUAGE) + base else base
    }

    /** The toolbar's language button label ("EN" or "አማ"), or null when it is not in the toolbar. */
    private var langTool: String? = null
    fun setLanguageTool(label: String?) {
        if (langTool != label) { langTool = label; invalidateCache() }
    }

    /** Hold the space bar, then slide, to switch language. */
    var spaceSwitch = false
    /** Suggestions are hidden while a folded toolbar has been opened. */
    private fun suggestionsShown() = suggestions.isNotEmpty() && !(foldable() && toolsOpen)

    /** Word of the day, on its own row above the toolbar. */
    private var wordOfDay: Pair<String, String>? = null
    fun setWordOfDay(w: Pair<String, String>?) {
        if (wordOfDay == w) return
        val heightChanges = (wordOfDay == null) != (w == null)
        wordOfDay = w
        cacheValid = false
        if (heightChanges) { requestLayout(); computeGeometry(width) }
        invalidate()
    }

    /** Emoji search: the query being typed (null when not searching) and what it found. */
    private var search: String? = null
    private var searchResults: List<String> = emptyList()
    fun setSearch(query: String?, results: List<String>) {
        val modeChanged = (search == null) != (query == null)
        search = query
        searchResults = results
        // Searching hides the word-of-the-day row, which changes the height.
        if (modeChanged) { requestLayout(); computeGeometry(width); invalidateCache() } else invalidate()
    }

    private val stripH = dp(40f)
    private var gapX = dp(5f)
    private var gapY = dp(6f)
    private val padSide = dp(4f)
    private val padTop = dp(6f)
    private val padBottom = dp(6f)
    private var radius = dp(8f)
    /** Toolbar button width: 40 dp, narrower when every button is switched on. */
    private val toolCell get() = min(dp(40f), (width - 2 * padSide - dp(40f)) / max(1, shownTools().size))
    /** The word-of-the-day row's height (nothing when it is off). */
    private val wotdRowH = dp(28f)
    private fun wotdH() = if (showStrip && wordOfDay != null && search == null) wotdRowH else 0f

    /** Where the suggestions start: right of the toolbar buttons. */
    private fun toolsEnd() = padSide + toolCell * shownTools().size
    /** Three suggestions when there is room, fewer when the toolbar is long. */
    private fun suggestionSlots() = ((width - padSide - toolsEnd()) / dp(76f)).toInt().coerceIn(1, 3)

    private val border = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    private val trail = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE; strokeCap = Paint.Cap.ROUND; strokeJoin = Paint.Join.ROUND
    }

    private val fill = Paint(Paint.ANTI_ALIAS_FLAG)
    private val text = Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER }
    private val hintPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.RIGHT }
    private val rect = RectF()

    init {
        isHapticFeedbackEnabled = false // the service vibrates on its own terms
        setBackgroundColor(palette.background)
    }

    fun setLayout(next: Layout, strip: Boolean) {
        // Keys such as ?123 and the language key change the layout on touch-down.
        // Any finger still down refers to a row and column of the old layout, so
        // let it go: when it lifts there is nothing to look up, instead of an
        // index into a layout that may have fewer rows.
        for (i in 0 until touches.size()) {
            touches.valueAt(i).let { t ->
                t.longPress?.let { handler.removeCallbacks(it) }
                t.repeat?.let { handler.removeCallbacks(it) }
            }
        }
        touches.clear()
        pressAnims.clear()
        // Switching boards (letters, symbols, number pad) fades rather than flashes.
        // Only when the height is unchanged, or the old picture would not fit.
        val prev = layout
        if (prev != null && (prev.id != next.id || strip != showStrip) && heightFor(next, strip) == height) beginCrossfade(150L)
        cacheValid = false
        layout = next
        showStrip = strip
        // Height depends on the layout, so ask the parent to measure again.
        requestLayout()
        computeGeometry(width)
        invalidate()
    }

    override fun onConfigurationChanged(newConfig: Configuration?) {
        super.onConfigurationChanged(newConfig)
        palette = Themes.palette(context, themeName)
        setBackgroundColor(palette.background)
        invalidateCache()
    }

    private fun stripHeight() = if (showStrip) wotdH() + stripH else 0f

    /** The height this layout needs, which is also how tall the keyboard will measure. */
    private fun heightFor(l: Layout, strip: Boolean): Int {
        val rows = l.rows.size
        return ((if (strip) wotdH() + stripH else 0f) + padTop + rows * dp(l.rowHeightDp) * heightScale + (rows - 1) * gapY + padBottom).toInt()
    }

    override fun onMeasure(widthSpec: Int, heightSpec: Int) {
        val w = MeasureSpec.getSize(widthSpec)
        val l = layout
        setMeasuredDimension(w, if (l == null) 0 else heightFor(l, showStrip))
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        cacheValid = false
        computeGeometry(w)
    }

    private fun computeGeometry(width: Int) {
        val l = layout ?: return
        if (width <= 0) return
        rowH = dp(l.rowHeightDp) * heightScale
        val top = stripHeight() + padTop
        rowTop = FloatArray(l.rows.size) { top + it * (rowH + gapY) }
        lefts = Array(l.rows.size) { FloatArray(l.rows[it].size) }
        rights = Array(l.rows.size) { FloatArray(l.rows[it].size) }

        val usable = if (oneHanded == 0) width.toFloat() else width * oneHandWidth
        areaLeft = if (oneHanded == 2) width - usable else 0f
        areaRight = areaLeft + usable

        for ((r, row) in l.rows.withIndex()) {
            val totalWeight = row.sumOf { it.weight.toDouble() }.toFloat()
            val avail = usable - 2 * padSide - gapX * (row.size - 1)
            val unit = avail / totalWeight
            var x = areaLeft + padSide
            for ((c, key) in row.withIndex()) {
                lefts[r][c] = x
                x += key.weight * unit
                rights[r][c] = x
                x += gapX
            }
        }
    }

    // ─── Drawing ─────────────────────────────────────────────────────────
    //
    // Everything that does not change while you type (the strip's buttons and
    // every key at rest) is drawn once into a bitmap, and that bitmap is all a
    // frame has to blit. Only what is moving is drawn live: a key being pressed,
    // the long-press bubble, the suggestions fading in, and any crossfade. That
    // keeps a frame cheap enough to animate at the display's full rate, and it
    // is why a tap costs the same however many keys the board has.

    private var cache: Bitmap? = null
    private var cacheCanvas: Canvas? = null
    private var cacheValid = false

    private fun invalidateCache() {
        cacheValid = false
        invalidate()
    }

    // ── Easing, the same curves the Flutter keys use ──
    private fun easeOutCubic(t: Float): Float { val u = 1f - t; return 1f - u * u * u }
    private fun easeOutBack(t: Float): Float { val u = t - 1f; return 1f + 2.70158f * u * u * u + 1.70158f * u * u }

    /** One key's press animation: 0 at rest, 1 fully pressed. */
    private class PressAnim(val r: Int, val c: Int, var start: Long, var from: Float, var to: Float)
    private val pressAnims = ArrayList<PressAnim>(4)

    private fun pressValue(a: PressAnim, now: Long): Float {
        val rising = a.to > a.from
        // Down: 100 ms ease-out. Up: 180 ms ease-out-back, so the key springs past rest and settles.
        val t = ((now - a.start) / (if (rising) 100f else 180f)).coerceIn(0f, 1f)
        return a.from + (a.to - a.from) * (if (rising) easeOutCubic(t) else easeOutBack(t))
    }

    private fun startPress(r: Int, c: Int) {
        val now = SystemClock.uptimeMillis()
        val a = pressAnims.firstOrNull { it.r == r && it.c == c }
        if (a != null) { a.from = pressValue(a, now); a.start = now; a.to = 1f }
        else pressAnims.add(PressAnim(r, c, now, 0f, 1f))
    }

    private fun endPress(r: Int, c: Int) {
        val a = pressAnims.firstOrNull { it.r == r && it.c == c } ?: return
        val now = SystemClock.uptimeMillis()
        a.from = pressValue(a, now); a.start = now; a.to = 0f
    }

    // ── Crossfade between layouts and themes ──
    private var fadeBitmap: Bitmap? = null
    private var fadeStart = 0L
    private var fadeDur = 0L
    private val fadePaint = Paint()

    /** Freezes what is on screen now, so it can fade out over whatever replaces it. */
    private fun beginCrossfade(dur: Long) {
        val src = cache ?: return
        if (!cacheValid || width <= 0 || src.width != width || src.height != height) return
        var fb = fadeBitmap
        if (fb == null || fb.width != src.width || fb.height != src.height) {
            fb?.recycle()
            fb = Bitmap.createBitmap(src.width, src.height, Bitmap.Config.ARGB_8888)
            fadeBitmap = fb
        }
        val cv = Canvas(fb)
        cv.drawColor(palette.background)
        cv.drawBitmap(src, 0f, 0f, null)
        fadeStart = SystemClock.uptimeMillis()
        fadeDur = dur
    }

    private var suggestionsAt = 0L

    private fun ensureCache() {
        val w = width; val h = height
        if (w <= 0 || h <= 0) return
        var bmp = cache
        if (bmp == null || bmp.width != w || bmp.height != h) {
            bmp?.recycle()
            bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            cache = bmp
            cacheCanvas = Canvas(bmp)
            cacheValid = false
        }
        if (!cacheValid) {
            val cv = cacheCanvas ?: return
            cv.drawColor(0, PorterDuff.Mode.CLEAR)
            val l = layout
            if (l != null) {
                if (showStrip && search == null) {
                    wordOfDay?.let { drawWordOfDay(cv, it) }
                    cv.save(); cv.translate(0f, wotdH())
                    drawStripIcons(cv)
                    cv.restore()
                }
                for ((r, row) in l.rows.withIndex()) for ((c, key) in row.withIndex()) {
                    if (key.kind != KeyKind.SPACER) drawKeyBase(cv, key, r, c, 0f)
                }
                drawVowelHint(cv, l)
            }
            cacheValid = true
        }
    }

    override fun onDraw(canvas: Canvas) {
        val l = layout ?: return
        val now = SystemClock.uptimeMillis()
        var animating = false

        if (liveOn && palette.isLive) {
            // The scenes are drawn in logical pixels. Flutter gives them 0..1 over
            // 20 seconds, which leaves most of them all but frozen (flames take
            // 20 s to rise, the rain crawls), so here one unit is 5 seconds:
            // four times Flutter's pace. Every term that grows with time sits in
            // a sine or a modulo, so the clock can run on; it wraps every
            // 10 minutes to keep float precision.
            canvas.save()
            canvas.scale(density, density)
            val live = palette.def.live
            // A picture theme shows its picture; until it has loaded (or if it is
            // missing), the aurora keeps the keyboard from looking empty.
            val pictured = Backdrops.isPicture(live) &&
                Backdrops.draw(context, canvas, width / density, height / density, now, live) { invalidate() }
            FootballScene.attach(context)
            if (!pictured) LiveScenes.paint(canvas, width / density, height / density, (now % 600_000L) / 5000f, live)
            canvas.restore()
        }

        // Drop finished presses before cutting holes for them: a key cut out of
        // the cached board but then not drawn would leave a gap on screen.
        pressAnims.removeAll { a ->
            (a.to == 0f && now - a.start >= 180L) ||
                l.rows.getOrNull(a.r)?.getOrNull(a.c) == null || a.r >= lefts.size || a.c >= lefts[a.r].size
        }

        ensureCache()
        val bmp = cache
        if (bmp != null) {
            // The resting keys, with the ones that are moving cut out so they are not drawn twice.
            val cut = pressAnims.isNotEmpty()
            if (cut) {
                canvas.save()
                for (a in pressAnims) {
                    if (a.r >= lefts.size || a.c >= lefts[a.r].size) continue
                    rect.set(lefts[a.r][a.c] - 2f, rowTop[a.r] - 2f, rights[a.r][a.c] + 2f, rowTop[a.r] + rowH + 2f)
                    if (Build.VERSION.SDK_INT >= 26) canvas.clipOutRect(rect)
                    else @Suppress("DEPRECATION") canvas.clipRect(rect, Region.Op.DIFFERENCE)
                }
            }
            canvas.drawBitmap(bmp, 0f, 0f, null)
            if (cut) canvas.restore()
        }

        // Keys being pressed, drawn live and a little smaller, as in the Flutter keyboard.
        if (pressAnims.isNotEmpty()) {
            for (a in pressAnims) {
                val key = l.rows[a.r][a.c]
                val p = pressValue(a, now)
                val cx = (lefts[a.r][a.c] + rights[a.r][a.c]) / 2f
                val cy = rowTop[a.r] + rowH / 2f
                val s = if (pressAnim) 1f - 0.07f * p else 1f
                canvas.save()
                canvas.scale(s, s, cx, cy)
                drawKeyBase(canvas, key, a.r, a.c, p.coerceIn(0f, 1f))
                canvas.restore()
                // A key still held has settled at fully pressed; only a moving one needs frames.
                if (!(a.to == 1f && now - a.start >= 100L)) animating = true
            }
        }

        if (showStrip) {
            canvas.save()
            canvas.translate(0f, wotdH())
            if (search != null) {
                drawSearch(canvas)
            } else if (suggestionsShown()) {
                val ft = ((now - suggestionsAt) / 120f).coerceIn(0f, 1f)
                drawSuggestions(canvas, 0.35f + 0.65f * easeOutCubic(ft))
                if (ft < 1f) animating = true
            }
            canvas.restore()
        }

        // The swipe's trail, fading toward its tail.
        for (i in 0 until touches.size()) {
            val t = touches.valueAt(i)
            if (!t.gliding || t.n < 2) continue
            trail.strokeWidth = dp(6f)
            val from = max(1, t.n - 60)
            for (j in from until t.n) {
                trail.color = palette.accent
                trail.alpha = (60 + 160 * (j - from) / max(1, t.n - from)).coerceIn(0, 255)
                canvas.drawLine(t.xs[j - 1], t.ys[j - 1], t.xs[j], t.ys[j], trail)
            }
        }

        for (i in 0 until touches.size()) {
            val t = touches.valueAt(i)
            if (t.popup != null && drawPopup(canvas, t, now)) animating = true
            if (t.langArmed) drawSpaceArmed(canvas, t)
        }

        if (fadeDur > 0L) {
            val ft = (now - fadeStart) / fadeDur.toFloat()
            val fb = fadeBitmap
            if (ft < 1f && fb != null) {
                fadePaint.alpha = ((1f - easeOutCubic(ft)) * 255f).toInt().coerceIn(0, 255)
                canvas.drawBitmap(fb, 0f, 0f, fadePaint)
                animating = true
            } else fadeDur = 0L
        }

        if (animating) postInvalidateOnAnimation()
        // The live scene keeps moving while you type; the board is a cached
        // bitmap, so a scene frame is cheap and never holds up a keystroke.
        else if (liveOn && palette.isLive) postInvalidateDelayed(33L)
    }

    private fun drawStripIcons(canvas: Canvas) {
        text.textAlign = Paint.Align.CENTER
        text.color = palette.text
        text.alpha = 255
        val cell = toolCell
        for ((i, id) in shownTools().withIndex()) {
            val cx = padSide + cell * (i + 0.5f)
            if (id == TOOL_LANGUAGE) {
                // The language it switches to, in a soft pill so it reads as a button.
                val label = langTool ?: continue
                rect.set(cx - cell * 0.44f, stripH * 0.22f, cx + cell * 0.44f, stripH * 0.78f)
                fill.color = palette.special
                canvas.drawRoundRect(rect, rect.height() / 2f, rect.height() / 2f, fill)
                text.typeface = Typeface.DEFAULT_BOLD
                text.textSize = min(stripH * 0.32f, cell * 0.36f)
                text.color = palette.specialText
                canvas.drawText(label, cx, stripH / 2f - (text.descent() + text.ascent()) / 2f, text)
                text.color = palette.text
                continue
            }
            Icons.draw(canvas, id, cx, stripH / 2f, min(dp(23f), cell * 0.62f), palette.text)
        }
    }

    private fun stripBaseline() = stripH / 2f - (text.descent() + text.ascent()) / 2f

    /** The row above the toolbar: "✦ WORD OF THE DAY  Resilient  Able to withstand…". */
    private fun drawWordOfDay(canvas: Canvas, w: Pair<String, String>) {
        val h = wotdRowH
        var x = padSide + dp(8f)
        val right = width - padSide - dp(8f)
        text.textAlign = Paint.Align.LEFT
        text.alpha = 255
        fun base() = h / 2f - (text.descent() + text.ascent()) / 2f
        text.typeface = Typeface.DEFAULT_BOLD
        text.textSize = h * 0.36f
        text.color = palette.hint
        val tag = "✦ WORD OF THE DAY"
        canvas.drawText(tag, x, base(), text)
        x += text.measureText(tag) + dp(10f)
        text.textSize = h * 0.5f
        text.color = palette.text
        val word = ellipsize(w.first, right - x)
        canvas.drawText(word, x, base(), text)
        x += text.measureText(word) + dp(8f)
        if (x < right - dp(30f)) {
            text.typeface = Typeface.DEFAULT
            text.textSize = h * 0.4f
            text.color = palette.hint
            canvas.drawText(ellipsize(w.second, right - x), x, base(), text)
        }
        // A hairline separates it from the toolbar.
        fill.color = palette.hint
        fill.alpha = 60
        canvas.drawRect(padSide, h - 1f, width - padSide, h, fill)
        fill.alpha = 255
        text.textAlign = Paint.Align.CENTER
    }

    /** ✕, the query with a caret, then the matching emoji. */
    private fun searchBoxEnd() = padSide + toolCell + width * 0.34f

    private fun drawSearch(canvas: Canvas) {
        val q = search ?: return
        text.textAlign = Paint.Align.CENTER
        text.typeface = Typeface.DEFAULT
        text.alpha = 255
        text.color = palette.text
        text.textSize = stripH * 0.42f
        canvas.drawText("✕", padSide + toolCell / 2f, stripBaseline(), text)

        rect.set(padSide + toolCell, dp(5f), searchBoxEnd(), stripH - dp(5f))
        fill.color = palette.key
        canvas.drawRoundRect(rect, rect.height() / 2f, rect.height() / 2f, fill)
        text.textAlign = Paint.Align.LEFT
        text.textSize = stripH * 0.34f
        val shown = if (q.isEmpty()) "Search emoji" else "$q▏"
        text.color = if (q.isEmpty()) palette.hint else palette.text
        val inner = rect.width() - dp(36f)
        // Long queries show their end, which is where the typing is.
        var s = shown
        while (s.length > 1 && text.measureText(s) > inner) s = s.substring(1)
        canvas.drawText("🔍 $s", rect.left + dp(10f), stripBaseline(), text)

        text.textAlign = Paint.Align.CENTER
        text.textSize = stripH * 0.55f
        text.color = palette.text
        if (searchResults.isEmpty() && q.isNotEmpty()) {
            text.textSize = stripH * 0.3f
            text.color = palette.hint
            canvas.drawText("No emoji found", (searchBoxEnd() + width) / 2f, stripBaseline(), text)
            return
        }
        for ((i, e) in searchResults.withIndex()) {
            val cx = searchBoxEnd() + dp(4f) + toolCell * (i + 0.5f)
            if (cx + toolCell / 2f > width) break
            canvas.drawText(e, cx, stripBaseline(), text)
        }
    }

    private fun drawSuggestions(canvas: Canvas, alpha: Float) {
        val start = toolsEnd()
        val each = (this.width - padSide - start) / suggestionSlots()
        text.textAlign = Paint.Align.CENTER
        text.typeface = Typeface.DEFAULT
        text.textSize = stripH * 0.4f
        text.color = palette.text
        text.alpha = (alpha * 255f).toInt()
        fill.color = palette.hint
        fill.alpha = (alpha * 255f * 0.6f).toInt()
        for ((i, word) in suggestions.take(suggestionSlots()).withIndex()) {
            val cx = start + each * (i + 0.5f)
            if (i > 0) canvas.drawRect(start + each * i - 0.5f, stripH * 0.25f, start + each * i + 0.5f, stripH * 0.75f, fill)
            canvas.drawText(ellipsize(word, each - dp(8f)), cx, stripH / 2f - (text.descent() + text.ascent()) / 2f, text)
        }
        text.alpha = 255
        fill.alpha = 255
    }

    private fun ellipsize(s: String, maxWidth: Float): String {
        if (text.measureText(s) <= maxWidth) return s
        var n = s.length
        while (n > 1 && text.measureText(s, 0, n) + text.measureText("…") > maxWidth) n--
        return s.substring(0, n) + "…"
    }

    /** The empty vowel row says what it is for, until a letter is tapped. */
    private fun drawVowelHint(canvas: Canvas, l: Layout) {
        if (l.id != LayoutId.FIDEL || vowels.isNotEmpty()) return
        text.textAlign = Paint.Align.CENTER
        text.textSize = rowH * 0.3f
        text.color = palette.hint
        text.typeface = Typeface.DEFAULT
        canvas.drawText("Tap a letter to see its vowel forms", (areaLeft + areaRight) / 2f,
            rowTop[0] + rowH / 2f - (text.descent() + text.ascent()) / 2f, text)
    }

    /** Draws one key. [mix] blends its colour toward the pressed colour (0 at rest, 1 pressed). */
    private fun drawKeyBase(canvas: Canvas, key: Key, r: Int, c: Int, mix: Float) {
        val vowelLabel = if (key.kind == KeyKind.VOWEL) vowels.getOrNull(c).orEmpty() else null
        if (vowelLabel != null && vowelLabel.isEmpty()) return // an empty vowel slot is just a gap

        rect.set(lefts[r][c], rowTop[r], rights[r][c], rowTop[r] + rowH)
        val accent = key.kind == KeyKind.ENTER
        // Same three kinds of key as the Flutter keyboard: ordinary, function, and the Enter key.
        val rest = when { accent -> palette.keyAccent; key.special -> palette.special; else -> palette.key }
        val down = when { accent -> palette.accentPressed; key.special -> palette.specialPressed; else -> palette.pressed }
        fill.color = if (mix > 0f) ColorUtils.blendARGB(rest, down, mix) else rest
        canvas.drawRoundRect(rect, radius, radius, fill)
        if (borders) {
            border.strokeWidth = dp(1f)
            border.color = ColorUtils.setAlphaComponent(palette.text, 0x40)
            val inset = border.strokeWidth / 2f
            rect.inset(inset, inset)
            canvas.drawRoundRect(rect, radius, radius, border)
            rect.inset(-inset, -inset)
        }

        val icon = when (key.kind) {
            KeyKind.SHIFT -> when (shiftState) { 0 -> KEY_SHIFT; 1 -> KEY_SHIFT_ONCE; else -> KEY_CAPS_LOCK }
            KeyKind.BACKSPACE -> KEY_BACKSPACE
            else -> -1
        }
        if (icon >= 0) {
            val color = if (key.special) palette.specialText else palette.text
            val size = min(rowH * 0.5f * labelScale, rect.width() * 0.6f)
            Icons.draw(canvas, icon, rect.centerX(), rect.centerY(), size, color)
            return
        }

        var label = vowelLabel ?: key.label
        if (key.cased && shiftState > 0) label = label.uppercase()

        val pad = layout?.isPad == true
        val big = key.kind == KeyKind.CHAR && pad && !key.special
        text.textAlign = Paint.Align.CENTER
        text.alpha = 255
        text.textSize = labelScale * when {
            key.kind == KeyKind.SPACE -> rowH * 0.26f
            key.kind == KeyKind.VOWEL -> rowH * 0.5f
            key.kind == KeyKind.CURSOR -> rowH * 0.34f
            key.kind != KeyKind.CHAR -> rowH * if (pad) 0.34f else 0.3f
            big -> rowH * 0.5f
            layout?.id == LayoutId.FIDEL -> rowH * 0.46f
            else -> rowH * 0.44f
        }
        text.color = when {
            accent -> palette.accentText
            key.special -> palette.specialText
            else -> palette.text
        }
        text.typeface = if (key.kind == KeyKind.CHAR || key.kind == KeyKind.VOWEL) letterFace else functionFace

        // A hint sits in the corner, so push the letter down a touch to keep
        // the two from ever touching.
        val hint = if (showHints) key.hint else null
        val lift = if (hint != null) dp(2f) else 0f
        val baseline = rect.centerY() - (text.descent() + text.ascent()) / 2f + lift
        canvas.drawText(label, rect.centerX(), baseline, text)

        if (hint != null) {
            hintPaint.textSize = rowH * 0.2f
            hintPaint.color = palette.hint
            canvas.drawText(hint, rect.right - dp(4f), rect.top + dp(2f) - hintPaint.ascent(), hintPaint)
        }
    }

    /** Draws the long-press bubble, popping in. Returns true while it is still moving. */
    private fun drawPopup(canvas: Canvas, t: Touch, now: Long): Boolean {
        val alts = t.popup ?: return false
        val k = easeOutCubic(((now - t.popupAt) / 110f).coerceIn(0f, 1f))
        val top = rowTop[t.popupRow]
        val cx = t.popupLeft + t.popupCell * alts.size / 2f
        canvas.save()
        // Grows from the key it came from, and fades in as it goes.
        canvas.scale(0.86f + 0.14f * k, 0.86f + 0.14f * k, cx, top + rowH)
        rect.set(t.popupLeft - 2f, top - 2f, t.popupLeft + t.popupCell * alts.size + 2f, top + rowH + 2f)
        val layer = canvas.saveLayerAlpha(rect, (k * 255f).toInt().coerceIn(0, 255))
        rect.set(t.popupLeft, top, t.popupLeft + t.popupCell * alts.size, top + rowH)
        fill.color = palette.popup
        canvas.drawRoundRect(rect, radius, radius, fill)
        for ((i, alt) in alts.withIndex()) {
            val ax = t.popupLeft + t.popupCell * (i + 0.5f)
            if (i == t.popupSel) {
                rect.set(ax - t.popupCell / 2f + dp(2f), top + dp(3f), ax + t.popupCell / 2f - dp(2f), top + rowH - dp(3f))
                fill.color = palette.accent
                canvas.drawRoundRect(rect, radius, radius, fill)
            }
            text.color = if (i == t.popupSel) palette.accentText else palette.text
            text.textSize = rowH * 0.46f
            text.typeface = Typeface.DEFAULT
            text.alpha = 255
            canvas.drawText(alt, ax, top + rowH / 2f - (text.descent() + text.ascent()) / 2f, text)
        }
        canvas.restoreToCount(layer)
        canvas.restore()
        return k < 1f
    }

    // ─── Touch ───────────────────────────────────────────────────────────

    private class Touch(val id: Int) {
        var row = 0
        var col = 0
        var lastX = 0f
        var swiped = false
        /** Space held long enough: sliding now switches language. [armX] is where it was armed. */
        var langArmed = false
        var armX = 0f
        var curX = 0f
        var popup: List<String>? = null
        var popupSel = -1
        var popupRow = 0
        var popupLeft = 0f
        var popupCell = 0f
        var popupAt = 0L
        var longPress: Runnable? = null
        var repeat: Runnable? = null
        /** A long press already acted, so the release must not. */
        var longFired = false

        // Swipe typing: the finger's path, once it may be a swipe.
        var canGlide = false
        var gliding = false
        var shifted = false
        var downX = 0f
        var downY = 0f
        var xs = FloatArray(64)
        var ys = FloatArray(64)
        var n = 0
        fun addPoint(x: Float, y: Float) {
            if (n == xs.size) { xs = xs.copyOf(n * 2); ys = ys.copyOf(n * 2) }
            xs[n] = x; ys[n] = y; n++
        }
    }

    private val touches = SparseArray<Touch>()

    /** Finds the key under a point. Gaps belong to the nearest key, so there are no dead zones. */
    private fun findRow(y: Float): Int {
        for (r in rowTop.indices) if (y < rowTop[r] + rowH + gapY / 2f) return r
        return rowTop.size - 1
    }

    private fun findCol(r: Int, x: Float): Int {
        val row = layout!!.rows[r]
        var c = row.size - 1
        for (i in row.indices) if (x < rights[r][i] + gapX / 2f) { c = i; break }
        // A spacer is only padding: hand its area to the neighbouring key.
        if (row[c].kind == KeyKind.SPACER) c = if (c == 0) c + 1 else c - 1
        return c
    }

    override fun onTouchEvent(e: MotionEvent): Boolean {
        val l = layout ?: return false
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN, MotionEvent.ACTION_POINTER_DOWN -> {
                val i = e.actionIndex
                val x = e.getX(i)
                val y = e.getY(i)
                when {
                    showStrip && y < wotdH() -> wordOfDay?.let { listener?.onSuggestion(it.first); listener?.onKeyFeedback() }
                    showStrip && y < wotdH() + stripH + padTop / 2f -> stripTap(x)
                    else -> down(e.getPointerId(i), x, y, l)
                }
            }
            MotionEvent.ACTION_MOVE -> {
                for (i in 0 until e.pointerCount) {
                    val id = e.getPointerId(i)
                    // A swipe wants every point the screen reported, not just the latest.
                    val t = touches.get(id)
                    if (t != null && t.canGlide) for (h in 0 until e.historySize) t.addPoint(e.getHistoricalX(i, h), e.getHistoricalY(i, h))
                    move(id, e.getX(i), e.getY(i), l)
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_POINTER_UP -> {
                up(e.getPointerId(e.actionIndex), l, cancelled = false)
            }
            MotionEvent.ACTION_CANCEL -> {
                for (i in touches.size() - 1 downTo 0) up(touches.keyAt(i), l, cancelled = true)
            }
        }
        return true
    }

    private fun stripTap(x: Float) {
        if (search != null) {
            when {
                x < padSide + toolCell -> listener?.onSearchClose()
                x > searchBoxEnd() + dp(4f) -> {
                    val i = ((x - searchBoxEnd() - dp(4f)) / toolCell).toInt()
                    searchResults.getOrNull(i)?.let { listener?.onSearchPick(it) }
                }
                else -> return
            }
            listener?.onKeyFeedback()
            return
        }
        val end = toolsEnd()
        val shown = shownTools()
        if (x < end) {
            val id = shown[((x - padSide) / toolCell).toInt().coerceIn(0, shown.size - 1)]
            if (id == TOOL_MORE) { toolsOpen = true; invalidateCache() } else listener?.onToolbar(id)
            listener?.onKeyFeedback()
        } else if (suggestionsShown()) {
            val each = (width - padSide - end) / suggestionSlots()
            val i = ((x - end) / each).toInt()
            suggestions.getOrNull(i)?.let { listener?.onSuggestion(it) }
            listener?.onKeyFeedback()
        }
    }

    /** A held cursor key keeps moving, faster the longer it is held. */
    private fun startRepeat(t: Touch, action: () -> Unit) {
        var delay = REPEAT_START_MS
        val run = object : Runnable {
            override fun run() {
                action()
                listener?.onKeyFeedback()
                delay = max(REPEAT_MIN_MS * 2, delay - 6L)
                handler.postDelayed(this, delay)
            }
        }
        t.repeat = run
        handler.postDelayed(run, REPEAT_FIRST_MS)
    }

    /** Boards that can switch language (the symbol and number boards cannot). */
    private fun hasLanguage(l: Layout) = l.id == LayoutId.LETTERS || l.id == LayoutId.PHONETIC || l.id == LayoutId.FIDEL

    /** A held space bar, ready to switch language: an accent outline and arrows at both ends. */
    private fun drawSpaceArmed(canvas: Canvas, t: Touch) {
        rect.set(lefts[t.row][t.col], rowTop[t.row], rights[t.row][t.col], rowTop[t.row] + rowH)
        border.strokeWidth = dp(2f)
        border.color = palette.accent
        canvas.drawRoundRect(rect, radius, radius, border)
        text.textAlign = Paint.Align.CENTER
        text.typeface = Typeface.DEFAULT_BOLD
        text.textSize = rowH * 0.4f
        text.color = palette.accent
        text.alpha = 255
        val base = rect.centerY() - (text.descent() + text.ascent()) / 2f
        canvas.drawText("◀", rect.left + dp(16f), base, text)
        canvas.drawText("▶", rect.right - dp(16f), base, text)
    }

    /** Letter key centres of the current board, for decoding a swipe. */
    private fun letterCentres(l: Layout): Map<Char, FloatArray> {
        val m = HashMap<Char, FloatArray>()
        for ((r, row) in l.rows.withIndex()) for ((c, k) in row.withIndex()) {
            if (k.kind == KeyKind.CHAR && k.cased && k.output.length == 1) {
                m[k.output[0]] = floatArrayOf((lefts[r][c] + rights[r][c]) / 2f, rowTop[r] + rowH / 2f)
            }
        }
        return m
    }

    private fun down(id: Int, x: Float, y: Float, l: Layout) {
        val r = findRow(y)
        val c = findCol(r, x)
        val key = l.rows[r][c]
        val t = Touch(id).also { it.row = r; it.col = c; it.lastX = x }
        touches.put(id, t)
        if (key.kind != KeyKind.SPACER) startPress(r, c)

        var feedback = true
        val shifted = key.cased && shiftState > 0
        when (key.kind) {
            KeyKind.CHAR -> {
                // The letter goes out now, on touch-down, not on release.
                listener?.onText(if (shifted) key.output.uppercase() else key.output)
                if (key.alternates.isNotEmpty() && longPressOn) {
                    val run = Runnable { showPopup(t, key, r, c) }
                    t.longPress = run
                    handler.postDelayed(run, longPressMs)
                }
                // English letters may turn out to be the start of a swipe.
                if (glideOn && l.id == LayoutId.LETTERS && key.cased && id != A11Y_TOUCH && search == null) {
                    t.canGlide = true
                    t.shifted = shifted
                    t.downX = x; t.downY = y
                    t.addPoint(x, y)
                }
            }
            KeyKind.CURSOR -> {
                listener?.onCursorKey(key.output)
                if (key.output != "home" && key.output != "end") startRepeat(t) { listener?.onCursorKey(key.output) }
            }
            KeyKind.VOWEL -> {
                val v = vowels.getOrNull(c).orEmpty()
                if (v.isEmpty()) feedback = false else listener?.onVowel(v)
            }
            KeyKind.BACKSPACE -> {
                listener?.onBackspace()
                var delay = REPEAT_START_MS
                val heldSince = System.currentTimeMillis()
                val run = object : Runnable {
                    override fun run() {
                        if (holdClearMs > 0 && System.currentTimeMillis() - heldSince >= holdClearMs) {
                            // Held long enough: wipe the sentence once and stop repeating.
                            listener?.onClearSentence()
                            listener?.onKeyFeedback()
                            return
                        }
                        listener?.onBackspace()
                        listener?.onKeyFeedback()
                        // Speeds up the longer it is held.
                        delay = max(REPEAT_MIN_MS, delay - 8L)
                        handler.postDelayed(this, delay)
                    }
                }
                t.repeat = run
                handler.postDelayed(run, REPEAT_FIRST_MS)
            }
            KeyKind.ENTER -> listener?.onEnter()
            KeyKind.SHIFT -> listener?.onShift()
            KeyKind.SYMBOLS -> listener?.onSymbols()
            KeyKind.LANGUAGE -> {
                // Tap switches language on release; a long press flips Amharic
                // between the fidel board and phonetic typing.
                feedback = false
                val run = Runnable { t.longPress = null; t.longFired = true; listener?.onPhonetic(); listener?.onKeyFeedback() }
                t.longPress = run
                handler.postDelayed(run, longPressMs + 120L)
            }
            KeyKind.PAD_ABC -> listener?.onPadAbc()
            KeyKind.PHONETIC -> listener?.onPhonetic()
            KeyKind.SPACE -> {
                feedback = false // waits for lift, in case this is a cursor swipe
                t.curX = x
                if (spaceSwitch && hasLanguage(l) && search == null && id != A11Y_TOUCH) {
                    // Held still a moment: the next slide switches language instead of moving the cursor.
                    val run = Runnable {
                        t.longPress = null
                        if (!t.swiped) {
                            t.langArmed = true
                            t.armX = t.curX
                            listener?.onKeyFeedback()
                            invalidate()
                        }
                    }
                    t.longPress = run
                    handler.postDelayed(run, longPressMs + 120L)
                }
            }
            KeyKind.SPACER -> feedback = false
        }
        // Feedback is last, so the vibration never delays the letter.
        if (feedback) listener?.onKeyFeedback()
        invalidate()
    }

    private fun move(id: Int, x: Float, y: Float, l: Layout) {
        val t = touches.get(id) ?: return
        val key = l.rows[t.row][t.col]

        val alts = t.popup
        if (alts != null) {
            val sel = ((x - t.popupLeft) / t.popupCell).toInt()
            val next = if (sel in alts.indices) sel else -1
            if (next != t.popupSel) { t.popupSel = next; invalidate() }
            return
        }

        if (t.canGlide) {
            t.addPoint(x, y)
            val keyW = rights[t.row][t.col] - lefts[t.row][t.col]
            if (!t.gliding && kotlin.math.hypot(x - t.downX, y - t.downY) > keyW * 0.8f) {
                // Moved well off the key: this is a swipe, not a tap.
                t.gliding = true
                t.longPress?.let { handler.removeCallbacks(it) }
                t.longPress = null
                endPress(t.row, t.col)
                listener?.onGlideStart()
            }
            if (t.gliding) { invalidate(); return }
        }

        if (key.kind == KeyKind.SPACE) {
            t.curX = x
            if (t.langArmed) {
                if (abs(x - t.armX) >= dp(24f)) {
                    // Either direction switches: there are two languages. The new
                    // layout lets this finger go, so nothing more happens on lift.
                    t.langArmed = false
                    t.swiped = true
                    listener?.onLanguage()
                    listener?.onKeyFeedback()
                }
                return
            }
            val step = dp(14f)
            while (abs(x - t.lastX) >= step) {
                val dir = if (x > t.lastX) 1 else -1
                t.lastX += dir * step
                t.swiped = true
                // A cursor swipe has begun, so holding no longer arms the language switch.
                t.longPress?.let { handler.removeCallbacks(it); t.longPress = null }
                listener?.onCursorMove(dir)
            }
        } else if (t.longPress != null && (x < lefts[t.row][t.col] - gapX || x > rights[t.row][t.col] + gapX)) {
            // Slid off the key: it is not going to be a long press.
            handler.removeCallbacks(t.longPress!!)
            t.longPress = null
        }
    }

    private fun up(id: Int, l: Layout, cancelled: Boolean) {
        val t = touches.get(id) ?: return
        val key = l.rows[t.row][t.col]
        t.longPress?.let { handler.removeCallbacks(it) }
        t.repeat?.let { handler.removeCallbacks(it) }

        val alts = t.popup
        if (t.gliding) {
            if (!cancelled) {
                val keyW = rights[t.row][t.col] - lefts[t.row][t.col]
                listener?.onGlide(t.xs.copyOf(t.n), t.ys.copyOf(t.n), letterCentres(l), keyW, t.shifted)
            }
        } else if (!cancelled) {
            if (alts != null && t.popupSel >= 0) {
                listener?.onReplaceLast(alts[t.popupSel])
            } else if (key.kind == KeyKind.LANGUAGE && !t.longFired) {
                listener?.onLanguage()
                listener?.onKeyFeedback()
            } else if (key.kind == KeyKind.SPACE && !t.swiped && !t.langArmed) {
                // (Armed and lifted without sliding: a change of mind, so no space.)
                listener?.onSpace()
                listener?.onKeyFeedback()
            }
        }
        touches.remove(id)
        endPress(t.row, t.col)
        invalidate()
    }

    private fun showPopup(t: Touch, key: Key, r: Int, c: Int) {
        t.longPress = null
        val alts = key.alternates.let { if (shiftState > 0 && key.cased) it.map { a -> a.uppercase() } else it }
        val maxCell = dp(46f)
        val cell = min(maxCell, (areaRight - areaLeft - 2 * padSide) / alts.size)
        val keyCx = (lefts[r][c] + rights[r][c]) / 2f
        val total = cell * alts.size
        t.popup = alts
        t.popupCell = cell
        t.popupLeft = (keyCx - total / 2f).coerceIn(areaLeft + padSide, max(areaLeft + padSide, areaRight - padSide - total))
        // The bubble covers the row above the key, or its own row at the top.
        t.popupRow = max(r - 1, 0)
        t.popupSel = -1
        t.popupAt = SystemClock.uptimeMillis()
        listener?.onKeyFeedback()
        invalidate()
    }

    // ─── Accessibility (TalkBack) ────────────────────────────────────────
    // The keys are drawn, not views, so describe them to the screen reader.

    private val a11y = object : ExploreByTouchHelper(this) {
        private fun stripId(i: Int) = STRIP_ID + i

        override fun getVirtualViewAt(x: Float, y: Float): Int {
            val l = layout ?: return INVALID_ID
            if (showStrip && y < wotdH()) return WOTD_ID
            if (showStrip && y < wotdH() + stripH + padTop / 2f) {
                if (search != null) return INVALID_ID
                val end = toolsEnd()
                val n = shownTools().size
                val shown = if (suggestionsShown()) min(suggestions.size, suggestionSlots()) else 0
                return if (x < end) {
                    stripId(((x - padSide) / toolCell).toInt().coerceIn(0, n - 1))
                } else if (shown > 0) {
                    val each = (width - padSide - end) / suggestionSlots()
                    stripId(n + ((x - end) / each).toInt().coerceIn(0, shown - 1))
                } else INVALID_ID
            }
            val r = findRow(y)
            val c = findCol(r, x)
            return if (l.rows[r][c].kind == KeyKind.SPACER) INVALID_ID else r * 100 + c
        }

        override fun getVisibleVirtualViews(ids: MutableList<Int>) {
            val l = layout ?: return
            if (showStrip && search == null) {
                if (wotdH() > 0f) ids.add(WOTD_ID)
                val n = shownTools().size
                for (i in 0 until n) ids.add(stripId(i))
                if (suggestionsShown()) for (i in 0 until min(suggestions.size, suggestionSlots())) ids.add(stripId(n + i))
            }
            for ((r, row) in l.rows.withIndex()) for ((c, k) in row.withIndex()) {
                val emptyVowel = k.kind == KeyKind.VOWEL && vowels.getOrNull(c).isNullOrEmpty()
                if (k.kind != KeyKind.SPACER && !emptyVowel) ids.add(r * 100 + c)
            }
        }

        override fun onPopulateNodeForVirtualView(id: Int, node: AccessibilityNodeInfoCompat) {
            val b = Rect()
            val top = wotdH().toInt()
            if (id == WOTD_ID) {
                node.contentDescription = wordOfDay?.let { "Word of the day: ${it.first}, ${it.second}" } ?: ""
                b.set(0, 0, width, top)
            } else if (id >= STRIP_ID) {
                val i = id - STRIP_ID
                val shown = shownTools()
                if (i < shown.size) {
                    node.contentDescription = if (shown[i] == TOOL_MORE) "Show toolbar" else Tools.spoken(shown[i])
                    b.set((padSide + toolCell * i).toInt(), top, (padSide + toolCell * (i + 1)).toInt(), top + stripH.toInt())
                } else {
                    val end = toolsEnd()
                    val each = (width - padSide - end) / suggestionSlots()
                    val k = i - shown.size
                    node.contentDescription = "Suggestion: " + suggestions.getOrElse(k) { "" }
                    b.set((end + each * k).toInt(), top, (end + each * (k + 1)).toInt(), top + stripH.toInt())
                }
            } else {
                val l = layout
                if (l != null) {
                    val r = id / 100
                    val c = id % 100
                    node.contentDescription = describe(l.rows[r][c], c)
                    b.set(lefts[r][c].toInt(), rowTop[r].toInt(), rights[r][c].toInt(), (rowTop[r] + rowH).toInt())
                }
            }
            node.setBoundsInParent(b)
            node.addAction(AccessibilityNodeInfoCompat.AccessibilityActionCompat.ACTION_CLICK)
        }

        override fun onPerformActionForVirtualView(id: Int, action: Int, args: Bundle?): Boolean {
            if (action != AccessibilityNodeInfo.ACTION_CLICK) return false
            val l = layout ?: return false
            if (id == WOTD_ID) {
                wordOfDay?.let { listener?.onSuggestion(it.first) }
            } else if (id >= STRIP_ID) {
                val i = id - STRIP_ID
                val shown = shownTools()
                if (i < shown.size) {
                    if (shown[i] == TOOL_MORE) { toolsOpen = true; invalidateCache() } else listener?.onToolbar(shown[i])
                } else suggestions.getOrNull(i - shown.size)?.let { listener?.onSuggestion(it) }
            } else {
                val r = id / 100
                val c = id % 100
                down(A11Y_TOUCH, (lefts[r][c] + rights[r][c]) / 2f, rowTop[r] + rowH / 2f, l)
                up(A11Y_TOUCH, l, cancelled = false)
            }
            return true
        }
    }

    private fun describe(key: Key, col: Int): String = when (key.kind) {
        KeyKind.CHAR -> (if (key.cased && shiftState > 0) key.label.uppercase() else key.label).let {
            when (it) {
                "," -> "comma"
                "." -> "period"
                "።" -> "Amharic full stop"
                "፣" -> "Amharic comma"
                else -> it
            }
        }
        KeyKind.SHIFT -> when (shiftState) { 0 -> "Shift"; 1 -> "Shift, on for next letter"; else -> "Caps lock on" }
        KeyKind.BACKSPACE -> "Backspace"
        KeyKind.ENTER -> if (key.label == "↵") "Enter" else key.label
        KeyKind.SPACE -> "Space"
        KeyKind.SYMBOLS -> if (key.label == "ABC" || key.label == "አማ") "Letters" else "Numbers and symbols"
        KeyKind.LANGUAGE -> "Switch language"
        KeyKind.PAD_ABC -> if (key.label == "123") "Number pad" else "Letters"
        KeyKind.PHONETIC -> if (key.label == "ABC") "Phonetic Amharic" else "Fidel board"
        KeyKind.VOWEL -> vowels.getOrNull(col).orEmpty()
        KeyKind.CURSOR -> when (key.output) {
            "home" -> "Start of line"; "end" -> "End of line"; else -> "Cursor ${key.output}"
        }
        KeyKind.SPACER -> ""
    }

    init {
        ViewCompat.setAccessibilityDelegate(this, a11y)
    }

    override fun dispatchHoverEvent(event: MotionEvent): Boolean =
        a11y.dispatchHoverEvent(event) || super.dispatchHoverEvent(event)

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        handler.removeCallbacksAndMessages(null)
        touches.clear()
    }

    private companion object {
        const val REPEAT_FIRST_MS = 380L
        const val REPEAT_START_MS = 70L
        const val REPEAT_MIN_MS = 28L
        const val STRIP_ID = 10000
        const val WOTD_ID = 9999
        const val A11Y_TOUCH = -1000
    }
}
