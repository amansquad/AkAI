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
import android.view.View
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

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
    fun onCursorMove(delta: Int)
    /** A long-press alternate was chosen: replace the letter just typed. */
    fun onReplaceLast(text: String)
    /** Called after the letter has been sent, so feedback never delays it. */
    fun onKeyFeedback()
}

private class Palette(
    val background: Int, val key: Int, val special: Int, val pressed: Int,
    val text: Int, val hint: Int, val accent: Int, val accentText: Int, val popup: Int,
)

private val DARK = Palette(
    0xFF1B1B1F.toInt(), 0xFF3A3A40.toInt(), 0xFF2A2A2F.toInt(), 0xFF5A5A62.toInt(),
    0xFFEDEDED.toInt(), 0xFF9A9AA2.toInt(), 0xFF6C8CFF.toInt(), 0xFF0B1230.toInt(), 0xFF2E2E34.toInt(),
)
private val LIGHT = Palette(
    0xFFD9DBE0.toInt(), 0xFFFFFFFF.toInt(), 0xFFB9BDC6.toInt(), 0xFFC4C8D0.toInt(),
    0xFF1B1B1F.toInt(), 0xFF6B6F78.toInt(), 0xFF3F5BD9.toInt(), 0xFFFFFFFF.toInt(), 0xFFFFFFFF.toInt(),
)

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
    private var palette = paletteFor(context)

    private var layout: Layout? = null
    /** Per row, per key: left and right edge in pixels. */
    private var lefts: Array<FloatArray> = emptyArray()
    private var rights: Array<FloatArray> = emptyArray()
    private var rowTop: FloatArray = FloatArray(0)
    private var rowH = 0f

    /** 0 off, 1 next letter, 2 caps lock. */
    var shiftState = 0
        set(value) {
            if (field != value) { field = value; invalidate() }
        }

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

    fun setLayout(next: Layout) {
        layout = next
        // Height depends on the layout, so ask the parent to measure again.
        requestLayout()
        computeGeometry(width)
        invalidate()
    }

    override fun onConfigurationChanged(newConfig: Configuration?) {
        super.onConfigurationChanged(newConfig)
        palette = paletteFor(context)
        setBackgroundColor(palette.background)
        invalidate()
    }

    override fun onMeasure(widthSpec: Int, heightSpec: Int) {
        val w = MeasureSpec.getSize(widthSpec)
        val l = layout
        val h = if (l == null) 0 else {
            val rows = l.rows.size
            (padTop + rows * dp(l.rowHeightDp) + (rows - 1) * gapY + padBottom).toInt()
        }
        setMeasuredDimension(w, h)
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        computeGeometry(w)
    }

    private fun computeGeometry(width: Int) {
        val l = layout ?: return
        if (width <= 0) return
        rowH = dp(l.rowHeightDp)
        rowTop = FloatArray(l.rows.size) { padTop + it * (rowH + gapY) }
        lefts = Array(l.rows.size) { FloatArray(l.rows[it].size) }
        rights = Array(l.rows.size) { FloatArray(l.rows[it].size) }
        for ((r, row) in l.rows.withIndex()) {
            val totalWeight = row.sumOf { it.weight.toDouble() }.toFloat()
            val avail = width - 2 * padSide - gapX * (row.size - 1)
            val unit = avail / totalWeight
            var x = padSide
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
        for ((r, row) in l.rows.withIndex()) {
            for ((c, key) in row.withIndex()) {
                if (key.kind == KeyKind.SPACER) continue
                drawKey(canvas, key, r, c, isPressed(r, c))
            }
        }
        // The long-press bubble is drawn last so it sits over the keys.
        for (i in 0 until touches.size()) touches.valueAt(i).let { if (it.popup != null) drawPopup(canvas, it) }
    }

    private fun drawKey(canvas: Canvas, key: Key, r: Int, c: Int, pressed: Boolean) {
        rect.set(lefts[r][c], rowTop[r], rights[r][c], rowTop[r] + rowH)
        val accent = key.kind == KeyKind.ENTER
        fill.color = when {
            pressed -> palette.pressed
            accent -> palette.accent
            key.special -> palette.special
            else -> palette.key
        }
        canvas.drawRoundRect(rect, radius, radius, fill)

        var label = key.label
        if (key.cased && shiftState > 0) label = label.uppercase()
        if (key.kind == KeyKind.SHIFT && shiftState == 2) label = "⇪"

        val isDigitPad = layout?.id.let { it == LayoutId.NUMBER || it == LayoutId.PHONE || it == LayoutId.DATETIME }
        val big = key.kind == KeyKind.CHAR && (isDigitPad == true && !key.special)
        text.textSize = when {
            key.kind == KeyKind.SPACE -> rowH * 0.26f
            key.kind != KeyKind.CHAR && key.kind != KeyKind.SPACER -> rowH * if (isDigitPad == true) 0.34f else 0.3f
            big -> rowH * 0.5f
            layout?.id == LayoutId.FIDEL -> rowH * 0.46f
            else -> rowH * 0.44f
        }
        text.color = when {
            accent -> palette.accentText
            key.kind == KeyKind.SPACE -> palette.hint
            else -> palette.text
        }
        text.typeface = if (key.kind == KeyKind.CHAR) Typeface.DEFAULT else Typeface.DEFAULT_BOLD

        // A hint sits in the corner, so push the letter down a touch to keep
        // the two from ever touching.
        val lift = if (key.hint != null) dp(2f) else 0f
        val baseline = rect.centerY() - (text.descent() + text.ascent()) / 2f + lift
        canvas.drawText(label, rect.centerX(), baseline, text)

        if (key.hint != null) {
            hintPaint.textSize = rowH * 0.2f
            hintPaint.color = palette.hint
            canvas.drawText(key.hint, rect.right - dp(4f), rect.top + dp(2f) - hintPaint.ascent(), hintPaint)
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
                down(e.getPointerId(i), e.getX(i), e.getY(i), l)
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

    private fun down(id: Int, x: Float, y: Float, l: Layout) {
        val r = findRow(y)
        val c = findCol(r, x)
        val key = l.rows[r][c]
        val t = Touch(id).also { it.row = r; it.col = c; it.lastX = x }
        touches.put(id, t)

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
            KeyKind.BACKSPACE -> {
                listener?.onBackspace()
                var delay = REPEAT_START_MS
                val run = object : Runnable {
                    override fun run() {
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
            KeyKind.SPACE, KeyKind.SPACER -> Unit // space waits for lift, in case this is a cursor swipe
        }
        // Feedback is last, so the vibration never delays the letter.
        if (key.kind != KeyKind.SPACE) listener?.onKeyFeedback()
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
        val cell = min(maxCell, (width - 2 * padSide) / alts.size)
        val keyCx = (lefts[r][c] + rights[r][c]) / 2f
        val total = cell * alts.size
        t.popup = alts
        t.popupCell = cell
        t.popupLeft = (keyCx - total / 2f).coerceIn(padSide, max(padSide, width - padSide - total))
        // The bubble covers the row above the key, or its own row at the top.
        t.popupRow = max(r - 1, 0)
        t.popupSel = -1
        listener?.onKeyFeedback()
        invalidate()
    }

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

        fun paletteFor(context: Context): Palette {
            val night = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
            return if (night == Configuration.UI_MODE_NIGHT_YES) DARK else LIGHT
        }
    }
}
