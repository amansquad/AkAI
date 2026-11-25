package com.akai.nativekb

import android.content.Context

/**
 * An offline word dictionary between English and [lang] (assets/dict_en_<code>.txt and
 * dict_<code>_en.txt, from English Wiktionary, built by tools/gen-dict.mjs). The
 * translate tab falls back on it when the AkAI server can't be reached: it knows
 * words and short phrases, not sentences.
 */
class OfflineDict(val lang: Lang, toLang: List<String>, toEnglish: List<String>) {
    /**
     * What a lookup found: the translation of the whole text (the first, which Replace
     * types, and [others]), or the meaning of each word it knew.
     */
    class Result(val text: String, val wordByWord: Boolean, val others: List<String> = emptyList())

    private val toX = parse(toLang)
    private val toEn = parse(toEnglish)

    /**
     * [text] from [from] into [to] (English and [lang] only), or null if no word of it is known.
     * The whole text first ("thank you"); otherwise up to [MAX_WORDS] words, each with its meaning.
     */
    fun lookup(text: String, from: Lang, to: Lang): Result? {
        val intoEnglish = when {
            from == Lang.EN && to == lang -> false
            from == lang && to == Lang.EN -> true
            else -> return null
        }
        val table = if (intoEnglish) toEn else toX
        val source = if (intoEnglish) lang else Lang.EN
        val clean = normalise(text.trim().trim { it in TRIM }.replace(Regex("\\s+"), " "), source)
        if (clean.isEmpty()) return null
        // The first (most common) is the one Replace types; the rest are shown beside it.
        find(clean, table, source)?.let { line ->
            val all = line.split(if (intoEnglish) "; " else ", ")
            return Result(all.first(), wordByWord = false, others = all.drop(1))
        }
        val words = clean.split(' ').map { it.trim { c -> c in TRIM } }.filter { it.isNotEmpty() }.distinct()
        if (words.size < 2) return null
        val found = words.take(MAX_WORDS).mapNotNull { w -> find(w, table, source)?.let { "$w: ${it.substringBefore(',').substringBefore(';')}" } }
        return if (found.isEmpty()) null else Result(found.joinToString("\n"), wordByWord = true)
    }

    /** The entry for [w], or for the word it is built on (ቤቶች → ቤት, houses → house, guriga → guri). */
    private fun find(w: String, table: Map<String, String>, source: Lang): String? {
        table[w]?.let { return it }
        return bases(w, source).firstNotNullOfOrNull { table[it] }
    }

    companion object {
        const val MAX_WORDS = 12
        private const val TRIM = ".,!?;:\"'()“”«»።፣፤፥፦፧፨،؛؟"

        /** Arabic without vowel marks or the tatweel; Latin letters in lower case. */
        fun normalise(s: String, lang: Lang): String = when {
            lang == Lang.AR -> s.replace(Regex("[\\u064B-\\u065F\\u0670\\u0640]"), "")
            lang.geez -> s
            else -> s.lowercase()
        }

        private val arabicPrefixes = listOf("وال", "بال", "فال", "كال", "لل", "ال", "و", "ف", "ب", "ل", "ك")
        private val arabicSuffixes = listOf("هما", "ها", "هم", "كم", "نا", "ات", "ون", "ين", "ة", "ه", "ك", "ي")
        /** Somali's "the" endings: guriga is guri, magaalada is magaalo's "the" form. */
        private val somaliSuffixes = listOf("sha", "ka", "ta", "ga", "ha", "da", "a")
        /** Common Oromo case endings: manni, manatti, manaaf. */
        private val oromoSuffixes = listOf("irraa", "dhaa", "tti", "rraa", "ni", "n", "f")

        /** Words [w] may be built on, in [lang], best first (not [w] itself). */
        fun bases(w: String, lang: Lang): List<String> = when {
            lang.geez -> Amharic.stems(w).drop(1)
            lang == Lang.EN -> buildList {
                if (w.endsWith("ies") && w.length > 4) add(w.dropLast(3) + "y")
                if (w.endsWith("es") && w.length > 3) add(w.dropLast(2))
                if (w.endsWith("s") && !w.endsWith("ss") && w.length > 2) add(w.dropLast(1))
                if (w.endsWith("ing") && w.length > 5) { add(w.dropLast(3)); add(w.dropLast(3) + "e") }
                if (w.endsWith("ed") && w.length > 4) { add(w.dropLast(2)); add(w.dropLast(1)) }
                if (w.startsWith("the ")) add(w.removePrefix("the "))
                if (w.startsWith("a ")) add(w.removePrefix("a "))
            }
            lang == Lang.AR -> buildList {
                val stems = mutableListOf(w)
                for (p in arabicPrefixes) if (w.startsWith(p) && w.length - p.length >= 2) stems.add(w.substring(p.length))
                for (st in stems.toList()) for (sx in arabicSuffixes) if (st.endsWith(sx) && st.length - sx.length >= 2) {
                    val bare = st.dropLast(sx.length)
                    stems.add(bare)
                    if (bare.endsWith("ت")) stems.add(bare.dropLast(1) + "ة") // مدرستها is مدرسة + ها
                }
                addAll(stems.drop(1).distinct())
            }
            lang == Lang.SO -> somaliSuffixes.filter { w.endsWith(it) && w.length - it.length >= 3 }.map { w.dropLast(it.length) }
            lang == Lang.OM -> oromoSuffixes.filter { w.endsWith(it) && w.length - it.length >= 3 }.map { w.dropLast(it.length) }
            else -> emptyList()
        }

        fun parse(lines: List<String>): Map<String, String> {
            val m = HashMap<String, String>(lines.size * 2)
            for (l in lines) {
                val tab = l.indexOf('\t')
                if (tab > 0) m[l.substring(0, tab)] = l.substring(tab + 1)
            }
            return m
        }

        private val loaded = java.util.concurrent.ConcurrentHashMap<Lang, OfflineDict>()

        /**
         * The dictionary between English and [lang], read from the assets the first time it
         * is needed (off the main thread), then kept; null if there is none for [lang].
         */
        fun get(context: Context, lang: Lang): OfflineDict? = loaded[lang] ?: synchronized(this) {
            loaded[lang] ?: try {
                fun read(name: String) = context.applicationContext.assets.open(name).bufferedReader().readLines()
                OfflineDict(lang, read("dict_en_${lang.code}.txt"), read("dict_${lang.code}_en.txt")).also { loaded[lang] = it }
            } catch (e: Exception) { null }
        }
    }
}
