package com.akai.nativekb

/**
 * Amharic words: the swipe paths on the fidel and phonetic boards, completions
 * that allow for the vowel still to come, and corrections. Plain Kotlin, so it
 * can be tested without a phone.
 */
object Amharic {

    /** Each letter's consonant (the key it is typed from) and its vowel order. */
    private val familyOf = HashMap<Char, Pair<Char, Int>>().apply {
        for ((base, forms) in KeyboardData.amharicVowels) for ((i, f) in forms.withIndex()) {
            if (base.length == 1 && f.length == 1) put(f[0], base[0] to i)
        }
    }

    /** The letter's whole vowel family, or null for anything that is not a fidel letter. */
    fun family(c: Char): List<String>? = familyOf[c]?.let { KeyboardData.amharicVowels[it.first.toString()] }

    fun isFidel(c: Char) = c in familyOf

    /** The fidel board: a word is swiped over its consonants, whatever their vowels. */
    val FIDEL = Spelling { w ->
        val sb = StringBuilder(w.length)
        for (c in w) sb.append(familyOf[c]?.first ?: return@Spelling emptyList())
        listOf(sb.toString())
    }

    /**
     * How each consonant is usually spelt in Latin letters, the first as the
     * phonetic board types it. Capitals (T for ጠ) are the same key, so all lower case.
     */
    private val latinConsonant: Map<Char, List<String>> = mapOf(
        'ሀ' to listOf("h"), 'ለ' to listOf("l"), 'ሐ' to listOf("h"), 'መ' to listOf("m"),
        'ሠ' to listOf("s"), 'ረ' to listOf("r"), 'ሰ' to listOf("s"), 'ሸ' to listOf("sh"),
        'ቀ' to listOf("q", "k"), 'በ' to listOf("b"), 'ቨ' to listOf("v"), 'ተ' to listOf("t"),
        'ቸ' to listOf("ch"), 'ኀ' to listOf("h"), 'ነ' to listOf("n"), 'ኘ' to listOf("ny", "gn"),
        'አ' to listOf(""), 'ዐ' to listOf(""), 'ከ' to listOf("k"), 'ኸ' to listOf("h", "kh"),
        'ወ' to listOf("w"), 'ዘ' to listOf("z"), 'ዠ' to listOf("zh"), 'የ' to listOf("y"),
        'ደ' to listOf("d"), 'ጀ' to listOf("j"), 'ገ' to listOf("g"), 'ጠ' to listOf("t"),
        'ጨ' to listOf("ch", "c"), 'ጰ' to listOf("p"), 'ጸ' to listOf("ts", "s"), 'ፀ' to listOf("ts", "s"),
        'ፈ' to listOf("f"), 'ፐ' to listOf("p"),
    )

    /** The vowel for each order after a consonant; the first is how the phonetic board types it. */
    private fun latinVowel(base: Char, order: Int, familySize: Int): List<String> {
        val carrier = base == 'አ' || base == 'ዐ'
        return when (order) {
            0 -> if (carrier) listOf("a", "e") else listOf("e", "a")
            1 -> listOf("u")
            2 -> listOf("i")
            3 -> listOf("a")
            4 -> listOf("e")
            5 -> if (carrier) listOf("e", "i") else listOf("", "i")
            6 -> listOf("o")
            7 -> listOf("wa")
            // ፙ and ፘ; then the labialised ቈ ቊ ቌ ቍ of the twelve-letter families.
            else -> if (familySize == 9) listOf("ya") else listOf(listOf("we", "wi", "we", "w")[(order - 8).coerceIn(0, 3)])
        }
    }

    /** At most this many paths per word, so the index stays small. */
    private const val MAX_PATHS = 4

