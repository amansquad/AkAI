package com.akai.nativekb

/** Word suggestions from the same small word lists the web keyboard uses. */
object Suggest {
    /** [before] is the text left of the cursor. Returns up to three words. */
    fun forText(before: CharSequence, amharic: Boolean): List<String> {
        val suggestions = if (amharic) KeyboardData.suggestionsAm else KeyboardData.suggestionsEn
        val next = if (amharic) KeyboardData.nextWordAm else KeyboardData.nextWordEn
        val words = before.toString().trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
        val endsWithSpace = before.isNotEmpty() && before.last().isWhitespace()

        val list = if (endsWithSpace || words.isEmpty()) {
            val prev = words.lastOrNull()?.lowercase().orEmpty()
            next[prev] ?: suggestions[""] ?: emptyList()
        } else {
            val cur = words.last().lowercase()
            suggestions[cur] ?: suggestions[cur.take(2)] ?: suggestions[cur.take(1)] ?: emptyList()
        }
        return list.take(3)
    }

    /** Length of the word being typed, which a tapped suggestion replaces. */
    fun currentWordLength(before: CharSequence): Int {
        var n = 0
        for (i in before.length - 1 downTo 0) {
            if (before[i].isWhitespace()) break
            n++
        }
        return n
    }
}
