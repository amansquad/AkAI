package com.akai.nativekb

/**
 * Finds emoji by name. The names come from the Unicode character database
 * built into the platform ("FACE WITH TEARS OF JOY"), plus a few everyday
 * words the official names miss ("lol", "love", "ok").
 */
object EmojiSearch {

    private val extra: Map<String, List<String>> = mapOf(
        "love" to "❤️ 😍 🥰 😘 💕 💖 💘 🫶",
        "heart" to "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔",
        "lol" to "😂 🤣 😆 😹",
        "haha" to "😂 🤣 😆 😄",
        "laugh" to "😂 🤣 😆 😄",
        "happy" to "😀 😃 😄 😊 🥳 😁",
        "sad" to "😢 😭 😞 😔 🥺 💔",
        "cry" to "😢 😭 🥲",
        "angry" to "😠 😡 🤬 💢",
        "mad" to "😠 😡 🤬",
        "ok" to "👌 🆗 👍",
        "yes" to "👍 ✅ 👌",
        "no" to "👎 ❌ 🚫 🙅",
        "thanks" to "🙏 🤝 💐",
        "please" to "🙏 🥺",
        "pray" to "🙏 ⛪ 🕌",
        "party" to "🥳 🎉 🎊 🎈",
        "congrats" to "🎉 🥳 🎊 👏 🏆",
        "birthday" to "🎂 🥳 🎉 🎁 🎈",
        "cool" to "😎 🆒 🤙",
        "fire" to "🔥",
        "lit" to "🔥 💯",
        "kiss" to "😘 😗 😚 💋",
        "hug" to "🤗 🫂",
        "think" to "🤔 🧐",
        "sleep" to "😴 💤 🛌",
        "tired" to "😩 😫 🥱 😴",
        "sick" to "🤒 🤢 🤮 😷",
        "money" to "💰 💵 🤑 💸",
        "coffee" to "☕",
        "buna" to "☕",
        "ethiopia" to "🇪🇹",
        "habesha" to "🇪🇹 ☕ 🍲",
        "food" to "🍲 🍕 🍔 🍜 🥗",
        "eat" to "🍽️ 🍲 😋",
        "music" to "🎵 🎶 🎧 🎤",
        "dance" to "💃 🕺",
        "football" to "⚽",
        "soccer" to "⚽",
        "win" to "🏆 🥇 🎉",
        "good" to "👍 👌 💯 ✅",
        "bad" to "👎 😞",
        "wow" to "😮 🤯 😲",
        "shock" to "😱 😲 🤯",
        "scared" to "😨 😱 😰",
        "hi" to "👋 🙋",
        "hello" to "👋 🙋",
        "bye" to "👋",
        "clap" to "👏",
        "strong" to "💪",
        "sun" to "☀️ 🌞",
        "rain" to "🌧️ ☔",
        "star" to "⭐ 🌟 ✨",
        "flower" to "🌸 🌹 🌻 🌷 💐",
        "dog" to "🐶 🐕",
        "cat" to "🐱 🐈",
        "car" to "🚗 🚕",
        "home" to "🏠 🏡",
        "phone" to "📱 ☎️",
        "eyes" to "👀",
        "skull" to "💀",
        "dead" to "💀 😵",
        "shrug" to "🤷",
        "facepalm" to "🤦",
        // Slang
        "bruh" to "😐 💀", "slay" to "💅 ✨ 🔥", "slayed" to "💅 ✨", "cap" to "🧢", "nocap" to "🧢", "sus" to "🤨 👀",
        "rizz" to "😏 😎", "goat" to "🐐", "bussin" to "🔥 😋", "vibe" to "✨ 😌", "vibes" to "✨ 😌", "vibing" to "🎶 😌",
        "cringe" to "😬", "ghosted" to "👻", "ghosting" to "👻", "lowkey" to "🤫", "highkey" to "😍", "yeet" to "🚀",
        "bestie" to "👯 💕", "cooked" to "💀 🍳", "tea" to "🍵 ☕", "mid" to "😐", "simp" to "🥺", "delulu" to "🤪",
        "ick" to "🤢", "drip" to "💧 🥶", "bet" to "🤝 👍", "fam" to "👨‍👩‍👧‍👦 🤝", "salty" to "🧂 😒", "flex" to "💪",
        "stan" to "🙌", "shook" to "😳", "based" to "🗿", "sigma" to "🗿", "omg" to "😱 🤯", "lmao" to "😂 🤣",
        "lmfao" to "🤣", "rofl" to "🤣", "smh" to "🤦", "brb" to "⏳", "ily" to "❤️ 🥰", "idk" to "🤷", "yolo" to "🤪",
        "fomo" to "😰", "bday" to "🎂 🎉", "glowup" to "✨", "aura" to "✨", "ate" to "😋 🔥", "snatched" to "😍",
        // Memes
        "meme" to "😂 🤡", "memes" to "😂 🤡", "stonks" to "📈 🤑", "stonk" to "📈", "doge" to "🐕", "pepe" to "🐸",
        "chad" to "🗿 😎", "gigachad" to "🗿", "karen" to "💁‍♀️", "boomer" to "👴", "zoomer" to "📱", "poggers" to "😮",
        "pog" to "😮", "kek" to "🤣", "sheesh" to "🥶 😮", "oof" to "😬", "bonk" to "🔨 🐕", "rickroll" to "🎤 🕺",
        "noob" to "👶 🎮", "gg" to "🎮 🤝", "rekt" to "💀", "clout" to "📈 😎", "viral" to "🔥 📱", "brainrot" to "🧠 💀",
        "doomscrolling" to "📱 😵", "troll" to "🧌", "trolling" to "🧌", "copium" to "😭 💨", "sadge" to "😢",
        "bamboozled" to "🤪", "unhinged" to "🤪", "clowned" to "🤡", "gamer" to "🎮", "gamers" to "🎮", "tiktok" to "🎵 📱",
        "wholesome" to "🥹 💖", "cancelled" to "🚫",
    ).mapValues { it.value.split(' ') }

