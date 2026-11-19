package com.akai.nativekb

/**
 * The languages the keyboard types. Everything that differs between them lives
 * here, so the rest of the code asks the language instead of testing a flag.
 *
 * Amharic and Tigrinya share the Ge'ez (fidel) boards and transliteration.
 */
enum class Lang(
    /** Stored in preferences. */
    val code: String,
    /** The name on the space bar and the voice tab. */
    val title: String,
    /** The short label on the language key that switches to this language. */
    val key: String,
    /** Typed with the fidel boards (or their phonetic version). */
    val geez: Boolean,
    /** For speech recognition. */
    val voiceTag: String,
    /** For the handwriting recognizer's model. */
    val inkTag: String,
    /** Typed at the end of a sentence, space included. */
    val sentenceEnd: String,
    /** The asset with this language's words, one per line, most common first. */
    val wordsAsset: String,
) {
    EN("en", "English", "EN", false, "en-US", "en-US", ". ", "words_en.txt"),
    AM("am", "አማርኛ", "አማ", true, "am-ET", "am", "። ", "words_am.txt"),
    TI("ti", "ትግርኛ", "ትግ", true, "ti-ET", "ti", "። ", "words_ti.txt"),
    /** Written in Latin letters (Qubee), so it shares the English board. */
    OM("om", "Afaan Oromoo", "OM", false, "om-ET", "om", ". ", "words_om.txt"),
    /** Arabic script, written right to left, with no capitals. */
    AR("ar", "العربية", "ع", false, "ar-SA", "ar", ". ", "words_ar.txt"),
    /** Latin letters, with the apostrophe for the letter ayn (sa'ad). */
    SO("so", "Af-Soomaali", "SO", false, "so-SO", "so", ". ", "words_so.txt");

    /**
     * A Latin-script language that is not English (Oromo, Somali): it types on the English
     * board plus an apostrophe key, with its own words, and none of English's fixes.
     */
    val ownLatin get() = this == OM || this == SO

    /** The name the translation server knows it by. */
    val serverName get() = when (this) { EN -> "English"; AM -> "Amharic"; TI -> "Tigrinya"; OM -> "Oromo"; AR -> "Arabic"; SO -> "Somali" }

    /** Has no upper and lower case, so no auto-capitals. */
    val caseless get() = geez || this == AR

    companion object {
        fun fromCode(code: String?): Lang? = entries.firstOrNull { it.code == code }

        /** The languages the language key cycles through, in order. */
        fun enabled(tigrinya: Boolean, oromo: Boolean = false, amharic: Boolean = true, arabic: Boolean = false,
            somali: Boolean = false,
        ): List<Lang> =
            listOfNotNull(EN, AM.takeIf { amharic }, TI.takeIf { tigrinya }, OM.takeIf { oromo }, AR.takeIf { arabic }, SO.takeIf { somali })

        /** The one after [current] in [list]; the first when [current] is not in it. */
        fun next(current: Lang, list: List<Lang>): Lang {
            val i = list.indexOf(current)
            return list[(i + 1) % list.size]
        }
    }
}
