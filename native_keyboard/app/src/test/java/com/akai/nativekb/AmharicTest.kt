package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class AmharicTest {
    companion object {
        /** The real bundled list; unit tests run from the app module's folder. */
        val dict: Dictionary by lazy {
            Amharic.dictionary(File("src/main/assets/words_am.txt").readLines().filter { it.isNotBlank() })
        }

        /** Key centres of the traditional fidel board, 100 px per key, short rows centred as on the phone. */
        val fidel: Map<Char, FloatArray> by lazy {
            val m = HashMap<Char, FloatArray>()
            KeyboardData.amharicRows.forEachIndexed { r, row ->
                val off = (9 - row.size) * 50f
                row.forEachIndexed { i, c -> m[c[0]] = floatArrayOf(off + 50f + i * 100f, 60f + r * 120f) }
            }
            m
        }

        /** A finger path through [path]'s keys on [board], with points in between and a little wobble. */
        fun swipe(path: String, board: Map<Char, FloatArray>): Pair<FloatArray, FloatArray> {
            val xs = ArrayList<Float>()
            val ys = ArrayList<Float>()
            val keys = path.map { board.getValue(it) }
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

    @Test fun listLoadsWithEverydayWords() {
        assertTrue(dict.size > 15000)
        for (w in listOf("ሰላም", "እንዴት", "አመሰግናለሁ", "ቤት", "ፍቅር")) assertTrue(w, w in dict)
        assertTrue(dict.rankOf("ነው") < dict.rankOf("ቡና"))
    }

    @Test fun phoneticPathsFollowThePhoneticBoard() {
        val p = Amharic.PHONETIC.paths("ሰላም")
        assertEquals("selam", p.first())
        assertTrue("salam" in p)
        assertEquals("ingdet", Amharic.PHONETIC.paths("እንግዴት").first().replaceFirst("e", "i"))
        assertTrue(Amharic.PHONETIC.paths("ጤና").first() == "tena")
        assertTrue(Amharic.PHONETIC.paths("hello").isEmpty())
    }

    @Test fun fidelPathIsTheConsonants() {
        assertEquals(listOf("ሰለመ"), Amharic.FIDEL.paths("ሰላም"))
        assertEquals(listOf("ቀነ"), Amharic.FIDEL.paths("ቋንቋ".take(2)))
        assertTrue(Amharic.FIDEL.paths("ሰ1").isEmpty())
    }

    @Test fun phoneticSwipesDecodeToTheWord() {
        for (w in listOf("ሰላም", "እንዴት", "ቤት", "ፍቅር", "ኢትዮጵያ")) {
            val (xs, ys) = swipe(Amharic.PHONETIC.paths(w).first(), WordsTest.qwerty)
            val got = Glide.decode(xs, ys, WordsTest.qwerty, 100f, dict, spelling = Amharic.PHONETIC)
            assertEquals("phonetic swipe for $w gave $got", w, got.firstOrNull())
        }
    }

    @Test fun phoneticSwipeTakesTheOtherUsualSpelling() {
        val (xs, ys) = swipe("salam", WordsTest.qwerty)
        val got = Glide.decode(xs, ys, WordsTest.qwerty, 100f, dict, spelling = Amharic.PHONETIC)
        assertTrue("salam gave $got", "ሰላም" in got)
    }

    @Test fun fidelSwipesOfferTheWord() {
        for (w in listOf("ሰላም", "ኢትዮጵያ", "ከተማ", "መንግሥት")) {
            val (xs, ys) = swipe(Amharic.FIDEL.paths(w).first(), fidel)
            val got = Glide.decode(xs, ys, fidel, 100f, dict, spelling = Amharic.FIDEL)
            assertTrue("fidel swipe for $w gave $got", w in got)
        }
    }

    @Test fun swipeUsesLearnedAmharicWords() {
        val mine = "ሰላምታችሁ"
        val (xs, ys) = swipe(Amharic.PHONETIC.paths(mine).first(), WordsTest.qwerty)
        val got = Glide.decode(xs, ys, WordsTest.qwerty, 100f, dict, mapOf(mine to 5), spelling = Amharic.PHONETIC)
        assertEquals(mine, got.firstOrNull())
    }

    @Test fun completionsAllowForTheVowelStillToCome() {
        // Fidel: ሰ then ለ, before the vowel row turns ለ into ላ.
        assertTrue(Amharic.completions("ሰለ", dict, 3).toString(), "ሰላም" in Amharic.completions("ሰለ", dict, 3))
        // Phonetic: "sel" shows ሰል.
        assertTrue("ሰላም" in Amharic.completions("ሰል", dict, 3))
        assertTrue(Amharic.completions("ኢትዮ", dict, 3).all { it.startsWith("ኢትዮ") })
    }

    @Test fun correctsVowelAndSoundAlikeSlips() {
        assertEquals("ሰላም", Amharic.correct("ሰለም", dict))
        assertEquals("ኢትዮጵያ", Amharic.correct("ኢቲዮጵያ", dict))
        // Known words, the user's own words, short words and Latin are left alone.
        assertNull(Amharic.correct("ሰላም", dict))
        assertNull(Amharic.correct("ሰለም", dict, mapOf("ሰለም" to 2)))
        assertNull(Amharic.correct("ሰላ", dict).takeIf { "ሰላ" in dict })
        assertNull(Amharic.correct("selam", dict))
    }

    @Test fun suggestionsUseTheAmharicList() {
        val s = Suggest.forText("ሰለም", amharic = true, dict = dict)
        assertEquals("ሰላም", s.firstOrNull())
    }
}
