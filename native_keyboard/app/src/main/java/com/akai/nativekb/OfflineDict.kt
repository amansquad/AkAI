package com.akai.nativekb

import android.content.Context

/**
 * The offline English↔Amharic word dictionary (assets/dict_en_am.txt and
 * dict_am_en.txt, from English Wiktionary, built by tools/gen-dict-am.mjs).
 * The translate tab falls back on it when the AkAI server can't be reached:
 * it knows words and short phrases, not sentences.
 */
class OfflineDict(enAm: List<String>, amEn: List<String>) {
    /** What a lookup found: the translation of the whole text, or the meaning of each word it knew. */
    class Result(val text: String, val wordByWord: Boolean, val others: List<String> = emptyList())

    private val toAm = parse(enAm)
    private val toEn = parse(amEn)

    /**
     * [text] from [from] into [to] (English and Amharic only), or null if no word of it is known.
     * The whole text first ("thank you"); otherwise up to [MAX_WORDS] words, each with its meaning.
     */
    fun lookup(text: String, from: Lang, to: Lang): Result? {
        val amharic = when {
            from == Lang.EN && to == Lang.AM -> false
            from == Lang.AM && to == Lang.EN -> true
            else -> return null
        }
        val table = if (amharic) toEn else toAm
        val clean = text.trim().trim { it in TRIM }.replace(Regex("\\s+"), " ").let { if (amharic) it else it.lowercase() }
        if (clean.isEmpty()) return null
        // The first (most common) is the one Replace types; the rest are shown beside it.
        find(clean, table, amharic)?.let { line ->
            val all = line.split(if (amharic) "; " else ", ")
            return Result(all.first(), wordByWord = false, others = all.drop(1))
        }
        val words = clean.split(' ').map { it.trim { c -> c in TRIM } }.filter { it.isNotEmpty() }.distinct()
        if (words.size < 2) return null
        val found = words.take(MAX_WORDS).mapNotNull { w -> find(w, table, amharic)?.let { "$w: ${it.substringBefore(',').substringBefore(';')}" } }
        return if (found.isEmpty()) null else Result(found.joinToString("\n"), wordByWord = true)
    }

    /** The entry for [w], or for the word it is built on (ቤቶች → ቤት, houses → house). */
    private fun find(w: String, table: Map<String, String>, amharic: Boolean): String? {
        table[w]?.let { return it }
        val bases = if (amharic) Amharic.stems(w).drop(1) else englishBases(w)
        return bases.firstNotNullOfOrNull { table[it] }
    }

    private fun englishBases(w: String): List<String> = buildList {
        if (w.endsWith("ies") && w.length > 4) add(w.dropLast(3) + "y")
        if (w.endsWith("es") && w.length > 3) add(w.dropLast(2))
        if (w.endsWith("s") && !w.endsWith("ss") && w.length > 2) add(w.dropLast(1))
        if (w.endsWith("ing") && w.length > 5) { add(w.dropLast(3)); add(w.dropLast(3) + "e") }
        if (w.endsWith("ed") && w.length > 4) { add(w.dropLast(2)); add(w.dropLast(1)) }
        if (w.startsWith("the ")) add(w.removePrefix("the "))
        if (w.startsWith("a ")) add(w.removePrefix("a "))
    }

    companion object {
        const val MAX_WORDS = 12
        private const val TRIM = ".,!?;:\"'()“”«»።፣፤፥፦፧፨"

        fun parse(lines: List<String>): Map<String, String> {
            val m = HashMap<String, String>(lines.size * 2)
            for (l in lines) {
                val tab = l.indexOf('\t')
                if (tab > 0) m[l.substring(0, tab)] = l.substring(tab + 1)
            }
            return m
        }

        @Volatile private var loaded: OfflineDict? = null

        /** Read from the assets the first time it is needed (off the main thread), then kept. */
        fun get(context: Context): OfflineDict? = loaded ?: synchronized(this) {
            loaded ?: try {
                fun read(name: String) = context.applicationContext.assets.open(name).bufferedReader().readLines()
                OfflineDict(read("dict_en_am.txt"), read("dict_am_en.txt")).also { loaded = it }
            } catch (e: Exception) { null }
        }
    }
}
