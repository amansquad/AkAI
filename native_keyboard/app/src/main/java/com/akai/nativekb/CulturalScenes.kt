package com.akai.nativekb

import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import androidx.core.graphics.ColorUtils
import java.util.Random
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

/**
 * Animated backgrounds of their own for the cultural themes that have no
 * picture and for the faith themes (in the Flutter app they borrow the generic
 * aurora, sun rays or crescent night; these follow the web keyboard's subjects).
 * Each is drawn in its theme's colours. These themes have solid keys, so the
 * scenes use bold shapes that read through the gaps and behind the toolbar.
 *
 * [time] is in scene units of 5 seconds (see KeyboardView); w and h are dp.
 */
object CulturalScenes {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()
    private val rect = RectF()
    private const val TAU = (2 * PI).toFloat()

    private val ids = setOf(
        "eth_flag", "ortho_axum", "ortho_lalibela", "reg_sidama", "reg_gambella", "reg_harari",
        "reg_bgumuz", "adey", "reg_blackgold", "reg_meskel", "reg_timket", "reg_southwest",
        // Faith
        "ortho_cross", "ortho_meskel", "islam_najashi", "islam_harar", "islam_lantern", "ortho_timkat",
    )
    /** True for the themes drawn here. */
    fun has(live: String) = live.lowercase() in ids

    /** Draws the scene for [live] and returns true, or returns false if it is not one of these. */
    fun paint(c: Canvas, w: Float, h: Float, time: Float, live: String): Boolean {
        when (live) {
            "eth_flag" -> ethiopianFlag(c, w, h, time)
            "ortho_axum" -> aksum(c, w, h, time)
            "ortho_lalibela" -> lalibela(c, w, h, time)
            "reg_sidama" -> sidama(c, w, h, time)
            "reg_gambella" -> gambella(c, w, h, time)
            "reg_harari" -> harari(c, w, h, time)
            "reg_bgumuz" -> benishangul(c, w, h, time)
            "adey" -> adeyAbeba(c, w, h, time)
            "reg_blackgold" -> blackGold(c, w, h, time)
            "reg_meskel" -> meskel(c, w, h, time)
            "reg_timket" -> timket(c, w, h, time)
            "reg_southwest" -> southWest(c, w, h, time)
            "ortho_cross" -> orthodoxCross(c, w, h, time)
            "ortho_meskel" -> meskelFire(c, w, h, time)
            "islam_najashi" -> najashi(c, w, h, time)
            "islam_harar" -> hararJegol(c, w, h, time)
            "islam_lantern" -> ramadanLanterns(c, w, h, time)
            "ortho_timkat" -> timkatHoly(c, w, h, time)
            else -> return false
        }
        return true
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    private fun col(argb: Long) = argb.toInt()
    private fun a(color: Int, opacity: Float) = ColorUtils.setAlphaComponent(color, (opacity * 255f).toInt().coerceIn(0, 255))
    private fun reset() { paint.shader = null; paint.style = Paint.Style.FILL; paint.strokeWidth = 1f; paint.strokeCap = Paint.Cap.ROUND; paint.strokeJoin = Paint.Join.ROUND }
    private fun vGrad(c: Canvas, w: Float, top: Int, bottom: Int, y0: Float, y1: Float) {
        reset(); paint.shader = LinearGradient(0f, y0, 0f, y1, top, bottom, Shader.TileMode.CLAMP)
        c.drawRect(0f, y0, w, y1, paint); reset()
    }
    private fun glow(c: Canvas, x: Float, y: Float, r: Float, color: Int) {
        reset(); paint.shader = RadialGradient(x, y, max(r, 0.1f), color, a(color, 0f), Shader.TileMode.CLAMP)
        c.drawCircle(x, y, r, paint); reset()
    }
    private fun dot(c: Canvas, x: Float, y: Float, r: Float, color: Int) { reset(); paint.color = color; c.drawCircle(x, y, r, paint) }
    private fun line(c: Canvas, x0: Float, y0: Float, x1: Float, y1: Float, color: Int, width: Float) {
        reset(); paint.style = Paint.Style.STROKE; paint.color = color; paint.strokeWidth = width; c.drawLine(x0, y0, x1, y1, paint)
    }
    private fun fillPath(c: Canvas, color: Int) { reset(); paint.color = color; c.drawPath(path, paint) }
    private fun strokePath(c: Canvas, color: Int, width: Float) {
        reset(); paint.style = Paint.Style.STROKE; paint.color = color; paint.strokeWidth = width; c.drawPath(path, paint); reset()
    }
    private fun wave(t: Float, speed: Float, offset: Float = 0f) = sin(t * TAU * speed + offset)
    /** 0..1, repeating every 1/[speed] units, offset per item. */
    private fun cycle(t: Float, speed: Float, offset: Float) = ((t * speed + offset) % 1f + 1f) % 1f

    /** A five-pointed star (outline when [width] > 0). */
    private fun star(c: Canvas, cx: Float, cy: Float, r: Float, rot: Float, color: Int, width: Float) {
        path.reset()
        for (i in 0..5) {
            val k = (i * 2) % 5
            val ang = rot - PI.toFloat() / 2 + k * TAU / 5
            val x = cx + r * cos(ang); val y = cy + r * sin(ang)
            if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        strokePath(c, color, width)
    }

    /** Floating motes that rise and twinkle. */
    private fun motes(c: Canvas, w: Float, h: Float, t: Float, n: Int, seed: Long, color: Int, speed: Float, size: Float) {
        val r = Random(seed)
        for (i in 0 until n) {
            val x0 = r.nextFloat() * w
            val life = cycle(t, speed * (0.6f + r.nextFloat() * 0.8f), r.nextFloat())
            val y = h * (1.05f - life * 1.15f)
            val x = x0 + 8f * wave(t, 0.4f, i.toFloat())
            val tw = 0.35f + 0.65f * abs(wave(t, 0.9f + r.nextFloat(), i * 1.7f))
            val fade = min(1f, min(life * 5f, (1f - life) * 4f))
            dot(c, x, y, size * (0.6f + r.nextFloat() * 0.8f), a(color, tw * fade * 0.9f))
        }
    }

    // ── Ethiopian Flag: the tricolour waving, with the emblem ───────────
    private fun ethiopianFlag(c: Canvas, w: Float, h: Float, t: Float) {
        val colors = intArrayOf(col(0xFF078930), col(0xFFFCDD09), col(0xFFDA121A))
        val band = h / 3f
        fun yAt(x: Float, base: Float) = base + 7f * sin(x * 0.025f - t * TAU * 0.5f) + 3f * sin(x * 0.06f - t * TAU * 0.9f)
        for (b in 0 until 3) {
            path.reset()
            val top = b * band; val bottom = (b + 1) * band
            path.moveTo(-2f, if (b == 0) -20f else yAt(-2f, top))
            var x = -2f
            while (x <= w + 8f) { path.lineTo(x, if (b == 0) -20f else yAt(x, top)); x += 8f }
            x = w + 8f
            while (x >= -2f) { path.lineTo(x, if (b == 2) h + 20f else yAt(x, bottom)); x -= 8f }
            path.close()
            fillPath(c, colors[b])
        }
        // Folds: light and shade following the wave.
        var x = 0f
        while (x < w) {
            val s = cos(x * 0.025f - t * TAU * 0.5f)
            reset(); paint.color = if (s > 0) a(0xFFFFFFFF.toInt(), s * 0.10f) else a(0xFF000000.toInt(), -s * 0.18f)
            c.drawRect(x, 0f, x + 6f, h, paint)
            x += 6f
        }
        // The blue disc with the yellow star and rays, riding the wave.
        val cx = w / 2f; val cy = yAt(cx, h / 2f)
        val r = h * 0.2f
        glow(c, cx, cy, r * 1.9f, a(0xFFFFE44D.toInt(), 0.25f + 0.1f * wave(t, 0.7f)))
        dot(c, cx, cy, r, col(0xFF0F47AF))
        val gold = col(0xFFFCDD09)
        val rot = t * TAU * 0.03f
        star(c, cx, cy, r * 0.62f, rot, gold, 2.4f)
        for (i in 0 until 5) {
            val ang = rot - PI.toFloat() / 2 + PI.toFloat() / 5 + i * TAU / 5
            line(c, cx + r * 0.32f * cos(ang), cy + r * 0.32f * sin(ang), cx + r * 0.86f * cos(ang), cy + r * 0.86f * sin(ang), gold, 2f)
        }
    }

    // ── Aksum Empire: the great stele against a turning golden sun ───────
    private fun aksum(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF120B03), col(0xFF4A3010), 0f, h)
        val sx = w * 0.5f; val sy = h * 0.32f
        glow(c, sx, sy, h * (0.75f + 0.05f * wave(t, 0.25f)), a(col(0xFFD4AF37), 0.45f))
        // Rays turning slowly behind the stele.
        val rot = t * TAU * 0.025f
        for (i in 0 until 14) {
            val a0 = rot + i * TAU / 14
            path.reset(); path.moveTo(sx, sy)
            path.lineTo(sx + w * cos(a0 - 0.05f), sy + w * sin(a0 - 0.05f))
            path.lineTo(sx + w * cos(a0 + 0.05f), sy + w * sin(a0 + 0.05f)); path.close()
            fillPath(c, a(col(0xFFF0D060), 0.07f))
        }
        // Distant hills.
        path.reset(); path.moveTo(0f, h)
        var x = 0f
        while (x <= w) { path.lineTo(x, h * 0.78f + 10f * sin(x * 0.018f) + 6f * sin(x * 0.05f)); x += 10f }
        path.lineTo(w, h); path.close(); fillPath(c, col(0xFF1C1206))
        // The stele: tall, round-topped, carved with storeys of false windows.
        val sw = max(26f, w * 0.085f); val top = h * 0.06f; val base = h * 0.98f
        path.reset()
        path.moveTo(sx - sw / 2, base); path.lineTo(sx - sw / 2, top + sw / 2)
        rect.set(sx - sw / 2, top, sx + sw / 2, top + sw); path.arcTo(rect, 180f, 180f)
        path.lineTo(sx + sw / 2, base); path.close()
        fillPath(c, col(0xFF2A1C0A))
        strokePath(c, a(col(0xFFD4AF37), 0.55f + 0.2f * wave(t, 0.3f)), 1.6f)
        var y = top + sw * 1.4f
        while (y < base - 14f) {
            line(c, sx - sw / 2 + 2f, y, sx + sw / 2 - 2f, y, a(col(0xFFD4AF37), 0.35f), 1f)
            reset(); paint.color = col(0xFF140D04)
            c.drawRect(sx - sw * 0.3f, y + 4f, sx - sw * 0.06f, y + 12f, paint)
            c.drawRect(sx + sw * 0.06f, y + 4f, sx + sw * 0.3f, y + 12f, paint)
            y += 22f
        }
        motes(c, w, h, t, 34, 7, col(0xFFF0D060), 0.18f, 1.6f)
    }

