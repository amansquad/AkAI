package com.akai.nativekb

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.LruCache
import androidx.core.content.FileProvider
import java.io.File
import java.util.concurrent.Executors
import kotlin.math.cos
import kotlin.math.sin

/**
 * Real stickers, not big emoji: each is a die-cut picture (a coloured badge with
 * an emoji on it and a caption, cut out with a white border and a soft shadow),
 * drawn on the phone and sent to the app as a PNG.
 */
object Stickers {
    enum class Shape { CIRCLE, BURST, BLOB, HEART, SQUARE }

    /**
     * A drawn sticker, or, with [image], a picture from a sticker pack
     * ("asset:<path>" or a file path); then [emoji] is what to type where pictures can't go.
     */
    class Sticker(
        val id: String, val emoji: String, val caption: String, val shape: Shape, val colors: IntArray,
        val image: String? = null,
        /** An animated WebP of a video sticker, played in the panel and sent where apps take WebP. */
        val anim: String? = null,
        /** Where the website serves it as a GIF (a path on the Akai server), for apps that only take GIFs. */
        val gif: String? = null,
    )
    /** [key] tells packs apart; [removable] packs were imported and can be deleted in Settings. */
    class Pack(val name: String, val stickers: List<Sticker>, val key: String = name, val removable: Boolean = false) {
        /** Picture packs show their first sticker in the pack row instead of a name. */
        val icon: Sticker? get() = stickers.firstOrNull()?.takeIf { it.image != null }
    }

    /** A picture sticker from a pack. */
    fun picture(id: String, emoji: String, image: String, anim: String? = null, gif: String? = null) =
        Sticker(id.replace('/', '~'), emoji, "", Shape.SQUARE, intArrayOf(0, 0), image, anim, gif)

    private fun c(top: String, bottom: String) = intArrayOf(Color.parseColor(top), Color.parseColor(bottom))

    private val sun = c("#FFD54F", "#FF9800")
    private val sky = c("#4FC3F7", "#1E88E5")
    private val leaf = c("#AED581", "#43A047")
    private val rose = c("#F48FB1", "#E91E63")
    private val grape = c("#CE93D8", "#7B1FA2")
    private val flame = c("#FFAB40", "#E53935")
    private val coffee = c("#BCAAA4", "#6D4C41")
    private val night = c("#7986CB", "#283593")
    private val mint = c("#80CBC4", "#00897B")
    private val gold = c("#FFE082", "#FFB300")

    /** The id comes from the content, so a changed sticker never reuses an old cached file. */
    private fun s(emoji: String, caption: String, shape: Shape, colors: IntArray) =
        Sticker(Integer.toHexString("$emoji|$caption|$shape|${colors[0]}".hashCode()), emoji, caption, shape, colors)

    /** The drawn packs, then the picture packs (built in, then imported). */
    fun packs(context: Context): List<Pack> = drawn + StickerPacks.all(context)

    /** Without variation selectors, so ☹ and ☹️ count as the same emoji. */
    private fun plain(e: String) = e.filterNot { it.code == 0xFE0F || it.code == 0xFE0E }

    /**
     * Stickers from every pack for [query], best first. Words in a caption count
     * most; otherwise a word is turned into emoji ("laugh" → 😂 🤣) and matched
     * against the emoji each sticker stands for. Typed emoji work too.
     */
    fun search(context: Context, query: String, limit: Int = 120): List<Sticker> {
        val q = query.trim().lowercase()
        if (q.isEmpty()) return emptyList()
        val words = q.split(Regex("\\s+"))
        val all = packs(context).flatMap { p -> p.stickers.map { it to p } }
        val out = LinkedHashSet<Sticker>()
        // 1. Captions (drawn stickers) and pack names that hold every word.
        all.filter { (st, p) ->
            val hay = "${st.caption} ${p.name}".lowercase()
            words.all { w -> hay.split(' ', '!', '?', ',', '.').any { it.startsWith(w) } || (w.length > 2 && w in hay) }
        }.forEach { out.add(it.first) }
        // 2. Emoji: the ones typed, then the ones the words describe, in that order.
        val typed = q.filter { !it.isLetterOrDigit() && !it.isWhitespace() }.let { if (it.isNotEmpty()) listOf(it) else emptyList() }
        val wanted = (typed + EmojiSearch.search(q, 60)).map(::plain).filter { it.isNotEmpty() }
        for (e in wanted) {
            for ((st, _) in all) if (st.emoji.isNotEmpty() && plain(st.emoji).contains(e)) out.add(st)
            if (out.size >= limit) break
        }
        return out.take(limit)
    }

