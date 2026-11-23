package com.akai.nativekb

import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.SweepGradient
import androidx.core.graphics.ColorUtils
import java.util.Random
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.sin
import kotlin.math.sqrt

internal const val WHITE = 0xFFFFFFFF.toInt()
internal fun hex(v: Long) = v.toInt()

/**
 * The signature motifs of the football clubs, ported from the Flutter app's
 * football_live_theme.dart. Each draws one illustration over the shared stage.
 */
object ClubMotifs {
    internal val p = Paint(Paint.ANTI_ALIAS_FLAG)
    internal val path = Path()
    internal val r = RectF()
    internal val addMode = PorterDuffXfermode(PorterDuff.Mode.ADD)

    internal fun a(color: Int, o: Float) = ColorUtils.setAlphaComponent(color, (o * 255f).toInt().coerceIn(0, 255))
    internal fun lerp(c0: Int, c1: Int, t: Float) = ColorUtils.blendARGB(c0, c1, t.coerceIn(0f, 1f))
    internal fun reset() { p.shader = null; p.xfermode = null; p.style = Paint.Style.FILL; p.strokeWidth = 1f; p.strokeCap = Paint.Cap.BUTT; p.maskFilter = null }

    internal fun dot(c: Canvas, x: Float, y: Float, rad: Float, color: Int) { reset(); p.color = color; c.drawCircle(x, y, rad, p) }
    internal fun line(c: Canvas, x0: Float, y0: Float, x1: Float, y1: Float, color: Int, width: Float, round: Boolean = false) {
        reset(); p.color = color; p.strokeWidth = width; if (round) p.strokeCap = Paint.Cap.ROUND
        c.drawLine(x0, y0, x1, y1, p)
    }
    internal fun oval(c: Canvas, cx: Float, cy: Float, w: Float, h: Float, color: Int) {
        reset(); p.color = color; r.set(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2); c.drawOval(r, p)
    }
    internal fun glow(c: Canvas, cx: Float, cy: Float, rad: Float, vararg colors: Int, add: Boolean = false) {
        reset()
        p.shader = RadialGradient(cx, cy, rad.coerceAtLeast(0.1f), colors, null, Shader.TileMode.CLAMP)
        if (add) p.xfermode = addMode
        c.drawCircle(cx, cy, rad, p); reset()
    }
    internal fun fillPath(c: Canvas, pa: Path, color: Int) { reset(); p.color = color; c.drawPath(pa, p) }
    internal fun strokePath(c: Canvas, pa: Path, color: Int, width: Float, round: Boolean = false, blur: Float = 0f) {
        reset(); p.style = Paint.Style.STROKE; p.color = color; p.strokeWidth = width
        if (round) p.strokeCap = Paint.Cap.ROUND
        if (blur > 0f) p.maskFilter = BlurMaskFilter(blur, BlurMaskFilter.Blur.NORMAL)
        c.drawPath(pa, p); reset()
    }
    internal fun rad2deg(x: Double) = (x * 180 / PI).toFloat()

    /** Draws the motif for [name]; returns false if it is not ported yet. */
    fun paint(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle, name: String): Boolean {
        when (name) {
            "bolt" -> bolt(c, w, h, time, st)
            "knight" -> knight(c, w, h, time, st)
            "coffee" -> coffee(c, w, h, time, st)
            "waves" -> waves(c, w, h, time, st)
            "castle" -> castle(c, w, h, time, st)
            "coins" -> coins(c, w, h, time, st)
            "shield" -> shield(c, w, h, time, st)
            "windmill" -> windmill(c, w, h, time, st)
            else -> return ClubMotifs2.paint(c, w, h, time, st, name)
        }
        return true
    }

