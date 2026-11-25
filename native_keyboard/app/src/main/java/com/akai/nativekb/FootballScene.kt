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
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * The football-club scenes. Each club's motif (ClubMotifs: what the club is
 * known by, like Arsenal's cannon for the Gunners or lightning for Ethio
 * Electric) plays over the background, casting a shadow onto it. A club with
 * a crest in assets/crests/<theme id>.webp gets the crest's own colours glowing
 * behind, and the crest itself as a solid 3D badge: it has real thickness,
 * tilts gently in perspective, casts a shadow that moves with it and catches
 * a glint of light as it turns. A club with no crest gets its shirt in the kit
 * pattern with its name across it (never a made-up badge).
 */
object FootballScene {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val bmpPaint = Paint(Paint.FILTER_BITMAP_FLAG)
    private val dst = RectF()

    private fun a(color: Int, o: Float) = ColorUtils.setAlphaComponent(color, (o * 255f).toInt().coerceIn(0, 255))
    private fun reset() { paint.shader = null; paint.xfermode = null; paint.style = Paint.Style.FILL; paint.strokeWidth = 1f; paint.maskFilter = null }

    fun paint(canvas: Canvas, w: Float, h: Float, time: Float, type: String) {
        // The kit photo is only for a club with neither a crest nor a name to show.
        val photo = if (hasCrest(type) || type in wordmarks) null else photo(type)
        val bmp = photo ?: kitArt(w, h, type)
        val scale = max(w / bmp.width, h / bmp.height)
        val bw = bmp.width * scale; val bh = bmp.height * scale
        dst.set((w - bw) / 2f, (h - bh) / 2f, (w + bw) / 2f, (h + bh) / 2f)
        canvas.drawBitmap(bmp, null, dst, bmpPaint)
        if (photo != null) return
        // The club's motif: what it is known by (Arsenal's cannon for the Gunners,
        // lightning for Ethio Electric, Gondar's castle for Fasil Kenema...)
        FootballStyles.all[type]?.let { st -> motif(canvas, w, h, time, st, motifOf(type) ?: st.motif) }
        val b = badge
        if (b != null && badgeKey == artKey) badge3d(canvas, time, b, dst.width() / bmp.width)
    }

    // ── The club's motif ────────────────────────────────────────────────────

    /**
     * The motifs were timed for a faster clock; at this pace the cannon fires
     * and the lightning strikes every couple of seconds instead of twice a second.
     */
    private const val MOTIF_SPEED = 0.25f
    /** The motifs were drawn for a smaller stage; scaled up they read past the keys. */
    private const val MOTIF_SCALE = 1.5f

    /** Where the generated FootballStyles motif misses the club: Chelsea's crest is a lion, not a sun. */
    private val motifOverrides = mapOf("fb_chelsea" to "lion")

    /** Turns everything drawn in its layer into a translucent black silhouette: the motif's shadow. */
    private val shadowLayer = Paint().apply {
        colorFilter = android.graphics.PorterDuffColorFilter(0x73000000, PorterDuff.Mode.SRC_IN)
    }

    /**
     * Draws the motif twice: first as a shadow, dropped down and to the right
     * onto the background, then itself, so it stands off the background
     * instead of lying flat on it.
     */
    private fun motif(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle, name: String) {
        val t = time * MOTIF_SPEED
        c.saveLayer(null, shadowLayer)
        c.translate(w * 0.012f, h * 0.03f)
        motifPass(c, w, h, t, st, name)
        c.restore()
        motifPass(c, w, h, t, st, name)
    }

    /**
     * Motifs that read well as a matching pair, one on each side of the crest:
     * cannons flanking it, a row of wind turbines, Axum's stelae. The right one
     * is mirrored and half a beat behind, so the two take turns (the cannons
     * fire one after the other).
     */
    private val pairMotifs = setOf("cannon", "windmill", "obelisk")

    /**
     * Motifs that are one emblem (the trident, a crown, the Eiffel Tower, a
     * lion, a castle...): drawn once, big, in the middle, rising out from
     * behind the crest. The swords are already a crossed pair on their own.
     */
    private val bigMotifs = setOf(
        "knight", "coffee", "castle", "shield", "lion", "temple", "swords", "branch",
        "devil", "crown", "eiffel", "bull", "wings",
    )

