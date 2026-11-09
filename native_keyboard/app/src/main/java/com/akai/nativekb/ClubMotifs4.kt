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

/** The European club motifs, ported from the Flutter app. */
object ClubMotifs4 {

    fun paint(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle, name: String): Boolean {
        when (name) {
            "cannon" -> cannon(c, w, h, time)
            "devil" -> devil(c, w, h, time, st)
            "crown" -> crown(c, w, h, time, st)
            "stripes" -> stripes(c, w, h, time, st)
            "serpent" -> serpent(c, w, h, time, st)
            "clouds" -> clouds(c, w, h, time, st)
            "wings" -> wings(c, w, h, time, st)
            "rays" -> rays(c, w, h, time, st)
            "eiffel" -> eiffel(c, w, h, time, st)
            "diamonds" -> diamonds(c, w, h, time, st)
            "wall" -> wall(c, w, h, time, st)
            "bull" -> bull(c, w, h, time, st)
            else -> return false
        }
        return true
    }

    private fun blurCircle(c: Canvas, x: Float, y: Float, rad: Float, color: Int, blur: Float) {
        reset(); p.color = color; p.maskFilter = BlurMaskFilter(blur, BlurMaskFilter.Blur.NORMAL)
        c.drawCircle(x, y, rad, p); reset()
    }

