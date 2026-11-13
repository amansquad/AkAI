package com.akai.nativekb

import android.app.Activity
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.Switch
import android.widget.TextView
import androidx.core.graphics.ColorUtils

/**
 * The look of the Flutter app: a near-black page with a soft glow of the theme's
 * accent at the top, rounded cards, pill buttons and big, tightly-spaced titles.
 * Every colour comes from the selected theme, so the app screens, the theme
 * picker and the keyboard always agree.
 */
class Ui(val context: Context, val p: Palette) {
    val d = context.resources.displayMetrics.density
    fun dp(v: Float) = (v * d).toInt()

    val text get() = p.text
    val dim get() = ColorUtils.setAlphaComponent(p.text, 0xAA)
    val faint get() = ColorUtils.setAlphaComponent(p.text, 0x66)

    fun round(color: Int, radiusDp: Float, stroke: Int = 0, strokeDp: Float = 1f) = GradientDrawable().apply {
        setColor(color)
        cornerRadius = radiusDp * d
        if (stroke != 0) setStroke(dp(strokeDp).coerceAtLeast(1), stroke)
    }

    /** [s] in the app's interface language (unchanged when there is no translation). */
    fun tr(s: String) = UiText.t(context, s)
    fun tr(s: String, vararg vars: Pair<String, Any>) = UiText.t(context, s, *vars)

    fun label(
        t: String, sizeSp: Float = 15f, color: Int = text, bold: Boolean = false,
        spacing: Float = 0f, gravity: Int = Gravity.START,
    ) = TextView(context).apply {
        this.text = tr(t)
        textSize = sizeSp
        setTextColor(color)
        typeface = if (bold) Typeface.create("sans-serif", Typeface.BOLD) else Typeface.DEFAULT
        letterSpacing = spacing
        this.gravity = gravity
    }

    /** A big, heavy title like the Flutter screens use. */
    fun title(t: String, sizeSp: Float = 28f) = label(t, sizeSp, text, bold = true, spacing = -0.03f)

    fun gap(h: Float) = View(context).apply { layoutParams = LinearLayout.LayoutParams(1, dp(h)) }

    /** A small outlined chip, e.g. a feature tag. */
    fun chip(t: String) = label(t, 13f, p.text).apply {
        setPadding(dp(14f), dp(8f), dp(14f), dp(8f))
        background = round(ColorUtils.setAlphaComponent(p.surface, 0xCC), 8f, ColorUtils.setAlphaComponent(p.text, 0x44), 2f)
    }

    /** The "✦ AKAI KEYBOARD" pill at the top of a screen. */
    fun brandPill(t: String = "AKAI KEYBOARD") = label(t, 12f, p.accent, bold = true, spacing = 0.3f, gravity = Gravity.CENTER).apply {
        setPadding(dp(22f), dp(10f), dp(22f), dp(10f))
        background = round(ColorUtils.setAlphaComponent(p.accent, 0x26), 8f, p.accent, 2f)
    }

