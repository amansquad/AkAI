package com.akai.nativekb

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.InputStream
import java.io.OutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

/**
 * Backup and restore to one .zip the person keeps wherever they like (Drive,
 * Downloads, a computer). It holds every setting, learned word, custom theme,
 * text shortcut and pinned clip (all in the settings file), and the installed
 * sticker packs' files, so a restore needs no internet.
 *
 * Left out on purpose: copied pictures in the clipboard (private, and large)
 * and caches.
 */
object Backup {
    private const val FORMAT = "akai-backup"
    private const val VERSION = 1
    private const val SETTINGS = "settings.json"
    private const val PACKS = "sticker_packs/"
    /** Bigger than any real backup; stops a wrong file from filling the phone. */
    private const val MAX_BYTES = 200L * 1024 * 1024

    /** Settings that belong to this one phone and shouldn't move to another. */
    private val SKIP = setOf(Prefs.FLOAT_X, Prefs.FLOAT_Y, Prefs.RESTORED_AT)

    fun fileName(): String {
        val day = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
        return "akai-backup-$day.zip"
    }

    /** Writes the backup; returns how many sticker packs went in. Throws when it can't write. */
    fun write(context: Context, out: OutputStream): Int {
        val prefs = context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
        val values = JSONObject()
        for ((k, v) in prefs.all) {
            if (k in SKIP || v == null) continue
            val typed = when (v) {
                is Boolean -> JSONObject().put("t", "b").put("v", v)
                is Int -> JSONObject().put("t", "i").put("v", v)
                is Long -> JSONObject().put("t", "l").put("v", v)
                is Float -> JSONObject().put("t", "f").put("v", v.toDouble())
                is String -> JSONObject().put("t", "s").put("v", v)
                is Set<*> -> JSONObject().put("t", "set").put("v", JSONArray(v.map { it.toString() }))
                else -> continue
            }
            values.put(k, typed)
        }
        val meta = JSONObject()
            .put("format", FORMAT)
            .put("version", VERSION)
            .put("app", BuildConfig.VERSION_NAME)
            .put("made", System.currentTimeMillis())
            .put("settings", values)

        var packs = 0
        ZipOutputStream(out.buffered()).use { zip ->
            zip.putNextEntry(ZipEntry(SETTINGS))
            zip.write(meta.toString().toByteArray())
            zip.closeEntry()
            val root = packsDir(context)
            root.listFiles()?.filter { it.isDirectory }?.forEach { dir ->
                packs++
                dir.walkTopDown().filter { it.isFile }.forEach { f ->
                    zip.putNextEntry(ZipEntry(PACKS + f.relativeTo(root).invariantSeparatorsPath))
                    f.inputStream().use { it.copyTo(zip) }
                    zip.closeEntry()
                }
            }
        }
        return packs
    }

    class Restored(val settings: Int, val packs: Int)

    /**
     * Replaces this phone's settings and sticker packs with the backup's.
     * Throws [IllegalArgumentException] with a readable message when the file
     * isn't an Akai backup; nothing is changed then.
     */
    fun restore(context: Context, input: InputStream): Restored {
        // Unpack into a scratch folder first, so a bad file changes nothing.
        val scratch = File(context.cacheDir, "restore").apply { deleteRecursively(); mkdirs() }
        try {
            var meta: JSONObject? = null
            var total = 0L
            ZipInputStream(input.buffered()).use { zip ->
                while (true) {
                    val e = zip.nextEntry ?: break
                    if (e.isDirectory) continue
                    when {
                        e.name == SETTINGS -> {
                            val buf = java.io.ByteArrayOutputStream()
                            total += copyCapped(zip, buf, MAX_BYTES - total)
                            meta = try { JSONObject(buf.toString("UTF-8")) } catch (x: Exception) { null }
                        }
                        e.name.startsWith(PACKS) -> {
                            val target = File(scratch, e.name)
                            // Never write outside the scratch folder ("../" in a name).
                            if (!target.canonicalPath.startsWith(scratch.canonicalPath + File.separator)) continue
                            target.parentFile?.mkdirs()
                            target.outputStream().use { total += copyCapped(zip, it, MAX_BYTES - total) }
                        }
                    }
                }
            }
            val m = meta
            if (m == null || m.optString("format") != FORMAT) throw IllegalArgumentException("That isn't an Akai backup file")
            if (m.optInt("version") > VERSION) throw IllegalArgumentException("That backup is from a newer Akai. Update the app first")
            val values = m.optJSONObject("settings") ?: JSONObject()

            val prefs = context.getSharedPreferences(Prefs.NAME, Context.MODE_PRIVATE)
            val keep = SKIP.filter { prefs.contains(it) }.associateWith { prefs.all[it] }
            val ed = prefs.edit().clear()
            var count = 0
            for (k in values.keys()) {
                if (k in SKIP) continue
                val o = values.optJSONObject(k) ?: continue
                when (o.optString("t")) {
                    "b" -> ed.putBoolean(k, o.optBoolean("v"))
                    "i" -> ed.putInt(k, o.optInt("v"))
                    "l" -> ed.putLong(k, o.optLong("v"))
                    "f" -> ed.putFloat(k, o.optDouble("v").toFloat())
                    "s" -> ed.putString(k, o.optString("v"))
                    "set" -> {
                        val a = o.optJSONArray("v") ?: JSONArray()
                        ed.putStringSet(k, (0 until a.length()).map { a.optString(it) }.toSet())
                    }
                    else -> continue
                }
                count++
            }
            for ((k, v) in keep) when (v) {
                is Int -> ed.putInt(k, v)
                is Long -> ed.putLong(k, v)
                is Float -> ed.putFloat(k, v)
            }
            // Tells a running keyboard to drop what it holds in memory and read these.
            ed.putLong(Prefs.RESTORED_AT, System.currentTimeMillis())
            ed.commit()

            val packsFrom = File(scratch, PACKS)
            val packsTo = packsDir(context)
            packsTo.deleteRecursively()
            packsTo.mkdirs()
            val dirs = packsFrom.listFiles()?.filter { it.isDirectory }.orEmpty()
            for (d in dirs) d.copyRecursively(File(packsTo, d.name), overwrite = true)
            StickerPacks.reload()
            CustomThemes.refresh(context)
            return Restored(count, dirs.size)
        } finally {
            scratch.deleteRecursively()
        }
    }

    /** Copies one zip entry, failing once more than [room] bytes would be written. */
    private fun copyCapped(input: InputStream, out: OutputStream, room: Long): Long {
        val buf = ByteArray(64 * 1024)
        var n = 0L
        while (true) {
            val r = input.read(buf)
            if (r < 0) return n
            n += r
            if (n > room) throw IllegalArgumentException("That file is too big to be an Akai backup")
            out.write(buf, 0, r)
        }
    }

    private fun packsDir(context: Context) = File(context.filesDir, StickerPacks.DIR)
}
