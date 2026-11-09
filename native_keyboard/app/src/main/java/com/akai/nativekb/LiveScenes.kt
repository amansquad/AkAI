package com.akai.nativekb

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RadialGradient
import android.graphics.LinearGradient
import android.graphics.RectF
import android.graphics.Shader
import androidx.core.graphics.ColorUtils
import java.util.Random
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.pow
import kotlin.math.sign
import kotlin.math.sin

/**
 * The animated theme backgrounds, ported scene by scene from the Flutter app's
 * live_theme_background.dart: the same fixed colours, shapes and timing. Each
 * scene paints its own dark background, so nothing from the palette is used.
 *
 * [time] runs 0..1 and repeats every 20 seconds, like the Flutter animation
 * controller. Coordinates are in dp (the caller scales the canvas).
 */
object LiveScenes {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()
    private val rect = RectF()
    private val addMode = PorterDuffXfermode(PorterDuff.Mode.ADD)

    private fun c(argb: Long) = argb.toInt()
    private fun a(color: Int, opacity: Float) = ColorUtils.setAlphaComponent(color, (opacity * 255f).toInt().coerceIn(0, 255))
    private fun hsl(alpha: Float, hue: Float, s: Float, l: Float): Int =
        ColorUtils.setAlphaComponent(ColorUtils.HSLToColor(floatArrayOf(((hue % 360f) + 360f) % 360f, s, l)), (alpha * 255f).toInt().coerceIn(0, 255))

    private fun reset() { paint.shader = null; paint.xfermode = null; paint.style = Paint.Style.FILL; paint.strokeWidth = 1f; paint.strokeCap = Paint.Cap.BUTT }
    private fun fill(canvas: Canvas, l: Float, t: Float, r: Float, b: Float, color: Int) {
        reset(); paint.color = color; canvas.drawRect(l, t, r, b, paint)
    }
    private fun vGradient(canvas: Canvas, w: Float, h: Float, top: Int, bottom: Int, y0: Float = 0f, y1: Float = h) {
        reset()
        paint.shader = LinearGradient(w / 2f, y0, w / 2f, y1, top, bottom, Shader.TileMode.CLAMP)
        canvas.drawRect(0f, y0, w, y1, paint)
        reset()
    }
    private fun glow(canvas: Canvas, cx: Float, cy: Float, r: Float, vararg colors: Int, add: Boolean = false) {
        reset()
        paint.shader = RadialGradient(cx, cy, max(r, 0.1f), colors, null, Shader.TileMode.CLAMP)
        if (add) paint.xfermode = addMode
        canvas.drawCircle(cx, cy, r, paint)
        reset()
    }
    private fun dot(canvas: Canvas, cx: Float, cy: Float, r: Float, color: Int) {
        reset(); paint.color = color; canvas.drawCircle(cx, cy, r, paint)
    }
    private fun line(canvas: Canvas, x0: Float, y0: Float, x1: Float, y1: Float, color: Int, width: Float, round: Boolean = false) {
        reset(); paint.color = color; paint.strokeWidth = width
        if (round) paint.strokeCap = Paint.Cap.ROUND
        canvas.drawLine(x0, y0, x1, y1, paint)
    }
    private fun stroke(canvas: Canvas, p: Path, color: Int, width: Float) {
        reset(); paint.style = Paint.Style.STROKE; paint.color = color; paint.strokeWidth = width; canvas.drawPath(p, paint); reset()
    }