    private val drawn: List<Pack> = listOf(
        Pack("Greetings", listOf(
            s("👋", "ሰላም!", Shape.BURST, sun),
            s("☀️", "እንደምን አደራችሁ", Shape.CIRCLE, gold),
            s("🌙", "ደህና እደሩ", Shape.CIRCLE, night),
            s("😊", "እንዴት ናችሁ?", Shape.BLOB, sky),
            s("🤗", "እንኳን ደህና መጣችሁ", Shape.BLOB, mint),
            s("🙏", "አመሰግናለሁ", Shape.SQUARE, leaf),
            s("🥺", "ናፍቃችሁኛል", Shape.CIRCLE, grape),
            s("👋", "ቻው!", Shape.BURST, sky),
            s("😎", "Hey!", Shape.BURST, flame),
            s("🙌", "Thank you!", Shape.SQUARE, mint),
            s("😴", "Good night", Shape.CIRCLE, night),
            s("☕", "Good morning", Shape.BLOB, coffee),
        )),
        Pack("Reactions", listOf(
            s("😂", "LOL", Shape.BURST, sun),
            s("😮", "ዋው!", Shape.BURST, sky),
            s("👍", "እሺ", Shape.CIRCLE, leaf),
            s("👏", "ጎበዝ!", Shape.BURST, gold),
            s("💯", "ትክክል!", Shape.SQUARE, flame),
            s("🤔", "Hmm…", Shape.BLOB, mint),
            s("😱", "OMG", Shape.BURST, grape),
            s("🙄", "Seriously?", Shape.BLOB, sky),
            s("😩", "ደክሞኛል", Shape.CIRCLE, night),
            s("🤷", "ምን ላድርግ?", Shape.BLOB, coffee),
            s("🔥", "Fire!", Shape.BURST, flame),
            s("🙈", "Oops", Shape.CIRCLE, rose),
            s("😤", "ተው!", Shape.BURST, flame),
            s("🤣", "ሞትኩ!", Shape.BURST, sun),
            s("👀", "እያየሁ ነው", Shape.BLOB, grape),
            s("✅", "Done!", Shape.SQUARE, leaf),
        )),
        Pack("Love", listOf(
            s("❤️", "እወድሻለሁ", Shape.HEART, rose),
            s("❤️", "እወድሃለሁ", Shape.HEART, flame),
            s("😍", "ውዴ", Shape.HEART, rose),
            s("💕", "ፍቅር", Shape.BLOB, grape),
            s("🥰", "Miss you", Shape.HEART, rose),
            s("😘", "Kisses", Shape.CIRCLE, rose),
            s("🫶", "Love you", Shape.HEART, grape),
            s("🌹", "ለአንቺ", Shape.BLOB, flame),
            s("💍", "Forever", Shape.CIRCLE, gold),
            s("🤗", "Hugs", Shape.BLOB, sun),
        )),
        Pack("Celebrate", listOf(
            s("🎂", "መልካም ልደት!", Shape.BURST, rose),
            s("🎉", "እንኳን ደስ አላችሁ!", Shape.BURST, gold),
            s("🌼", "መልካም አዲስ ዓመት", Shape.BLOB, sun),
            s("🕯️", "እንኳን አደረሳችሁ", Shape.CIRCLE, night),
            s("🥳", "Congrats!", Shape.BURST, grape),
            s("🏆", "Winner!", Shape.SQUARE, gold),
            s("🎁", "Surprise!", Shape.SQUARE, rose),
            s("🎓", "Graduated!", Shape.CIRCLE, sky),
            s("💒", "መልካም ጋብቻ", Shape.HEART, rose),
            s("🍾", "Cheers!", Shape.BURST, mint),
        )),
        Pack("Habesha", listOf(
            s("☕", "ቡና ደርሷል", Shape.CIRCLE, coffee),
            s("🍲", "እንብላ!", Shape.BLOB, flame),
            s("🫓", "እንጀራ", Shape.CIRCLE, gold),
            s("🇪🇹", "ኢትዮጵያ", Shape.BURST, leaf),
            s("💃", "እስክስታ!", Shape.BURST, grape),
            s("🦁", "ጀግና", Shape.CIRCLE, gold),
            s("🏃", "ሩጫ!", Shape.BURST, sky),
            s("⚽", "ጎል!", Shape.BURST, leaf),
            s("🙏", "ይቅርታ", Shape.BLOB, mint),
            s("🤲", "እግዚአብሔር ይመስገን", Shape.CIRCLE, sun),
            s("😌", "ምንም አይደለም", Shape.BLOB, sky),
            s("👌", "በጣም ጥሩ", Shape.SQUARE, leaf),
        )),
    )

