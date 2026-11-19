package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LogicTest {

    @Test fun skinToneApplyOnlyWhereTheEmojiHasOne() {
        assertEquals("👍🏽", EmojiData.withTone("👍", 3))
        // A variation selector is dropped when a tone is added.
        assertEquals("✌🏻", EmojiData.withTone("✌️", 1))
        // Not a tone-able emoji, and tone 0, are left alone.
        assertEquals("😀", EmojiData.withTone("😀", 3))
        assertEquals("👍", EmojiData.withTone("👍", 0))
    }

    @Test fun learnedWordsComeFirst() {
        val learned = mapOf("tomorrow" to 5, "tomato" to 2, "to" to 9)
        val out = Suggest.forText("see you tom", false, learned)
        assertEquals(listOf("tomorrow", "tomato"), out.take(2))
    }

    @Test fun nextWordFollowsWhatTheUserTypes() {
        val pairs = mapOf("good\tmorning" to 4, "good\tluck" to 1)
        val out = Suggest.forText("good ", false, pairs = pairs, withEmoji = false)
        assertEquals("morning", out.first())
    }

    @Test fun emojiRidesAlongWithTheWord() {
        val out = Suggest.forText("I love ", false)
        assertTrue(Suggest.isEmoji(out[1]))
        assertTrue(out.size <= 3)
    }

    @Test fun usersOwnEmojiBeatsTheDefault() {
        val out = Suggest.forText("pizza ", false, emojiHabits = mapOf("pizza\t😋" to 3))
        assertEquals("😋", out[1])
    }

    @Test fun halfTypedWordsGetNoEmoji() {
        assertTrue(Suggest.forText("I lov", false).none(Suggest::isEmoji))
    }

    @Test fun habitsKeepWordPairs() {
        val h = Habits()
        val (word, prev) = Suggest.lastTwo("see you tomorrow")
        h.learnWord(word!!, prev)
        assertEquals(1, h.pairs["you\ttomorrow"])
        assertEquals(null, Suggest.lastTwo("Done. Tomorrow").second)
    }

    @Test fun contractionsAndSlangAreSuggested() {
        val d = Dictionary(java.io.File("src/main/assets/words_en.txt").readLines().filter { it.isNotBlank() })
        assertTrue("there're" in d.completions("there'", 10))
        assertEquals("there're", Suggest.forText("there'r", false, dict = d).first())
        assertTrue(Suggest.forText("He'", false, dict = d).none { it == "he" })
        assertTrue("he'll" in Suggest.forText("He'l", false, dict = d))
        assertTrue("rizz" in d && "bussin" in d && "delulu" in d)
        assertEquals("rizz", Suggest.forText("riz", false, dict = d).first())
        assertEquals(1, Habits().also { h -> Suggest.lastTwo("we'll").first?.let { h.learnWord(it, null) } }.words["we'll"])
    }

    @Test fun memeWordsAreSuggestedButDoNotRewriteOrdinaryWords() {
        val d = Dictionary(java.io.File("src/main/assets/words_en.txt").readLines().filter { it.isNotBlank() })
        assertTrue("stonks" in d && "poggers" in d && "gigachad" in d && "brainrot" in d)
        assertTrue("gigach" .let { "gigachad" in d.completions(it, 5) })
        assertEquals("the", Suggest.forText("teh", false, dict = d).first())
    }

    @Test fun amharicNextWordsComeFromTheBundledTableAfterYourOwnHabits() {
        val table = Words.parseNextWords(java.io.File("src/main/assets/nextword_am.txt").readLines().filter { it.isNotBlank() })
        assertTrue(table.size > 5000)
        // A word the built-in everyday list lacks gets the table's guesses.
        val unknown = table.keys.first { it !in KeyboardData.nextWordAm }
        val got = Suggest.forText("$unknown ", true, nextWords = table, lang = Lang.AM)
        assertEquals(table.getValue(unknown).take(3), got.take(3))
        // The everyday pairs stay first, and the user's own habits come before both.
        assertEquals(KeyboardData.nextWordAm.getValue("ሰላም").first(), Suggest.forText("ሰላም ", true, nextWords = table, lang = Lang.AM).first())
        val own = Suggest.forText("$unknown ", true, pairs = mapOf("$unknown	ቤት" to 5), nextWords = table, lang = Lang.AM)
        assertEquals("ቤት", own.first())
        // Mid-word, nothing changes: completions, not next words.
        assertTrue(Suggest.forText("ሰላ", true, nextWords = table, lang = Lang.AM).none { it == table[unknown]?.first() })
    }

    @Test fun lyricsAreParsedAndCleaned() {
        val json = """[
          {"artistName":"Teddy Afro","trackName":"Teddy Afro - Teddy Afro - Lambadina [Official Video]","plainLyrics":"[Chorus]\nline one\n\nline two","instrumental":false},
          {"artistName":"Teddy Afro","trackName":"Lambadina","plainLyrics":"duplicate","instrumental":false},
          {"artistName":"X","trackName":"Beat","plainLyrics":null,"instrumental":true},
          {"artistName":"Y","trackName":"Empty","plainLyrics":"","instrumental":false}
        ]"""
        val songs = Lyrics.parse(json)!!
        assertEquals(1, songs.size)
        assertEquals("Lambadina", songs[0].title)
        assertEquals(listOf("line one", "line two"), songs[0].lines)
        assertEquals("Teddy Afro", Lyrics.clean("Teddy Afro", "Teddy Afro"))
        assertEquals("Lambadina", Lyrics.clean("Teddy Afro  -  Teddy Afro – Lambadina (Official Video)", "Teddy Afro"))
        assertEquals(null, Lyrics.parse("not json"))
    }

    @Test fun suggestionsAreCappedAndDistinct() {
        val out = Suggest.forText("th", false, mapOf("the" to 1))
        assertTrue(out.size <= 3)
        assertEquals(out.size, out.distinct().size)
    }

    @Test fun everyLayoutBuilds() {
        for (id in LayoutId.values()) for (english in listOf("qwerty", "dvorak", "azerty", "colemak", "qwertz")) {
            for (amharic in listOf("traditional", "frequency")) {
                val layout = Layouts.build(id, true, LayoutOptions(englishLayout = english, amharicLayout = amharic, numberRow = true))
                assertTrue("$id/$english", layout.rows.isNotEmpty())
                // A key with no weight would collapse to nothing on screen.
                assertTrue(layout.rows.all { row -> row.all { it.weight > 0f } })
            }
        }
    }

    @Test fun lettersLayoutHasBackspaceAndShift() {
        val rows = Layouts.build(LayoutId.LETTERS, false, LayoutOptions(englishLayout = "dvorak")).rows
        val kinds = rows.flatten().map { it.kind }
        assertTrue(KeyKind.SHIFT in kinds && KeyKind.BACKSPACE in kinds && KeyKind.ENTER in kinds)
    }

    @Test fun giphyCatalogueIsAvailableWithoutAKey() {
        assertTrue(KeyboardData.gifs.size > 50)
        assertTrue(Gifs.categories.all { c -> c == "Trending" || KeyboardData.gifs.any { it.category == c } })
    }

    @Test fun shortcutsParseOnePerLine() {
        val m = Shortcuts.parse(listOf("Addr = 12 Bole Road", "bad line", "= nothing", "brb=be right back", "no way = x").joinToString("\n"))
        assertEquals("12 Bole Road", m["addr"])
        assertEquals("be right back", m["brb"])
        assertEquals(2, m.size)
    }
}
