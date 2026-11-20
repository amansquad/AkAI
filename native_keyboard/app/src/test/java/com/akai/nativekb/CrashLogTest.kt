package com.akai.nativekb

import org.junit.Assert.assertEquals
import org.junit.Test

class CrashLogTest {
    @Test fun dropsExceptionMessages() {
        assertEquals("java.lang.IllegalStateException", CrashLog.scrub("java.lang.IllegalStateException: typed ሰላም here"))
        assertEquals("Caused by: java.lang.RuntimeException", CrashLog.scrub("Caused by: java.lang.RuntimeException: secret"))
        assertEquals("java.lang.NullPointerException", CrashLog.scrub("java.lang.NullPointerException"))
    }

    @Test fun keepsCodeLocations() {
        val at = "\tat com.akai.nativekb.KeyboardView.onDraw(KeyboardView.kt:412)"
        assertEquals(at, CrashLog.scrub(at))
        assertEquals("\t... 12 more", CrashLog.scrub("\t... 12 more"))
    }

    @Test fun hidesLinesThatAreNotClassNames() {
        assertEquals("(message hidden)", CrashLog.scrub("hello world: something"))
    }
}
