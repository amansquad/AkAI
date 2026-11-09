package com.akai.nativekb

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.Shader
import androidx.core.graphics.ColorUtils
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * The animated backgrounds behind a "live" theme's keys. The Flutter app has a
 * hand-made painter for every theme; here the themes share a few families
 * (aurora, waves, fire, digital rain, rainbow, stars, glow, grid), each drawn in
 * the theme's own colours. Themes with a one-off painter in Flutter use the
 * aurora drift, so they still move and still look like their palette.
 */
class LiveBackdrop {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()
    private val hsv = FloatArray(3)

    private fun family(live: String): String = when (live) {
        "ocean", "ocean_waves_live" -> "waves"
        "fire", "lava_lamp_live" -> "fire"
        "matrix", "binary_rain_live" -> "rain"
        "rainbow", "prism_live" -> "rainbow"
        "starfield_live", "meteor_live", "fireworks_live", "nebula_live" -> "stars"
        "fireflies_live", "bokeh_live", "ripples_live" -> "glow"
        "glitch_live", "cyberpunk", "circuit_board_live", "geometric_flow_live" -> "grid"
        else -> "aurora"
    }

    fun draw(canvas: Canvas, w: Float, h: Float, t: Long, pal: Palette, density: Float) {
        val time = t.toFloat()
        when (family(pal.def.live)) {
            "waves" -> waves(canvas, w, h, time, pal)
            "fire" -> fire(canvas, w, h, time, pal)
            "rain" -> rain(canvas, w, h, time, pal, density)
            "rainbow" -> rainbow(canvas, w, h, time)
            "stars" -> stars(canvas, w, h, time, pal)
            "glow" -> glow(canvas, w, h, time, pal)
            "grid" -> grid(canvas, w, h, time, pal, density)
            else -> aurora(canvas, w, h, time, pal)
        }
    }

    private fun blob(canvas: Canvas, cx: Float, cy: Float, r: Float, color: Int, alpha: Int) {
        paint.shader = RadialGradient(
            cx, cy, r, intArrayOf(ColorUtils.setAlphaComponent(color, alpha), Color.TRANSPARENT),
            null, Shader.TileMode.CLAMP,
        )
        canvas.drawCircle(cx, cy, r, paint)
        paint.shader = null
    }

    private fun aurora(c: Canvas, w: Float, h: Float, t: Float, p: Palette) {
        for (i in 0..2) {
            val ph = i * 2.1f
            blob(
                c,
                w * (0.2f + 0.3f * i + 0.12f * sin(t * 0.00035f + ph)),
                h * (0.35f + 0.22f * cos(t * 0.0003f + ph)),
                w * 0.55f,
                if (i % 2 == 0) p.glow else p.accent, 0x40,
            )
        }
    }

    private fun waves(c: Canvas, w: Float, h: Float, t: Float, p: Palette) {
        for (i in 0..2) {
            path.reset()
            path.moveTo(0f, h)
            var x = 0f
            while (x <= w + 12f) {
                val y = h * (0.45f + 0.15f * i) + h * 0.07f * sin(x / w * 2f * PI.toFloat() * (1.2f + i * 0.4f) + t * 0.0012f * (1f + i * 0.3f))
                path.lineTo(x, y)
                x += 12f
            }
            path.lineTo(w, h)
            path.close()
            paint.color = ColorUtils.setAlphaComponent(if (i == 1) p.glow else p.accent, 0x30)
            c.drawPath(path, paint)
        }
    }

    private fun fire(c: Canvas, w: Float, h: Float, t: Float, p: Palette) {
        for (i in 0 until 7) {
            val life = ((t * 0.00035f) + i / 7f) % 1f
            val x = w * ((i * 0.37f + 0.08f * sin(t * 0.001f + i)) % 1f)
            blob(c, x, h * (1.1f - life * 1.2f), w * (0.28f - 0.16f * life), if (i % 2 == 0) p.glow else p.accent, (0x55 * (1f - life)).toInt())
        }
    }

    private fun rain(c: Canvas, w: Float, h: Float, t: Float, p: Palette, density: Float) {
        val cols = 16
        paint.textSize = 13f * density
        paint.textAlign = Paint.Align.CENTER
        val glyphs = "01アイウエオ"
        for (i in 0 until cols) {
            val x = w * (i + 0.5f) / cols
            val speed = 0.00018f + (i % 5) * 0.00004f
            val head = ((t * speed) + i * 0.173f) % 1f
            for (j in 0 until 7) {
                val y = (head * (h + 7 * 15f * density)) - j * 15f * density
                paint.color = ColorUtils.setAlphaComponent(p.glow, (0x66 * (1f - j / 7f)).toInt())
                c.drawText(glyphs[(i + j) % glyphs.length].toString(), x, y, paint)
            }
        }
    }

    private fun rainbow(c: Canvas, w: Float, h: Float, t: Float) {
        val colors = IntArray(6) { k ->
            hsv[0] = ((t * 0.02f) + k * 60f) % 360f; hsv[1] = 0.7f; hsv[2] = 1f
            ColorUtils.setAlphaComponent(Color.HSVToColor(hsv), 0x40)
        }
        paint.shader = LinearGradient(0f, 0f, w, h, colors, null, Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, paint)
        paint.shader = null
    }

    private fun stars(c: Canvas, w: Float, h: Float, t: Float, p: Palette) {
        for (i in 0 until 40) {
            // Fixed positions from the index, twinkling with time.
            val x = w * (((i * 7919) % 1000) / 1000f)
            val y = h * (((i * 6271) % 1000) / 1000f)
            val a = (0x30 + 0x70 * (0.5f + 0.5f * sin(t * 0.002f + i))).toInt()
            paint.color = ColorUtils.setAlphaComponent(if (i % 5 == 0) p.accent else p.glow, a)
            c.drawCircle(x, y, 1.5f + (i % 3), paint)
        }
        val m = (t * 0.0004f) % 1f
        paint.strokeWidth = 3f
        paint.color = ColorUtils.setAlphaComponent(p.glow, (0x80 * (1f - m)).toInt())
        c.drawLine(w * m * 1.4f, h * m * 0.8f, w * m * 1.4f - 60f, h * m * 0.8f - 30f, paint)
    }

    private fun glow(c: Canvas, w: Float, h: Float, t: Float, p: Palette) {
        for (i in 0 until 12) {
            val x = w * ((0.07f * i + 0.04f * sin(t * 0.0005f + i * 1.7f) + 0.3f * i) % 1f)
            val y = h * (0.5f + 0.4f * sin(t * 0.0004f + i * 2.3f))
            blob(c, x, y, w * (0.07f + 0.02f * (i % 3)), if (i % 3 == 0) p.accent else p.glow, (0x30 + 0x30 * sin(t * 0.001f + i)).toInt().coerceIn(0, 0xFF))
        }
    }

    private fun grid(c: Canvas, w: Float, h: Float, t: Float, p: Palette, density: Float) {
        paint.strokeWidth = 1f * density
        paint.color = ColorUtils.setAlphaComponent(p.glow, 0x28)
        val step = 36f * density
        val off = (t * 0.02f) % step
        var x = -off
        while (x < w) { c.drawLine(x, 0f, x, h, paint); x += step }
        var y = off
        while (y < h) { c.drawLine(0f, y, w, y, paint); y += step }
        val scan = ((t * 0.0004f) % 1f) * h
        paint.color = ColorUtils.setAlphaComponent(p.accent, 0x50)
        paint.strokeWidth = 2f * density
        c.drawLine(0f, scan, w, scan, paint)
    }
}
