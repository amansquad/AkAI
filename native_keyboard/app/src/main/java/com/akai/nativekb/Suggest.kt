package com.akai.nativekb

/**
 * What the keyboard has learned about one person: how often they type each word,
 * which word tends to follow which, and which emoji they put after a word.
 * Everything stays on the phone.
 */
class Habits {
    /** Words typed, with how often. */
    val words = HashMap<String, Int>()
    /** "previous\tnext" pairs, with how often. */
    val pairs = HashMap<String, Int>()
    /** "word\temoji" pairs, with how often. */
    val emoji = HashMap<String, Int>()
    var dirty = 0

    fun bump(map: HashMap<String, Int>, key: String, limit: Int) {
        map[key] = (map[key] ?: 0) + 1
        if (map.size > limit) {
            // Forget the least-used entries rather than growing without end.
            map.entries.sortedBy { it.value }.take(limit / 6).forEach { map.remove(it.key) }
        }
        dirty++
    }

    fun learnWord(word: String, prev: String?) {
        bump(words, word, 3000)
        if (prev != null) bump(pairs, "$prev\t$word", 4000)
    }

    fun learnEmoji(word: String, emoji: String) = bump(this.emoji, "$word\t$emoji", 1500)

    fun clear() { words.clear(); pairs.clear(); emoji.clear(); dirty = 0 }

    companion object {
        fun encode(map: Map<String, Int>) = map.entries.joinToString("\n") { "${it.key}\t${it.value}" }

        fun decode(text: String, into: MutableMap<String, Int>) {
            text.split('\n').forEach { line ->
                val i = line.lastIndexOf('\t')
                if (i > 0) line.substring(i + 1).toIntOrNull()?.let { into[line.substring(0, i)] = it }
            }
        }
    }
}

/** Word suggestions: the user's own habits, the language's dictionary, then the web keyboard's word lists. */
object Suggest {
    /**
     * [before] is the text left of the cursor. Returns up to three suggestions: words,
     * with an emoji as the last one when the word just typed has one.
     * [pairs] and [emojiHabits] are the user's own (see [Habits]).
     */
    fun forText(
        before: CharSequence, amharic: Boolean, learned: Map<String, Int> = emptyMap(), dict: Dictionary? = null,
        pairs: Map<String, Int> = emptyMap(), emojiHabits: Map<String, Int> = emptyMap(), withEmoji: Boolean = true,
        lang: Lang = if (amharic) Lang.AM else Lang.EN,
        /** What usually follows a word, from a bundled table (Amharic): offered after the user's own habits. */
        nextWords: Map<String, List<String>>? = null,
    ): List<String> {
        val suggestions = when (lang) { Lang.TI -> TigrinyaData.suggestions; Lang.OM -> OromoData.suggestions; Lang.AR -> ArabicData.suggestions; Lang.SO -> SomaliData.suggestions; Lang.AM -> KeyboardData.suggestionsAm; Lang.EN -> KeyboardData.suggestionsEn }
        val next = when (lang) { Lang.TI -> TigrinyaData.nextWord; Lang.OM -> OromoData.nextWord; Lang.AR -> ArabicData.nextWord; Lang.SO -> SomaliData.nextWord; Lang.AM -> KeyboardData.nextWordAm; Lang.EN -> KeyboardData.nextWordEn }
        val words = before.toString().trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
        val endsWithSpace = before.isNotEmpty() && before.last().isWhitespace()

        // The word an emoji would stand for: the one just finished, or the one being typed if it is complete.
        val subject = words.lastOrNull()
        val emoji = if (withEmoji && subject != null && (lang == Lang.EN || lang.geez)) emojiFor(clean(subject), amharic, emojiHabits) else null
        val room = if (emoji != null) 2 else 3

        val list = if (endsWithSpace || words.isEmpty()) {
            val prev = words.lastOrNull()?.let(::clean).orEmpty()
            // What this person usually types after this word comes first.
            val own = if (prev.isEmpty()) emptyList() else after(prev, pairs)
            // The few everyday pairs built in come before the big table, which is formal (it is from Wikipedia).
            val known = next[prev].orEmpty() + nextWords?.get(prev).orEmpty()
            own + known.ifEmpty { suggestions[""] ?: emptyList() }
        } else {
            val cur = words.last().lowercase()
            val prev = words.getOrNull(words.size - 2)?.let(::clean)
            // Words the user has typed before come first; ones they type after the previous word count extra.
            val own = learned.entries
                .filter { it.key.length > cur.length && it.key.startsWith(cur) }
                .sortedByDescending { it.value + 3 * (if (prev != null) pairs["$prev\t${it.key}"] ?: 0 else 0) }
                .take(2)
                .map { it.key }
            // A word that is not a word gets offered the same fix auto-correct would make.
            // (Not while an apostrophe is the last thing typed: "there'" is heading for "there's", not "there".)
            // (English fixes such as "dont" are not Oromo, so Oromo gets completions only.)
            val fix = if (cur.endsWith("'") || lang.ownLatin || lang == Lang.AR) emptyList() else listOfNotNull(
                if (amharic) Amharic.correct(cur, dict, learned) else dict?.let { AutoCorrect.correct(cur, it, learned) },
            )
            val fromDict = when {
                dict == null -> emptyList()
                amharic -> Amharic.completions(cur, dict, 3)
                else -> dict.completions(cur, 3)
            }
            // Digits become Ge'ez numerals, and ዛሬ (today) offers today's Ethiopian date.
            val ethiopic = if (!amharic) emptyList() else listOfNotNull(
                if (cur.length in 1..12 && cur.all { it in '0'..'9' }) Ethiopic.numeral(cur.toLong()) else null,
                if (cur == "ዛሬ") "ዛሬ " + Ethiopic.today().spoken() else null,
            )
            // A half-typed contraction, or the start of a longer English word ("riz" for "rizz"), completes before it gets "fixed".
            val completing = "'" in cur || (!amharic && cur.length >= 3 && fromDict.isNotEmpty() && cur !in AutoCorrect.fixes)
            val words3 = if (completing) own + fromDict + fix else fix + own + fromDict
            ethiopic + words3 + (suggestions[cur] ?: suggestions[cur.take(2)] ?: suggestions[cur.take(1)] ?: emptyList())
        }
        val out = list.distinct().take(room)
        // The emoji goes second: a long toolbar leaves room for only two, and it must not be the one cut off.
        return if (emoji != null) out.take(1) + emoji + out.drop(1) else out
    }