    // ─── Drawing ─────────────────────────────────────────────────────────

    /**
     * Draws [st] on a transparent square [size] pixels across. Safe to call off the
     * main thread: every Paint and Path here is its own.
     */
    fun render(st: Sticker, size: Int): Bitmap {
        st.image?.let { return renderPicture(it, size) }
        val u = size / 100f // designed on a 100-unit square
        // 1. The badge, the emoji and the caption, on their own.
        val art = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val a = Canvas(art)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        val tilt = ((st.id.hashCode() % 7) - 3) * 1.6f // a slight, steady tilt, different per sticker
        a.save()
        a.rotate(tilt, 50f * u, 50f * u)

        val path = shapePath(st.shape, u)
        paint.shader = LinearGradient(0f, 12f * u, 0f, 80f * u, st.colors[0], st.colors[1], Shader.TileMode.CLAMP)
        a.drawPath(path, paint)
        paint.shader = null
        // A gloss across the top of the badge.
        paint.color = Color.WHITE
        paint.alpha = 50
        a.save()
        a.clipPath(path)
        a.drawOval(RectF(18f * u, 10f * u, 82f * u, 38f * u), paint)
        a.restore()

        // The caption: white with a dark outline. A long one goes on two lines
        // rather than shrinking to nothing; either way it stays inside the cut.
        val text = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isFakeBoldText = st.caption.any { it.code in 0x1200..0x139F } // Ethiopic fonts often lack a bold
            textSize = 17f * u
        }
        val maxW = 82f * u
        val lines = captionLines(st.caption, text, maxW)
        if (lines.size > 1) text.textSize = 14.5f * u
        val widest = lines.maxOfOrNull { text.measureText(it) } ?: 0f
        if (widest > maxW) text.textSize *= maxW / widest

        // The emoji, big, sitting above the caption.
        paint.alpha = 255
        paint.textAlign = Paint.Align.CENTER
        paint.textSize = when (lines.size) { 0 -> 54f; 1 -> 40f; else -> 32f } * u
        val ey = when (lines.size) { 0 -> 50f; 1 -> 44f; else -> 35f } * u
        a.drawText(st.emoji, 50f * u, ey - (paint.descent() + paint.ascent()) / 2f, paint)

        val lineH = text.textSize * 1.12f
        val firstY = (if (lines.size > 1) 77f else 84f) * u - lineH * (lines.size - 1) / 2f
        for ((i, line) in lines.withIndex()) {
            val by = firstY + lineH * i - (text.descent() + text.ascent()) / 2f
            text.style = Paint.Style.STROKE
            text.strokeJoin = Paint.Join.ROUND
            text.strokeWidth = text.textSize * 0.28f
            text.color = darken(st.colors[1])
            a.drawText(line, 50f * u, by, text)
            text.style = Paint.Style.FILL
            text.color = Color.WHITE
            a.drawText(line, 50f * u, by, text)
        }
        a.restore()

