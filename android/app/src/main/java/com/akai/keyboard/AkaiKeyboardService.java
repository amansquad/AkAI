package com.akai.keyboard;

import android.inputmethodservice.InputMethodService;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.HapticFeedbackConstants;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputConnection;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.FrameLayout;

/**
 * Hosts the real AkAI keyboard UI (the same React app at /keyboard-ime, built
 * via `npm run build:android` and bundled into assets/public by
 * `npx cap sync android`) inside a WebView, instead of a separate native
 * renderer. The WebView is created once and kept alive across IME sessions
 * (a "hot start") rather than reloaded every time the input view reappears.
 */
public class AkaiKeyboardService extends InputMethodService {

    private static final String TAG = "AkaiKeyboardService";

    private FrameLayout container;
    private WebView webView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public View onCreateInputView() {
        Log.d(TAG, "onCreateInputView");
        // targetSdk 36 enforces edge-to-edge by default, which clips this
        // window's frame to a tiny fallback height unless it explicitly
        // opts out and manages its own insets.
        if (getWindow() != null && getWindow().getWindow() != null) {
            androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow().getWindow(), true);
        }
        if (container == null) {
            container = createContainer();
        }
        ViewGroup parent = (ViewGroup) container.getParent();
        if (parent != null) {
            parent.removeView(container);
        }
        return container;
    }

    private FrameLayout createContainer() {
        FrameLayout layout = (FrameLayout) getLayoutInflater().inflate(R.layout.ime_container, null);

        // The height has to live on the *child*, not the container:
        // InputMethodService.setInputView() re-adds whatever onCreateInputView()
        // returns with its own MATCH_PARENT x WRAP_CONTENT LayoutParams,
        // discarding ours. So the container always measures WRAP_CONTENT and
        // the keyboard's real height comes from this fixed child height.
        // Sized for the tallest layout: the Amharic/Ge'ez keyboard carries an
        // extra fidel row plus the Ethiopian numeral row, so it needs more
        // room than the English QWERTY layout.
        int heightPx = (int) (350 * getResources().getDisplayMetrics().density);

        WebView wv = AkaiWebAppView.create(this, "/keyboard-ime.html", new AkaiKeyboardBridge(), "AkaiKeyboard");
        wv.setLayoutParams(new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, heightPx));
        webView = wv;

        layout.addView(wv);
        return layout;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
    }

    /**
     * Exposed to the WebView as `window.AkaiKeyboard`. Methods arrive on a
     * background (Binder) thread, so hop back to the main thread before
     * touching the InputConnection.
     */
    private class AkaiKeyboardBridge {

        @JavascriptInterface
        public void commitText(final String text) {
            mainHandler.post(() -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null && text != null) {
                    ic.commitText(text, 1);
                }
            });
        }

        @JavascriptInterface
        public void deleteSurroundingText(final int count) {
            mainHandler.post(() -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null && count > 0) {
                    ic.deleteSurroundingText(count, 0);
                }
            });
        }

        @JavascriptInterface
        public void performEnter() {
            mainHandler.post(() -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic == null) return;
                ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER));
                ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER));
            });
        }

        @JavascriptInterface
        public void performSpace() {
            mainHandler.post(() -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null) {
                    ic.commitText(" ", 1);
                }
            });
        }

        @JavascriptInterface
        public void playHaptic() {
            mainHandler.post(() -> {
                if (webView != null) {
                    webView.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
                }
            });
        }
    }
}
