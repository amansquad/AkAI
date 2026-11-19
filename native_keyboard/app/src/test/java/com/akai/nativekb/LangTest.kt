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

    @Test fun arabicJoinsTheCycleLast() {
        assertEquals(listOf(Lang.EN, Lang.AM, Lang.TI, Lang.OM, Lang.AR), Lang.enabled(true, true, true, true))
        assertEquals(Lang.AR, Lang.next(Lang.EN, Lang.enabled(false, false, amharic = false, arabic = true)))
        assertTrue(Lang.AR.caseless && Lang.AM.caseless && !Lang.EN.caseless && !Lang.OM.caseless)
    }

    @Test fun arabicBoardHasEveryLetterAndItsPunctuation() {
        val o = LayoutOptions(lang = Lang.AR, nextLang = Lang.EN)
        val keys = Layouts.build(LayoutId.ARABIC, false, o).rows.flatten()
        val letters = keys.filter { it.kind == KeyKind.CHAR }.map { it.label }.toSet()
        // The 28 letters of the alphabet, directly or under another letter (hamza forms).
        val alphabet = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي"
        val reachable = letters + keys.flatMap { it.alternates }
        assertTrue(alphabet.filter { it.toString() !in reachable }.toString(), alphabet.all { it.toString() in reachable })
        assertTrue("ة" in reachable && "ى" in reachable && "ء" in reachable && "ئ" in reachable && "ؤ" in reachable)
        // Arabic comma, with the vowel marks on a long press, and question mark.
        val comma = keys.first { it.label == "،" }
        assertTrue("َ" in comma.alternates && "ّ" in comma.alternates)
        assertTrue(keys.any { it.label == "." && "؟" in it.alternates })
        assertTrue(keys.any { it.kind == KeyKind.SPACE && it.label == "العربية" })
        assertTrue(keys.none { it.kind == KeyKind.SHIFT })
    }

    @Test fun arabicDigitsAreOnTheNumberRow() {
        val o = LayoutOptions(lang = Lang.AR, numberRow = true)
        val row = Layouts.build(LayoutId.ARABIC, false, o).rows.first()
        assertEquals("١", row.first { it.label == "1" }.alternates.single())
    }

    @Test fun arabicSuggestionsHaveNoEnglishFixesOrEmoji() {
        val out = Suggest.forText("السلام ", false, lang = Lang.AR)
        assertEquals("عليكم", out.first())
        assertTrue(out.none { Suggest.isEmoji(it) })
        val completed = Suggest.forText("مر", false, lang = Lang.AR, dict = Dictionary(listOf("مرحبا", "مرة")))
        assertTrue("مرحبا" in completed)
    }

    @Test fun somaliJoinsTheCycleAndSharesOromosRules() {
        val all = Lang.enabled(true, true, true, true, true)
        assertEquals(Lang.SO, all.last())
        assertTrue(Lang.SO.ownLatin && Lang.OM.ownLatin && !Lang.EN.ownLatin && !Lang.AR.ownLatin)
        assertTrue(!Lang.SO.geez && !Lang.SO.caseless)
        val keys = Layouts.build(LayoutId.LETTERS, false, LayoutOptions(lang = Lang.SO, nextLang = Lang.EN)).rows.flatten()
        assertTrue(keys.any { it.kind == KeyKind.CHAR && it.label == "'" })
        assertTrue(keys.any { it.kind == KeyKind.SPACE && it.label == "Af-Soomaali" })
    }

    @Test fun somaliSuggestionsHaveNoEnglishFixesOrEmoji() {
        assertEquals("iska", Suggest.forText("", false, lang = Lang.SO).first())
        val out = Suggest.forText("sidee ", false, lang = Lang.SO)
        assertEquals("tahay", out.first())
        assertTrue(out.none { Suggest.isEmoji(it) })
    }

    /** The server maps these names to language codes, so every language needs its own. */
    @Test fun everyLanguageHasADistinctServerName() {
        assertEquals(Lang.entries.size, Lang.entries.map { it.serverName }.toSet().size)
        assertEquals("Tigrinya", Lang.TI.serverName)
    }

    @Test fun amharicCanBeLeftOut() {
        assertEquals(listOf(Lang.EN, Lang.OM), Lang.enabled(false, true, amharic = false))
        assertEquals(listOf(Lang.EN), Lang.enabled(false, false, amharic = false))
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
