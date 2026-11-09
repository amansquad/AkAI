package com.akai.nativekb

import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
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
import kotlin.math.sqrt

/** The remaining Ethiopian club motifs, ported from the Flutter app. */
object ClubMotifs3 {

    fun paint(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle, name: String): Boolean {
        when (name) {
            "springs" -> springs(c, w, h, time, st)
            "fish" -> fish(c, w, h, time, st)
            "rapids" -> rapids(c, w, h, time, st)
            "obelisk" -> obelisk(c, w, h, time, st)
            "temple" -> temple(c, w, h, time, st)
            "swords" -> swords(c, w, h, time, st)
            "eagle" -> eagle(c, w, h, time, st)
            "caravan" -> caravan(c, w, h, time, st)
            "branch" -> branch(c, w, h, time, st)
            else -> return ClubMotifs4.paint(c, w, h, time, st, name)
        }
        return true
    }

    private fun strokeOval(c: Canvas, cx: Float, cy: Float, ow: Float, oh: Float, color: Int, width: Float) {
        reset(); p.style = Paint.Style.STROKE; p.strokeWidth = width; p.color = color
        r.set(cx - ow / 2, cy - oh / 2, cx + ow / 2, cy + oh / 2); c.drawOval(r, p); reset()
    }

    // Arba Minch: the springs, with jets of water.
    private fun springs(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        oval(c, w * 0.5f, h * 0.66f, w * 0.9f, h * 0.10f, a(st.primary, 0.25f))
        for (k in 0 until 3) {
            val t = (time * 1.5f + k * 0.33f) % 1f
            strokeOval(c, w * 0.5f, h * 0.66f, w * 0.2f + w * 0.6f * t, h * 0.02f + h * 0.07f * t, a(st.secondary, 0.4f * (1f - t)), 2f)
        }
        for (f in 0 until 4) {
            val fx = w * (0.2f + f * 0.2f)
            val power = (0.8 + sin((time * 3 + f) * PI) * 0.2).toFloat()
            val rand = Random((f * 13 + 1).toLong())
            for (d in 0 until 9) {
                val t = (time * 2.2f + d * 0.11f + f * 0.07f) % 1f
                val spread = (rand.nextDouble().toFloat() - 0.5f) * 26f
                dot(c, fx + spread * t, h * 0.66f - (4 * t * (1 - t)) * h * 0.22f * power, 2.2f * (1f - t * 0.5f),
                    a(lerp(st.secondary, WHITE, t), 0.8f * (1f - t * 0.4f)))
            }
            line(c, fx, h * 0.66f, fx, h * 0.66f - h * 0.10f * power, a(WHITE, 0.5f), 3f, round = true)
        }
    }

    // Hawassa: fish leaping out of the lake.
    private fun fish(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val waterY = h * 0.58f
        path.reset(); path.moveTo(0f, waterY)
        var x = 0f
        while (x <= w + 0.01f) { path.lineTo(x, waterY + sin(x / w * 4 * PI + time * 2 * PI).toFloat() * 5f); x += w / 14f }
        path.lineTo(w, h * 0.78f); path.lineTo(0f, h * 0.78f); path.close()
        fillPath(c, path, a(st.primary, 0.30f))
        for (f2 in 0 until 2) {
            val t = (time * 1.6f + f2 * 0.5f) % 1f
            val fx = w * (0.18f + f2 * 0.42f) + t * w * 0.22f
            val arc = 4 * t * (1 - t)
            val fy = waterY - arc * h * 0.16f
            if (arc > 0.05f) {
                val angle = (0.5f - t) * 1.6f
                c.save(); c.translate(fx, fy); c.rotate(rad2deg(-angle.toDouble()))
                oval(c, 0f, 0f, 26f, 11f, a(st.secondary, 0.95f))
                path.reset(); path.moveTo(-13f, 0f); path.lineTo(-21f, -6f); path.lineTo(-21f, 6f); path.close()
                fillPath(c, path, a(st.secondary, 0.95f))
                dot(c, 7f, -2f, 1.6f, WHITE)
                line(c, -6f, -3f, 5f, -4f, a(WHITE, 0.4f), 1.5f)
                c.restore()
                if (t < 0.25f || t > 0.75f) {
                    for (d in 0 until 5) {
                        val da = PI * (0.25 + d * 0.125)
                        val dr = 8f + (if (t < 0.25f) t else 1f - t) * 30f
                        dot(c, fx + (cos(da) * dr).toFloat(), waterY - (sin(da) * dr * 0.6).toFloat(), 1.8f, a(WHITE, 0.5f))
                    }
                }
            }
        }
        val rand = Random(57)
        for (i in 0 until 10) {
            val gx = rand.nextDouble().toFloat() * w
            val gy = waterY + rand.nextDouble().toFloat() * h * 0.16f
            val tw = (sin((time * 5 + i) * 2 * PI) * 0.5 + 0.5).toFloat()
            oval(c, gx, gy, 8f * tw + 2f, 2f, a(WHITE, 0.3f * tw))
        }
    }