    // Arsenal: a cannon that fires, with recoil, muzzle flash, embers and smoke.
    private fun cannon(c: Canvas, w: Float, h: Float, time: Float) {
        val cycle = (time * 10) % 1f
        val angle = -0.32
        val dx = cos(angle).toFloat(); val dy = sin(angle).toFloat()
        val recoil = if (cycle < 0.12f) (-sin(cycle / 0.12f * PI) * 12.0).toFloat() else 0f
        val bx = w * 0.20f + dx * recoil; val by = h * 0.56f + dy * recoil
        val barrelLen = w * 0.22f

        val wx = w * 0.245f; val wy = h * 0.56f + 22f
        reset(); p.style = Paint.Style.STROKE; p.strokeWidth = 6f; p.color = hex(0xFF3B2B18); c.drawCircle(wx, wy, 20f, p); reset()
        for (i in 0 until 4) {
            val ang = i * PI / 4 + recoil * 0.01
            line(c, wx - cos(ang).toFloat() * 18f, wy - sin(ang).toFloat() * 18f, wx + cos(ang).toFloat() * 18f, wy + sin(ang).toFloat() * 18f, hex(0xFF4E3A22), 3.5f)
        }
        dot(c, wx, wy, 5f, hex(0xFF241708))

        c.save(); c.translate(bx, by); c.rotate(rad2deg(angle))
        reset()
        p.shader = LinearGradient(0f, -12f, 0f, 12f, intArrayOf(hex(0xFF80838D), hex(0xFF34363E), hex(0xFF0E0F13)), floatArrayOf(0f, 0.45f, 1f), Shader.TileMode.CLAMP)
        r.set(-8f, -12f, -8f + barrelLen, 12f); c.drawRoundRect(r, 11f, 11f, p); reset()
        reset(); p.color = hex(0xFF14151A)
        c.drawRect(barrelLen * 0.30f, -13f, barrelLen * 0.30f + 5f, 13f, p)
        c.drawRect(barrelLen * 0.62f, -13f, barrelLen * 0.62f + 5f, 13f, p)
        p.color = hex(0xFF1C1D24); r.set(barrelLen - 14f, -14f, barrelLen - 6f, 14f); c.drawRoundRect(r, 3f, 3f, p)
        reset()
        p.shader = RadialGradient(-10f, 0f, 14f, hex(0xFF5C5F68), hex(0xFF17181D), Shader.TileMode.CLAMP)
        c.drawCircle(-10f, 0f, 14f, p); reset()
        c.restore()

        val mx = bx + dx * (barrelLen - 10f); val my = by + dy * (barrelLen - 10f)
        if (cycle < 0.20f) {
            val ft = cycle / 0.20f
            val punch = 1f - ft
            reset(); p.xfermode = addMode
            p.shader = RadialGradient(mx, my, 34f + ft * 40f,
                intArrayOf(a(WHITE, 0.95f * punch), a(hex(0xFFFFD54F), 0.75f * punch), a(hex(0xFFFF6D00), 0.35f * punch), 0),
                floatArrayOf(0f, 0.3f, 0.6f, 1f), Shader.TileMode.CLAMP)
            c.drawCircle(mx, my, 34f + ft * 40f, p); reset()
            for (i in 0 until 5) {
                val sa = angle + (i - 2) * 0.22
                val sdx = cos(sa).toFloat(); val sdy = sin(sa).toFloat()
                val len = (26f + ft * 60f) * (if (i == 2) 1.5f else 1f)
                val px = -sdy * (3f * (1f - ft)); val py = sdx * (3f * (1f - ft))
                path.reset(); path.moveTo(mx + px, my + py); path.lineTo(mx + sdx * len, my + sdy * len); path.lineTo(mx - px, my - py); path.close()
                reset(); p.xfermode = addMode; p.color = a(hex(0xFFFFECB3), 0.8f * punch); c.drawPath(path, p); reset()
            }
            val rand = Random(3)
            for (i in 0 until 14) {
                val ea = angle + (rand.nextDouble() - 0.5) * 0.5
                val dist = (30f + rand.nextDouble().toFloat() * 110f) * ft
                val rr = ((4.5f - ft * 3.5f) * (0.6f + rand.nextDouble().toFloat() * 0.8f)).coerceIn(0.5f, 5f)
                reset(); p.xfermode = addMode
                p.color = a(lerp(hex(0xFFFFE082), hex(0xFFFF3D00), rand.nextDouble().toFloat()), (1f - ft) * 0.9f)
                c.drawCircle(mx + cos(ea).toFloat() * dist, my + sin(ea).toFloat() * dist, rr, p); reset()
            }
        }
        val smokeRand = Random(11)
        for (i in 0 until 9) {
            val st0 = i * 0.055f + 0.02f
            val t = cycle - st0
            if (t < 0f || t > 0.75f) continue
            val n = t / 0.75f
            val drift = smokeRand.nextDouble().toFloat() - 0.5f
            val px = mx + dx * (14f + n * 95f) + drift * 26f * n + sin((time * 6 + i) * PI).toFloat() * 4f
            val py = my + dy * (14f + n * 95f) - n * 60f - i * 2f
            val rr = 7f + n * 30f + smokeRand.nextDouble().toFloat() * 4f
            val gray = ((0.55 + smokeRand.nextDouble() * 0.25) * 255).toInt()
            blurCircle(c, px, py, rr, android.graphics.Color.argb(((0.30f * (1f - n)).coerceIn(0f, 1f) * 255).toInt(), gray, gray, gray), 8f)
        }
    }

