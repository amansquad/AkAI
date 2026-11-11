package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class WordsTest {
    companion object {
        /** The real bundled list; unit tests run from the app module's folder. */
        val dict: Dictionary by lazy {
            Dictionary(File("src/main/assets/words_en.txt").readLines().filter { it.isNotBlank() })
        }

        /** Key centres of a QWERTY board, 100 px per key, rows staggered like the real one. */
        val qwerty: Map<Char, FloatArray> by lazy {
            val m = HashMap<Char, FloatArray>()
            listOf("qwertyuiop" to 0f, "asdfghjkl" to 50f, "zxcvbnm" to 150f).forEachIndexed { r, (row, off) ->
                row.forEachIndexed { i, c -> m[c] = floatArrayOf(off + 50f + i * 100f, 60f + r * 120f) }
            }
            m
        }

        /** A finger path through [word]'s keys, with points in between and a little wobble. */
        fun swipe(word: String): Pair<FloatArray, FloatArray> {
            val xs = ArrayList<Float>()
            val ys = ArrayList<Float>()
            val keys = word.map { qwerty.getValue(it) }
            for (i in 0 until keys.size - 1) {
                val a = keys[i]; val b = keys[i + 1]
                for (s in 0 until 8) {
                    val t = s / 8f
                    xs.add(a[0] + (b[0] - a[0]) * t + (if (s % 2 == 0) 6f else -6f))
                    ys.add(a[1] + (b[1] - a[1]) * t + (if (s % 3 == 0) 5f else -4f))
                }
            }
            xs.add(keys.last()[0]); ys.add(keys.last()[1])
            return xs.toFloatArray() to ys.toFloatArray()
        }
    }

    @Test fun dictionaryLoadsWithContractions() {
        assertTrue(dict.size > 15000)
        assertTrue("the" in dict)
        assertTrue("don't" in dict)
        assertTrue("don" !in dict)
        assertTrue(dict.rankOf("the") < dict.rankOf("elephant"))
    }

    @Test fun completionsAreCommonFirst() {
        val c = dict.completions("hel", 3)
        assertEquals(3, c.size)
        assertTrue(c.all { it.startsWith("hel") && it.length > 3 })
        assertTrue("hello" in c || "help" in c)
    }

    @Test fun autoCorrectFixesTyposAndKeepsWords() {
        assertEquals("the", AutoCorrect.correct("teh", dict))
        assertEquals("I", AutoCorrect.correct("i", dict))
        assertEquals("don't", AutoCorrect.correct("dont", dict))
        assertEquals("Don't", AutoCorrect.correct("Dont", dict))
        assertEquals("because", AutoCorrect.correct("becuase", dict))
        assertEquals("would", AutoCorrect.correct("woudl", dict))
        assertEquals("people", AutoCorrect.correct("peopel", dict))
        // Real words, short words and the user's own words are left alone.
        assertNull(AutoCorrect.correct("house", dict))
        assertNull(AutoCorrect.correct("ok", dict))
        assertNull(AutoCorrect.correct("selam", dict, mapOf("selam" to 3)))
        assertNull(AutoCorrect.correct("abc123", dict))
    }

    @Test fun autoCorrectKeepsCapitals() {
        assertEquals("The", AutoCorrect.correct("Teh", dict))
        assertEquals("THE", AutoCorrect.correct("TEH", dict))
    }

    @Test fun swipesDecodeToTheWord() {
        for (w in listOf("hello", "world", "keyboard", "thanks", "good", "people", "about")) {
            val (xs, ys) = swipe(w)
            val got = Glide.decode(xs, ys, qwerty, 100f, dict)
            assertEquals("swipe for $w gave $got", w, got.firstOrNull())
        }
    }

    @Test fun swipeOffersAlternatives() {
        val (xs, ys) = swipe("in")
        val got = Glide.decode(xs, ys, qwerty, 100f, dict)
        assertTrue(got.isNotEmpty())
        assertTrue(got.size <= 4)
    }

    @Test fun swipeUsesLearnedWords() {
        val (xs, ys) = swipe("akai")
        val got = Glide.decode(xs, ys, qwerty, 100f, dict, mapOf("akai" to 5))
        assertEquals("akai", got.firstOrNull())
    }

    @Test fun emojiSearchFindsByNameAndByEverydayWord() {
        assertTrue("😂" in EmojiSearch.search("lol").take(3))
        assertTrue("🐶" in EmojiSearch.search("dog"))
        assertTrue("🇪🇹" in EmojiSearch.search("ethiopia"))
        assertTrue(EmojiSearch.search("grinning face").isNotEmpty())
        assertTrue(EmojiSearch.search("zzqqxx").isEmpty())
        assertTrue(EmojiSearch.search("   ").isEmpty())
    }

    @Test fun cursorRowSitsAboveTheBottomRow() {
        for (id in listOf(LayoutId.LETTERS, LayoutId.PHONETIC, LayoutId.FIDEL, LayoutId.SYMBOLS)) {
            val plain = Layouts.build(id, false, LayoutOptions())
            val with = Layouts.build(id, false, LayoutOptions(cursorRow = true))
            assertEquals(plain.rows.size + 1, with.rows.size)
            assertTrue(with.rows[with.rows.size - 2].all { it.kind == KeyKind.CURSOR })
            assertTrue(with.rows.last().any { it.kind == KeyKind.SPACE })
        }
        // Number pads never get one.
        assertEquals(4, Layouts.build(LayoutId.NUMBER, false, LayoutOptions(cursorRow = true)).rows.size)
    }

    @Test fun toolbarAlwaysKeepsSettingsAndOrder() {
        val t = Tools.parse("voice,gif,emoji")
        assertEquals(listOf(TOOL_EMOJI, TOOL_GIF, TOOL_VOICE, TOOL_SETTINGS), t.toList())
        assertEquals(listOf(TOOL_SETTINGS), Tools.parse("").toList())
    }

    @Test fun everyPictureThemeHasItsPicture() {
        val pictured = Themes.all.filter { Backdrops.isPicture(it.live) }
        assertTrue(pictured.size >= 8)
        for (t in pictured) {
            val f = File("src/main/assets/backdrops/${Backdrops.assetName(t.live)}.webp")
            assertTrue("${t.id} has no picture at $f", f.isFile && f.length() > 0)
        }
    }

    @Test fun faithThemesAreInTheFaithGroup() {
        assertEquals(7, Themes.all.count { it.category == "faith" })
    }

    @Test fun suggestionsOfferTheCorrectionFirst() {
        val s = Suggest.forText("I like teh", false, emptyMap(), dict)
        assertEquals("the", s.first())
    }
}
