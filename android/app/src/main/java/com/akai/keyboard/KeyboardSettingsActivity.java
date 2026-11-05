package com.akai.keyboard;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * The IME's settings screen (declared in res/xml/method.xml, so Android
 * surfaces it from system keyboard settings).
 *
 * It hosts the same web app the keyboard itself runs, rather than a separate
 * native settings UI: the keyboard's themes and preferences live in the web
 * app, and because this WebView shares the keyboard's origin it also shares
 * its localStorage — so a theme or setting chosen here is the one the
 * keyboard actually uses. The previous native screen offered five hardcoded
 * themes that nothing read any more.
 */
public class KeyboardSettingsActivity extends Activity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#1A1A2E"));

        TextView title = new TextView(this);
        title.setText("AkAI Keyboard Settings");
        title.setTextSize(18);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(Color.parseColor("#EAEAEA"));
        title.setPadding(40, 40, 40, 8);
        root.addView(title);

        TextView hint = new TextView(this);
        hint.setText("Use the gear and palette icons in the keyboard below to change settings and pick a theme. Your choices apply to the keyboard everywhere.");
        hint.setTextSize(13);
        hint.setTextColor(Color.parseColor("#AAAAC0"));
        hint.setPadding(40, 0, 40, 24);
        root.addView(hint);

        webView = AkaiWebAppView.create(this, "/keyboard-ime.html", null, null);
        LinearLayout.LayoutParams wvParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f);
        webView.setLayoutParams(wvParams);
        root.addView(webView);

        root.setGravity(Gravity.TOP);
        setContentView(root);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
    }
}