    // Man United / Milan: flames and a trident.
    private fun devil(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        for (i in 0 until 9) {
            val fx = w * (0.06f + i * 0.11f)
            val flick = (sin((time * 8 + i * 0.7) * PI) * 0.5 + 0.5).toFloat()
            val fh = h * (0.10f + 0.09f * flick)
            val baseY = h * 0.66f
            path.reset(); path.moveTo(fx - 12f, baseY)
            path.quadTo(fx - 10f, baseY - fh * 0.5f, fx + sin(time * 10 + i).toFloat() * 6f, baseY - fh)
            path.quadTo(fx + 10f, baseY - fh * 0.5f, fx + 12f, baseY); path.close()
            reset()
            p.shader = LinearGradient(fx, baseY, fx, baseY - fh, intArrayOf(a(st.primary, 0.85f), a(hex(0xFFFF9800), 0.75f), a(hex(0xFFFFE082), 0.5f)), null, Shader.TileMode.CLAMP)
            p.maskFilter = BlurMaskFilter(2f, BlurMaskFilter.Blur.NORMAL)
            c.drawPath(path, p); reset()
        }
        val tx = w * 0.5f; val ty = h * 0.30f + sin(time * 2 * PI).toFloat() * 6f
        val col = a(st.secondary, 0.85f)
        line(c, tx, ty + h * 0.05f, tx, ty + h * 0.30f, col, 5f, round = true)
        for (pp in -1..1) {
            val px = tx + pp * 16f
            line(c, px, ty + h * 0.10f, px, ty + h * 0.02f, col, 5f, round = true)
            path.reset(); path.moveTo(px - 5f, ty + h * 0.03f); path.lineTo(px, ty - 6f); path.lineTo(px + 5f, ty + h * 0.03f); path.close()
            fillPath(c, path, a(st.secondary, 0.9f))
        }
        line(c, tx - 16f, ty + h * 0.10f, tx + 16f, ty + h * 0.10f, col, 5f, round = true)
        glow(c, tx, ty + h * 0.12f, w * 0.22f, a(st.primary, 0.25f), 0)
    }

    // Real Madrid / Monaco: a golden crown with orbiting sparkles.
    private fun crown(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cx = w * 0.5f; val cy = h * 0.34f + sin(time * 2 * PI).toFloat() * 8f
        val gold = hex(0xFFFEBE10)
        glow(c, cx, cy, w * 0.26f, a(gold, 0.30f), 0)
        val cw = w * 0.24f; val ch = h * 0.075f
        path.reset()
        path.moveTo(cx - cw / 2, cy + ch / 2); path.lineTo(cx - cw / 2, cy - ch * 0.2f); path.lineTo(cx - cw * 0.30f, cy + ch * 0.05f)
        path.lineTo(cx - cw * 0.12f, cy - ch * 0.75f); path.lineTo(cx, cy - ch * 0.1f); path.lineTo(cx + cw * 0.12f, cy - ch * 0.75f)
        path.lineTo(cx + cw * 0.30f, cy + ch * 0.05f); path.lineTo(cx + cw / 2, cy - ch * 0.2f); path.lineTo(cx + cw / 2, cy + ch / 2); path.close()
        reset()
        p.shader = LinearGradient(cx, cy - ch, cx, cy + ch * 0.6f, intArrayOf(hex(0xFFFFE082), gold, hex(0xFFB8860B)), null, Shader.TileMode.CLAMP)
        c.drawPath(path, p); reset()
        val jewel = if (st.primary == hex(0xFFF5F5F5)) hex(0xFF7B1FA2) else st.primary
        for (d in floatArrayOf(-cw * 0.30f, 0f, cw * 0.30f)) dot(c, cx + d, cy + ch * 0.15f, 3.4f, jewel)
        for (d in floatArrayOf(-cw * 0.12f, cw * 0.12f, -cw / 2, cw / 2)) dot(c, cx + d, cy - ch * 0.72f, 2.6f, hex(0xFFFFF8E1))
        val rand = Random(5)
        for (i in 0 until 14) {
            val ang = rand.nextDouble() * 2 * PI + time * 2 * PI * 0.5
            val rr = w * (0.14f + rand.nextDouble().toFloat() * 0.20f)
            val px = cx + cos(ang).toFloat() * rr; val py = cy + sin(ang).toFloat() * rr * 0.6f
            val tw = (sin((time * 5 + i) * 2 * PI) * 0.5 + 0.5).toFloat()
            line(c, px - 3.5f * tw, py, px + 3.5f * tw, py, a(WHITE, 0.7f * tw), 1.2f)
            line(c, px, py - 3.5f * tw, px, py + 3.5f * tw, a(WHITE, 0.7f * tw), 1.2f)
        }
    }

