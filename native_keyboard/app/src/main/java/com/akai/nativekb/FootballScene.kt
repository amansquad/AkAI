package com.akai.nativekb

import android.content.Context
import android.content.res.AssetManager
import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.os.Handler
import android.os.Looper
import androidx.core.graphics.ColorUtils
import java.util.Random
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

/**
 * The football-club scenes. Every club looks like a photo of its shirt with the
 * crest on it: the kit's own pattern (stripes, hoops, sash, PSG's centre band,
 * Bayern's diamonds...) in felt-textured fabric with diagonal folds, and the
 * club's crest from assets/crests/<theme id>.webp. A club with no crest there
 * gets a drawn oval badge with its initials and founding year instead. A club
 * with a full picture in assets/kits/<theme id>.webp shows that picture.
 * Either way the image breathes with a slow zoom under a drifting sheen.
 */
object FootballScene {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val bmpPaint = Paint(Paint.FILTER_BITMAP_FLAG)
    private val dst = RectF()
    private val add = PorterDuffXfermode(PorterDuff.Mode.ADD)

    private fun a(color: Int, o: Float) = ColorUtils.setAlphaComponent(color, (o * 255f).toInt().coerceIn(0, 255))
    private fun reset() { paint.shader = null; paint.xfermode = null; paint.style = Paint.Style.FILL; paint.strokeWidth = 1f; paint.maskFilter = null }

    fun paint(canvas: Canvas, w: Float, h: Float, time: Float, type: String) {
        val bmp = photo(type) ?: kitArt(w, h, type)
        val breathe = 1.04f + 0.03f * sin(time * 0.25f * 2f * PI.toFloat())
        val scale = max(w / bmp.width, h / bmp.height) * breathe
        val bw = bmp.width * scale; val bh = bmp.height * scale
        dst.set((w - bw) / 2f, (h - bh) / 2f, (w + bw) / 2f, (h + bh) / 2f)
        canvas.drawBitmap(bmp, null, dst, bmpPaint)
        sheen(canvas, w, h, time)
    }

    /** A slow sheen drifting diagonally across the shirt. */
    private fun sheen(c: Canvas, w: Float, h: Float, time: Float) {
        val t = (time * 0.6f) % 1f
        val sx = -w * 0.6f + t * w * 2.2f
        reset()
        paint.xfermode = add
        paint.shader = LinearGradient(
            sx, 0f, sx + w * 0.35f, h * 0.6f,
            intArrayOf(0, a(0xFFFFFFFF.toInt(), 0.07f), 0), floatArrayOf(0f, 0.5f, 1f), Shader.TileMode.CLAMP,
        )
        c.drawRect(0f, 0f, w, h, paint)
        reset()
    }

    // ── Club photos ─────────────────────────────────────────────────────────
    // Loaded off the main thread; until one is ready the drawn kit stands in.

    private var assets: AssetManager? = null
    private var kits: Set<String> = emptySet()
    private val photos = HashMap<String, Bitmap>()
    private val loadingPhotos = HashSet<String>()
    private val main by lazy { Handler(Looper.getMainLooper()) }

    /** Gives the scene access to the bundled club photos. Cheap to call on every frame. */
    fun attach(context: Context) {
        if (assets != null) return
        val am = context.applicationContext.assets
        assets = am
        kits = try { am.list("kits")?.map { it.substringBeforeLast('.') }?.toSet() ?: emptySet() } catch (e: Exception) { emptySet() }
    }

    private fun photo(type: String): Bitmap? {
        photos[type]?.let { return it }
        val am = assets ?: return null
        if (type !in kits || !loadingPhotos.add(type)) return null
        Thread {
            val bmp = try { am.open("kits/$type.webp").use { BitmapFactory.decodeStream(it) } } catch (e: Exception) { null }
            main.post { if (bmp != null) photos[type] = bmp else kits = kits - type }
        }.start()
        return null
    }

    // ── The drawn shirt and badge ───────────────────────────────────────────

    /** How a kit is laid out across the shirt. */
    private enum class Pat { STRIPES, PINSTRIPES, HOOPS, HALVES, DIAGONAL, SASH, SLEEVES, CENTRE, DIAMONDS, CHEVRONS, TONAL }

    /** A shirt: its pattern, base colour, second colour and (for CENTRE) the edging colour. */
    private class Kit(val pat: Pat, val c1: Int, val c2: Int, val c3: Int = c2)

