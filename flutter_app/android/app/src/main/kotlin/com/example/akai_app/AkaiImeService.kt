package com.example.akai_app

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.inputmethodservice.InputMethodService
import android.util.DisplayMetrics
import android.view.View
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar

/**
 * AkaiImeService – WebView-based IME
 *
 * Hosts a FrameLayout of fixed keyboard height that contains a WebView loading
 * https://ak-ai-opal.vercel.app/keyboard-ime.
 * Keys call window.AkaiKeyboard.* → JavascriptInterface → InputConnection.
 */
class AkaiImeService : InputMethodService() {

    companion object {
        private const val KEYBOARD_URL = "https://ak-ai-opal.vercel.app/keyboard-ime"
    }

    private var webView: WebView? = null
    private var container: FrameLayout? = null

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private fun keyboardHeightPx(): Int {
        val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val dm = DisplayMetrics()
        @Suppress("DEPRECATION")
        wm.defaultDisplay.getMetrics(dm)
        // Use ~40% of screen height, clamped to 280-380dp
        val pct = (dm.heightPixels * 0.40).toInt()
        val minDp = (280 * dm.density).toInt()
        val maxDp = (380 * dm.density).toInt()
        return pct.coerceIn(minDp, maxDp)
    }

    // -----------------------------------------------------------------------
    // View lifecycle
    // -----------------------------------------------------------------------

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreateInputView(): View {
        val height = keyboardHeightPx()

        // Root container – fixed height so Android knows how tall the keyboard is
        val frame = FrameLayout(this).also { container = it }
        frame.setBackgroundColor(Color.BLACK)
        frame.layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, height
        )

        // Loading spinner shown while the page loads
        val spinner = ProgressBar(this).also { pb ->
            pb.layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.CENTER
            }
            pb.isIndeterminate = true
        }
        frame.addView(spinner)

        // WebView that fills the container
        val wv = WebView(this).also { webView = it }
        wv.layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            height
        )
        wv.setBackgroundColor(Color.TRANSPARENT)

        wv.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            allowContentAccess = true
            allowFileAccess = false
            // Tell the web page the available viewport
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        wv.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                // Hide spinner once page loaded
                spinner.visibility = View.GONE
                wv.visibility = View.VISIBLE
                // Pass keyboard height so page can clip correctly
                view?.evaluateJavascript(
                    "document.documentElement.style.setProperty('--ime-height','${height}px');",
                    null
                )
            }
        }

        wv.addJavascriptInterface(KeyboardBridge(this), "AkaiKeyboard")
        wv.visibility = View.INVISIBLE  // hidden until page loads
        wv.loadUrl(KEYBOARD_URL)

        frame.addView(wv)
        return frame
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        val hint = info?.hintText?.toString()?.replace("'", "\\'") ?: ""
        webView?.evaluateJavascript(
            "if(window.__onInputStart)window.__onInputStart('$hint');", null
        )
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        super.onFinishInputView(finishingInput)
        webView?.evaluateJavascript(
            "if(window.__onInputFinish)window.__onInputFinish();", null
        )
    }

    override fun onDestroy() {
        webView?.let { wv ->
            wv.removeAllViews()
            wv.destroy()
        }
        webView = null
        container = null
        super.onDestroy()
    }

    // -----------------------------------------------------------------------
    // JavaScript ↔ InputConnection bridge
    // -----------------------------------------------------------------------

    inner class KeyboardBridge(private val ctx: Context) {

        @JavascriptInterface
        fun commitText(text: String) {
            currentInputConnection?.commitText(text, 1)
        }

        @JavascriptInterface
        fun deleteSurroundingText(count: Int) {
            currentInputConnection?.deleteSurroundingText(count, 0)
        }

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

        @JavascriptInterface
        fun performSpace() {
            currentInputConnection?.commitText(" ", 1)
        }

        @JavascriptInterface
        fun playHaptic() {
            webView?.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY)
        }

        @JavascriptInterface
        fun hideKeyboard() {
            requestHideSelf(0)
        }

        @JavascriptInterface
        fun switchKeyboard() {
            switchToNextInputMethod(false)
        }

        @JavascriptInterface
        fun getHintText(): String =
            currentInputEditorInfo?.hintText?.toString() ?: ""
    }
}