    /** Picks the scene exactly as the Flutter painter does, in the same order. */
    fun paint(canvas: Canvas, w: Float, h: Float, time: Float, type: String) {
        val t = type.lowercase()
        when {
            t.contains("prism") -> prism(canvas, w, h, time)
            t.contains("fireflies") -> fireflies(canvas, w, h, time)
            t.contains("lava_lamp") -> lavaLamp(canvas, w, h, time)
            t.contains("circuit") -> circuitBoard(canvas, w, h, time)
            t.contains("geometric") -> geometricFlow(canvas, w, h, time)
            t.contains("starfield") || t.contains("hyperspace") -> starfield(canvas, w, h, time)
            t.contains("meteor") -> meteorShower(canvas, w, h, time)
            t.contains("firework") -> fireworks(canvas, w, h, time)
            t.contains("bokeh") -> bokeh(canvas, w, h, time)
            t.contains("ripple") || t.contains("zen") -> ripples(canvas, w, h, time)
            t.contains("glitch") -> glitch(canvas, w, h, time)
            t.startsWith("fb_") || t.startsWith("club_") -> FootballScene.paint(canvas, w, h, time, t)
            t.contains("cyberpunk") -> cyberpunk(canvas, w, h, time)
            t.contains("matrix") || t.contains("binary") -> matrix(canvas, w, h, time)
            t.contains("fire") || t.contains("lava") || t.contains("flame") -> fire(canvas, w, h, time)
            t.contains("storm") || t.contains("thunder") -> thunderstorm(canvas, w, h, time)
            t.contains("petal") || t.contains("blossom") || t.contains("cherry") -> cherryBlossom(canvas, w, h, time)
            t.contains("rainbow") -> rainbow(canvas, w, h, time)
            t.contains("snow") || t.contains("crystal") -> snowfall(canvas, w, h, time)
            t.contains("autumn") || t.contains("leaf") -> autumn(canvas, w, h, time)
            t.contains("aurora") || t.contains("nebula") || t.contains("galaxy") || t.contains("star") ||
                t.contains("reg_") || t.contains("ortho_lalibela") -> aurora(canvas, w, h, time)
            t.contains("ocean") || t.contains("water") || t.contains("bubble") || t.contains("sea") -> ocean(canvas, w, h, time)
            t.contains("solar") || t.contains("eth_flag") || t.contains("ortho_axum") -> solar(canvas, w, h, time)
            t.contains("neon") || t.contains("pulse") || t.contains("geo") -> neonPulse(canvas, w, h, time)
            t.startsWith("ortho_") || t.contains("meskel") || t.contains("timkat") || t.startsWith("faith") -> holyRays(canvas, w, h, time)
            t.startsWith("islam_") || t.contains("lantern") -> crescentNight(canvas, w, h, time)
            else -> aurora(canvas, w, h, time) // never a static colour
        }
    }

    // ── Iridescent holographic sheen ────────────────────────────────────────
    private fun prism(canvas: Canvas, w: Float, h: Float, time: Float) {
        reset()
        paint.shader = LinearGradient(0f, 0f, w, h, intArrayOf(c(0xFF0B0A1A), c(0xFF120A1E), c(0xFF0A0F1E)), null, Shader.TileMode.CLAMP)
        canvas.drawRect(0f, 0f, w, h, paint); reset()

        val bandCount = 7
        canvas.save()
        canvas.translate(w / 2f, h / 2f)
        canvas.rotate(((PI / 5 + sin(time * 0.08) * 0.15) * 180 / PI).toFloat())
        val bandW = w * 1.6f
        for (i in 0 until bandCount) {
            val hue = (time * 26 + i * (360f / bandCount)) % 360f
            val offset = (sin(time * 0.3 + i) * 40).toFloat()
            val color = hsl(0.16f, hue, 0.9f, 0.62f)
            val top = -h + (i * (2 * h) / bandCount) + offset
            reset()
            paint.shader = LinearGradient(-bandW / 2f, 0f, bandW / 2f, 0f, intArrayOf(a(color, 0f), color, a(color, 0f)), null, Shader.TileMode.CLAMP)
            canvas.drawRect(-bandW / 2f, top, bandW / 2f, top + h / bandCount + 10f, paint)
        }
        canvas.restore()
        reset()

        val rnd = Random(7)
        for (i in 0 until 50) {
            val gx = rnd.nextDouble().toFloat() * w
            val gy = rnd.nextDouble().toFloat() * h
            val hue = (rnd.nextDouble() * 360 + time * 40).toFloat()
            val twinkle = (0.4 + 0.6 * abs(sin(time * 3 + gx * 0.05))).toFloat()
            dot(canvas, gx, gy, (0.6f + rnd.nextDouble().toFloat() * 1.6f) * twinkle, hsl(0.75f * twinkle, hue, 0.9f, 0.85f))
        }
    }