    // Lightning strikes from an electric core.
    private fun bolt(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cycle = (time * 10) % 1f
        if (cycle < 0.25f) {
            val punch = 1f - cycle / 0.25f
            val rand = Random(floor(time * 10).toLong())
            reset(); p.color = a(st.primary, 0.10f * punch); c.drawRect(0f, 0f, w, h, p)
            for (b in 0 until 2) {
                val sx = w * (0.25f + rand.nextDouble().toFloat() * 0.5f)
                var px = sx; var py = 0f
                path.reset(); path.moveTo(px, py)
                while (py < h * 0.62f) {
                    px += (rand.nextDouble().toFloat() - 0.5f) * w * 0.12f
                    py += h * (0.06f + rand.nextDouble().toFloat() * 0.07f)
                    path.lineTo(px, py)
                }
                strokePath(c, path, a(st.primary, 0.8f * punch), 5f, blur = 6f)
                strokePath(c, path, a(WHITE, 0.9f * punch), 2f)
            }
        }
        val cx = w * 0.5f; val cy = h * 0.40f
        for (i in 0 until 3) {
            val rr = 26f + i * 14f + sin((time * 8 + i) * PI).toFloat() * 4f
            reset(); p.style = Paint.Style.STROKE; p.strokeWidth = 1.6f; p.color = a(st.primary, 0.5f)
            r.set(cx - rr, cy - rr, cx + rr, cy + rr)
            c.drawArc(r, rad2deg(time * 2 * PI * (if (i % 2 == 0) 2 else -2)), rad2deg(PI * 0.8), false, p)
            reset()
        }
        glow(c, cx, cy, 20f, a(WHITE, 0.9f), a(st.primary, 0.4f), 0)
    }

