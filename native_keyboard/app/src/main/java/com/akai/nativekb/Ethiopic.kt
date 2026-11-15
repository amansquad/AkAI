package com.akai.nativekb

import java.util.Calendar

/** Ge'ez numerals and the Ethiopian calendar. Plain Kotlin, so it can be tested without a phone. */
object Ethiopic {
    private const val ONES = "፩፪፫፬፭፮፯፰፱"
    private const val TENS = "፲፳፴፵፶፷፸፹፺"

    /** [n] (1 or more) in Ge'ez numerals: 2019 is ፳፻፲፱, 100 is ፻, 10000 is ፼. */
    fun numeral(n: Long): String? {
        if (n <= 0) return null
        // Pairs of digits from the right; odd pairs end in ፻ (hundred), even ones after the first in ፼ (ten thousand).
        val groups = ArrayList<Int>()
        var x = n
        while (x > 0) { groups.add((x % 100).toInt()); x /= 100 }
        val sb = StringBuilder()
        for (i in groups.indices.reversed()) {
            val g = groups[i]
            if (g != 0) {
                val t = g / 10
                val o = g % 10
                if (t > 0) sb.append(TENS[t - 1])
                // "One hundred" is just ፻, but 1 alone is ፩.
                if (o > 0 && !(g == 1 && i > 0)) sb.append(ONES[o - 1])
            }
            when {
                i == 0 -> {}
                i % 2 == 1 -> if (g != 0) sb.append('፻')
                else -> sb.append('፼')
            }
        }
        return sb.toString()
    }

    val months = listOf("መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ")

    data class Date(val year: Int, val month: Int, val day: Int) {
        /** Like "ኅዳር 6 ቀን 2019 ዓ.ም." */
        fun spoken() = "${months[month - 1]} $day ቀን $year ዓ.ም."
    }

    /** The Ethiopian date for a Gregorian one ([month] 1–12). */
    fun fromGregorian(year: Int, month: Int, day: Int): Date {
        val a = (14 - month) / 12
        val y = year + 4800 - a
        val m = month + 12 * a - 3
        val jdn = day + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045
        val r = (jdn - 1723856) % 1461
        val n = r % 365 + 365 * (r / 1460)
        val ey = 4 * ((jdn - 1723856) / 1461) + r / 365 - r / 1460
        return Date(ey, n / 30 + 1, n % 30 + 1)
    }

    fun today(): Date = Calendar.getInstance().let {
        fromGregorian(it.get(Calendar.YEAR), it.get(Calendar.MONTH) + 1, it.get(Calendar.DAY_OF_MONTH))
    }
}
