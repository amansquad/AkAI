package com.akai.keyboard;

import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Typeface;
import android.graphics.drawable.RippleDrawable;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.OvalShape;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * The app's settings screen. It opens straight from the keyboard's Settings
 * button, from the setup screen, and from system keyboard settings (declared
 * in res/xml/method.xml).
 *
 * It hosts the same web app the keyboard itself runs, showing only the
 * settings: the keyboard's themes and preferences live in the web app, and
 * because this WebView shares the keyboard's origin it also shares its
 * localStorage, so a theme or setting chosen here is the one the keyboard
 * actually uses.
 */
public class KeyboardSettingsActivity extends Activity {

    private static final int GROUND = Color.parseColor("#1B2178");
    private static final int PAPER = Color.parseColor("#F7F2E4");

    /**
     * Set whenever this screen was open, so a keyboard that is already
     * running knows to reload and pick up what was changed.
     */
    static volatile boolean settingsTouched = false;

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(GROUND);

        // Header: a way back, and what this screen is.
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(dp(8), dp(4), dp(16), dp(4));

        // A drawn arrow rather than a text glyph, in a 48dp touch target with
        // a ripple.
        View back = new View(this) {
            private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
            private final Path path = new Path();

            @Override
            protected void onDraw(Canvas c) {
                float w = getWidth();
                float h = getHeight();
                p.setStyle(Paint.Style.STROKE);
                p.setStrokeCap(Paint.Cap.ROUND);
                p.setStrokeJoin(Paint.Join.ROUND);
                p.setStrokeWidth(dp(2.5f));
                p.setColor(PAPER);
                path.reset();
                path.moveTo(w * 0.60f, h * 0.30f);
                path.lineTo(w * 0.38f, h * 0.50f);
                path.lineTo(w * 0.60f, h * 0.70f);
                c.drawPath(path, p);
            }
        };
        back.setContentDescription("Back");
        back.setBackground(new RippleDrawable(
                ColorStateList.valueOf(Color.parseColor("#33F7F2E4")), null, new ShapeDrawable(new OvalShape())));
        back.setOnClickListener((View v) -> finish());
        header.addView(back, new LinearLayout.LayoutParams(dp(48), dp(48)));

        // The wordmark: this is AkAI's own screen, and the panel below
        // supplies the "Keyboard Settings" heading.
        TextView mark = new TextView(this);
        mark.setText("AkAI");
        mark.setTextSize(24);
        mark.setTypeface(Typeface.create("sans-serif-black", Typeface.NORMAL));
        mark.setLetterSpacing(-0.02f);
        mark.setTextColor(PAPER);
        header.addView(mark);

        root.addView(header, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        root.addView(new ChevronBand(this), new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(8)));

        webView = AkaiWebAppView.create(this, "/keyboard-ime.html?view=settings", null, null);
        webView.setBackgroundColor(GROUND);
        root.addView(webView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        // Targeting a recent SDK draws the app edge to edge, so keep the
        // content clear of the status and navigation bars.
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            root.setPadding(0, insets.getSystemWindowInsetTop(), 0, insets.getSystemWindowInsetBottom());
            return insets;
        });

        setContentView(root);
    }

    @Override
    protected void onPause() {
        super.onPause();
        settingsTouched = true;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        settingsTouched = true;
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
    }

    private int dp(float v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
