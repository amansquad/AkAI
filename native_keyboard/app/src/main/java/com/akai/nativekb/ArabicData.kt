package com.akai.nativekb

/**
 * Small starter lists for Arabic, used until the word list (words_ar.txt) has
 * the word being typed: everyday words by first letters, and what often follows
 * a word. Written without vowel marks, the way people type.
 */
object ArabicData {
    val suggestions: Map<String, List<String>> = mapOf(
        "" to listOf("مرحبا", "أنا", "السلام", "شكرا", "كيف"),
        "م" to listOf("مرحبا", "مع", "من", "ماذا"),
        "ش" to listOf("شكرا", "شيء"),
        "ك" to listOf("كيف", "كل", "كان"),
        "ا" to listOf("أنا", "أنت", "الله", "ان"),
        "ن" to listOf("نعم", "نحن"),
        "ل" to listOf("لا", "لك", "لماذا"),
        "ه" to listOf("هذا", "هل", "هو", "هنا"),
        "ع" to listOf("على", "عن", "عليكم"),
        "ف" to listOf("في", "فقط"),
    )

    val nextWord: Map<String, List<String>> = mapOf(
        "السلام" to listOf("عليكم"),
        "عليكم" to listOf("السلام", "ورحمة"),
        "كيف" to listOf("حالك", "الحال", "أنت"),
        "شكرا" to listOf("لك", "جزيلا", "كثيرا"),
        "صباح" to listOf("الخير", "النور"),
        "مساء" to listOf("الخير", "النور"),
        "أنا" to listOf("بخير", "في", "لا"),
        "إن" to listOf("شاء"),
        "ان" to listOf("شاء"),
        "بارك" to listOf("الله"),
    )
}
