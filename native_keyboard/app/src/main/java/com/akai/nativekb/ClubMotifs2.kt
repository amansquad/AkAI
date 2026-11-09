package com.akai.nativekb

import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.graphics.RadialGradient
import com.akai.nativekb.ClubMotifs.a
import com.akai.nativekb.ClubMotifs.addMode
import com.akai.nativekb.ClubMotifs.dot
import com.akai.nativekb.ClubMotifs.fillPath
import com.akai.nativekb.ClubMotifs.glow
import com.akai.nativekb.ClubMotifs.lerp
import com.akai.nativekb.ClubMotifs.line
import com.akai.nativekb.ClubMotifs.oval
import com.akai.nativekb.ClubMotifs.p
import com.akai.nativekb.ClubMotifs.path
import com.akai.nativekb.ClubMotifs.r
import com.akai.nativekb.ClubMotifs.rad2deg
import com.akai.nativekb.ClubMotifs.reset
import com.akai.nativekb.ClubMotifs.strokePath
import java.util.Random
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

/** More club motifs, ported from the Flutter app (fireworks, train, wheat, sunrise, peaks, lion). */
object ClubMotifs2 {

    fun paint(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle, name: String): Boolean {
        when (name) {
            "fireworks" -> fireworks(c, w, h, time, st)
            "train" -> train(c, w, h, time, st)
            "wheat" -> wheat(c, w, h, time, st)
            "sunrise" -> sunrise(c, w, h, time, st)
            "peaks" -> peaks(c, w, h, time, st)
            "lion" -> lion(c, w, h, time, st)
            else -> return ClubMotifs3.paint(c, w, h, time, st, name)
        }
        return true
    }

    private fun easeOut(t: Float) = 1f - (1f - t) * (1f - t)

    // Mekelle: rockets that burst in red and yellow.
    private fun fireworks(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        for (i in 0 until 3) {
            val cycle = (time * 5 + i * 0.33f) % 1f
            val launchX = w * (0.25f + i * 0.25f)
            val burstY = h * (0.22f + (i % 2) * 0.10f)
            if (cycle < 0.35f) {
                val t = cycle / 0.35f
                val y = h * 0.72f - (h * 0.72f - burstY) * t
                reset()
                p.shader = LinearGradient(launchX, y + 14f, launchX, y, 0, a(st.secondary, 0.9f), Shader.TileMode.CLAMP)
                p.strokeWidth = 2.5f
                c.drawLine(launchX, y + 14f, launchX, y, p); reset()
                dot(c, launchX, y, 2.5f, a(WHITE, 0.95f))
            } else {
                val t = (cycle - 0.35f) / 0.65f
                val rr = w * 0.16f * easeOut(t)
                val fade = (1f - t).coerceIn(0f, 1f)
                val droop = t * t * 22f
                for (s in 0 until 14) {
                    val ang = s * 2 * PI / 14 + i
                    reset(); p.xfermode = addMode; p.strokeWidth = 2f; p.strokeCap = Paint.Cap.ROUND
                    p.color = a(if (s % 2 == 0) st.primary else st.secondary, 0.85f * fade)
                    c.drawLine(
                        (launchX + cos(ang) * rr * 0.6).toFloat(), (burstY + sin(ang) * rr * 0.6 + droop * 0.5).toFloat(),
                        (launchX + cos(ang) * rr).toFloat(), (burstY + sin(ang) * rr + droop).toFloat(), p,
                    )
                    reset()
                }
                reset(); p.color = a(WHITE, 0.5f * fade); p.maskFilter = BlurMaskFilter(8f, BlurMaskFilter.Blur.NORMAL)
                c.drawCircle(launchX, burstY, 10f * fade, p); reset()
            }
        }
    }

