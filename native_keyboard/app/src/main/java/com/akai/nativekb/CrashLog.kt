package com.akai.nativekb

import android.app.Application
import android.content.Context
import android.os.Build
import org.json.JSONObject
import java.io.File

/** Starts before the keyboard or any screen, so a crash anywhere is noted. */
class AkaiApp : Application() {
    override fun onCreate() {
        super.onCreate()
        CrashLog.install(this)
    }
}

/**
 * Notes the last crash on the phone, and nowhere else. Settings then offers to
 * show it and, only if the person taps Send, posts it to the Akai server
 * (`/api/crash`). What goes is the error and where in the code it happened,
 * the app and Android versions and the phone model: never typed text.
 */
object CrashLog {
    private const val FILE = "last_crash.txt"
    /** A trace this long is plenty; the server takes no more either. */
    private const val MAX_CHARS = 12_000

    fun install(context: Context) {
        val app = context.applicationContext
        val previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, error ->
            try { save(app, thread.name, error) } catch (e: Throwable) { /* never get in the way of the crash */ }
            previous?.uncaughtException(thread, error)
        }
    }

    private fun save(context: Context, thread: String, error: Throwable) {
        val trace = android.util.Log.getStackTraceString(error)
            // Exception messages can quote text (an index into a word, say); keep only
            // the class names and code locations, which is what fixing it needs.
            .lines().joinToString("\n") { line -> scrub(line) }
        val text = buildString {
            append("Thread: ").append(thread).append('\n')
            append(trace)
        }.take(MAX_CHARS)
        File(context.filesDir, FILE).writeText(text)
    }

    /** "java.lang.Foo: some message" → "java.lang.Foo"; "at a.b.C(File.kt:12)" lines are kept. */
    internal fun scrub(line: String): String {
        val t = line.trim()
        if (t.startsWith("at ") || t.startsWith("...")) return line
        val prefix = if (t.startsWith("Caused by: ")) "Caused by: " else ""
        val rest = t.removePrefix(prefix)
        val name = rest.substringBefore(':').trim()
        return if (name.matches(Regex("[A-Za-z0-9_.$]+"))) prefix + name else prefix + "(message hidden)"
    }

    /** The saved crash, or null when there's none. */
    fun pending(context: Context): String? =
        File(context.filesDir, FILE).takeIf { it.exists() }?.readText()?.takeIf { it.isNotBlank() }

    fun clear(context: Context) { File(context.filesDir, FILE).delete() }

    /** Everything that would be sent, as the person sees it before sending. */
    fun report(context: Context, trace: String): JSONObject = JSONObject()
        .put("app", BuildConfig.VERSION_NAME)
        .put("appCode", BuildConfig.VERSION_CODE)
        .put("android", Build.VERSION.RELEASE)
        .put("sdk", Build.VERSION.SDK_INT)
        .put("model", "${Build.MANUFACTURER} ${Build.MODEL}".take(80))
        .put("trace", trace)

    /** Posts the report; answers true when the server took it. */
    fun send(context: Context, server: String, done: (Boolean) -> Unit) {
        val trace = pending(context) ?: return done(true)
        val body = report(context, trace).toString()
        val app = context.applicationContext
        Net.background {
            val r = Net.request(
                "${server.trim().trimEnd('/')}/api/crash", body,
                headers = mapOf("X-AkAI-Device" to Community.device(app)),
            )
            val ok = r != null && r.code in 200..299
            if (ok) clear(app)
            Net.ui { done(ok) }
        }
    }
}
