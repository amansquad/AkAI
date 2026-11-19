package com.akai.nativekb

/**
 * Small starter lists for Tigrinya, used until the word list (words_ti.txt) has
 * the word being typed: everyday words by first letters, and what often follows a word.
 * Tigrinya writes the a-sound with ኣ where Amharic uses አ.
 */
object TigrinyaData {
    val suggestions: Map<String, List<String>> = mapOf(
        "" to listOf("ሰላም", "ኣነ", "ንስኻ", "እዚ", "እቲ"),
        "ሰ" to listOf("ሰላም", "ሰብ", "ሰዓት"),
        "ኣ" to listOf("ኣነ", "ኣብ", "ኣዎ", "ኣሎ"),
        "ከ" to listOf("ከመይ", "ካብ"),
        "ም" to listOf("ምስ", "ምስጋና"),
        "ን" to listOf("ንስኻ", "ናይ", "ንሱ"),
        "ሕ" to listOf("ሕጂ", "ሕማም"),
        "ጽ" to listOf("ጽቡቕ", "ጽባሕ"),
        "የ" to listOf("የቐንየለይ"),
    )

    val nextWord: Map<String, List<String>> = mapOf(
        "ከመይ" to listOf("ኣለኻ", "ኣለኺ", "ዲኻ"),
        "ሰላም" to listOf("ዲኻ", "ዲኺ"),
        "የቐንየለይ" to listOf("ኣዚዩ", "ብዙሕ"),
        "ጽቡቕ" to listOf("ዕለት", "እዩ"),
        "ኣነ" to listOf("እየ", "ኣለኹ"),
        "እዚ" to listOf("እዩ", "ናይ", "እንታይ"),
        "ኣብ" to listOf("ገዛ", "ዓዲ"),
    )
}
