package com.akai.keyboard;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import java.io.IOException;
import java.io.InputStream;

/**
 * Builds a WebView serving the bundled Next.js export (assets/public, put
 * there by `npx cap sync android`). Shared by the keyboard service and the
 * settings screen so both run the same web app from the same origin — which
 * also means they share localStorage, so a theme picked in settings is the
 * theme the keyboard actually uses.
 */
final class AkaiWebAppView {

    private static final String TAG = "AkaiWebAppView";
    static final String ORIGIN = "https://appassets.androidplatform.net";

    private AkaiWebAppView() {}

    /**
     * @param bridge     optional object exposed to JS, registered before the
     *                   page loads so it exists by the time page scripts run
     * @param bridgeName the global name the bridge is exposed under
     */
    @SuppressLint("SetJavaScriptEnabled")
    static WebView create(Context context, String path, Object bridge, String bridgeName) {
        WebView wv = new WebView(context);
        WebSettings settings = wv.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true); // the web app persists to localStorage
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Next.js's static export uses root-relative asset URLs
        // (/_next/static/...). Under a plain file:// load those resolve
        // against the filesystem root and 404. Serving from a virtual https
        // origin makes them resolve the way the page expects. A custom
        // handler is used rather than the stock AssetsPathHandler so that
        // "assets/public/" acts as the origin root.
        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/", assetPath -> {
                    try {
                        InputStream stream = context.getAssets().open("public/" + assetPath);
                        String ext = MimeTypeMap.getFileExtensionFromUrl(assetPath);
                        String mime = ext.isEmpty() ? null : MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                        return new WebResourceResponse(mime, null, stream);
                    } catch (IOException e) {
                        return null;
                    }
                })
                .build();

        // Without a WebChromeClient the page's console output goes nowhere,
        // which makes anything that only misbehaves inside the IME — where
        // there are no devtools — very hard to see. Forward it to logcat.
        wv.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage msg) {
                Log.d(TAG, msg.message() + " (" + msg.sourceId() + ":" + msg.lineNumber() + ")");
                return true;
            }
        });

        wv.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                Log.e(TAG, "onReceivedError: " + request.getUrl() + " -> " + error.getDescription());
            }
        });

        // Registered before loadUrl so the global exists by the time the
        // page's scripts run.
        if (bridge != null) {
            wv.addJavascriptInterface(bridge, bridgeName);
        }

        wv.loadUrl(ORIGIN + path);
        return wv;
    }
}
