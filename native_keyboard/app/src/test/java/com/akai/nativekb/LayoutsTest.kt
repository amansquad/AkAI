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

    @Test fun lessAndGreaterThanAreOnAKeyOfTheSymbolPages() {
        for (amharic in listOf(false, true)) for (numberRow in listOf(false, true)) {
            val keys = listOf(LayoutId.SYMBOLS, LayoutId.SYMBOLS2)
                .flatMap { Layouts.build(it, amharic, LayoutOptions(numberRow = numberRow)).rows.flatten() }
                .map { it.output }
            assertTrue("< amharic=$amharic numberRow=$numberRow", "<" in keys)
            assertTrue("> amharic=$amharic numberRow=$numberRow", ">" in keys)
        }
    }

    @Test fun symbolPagesHaveAsManyRowsAsTheLetters() {
        for (numberRow in listOf(false, true)) for (cursorRow in listOf(false, true)) for (amharic in listOf(false, true)) {
            val opts = LayoutOptions(numberRow = numberRow, cursorRow = cursorRow)
            val letters = Layouts.build(LayoutId.LETTERS, amharic, opts)
            for (id in listOf(LayoutId.SYMBOLS, LayoutId.SYMBOLS2)) {
                val page = Layouts.build(id, amharic, opts)
                val what = "$id numberRow=$numberRow cursorRow=$cursorRow amharic=$amharic"
                assertEquals(what, letters.rows.size, page.rows.size)
                assertEquals(what, letters.rowHeightDp, page.rowHeightDp, 0.01f)
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