    // Dire Dawa: the railway, with a train and puffing smoke.
    private fun train(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val railY = h * 0.60f
        line(c, 0f, railY + 12f, w, railY + 12f, a(hex(0xFF6D5843), 0.8f), 3f)
        val scroll = (time * w * 3) % 26f
        var x = -scroll
        reset(); p.color = a(hex(0xFF4E3E2E), 0.7f)
        while (x < w) { c.drawRect(x, railY + 15f, x + 14f, railY + 19f, p); x += 26f }
        val tx = ((time * 2) % 1.4f - 0.2f) * w
        fun rrect(l: Float, t: Float, rr: Float, b: Float, rad: Float, color: Int) {
            reset(); p.color = color; r.set(l, t, rr, b); c.drawRoundRect(r, rad, rad, p)
        }
        rrect(tx, railY - 34f, tx + 74f, railY, 6f, st.primary)
        rrect(tx + 46f, railY - 56f, tx + 74f, railY - 32f, 4f, st.primary)
        reset(); p.color = st.secondary
        c.drawRect(tx + 52f, railY - 52f, tx + 68f, railY - 42f, p)
        c.drawRect(tx + 8f, railY - 48f, tx + 18f, railY - 34f, p)
        dot(c, tx + 4f, railY - 17f, 7f, hex(0xFFFFF59D))
        path.reset(); path.moveTo(tx - 2f, railY - 17f); path.lineTo(tx - w * 0.22f, railY - 34f); path.lineTo(tx - w * 0.22f, railY); path.close()
        reset(); p.xfermode = addMode
        p.shader = LinearGradient(tx - w * 0.22f, 0f, tx - w * 0.22f + w * 0.22f, 0f, a(hex(0xFFFFF59D), 0.30f), 0, Shader.TileMode.CLAMP)
        c.drawPath(path, p); reset()
        for (c2 in 0 until 2) {
            val cx = tx + 82f + c2 * 64f
            rrect(cx, railY - 30f, cx + 56f, railY, 5f, a(st.secondary, 0.9f))
            for (wdw in 0 until 3) {
                reset(); p.color = a(hex(0xFFFFF59D), 0.9f)
                c.drawRect(cx + 6f + wdw * 17f, railY - 24f, cx + 17f + wdw * 17f, railY - 15f, p)
            }
        }
        val wheelRot = time * 2 * PI * 8
        for (wx in floatArrayOf(tx + 16f, tx + 40f, tx + 62f, tx + 96f, tx + 130f, tx + 160f, tx + 194f)) {
            dot(c, wx, railY, 8f, hex(0xFF22242C))
            reset(); p.style = Paint.Style.STROKE; p.strokeWidth = 1.6f; p.color = hex(0xFF9AA0AC)
            c.drawCircle(wx, railY, 8f, p); reset()
            line(c, wx - cos(wheelRot).toFloat() * 6f, railY - sin(wheelRot).toFloat() * 6f,
                wx + cos(wheelRot).toFloat() * 6f, railY + sin(wheelRot).toFloat() * 6f, hex(0xFF9AA0AC), 1.6f)
        }
        for (k in 0 until 6) {
            val t = (time * 3 + k * 0.16f) % 1f
            reset(); p.color = a(WHITE, 0.25f * (1f - t)); p.maskFilter = BlurMaskFilter(6f, BlurMaskFilter.Blur.NORMAL)
            c.drawCircle(tx + 13f - t * 60f, railY - 52f - t * 46f, 5f + t * 14f, p); reset()
        }
    }

    // Negele Arsi: swaying wheat under a low sun.
    private fun wheat(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        glow(c, w * 0.78f, h * 0.20f, 40f, hex(0xFFFFF59D), a(hex(0xFFFFB300), 0.4f), 0)
        for (i in 0 until 16) {
            val baseX = w * (i + 0.5f) / 16f
            val sway = (sin(time * 2 * PI + i * 0.6) * 10).toFloat()
            val topX = baseX + sway
            val baseY = h * 0.74f
            val topY = h * 0.46f + (i % 3) * 12f
            path.reset(); path.moveTo(baseX, baseY); path.quadTo(baseX + sway * 0.4f, (baseY + topY) / 2f, topX, topY)
            strokePath(c, path, a(hex(0xFFD4A017), 0.8f), 2.4f)
            for (k in 0 until 5) oval(c, topX + (if (k % 2 == 0) -3f else 3f), topY - k * 4.5f, 5f, 8f, a(hex(0xFFF2C230), 0.9f))
        }
        val rand = Random(51)
        for (i in 0 until 12) {
            val t = ((time * 0.8 + rand.nextDouble()) % 1.0).toFloat()
            val gx = t * w * 1.2f - w * 0.1f
            val gy = h * (0.3f + rand.nextDouble().toFloat() * 0.3f) + sin(t * 6.0).toFloat() * 8f
            dot(c, gx, gy, 1.6f, a(hex(0xFFF2C230), 0.5f * (1f - t)))
        }
    }

    // Woldia: a sun rising behind two mountains, with birds.
    private fun sunrise(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val rise = (sin(time * 2 * PI) * 0.5 + 0.5).toFloat()
        val sunY = h * 0.52f - rise * h * 0.16f
        reset()
        p.shader = LinearGradient(w / 2f, h * 0.2f, w / 2f, h * 0.7f, 0, a(st.secondary, 0.20f + rise * 0.12f), Shader.TileMode.CLAMP)
        c.drawRect(0f, h * 0.2f, w, h * 0.7f, p); reset()
        val sx = w * 0.5f
        val rot = time * 2 * PI * 0.25
        for (i in 0 until 10) {
            val ang = rot + i * PI / 5
            line(c, sx + cos(ang).toFloat() * 30f, sunY + sin(ang).toFloat() * 30f,
                sx + cos(ang).toFloat() * (42f + rise * 8f), sunY + sin(ang).toFloat() * (42f + rise * 8f),
                a(st.secondary, 0.6f), 3f, round = true)
        }
        reset()
        p.shader = RadialGradient(sx, sunY, 30f, intArrayOf(WHITE, st.secondary, a(st.secondary, 0f)), floatArrayOf(0f, 0.55f, 1f), Shader.TileMode.CLAMP)
        c.drawCircle(sx, sunY, 22f, p); reset()
        val mount = a(hex(0xFF0B1F10), 0.95f)
        path.reset(); path.moveTo(0f, h * 0.74f); path.lineTo(w * 0.22f, h * 0.52f); path.lineTo(w * 0.45f, h * 0.74f); path.close(); fillPath(c, path, mount)
        path.reset(); path.moveTo(w * 0.35f, h * 0.74f); path.lineTo(w * 0.65f, h * 0.46f); path.lineTo(w * 0.95f, h * 0.74f); path.close(); fillPath(c, path, mount)
        for (b in 0 until 3) {
            val t = (time * 1.2f + b * 0.3f) % 1f
            val bx = t * w * 1.2f - w * 0.1f
            val by = h * (0.24f + b * 0.06f) + sin(t * 4 * PI).toFloat() * 6f
            val flap = abs(sin((time * 8 + b) * PI)).toFloat() * 4f
            path.reset(); path.moveTo(bx - 8f, by - flap); path.quadTo(bx - 3f, by + 2f, bx, by); path.quadTo(bx + 3f, by + 2f, bx + 8f, by - flap)
            strokePath(c, path, a(hex(0xFF1A1A1A), 0.8f), 2f, round = true)
        }
    }

