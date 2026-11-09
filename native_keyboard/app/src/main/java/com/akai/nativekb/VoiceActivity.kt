package com.akai.nativekb

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import android.widget.Toast

/** Hands the recognised text back to the keyboard service. */
object VoiceBridge {
    var onResult: ((String) -> Unit)? = null
}

/**
 * A keyboard cannot listen to the microphone itself, so voice typing opens the
 * system's speech recogniser in a see-through screen and returns the words.
 */
class VoiceActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, getIntent().getStringExtra(EXTRA_LANGUAGE) ?: "en-US")
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }
        try {
            startActivityForResult(intent, REQUEST)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "No speech recognition app is installed", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST && resultCode == RESULT_OK) {
            data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull()?.let {
                VoiceBridge.onResult?.invoke(it)
            }
        }
        finish()
    }

    companion object {
        const val EXTRA_LANGUAGE = "language"
        private const val REQUEST = 1
    }
}
