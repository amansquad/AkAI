package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class EmojiWordsTest {
    @Test fun everyLanguageHasEverydayWords() {
        for (lang in Lang.entries) if (lang != Lang.EN) {
            assertTrue("${lang.code} has few emoji words", (EMOJI_WORDS[lang]?.size ?: 0) >= 40)
        }
    }

    @Test fun wordsInEachLanguage() {
        assertEquals("❤️", EmojiWords.forWord(Lang.OM, "jaalala"))
        assertEquals("❤️", EmojiWords.forWord(Lang.OM, "Jaalala"))
        assertEquals("☕", EmojiWords.forWord(Lang.SO, "bun"))
        assertEquals("☕", EmojiWords.forWord(Lang.AR, "قهوة"))
        assertEquals("☕", EmojiWords.forWord(Lang.AM, "ቡና"))
        assertEquals("💧", EmojiWords.forWord(Lang.TI, "ማይ"))
        assertNull(EmojiWords.forWord(Lang.OM, "fi"))
    }

    @Test fun amharicFindsWordsByTheirStem() {
        assertEquals("❤️", EmojiWords.forWord(Lang.AM, "ፍቅሩ"))
        assertEquals("🏠", EmojiWords.forWord(Lang.AM, "ቤታችን"))
    }

    @Test fun theStripOffersTheEmoji() {
        assertTrue("☕" in Suggest.forText("waan jaladhu buna", false, lang = Lang.OM))
        assertTrue("☕" in Suggest.forText("أحب قهوة", false, lang = Lang.AR))
    }
}
