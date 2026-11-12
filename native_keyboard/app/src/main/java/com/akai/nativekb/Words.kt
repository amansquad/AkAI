package com.akai.nativekb

import android.content.Context
import kotlin.math.hypot
import kotlin.math.ln
import kotlin.math.max

/**
 * How a word is swiped on one board: the keys the finger passes over, in
 * order. A word can have several (Amharic spelt in Latin letters has more than
 * one usual spelling), and none if the board cannot type it.
 */
fun interface Spelling {
    fun paths(word: String): List<String>

    companion object {
        /** English: the word's own letters, apostrophes left out. */
        val LETTERS = Spelling { listOf(Dictionary.lettersOf(it)) }
    }
}

/**
 * A word list (most common first): assets/words_en.txt or words_am.txt. Used
 * for completions, auto-correct and swipe typing. Plain Kotlin, so it can be
 * tested without a phone.
 */
class Dictionary(words: List<String>, spellings: List<Spelling> = listOf(Spelling.LETTERS)) {
    private val rank = HashMap<String, Int>(words.size * 2)
    /** Sorted copy, for prefix lookups. */
    private val sorted: Array<String>
    /** For each spelling, words by the first and last key of their path, for swipe typing. */
    private val byEnds = HashMap<Spelling, HashMap<Int, MutableList<Swiped>>>()

    /** A word and one path that types it. */
    class Swiped(val word: String, val path: String)

    init {
        for ((i, w) in words.withIndex()) if (w.isNotEmpty() && w !in rank) rank[w] = i
        sorted = rank.keys.toTypedArray().also { it.sort() }
        for (s in spellings) {
            val index = HashMap<Int, MutableList<Swiped>>()
            for (w in rank.keys) for (p in s.paths(w)) {
                if (p.length < 2) continue
                index.getOrPut(ends(p[0], p.last())) { ArrayList() }.add(Swiped(w, p))
            }
            byEnds[s] = index
        }
    }

    val size get() = rank.size
    operator fun contains(word: String) = word in rank
    /** 0 is the most common word; unknown words rank after every known one. */
    fun rankOf(word: String) = rank[word] ?: Int.MAX_VALUE

    /**
     * Up to [limit] known words that start with [prefix] (longer than it) and
     * pass [keep], most common first.
     */
    fun completions(prefix: String, limit: Int, keep: (String) -> Boolean = { true }): List<String> {
        if (prefix.isEmpty()) return emptyList()
        var lo = 0
        var hi = sorted.size
        while (lo < hi) { val mid = (lo + hi) ushr 1; if (sorted[mid] < prefix) lo = mid + 1 else hi = mid }
        val found = ArrayList<String>()
        var i = lo
        // Long prefix ranges ("t…") are capped; the most common words win anyway.
        while (i < sorted.size && sorted[i].startsWith(prefix) && i - lo < 6000) {
            if (sorted[i].length > prefix.length && keep(sorted[i])) found.add(sorted[i])
            i++
        }
        return found.sortedBy { rankOf(it) }.take(limit)
    }

    /** Words whose path in [spelling] starts with [first] and ends with [last]. */
    fun withEnds(first: Char, last: Char, spelling: Spelling = Spelling.LETTERS): List<Swiped> =
        byEnds[spelling]?.get(ends(first, last)).orEmpty()

    companion object {
        fun lettersOf(w: String) = w.filter { it != '\'' }
        private fun ends(a: Char, b: Char) = a.code * 65536 + b.code
    }
}

/** The bundled English and Amharic dictionaries, loaded once off the main thread. */
object Words {
    @Volatile var en: Dictionary? = null
        private set
    @Volatile var am: Dictionary? = null
        private set
    private var started = false

    fun load(context: Context) {
        if (started) return
        started = true
        val app = context.applicationContext
        fun read(name: String) = app.assets.open(name).bufferedReader().useLines { lines -> lines.filter { it.isNotBlank() }.toList() }
        Thread {
            // No list just means completions fall back to the small built-in ones.
            try { en = Dictionary(read("words_en.txt")) } catch (e: Exception) { }
            try { am = Amharic.dictionary(read("words_am.txt")) } catch (e: Exception) { }
        }.start()
    }
}

/** Fixes a mistyped English word when space or punctuation ends it. */
object AutoCorrect {

