package com.akai.nativekb

enum class KeyKind {
    CHAR, SHIFT, BACKSPACE, ENTER, SPACE, SYMBOLS, LANGUAGE, PAD_ABC, SPACER,
    /** A slot in the Amharic vowel row; its letter comes from the view. */
    VOWEL,
    /** Switches between the fidel board and phonetic (Latin-in) Amharic. */
    PHONETIC,
    /** Moves the cursor; [Key.output] names the direction (home, left, up, down, right, end). */
    CURSOR,
    /** Flips between the two pages of the symbols board. */
    SYMBOLS_PAGE,
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

enum class LayoutId { LETTERS, PHONETIC, FIDEL, SYMBOLS, SYMBOLS2, NUMBER, PHONE, DATETIME }

class Layout(
    val id: LayoutId,
    val rows: List<List<Key>>,
    val rowHeightDp: Float,
    /**
     * Boards whose height this one shares: it takes the tallest of them, so
     * switching language or going to ?123 doesn't make the keyboard jump.
     */
    val sameHeightAs: List<Layout> = emptyList(),
) {
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
    /** A row of cursor keys above the bottom row. */
    val cursorRow: Boolean = false,
    /** Where the language switch lives: one of [LangKey]. */
    val langKey: String = LangKey.SYMBOLS,
)

/** Places for the language switch, chosen in Settings → Languages. */
object LangKey {
    /** A key beside ?123 (the original place). */
    const val SYMBOLS = "symbols"
    /** The first toolbar button, before emoji. */
    const val TOOLBAR = "toolbar"
    /** No key: hold the space bar, then slide left or right. */
    const val SPACE = "space"
    /** A key between the full stop and Enter, by the right thumb. */
    const val RIGHT = "right"
    val all = listOf(SYMBOLS, TOOLBAR, SPACE, RIGHT)
    fun parse(s: String?) = if (s in all) s!! else SYMBOLS
}

object Layouts {

    /** Slots in the Amharic vowel row. */
    const val MAX_VOWELS = 12

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

    /** Long-press extras on the symbols board: currencies, maths, quotes, fractions. */
    private val symbolAlternates: Map<String, List<String>> = mapOf(
        "1" to listOf("¹", "½", "⅓", "¼", "⅛"),
        "2" to listOf("²", "⅔"),
        "3" to listOf("³", "¾", "⅜"),
        "4" to listOf("⁴"),
        "5" to listOf("⅝"),
        "7" to listOf("⅞"),
        "0" to listOf("°", "ⁿ", "∅"),
        "@" to listOf("©", "®", "™"),
        "#" to listOf("№", "♯"),
        "\$" to listOf("€", "£", "¥", "¢", "₹", "₩", "₿", "Br"),
        "%" to listOf("‰", "℅"),
        "&" to listOf("§", "¶"),
        "-" to listOf("–", "—", "·", "•"),
        "+" to listOf("±", "×", "÷"),
        "(" to listOf("[", "{", "<"),
        ")" to listOf("]", "}", ">"),
        "/" to listOf("\\", "|", "÷"),
        "=" to listOf("≠", "≈", "≡", "∞"),
        "_" to listOf("‾"),
        "|" to listOf("¦", "‖"),
        "<" to listOf("≤", "«", "‹", "←"),
        ">" to listOf("≥", "»", "›", "→"),
        "[" to listOf("⟨"),
        "]" to listOf("⟩"),
        "*" to listOf("★", "☆", "†", "‡"),
        "\"" to listOf("“", "”", "„", "«", "»"),
        "'" to listOf("‘", "’", "‚", "`", "‹", "›"),
        ";" to listOf("፤"),
        ":" to listOf("፡", "፥", "፦"),
        "!" to listOf("¡", "‼"),
        "?" to listOf("¿", "‽", "፧"),
        "~" to listOf("^", "`", "≈"),
        "." to listOf("…", "·", "•", "።"),
        "," to listOf("፣", "،"),
        "፲" to listOf("፳", "፴", "፵", "፶", "፷", "፸", "፹", "፺", "፻", "፼"),
        "።" to listOf("…", "."),
        "፣" to listOf(","),
        "፧" to listOf("?"),
    )

