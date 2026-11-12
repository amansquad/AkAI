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
    fun onPanelSticker(sticker: Stickers.Sticker)
    /** The "+" after the sticker packs: open the Sticker Marketplace. */
    fun onPanelAddStickers()
    fun panelTextBefore(): String
    fun onPanelReplace(oldLength: Int, newText: String)
    fun panelAmharic(): Boolean
    /** The clipboard history as it is right now, including anything copied since the panel opened. */
    fun panelClips(): List<Clip>
    /** The user picked a theme in the Themes tab. */
    fun onPanelTheme(id: String)
    /** The search button in the emoji tab: type a word to find emoji. */
    fun onPanelEmojiSearch()
    /** The search button in the GIF tab: type words on the keys, starting from [current]. */
    fun onPanelGifSearch(current: String)
    /** The search button in the sticker tab: type words on the keys, starting from [current]. */
    fun onPanelStickerSearch(current: String)
    /** Something in the voice tab: the mic, the language, the setup button, or leaving the tab. */
    fun onPanelVoice(action: PanelView.VoiceAction)
}

/**
 * The emoji, GIF, clipboard, handwriting and translate panels. Same height as
 * the keys it replaces, so the keyboard never jumps when it opens, and drawn
 * by hand like the keys are.
 */
class PanelView(context: Context) : View(context) {

    enum class Tab { EMOJI, STICKERS, GIF, CLIPBOARD, WRITE, TRANSLATE, THEMES, VOICE }
    enum class VoiceAction { MIC, LANGUAGE, SETUP, LEAVE }

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

    /** The theme in use, so the Themes tab can mark it. */
    var themeId = Themes.DEFAULT
    private var themeFilter = 0
    private val themeFilters = listOf("all" to "All", "live" to "Live", "solid" to "Solid", "cultural" to "Cultural", "faith" to "Faith", "football" to "Football")
    private val miniPalettes = HashMap<String, Palette>()
    private fun themeList() = Themes.all.filter { themeFilters[themeFilter].first == "all" || it.category == themeFilters[themeFilter].first }
    // Keyed by the definition itself too, so an edited custom theme isn't shown in its old colours.
    private fun miniPalette(def: PaletteDef) = miniPalettes.getOrPut("${def.id}@${System.identityHashCode(def)}") { Themes.palette(def) }

    private var stickerSet = 0
    /** A sticker search being shown instead of a pack, or null; and what it found. */
    private var stickerQuery: String? = null
    private var stickerResults: List<Stickers.Sticker> = emptyList()
    /** How far the row of sticker packs is scrolled sideways. */
    private var packScrollX = 0f
    private fun stickerPacks() = Stickers.packs(context)
    /**
     * Each cell in the pack row: one per pack, then "+" to add packs. The row
     * fills the width, and scrolls sideways once they don't fit.
     */
    private fun packCell() = max((width - gifSearchCell()) / (stickerPacks().size + 1), dp(64f))
    private fun maxPackScroll() = max(0f, packCell() * (stickerPacks().size + 1) - (width - gifSearchCell()))

    private var gifCategory = 0
    /** A typed GIF search being shown instead of a category, or null. */
    private var gifQuery: String? = null
    private var gifs: List<GifItem> = emptyList()
    private var gifNote: String? = null
    private var gifLoading = false

    private val strokes = ArrayList<Path>()
    private var current: Path? = null
    /** The same strokes as points with times, for reading them on the phone. */
    private val strokePoints = ArrayList<List<FloatArray>>()
    private var currentPoints: ArrayList<FloatArray>? = null
    private fun clearInk() {
        strokes.clear(); strokePoints.clear(); current = null; currentPoints = null
        candidates = emptyList(); writeStatus = null
    }
    private var candidates: List<String> = emptyList()
    private var writeStatus: String? = null
    private val recognizeTask = Runnable { recognize() }

    private var voice = VoiceStatus(VoiceStatus.Phase.IDLE)
    private var voiceAmharic = false
    /** The latest loudness, and the one drawn, which follows it smoothly. */
    private var voiceLevel = 0f
    private var voiceShown = 0f

