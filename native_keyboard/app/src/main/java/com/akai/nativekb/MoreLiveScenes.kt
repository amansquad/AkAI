package com.akai.nativekb

import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.Shader
import androidx.core.graphics.ColorUtils
import java.util.Random
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Scenes for the live themes that used to share another theme's animation
 * (Galaxy, Snowfall and five more all showed the aurora; Lava, Plasma and
 * Sunset Glow the fire; Bubbles, Deep Sea and Ocean Waves the ocean).
 *
 * Like [LiveScenes]: [time] runs 0..1 and repeats, coordinates are dp, and each
 * scene paints its own background. Motion uses whole turns of [time] so the
 * loop has no jump when it repeats.
 */
object MoreLiveScenes {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()
    private const val TAU = (2 * PI).toFloat()

    /** The live ids drawn here; they are matched before LiveScenes' looser name checks. */
    val ids = setOf(
        "galaxy_spiral", "nebula_live", "waterfall_live", "magma_live", "plasma_live",
        "bubbles_live", "deep_sea_live", "ocean_waves_live", "obsidian_live",
    )

    fun paint(c: Canvas, w: Float, h: Float, time: Float, live: String): Boolean {
        when (live) {
            "galaxy_spiral" -> galaxy(c, w, h, time)
            "nebula_live" -> nebula(c, w, h, time)
            "waterfall_live" -> waterfall(c, w, h, time)
            "magma_live" -> magma(c, w, h, time)
            "plasma_live" -> plasma(c, w, h, time)
            "bubbles_live" -> bubbles(c, w, h, time)
            "deep_sea_live" -> deepSea(c, w, h, time)
            "ocean_waves_live" -> oceanWaves(c, w, h, time)
            "obsidian_live" -> obsidian(c, w, h, time)
            else -> return false
        }
        return true
    }

    private fun a(color: Int, opacity: Float) = ColorUtils.setAlphaComponent(color, (opacity * 255f).toInt().coerceIn(0, 255))
    private fun reset() { paint.shader = null; paint.style = Paint.Style.FILL; paint.strokeWidth = 1f; paint.strokeCap = Paint.Cap.BUTT }
    private fun fill(c: Canvas, w: Float, h: Float, color: Int) { reset(); paint.color = color; c.drawRect(0f, 0f, w, h, paint) }
    private fun vGradient(c: Canvas, w: Float, h: Float, vararg colors: Int) {
        reset(); paint.shader = LinearGradient(0f, 0f, 0f, h, colors, null, Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, paint); reset()
    }
    private fun glow(c: Canvas, x: Float, y: Float, r: Float, inner: Int, outer: Int = 0) {
        reset(); paint.shader = RadialGradient(x, y, max(r, 0.1f), inner, outer, Shader.TileMode.CLAMP)
        c.drawCircle(x, y, r, paint); reset()
    }
    private fun dot(c: Canvas, x: Float, y: Float, r: Float, color: Int) { reset(); paint.color = color; c.drawCircle(x, y, r, paint) }
    /** 0..1 position of something looping [turns] times per cycle, offset by [phase]. */
    private fun loop(time: Float, turns: Int, phase: Double) = ((time * turns + phase) % 1.0).toFloat()

    /** Twinkling background stars, the same ones every frame. */
    private fun stars(c: Canvas, w: Float, h: Float, time: Float, count: Int, seed: Long) {
        val r = Random(seed)
        for (i in 0 until count) {
            val x = r.nextFloat() * w; val y = r.nextFloat() * h
            val tw = 0.35f + 0.65f * (0.5f + 0.5f * sin(time * TAU * (1 + i % 3) + i))
            dot(c, x, y, 0.6f + r.nextFloat() * 0.9f, a(0xFFFFFFFF.toInt(), 0.7f * tw))
        }
    }

    // ── Galaxy: a two-armed spiral turning round a bright core ──────────────
    private fun galaxy(c: Canvas, w: Float, h: Float, time: Float) {
        fill(c, w, h, 0xFF07031A.toInt())
        stars(c, w, h, time, 50, 11)
        val cx = w * 0.5f; val cy = h * 0.5f
        val size = max(w, h) * 0.55f
        glow(c, cx, cy, size * 0.9f, a(0xFF5B2A86.toInt(), 0.35f))
        val r = Random(7)
        val spin = time * TAU
        for (i in 0 until 260) {
            val arm = i % 2
            val d = r.nextFloat()                       // 0 core .. 1 rim
            val angle = d * 4.2f + arm * PI.toFloat() + spin + (r.nextFloat() - 0.5f) * 0.5f
            val dist = d * size + (r.nextFloat() - 0.5f) * 14f
            val x = cx + cos(angle) * dist
            val y = cy + sin(angle) * dist * 0.55f       // tilted disc
            val color = if (d < 0.3f) 0xFFFFE9C4.toInt() else if (i % 3 == 0) 0xFFB98CFF.toInt() else 0xFF8FB8FF.toInt()
            dot(c, x, y, 0.7f + (1f - d) * 1.3f, a(color, 0.85f - d * 0.5f))
        }
        glow(c, cx, cy, size * 0.22f, a(0xFFFFF2D6.toInt(), 0.9f))
    }

