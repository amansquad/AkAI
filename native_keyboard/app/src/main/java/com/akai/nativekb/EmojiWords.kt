package com.akai.nativekb

/** The emoji for an everyday word in a language other than English (see EMOJI_WORDS). */
object EmojiWords {
    /**
     * The emoji for [word] in [lang], or null. Amharic and Tigrinya words are also
     * found by their stem, so ፍቅሩ (his love) and ቤታችን (our home) count.
     */
    fun forWord(lang: Lang, word: String): String? {
        val table = EMOJI_WORDS[lang] ?: return null
        val w = if (lang.caseless) word else word.lowercase()
        table[w]?.let { return it }
        if (!lang.geez) return null
        return Amharic.stems(w).drop(1).firstNotNullOfOrNull { table[it] }
    }
}
