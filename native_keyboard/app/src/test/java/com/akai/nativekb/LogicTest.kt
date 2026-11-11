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
}
