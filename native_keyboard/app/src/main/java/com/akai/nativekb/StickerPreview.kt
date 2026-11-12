package com.akai.nativekb

import android.content.Context
import android.content.Intent
import android.graphics.drawable.Drawable
import android.os.Build
import android.util.LruCache
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.FrameLayout
import android.widget.GridView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import org.json.JSONObject

/**
 * A sticker pack before it is installed: every sticker, moving ones playing
 * with a GIF badge, and a filter for GIFs or stills, then Install. Opened from
 * the Sticker Marketplace and from a Telegram link pasted in Settings.
 */
class StickerPreviewActivity : ThemedActivity() {

    private class Item(val still: String, val anim: String?)

    private lateinit var name: String
    private var title = ""
    private var items: List<Item> = emptyList()
    private var shown: List<Item> = emptyList()
    private var filter = 0 // all, GIFs, stills
    private var installing: String? = null
    /** A custom emoji pack: small, so six to a row. */
    private var emoji = false
    private fun cols() = if (emoji) 6 else 4

    private lateinit var grid: GridView
    private lateinit var status: TextView
    private lateinit var summary: TextView
    private lateinit var filters: LinearLayout
    private lateinit var action: View
    private lateinit var remove: View
    private lateinit var progress: TextView

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        name = intent.getStringExtra(EXTRA_NAME).orEmpty()
        title = intent.getStringExtra(EXTRA_TITLE).orEmpty()
        build()
        load()
    }

    private fun installed() = StickerPacks.all(this).any { it.key.equals(name, ignoreCase = true) }

    private fun build() {
        val c = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(ui.dp(16f), ui.dp(30f), ui.dp(16f), ui.dp(20f))
        }
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        header.addView(ui.ghostButton("←") { finish() })
        header.addView(ui.title(title.ifEmpty { name }, 22f).apply { tag = "title"; maxLines = 1; ellipsize = android.text.TextUtils.TruncateAt.END },
            LinearLayout.LayoutParams(0, -2, 1f))
        c.addView(header, LinearLayout.LayoutParams(-1, -2))
        summary = ui.label("", 14f, ui.dim)
        c.addView(summary)
        filters = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        c.addView(filters, LinearLayout.LayoutParams(-1, -2))

        val frame = FrameLayout(this)
        grid = GridView(this).apply {
            numColumns = 4
            stretchMode = GridView.STRETCH_COLUMN_WIDTH
            verticalSpacing = ui.dp(6f)
            horizontalSpacing = ui.dp(6f)
            selector = android.graphics.drawable.ColorDrawable(0)
            clipToPadding = false
            setPadding(0, ui.dp(8f), 0, ui.dp(8f))
            adapter = this@StickerPreviewActivity.adapter
        }
        frame.addView(grid, FrameLayout.LayoutParams(-1, -1))
        status = ui.label("Loading the pack…", 14f, ui.dim, gravity = Gravity.CENTER)
        frame.addView(status, FrameLayout.LayoutParams(-1, -1))
        c.addView(frame, LinearLayout.LayoutParams(-1, 0, 1f))

        progress = ui.label("", 13f, ui.dim, gravity = Gravity.CENTER).apply { visibility = View.GONE }
        c.addView(progress, LinearLayout.LayoutParams(-1, -2))
        action = ui.primaryButton("Install") { install() }.apply { isEnabled = false }
        c.addView(action, LinearLayout.LayoutParams(-1, -2).apply { topMargin = ui.dp(8f) })
        remove = ui.ghostButton("Installed ✓  ·  Remove") { confirmRemove() }
        c.addView(remove, LinearLayout.LayoutParams(-1, -2).apply { topMargin = ui.dp(8f) })
        refreshButtons()
        show(c, scroll = false)
    }

    private fun refreshButtons() {
        val have = installed()
        val busy = installing != null
        action.visibility = if (have || busy) View.GONE else View.VISIBLE
        remove.visibility = if (have && !busy) View.VISIBLE else View.GONE
        progress.visibility = if (busy) View.VISIBLE else View.GONE
        progress.text = installing.orEmpty()
        (action as? TextView)?.text = if (items.isEmpty()) "Install" else "Install · ${items.size} ${if (emoji) "emoji" else "stickers"}"
    }

    private fun load() {
        val server = StickerMarket.server(this)
        Net.background {
            val r = Net.request("$server/api/stickers?pack=${android.net.Uri.encode(name)}")
            val o = if (r != null && r.code == 200) try { JSONObject(String(r.body)) } catch (e: Exception) { null } else null
            val list = o?.optJSONArray("stickers")?.let { a ->
                (0 until a.length()).map { i ->
                    val s = a.getJSONObject(i)
                    Item(server + s.getString("still"), s.optString("anim").ifEmpty { null }?.let { server + it })
                }
            }
            val error = when {
                list != null -> null
                r == null -> "No connection. Check the internet and try again"
                else -> try { JSONObject(String(r.body)).optString("error").ifBlank { null } } catch (e: Exception) { null }
                    ?: "Couldn't load this pack"
            }
            Net.ui {
                if (isFinishing) return@ui
                if (list == null) { status.text = error; return@ui }
                if (title.isEmpty()) {
                    title = o!!.optString("title", name)
                    (window.decorView.findViewWithTag<TextView>("title"))?.text = title
                }
                name = o!!.optString("name", name)
                emoji = o.optString("kind") == "emoji"
                grid.numColumns = cols()
                items = list
                status.visibility = View.GONE
                action.isEnabled = true
                showSummary()
                applyFilter()
                refreshButtons()
            }
        }
    }

    private fun showSummary() {
        val gifs = items.count { it.anim != null }
        val stills = items.size - gifs
        summary.text = buildString {
            if (emoji) {
                append("Emoji pack · ${items.size} emoji")
                if (gifs > 0) append(if (stills == 0) " · all animated" else " · $gifs animated")
                append("\nTelegram emoji work as emoji only inside Telegram. Akai sends them as small stickers.")
            } else {
                append("${items.size} stickers")
                if (gifs > 0) append(" · $gifs GIFs")
                if (stills > 0) append(" · $stills still")
            }
            if (gifs > 0 && Build.VERSION.SDK_INT < 28) append("\nGIFs show as still pictures on this phone (Android 9 or newer plays them).")
        }
        filters.removeAllViews()
        // A filter only when there's a mix to tell apart.
        if (gifs > 0 && stills > 0) {
            filters.addView(ui.segmented("", listOf("All ${items.size}", "GIFs $gifs", "Still $stills"), filter) {
                filter = it
                applyFilter()
            })
        }
    }

    private fun applyFilter() {
        shown = when (filter) {
            1 -> items.filter { it.anim != null }
            2 -> items.filter { it.anim == null }
            else -> items
        }
        adapter.notifyDataSetChanged()
        grid.setSelection(0)
    }

    private fun install() {
        if (installing != null) return
        installing = "Starting…"
        refreshButtons()
        StickerPacks.import(this, name, title = title, progress = { installing = it; refreshButtons() }) { pack, error ->
            installing = null
            if (isFinishing) return@import
            refreshButtons()
            if (pack == null) {
                Toast.makeText(this, error ?: "Couldn't install $title", Toast.LENGTH_LONG).show()
            } else {
                StickerMarket.countInstall(this, name)
                Toast.makeText(this, "$title is in your keyboard's sticker tab", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun confirmRemove() {
        android.app.AlertDialog.Builder(this)
            .setTitle("Remove $title?")
            .setMessage("It leaves the keyboard. You can install it again any time.")
            .setPositiveButton("Remove") { _, _ ->
                StickerPacks.imported(this).firstOrNull { it.key.equals(name, ignoreCase = true) }?.let { StickerPacks.remove(this, it.key) }
                refreshButtons()
            }
            .setNegativeButton("Keep", null)
            .show()
    }

    // ─── The grid ────────────────────────────────────────────────────────

    private val adapter = object : BaseAdapter() {
        override fun getCount() = shown.size
        override fun getItem(position: Int) = shown[position]
        override fun getItemId(position: Int) = position.toLong()

        override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
            // From the screen, not the grid: the grid can be asked for cells before it has a width.
            val n = cols()
            val size = ((resources.displayMetrics.widthPixels - ui.dp(32f) - ui.dp(6f) * (n - 1)) / n).coerceAtLeast(1)
            val cell = (convertView as? FrameLayout) ?: FrameLayout(this@StickerPreviewActivity).apply {
                addView(ImageView(context).apply { scaleType = ImageView.ScaleType.FIT_CENTER }, FrameLayout.LayoutParams(-1, -1))
                addView(ui.label("GIF", 10f, android.graphics.Color.WHITE, bold = true, gravity = Gravity.CENTER).apply {
                    background = ui.round(0x99000000.toInt(), 6f)
                    setPadding(ui.dp(5f), ui.dp(1f), ui.dp(5f), ui.dp(1f))
                }, FrameLayout.LayoutParams(-2, -2, Gravity.TOP or Gravity.END).apply { setMargins(0, ui.dp(2f), ui.dp(2f), 0) })
            }
            cell.layoutParams = cell.layoutParams?.apply { height = size } ?: android.widget.AbsListView.LayoutParams(-1, size)
            val img = cell.getChildAt(0) as ImageView
            val badge = cell.getChildAt(1)
            val item = shown[position]
            // Every emoji in an emoji pack moves, so a badge on each would only be noise.
            badge.visibility = if (item.anim != null && !emoji) View.VISIBLE else View.GONE
            img.tag = item.still
            img.setImageDrawable(null)
            val px = size.coerceAtLeast(1)
            // The still first; a GIF sticker then plays in its place once it has loaded.
            // The grid asks for a cell more than once while laying out, so a picture that
            // arrives later redraws whichever cells are on screen rather than the one that asked.
            StickerMarket.preview(item.still, px) { rebind() }?.let(img::setImageBitmap)
            if (item.anim != null) Moving.load(item.anim, px) { rebind() }?.let { img.setImageDrawable(it); Moving.play(it) }
            return cell
        }
    }

    private var rebindPending = false

    /** Shows pictures that have just arrived, at most ten times a second. */
    private fun rebind() {
        if (rebindPending || !::grid.isInitialized) return
        rebindPending = true
        grid.postDelayed({ rebindPending = false; grid.invalidateViews() }, 100)
    }

    override fun onPause() {
        super.onPause()
        Moving.pauseAll()
    }

    override fun onResume() {
        super.onResume()
        if (::grid.isInitialized) { refreshButtons(); grid.invalidateViews() }
    }

    override fun onDestroy() {
        super.onDestroy()
        Moving.clear()
    }

    /** Moving stickers downloaded for previews: kept in memory, a few at a time. */
    private object Moving {
        private val bytes = object : LruCache<String, ByteArray>(10 * 1024 * 1024) {
            override fun sizeOf(key: String, value: ByteArray) = value.size
        }
        private val drawables = object : LruCache<String, Drawable>(24) {
            override fun entryRemoved(evicted: Boolean, key: String, old: Drawable, new: Drawable?) {
                if (Build.VERSION.SDK_INT >= 28) (old as? android.graphics.drawable.AnimatedImageDrawable)?.stop()
            }
        }
        private val loading = HashSet<String>()

        fun load(url: String, size: Int, ready: (Drawable) -> Unit): Drawable? {
            if (Build.VERSION.SDK_INT < 28) return null
            val key = "$url@$size"
            drawables.get(key)?.let { return it }
            if (!loading.add(key)) return null
            Net.background {
                val data = bytes.get(url) ?: Net.request(url)?.takeIf { it.code == 200 }?.body?.also { bytes.put(url, it) }
                val d = data?.let {
                    try {
                        android.graphics.ImageDecoder.decodeDrawable(android.graphics.ImageDecoder.createSource(java.nio.ByteBuffer.wrap(it))) { dec, info, _ ->
                            val k = minOf(1f, size.toFloat() / maxOf(info.size.width, info.size.height))
                            dec.setTargetSize(maxOf(1, (info.size.width * k).toInt()), maxOf(1, (info.size.height * k).toInt()))
                        }
                    } catch (e: Exception) { null }
                }
                Net.ui {
                    loading.remove(key)
                    if (d != null) { drawables.put(key, d); ready(d) }
                }
            }
            return null
        }

        fun play(d: Drawable) {
            if (Build.VERSION.SDK_INT >= 28) (d as? android.graphics.drawable.AnimatedImageDrawable)?.start()
        }

        fun pauseAll() {
            if (Build.VERSION.SDK_INT >= 28) drawables.snapshot().values.forEach { (it as? android.graphics.drawable.AnimatedImageDrawable)?.stop() }
        }

        fun clear() { drawables.evictAll() }
    }

    companion object {
        private const val EXTRA_NAME = "name"
        private const val EXTRA_TITLE = "title"

        fun open(c: Context, name: String, title: String? = null) = c.startActivity(
            Intent(c, StickerPreviewActivity::class.java).putExtra(EXTRA_NAME, name).putExtra(EXTRA_TITLE, title),
        )
    }
}
