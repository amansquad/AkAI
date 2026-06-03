package com.example.akai_app

import android.annotation.SuppressLint
import android.content.Context
import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.inputmethod.EditorInfo
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * AkaiImeService
 *
 * Android IME that hosts a WebView loading the Next.js keyboard at
 * https://ak-ai-opal.vercel.app/keyboard-ime
 *
 * The web keyboard calls methods on the "AkaiKeyboard" JavaScript interface
 * (injected by addJavascriptInterface) which this service bridges through
 * to the active InputConnection.
 */
class AkaiImeService : InputMethodService() {

    companion object {
        private const val KEYBOARD_URL = "https://ak-ai-opal.vercel.app/keyboard-ime"
    }

    private var webView: WebView? = null

    // -----------------------------------------------------------------------
    // View lifecycle
    // -----------------------------------------------------------------------

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreateInputView(): View {
        val wv = WebView(this).also { webView = it }

        wv.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            databaseEnabled = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
        }

        wv.setBackgroundColor(0x00000000) // transparent
        wv.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                // Nothing extra needed – the page is self-contained
            }
        }

        // Inject the native bridge so the web keyboard can call us
        wv.addJavascriptInterface(KeyboardBridge(this), "AkaiKeyboard")
        wv.loadUrl(KEYBOARD_URL)
        return wv
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        super.onFinishInputView(finishingInput)
        // Notify the web page (optional)
        webView?.evaluateJavascript("if(window.__onInputFinish)window.__onInputFinish();", null)
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        // Notify the web page (optional)
        val pkg = info?.packageName ?: ""
        val hint = info?.hintText?.toString() ?: ""
        webView?.evaluateJavascript(
            "if(window.__onInputStart)window.__onInputStart('${pkg}','${hint}');", null
        )
    }

    override fun onDestroy() {
        webView?.let {
            it.removeAllViews()
            it.destroy()
        }
        webView = null
        super.onDestroy()
    }

    // -----------------------------------------------------------------------
    // JavaScript ↔ InputConnection bridge
    // -----------------------------------------------------------------------

    inner class KeyboardBridge(private val ctx: Context) {

        /** Commit a text string (e.g. a letter, emoji, or word) */
        @JavascriptInterface
        fun commitText(text: String) {
            currentInputConnection?.commitText(text, 1)
        }

        /** Delete `count` characters before the cursor */
        @JavascriptInterface
        fun deleteSurroundingText(count: Int) {
            currentInputConnection?.deleteSurroundingText(count, 0)
        }

        /** Fire the IME action (search, send, done, etc.) */
        @JavascriptInterface
        fun performEnter() {
            val action = currentInputEditorInfo?.imeOptions
                ?.and(EditorInfo.IME_MASK_ACTION) ?: EditorInfo.IME_ACTION_NONE
            if (action != EditorInfo.IME_ACTION_NONE) {
                currentInputConnection?.performEditorAction(action)
            } else {
                currentInputConnection?.commitText("\n", 1)
            }
        }

        /** Insert a space */
        @JavascriptInterface
        fun performSpace() {
            currentInputConnection?.commitText(" ", 1)
        }

        /** Vibrate / haptic (handled on web side, but kept for compatibility) */
        @JavascriptInterface
        fun playHaptic() {
            webView?.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY)
        }

        /** Hide this keyboard */
        @JavascriptInterface
        fun hideKeyboard() {
            requestHideSelf(0)
        }

        /** Switch to the next keyboard */
        @JavascriptInterface
        fun switchKeyboard() {
            switchToNextInputMethod(false)
        }

        /** Returns the current hint text so the web page can show a placeholder */
        @JavascriptInterface
        fun getHintText(): String {
            return currentInputEditorInfo?.hintText?.toString() ?: ""
        }
    }
}
