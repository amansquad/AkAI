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

    private var pressAnim = true
    private var liveOn = true
    private var lastTouchAt = 0L
    private var longPressOn = true

    fun applySettings(
        theme: String, heightPercent: Int, hints: Boolean, oneHand: Int,
        pressAnimation: Boolean = true, longPress: Boolean = true, live: Boolean = true,
    ) {
        // A different theme fades in over the old one instead of snapping.
        if (theme != themeName) beginCrossfade(240L)
        liveOn = live
        pressAnim = pressAnimation
        longPressOn = longPress
        themeName = theme
        palette = Themes.palette(context, theme)
        cacheValid = false
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
            if (field != value) { field = value; invalidateCache() }
        }

    /** The vowel forms offered in the Amharic vowel row. */
    private var vowels: List<String> = emptyList()
    fun setVowels(list: List<String>) {
        if (vowels != list) { vowels = list; invalidateCache() }
    }

    private var suggestions: List<String> = emptyList()
    fun setSuggestions(list: List<String>) {
        if (suggestions != list) { suggestions = list; suggestionsAt = SystemClock.uptimeMillis(); invalidate() }
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

    private fun stripHeight() = if (showStrip) stripH else 0f

    /** The height this layout needs, which is also how tall the keyboard will measure. */
    private fun heightFor(l: Layout, strip: Boolean): Int {
        val rows = l.rows.size
        return ((if (strip) stripH else 0f) + padTop + rows * dp(l.rowHeightDp) * heightScale + (rows - 1) * gapY + padBottom).toInt()
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
                if (showStrip) drawStripIcons(cv)
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
            // The Flutter scenes loop every 20 seconds and are drawn in logical pixels.
            canvas.save()
            canvas.scale(density, density)
            LiveScenes.paint(canvas, width / density, height / density, (now % 20000L) / 20000f, palette.def.live)
            canvas.restore()
            // Scene frames wait while you type, so one never competes with a keystroke.
            val idle = now - lastTouchAt > 700
            postInvalidateDelayed(if (idle) 50L else (lastTouchAt + 700 - now).coerceAtLeast(50L))
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
            val it = pressAnims.iterator()
            while (it.hasNext()) {
                val a = it.next()
                val key = l.rows.getOrNull(a.r)?.getOrNull(a.c)
                if (key == null || a.c >= lefts[a.r].size) { it.remove(); continue }
                val p = pressValue(a, now)
                val finished = a.to == 0f && now - a.start >= 180L
                if (finished) { it.remove(); invalidateCacheKeepFrame(); continue }
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

        if (showStrip && suggestions.isNotEmpty()) {
            val ft = ((now - suggestionsAt) / 120f).coerceIn(0f, 1f)
            drawSuggestions(canvas, 0.35f + 0.65f * easeOutCubic(ft))
            if (ft < 1f) animating = true
        }

        for (i in 0 until touches.size()) {
            val t = touches.valueAt(i)
            if (t.popup != null && drawPopup(canvas, t, now)) animating = true
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
    }

    /** A key finished animating: nothing to rebuild, the bitmap already shows it at rest. */
    private fun invalidateCacheKeepFrame() { /* the cached bitmap is unchanged */ }

    private val toolIcons = arrayOf("😀", "🎤", "⚙️")

    private fun drawStripIcons(canvas: Canvas) {
        text.typeface = Typeface.DEFAULT
        text.textSize = stripH * 0.5f
        text.color = palette.text
        text.alpha = 255
        val cell = dp(40f)
        for ((i, icon) in toolIcons.withIndex()) {
            val cx = padSide + cell * (i + 0.5f)
            canvas.drawText(icon, cx, stripH / 2f - (text.descent() + text.ascent()) / 2f, text)
        }
    }

    private fun drawSuggestions(canvas: Canvas, alpha: Float) {
        val cell = dp(40f)
        val start = padSide + cell * toolIcons.size
        val each = (this.width - padSide - start) / 3f
        text.typeface = Typeface.DEFAULT
        text.textSize = stripH * 0.4f
        text.color = palette.text
        text.alpha = (alpha * 255f).toInt()
        fill.color = palette.hint
        fill.alpha = (alpha * 255f * 0.6f).toInt()
        for ((i, word) in suggestions.withIndex()) {
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

        var label = vowelLabel ?: key.label
        if (key.cased && shiftState > 0) label = label.uppercase()
        if (key.kind == KeyKind.SHIFT && shiftState == 2) label = "⇪"

        val pad = layout?.isPad == true
        val big = key.kind == KeyKind.CHAR && pad && !key.special
        text.textAlign = Paint.Align.CENTER
        text.alpha = 255
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
            key.special -> palette.specialText
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
        var popup: List<String>? = null
        var popupSel = -1
        var popupRow = 0
        var popupLeft = 0f
        var popupCell = 0f
        var popupAt = 0L
        var longPress: Runnable? = null
        var repeat: Runnable? = null
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
        lastTouchAt = android.os.SystemClock.uptimeMillis()
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