    // Barcelona / Juventus: kit stripes with a passing shine and a star.
    private fun stripes(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val top = h * 0.16f; val bottom = h * 0.72f
        val n = 7
        for (i in 0 until n) {
            reset(); p.color = a(if (i % 2 == 0) st.primary else st.secondary, 0.35f)
            c.drawRect(w * i / n, top, w * i / n + w / n, bottom, p)
        }
        val sx = ((time * 2) % 1f) * (w * 1.6f) - w * 0.3f
        reset()
        p.shader = LinearGradient(sx, 0f, sx + w * 0.28f, 0f, intArrayOf(0, a(WHITE, 0.10f), 0), null, Shader.TileMode.CLAMP)
        c.drawRect(0f, top, w, bottom, p); reset()
        val cx = w * 0.5f; val cy = h * 0.28f
        val pulse = (0.8 + sin(time * 4 * PI) * 0.2).toFloat()
        path.reset()
        for (i in 0 until 10) {
            val rr = (if (i % 2 == 0) 16f else 7f) * pulse
            val ang = -PI / 2 + i * PI / 5
            val px = cx + cos(ang).toFloat() * rr; val py = cy + sin(ang).toFloat() * rr
            if (i == 0) path.moveTo(px, py) else path.lineTo(px, py)
        }
        path.close()
        reset(); p.color = a(hex(0xFFFFD700), 0.9f); p.maskFilter = BlurMaskFilter(3f, BlurMaskFilter.Blur.SOLID)
        c.drawPath(path, p); reset()
    }

    // Inter: a serpent gliding across the screen.
    private fun serpent(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val phase = time * 2 * PI
        val headX = w * (((time * 2) % 1f) * 1.4f - 0.2f)
        fun bodyX(s: Float) = headX - s * w * 0.5f
        fun bodyY(s: Float) = h * 0.40f + (sin(bodyX(s) / w * 4 * PI + phase) * h * 0.06).toFloat()
        for (i in 24 downTo 0) {
            val s = i / 24f
            val rr = 12f * (1f - s * 0.75f)
            dot(c, bodyX(s), bodyY(s), rr, a(lerp(st.primary, st.secondary, s * 0.7f), 0.75f))
            if (i % 4 == 0) dot(c, bodyX(s), bodyY(s), rr * 0.55f, a(WHITE, 0.12f))
        }
        val hx = bodyX(0f); val hy = bodyY(0f)
        dot(c, hx, hy, 13f, st.primary)
        dot(c, hx + 4f, hy - 4f, 2.4f, hex(0xFFFFD700))
        if (sin(time * 12 * PI) > 0.4) {
            val tongue = hex(0xFFFF5252)
            line(c, hx + 12f, hy, hx + 24f, hy - 3f, tongue, 2f)
            line(c, hx + 24f, hy - 3f, hx + 29f, hy - 7f, tongue, 2f)
            line(c, hx + 24f, hy - 3f, hx + 29f, hy + 1f, tongue, 2f)
        }
    }

    // Man City: drifting clouds and a golden ship.
    private fun clouds(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        reset()
        p.shader = LinearGradient(w / 2f, 0f, w / 2f, h * 0.7f, a(st.primary, 0.30f), 0, Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h * 0.7f, p); reset()
        for (i in 0 until 4) {
            val cx = (((time * 0.5f + i * 0.27f) % 1.2f) - 0.1f) * w
            val cy = h * (0.16f + i * 0.10f)
            reset(); p.color = a(WHITE, 0.20f); p.maskFilter = BlurMaskFilter(12f, BlurMaskFilter.Blur.NORMAL)
            r.set(cx - w * 0.17f, cy - h * 0.03f, cx + w * 0.17f, cy + h * 0.03f); c.drawOval(r, p)
            r.set(cx + w * 0.07f - w * 0.1f, cy - h * 0.02f - h * 0.025f, cx + w * 0.07f + w * 0.1f, cy - h * 0.02f + h * 0.025f); c.drawOval(r, p)
            reset()
        }
        val sx = w * 0.5f; val sy = h * 0.5f + sin(time * 4 * PI).toFloat() * 4f
        path.reset(); path.moveTo(sx - 34f, sy); path.quadTo(sx, sy + 22f, sx + 34f, sy); path.lineTo(sx + 26f, sy - 4f); path.lineTo(sx - 26f, sy - 4f); path.close()
        fillPath(c, path, a(hex(0xFFFFD700), 0.85f))
        line(c, sx, sy - 4f, sx, sy - 40f, hex(0xFFFFD700), 3f)
        path.reset(); path.moveTo(sx + 2f, sy - 38f); path.quadTo(sx + 26f + sin(time * 6 * PI).toFloat() * 3f, sy - 24f, sx + 2f, sy - 8f); path.close()
        fillPath(c, path, a(WHITE, 0.8f))
    }

