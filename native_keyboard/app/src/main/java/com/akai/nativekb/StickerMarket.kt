package com.akai.nativekb

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.text.InputType
import android.util.LruCache
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.graphics.ColorUtils
import org.json.JSONObject

/** A pack offered in the Sticker Marketplace, as /api/stickers/market lists it. */
class MarketPack(
    val name: String, val title: String, val count: Int, val moving: Int, val installs: Int,
    /** Paths on the Akai server of a few of its stickers, to show before installing. */
    val previews: List<String>,
    /** A Telegram custom emoji pack rather than stickers. */
    val emoji: Boolean = false,
)

/**
 * The Sticker Marketplace on the Akai website: sticker packs the keyboard can
 * install. Nothing is downloaded until a pack is installed, so the app stays
 * small however many packs there are.
 */
object StickerMarket {
    class Page(val packs: List<MarketPack>, val next: Int?)

    private val listPool = java.util.concurrent.Executors.newSingleThreadExecutor()
    /** Preview pictures download here, apart from the app's other network work. */
    private val imagePool = java.util.concurrent.Executors.newFixedThreadPool(4)

    fun server(context: Context) =
        (context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).getString(Prefs.SERVER_URL, "") ?: "")
            .trim().ifBlank { Net.SITE }.trimEnd('/')

    /** One page of packs, most installed first, matching [query] if given. Null with a reason when it fails. */
    fun list(context: Context, query: String, offset: Int, emoji: Boolean, done: (Page?, String?) -> Unit) {
        val server = server(context)
        val kind = if (emoji) "emoji" else "stickers"
        // Its own thread: a list must never wait behind the many preview pictures.
        listPool.execute {
            val r = Net.request("$server/api/stickers/market?kind=$kind&offset=$offset&limit=20&q=${Uri.encode(query.trim())}")
            val page = if (r != null && r.code == 200) try {
                val o = JSONObject(String(r.body))
                val a = o.getJSONArray("packs")
                Page((0 until a.length()).map { i ->
                    val p = a.getJSONObject(i)
                    val prev = p.optJSONArray("previews")
                    MarketPack(
                        p.getString("name"), p.optString("title", p.getString("name")), p.optInt("count"), p.optInt("moving"),
                        p.optInt("installs"), (0 until (prev?.length() ?: 0)).map { prev!!.getString(it) },
                        emoji = p.optString("kind") == "emoji",
                    )
                }, o.optInt("next", -1).takeIf { it >= 0 && !o.isNull("next") })
            } catch (e: Exception) { null } else null
            val error = when {
                page != null -> null
                r == null -> UiText.t(context, "No connection. Check the internet and try again")
                else -> try { JSONObject(String(r.body)).optString("error").ifBlank { null } } catch (e: Exception) { null }
                    ?: UiText.t(context, "The Sticker Marketplace is unavailable right now")
            }
            Net.ui { done(page, error) }
        }
    }

    /** Counts an install, once per phone; a failure only means the count is one short. */
    fun countInstall(context: Context, name: String) {
        val url = "${server(context)}/api/stickers/market/${Uri.encode(name)}/install"
        val device = Community.device(context)
        Net.background {
            try {
                val c = java.net.URL(url).openConnection() as java.net.HttpURLConnection
                c.connectTimeout = 10_000
                c.readTimeout = 15_000
                c.requestMethod = "POST"
                c.setRequestProperty("X-AkAI-Device", device)
                c.responseCode
                c.disconnect()
            } catch (e: Exception) {}
        }
    }

    // ─── Preview pictures ────────────────────────────────────────────────

    private val previews = object : LruCache<String, Bitmap>(20 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap) = value.byteCount
    }
    private val loading = HashSet<String>()

    /** A preview [size] pixels across at most, or null while it downloads ([ready] runs once it has). */
    fun preview(url: String, size: Int, ready: (Bitmap) -> Unit): Bitmap? {
        previews.get(url)?.let { return it }
        if (!loading.add(url)) return null
        imagePool.execute {
            val r = Net.request(url)
            val bmp = r?.takeIf { it.code == 200 }?.body?.let { b ->
                val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeByteArray(b, 0, b.size, bounds)
                var sample = 1
                while (bounds.outWidth / (sample * 2) >= size && bounds.outHeight / (sample * 2) >= size) sample *= 2
                BitmapFactory.decodeByteArray(b, 0, b.size, BitmapFactory.Options().apply { inSampleSize = sample })?.let { full ->
                    // Down to the size shown: a full 512 px sticker is 1 MB, which would crowd the cache.
                    val k = size.toFloat() / maxOf(full.width, full.height)
                    if (k >= 1f) full else Bitmap.createScaledBitmap(full, maxOf(1, (full.width * k).toInt()), maxOf(1, (full.height * k).toInt()), true)
                        .also { if (it !== full) full.recycle() }
                }
            }
            Net.ui {
                loading.remove(url)
                if (bmp != null) { previews.put(url, bmp); ready(bmp) }
            }
        }
        return null
    }
}

