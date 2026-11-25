package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class OfflineDictTest {
    private val small = OfflineDict(
        listOf("house\tቤት", "water\tውሃ", "thank you\tአመሰግናለሁ", "good\tጥሩ", "come\tመጣ"),
        listOf("ቤት\thouse; room; family", "ውሃ\twater", "ጥሩ\tgood", "ሰላም\tpeace; hello"),
    )

    @Test fun aWholePhraseIsATranslation() {
        val r = small.lookup("Thank you!", Lang.EN, Lang.AM)!!
        assertEquals("አመሰግናለሁ", r.text)
        assertFalse(r.wordByWord)
    }

    @Test fun amharicToEnglish() {
        val r = small.lookup("ሰላም።", Lang.AM, Lang.EN)!!
        // Replace types the first meaning; the others are shown beside it.
        assertEquals("peace", r.text)
        assertEquals(listOf("hello"), r.others)
        assertFalse(r.wordByWord)
    }

    @Test fun inflectedWordsFindTheirBase() {
        assertEquals("ቤት", small.lookup("houses", Lang.EN, Lang.AM)!!.text)
        assertEquals("መጣ", small.lookup("coming", Lang.EN, Lang.AM)!!.text)
        // ቤቶች (houses) and ውሃው (the water) are built on ቤት and ውሃ.
        assertEquals("house", small.lookup("ቤቶች", Lang.AM, Lang.EN)!!.text)
        assertEquals("water", small.lookup("ውሃው", Lang.AM, Lang.EN)!!.text)
    }

    @Test fun aSentenceGetsTheMeaningsOfTheWordsItKnows() {
        val r = small.lookup("good water for the house", Lang.EN, Lang.AM)!!
        assertTrue(r.wordByWord)
        assertEquals("good: ጥሩ\nwater: ውሃ\nhouse: ቤት", r.text)
        // Only each word's first meaning, to keep the list short.
        assertEquals("ቤት: house\nጥሩ: good", small.lookup("ቤት ጥሩ ነው", Lang.AM, Lang.EN)!!.text)
    }

    @Test fun nothingKnownOrAnotherLanguageIsNull() {
        assertNull(small.lookup("xylophone", Lang.EN, Lang.AM))
        assertNull(small.lookup("house", Lang.EN, Lang.TI))
        assertNull(small.lookup("   ", Lang.EN, Lang.AM))
    }

    @Test fun bundledDictionaryKnowsEverydayWords() {
        fun read(n: String) = File("src/main/assets/$n").readLines()
        val d = OfflineDict(read("dict_en_am.txt"), read("dict_am_en.txt"))
        for (w in listOf("water", "house", "hello", "good", "eat", "love", "mother", "bread")) {
            assertTrue("$w has no Amharic", d.lookup(w, Lang.EN, Lang.AM)?.wordByWord == false)
        }
        for (w in listOf("ቤት", "ውሃ", "ሰላም", "ጥሩ")) {
            assertTrue("$w has no English", d.lookup(w, Lang.AM, Lang.EN)?.wordByWord == false)
        }
    }
}
