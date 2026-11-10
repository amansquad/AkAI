package com.akai.nativekb

import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.vision.digitalink.recognition.DigitalInkRecognition
import com.google.mlkit.vision.digitalink.recognition.DigitalInkRecognitionModel
import com.google.mlkit.vision.digitalink.recognition.DigitalInkRecognitionModelIdentifier
import com.google.mlkit.vision.digitalink.recognition.DigitalInkRecognizer
import com.google.mlkit.vision.digitalink.recognition.DigitalInkRecognizerOptions
import com.google.mlkit.vision.digitalink.recognition.Ink

/**
 * Handwriting read on the phone (Google ML Kit digital ink), so the
 * handwriting tab works without the AkAI server. Each language's model is
 * downloaded once, about 20 MB, the first time it is used; after that it
 * works offline and the strokes never leave the phone.
 */
object Handwriting {
    private val recognizers = HashMap<String, DigitalInkRecognizer>()
    private val downloaded = HashSet<String>()

    /** One stroke is a list of (x, y, time in ms). */
    fun recognize(
        strokes: List<List<FloatArray>>, amharic: Boolean,
        status: (String) -> Unit, done: (List<String>?) -> Unit,
    ) {
        val tag = if (amharic) "am" else "en-US"
        val id = try { DigitalInkRecognitionModelIdentifier.fromLanguageTag(tag) } catch (e: Exception) { null }
        if (id == null) { done(null); return }
        val model = DigitalInkRecognitionModel.builder(id).build()

        fun read() {
            // A device whose CPU type the release does not ship (x86) has no recognizer:
            // report failure so the panel can try the server instead.
            val r = try {
                recognizers.getOrPut(tag) {
                    DigitalInkRecognition.getClient(DigitalInkRecognizerOptions.builder(model).build())
                }
            } catch (e: Throwable) { done(null); return }
            val ink = Ink.builder()
            for (s in strokes) {
                if (s.isEmpty()) continue
                val b = Ink.Stroke.builder()
                for (p in s) b.addPoint(Ink.Point.create(p[0], p[1], p[2].toLong()))
                ink.addStroke(b.build())
            }
            r.recognize(ink.build())
                .addOnSuccessListener { res -> done(res.candidates.map { it.text }.filter { it.isNotBlank() }.distinct()) }
                .addOnFailureListener { done(null) }
        }

        if (tag in downloaded) { read(); return }
        val manager = RemoteModelManager.getInstance()
        manager.isModelDownloaded(model)
            .addOnSuccessListener { have ->
                if (have) { downloaded.add(tag); read() }
                else {
                    status(if (amharic) "Getting the Amharic handwriting model (about 20 MB, only once)…"
                           else "Getting the English handwriting model (about 20 MB, only once)…")
                    manager.download(model, DownloadConditions.Builder().build())
                        .addOnSuccessListener { downloaded.add(tag); read() }
                        .addOnFailureListener { done(null) }
                }
            }
            .addOnFailureListener { done(null) }
    }
}
