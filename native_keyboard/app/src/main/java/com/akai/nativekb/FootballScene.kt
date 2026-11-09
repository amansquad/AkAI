package com.akai.nativekb

import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import androidx.core.graphics.ColorUtils
import java.util.Random
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin

/**
 * The football-club scenes, ported from the Flutter app's football_live_theme.dart.
 * Every club gets the shared stage (floodlights, crowd camera flashes, pitch, a
 * ball, confetti in the kit colours, a vignette) with its own kit colours, plus
 * a signature motif. Motifs are added one by one in [motif]; a club whose motif
 * is not ported yet shows the stage with the default rising-sun burst.
 */
object FootballScene {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()
    private val rect = RectF()
    private val add = PorterDuffXfermode(PorterDuff.Mode.ADD)

    private fun a(color: Int, o: Float) = ColorUtils.setAlphaComponent(color, (o * 255f).toInt().coerceIn(0, 255))
    private fun reset() { paint.shader = null; paint.xfermode = null; paint.style = Paint.Style.FILL; paint.strokeWidth = 1f; paint.strokeCap = Paint.Cap.BUTT; paint.maskFilter = null }
    private fun dot(c: Canvas, x: Float, y: Float, r: Float, color: Int) { reset(); paint.color = color; c.drawCircle(x, y, r, paint) }

    fun paint(canvas: Canvas, w: Float, h: Float, time: Float, type: String) {
        val style = FootballStyles.all[type] ?: TeamStyle(0xFF2E7D32.toInt(), 0xFFFFFFFF.toInt(), "sunburst")
        backdrop(canvas, w, h, time, style)
        motif(canvas, w, h, time, style)
        pitch(canvas, w, h, time)
        confetti(canvas, w, h, time, style)
        vignette(canvas, w, h)
    }

    /** One club's signature motif. Unported motifs fall back to the default burst. */
    private fun motif(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        if (!ClubMotifs.paint(c, w, h, time, st, st.motif)) sunburst(c, w, h, time, st)
    }

    // ── Shared stage ────────────────────────────────────────────────────────

    private fun backdrop(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        reset()
        paint.shader = LinearGradient(
            w / 2f, 0f, w / 2f, h,
            intArrayOf(
                ColorUtils.blendARGB(0xFF05070F.toInt(), st.primary, 0.25f),
                0xFF04060C.toInt(),
                ColorUtils.blendARGB(0xFF04060C.toInt(), st.primary, 0.10f),
            ),
            floatArrayOf(0f, 0.55f, 1f), Shader.TileMode.CLAMP,
        )
        c.drawRect(0f, 0f, w, h, paint)
        reset()

        // Floodlight beams
        for (i in 0 until 2) {
            val ox = if (i == 0) -w * 0.05f else w * 1.05f
            val oy = -h * 0.05f
            val sweep = sin(time * 2 * PI + i * PI) * 0.15
            val angle = (if (i == 0) 0.9 else PI - 0.9) + sweep
            val dx = cos(angle).toFloat(); val dy = sin(angle).toFloat()
            val tx = ox + dx * h * 1.3f; val ty = oy + dy * h * 1.3f
            val px = -dy * w * 0.20f; val py = dx * w * 0.20f
            path.reset()
            path.moveTo(ox, oy); path.lineTo(tx + px, ty + py); path.lineTo(tx - px, ty - py); path.close()
            reset()
            paint.xfermode = add
            paint.shader = LinearGradient((ox + tx) / 2f, oy, (ox + tx) / 2f, ty, a(0xFFFFF8E1.toInt(), 0.13f), 0, Shader.TileMode.CLAMP)
            c.drawPath(path, paint)
            reset()
        }

        // Crowd camera flashes
        val rand = Random(7)
        for (i in 0 until 40) {
            val fx = rand.nextDouble().toFloat() * w
            val fy = h * 0.06f + rand.nextDouble().toFloat() * h * 0.26f
            val tw = sin((time * 6 + rand.nextDouble()) * 2 * PI)
            if (tw < 0.55) continue
            val o = ((tw - 0.55) / 0.45).toFloat().coerceIn(0f, 1f)
            dot(c, fx, fy, 1.2f + o * 1.2f, a(if (i % 3 == 0) st.secondary else 0xFFFFFFFF.toInt(), 0.5f * o))
        }
    }