    /** How much of the width each side's motif has, and how much bigger a pair or a big emblem is drawn. */
    private const val SIDE_SHARE = 0.4f
    private const val SIDE_SCALE = 1.8f
    private const val BIG_GROW = 1.9f

    /** How far down its stage each big emblem's middle is drawn, as a share of the height. */
    private val emblemMiddle = mapOf(
        "devil" to 0.44f, "knight" to 0.42f, "coffee" to 0.46f, "castle" to 0.48f, "shield" to 0.48f,
        "lion" to 0.38f, "temple" to 0.48f, "swords" to 0.40f, "branch" to 0.38f, "crown" to 0.34f,
        "eiffel" to 0.42f, "bull" to 0.46f, "wings" to 0.38f,
    )

    /** How far down the crest's centre sits, as a share of the height. */
    private const val CREST_Y = 0.54f

    /** The club's motif name, after any override. */
    private fun motifOf(type: String): String? = FootballStyles.all[type]?.let { motifOverrides[type] ?: it.motif }

    private fun motifPass(c: Canvas, w: Float, h: Float, t: Float, st: TeamStyle, name: String) {
        if (name !in pairMotifs) {
            c.save()
            if (name in bigMotifs) {
                // Centred on the crest and grown about it: the emblem's own middle
                // (where each motif draws it) is moved onto the crest's middle.
                // A crown is seated on top of the crest instead, where a crown belongs.
                val cx = w / 2f; val cy = h * (if (name == "crown") CREST_Y - 0.25f else CREST_Y)
                val ay = h * (emblemMiddle[name] ?: 0.45f)
                c.translate(cx, cy); c.scale(BIG_GROW, BIG_GROW); c.translate(-cx, -ay)
            }
            c.scale(MOTIF_SCALE, MOTIF_SCALE)
            ClubMotifs.paint(c, w / MOTIF_SCALE, h / MOTIF_SCALE, t, st, name)
            c.restore()
            return
        }
        for (side in 0..1) {
            c.save()
            if (side == 1) { c.translate(w, 0f); c.scale(-1f, 1f) }
            // Each copy keeps to its own half, so the two never draw over each other.
            c.clipRect(0f, 0f, w / 2f, h)
            c.scale(SIDE_SCALE, SIDE_SCALE)
            ClubMotifs.paint(c, w * SIDE_SHARE / SIDE_SCALE, h / SIDE_SCALE, t + side * 0.05f, st, name)
            c.restore()
        }
    }

    private val add = PorterDuffXfermode(PorterDuff.Mode.ADD)

    // ── The 3D badge ────────────────────────────────────────────────────────

    /**
     * The crest at its drawn size, its silhouette (for the edge and the glint),
     * a blurred silhouette for the shadow, where it sits in the art's pixels,
     * the colour of its edge and of the light.
     */
    private class Badge(val crest: Bitmap, val mask: Bitmap, val shadow: Bitmap, val shadowPad: Float, val box: RectF, val edge: Int, val light: Int)

