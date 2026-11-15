package com.akai.nativekb

/** Text shortcuts typed one per line as `abbreviation = full text`. */
object Shortcuts {
    fun parse(text: String): Map<String, String> {
        val out = LinkedHashMap<String, String>()
        for (line in text.lines()) {
            val at = line.indexOf('=')
            if (at < 1) continue
            val key = line.substring(0, at).trim().lowercase()
            val value = line.substring(at + 1).trim()
            if (key.isEmpty() || value.isEmpty() || key.any { !it.isLetterOrDigit() && it != '\'' }) continue
            out[key] = value
        }
        return out
    }
}
