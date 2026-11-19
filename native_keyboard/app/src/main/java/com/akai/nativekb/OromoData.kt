package com.akai.nativekb

/**
 * Small starter lists for Afaan Oromoo, used until the word list (words_om.txt)
 * has the word being typed: everyday words by first letters, and what often
 * follows a word. Keys are lower case. The apostrophe is the hudhaa (ba'e, har'a).
 */
object OromoData {
    val suggestions: Map<String, List<String>> = mapOf(
        "" to listOf("akkam", "nagaa", "ani", "kun", "fi"),
        "a" to listOf("akkam", "ani", "ati", "akka"),
        "b" to listOf("baay'ee", "boru", "bara"),
        "g" to listOf("galatoomi", "gaarii", "guyyaa"),
        "h" to listOf("har'a", "hojii"),
        "j" to listOf("jira", "jaalala"),
        "k" to listOf("kun", "kan", "kaleessa"),
        "m" to listOf("maqaa", "mana", "miti"),
        "n" to listOf("nagaa", "nuti", "nyaata"),
        "o" to listOf("oromoo", "oromiyaa", "oolte"),
    )

    val nextWord: Map<String, List<String>> = mapOf(
        "akkam" to listOf("jirta", "bulte", "oolte"),
        "nagaa" to listOf("dha", "fi"),
        "baay'ee" to listOf("galatoomi", "gaarii"),
        "ani" to listOf("jira", "dha", "barbaada"),
        "maqaan" to listOf("koo", "kee", "isaa"),
        "afaan" to listOf("oromoo", "amaaraa"),
    )
}
