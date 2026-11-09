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

    // St George: a glowing sword with a dragon-fire at its tip.
    private fun knight(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        glow(c, w * 0.35f, h * 0.28f, w * 0.20f, a(st.primary, 0.35f), 0)
        val tipX = w * 0.78f; val tipY = h * 0.62f
        val tailX = w * 0.18f; val tailY = h * 0.22f
        reset()
        p.shader = LinearGradient(tailX, tailY, tipX, tipY, intArrayOf(hex(0xFFB8860B), st.primary, hex(0xFFFFF8E1)), null, Shader.TileMode.CLAMP)
        p.strokeWidth = 5f; p.strokeCap = Paint.Cap.ROUND
        c.drawLine(tailX, tailY, tipX, tipY, p); reset()
        val dx = tipX - tailX; val dy = tipY - tailY
        val len = sqrt(dx * dx + dy * dy)
        val ux = dx / len; val uy = dy / len
        val px = -uy; val py = ux
        path.reset()
        path.moveTo(tipX + ux * 16, tipY + uy * 16)
        path.lineTo(tipX + px * 7, tipY + py * 7)
        path.lineTo(tipX - px * 7, tipY - py * 7)
        path.close(); fillPath(c, path, hex(0xFFFFF8E1))
        val gt = (time * 4) % 1f
        dot(c, tailX + (tipX - tailX) * gt, tailY + (tipY - tailY) * gt, 7f, a(WHITE, 0.8f * (1f - abs(gt - 0.5f) * 2f)))
        val rand = Random(13)
        for (i in 0 until 16) {
            val t = ((time * 2 + rand.nextDouble()) % 1.0).toFloat()
            val fx = w * 0.86f + (rand.nextDouble().toFloat() - 0.5f) * w * 0.14f - t * w * 0.10f
            val fy = h * 0.72f - t * h * 0.30f
            reset(); p.xfermode = addMode
            p.color = a(lerp(st.secondary, hex(0xFFFF9800), t), 0.5f * (1f - t))
            c.drawCircle(fx, fy, 6f + (1f - t) * 10f, p); reset()
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
