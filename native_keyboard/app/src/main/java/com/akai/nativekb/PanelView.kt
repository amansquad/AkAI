package com.akai.nativekb

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Handler
import android.os.Looper
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import android.util.Base64
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.ViewConfiguration
import android.widget.OverScroller
import java.io.ByteArrayOutputStream
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

class Clip(val text: String, val pinned: Boolean)

interface PanelHost {
    fun onPanelText(text: String, isEmoji: Boolean)
    fun onPanelClose()
    fun onPanelClearClipboard()
    fun onPanelTogglePin(text: String)
    fun onPanelGif(item: GifItem)
    fun panelTextBefore(): String
    fun onPanelReplace(oldLength: Int, newText: String)
    fun panelAmharic(): Boolean
    /** The clipboard history as it is right now, including anything copied since the panel opened. */
    fun panelClips(): List<Clip>
}

/**
 * The emoji, GIF, clipboard, handwriting and translate panels. Same height as
 * the keys it replaces, so the keyboard never jumps when it opens, and drawn
 * by hand like the keys are.
 */
class PanelView(context: Context) : View(context) {

    enum class Tab { EMOJI, GIF, CLIPBOARD, WRITE, TRANSLATE }

    var host: PanelHost? = null

    /** Address of the AkAI server, for handwriting and translation. */
    var serverUrl = ""
    /** Giphy API key; blank uses the built-in GIF catalogue. */
    var giphyKey = ""
    /** 0 for the default, then 1 (lightest) to 5 (darkest). */
    var skinTone = 0

    private val density = resources.displayMetrics.density
    private fun dp(v: Float) = v * density
    private val handler = Handler(Looper.getMainLooper())

    private var palette = Themes.palette(context, Themes.DEFAULT)
    fun applyTheme(name: String) {
        palette = Themes.palette(context, name)
        setBackgroundColor(palette.background)
        invalidate()
    }

    var tab = Tab.EMOJI
        private set