    // St George: his lance, as on the crest where he slays the dragon: a turned
    // wooden shaft with a leather grip and steel hand guard, a ridged steel
    // spearhead, a St George's cross pennant fluttering behind it, and the
    // dragon's fire licking at the point.
    private fun knight(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        glow(c, w * 0.35f, h * 0.28f, w * 0.20f, a(st.primary, 0.30f), 0)
        val tailX = w * 0.14f; val tailY = h * 0.20f
        val tipX = w * 0.80f; val tipY = h * 0.64f
        val dx = tipX - tailX; val dy = tipY - tailY
        val len = sqrt(dx * dx + dy * dy)

        // Fire behind the point first, so the steel sits in it
        dragonFire(c, tipX, tipY, dx / len, dy / len, time, st)

        c.save()
        c.translate(tailX, tailY)
        c.rotate(rad2deg(kotlin.math.atan2(dy.toDouble(), dx.toDouble())))
        val head = 44f; val socket = 14f
        val shaftEnd = len - head - socket

        // Soft shadow under the whole lance
        path.reset()
        path.moveTo(0f, -5f); path.lineTo(shaftEnd, -3.6f); path.lineTo(len, 0f); path.lineTo(shaftEnd, 3.6f); path.lineTo(0f, 5f); path.close()
        c.save(); c.translate(3f, 6f)
        reset(); p.color = a(hex(0xFF000000), 0.45f); p.maskFilter = BlurMaskFilter(5f, BlurMaskFilter.Blur.NORMAL); c.drawPath(path, p); reset()
        c.restore()

        // The shaft: tapering, shaded round, with a few grain lines
        path.reset()
        path.moveTo(0f, -5f); path.lineTo(shaftEnd, -3.6f); path.lineTo(shaftEnd, 3.6f); path.lineTo(0f, 5f); path.close()
        reset()
        p.shader = LinearGradient(0f, -5f, 0f, 5f,
            intArrayOf(hex(0xFF3A210E), hex(0xFFB07A45), hex(0xFFD9A86E), hex(0xFF7A4A22), hex(0xFF2A170A)),
            floatArrayOf(0f, 0.25f, 0.4f, 0.75f, 1f), Shader.TileMode.CLAMP)
        c.drawPath(path, p); reset()
        c.save(); c.clipPath(path)
        val grain = Random(29)
        for (i in 0 until 6) {
            val gy = -4f + grain.nextFloat() * 8f
            val g = Path(); g.moveTo(0f, gy)
            var x = 0f
            while (x < shaftEnd) { x += 18f; g.lineTo(x, gy + sin(x * 0.05f + i).toFloat() * 0.6f) }
            strokePath(c, g, a(hex(0xFF2A170A), 0.35f), 0.6f)
        }
        c.restore()

        // Steel butt cap
        metalBand(c, 0f, 6f, 5.4f)
        // Leather grip, wrapped on the bias
        val g0 = len * 0.12f; val g1 = len * 0.24f
        reset(); p.color = hex(0xFF2B1A12); r.set(g0, -5.2f, g1, 5.2f); c.drawRect(r, p)
        c.save(); c.clipRect(r)
        var x = g0 - 10f
        while (x < g1 + 10f) {
            line(c, x, 5.2f, x + 6f, -5.2f, a(hex(0xFF6B4630), 0.9f), 1.6f)
            line(c, x + 1.4f, 5.2f, x + 7.4f, -5.2f, a(hex(0xFF120A06), 0.6f), 0.8f)
            x += 4.2f
        }
        c.restore()
        reset(); p.shader = LinearGradient(0f, -5.2f, 0f, 5.2f, intArrayOf(a(WHITE, 0.18f), 0, a(hex(0xFF000000), 0.35f)), null, Shader.TileMode.CLAMP)
        c.drawRect(g0, -5.2f, g1, 5.2f, p); reset()

        // The vamplate: a steel cone guarding the hand
        val v0 = g1 + 2f; val v1 = v0 + 22f
        path.reset(); path.moveTo(v0, -4.6f); path.lineTo(v1, -15f); path.lineTo(v1, 15f); path.lineTo(v0, 4.6f); path.close()
        reset()
        p.shader = LinearGradient(0f, -15f, 0f, 15f,
            intArrayOf(hex(0xFF5A626D), hex(0xFFE9EEF3), hex(0xFFA7B0BA), hex(0xFF4A515B), hex(0xFF1E2228)),
            floatArrayOf(0f, 0.22f, 0.42f, 0.75f, 1f), Shader.TileMode.CLAMP)
        c.drawPath(path, p); reset()
        reset(); p.color = hex(0xFF2A2F36); r.set(v1 - 2.5f, -15.5f, v1 + 1.5f, 15.5f); c.drawRoundRect(r, 2f, 2f, p)
        reset(); p.color = a(hex(0xFFD4AF37), 0.9f); r.set(v1 - 1.8f, -15f, v1 + 0.8f, 15f); c.drawRoundRect(r, 1.4f, 1.4f, p); reset()

        // Gilded bands where the head is socketed
        metalBand(c, shaftEnd - 12f, 3.5f, 4.4f, gold = true)
        metalBand(c, shaftEnd - 5f, 3.5f, 4.2f, gold = true)

        // The pennant: red, with the white cross of St George, fluttering behind the head
        pennant(c, shaftEnd - 8f, time)

        // Socket: a steel collar tapering into the blade
        path.reset(); path.moveTo(shaftEnd, -4.2f); path.lineTo(shaftEnd + socket, -2.6f); path.lineTo(shaftEnd + socket, 2.6f); path.lineTo(shaftEnd, 4.2f); path.close()
        reset()
        p.shader = LinearGradient(0f, -4.2f, 0f, 4.2f, intArrayOf(hex(0xFF5A626D), hex(0xFFDDE3E9), hex(0xFF3A4048)), null, Shader.TileMode.CLAMP)
        c.drawPath(path, p); reset()

        // The blade: leaf-shaped, two faces either side of a raised ridge
        val b0 = shaftEnd + socket
        val wide = b0 + head * 0.38f
        val upper = Path().apply {
            moveTo(b0, 0f); lineTo(b0, -2.6f)
            cubicTo(b0 + head * 0.15f, -6f, wide - 6f, -11f, wide, -11f)
            cubicTo(wide + 10f, -10f, len - 8f, -3f, len, 0f); close()
        }
        val lower = Path().apply {
            moveTo(b0, 0f); lineTo(b0, 2.6f)
            cubicTo(b0 + head * 0.15f, 6f, wide - 6f, 11f, wide, 11f)
            cubicTo(wide + 10f, 10f, len - 8f, 3f, len, 0f); close()
        }
        reset()
        p.shader = LinearGradient(0f, -11f, 0f, 0f, intArrayOf(hex(0xFF8E98A3), hex(0xFFF4F7FA)), null, Shader.TileMode.CLAMP)
        c.drawPath(upper, p); reset()
        p.shader = LinearGradient(0f, 0f, 0f, 11f, intArrayOf(hex(0xFF6C757F), hex(0xFF2A3038)), null, Shader.TileMode.CLAMP)
        c.drawPath(lower, p); reset()
        // Honed edges catch the light; the ridge runs down the middle
        strokePath(c, upper, a(WHITE, 0.55f), 0.8f)
        strokePath(c, lower, a(hex(0xFF0E1116), 0.7f), 0.8f)
        line(c, b0, 0f, len - 2f, 0f, a(WHITE, 0.85f), 0.9f)
        line(c, b0, 0.9f, len - 3f, 0.6f, a(hex(0xFF1A1E24), 0.6f), 0.7f)
        // The firelight on the steel, and a shine running down the blade now and then
        reset(); p.xfermode = addMode
        p.shader = RadialGradient(len, 0f, head * 0.7f, a(hex(0xFFFF8A00), 0.45f), 0, Shader.TileMode.CLAMP)
        c.drawPath(upper, p); c.drawPath(lower, p); reset()
        val sweep = (time * 1.6f) % 1f
        if (sweep < 0.4f) {
            val sx = b0 + (sweep / 0.4f) * head
            c.save(); c.clipPath(upper)
            reset(); p.xfermode = addMode
            p.shader = LinearGradient(sx - 8f, 0f, sx + 8f, 0f, intArrayOf(0, a(WHITE, 0.7f), 0), null, Shader.TileMode.CLAMP)
            c.drawRect(b0, -12f, len, 0f, p); reset()
            c.restore()
        }
        c.restore()
    }

