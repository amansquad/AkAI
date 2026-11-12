package com.akai.nativekb

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Sticker packs made of pictures: the ones built into the app (assets/sticker_packs)
 * and the ones people import from Telegram links in Settings (files/sticker_packs).
 * Both are a folder holding pack.json and one picture per sticker:
 *
 *   { "name": "PackName", "title": "Pack title",
 *     "stickers": [ { "id": "AgADxyz", "emoji": "😂", "file": "AgADxyz.webp",
 *                     "anim": "AgADxyz.anim.webp", "gif": "/api/stickers/file?…&as=gif" } ] }
 *
 * "anim" (an animated WebP) and "gif" (where the website serves a GIF) are only
 * there for video stickers; "file" is always a still picture.
 *
 * Importing goes through the Akai website (/api/stickers), which holds the
 * Telegram bot token, so the phone never needs one.
 */
object StickerPacks {
    private const val DIR = "sticker_packs"
    /** Telegram's own limit for a regular pack. */
    private const val MAX_STICKERS = 120

    private lateinit var app: Context
    private var cache: List<Stickers.Pack>? = null

    /** Bumped whenever packs are added or removed, so open panels know to look again. */
    var version = 0
        private set

    private fun init(context: Context) {
        if (!::app.isInitialized) app = context.applicationContext
    }

    private fun userDir() = File(app.filesDir, DIR)

    /** Built-in packs, then imported ones, newest last. */
    fun all(context: Context): List<Stickers.Pack> {
        init(context)
        cache?.let { return it }
        val list = ArrayList<Stickers.Pack>()
        val bundled = try { app.assets.list(DIR).orEmpty().sorted() } catch (e: Exception) { emptyList() }
        for (name in bundled) {
            val json = try { app.assets.open("$DIR/$name/pack.json").bufferedReader().use { it.readText() } } catch (e: Exception) { continue }
            read(json, "asset:$DIR/$name/", removable = false)?.let(list::add)
        }
        val imported = userDir().listFiles()?.filter { File(it, "pack.json").exists() }.orEmpty()
            .sortedBy { File(it, "pack.json").lastModified() }
        for (dir in imported) {
            if (list.any { it.key == dir.name }) continue // already built in
            val json = try { File(dir, "pack.json").readText() } catch (e: Exception) { continue }
            read(json, dir.absolutePath + "/", removable = true)?.let(list::add)
        }
        return list.also { cache = it }
    }

    /** The packs people imported, which Settings lists and can remove. */
    fun imported(context: Context) = all(context).filter { it.removable }

    private fun read(json: String, base: String, removable: Boolean): Stickers.Pack? = try {
        val o = JSONObject(json)
        val name = o.getString("name")
        val a = o.getJSONArray("stickers")
        val stickers = (0 until a.length()).map { i ->
            val s = a.getJSONObject(i)
            Stickers.picture(
                "$name/${s.getString("id")}", s.optString("emoji"), base + s.getString("file"),
                s.optString("anim").ifEmpty { null }?.let { base + it },
                s.optString("gif").ifEmpty { null },
            )
        }
        if (stickers.isEmpty()) null
        else Stickers.Pack(o.optString("title", name).ifBlank { name }, stickers, key = name, removable = removable)
    } catch (e: Exception) { null }

    private fun changed() {
        cache = null
        version++
    }

    fun remove(context: Context, key: String) {
        init(context)
        File(userDir(), key).deleteRecursively()
        changed()
    }

    // ─── Pictures ────────────────────────────────────────────────────────

