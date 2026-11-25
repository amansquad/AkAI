package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/** Spelling fixes in the strip for Oromo, Somali and Arabic, from their own lists. */
class OtherLangFixTest {
    private fun dict(lang: Lang) = Dictionary(File("src/main/assets/${lang.wordsAsset}").readLines().filter { it.isNotBlank() })
    private val om by lazy { dict(Lang.OM) }
    private val so by lazy { dict(Lang.SO) }
    private val ar by lazy { dict(Lang.AR) }

    @Test fun oromoSlipGetsItsOromoWord() {
        assertEquals("yeroo", AutoCorrect.correctIn(Lang.OM, "yerooo", om))
        assertNull(AutoCorrect.correctIn(Lang.OM, "yeroo", om))
    }

    @Test fun somaliSlipGetsItsSomaliWord() {
        assertEquals("dadka", AutoCorrect.correctIn(Lang.SO, "dadkka", so))
        assertNull(AutoCorrect.correctIn(Lang.SO, "dadka", so))
    }

    @Test fun capitalsAreKept() {
        assertEquals("Yeroo", AutoCorrect.correctIn(Lang.OM, "Yerooo", om))
    }

    @Test fun arabicSlipGetsItsArabicWord() {
        assertTrue(AutoCorrect.correctIn(Lang.AR, "جميلل", ar) in setOf("جميل", "جميلة"))
    }

    @Test fun arabicWordsWithPrefixOrEndingAreLeftAlone() {
        assertNull(AutoCorrect.correctIn(Lang.AR, "والكتاب", ar))
        assertNull(AutoCorrect.correctIn(Lang.AR, "مدرستها", ar))
    }

    @Test fun englishFixesAreNotOromo() {
        // "dont" is an English fix; Oromo never gets English's list.
        assertNull(AutoCorrect.correctIn(Lang.OM, "dont", Dictionary(listOf("dont"))))
    }

    @Test fun oromoFixComesAfterCompletions() {
        val s = Suggest.forText("yerooo", false, dict = om, lang = Lang.OM)
        assertTrue("yeroo" in s)
    }
}
