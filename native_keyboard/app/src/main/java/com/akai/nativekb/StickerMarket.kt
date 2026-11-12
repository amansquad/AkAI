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
)

/**
 * The Sticker Marketplace on the Akai website: sticker packs the keyboard can
 * install. Nothing is downloaded until a pack is installed, so the app stays
 * small however many packs there are.
 */
object StickerMarket {
    class Page(val packs: List<MarketPack>, val next: Int?)

    fun server(context: Context) =
        (context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).getString(Prefs.SERVER_URL, "") ?: "")
            .trim().ifBlank { Net.SITE }.trimEnd('/')

    /** One page of packs, most installed first, matching [query] if given. Null with a reason when it fails. */
    fun list(context: Context, query: String, offset: Int, done: (Page?, String?) -> Unit) {
        val server = server(context)
        Net.background {
            val r = Net.request("$server/api/stickers/market?offset=$offset&limit=20&q=${Uri.encode(query.trim())}")
            val page = if (r != null && r.code == 200) try {
                val o = JSONObject(String(r.body))
                val a = o.getJSONArray("packs")
                Page((0 until a.length()).map { i ->
                    val p = a.getJSONObject(i)
                    val prev = p.optJSONArray("previews")
                    MarketPack(
                        p.getString("name"), p.optString("title", p.getString("name")), p.optInt("count"), p.optInt("moving"),
                        p.optInt("installs"), (0 until (prev?.length() ?: 0)).map { prev!!.getString(it) },
                    )
                }, o.optInt("next", -1).takeIf { it >= 0 && !o.isNull("next") })
            } catch (e: Exception) { null } else null
            val error = when {
                page != null -> null
                r == null -> "No connection. Check the internet and try again"
                else -> try { JSONObject(String(r.body)).optString("error").ifBlank { null } } catch (e: Exception) { null }
                    ?: "The Sticker Marketplace is unavailable right now"
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

    private val previews = object : LruCache<String, Bitmap>(12 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap) = value.byteCount
    }
    private val loading = HashSet<String>()

    /** A preview [size] pixels across at most, or null while it downloads ([ready] runs once it has). */
    fun preview(url: String, size: Int, ready: (Bitmap) -> Unit): Bitmap? {
        previews.get(url)?.let { return it }
        if (!loading.add(url)) return null
        Net.background {
            val r = Net.request(url)
            val bmp = r?.takeIf { it.code == 200 }?.body?.let { b ->
                val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeByteArray(b, 0, b.size, bounds)
                var sample = 1
                while (bounds.outWidth / (sample * 2) >= size && bounds.outHeight / (sample * 2) >= size) sample *= 2
                BitmapFactory.decodeByteArray(b, 0, b.size, BitmapFactory.Options().apply { inSampleSize = sample })
            }
            Net.ui {
                loading.remove(url)
                if (bmp != null) { previews.put(url, bmp); ready(bmp) }
            }
        }
        return null
    }
}

/** Browse, search, install and remove sticker packs. */
class StickerMarketActivity : ThemedActivity() {
    private val wrap = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    private lateinit var list: LinearLayout
    private lateinit var status: TextView
    private lateinit var more: View
    private var query = ""
    private var next: Int? = null
    private var loadingPage = false
    /** Packs downloading right now, with their progress line, so a rebuilt card picks it up. */
    private val installing = HashMap<String, String>()
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
            hint = "🔍  Search packs"
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
        c.addView(ui.gap(8f))

        status = ui.label("", 14f, ui.dim, gravity = Gravity.CENTER).apply { setPadding(0, ui.dp(24f), 0, ui.dp(24f)) }
        c.addView(status, wrap)
        list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        c.addView(list, wrap)
        more = ui.ghostButton("Show more") { load(reset = false) }.apply { visibility = View.GONE }
        c.addView(more, wrap)

        c.addView(ui.section("Have a link?"))
        val own = ui.card(
            ui.label("Add any Telegram pack", 16f, palette.text, bold = true),
            ui.label("Paste a t.me/addstickers link to install a pack that isn't listed here.", 13f, ui.dim),
        )
        own.setOnClickListener { SettingsActivity.open(this, SettingsActivity.STICKERS) }
        ui.pressable(own)
        c.addView(own, wrap)
        show(c)
    }

    private fun load(reset: Boolean) {
        if (loadingPage) return
        loadingPage = true
        if (reset) { list.removeAllViews(); rows.clear(); next = null }
        status.visibility = View.VISIBLE
        status.text = "Loading…"
        more.visibility = View.GONE
        StickerMarket.list(this, query, if (reset) 0 else next ?: 0) { page, error ->
            loadingPage = false
            if (isFinishing) return@list
            if (page == null) { status.text = error; return@list }
            next = page.next
            page.packs.forEach { list.addView(card(it), LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = ui.dp(10f) }) }
            status.visibility = if (list.childCount == 0) View.VISIBLE else View.GONE
            status.text = if (query.isBlank()) "No packs yet. Check back soon." else "No packs match \"$query\""
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
        val sub = listOfNotNull(
            "${p.count} stickers",
            if (p.moving > 0) "${p.moving} moving" else null,
            if (p.installs > 0) "${p.installs} installs" else null,
        ).joinToString(" · ")
        val line = ui.label("", 13f, ui.dim)
        val button = ui.primaryButton("Install") {}
        val remove = ui.ghostButton("Remove") {}

        fun refresh() {
            val busy = installing[p.name]
            val have = installed(p.name)
            line.text = busy ?: sub
            button.visibility = if (have || busy != null) View.GONE else View.VISIBLE
            remove.visibility = if (have && busy == null) View.VISIBLE else View.GONE
            remove.text = "Installed ✓  ·  Remove"
        }
        rows[p.name] = ::refresh
        button.setOnClickListener { install(p) }
        remove.setOnClickListener {
            android.app.AlertDialog.Builder(this)
                .setTitle("Remove ${p.title}?")
                .setMessage("It leaves the keyboard. You can install it again any time.")
                .setPositiveButton("Remove") { _, _ ->
                    StickerPacks.imported(this).firstOrNull { it.key.equals(p.name, ignoreCase = true) }?.let { StickerPacks.remove(this, it.key) }
                    refresh()
                }
                .setNegativeButton("Keep", null)
                .show()
        }
        refresh()

        val card = ui.card(strip, ui.gap(10f), ui.label(p.title, 17f, palette.text, bold = true), line, ui.gap(10f), button, remove)
        return card
    }

    private fun install(p: MarketPack) {
        installing[p.name] = "Starting…"
        rows[p.name]?.invoke()
        StickerPacks.import(this, p.name, title = p.title, progress = { msg ->
            installing[p.name] = msg
            rows[p.name]?.invoke()
        }) { pack, error ->
            installing.remove(p.name)
            if (isFinishing) return@import
            rows[p.name]?.invoke()
            if (pack == null) {
                Toast.makeText(this, error ?: "Couldn't install ${p.title}", Toast.LENGTH_LONG).show()
            } else {
                StickerMarket.countInstall(this, p.name)
                Toast.makeText(this, "${p.title} is in your keyboard's sticker tab", Toast.LENGTH_SHORT).show()
            }
        }
    }

    companion object {
        fun open(c: Context) = c.startActivity(Intent(c, StickerMarketActivity::class.java))
    }
}
