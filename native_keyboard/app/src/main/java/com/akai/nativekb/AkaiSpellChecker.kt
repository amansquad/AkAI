package com.akai.nativekb

import android.content.Context
import android.service.textservice.SpellCheckerService
import android.view.textservice.SentenceSuggestionsInfo
import android.view.textservice.SuggestionsInfo
import android.view.textservice.TextInfo

/**
 * A system spell checker, so other apps underline Amharic (and English) typos
 * from the keyboard's word lists. Chosen in Android's Settings → Spell checker.
 * An Amharic word passes when it is listed, learned, or a listed word with a
 * common prefix or suffix (see [Amharic.isKnown]); anything else is only marked
 * when a close listed word exists, since the list misses many real forms.
 */
class AkaiSpellChecker : SpellCheckerService() {
    override fun onCreate() {
        super.onCreate()
        Words.load(this)
    }

    override fun createSession(): Session = AkaiSession(this)

    private class AkaiSession(private val context: Context) : Session() {
        override fun onCreate() {}

        private fun learned(): Map<String, Int> {
            val out = HashMap<String, Int>()
            val p = context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
            Habits.decode(p.getString(Prefs.LEARNED, "") ?: "", out)
            return out
        }

        override fun onGetSuggestions(textInfo: TextInfo, suggestionsLimit: Int): SuggestionsInfo =
            check(textInfo.text.orEmpty(), suggestionsLimit, learned())

        private fun check(raw: String, limit: Int, learned: Map<String, Int>): SuggestionsInfo {
            val ok = SuggestionsInfo(SuggestionsInfo.RESULT_ATTR_IN_THE_DICTIONARY, emptyArray())
            val word = raw.trim { !it.isLetter() && it != '\'' }
            if (word.length < 2) return ok
            val fixes: List<String> = if (word.all(Amharic::isFidel)) {
                val dict = Words.am ?: return ok
                if (word.length < 3 || Amharic.isKnown(word, dict, learned)) return ok
                // Tigrinya shares the script: a word in its list is not a typo.
                if (Words.ti?.let { Amharic.isKnown(word, it, learned) } == true) return ok
                Amharic.candidates(word, dict, learned)
            } else if (word.all { it in 'a'..'z' || it in 'A'..'Z' || it == '\'' }) {
                val dict = Words.en ?: return ok
                val lower = word.lowercase()
                if (lower in dict || lower in learned || word.first().isUpperCase()) return ok
                // Oromo and Somali are Latin too: a word in their lists is not an English typo.
                if (Words.om?.let { lower in it } == true || Words.so?.let { lower in it } == true) return ok
                AutoCorrect.candidates(lower, dict, learned)
            } else return ok
            // Unknown and nothing close: probably a real word the list lacks, so leave it.
            if (fixes.isEmpty()) return ok
            return SuggestionsInfo(
                SuggestionsInfo.RESULT_ATTR_LOOKS_LIKE_TYPO or SuggestionsInfo.RESULT_ATTR_HAS_RECOMMENDED_SUGGESTIONS,
                fixes.take(limit.coerceAtLeast(1)).toTypedArray(),
            )
        }

        /** Apps send whole sentences; check each word and say where it sits. */
        override fun onGetSentenceSuggestionsMultiple(textInfos: Array<out TextInfo>, suggestionsLimit: Int): Array<SentenceSuggestionsInfo> {
            val learned = learned()
            return textInfos.map { info ->
                val text = info.text.orEmpty()
                val results = ArrayList<SuggestionsInfo>()
                val offsets = ArrayList<Int>()
                val lengths = ArrayList<Int>()
                Regex("""[\p{L}\p{M}']+""").findAll(text).forEach { m ->
                    val r = check(m.value, suggestionsLimit, learned)
                    if (r.suggestionsAttributes and SuggestionsInfo.RESULT_ATTR_LOOKS_LIKE_TYPO != 0) {
                        r.setCookieAndSequence(info.cookie, info.sequence)
                        results.add(r); offsets.add(m.range.first); lengths.add(m.value.length)
                    }
                }
                SentenceSuggestionsInfo(results.toTypedArray(), offsets.toIntArray(), lengths.toIntArray())
            }.toTypedArray()
        }
    }
}
