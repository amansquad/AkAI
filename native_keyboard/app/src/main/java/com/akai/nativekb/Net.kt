package com.akai.nativekb

import android.content.ClipDescription
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.LruCache
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors

/** Small blocking-HTTP helpers that always answer on the main thread. */
object Net {
    private val pool = Executors.newFixedThreadPool(4)
    private val main = Handler(Looper.getMainLooper())

    fun background(block: () -> Unit) = pool.execute(block)
    fun ui(block: () -> Unit) = main.post(block)

    class Response(val code: Int, val body: ByteArray)

    /** Never throws: a failure is a null. */
    fun request(url: String, json: String? = null): Response? = try {
        val c = URL(url).openConnection() as HttpURLConnection
        c.connectTimeout = 10_000
        c.readTimeout = 25_000
        if (json != null) {
            c.requestMethod = "POST"
            c.doOutput = true
            c.setRequestProperty("Content-Type", "application/json")
            c.outputStream.use { it.write(json.toByteArray()) }
        }
        val code = c.responseCode
        val stream = if (code in 200..299) c.inputStream else c.errorStream
        Response(code, stream?.use { it.readBytes() } ?: ByteArray(0))
    } catch (e: Exception) {
        null
    }

    private fun base(server: String) = server.trim().trimEnd('/')

    /** The AkAI website on Vercel: where releases are published. */
    const val SITE = "https://ak-ai-opal.vercel.app"

    class Release(val code: Long, val name: String, val url: String, val notes: String)

    /**
     * The newest build the website offers, from its app-version.json
     * (public/app-version.json in the web app). Null when it can't be read.
     */
    fun latestRelease(server: String = SITE, done: (Release?) -> Unit) = background {
        val r = request("${base(server)}/app-version.json")
        val release = try {
            if (r == null || r.code !in 200..299) null else {
                val o = JSONObject(String(r.body))
                val url = o.optString("url", "/AkAI-keyboard.apk")
                Release(
                    o.getLong("versionCode"), o.optString("versionName"),
                    if (url.startsWith("http")) url else base(server) + "/" + url.trimStart('/'),
                    o.optString("notes"),
                )
            }
        } catch (e: Exception) { null }
        ui { done(release) }
    }

    /** Handwriting recognition on the AkAI server. Answers with candidates, or null. */
    fun recognize(server: String, dataUrl: String, amharic: Boolean, done: (List<String>?) -> Unit) = background {
        val body = JSONObject().put("image", dataUrl).put("language", if (amharic) "amharic" else "english").toString()
        val r = request("${base(server)}/api/handwriting-recognize", body)
        val result = if (r != null && r.code == 200) try {
            val o = JSONObject(String(r.body))
            val out = ArrayList<String>()
            for (k in listOf("characters", "words")) {
                val a = o.optJSONArray(k) ?: continue
                for (i in 0 until minOf(a.length(), 4)) a.optString(i).takeIf { it.isNotBlank() }?.let(out::add)
            }
            out.distinct()
        } catch (e: Exception) { null } else null
        ui { done(result) }
    }

    /** Translation on the AkAI server. */
    fun translate(server: String, text: String, toAmharic: Boolean, done: (String?) -> Unit) = background {
        val body = JSONObject()
            .put("text", text)
            .put("sourceLang", if (toAmharic) "English" else "Amharic")
            .put("targetLang", if (toAmharic) "Amharic" else "English")
            .toString()
        val r = request("${base(server)}/api/translate", body)
        val result = if (r != null && r.code == 200) try {
            JSONObject(String(r.body)).optString("translation").takeIf { it.isNotBlank() }
        } catch (e: Exception) { null } else null
        ui { done(result) }
    }
}

class GifItem(val id: String, val title: String, val thumbUrl: String, val fullUrl: String)

object Gifs {
    val categories = listOf("Trending", "Reactions", "Hype", "Funny", "Animals", "Mood")

    private fun catalogue(category: String, search: Boolean = false): List<GifItem> {
        val all = KeyboardData.gifs
        val picked = when {
            search -> {
                // Every word typed has to start a word in the GIF's title, category or keywords.
                val words = category.lowercase().split(' ').filter { it.isNotBlank() }
                all.filter { g ->
                    val hay = "${g.title} ${g.category} ${g.keywords}".lowercase().split(' ', '-', '!', '?', '.', ',')
                    words.all { w -> hay.any { it.startsWith(w) } }
                }
            }
            category == "Trending" -> all
            else -> all.filter { it.category == category }.ifEmpty { all }
        }
        return picked.map {
            GifItem(
                it.id, it.title,
                "https://media.giphy.com/media/${it.id}/200w_s.gif",
                "https://media.giphy.com/media/${it.id}/200.gif",
            )
        }
    }