    fun card(vararg views: View, pad: Float = 16f): LinearLayout = LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
        val sh = SignDrawable.CARD_SHADOW_DP
        setPadding(dp(pad), dp(pad), dp(pad + sh), dp(pad + sh))
        background = SignDrawable(
            ColorUtils.compositeColors(ColorUtils.setAlphaComponent(p.surface, 0xF2), p.background), d,
            border = ColorUtils.setAlphaComponent(p.text, 0x55), shadow = 0x66000000, rivets = false,
            shadowDp = sh, strokeDp = 2f,
        )
        views.forEach { addView(it) }
    }

    /** A filled, rounded button in the accent colour. */
    fun primaryButton(t: String, onClick: () -> Unit) = Button(context).apply {
        text = tr(t)
        isAllCaps = false
        textSize = 16f
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
        setTextColor(if (ColorUtils.calculateLuminance(p.accent) > 0.5) Color.BLACK else Color.WHITE)
        stateListAnimator = null
        background = round(p.accent, 12f, if (ColorUtils.calculateLuminance(p.accent) > 0.5) Color.BLACK else Color.WHITE, 2f)
        setPadding(dp(26f), dp(14f), dp(26f), dp(14f))
        setOnClickListener { onClick() }
    }

    fun ghostButton(t: String, onClick: () -> Unit) = Button(context).apply {
        text = tr(t)
        isAllCaps = false
        textSize = 15f
        setTextColor(dim)
        stateListAnimator = null
        background = null
        setOnClickListener { onClick() }
    }

    /** A switch tinted with the theme accent. */
    fun switch(checked: Boolean, onChange: (Boolean) -> Unit) = Switch(context).apply {
        isChecked = checked
        val on = p.accent
        val off = ColorUtils.setAlphaComponent(p.text, 0x55)
        thumbTintList = ColorStateList(arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()), intArrayOf(on, off))
        trackTintList = ColorStateList(
            arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()),
            intArrayOf(ColorUtils.setAlphaComponent(on, 0x66), ColorUtils.setAlphaComponent(p.text, 0x22)),
        )
        setOnCheckedChangeListener { _, v -> onChange(v) }
    }

    /** A row with a title, a one-line explanation and a switch, as on the Flutter settings screen. */
    fun switchRow(title: String, subtitle: String, checked: Boolean, onChange: (Boolean) -> Unit): View {
        val texts = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(label(title, 16f, text, bold = true))
            if (subtitle.isNotEmpty()) addView(label(subtitle, 13f, dim))
        }
        return LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(10f), 0, dp(10f))
            addView(texts, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(switch(checked, onChange))
        }
    }

    fun sliderRow(
        title: String, min: Int, max: Int, value: Int, unit: String,
        onChange: (Int) -> Unit,
    ): View {
        val heading = label("$title: $value$unit", 15f, text, bold = true)
        val bar = SeekBar(context).apply {
            this.max = max - min
            progress = value.coerceIn(min, max) - min
            progressTintList = ColorStateList.valueOf(p.accent)
            thumbTintList = ColorStateList.valueOf(p.accent)
            progressBackgroundTintList = ColorStateList.valueOf(ColorUtils.setAlphaComponent(p.text, 0x33))
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(b: SeekBar?, v: Int, fromUser: Boolean) {
                    heading.text = "$title: ${v + min}$unit"
                    if (fromUser) onChange(v + min)
                }
                override fun onStartTrackingTouch(b: SeekBar?) {}
                override fun onStopTrackingTouch(b: SeekBar?) {}
            })
        }
        return LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, dp(8f), 0, dp(8f))
            addView(heading)
            addView(bar)
        }
    }

    /**
     * One choice from a list of [options] (title to explanation), each on its own
     * line, for when the choices need more words than a segmented row can hold.
     */
    fun choiceList(options: List<Pair<String, String>>, selected: Int, onPick: (Int) -> Unit): View {
        val column = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL }
        val dots = ArrayList<View>()
        fun paint(sel: Int) = dots.forEachIndexed { i, d ->
            d.background = if (i == sel) round(p.accent, 999f, ColorUtils.setAlphaComponent(p.accent, 0x66), 5f)
            else round(Color.TRANSPARENT, 999f, faint, 2f)
        }
        options.forEachIndexed { i, (title, subtitle) ->
            val dot = View(context)
            dots.add(dot)
            val texts = LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                addView(label(title, 16f, text, bold = true))
                if (subtitle.isNotEmpty()) addView(label(subtitle, 13f, dim))
            }
            column.addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, dp(10f), 0, dp(10f))
                addView(texts, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(dot, LinearLayout.LayoutParams(dp(20f), dp(20f)).apply { marginStart = dp(12f) })
                setOnClickListener { paint(i); onPick(i) }
            })
        }
        paint(selected)
        return column
    }

    /** A row of segmented options; the selected one is filled with the accent. */
    fun segmented(title: String, options: List<String>, selected: Int, onPick: (Int) -> Unit): View {
        val row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        val cells = ArrayList<TextView>()
        fun paint(sel: Int) = cells.forEachIndexed { i, c ->
            val on = i == sel
            c.setTextColor(if (on) (if (ColorUtils.calculateLuminance(p.accent) > 0.5) Color.BLACK else Color.WHITE) else dim)
            c.background = round(if (on) p.accent else Color.TRANSPARENT, 8f)
        }
        options.forEachIndexed { i, o ->
            val c = label(o, 13f, dim, bold = true, gravity = Gravity.CENTER).apply {
                setPadding(dp(8f), dp(9f), dp(8f), dp(9f))
                setOnClickListener { paint(i); onPick(i) }
            }
            cells.add(c)
            row.addView(c, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        }
        paint(selected)
        row.background = round(ColorUtils.setAlphaComponent(p.text, 0x14), 10f, ColorUtils.setAlphaComponent(p.text, 0x44), 2f)
        return LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, dp(8f), 0, dp(8f))
            if (title.isNotEmpty()) {
                addView(label(title, 15f, text, bold = true))
                addView(gap(6f))
            }
            addView(row)
        }
    }

    /** Cards rise and fade in one after another when a screen opens. */
    fun animateIn(column: LinearLayout) {
        for (i in 0 until column.childCount) {
            val v = column.getChildAt(i)
            v.alpha = 0f
            v.translationY = dp(18f).toFloat()
            v.animate().alpha(1f).translationY(0f).setStartDelay((i * 45L).coerceAtMost(500L)).setDuration(320)
                .setInterpolator(android.view.animation.DecelerateInterpolator(1.8f)).start()
        }
    }

    /** A card that shrinks a little under the finger, like the keys. */
    fun pressable(v: View): View {
        v.setOnTouchListener { view, e ->
            when (e.actionMasked) {
                android.view.MotionEvent.ACTION_DOWN -> view.animate().scaleX(0.97f).scaleY(0.97f).setDuration(90).start()
                android.view.MotionEvent.ACTION_UP, android.view.MotionEvent.ACTION_CANCEL ->
                    view.animate().scaleX(1f).scaleY(1f).setDuration(220).setInterpolator(android.view.animation.OvershootInterpolator(2.2f)).start()
            }
            false // the click still goes through
        }
        return v
    }

    /**
     * A painted shopfront sign: enamel panel, ink border, rivets and a hard flat
     * shadow. [tilt] hangs it a little crooked, like a real board.
     */
    fun sign(fill: Int, vararg views: View, tilt: Float = 0f, pad: Float = 16f): LinearLayout = LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
        val sh = SignDrawable.SHADOW_DP
        setPadding(dp(pad + 4f), dp(pad + 4f), dp(pad + 4f + sh), dp(pad + 4f + sh))
        background = SignDrawable(fill, d)
        rotation = tilt
        views.forEach { addView(it) }
    }

    fun section(t: String): View {
        val tab = label(tr(t).uppercase(), 12f, if (ColorUtils.calculateLuminance(p.accent) > 0.5) SignDrawable.INK else Color.WHITE, bold = true, spacing = 0.15f).apply {
            setPadding(dp(12f), dp(5f), dp(12f), dp(5f))
            background = round(p.accent, 6f, SignDrawable.INK, 2f)
            rotation = -1.5f
        }
        return LinearLayout(context).apply {
            setPadding(dp(4f), dp(22f), 0, dp(10f))
            addView(tab, LinearLayout.LayoutParams(-2, -2))
        }
    }
}