    /** A turned metal ring around the shaft at [x], [width] long and [rad] in radius. */
    private fun metalBand(c: Canvas, x: Float, width: Float, rad: Float, gold: Boolean = false) {
        val colours = if (gold) intArrayOf(hex(0xFF7A5A12), hex(0xFFFFE9A0), hex(0xFFD4AF37), hex(0xFF5C430C))
        else intArrayOf(hex(0xFF3E444C), hex(0xFFE9EEF3), hex(0xFF8E97A1), hex(0xFF22262C))
        reset()
        p.shader = LinearGradient(0f, -rad, 0f, rad, colours, floatArrayOf(0f, 0.3f, 0.6f, 1f), Shader.TileMode.CLAMP)
        r.set(x, -rad, x + width, rad); c.drawRoundRect(r, 1.2f, 1.2f, p); reset()
    }

    /**
     * A swallow-tailed pennant tied on at [x] (in the lance's frame), rippling
     * in the wind: red, with the white cross of St George.
     */
    private fun pennant(c: Canvas, x: Float, time: Float) {
        val len = 46f; val tall = 18f
        val cols = 12
        fun pt(u: Float, v: Float): Pair<Float, Float> {
            // u along the flag (0 at the lance), v across (0 at the top edge); the wave grows towards the tail
            val wave = sin((u * 2.4f - time * 9f) * PI).toFloat() * 3.2f * u
            return Pair(x - u * len * 0.92f, -5f - (1f - v) * tall + wave + u * 4f)
        }
        val flag = Path()
        for (i in 0..cols) { val (fx, fy) = pt(i / cols.toFloat(), 0f); if (i == 0) flag.moveTo(fx, fy) else flag.lineTo(fx, fy) }
        // Swallow tail
        val (nx, ny) = pt(0.78f, 0.5f)
        val (bx, by) = pt(1f, 1f)
        flag.lineTo(nx, ny); flag.lineTo(bx, by)
        for (i in cols downTo 0) { val (fx, fy) = pt(i / cols.toFloat(), 1f); flag.lineTo(fx, fy) }
        flag.close()
        reset(); p.color = a(hex(0xFF000000), 0.3f); p.maskFilter = BlurMaskFilter(3f, BlurMaskFilter.Blur.NORMAL)
        c.save(); c.translate(2f, 4f); c.drawPath(flag, p); c.restore(); reset()
        reset(); p.color = hex(0xFFC8102E); c.drawPath(flag, p)
        c.save(); c.clipPath(flag)
        // The white cross on the field
        val (hx0, hy0) = pt(0f, 0.5f); val (hx1, hy1) = pt(0.85f, 0.5f)
        line(c, hx0, hy0, hx1, hy1, hex(0xFFF5F5F5), 3.6f)
        val (vx, vy) = pt(0.32f, 0f); val (vx1, vy1) = pt(0.32f, 1f)
        line(c, vx, vy, vx1, vy1, hex(0xFFF5F5F5), 3.6f)
        // Folds: light and shadow following the ripple
        for (i in 0 until cols) {
            val u = (i + 0.5f) / cols
            val shade = sin((u * 2.4f - time * 9f) * PI + PI / 2).toFloat()
            val (sx, sy) = pt(u, 0f); val (ex, ey) = pt(u, 1f)
            line(c, sx, sy - 2f, ex, ey + 2f, a(if (shade > 0) WHITE else hex(0xFF000000), abs(shade) * 0.22f), len / cols + 1f)
        }
        c.restore()
        // Lashed to the shaft
        line(c, x - 0.5f, -5f - tall, x - 0.5f, -3.5f, hex(0xFF2B1A12), 1.6f)
    }