/** Browse and search sticker packs; each opens its own page to preview and install it. */
class StickerMarketActivity : ThemedActivity() {
    private val wrap = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    private lateinit var list: LinearLayout
    private lateinit var status: TextView
    private lateinit var more: View
    private var query = ""
    /** Showing custom emoji packs rather than sticker packs. */
    private var emoji = false
    private var next: Int? = null
    private var loadingPage = false
    private val rows = HashMap<String, (() -> Unit)>()

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        build()
        load(reset = true)
    }

    private fun build() {
        val c = column()
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        header.addView(ui.ghostButton("←") { finish() })
        header.addView(ui.title("Sticker Marketplace", 24f))
        c.addView(header, wrap)
        c.addView(ui.label("Install the packs you like. Only installed packs are downloaded, so Akai stays small.", 14f, ui.dim))
        c.addView(ui.gap(12f))

        val search = EditText(this).apply {
            hint = ui.tr("🔍  Search packs")
            setSingleLine()
            inputType = InputType.TYPE_CLASS_TEXT
            imeOptions = EditorInfo.IME_ACTION_SEARCH
            setHintTextColor(ui.faint); setTextColor(palette.text); textSize = 15f
            setPadding(ui.dp(14f), ui.dp(11f), ui.dp(14f), ui.dp(11f))
            background = ui.round(ColorUtils.setAlphaComponent(palette.text, 0x10), 12f, ColorUtils.setAlphaComponent(palette.text, 0x22))
            setOnEditorActionListener { v, action, event ->
                if (action == EditorInfo.IME_ACTION_SEARCH || event?.keyCode == KeyEvent.KEYCODE_ENTER) {
                    query = v.text.toString(); load(reset = true); true
                } else false
            }
        }
        c.addView(search, wrap)
        // Stickers and custom emoji are different things, so they're browsed apart.
        c.addView(ui.segmented("", listOf("Stickers", "Emoji"), if (emoji) 1 else 0) {
            emoji = it == 1
            load(reset = true)
        }, wrap)

        status = ui.label("", 14f, ui.dim, gravity = Gravity.CENTER).apply { setPadding(0, ui.dp(24f), 0, ui.dp(24f)) }
        c.addView(status, wrap)
        list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        c.addView(list, wrap)
        more = ui.ghostButton("Show more") { load(reset = false) }.apply { visibility = View.GONE }
        c.addView(more, wrap)

        c.addView(ui.section("Have a link?"))
        val own = ui.card(
            ui.label("Add any Telegram pack", 16f, palette.text, bold = true),
            ui.label("Paste a t.me/addstickers or t.me/addemoji link to install a pack that isn't listed here.", 13f, ui.dim),
        )
        own.setOnClickListener { SettingsActivity.open(this, SettingsActivity.STICKERS) }
        ui.pressable(own)
        c.addView(own, wrap)
        show(c)
    }

    /** Bumped by every load, so a reply that arrives after a newer one (say, a tab switch) is dropped. */
    private var loadGen = 0

    private fun load(reset: Boolean) {
        if (loadingPage && !reset) return
        loadingPage = true
        val gen = ++loadGen
        if (reset) { list.removeAllViews(); rows.clear(); next = null }
        status.visibility = View.VISIBLE
        status.text = ui.tr("Loading…")
        more.visibility = View.GONE
        StickerMarket.list(this, query, if (reset) 0 else next ?: 0, emoji) { page, error ->
            if (gen != loadGen || isFinishing) return@list
            loadingPage = false
            if (page == null) { status.text = error; return@list }
            next = page.next
            page.packs.forEach { list.addView(card(it), LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = ui.dp(10f) }) }
            status.visibility = if (list.childCount == 0) View.VISIBLE else View.GONE
            status.text = if (emoji) {
                if (query.isBlank()) ui.tr("No emoji packs yet. Check back soon.") else ui.tr("No emoji packs match \"{q}\"", "q" to query)
            } else {
                if (query.isBlank()) ui.tr("No sticker packs yet. Check back soon.") else ui.tr("No sticker packs match \"{q}\"", "q" to query)
            }
            more.visibility = if (next != null) View.VISIBLE else View.GONE
        }
    }

    private fun installed(name: String) = StickerPacks.all(this).any { it.key.equals(name, ignoreCase = true) }

    private fun card(p: MarketPack): View {
        val server = StickerMarket.server(this)
        val strip = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val cell = ui.dp(60f)
        for (path in p.previews.take(5)) {
            val img = ImageView(this).apply { scaleType = ImageView.ScaleType.FIT_CENTER }
            val url = server + path
            StickerMarket.preview(url, cell) { img.setImageBitmap(it) }?.let(img::setImageBitmap)
            strip.addView(img, LinearLayout.LayoutParams(0, cell, 1f).apply { marginEnd = ui.dp(4f) })
        }
        val gifs = p.moving
        val stills = p.count - p.moving
        val sub = listOfNotNull(
            if (p.emoji) ui.tr("Emoji pack · {n} emoji", "n" to p.count) else ui.tr("{n} stickers", "n" to p.count),
            if (gifs > 0) (if (p.emoji) (if (stills == 0) ui.tr("all animated") else ui.tr("{n} animated", "n" to gifs)) else ui.tr("{n} GIFs", "n" to gifs)) else null,
            if (gifs > 0 && stills > 0) ui.tr("{n} still", "n" to stills) else null,
            if (p.installs > 0) ui.tr("{n} installs", "n" to p.installs) else null,
        ).joinToString(" · ")
        val view = ui.primaryButton("View pack") { StickerPreviewActivity.open(this, p.name, p.title) }
        val have = ui.ghostButton("Installed ✓  ·  View") { StickerPreviewActivity.open(this, p.name, p.title) }

        fun refresh() {
            val on = installed(p.name)
            view.visibility = if (on) View.GONE else View.VISIBLE
            have.visibility = if (on) View.VISIBLE else View.GONE
        }
        rows[p.name] = ::refresh
        refresh()

        val card = ui.card(strip, ui.gap(10f), ui.label(p.title, 17f, palette.text, bold = true), ui.label(sub, 13f, ui.dim), ui.gap(10f), view, have)
        card.setOnClickListener { StickerPreviewActivity.open(this, p.name, p.title) }
        ui.pressable(card)
        return card
    }

    override fun onResume() {
        super.onResume()
        // Back from a pack's page, which may have installed or removed it.
        rows.values.forEach { it() }
    }

    companion object {
        fun open(c: Context) = c.startActivity(Intent(c, StickerMarketActivity::class.java))
    }
}