    // Awash: rushing rapids around rocks.
    private fun rapids(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        for (lane in 0 until 4) {
            val laneY = h * (0.34f + lane * 0.10f)
            path.reset(); path.moveTo(-20f, laneY)
            var x = -20f
            while (x <= w + 20f) {
                path.lineTo(x, laneY + (sin(x / w * 5 * PI + time * 2 * PI * 3 + lane) * (5.0 + lane)).toFloat())
                x += w / 10f
            }
            strokePath(c, path, a(lerp(st.primary, st.secondary, lane / 4f), 0.5f - lane * 0.08f), 8f - lane)
        }
        for (b in 0 until 3) {
            val bx = w * (0.22f + b * 0.28f)
            val by = h * (0.42f + (b % 2) * 0.14f)
            oval(c, bx, by, 30f, 20f, hex(0xFF37414C))
            val rand = Random((b * 19 + 2).toLong())
            for (s in 0 until 7) {
                val t = (time * 4 + s * 0.14f + b * 0.2f) % 1f
                dot(c, bx - 16f - t * 14f + rand.nextDouble().toFloat() * 6f, by - 8f - t * 12f, 2.5f * (1f - t) + 0.5f, a(WHITE, 0.6f * (1f - t)))
            }
        }
    }

    // Shire: Axumite stelae with a glowing aura.
    private fun obelisk(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val pulse = (sin(time * 2 * PI) * 0.5 + 0.5).toFloat()
        glow(c, w * 0.5f, h * 0.42f, w * 0.3f, a(st.secondary, 0.20f), 0)
        fun stele(cx: Float, sw: Float, sh: Float) {
            path.reset()
            path.moveTo(cx - sw / 2f, h * 0.70f); path.lineTo(cx - sw / 2.6f, h * 0.70f - sh)
            path.quadTo(cx, h * 0.70f - sh - 14f, cx + sw / 2.6f, h * 0.70f - sh)
            path.lineTo(cx + sw / 2f, h * 0.70f); path.close()
            fillPath(c, path, hex(0xFF1B2430))
            for (i in 1..4) {
                val y = h * 0.70f - sh * i / 5f
                line(c, cx - sw / 3.2f, y, cx + sw / 3.2f, y, a(st.secondary, 0.35f), 1.4f)
            }
        }
        stele(w * 0.5f, w * 0.13f, h * 0.34f)
        stele(w * 0.28f, w * 0.09f, h * 0.20f)
        stele(w * 0.72f, w * 0.09f, h * 0.16f)
        val rand = Random(59)
        for (i in 0 until 12) {
            val t = ((time * 0.5 + rand.nextDouble()) % 1.0).toFloat()
            dot(c, w * (0.3f + rand.nextDouble().toFloat() * 0.4f), h * 0.7f - t * h * 0.4f, 1.5f, a(st.secondary, 0.5f * (1f - t)))
        }
        if (pulse < 0f) return
    }

