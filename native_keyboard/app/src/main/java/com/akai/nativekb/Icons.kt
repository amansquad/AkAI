package com.akai.nativekb

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface
import kotlin.math.cos
import kotlin.math.sin

/** Shows the toolbar again when suggestions have folded it away. */
const val TOOL_MORE = 99

/** Key icons, drawn instead of font glyphs so they look the same in every font. */
const val KEY_SHIFT = 100
const val KEY_SHIFT_ONCE = 101
const val KEY_CAPS_LOCK = 102
const val KEY_BACKSPACE = 103

/**
 * Line icons for the toolbar and the panel's tabs, drawn in the theme's text
 * colour so they match every theme (emoji would bring their own colours).
 * Each is designed on a 24-unit grid and scaled to the size asked for.
 */
object Icons {
    private val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val solid = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }
    private val path = Path()
    private val r = RectF()

    /** Draws icon [id] (a TOOL_ constant) centred on [cx], [cy], [size] pixels across. */
    fun draw(c: Canvas, id: Int, cx: Float, cy: Float, size: Float, color: Int, alpha: Int = 255) {
        val s = size / 24f
        stroke.color = color; stroke.alpha = alpha; stroke.strokeWidth = 1.8f
        solid.color = color; solid.alpha = alpha
        c.save()
        c.translate(cx - 12f * s, cy - 12f * s)
        c.scale(s, s)
        when (id) {
            TOOL_EMOJI -> {
                c.drawCircle(12f, 12f, 9f, stroke)
                c.drawCircle(9f, 10f, 1.2f, solid)
                c.drawCircle(15f, 10f, 1.2f, solid)
                r.set(7.5f, 8f, 16.5f, 16.5f)
                c.drawArc(r, 25f, 130f, false, stroke)
            }
            TOOL_STICKERS -> {
                path.reset()
                path.moveTo(6f, 4f); path.lineTo(15f, 4f); path.lineTo(20f, 9f); path.lineTo(20f, 18f)
                path.quadTo(20f, 20f, 18f, 20f); path.lineTo(6f, 20f); path.quadTo(4f, 20f, 4f, 18f)
                path.lineTo(4f, 6f); path.quadTo(4f, 4f, 6f, 4f); path.close()
                c.drawPath(path, stroke)
                path.reset(); path.moveTo(15f, 4f); path.lineTo(15f, 9f); path.lineTo(20f, 9f)
                c.drawPath(path, stroke)
                r.set(8f, 10f, 15f, 16.5f)
                c.drawArc(r, 20f, 140f, false, stroke)
            }
            TOOL_GIF -> {
                r.set(3f, 6f, 21f, 18f)
                c.drawRoundRect(r, 3f, 3f, stroke)
                solid.textSize = 7.2f
                c.drawText("GIF", 12f, 14.6f, solid)
            }
            TOOL_CLIPBOARD -> {
                r.set(5f, 5f, 19f, 21f)
                c.drawRoundRect(r, 2.2f, 2.2f, stroke)
                r.set(9f, 3f, 15f, 7f)
                c.drawRoundRect(r, 1.5f, 1.5f, stroke)
                c.drawLine(8.5f, 12f, 15.5f, 12f, stroke)
                c.drawLine(8.5f, 16f, 13f, 16f, stroke)
            }
            TOOL_WRITE -> {
                path.reset()
                path.moveTo(15f, 4.5f); path.lineTo(19.5f, 9f); path.lineTo(9f, 19.5f)
                path.lineTo(4.5f, 19.5f); path.lineTo(4.5f, 15f); path.close()
                c.drawPath(path, stroke)
                c.drawLine(12.8f, 6.7f, 17.3f, 11.2f, stroke)
            }
            TOOL_TRANSLATE -> {
                c.drawCircle(12f, 12f, 9f, stroke)
                r.set(8f, 3f, 16f, 21f)
                c.drawOval(r, stroke)
                c.drawLine(3f, 12f, 21f, 12f, stroke)
            }
            TOOL_THEMES -> {
                path.reset()
                // A painter's palette: round, with a thumb hole and three dabs of paint.
                path.moveTo(12f, 3f)
                path.cubicTo(17f, 3f, 21f, 6.5f, 21f, 11f)
                path.cubicTo(21f, 14f, 18.5f, 15f, 16.5f, 15f)
                path.cubicTo(14.5f, 15f, 13.5f, 16.5f, 14.5f, 18f)
                path.cubicTo(15.5f, 19.8f, 14f, 21f, 12f, 21f)
                path.cubicTo(7f, 21f, 3f, 17f, 3f, 12f)
                path.cubicTo(3f, 7f, 7f, 3f, 12f, 3f)
                path.close()
                c.drawPath(path, stroke)
                c.drawCircle(8f, 11f, 1.4f, solid)
                c.drawCircle(11f, 7.3f, 1.4f, solid)
                c.drawCircle(15.5f, 8.5f, 1.4f, solid)
                c.drawCircle(8.5f, 15.5f, 1.4f, solid)
            }
            TOOL_VOICE -> {
                r.set(9f, 3f, 15f, 14f)
                c.drawRoundRect(r, 3f, 3f, stroke)
                r.set(5.5f, 5f, 18.5f, 17f)
                c.drawArc(r, 0f, 180f, false, stroke)
                c.drawLine(12f, 17f, 12f, 21f, stroke)
                c.drawLine(9f, 21f, 15f, 21f, stroke)
            }
            TOOL_SETTINGS -> {
                c.drawCircle(12f, 12f, 3f, stroke)
                c.drawCircle(12f, 12f, 6.8f, stroke)
                stroke.strokeWidth = 2.6f
                for (k in 0 until 8) {
                    val a = Math.toRadians(k * 45.0 + 22.5)
                    c.drawLine(12f + 7.4f * cos(a).toFloat(), 12f + 7.4f * sin(a).toFloat(),
                        12f + 9.6f * cos(a).toFloat(), 12f + 9.6f * sin(a).toFloat(), stroke)
                }
                stroke.strokeWidth = 1.8f
            }
            TOOL_MORE -> {
                for ((x, y) in listOf(4.5f to 4.5f, 13.5f to 4.5f, 4.5f to 13.5f, 13.5f to 13.5f)) {
                    r.set(x, y, x + 6f, y + 6f)
                    c.drawRoundRect(r, 1.6f, 1.6f, stroke)
                }
            }
            // Shift: an outlined arrow when off, filled for the next letter,
            // and filled with a bar beneath it when caps lock is on.
            KEY_SHIFT, KEY_SHIFT_ONCE -> {
                shiftArrow(3.5f, 19.5f)
                if (id == KEY_SHIFT_ONCE) c.drawPath(path, solid)
                c.drawPath(path, stroke)
            }
            KEY_CAPS_LOCK -> {
                shiftArrow(2.5f, 16f)
                c.drawPath(path, solid)
                c.drawPath(path, stroke)
                r.set(7.5f, 19f, 16.5f, 21.4f)
                c.drawRoundRect(r, 1f, 1f, solid)
            }
            // Backspace: a key cap pointing left, with a cross in it.
            KEY_BACKSPACE -> {
                path.reset()
                path.moveTo(8.6f, 5f); path.lineTo(19f, 5f); path.quadTo(21.5f, 5f, 21.5f, 7.5f)
                path.lineTo(21.5f, 16.5f); path.quadTo(21.5f, 19f, 19f, 19f); path.lineTo(8.6f, 19f)
                path.lineTo(2.5f, 12f); path.close()
                c.drawPath(path, stroke)
                c.drawLine(11.6f, 9.4f, 16.8f, 14.6f, stroke)
                c.drawLine(16.8f, 9.4f, 11.6f, 14.6f, stroke)
            }
        }
        c.restore()
    }

    /** Fills [path] with an upward arrow running from [top] down to [bottom]. */
    private fun shiftArrow(top: Float, bottom: Float) {
        val shoulder = top + (bottom - top) * 0.5f
        path.reset()
        path.moveTo(12f, top)
        path.lineTo(20.5f, shoulder); path.lineTo(16f, shoulder)
        path.lineTo(16f, bottom - 1f); path.quadTo(16f, bottom, 15f, bottom)
        path.lineTo(9f, bottom); path.quadTo(8f, bottom, 8f, bottom - 1f)
        path.lineTo(8f, shoulder); path.lineTo(3.5f, shoulder)
        path.close()
    }
}