    // Hamb. mountain ridges, mist and stars.
    private fun peaks(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val rand = Random(53)
        for (i in 0 until 16) {
            val tw = (sin((time * 4 + rand.nextDouble() * 3) * PI) * 0.5 + 0.5).toFloat()
            dot(c, rand.nextDouble().toFloat() * w, rand.nextDouble().toFloat() * h * 0.3f, 1f + tw, a(WHITE, 0.3f + 0.4f * tw))
        }
        val shades = floatArrayOf(0.85f, 0.65f, 0.45f)
        for (layer in 0 until 3) {
            val baseY = h * (0.50f + layer * 0.10f)
            val peakH = h * (0.22f - layer * 0.05f)
            path.reset(); path.moveTo(0f, h * 0.78f)
            var x = 0f
            while (x <= w + 0.01f) {
                path.lineTo(x, baseY - peakH * (0.5f + 0.5f * sin(x / w * PI * (2 + layer) + layer * 2).toFloat()))
                x += w / 6f
            }
            path.lineTo(w, h * 0.78f); path.close()
            fillPath(c, path, a(lerp(st.primary, hex(0xFF04110E), shades[layer]), 0.9f))
        }
        for (f in 0 until 2) {
            val fx = (((time * (if (f == 0) 0.6f else -0.4f)) % 1f) + 1f) % 1f
            reset(); p.color = a(st.secondary, 0.14f); p.maskFilter = BlurMaskFilter(14f, BlurMaskFilter.Blur.NORMAL)
            val cx = (fx * 1.4f - 0.2f) * w; val cy = h * (0.52f + f * 0.12f)
            r.set(cx - w * 0.35f, cy - h * 0.025f, cx + w * 0.35f, cy + h * 0.025f); c.drawOval(r, p); reset()
        }
    }

    // Hadiya: the lion with a flickering mane.
    private fun lion(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cx = w * 0.5f; val cy = h * 0.38f
        for (ring in 0 until 2) {
            val n = 14 + ring * 4
            val rot = time * 2 * PI * (if (ring % 2 == 0) 0.15 else -0.1)
            for (i in 0 until n) {
                val ang = rot + i * 2 * PI / n
                val flick = (sin((time * 5 + i) * PI) * 4).toFloat()
                val inner = 34f + ring * 16f
                val outer = inner + 22f + flick
                path.reset()
                path.moveTo((cx + cos(ang - 0.09) * inner).toFloat(), (cy + sin(ang - 0.09) * inner).toFloat())
                path.lineTo((cx + cos(ang) * outer).toFloat(), (cy + sin(ang) * outer).toFloat())
                path.lineTo((cx + cos(ang + 0.09) * inner).toFloat(), (cy + sin(ang + 0.09) * inner).toFloat())
                path.close()
                fillPath(c, path, a(lerp(st.primary, st.secondary, ring * 0.5f), 0.55f - ring * 0.15f))
            }
        }
        dot(c, cx, cy, 30f, hex(0xFFC98A2B))
        dot(c, cx - 20f, cy - 24f, 9f, hex(0xFFB37722))
        dot(c, cx + 20f, cy - 24f, 9f, hex(0xFFB37722))
        val blink = sin(time * 2 * PI * 3)
        val eyeH = if (blink > 0.92) 1f else 5f
        oval(c, cx - 11f, cy - 6f, 8f, eyeH, hex(0xFFFFB300))
        oval(c, cx + 11f, cy - 6f, 8f, eyeH, hex(0xFFFFB300))
        oval(c, cx, cy + 12f, 22f, 16f, hex(0xFFE0AC50))
        path.reset(); path.moveTo(cx - 5f, cy + 7f); path.lineTo(cx + 5f, cy + 7f); path.lineTo(cx, cy + 13f); path.close()
        fillPath(c, path, hex(0xFF57330F))
        for (side in intArrayOf(-1, 1)) for (i in 0 until 3) {
            line(c, cx + side * 8f, cy + 12f + i - 1f, cx + side * 26f, cy + 9f + i * 3f, a(hex(0xFF57330F), 0.7f), 1.2f)
        }
    }
}