    // Welwalo: a temple with columns and a glowing nave.
    private fun temple(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val baseY = h * 0.68f
        val glowAmt = (sin(time * 2 * PI) * 0.5 + 0.5).toFloat()
        reset()
        p.shader = LinearGradient(w / 2f, baseY, w / 2f, baseY - h * 0.26f, a(st.secondary, 0.18f + glowAmt * 0.12f), 0, Shader.TileMode.CLAMP)
        c.drawRect(w * 0.25f, baseY - h * 0.26f, w * 0.75f, baseY, p); reset()
        val stone = hex(0xFF221A16)
        reset(); p.color = stone
        c.drawRect(w * 0.18f, baseY, w * 0.82f, baseY + 8f, p)
        c.drawRect(w * 0.14f, baseY + 8f, w * 0.86f, baseY + 16f, p)
        for (i in 0 until 4) {
            val cx = w * (0.28f + i * 0.148f)
            reset(); p.color = stone
            c.drawRect(cx - 7f, baseY - h * 0.24f, cx + 7f, baseY, p)
            c.drawRect(cx - 11f, baseY - h * 0.24f - 7f, cx + 11f, baseY - h * 0.24f, p)
            c.drawRect(cx - 10f, baseY - 6f, cx + 10f, baseY, p)
            line(c, cx - 5f, baseY - h * 0.24f, cx - 5f, baseY, a(st.secondary, 0.20f + glowAmt * 0.15f), 2f)
        }
        path.reset(); path.moveTo(w * 0.22f, baseY - h * 0.24f - 7f); path.lineTo(w * 0.5f, baseY - h * 0.24f - 7f - h * 0.07f); path.lineTo(w * 0.78f, baseY - h * 0.24f - 7f); path.close()
        fillPath(c, path, stone)
        val rand = Random(61)
        for (i in 0 until 10) {
            val t = ((time * 0.6 + rand.nextDouble()) % 1.0).toFloat()
            dot(c, w * (0.3f + rand.nextDouble().toFloat() * 0.4f) + sin(t * 8.0).toFloat() * 6f, baseY - t * h * 0.36f, 1.4f, a(st.secondary, 0.55f * (1f - t)))
        }
    }

    // Mekel: two clashing swords with sparks.
    private fun swords(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cx = w * 0.5f; val cy = h * 0.40f
        val cycle = (time * 6) % 1f
        val open = 0.55 - 0.25 * sin(cycle * PI)
        for (side in intArrayOf(-1, 1)) {
            val ang = side * open + (if (side == 1) PI else 0.0)
            val dx = cos(ang - PI / 2).toFloat(); val dy = sin(ang - PI / 2).toFloat()
            val hx = cx - dx * 24f; val hy = cy - dy * 24f
            val tx = cx + dx * h * 0.16f; val ty = cy + dy * h * 0.16f
            reset()
            p.shader = LinearGradient(hx, hy, tx, ty, hex(0xFFE8EBF0), hex(0xFF8F97A3), Shader.TileMode.CLAMP)
            p.strokeWidth = 7f; p.strokeCap = Paint.Cap.ROUND
            c.drawLine(hx, hy, tx, ty, p); reset()
            line(c, hx, hy, tx, ty, hex(0xFF5E6672), 1.6f)
            val px = -dy; val py = dx
            line(c, hx + px * 12f, hy + py * 12f, hx - px * 12f, hy - py * 12f, st.secondary, 5f)
            line(c, hx, hy, hx - dx * 18f, hy - dy * 18f, hex(0xFF4A2E12), 6f)
            dot(c, hx - dx * 21f, hy - dy * 21f, 4f, st.secondary)
        }
        val clash = (1f - abs(cycle - 0.5f) * 8f).coerceIn(0f, 1f)
        if (clash > 0f) {
            val rand = Random(67)
            for (s in 0 until 10) {
                val ang = rand.nextDouble() * 2 * PI
                val len = 8f + rand.nextDouble().toFloat() * 20f * clash
                reset(); p.xfermode = addMode; p.strokeWidth = 2f; p.strokeCap = Paint.Cap.ROUND
                p.color = a(lerp(WHITE, st.secondary, rand.nextDouble().toFloat()), 0.9f * clash)
                c.drawLine(cx + cos(ang).toFloat() * 6f, cy + sin(ang).toFloat() * 6f, cx + cos(ang).toFloat() * (6f + len), cy + sin(ang).toFloat() * (6f + len), p)
                reset()
            }
            reset(); p.color = a(WHITE, 0.8f * clash); p.maskFilter = BlurMaskFilter(6f, BlurMaskFilter.Blur.NORMAL)
            c.drawCircle(cx, cy, 10f * clash, p); reset()
        }
    }

