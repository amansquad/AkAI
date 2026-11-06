package com.akai.keyboard;

import android.content.Context;
import android.graphics.Typeface;
import android.os.Build;

/**
 * The website's two display faces, bundled in assets/fonts: Archivo for
 * Latin text and Noto Serif Ethiopic for Ge'ez. Both are variable fonts, so
 * weight is picked with a variation setting; that needs Android 8, and older
 * phones fall back to the system's faces.
 */
final class AkaiFonts {

    private static Typeface display;
    private static Typeface geez;

    private AkaiFonts() {}

    /** Archivo at ExtraBold, for titles and wordmarks. */
    static synchronized Typeface display(Context context) {
        if (display == null) {
            display = load(context);
        }
        return display;
    }

    /** Noto Serif Ethiopic at Bold, for Ge'ez script. */
    static synchronized Typeface geez(Context context) {
        if (geez == null) {
            geez = loadVariable(context, "fonts/NotoSerifEthiopic.ttf", "'wght' 700, 'wdth' 100",
                    Typeface.create(Typeface.SERIF, Typeface.BOLD));
        }
        return geez;
    }

    private static Typeface load(Context context) {
        return loadVariable(context, "fonts/Archivo.ttf", "'wght' 800, 'wdth' 100",
                Typeface.create("sans-serif-black", Typeface.NORMAL));
    }

    private static Typeface loadVariable(Context context, String asset, String variation, Typeface fallback) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Typeface t = new Typeface.Builder(context.getAssets(), asset)
                        .setFontVariationSettings(variation)
                        .build();
                if (t != null) return t;
            } catch (RuntimeException ignored) {
                // Fall through to the system face.
            }
        }
        return fallback;
    }
}