/** The page background: the theme colour ribbed like corrugated sheet metal, with a saw-tooth edge in the accent. */
class GlowBackground(context: Context, private val p: Palette) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val rib = Color.argb(if (p.isLight) 0x0C else 0x12, if (p.isLight) 0 else 255, if (p.isLight) 0 else 255, if (p.isLight) 0 else 255)
    override fun onDraw(canvas: Canvas) {
        canvas.drawColor(p.background)
        val d = resources.displayMetrics.density
        paint.shader = null
        paint.color = rib
        val step = 14f * d
        var x = 0f
        while (x < width) { canvas.drawRect(x, 0f, x + step / 2, height.toFloat(), paint); x += step }
        // saw-tooth edge along the top
        paint.color = p.accent
        val tooth = 16f * d
        val path = android.graphics.Path()
        path.moveTo(0f, 0f)
        var tx = 0f
        while (tx < width) { path.lineTo(tx + tooth / 2, tooth / 2); path.lineTo(tx + tooth, 0f); tx += tooth }
        path.close()
        canvas.drawPath(path, paint)
    }
}

/** Base for the app screens: themed background, status bar colours, a scrolling column. */
abstract class ThemedActivity : Activity() {
    protected lateinit var ui: Ui
    protected lateinit var palette: Palette
    /** False until onCreate has loaded the theme (onResume can run first on some paths). */
    protected val themeReady get() = ::ui.isInitialized
    protected val prefs by lazy { getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE) }

    protected fun loadTheme() {
        palette = Themes.palette(this, prefs.getString(Prefs.THEME, Themes.DEFAULT) ?: Themes.DEFAULT)
        ui = Ui(this, palette)
        window.statusBarColor = palette.background
        window.navigationBarColor = palette.background
        val flags = if (palette.isLight) View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR else 0
        window.decorView.systemUiVisibility = flags
    }

    /** Wraps [content] on the themed background and shows it. */
    protected fun show(content: View, scroll: Boolean = true) {
        val root = FrameLayout(this)
        root.addView(GlowBackground(this, palette), FrameLayout.LayoutParams(-1, -1))
        if (content is LinearLayout) ui.animateIn(content)
        val body: View = if (scroll) ScrollView(this).apply { isFillViewport = true; addView(content) } else content
        root.addView(body, FrameLayout.LayoutParams(-1, -1))
        // Arabic reads right to left.
        root.layoutDirection = if (UiText.current(this).rtl) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR
        setContentView(root)
    }

    protected fun column(pad: Float = 20f): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(ui.dp(pad), ui.dp(pad + 18f), ui.dp(pad), ui.dp(pad + 30f))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        loadTheme()
    }
}