    /** A symbol key with its long-press extras; the first one is drawn as a corner hint. */
    private fun sym(c: String): Key {
        val alts = symbolAlternates[c].orEmpty()
        return Key(KeyKind.CHAR, c, alternates = alts, hint = alts.firstOrNull()?.takeIf { it.length == 1 })
    }

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

    private fun cursorRow() = listOf(
        Key(KeyKind.CURSOR, "⇤", output = "home"),
        Key(KeyKind.CURSOR, "◀", 1.4f, output = "left"),
        Key(KeyKind.CURSOR, "▲", 1.4f, output = "up"),
        Key(KeyKind.CURSOR, "▼", 1.4f, output = "down"),
        Key(KeyKind.CURSOR, "▶", 1.4f, output = "right"),
        Key(KeyKind.CURSOR, "⇥", output = "end"),
    )

    /** Puts the cursor row (when wanted) just above the bottom row. */
    private fun withCursorRow(l: Layout, o: LayoutOptions): Layout {
        if (!o.cursorRow || l.isPad) return l
        val rows = l.rows.toMutableList()
        rows.add(rows.size - 1, cursorRow())
        // A fifth or sixth row would make the board too tall, so the rows get a little shorter.
        return Layout(l.id, rows, l.rowHeightDp * 0.9f, l.sameHeightAs)
    }

    /**
     * Every typing board (English, the Amharic board in use, both symbol pages)
     * shares one height: the tallest letter board's. The fidel board has six rows
     * and the others four, so their keys stretch to fill it (labels stay normal
     * size). [amharicBoard] is FIDEL or PHONETIC, whichever Amharic is set to.
     */
    fun build(id: LayoutId, amharicSymbols: Boolean, o: LayoutOptions, amharicBoard: LayoutId = LayoutId.FIDEL): Layout {
        val l = withCursorRow(buildBase(id, amharicSymbols, o), o)
        if (l.isPad) return l
        val letterBoards = listOf(LayoutId.LETTERS, amharicBoard).map { withCursorRow(buildBase(it, amharicSymbols, o), o) }
        return Layout(l.id, l.rows, l.rowHeightDp, sameHeightAs = letterBoards)
    }

    /**
     * The symbols board. Page 1 has digits and everyday punctuation; its =\< key
     * opens page 2 with the rarer symbols, whose own key comes back.
     */
    private fun symbolsBoard(amharicSymbols: Boolean, o: LayoutOptions, page: Int): Layout {
        fun syms(s: String) = s.map { sym(it.toString()) }
        val pageKey = if (page == 1) Key(KeyKind.SYMBOLS_PAGE, "=\\<", 1.5f)
            else Key(KeyKind.SYMBOLS_PAGE, if (amharicSymbols) "፩፪" else "?123", 1.5f)
        val top: List<List<Key>> = when {
            amharicSymbols && page == 1 -> listOf(
                KeyboardData.ethiopicNumerals.map { sym(it) },
                KeyboardData.ethiopicPunctuation.map { sym(it) },
                listOf(pageKey) + listOf("-", "(", ")", "/", "?", "!", ":").map { sym(it) } + backspace(1.5f),
            )
            amharicSymbols -> listOf(
                syms("1234567890"),
                syms("@#\$%&+=*_~"),
                listOf(pageKey) + listOf("€", "£", "¥", "\"", "'", ";", "|").map { sym(it) } + backspace(1.5f),
            )
            page == 1 -> listOf(
                syms("1234567890"),
                syms("@#\$%&-+()/"),
                listOf(pageKey) + listOf("*", "\"", "'", ":", ";", "!", "?").map { sym(it) } + backspace(1.5f),
            )
            else -> listOf(
                syms("~`|•√π÷×§∆"),
                syms("£¢€¥^°={}\\"),
                listOf(pageKey) + listOf("_", "©", "®", "™", "✓", "[", "]").map { sym(it) } + backspace(1.5f),
            )
        }
        return Layout(
            if (page == 1) LayoutId.SYMBOLS else LayoutId.SYMBOLS2,
            top + listOf(
                listOf(
                    Key(KeyKind.SYMBOLS, if (amharicSymbols) "አማ" else "ABC", 1.5f),
                    sym(","),
                    Key(KeyKind.SPACE, if (amharicSymbols) "አማርኛ" else "English", 4.8f),
                    sym("."),
                    enter(o.enterLabel, 1.5f),
                ),
            ),
            rowHeightDp = 50f,
        )
    }

