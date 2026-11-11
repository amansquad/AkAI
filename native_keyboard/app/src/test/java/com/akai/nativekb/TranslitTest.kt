package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TranslitTest {

    @Test fun commonWords() {
        assertEquals("ሰላም", Translit.latinToFidel("selam"))
        assertEquals("በት", Translit.latinToFidel("bet"))
        assertEquals("ሸዋ", Translit.latinToFidel("shewa"))
        assertEquals("ጠና", Translit.latinToFidel("Tena"))
    }

    @Test fun waPicksTheLabialisedForm() {
        assertEquals("ሏ", Translit.latinToFidel("lwa"))
        assertEquals("ቧ", Translit.latinToFidel("bwa"))
    }

    /** ሇ ኧ ዯ ፇ sit in the eighth slot but are not -wa sounds. */
    @Test fun waNeverPicksANonWaEighthForm() {
        for (latin in listOf("hwa", "ywa", "tsswa")) {
            val out = Translit.latinToFidel(latin)
            for (wrong in listOf("ሇ", "ኧ", "ዯ", "ፇ")) {
                assert(wrong !in out) { "$latin gave $out" }
            }
        }
    }

    @Test fun typingKeyByKeyMatchesTheWholeWord() {
        var state = Translit.EMPTY
        val typed = StringBuilder()
        for (c in "selam") {
            val step = Translit.press(state, c)
            typed.setLength(typed.length - step.replaceLast)
            typed.append(step.insert)
            state = step.next
        }
        assertEquals("ሰላም", typed.toString())
    }

    @Test fun backspaceOnAnEmptyBufferDoesNothing() {
        assertNull(Translit.backspace(Translit.EMPTY))
    }
}
