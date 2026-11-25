package com.akai.nativekb

/**
 * Types Arabic from Latin letters ("salaam" gives سلام). Like [Translit], it is
 * stateless: the whole Latin run is re-rendered after every key.
 *
 * Arabic does not write short vowels, so a single a, e, i, o or u inside a word
 * adds nothing, and a doubled one is the long vowel: aa gives ا, ee and ii give
 * ي, oo and uu give و. A vowel that starts a word gives ا. Capitals are the
 * heavy or throaty consonants: S ص, D ض, T ط, Z ظ, H ح, E ع. An apostrophe is ء.
 * Letters with no key of their own (ة ى أ إ ؤ ئ) are long-presses on the board
 * and pass through unchanged.
 */
object ArabicTranslit {

    private val digraphs = mapOf(
        "sh" to "ش", "kh" to "خ", "gh" to "غ", "th" to "ث", "dh" to "ذ", "ch" to "تش", "ph" to "ف",
    )

    private val letters = mapOf(
        'b' to "ب", 't' to "ت", 'j' to "ج", 'g' to "ج", 'd' to "د", 'r' to "ر", 'z' to "ز",
        's' to "س", 'f' to "ف", 'q' to "ق", 'k' to "ك", 'l' to "ل", 'm' to "م", 'n' to "ن",
        'h' to "ه", 'w' to "و", 'y' to "ي", 'p' to "ب", 'v' to "ف", 'c' to "ك", 'x' to "كس",
        'S' to "ص", 'D' to "ض", 'T' to "ط", 'Z' to "ظ", 'H' to "ح", 'E' to "ع",
        'G' to "غ", 'K' to "خ", 'A' to "أ", 'I' to "إ", '\'' to "ء",
    )

    private const val VOWELS = "aeiou"

    /**
     * The keys of the Latin board each Arabic letter is swiped through, usual first
     * (capitals are the same keys, so lower case). A doubled vowel is one key on a swipe.
     */
    private val swipeKeys: Map<Char, List<String>> = mapOf(
        'ب' to listOf("b"), 'ت' to listOf("t"), 'ث' to listOf("th"), 'ج' to listOf("j", "g"),
        'ح' to listOf("h"), 'خ' to listOf("kh"), 'د' to listOf("d"), 'ذ' to listOf("dh"),
        'ر' to listOf("r"), 'ز' to listOf("z"), 'س' to listOf("s"), 'ش' to listOf("sh"),
        'ص' to listOf("s"), 'ض' to listOf("d"), 'ط' to listOf("t"), 'ظ' to listOf("z"),
        'ع' to listOf("e", "a"), 'غ' to listOf("gh"), 'ف' to listOf("f"), 'ق' to listOf("q", "k"),
        'ك' to listOf("k"), 'ل' to listOf("l"), 'م' to listOf("m"), 'ن' to listOf("n"),
        'ه' to listOf("h"), 'و' to listOf("w", "u"), 'ي' to listOf("y", "i"),
        'ا' to listOf("a"), 'أ' to listOf("a"), 'إ' to listOf("i"), 'آ' to listOf("a"), 'ٱ' to listOf("a"),
        'ة' to listOf("h", "a"), 'ى' to listOf("a", "y"), 'ؤ' to listOf("w"), 'ئ' to listOf("y"),
        // The hamza is the apostrophe key, which a swipe doesn't pass over.
        'ء' to listOf(""),
    )
    private const val MAX_PATHS = 4

    /** Swipe typing on the Latin board for Arabic: سلام is swiped s-l-a-m. */
    val SWIPE = Spelling { w ->
        var paths = listOf("")
        for (c in w) {
            if (c in 'ً'..'ٟ' || c == 'ٰ' || c == 'ـ') continue
            val keys = swipeKeys[c] ?: return@Spelling emptyList()
            paths = paths.flatMap { p -> keys.map { p + it } }.take(MAX_PATHS)
        }
        // A doubled key ("aa", or ل then ل) is one key on a swipe.
        paths.map { p -> p.filterIndexed { i, ch -> i == 0 || ch != p[i - 1] } }.filter { it.length >= 2 }.distinct()
    }

    /** What a doubled vowel writes. */
    private fun long(v: Char) = when (v) { 'a' -> "ا"; 'e', 'i' -> "ي"; else -> "و" }

    fun render(latin: String): String {
        val out = StringBuilder()
        var i = 0
        while (i < latin.length) {
            val c = latin[i]
            val pair = if (i + 1 < latin.length) latin.substring(i, i + 2) else ""
            when {
                pair in digraphs -> { out.append(digraphs.getValue(pair)); i += 2 }
                c in letters -> { out.append(letters.getValue(c)); i++ }
                c in VOWELS -> {
                    val doubled = i + 1 < latin.length && latin[i + 1] == c
                    when {
                        doubled -> { out.append(long(c)); i += 2 }
                        i == 0 -> { out.append("ا"); i++ }
                        else -> i++ // a short vowel is not written
                    }
                }
                else -> { out.append(c); i++ }
            }
        }
        return out.toString()
    }
}
