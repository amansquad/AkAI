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