    /** Words this person has typed after [prev], most often first. */
    private fun after(prev: String, pairs: Map<String, Int>): List<String> {
        val head = "$prev\t"
        return pairs.entries
            .filter { it.key.startsWith(head) }
            .sortedByDescending { it.value }
            .take(3)
            .map { it.key.substring(head.length) }
    }

    /** A word without the punctuation around it, in lower case. */
    fun clean(word: String) = word.lowercase().trim { !it.isLetter() }

    /** A word worth remembering: letters, with apostrophes inside it ("there're"). */
    fun isWord(w: String) = w.length >= 2 && w.all { it.isLetter() || it == '\'' }

    /** The emoji for [word]: the one this person uses with it, else a common match. */
    fun emojiFor(word: String, amharic: Boolean, habits: Map<String, Int>): String? {
        if (word.length < 2) return null
        val head = "$word\t"
        habits.entries.filter { it.key.startsWith(head) }.maxByOrNull { it.value }?.let { return it.key.substring(head.length) }
        return if (amharic) null else EmojiSearch.forWord(word)
    }

    /** True for a suggestion that is an emoji rather than a word. */
    fun isEmoji(s: String) = s.isNotEmpty() && !Character.isLetterOrDigit(s.codePointAt(0)) && s[0] !in 'ሀ'..'᎟'

    /** Length of the word being typed, which a tapped suggestion replaces. */
    fun currentWordLength(before: CharSequence): Int {
        var n = 0
        for (i in before.length - 1 downTo 0) {
            if (before[i].isWhitespace()) break
            n++
        }
        return n
    }

    /** The last word in [before] and the one before it (null across a sentence end or line break). */
    fun lastTwo(before: CharSequence): Pair<String?, String?> {
        val s = before.toString()
        val n = currentWordLength(s)
        val last = clean(s.substring(s.length - n)).takeIf(::isWord)
        val rest = s.substring(0, s.length - n)
        val gap = rest.takeLastWhile { it.isWhitespace() }
        if (gap.isEmpty() || '\n' in gap) return last to null
        val body = rest.trimEnd()
        val m = body.length - currentWordLength(body)
        val raw = body.substring(m)
        if (raw.isEmpty() || raw.last() in ".!?።፧") return last to null
        val prev = clean(raw).takeIf(::isWord)
        return last to prev
    }
}