    // ── Nebula: big soft clouds of colour drifting over stars ───────────────
    private fun nebula(c: Canvas, w: Float, h: Float, time: Float) {
        fill(c, w, h, 0xFF050314.toInt())
        stars(c, w, h, time, 70, 21)
        val clouds = intArrayOf(0xFFE0379B.toInt(), 0xFF4361EE.toInt(), 0xFF2EC4B6.toInt(), 0xFF9D4EDD.toInt())
        for (i in clouds.indices) {
            val ph = i * TAU / clouds.size
            val x = w * (0.5f + 0.32f * cos(time * TAU + ph))
            val y = h * (0.5f + 0.28f * sin(time * TAU * 2 + ph))
            glow(c, x, y, max(w, h) * 0.45f, a(clouds[i], 0.32f))
        }
    }

    // ── Waterfall: streams pouring down into mist ───────────────────────────
    private fun waterfall(c: Canvas, w: Float, h: Float, time: Float) {
        vGradient(c, w, h, 0xFF06222B.toInt(), 0xFF0B3A47.toInt(), 0xFF0E4D5C.toInt())
        val r = Random(31)
        reset(); paint.strokeCap = Paint.Cap.ROUND
        for (i in 0 until 70) {
            val x = r.nextFloat() * w
            val len = 30f + r.nextFloat() * 60f
            val y = loop(time, 3 + i % 3, r.nextDouble()) * (h + len) - len
            paint.color = a(0xFFBDEFFF.toInt(), 0.18f + r.nextFloat() * 0.3f)
            paint.strokeWidth = 1f + r.nextFloat() * 2.2f
            c.drawLine(x, y, x, y + len, paint)
        }
        reset()
        // Mist where the water lands.
        for (i in 0 until 6) {
            val x = w * (i + 0.5f) / 6f + sin(time * TAU + i) * 12f
            glow(c, x, h, w * 0.22f, a(0xFFE6FAFF.toInt(), 0.35f))
        }
    }

    // ── Lava: cracks of glowing magma in dark rock, embers rising ───────────
    private fun magma(c: Canvas, w: Float, h: Float, time: Float) {
        fill(c, w, h, 0xFF120806.toInt())
        val r = Random(55)
        reset(); paint.style = Paint.Style.STROKE; paint.strokeCap = Paint.Cap.ROUND
        for (i in 0 until 9) {
            path.reset()
            var x = r.nextFloat() * w; var y = r.nextFloat() * h
            path.moveTo(x, y)
            repeat(7) {
                x += (r.nextFloat() - 0.5f) * 90f; y += (r.nextFloat() - 0.3f) * 60f
                path.lineTo(x, y)
            }
            val pulse = 0.55f + 0.45f * sin(time * TAU * 2 + i)
            paint.color = a(0xFFFF5A00.toInt(), 0.25f * pulse); paint.strokeWidth = 9f
            c.drawPath(path, paint)
            paint.color = a(0xFFFFB347.toInt(), 0.85f * pulse); paint.strokeWidth = 2.2f
            c.drawPath(path, paint)
        }
        reset()
        for (i in 0 until 30) {
            val t = loop(time, 2, r.nextDouble())
            val x = r.nextFloat() * w + sin(t * TAU + i) * 10f
            dot(c, x, h * (1f - t), 1.2f + r.nextFloat() * 1.5f, a(0xFFFFC46B.toInt(), 0.9f * (1f - t)))
        }
    }

    // ── Plasma: a shifting electric field ───────────────────────────────────
    // Worked out on a coarse grid (one value per CELL dp), written into a tiny
    // bitmap and stretched with smoothing: soft gradients for the cost of the grid.
    private const val CELL = 12f
    private var plasmaBmp: android.graphics.Bitmap? = null
    private var plasmaPixels = IntArray(0)
    private val smooth = Paint(Paint.FILTER_BITMAP_FLAG)
    private val plasmaDst = android.graphics.RectF()