    private val fill = Paint(Paint.ANTI_ALIAS_FLAG)
    private val text = Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER }
    private val rect = RectF()
    private val tabH = dp(44f)
    private val catH = dp(38f)
    private val radius = dp(8f)

    // ─── State per tab ───────────────────────────────────────────────────
    private var emojiCategory = 0 // 0 is "recent"
    private var recents: List<String> = emptyList()
    private var clips: List<Clip> = emptyList()

    private var gifCategory = 0
    private var gifs: List<GifItem> = emptyList()
    private var gifNote: String? = null
    private var gifLoading = false

    private val strokes = ArrayList<Path>()
    private var current: Path? = null
    private var candidates: List<String> = emptyList()
    private var writeStatus: String? = null
    private val recognizeTask = Runnable { recognize() }

    private var translateToAmharic = true
    private var source = ""
    private var result: String? = null
    private var translateStatus: String? = null

    fun open(tab: Tab, recents: List<String>, clips: List<Clip>) {
        this.tab = tab
        this.recents = recents
        this.clips = clips
        emojiCategory = if (recents.isEmpty()) 1 else 0
        resetScroll()
        enter(tab)
        invalidate()
    }

    private fun enter(t: Tab) {
        tab = t
        resetScroll()
        when (t) {
            Tab.GIF -> if (gifs.isEmpty()) loadGifs()
            Tab.CLIPBOARD -> host?.let { clips = it.panelClips() }
            Tab.TRANSLATE -> {
                source = host?.panelTextBefore().orEmpty().takeLast(300)
                translateToAmharic = host?.panelAmharic() != true
                result = null
                translateStatus = null
            }
            Tab.WRITE -> { strokes.clear(); current = null; candidates = emptyList(); writeStatus = null }
            else -> {}
        }
        invalidate()
    }

    fun setClips(list: List<Clip>) {
        clips = list
        invalidate()
    }

    private fun loadGifs() {
        gifLoading = true
        gifNote = null
        val wanted = gifCategory
        Gifs.load(Gifs.categories[wanted], giphyKey) { items, note ->
            if (wanted != gifCategory) return@load
            gifs = items
            gifNote = note
            gifLoading = false
            invalidate()
        }
    }

    // ─── Scrolling ───────────────────────────────────────────────────────
    private val scroller = OverScroller(context)
    private var scrollY = 0f
    private var velocity: VelocityTracker? = null
    private val slop = ViewConfiguration.get(context).scaledTouchSlop
    private var downX = 0f
    private var downY = 0f
    private var lastY = 0f
    private var dragging = false
    private var longFired = false
    private var longTask: Runnable? = null

    private fun resetScroll() {
        scrollY = 0f
        scroller.forceFinished(true)
    }

    private fun hasCategoryRow() = tab == Tab.EMOJI || tab == Tab.GIF
    private fun contentTop() = tabH + if (hasCategoryRow()) catH else 0f

    private fun emojiList(): List<String> =
        if (emojiCategory == 0) recents else EmojiData.categories.getOrNull(emojiCategory - 1)?.emojis.orEmpty()

    private fun gifCell() = width / 3f
    private fun clipRowH() = dp(52f)

    private fun contentHeight(): Float = when (tab) {
        Tab.EMOJI -> ((emojiList().size + 7) / 8) * (width / 8f)
        Tab.GIF -> ((gifs.size + 2) / 3) * gifCell()
        Tab.CLIPBOARD -> clips.size * clipRowH()
        else -> 0f
    }

    private fun maxScroll() = max(0f, contentHeight() - (height - contentTop()))

    override fun computeScroll() {
        if (scroller.computeScrollOffset()) {
            scrollY = scroller.currY.toFloat().coerceIn(0f, maxScroll())
            postInvalidateOnAnimation()
        }
    }

    // ─── Drawing ─────────────────────────────────────────────────────────

    private fun label(canvas: Canvas, s: String, cx: Float, cy: Float, size: Float, color: Int, bold: Boolean = false) {
        text.textAlign = Paint.Align.CENTER
        text.textSize = size
        text.color = color
        text.typeface = if (bold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
        canvas.drawText(s, cx, cy - (text.descent() + text.ascent()) / 2f, text)
    }

    private fun button(canvas: Canvas, l: Float, t: Float, r: Float, b: Float, s: String, accent: Boolean = false) {
        rect.set(l, t, r, b)
        fill.color = if (accent) palette.accent else palette.key
        canvas.drawRoundRect(rect, radius, radius, fill)
        label(canvas, s, rect.centerX(), rect.centerY(), dp(14f), if (accent) palette.accentText else palette.text, bold = true)
    }

    override fun onDraw(canvas: Canvas) {
        drawTabs(canvas)
        if (hasCategoryRow()) drawCategories(canvas)
        canvas.save()
        canvas.clipRect(0f, contentTop(), width.toFloat(), height.toFloat())
        when (tab) {
            Tab.EMOJI -> drawEmoji(canvas)
            Tab.GIF -> drawGifs(canvas)
            Tab.CLIPBOARD -> drawClips(canvas)
            Tab.WRITE -> drawWrite(canvas)
            Tab.TRANSLATE -> drawTranslate(canvas)
        }
        canvas.restore()
    }

    private val tabNames = arrayOf("ABC", "😀", "GIF", "📋", "✍️", "🌐")
    private fun tabAt(i: Int) = when (i) { 1 -> Tab.EMOJI; 2 -> Tab.GIF; 3 -> Tab.CLIPBOARD; 4 -> Tab.WRITE; 5 -> Tab.TRANSLATE; else -> null }

    private fun drawTabs(canvas: Canvas) {
        val cell = width / 7f
        for (i in tabNames.indices) {
            val active = tabAt(i) == tab
            if (active) {
                rect.set(cell * i + dp(3f), dp(4f), cell * (i + 1) - dp(3f), tabH - dp(4f))
                fill.color = palette.accent
                canvas.drawRoundRect(rect, radius, radius, fill)
            }
            label(canvas, tabNames[i], cell * (i + 0.5f), tabH / 2f, dp(if (i == 0 || i == 2) 13f else 18f),
                if (active) palette.accentText else palette.text, bold = i == 0 || i == 2)
        }
        // The last cell: backspace on emoji, "Clear" on the clipboard.
        when (tab) {
            Tab.EMOJI, Tab.GIF -> label(canvas, "⌫", cell * 6.5f, tabH / 2f, dp(18f), palette.text)
            Tab.CLIPBOARD -> if (clips.isNotEmpty()) label(canvas, "Clear", cell * 6.5f, tabH / 2f, dp(12f), palette.hint)
            else -> {}
        }
    }

    private fun drawCategories(canvas: Canvas) {
        if (tab == Tab.EMOJI) {
            val icons = listOf("🕘") + EmojiData.categories.map { it.icon }
            val cell = width.toFloat() / icons.size
            for ((i, icon) in icons.withIndex()) {
                if (i == emojiCategory) {
                    rect.set(cell * i + dp(3f), tabH, cell * (i + 1) - dp(3f), tabH + catH - dp(3f))
                    fill.color = palette.key
                    canvas.drawRoundRect(rect, radius, radius, fill)
                }
                label(canvas, icon, cell * (i + 0.5f), tabH + catH / 2f - dp(1f), dp(18f), palette.text)
            }
        } else {
            val cell = width.toFloat() / Gifs.categories.size
            for ((i, name) in Gifs.categories.withIndex()) {
                if (i == gifCategory) {
                    rect.set(cell * i + dp(2f), tabH, cell * (i + 1) - dp(2f), tabH + catH - dp(3f))
                    fill.color = palette.key
                    canvas.drawRoundRect(rect, radius, radius, fill)
                }
                label(canvas, name, cell * (i + 0.5f), tabH + catH / 2f - dp(1f), dp(11f), palette.text, bold = i == gifCategory)
            }
        }
    }

    private fun drawEmoji(canvas: Canvas) {
        val top = contentTop()
        val list = emojiList()
        if (list.isEmpty()) {
            label(canvas, "Emoji you use will appear here", width / 2f, top + dp(60f), dp(14f), palette.hint)
            return
        }
        val cell = width / 8f
        val first = max(0, (scrollY / cell).toInt())
        val last = min((list.size + 7) / 8, first + ((height - top) / cell).toInt() + 2)
        for (r in first until last) for (c in 0 until 8) {
            val i = r * 8 + c
            if (i >= list.size) break
            label(canvas, EmojiData.withTone(list[i], skinTone), cell * (c + 0.5f), top + r * cell + cell / 2f - scrollY, cell * 0.55f, palette.text)
        }
    }

    private fun drawGifs(canvas: Canvas) {
        val top = contentTop()
        if (gifLoading && gifs.isEmpty()) {
            label(canvas, "Loading GIFs…", width / 2f, top + dp(60f), dp(14f), palette.hint)
            return
        }
        val cell = gifCell()
        val first = max(0, (scrollY / cell).toInt())
        val last = min((gifs.size + 2) / 3, first + ((height - top) / cell).toInt() + 2)
        for (r in first until last) for (c in 0 until 3) {
            val i = r * 3 + c
            if (i >= gifs.size) break
            val y = top + r * cell - scrollY
            rect.set(cell * c + dp(2f), y + dp(2f), cell * (c + 1) - dp(2f), y + cell - dp(2f))
            fill.color = palette.key
            canvas.drawRoundRect(rect, radius, radius, fill)
            val bmp = Gifs.thumb(gifs[i].thumbUrl) { invalidate() }
            if (bmp != null) {
                // Centre-crop into the cell.
                val scale = max(rect.width() / bmp.width, rect.height() / bmp.height)
                val w = bmp.width * scale
                val h = bmp.height * scale
                canvas.save()
                canvas.clipRect(rect)
                canvas.drawBitmap(bmp, null, RectF(rect.centerX() - w / 2, rect.centerY() - h / 2, rect.centerX() + w / 2, rect.centerY() + h / 2), null)
                canvas.restore()
            }
        }
        gifNote?.let { note ->
            fill.color = palette.popup
            canvas.drawRect(0f, height - dp(26f), width.toFloat(), height.toFloat(), fill)
            label(canvas, note, width / 2f, height - dp(13f), dp(11f), palette.hint)
        }
    }

    private fun drawClips(canvas: Canvas) {
        val top = contentTop()
        if (clips.isEmpty()) {
            label(canvas, "Copy something and it appears here", width / 2f, top + dp(60f), dp(14f), palette.hint)
            return
        }
        val rowH = clipRowH()
        text.textAlign = Paint.Align.LEFT
        text.textSize = dp(14f)
        text.typeface = Typeface.DEFAULT
        for ((i, clip) in clips.withIndex()) {
            val y = top + i * rowH - scrollY
            if (y + rowH < top || y > height) continue
            rect.set(dp(8f), y + dp(4f), width - dp(8f), y + rowH - dp(4f))
            fill.color = if (clip.pinned) palette.popup else palette.key
            canvas.drawRoundRect(rect, radius, radius, fill)
            text.color = palette.text
            val shown = TextUtils.ellipsize(clip.text.replace('\n', ' '), TextPaint(text), rect.width() - dp(44f), TextUtils.TruncateAt.END)
            canvas.drawText(shown.toString(), rect.left + dp(12f), rect.centerY() - (text.descent() + text.ascent()) / 2f, text)
            if (clip.pinned) label(canvas, "📌", rect.right - dp(16f), rect.centerY(), dp(14f), palette.text)
        }
        text.textAlign = Paint.Align.CENTER
        label(canvas, "Hold an item to pin it", width / 2f, height - dp(10f), dp(10f), palette.hint)
    }

    // ─── Handwriting ─────────────────────────────────────────────────────

    private fun chipH() = dp(40f)
    private fun writeAreaTop() = contentTop() + chipH()
    private fun writeAreaBottom() = height - dp(44f)

    private val inkPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        strokeWidth = dp(5f)
    }

    private fun drawWrite(canvas: Canvas) {
        val top = contentTop()
        val chip = chipH()
        if (candidates.isEmpty()) {
            label(canvas, writeStatus ?: if (serverUrl.isBlank()) "Set the server address in the app's settings" else "Write a letter or a word below",
                width / 2f, top + chip / 2f, dp(12f), palette.hint)
        } else {
            val cell = width / 6f
            for ((i, c) in candidates.take(6).withIndex()) {
                rect.set(cell * i + dp(2f), top + dp(3f), cell * (i + 1) - dp(2f), top + chip - dp(3f))
                fill.color = palette.key
                canvas.drawRoundRect(rect, radius, radius, fill)
                val shown = TextUtils.ellipsize(c, TextPaint(text), cell - dp(8f), TextUtils.TruncateAt.END).toString()
                label(canvas, shown, rect.centerX(), rect.centerY(), dp(18f), palette.text)
            }
        }
        rect.set(dp(6f), writeAreaTop(), width - dp(6f), writeAreaBottom())
        fill.color = palette.key
        canvas.drawRoundRect(rect, radius, radius, fill)
        canvas.save()
        canvas.clipRect(rect)
        inkPaint.color = palette.text
        for (p in strokes) canvas.drawPath(p, inkPaint)
        current?.let { canvas.drawPath(it, inkPaint) }
        canvas.restore()

        val by = height - dp(40f)
        val cell = width / 3f
        button(canvas, dp(6f), by, cell - dp(3f), height - dp(4f), "Clear")
        button(canvas, cell + dp(3f), by, cell * 2 - dp(3f), height - dp(4f), "Space")
        button(canvas, cell * 2 + dp(3f), by, width - dp(6f), height - dp(4f), "⌫")
    }

    private fun recognize() {
        if (strokes.isEmpty()) return
        if (serverUrl.isBlank()) { writeStatus = "Set the server address in the app's settings"; invalidate(); return }
        writeStatus = "Reading…"
        invalidate()

        // Black ink on white, scaled down: the model only needs the shapes.
        val aw = (width - dp(12f)).toInt().coerceAtLeast(1)
        val ah = (writeAreaBottom() - writeAreaTop()).toInt().coerceAtLeast(1)
        val scale = min(1f, 400f / aw)
        val bmp = Bitmap.createBitmap((aw * scale).toInt().coerceAtLeast(1), (ah * scale).toInt().coerceAtLeast(1), Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        c.drawColor(Color.WHITE)
        c.scale(scale, scale)
        c.translate(-dp(6f), -writeAreaTop())
        val ink = Paint(inkPaint).apply { color = Color.BLACK; strokeWidth = dp(7f) }
        for (p in strokes) c.drawPath(p, ink)
        val out = ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
        val dataUrl = "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)

        Net.recognize(serverUrl, dataUrl, host?.panelAmharic() == true) { found ->
            if (tab != Tab.WRITE) return@recognize
            if (found == null) { writeStatus = "Couldn't read that - is the server reachable?"; candidates = emptyList() }
            else { candidates = found; writeStatus = if (found.isEmpty()) "Nothing recognised" else null }
            invalidate()
        }
    }

    // ─── Translate ───────────────────────────────────────────────────────

    private fun drawTranslate(canvas: Canvas) {
        val top = contentTop()
        val pad = dp(8f)
        val w = width.toFloat()
        // Direction.
        button(canvas, pad, top + dp(4f), w - pad, top + dp(40f),
            if (translateToAmharic) "English  →  አማርኛ   (tap to swap)" else "አማርኛ  →  English   (tap to swap)")
        // Source.
        var y = top + dp(48f)
        val boxH = (height - top - dp(48f) - dp(52f) - dp(8f)) / 2f
        drawBox(canvas, pad, y, w - pad, y + boxH,
            source.ifBlank { "Type something in the app first, then open this tab" }, source.isBlank())
        y += boxH + dp(4f)
        drawBox(canvas, pad, y, w - pad, y + boxH,
            result ?: translateStatus ?: "The translation appears here", result == null)
        val by = height - dp(44f)
        button(canvas, pad, by, w / 2f - dp(3f), height - dp(4f), "Translate", accent = true)
        button(canvas, w / 2f + dp(3f), by, w - pad, height - dp(4f), "Replace")
    }

    private fun drawBox(canvas: Canvas, l: Float, t: Float, r: Float, b: Float, s: String, dim: Boolean) {
        rect.set(l, t, r, b)
        fill.color = palette.key
        canvas.drawRoundRect(rect, radius, radius, fill)
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            textSize = dp(14f)
            color = if (dim) palette.hint else palette.text
        }
        val inner = (r - l - dp(20f)).toInt().coerceAtLeast(1)
        val lines = max(1, ((b - t - dp(12f)) / (paint.fontSpacing)).toInt())
        val layout = StaticLayout.Builder.obtain(s, 0, s.length, paint, inner)
            .setMaxLines(lines).setEllipsize(TextUtils.TruncateAt.END).setAlignment(Layout.Alignment.ALIGN_NORMAL).build()
        canvas.save()
        canvas.translate(l + dp(10f), t + dp(6f))
        layout.draw(canvas)
        canvas.restore()
    }

    private fun translate() {
        if (source.isBlank()) return
        if (serverUrl.isBlank()) { translateStatus = "Set the server address in the app's settings"; invalidate(); return }
        translateStatus = "Translating…"
        result = null
        invalidate()
        Net.translate(serverUrl, source, translateToAmharic) { out ->
            if (tab != Tab.TRANSLATE) return@translate
            result = out
            if (out == null) translateStatus = "Translation failed - is the server reachable?"
            invalidate()
        }
    }

    // ─── Touch ───────────────────────────────────────────────────────────

    override fun onTouchEvent(e: MotionEvent): Boolean {
        if (e.actionMasked == MotionEvent.ACTION_DOWN && e.y < tabH) { headerTap(e.x); return true }
        if (e.actionMasked == MotionEvent.ACTION_DOWN && hasCategoryRow() && e.y < contentTop()) { categoryTap(e.x); return true }
        return when (tab) {
            Tab.WRITE -> writeTouch(e)
            Tab.TRANSLATE -> { if (e.actionMasked == MotionEvent.ACTION_DOWN) translateTap(e.x, e.y); true }
            else -> scrollTouch(e)
        }
    }

    private fun scrollTouch(e: MotionEvent): Boolean {
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                scroller.forceFinished(true)
                downX = e.x; downY = e.y; lastY = e.y
                dragging = false
                longFired = false
                velocity = VelocityTracker.obtain().also { it.addMovement(e) }
                if (tab == Tab.CLIPBOARD) {
                    val task = Runnable {
                        val i = ((downY - contentTop() + scrollY) / clipRowH()).toInt()
                        clips.getOrNull(i)?.let { longFired = true; host?.onPanelTogglePin(it.text) }
                    }
                    longTask = task
                    handler.postDelayed(task, 500)
                }
            }
            MotionEvent.ACTION_MOVE -> {
                val v = velocity ?: return true
                v.addMovement(e)
                if (!dragging && abs(e.y - downY) > slop) {
                    dragging = true
                    longTask?.let { handler.removeCallbacks(it) }
                }
                if (dragging) {
                    scrollY = (scrollY - (e.y - lastY)).coerceIn(0f, maxScroll())
                    invalidate()
                }
                lastY = e.y
            }
            MotionEvent.ACTION_UP -> {
                longTask?.let { handler.removeCallbacks(it) }
                val v = velocity
                if (v != null) {
                    if (dragging) {
                        v.computeCurrentVelocity(1000)
                        scroller.fling(0, scrollY.toInt(), 0, -v.yVelocity.toInt(), 0, 0, 0, maxScroll().toInt())
                        postInvalidateOnAnimation()
                    } else if (!longFired) contentTap(e.x, e.y)
                    v.recycle()
                    velocity = null
                }
            }
            MotionEvent.ACTION_CANCEL -> {
                longTask?.let { handler.removeCallbacks(it) }
                velocity?.recycle(); velocity = null
            }
        }
        return true
    }

    private fun writeTouch(e: MotionEvent): Boolean {
        val inCanvas = e.y in writeAreaTop()..writeAreaBottom()
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                handler.removeCallbacks(recognizeTask)
                if (inCanvas) {
                    current = Path().apply { moveTo(e.x, e.y); lineTo(e.x + 0.1f, e.y) }
                    invalidate()
                } else if (e.y > writeAreaBottom()) {
                    val cell = width / 3f
                    when ((e.x / cell).toInt()) {
                        0 -> { strokes.clear(); candidates = emptyList(); writeStatus = null; invalidate() }
                        1 -> host?.onPanelText(" ", false)
                        else -> host?.onPanelText("\b", false)
                    }
                } else if (e.y < writeAreaTop()) {
                    val i = (e.x / (width / 6f)).toInt()
                    candidates.getOrNull(i)?.let {
                        host?.onPanelText(it, false)
                        strokes.clear(); candidates = emptyList(); writeStatus = null; invalidate()
                    }
                }
            }
            MotionEvent.ACTION_MOVE -> current?.let { it.lineTo(e.x.coerceIn(0f, width.toFloat()), e.y.coerceIn(writeAreaTop(), writeAreaBottom())); invalidate() }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                current?.let {
                    // The last position matters: a quick stroke may have only one move event.
                    if (e.actionMasked == MotionEvent.ACTION_UP) it.lineTo(e.x.coerceIn(0f, width.toFloat()), e.y.coerceIn(writeAreaTop(), writeAreaBottom()))
                    strokes.add(it); current = null
                    // Read it once the pen has been still for a moment.
                    handler.postDelayed(recognizeTask, 900)
                    invalidate()
                }
            }
        }
        return true
    }

    private fun translateTap(x: Float, y: Float) {
        val top = contentTop()
        when {
            y < top + dp(44f) -> { translateToAmharic = !translateToAmharic; result = null; translateStatus = null; invalidate() }
            y > height - dp(48f) -> {
                if (x < width / 2f) translate()
                else result?.let { host?.onPanelReplace(source.length, it) }
            }
            y < top + dp(48f) + (height - top - dp(100f)) / 2f -> {
                // Tapping the source refreshes it from the app.
                source = host?.panelTextBefore().orEmpty().takeLast(300)
                result = null
                invalidate()
            }
        }
    }

    private fun headerTap(x: Float) {
        val i = (x / (width / 7f)).toInt()
        when {
            i == 0 -> host?.onPanelClose()
            i in 1..5 -> if (tabAt(i) != tab) enter(tabAt(i)!!)
            tab == Tab.CLIPBOARD -> host?.onPanelClearClipboard()
            tab == Tab.EMOJI || tab == Tab.GIF -> host?.onPanelText("\b", false)
        }
    }

    private fun categoryTap(x: Float) {
        if (tab == Tab.EMOJI) {
            val n = EmojiData.categories.size + 1
            emojiCategory = (x / (width.toFloat() / n)).toInt().coerceIn(0, n - 1)
            resetScroll()
        } else {
            gifCategory = (x / (width.toFloat() / Gifs.categories.size)).toInt().coerceIn(0, Gifs.categories.size - 1)
            resetScroll()
            gifs = emptyList()
            loadGifs()
        }
        invalidate()
    }

    private fun contentTap(x: Float, y: Float) {
        val top = contentTop()
        if (y < top) return
        when (tab) {
            Tab.EMOJI -> {
                val cell = width / 8f
                val c = (x / cell).toInt().coerceIn(0, 7)
                val r = ((y - top + scrollY) / cell).toInt()
                emojiList().getOrNull(r * 8 + c)?.let { host?.onPanelText(EmojiData.withTone(it, skinTone), true) }
            }
            Tab.GIF -> {
                val cell = gifCell()
                val c = (x / cell).toInt().coerceIn(0, 2)
                val r = ((y - top + scrollY) / cell).toInt()
                gifs.getOrNull(r * 3 + c)?.let { host?.onPanelGif(it) }
            }
            Tab.CLIPBOARD -> {
                val i = ((y - top + scrollY) / clipRowH()).toInt()
                clips.getOrNull(i)?.let { host?.onPanelText(it.text, false) }
            }
            else -> {}
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        handler.removeCallbacksAndMessages(null)
    }
}
