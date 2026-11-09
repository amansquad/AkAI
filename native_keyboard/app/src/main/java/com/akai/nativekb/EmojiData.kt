package com.akai.nativekb

object EmojiData {
    class Category(val icon: String, val emojis: List<String>)

    private fun e(s: String) = s.trim().split(Regex("\\s+"))

    /** Emoji that have skin-tone variants (hands, arms, body parts). */
    private val toneable = e("👍 👎 👌 🤌 🤏 ✌ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝ ✋ 🤚 🖐 🖖 👋 🙏 ✍ 💪 🙌 👏 👐 🤲 🫶 👂 👃").toSet()

    /** [tone] is 0 for the default yellow, then 1 (lightest) to 5 (darkest). */
    fun withTone(emoji: String, tone: Int): String {
        if (tone !in 1..5) return emoji
        val first = emoji.codePointAt(0)
        val base = String(Character.toChars(first))
        if (base !in toneable) return emoji
        return base + String(Character.toChars(0x1F3FB + tone - 1))
    }

    val categories = listOf(
        Category("😀", e("😀 😃 😄 😁 😆 😅 😂 🤣 🥲 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 🤥 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 💩 🤡 👻 👽 🤖")),
        Category("👍", e("👍 👎 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤝 🙏 ✍️ 💪 🦾 🙌 👏 👐 🤲 🫶 👀 👅 👄 🧠 🦷 👂 👃")),
        Category("❤️", e("❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ✨ 🌟 ⭐ 🔥 💥 💫 💦 💨 🎉 🎊 🎈 🎁 🏆 🥇 💯 ✅ ❌ ❓ ❗ ⚠️ 🚫")),
        Category("🐶", e("🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🐢 🐍 🦎 🐙 🦑 🦀 🐠 🐟 🐬 🐳 🦈 🐘 🦒 🦓 🐪 🐫 🌵 🌲 🌳 🌴 🌸 🌹 🌻 🌼 🍀 🍁")),
        Category("🍔", e("🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🥦 🥕 🌽 🌶️ 🥔 🍠 🥐 🍞 🥖 🧀 🥚 🍳 🥞 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🌮 🌯 🥗 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🍤 🍙 🍚 🍘 🍦 🍰 🎂 🍩 🍪 🍫 🍬 🍭 ☕ 🍵 🥤 🍺 🍷 🥂")),
        Category("⚽", e("⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🥊 🥋 ⛳ 🎯 🎮 🎲 🎵 🎶 🎤 🎧 🎸 🥁 📱 💻 ⌨️ 🖥️ 📷 📹 📺 💡 🔋 🔌 📚 📖 ✏️ 📝 📌 📎 ✂️ 🔒 🔑 🔨 ⚙️ 💰 💳 ✉️ 📦 🚗 🚕 🚌 🚲 ✈️ 🚀 🏠 🏢 ⛪ 🌍 🌙 ☀️ ☁️ 🌈 ❄️")),
    )
}