    // ── Matrix rain, in Ethiopic letters ────────────────────────────────────
    private const val GLYPHS = "ሀሁሂሃሄህሆለሉሊላሌልሎሐሑሒሓሔሕሖመሙሚማሜምሞረሩሪራሬርሮሰሱሲሳሴስሶሸሹሺሻሼሽሾ" +
        "ቀቁቂቃቄቅቆበቡቢባቤብቦተቱቲታቴትቶነኑኒናኔንኖአኡኢኣኤእኦከኩኪካኬክኮወዉዊዋዌውዎዘዙዚዛዜዝዞ" +
        "የዩዪያዬይዮደዱዲዳዴድዶገጉጊጋጌግጎፈፉፊፋፌፍፎ0123456789"
    private val glyphPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = android.graphics.Typeface.create(android.graphics.Typeface.MONOSPACE, android.graphics.Typeface.BOLD)
    }

    private fun matrix(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF0D0208))

        // Subtle grid dots
        val spacing = 20f
        reset(); paint.color = c(0x0A00FF41)
        var x = 0f
        while (x < w) {
            var y = 0f
            while (y < h) {
                canvas.drawCircle(x, y, (1.0 + sin(time * 6.28 + (x + y) * 0.01) * 0.5).toFloat(), paint)
                y += spacing
            }
            x += spacing
        }

        val charSize = 10f
        val cols = kotlin.math.ceil(w / charSize).toInt()
        val trail = 20
        val levels = 8
        glyphPaint.textSize = charSize
        for (i in 0 until cols) {
            val speedFactor = 1.0 + ((i * 13 + i * i) % 20) / 15.0
            val baseSpeed = 450.0 * speedFactor
            for (segment in 0 until 3) {
                val phaseOffset = (i * 157 + segment * (h / 1.5)) % 4000
                val totalY = (time * baseSpeed + phaseOffset) % (h + trail * charSize + 500)
                val headY = (totalY - trail * charSize).toFloat()
                for (j in 0 until trail) {
                    val cy = headY + j * charSize
                    if (cy < -charSize || cy > h + charSize) continue
                    val isHead = j == trail - 1
                    val level = ((j.toFloat() / trail) * levels).toInt()
                    glyphPaint.color = if (isHead) a(0xFFFFFFFF.toInt(), 0.9f) else a(c(0xFF00FF41), (level.toFloat() / levels) * 0.7f)
                    glyphPaint.textSize = if (isHead) 12f else 10f
                    val ch = GLYPHS[(i + j + (time * 5).toInt()) % GLYPHS.length].toString()
                    canvas.drawText(ch, i * charSize, cy + charSize, glyphPaint)
                }
            }
        }
        // Top glow
        reset()
        paint.shader = LinearGradient(w / 2f, 0f, w / 2f, h * 0.4f, c(0x1500FF41), 0, Shader.TileMode.CLAMP)
        canvas.drawRect(0f, 0f, w, h * 0.4f, paint); reset()
    }

    private fun fire(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF0F0404))
        val random = Random(42)
        for (i in 0 until 40) {
            val t = ((time + random.nextDouble()) % 1.0).toFloat()
            val x = random.nextDouble().toFloat() * w
            val baseY = h - (t * h * 1.2f)
            val size = 20f + random.nextDouble().toFloat() * 40f
            glow(canvas, x, baseY, size, a(c(0xFFFF4D00), 0.4f * (1f - t)), a(c(0xFFFF9500), 0f))
        }
    }

    private fun rainbow(canvas: Canvas, w: Float, h: Float, time: Float) {
        val colors = intArrayOf(c(0xFFF44336), c(0xFFFF9800), c(0xFFFFEB3B), c(0xFF4CAF50), c(0xFF2196F3), c(0xFF3F51B5), c(0xFF9C27B0))
        reset()
        paint.shader = LinearGradient(
            w / 2f * (4f * time - 1f), 0f, w / 2f * (3f + 4f * time), h, colors, null, Shader.TileMode.MIRROR,
        )
        canvas.drawRect(0f, 0f, w, h, paint); reset()
    }

    private fun aurora(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF020024))
        val tops = intArrayOf(c(0xFF00D4FF), c(0xFF09FF00), c(0xFFBD00FF))
        for (i in 0 until 3) {
            val t = time + i * 0.3f
            path.reset()
            path.moveTo(0f, h * 0.5f)
            var x = 0f
            while (x < w) {
                path.lineTo(x, (h * 0.5 + sin(x * 0.01 + t * 2) * 50 * cos(t + x * 0.005)).toFloat())
                x += 10f
            }
            path.lineTo(w, h); path.lineTo(0f, h); path.close()
            reset()
            paint.shader = LinearGradient(w / 2f, 0f, w / 2f, h, a(tops[i], 0.3f), 0, Shader.TileMode.CLAMP)
            canvas.drawPath(path, paint); reset()
        }
    }

    private fun ocean(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF001233))
        for (i in 0 until 4) {
            val t = time * 0.5f + i * 0.2f
            path.reset()
            val baseY = h * 0.6f + i * 40f
            path.moveTo(0f, baseY)
            var x = 0f
            while (x <= w) {
                path.lineTo(x, (baseY + sin(x * 0.02 + t * 5) * 15).toFloat())
                x += 20f
            }
            path.lineTo(w, h); path.lineTo(0f, h); path.close()
            reset(); paint.color = a(c(0xFF0077B6), 0.2f); canvas.drawPath(path, paint)
        }
    }

    private fun solar(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF1A0000))
        glow(canvas, w * 0.5f, h * 0.4f, w * 0.8f,
            a(c(0xFFFFD700), (0.6 + sin(time * 10) * 0.1).toFloat()), a(c(0xFFFF4500), 0.3f), 0)
    }

    private fun snowfall(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF000814))
        val random = Random(123)
        reset(); paint.color = a(0xFFFFFFFF.toInt(), 0.6f)
        for (i in 0 until 60) {
            val t = ((time * 0.2 + random.nextDouble()) % 1.0).toFloat()
            val x = (((random.nextDouble() * w + sin(time * 2 + i) * 30) % w) + w) % w
            canvas.drawCircle(x.toFloat(), t * h, 1f + random.nextDouble().toFloat() * 2f, paint)
        }
    }

    private fun autumn(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF1C0A00))
        val random = Random(456)
        val colors = intArrayOf(c(0xFFD4A017), c(0xFF8B4513), c(0xFFA52A2A))
        for (i in 0 until 20) {
            val t = ((time * 0.15 + random.nextDouble()) % 1.0).toFloat()
            val x = (((random.nextDouble() * w + cos(time + i) * 50) % w) + w) % w
            reset(); paint.color = a(colors[i % 3], 0.7f * (1f - t * 0.5f))
            canvas.save()
            canvas.translate(x.toFloat(), t * h)
            canvas.rotate(((time * 2 + i) * 180 / PI).toFloat())
            rect.set(0f, 0f, 12f, 6f); canvas.drawOval(rect, paint)
            canvas.restore()
        }
    }

    private fun cyberpunk(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF0D0208))
        val horizonY = h * 0.4f
        val speed = (time * 100) % 60
        var y = horizonY
        while (y < h + 60) {
            val adjusted = y + speed
            if (adjusted > horizonY) {
                val pf = (adjusted - horizonY) / (h - horizonY)
                line(canvas, 0f, adjusted, w, adjusted, a(c(0xFFFF00FF), 0.2f + pf * 0.4f), 1f + pf * 2f)
            }
            y += 30f
        }
        var x = -w
        while (x < w * 2) {
            line(canvas, w / 2f, horizonY, x, h, a(c(0xFF00FFFF), 0.2f), 1.5f)
            x += 40f
        }
        reset()
        paint.shader = LinearGradient(
            w / 2f, horizonY - 40f, w / 2f, horizonY + 40f,
            intArrayOf(a(c(0xFFFF00FF), 0f), a(c(0xFFFF00FF), 0.8f), a(c(0xFF00FFFF), 0.4f)), null, Shader.TileMode.CLAMP,
        )
        canvas.drawRect(0f, horizonY - 2f, w, horizonY + 2f, paint); reset()
        if (sin(time * 20) > 0.8) fill(canvas, 0f, (time * 300) % h, w, (time * 300) % h + 2f, a(0xFFFFFFFF.toInt(), 0.1f))
    }

    private fun thunderstorm(canvas: Canvas, w: Float, h: Float, time: Float) {
        val random = Random(time.toInt().toLong())
        fill(canvas, 0f, 0f, w, h, c(0xFF0A0A0F))
        if (sin(time * 15) > 0.95 && random.nextDouble() > 0.5) {
            fill(canvas, 0f, 0f, w, h, a(0xFFFFFFFF.toInt(), 0.15f))
            path.reset()
            path.moveTo(random.nextDouble().toFloat() * w, 0f)
            path.lineTo(random.nextDouble().toFloat() * w, h * 0.4f)
            path.lineTo(random.nextDouble().toFloat() * w, h * 0.7f)
            path.lineTo(random.nextDouble().toFloat() * w, h)
            stroke(canvas, path, a(0xFFFFFFFF.toInt(), 0.5f), 2f)
        }
        for (i in 0 until 40) {
            val r = Random(i.toLong())
            val x = ((r.nextDouble() * w + time * 50) % w).toFloat()
            val y = ((r.nextDouble() * h + time * 600) % h).toFloat()
            line(canvas, x, y, x + 2f, y + 10f, c(0x3DFFFFFF), 1f)
        }
    }

    private fun cherryBlossom(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF1A050D))
        val random = Random(789)
        for (i in 0 until 25) {
            val t = ((time * 0.12 + random.nextDouble()) % 1.0).toFloat()
            val x = (((random.nextDouble() * w + sin(time + i) * 40) % w) + w) % w
            reset(); paint.color = a(c(0xFFFFB7C5), 0.6f * (1f - t * 0.3f))
            canvas.save()
            canvas.translate(x.toFloat(), t * h)
            canvas.rotate(((time * 1.5 + i) * 180 / PI).toFloat())
            rect.set(0f, 0f, 8f, 5f); canvas.drawOval(rect, paint)
            canvas.restore()
        }
    }

    private fun neonPulse(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF0D0208))
        reset(); paint.style = Paint.Style.STROKE; paint.strokeWidth = 2f
        paint.color = a(c(0xFFBD00FF), (0.1 + abs(sin(time * 5)) * 0.2).toFloat())
        for (i in 0 until 10) canvas.drawCircle(w * 0.5f, h * 0.5f, (time * 500 + i * 50) % 600f, paint)
        reset()
    }

    // ── Orthodox faith: golden god-rays and floating holy light ─────────────
    private fun holyRays(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF120A02))
        val cx = w * 0.5f; val cy = -h * 0.1f
        val rot = time * 2 * PI * 0.15
        for (i in 0 until 9) {
            val ang = rot + i * PI / 4.5 + PI * 0.25
            path.reset()
            path.moveTo(cx, cy)
            path.lineTo((cx + cos(ang) * h * 1.4).toFloat(), (cy + sin(ang) * h * 1.4).toFloat())
            path.lineTo((cx + cos(ang + 0.16) * h * 1.4).toFloat(), (cy + sin(ang + 0.16) * h * 1.4).toFloat())
            path.close()
            reset()
            paint.xfermode = addMode
            paint.shader = RadialGradient(cx, cy, h * 1.2f, a(c(0xFFFFD700), 0.14f), 0, Shader.TileMode.CLAMP)
            canvas.drawPath(path, paint); reset()
        }
        val rand = Random(41)
        for (i in 0 until 22) {
            val t = ((time * 0.4 + rand.nextDouble()) % 1.0).toFloat()
            val mx = (((rand.nextDouble() * w + sin(time * 2 + i) * 18) % w) + w) % w
            val my = h - t * h
            val tw = (sin((time * 4 + i) * PI) * 0.5 + 0.5).toFloat()
            dot(canvas, mx.toFloat(), my, 1.5f + tw, a(c(0xFFFFE082), 0.5f * tw * (1 - t)))
        }
        glow(canvas, w * 0.5f, h * 0.4f, w * 0.3f, a(c(0xFFFFD700), 0.12f), 0)
    }

    // ── Islamic faith: crescent moon, stars and warm lanterns ───────────────
    private fun crescentNight(canvas: Canvas, w: Float, h: Float, time: Float) {
        vGradient(canvas, w, h, c(0xFF07103A), c(0xFF040817))
        val mx = w * 0.72f; val my = h * 0.24f
        dot(canvas, mx, my, 22f, c(0xFFFFF3D6))
        dot(canvas, mx + 9f, my - 4f, 19f, c(0xFF07103A))
        glow(canvas, mx, my, 40f, a(c(0xFFFFF3D6), 0.2f), 0)
        val rand = Random(43)
        for (i in 0 until 30) {
            val sx = rand.nextDouble().toFloat() * w
            val sy = rand.nextDouble().toFloat() * h * 0.55f
            val tw = (sin((time * 4 + rand.nextDouble() * 4) * PI) * 0.5 + 0.5).toFloat()
            dot(canvas, sx, sy, 0.8f + tw, a(0xFFFFFFFF.toInt(), 0.25f + 0.55f * tw))
        }
        for (i in 0 until 6) {
            val r2 = Random((i * 11 + 3).toLong())
            val t = ((time * 0.5 + r2.nextDouble()) % 1.0).toFloat()
            val lx = (r2.nextDouble() * w + sin(time * 2 * PI + i) * 14).toFloat()
            val ly = h - t * h * 1.1f
            val gl = (sin((time * 6 + i) * PI) * 0.5 + 0.5).toFloat()
            glow(canvas, lx, ly, 14f, a(c(0xFFFFB74D), 0.35f * (0.6f + gl * 0.4f)), 0)
            reset(); paint.color = a(c(0xFFFF9800), 0.8f * (1 - t * 0.4f))
            rect.set(lx - 3.5f, ly - 5.5f, lx + 3.5f, ly + 5.5f); canvas.drawRoundRect(rect, 3f, 3f, paint)
        }
    }

    private fun fireflies(canvas: Canvas, w: Float, h: Float, time: Float) {
        vGradient(canvas, w, h, c(0xFF01140A), c(0xFF06301C))
        path.reset(); path.moveTo(0f, h)
        var x = 0f
        while (x <= w) { path.lineTo(x, (h - 14 - sin(x * 0.08) * 8).toFloat()); x += 24f }
        path.lineTo(w, h); path.close()
        reset(); paint.color = c(0xFF010D06); canvas.drawPath(path, paint)

        val rand = Random(7)
        for (i in 0 until 24) {
            val sx = rand.nextDouble(); val sy = rand.nextDouble()
            val phase = rand.nextDouble() * 2 * PI
            val px = ((((sx * w + sin(time * 2 * PI * 0.6 + phase) * 42 + cos(time * 2 * PI * 0.23 + phase * 2) * 26) % w) + w) % w).toFloat()
            val py = ((((sy * h + cos(time * 2 * PI * 0.4 + phase) * 30) % h) + h) % h).toFloat()
            val blink = (sin(time * 2 * PI * (1.2 + sx) + phase) * 0.5 + 0.5).pow(3).toFloat()
            if (blink < 0.05f) continue
            glow(canvas, px, py, 9f + blink * 6f, a(c(0xFFD4FF50), 0.30f * blink), 0)
            dot(canvas, px, py, 1.4f + blink * 1.2f, a(c(0xFFF4FFB0), 0.3f + 0.7f * blink))
        }
    }

    private fun lavaLamp(canvas: Canvas, w: Float, h: Float, time: Float) {
        vGradient(canvas, w, h, c(0xFF2A0A02), c(0xFF48120A))
        val rand = Random(11)
        for (i in 0 until 6) {
            val sx = 0.12 + rand.nextDouble() * 0.76
            val speed = 0.25 + rand.nextDouble() * 0.35
            val phase = rand.nextDouble() * 2 * PI
            val tt = (time * speed + phase / (2 * PI)) % 1.0
            val yy = 0.5 - 0.42 * cos(tt * 2 * PI)
            val cx = (sx * w + sin(time * 2 * PI * 0.3 + phase) * 12).toFloat()
            val cy = (yy * h).toFloat()
            val wobble = 1.0 + sin(time * 2 * PI * 1.4 + phase) * 0.12
            val r = ((26 + rand.nextDouble() * 26) * wobble).toFloat()
            glow(canvas, cx, cy, r * 1.6f, a(c(0xFFFF6B1A), 0.55f), a(c(0xFFFF2E63), 0.18f), 0, add = true)
        }
        vGradient(canvas, w, h, 0, a(c(0xFFFFB01A), 0.20f), h * 0.75f, h)
    }

    private fun circuitBoard(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF03140A))
        val green = c(0xFF16A34A)
        val rand = Random(19)
        for (i in 0 until 12) {
            val x0 = rand.nextDouble().toFloat() * w
            val y0 = rand.nextDouble().toFloat() * h
            val dx = (rand.nextDouble().toFloat() - 0.5f) * w * 0.7f
            val dy = (rand.nextDouble().toFloat() - 0.5f) * h * 0.7f
            val p1x = x0 + dx; val p1y = y0
            val p2x = x0 + dx; val p2y = y0 + dy
            line(canvas, x0, y0, p1x, p1y, a(green, 0.28f), 1.6f)
            line(canvas, p1x, p1y, p2x, p2y, a(green, 0.28f), 1.6f)
            dot(canvas, x0, y0, 2.4f, a(green, 0.5f))
            dot(canvas, p2x, p2y, 2.4f, a(green, 0.5f))
            val len1 = abs(dx); val len2 = abs(dy); val total = len1 + len2
            val sp = 0.6 + rand.nextDouble() * 0.8
            val off = rand.nextDouble()
            if (total < 1f) continue
            val tt = ((time * sp + off) % 1.0).toFloat()
            val d = tt * total
            val px: Float; val py: Float
            if (d < len1) { px = x0 + sign(dx) * d; py = y0 } else { px = x0 + dx; py = y0 + sign(dy) * (d - len1) }
            glow(canvas, px, py, 5f, a(c(0xFF4ADE80), 0.8f), 0)
            dot(canvas, px, py, 1.6f, c(0xFFBBF7D0))
        }
    }

    private fun geometricFlow(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF0A0A0A))
        val rand = Random(23)
        val palette = intArrayOf(c(0xFF3B82F6), c(0xFF60A5FA), c(0xFF93C5FD), 0xFFFFFFFF.toInt())
        for (i in 0 until 14) {
            val sx = rand.nextDouble()
            val speed = 0.08 + rand.nextDouble() * 0.12
            val tt = ((time * speed + rand.nextDouble()) % 1.0).toFloat()
            val cx = (sx * w + sin(time * 2 * PI * 0.2 + i) * 20).toFloat()
            val cy = h * (1.1f - tt * 1.2f)
            val r = 10f + rand.nextDouble().toFloat() * 26f
            val sides = 3 + (i % 4)
            val rot = time * 2 * PI * (0.1 + rand.nextDouble() * 0.15) + rand.nextDouble() * PI
            val color = a(palette[i % 4], 0.10f + 0.25f * (1f - abs(tt - 0.5f) * 2f))
            path.reset()
            for (v in 0..sides) {
                val ang = rot + v * 2 * PI / sides
                val px = (cx + cos(ang) * r).toFloat(); val py = (cy + sin(ang) * r).toFloat()
                if (v == 0) path.moveTo(px, py) else path.lineTo(px, py)
            }
            stroke(canvas, path, color, 1.4f)
        }
    }

    private fun starfield(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF02030A))
        val cx = w * 0.5f; val cy = h * 0.42f
        val maxDist = max(w, h) * 0.75f
        val rand = Random(29)
        for (i in 0 until 90) {
            val angle = rand.nextDouble() * 2 * PI
            val speed = 0.35 + rand.nextDouble() * 0.65
            val tt = ((time * speed * 2 + rand.nextDouble()) % 1.0).toFloat()
            val d = tt * tt * maxDist
            val dx = cos(angle).toFloat(); val dy = sin(angle).toFloat()
            val tail = max(0f, d - 6f - tt * 26f)
            val o = (0.15f + tt * 0.85f).coerceIn(0f, 1f)
            val col = ColorUtils.blendARGB(c(0xFF93C5FD), 0xFFFFFFFF.toInt(), tt)
            line(canvas, cx + dx * tail, cy + dy * tail, cx + dx * d, cy + dy * d, a(col, o), 0.8f + tt * 1.8f, round = true)
        }
    }

    private fun meteorShower(canvas: Canvas, w: Float, h: Float, time: Float) {
        vGradient(canvas, w, h, c(0xFF060B22), c(0xFF0B1026))
        val rand = Random(31)
        for (i in 0 until 40) {
            val sx = rand.nextDouble().toFloat() * w
            val sy = rand.nextDouble().toFloat() * h * 0.8f
            val tw = (sin((time * 3 + rand.nextDouble() * 6) * PI) * 0.5 + 0.5).toFloat()
            dot(canvas, sx, sy, 0.7f + tw * 0.9f, a(0xFFFFFFFF.toInt(), 0.2f + 0.5f * tw))
        }
        for (i in 0 until 4) {
            val r2 = Random((i * 17 + 5).toLong())
            val cycle = ((time * (0.55 + r2.nextDouble() * 0.3) + r2.nextDouble()) % 1.0).toFloat()
            if (cycle > 0.30f) continue
            val p = cycle / 0.30f
            val startX = r2.nextDouble().toFloat() * w * 1.2f
            val startY = -20f + r2.nextDouble().toFloat() * h * 0.25f
            val travel = 260f + r2.nextDouble().toFloat() * 160f
            val dirX = -0.82f; val dirY = 0.57f
            val hx = startX + dirX * travel * p; val hy = startY + dirY * travel * p
            val tailLen = 55f + 40f * (1 - p)
            val tx = hx - dirX * tailLen; val ty = hy - dirY * tailLen
            val fade = (1 - p) * 0.9f
            reset()
            paint.shader = LinearGradient(tx, ty, hx, hy, 0, a(c(0xFFFDE68A), fade), Shader.TileMode.CLAMP)
            paint.strokeWidth = 2.2f; paint.strokeCap = Paint.Cap.ROUND
            canvas.drawLine(tx, ty, hx, hy, paint); reset()
            glow(canvas, hx, hy, 6f, a(0xFFFFFFFF.toInt(), fade), 0)
        }
    }

    private fun fireworks(canvas: Canvas, w: Float, h: Float, time: Float) {
        vGradient(canvas, w, h, c(0xFF0B0614), c(0xFF160B24))
        val colors = intArrayOf(c(0xFFF472B6), c(0xFFFBBF24), c(0xFF60A5FA), c(0xFF4ADE80), c(0xFFF87171))
        for (i in 0 until 3) {
            val speed = 0.45 + i * 0.13
            val t0 = time * speed + i * 0.37
            val cycle = (t0 % 1.0).toFloat()
            val burstSeed = floor(t0).toInt() * 7 + i * 13
            val r2 = Random(burstSeed.toLong())
            val cx = w * (0.15f + r2.nextDouble().toFloat() * 0.7f)
            val cy = h * (0.15f + r2.nextDouble().toFloat() * 0.35f)
            val color = colors[abs(burstSeed) % colors.size]
            if (cycle < 0.28f) {
                val p = cycle / 0.28f
                val y = h - (h - cy) * p
                dot(canvas, cx, y, 2f, a(0xFFFFFFFF.toInt(), 0.85f))
                line(canvas, cx, y + 4f, cx, y + 16f, a(c(0xFFFBBF24), 0.5f * (1 - p)), 1.5f)
            } else {
                val p = ((cycle - 0.28f) / 0.72f).coerceIn(0f, 1f)
                val radius = p * (60f + r2.nextDouble().toFloat() * 40f)
                val fade = 1 - p
                for (s in 0 until 18) {
                    val ang = s * 2 * PI / 18 + r2.nextDouble() * 0.2
                    val droop = p * p * 26f
                    line(
                        canvas,
                        (cx + cos(ang) * radius * 0.72).toFloat(), (cy + sin(ang) * radius * 0.72 + droop * 0.8).toFloat(),
                        (cx + cos(ang) * radius).toFloat(), (cy + sin(ang) * radius + droop).toFloat(),
                        a(color, 0.85f * fade), 1.6f, round = true,
                    )
                }
                glow(canvas, cx, cy, max(radius * 0.35f, 0.5f), a(color, 0.35f * fade), 0)
            }
        }
    }

    private fun bokeh(canvas: Canvas, w: Float, h: Float, time: Float) {
        vGradient(canvas, w, h, c(0xFF130C07), c(0xFF221207))
        val colors = intArrayOf(c(0xFFFFB84D), c(0xFFFF7B9C), c(0xFF7DD3FC), c(0xFFFDE68A))
        val rand = Random(37)
        for (i in 0 until 16) {
            val sx = rand.nextDouble(); val sy = rand.nextDouble()
            val phase = rand.nextDouble() * 2 * PI
            val x = (sx * w + sin(time * 2 * PI * 0.15 + phase) * 30).toFloat()
            val y = (sy * h + cos(time * 2 * PI * 0.11 + phase) * 22).toFloat()
            val pulse = (sin(time * 2 * PI * 0.5 + phase) * 0.5 + 0.5).toFloat()
            val r = 16f + rand.nextDouble().toFloat() * 34f
            val col = colors[i % colors.size]
            glow(canvas, x, y, r, a(col, 0.10f + 0.10f * pulse), a(col, 0.03f), 0, add = true)
        }
    }

    private fun ripples(canvas: Canvas, w: Float, h: Float, time: Float) {
        vGradient(canvas, w, h, c(0xFF032422), c(0xFF06403A))
        for (i in 0 until 3) {
            path.reset(); path.moveTo(0f, h * (0.25f + i * 0.25f))
            var x = 0f
            while (x <= w) {
                path.lineTo(x, (h * (0.25f + i * 0.25f) + sin(x * 0.02 + time * 2 * PI + i * 2) * 10).toFloat())
                x += 16f
            }
            stroke(canvas, path, a(c(0xFF34D399), 0.05f), 8f)
        }
        val rand = Random(41)
        for (i in 0 until 7) {
            val cx = rand.nextDouble().toFloat() * w
            val cy = rand.nextDouble().toFloat() * h
            val speed = 0.35 + rand.nextDouble() * 0.3
            val tt = ((time * speed + rand.nextDouble()) % 1.0).toFloat()
            val maxR = 40f + rand.nextDouble().toFloat() * 50f
            val fade = (1 - tt) * 0.4f
            reset(); paint.style = Paint.Style.STROKE
            paint.strokeWidth = 1.6f * (1 - tt) + 0.4f
            paint.color = a(c(0xFF6EE7B7), fade)
            canvas.drawCircle(cx, cy, tt * maxR, paint)
            if (tt > 0.25f) { paint.color = a(c(0xFF6EE7B7), fade * 0.5f); canvas.drawCircle(cx, cy, (tt - 0.25f) * maxR, paint) }
            reset()
        }
    }

    private fun glitch(canvas: Canvas, w: Float, h: Float, time: Float) {
        fill(canvas, 0f, 0f, w, h, c(0xFF060606))
        var y = (time * 30) % 6
        while (y < h) { fill(canvas, 0f, y, w, y + 1f, a(0xFFFFFFFF.toInt(), 0.025f)); y += 6f }
        val frame = floor(time * 8).toInt()
        val rand = Random(frame.toLong())
        val slices = 2 + rand.nextInt(3)
        for (i in 0 until slices) {
            val sy = rand.nextDouble().toFloat() * h
            val sh = 4f + rand.nextDouble().toFloat() * 18f
            val shift = (rand.nextDouble().toFloat() - 0.5f) * 44f
            fill(canvas, shift, sy, shift + w, sy + sh, a(c(0xFFFF2E63), 0.16f))
            fill(canvas, -shift, sy + sh * 0.4f, -shift + w, sy + sh * 0.4f + sh * 0.7f, a(c(0xFF22D3EE), 0.16f))
        }
        reset(); paint.color = a(0xFFFFFFFF.toInt(), 0.12f)
        for (i in 0 until 60) {
            val nx = rand.nextDouble().toFloat() * w; val ny = rand.nextDouble().toFloat() * h
            canvas.drawRect(nx, ny, nx + 1.6f, ny + 1.6f, paint)
        }
        if (rand.nextDouble() > 0.72) {
            val ty = rand.nextDouble().toFloat() * h
            fill(canvas, 0f, ty, w, ty + 2f, a(0xFFFFFFFF.toInt(), 0.22f))
        }
    }
}