    fun setVoice(status: VoiceStatus, amharic: Boolean) {
        voice = status
        voiceAmharic = amharic
        if (!status.active) voiceLevel = 0f
        if (tab == Tab.VOICE) invalidate()
    }

    fun setVoiceLevel(level: Float) {
        voiceLevel = level
        if (tab == Tab.VOICE) invalidate()
    }

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
        if (tab == Tab.VOICE && t != Tab.VOICE) host?.onPanelVoice(VoiceAction.LEAVE)
        if (t != Tab.STICKERS) Stickers.stopAnimations()
        tab = t
        tabAt = android.os.SystemClock.uptimeMillis()
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
            Tab.WRITE -> clearInk()
            // A pack may have been removed in Settings since the panel was last open.
            Tab.STICKERS -> stickerSet = stickerSet.coerceIn(0, max(0, stickerPacks().size - 1))
            else -> {}
        }
        invalidate()
    }

    fun setClips(list: List<Clip>) {
        clips = list
        invalidate()
    }

    /** Show the GIFs found for [query]; the GIF tab opens on them. */
    fun searchGifs(query: String) {
        gifQuery = query
        gifs = emptyList()
        resetScroll()
    }

    private fun loadGifs() {
        gifLoading = true
        gifNote = null
        val wanted = gifCategory
        val query = gifQuery
        Gifs.load(query ?: Gifs.categories[wanted], giphyKey, serverUrl, search = query != null) { items, note ->
            if (wanted != gifCategory || query != gifQuery) return@load
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

    private fun hasCategoryRow() = tab == Tab.EMOJI || tab == Tab.STICKERS || tab == Tab.GIF || tab == Tab.THEMES
    private fun contentTop() = tabH + if (hasCategoryRow()) catH else 0f

    private fun emojiList(): List<String> =
        if (emojiCategory == 0) recents else EmojiData.categories.getOrNull(emojiCategory - 1)?.emojis.orEmpty()

    private fun gifCell() = width / 3f
    /** The search button before the GIF categories (and ✕ after a search). */
    private fun gifSearchCell() = dp(44f)
    /** Four stickers to a row; six for a custom emoji pack, which are small. */
    private fun stickerCols() =
        if (stickerQuery == null && stickerPacks().getOrNull(stickerSet)?.emoji == true) 6 else 4
    private fun stickerCell() = width / stickerCols().toFloat()
    private fun stickerList() =
        if (stickerQuery != null) stickerResults else stickerPacks().getOrNull(stickerSet)?.stickers.orEmpty()

    /** Show the stickers found for [query]; the sticker tab opens on them. */
    fun searchStickers(query: String) {
        stickerQuery = query
        stickerResults = Stickers.search(context, query)
        resetScroll()
    }
    private fun clipRowH() = dp(52f)
    private fun themeCellH() = width / 3f * 0.74f + dp(24f)

    private fun contentHeight(): Float = when (tab) {
        Tab.EMOJI -> ((emojiList().size + 7) / 8) * (width / 8f)
        Tab.STICKERS -> ((stickerList().size + stickerCols() - 1) / stickerCols()) * stickerCell()
        Tab.GIF -> ((gifs.size + 2) / 3) * gifCell()
        Tab.CLIPBOARD -> clips.size * clipRowH()
        Tab.THEMES -> ((themeList().size + 2) / 3) * themeCellH()
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

    /** When the tab last changed, so its content can fade in. */
    private var tabAt = 0L

    override fun onDraw(canvas: Canvas) {
        drawTabs(canvas)
        if (hasCategoryRow()) drawCategories(canvas)
        val now = android.os.SystemClock.uptimeMillis()
        val k = ((now - tabAt) / 150f).coerceIn(0f, 1f)
        canvas.save()
        canvas.clipRect(0f, contentTop(), width.toFloat(), height.toFloat())
        // A tab's content fades in rather than snapping, and rises a few pixels as it does.
        val layer = if (k < 1f) canvas.saveLayerAlpha(0f, contentTop(), width.toFloat(), height.toFloat(), ((1f - (1f - k) * (1f - k)) * 255f).toInt()) else -1
        if (k < 1f) canvas.translate(0f, (1f - k) * dp(8f))
        when (tab) {
            Tab.EMOJI -> drawEmoji(canvas)
            Tab.STICKERS -> drawStickers(canvas)
            Tab.GIF -> drawGifs(canvas)
            Tab.CLIPBOARD -> drawClips(canvas)
            Tab.WRITE -> drawWrite(canvas)
            Tab.TRANSLATE -> drawTranslate(canvas)
            Tab.THEMES -> drawThemes(canvas)
            Tab.VOICE -> drawVoice(canvas)
        }
        if (layer >= 0) canvas.restoreToCount(layer)
        canvas.restore()
        if (k < 1f) postInvalidateOnAnimation()
    }

    private val tabNames = arrayOf("ABC", "😀", "🧸", "GIF", "📋", "✍️", "🌐", "🎨")
    private fun tabAt(i: Int) = when (i) {
        1 -> Tab.EMOJI; 2 -> Tab.STICKERS; 3 -> Tab.GIF; 4 -> Tab.CLIPBOARD; 5 -> Tab.WRITE; 6 -> Tab.TRANSLATE; 7 -> Tab.THEMES; else -> null
    }
    private val tabIcons = arrayOf(null, TOOL_EMOJI, TOOL_STICKERS, TOOL_GIF, TOOL_CLIPBOARD, TOOL_WRITE, TOOL_TRANSLATE, TOOL_THEMES)

    /** The tab row has one more cell than tabs: backspace or "Clear" at the end. */
    private fun tabCell() = width / (tabNames.size + 1f)

    private fun drawTabs(canvas: Canvas) {
        val cell = tabCell()
        for (i in tabNames.indices) {
            val active = tabAt(i) == tab
            if (active) {
                rect.set(cell * i + dp(3f), dp(4f), cell * (i + 1) - dp(3f), tabH - dp(4f))
                fill.color = palette.accent
                canvas.drawRoundRect(rect, radius, radius, fill)
            }
            val color = if (active) palette.accentText else palette.text
            // The same line icons as the toolbar; only "ABC" (back to the keys) is a word.
            val icon = tabIcons[i]
            if (icon == null) label(canvas, tabNames[i], cell * (i + 0.5f), tabH / 2f, dp(13f), color, bold = true)
            else Icons.draw(canvas, icon, cell * (i + 0.5f), tabH / 2f, min(dp(22f), cell * 0.6f), color)
        }
        // The last cell: backspace on emoji, "Clear" on the clipboard.
        val last = cell * (tabNames.size + 0.5f)
        when (tab) {
            Tab.EMOJI, Tab.STICKERS, Tab.GIF -> label(canvas, "⌫", last, tabH / 2f, dp(18f), palette.text)
            Tab.CLIPBOARD -> if (clips.isNotEmpty()) label(canvas, "Clear", last, tabH / 2f, dp(11f), palette.hint)
            else -> {}
        }
    }

    private fun drawCategories(canvas: Canvas) {
        if (tab == Tab.EMOJI) {
            // The first cell searches; the rest are recent and the categories.
            val icons = listOf("🔍", "🕘") + EmojiData.categories.map { it.icon }
            val cell = width.toFloat() / icons.size
            for ((i, icon) in icons.withIndex()) {
                if (i == emojiCategory + 1) {
                    rect.set(cell * i + dp(3f), tabH, cell * (i + 1) - dp(3f), tabH + catH - dp(3f))
                    fill.color = palette.key
                    canvas.drawRoundRect(rect, radius, radius, fill)
                }
                label(canvas, icon, cell * (i + 0.5f), tabH + catH / 2f - dp(1f), dp(18f), palette.text)
            }
        } else if (tab == Tab.STICKERS) {
            val search = gifSearchCell()
            if (searchRow(canvas, stickerQuery)) return
            label(canvas, "🔍", search / 2f, tabH + catH / 2f - dp(1f), dp(16f), palette.text)
            val packs = stickerPacks()
            val cell = packCell()
            packScrollX = packScrollX.coerceIn(0f, maxPackScroll())
            canvas.save()
            canvas.clipRect(search, tabH, width.toFloat(), tabH + catH)
            for ((i, pack) in packs.withIndex()) {
                val l = search + cell * i - packScrollX
                if (l + cell < 0f || l > width) continue
                if (i == stickerSet) {
                    rect.set(l + dp(2f), tabH, l + cell - dp(2f), tabH + catH - dp(3f))
                    fill.color = palette.key
                    canvas.drawRoundRect(rect, radius, radius, fill)
                }
                val icon = pack.icon
                val px = (catH - dp(9f)).toInt()
                val bmp = icon?.let { Stickers.thumbnail(it, px, redraw) }
                if (bmp != null) canvas.drawBitmap(bmp, l + (cell - px) / 2f, tabH + dp(3f), null)
                else if (icon == null) {
                    text.textSize = dp(11f)
                    val name = TextUtils.ellipsize(pack.name, TextPaint(text), cell - dp(8f), TextUtils.TruncateAt.END).toString()
                    label(canvas, name, l + cell / 2f, tabH + catH / 2f - dp(1f), dp(11f), palette.text, bold = i == stickerSet)
                }
            }
            val add = search + cell * packs.size - packScrollX
            if (add < width) label(canvas, "+", add + cell / 2f, tabH + catH / 2f - dp(2f), dp(22f), palette.hint)
            canvas.restore()
        } else if (tab == Tab.THEMES) {
            val cell = width.toFloat() / themeFilters.size
            for ((i, f) in themeFilters.withIndex()) {
                if (i == themeFilter) {
                    rect.set(cell * i + dp(2f), tabH, cell * (i + 1) - dp(2f), tabH + catH - dp(3f))
                    fill.color = palette.key
                    canvas.drawRoundRect(rect, radius, radius, fill)
                }
                label(canvas, f.second, cell * (i + 0.5f), tabH + catH / 2f - dp(1f), dp(11f), palette.text, bold = i == themeFilter)
            }
        } else {
            val search = gifSearchCell()
            if (searchRow(canvas, gifQuery)) return
            label(canvas, "🔍", search / 2f, tabH + catH / 2f - dp(1f), dp(16f), palette.text)
            val cell = (width - search) / Gifs.categories.size
            for ((i, name) in Gifs.categories.withIndex()) {
                val l = search + cell * i
                if (i == gifCategory) {
                    rect.set(l + dp(2f), tabH, l + cell - dp(2f), tabH + catH - dp(3f))
                    fill.color = palette.key
                    canvas.drawRoundRect(rect, radius, radius, fill)
                }
                label(canvas, name, l + cell / 2f, tabH + catH / 2f - dp(1f), dp(11f), palette.text, bold = i == gifCategory)
            }
        }
    }

    /**
     * A search being shown, in place of the categories: tap it to change the
     * words, ✕ to go back. False (nothing drawn) when there is no search.
     */
    private fun searchRow(canvas: Canvas, q: String?): Boolean {
        if (q == null) return false
        val search = gifSearchCell()
        rect.set(dp(4f), tabH, width - search, tabH + catH - dp(3f))
        fill.color = palette.key
        canvas.drawRoundRect(rect, radius, radius, fill)
        label(canvas, "🔍  $q", rect.centerX(), tabH + catH / 2f - dp(1f), dp(13f), palette.text, bold = true)
        label(canvas, "✕", width - search / 2f, tabH + catH / 2f - dp(1f), dp(15f), palette.text)
        return true
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

    private val redraw: () -> Unit = { invalidate() }

    /** Moving stickers ask for a redraw each frame, but only while they can be seen. */
    private val animCallback = object : android.graphics.drawable.Drawable.Callback {
        override fun invalidateDrawable(who: android.graphics.drawable.Drawable) {
            if (tab == Tab.STICKERS && isShown) postInvalidateOnAnimation()
        }
        override fun scheduleDrawable(who: android.graphics.drawable.Drawable, what: Runnable, `when`: Long) { handler.postAtTime(what, who, `when`) }
        override fun unscheduleDrawable(who: android.graphics.drawable.Drawable, what: Runnable) { handler.removeCallbacks(what, who) }
    }

    /** Die-cut stickers, four to a row, sitting straight on the panel (no key behind them). */
    private fun drawStickers(canvas: Canvas) {
        val top = contentTop()
        val list = stickerList()
        if (list.isEmpty() && stickerQuery != null) {
            label(canvas, "No stickers for \"$stickerQuery\"", width / 2f, top + dp(50f), dp(14f), palette.hint)
            label(canvas, "Try a feeling, like happy, sad, love or laugh", width / 2f, top + dp(74f), dp(12f), palette.hint)
            return
        }
        val cell = stickerCell()
        val px = (cell - dp(6f)).toInt().coerceAtLeast(1)
        val first = max(0, (scrollY / cell).toInt())
        val cols = stickerCols()
        val last = min((list.size + cols - 1) / cols, first + ((height - top) / cell).toInt() + 2)
        for (r in first until last) for (c in 0 until cols) {
            val i = r * cols + c
            if (i >= list.size) break
            val x = cell * c + (cell - px) / 2f
            val y = top + r * cell - scrollY + (cell - px) / 2f
            val moving = Stickers.animated(list[i], px, animCallback, redraw)
            val bmp = if (moving == null) Stickers.thumbnail(list[i], px, redraw) else null
            if (moving != null) {
                // Fitted into the square, keeping its shape.
                val w = moving.intrinsicWidth.coerceAtLeast(1).toFloat()
                val h = moving.intrinsicHeight.coerceAtLeast(1).toFloat()
                val k = min(px / w, px / h)
                val l = x + (px - w * k) / 2f
                val t = y + (px - h * k) / 2f
                moving.setBounds(l.toInt(), t.toInt(), (l + w * k).toInt(), (t + h * k).toInt())
                moving.draw(canvas)
            } else if (bmp != null) {
                canvas.drawBitmap(bmp, x, y, null)
            } else {
                // Still being drawn: a faint placeholder where it will appear.
                fill.color = palette.key
                fill.alpha = 90
                canvas.drawCircle(x + px / 2f, y + px / 2f, px * 0.38f, fill)
                fill.alpha = 255
            }
        }
    }

    private fun drawGifs(canvas: Canvas) {
        val top = contentTop()
        if (gifLoading && gifs.isEmpty()) {
            label(canvas, "Loading GIFs…", width / 2f, top + dp(60f), dp(14f), palette.hint)
            return
        }
        if (gifs.isEmpty() && gifQuery != null) {
            label(canvas, "No GIFs found for \"$gifQuery\"", width / 2f, top + dp(60f), dp(14f), palette.hint)
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

    private fun drawThemes(canvas: Canvas) {
        val top = contentTop()
        val list = themeList()
        val cell = width / 3f
        val ch = themeCellH()
        val first = max(0, (scrollY / ch).toInt())
        val last = min((list.size + 2) / 3, first + ((height - top) / ch).toInt() + 2)
        for (r in first until last) for (c in 0 until 3) {
            val i = r * 3 + c
            if (i >= list.size) break
            val def = list[i]
            val x = cell * c + dp(5f)
            val y = top + r * ch - scrollY + dp(4f)
            val w = cell - dp(10f)
            val h = cell * 0.74f - dp(8f)
            MiniKeyboard.draw(canvas, x, y, w, h, miniPalette(def))
            if (def.id == themeId) {
                fill.style = Paint.Style.STROKE
                fill.strokeWidth = dp(2.5f)
                fill.color = palette.accent
                rect.set(x, y, x + w, y + h)
                canvas.drawRoundRect(rect, h * 0.1f, h * 0.1f, fill)
                fill.style = Paint.Style.FILL
            }
            val name = TextUtils.ellipsize((if (def.live.isNotEmpty()) "● " else "") + def.name, TextPaint(text), w, TextUtils.TruncateAt.END).toString()
            label(canvas, name, x + w / 2f, y + h + dp(10f), dp(11f), if (def.id == themeId) palette.accent else palette.text, bold = def.id == themeId)
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
            label(canvas, writeStatus ?: "Write a letter or a word below",
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
        writeStatus = "Reading…"
        invalidate()
        val amharic = host?.panelAmharic() == true
        // On the phone first: private, and works offline once the model is there.
        Handwriting.recognize(strokePoints.toList(), amharic,
            status = { if (tab == Tab.WRITE) { writeStatus = it; invalidate() } },
        ) { found ->
            if (tab != Tab.WRITE) return@recognize
            when {
                found != null -> { candidates = found; writeStatus = if (found.isEmpty()) "Nothing recognised" else null; invalidate() }
                serverUrl.isNotBlank() -> recognizeOnServer()
                else -> { writeStatus = "Couldn't read that - the handwriting model needs the internet once"; invalidate() }
            }
        }
    }

    private fun recognizeOnServer() {
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

    // Bands from the top: the language button, the mic with room for its ring,
    // two lines of captions, then the row kept for the setup button.
    private fun voiceAreaTop() = contentTop() + dp(48f)
    private fun voiceAreaH() = height - dp(52f) - voiceAreaTop()
    private fun voiceMicRadius() = min(dp(46f), (voiceAreaH() - dp(48f)) / 3.4f)
    private fun voiceMicY() = voiceAreaTop() + voiceMicRadius() * 1.6f

    private fun drawVoice(canvas: Canvas) {
        val top = contentTop()
        val pad = dp(8f)
        val w = width.toFloat()
        button(canvas, pad, top + dp(4f), w - pad, top + dp(40f),
            if (voiceAmharic) "አማርኛ   (tap for English)" else "English   (tap for አማርኛ)")

        val cx = w / 2f
        val cy = voiceMicY()
        val r = voiceMicRadius()
        val phase = voice.phase
        // The ring follows the voice; with no voice it breathes slowly so it still looks alive.
        voiceShown += (voiceLevel - voiceShown) * 0.35f
        if (voice.active) {
            val t = android.os.SystemClock.uptimeMillis() / 600.0
            val breathe = (0.06f + 0.04f * kotlin.math.sin(t).toFloat())
            val ring = r * (1.12f + 0.55f * maxOf(voiceShown, breathe))
            fill.color = palette.accent
            fill.alpha = 70
            canvas.drawCircle(cx, cy, ring, fill)
            fill.alpha = 255
            postInvalidateOnAnimation()
        }
        fill.color = if (voice.active) palette.accent else palette.key
        canvas.drawCircle(cx, cy, r, fill)
        Icons.draw(canvas, TOOL_VOICE, cx, cy, r * 0.9f, if (voice.active) palette.accentText else palette.text)

        val status = when (phase) {
            VoiceStatus.Phase.STARTING -> "Starting…"
            VoiceStatus.Phase.LISTENING -> "Speak now"
            VoiceStatus.Phase.HEARING -> "Listening…  tap to finish"
            VoiceStatus.Phase.THINKING -> "Writing it down…"
            VoiceStatus.Phase.NEEDS_PERMISSION -> "AkAI needs the microphone to hear you"
            VoiceStatus.Phase.UNAVAILABLE -> "This phone has no speech service for the keyboard to use"
            VoiceStatus.Phase.IDLE -> voice.message ?: "Tap the mic to speak"
        }
        val below = cy + r * 1.6f + dp(12f)
        drawCaption(canvas, status, below, palette.text)
        // The words heard go under a one-line status; a two-line message has the room to itself.
        if (voice.heard.isNotEmpty() && voice.message == null && phase != VoiceStatus.Phase.NEEDS_PERMISSION) {
            drawCaption(canvas, voice.heard, below + dp(22f), palette.hint, wrap = false)
        }
        val setup = when (phase) {
            VoiceStatus.Phase.NEEDS_PERMISSION -> "Allow the microphone"
            VoiceStatus.Phase.UNAVAILABLE -> "Use the system voice screen"
            // A language the phone can't do: the system screen may have other options.
            VoiceStatus.Phase.IDLE -> if (voice.message?.contains("system voice screen") == true) "Use the system voice screen" else null
            else -> null
        }
        if (setup != null) button(canvas, pad, height - dp(44f), w - pad, height - dp(4f), setup, accent = true)
    }

    /**
     * Centred text whose first line is centred on [cy]. A message wraps to two
     * lines; words being spoken keep to one, dropping the oldest words first.
     */
    private fun drawCaption(canvas: Canvas, s: String, cy: Float, color: Int, wrap: Boolean = true) {
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { textSize = dp(14f); this.color = color }
        val inner = (width - dp(32f)).toInt().coerceAtLeast(1)
        val shown = if (wrap) s else TextUtils.ellipsize(s, paint, inner.toFloat(), TextUtils.TruncateAt.START).toString()
        val layout = StaticLayout.Builder.obtain(shown, 0, shown.length, paint, inner)
            .setMaxLines(2).setEllipsize(TextUtils.TruncateAt.END).setAlignment(Layout.Alignment.ALIGN_CENTER).build()
        canvas.save()
        canvas.translate(dp(16f), cy - layout.getLineBottom(0) / 2f)
        layout.draw(canvas)
        canvas.restore()
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
        if (packTouch(e)) return true
        if (e.actionMasked == MotionEvent.ACTION_DOWN && hasCategoryRow() && e.y < contentTop()) { categoryTap(e.x); return true }
        return when (tab) {
            Tab.WRITE -> writeTouch(e)
            Tab.TRANSLATE -> { if (e.actionMasked == MotionEvent.ACTION_DOWN) translateTap(e.x, e.y); true }
            Tab.VOICE -> { if (e.actionMasked == MotionEvent.ACTION_DOWN) voiceTap(e.x, e.y); true }
            else -> scrollTouch(e)
        }
    }

    /** A touch that started on the sticker pack row: slide it sideways, or tap a pack. */
    private var packDown: Float? = null
    private var packLastX = 0f
    private var packDragging = false

    private fun packTouch(e: MotionEvent): Boolean {
        if (e.actionMasked == MotionEvent.ACTION_DOWN) {
            if (tab != Tab.STICKERS || stickerQuery != null || e.y < tabH || e.y >= contentTop()) { packDown = null; return false }
            packDown = e.x; packLastX = e.x; packDragging = false
            return true
        }
        val down = packDown ?: return false
        when (e.actionMasked) {
            MotionEvent.ACTION_MOVE -> {
                if (!packDragging && abs(e.x - down) > slop) packDragging = true
                if (packDragging) {
                    packScrollX = (packScrollX - (e.x - packLastX)).coerceIn(0f, maxPackScroll())
                    invalidate()
                }
                packLastX = e.x
            }
            MotionEvent.ACTION_UP -> { if (!packDragging) categoryTap(e.x); packDown = null }
            MotionEvent.ACTION_CANCEL -> packDown = null
        }
        return true
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
                    currentPoints = arrayListOf(floatArrayOf(e.x, e.y, e.eventTime.toFloat()))
                    invalidate()
                } else if (e.y > writeAreaBottom()) {
                    val cell = width / 3f
                    when ((e.x / cell).toInt()) {
                        0 -> { clearInk(); invalidate() }
                        1 -> host?.onPanelText(" ", false)
                        else -> host?.onPanelText("\b", false)
                    }
                } else if (e.y < writeAreaTop()) {
                    val i = (e.x / (width / 6f)).toInt()
                    candidates.getOrNull(i)?.let {
                        host?.onPanelText(it, false)
                        clearInk(); invalidate()
                    }
                }
            }
            MotionEvent.ACTION_MOVE -> current?.let {
                val x = e.x.coerceIn(0f, width.toFloat())
                val y = e.y.coerceIn(writeAreaTop(), writeAreaBottom())
                it.lineTo(x, y)
                currentPoints?.add(floatArrayOf(x, y, e.eventTime.toFloat()))
                invalidate()
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                current?.let {
                    // The last position matters: a quick stroke may have only one move event.
                    if (e.actionMasked == MotionEvent.ACTION_UP) it.lineTo(e.x.coerceIn(0f, width.toFloat()), e.y.coerceIn(writeAreaTop(), writeAreaBottom()))
                    strokes.add(it); current = null
                    currentPoints?.let { pts ->
                        pts.add(floatArrayOf(e.x.coerceIn(0f, width.toFloat()), e.y.coerceIn(writeAreaTop(), writeAreaBottom()), e.eventTime.toFloat()))
                        strokePoints.add(pts)
                    }
                    currentPoints = null
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

    private fun voiceTap(x: Float, y: Float) {
        val top = contentTop()
        val r = voiceMicRadius()
        when {
            y < top + dp(44f) -> host?.onPanelVoice(VoiceAction.LANGUAGE)
            y > height - dp(48f) && (voice.phase == VoiceStatus.Phase.NEEDS_PERMISSION ||
                voice.phase == VoiceStatus.Phase.UNAVAILABLE || voice.message?.contains("system voice screen") == true) ->
                host?.onPanelVoice(VoiceAction.SETUP)
            // A generous target: anywhere near the mic.
            kotlin.math.hypot(x - width / 2f, y - voiceMicY()) < r * 1.8f -> host?.onPanelVoice(VoiceAction.MIC)
        }
    }

    private fun headerTap(x: Float) {
        val i = (x / tabCell()).toInt()
        when {
            i == 0 -> host?.onPanelClose()
            i in 1 until tabNames.size -> if (tabAt(i) != tab) enter(tabAt(i)!!)
            tab == Tab.CLIPBOARD -> host?.onPanelClearClipboard()
            tab == Tab.EMOJI || tab == Tab.STICKERS || tab == Tab.GIF -> host?.onPanelText("\b", false)
        }
    }

    private fun categoryTap(x: Float) {
        if (tab == Tab.EMOJI) {
            val n = EmojiData.categories.size + 2
            val i = (x / (width.toFloat() / n)).toInt().coerceIn(0, n - 1)
            if (i == 0) { host?.onPanelEmojiSearch(); return }
            emojiCategory = i - 1
            resetScroll()
        } else if (tab == Tab.STICKERS) {
            val search = gifSearchCell()
            val q = stickerQuery
            if (q != null) {
                if (x < width - search) { host?.onPanelStickerSearch(q); return }
                stickerQuery = null
                stickerResults = emptyList()
                resetScroll()
                invalidate()
                return
            }
            if (x < search) { host?.onPanelStickerSearch(""); return }
            val n = stickerPacks().size
            val i = ((x - search + packScrollX) / packCell()).toInt()
            if (i >= n) { host?.onPanelAddStickers(); return }
            stickerSet = i.coerceIn(0, max(0, n - 1))
            Stickers.stopAnimations()
            resetScroll()
        } else if (tab == Tab.THEMES) {
            themeFilter = (x / (width.toFloat() / themeFilters.size)).toInt().coerceIn(0, themeFilters.size - 1)
            resetScroll()
        } else {
            val search = gifSearchCell()
            val q = gifQuery
            when {
                q != null && x < width - search -> { host?.onPanelGifSearch(q); return }
                q != null -> gifQuery = null
                x < search -> { host?.onPanelGifSearch(""); return }
                else -> gifCategory = ((x - search) / ((width - search) / Gifs.categories.size)).toInt().coerceIn(0, Gifs.categories.size - 1)
            }
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
            Tab.STICKERS -> {
                val cell = stickerCell()
                val cols = stickerCols()
                val c = (x / cell).toInt().coerceIn(0, cols - 1)
                val r = ((y - top + scrollY) / cell).toInt()
                stickerList().getOrNull(r * cols + c)?.let { host?.onPanelSticker(it) }
            }
            Tab.GIF -> {
                val cell = gifCell()
                val c = (x / cell).toInt().coerceIn(0, 2)
                val r = ((y - top + scrollY) / cell).toInt()
                gifs.getOrNull(r * 3 + c)?.let { host?.onPanelGif(it) }
            }
            Tab.THEMES -> {
                val c = (x / (width / 3f)).toInt().coerceIn(0, 2)
                val r = ((y - top + scrollY) / themeCellH()).toInt()
                themeList().getOrNull(r * 3 + c)?.let { themeId = it.id; host?.onPanelTheme(it.id); invalidate() }
            }
            Tab.CLIPBOARD -> {
                val i = ((y - top + scrollY) / clipRowH()).toInt()
                clips.getOrNull(i)?.let { host?.onPanelText(it.text, false) }
            }
            else -> {}
        }
    }

    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        if (visibility != VISIBLE) Stickers.stopAnimations()
    }

    override fun onVisibilityChanged(changedView: View, visibility: Int) {
        super.onVisibilityChanged(changedView, visibility)
        if (!isShown) Stickers.stopAnimations()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        Stickers.stopAnimations()
        handler.removeCallbacksAndMessages(null)
    }
}
