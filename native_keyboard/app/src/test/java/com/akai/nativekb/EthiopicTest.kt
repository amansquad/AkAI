package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class EthiopicTest {
    @Test fun geezNumerals() {
        assertEquals("፩", Ethiopic.numeral(1))
        assertEquals("፲", Ethiopic.numeral(10))
        assertEquals("፻", Ethiopic.numeral(100))
        assertEquals("፻፲", Ethiopic.numeral(110))
        assertEquals("፪፻", Ethiopic.numeral(200))
        assertEquals("፳፻፲፱", Ethiopic.numeral(2019))
        assertEquals("፲፱፻፸፭", Ethiopic.numeral(1975))
        assertEquals("፼", Ethiopic.numeral(10000))
        assertEquals("፻፼", Ethiopic.numeral(1000000))
        assertEquals("፼፻", Ethiopic.numeral(10100))
    }

    @Test fun ethiopianCalendar() {
        assertEquals(Ethiopic.Date(2019, 3, 6), Ethiopic.fromGregorian(2026, 11, 15))
        assertEquals(Ethiopic.Date(2019, 1, 1), Ethiopic.fromGregorian(2026, 9, 11))
        // 2023 precedes a Gregorian leap year, so the Ethiopian new year falls on 12 September.
        assertEquals(Ethiopic.Date(2016, 1, 1), Ethiopic.fromGregorian(2023, 9, 12))
        assertEquals(Ethiopic.Date(2015, 13, 6), Ethiopic.fromGregorian(2023, 9, 11))
        assertEquals("ኅዳር 6 ቀን 2019 ዓ.ም.", Ethiopic.fromGregorian(2026, 11, 15).spoken())
    }

    @Test fun amharicSuggestionsOfferNumeralsAndDate() {
        assertEquals("፳፻፲፱", Suggest.forText("2019", true).first())
        assertTrue(Suggest.forText("ዛሬ", true).first().startsWith("ዛሬ "))
        assertTrue(!Suggest.isEmoji("፳፻፲፱"))
    }
}