    /**
     * The bottom row of a letter board, with the language key where the user
     * wants it. Left of the space bar sit [left] (?123 first), right of it [right]
     * (Enter last). Without a key in the row the space bar takes its width.
     */
    private fun bottomRow(
        o: LayoutOptions, left: List<Key>, space: Key, right: List<Key>, langLabel: String, langWeight: Float,
    ): List<Key> {
        val lang = Key(KeyKind.LANGUAGE, langLabel, langWeight)
        return when (o.langKey) {
            LangKey.SYMBOLS -> listOf(left[0], lang) + left.drop(1) + space + right
            LangKey.RIGHT -> left + space + right.dropLast(1) + lang + right.last()
            else -> {
                // The space bar shows its gesture: ‹ English ›.
                val label = if (o.langKey == LangKey.SPACE) "‹  ${space.label}  ›" else space.label
                left + space.copy(label = label, output = space.output, weight = space.weight + langWeight) + right
            }
        }
    }

    private fun buildBase(id: LayoutId, amharicSymbols: Boolean, o: LayoutOptions): Layout = when (id) {
        LayoutId.LETTERS -> {
            val rows = letterRows(o.englishLayout, ::letter).toMutableList()
            if (o.numberRow) rows.add(0, numberRow())
            rows.add(
                bottomRow(
                    o,
                    listOf(Key(KeyKind.SYMBOLS, "?123", 1.4f), if (o.backToPad) Key(KeyKind.PAD_ABC, "123") else ch(",")),
                    Key(KeyKind.SPACE, "English", 4.2f),
                    listOf(ch("."), enter(o.enterLabel, 1.5f)),
                    "አማ", 1.2f,
                ),
            )
            Layout(id, rows, rowHeightDp = if (o.numberRow) 46f else 50f)
        }

        LayoutId.PHONETIC -> {
            val rows = letterRows(o.englishLayout, ::plainLetter).toMutableList()
            if (o.numberRow) rows.add(0, numberRow())
            // One language key: fidel or phonetic is a setting, or a long press on it.
            rows.add(
                bottomRow(
                    o,
                    listOf(Key(KeyKind.SYMBOLS, "፩፪", 1.3f)),
                    Key(KeyKind.SPACE, "አማርኛ", 4.7f),
                    listOf(ch("።"), enter(o.enterLabel, 1.5f)),
                    "EN", 1.2f,
                ),
            )
            Layout(id, rows, rowHeightDp = if (o.numberRow) 46f else 50f)
        }

        LayoutId.FIDEL -> {
            // Room for the longest family (ቀ, ከ, ገ and ኀ have twelve forms). The view
            // shares the row among the forms showing, so shorter families get wider keys.
            val vowelRow = List(MAX_VOWELS) { Key(KeyKind.VOWEL, "", 1f, special = true) }
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
                    bottomRow(
                        o,
                        listOf(Key(KeyKind.SYMBOLS, "፩፪", 1.2f), ch("፣")),
                        Key(KeyKind.SPACE, "አማርኛ", 3.9f),
                        listOf(ch("።"), backspace(1.2f), enter(o.enterLabel, 1.2f)),
                        "EN", 1.1f,
                    ),
                ),
                rowHeightDp = 41f,
            )
        }

        LayoutId.SYMBOLS -> symbolsBoard(amharicSymbols, o, 1)
        LayoutId.SYMBOLS2 -> symbolsBoard(amharicSymbols, o, 2)

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
