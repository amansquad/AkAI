package com.akai.nativekb

import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

/** A theme someone shared, as the website's /api/themes returns it. */
class SharedTheme(
    val id: String, val name: String, val emoji: String, val live: String,
    val background: Int, val key: Int, val special: Int, val accent: Int, val text: Int,
    val author: String, val installs: Int, val hidden: Boolean = false,
) {
    /** For drawing its preview; the id keeps it apart from installed themes. */
    fun toDef() = ThemeMaker.def("shared-$id", name, emoji, CustomThemes.CATEGORY, live, background, key, special, accent, text)

    /** A copy of it among the person's own themes, remembering where it came from. */
    fun toCustom() = CustomTheme(CustomThemes.newId(), name, emoji, live, background, key, special, accent, text, source = id)

    companion object {
        fun fromJson(o: JSONObject): SharedTheme {
            val c = o.getJSONObject("colors")
            fun color(k: String) = android.graphics.Color.parseColor(c.getString(k))
            return SharedTheme(
                o.getString("id"), o.getString("name"), o.optString("emoji", "🎨"), o.optString("live", ""),
                color("bg"), color("key"), color("special"), color("accent"), color("text"),
                o.optString("author", ""), o.optInt("installs", 0), o.optBoolean("hidden", false),
            )
        }
    }
}

/**
 * Community themes on the AkAI website. No account: the phone makes a random
 * id once and sends it, so the site can count one install and one report per
 * phone and let it take down the themes it shared.
 */
object Community {
    private const val DEVICE = "community_device"
    const val AUTHOR = "community_author"

    class Page(val themes: List<SharedTheme>, val next: Int?)

    fun device(context: Context): String {
        val prefs = context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
        prefs.getString(DEVICE, null)?.let { return it }
        return UUID.randomUUID().toString().also { prefs.edit().putString(DEVICE, it).apply() }
    }

    private fun server(context: Context) =
        (context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE).getString(Prefs.SERVER_URL, "") ?: "")
            .trim().ifBlank { Net.SITE }.trimEnd('/')

    private class Reply(val code: Int, val body: JSONObject?)

    /** Never throws: no connection is a null. */
    private fun call(context: Context, method: String, path: String, json: JSONObject? = null): Reply? = try {
        val c = URL(server(context) + path).openConnection() as HttpURLConnection
        c.connectTimeout = 10_000
        c.readTimeout = 20_000
        c.requestMethod = method
        c.setRequestProperty("X-AkAI-Device", device(context))
        if (json != null) {
            c.doOutput = true
            c.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            c.outputStream.use { it.write(json.toString().toByteArray(Charsets.UTF_8)) }
        }
        val code = c.responseCode
        val text = (if (code in 200..299) c.inputStream else c.errorStream)?.use { String(it.readBytes(), Charsets.UTF_8) }
        Reply(code, text?.let { try { JSONObject(it) } catch (e: Exception) { null } })
    } catch (e: Exception) { null }

    private fun parse(body: JSONObject?): List<SharedTheme> {
        val a = body?.optJSONArray("themes") ?: return emptyList()
        return (0 until a.length()).mapNotNull { try { SharedTheme.fromJson(a.getJSONObject(it)) } catch (e: Exception) { null } }
    }

    private fun errorOf(r: Reply?) = when {
        r == null -> "No connection. Check the internet and try again"
        else -> r.body?.optString("error")?.takeIf { it.isNotBlank() } ?: "Something went wrong. Try again"
    }

    /** One page of shared themes; [popular] or newest first. Null with a reason when it fails. */
    fun list(context: Context, popular: Boolean, offset: Int, done: (Page?, String?) -> Unit) = Net.background {
        val r = call(context, "GET", "/api/themes?sort=${if (popular) "popular" else "new"}&offset=$offset&limit=30")
        val page = if (r != null && r.code == 200) Page(parse(r.body), r.body?.optInt("next", -1)?.takeIf { it >= 0 }) else null
        Net.ui { done(page, if (page == null) errorOf(r) else null) }
    }

    /** The themes this phone shared, hidden ones included. */
    fun mine(context: Context, done: (List<SharedTheme>?) -> Unit) = Net.background {
        val r = call(context, "GET", "/api/themes?mine=1")
        Net.ui { done(if (r != null && r.code == 200) parse(r.body) else null) }
    }

    /** Shares one of the person's themes; answers with its new id, or an error to show. */
    fun share(context: Context, t: CustomTheme, author: String, done: (String?, String?) -> Unit) = Net.background {
        fun hex(c: Int) = String.format("#%06X", c and 0xFFFFFF)
        val body = JSONObject()
            .put("name", t.name).put("emoji", t.emoji).put("live", t.live).put("author", author)
            .put("colors", JSONObject().put("bg", hex(t.background)).put("key", hex(t.key))
                .put("special", hex(t.special)).put("accent", hex(t.accent)).put("text", hex(t.text)))
        val r = call(context, "POST", "/api/themes", body)
        val id = if (r != null && r.code == 201) r.body?.optJSONObject("theme")?.optString("id")?.takeIf { it.isNotBlank() } else null
        Net.ui { done(id, if (id == null) errorOf(r) else null) }
    }

    fun unshare(context: Context, id: String, done: (Boolean) -> Unit) = Net.background {
        val r = call(context, "DELETE", "/api/themes/$id")
        // Already gone counts as done.
        Net.ui { done(r != null && (r.code == 200 || r.code == 404)) }
    }

    /** Counts an install; a failure only means the count is one short. */
    fun countInstall(context: Context, id: String) = Net.background { call(context, "POST", "/api/themes/$id/install") }

    fun report(context: Context, id: String, done: (Boolean) -> Unit) = Net.background {
        val r = call(context, "POST", "/api/themes/$id/report")
        Net.ui { done(r != null && r.code == 200) }
    }
}
