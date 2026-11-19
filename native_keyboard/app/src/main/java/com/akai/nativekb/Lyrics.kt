package com.akai.nativekb

import org.json.JSONArray

/** A song found in the Lyrics tab: who sang it, what it is called, and its lyrics line by line. */
class Song(val artist: String, val title: String, val lines: List<String>)

/**
 * Looks songs up on LRCLIB (https://lrclib.net), a free community lyrics database
 * that needs no key. It is only called when someone searches in the Lyrics tab,
 * and only the search words are sent. Nothing is stored on the phone.
 */
object Lyrics {
    /** LRCLIB asks every client to say who it is. */
    private const val CLIENT = "AkAI Keyboard (https://ak-ai-opal.vercel.app)"

    /** Songs matching [query], or null when LRCLIB couldn't be reached. Answers on the main thread. */
    fun search(query: String, done: (List<Song>?) -> Unit) {
        Net.background {
            val url = "https://lrclib.net/api/search?q=" + java.net.URLEncoder.encode(query.trim(), "UTF-8")
            val r = Net.request(url, userAgent = CLIENT)
            val songs = if (r != null && r.code == 200) parse(String(r.body, Charsets.UTF_8)) else null
            Net.ui { done(songs) }
        }
    }

    /** LRCLIB's search reply as songs: only ones with lyrics, one per artist and title. Null if unreadable. */
    fun parse(json: String): List<Song>? = try {
        val a = JSONArray(json)
        val seen = HashSet<String>()
        val out = ArrayList<Song>()
        for (i in 0 until a.length()) {
            val o = a.optJSONObject(i) ?: continue
            if (o.optBoolean("instrumental")) continue
            val lines = lines(o.optString("plainLyrics"))
            if (lines.isEmpty()) continue
            val artist = o.optString("artistName").trim()
            val title = clean(o.optString("trackName"), artist)
            if (title.isEmpty() || !seen.add("${artist.lowercase()}|${title.lowercase()}")) continue
            out.add(Song(artist, title, lines))
        }
        out
    } catch (e: Exception) {
        null
    }

    /** Non-empty lines, without section tags such as "[Chorus]". */
    fun lines(plain: String) = plain.split('\n').map { it.trim() }.filter { it.isNotEmpty() && !(it.startsWith("[") && it.endsWith("]")) }

    /** "Teddy Afro - Lambadina [Official Video]" is uploaded as the title; show just "Lambadina". */
    fun clean(title: String, artist: String): String {
        val whole = title.trim()
        var t = whole.replace(Regex("\\s*[\\[(](official|lyrics?|video|audio|hd|4k)[^\\])]*[\\])]", RegexOption.IGNORE_CASE), "").trim()
        // Uploads often repeat the artist, even twice ("Teddy Afro - Teddy Afro - Song").
        if (artist.isNotEmpty()) {
            val prefix = Regex("^" + Regex.escape(artist) + "\\s*[-–—]\\s+", RegexOption.IGNORE_CASE)
            while (true) {
                val m = prefix.find(t) ?: break
                t = t.substring(m.range.last + 1).trim()
            }
        }
        // A song named after its artist keeps its name.
        return t.ifEmpty { whole }
    }
}
