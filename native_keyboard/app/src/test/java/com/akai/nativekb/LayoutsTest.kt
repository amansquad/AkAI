package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LayoutsTest {
    private val o = LayoutOptions()

    @Test fun bothSymbolPagesLeadToEachOther() {
        for (amharic in listOf(false, true)) {
            val p1 = Layouts.build(LayoutId.SYMBOLS, amharic, o)
            val p2 = Layouts.build(LayoutId.SYMBOLS2, amharic, o)
            assertEquals(LayoutId.SYMBOLS, p1.id)
            assertEquals(LayoutId.SYMBOLS2, p2.id)
            for (page in listOf(p1, p2)) {
                assertTrue(page.rows.flatten().any { it.kind == KeyKind.SYMBOLS_PAGE })
                assertTrue(page.rows.flatten().any { it.kind == KeyKind.SYMBOLS })
            }
        }
    }

    @Test fun everyEnglishLayoutHasTheWholeAlphabet() {
        for (name in listOf("qwerty", "dvorak", "azerty", "colemak", "qwertz")) {
            val l = Layouts.build(LayoutId.LETTERS, false, LayoutOptions(englishLayout = name))
            val letters = l.rows.flatten().map { it.output.lowercase() }.toSet()
            for (c in 'a'..'z') assertTrue("$name is missing $c", c.toString() in letters)
        }
    }

    @Test fun vowelFamiliesStartWithTheirOwnLetter() {
        for ((base, forms) in KeyboardData.amharicVowels) {
            assertEquals(base, forms.first())
            assertEquals("$base has a repeated form", forms.size, forms.toSet().size)
        }
    }
}