    private fun k(pat: Pat, c1: Long, c2: Long, c3: Long = c2) = Kit(pat, c1.toInt(), c2.toInt(), c3.toInt())

    /** Each club's shirt, after its real kit where it has a famous one. */
    private val kitSpecs = mapOf(
        "fb_arsenal" to k(Pat.SLEEVES, 0xFFEF0107, 0xFFF2F2F2),
        "fb_manutd" to k(Pat.TONAL, 0xFFDA291C, 0xFF140A0A),
        "fb_realmadrid" to k(Pat.PINSTRIPES, 0xFFF4F4F4, 0xFFFEBE10),
        "fb_monaco" to k(Pat.DIAGONAL, 0xFFE63312, 0xFFF4F4F4),
        "fb_barca" to k(Pat.STRIPES, 0xFF004D98, 0xFFA50044),
        "fb_juventus" to k(Pat.STRIPES, 0xFFF4F4F4, 0xFF141414),
        "fb_inter" to k(Pat.STRIPES, 0xFF0068A8, 0xFF10141C),
        "fb_milan" to k(Pat.STRIPES, 0xFFFB090B, 0xFF1A1A1A),
        "fb_mancity" to k(Pat.TONAL, 0xFF6CABDD, 0xFFFFFFFF),
        "fb_liverpool" to k(Pat.TONAL, 0xFFC8102E, 0xFF5A0010),
        "fb_chelsea" to k(Pat.TONAL, 0xFF034694, 0xFFFFFFFF),
        "fb_psg" to k(Pat.CENTRE, 0xFF004170, 0xFFDA291C, 0xFFF4F4F4),
        "fb_bayern" to k(Pat.DIAMONDS, 0xFFDC052D, 0xFF9E0420),
        "fb_dortmund" to k(Pat.CHEVRONS, 0xFFFDE100, 0xFF16161A),
        "fb_leipzig" to k(Pat.SASH, 0xFFF4F4F4, 0xFFDD0741),
        "fb_stgeorge" to k(Pat.SASH, 0xFFFFD100, 0xFFD7191C),
        "fb_coffee" to k(Pat.STRIPES, 0xFF8B4513, 0xFFFFC107),
        "club_sidama" to k(Pat.HOOPS, 0xFF2E7D32, 0xFF795548),
        "fb_mekelle" to k(Pat.HALVES, 0xFFE53935, 0xFFFFD600),
        "fb_diredawa" to k(Pat.DIAGONAL, 0xFFFF7043, 0xFF1E88E5),
        "club_awash" to k(Pat.CHEVRONS, 0xFF1976D2, 0xFFE3F2FD),
        "club_arba" to k(Pat.PINSTRIPES, 0xFF43A047, 0xFFB2DFDB),
        "fb_hawassa" to k(Pat.SASH, 0xFF00ACC1, 0xFF01579B),
        "club_bahirdar" to k(Pat.HOOPS, 0xFF00ACC1, 0xFF1A237E),
        "club_electric" to k(Pat.STRIPES, 0xFFD32F2F, 0xFFF4F4F4),
        "club_insurance" to k(Pat.TONAL, 0xFF1A3A8F, 0xFFFFFFFF),
        "club_mekel" to k(Pat.CENTRE, 0xFF2E5E1E, 0xFFC62828, 0xFFFFD600),
        "club_dicha" to k(Pat.STRIPES, 0xFF1565C0, 0xFFC62828),
        "fb_cbe" to k(Pat.DIAMONDS, 0xFF7B1FA2, 0xFF4A1264),
        "club_cbe" to k(Pat.DIAMONDS, 0xFF7B1FA2, 0xFF4A1264),
        "club_negede" to k(Pat.SASH, 0xFFB71C1C, 0xFFFFD600),
        "fb_negele_arsi" to k(Pat.HOOPS, 0xFF388E3C, 0xFFD32F2F),
        "club_shire" to k(Pat.SLEEVES, 0xFF2E6B1E, 0xFFFFD600),
        "club_welwalo" to k(Pat.SLEEVES, 0xFFC62828, 0xFFFFF8E1),
        "club_fasil" to k(Pat.HALVES, 0xFFC62828, 0xFFF4F4F4),
        "club_woldia" to k(Pat.SASH, 0xFF1A3A8F, 0xFFF4F4F4),
        "club_hamb" to k(Pat.CHEVRONS, 0xFF00897B, 0xFFE0F2F1),
        "club_adama" to k(Pat.DIAGONAL, 0xFF2E7D32, 0xFFF57C00),
        "club_hadiya" to k(Pat.STRIPES, 0xFFF9A825, 0xFFC62828),
    )