    /**
     * The phonetic board: a word is swiped over its Latin spelling. Besides the
     * board's own spelling, each common alternative for one letter (ä as "a",
     * ጨ as "c", ኛ as "gna") is a path of its own.
     */
    val PHONETIC = Spelling { w ->
        val options = ArrayList<List<String>>(w.length)
        for (c in w) {
            val (base, order) = familyOf[c] ?: return@Spelling emptyList()
            val size = KeyboardData.amharicVowels[base.toString()]?.size ?: 8
            val cons = latinConsonant[base] ?: return@Spelling emptyList()
            val vowels = latinVowel(base, order, size)
            val forms = ArrayList<String>()
            for (k in cons) for (v in vowels) {
                val s = k + v
                if (s.isNotEmpty() && s !in forms) forms.add(s)
            }
            options.add(forms)
        }
        val main = options.joinToString("") { it[0] }
        val out = arrayListOf(main)
        for ((i, o) in options.withIndex()) for (alt in o.drop(1)) {
            if (out.size >= MAX_PATHS) break
            val p = options.withIndex().joinToString("") { (j, x) -> if (j == i) alt else x[0] }
            if (p !in out) out.add(p)
        }
        out
    }

    /** The Amharic word list, indexed for swiping on both boards. */
    fun dictionary(words: List<String>) = Dictionary(words, listOf(FIDEL, PHONETIC))

    /**
     * Words that start with [typed], allowing the last letter to be any form of
     * its family: on the fidel board the vowel comes after the consonant, and
     * phonetically "sel" shows ሰል before the "a" that makes it ሰላ.
     */
    fun completions(typed: String, dict: Dictionary, limit: Int): List<String> {
        if (typed.isEmpty()) return emptyList()
        val exact = dict.completions(typed, limit)
        val fam = family(typed.last()) ?: return exact
        val stem = typed.dropLast(1)
        val n = stem.length
        val loose = if (stem.isEmpty()) {
            fam.flatMap { dict.completions(it, limit) }.sortedBy { dict.rankOf(it) }
        } else {
            dict.completions(stem, limit + 2) { it.length > n && it.substring(n, n + 1) in fam && it != typed }
        }
        // The vowel is not chosen yet, so the exact letters earn no head start.
        return (exact + loose).distinct().filter { it != typed }.sortedBy { dict.rankOf(it) }.take(limit)
    }

    /** Letters that sound the same and are often swapped in spelling. */
    private val soundAlike = listOf("ሀሐኀኸ", "ሰሠ", "አዐ", "ጸፀ")

    /** Known words one slip from [w], best first: a wrong vowel, a sound-alike letter, one letter too many, or two swapped. */
    fun candidates(w: String, dict: Dictionary, learned: Map<String, Int> = emptyMap()): List<String> {
        val found = HashSet<String>()
        fun check(s: String) { if (s != w && (s in dict || s in learned)) found.add(s) }
        for (i in w.indices) {
            val (base, order) = familyOf[w[i]] ?: continue
            val pre = w.substring(0, i)
            val post = w.substring(i + 1)
            // Another vowel on the same consonant.
            for (f in KeyboardData.amharicVowels[base.toString()].orEmpty()) check(pre + f + post)
            // The same vowel on a letter that sounds the same.
            soundAlike.firstOrNull { base in it }?.forEach { other ->
                if (other != base) KeyboardData.amharicVowels[other.toString()]?.getOrNull(order)?.let { check(pre + it + post) }
            }
            if (w.length > 2) check(pre + post)
            if (i < w.length - 1) check(pre + w[i + 1] + w[i] + w.substring(i + 2))
        }
        // Many words are a letter apart; only fairly common ones are safe guesses.
        val cap = if (w.length <= 3) 3000 else 12000
        return found
            .filter { it in learned || dict.rankOf(it) < cap }
            .sortedWith(compareByDescending<String> { learned[it] ?: 0 }.thenBy { dict.rankOf(it) })
    }

    /** The correction for [typed], or null to leave it. Known and learned words are never changed. */
    fun correct(typed: String, dict: Dictionary?, learned: Map<String, Int> = emptyMap()): String? {
        if (dict == null || typed.length < 3 || !typed.all(::isFidel)) return null
        if (typed in dict || typed in learned) return null
        return candidates(typed, dict, learned).firstOrNull()
    }
}
