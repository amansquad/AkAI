package com.akai.keyboard;

import android.content.Context;
import android.graphics.Typeface;
import android.os.Build;

/**
 * The display face of the website, Archivo, bundled in assets/fonts. It is
 * a variable font, so weight is picked with a variation setting; that needs
 * Android 8, and older phones fall back to the system's heavy sans-serif.
 */
final class AkaiFonts {

    private static Typeface display;

    private AkaiFonts() {}

    /** Archivo at ExtraBold, for titles and wordmarks. */
    static synchronized Typeface display(Context context) {
        if (display == null) {
            display = load(context);
        }
        return display;
    }

    private static Typeface load(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Typeface t = new Typeface.Builder(context.getAssets(), "fonts/Archivo.ttf")
                        .setFontVariationSettings("'wght' 800, 'wdth' 100")
                        .build();
                if (t != null) return t;
            } catch (RuntimeException ignored) {
                // Fall through to the system face.
            }
        }
        return Typeface.create("sans-serif-black", Typeface.NORMAL);
    }
}
