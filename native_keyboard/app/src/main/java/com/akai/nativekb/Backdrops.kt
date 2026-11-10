package com.akai.nativekb

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.os.Handler
import android.os.Looper
import kotlin.math.PI
import kotlin.math.max
import kotlin.math.sin

/**
 * The picture behind a theme whose animation name is a picture path (the
 * region flags, Addis Ababa, the Judah lion). As in the Flutter app it fills
 * the keyboard, breathes with a slow zoom, and gets a warm glow; the pictures
 * are bundled (tools/gen-backdrops.mjs) instead of downloaded.
 */
object Backdrops {
    /** Must match assetName() in tools/gen-backdrops.mjs. */
    fun assetName(live: String) = live.replace(Regex("[^A-Za-z0-9]+"), "_").trim('_').lowercase()

    fun isPicture(live: String) = live.startsWith("/")

    private var loadedFor: String? = null
    private var bitmap: Bitmap? = null
    private var loading: String? = null
    /** Pictures that could not be read; not tried again. */
    private val missing = HashSet<String>()
    // Created on first draw, so the name helpers above work in plain JVM tests.
    private val main by lazy { Handler(Looper.getMainLooper()) }
    private val paint by lazy { Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG) }
    private val glow by lazy { Paint(Paint.ANTI_ALIAS_FLAG) }
    private val dst by lazy { RectF() }

    /**
     * Draws [live]'s picture over the whole [w]×[h] area. Returns false while it
     * is still loading (or there is none), so the caller can draw something else;
     * [onReady] is called once it has loaded.
     */
    fun draw(context: Context, canvas: Canvas, w: Float, h: Float, now: Long, live: String, onReady: () -> Unit): Boolean {
        val bmp = if (loadedFor == live) bitmap else null
        if (bmp == null) { if (live !in missing) load(context, live, onReady); return false }

        // Cover the area (centre-crop), breathing between 105% and 115% over 20 s like Flutter's.
        val breathe = 1.1f + 0.05f * sin((now % 20000L) / 20000f * 2f * PI.toFloat())
        val scale = max(w / bmp.width, h / bmp.height) * breathe
        val bw = bmp.width * scale
        val bh = bmp.height * scale
        dst.set((w - bw) / 2f, (h - bh) / 2f, (w + bw) / 2f, (h + bh) / 2f)
        canvas.drawBitmap(bmp, null, dst, paint)

        // The Flutter cultural overlay: a warm golden glow from the centre, here gently pulsing.
        val pulse = 0.75f + 0.25f * sin((now % 6000L) / 6000f * 2f * PI.toFloat())
        glow.shader = RadialGradient(w / 2f, h / 2f, max(w, h) * 0.7f,
            intArrayOf(((0x30 * pulse).toInt() shl 24) or 0xFFD700, 0), null, Shader.TileMode.CLAMP)
        canvas.drawRect(0f, 0f, w, h, glow)
        glow.shader = null

        // Holy Maryam: light rays turning slowly from the icon, as on the web keyboard.
        if (live.contains("maryam")) {
            val cx = w / 2f; val cy = h * 0.42f; val len = max(w, h) * 0.8f
            glow.style = Paint.Style.STROKE; glow.strokeWidth = 15f
            for (i in 0 until 8) {
                val ang = i / 8f * 2f * PI.toFloat() + (now % 60000L) / 60000f * 2f * PI.toFloat()
                val ex = cx + kotlin.math.cos(ang) * len; val ey = cy + sin(ang) * len
                glow.shader = android.graphics.LinearGradient(cx, cy, ex, ey, 0x33FFFFC8, 0, Shader.TileMode.CLAMP)
                canvas.drawLine(cx, cy, ex, ey, glow)
            }
            glow.shader = null; glow.style = Paint.Style.FILL
        }

        // Gold sparkles drifting up, so a picture is never quite still.
        for (i in 0 until 26) {
            val seed = i * 7919
            val x0 = (seed % 1000) / 1000f * w
            val speed = 0.06f + (seed % 37) / 37f * 0.05f
            val life = ((now / 1000f * speed + (seed % 101) / 101f) % 1f)
            val y = h * (1.05f - life * 1.15f)
            val x = x0 + 8f * sin(now / 1000f * 0.9f + i)
            val tw = 0.35f + 0.65f * kotlin.math.abs(sin(now / 1000f * (1.2f + (i % 5) * 0.3f) + i))
            val fade = minOf(1f, life * 5f, (1f - life) * 4f)
            glow.color = (((tw * fade * 230f).toInt().coerceIn(0, 255)) shl 24) or 0xFFE680
            canvas.drawCircle(x, y, 1.2f + (i % 3) * 0.5f, glow)
        }
        return true
    }

    private fun load(context: Context, live: String, onReady: () -> Unit) {
        if (loading == live) return
        loading = live
        val app = context.applicationContext
        Thread {
            val bmp = try {
                app.assets.open("backdrops/${assetName(live)}.webp").use { BitmapFactory.decodeStream(it) }
            } catch (e: Exception) { null }
            main.post {
                if (loading != live) return@post // another theme was chosen meanwhile
                loading = null
                if (bmp == null) missing.add(live)
                else {
                    bitmap?.takeIf { it != bmp }?.recycle()
                    bitmap = bmp
                    loadedFor = live
                    onReady()
                }
            }
        }.start()
    }
}
