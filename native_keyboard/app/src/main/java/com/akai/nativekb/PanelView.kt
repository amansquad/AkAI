package com.akai.nativekb

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.text.TextUtils
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.ViewConfiguration
import android.widget.OverScroller
import kotlin.math.abs
import kotlin.math.max

interface PanelHost {
    fun onPanelText(text: String, isEmoji: Boolean)
    fun onPanelClose()
    fun onPanelClearClipboard()
}

/**
 * The emoji and clipboard panels. Same height as the keys it replaces, so the
 * keyboard never jumps when it opens, and drawn by hand like the keys are.
 */
class PanelView(context: Context) : View(context) {

    enum class Tab { EMOJI, CLIPBOARD }

    var host: PanelHost? = null

    private val density = resources.displayMetrics.density
    private fun dp(v: Float) = v * density

    private var palette = Themes.palette(context, "system")
    fun applyTheme(name: String) {
        palette = Themes.palette(context, name)
        setBackgroundColor(palette.background)
        invalidate()
    }

    var tab = Tab.EMOJI
        private set
    private var category = 0 // index into categories; 0 is "recent"
    private var recents: List<String> = emptyList()
    private var clips: List<String> = emptyList()

    fun open(tab: Tab, recents: List<String>, clips: List<String>) {
        this.tab = tab
        this.recents = recents
        this.clips = clips
        category = if (recents.isEmpty()) 1 else 0
        scrollY = 0f
        scroller.forceFinished(true)
        invalidate()
    }

