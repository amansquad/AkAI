package com.akai.nativekb

/** Word suggestions: the user's own words, the language's dictionary, then the web keyboard's word lists. */
object Suggest {
    /** [before] is the text left of the cursor. Returns up to three words. */
    fun forText(
        before: CharSequence, amharic: Boolean, learned: Map<String, Int> = emptyMap(), dict: Dictionary? = null,
    ): List<String> {
        val suggestions = if (amharic) KeyboardData.suggestionsAm else KeyboardData.suggestionsEn
        val next = if (amharic) KeyboardData.nextWordAm else KeyboardData.nextWordEn
        val words = before.toString().trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
        val endsWithSpace = before.isNotEmpty() && before.last().isWhitespace()

        val list = if (endsWithSpace || words.isEmpty()) {
            val prev = words.lastOrNull()?.lowercase()?.trim { !it.isLetter() }.orEmpty()
            next[prev] ?: suggestions[""] ?: emptyList()
        } else {
            val cur = words.last().lowercase()
            // Words the user has typed before come first, most-used first.
            val own = learned.entries
                .filter { it.key.length > cur.length && it.key.startsWith(cur) }
                .sortedByDescending { it.value }
                .take(2)
                .map { it.key }
            // A word that is not a word gets offered the same fix auto-correct would make.
            val fix = listOfNotNull(
                if (amharic) Amharic.correct(cur, dict, learned) else dict?.let { AutoCorrect.correct(cur, it, learned) },
            )
            val fromDict = when {
                dict == null -> emptyList()
                amharic -> Amharic.completions(cur, dict, 3)
                else -> dict.completions(cur, 3)
            }
            fix + own + fromDict + (suggestions[cur] ?: suggestions[cur.take(2)] ?: suggestions[cur.take(1)] ?: emptyList())
        }
        return list.distinct().take(3)
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
