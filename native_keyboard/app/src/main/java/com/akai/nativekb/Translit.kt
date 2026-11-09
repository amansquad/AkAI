package com.akai.nativekb

/**
 * Phonetic Amharic: Latin letters in, fidel out ("selam" -> ሰላም). A port of
 * src/lib/amharic-translit.ts, following the SERA romanisation. The engine
 * converts the whole Latin run at once, so each key re-renders the current
 * word and a backspace can walk back through the spelling.
 */
object Translit {
    private const val ORDER_AE = 0
    private const val ORDER_U = 1
    private const val ORDER_I = 2
    private const val ORDER_A = 3
    private const val ORDER_E = 4
    private const val ORDER_SCHWA = 5
    private const val ORDER_O = 6
    private const val ORDER_WA = 7

    private val consonants = mapOf(
        "h" to "ሀ", "l" to "ለ", "m" to "መ", "r" to "ረ", "s" to "ሰ", "q" to "ቀ", "b" to "በ",
        "v" to "ቨ", "t" to "ተ", "n" to "ነ", "k" to "ከ", "w" to "ወ", "z" to "ዘ", "y" to "የ",
        "d" to "ደ", "j" to "ጀ", "g" to "ገ", "f" to "ፈ", "p" to "ፐ",
        "sh" to "ሸ", "ch" to "ቸ", "zh" to "ዠ", "ny" to "ኘ", "kh" to "ኸ", "ts" to "ጸ",
        "hh" to "ሐ", "tss" to "ፀ",
        "T" to "ጠ", "C" to "ጨ", "P" to "ጰ", "S" to "ጸ", "X" to "ሸ", "N" to "ኘ",
        "K" to "ኸ", "Z" to "ዠ", "H" to "ሐ",
    )

    private val vowelsAfterConsonant = mapOf(
        "e" to ORDER_AE, "u" to ORDER_U, "i" to ORDER_I, "a" to ORDER_A,
        "E" to ORDER_E, "ee" to ORDER_E, "o" to ORDER_O, "wa" to ORDER_WA, "W" to ORDER_WA,
    )

    private val vowelsStandalone = mapOf(
        "a" to ORDER_AE, "u" to ORDER_U, "i" to ORDER_I, "A" to ORDER_A,
        "E" to ORDER_E, "I" to ORDER_SCHWA, "o" to ORDER_O, "e" to ORDER_SCHWA,
    )

    private val maxConsonant = consonants.keys.maxOf { it.length }
    private val maxVowel = maxOf(
        vowelsAfterConsonant.keys.maxOf { it.length },
        vowelsStandalone.keys.maxOf { it.length },
    )

    private fun formOf(base: String, order: Int): String {
        val forms = KeyboardData.amharicVowels[base] ?: return base
        return forms.getOrNull(order) ?: forms.getOrNull(ORDER_SCHWA) ?: forms.firstOrNull() ?: base
    }

    private fun <T> matchLongest(input: String, at: Int, table: Map<String, T>, maxLen: Int): String? {
        var len = minOf(maxLen, input.length - at)
        while (len > 0) {
            val candidate = input.substring(at, at + len)
            if (table.containsKey(candidate)) return candidate
            len--
        }
        return null
    }

    fun latinToFidel(latin: String): String {
        val out = StringBuilder()
        var i = 0
        while (i < latin.length) {
            val consonant = matchLongest(latin, i, consonants, maxConsonant)
            if (consonant != null) {
                i += consonant.length
                val base = consonants.getValue(consonant)
                val vowel = matchLongest(latin, i, vowelsAfterConsonant, maxVowel)
                if (vowel != null) {
                    i += vowel.length
                    out.append(formOf(base, vowelsAfterConsonant.getValue(vowel)))
                } else {
                    out.append(formOf(base, ORDER_SCHWA))
                }
                continue
            }
            val standalone = matchLongest(latin, i, vowelsStandalone, maxVowel)
            if (standalone != null) {
                i += standalone.length
                out.append(formOf("አ", vowelsStandalone.getValue(standalone)))
                continue
            }
            out.append(latin[i])
            i++
        }
        return out.toString()
    }

    private const val BOUNDARY = " \t\n.,!?;:'\"()[]{}-–—/\\፡።፣፤፥፦፧፨"
    fun isWordBoundary(c: Char) = BOUNDARY.indexOf(c) >= 0

    class State(val buffer: String = "", val rendered: String = "")
    class Step(val replaceLast: Int, val insert: String, val next: State)

    val EMPTY = State()

    fun press(state: State, c: Char): Step {
        if (isWordBoundary(c)) return Step(0, c.toString(), EMPTY)
        val buffer = state.buffer + c
        val rendered = latinToFidel(buffer)
        return Step(state.rendered.length, rendered, State(buffer, rendered))
    }

    /** Null when not inside a word: the caller deletes a character itself. */
    fun backspace(state: State): Step? {
        if (state.buffer.isEmpty()) return null
        val buffer = state.buffer.dropLast(1)
        val rendered = latinToFidel(buffer)
        return Step(state.rendered.length, rendered, State(buffer, rendered))
    }
}