    /**
     * Decodes a sticker's picture at no more than [size] pixels across, or null.
     * [image] is "asset:<path>" or a file path.
     */
    fun decode(image: String, size: Int): Bitmap? = try {
        fun open() = if (image.startsWith("asset:")) app.assets.open(image.removePrefix("asset:")) else File(image).inputStream()
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        open().use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (bounds.outWidth / (sample * 2) >= size && bounds.outHeight / (sample * 2) >= size) sample *= 2
        open().use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) }
    } catch (e: Exception) { null }

    /**
     * An animated sticker as a playing drawable no more than [size] pixels across,
     * or null (before Android 9, which can't play animated WebP, or if it won't decode).
     * Call off the main thread.
     */
    fun decodeAnimated(anim: String, size: Int): android.graphics.drawable.Drawable? {
        if (android.os.Build.VERSION.SDK_INT < 28) return null
        return try {
            val source = if (anim.startsWith("asset:")) android.graphics.ImageDecoder.createSource(app.assets, anim.removePrefix("asset:"))
            else android.graphics.ImageDecoder.createSource(File(anim))
            android.graphics.ImageDecoder.decodeDrawable(source) { decoder, info, _ ->
                val k = minOf(1f, size.toFloat() / maxOf(info.size.width, info.size.height))
                decoder.setTargetSize(maxOf(1, (info.size.width * k).toInt()), maxOf(1, (info.size.height * k).toInt()))
            }
        } catch (e: Exception) { null }
    }

    /** Copies a sticker's animated WebP to the cache, for sending; a content:// link, or null. */
    fun exportAnimated(context: Context, st: Stickers.Sticker, done: (Uri?) -> Unit) {
        init(context)
        val anim = st.anim ?: return done(null)
        Net.background {
            val uri = try {
                val dir = File(app.cacheDir, "stickers").apply { mkdirs() }
                val file = File(dir, "akai_anim_${st.id}.webp")
                if (!file.exists()) {
                    val input = if (anim.startsWith("asset:")) app.assets.open(anim.removePrefix("asset:")) else File(anim).inputStream()
                    val tmp = File(dir, "${file.name}.tmp")
                    input.use { i -> tmp.outputStream().use { i.copyTo(it) } }
                    tmp.renameTo(file)
                }
                androidx.core.content.FileProvider.getUriForFile(app, "${app.packageName}.fileprovider", file)
            } catch (e: Exception) { null }
            Net.ui { done(uri) }
        }
    }

    /** Downloads a sticker as a GIF from the Akai website (cached after the first time); a content:// link, or null. */
    fun fetchGif(context: Context, st: Stickers.Sticker, done: (Uri?) -> Unit) {
        init(context)
        val path = st.gif ?: return done(null)
        val url = if (path.startsWith("http")) path else server(context) + path
        Net.background {
            val uri = try {
                val dir = File(app.cacheDir, "stickers").apply { mkdirs() }
                val file = File(dir, "akai_gif_${st.id}.gif")
                if (!file.exists()) {
                    val r = Net.request(url)
                    if (r != null && r.code == 200 && r.body.size > 6 && String(r.body, 0, 3) == "GIF") {
                        val tmp = File(dir, "${file.name}.tmp")
                        tmp.writeBytes(r.body)
                        tmp.renameTo(file)
                    }
                }
                if (file.exists()) androidx.core.content.FileProvider.getUriForFile(app, "${app.packageName}.fileprovider", file) else null
            } catch (e: Exception) { null }
            Net.ui { done(uri) }
        }
    }

    // ─── Importing ───────────────────────────────────────────────────────

    /** "https://t.me/addstickers/Name", "t.me/addstickers/Name", "tg://addstickers?set=Name" or just "Name". */
    fun nameFrom(link: String): String? {
        val s = link.trim()
        val m = Regex("""(?:t\.me|telegram\.me|telegram\.dog)/addstickers/([A-Za-z0-9_]+)""", RegexOption.IGNORE_CASE).find(s)
            ?: Regex("""addstickers\?set=([A-Za-z0-9_]+)""", RegexOption.IGNORE_CASE).find(s)
        val name = m?.groupValues?.get(1) ?: s
        return name.takeIf { Regex("""[A-Za-z0-9_]{1,64}""").matches(it) }
    }

    private fun server(context: Context) =
        (context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).getString(Prefs.SERVER_URL, "") ?: "")
            .trim().ifBlank { Net.SITE }.trimEnd('/')

    private fun error(r: Net.Response?, fallback: String): String =
        if (r == null) "Couldn't reach the Akai server. Check your connection"
        else try { JSONObject(String(r.body)).optString("error").ifBlank { fallback } } catch (e: Exception) { fallback }

    /**
     * Downloads the Telegram pack behind [link] onto the phone. [progress] and
     * [done] run on the main thread; [done] gets the pack, or null and why not.
     */
    fun import(context: Context, link: String, title: String? = null, progress: (String) -> Unit, done: (Stickers.Pack?, String?) -> Unit) {
        init(context)
        val name = nameFrom(link)
        if (name == null) { done(null, "Paste a link like t.me/addstickers/PackName"); return }
        if (all(context).any { it.key.equals(name, ignoreCase = true) }) { done(null, "You already have that pack"); return }
        val server = server(context)
        progress("Looking up $name…")
        Net.background {
            val r = Net.request("$server/api/stickers?pack=${Uri.encode(name)}")
            if (r == null || r.code != 200) {
                val why = error(r, if (r?.code == 404) "No Telegram sticker pack called $name" else "The server couldn't load that pack (${r?.code})")
                Net.ui { done(null, why) }
                return@background
            }
            val o = try { JSONObject(String(r.body)) } catch (e: Exception) { null }
            val list = o?.optJSONArray("stickers")
            if (o == null || list == null || list.length() == 0) { Net.ui { done(null, "That pack has no stickers") }; return@background }
            val key = o.optString("name", name).takeIf { Regex("""[A-Za-z0-9_]{1,64}""").matches(it) } ?: name
            val title = title?.takeIf { it.isNotBlank() } ?: o.optString("title", key)

            val tmp = File(userDir(), ".$key.part").apply { deleteRecursively(); mkdirs() }
            val total = minOf(list.length(), MAX_STICKERS)
            val results = arrayOfNulls<JSONObject>(total)
            val finished = java.util.concurrent.atomic.AtomicInteger()
            // A few at a time: a moving sticker can take the server a moment to convert.
            val pool = java.util.concurrent.Executors.newFixedThreadPool(4)
            for (i in 0 until total) pool.execute {
                val s = list.getJSONObject(i)
                val id = s.optString("id").filter { it.isLetterOrDigit() || it == '_' || it == '-' }.ifEmpty { "s$i" }
                fun get(path: String): ByteArray? = path.takeIf { it.isNotEmpty() }
                    ?.let { Net.request(if (it.startsWith("http")) it else server + it) }
                    ?.takeIf { it.code == 200 && it.body.isNotEmpty() }?.body
                val still = get(s.optString("still"))
                // Keep only what Android can actually show.
                val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                if (still != null) BitmapFactory.decodeByteArray(still, 0, still.size, bounds)
                if (still != null && bounds.outWidth > 0) {
                    File(tmp, "$id.img").writeBytes(still)
                    val entry = JSONObject().put("id", id).put("emoji", s.optString("emoji")).put("file", "$id.img")
                    get(s.optString("anim"))?.let { File(tmp, "$id.anim").writeBytes(it); entry.put("anim", "$id.anim") }
                    s.optString("gif").takeIf { it.isNotEmpty() }?.let { entry.put("gif", it) }
                    results[i] = entry
                }
                val n = finished.incrementAndGet()
                Net.ui { progress("Downloading $n of $total…") }
            }
            pool.shutdown()
            pool.awaitTermination(15, java.util.concurrent.TimeUnit.MINUTES)
            val saved = JSONArray()
            results.forEach { it?.let(saved::put) }
            if (saved.length() == 0) {
                tmp.deleteRecursively()
                Net.ui { done(null, "None of the stickers could be downloaded. Try again later") }
                return@background
            }
            File(tmp, "pack.json").writeText(JSONObject().put("name", key).put("title", title).put("stickers", saved).toString())
            val dest = File(userDir(), key)
            dest.deleteRecursively()
            val moved = tmp.renameTo(dest)
            Net.ui {
                if (!moved) { tmp.deleteRecursively(); done(null, "Couldn't save the pack"); return@ui }
                changed()
                done(all(context).firstOrNull { it.key == key }, null)
            }
        }
    }
}
