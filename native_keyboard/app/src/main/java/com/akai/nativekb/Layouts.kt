package com.akai.nativekb

enum class KeyKind {
    CHAR, SHIFT, BACKSPACE, ENTER, SPACE, SYMBOLS, LANGUAGE, PAD_ABC, SPACER,
    /** A slot in the Amharic vowel row; its letter comes from the view. */
    VOWEL,
    /** Switches between the fidel board and phonetic (Latin-in) Amharic. */
    PHONETIC,
}

/**
 * One key. [output] is what a tap types; [label] is what is drawn. They differ
 * only for keys such as the spacebar, whose label names the language.
 */
data class Key(
    val kind: KeyKind,
    val label: String = "",
    val weight: Float = 1f,
    val output: String = label,
    /** Shown in a bubble on a long press. */
    val alternates: List<String> = emptyList(),
    /** Small corner hint, e.g. the digit on a letter key. */
    val hint: String? = null,
    /** Drawn in the darker "function key" colour. */
    val special: Boolean = kind != KeyKind.CHAR,
    /** Letters follow shift; punctuation and digits do not. */
    val cased: Boolean = false,
)

enum class LayoutId { LETTERS, PHONETIC, FIDEL, SYMBOLS, NUMBER, PHONE, DATETIME }

class Layout(val id: LayoutId, val rows: List<List<Key>>, val rowHeightDp: Float) {
    val isPad get() = id == LayoutId.NUMBER || id == LayoutId.PHONE || id == LayoutId.DATETIME
}

class LayoutOptions(
    val enterLabel: String = "↵",
    /** A row of digits above the letters. */
    val numberRow: Boolean = false,
    /** Offer a key that goes back to the number pad (digit fields only). */
    val backToPad: Boolean = false,
    /** qwerty, dvorak, azerty, colemak or qwertz. */
    val englishLayout: String = "qwerty",
    /** traditional or frequency. */
    val amharicLayout: String = "traditional",
)

object Layouts {

    private fun ch(c: String, weight: Float = 1f, special: Boolean = false) =
        Key(KeyKind.CHAR, c, weight, special = special)

    private fun letter(c: String): Key {
        val alts = KeyboardData.englishAlternates[c].orEmpty()
        // The first alternate is a digit or symbol on most letters; show it
        // as a hint only when it is a single plain character.
        val hint = alts.firstOrNull()?.takeIf { it.length == 1 && !it[0].isLetter() }
        return Key(KeyKind.CHAR, c, alternates = alts, hint = hint, cased = true)
    }

    /** A letter with no accents or hints, for phonetic typing. */
    private fun plainLetter(c: String) = Key(KeyKind.CHAR, c, cased = true)

    private fun fidel(c: String) =
        Key(KeyKind.CHAR, c, alternates = KeyboardData.amharicVowels[c].orEmpty())

    private fun spacer(w: Float) = Key(KeyKind.SPACER, weight = w)
    private fun backspace(w: Float) = Key(KeyKind.BACKSPACE, "⌫", w)
    private fun enter(label: String, w: Float) = Key(KeyKind.ENTER, label, w)
    private fun chars(s: String) = s.map { ch(it.toString()) }

    private val qwertyLetters = listOf("qwertyuiop", "asdfghjkl", "zxcvbnm").map { r -> r.map { it.toString() } }

    /** Three letter rows for the chosen layout, with shift and backspace filling the third. */
    private fun letterRows(name: String, make: (String) -> Key): List<List<Key>> {
        val rows = KeyboardData.englishLayouts[name] ?: qwertyLetters
        val first = rows[0].map(make)
        val missing = 10 - rows[1].size
        val second = (if (missing > 0) listOf(spacer(missing / 2f)) else emptyList()) +
            rows[1].map(make) + (if (missing > 0) listOf(spacer(missing / 2f)) else emptyList())
        val side = maxOf(1f, (10 - rows[2].size) / 2f)
        val third = listOf(Key(KeyKind.SHIFT, "⇧", side)) + rows[2].map(make) + backspace(side)
        return listOf(first, second, third)
    }

    private fun numberRow() = chars("1234567890")

