package com.akai.nativekb

enum class KeyKind { CHAR, SHIFT, BACKSPACE, ENTER, SPACE, SYMBOLS, LANGUAGE, PAD_ABC, SPACER }

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

enum class LayoutId { LETTERS, FIDEL, SYMBOLS, NUMBER, PHONE, DATETIME }

class Layout(val id: LayoutId, val rows: List<List<Key>>, val rowHeightDp: Float)

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

    private fun fidel(c: String) =
        Key(KeyKind.CHAR, c, alternates = KeyboardData.amharicVowels[c].orEmpty())

    private fun spacer(w: Float) = Key(KeyKind.SPACER, weight = w)

    private fun backspace(w: Float) = Key(KeyKind.BACKSPACE, "⌫", w)

    private fun enter(label: String, w: Float) = Key(KeyKind.ENTER, label, w)

    private fun chars(s: String) = s.map { ch(it.toString()) }

    fun build(id: LayoutId, amharicSymbols: Boolean, enterLabel: String): Layout = when (id) {
        LayoutId.LETTERS -> Layout(
            id,
            listOf(
                "qwertyuiop".map { letter(it.toString()) },
                listOf(spacer(0.5f)) + "asdfghjkl".map { letter(it.toString()) } + spacer(0.5f),
                listOf(Key(KeyKind.SHIFT, "⇧", 1.5f)) +
                    "zxcvbnm".map { letter(it.toString()) } + backspace(1.5f),
                listOf(
                    Key(KeyKind.SYMBOLS, "?123", 1.4f),
                    Key(KeyKind.LANGUAGE, "አማ", 1.2f),
                    ch(","),
                    Key(KeyKind.SPACE, "English", 4.2f),
                    ch("."),
                    enter(enterLabel, 1.5f),
                ),
            ),
            rowHeightDp = 50f,
        )

        LayoutId.FIDEL -> {
            val rows = KeyboardData.amharicRows.map { r ->
                val keys = r.map { fidel(it) }
                // Shorter rows are centred rather than stretched.
                val pad = (9 - keys.size) / 2f
                if (pad > 0f) listOf(spacer(pad)) + keys + spacer(pad) else keys
            }
            Layout(
                id,
                rows + listOf(
                    listOf(
                        Key(KeyKind.SYMBOLS, "፩፪", 1.3f),
                        Key(KeyKind.LANGUAGE, "EN", 1.2f),
                        ch("፣"),
                        Key(KeyKind.SPACE, "አማርኛ", 3.4f),
                        ch("።"),
                        backspace(1.3f),
                        enter(enterLabel, 1.3f),
                    ),
                ),
                rowHeightDp = 45f,
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
                        enter(enterLabel, 1.5f),
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
                    listOf(ch(left, special = true), ch("0"), ch(right, special = true), enter(enterLabel, 1f)),
                ),
                rowHeightDp = 60f,
            )
        }
    }
}