/** The board behind a sign: see [Ui.sign]. Also the flat-shadowed panel behind [Ui.card]. */
class SignDrawable(
    private val fill: Int, private val d: Float,
    private val border: Int = INK, private val shadow: Int = SHADOW, private val rivets: Boolean = true,
    private val shadowDp: Float = SHADOW_DP, private val strokeDp: Float = 2.5f,
) : android.graphics.drawable.Drawable() {
    companion object {
        const val SHADOW_DP = 5f
        const val CARD_SHADOW_DP = 4f
        const val INK = 0xFF0E2A33.toInt()
        const val SHADOW = 0xB306161B.toInt()
    }
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    override fun draw(canvas: Canvas) {
        val sh = shadowDp * d
        val panel = android.graphics.RectF(bounds.left + 2 * d, bounds.top + 2 * d, bounds.right - sh - 2 * d, bounds.bottom - sh - 2 * d)
        val r = 14f * d
        paint.style = Paint.Style.FILL
        paint.color = shadow
        canvas.drawRoundRect(android.graphics.RectF(panel).apply { offset(sh, sh) }, r, r, paint)
        paint.color = fill
        canvas.drawRoundRect(panel, r, r, paint)
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = strokeDp * d
        paint.color = border
        canvas.drawRoundRect(panel, r, r, paint)
        if (rivets) {
            paint.style = Paint.Style.FILL
            val i = 8f * d
            for (x in floatArrayOf(panel.left + i, panel.right - i)) for (y in floatArrayOf(panel.top + i, panel.bottom - i))
                canvas.drawCircle(x, y, 2.2f * d, paint)
        }
    }
    override fun setAlpha(a: Int) {}
    override fun setColorFilter(f: android.graphics.ColorFilter?) {}
    @Suppress("OVERRIDE_DEPRECATION") override fun getOpacity() = android.graphics.PixelFormat.TRANSLUCENT
}