    private fun pitch(c: Canvas, w: Float, h: Float, time: Float) {
        val top = h * 0.78f
        reset()
        paint.shader = LinearGradient(w / 2f, top, w / 2f, h, 0xFF0A3D1E.toInt(), 0xFF072B15.toInt(), Shader.TileMode.CLAMP)
        c.drawRect(0f, top, w, h, paint)
        reset()
        paint.color = a(0xFF0E4B26.toInt(), 0.55f)
        val n = 9
        var s = 0
        while (s < n) {
            val a0 = s.toFloat() / n; val b0 = (s + 1).toFloat() / n
            path.reset()
            path.moveTo(w * 0.5f + (a0 - 0.5f) * w * 0.9f, top)
            path.lineTo(w * 0.5f + (b0 - 0.5f) * w * 0.9f, top)
            path.lineTo(w * 0.5f + (b0 - 0.5f) * w * 1.25f, h)
            path.lineTo(w * 0.5f + (a0 - 0.5f) * w * 1.25f, h)
            path.close()
            c.drawPath(path, paint)
            s += 2
        }
        reset()
        paint.color = a(0xFFFFFFFF.toInt(), 0.45f); paint.strokeWidth = 1.4f
        c.drawLine(0f, top + 1f, w, top + 1f, paint)
        paint.style = Paint.Style.STROKE; paint.color = a(0xFFFFFFFF.toInt(), 0.3f)
        rect.set(w * 0.5f - w * 0.15f, top - h * 0.035f, w * 0.5f + w * 0.15f, top + h * 0.035f)
        c.drawOval(rect, paint)
        reset()

        // Ball arcing across the pitch
        val t = (time * 3) % 1f
        val bx = w * (0.12f + t * 0.76f)
        val by = top + (h - top) * 0.45f - abs(sin(t * PI * 3)).toFloat() * h * 0.08f
        dot(c, bx, by, 6f, a(0xFFFFFFFF.toInt(), 0.25f))
        dot(c, bx, by, 4.5f, 0xFFFFFFFF.toInt())
        val spin = t * 10 * PI
        for (d in 0 until 3) {
            val ang = spin + d * (2 * PI / 3)
            dot(c, bx + cos(ang).toFloat() * 2.2f, by + sin(ang).toFloat() * 2.2f, 1f, 0xFF1A1A1A.toInt())
        }
    }

    private fun confetti(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val rand = Random(21)
        for (i in 0 until 22) {
            val t = ((time * 0.5 + rand.nextDouble()) % 1.0).toFloat()
            val cx = (((rand.nextDouble() * w + sin(time * 2 * PI + i) * 24) % w) + w) % w
            reset(); paint.color = a(if (i % 2 == 0) st.primary else st.secondary, 0.7f * (1f - t * 0.6f))
            c.save()
            c.translate(cx.toFloat(), t * h)
            c.rotate(((time * 4 * PI + i) * 180 / PI).toFloat())
            rect.set(-3f, -1.5f, 3f, 1.5f); c.drawRoundRect(rect, 1f, 1f, paint)
            c.restore()
        }
    }

    private fun vignette(c: Canvas, w: Float, h: Float) {
        reset()
        paint.shader = RadialGradient(
            w / 2f, h / 2f, kotlin.math.min(w, h) * 1.1f,
            intArrayOf(0, 0, a(0xFF000000.toInt(), 0.35f)), floatArrayOf(0f, 0.6f, 1f), Shader.TileMode.CLAMP,
        )
        c.drawRect(0f, 0f, w, h, paint)
        reset()
    }

    // ── Default motif ──────────────────────────────────────────────────────

    private fun sunburst(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cx = w * 0.5f; val cy = h * 0.44f
        val rot = time * 2 * PI * 0.3
        for (i in 0 until 12) {
            val ang = rot + i * PI / 6
            path.reset()
            path.moveTo(cx, cy)
            path.lineTo((cx + cos(ang) * w * 0.65).toFloat(), (cy + sin(ang) * w * 0.65).toFloat())
            path.lineTo((cx + cos(ang + 0.22) * w * 0.65).toFloat(), (cy + sin(ang + 0.22) * w * 0.65).toFloat())
            path.close()
            reset()
            paint.xfermode = add
            paint.shader = RadialGradient(cx, cy, w * 0.55f, a(if (i % 2 == 0) st.primary else st.secondary, 0.16f), 0, Shader.TileMode.CLAMP)
            c.drawPath(path, paint)
            reset()
        }
        val pulse = (sin(time * 4 * PI) * 0.5 + 0.5).toFloat()
        reset()
        paint.shader = RadialGradient(
            cx, cy, w * 0.12f, intArrayOf(a(0xFFFFFFFF.toInt(), 0.85f), a(st.primary, 0.6f), 0), null, Shader.TileMode.CLAMP,
        )
        c.drawCircle(cx, cy, w * (0.085f + 0.012f * pulse), paint)
        reset()
    }
}