    private fun plasma(c: Canvas, w: Float, h: Float, time: Float) {
        val cols = (w / CELL).toInt() + 2
        val rows = (h / CELL).toInt() + 2
        val bmp = plasmaBmp?.takeIf { it.width == cols && it.height == rows }
            ?: android.graphics.Bitmap.createBitmap(cols, rows, android.graphics.Bitmap.Config.ARGB_8888).also {
                plasmaBmp?.recycle(); plasmaBmp = it; plasmaPixels = IntArray(cols * rows)
            }
        val t = time * TAU
        val hsl = FloatArray(3)
        for (j in 0 until rows) for (i in 0 until cols) {
            val x = i * CELL; val y = j * CELL
            val v = sin(x * 0.03f + t) + sin(y * 0.04f - t * 2) +
                sin((x + y) * 0.02f + t) + sin(sqrt(x * x + y * y) * 0.03f - t)
            hsl[0] = (250f + v * 30f + 360f) % 360f           // violet to cyan to magenta
            hsl[1] = 0.85f
            hsl[2] = 0.18f + 0.12f * (v / 4f + 0.5f)
            plasmaPixels[j * cols + i] = ColorUtils.HSLToColor(hsl)
        }
        bmp.setPixels(plasmaPixels, 0, cols, 0, 0, cols, rows)
        // Pixel centres sit on the grid points, so the picture lines up with the old cells.
        plasmaDst.set(-CELL / 2f, -CELL / 2f, cols * CELL - CELL / 2f, rows * CELL - CELL / 2f)
        c.drawBitmap(bmp, null, plasmaDst, smooth)
    }

    // ── Bubbles: rising, wobbling bubbles with a highlight ──────────────────
    private fun bubbles(c: Canvas, w: Float, h: Float, time: Float) {
        vGradient(c, w, h, 0xFF023E5A.toInt(), 0xFF012A40.toInt(), 0xFF001827.toInt())
        val r = Random(77)
        for (i in 0 until 34) {
            val size = 3f + r.nextFloat() * 11f
            val t = loop(time, if (size < 7f) 3 else 2, r.nextDouble())
            val x = r.nextFloat() * w + sin(t * TAU * 2 + i) * 8f
            val y = h + size - t * (h + size * 2)
            reset(); paint.style = Paint.Style.STROKE; paint.strokeWidth = 1.2f
            paint.color = a(0xFFBDE8FF.toInt(), 0.55f); c.drawCircle(x, y, size, paint)
            reset(); paint.color = a(0xFF9AD8F5.toInt(), 0.12f); c.drawCircle(x, y, size, paint)
            dot(c, x - size * 0.35f, y - size * 0.35f, size * 0.22f, a(0xFFFFFFFF.toInt(), 0.7f))
        }
    }

    // ── Deep sea: light from far above, drifting specks, two jellyfish ──────
    private fun deepSea(c: Canvas, w: Float, h: Float, time: Float) {
        vGradient(c, w, h, 0xFF06323A.toInt(), 0xFF021A22.toInt(), 0xFF010A0F.toInt())
        // Rays
        for (i in 0 until 4) {
            val x = w * (0.15f + i * 0.25f) + sin(time * TAU + i) * 18f
            path.reset(); path.moveTo(x - 14f, 0f); path.lineTo(x + 14f, 0f); path.lineTo(x + 60f, h); path.lineTo(x - 30f, h); path.close()
            reset(); paint.shader = LinearGradient(0f, 0f, 0f, h, a(0xFF7FFFE6.toInt(), 0.10f), 0, Shader.TileMode.CLAMP)
            c.drawPath(path, paint); reset()
        }
        val r = Random(91)
        for (i in 0 until 40) {
            val t = loop(time, 1, r.nextDouble())
            dot(c, r.nextFloat() * w + sin(t * TAU + i) * 6f, h * (1f - t), 0.8f + r.nextFloat(), a(0xFF9FFFF0.toInt(), 0.45f))
        }
        for (j in 0 until 2) {
            val x = w * (0.3f + j * 0.42f)
            val y = h * (0.45f + 0.12f * sin(time * TAU * 2 + j * 2f))
            jelly(c, x, y, 16f + j * 6f, time + j * 0.37f, if (j == 0) 0xFFFF7EDB.toInt() else 0xFF7EE8FF.toInt())
        }
    }

