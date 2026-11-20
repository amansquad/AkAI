package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Every translated string has all five languages and keeps the English placeholders. */
class UiTextTest {
    private val tables = mapOf(
        "UI_TEXT_MORE" to UI_TEXT_MORE,
        "UI_TEXT_SCREENS" to UI_TEXT_SCREENS,
        "UI_TEXT_PANELS" to UI_TEXT_PANELS,
        "UI_TEXT_RECENT" to UI_TEXT_RECENT,
    )
    private val placeholder = Regex("\\{\\w+\\}")

    @Test fun everyRowHasFiveLanguages() {
        for ((name, table) in tables) for ((en, row) in table) {
            assertEquals("$name \"$en\"", 5, row.size)
            assertTrue("$name \"$en\" has an empty translation", row.all { it.isNotBlank() })
        }
    }

    @Test fun placeholdersSurviveTranslation() {
        for ((name, table) in tables) for ((en, row) in table) {
            val need = placeholder.findAll(en).map { it.value }.toSet()
            for (cell in row) assertTrue("$name \"$en\" → \"$cell\" lost $need", placeholder.findAll(cell).map { it.value }.toSet().containsAll(need))
        }
    }

    @Test fun recentStringsAreNotDefinedTwice() {
        val older = UI_TEXT_MORE.keys + UI_TEXT_SCREENS.keys + UI_TEXT_PANELS.keys
        assertEquals(emptySet<String>(), UI_TEXT_RECENT.keys intersect older)
    }
}
