package com.akai.keyboard;

import android.annotation.SuppressLint;
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
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.webkit.WebViewAssetLoader;

import java.io.IOException;
import java.io.InputStream;

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

    @SuppressLint("SetJavaScriptEnabled")
    private FrameLayout createContainer() {
        // Inflated from XML (layout_height="300dp") rather than given
        // programmatic LayoutParams — the IME window sizes itself to the
        // input view's *measured* height, and a WebView's own measure pass
        // can report a small transient value before its content settles,
        // which an XML-fixed height isn't subject to.
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

        WebView wv = new WebView(this);
        wv.setLayoutParams(new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, heightPx));
        WebSettings settings = wv.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true); // keyboard-app.tsx relies on localStorage
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Next.js's static export uses root-relative asset URLs
        // (/_next/static/...). Under a plain file:// load those resolve
        // against the filesystem root and 404. WebViewAssetLoader instead
        // serves files from a virtual https:// origin — using a custom
        // handler (not the stock AssetsPathHandler, which reads from the
        // true assets/ root) so "assets/public/" acts as that origin's
        // root, matching where `npx cap sync android` actually copies the
        // Next.js export.
        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/", path -> {
                    try {
                        InputStream stream = getAssets().open("public/" + path);
                        String ext = MimeTypeMap.getFileExtensionFromUrl(path);
                        String mime = ext.isEmpty() ? null : MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                        return new WebResourceResponse(mime, null, stream);
                    } catch (IOException e) {
                        return null;
                    }
                })
                .build();

        wv.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                Log.d(TAG, "onPageFinished: " + url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                Log.e(TAG, "onReceivedError: " + request.getUrl() + " -> " + error.getDescription());
            }
        });
        wv.addJavascriptInterface(new AkaiKeyboardBridge(), "AkaiKeyboard");
        wv.loadUrl("https://appassets.androidplatform.net/keyboard-ime.html");
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