    // Liverpool: flapping wings and a flame (the Liver bird).
    private fun wings(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cx = w * 0.5f; val cy = h * 0.38f
        val flap = sin(time * 6 * PI) * 0.18
        for (side in intArrayOf(-1, 1)) {
            c.save(); c.translate(cx, cy); c.rotate(rad2deg(flap * side))
            path.reset(); path.moveTo(0f, 0f)
            for (f in 0 until 4) {
                val span = w * (0.30f - f * 0.05f) * side
                val lift = -h * (0.10f + f * 0.035f)
                path.quadTo(span * 0.5f, lift * 1.6f, span, lift)
                path.quadTo(span * 0.55f, lift * 0.55f, 0f, 0f)
            }
            reset(); p.color = a(st.primary, 0.65f); p.maskFilter = BlurMaskFilter(2f, BlurMaskFilter.Blur.NORMAL)
            c.drawPath(path, p); reset()
            c.restore()
        }
        oval(c, cx, cy + 6f, 22f, 34f, a(st.primary, 0.9f))
        dot(c, cx, cy - 14f, 8f, st.primary)
        val fx = cx; val fy = cy - h * 0.16f
        val flick = (sin(time * 10 * PI) * 3).toFloat()
        path.reset(); path.moveTo(fx - 8f, fy)
        path.quadTo(fx - 6f + flick, fy - 18f, fx, fy - 26f - abs(flick))
        path.quadTo(fx + 6f + flick, fy - 14f, fx + 8f, fy); path.close()
        reset()
        p.shader = LinearGradient(fx, fy, fx, fy - 28f, intArrayOf(a(st.secondary, 0.9f), a(hex(0xFFFFC107), 0.8f), a(WHITE, 0.6f)), null, Shader.TileMode.CLAMP)
        p.maskFilter = BlurMaskFilter(2f, BlurMaskFilter.Blur.NORMAL)
        c.drawPath(path, p); reset()
    }

    // Chelsea: golden rays around a sun.
    private fun rays(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cx = w * 0.5f; val cy = h * 0.36f
        val rot = time * 2 * PI * 0.4
        for (i in 0 until 10) {
            val ang = rot + i * PI / 5
            path.reset(); path.moveTo(cx, cy)
            path.lineTo((cx + cos(ang) * w * 0.6).toFloat(), (cy + sin(ang) * w * 0.6).toFloat())
            path.lineTo((cx + cos(ang + 0.28) * w * 0.6).toFloat(), (cy + sin(ang + 0.28) * w * 0.6).toFloat()); path.close()
            reset(); p.xfermode = addMode
            p.shader = RadialGradient(cx, cy, w * 0.5f, a(if (i % 2 == 0) hex(0xFFFFC107) else st.primary, 0.20f), 0, Shader.TileMode.CLAMP)
            c.drawPath(path, p); reset()
        }
        reset()
        p.shader = RadialGradient(cx, cy, 18f, intArrayOf(hex(0xFFFFE082), hex(0xFFFFC107), st.primary), null, Shader.TileMode.CLAMP)
        c.drawCircle(cx, cy, 18f, p); reset()
        reset(); p.style = Paint.Style.STROKE; p.strokeWidth = 2f; p.color = a(hex(0xFFFFC107), 0.5f)
        c.drawCircle(cx, cy, 24f + sin(time * 4 * PI).toFloat() * 3f, p); reset()
    }

