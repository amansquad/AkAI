package com.akai.nativekb

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/** The bundled next-word tables (assets/nextword_<code>.txt). */
class NextWordTest {
    private fun table(lang: Lang) =
        Words.parseNextWords(File("src/main/assets/nextword_${lang.code}.txt").readLines().filter { it.isNotBlank() })

    @Test fun everyLanguageHasATableOfItsOwnWords() {
        for (lang in Lang.entries) {
            val f = File("src/main/assets/nextword_${lang.code}.txt")
            assertTrue("${lang.code} has no next-word table", f.isFile)
            val t = table(lang)
            assertTrue("${lang.code}: only ${t.size} words", t.size >= 1000)
            val words = File("src/main/assets/${lang.wordsAsset}").readLines().map { it.trim() }.toHashSet()
            for ((w, nexts) in t) {
                assertTrue("${lang.code}: $w is not in its word list", w in words)
                assertTrue("${lang.code}: $w has no followers", nexts.isNotEmpty() && nexts.size <= 3)
                for (n in nexts) assertTrue("${lang.code}: $n (after $w) is not in its word list", n in words)
            }
        }
    }

    @Test fun theStripOffersTheTablesWordsAfterASpace() {
        val om = table(Lang.OM)
        val s = Suggest.forText("yeroo ", false, lang = Lang.OM, nextWords = om)
        assertTrue(s.toString(), om.getValue("yeroo").first() in s)
    }
}
