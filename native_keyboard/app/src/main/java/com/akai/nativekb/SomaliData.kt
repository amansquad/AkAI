package com.akai.nativekb

/**
 * Small starter lists for Somali, used until the word list (words_so.txt) has
 * the word being typed: everyday words by first letters, and what often follows
 * a word. Keys are lower case. The apostrophe stands for the letter ayn (sa'ad).
 */
object SomaliData {
    val suggestions: Map<String, List<String>> = mapOf(
        "" to listOf("iska", "nabad", "waa", "aniga", "sidee"),
        "a" to listOf("aniga", "adiga", "aad", "ayaa"),
        "b" to listOf("berri", "baa", "bay"),
        "d" to listOf("dalka", "dhaqso"),
        "g" to listOf("guriga", "goorma", "gabadh"),
        "h" to listOf("haa", "halkee", "hadda"),
        "i" to listOf("iyo", "iska", "isaga"),
        "k" to listOf("ka", "ku", "kale"),
        "m" to listOf("maanta", "mahadsanid", "maxaa", "magaca"),
        "n" to listOf("nabad", "noqon"),
        "s" to listOf("sidee", "shalay", "soo"),
        "w" to listOf("waa", "waxaa", "waan"),
    )

    val nextWord: Map<String, List<String>> = mapOf(
        "sidee" to listOf("tahay", "u"),
        "iska" to listOf("warran"),
        "mahadsanid" to listOf("aad", "walaal"),
        "aad" to listOf("iyo", "u"),
        "nabad" to listOf("gelyo", "miyaa"),
        "maxaa" to listOf("cusub", "kaa"),
        "soo" to listOf("dhawoow"),
        "magacaygu" to listOf("waa"),
        "af" to listOf("soomaali"),
    )
}