    // PSG: the Eiffel Tower with a sweeping beacon and city lights.
    private fun eiffel(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cx = w * 0.5f
        val baseY = h * 0.70f; val topY = h * 0.16f
        val tower = a(hex(0xFF0A1B33), 0.95f)
        path.reset()
        path.moveTo(cx - w * 0.16f, baseY); path.quadTo(cx - w * 0.05f, h * 0.40f, cx - 6f, topY)
        path.moveTo(cx + w * 0.16f, baseY); path.quadTo(cx + w * 0.05f, h * 0.40f, cx + 6f, topY)
        strokePath(c, path, tower, 3f)
        for (fy in floatArrayOf(0.62f, 0.50f, 0.38f, 0.27f)) {
            val y = h * fy
            val half = (baseY - y) / (baseY - topY)
            val hw = w * 0.155f * half + 8f
            line(c, cx - hw, y, cx + hw, y, tower, 3f)
        }
        line(c, cx, topY, cx, topY - 14f, tower, 3f)
        val beamA = time * 2 * PI
        path.reset(); path.moveTo(cx, topY - 10f)
        path.lineTo((cx + cos(beamA) * w * 0.7).toFloat(), (topY - 10f + sin(beamA) * w * 0.20).toFloat())
        path.lineTo((cx + cos(beamA + 0.10) * w * 0.7).toFloat(), (topY - 10f + sin(beamA + 0.10) * w * 0.20).toFloat()); path.close()
        reset(); p.xfermode = addMode
        p.shader = LinearGradient(cx - w * 0.5f, 0f, cx + w * 0.5f, 0f, a(WHITE, 0.35f), 0, Shader.TileMode.CLAMP)
        c.drawPath(path, p); reset()
        val rand = Random(9)
        for (i in 0 until 26) {
            val lx = rand.nextDouble().toFloat() * w
            val ly = h * 0.64f + rand.nextDouble().toFloat() * h * 0.10f
            val tw = (sin((time * 4 + rand.nextDouble()) * 2 * PI) * 0.5 + 0.5).toFloat()
            dot(c, lx, ly, 1.3f, a(if (i % 4 == 0) st.secondary else hex(0xFFFFE082), 0.4f + 0.4f * tw))
        }
    }

    // Bayern: a scrolling lattice of diamonds.
    private fun diamonds(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val d = w / 7f
        val scroll = time * d * 4
        var y = -d * 2
        while (y < h) {
            var x = -d * 2
            while (x < w + d) {
                val ox = x + (scroll % (d * 2)) * 0.5f
                val oy = y + (scroll % (d * 2)) * 0.5f
                path.reset()
                path.moveTo(ox, oy - d * 0.7f); path.lineTo(ox + d * 0.5f, oy); path.lineTo(ox, oy + d * 0.7f); path.lineTo(ox - d * 0.5f, oy); path.close()
                strokePath(c, path, a(st.secondary, 0.25f), 2.5f)
                x += d
            }
            y += d
        }
        val pulse = (sin(time * 4 * PI) * 0.5 + 0.5).toFloat()
        reset(); p.xfermode = addMode
        p.shader = RadialGradient(w * 0.5f, h * 0.40f, w * 0.25f, a(st.primary, 0.45f), 0, Shader.TileMode.CLAMP)
        c.drawCircle(w * 0.5f, h * 0.40f, w * (0.18f + 0.05f * pulse), p); reset()
    }