    /** The dragon's fire at the lance's point: layered tongues of flame streaming back. */
    private fun dragonFire(c: Canvas, x: Float, y: Float, ux: Float, uy: Float, time: Float, st: TeamStyle) {
        glow(c, x + ux * 10f, y + uy * 10f, 46f, a(hex(0xFFFF6D00), 0.45f), a(hex(0xFFFF3D00), 0.15f), 0, add = true)
        val rand = Random(13)
        for (i in 0 until 18) {
            val t = ((time * 2 + rand.nextDouble()) % 1.0).toFloat()
            val spread = (rand.nextDouble().toFloat() - 0.5f) * 30f
            // Flames rise from just past the point and drift up and back
            val fx = x + ux * (14f + t * 10f) - uy * spread - t * 14f
            val fy = y + uy * (14f + t * 10f) + ux * spread - t * 42f
            val rad = (5f + (1f - t) * 11f)
            reset(); p.xfermode = addMode
            p.shader = RadialGradient(fx, fy, rad,
                intArrayOf(a(hex(0xFFFFF3C4), 0.8f * (1f - t)), a(lerp(hex(0xFFFF9800), st.secondary, t), 0.55f * (1f - t)), 0),
                floatArrayOf(0f, 0.45f, 1f), Shader.TileMode.CLAMP)
            c.drawCircle(fx, fy, rad, p); reset()
        }
    }

