package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/** Swipe typing on the Arabic board, with the real Arabic list. */
class ArabicSwipeTest {
    private val ar by lazy {
        Dictionary(File("src/main/assets/words_ar.txt").readLines().filter { it.isNotBlank() }, listOf(Spelling.ARABIC))
    }

    /** Key centres of the Arabic board as printed (11, 11 and 10 keys), 100 px per key. */
    private val board: Map<Char, FloatArray> by lazy {
        val m = HashMap<Char, FloatArray>()
        listOf("ضصثقفغعهخحج" to 0f, "شسيبلاتنمكط" to 0f, "ظزرذدءؤوةى" to 50f).forEachIndexed { r, (row, off) ->
            row.forEachIndexed { i, c -> m[c] = floatArrayOf(off + 50f + i * 100f, 60f + r * 120f) }
        }
        m
    }

    private fun swipe(path: String): Pair<FloatArray, FloatArray> {
        val xs = ArrayList<Float>(); val ys = ArrayList<Float>()
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

    private fun decode(path: String): List<String> {
        val (xs, ys) = swipe(path)
        return Glide.decode(xs, ys, board, 100f, ar, spelling = Spelling.ARABIC)
    }

    @Test fun hamzaAndVowelMarksSwipeThroughTheirBaseKeys() {
        assertEquals(listOf("انت"), Spelling.ARABIC.paths("أنت"))
        assertEquals(listOf("شكرا"), Spelling.ARABIC.paths("شُكْرًا"))
        assertEquals(listOf("سيل"), Spelling.ARABIC.paths("سئل"))
        assertTrue(Spelling.ARABIC.paths("hello").isEmpty())
    }

    @Test fun commonWordsDecode() {
        for (w in listOf("مرحبا", "شكرا", "كتاب")) assertTrue("$w: ${decode(w)}", w in decode(w).take(2))
    }

    @Test fun wordWithHamzaDecodesFromItsBaseKeys() {
        assertTrue(decode("انت").toString(), "أنت" in decode("انت"))
    }
}
