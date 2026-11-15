package com.akai.nativekb

import android.content.Context
import android.speech.tts.TextToSpeech
import android.widget.Toast
import java.util.Locale

/**
 * Reads text aloud with the phone's own text-to-speech engine. Amharic needs an
 * engine with an Amharic voice; without one the user is told rather than hearing
 * the letters spelt out in English.
 */
class Speaker(private val context: Context) {
    private var tts: TextToSpeech? = null
    private var ready = false
    private var pending: String? = null

    val speaking get() = tts?.isSpeaking == true

    fun speak(text: String) {
        val t = text.trim()
        if (t.isEmpty()) { tell("Nothing to read yet"); return }
        val engine = tts
        if (engine == null || !ready) {
            pending = t
            if (engine == null) tts = TextToSpeech(context.applicationContext) { status ->
                ready = status == TextToSpeech.SUCCESS
                if (!ready) tell("This phone has no text-to-speech engine")
                else pending?.let { pending = null; speak(it) }
            }
            return
        }
        val amharic = t.any { it in 'ሀ'..'᎟' }
        val locale = if (amharic) Locale("am", "ET") else Locale.getDefault()
        val ok = engine.setLanguage(locale)
        if (ok == TextToSpeech.LANG_MISSING_DATA || ok == TextToSpeech.LANG_NOT_SUPPORTED) {
            tell(if (amharic) "No Amharic voice on this phone. Install one in system text-to-speech settings" else "No voice for this language")
            return
        }
        engine.speak(t, TextToSpeech.QUEUE_FLUSH, null, "akai-read")
    }

    fun stop() { tts?.stop() }

    fun destroy() { tts?.shutdown(); tts = null; ready = false }

    private fun tell(message: String) =
        Toast.makeText(context, UiText.t(context, message), Toast.LENGTH_SHORT).show()
}