    // Dicha: an eagle gliding across the sky.
    private fun eagle(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val t = (time * 1.2f) % 1f
        val ex = w * (t * 1.3f - 0.15f)
        val ey = h * 0.32f + sin(t * 3 * PI).toFloat() * h * 0.05f
        val flap = (sin(time * 8 * PI) * 0.35).toFloat()
        for (i in 0 until 4) {
            val wy = h * (0.22f + i * 0.08f)
            val wx = ((time * 2.4f + i * 0.26f) % 1f) * w * 1.4f - w * 0.2f
            line(c, wx, wy, wx - w * 0.10f, wy, a(WHITE, 0.12f), 2f, round = true)
        }
        for (side in intArrayOf(-1, 1)) {
            val span = w * 0.20f * side
            val lift = -h * 0.09f - flap * h * 0.05f * side
            path.reset(); path.moveTo(ex, ey)
            path.quadTo(ex + span * 0.4f, ey + lift * 1.5f, ex + span, ey + lift)
            path.quadTo(ex + span * 0.75f, ey + lift * 0.3f + 8f, ex + span * 0.3f, ey + 5f); path.close()
            fillPath(c, path, a(st.primary, 0.85f))
            for (f in 0 until 3) {
                line(c, ex + span * (0.75f + f * 0.08f), ey + lift * (0.9f - f * 0.1f), ex + span * (0.9f + f * 0.08f), ey + lift * (1.05f - f * 0.1f), a(st.primary, 0.7f), 3f, round = true)
            }
        }
        oval(c, ex, ey + 4f, 20f, 30f, st.primary)
        path.reset(); path.moveTo(ex - 4f, ey + 18f); path.lineTo(ex, ey + 32f); path.lineTo(ex + 4f, ey + 18f); path.close()
        fillPath(c, path, a(st.primary, 0.9f))
        dot(c, ex, ey - 12f, 7f, WHITE)
        path.reset(); path.moveTo(ex + 6f, ey - 13f); path.lineTo(ex + 13f, ey - 10f); path.lineTo(ex + 6f, ey - 8f); path.close()
        fillPath(c, path, st.secondary)
        dot(c, ex + 2f, ey - 13f, 1.5f, hex(0xFF1A1A1A))
    }