    /** The club's real crest from assets/crests, if there is one. Small, so it is read in place. */
    private fun crest(type: String): Bitmap? {
        val am = assets ?: return null
        return try { am.open("crests/$type.webp").use { BitmapFactory.decodeStream(it) } } catch (e: Exception) { null }
    }

    /** Initials for the top of the badge and the founding year (or country) for the bottom. */
    private val badges = mapOf(
        "fb_stgeorge" to ("SGFC" to "1935"),
        "fb_coffee" to ("EBFC" to "1976"),
        "club_sidama" to ("SCFC" to "ETHIOPIA"),
        "fb_mekelle" to ("MK70" to "ETHIOPIA"),
        "fb_diredawa" to ("DDK" to "ETHIOPIA"),
        "club_awash" to ("AKFC" to "ETHIOPIA"),
        "club_arba" to ("AMC" to "ETHIOPIA"),
        "fb_hawassa" to ("HCFC" to "ETHIOPIA"),
        "club_bahirdar" to ("BDK" to "ETHIOPIA"),
        "club_electric" to ("EEFC" to "ETHIOPIA"),
        "club_insurance" to ("EIFC" to "ETHIOPIA"),
        "club_mekel" to ("MEK" to "ETHIOPIA"),
        "club_dicha" to ("WDFC" to "ETHIOPIA"),
        "fb_cbe" to ("CBE" to "ETHIOPIA"),
        "club_cbe" to ("CBE" to "ETHIOPIA"),
        "club_negede" to ("NAFC" to "ETHIOPIA"),
        "fb_negele_arsi" to ("NAFC" to "ETHIOPIA"),
        "club_shire" to ("SEFC" to "ETHIOPIA"),
        "club_welwalo" to ("WAU" to "ETHIOPIA"),
        "club_fasil" to ("FKFC" to "ETHIOPIA"),
        "club_woldia" to ("WSC" to "ETHIOPIA"),
        "club_hamb" to ("HCFC" to "ETHIOPIA"),
        "club_adama" to ("ACFC" to "ETHIOPIA"),
        "club_hadiya" to ("HHFC" to "ETHIOPIA"),
        "fb_leipzig" to ("RBL" to "2009"),
        "fb_arsenal" to ("AFC" to "1886"),
        "fb_manutd" to ("MUFC" to "1878"),
        "fb_milan" to ("ACM" to "1899"),
        "fb_realmadrid" to ("RMCF" to "1902"),
        "fb_monaco" to ("ASM" to "1924"),
        "fb_barca" to ("FCB" to "1899"),
        "fb_juventus" to ("JFC" to "1897"),
        "fb_inter" to ("FCIM" to "1908"),
        "fb_mancity" to ("MCFC" to "1880"),
        "fb_liverpool" to ("LFC" to "1892"),
        "fb_chelsea" to ("CFC" to "1905"),
        "fb_psg" to ("PSG" to "1970"),
        "fb_bayern" to ("FCB" to "1900"),
        "fb_dortmund" to ("BVB" to "1909"),
    )

    /** The art is costly to build, so it is rendered once per club and size. */
    private var art: Bitmap? = null
    private var artKey = ""

    /** Darkens a kit colour for the fabric: light colours drop to a deep tone, near-blacks lift to charcoal. */
    private fun fabricTone(color: Int): Int {
        val hsl = FloatArray(3)
        ColorUtils.colorToHSL(color, hsl)
        // Near-blacks lift to a cool charcoal; everything else keeps its hue, deepened.
        if (hsl[2] < 0.12f) return 0xFF22252D.toInt()
        hsl[2] = 0.08f + hsl[2] * 0.36f
        return ColorUtils.HSLToColor(hsl)
    }