    private fun jelly(c: Canvas, x: Float, y: Float, s: Float, time: Float, color: Int) {
        glow(c, x, y, s * 2.4f, a(color, 0.25f))
        path.reset()
        path.addArc(x - s, y - s, x + s, y + s, 180f, 180f)
        reset(); paint.color = a(color, 0.65f); c.drawPath(path, paint)
        reset(); paint.style = Paint.Style.STROKE; paint.strokeWidth = 1.3f; paint.color = a(color, 0.6f)
        for (k in 0 until 4) {
            val tx = x - s * 0.7f + k * s * 0.47f
            path.reset(); path.moveTo(tx, y)
            var d = 0f
            while (d <= s * 2f) { path.lineTo(tx + sin(d * 0.25f + time * TAU * 3 + k) * 3f, y + d); d += 3f }
            c.drawPath(path, paint)
        }
        reset()
    }

    // ── Ocean waves: rolling teal swells with foam on their crests ──────────
    private fun oceanWaves(c: Canvas, w: Float, h: Float, time: Float) {
        vGradient(c, w, h, 0xFF0B4F5C.toInt(), 0xFF07343F.toInt())
        glow(c, w * 0.8f, h * 0.15f, w * 0.3f, a(0xFFFFF4D6.toInt(), 0.35f))
        val shades = intArrayOf(0xFF0F6E7A.toInt(), 0xFF138A8F.toInt(), 0xFF17A3A0.toInt(), 0xFF1BB8AE.toInt())
        for (i in shades.indices) {
            val base = h * (0.35f + i * 0.17f)
            val amp = 10f + i * 4f
            val k = TAU / (w * (0.6f - i * 0.08f))
            val shift = time * TAU * (if (i % 2 == 0) 1 else 2)
            path.reset(); path.moveTo(0f, h)
            var x = 0f
            while (x <= w + 8f) { path.lineTo(x, base + sin(x * k + shift) * amp); x += 8f }
            path.lineTo(w, h); path.close()
            reset(); paint.color = shades[i]; c.drawPath(path, paint)
            // Foam line on the crest
            path.reset()
            x = 0f
            path.moveTo(0f, base + sin(shift) * amp)
            while (x <= w + 8f) { path.lineTo(x, base + sin(x * k + shift) * amp); x += 8f }
            reset(); paint.style = Paint.Style.STROKE; paint.strokeWidth = 1.6f; paint.color = a(0xFFE8FFFB.toInt(), 0.45f)
            c.drawPath(path, paint); reset()
        }
    }

    // ── Obsidian: dark volcanic glass, a gold glint sweeping across ─────────
    private fun obsidian(c: Canvas, w: Float, h: Float, time: Float) {
        fill(c, w, h, 0xFF0C0A16.toInt())
        val r = Random(13)
        val cols = 6; val rows = 4
        val cw = w / cols; val ch = h / rows
        // Facets: each cell split into two triangles from jittered corners.
        val px = Array(cols + 1) { i -> FloatArray(rows + 1) { j -> i * cw + if (i in 1 until cols) (r.nextFloat() - 0.5f) * cw * 0.6f else 0f } }
        val py = Array(cols + 1) { _ -> FloatArray(rows + 1) { j -> j * ch + if (j in 1 until rows) (r.nextFloat() - 0.5f) * ch * 0.6f else 0f } }
        val sweep = time * (w + h) * 1.6f - h * 0.8f           // a diagonal band moving across
        for (i in 0 until cols) for (j in 0 until rows) for (half in 0..1) {
            path.reset()
            if (half == 0) { path.moveTo(px[i][j], py[i][j]); path.lineTo(px[i + 1][j], py[i + 1][j]); path.lineTo(px[i][j + 1], py[i][j + 1]) }
            else { path.moveTo(px[i + 1][j], py[i + 1][j]); path.lineTo(px[i + 1][j + 1], py[i + 1][j + 1]); path.lineTo(px[i][j + 1], py[i][j + 1]) }
            path.close()
            val mx = (px[i][j] + px[i + 1][j + 1]) / 2f; val my = (py[i][j] + py[i + 1][j + 1]) / 2f
            val near = 1f - (kotlin.math.abs(mx + my - sweep) / (w * 0.35f)).coerceIn(0f, 1f)
            val base = 0.10f + r.nextFloat() * 0.10f
            reset(); paint.color = ColorUtils.blendARGB(a(0xFF2B2247.toInt(), 1f), 0xFFE4A11B.toInt(), near * 0.55f)
            paint.alpha = ((base + near * 0.5f) * 255).toInt().coerceIn(0, 255)
            c.drawPath(path, paint)
            reset(); paint.style = Paint.Style.STROKE; paint.strokeWidth = 0.8f; paint.color = a(0xFFB8A6FF.toInt(), 0.12f + near * 0.4f)
            c.drawPath(path, paint)
        }
        reset()
    }
}