    /** Common slips that are not one letter away, or need an apostrophe or a capital. */
    val fixes: Map<String, String> = mapOf(
        "i" to "I", "im" to "I'm", "ive" to "I've", "dont" to "don't", "cant" to "can't",
        "didnt" to "didn't", "doesnt" to "doesn't", "isnt" to "isn't", "wasnt" to "wasn't",
        "couldnt" to "couldn't", "wouldnt" to "wouldn't", "shouldnt" to "shouldn't", "havent" to "haven't",
        "arent" to "aren't", "hasnt" to "hasn't", "werent" to "weren't", "youre" to "you're",
        "theyre" to "they're", "thats" to "that's", "whats" to "what's", "theres" to "there's",
        "youve" to "you've", "weve" to "we've", "itll" to "it'll",
        "teh" to "the", "adn" to "and", "taht" to "that", "thier" to "their", "recieve" to "receive",
        "alot" to "a lot", "becuase" to "because", "beacuse" to "because", "wich" to "which",
        "definately" to "definitely", "seperate" to "separate", "untill" to "until", "freind" to "friend",
        "beleive" to "believe", "occured" to "occurred", "tommorow" to "tomorrow", "tomorow" to "tomorrow",
        "goverment" to "government", "realy" to "really", "acheive" to "achieve", "wierd" to "weird",
    )

    /**
     * The correction for [typed], or null to leave it. [learned] words (lower case)
     * are never corrected, and are preferred as corrections.
     */
    fun correct(typed: String, dict: Dictionary?, learned: Map<String, Int> = emptyMap()): String? {
        if (typed.isEmpty() || !typed.all { it.isLetter() || it == '\'' }) return null
        val w = typed.lowercase()
        if (w in learned) return null
        // ("id", "ill" and "wont" are real words, so they are not in this list.)
        fixes[w]?.let { return matchCase(typed, it) }
        if (dict == null || w.length < 3 || w in dict) return null
        val best = candidates(w, dict, learned).firstOrNull() ?: return null
        return matchCase(typed, best)
    }

    /** Known words one edit from [w], best first: words the user types, then the most common. */
    fun candidates(w: String, dict: Dictionary, learned: Map<String, Int> = emptyMap()): List<String> {
        val found = HashSet<String>()
        for (e in edits(w)) if (e in dict || e in learned) found.add(e)
        // Short words have many neighbours; only a common one is a safe guess.
        val cap = when { w.length <= 3 -> 1500; w.length == 4 -> 6000; else -> Int.MAX_VALUE }
        return found
            .filter { it in learned || dict.rankOf(it) < cap }
            .sortedWith(compareByDescending<String> { learned[it] ?: 0 }.thenBy { dict.rankOf(it) - neighbourBonus(w, it) })
    }

    /** Every string one deletion, swap, replacement or insertion away. */
    fun edits(w: String): Sequence<String> = sequence {
        val abc = "abcdefghijklmnopqrstuvwxyz"
        for (i in w.indices) yield(w.removeRange(i, i + 1))
        for (i in 0 until w.length - 1) yield(w.substring(0, i) + w[i + 1] + w[i] + w.substring(i + 2))
        for (i in w.indices) for (c in abc) if (c != w[i]) yield(w.substring(0, i) + c + w.substring(i + 1))
        for (i in 0..w.length) for (c in abc) yield(w.substring(0, i) + c + w.substring(i))
    }

    private val qwertyRows = listOf("qwertyuiop", "asdfghjkl", "zxcvbnm")
    private fun pos(c: Char): Pair<Int, Int>? {
        for ((r, row) in qwertyRows.withIndex()) { val i = row.indexOf(c); if (i >= 0) return r to i }
        return null
    }

    /** A replaced letter that sits next to the intended one is the likeliest slip. */
    private fun neighbourBonus(typed: String, word: String): Int {
        if (typed.length != word.length) return 0
        val i = typed.indices.firstOrNull { typed[it] != word[it] } ?: return 0
        val a = pos(typed[i]) ?: return 0
        val b = pos(word[i]) ?: return 0
        return if (kotlin.math.abs(a.first - b.first) <= 1 && kotlin.math.abs(a.second - b.second) <= 1) 2500 else 0
    }

    fun matchCase(typed: String, fix: String): String = when {
        typed.length > 1 && typed.all { !it.isLetter() || it.isUpperCase() } -> fix.uppercase()
        typed[0].isUpperCase() -> fix.replaceFirstChar { it.uppercase() }
        else -> fix
    }
}

/**
 * Turns a swipe across the letters into words: the words whose letters lie
 * along the path, ranked by how closely their ideal path matches the finger's
 * shape and by how common they are.
 */
object Glide {
    private const val N = 32

