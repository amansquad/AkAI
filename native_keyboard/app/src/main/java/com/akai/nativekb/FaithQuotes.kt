package com.akai.nativekb

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import kotlin.math.max
import kotlin.math.min

/**
 * The verse over a faith theme's picture: Amharic from the Bible for the
 * churches and saints, Arabic from the Quran for the mosques. It sits large in
 * the middle of the keyboard with its reference beneath, over a soft pool of
 * shade so it reads on any part of the photo. Arabic runs right to left.
 */
object FaithQuotes {
    class Quote(val text: String, val ref: String)

    private val quotes = mapOf(
        "/faith/lalibela" to Quote("እግዚአብሔር እረኛዬ ነው፥ የሚያሳጣኝም የለም።", "መዝሙረ ዳዊት 23፥1"),
        "/faith/debre_berhan" to Quote("ብርሃናችሁ በሰው ፊት ይብራ።", "ማቴዎስ 5፥16"),
        "/faith/trinity" to Quote("እግዚአብሔር ፍቅር ነው።", "1ኛ ዮሐንስ 4፥8"),
        "/faith/zion" to Quote("ደስ ይበልሽ፥ ጸጋ የሞላብሽ ሆይ፥ ጌታ ከአንቺ ጋር ነው።", "ሉቃስ 1፥28"),
        "/faith/giorgis" to Quote("ኃይልን በሚሰጠኝ በክርስቶስ ሁሉን እችላለሁ።", "ፊልጵስዩስ 4፥13"),
        "/faith/abo" to Quote("ለእግዚአብሔር የሚሳነው ነገር የለም።", "ሉቃስ 1፥37"),
        // Protestant
        "/faith/mekane_yesus" to Quote("እግዚአብሔር አንድያ ልጁን እስኪሰጥ ድረስ ዓለሙን እንዲሁ ወዶአልና።", "ዮሐንስ 3፥16"),
        "/faith/wittenberg" to Quote("ቃልህ ለእግሬ መብራት ለመንገዴም ብርሃን ነው።", "መዝሙረ ዳዊት 119፥105"),
        "/faith/cross" to Quote("እኔ መንገድና እውነት ሕይወትም ነኝ።", "ዮሐንስ 14፥6"),
        // Catholic
        "/faith/nativity_addis" to Quote("እነሆኝ የጌታ ባሪያ፤ እንደ ቃልህ ይሁንልኝ።", "ሉቃስ 1፥38"),
        "/faith/st_peter" to Quote("አንተ ጴጥሮስ ነህ፥ በዚችም ዓለት ላይ ቤተ ክርስቲያኔን እሠራለሁ።", "ማቴዎስ 16፥18"),
        "/faith/creation" to Quote("እግዚአብሔርም ሰውን በመልኩ ፈጠረ።", "ዘፍጥረት 1፥27"),
        // Islamic
        "/faith/kaaba" to Quote("اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ", "سورة النور ٣٥"),
        "/faith/nabawi" to Quote("وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ", "سورة الأنبياء ١٠٧"),
        "/faith/anwar" to Quote("فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", "سورة الشرح ٥"),
        "/faith/negash" to Quote("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "سورة الفاتحة ١"),
        "/faith/jamia_harar" to Quote("فَاذْكُرُونِي أَذْكُرْكُمْ", "سورة البقرة ١٥٢"),
    )

    fun has(live: String) = live in quotes

    private val textPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = Typeface.create("serif", Typeface.BOLD)
        color = 0xD9F3D27A.toInt()
        setShadowLayer(6f, 0f, 2f, 0xCC000000.toInt())
    }
    private val refPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = Typeface.create("serif", Typeface.NORMAL)
        color = 0xCCFFE7A8.toInt()
        setShadowLayer(4f, 0f, 1f, 0xCC000000.toInt())
    }
    private val shade = Paint(Paint.ANTI_ALIAS_FLAG)

    /** Laid-out text is kept for the last theme and size, so frames don't re-measure. */
    private var key = ""
    private var verse: StaticLayout? = null
    private var reference: StaticLayout? = null

    private fun layout(text: String, paint: TextPaint, width: Int) =
        StaticLayout.Builder.obtain(text, 0, text.length, paint, width)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setLineSpacing(0f, 1.1f)
            .build()

    /** Draws [live]'s verse over the picture, if it has one. */
    fun draw(c: Canvas, w: Float, h: Float, live: String) {
        val q = quotes[live] ?: return
        val k = "$live:${w.toInt()}:${h.toInt()}"
        if (k != key) {
            val width = (w * 0.86f).toInt().coerceAtLeast(1)
            // Large, but a step below the key letters, in at most three lines.
            var size = min(h * 0.075f, w * 0.06f)
            var v: StaticLayout
            do {
                textPaint.textSize = size
                v = layout(q.text, textPaint, width)
                size *= 0.92f
            } while ((v.lineCount > 3 || v.height > h * 0.42f) && size > 8f)
            refPaint.textSize = max(10f, textPaint.textSize * 0.45f)
            verse = v
            reference = layout(q.ref, refPaint, width)
            key = k
        }
        val v = verse ?: return
        val r = reference ?: return
        val total = v.height + r.height * 1.3f
        val top = h * 0.55f - total / 2f
        val left = (w - v.width) / 2f

        // A pool of shade behind the text, so it reads over bright parts of the photo
        val cx = w / 2f; val cy = h * 0.55f; val rad = max(v.width, v.height) * 0.75f
        shade.shader = RadialGradient(cx, cy, rad, intArrayOf(0x8C000000.toInt(), 0x40000000, 0), floatArrayOf(0f, 0.6f, 1f), Shader.TileMode.CLAMP)
        c.drawCircle(cx, cy, rad, shade)
        shade.shader = null

        c.save(); c.translate(left, top); v.draw(c); c.restore()
        c.save(); c.translate((w - r.width) / 2f, top + v.height + r.height * 0.3f); r.draw(c); c.restore()
    }
}