    /** Built at the screen's real pixel size so the badge lettering stays sharp. */
    private fun kitArt(w: Float, h: Float, type: String): Bitmap {
        val density = Resources.getSystem().displayMetrics.density
        val pw = max(1, (w * density).toInt()); val ph = max(1, (h * density).toInt())
        val key = "$type:$pw:$ph"
        art?.let { if (artKey == key && !it.isRecycled) return it }
        val st = FootballStyles.all[type] ?: TeamStyle(0xFF2E7D32.toInt(), 0xFFFFFFFF.toInt(), "")
        val kit = kitSpecs[type] ?: Kit(Pat.STRIPES, st.primary, st.secondary)
        val bmp = Bitmap.createBitmap(pw, ph, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        val fabric = fabric(pw / 2, ph / 2, type, kit)
        dst.set(0f, 0f, pw.toFloat(), ph.toFloat())
        c.drawBitmap(fabric, null, dst, bmpPaint)
        fabric.recycle()
        val crest = crest(type)
        if (crest != null) { placeCrest(c, pw.toFloat(), ph.toFloat(), crest); crest.recycle() }
        else badge(c, pw.toFloat(), ph.toFloat(), st, badges[type] ?: ("FC" to ""))
        vignette(c, pw.toFloat(), ph.toFloat())
        art?.recycle()
        art = bmp; artKey = key
        return bmp
    }

    /**
     * The shirt in its kit pattern, in a felt-like weave (clumped fibres over
     * fine grain) with diagonal folds of light and shadow.
     */
    private fun fabric(bw: Int, bh: Int, type: String, kit: Kit): Bitmap {
        val t1 = fabricTone(kit.c1); val t2 = fabricTone(kit.c2); val t3 = fabricTone(kit.c3)
        val r1 = Color.red(t1); val g1 = Color.green(t1); val b1 = Color.blue(t1)
        val r2 = Color.red(t2); val g2 = Color.green(t2); val b2 = Color.blue(t2)
        val r3 = Color.red(t3); val g3 = Color.green(t3); val b3 = Color.blue(t3)
        val fw = bw.toFloat(); val fh = bh.toFloat()
        val fold = fw * 0.16f
        val rand = Random(type.hashCode().toLong())
        // Coarse noise for the clumps of felt, interpolated between cells
        val cell = max(2, bw / 90)
        val gw = bw / cell + 2; val gh = bh / cell + 2
        val coarse = FloatArray(gw * gh) { rand.nextFloat() }
        // Pattern sizes
        val stripe = fw / 6.5f
        val pin = fw / 16f
        val hoop = fh / 4.2f
        val diamond = fw / 9f
        val chevron = fh / 3.2f
        val px = IntArray(bw * bh)
        for (y in 0 until bh) {
            val fy = y / fh
            val gy = y.toFloat() / cell; val gy0 = gy.toInt(); val ty = gy - gy0
            for (x in 0 until bw) {
                val xf = x.toFloat(); val yf = y.toFloat()
                // Weight of the second colour (w2) and the edging colour (w3); the rest is the base colour.
                var w2 = 0f; var w3 = 0f
                when (kit.pat) {
                    Pat.STRIPES -> w2 = 1f - bands((xf + fw * 0.08f) / stripe, stripe)
                    Pat.HOOPS -> w2 = 1f - bands((yf + fh * 0.1f) / hoop, hoop)
                    Pat.PINSTRIPES -> w2 = line((xf + pin * 0.5f) / pin, pin, 1.3f) * 0.85f
                    Pat.HALVES -> w2 = edge(xf - fw / 2f)
                    Pat.DIAGONAL -> w2 = edge((xf - fw / 2f) + (yf - fh / 2f) * 0.9f)
                    Pat.SASH -> w2 = edge(fw * 0.11f - abs((xf - fw * 0.45f) - (yf - fh / 2f) * 0.8f) * 0.78f)
                    Pat.SLEEVES -> w2 = edge(abs(xf - fw / 2f) - fw * 0.36f)
                    Pat.CENTRE -> {
                        val d = abs(xf - fw / 2f)
                        w2 = edge(fw * 0.1f - d)
                        w3 = edge(fw * 0.135f - d) - w2
                    }
                    Pat.DIAMONDS -> {
                        val u = floor((xf + yf) / diamond).toInt(); val v = floor((xf - yf) / diamond).toInt()
                        w2 = if (((u + v) and 1) == 0) 1f else 0f
                    }
                    Pat.CHEVRONS -> {
                        val zig = abs(((xf / (fw / 5f)) % 1f) - 0.5f) * fw / 5f * 0.9f
                        w2 = line((yf + zig) / chevron, chevron, fh * 0.035f)
                    }
                    Pat.TONAL -> w2 = line((xf + yf * 0.6f) / (pin * 0.7f), pin * 0.7f, 1f) * 0.22f
                }
                val w1 = (1f - w2 - w3).coerceIn(0f, 1f)
                // Diagonal folds: two crossing waves give the creased shading
                val d1 = sin(((xf * 0.75f + yf) / fold).toDouble()).toFloat()
                val d2 = sin(((xf * 0.35f + yf * 1.1f) / (fold * 2.7f)) + 1.3).toFloat()
                var light = 0.8f + d1 * 0.24f + d2 * 0.16f
                // Darker towards the foot, as in a shirt photographed under one light
                light *= 1.05f - fy * 0.35f
                // Felt clumps
                val gx = xf / cell; val gx0 = gx.toInt(); val tx = gx - gx0
                val i0 = gy0 * gw + gx0
                val top = coarse[i0] + (coarse[i0 + 1] - coarse[i0]) * tx
                val bot = coarse[i0 + gw] + (coarse[i0 + gw + 1] - coarse[i0 + gw]) * tx
                light *= 0.8f + (top + (bot - top) * ty) * 0.4f
                // Fine grain with the odd bright fibre
                val n = rand.nextFloat()
                light *= 0.85f + n * 0.25f
                if (n > 0.985f) light += 0.3f
                light = light.coerceIn(0f, 1.6f)
                val r = ((r1 * w1 + r2 * w2 + r3 * w3) * light).toInt().coerceIn(0, 255)
                val g = ((g1 * w1 + g2 * w2 + g3 * w3) * light).toInt().coerceIn(0, 255)
                val b = ((b1 * w1 + b2 * w2 + b3 * w3) * light).toInt().coerceIn(0, 255)
                px[y * bw + x] = Color.rgb(r, g, b)
            }
        }
        return Bitmap.createBitmap(px, bw, bh, Bitmap.Config.ARGB_8888)
    }

    /** 1 inside even bands, 0 inside odd ones, with a soft seam; [u] counts bands of [size] pixels. */
    private fun bands(u: Float, size: Float): Float {
        val f = u - floor(u)
        val seam = (min(f, 1f - f) * size / 1.8f).coerceIn(0f, 1f)
        return if ((floor(u).toInt() and 1) == 0) 0.5f + seam * 0.5f else 0.5f - seam * 0.5f
    }

    /** 1 on a thin line of [width] pixels repeating every band of [size] pixels, softly edged. */
    private fun line(u: Float, size: Float, width: Float): Float {
        val f = u - floor(u)
        return edge(width / 2f - abs(f - 0.5f) * size)
    }

    /** Antialiased step: 1 where [d] (pixels) is well above zero, 0 well below. */
    private fun edge(d: Float) = (0.5f + d / 1.2f).coerceIn(0f, 1f)

    /** The real crest, centred where a crest sits on a shirt photo, with a soft shadow beneath. */
    private fun placeCrest(c: Canvas, w: Float, h: Float, crest: Bitmap) {
        val s = min(h * 0.6f / crest.height, w * 0.5f / crest.width)
        val cw = crest.width * s; val ch = crest.height * s
        val cx = w / 2f; val cy = h * 0.54f
        val r = RectF(cx - cw / 2f, cy - ch / 2f, cx + cw / 2f, cy + ch / 2f)
        val alpha = crest.extractAlpha()
        reset()
        paint.color = a(0xFF000000.toInt(), 0.75f)
        paint.maskFilter = BlurMaskFilter(ch * 0.04f, BlurMaskFilter.Blur.NORMAL)
        c.drawBitmap(alpha, null, RectF(r).apply { offset(cw * 0.025f, ch * 0.03f) }, paint)
        reset()
        alpha.recycle()
        c.drawBitmap(crest, null, r, Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG))
    }