    // Ethiopia Bunna: a steaming coffee cup with tumbling beans.
    private fun coffee(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cx = w * 0.5f; val cy = h * 0.46f
        glow(c, cx, cy, w * 0.28f, a(st.secondary, 0.22f), 0)
        path.reset()
        path.moveTo(cx - 26f, cy - 14f); path.lineTo(cx + 26f, cy - 14f)
        path.quadTo(cx + 24f, cy + 22f, cx, cy + 24f)
        path.quadTo(cx - 24f, cy + 22f, cx - 26f, cy - 14f); path.close()
        fillPath(c, path, a(st.primary, 0.95f))
        reset(); p.style = Paint.Style.STROKE; p.strokeWidth = 5f; p.color = st.primary
        r.set(cx + 30f - 12f, cy - 12f, cx + 30f + 12f, cy + 12f); c.drawArc(r, -90f, 180f, false, p); reset()
        oval(c, cx, cy + 28f, 74f, 12f, a(st.primary, 0.6f))
        oval(c, cx, cy - 14f, 48f, 10f, hex(0xFF3E2010))
        for (i in -1..1) {
            val sx = cx + i * 14f
            val ph = time * 4 * PI + i
            path.reset(); path.moveTo(sx, cy - 22f)
            for (seg in 1..4) path.lineTo(sx + (sin(ph + seg) * 7).toFloat(), cy - 22f - seg * 13f)
            strokePath(c, path, a(WHITE, 0.35f), 3f, round = true, blur = 3f)
        }
        val rand = Random(17)
        for (i in 0 until 10) {
            val t = ((time * 0.7 + rand.nextDouble()) % 1.0).toFloat()
            val bx = ((((rand.nextDouble() * w + sin(time * 4 + i) * 16) % w) + w) % w).toFloat()
            c.save(); c.translate(bx, t * h * 0.7f); c.rotate(rad2deg(time * 6.0 + i))
            reset(); p.color = a(hex(0xFF5D4037), 0.9f * (1f - t * 0.4f)); r.set(-5f, -3.5f, 5f, 3.5f); c.drawOval(r, p)
            line(c, 0f, -3f, 0f, 3f, hex(0xFF3E2723), 1.4f)
            c.restore()
        }
    }

    // Bahir Dar: lake waves and a papyrus boat.
    private fun waves(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        for (i in 0 until 3) {
            val baseY = h * (0.46f + i * 0.09f)
            path.reset(); path.moveTo(0f, baseY)
            var x = 0f
            while (x <= w + 0.01f) {
                path.lineTo(x, (baseY + sin(x / w * 4 * PI + time * 2 * PI * (1 + i * 0.3)) * (8.0 + i * 3)).toFloat())
                x += w / 16f
            }
            path.lineTo(w, h * 0.78f); path.lineTo(0f, h * 0.78f); path.close()
            fillPath(c, path, a(lerp(st.primary, st.secondary, i / 3f), 0.30f - i * 0.06f))
        }
        val rand = Random(23)
        for (i in 0 until 12) {
            val gx = rand.nextDouble().toFloat() * w
            val gy = h * (0.5f + rand.nextDouble().toFloat() * 0.24f)
            val tw = (sin((time * 5 + i) * 2 * PI) * 0.5 + 0.5).toFloat()
            oval(c, gx, gy, 10f * tw + 2f, 2f, a(WHITE, 0.30f * tw))
        }
        val bx = w * (0.2f + ((time * 0.8f) % 1f) * 0.6f)
        val by = h * 0.44f + sin(time * 4 * PI).toFloat() * 5f
        path.reset()
        path.moveTo(bx - 30f, by); path.quadTo(bx, by + 14f, bx + 30f, by)
        path.quadTo(bx + 36f, by - 8f, bx + 30f, by - 4f); path.lineTo(bx - 30f, by - 4f)
        path.quadTo(bx - 36f, by - 8f, bx - 30f, by); path.close()
        fillPath(c, path, a(hex(0xFFC8A165), 0.9f))
    }