    fun build(id: LayoutId, amharicSymbols: Boolean, o: LayoutOptions): Layout = when (id) {
        LayoutId.LETTERS -> {
            val rows = letterRows(o.englishLayout, ::letter).toMutableList()
            if (o.numberRow) rows.add(0, numberRow())
            rows.add(
                listOf(
                    Key(KeyKind.SYMBOLS, "?123", 1.4f),
                    Key(KeyKind.LANGUAGE, "አማ", 1.2f),
                    if (o.backToPad) Key(KeyKind.PAD_ABC, "123") else ch(","),
                    Key(KeyKind.SPACE, "English", 4.2f),
                    ch("."),
                    enter(o.enterLabel, 1.5f),
                ),
            )
            Layout(id, rows, rowHeightDp = if (o.numberRow) 46f else 50f)
        }

        LayoutId.PHONETIC -> {
            val rows = letterRows(o.englishLayout, ::plainLetter).toMutableList()
            if (o.numberRow) rows.add(0, numberRow())
            rows.add(
                listOf(
                    Key(KeyKind.SYMBOLS, "፩፪", 1.3f),
                    Key(KeyKind.LANGUAGE, "EN", 1.2f),
                    Key(KeyKind.PHONETIC, "ፈደል", 1.3f),
                    Key(KeyKind.SPACE, "አማርኛ", 3.4f),
                    ch("።"),
                    enter(o.enterLabel, 1.5f),
                ),
            )
            Layout(id, rows, rowHeightDp = if (o.numberRow) 46f else 50f)
        }

        LayoutId.FIDEL -> {
            val vowelRow = List(8) { Key(KeyKind.VOWEL, "", 1f, special = true) }
            val source = if (o.amharicLayout == "frequency") KeyboardData.amharicFrequencyRows else KeyboardData.amharicRows
            val rows = source.map { r ->
                val keys = r.map { fidel(it) }
                // Shorter rows are centred rather than stretched.
                val pad = (9 - keys.size) / 2f
                if (pad > 0f) listOf(spacer(pad)) + keys + spacer(pad) else keys
            }
            Layout(
                id,
                listOf(vowelRow) + rows + listOf(
                    listOf(
                        Key(KeyKind.SYMBOLS, "፩፪", 1.2f),
                        Key(KeyKind.LANGUAGE, "EN", 1.1f),
                        Key(KeyKind.PHONETIC, "ABC", 1.1f),
                        ch("፣"),
                        Key(KeyKind.SPACE, "አማርኛ", 2.8f),
                        ch("።"),
                        backspace(1.2f),
                        enter(o.enterLabel, 1.2f),
                    ),
                ),
                rowHeightDp = 41f,
            )
        }

        LayoutId.SYMBOLS -> {
            val top = if (amharicSymbols) {
                listOf(
                    KeyboardData.ethiopicNumerals.map { ch(it) },
                    KeyboardData.ethiopicPunctuation.map { ch(it) },
                    listOf(spacer(0.25f)) + listOf("-", "(", ")", "/", "?", "!", ":").map { ch(it) } +
                        backspace(1.5f),
                )
            } else {
                listOf(
                    chars("1234567890"),
                    chars("@#\$%&-+()/"),
                    listOf(spacer(0.25f)) + listOf("*", "\"", "'", ":", ";", "!", "?", "~").map { ch(it) } +
                        backspace(1.5f),
                )
            }
            Layout(
                id,
                top + listOf(
                    listOf(
                        Key(KeyKind.SYMBOLS, if (amharicSymbols) "አማ" else "ABC", 1.5f),
                        ch(","),
                        Key(KeyKind.SPACE, if (amharicSymbols) "አማርኛ" else "English", 4.8f),
                        ch("."),
                        enter(o.enterLabel, 1.5f),
                    ),
                ),
                rowHeightDp = 50f,
            )
        }

        LayoutId.NUMBER, LayoutId.PHONE, LayoutId.DATETIME -> {
            val left = when (id) { LayoutId.PHONE -> "*"; LayoutId.DATETIME -> "/"; else -> "," }
            val right = when (id) { LayoutId.PHONE -> "#"; LayoutId.DATETIME -> ":"; else -> "." }
            val sign = if (id == LayoutId.PHONE) "+" else "-"
            Layout(
                id,
                listOf(
                    listOf(ch("1"), ch("2"), ch("3"), backspace(1f)),
                    listOf(ch("4"), ch("5"), ch("6"), ch(sign, special = true)),
                    listOf(ch("7"), ch("8"), ch("9"), Key(KeyKind.PAD_ABC, "ABC")),
                    listOf(ch(left, special = true), ch("0"), ch(right, special = true), enter(o.enterLabel, 1f)),
                ),
                rowHeightDp = 60f,
            )
        }
    }
}