    /**
     * The oval badge, centred, with a star above: a white rim, a ring in the
     * club's darker colour, a white field with the initials on top and the year
     * below, and a disc of kit stripes between them.
     */
    private fun badge(c: Canvas, w: Float, h: Float, st: TeamStyle, text: Pair<String, String>) {
        val bh = h * 0.6f; val bw = bh * 0.68f
        val cx = w / 2f; val cy = h * 0.54f
        val oval = RectF(cx - bw / 2f, cy - bh / 2f, cx + bw / 2f, cy + bh / 2f)
        // The ring and lettering take whichever kit colour is darker, deepened.
        val dark = if (ColorUtils.calculateLuminance(st.primary) <= ColorUtils.calculateLuminance(st.secondary)) st.primary else st.secondary
        val ring = ColorUtils.blendARGB(dark, 0xFF000000.toInt(), 0.35f)

        // Shadow on the fabric
        reset()
        paint.color = a(0xFF000000.toInt(), 0.65f)
        paint.maskFilter = BlurMaskFilter(bh * 0.05f, BlurMaskFilter.Blur.NORMAL)
        c.drawOval(RectF(oval).apply { offset(bw * 0.02f, bh * 0.025f) }, paint)
        reset()

        // White outer rim, then the coloured ring
        paint.color = 0xFFE9E6E6.toInt(); c.drawOval(oval, paint)
        val rimIn = bw * 0.03f
        val ringOval = RectF(oval).apply { inset(rimIn, rimIn) }
        paint.color = ring; c.drawOval(ringOval, paint)
        val ringIn = bw * 0.075f
        val field = RectF(ringOval).apply { inset(ringIn, ringIn) }
        paint.shader = LinearGradient(0f, field.top, 0f, field.bottom, 0xFFFFFFFF.toInt(), 0xFFD9D6D6.toInt(), Shader.TileMode.CLAMP)
        c.drawOval(field, paint)
        reset()

        // Disc of kit stripes across the middle of the field
        val r = field.width() / 2f
        val disc = Path().apply { addCircle(cx, cy, r, Path.Direction.CW) }
        c.save()
        c.clipPath(disc)
        val n = 7
        val sw = r * 2f / n
        for (i in 0 until n) {
            paint.color = ColorUtils.blendARGB(if (i % 2 == 0) st.primary else st.secondary, 0xFF000000.toInt(), 0.12f)
            c.drawRect(cx - r + i * sw, cy - r, cx - r + (i + 1) * sw + 0.5f, cy + r, paint)
        }
        // Thin dark seams between the stripes
        paint.color = a(ring, 0.8f)
        for (i in 1 until n) c.drawRect(cx - r + i * sw - sw * 0.06f, cy - r, cx - r + i * sw + sw * 0.06f, cy + r, paint)
        c.restore()
        reset()
        paint.style = Paint.Style.STROKE; paint.strokeWidth = bw * 0.025f; paint.color = ring
        c.drawCircle(cx, cy, r, paint)
        reset()

        // Lettering in the white segments above and below the disc
        paint.color = ring
        paint.typeface = Typeface.create("sans-serif-condensed", Typeface.BOLD)
        paint.textAlign = Paint.Align.CENTER
        fun label(s: String, top: Float, bottom: Float, maxW: Float) {
            if (s.isEmpty()) return
            val segH = bottom - top
            paint.textSize = segH * 0.62f
            val tw = paint.measureText(s)
            if (tw > maxW) paint.textSize *= maxW / tw
            val fm = paint.fontMetrics
            c.drawText(s, cx, (top + bottom) / 2f - (fm.ascent + fm.descent) / 2f, paint)
        }
        label(text.first, field.top, cy - r, field.width() * 0.62f)
        label(text.second, cy + r, field.bottom, field.width() * 0.6f)
        paint.typeface = null; paint.textAlign = Paint.Align.LEFT

        // Gloss over the upper left
        paint.shader = RadialGradient(cx - bw * 0.2f, cy - bh * 0.25f, bw * 0.7f, a(0xFFFFFFFF.toInt(), 0.18f), 0, Shader.TileMode.CLAMP)
        c.drawOval(oval, paint)
        reset()

        // Star above the badge
        star(c, cx, oval.top - bh * 0.1f, bh * 0.055f, 0xFFF2CFC2.toInt())
    }