    // Fasil Kenema: the Gondar castle under a moon.
    private fun castle(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val baseY = h * 0.66f
        val stone = a(hex(0xFF14100C), 0.95f)
        val mx = w * 0.76f; val my = h * 0.18f
        dot(c, mx, my, 16f, a(hex(0xFFFFF8E1), 0.9f))
        glow(c, mx, my, 34f, a(hex(0xFFFFF8E1), 0.25f), 0)
        fun tower(cx: Float, tw: Float, th: Float) {
            val left = cx - tw / 2; val top = baseY - th
            reset(); p.color = stone
            c.drawRect(left, top, left + tw, baseY, p)
            var mxx = left
            while (mxx < left + tw - 2f) { c.drawRect(mxx, top - 7f, mxx + 8f, top, p); mxx += 16f }
            r.set(left, top - tw * 0.5f, left + tw, top - tw * 0.5f + tw * 0.7f)
            c.drawArc(r, 180f, 180f, true, p)
        }
        tower(w * 0.2f, w * 0.13f, h * 0.22f)
        tower(w * 0.5f, w * 0.18f, h * 0.30f)
        tower(w * 0.8f, w * 0.12f, h * 0.18f)
        reset(); p.color = stone; c.drawRect(0f, baseY - h * 0.08f, w, baseY, p)
        val rand = Random(29)
        val xs = floatArrayOf(w * 0.2f, w * 0.5f, w * 0.8f)
        for (i in 0 until 10) {
            val wx = xs[i % 3] + (rand.nextDouble().toFloat() - 0.5f) * w * 0.07f
            val wy = baseY - rand.nextDouble().toFloat() * h * 0.20f - 10f
            val tw = (sin((time * 3 + rand.nextDouble()) * 2 * PI) * 0.5 + 0.5).toFloat()
            reset(); p.color = a(st.secondary, 0.4f + 0.5f * tw)
            r.set(wx - 2.5f, wy - 4f, wx + 2.5f, wy + 4f); c.drawRoundRect(r, 2f, 2f, p)
        }
        glow(c, w * 0.5f, baseY - h * 0.34f, w * 0.16f, a(st.primary, 0.25f), 0)
    }

    // CBE: gold coins tumbling down.
    private fun coins(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val rand = Random(31)
        for (i in 0 until 14) {
            val t = ((time * 0.8 + rand.nextDouble()) % 1.0).toFloat()
            val cx = ((((rand.nextDouble() * w + sin(time * 3 + i) * 12) % w) + w) % w).toFloat()
            val cy = t * h * 0.75f
            val flip = sin((time * 6 + i) * PI).toFloat()
            val cw = 16f * abs(flip).coerceIn(0.15f, 1f)
            reset()
            p.shader = LinearGradient(cx, cy - 8f, cx, cy + 8f, intArrayOf(hex(0xFFFFE082), st.secondary, hex(0xFFB8860B)), null, Shader.TileMode.CLAMP)
            r.set(cx - cw / 2, cy - 8f, cx + cw / 2, cy + 8f); c.drawOval(r, p)
            reset(); p.style = Paint.Style.STROKE; p.strokeWidth = 1.2f; p.color = a(hex(0xFF8D6E63), 0.5f)
            r.set(cx - cw * 0.3f, cy - 5f, cx + cw * 0.3f, cy + 5f); c.drawOval(r, p); reset()
        }
        glow(c, w * 0.5f, h * 0.42f, w * 0.24f, a(st.primary, 0.28f), 0)
        for (i in 0 until 8) {
            val r2 = Random((i * 7).toLong())
            val px = r2.nextDouble().toFloat() * w
            val py = h * (0.2f + r2.nextDouble().toFloat() * 0.4f)
            val tw = (sin((time * 5 + i) * 2 * PI) * 0.5 + 0.5).toFloat()
            val col = a(st.secondary, 0.8f * tw)
            line(c, px - 4f * tw, py, px + 4f * tw, py, col, 1.4f)
            line(c, px, py - 4f * tw, px, py + 4f * tw, col, 1.4f)
        }
    }