        // 2. Cut it out: a white border all round the art, and a soft shadow beneath.
        val out = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val o = Canvas(out)
        val mask = art.extractAlpha()
        val border = 3.2f * u
        val shadow = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.BLACK
            alpha = 70
            maskFilter = BlurMaskFilter(3f * u, BlurMaskFilter.Blur.NORMAL)
        }
        o.drawBitmap(mask, 0f, 2.2f * u, shadow)
        val white = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
        o.drawBitmap(mask, 0f, 0f, white)
        for (k in 0 until 16) {
            val ang = Math.PI * 2 * k / 16
            o.drawBitmap(mask, (cos(ang) * border).toFloat(), (sin(ang) * border).toFloat(), white)
        }
        o.drawBitmap(art, 0f, 0f, null)
        mask.recycle()
        art.recycle()
        return out
    }

    /** A pack's picture, scaled to fit a transparent square [size] pixels across. */
    private fun renderPicture(image: String, size: Int): Bitmap {
        val out = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val src = StickerPacks.decode(image, size) ?: return out
        val k = minOf(size.toFloat() / src.width, size.toFloat() / src.height)
        val w = src.width * k
        val h = src.height * k
        val dst = RectF((size - w) / 2f, (size - h) / 2f, (size + w) / 2f, (size + h) / 2f)
        Canvas(out).drawBitmap(src, null, dst, Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG))
        src.recycle()
        return out
    }

    /** One line if it fits (or can't be split), else two, split at the space nearest the middle. */
    private fun captionLines(caption: String, text: Paint, maxW: Float): List<String> {
        if (caption.isEmpty()) return emptyList()
        if (text.measureText(caption) <= maxW || ' ' !in caption) return listOf(caption)
        val mid = caption.length / 2
        val cut = caption.indices.filter { caption[it] == ' ' }.minByOrNull { kotlin.math.abs(it - mid) }!!
        return listOf(caption.substring(0, cut), caption.substring(cut + 1))
    }

    /** The badge outline, kept inside the square with room for the border and shadow. */
    private fun shapePath(shape: Shape, u: Float): Path {
        val p = Path()
        when (shape) {
            Shape.CIRCLE -> p.addCircle(50f * u, 50f * u, 40f * u, Path.Direction.CW)
            Shape.SQUARE -> p.addRoundRect(RectF(12f * u, 12f * u, 88f * u, 88f * u), 16f * u, 16f * u, Path.Direction.CW)
            Shape.BURST -> {
                val points = 14
                for (i in 0 until points * 2) {
                    val r = (if (i % 2 == 0) 42f else 35f) * u
                    val ang = Math.PI * i / points - Math.PI / 2
                    val x = 50f * u + (cos(ang) * r).toFloat()
                    val y = 50f * u + (sin(ang) * r).toFloat()
                    if (i == 0) p.moveTo(x, y) else p.lineTo(x, y)
                }
                p.close()
            }
            Shape.BLOB -> {
                p.moveTo(50f * u, 9f * u)
                p.cubicTo(76f * u, 7f * u, 92f * u, 26f * u, 90f * u, 50f * u)
                p.cubicTo(89f * u, 76f * u, 72f * u, 91f * u, 48f * u, 90f * u)
                p.cubicTo(24f * u, 89f * u, 9f * u, 74f * u, 10f * u, 49f * u)
                p.cubicTo(11f * u, 25f * u, 26f * u, 11f * u, 50f * u, 9f * u)
                p.close()
            }
            Shape.HEART -> {
                p.moveTo(50f * u, 90f * u)
                p.cubicTo(18f * u, 70f * u, 6f * u, 50f * u, 9f * u, 32f * u)
                p.cubicTo(12f * u, 14f * u, 38f * u, 8f * u, 50f * u, 26f * u)
                p.cubicTo(62f * u, 8f * u, 88f * u, 14f * u, 91f * u, 32f * u)
                p.cubicTo(94f * u, 50f * u, 82f * u, 70f * u, 50f * u, 90f * u)
                p.close()
            }
        }
        return p
    }

    private fun darken(c: Int): Int =
        Color.rgb((Color.red(c) * 0.45f).toInt(), (Color.green(c) * 0.45f).toInt(), (Color.blue(c) * 0.45f).toInt())

    // ─── Thumbnails for the panel ────────────────────────────────────────

    private val worker = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())
    private val pending = HashSet<String>()
    private val thumbs = object : LruCache<String, Bitmap>(12 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap) = value.byteCount
    }

    /**
     * The sticker drawn [size] pixels across, or null while it is still being drawn
     * in the background; [ready] runs on the main thread once it is.
     */
    fun thumbnail(st: Sticker, size: Int, ready: () -> Unit): Bitmap? {
        val key = "${st.id}@$size"
        thumbs.get(key)?.let { return it }
        if (pending.add(key)) {
            worker.execute {
                val bmp = render(st, size)
                main.post { thumbs.put(key, bmp); pending.remove(key); ready() }
            }
        }
        return null
    }

    // ─── Moving stickers in the panel ────────────────────────────────────

    private val animWorker = Executors.newSingleThreadExecutor()
    private val animPending = HashSet<String>()
    /** Only the stickers on screen play; ones scrolled away are stopped and dropped. */
    private val anims = object : LruCache<String, android.graphics.drawable.Drawable>(20) {
        override fun entryRemoved(evicted: Boolean, key: String, old: android.graphics.drawable.Drawable, new: android.graphics.drawable.Drawable?) {
            if (android.os.Build.VERSION.SDK_INT >= 28) (old as? android.graphics.drawable.AnimatedImageDrawable)?.stop()
            old.callback = null
        }
    }

    /**
     * A video sticker playing, [size] pixels across at most, or null while it loads
     * (show [thumbnail] meanwhile) or where it can't play; [ready] runs once it can.
     */
    fun animated(st: Sticker, size: Int, callback: android.graphics.drawable.Drawable.Callback, ready: () -> Unit): android.graphics.drawable.Drawable? {
        val anim = st.anim ?: return null
        if (android.os.Build.VERSION.SDK_INT < 28) return null
        val key = "${st.id}@$size"
        anims.get(key)?.let { if (it.callback !== callback) it.callback = callback; return it }
        if (animPending.add(key)) animWorker.execute {
            val d = StickerPacks.decodeAnimated(anim, size)
            main.post {
                animPending.remove(key)
                if (d != null) {
                    d.callback = callback
                    (d as? android.graphics.drawable.AnimatedImageDrawable)?.apply { repeatCount = android.graphics.drawable.AnimatedImageDrawable.REPEAT_INFINITE; start() }
                    anims.put(key, d)
                    ready()
                }
            }
        }
        return null
    }

    /** Stops every playing sticker, when the panel closes or leaves the sticker tab. */
    fun stopAnimations() = anims.evictAll()

    // ─── Sending ─────────────────────────────────────────────────────────

    const val MIME = "image/png"
    /** WhatsApp's sticker size. */
    private const val SEND_SIZE = 512
    /** Bump when the drawing changes, so files cached by an older version aren't sent. */
    private const val LOOK = 3

    /** Writes [st] as a PNG in the cache and hands back a content:// link to it, off the main thread. */
    fun export(context: Context, st: Sticker, done: (Uri?) -> Unit) {
        val app = context.applicationContext
        worker.execute {
            val uri = try {
                val dir = File(app.cacheDir, "stickers").apply { mkdirs() }
                val file = File(dir, "akai_${LOOK}_${st.id}.png")
                if (!file.exists()) {
                    val bmp = render(st, SEND_SIZE)
                    val tmp = File(dir, "${file.name}.tmp")
                    tmp.outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
                    bmp.recycle()
                    tmp.renameTo(file)
                }
                FileProvider.getUriForFile(app, "${app.packageName}.fileprovider", file)
            } catch (e: Exception) {
                null
            }
            main.post { done(uri) }
        }
    }
}