    private fun star(c: Canvas, cx: Float, cy: Float, r: Float, color: Int) {
        val p = Path()
        for (i in 0 until 10) {
            val rr = if (i % 2 == 0) r else r * 0.42f
            val ang = -PI / 2 + i * PI / 5
            val x = cx + (cos(ang) * rr).toFloat(); val y = cy + (sin(ang) * rr).toFloat()
            if (i == 0) p.moveTo(x, y) else p.lineTo(x, y)
        }
        p.close()
        reset()
        paint.color = a(0xFF000000.toInt(), 0.5f)
        paint.maskFilter = BlurMaskFilter(r * 0.3f, BlurMaskFilter.Blur.NORMAL)
        c.save(); c.translate(r * 0.08f, r * 0.12f); c.drawPath(p, paint); c.restore()
        reset()
        paint.color = color
        c.drawPath(p, paint)
    }

    private fun vignette(c: Canvas, w: Float, h: Float) {
        reset()
        paint.shader = RadialGradient(
            w / 2f, h / 2f, min(w, h) * 1.1f,
            intArrayOf(0, 0, a(0xFF000000.toInt(), 0.35f)), floatArrayOf(0f, 0.6f, 1f), Shader.TileMode.CLAMP,
        )
        c.drawRect(0f, 0f, w, h, paint)
        reset()
    }
}