    /** Giphy's JSON (direct, or relayed by the AkAI server) as GIFs; null if unreadable. */
    private fun parse(body: ByteArray): List<GifItem>? = try {
        val o = JSONObject(String(body))
        if (o.optBoolean("isFallback")) null else {
            val data = o.getJSONArray("data")
            (0 until data.length()).mapNotNull { i ->
                val g = data.getJSONObject(i)
                val images = g.optJSONObject("images") ?: return@mapNotNull null
                val thumb = images.optJSONObject("fixed_width_still")?.optString("url").orEmpty()
                val full = (images.optJSONObject("fixed_height") ?: images.optJSONObject("fixed_width"))
                    ?.optString("url").orEmpty()
                if (thumb.isEmpty() || full.isEmpty()) null
                else GifItem(g.optString("id"), g.optString("title"), thumb, full)
            }
        }
    } catch (e: Exception) { null }

    /**
     * The GIFs for a category (trending, or a search for the category), or,
     * with [search], for words the user typed.
     *
     * With the user's own Giphy key this asks Giphy directly, and [note] says
     * why when it falls back, so a wrong key is never a silent mystery.
     * Without one it asks the AkAI server, which holds the shared key and
     * caches answers; if that has no key or fails, the built-in catalogue
     * shows quietly, since the user set nothing up that could be wrong.
     */
    fun load(category: String, key: String, server: String, search: Boolean = false, done: (List<GifItem>, String?) -> Unit) {
        val own = key.isNotBlank()
        // Without Giphy a search can only match the built-in GIFs, so say so.
        val offline = if (search) "Full GIF search is offline - showing built-in matches" else null
        if (!own && server.isBlank()) {
            done(catalogue(category, search), offline)
            return
        }
        Net.background {
            val trending = !search && category == "Trending"
            val q = Uri.encode(category.lowercase())
            val url = if (own) {
                val endpoint = if (trending) "trending?" else "search?q=$q&"
                "https://api.giphy.com/v1/gifs/${endpoint}api_key=${Uri.encode(key.trim())}&limit=36&rating=g"
            } else {
                val query = if (trending) "type=trending" else "type=search&q=$q"
                "${server.trim().trimEnd('/')}/api/giphy?$query&limit=36"
            }
            val r = Net.request(url)
            val items = r?.takeIf { it.code == 200 }?.let { parse(it.body) }
            val note = if (!items.isNullOrEmpty()) null else if (!own) offline else when {
                r == null -> "Can't reach Giphy - showing built-in GIFs"
                r.code == 401 || r.code == 403 -> "Giphy rejected the key - showing built-in GIFs"
                r.code == 429 -> "Giphy rate limit reached - showing built-in GIFs"
                r.code != 200 -> "Giphy error ${r.code} - showing built-in GIFs"
                items == null -> "Unexpected reply from Giphy - showing built-in GIFs"
                else -> "Giphy returned no GIFs - showing built-in GIFs"
            }
            Net.ui {
                if (items.isNullOrEmpty()) done(catalogue(category, search), note)
                else done(items, null)
            }
        }
    }

    // ─── Thumbnails ──────────────────────────────────────────────────────

    private val thumbs = LruCache<String, Bitmap>(80)
    private val loading = HashSet<String>()

    /** The thumbnail if it is ready; otherwise starts loading it and calls [onLoaded] later. */
    fun thumb(url: String, onLoaded: () -> Unit): Bitmap? {
        thumbs.get(url)?.let { return it }
        if (!loading.add(url)) return null
        Net.background {
            val r = Net.request(url)
            val bmp = r?.takeIf { it.code == 200 }?.let { BitmapFactory.decodeByteArray(it.body, 0, it.body.size) }
            Net.ui {
                loading.remove(url)
                if (bmp != null) { thumbs.put(url, bmp); onLoaded() }
            }
        }
        return null
    }

    /** Downloads the GIF to the cache and answers with a content:// address the app can read. */
    fun fetch(context: Context, item: GifItem, done: (Uri?) -> Unit) {
        Net.background {
            val dir = File(context.cacheDir, "gifs").apply { mkdirs() }
            val name = MessageDigest.getInstance("MD5").digest(item.fullUrl.toByteArray())
                .joinToString("") { "%02x".format(it) } + ".gif"
            val file = File(dir, name)
            if (!file.exists()) {
                val r = Net.request(item.fullUrl)
                if (r != null && r.code == 200) file.writeBytes(r.body)
            }
            val uri = if (file.exists() && file.length() > 0) {
                FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
            } else null
            Net.ui { done(uri) }
        }
    }

    val mime = ClipDescription("GIF", arrayOf("image/gif"))
}
