package com.akai.nativekb

import android.content.Context
import android.content.res.Configuration
import android.graphics.Canvas
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

const val TOOL_EMOJI = 0
const val TOOL_VOICE = 1
const val TOOL_SETTINGS = 2

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
    private var palette = Themes.palette(context, "system")

    private var layout: Layout? = null
    /** Per row, per key: left and right edge in pixels. */
    private var lefts: Array<FloatArray> = emptyArray()
    private var rights: Array<FloatArray> = emptyArray()
    private var rowTop: FloatArray = FloatArray(0)
    private var rowH = 0f
    private var areaLeft = 0f
    private var areaRight = 0f

    // ─── Settings ────────────────────────────────────────────────────────
    private var themeName = "system"
    private var heightScale = 1f
    private var showHints = true
    /** 0 off, 1 left hand, 2 right hand. */
    private var oneHanded = 0

    fun applySettings(theme: String, heightPercent: Int, hints: Boolean, oneHand: Int) {
        themeName = theme
        palette = Themes.palette(context, theme)
        heightScale = heightPercent.coerceIn(70, 140) / 100f
        showHints = hints
        oneHanded = oneHand
        setBackgroundColor(palette.background)
        requestLayout()
        computeGeometry(width)
        invalidate()
    }

    /** 0 off, 1 next letter, 2 caps lock. */
    var shiftState = 0
        set(value) {
            if (field != value) { field = value; invalidate() }
        }

    /** The vowel forms offered in the Amharic vowel row. */
    private var vowels: List<String> = emptyList()
    fun setVowels(list: List<String>) {
        if (vowels != list) { vowels = list; invalidate() }
    }

    private var suggestions: List<String> = emptyList()
    fun setSuggestions(list: List<String>) {
        if (suggestions != list) { suggestions = list; invalidate() }
    }

    private var showStrip = true

    /** Hold backspace this long to delete the sentence; 0 turns it off. */
    var holdClearMs = 0L

    private val stripH = dp(40f)
    private val gapX = dp(5f)
    private val gapY = dp(6f)
    private val padSide = dp(4f)
    private val padTop = dp(6f)
    private val padBottom = dp(6f)
    private val radius = dp(8f)

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
        invalidate()
    }

    private fun stripHeight() = if (showStrip) stripH else 0f

    override fun onMeasure(widthSpec: Int, heightSpec: Int) {
        val w = MeasureSpec.getSize(widthSpec)
        val l = layout
        val h = if (l == null) 0 else {
            val rows = l.rows.size
            (stripHeight() + padTop + rows * dp(l.rowHeightDp) * heightScale + (rows - 1) * gapY + padBottom).toInt()
        }
        setMeasuredDimension(w, h)
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
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

        val usable = if (oneHanded == 0) width.toFloat() else width * 0.8f
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

    override fun onDraw(canvas: Canvas) {
        val l = layout ?: return
        if (showStrip) drawStrip(canvas)
        for ((r, row) in l.rows.withIndex()) {
            for ((c, key) in row.withIndex()) {
                if (key.kind == KeyKind.SPACER) continue
                drawKey(canvas, key, r, c, isPressed(r, c))
            }
        }
        // The long-press bubble is drawn last so it sits over the keys.
        for (i in 0 until touches.size()) touches.valueAt(i).let { if (it.popup != null) drawPopup(canvas, it) }
    }

    private val toolIcons = arrayOf("😀", "🎤", "⚙️")

    private fun drawStrip(canvas: Canvas) {
        text.typeface = Typeface.DEFAULT
        text.textSize = stripH * 0.5f
        text.color = palette.text
        val cell = dp(40f)
        for ((i, icon) in toolIcons.withIndex()) {
            val cx = padSide + cell * (i + 0.5f)
            canvas.drawText(icon, cx, stripH / 2f - (text.descent() + text.ascent()) / 2f, text)
        }
        if (suggestions.isEmpty()) return
        val start = padSide + cell * toolIcons.size
        val width = this.width - padSide - start
        val each = width / 3f
        text.textSize = stripH * 0.4f
        fill.color = palette.hint
        for ((i, word) in suggestions.withIndex()) {
            val cx = start + each * (i + 0.5f)
            if (i > 0) canvas.drawRect(start + each * i - 0.5f, stripH * 0.25f, start + each * i + 0.5f, stripH * 0.75f, fill)
            val shown = ellipsize(word, each - dp(8f))
            canvas.drawText(shown, cx, stripH / 2f - (text.descent() + text.ascent()) / 2f, text)
        }
    }

    private fun ellipsize(s: String, maxWidth: Float): String {
        if (text.measureText(s) <= maxWidth) return s
        var n = s.length
        while (n > 1 && text.measureText(s, 0, n) + text.measureText("…") > maxWidth) n--
        return s.substring(0, n) + "…"
    }

    private fun drawKey(canvas: Canvas, key: Key, r: Int, c: Int, pressed: Boolean) {
        val vowelLabel = if (key.kind == KeyKind.VOWEL) vowels.getOrNull(c).orEmpty() else null
        if (vowelLabel != null && vowelLabel.isEmpty()) return // an empty vowel slot is just a gap

        rect.set(lefts[r][c], rowTop[r], rights[r][c], rowTop[r] + rowH)
        val accent = key.kind == KeyKind.ENTER
        fill.color = when {
            pressed -> palette.pressed
            accent -> palette.accent
            key.special -> palette.special
            else -> palette.key
        }
        canvas.drawRoundRect(rect, radius, radius, fill)

        var label = vowelLabel ?: key.label
        if (key.cased && shiftState > 0) label = label.uppercase()
        if (key.kind == KeyKind.SHIFT && shiftState == 2) label = "⇪"

        val pad = layout?.isPad == true
        val big = key.kind == KeyKind.CHAR && pad && !key.special
        text.textSize = when {
            key.kind == KeyKind.SPACE -> rowH * 0.26f
            key.kind == KeyKind.VOWEL -> rowH * 0.5f
            key.kind != KeyKind.CHAR -> rowH * if (pad) 0.34f else 0.3f
            big -> rowH * 0.5f
            layout?.id == LayoutId.FIDEL -> rowH * 0.46f
            else -> rowH * 0.44f
        }
        text.color = when {
            accent -> palette.accentText
            key.kind == KeyKind.SPACE -> palette.hint
            else -> palette.text
        }
        text.typeface = if (key.kind == KeyKind.CHAR || key.kind == KeyKind.VOWEL) Typeface.DEFAULT else Typeface.DEFAULT_BOLD

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

    private fun drawPopup(canvas: Canvas, t: Touch) {
        val alts = t.popup ?: return
        rect.set(t.popupLeft, rowTop[t.popupRow], t.popupLeft + t.popupCell * alts.size, rowTop[t.popupRow] + rowH)
        fill.color = palette.popup
        canvas.drawRoundRect(rect, radius, radius, fill)
        for ((i, alt) in alts.withIndex()) {
            val cx = t.popupLeft + t.popupCell * (i + 0.5f)
            if (i == t.popupSel) {
                rect.set(cx - t.popupCell / 2f + dp(2f), rowTop[t.popupRow] + dp(3f), cx + t.popupCell / 2f - dp(2f), rowTop[t.popupRow] + rowH - dp(3f))
                fill.color = palette.accent
                canvas.drawRoundRect(rect, radius, radius, fill)
            }
            text.color = if (i == t.popupSel) palette.accentText else palette.text
            text.textSize = rowH * 0.46f
            text.typeface = Typeface.DEFAULT
            canvas.drawText(alt, cx, rowTop[t.popupRow] + rowH / 2f - (text.descent() + text.ascent()) / 2f, text)
        }
    }

    // ─── Touch ───────────────────────────────────────────────────────────

    private class Touch(val id: Int) {
        var row = 0
        var col = 0
        var lastX = 0f
        var swiped = false
        var popup: List<String>? = null
        var popupSel = -1
        var popupRow = 0
        var popupLeft = 0f
        var popupCell = 0f
        var longPress: Runnable? = null
        var repeat: Runnable? = null
    }

    private val touches = SparseArray<Touch>()

    private fun isPressed(r: Int, c: Int): Boolean {
        for (i in 0 until touches.size()) {
            val t = touches.valueAt(i)
            if (t.row == r && t.col == c) return true
        }
        return false
    }

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
                if (showStrip && y < stripH + padTop / 2f) stripTap(x) else down(e.getPointerId(i), x, y, l)
            }
            MotionEvent.ACTION_MOVE -> {
                for (i in 0 until e.pointerCount) move(e.getPointerId(i), e.getX(i), l)
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
        val cell = dp(40f)
        val tools = padSide + cell * toolIcons.size
        if (x < tools) {
            val i = ((x - padSide) / cell).toInt().coerceIn(0, toolIcons.size - 1)
            listener?.onToolbar(i)
            listener?.onKeyFeedback()
        } else if (suggestions.isNotEmpty()) {
            val each = (width - padSide - tools) / 3f
            val i = ((x - tools) / each).toInt()
            suggestions.getOrNull(i)?.let { listener?.onSuggestion(it) }
            listener?.onKeyFeedback()
        }
    }

    private fun down(id: Int, x: Float, y: Float, l: Layout) {
        val r = findRow(y)
        val c = findCol(r, x)
        val key = l.rows[r][c]
        val t = Touch(id).also { it.row = r; it.col = c; it.lastX = x }
        touches.put(id, t)

        var feedback = true
        val shifted = key.cased && shiftState > 0
        when (key.kind) {
            KeyKind.CHAR -> {
                // The letter goes out now, on touch-down, not on release.
                listener?.onText(if (shifted) key.output.uppercase() else key.output)
                if (key.alternates.isNotEmpty()) {
                    val run = Runnable { showPopup(t, key, r, c) }
                    t.longPress = run
                    handler.postDelayed(run, LONG_PRESS_MS)
                }
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
            KeyKind.LANGUAGE -> listener?.onLanguage()
            KeyKind.PAD_ABC -> listener?.onPadAbc()
            KeyKind.PHONETIC -> listener?.onPhonetic()
            KeyKind.SPACE -> feedback = false // waits for lift, in case this is a cursor swipe
            KeyKind.SPACER -> feedback = false
        }
        // Feedback is last, so the vibration never delays the letter.
        if (feedback) listener?.onKeyFeedback()
        invalidate()
    }

    private fun move(id: Int, x: Float, l: Layout) {
        val t = touches.get(id) ?: return
        val key = l.rows[t.row][t.col]

        val alts = t.popup
        if (alts != null) {
            val sel = ((x - t.popupLeft) / t.popupCell).toInt()
            val next = if (sel in alts.indices) sel else -1
            if (next != t.popupSel) { t.popupSel = next; invalidate() }
            return
        }

        if (key.kind == KeyKind.SPACE) {
            val step = dp(14f)
            while (abs(x - t.lastX) >= step) {
                val dir = if (x > t.lastX) 1 else -1
                t.lastX += dir * step
                t.swiped = true
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
        if (!cancelled) {
            if (alts != null && t.popupSel >= 0) {
                listener?.onReplaceLast(alts[t.popupSel])
            } else if (key.kind == KeyKind.SPACE && !t.swiped) {
                listener?.onSpace()
                listener?.onKeyFeedback()
            }
        }
        touches.remove(id)
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
        listener?.onKeyFeedback()
        invalidate()
    }

    // ─── Accessibility (TalkBack) ────────────────────────────────────────
    // The keys are drawn, not views, so describe them to the screen reader.

    private val a11y = object : ExploreByTouchHelper(this) {
        private fun stripId(i: Int) = STRIP_ID + i

        override fun getVirtualViewAt(x: Float, y: Float): Int {
            val l = layout ?: return INVALID_ID
            if (showStrip && y < stripH + padTop / 2f) {
                val cell = dp(40f)
                val tools = padSide + cell * toolIcons.size
                return if (x < tools) {
                    stripId(((x - padSide) / cell).toInt().coerceIn(0, toolIcons.size - 1))
                } else if (suggestions.isNotEmpty()) {
                    val each = (width - padSide - tools) / 3f
                    stripId(toolIcons.size + ((x - tools) / each).toInt().coerceIn(0, suggestions.size - 1))
                } else INVALID_ID
            }
            val r = findRow(y)
            val c = findCol(r, x)
            return if (l.rows[r][c].kind == KeyKind.SPACER) INVALID_ID else r * 100 + c
        }

        override fun getVisibleVirtualViews(ids: MutableList<Int>) {
            val l = layout ?: return
            if (showStrip) {
                for (i in toolIcons.indices) ids.add(stripId(i))
                for (i in suggestions.indices) ids.add(stripId(toolIcons.size + i))
            }
            for ((r, row) in l.rows.withIndex()) for ((c, k) in row.withIndex()) {
                val emptyVowel = k.kind == KeyKind.VOWEL && vowels.getOrNull(c).isNullOrEmpty()
                if (k.kind != KeyKind.SPACER && !emptyVowel) ids.add(r * 100 + c)
            }
        }

        override fun onPopulateNodeForVirtualView(id: Int, node: AccessibilityNodeInfoCompat) {
            val b = Rect()
            if (id >= STRIP_ID) {
                val i = id - STRIP_ID
                val cell = dp(40f)
                if (i < toolIcons.size) {
                    node.contentDescription = arrayOf("Emoji, GIFs and more", "Voice typing", "Keyboard settings")[i]
                    b.set((padSide + cell * i).toInt(), 0, (padSide + cell * (i + 1)).toInt(), stripH.toInt())
                } else {
                    val tools = padSide + cell * toolIcons.size
                    val each = (width - padSide - tools) / 3f
                    val k = i - toolIcons.size
                    node.contentDescription = "Suggestion: " + suggestions.getOrElse(k) { "" }
                    b.set((tools + each * k).toInt(), 0, (tools + each * (k + 1)).toInt(), stripH.toInt())
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
            if (id >= STRIP_ID) {
                val i = id - STRIP_ID
                if (i < toolIcons.size) listener?.onToolbar(i)
                else suggestions.getOrNull(i - toolIcons.size)?.let { listener?.onSuggestion(it) }
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
        const val LONG_PRESS_MS = 330L
        const val REPEAT_FIRST_MS = 380L
        const val REPEAT_START_MS = 70L
        const val REPEAT_MIN_MS = 28L
        const val STRIP_ID = 10000
        const val A11Y_TOUCH = -1000
    }
}