    private class Entry(val emoji: String, val words: List<String>)

    private val index: List<Entry> by lazy {
        val all = LinkedHashSet<String>()
        EmojiData.categories.forEach { all.addAll(it.emojis) }
        all.map { e -> Entry(e, nameOf(e).split(' ', '-', ':', ',').filter { it.isNotEmpty() }) }
    }

    /** "grinning face with smiling eyes" for 😄; flags get their country letters too. */
    fun nameOf(emoji: String): String {
        val cp = emoji.codePointAt(0)
        // Flags keep their country letters as well as the name below.
        if (cp in 0x1F1E6..0x1F1FF && emoji.codePointCount(0, emoji.length) >= 2) {
            val a = 'a' + (cp - 0x1F1E6)
            val b = 'a' + (emoji.codePointAt(Character.charCount(cp)) - 0x1F1E6)
            return "flag $a$b " + EmojiData.name(emoji).orEmpty() + (flagNames["$a$b"]?.let { " $it" } ?: "")
        }
        EmojiData.name(emoji)?.let { return it }
        return (try { Character.getName(cp) } catch (e: Exception) { null }).orEmpty().lowercase()
    }

    private val flagNames = mapOf(
        "et" to "ethiopia", "us" to "usa america united states", "gb" to "uk britain england", "fr" to "france",
        "de" to "germany", "it" to "italy", "es" to "spain", "ca" to "canada", "cn" to "china", "jp" to "japan",
        "in" to "india", "br" to "brazil", "ke" to "kenya", "ng" to "nigeria", "za" to "south africa", "eg" to "egypt",
        "sa" to "saudi arabia", "ae" to "uae emirates", "il" to "israel", "tr" to "turkey", "ru" to "russia",
    )

    /** Words too common or too vague to suggest an emoji for. */
    private val noEmoji = setOf(
        "the", "and", "you", "for", "with", "that", "this", "are", "was", "but", "not", "can", "all", "new",
        "one", "two", "man", "men", "key", "sign", "mark", "symbol", "button", "face", "red", "big", "small",
    )

    /**
     * One emoji that plainly stands for [word] ("pizza" → 🍕, "love" → ❤️), or null.
     * A word only counts when it is an everyday word from the list above, or the whole
     * name or its last word ("red heart" for "heart"), so a half-typed word suggests nothing.
     */
    fun forWord(word: String): String? {
        val w = word.lowercase()
        if (w.length < 3 || w in noEmoji) return null
        extra[w]?.let { return it.first() }
        return index.firstOrNull { it.words.size <= 3 && it.words.last() == w }?.emoji
    }

    /** Emoji matching every word of [query] (each as a word start), best first. */
    fun search(query: String, limit: Int = 40): List<String> {
        val terms = query.lowercase().trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
        if (terms.isEmpty()) return emptyList()
        val out = LinkedHashSet<String>()
        // Everyday words first: "lol" should give 😂 before anything named "lollipop".
        if (terms.size == 1) {
            extra[terms[0]]?.let(out::addAll)
            extra.entries.filter { it.key.startsWith(terms[0]) && it.key != terms[0] }.forEach { out.addAll(it.value) }
        }
        val exact = ArrayList<String>()
        val prefix = ArrayList<String>()
        for (e in index) {
            if (!terms.all { t -> e.words.any { it.startsWith(t) } }) continue
            if (terms.all { t -> t in e.words }) exact.add(e.emoji) else prefix.add(e.emoji)
        }
        out.addAll(exact); out.addAll(prefix)
        return out.take(limit)
    }
}
