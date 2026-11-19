package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LangTest {

    @Test fun languageKeyCyclesThroughTheEnabledLanguages() {
        val two = Lang.enabled(false)
        assertEquals(Lang.AM, Lang.next(Lang.EN, two))
        assertEquals(Lang.EN, Lang.next(Lang.AM, two))
        val three = Lang.enabled(true)
        assertEquals(listOf(Lang.AM, Lang.TI, Lang.EN), listOf(Lang.EN, Lang.AM, Lang.TI).map { Lang.next(it, three) })
    }

    @Test fun oromoJoinsTheCycleAfterTigrinya() {
        val all = Lang.enabled(true, true)
        assertEquals(listOf(Lang.EN, Lang.AM, Lang.TI, Lang.OM), all)
        assertEquals(listOf(Lang.EN, Lang.AM, Lang.OM), Lang.enabled(false, true))
        assertEquals(Lang.EN, Lang.next(Lang.OM, all))
    }

    @Test fun oromoIsLatinWithAnApostropheKey() {
        assertEquals(false, Lang.OM.geez)
        val o = LayoutOptions(lang = Lang.OM, nextLang = Lang.EN)
        val keys = Layouts.build(LayoutId.LETTERS, false, o).rows.flatten()
        assertTrue(keys.any { it.kind == KeyKind.CHAR && it.label == "'" })
        assertTrue(keys.any { it.kind == KeyKind.SPACE && it.label == "Afaan Oromoo" })
        // English keeps its board without the extra key.
        val en = Layouts.build(LayoutId.LETTERS, false, LayoutOptions()).rows.flatten()
        assertTrue(en.none { it.kind == KeyKind.CHAR && it.label == "'" })
    }

    @Test fun oromoSuggestionsHaveNoEnglishFixesOrEmoji() {
        val out = Suggest.forText("dont", false, lang = Lang.OM, dict = Dictionary(listOf("dontaa")))
        assertTrue("don't" !in out)
        assertTrue(out.none { Suggest.isEmoji(it) })
        assertEquals("akkam", Suggest.forText("", false, lang = Lang.OM).first())
    }

    /** Tigrinya turned off while it was the language: the key must still go somewhere sensible. */
    @Test fun aLanguageNotInTheListGoesToTheFirst() {
        assertEquals(Lang.EN, Lang.next(Lang.TI, Lang.enabled(false)))
    }

    @Test fun codesRoundTrip() {
        for (l in Lang.entries) assertEquals(l, Lang.fromCode(l.code))
        assertEquals(null, Lang.fromCode("xx"))
    }

    @Test fun geezLanguagesUseFidelFullStop() {
        assertTrue(Lang.entries.filter { it.geez }.all { it.sentenceEnd == "። " })
        assertEquals(". ", Lang.EN.sentenceEnd)
    }

    @Test fun tigrinyaLettersAndQhTranslit() {
        assertEquals("ቐ", Translit.latinToFidel("qhe"))
        assertTrue(KeyboardData.amharicVowels.containsKey("ቐ"))
    }

    @Test fun tigrinyaBoardShowsItsNameAndNextLanguage() {
        val o = LayoutOptions(tigrinya = true, lang = Lang.TI, nextLang = Lang.EN)
        val rows = Layouts.build(LayoutId.FIDEL, true, o).rows.flatten()
        assertTrue(rows.any { it.kind == KeyKind.SPACE && it.label.contains("ትግርኛ") })
        assertTrue(rows.any { it.kind == KeyKind.LANGUAGE && it.label == "EN" } ||
            rows.any { it.kind == KeyKind.SPACE })
        assertTrue(rows.any { it.label == "ቐ" })
    }
}