    /**
     * [xs]/[ys] are the finger's points. [keys] maps each key's letter to its centre;
     * [keyW] is a key's width. [spelling] gives the keys each word passes over on
     * this board. Returns up to [limit] words, best first.
     */
    fun decode(
        xs: FloatArray, ys: FloatArray, keys: Map<Char, FloatArray>, keyW: Float,
        dict: Dictionary?, learned: Map<String, Int> = emptyMap(), limit: Int = 4,
        spelling: Spelling = Spelling.LETTERS,
    ): List<String> {
        if (xs.size < 2 || keys.isEmpty()) return emptyList()
        val starts = near(xs[0], ys[0], keys, keyW)
        val endsAt = near(xs.last(), ys.last(), keys, keyW)
        val user = resample(xs, ys)

        val pool = ArrayList<Dictionary.Swiped>()
        val learnedPaths = learned.keys.flatMap { w -> spelling.paths(w).map { Dictionary.Swiped(w, it) } }
        for (a in starts) for (b in endsAt) {
            dict?.withEnds(a, b, spelling)?.let(pool::addAll)
            for (s in learnedPaths) if (s.path.length >= 2 && s.path[0] == a && s.path.last() == b) pool.add(s)
        }

        // A word with several paths scores by its best one.
        val best = HashMap<String, Float>()
        for (s in pool) {
            val letters = s.path
            if (!letters.all { it in keys }) continue
            if (!alongPath(letters, xs, ys, keys, keyW)) continue
            val ideal = idealPath(letters, keys)
            val shape = distance(user, ideal) / keyW
            val r = dict?.rankOf(s.word) ?: Int.MAX_VALUE
            val common = if (s.word in learned) 1f else if (r == Int.MAX_VALUE) 0f else 1f - ln(r + 2f) / ln(25000f)
            val score = shape - 0.45f * common
            if (score < (best[s.word] ?: Float.MAX_VALUE)) best[s.word] = score
        }
        return best.entries.sortedBy { it.value }.take(limit).map { it.key }
    }

    /** Letters whose key centre is close to a point: the nearest, plus any almost as near. */
    private fun near(x: Float, y: Float, keys: Map<Char, FloatArray>, keyW: Float): List<Char> {
        val d = keys.entries.map { it.key to hypot(it.value[0] - x, it.value[1] - y) }.sortedBy { it.second }
        val best = d.first().second
        return d.filter { it.second <= max(best * 1.35f, keyW * 0.55f) }.take(3).map { it.first }
    }

    /** Each letter must be passed near, in order. */
    private fun alongPath(letters: String, xs: FloatArray, ys: FloatArray, keys: Map<Char, FloatArray>, keyW: Float): Boolean {
        var i = 0
        val reach = keyW * 1.1f
        for (c in letters) {
            val k = keys[c] ?: return false
            var hit = false
            var j = i
            while (j < xs.size) {
                if (hypot(xs[j] - k[0], ys[j] - k[1]) <= reach) { hit = true; i = j; break }
                j++
            }
            if (!hit) return false
        }
        return true
    }

    private fun idealPath(letters: String, keys: Map<Char, FloatArray>): Array<FloatArray> {
        val px = ArrayList<Float>()
        val py = ArrayList<Float>()
        for (c in letters) {
            val k = keys.getValue(c)
            if (px.isNotEmpty() && px.last() == k[0] && py.last() == k[1]) continue // a double letter is one point
            px.add(k[0]); py.add(k[1])
        }
        if (px.size == 1) { px.add(px[0]); py.add(py[0]) }
        return resample(px.toFloatArray(), py.toFloatArray())
    }

    /** [N] points evenly spaced along the path. */
    fun resample(xs: FloatArray, ys: FloatArray): Array<FloatArray> {
        var total = 0f
        for (i in 1 until xs.size) total += hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1])
        val out = Array(N) { FloatArray(2) }
        if (total <= 0f) { for (p in out) { p[0] = xs[0]; p[1] = ys[0] }; return out }
        val step = total / (N - 1)
        out[0][0] = xs[0]; out[0][1] = ys[0]
        var n = 1
        var acc = 0f
        var px = xs[0]; var py = ys[0]
        var i = 1
        while (i < xs.size && n < N) {
            val d = hypot(xs[i] - px, ys[i] - py)
            if (d > 0f && acc + d >= step) {
                val t = (step - acc) / d
                px += t * (xs[i] - px); py += t * (ys[i] - py)
                out[n][0] = px; out[n][1] = py
                n++
                acc = 0f
            } else { acc += d; px = xs[i]; py = ys[i]; i++ }
        }
        while (n < N) { out[n][0] = xs.last(); out[n][1] = ys.last(); n++ }
        return out
    }

    private fun distance(a: Array<FloatArray>, b: Array<FloatArray>): Float {
        var s = 0f
        for (i in 0 until N) s += hypot(a[i][0] - b[i][0], a[i][1] - b[i][1])
        return s / N
    }
}