    // Negede: a camel caravan crossing the dunes under the moon.
    private fun caravan(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        dot(c, w * 0.2f, h * 0.18f, 14f, a(hex(0xFFFFF3D6), 0.95f))
        val rand = Random(71)
        for (i in 0 until 14) {
            val tw = (sin((time * 4 + rand.nextDouble() * 3) * PI) * 0.5 + 0.5).toFloat()
            dot(c, rand.nextDouble().toFloat() * w, rand.nextDouble().toFloat() * h * 0.3f, 0.8f + tw, a(WHITE, 0.3f + 0.4f * tw))
        }
        path.reset(); path.moveTo(0f, h * 0.62f)
        path.quadTo(w * 0.3f, h * 0.52f, w * 0.6f, h * 0.62f); path.quadTo(w * 0.85f, h * 0.70f, w, h * 0.60f)
        path.lineTo(w, h * 0.78f); path.lineTo(0f, h * 0.78f); path.close()
        fillPath(c, path, a(hex(0xFF6B4E2E), 0.6f))
        val walk = time % 1f
        for (cml in 0 until 3) {
            val cx = w * (walk * 1.3f - 0.15f) - cml * 74f
            val cy = h * 0.58f - sin(cx / w * 2 * PI).toFloat() * 6f
            val body = hex(0xFF17110B)
            oval(c, cx, cy, 44f, 18f, body)
            dot(c, cx - 8f, cy - 10f, 8f, body)
            dot(c, cx + 8f, cy - 9f, 7f, body)
            path.reset(); path.moveTo(cx + 20f, cy - 4f); path.quadTo(cx + 32f, cy - 18f, cx + 34f, cy - 26f)
            path.lineTo(cx + 40f, cy - 24f); path.quadTo(cx + 36f, cy - 14f, cx + 26f, cy)
            fillPath(c, path, body)
            for (leg in 0 until 4) {
                val phase = (sin((time * 6) * PI + leg * PI / 2) * 5).toFloat()
                val lx = cx - 15f + leg * 10f
                line(c, lx, cy + 6f, lx + phase, cy + 24f, body, 3.5f)
            }
            reset(); p.color = a(st.secondary, 0.9f); r.set(cx - 8f, cy - 18.5f, cx + 8f, cy - 9.5f); c.drawRoundRect(r, 2f, 2f, p)
        }
        for (i in 0 until 8) {
            val t = (time * 1.4f + i * 0.12f) % 1f
            dot(c, t * w, h * 0.64f + sin(t * 8.0).toFloat() * 5f, 1.3f, a(hex(0xFFD9B380), 0.4f * (1f - t)))
        }
    }

    // Sidama: a coffee branch with ripening berries.
    private fun branch(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val sway = (sin(time * 2 * PI) * 6).toFloat()
        path.reset(); path.moveTo(-4f, h * 0.30f); path.quadTo(w * 0.3f, h * 0.34f + sway * 0.4f, w * 0.62f, h * 0.42f + sway)
        strokePath(c, path, hex(0xFF4E342E), 6f, round = true)
        for (i in 0 until 7) {
            val t = 0.12f + i * 0.13f
            val lx = w * t * 0.62f / 0.9f
            val ly = h * (0.30f + t * 0.13f) + sway * t
            val la = sin(time * 2 * PI + i) * 0.12 + (if (i % 2 == 0) 0.9 else -0.9)
            c.save(); c.translate(lx, ly); c.rotate(rad2deg(la))
            oval(c, 16f, 0f, 34f, 13f, a(st.primary, 0.85f))
            line(c, 2f, 0f, 30f, 0f, hex(0xFF1B5E20), 1.2f)
            c.restore()
        }
        for (c2 in 0 until 3) {
            val bx = w * (0.22f + c2 * 0.16f)
            val by = h * (0.34f + c2 * 0.035f) + sway * (0.3f + c2 * 0.2f)
            for (b in 0 until 4) {
                val ripe = (sin((time + c2 * 0.2f + b * 0.1f) * 2 * PI) * 0.5 + 0.5).toFloat()
                dot(c, bx + (b % 2) * 9f - 4f, by + (b / 2) * 9f + 6f, 5f, lerp(hex(0xFF7CB342), hex(0xFFD32F2F), ripe))
                dot(c, bx + (b % 2) * 9f - 6f, by + (b / 2) * 9f + 4f, 1.4f, a(WHITE, 0.5f))
            }
        }
        val ft = (time * 0.8f) % 1f
        c.save(); c.translate(w * 0.5f + sin(ft * 4 * PI).toFloat() * 24f, h * 0.4f + ft * h * 0.3f); c.rotate(rad2deg(ft * 6.0))
        reset(); p.color = a(st.primary, 0.7f * (1f - ft)); r.set(-9f, -4f, 9f, 4f); c.drawOval(r, p)
        c.restore()
        glow(c, w * 0.4f, h * 0.38f, w * 0.24f, a(st.secondary, 0.14f), 0)
    }
}