    private var badge: Badge? = null
    private var badgeKey = ""
    private val camera = android.graphics.Camera()
    private val matrix = android.graphics.Matrix()
    private val layerRect = RectF()
    private val maskPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)

    /** How many slices make up the badge's thickness, and how thick it is (as a share of its width). */
    private const val SLICES = 10
    private const val DEPTH = 0.06f

    /**
     * The badge turned by [time]: it rocks about its upright axis and nods a
     * little, on two unrelated slow cycles, so it never repeats exactly.
     * [k] maps the art's pixels to the view.
     */
    private fun badge3d(c: Canvas, time: Float, b: Badge, k: Float) {
        val turn = sin(time / 2.2f * 2f * PI.toFloat()) * 16f
        val nod = sin(time / 3.3f * 2f * PI.toFloat() + 0.9f) * 7f
        val cw = b.box.width() * k; val ch = b.box.height() * k
        val cx = dst.left + b.box.centerX() * k; val cy = dst.top + b.box.centerY() * k
        val depth = cw * DEPTH
        // The camera sits further back for a big badge, so the perspective stays gentle.
        val back = -max(cw, ch) / 72f * 2.6f

        // Shadow: falls down and away from the light, sliding as the badge turns
        val sx = -turn / 16f * cw * 0.06f + cw * 0.03f
        val sy = ch * 0.06f + nod / 7f * ch * 0.02f
        val pw = b.shadowPad * k
        layerRect.set(cx - cw / 2f - pw + sx, cy - ch / 2f - pw + sy, cx + cw / 2f + pw + sx, cy + ch / 2f + pw + sy)
        maskPaint.shader = null; maskPaint.xfermode = null
        maskPaint.color = a(0xFF000000.toInt(), 0.7f)
        c.drawBitmap(b.shadow, null, layerRect, maskPaint)

        fun place(z: Float) {
            camera.save()
            camera.setLocation(0f, 0f, back)
            camera.rotateY(turn)
            camera.rotateX(nod)
            camera.translate(0f, 0f, z)
            camera.getMatrix(matrix)
            camera.restore()
            matrix.preTranslate(-cw / 2f, -ch / 2f)
            matrix.postTranslate(cx, cy)
        }
        layerRect.set(0f, 0f, cw, ch)

        // The edge: slices from the back forward, darker at the back
        for (i in SLICES downTo 1) {
            place(depth * i / SLICES)
            c.save(); c.concat(matrix)
            val shade = 0.55f + 0.45f * (1f - i / SLICES.toFloat())
            maskPaint.color = ColorUtils.blendARGB(0xFF000000.toInt(), b.edge, shade)
            c.drawBitmap(b.mask, null, layerRect, maskPaint)
            c.restore()
        }

        // The face
        place(0f)
        c.save(); c.concat(matrix)
        c.drawBitmap(b.crest, null, layerRect, bmpPaint)
        // The glint: a soft band of light across the face, placed by the turn
        val g = (0.5f - turn / 32f) * cw * 1.6f - cw * 0.3f
        maskPaint.xfermode = add
        maskPaint.shader = LinearGradient(g - cw * 0.22f, 0f, g + cw * 0.22f, ch * 0.5f,
            intArrayOf(0, a(0xFFFFFFFF.toInt(), 0.32f), 0), floatArrayOf(0f, 0.5f, 1f), Shader.TileMode.CLAMP)
        c.drawBitmap(b.mask, null, layerRect, maskPaint)
        maskPaint.shader = null; maskPaint.xfermode = null
        c.restore()
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
        crests = try { am.list("crests")?.map { it.substringBeforeLast('.') }?.toSet() ?: emptySet() } catch (e: Exception) { emptySet() }
    }

    private var crests: Set<String> = emptySet()
    private fun hasCrest(type: String) = type in crests

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

    // ── The drawn shirt, for clubs with no crest ────────────────────────────

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

    /**
     * The club's name, for the few clubs whose real crest we don't have. We
     * never draw a made-up badge in its place: a stand-in would look like a
     * crest the club doesn't actually use.
     */
    private val wordmarks = mapOf(
        "club_awash" to ("AWASH" to "KETEMA"),
        "club_negede" to ("NEGEDE" to "AMHARA"),
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

    /**
     * Built at the screen's real pixel size so the crest and lettering stay
     * sharp. The crest is left off the background and kept as a [Badge], which
     * is drawn in 3D on every frame.
     */
    private fun kitArt(w: Float, h: Float, type: String): Bitmap {
        val density = Resources.getSystem().displayMetrics.density
        val pw = max(1, (w * density).toInt()); val ph = max(1, (h * density).toInt())
        val key = "$type:$pw:$ph"
        art?.let { if (artKey == key && !it.isRecycled) return it }
        val crest = crest(type)
        val bmp = Bitmap.createBitmap(pw, ph, Bitmap.Config.ARGB_8888)
        buildArt(Canvas(bmp), pw, ph, type, crest, withCrest = false)
        badge?.let { it.crest.recycle(); it.mask.recycle(); it.shadow.recycle() }
        badge = crest?.let { makeBadge(it, crestBox(pw.toFloat(), ph.toFloat(), it, type), FootballStyles.all[type]) }
        badgeKey = key
        crest?.recycle()
        art?.recycle()
        art = bmp; artKey = key
        return bmp
    }

    /** The crest drawn at [box]'s size, with its silhouette and soft shadow, ready to turn in 3D. */
    private fun makeBadge(crest: Bitmap, box: RectF, st: TeamStyle?): Badge {
        val bw = max(1, box.width().roundToInt()); val bh = max(1, box.height().roundToInt())
        val face = Bitmap.createScaledBitmap(crest, bw, bh, true)
        val mask = face.extractAlpha()
        // The shadow, blurred once here rather than on every frame
        val pad = max(bw, bh) * 0.08f
        val sh = Bitmap.createBitmap((bw + pad * 2).roundToInt(), (bh + pad * 2).roundToInt(), Bitmap.Config.ALPHA_8)
        Canvas(sh).drawBitmap(mask, pad, pad, Paint(Paint.ANTI_ALIAS_FLAG).apply {
            maskFilter = BlurMaskFilter(pad * 0.6f, BlurMaskFilter.Blur.NORMAL)
        })
        val (main, accent) = crestColours(crest, st ?: TeamStyle(0xFF2E7D32.toInt(), 0xFFFFFFFF.toInt(), ""))
        val edge = ColorUtils.blendARGB(main, 0xFF8A8F98.toInt(), 0.35f)
        val light = ColorUtils.blendARGB(accent, 0xFFFFFFFF.toInt(), 0.6f)
        return Badge(face, mask, sh, pad, box, edge, light)
    }

    /** Paints the club's background onto [c], [pw] x [ph] pixels, with the crest flat on it if [withCrest]. */
    private fun buildArt(c: Canvas, pw: Int, ph: Int, type: String, crest: Bitmap?, withCrest: Boolean) {
        val st = FootballStyles.all[type] ?: TeamStyle(0xFF2E7D32.toInt(), 0xFFFFFFFF.toInt(), "")
        val fw = pw.toFloat(); val fh = ph.toFloat()
        val box = crest?.let { crestBox(fw, fh, it, type) }
        if (crest != null && box != null) crestStage(c, fw, fh, crest, st, box)
        else {
            val kit = kitSpecs[type] ?: Kit(Pat.STRIPES, st.primary, st.secondary)
            val fabric = fabric(max(1, pw / 2), max(1, ph / 2), type, kit)
            c.drawBitmap(fabric, null, RectF(0f, 0f, fw, fh), bmpPaint)
            fabric.recycle()
        }
        vignette(c, fw, fh)
        if (crest != null && box != null) { if (withCrest) placeCrest(c, box, crest) }
        else wordmarks[type]?.let { wordmark(c, fw, fh, st, it) }
    }

    /**
     * Where the crest sits: centred, a little low, about half the height; a
     * little smaller when the club has a big emblem rising behind it.
     */
    private fun crestBox(w: Float, h: Float, crest: Bitmap, type: String): RectF {
        val share = if (motifOf(type) in bigMotifs) 0.4f else 0.5f
        val s = min(h * share / crest.height, w * share * 0.84f / crest.width)
        val cw = crest.width * s; val ch = crest.height * s
        val cx = w / 2f; val cy = h * CREST_Y
        return RectF(cx - cw / 2f, cy - ch / 2f, cx + cw / 2f, cy + ch / 2f)
    }

    // ── Stills for the theme picker ─────────────────────────────────────────
    // Each club's background with its crest, small, built once. The crest is
    // decoded off the main thread; the drawing (which shares this object's
    // paints) is not.

    private val stills = HashMap<String, Bitmap>()
    /**
     * Who is waiting for each still being built. The picker rebuilds its
     * previews (switching tabs, coming back to it), so a still can be asked
     * for by several views; every one of them is told when it's ready.
     */
    private val waiting = HashMap<String, MutableList<() -> Unit>>()

    /**
     * The club's background, [pw] x [ph] pixels, for the theme picker. Null
     * until ready; [ready] then runs on the main thread.
     */
    fun still(context: Context, type: String, pw: Int, ph: Int, ready: () -> Unit): Bitmap? {
        stills[type]?.let { return it }
        attach(context)
        if (pw <= 0 || ph <= 0) return null
        val am = assets ?: return null
        waiting[type]?.let { it.add(ready); return null }
        waiting[type] = mutableListOf(ready)
        val wantCrest = hasCrest(type)
        Thread {
            val crest = if (!wantCrest) null else try {
                am.open("crests/$type.webp").use { BitmapFactory.decodeStream(it) }
            } catch (e: Exception) { null }
            main.post {
                val bmp = Bitmap.createBitmap(pw, ph, Bitmap.Config.ARGB_8888)
                buildArt(Canvas(bmp), pw, ph, type, crest, withCrest = true)
                crest?.recycle()
                stills[type] = bmp
                waiting.remove(type)?.forEach { it() }
            }
        }.start()
        return null
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

    // ── The crest stage, for a club with a crest and no photo ───────────────

    /** Paints the crest's colours, bloomed out behind where it sits in [box]. */
    private fun crestStage(c: Canvas, w: Float, h: Float, crest: Bitmap, st: TeamStyle, box: RectF) {
        val (main, accent) = crestColours(crest, st)
        val deep = deepen(main, 0.09f)
        val cw = box.width(); val ch = box.height()
        val cx = box.centerX(); val cy = box.centerY()

        // 1. The crest's colours, blurred and blown up behind it in its own layout
        c.drawColor(deep)
        val bloom = blurred(crest, deep)
        val bs = max(w / bloom.width, h / bloom.height) * 1.25f
        val bw = bloom.width * bs; val bh = bloom.height * bs
        c.drawBitmap(bloom, null, RectF(cx - bw / 2f, cy - bh / 2f, cx + bw / 2f, cy + bh / 2f), bmpPaint)
        bloom.recycle()
        reset()
        paint.shader = LinearGradient(0f, 0f, 0f, h, a(deep, 0.68f), a(0xFF000000.toInt(), 0.76f), Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, paint)
        reset()

        // 2. A glow in the crest's second colour where the crest will sit
        reset()
        paint.shader = RadialGradient(cx, cy, max(cw, ch) * 0.95f, a(accent, 0.38f), 0, Shader.TileMode.CLAMP)
        c.drawCircle(cx, cy, max(cw, ch) * 0.95f, paint)
        reset()
    }

    /** Keeps the hue, sets the lightness: the deep tone the stage is built on. */
    private fun deepen(color: Int, l: Float): Int {
        val hsl = FloatArray(3)
        ColorUtils.colorToHSL(color, hsl)
        hsl[2] = l
        hsl[1] = min(hsl[1], 0.7f)
        return ColorUtils.HSLToColor(hsl)
    }

    /**
     * The crest's two strongest colours: its pixels are grouped by hue and the
     * two biggest groups win. Black-and-white crests fall back to the kit colours.
     */
    private fun crestColours(crest: Bitmap, st: TeamStyle): Pair<Int, Int> {
        val sw = 40; val sh = max(1, sw * crest.height / crest.width)
        val small = Bitmap.createScaledBitmap(crest, sw, sh, true)
        val px = IntArray(sw * sh)
        small.getPixels(px, 0, sw, 0, 0, sw, sh)
        if (small !== crest) small.recycle()
        val weight = FloatArray(12); val rs = FloatArray(12); val gs = FloatArray(12); val bs = FloatArray(12)
        val hsl = FloatArray(3)
        for (p in px) {
            if (Color.alpha(p) < 200) continue
            ColorUtils.colorToHSL(p, hsl)
            if (hsl[1] < 0.3f || hsl[2] < 0.15f || hsl[2] > 0.85f) continue
            val b = (hsl[0] / 30f).toInt().coerceIn(0, 11)
            val wgt = 0.5f + hsl[1]
            weight[b] += wgt; rs[b] += Color.red(p) * wgt; gs[b] += Color.green(p) * wgt; bs[b] += Color.blue(p) * wgt
        }
        fun avg(b: Int) = Color.rgb((rs[b] / weight[b]).toInt(), (gs[b] / weight[b]).toInt(), (bs[b] / weight[b]).toInt())
        val order = (0 until 12).sortedByDescending { weight[it] }
        val first = order[0]
        if (weight[first] < px.size * 0.04f) return st.primary to st.secondary
        // The second colour must be a different hue (not the next bucket over) and not a speck.
        val second = order.drop(1).firstOrNull { b ->
            val d = abs(b - first).let { min(it, 12 - it) }
            d >= 2 && weight[b] > weight[first] * 0.12f
        }
        return avg(first) to (if (second != null) avg(second) else st.secondary)
    }

    /** A small, heavily blurred copy of the crest over [base]: a field of its colours in its layout. */
    private fun blurred(crest: Bitmap, base: Int): Bitmap {
        val sw = 48; val sh = max(1, sw * crest.height / crest.width)
        val small = Bitmap.createBitmap(sw, sh, Bitmap.Config.ARGB_8888)
        Canvas(small).apply {
            drawColor(base)
            drawBitmap(crest, null, RectF(0f, 0f, sw.toFloat(), sh.toFloat()), bmpPaint)
        }
        val px = IntArray(sw * sh)
        small.getPixels(px, 0, sw, 0, 0, sw, sh)
        repeat(3) { boxBlur(px, sw, sh, 3) }
        small.setPixels(px, 0, sw, 0, 0, sw, sh)
        return small
    }

    /** One horizontal and one vertical box-blur pass of radius [r], edges clamped. */
    private fun boxBlur(px: IntArray, w: Int, h: Int, r: Int) {
        val tmp = IntArray(px.size)
        val n = 2 * r + 1
        for (y in 0 until h) for (x in 0 until w) {
            var rr = 0; var gg = 0; var bb = 0
            for (k in -r..r) {
                val p = px[y * w + (x + k).coerceIn(0, w - 1)]
                rr += Color.red(p); gg += Color.green(p); bb += Color.blue(p)
            }
            tmp[y * w + x] = Color.rgb(rr / n, gg / n, bb / n)
        }
        for (y in 0 until h) for (x in 0 until w) {
            var rr = 0; var gg = 0; var bb = 0
            for (k in -r..r) {
                val p = tmp[(y + k).coerceIn(0, h - 1) * w + x]
                rr += Color.red(p); gg += Color.green(p); bb += Color.blue(p)
            }
            px[y * w + x] = Color.rgb(rr / n, gg / n, bb / n)
        }
    }

    /** The real crest in [r], with a soft shadow beneath. */
    private fun placeCrest(c: Canvas, r: RectF, crest: Bitmap) {
        val cw = r.width(); val ch = r.height()
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
     * For a club whose crest we don't have: its name, set large across the
     * shirt with a rule in the kit's second colour. Plainly a name, not a badge.
     */
    private fun wordmark(c: Canvas, w: Float, h: Float, st: TeamStyle, text: Pair<String, String>) {
        val cx = w / 2f; val cy = h * 0.52f
        val maxW = w * 0.72f
        val p = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            textAlign = Paint.Align.CENTER
            typeface = Typeface.create("sans-serif-condensed", Typeface.BOLD)
        }
        fun line(s: String, size: Float, spacing: Float, y: Float, color: Int, shadow: Float) {
            p.textSize = size
            p.letterSpacing = spacing
            val tw = p.measureText(s)
            if (tw > maxW) p.textSize *= maxW / tw
            p.color = color
            p.setShadowLayer(shadow, 0f, shadow * 0.3f, a(0xFF000000.toInt(), 0.7f))
            c.drawText(s, cx, y, p)
        }
        line(text.first, h * 0.2f, 0.06f, cy - h * 0.03f, a(0xFFFFFFFF.toInt(), 0.94f), h * 0.02f)
        p.clearShadowLayer()
        p.color = ColorUtils.blendARGB(st.secondary, 0xFFFFFFFF.toInt(), 0.2f)
        c.drawRect(cx - w * 0.09f, cy + h * 0.015f, cx + w * 0.09f, cy + h * 0.025f, p)
        line(text.second, h * 0.085f, 0.32f, cy + h * 0.13f, a(0xFFFFFFFF.toInt(), 0.78f), h * 0.015f)
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