    private val fill = Paint(Paint.ANTI_ALIAS_FLAG)
    private val text = Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER }
    private val rect = RectF()

    private val tabH = dp(44f)
    private val catH = dp(38f)
    private val radius = dp(8f)
    private val columns = 8

    private val scroller = OverScroller(context)
    private var scrollY = 0f
    private var velocity: VelocityTracker? = null
    private val slop = ViewConfiguration.get(context).scaledTouchSlop
    private var downX = 0f
    private var downY = 0f
    private var lastY = 0f
    private var dragging = false

    private fun contentTop() = tabH + if (tab == Tab.EMOJI) catH else 0f

    /** Emoji for the selected category tab (index 0 is Recent). */
    private fun emojiList(): List<String> =
        if (category == 0) recents else EmojiData.categories.getOrNull(category - 1)?.emojis.orEmpty()

    private fun contentHeight(): Float {
        return if (tab == Tab.EMOJI) {
            val rows = (emojiList().size + columns - 1) / columns
            rows * (width.toFloat() / columns)
        } else clips.size * dp(52f)
    }

    private fun maxScroll() = max(0f, contentHeight() - (height - contentTop()))

    override fun computeScroll() {
        if (scroller.computeScrollOffset()) {
            scrollY = scroller.currY.toFloat().coerceIn(0f, maxScroll())
            postInvalidateOnAnimation()
        }
    }

    override fun onDraw(canvas: Canvas) {
        drawTabs(canvas)
        if (tab == Tab.EMOJI) drawCategories(canvas)
        val top = contentTop()
        canvas.save()
        canvas.clipRect(0f, top, width.toFloat(), height.toFloat())
        if (tab == Tab.EMOJI) drawEmoji(canvas, top) else drawClips(canvas, top)
        canvas.restore()
    }

    private fun label(canvas: Canvas, s: String, cx: Float, cy: Float, size: Float, color: Int, bold: Boolean = false) {
        text.textSize = size
        text.color = color
        text.typeface = if (bold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
        canvas.drawText(s, cx, cy - (text.descent() + text.ascent()) / 2f, text)
    }

    private fun drawTabs(canvas: Canvas) {
        val cell = width / 4f
        val names = arrayOf("ABC", "😀 Emoji", "📋 Clips")
        for (i in names.indices) {
            val active = (i == 1 && tab == Tab.EMOJI) || (i == 2 && tab == Tab.CLIPBOARD)
            if (active) {
                rect.set(cell * i + dp(4f), dp(4f), cell * (i + 1) - dp(4f), tabH - dp(4f))
                fill.color = palette.accent
                canvas.drawRoundRect(rect, radius, radius, fill)
            }
            label(canvas, names[i], cell * (i + 0.5f), tabH / 2f, dp(14f), if (active) palette.accentText else palette.text, bold = true)
        }
        // The fourth cell: "Clear" on the clipboard, backspace on emoji.
        if (tab == Tab.CLIPBOARD) {
            if (clips.isNotEmpty()) label(canvas, "Clear", cell * 3.5f, tabH / 2f, dp(13f), palette.hint)
        } else {
            label(canvas, "⌫", cell * 3.5f, tabH / 2f, dp(18f), palette.text)
        }
    }

    private fun categoryIcons(): List<String> = listOf("🕘") + EmojiData.categories.map { it.icon }

    private fun drawCategories(canvas: Canvas) {
        val icons = categoryIcons()
        val cell = width.toFloat() / icons.size
        for ((i, icon) in icons.withIndex()) {
            if (i == category) {
                rect.set(cell * i + dp(3f), tabH, cell * (i + 1) - dp(3f), tabH + catH - dp(3f))
                fill.color = palette.key
                canvas.drawRoundRect(rect, radius, radius, fill)
            }
            label(canvas, icon, cell * (i + 0.5f), tabH + catH / 2f - dp(1f), dp(18f), palette.text)
        }
    }

    private fun drawEmoji(canvas: Canvas, top: Float) {
        val list = emojiList()
        if (list.isEmpty()) {
            label(canvas, "Emoji you use will appear here", width / 2f, top + dp(60f), dp(14f), palette.hint)
            return
        }
        val cell = width.toFloat() / columns
        val first = max(0, ((scrollY) / cell).toInt())
        val last = minOf((list.size + columns - 1) / columns, first + ((height - top) / cell).toInt() + 2)
        for (r in first until last) {
            for (c in 0 until columns) {
                val i = r * columns + c
                if (i >= list.size) break
                label(canvas, list[i], cell * (c + 0.5f), top + r * cell + cell / 2f - scrollY, cell * 0.55f, palette.text)
            }
        }
    }

    private fun drawClips(canvas: Canvas, top: Float) {
        if (clips.isEmpty()) {
            label(canvas, "Copy something and it appears here", width / 2f, top + dp(60f), dp(14f), palette.hint)
            return
        }
        val rowH = dp(52f)
        text.textAlign = Paint.Align.LEFT
        text.textSize = dp(14f)
        text.typeface = Typeface.DEFAULT
        for ((i, clip) in clips.withIndex()) {
            val y = top + i * rowH - scrollY
            if (y + rowH < top || y > height) continue
            rect.set(dp(8f), y + dp(4f), width - dp(8f), y + rowH - dp(4f))
            fill.color = palette.key
            canvas.drawRoundRect(rect, radius, radius, fill)
            text.color = palette.text
            val one = clip.replace('\n', ' ')
            val shown = TextUtils.ellipsize(one, android.text.TextPaint(text), rect.width() - dp(24f), TextUtils.TruncateAt.END)
            canvas.drawText(shown.toString(), rect.left + dp(12f), rect.centerY() - (text.descent() + text.ascent()) / 2f, text)
        }
        text.textAlign = Paint.Align.CENTER
    }

    // ─── Touch ───────────────────────────────────────────────────────────

    override fun onTouchEvent(e: MotionEvent): Boolean {
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                scroller.forceFinished(true)
                downX = e.x; downY = e.y; lastY = e.y
                dragging = false
                velocity = VelocityTracker.obtain().also { it.addMovement(e) }
                // Tabs and categories react on touch-down, like keys.
                if (e.y < contentTop()) { headerTap(e.x, e.y); velocity?.recycle(); velocity = null }
            }
            MotionEvent.ACTION_MOVE -> {
                val v = velocity ?: return true
                v.addMovement(e)
                if (!dragging && abs(e.y - downY) > slop) dragging = true
                if (dragging) {
                    scrollY = (scrollY - (e.y - lastY)).coerceIn(0f, maxScroll())
                    invalidate()
                }
                lastY = e.y
            }
            MotionEvent.ACTION_UP -> {
                val v = velocity
                if (v != null) {
                    if (dragging) {
                        v.computeCurrentVelocity(1000)
                        scroller.fling(0, scrollY.toInt(), 0, -v.yVelocity.toInt(), 0, 0, 0, maxScroll().toInt())
                        postInvalidateOnAnimation()
                    } else contentTap(e.x, e.y)
                    v.recycle()
                    velocity = null
                }
            }
            MotionEvent.ACTION_CANCEL -> { velocity?.recycle(); velocity = null }
        }
        return true
    }

    private fun headerTap(x: Float, y: Float) {
        if (y < tabH) {
            val cell = width / 4f
            when {
                x < cell -> host?.onPanelClose()
                x < cell * 2 -> if (tab != Tab.EMOJI) switchTo(Tab.EMOJI)
                x < cell * 3 -> if (tab != Tab.CLIPBOARD) switchTo(Tab.CLIPBOARD)
                else -> if (tab == Tab.CLIPBOARD) host?.onPanelClearClipboard() else host?.onPanelText("\b", false)
            }
        } else if (tab == Tab.EMOJI) {
            val icons = categoryIcons()
            category = (x / (width.toFloat() / icons.size)).toInt().coerceIn(0, icons.size - 1)
            scrollY = 0f
            invalidate()
        }
    }

    private fun switchTo(t: Tab) {
        tab = t
        scrollY = 0f
        invalidate()
    }

    private fun contentTap(x: Float, y: Float) {
        val top = contentTop()
        if (y < top) return
        if (tab == Tab.EMOJI) {
            val cell = width.toFloat() / columns
            val c = (x / cell).toInt().coerceIn(0, columns - 1)
            val r = ((y - top + scrollY) / cell).toInt()
            emojiList().getOrNull(r * columns + c)?.let { host?.onPanelText(it, true) }
        } else {
            val i = ((y - top + scrollY) / dp(52f)).toInt()
            clips.getOrNull(i)?.let { host?.onPanelText(it, false) }
        }
    }

    fun setClips(list: List<String>) {
        clips = list
        invalidate()
    }
}