    // ── Lalibela Stone: the cross church carved into rock, seen from above ─
    private fun lalibela(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF3E2C22), col(0xFF1A120E), 0f, h)
        // Rock strata.
        val r = Random(5)
        for (i in 0 until 18) {
            val y = r.nextFloat() * h
            line(c, 0f, y, w, y + (r.nextFloat() - 0.5f) * 30f, a(col(0xFF000000), 0.18f), 1f + r.nextFloat() * 2f)
        }
        val cx = w / 2f; val cy = h / 2f
        val s = min(w, h) * 0.42f
        // The trench around the church.
        rect.set(cx - s * 1.25f, cy - s * 1.05f, cx + s * 1.25f, cy + s * 1.05f)
        reset(); paint.color = col(0xFF120C08); c.drawRoundRect(rect, 18f, 18f, paint)
        // Three nested crosses, like the roof of Bete Giyorgis.
        fun cross(k: Float, color: Int, fillIt: Boolean, width: Float) {
            val arm = s * k; val half = arm * 0.34f
            path.reset()
            path.moveTo(cx - half, cy - arm); path.lineTo(cx + half, cy - arm); path.lineTo(cx + half, cy - half)
            path.lineTo(cx + arm, cy - half); path.lineTo(cx + arm, cy + half); path.lineTo(cx + half, cy + half)
            path.lineTo(cx + half, cy + arm); path.lineTo(cx - half, cy + arm); path.lineTo(cx - half, cy + half)
            path.lineTo(cx - arm, cy + half); path.lineTo(cx - arm, cy - half); path.lineTo(cx - half, cy - half); path.close()
            if (fillIt) fillPath(c, color) else strokePath(c, color, width)
        }
        cross(0.95f, col(0xFFBF8040), true, 0f)
        cross(0.95f, a(col(0xFF000000), 0.35f), false, 3f)
        cross(0.68f, a(col(0xFF5A3A20), 0.9f), false, 2.5f)
        cross(0.42f, a(col(0xFF5A3A20), 0.9f), false, 2.5f)
        // Sunlight sweeping over the rock through the day.
        val sweep = cycle(t, 0.12f, 0f) * (w + h) * 1.6f - h
        reset()
        paint.shader = LinearGradient(sweep, 0f, sweep + 90f, h * 0.6f,
            intArrayOf(0, a(col(0xFFFFE0B0), 0.22f), 0), null, Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, paint); reset()
        motes(c, w, h, t, 18, 11, col(0xFFFFB050), 0.25f, 1.5f)
    }

    // ── Sidama: a jebena on the coals, steam rising, coffee cherries ─────
    private fun sidama(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF064E3B), col(0xFF021F17), 0f, h)
        // Coffee cherries and beans drifting down.
        val r = Random(21)
        for (i in 0 until 22) {
            val x = r.nextFloat() * w + 10f * wave(t, 0.3f, i.toFloat())
            val y = cycle(t, 0.08f + r.nextFloat() * 0.06f, r.nextFloat()) * (h + 40f) - 20f
            if (i % 3 == 0) {
                c.save(); c.rotate(i * 37f + t * 40f, x, y)
                rect.set(x - 5f, y - 3.5f, x + 5f, y + 3.5f)
                reset(); paint.color = col(0xFF4A2511); c.drawOval(rect, paint)
                line(c, x - 4f, y, x + 4f, y, col(0xFF2A1408), 1f)
                c.restore()
            } else {
                dot(c, x, y, 4.5f, col(0xFFB91C1C)); dot(c, x - 1.4f, y - 1.4f, 1.4f, a(0xFFFFFFFF.toInt(), 0.5f))
            }
        }
        // The jebena: round clay body, long neck, spout and handle.
        // Large and high enough to show between the keys, steam and all.
        val bx = w * 0.42f; val by = h * 0.6f; val br = min(w, h) * 0.24f
        glow(c, bx, by + br, br * 2.2f, a(col(0xFFFF7A1A), 0.35f + 0.1f * wave(t, 1.3f)))
        val clay = col(0xFF2A120A)
        dot(c, bx, by, br, clay)
        reset(); paint.color = clay
        c.drawRect(bx - br * 0.18f, by - br * 1.9f, bx + br * 0.18f, by - br * 0.6f, paint)
        line(c, bx + br * 0.85f, by - br * 0.1f, bx + br * 1.55f, by - br * 0.9f, clay, br * 0.16f)
        path.reset(); path.moveTo(bx - br * 0.18f, by - br * 1.5f)
        path.cubicTo(bx - br * 1.1f, by - br * 1.5f, bx - br * 1.3f, by - br * 0.5f, bx - br * 0.85f, by - br * 0.2f)
        strokePath(c, clay, br * 0.12f)
        dot(c, bx - br * 0.35f, by - br * 0.35f, br * 0.22f, a(col(0xFFFFB080), 0.15f))
        // Steam from the spout, curling up.
        for (k in 0 until 3) {
            val life = cycle(t, 0.35f, k / 3f)
            path.reset()
            val x0 = bx + br * 1.55f; val y0 = by - br * 0.95f
            path.moveTo(x0, y0)
            for (j in 1..10) {
                val p = j / 10f
                path.lineTo(x0 + 10f * sin(p * 6f + t * TAU * 0.5f + k) + p * 12f, y0 - p * h * 0.55f * (0.4f + life))
            }
            strokePath(c, a(0xFFFFFFFF.toInt(), 0.28f * (1f - life)), 3f)
        }
    }

    // ── Gambella: the river, reeds swaying, a canoe gliding by ──────────
    private fun gambella(c: Canvas, w: Float, h: Float, t: Float) {
        val horizon = h * 0.42f
        vGrad(c, w, col(0xFF0B3D2E), col(0xFF1F7A55), 0f, horizon)
        glow(c, w * 0.78f, horizon * 0.55f, h * 0.35f, a(col(0xFFFFE9A8), 0.35f))
        vGrad(c, w, col(0xFF0044CC), col(0xFF001A55), horizon, h)
        // Ripples drifting downstream.
        val r = Random(3)
        for (i in 0 until 26) {
            val y = horizon + 6f + r.nextFloat() * (h - horizon)
            val len = 14f + r.nextFloat() * 40f
            val x = (r.nextFloat() * w + t * 22f * (0.6f + (y - horizon) / h)) % (w + len) - len
            line(c, x, y, x + len, y, a(0xFFFFFFFF.toInt(), 0.12f + 0.1f * abs(wave(t, 0.5f, i.toFloat()))), 1.4f)
        }
        // The canoe and its paddler, crossing every 20 seconds.
        val cxp = cycle(t, 0.25f, 0f) * (w + 160f) - 80f
        val cy = horizon + (h - horizon) * 0.35f + 2f * wave(t, 0.8f)
        path.reset()
        path.moveTo(cxp - 44f, cy - 4f); path.quadTo(cxp, cy + 12f, cxp + 44f, cy - 4f)
        path.lineTo(cxp + 36f, cy + 2f); path.quadTo(cxp, cy + 9f, cxp - 36f, cy + 2f); path.close()
        fillPath(c, col(0xFF1B0E06))
        dot(c, cxp + 4f, cy - 16f, 3.6f, col(0xFF1B0E06))
        line(c, cxp + 4f, cy - 13f, cxp + 2f, cy - 2f, col(0xFF1B0E06), 3f)
        val stroke = wave(t, 0.9f)
        line(c, cxp + 10f - stroke * 8f, cy - 18f, cxp - 6f - stroke * 14f, cy + 8f, col(0xFF3A2416), 1.8f)
        // Reflection of the canoe.
        line(c, cxp - 34f, cy + 8f, cxp + 34f, cy + 8f, a(col(0xFF000000), 0.25f), 3f)
        // Reeds at both banks, swaying.
        val rr = Random(9)
        for (i in 0 until 26) {
            val left = i < 13
            val bx = if (left) rr.nextFloat() * w * 0.16f else w - rr.nextFloat() * w * 0.16f
            val tall = h * (0.25f + rr.nextFloat() * 0.3f)
            val sway = 9f * wave(t, 0.35f, i * 0.6f)
            path.reset(); path.moveTo(bx, h)
            path.quadTo(bx + sway * 0.4f, h - tall * 0.5f, bx + sway, h - tall)
            strokePath(c, col(0xFF0A2E1C), 2.2f)
        }
    }

    // ── Harari: the walled city at dusk, lanterns, and the hyenas' eyes ──
    private fun harari(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF14060A), col(0xFFB45309), 0f, h * 0.7f)
        vGrad(c, w, col(0xFF1A1A1A), col(0xFF0A0A0A), h * 0.7f, h)
        val r = Random(13)
        for (i in 0 until 30) {
            val tw = abs(wave(t, 0.4f + r.nextFloat(), i.toFloat()))
            dot(c, r.nextFloat() * w, r.nextFloat() * h * 0.4f, 0.6f + r.nextFloat(), a(0xFFFFFFFF.toInt(), 0.2f + 0.6f * tw))
        }
        // Houses behind the wall, in the city's colours.
        val houses = intArrayOf(col(0xFF7A1C1C), col(0xFF0E4A2A), col(0xFF8A6A12), col(0xFF2A2A2A))
        var x = 0f; var k = 0
        while (x < w) {
            val hw = 30f + r.nextFloat() * 30f; val hh = h * (0.12f + r.nextFloat() * 0.14f)
            reset(); paint.color = houses[k % houses.size]
            c.drawRect(x, h * 0.6f - hh, x + hw, h * 0.62f, paint)
            // Lit windows, flickering.
            val flick = 0.55f + 0.45f * abs(wave(t, 0.6f + r.nextFloat(), k.toFloat()))
            reset(); paint.color = a(col(0xFFFACC15), flick)
            c.drawRect(x + hw * 0.3f, h * 0.6f - hh * 0.7f, x + hw * 0.45f, h * 0.6f - hh * 0.5f, paint)
            x += hw + 4f; k++
        }
        // The Jugol wall with its crenellations and arched gates.
        val wallTop = h * 0.6f
        reset(); paint.color = col(0xFF2B1F14)
        c.drawRect(0f, wallTop, w, h, paint)
        var cx = 0f
        while (cx < w) { c.drawRect(cx, wallTop - 8f, cx + 9f, wallTop, paint); cx += 18f }
        val gates = 4
        for (g in 0 until gates) {
            val gx = w * (g + 0.5f) / gates
            path.reset()
            path.moveTo(gx - 16f, h); path.lineTo(gx - 16f, wallTop + 26f)
            rect.set(gx - 16f, wallTop + 10f, gx + 16f, wallTop + 42f); path.arcTo(rect, 180f, 180f)
            path.lineTo(gx + 16f, h); path.close()
            fillPath(c, col(0xFF050505))
            // Hyena eyes, now and then.
            val blink = wave(t, 0.15f, g * 1.9f)
            if (blink > 0.55f) {
                val o = (blink - 0.55f) / 0.45f
                dot(c, gx - 4f, h * 0.86f, 1.6f, a(col(0xFFFDE047), o))
                dot(c, gx + 4f, h * 0.86f, 1.6f, a(col(0xFFFDE047), o))
            }
        }
        line(c, 0f, wallTop, w, wallTop, a(col(0xFFFACC15), 0.25f), 1f)
        // A moon drifting across the dusk, and lantern sparks rising over the city.
        val mx = cycle(t, 0.05f, 0.2f) * (w + 80f) - 40f
        val my = h * 0.16f + 10f * wave(t, 0.05f)
        glow(c, mx, my, 34f, a(col(0xFFFFF3D6), 0.3f))
        dot(c, mx, my, 11f, col(0xFFFFF3D6))
        dot(c, mx + 5f, my - 3f, 10f, col(0xFF3A160E))
        motes(c, w, h * 0.95f, t, 30, 61, col(0xFFFACC15), 0.22f, 1.6f)
    }

    // ── Benishangul Gumuz: green hills, a river glinting with gold ───────
    private fun benishangul(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF021A00), col(0xFF2E6B1A), 0f, h * 0.6f)
        glow(c, w * 0.2f, h * 0.18f, h * 0.3f, a(col(0xFFFFF4C0), 0.35f))
        val layers = intArrayOf(col(0xFF1C4A12), col(0xFF103A0A), col(0xFF062E00))
        for ((i, color) in layers.withIndex()) {
            val drift = t * (3f + i * 4f)
            path.reset(); path.moveTo(0f, h)
            var x = 0f
            while (x <= w) {
                val xx = x + drift
                path.lineTo(x, h * (0.35f + i * 0.12f) - 26f * sin(xx * 0.012f + i) - 12f * sin(xx * 0.031f + i * 2))
                x += 8f
            }
            path.lineTo(w, h); path.close(); fillPath(c, color)
        }
        // The river along the bottom, with gold flashing in it.
        val ry = h * 0.8f
        vGrad(c, w, col(0xFF0A3A4A), col(0xFF052028), ry, h)
        val r = Random(17)
        for (i in 0 until 40) {
            val x = (r.nextFloat() * w + t * 18f) % w
            val y = ry + 3f + r.nextFloat() * (h - ry - 4f)
            val tw = wave(t, 0.8f + r.nextFloat(), i * 2.3f)
            if (tw > 0.3f) {
                val o = (tw - 0.3f) / 0.7f
                dot(c, x, y, 1.2f + o * 1.4f, a(col(0xFFFFD54A), o))
                line(c, x - 4f * o, y, x + 4f * o, y, a(col(0xFFFFF3B0), o * 0.7f), 0.8f)
            }
        }
    }

    // ── Adey Abeba: the Meskel daisies swaying in a green field ──────────
    private fun adeyAbeba(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF3FA06A), col(0xFF064E3B), 0f, h)
        val r = Random(29)
        // Stems first, then the flowers on top.
        val n = 22
        val xs = FloatArray(n); val ys = FloatArray(n); val sz = FloatArray(n); val sway = FloatArray(n)
        for (i in 0 until n) {
            xs[i] = r.nextFloat() * w
            ys[i] = h * (0.15f + r.nextFloat() * 0.85f)
            sz[i] = 6f + (ys[i] / h) * 12f
            sway[i] = 8f * wave(t, 0.3f, xs[i] * 0.02f)
            line(c, xs[i], h + 4f, xs[i] + sway[i], ys[i], col(0xFF0E5A30), 1.6f)
        }
        val order = (0 until n).sortedBy { ys[it] }
        for (i in order) {
            val fx = xs[i] + sway[i]; val fy = ys[i]; val s = sz[i]
            c.save(); c.rotate(sway[i] * 2f, fx, fy)
            for (p in 0 until 10) {
                c.save(); c.rotate(p * 36f, fx, fy)
                rect.set(fx - s * 0.22f, fy - s, fx + s * 0.22f, fy - s * 0.15f)
                reset(); paint.color = col(0xFFFACC15); c.drawOval(rect, paint)
                c.restore()
            }
            dot(c, fx, fy, s * 0.28f, col(0xFFB45309))
            c.restore()
        }
        // Petals carried on the wind.
        for (i in 0 until 10) {
            val life = cycle(t, 0.12f, i / 10f)
            val x = life * (w + 60f) - 30f
            val y = h * (0.1f + 0.8f * ((i * 0.37f) % 1f)) + 14f * wave(t, 0.5f, i.toFloat())
            c.save(); c.rotate(life * 720f, x, y)
            rect.set(x - 2f, y - 5f, x + 2f, y + 5f)
            reset(); paint.color = a(col(0xFFFDE047), 0.85f); c.drawOval(rect, paint)
            c.restore()
        }
    }

    // ── Black Gold: honeycomb glowing, honey dripping, bees about ────────
    private fun blackGold(c: Canvas, w: Float, h: Float, t: Float) {
        reset(); paint.color = col(0xFF050402); c.drawRect(0f, 0f, w, h, paint)
        val s = 16f
        val dx = s * 1.732f; val dy = s * 1.5f
        var row = 0
        var y = 0f
        while (y < h + s) {
            var x = if (row % 2 == 0) 0f else dx / 2f
            while (x < w + s) {
                // A slow wave of honey light rolls across the comb.
                val lit = 0.5f + 0.5f * sin(x * 0.02f + y * 0.015f - t * TAU * 0.35f)
                path.reset()
                for (k in 0..5) {
                    val ang = PI.toFloat() / 6 + k * TAU / 6
                    val px = x + s * 0.92f * cos(ang); val py = y + s * 0.92f * sin(ang)
                    if (k == 0) path.moveTo(px, py) else path.lineTo(px, py)
                }
                path.close()
                fillPath(c, a(col(0xFFE0A000), 0.08f + 0.32f * lit * lit))
                strokePath(c, a(col(0xFFFACC15), 0.35f), 1.2f)
                x += dx
            }
            y += dy; row++
        }
        // Honey dripping from the top.
        for (i in 0 until 5) {
            val x = w * (0.1f + i * 0.2f)
            val life = cycle(t, 0.2f, i * 0.31f)
            val len = h * 0.45f * life
            line(c, x, 0f, x, len, a(col(0xFFF5B000), 0.85f), 4f)
            dot(c, x, len + 3f, 5f * (0.6f + life * 0.6f), a(col(0xFFFFC52A), 0.95f))
        }
        // Three bees on looping paths.
        for (b in 0 until 3) {
            val bt = t * 0.35f + b * 0.33f
            val bx = w * (0.5f + 0.4f * sin(bt * TAU + b))
            val by = h * (0.45f + 0.3f * sin(bt * TAU * 2 + b * 2))
            val flap = abs(wave(t, 9f, b.toFloat()))
            rect.set(bx - 4f, by - 7f - 4f * flap, bx + 4f, by - 1f); reset(); paint.color = a(0xFFFFFFFF.toInt(), 0.6f); c.drawOval(rect, paint)
            rect.set(bx - 6f, by - 3.5f, bx + 6f, by + 3.5f); reset(); paint.color = col(0xFFFACC15); c.drawOval(rect, paint)
            line(c, bx - 1.5f, by - 3f, bx - 1.5f, by + 3f, col(0xFF111111), 2f)
            line(c, bx + 2.5f, by - 3f, bx + 2.5f, by + 3f, col(0xFF111111), 2f)
        }
    }

    // ── Meskel Festival: the Demera bonfire with its cross ───────────────
    private fun meskel(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF0A0202), col(0xFF450A0A), 0f, h)
        val cx = w / 2f; val base = h * 0.98f; val top = h * 0.22f
        glow(c, cx, h * 0.62f, h * (0.75f + 0.06f * wave(t, 1.6f)), a(col(0xFFFF6A00), 0.45f))
        // The Demera: poles leaning together into a tall cone.
        for (i in -6..6) {
            line(c, cx + i * w * 0.028f, base, cx + i * 2f, top + 10f, col(0xFF2A1206), 3f)
        }
        // The cross at the top, with adey flowers.
        val gold = col(0xFFFACC15)
        line(c, cx, top - 26f, cx, top + 12f, gold, 3f)
        line(c, cx - 11f, top - 14f, cx + 11f, top - 14f, gold, 3f)
        dot(c, cx - 8f, top + 6f, 3f, gold); dot(c, cx + 8f, top + 6f, 3f, gold)
        // Flames licking up the cone.
        for (i in 0 until 9) {
            val life = cycle(t, 0.9f + (i % 3) * 0.25f, i / 9f)
            val fx = cx + (i - 4) * w * 0.035f + 6f * wave(t, 1.3f, i.toFloat())
            val fh = h * (0.25f + 0.25f * (1f - abs(i - 4) / 5f)) * (0.7f + 0.3f * sin(life * PI.toFloat()))
            val fw = 14f + 6f * (1f - abs(i - 4) / 5f)
            path.reset()
            path.moveTo(fx - fw, base)
            path.quadTo(fx - fw * 0.8f, base - fh * 0.6f, fx + 4f * wave(t, 2f, i.toFloat()), base - fh)
            path.quadTo(fx + fw * 0.8f, base - fh * 0.6f, fx + fw, base); path.close()
            fillPath(c, a(if (i % 2 == 0) col(0xFFFF7A00) else col(0xFFFFB020), 0.55f))
        }
        glow(c, cx, base - h * 0.12f, h * 0.22f, a(col(0xFFFFE680), 0.5f))
        motes(c, w, h, t, 40, 41, col(0xFFFFB347), 0.55f, 1.5f)
        // Crowd with torches along the bottom.
        val r = Random(43)
        var x = 0f
        while (x < w) {
            val ph = 6f + r.nextFloat() * 4f
            if (abs(x - cx) > w * 0.2f) {
                dot(c, x, h - ph * 2.6f, ph * 0.55f, col(0xFF080202))
                reset(); paint.color = col(0xFF080202); c.drawRect(x - ph * 0.7f, h - ph * 2.2f, x + ph * 0.7f, h, paint)
                if (r.nextFloat() > 0.6f) {
                    line(c, x + ph, h - ph * 1.5f, x + ph * 1.2f, h - ph * 4f, col(0xFF3A1A08), 1.6f)
                    glow(c, x + ph * 1.2f, h - ph * 4.4f, 6f + 2f * wave(t, 2f, x), a(col(0xFFFFB020), 0.9f))
                }
            }
            x += 13f + r.nextFloat() * 8f
        }
    }

    // ── Timket Festival: the blessing of the waters and the umbrellas ────
    private fun timket(c: Canvas, w: Float, h: Float, t: Float) {
        val horizon = h * 0.55f
        vGrad(c, w, col(0xFF1E3A8A), col(0xFF60A5FA), 0f, horizon)
        vGrad(c, w, col(0xFF1D4ED8), col(0xFF0B1F5C), horizon, h)
        // Ripples spreading on the pool.
        for (i in 0 until 4) {
            val life = cycle(t, 0.3f, i / 4f)
            val rx = w * (0.25f + 0.17f * i); val ry = horizon + (h - horizon) * (0.4f + 0.12f * (i % 2))
            rect.set(rx - 70f * life, ry - 14f * life, rx + 70f * life, ry + 14f * life)
            reset(); paint.style = Paint.Style.STROKE; paint.strokeWidth = 1.5f
            paint.color = a(0xFFFFFFFF.toInt(), 0.45f * (1f - life)); c.drawOval(rect, paint)
        }
        // The procession of ceremonial umbrellas, bobbing as it walks.
        val colors = intArrayOf(col(0xFFB91C1C), col(0xFFFACC15), col(0xFF15803D), col(0xFF7E22CE), col(0xFFEA580C))
        val n = 6
        val march = t * 14f
        for (i in 0 until n) {
            val ux = ((i * (w + 80f) / n + march) % (w + 80f)) - 40f
            val uy = horizon - 22f + 3f * wave(t, 0.8f, i.toFloat())
            val ur = 20f
            line(c, ux, uy, ux, horizon + 6f, col(0xFF3A2410), 1.8f)
            rect.set(ux - ur, uy - ur * 0.8f, ux + ur, uy + ur * 0.8f)
            reset(); paint.color = colors[i % colors.size]; c.drawArc(rect, 180f, 180f, true, paint)
            // Gold fringe.
            var fx = ux - ur
            while (fx <= ux + ur) { line(c, fx, uy, fx, uy + 4f, col(0xFFFACC15), 1f); fx += 4f }
            dot(c, ux, uy - ur * 0.8f, 2.4f, col(0xFFFACC15))
        }
        // Holy water sprinkled in arcs, sparkling.
        for (i in 0 until 24) {
            val life = cycle(t, 0.6f, i / 24f)
            val ang = -0.4f - (i % 6) * 0.18f
            val v = 140f + (i % 4) * 18f
            val x = w * 0.08f + cos(ang) * v * life
            val y = h * 0.6f + sin(ang) * v * life + 160f * life * life
            dot(c, x, y, 1.8f, a(0xFFFFFFFF.toInt(), 0.85f * (1f - life)))
        }
    }

    // ── South West Ethiopia: misty forest, birds crossing ────────────────
    private fun southWest(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFFF8D9A0), col(0xFF2F7A55), 0f, h * 0.7f)
        glow(c, w * 0.82f, h * 0.15f, h * 0.45f, a(col(0xFFF59E0B), 0.45f))
        val layers = intArrayOf(col(0xFF3E8A62), col(0xFF1C5E40), col(0xFF064E3B), col(0xFF02281E))
        for ((li, color) in layers.withIndex()) {
            val r = Random(50L + li)
            val baseY = h * (0.45f + li * 0.15f)
            val drift = (t * (2f + li * 3f)) % 40f
            var x = -40f + drift
            reset(); paint.color = color
            c.drawRect(0f, baseY, w, h, paint)
            while (x < w + 40f) {
                val th = 30f + r.nextFloat() * 40f + li * 10f
                val tw = 12f + r.nextFloat() * 10f + li * 3f
                path.reset(); path.moveTo(x, baseY + 2f); path.lineTo(x + tw / 2f, baseY - th); path.lineTo(x + tw, baseY + 2f); path.close()
                fillPath(c, color)
                x += tw * 0.8f + r.nextFloat() * 10f
            }
            // Mist between the layers.
            val mx = ((t * (8f + li * 4f)) % (w + 200f)) - 100f
            rect.set(mx - 120f, baseY - 14f, mx + 120f, baseY + 14f)
            reset(); paint.shader = RadialGradient(mx, baseY, 120f, a(0xFFFFFFFF.toInt(), 0.22f), 0, Shader.TileMode.CLAMP)
            c.drawOval(rect, paint); reset()
        }
        // Birds flying across.
        for (b in 0 until 4) {
            val life = cycle(t, 0.1f, b * 0.27f)
            val bx = life * (w + 60f) - 30f
            val by = h * (0.12f + 0.08f * b) + 6f * wave(t, 0.4f, b.toFloat())
            val flap = 4f * wave(t, 2.5f, b.toFloat())
            path.reset(); path.moveTo(bx - 7f, by - flap); path.quadTo(bx - 3f, by - 2f, bx, by); path.quadTo(bx + 3f, by - 2f, bx + 7f, by - flap)
            strokePath(c, col(0xFF1F2A20), 1.6f)
        }
    }

    // ═══ Faith ═══════════════════════════════════════════════════════════

    /** The ornate Ethiopian hand cross: a lattice of loops on every arm. */
    private fun ethiopianCross(c: Canvas, cx: Float, cy: Float, r: Float, color: Int, width: Float) {
        // The shaft and arms.
        line(c, cx, cy - r, cx, cy + r, color, width)
        line(c, cx - r, cy, cx + r, cy, color, width)
        // A diamond lattice at the heart.
        path.reset()
        path.moveTo(cx, cy - r * 0.42f); path.lineTo(cx + r * 0.42f, cy); path.lineTo(cx, cy + r * 0.42f); path.lineTo(cx - r * 0.42f, cy); path.close()
        strokePath(c, color, width * 0.7f)
        reset(); paint.style = Paint.Style.STROKE; paint.color = color; paint.strokeWidth = width * 0.6f
        c.drawCircle(cx, cy, r * 0.62f, paint)
        // Each arm ends in a loop with three knobs, the shape of a processional cross.
        for (k in 0 until 4) {
            val ang = k * TAU / 4
            val ex = cx + r * cos(ang); val ey = cy + r * sin(ang)
            reset(); paint.style = Paint.Style.STROKE; paint.color = color; paint.strokeWidth = width * 0.6f
            c.drawCircle(ex, ey, r * 0.2f, paint)
            for (j in -1..1) {
                val a2 = ang + j * 0.75f
                dot(c, ex + r * 0.3f * cos(a2), ey + r * 0.3f * sin(a2), width * 0.55f, color)
            }
        }
        // Small crosses between the arms.
        for (k in 0 until 4) {
            val ang = k * TAU / 4 + TAU / 8
            val mx = cx + r * 0.62f * cos(ang); val my = cy + r * 0.62f * sin(ang)
            line(c, mx - r * 0.08f, my, mx + r * 0.08f, my, color, width * 0.5f)
            line(c, mx, my - r * 0.08f, mx, my + r * 0.08f, color, width * 0.5f)
        }
    }

    /** Rays turning slowly about a point. */
    private fun rays(c: Canvas, cx: Float, cy: Float, len: Float, n: Int, t: Float, speed: Float, color: Int) {
        val rot = t * TAU * speed
        for (i in 0 until n) {
            val a0 = rot + i * TAU / n
            path.reset(); path.moveTo(cx, cy)
            path.lineTo(cx + len * cos(a0 - 0.06f), cy + len * sin(a0 - 0.06f))
            path.lineTo(cx + len * cos(a0 + 0.06f), cy + len * sin(a0 + 0.06f)); path.close()
            fillPath(c, color)
        }
    }

    /** Candle flames along the bottom, each flickering on its own. */
    private fun candles(c: Canvas, w: Float, h: Float, t: Float, n: Int) {
        for (i in 0 until n) {
            val x = w * (i + 0.5f) / n
            val f = 0.8f + 0.2f * wave(t, 2.6f + i * 0.3f, i.toFloat())
            reset(); paint.color = col(0xFFF5EBD8); c.drawRect(x - 3f, h - 16f, x + 3f, h, paint)
            glow(c, x, h - 22f, 14f * f, a(col(0xFFFFC14D), 0.7f))
            rect.set(x - 2.6f, h - 30f * f, x + 2.6f, h - 16f)
            reset(); paint.color = col(0xFFFFE08A); c.drawOval(rect, paint)
        }
    }

    // ── Ethiopian Orthodox: the ornate cross, incense and candles ────────
    private fun orthodoxCross(c: Canvas, w: Float, h: Float, t: Float) {
        reset(); paint.shader = RadialGradient(w / 2f, h / 2f, max(w, h) * 0.75f, col(0xFF3B2B5A), col(0xFF120822), Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, paint); reset()
        val cx = w / 2f; val cy = h * 0.45f
        rays(c, cx, cy, max(w, h), 16, t, 0.02f, a(col(0xFFDAA520), 0.08f))
        val pulse = 0.5f + 0.5f * wave(t, 0.25f)
        glow(c, cx, cy, h * (0.45f + 0.05f * pulse), a(col(0xFFFFD36B), 0.35f + 0.15f * pulse))
        c.save(); c.rotate(2.5f * wave(t, 0.08f), cx, cy)
        ethiopianCross(c, cx, cy, min(w, h) * 0.33f, col(0xFFDAA520), 5f)
        c.restore()
        // Incense smoke curling up from the censer at the bottom left.
        for (k in 0 until 3) {
            val life = cycle(t, 0.22f, k / 3f)
            path.reset()
            val x0 = w * 0.12f
            path.moveTo(x0, h)
            for (j in 1..12) {
                val p = j / 12f
                path.lineTo(x0 + 16f * sin(p * 7f + t * TAU * 0.3f + k * 2) + p * 30f, h - p * h * (0.5f + 0.5f * life))
            }
            strokePath(c, a(col(0xFFE8DDF5), 0.22f * (1f - life)), 4f)
        }
        candles(c, w, h, t, 7)
        motes(c, w, h, t, 26, 71, col(0xFFFFD36B), 0.15f, 1.4f)
    }

    // ── Meskel Fire: the True Cross shining above the flames ─────────────
    private fun meskelFire(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF1A0303), col(0xFF7F1D1D), 0f, h)
        val cx = w / 2f; val cy = h * 0.38f
        rays(c, cx, cy, max(w, h), 20, t, -0.03f, a(col(0xFFFFE08A), 0.07f))
        glow(c, cx, cy, h * (0.5f + 0.05f * wave(t, 0.6f)), a(col(0xFFFFC14D), 0.5f))
        // The Meskel cross: wide arms ending in flared tips.
        val r = min(w, h) * 0.28f; val gold = col(0xFFFACC15)
        line(c, cx, cy - r, cx, cy + r, gold, 9f)
        line(c, cx - r * 0.75f, cy - r * 0.15f, cx + r * 0.75f, cy - r * 0.15f, gold, 9f)
        for ((ex, ey) in listOf(cx to cy - r, cx to cy + r, cx - r * 0.75f to cy - r * 0.15f, cx + r * 0.75f to cy - r * 0.15f)) {
            dot(c, ex, ey, 9f, gold)
        }
        dot(c, cx, cy - r * 0.15f, 7f, col(0xFF991B1B))
        // A row of flames along the bottom.
        for (i in 0 until 12) {
            val fx = w * (i + 0.5f) / 12f + 5f * wave(t, 1.4f, i.toFloat())
            val fh = h * (0.18f + 0.1f * abs(wave(t, 1.1f + (i % 3) * 0.3f, i * 0.9f)))
            val fw = w / 12f * 0.75f
            path.reset(); path.moveTo(fx - fw, h)
            path.quadTo(fx - fw * 0.7f, h - fh * 0.6f, fx + 4f * wave(t, 2.2f, i.toFloat()), h - fh)
            path.quadTo(fx + fw * 0.7f, h - fh * 0.6f, fx + fw, h); path.close()
            fillPath(c, a(if (i % 2 == 0) col(0xFFFF6A00) else col(0xFFFFB020), 0.75f))
        }
        // Adey abeba flowers drifting up with the sparks.
        for (i in 0 until 8) {
            val life = cycle(t, 0.12f, i / 8f)
            val x = w * ((i * 0.37f + 0.1f) % 1f) + 10f * wave(t, 0.3f, i.toFloat())
            val y = h * (1f - life * 1.1f)
            for (p in 0 until 8) {
                val ang = p * TAU / 8 + life * 4f
                dot(c, x + 4.5f * cos(ang), y + 4.5f * sin(ang), 2.4f, a(col(0xFFFACC15), 1f - life))
            }
            dot(c, x, y, 2f, a(col(0xFFB45309), 1f - life))
        }
        motes(c, w, h, t, 34, 73, col(0xFFFFB347), 0.5f, 1.4f)
    }

    // ── Al-Najashi: the mosque at dusk, crescent and stars ───────────────
    private fun najashi(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF011A14), col(0xFF0B6B4F), 0f, h)
        val r = Random(81)
        for (i in 0 until 40) {
            val tw = abs(wave(t, 0.3f + r.nextFloat() * 0.6f, i.toFloat()))
            dot(c, r.nextFloat() * w, r.nextFloat() * h * 0.55f, 0.6f + r.nextFloat(), a(0xFFFFFFFF.toInt(), 0.2f + 0.7f * tw))
        }
        // A faint eight-pointed star pattern turning behind the mosque.
        c.save(); c.rotate(t * 6f, w / 2f, h * 0.45f)
        for (k in 0 until 2) {
            val s = min(w, h) * 0.42f
            rect.set(w / 2f - s, h * 0.45f - s, w / 2f + s, h * 0.45f + s)
            c.save(); c.rotate(k * 45f, w / 2f, h * 0.45f)
            reset(); paint.style = Paint.Style.STROKE; paint.strokeWidth = 1.5f; paint.color = a(col(0xFF34D399), 0.18f)
            c.drawRect(rect, paint)
            c.restore()
        }
        c.restore()
        // The mosque: a great dome on its hall, a second dome, and a minaret.
        // High enough that the domes and minaret show between the keys.
        val base = h * 0.8f; val cx = w * 0.45f; val dr = min(w, h) * 0.2f
        val green = col(0xFF04291F)
        reset(); paint.color = green; c.drawRect(0f, base, w, h, paint)
        reset(); paint.color = green
        c.drawRect(cx - dr * 1.6f, base - dr * 0.9f, cx + dr * 1.6f, base, paint)
        rect.set(cx - dr, base - dr * 0.9f - dr, cx + dr, base - dr * 0.9f + dr); c.drawArc(rect, 180f, 180f, true, paint)
        rect.set(cx + dr * 0.8f, base - dr * 0.9f - dr * 0.5f, cx + dr * 1.6f, base - dr * 0.9f + dr * 0.4f); c.drawArc(rect, 180f, 180f, true, paint)
        val mx = cx + dr * 2.4f
        c.drawRect(mx - 6f, base - dr * 3.1f, mx + 6f, base, paint)
        c.drawRect(mx - 10f, base - dr * 2.3f, mx + 10f, base - dr * 2.15f, paint)
        rect.set(mx - 6f, base - dr * 3.1f - 6f, mx + 6f, base - dr * 3.1f + 6f); c.drawArc(rect, 180f, 180f, true, paint)
        // Lit arched windows, flickering a little.
        for (i in -2..2) {
            val f = 0.6f + 0.4f * abs(wave(t, 0.5f + abs(i) * 0.2f, i.toFloat()))
            rect.set(cx + i * dr * 0.5f - 4f, base - dr * 0.65f, cx + i * dr * 0.5f + 4f, base - dr * 0.2f)
            reset(); paint.color = a(col(0xFFFDE68A), f); c.drawRoundRect(rect, 4f, 4f, paint)
        }
        // The crescent above the dome, glowing.
        val ccx = cx; val ccy = base - dr * 2.25f
        val pulse = 0.5f + 0.5f * wave(t, 0.2f)
        glow(c, ccx, ccy, 26f, a(col(0xFF34D399), 0.25f + 0.25f * pulse))
        dot(c, ccx, ccy, 9f, col(0xFFFDE68A))
        dot(c, ccx + 4f, ccy - 2f, 8f, col(0xFF05372A))
        motes(c, w, h, t, 28, 85, col(0xFF6EE7B7), 0.16f, 1.5f)
    }

    // ── Harar Jegol: the coloured houses of the old city under the night ─
    private fun hararJegol(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF0B1A4A), col(0xFF78350F), 0f, h)
        val r = Random(83)
        for (i in 0 until 30) {
            val tw = abs(wave(t, 0.4f + r.nextFloat(), i.toFloat()))
            dot(c, r.nextFloat() * w, r.nextFloat() * h * 0.45f, 0.6f + r.nextFloat(), a(0xFFFFFFFF.toInt(), 0.2f + 0.6f * tw))
        }
        // Slow clouds.
        for (i in 0 until 3) {
            val x = ((t * (6f + i * 3f) + i * 160f) % (w + 240f)) - 120f
            val y = h * (0.15f + i * 0.1f)
            rect.set(x - 70f, y - 10f, x + 70f, y + 10f)
            reset(); paint.color = a(col(0xFF9DB4FF), 0.08f); c.drawOval(rect, paint)
        }
        // A minaret behind the houses.
        val mx = w * 0.74f
        reset(); paint.color = col(0xFF14204A)
        c.drawRect(mx - 7f, h * 0.18f, mx + 7f, h, paint)
        rect.set(mx - 7f, h * 0.18f - 7f, mx + 7f, h * 0.18f + 7f); c.drawArc(rect, 180f, 180f, true, paint)
        dot(c, mx, h * 0.18f - 14f, 3f, a(col(0xFFFDE68A), 0.6f + 0.4f * abs(wave(t, 0.3f))))
        // The houses, in the city's bright colours, with doors and lit windows.
        val colors = intArrayOf(col(0xFFFBBF24), col(0xFFEF4444), col(0xFF22C55E), col(0xFF3B82F6), col(0xFFF97316))
        val n = 9
        for (i in 0 until n) {
            val x = i * (w / n)
            val bh = h * (0.32f + 0.12f * sin(i * 1.3f))
            reset(); paint.color = colors[i % colors.size]
            c.drawRect(x + 1f, h - bh, x + w / n - 2f, h, paint)
            reset(); paint.color = a(col(0xFF000000), 0.35f)
            rect.set(x + (w / n) * 0.35f, h - bh * 0.42f, x + (w / n) * 0.62f, h); c.drawRoundRect(rect, 6f, 6f, paint)
            val f = 0.55f + 0.45f * abs(wave(t, 0.5f + (i % 3) * 0.2f, i.toFloat()))
            reset(); paint.color = a(col(0xFFFFF1B8), f)
            c.drawRect(x + (w / n) * 0.2f, h - bh * 0.8f, x + (w / n) * 0.36f, h - bh * 0.62f, paint)
        }
        motes(c, w, h, t, 20, 87, col(0xFFFDE68A), 0.15f, 1.3f)
    }

    // ── Ramadan Lanterns: fanous lanterns swinging under the crescent ────
    private fun ramadanLanterns(c: Canvas, w: Float, h: Float, t: Float) {
        reset(); paint.shader = RadialGradient(w / 2f, h * 0.3f, max(w, h), col(0xFF0B1638), col(0xFF000208), Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, paint); reset()
        val r = Random(89)
        for (i in 0 until 36) {
            val tw = abs(wave(t, 0.35f + r.nextFloat() * 0.6f, i.toFloat()))
            dot(c, r.nextFloat() * w, r.nextFloat() * h * 0.7f, 0.5f + r.nextFloat(), a(0xFFFFFFFF.toInt(), 0.15f + 0.6f * tw))
        }
        // The crescent moon.
        val mx = w * 0.82f; val my = h * 0.2f
        glow(c, mx, my, 40f, a(col(0xFFFDE68A), 0.3f))
        dot(c, mx, my, 16f, col(0xFFFDE68A))
        dot(c, mx + 7f, my - 4f, 14.5f, col(0xFF0A1534))
        // Lanterns hanging on strings, each swinging gently.
        val glass = intArrayOf(col(0xFFF59E0B), col(0xFFEF4444), col(0xFF10B981), col(0xFF3B82F6), col(0xFFF59E0B))
        val n = 5
        for (i in 0 until n) {
            val px = w * (i + 0.5f) / n
            val len = h * (0.28f + 0.16f * ((i * 0.53f) % 1f))
            val swing = 8f * wave(t, 0.22f + i * 0.03f, i * 1.3f)
            c.save(); c.rotate(swing, px, 0f)
            line(c, px, 0f, px, len, a(col(0xFFD6B36A), 0.7f), 1.2f)
            val lx = px; val ly = len + 18f
            val glowA = 0.55f + 0.25f * wave(t, 1.6f, i.toFloat())
            glow(c, lx, ly, 46f, a(col(0xFFFFC14D), glowA * 0.6f))
            // Cap, glass body and base.
            path.reset(); path.moveTo(lx - 6f, ly - 18f); path.lineTo(lx + 6f, ly - 18f); path.lineTo(lx + 10f, ly - 12f); path.lineTo(lx - 10f, ly - 12f); path.close()
            fillPath(c, col(0xFFB8860B))
            path.reset(); path.moveTo(lx - 10f, ly - 12f); path.lineTo(lx + 10f, ly - 12f); path.lineTo(lx + 13f, ly + 6f)
            path.lineTo(lx + 8f, ly + 16f); path.lineTo(lx - 8f, ly + 16f); path.lineTo(lx - 13f, ly + 6f); path.close()
            fillPath(c, a(glass[i], 0.85f))
            strokePath(c, col(0xFFB8860B), 1.6f)
            line(c, lx, ly - 12f, lx, ly + 16f, col(0xFFB8860B), 1.2f)
            glow(c, lx, ly + 2f, 9f, a(col(0xFFFFF6D0), glowA))
            path.reset(); path.moveTo(lx - 8f, ly + 16f); path.lineTo(lx + 8f, ly + 16f); path.lineTo(lx, ly + 24f); path.close()
            fillPath(c, col(0xFFB8860B))
            c.restore()
        }
        motes(c, w, h, t, 20, 91, col(0xFFFFD580), 0.14f, 1.3f)
    }

    // ── Timkat Holy: the dove descending on the blessed water ────────────
    private fun timkatHoly(c: Canvas, w: Float, h: Float, t: Float) {
        vGrad(c, w, col(0xFF0C4A6E), col(0xFF082F49), 0f, h)
        // A beam of light from above.
        reset()
        paint.shader = LinearGradient(w / 2f, 0f, w / 2f, h, a(col(0xFFFFF7D6), 0.35f), 0, Shader.TileMode.CLAMP)
        path.reset(); path.moveTo(w * 0.42f, 0f); path.lineTo(w * 0.58f, 0f); path.lineTo(w * 0.75f, h); path.lineTo(w * 0.25f, h); path.close()
        c.drawPath(path, paint); reset()
        // Golden ripples spreading on the water.
        val wy = h * 0.72f
        for (i in 0 until 4) {
            val life = cycle(t, 0.35f, i / 4f)
            rect.set(w / 2f - w * 0.45f * life, wy - h * 0.08f * life, w / 2f + w * 0.45f * life, wy + h * 0.08f * life)
            reset(); paint.style = Paint.Style.STROKE; paint.strokeWidth = 2f
            paint.color = a(col(0xFFFDE047), 0.55f * (1f - life)); c.drawOval(rect, paint)
        }
        // Ceremonial umbrellas on the far bank.
        val colors = intArrayOf(col(0xFFEF4444), col(0xFFFBBF24), col(0xFF22C55E), col(0xFF8B5CF6))
        for (i in 0 until 4) {
            val x = w * (0.14f + i * 0.24f) + 4f * wave(t, 0.4f, i.toFloat())
            val y = h * 0.5f
            line(c, x, y, x, y + 26f, col(0xFF3A2410), 1.8f)
            rect.set(x - 20f, y - 16f, x + 20f, y + 16f)
            reset(); paint.color = colors[i]; c.drawArc(rect, 180f, 180f, true, paint)
            var fx = x - 20f
            while (fx <= x + 20f) { line(c, fx, y, fx, y + 4f, col(0xFFFACC15), 1f); fx += 4f }
        }
        // The dove, gliding down the beam and back up.
        val dy = h * (0.12f + 0.2f * (0.5f + 0.5f * wave(t, 0.1f)))
        val dx = w / 2f + 14f * wave(t, 0.13f, 1f)
        val flap = 7f * wave(t, 1.6f)
        glow(c, dx, dy, 30f, a(0xFFFFFFFF.toInt(), 0.3f))
        rect.set(dx - 8f, dy - 4f, dx + 8f, dy + 4f); reset(); paint.color = 0xFFFFFFFF.toInt(); c.drawOval(rect, paint)
        dot(c, dx + 8f, dy - 3f, 3.2f, 0xFFFFFFFF.toInt())
        path.reset(); path.moveTo(dx - 2f, dy - 2f); path.quadTo(dx - 12f, dy - 14f - flap, dx - 24f, dy - 6f - flap); path.quadTo(dx - 10f, dy - 2f, dx - 2f, dy + 1f); path.close()
        fillPath(c, 0xFFF8FAFC.toInt())
        path.reset(); path.moveTo(dx + 2f, dy - 2f); path.quadTo(dx + 8f, dy - 14f - flap, dx + 18f, dy - 8f - flap); path.quadTo(dx + 8f, dy - 2f, dx + 2f, dy + 1f); path.close()
        fillPath(c, 0xFFE2E8F0.toInt())
        // Holy water sprinkled, sparkling.
        for (i in 0 until 20) {
            val life = cycle(t, 0.5f, i / 20f)
            val ang = -PI.toFloat() / 2 + (i % 7 - 3) * 0.22f
            val v = 110f + (i % 3) * 20f
            val x = w * 0.5f + cos(ang) * v * life
            val y = wy + sin(ang) * v * life + 150f * life * life
            dot(c, x, y, 1.7f, a(0xFFFFFFFF.toInt(), 0.85f * (1f - life)))
        }
    }
}