    // Dortmund: the yellow wall, a crowd wave rolling through it.
    private fun wall(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val cols = 12; val rows = 5
        val bw = w / cols; val bh = h * 0.36f / rows
        val top = h * 0.20f
        for (rr in 0 until rows) for (cc in 0 until cols) {
            val wave = sin((time * 6 + cc * 0.5 + rr * 0.3) * PI).toFloat()
            val o = 0.20f + 0.30f * (wave * 0.5f + 0.5f)
            val jump = if (wave > 0.75f) -3f else 0f
            reset(); p.color = a(st.primary, o)
            r.set(cc * bw + 2f, top + rr * bh + 2f + jump, cc * bw + 2f + bw - 4f, top + rr * bh + 2f + jump + bh - 4f)
            c.drawRoundRect(r, 3f, 3f, p)
        }
        path.reset(); path.moveTo(-10f, top + h * 0.18f)
        var x = -10f
        while (x <= w + 10f) { path.lineTo(x, top + h * 0.18f + sin(x / w * 3 * PI + time * 4 * PI).toFloat() * 10f); x += w / 12f }
        path.lineTo(w + 10f, top + h * 0.22f)
        x = w + 10f
        while (x >= -10f) { path.lineTo(x, top + h * 0.22f + sin(x / w * 3 * PI + time * 4 * PI + 0.4).toFloat() * 10f); x -= w / 12f }
        path.close()
        fillPath(c, path, a(st.secondary, 0.75f))
    }

    // Leipzig: a charging bull.
    private fun bull(c: Canvas, w: Float, h: Float, time: Float, st: TeamStyle) {
        val t = (time * 1.5f) % 1f
        val bx = w * (t * 1.4f - 0.2f)
        val by = h * 0.46f + abs(sin(t * 6 * PI)).toFloat() * -6f
        val gallop = sin(time * 10 * PI).toFloat()
        val dark = hex(0xFF15100E)
        for (i in 0 until 3) {
            line(c, bx - 40f - i * 16f, by - 8f + i * 8f, bx - 70f - i * 20f, by - 8f + i * 8f, a(st.primary, 0.35f - i * 0.09f), 3f, round = true)
        }
        c.save(); c.translate(bx, by); c.rotate(rad2deg(-0.08))
        oval(c, 0f, 0f, 62f, 30f, dark)
        dot(c, 14f, -14f, 13f, dark)
        oval(c, 34f, -2f, 24f, 18f, dark)
        val horn = hex(0xFFE8E2D6)
        reset(); p.style = Paint.Style.STROKE; p.strokeWidth = 4f; p.strokeCap = Paint.Cap.ROUND; p.color = horn
        r.set(30f, -24f, 50f, -4f); c.drawArc(r, rad2deg(PI * 0.9), rad2deg(-PI * 0.8), false, p)
        r.set(22f, -24f, 46f, 0f); c.drawArc(r, rad2deg(PI * 0.95), rad2deg(-PI * 0.7), false, p)
        reset()
        blurCircle(c, 38f, -4f, 2.2f, st.primary, 2f)
        for (leg in 0 until 4) {
            val phase = gallop * (if (leg % 2 == 0) 10f else -10f)
            val lx = -22f + leg * 14f
            line(c, lx, 10f, lx + phase, 30f, dark, 5f)
        }
        path.reset(); path.moveTo(-30f, -6f); path.quadTo(-44f, -12f + gallop * 6f, -50f, -2f + gallop * 4f)
        strokePath(c, path, dark, 3.5f)
        c.restore()
        val rand = Random(79)
        for (d in 0 until 8) {
            val dt = (time * 3 + d * 0.12f) % 1f
            blurCircle(c, bx - 26f - dt * 46f + rand.nextDouble().toFloat() * 10f, by + 26f - dt * 14f, 4f + dt * 10f, a(hex(0xFF8D7B65), 0.25f * (1f - dt)), 5f)
        }
        reset(); p.xfermode = addMode
        p.shader = RadialGradient(bx + 10f, by - 6f, w * 0.16f, a(st.primary, 0.18f), 0, Shader.TileMode.CLAMP)
        c.drawCircle(bx + 10f, by - 6f, w * 0.16f, p); reset()
    }
}
