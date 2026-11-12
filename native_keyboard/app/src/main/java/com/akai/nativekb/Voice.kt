package com.akai.nativekb

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.widget.Toast

/** What the voice panel shows. */
data class VoiceStatus(val phase: Phase, val heard: String = "", val message: String? = null) {
    enum class Phase { IDLE, STARTING, LISTENING, HEARING, THINKING, NEEDS_PERMISSION, UNAVAILABLE }

    val active get() = phase == Phase.STARTING || phase == Phase.LISTENING || phase == Phase.HEARING || phase == Phase.THINKING
}

interface VoiceListener {
    fun onVoiceStatus(status: VoiceStatus)
    /** How loud the speaker is, 0 to 1, many times a second while listening. */
    fun onVoiceLevel(level: Float)
    /** The words so far, while the person is still speaking. */
    fun onVoicePartial(text: String)
    /** What was said, or null when nothing was (the words so far, if any, stay as they are). */
    fun onVoiceDone(text: String?)
}

/**
 * Voice typing inside the keyboard: the phone's speech service listens while
 * the keyboard stays open, and the words appear in the field as they are
 * recognised. Needs the microphone permission, asked for once by
 * [MicPermissionActivity].
 */
class VoiceInput(private val context: Context, private val listener: VoiceListener) {
    private var recognizer: SpeechRecognizer? = null

    var status = VoiceStatus(VoiceStatus.Phase.IDLE)
        private set

    private fun set(s: VoiceStatus) {
        status = s
        listener.onVoiceStatus(s)
    }

    fun hasPermission() = context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    /** Starts listening in [languageTag] ("en-US", "am-ET"). */
    fun start(languageTag: String) {
        if (!hasPermission()) { set(VoiceStatus(VoiceStatus.Phase.NEEDS_PERMISSION)); return }
        if (!SpeechRecognizer.isRecognitionAvailable(context)) { set(VoiceStatus(VoiceStatus.Phase.UNAVAILABLE)); return }
        val r = recognizer ?: SpeechRecognizer.createSpeechRecognizer(context).also {
            it.setRecognitionListener(callbacks)
            recognizer = it
        }
        r.cancel()
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, languageTag)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
        }
        set(VoiceStatus(VoiceStatus.Phase.STARTING))
        try {
            r.startListening(intent)
        } catch (e: Exception) {
            set(VoiceStatus(VoiceStatus.Phase.IDLE, message = "Couldn't start the speech service. Try again"))
        }
    }

    /** Stops listening and keeps what was heard so far. */
    fun stop() {
        if (!status.active) return
        recognizer?.stopListening()
        set(status.copy(phase = VoiceStatus.Phase.THINKING))
    }

    /** Stops listening and throws away what was not yet typed. */
    fun cancel() {
        if (!status.active) return
        recognizer?.cancel()
        set(VoiceStatus(VoiceStatus.Phase.IDLE))
        listener.onVoiceDone(null)
    }

    fun destroy() {
        recognizer?.destroy()
        recognizer = null
    }

    private fun first(results: Bundle?) =
        results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.trim().orEmpty()

    private val callbacks = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) { set(status.copy(phase = VoiceStatus.Phase.LISTENING)) }
        override fun onBeginningOfSpeech() { set(status.copy(phase = VoiceStatus.Phase.HEARING)) }
        // The service reports roughly -2 dB (silence) to 10 dB (loud speech).
        override fun onRmsChanged(rmsdB: Float) { listener.onVoiceLevel(((rmsdB + 2f) / 12f).coerceIn(0f, 1f)) }
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() { if (status.active) set(status.copy(phase = VoiceStatus.Phase.THINKING)) }
        override fun onEvent(eventType: Int, params: Bundle?) {}

        override fun onPartialResults(partialResults: Bundle?) {
            if (!status.active) return
            val text = first(partialResults)
            if (text.isEmpty()) return
            listener.onVoicePartial(text)
            set(status.copy(heard = text))
        }

        override fun onResults(results: Bundle?) {
            if (!status.active) return
            val text = first(results).ifEmpty { status.heard }
            listener.onVoiceDone(text.ifEmpty { null })
            set(VoiceStatus(VoiceStatus.Phase.IDLE, heard = text, message = if (text.isEmpty()) "Didn't catch that. Tap the mic to try again" else null))
        }

        override fun onError(error: Int) {
            // A cancel reports an error too; the panel already shows that.
            if (!status.active) return
            listener.onVoiceDone(null)
            if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) { set(VoiceStatus(VoiceStatus.Phase.NEEDS_PERMISSION)); return }
            set(VoiceStatus(VoiceStatus.Phase.IDLE, heard = status.heard, message = messageFor(error)))
        }
    }

    companion object {
        fun messageFor(error: Int): String = when (error) {
            SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Didn't catch that. Tap the mic to try again"
            SpeechRecognizer.ERROR_NETWORK, SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "No connection. Voice typing in this language needs the internet"
            SpeechRecognizer.ERROR_AUDIO -> "Couldn't use the microphone. Another app may be using it"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "The speech service is busy. Try again in a moment"
            // ERROR_LANGUAGE_NOT_SUPPORTED and ERROR_LANGUAGE_UNAVAILABLE (Android 12).
            12, 13 -> "Your phone's speech service can't do this language yet. Try the other one, or the system voice screen"
            else -> "Speech recognition stopped. Tap the mic to try again"
        }
    }
}

/**
 * Asks for the microphone once, for voice typing in the keyboard. A keyboard
 * cannot show the request itself, so this see-through screen does.
 */
class MicPermissionActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) { finish(); return }
        requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQUEST)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(this, UiText.t(this, "Microphone allowed. Tap the mic on the keyboard to speak"), Toast.LENGTH_LONG).show()
        } else if (!shouldShowRequestPermissionRationale(Manifest.permission.RECORD_AUDIO)) {
            // Turned down for good: only the app's settings page can allow it now.
            Toast.makeText(this, UiText.t(this, "Allow the microphone under Permissions to use voice typing"), Toast.LENGTH_LONG).show()
            startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null)))
        }
        finish()
    }

    companion object { private const val REQUEST = 7 }
}