    // Ethiopia Insurance: a shield with a radar sweep.
    private fun shield(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cx = w * 0.5f; val cy = h * 0.40f
        val sw = w * 0.24f; val sh = h * 0.26f
        path.reset()
        path.moveTo(cx - sw, cy - sh * 0.55f); path.lineTo(cx + sw, cy - sh * 0.55f); path.lineTo(cx + sw, cy + sh * 0.1f)
        path.quadTo(cx + sw * 0.8f, cy + sh * 0.6f, cx, cy + sh * 0.85f)
        path.quadTo(cx - sw * 0.8f, cy + sh * 0.6f, cx - sw, cy + sh * 0.1f); path.close()
        fillPath(c, path, a(st.primary, 0.30f))
        strokePath(c, path, a(st.secondary, 0.8f), 3f)
        c.save()
        c.clipPath(path)
        val ang = time * 2 * PI * 1.5
        // Radar sweep: a wedge fading in toward its leading edge.
        c.save()
        c.rotate(rad2deg(ang - 0.8), cx, cy)
        reset()
        p.shader = SweepGradient(cx, cy, intArrayOf(0, a(st.secondary, 0.45f), 0), floatArrayOf(0f, (0.8f / (2 * PI)).toFloat(), (0.8f / (2 * PI)).toFloat() + 0.001f))
        val wedge = Path()
        wedge.moveTo(cx, cy)
        wedge.lineTo(cx + sw * 2f, cy)
        wedge.lineTo((cx + cos(0.8) * sw * 2).toFloat(), (cy + sin(0.8) * sw * 2).toFloat())
        wedge.close()
        c.drawPath(wedge, p); reset()
        c.restore()
        for (i in 1..3) {
            reset(); p.style = Paint.Style.STROKE; p.strokeWidth = 1.2f; p.color = a(st.secondary, 0.35f)
            c.drawCircle(cx, cy, sw * i / 3f, p); reset()
        }
        val rand = Random(37)
        for (i in 0 until 4) {
            val ba = rand.nextDouble() * 2 * PI
            val br = rand.nextDouble().toFloat() * sw * 0.9f
            val vis = (sin((time * 3 + i) * 2 * PI) * 0.5 + 0.5).toFloat()
            dot(c, (cx + cos(ba) * br).toFloat(), (cy + sin(ba) * br).toFloat(), 2.5f, a(WHITE, vis))
        }
        c.restore()
    }

    // Adama: wind turbines turning under a tinted sky.
    private fun windmill(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        reset()
        p.shader = LinearGradient(w / 2f, 0f, w / 2f, h * 0.7f, a(st.primary, 0.30f), 0, Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h * 0.7f, p); reset()
        fun turbine(cx: Float, baseY: Float, scale: Float, phase: Float) {
            val hubY = baseY - h * 0.22f * scale
            line(c, cx, baseY, cx, hubY, a(st.secondary, 0.85f), 4f * scale)
            val rot = time * 2 * PI * 3 + phase
            for (b in 0 until 3) {
                val ang = rot + b * 2 * PI / 3
                val tipX = (cx + cos(ang) * w * 0.11f * scale).toFloat()
                val tipY = (hubY + sin(ang) * w * 0.11f * scale).toFloat()
                path.reset(); path.moveTo(cx, hubY)
                path.lineTo(tipX + (cos(ang + PI / 2) * 3).toFloat(), tipY + (sin(ang + PI / 2) * 3).toFloat())
                path.lineTo(tipX - (cos(ang + PI / 2) * 3).toFloat(), tipY - (sin(ang + PI / 2) * 3).toFloat())
                path.close(); fillPath(c, path, a(st.secondary, 0.9f))
            }
            dot(c, cx, hubY, 4f * scale, st.primary)
        }
        turbine(w * 0.25f, h * 0.72f, 1.0f, 0f)
        turbine(w * 0.55f, h * 0.70f, 1.3f, 1.8f)
        turbine(w * 0.85f, h * 0.73f, 0.9f, 3.6f)
        for (i in 0 until 4) {
            val wy = h * (0.2f + i * 0.09f)
            val wx = ((time * 2 + i * 0.3f) % 1f) * w * 1.4f - w * 0.2f
            reset(); p.style = Paint.Style.STROKE; p.strokeWidth = 2f; p.color = a(WHITE, 0.15f)
            r.set(wx, wy, wx + w * 0.16f, wy + 10f); c.drawArc(r, rad2deg(0.2), rad2deg(2.2), false, p); reset()
        }
    }
}
