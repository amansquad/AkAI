package com.example.akai_app

import android.content.Context
import android.graphics.Color
import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.FrameLayout
import io.flutter.embedding.android.FlutterView
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.engine.dart.DartExecutor
import io.flutter.embedding.engine.loader.FlutterLoader
import io.flutter.FlutterInjector
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

/**
 * AkaiImeService – Flutter-based Input Method Service.
 *
 * Architecture:
 *  - The FlutterEngine is initialized once in onCreate().
 *  - A new FlutterView is created on each call to onCreateInputView() and
 *    immediately attached to the engine.
 *  - The FrameLayout root is given an explicit, measured height so the
 *    Flutter framework never receives "zero width" display metrics.
 */
class AkaiImeService : InputMethodService() {

    companion object {
        private const val CHANNEL = "com.akai.keyboard/control"
        private const val EVENTS = "com.akai.keyboard/events"
    }

    private var flutterEngine: FlutterEngine? = null
    private var flutterView: FlutterView? = null
    private var channel: MethodChannel? = null
    private var eventChannel: EventChannel? = null
    private var eventSink: EventChannel.EventSink? = null

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        initializeFlutterEngine()
    }

    override fun onDestroy() {
        flutterView?.detachFromFlutterEngine()
        flutterView = null
        flutterEngine?.destroy()
        flutterEngine = null
        super.onDestroy()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View creation
    // ─────────────────────────────────────────────────────────────────────────

    override fun onCreateInputView(): View {
        val height = calculateKeyboardHeight()

        // Reuse the root container if it already exists – creating a new
        // FlutterView each time causes SurfaceSyncGroup timeouts (>1000ms)
        // that result in a black keyboard.
        if (flutterView != null) {
            val parent = flutterView!!.parent
            if (parent is FrameLayout) {
                parent.layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, height
                )
                flutterView!!.layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, height
                )
                return parent
            }
        }

        // First-time creation
        val root = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                height
            )
            setBackgroundColor(Color.parseColor("#1C1B2E")) // deep purple base
        }

        flutterView = FlutterView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                height
            )
        }

        flutterEngine?.let { engine ->
            flutterView!!.attachToFlutterEngine(engine)
        }

        root.addView(flutterView)
        return root
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IME callbacks → forwarded to Flutter via EventChannel
    // ─────────────────────────────────────────────────────────────────────────

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        eventSink?.success(
            mapOf(
                "type" to "inputStart",
                "inputType" to (info?.inputType ?: 0),
                "imeOptions" to (info?.imeOptions ?: 0),
                "packageName" to info?.packageName,
                "hintText" to info?.hintText?.toString()
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CRITICAL: these three methods override the default IME behavior that was
    // causing "onFailed at PHASE_IME_ON_SHOW_SOFT_INPUT_TRUE"
    // ─────────────────────────────────────────────────────────────────────────

    /** Always agree to show the keyboard when the system asks. */
    override fun onShowInputRequested(flags: Int, configChange: Boolean): Boolean = true

    /** Never go full-screen – that breaks the layout sizing logic. */
    override fun onEvaluateFullscreenMode(): Boolean = false

    /** Always show the input view (i.e. the keyboard panel). */
    override fun onEvaluateInputViewShown(): Boolean = true

    override fun onFinishInputView(finishingInput: Boolean) {
        super.onFinishInputView(finishingInput)
        eventSink?.success(mapOf("type" to "inputFinish"))
    }

    override fun onUpdateSelection(
        oldSelStart: Int, oldSelEnd: Int,
        newSelStart: Int, newSelEnd: Int,
        candidatesStart: Int, candidatesEnd: Int
    ) {
        super.onUpdateSelection(
            oldSelStart, oldSelEnd,
            newSelStart, newSelEnd,
            candidatesStart, candidatesEnd
        )
        eventSink?.success(
            mapOf(
                "type" to "selectionUpdate",
                "selectionStart" to newSelStart,
                "selectionEnd" to newSelEnd
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    private fun initializeFlutterEngine() {
        val engine = FlutterEngine(this)

        val loader: FlutterLoader = FlutterInjector.instance().flutterLoader()
        loader.startInitialization(applicationContext)
        loader.ensureInitializationComplete(applicationContext, null)

        val entrypoint = DartExecutor.DartEntrypoint(
            loader.findAppBundlePath(),
            "keyboardMain"
        )
        engine.dartExecutor.executeDartEntrypoint(entrypoint)

        // Register MethodChannel for key press actions
        channel = MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL)
            .apply { setMethodCallHandler(::handleMethodCall) }

        // Register EventChannel to send system events to Flutter
        eventChannel = EventChannel(engine.dartExecutor.binaryMessenger, EVENTS)
            .apply {
                setStreamHandler(object : EventChannel.StreamHandler {
                    override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                        eventSink = events
                    }
                    override fun onCancel(arguments: Any?) {
                        eventSink = null
                    }
                })
            }

        flutterEngine = engine
    }

    private fun handleMethodCall(call: io.flutter.plugin.common.MethodCall, result: MethodChannel.Result) {
        android.util.Log.d("AkaiIME", "Method call [${call.method}]")
        
        when (call.method) {
            "commitText" -> {
                val conn = currentInputConnection
                val text = call.argument<String>("text") ?: ""
                android.util.Log.d("AkaiIME", "committing text: $text | conn: ${conn != null}")
                conn?.commitText(text, 1)
                result.success(null)
            }
            "deleteText" -> {
                val conn = currentInputConnection
                val count = call.argument<Int>("count") ?: 1
                conn?.deleteSurroundingText(count, 0)
                result.success(null)
            }
            "deleteWord" -> {
                val conn = currentInputConnection
                // Simple approach: delete 1 word (up to 20 chars back)
                val before = conn?.getTextBeforeCursor(20, 0)?.toString() ?: ""
                val wordLen = before.trimEnd().length - before.trimEnd().trimEnd { !it.isWhitespace() }.length
                conn?.deleteSurroundingText(wordLen.coerceAtLeast(1), 0)
                result.success(null)
            }
            "performAction" -> {
                val conn = currentInputConnection
                val info = currentInputEditorInfo
                val action = info?.imeOptions?.and(EditorInfo.IME_MASK_ACTION) ?: EditorInfo.IME_ACTION_NONE
                android.util.Log.d("AkaiIME", "performing action: $action")
                if (action != EditorInfo.IME_ACTION_NONE) {
                    conn?.performEditorAction(action)
                } else {
                    conn?.commitText("\n", 1)
                }
                result.success(null)
            }
            "hideKeyboard" -> {
                requestHideSelf(0)
                result.success(null)
            }
            "switchKeyboard" -> {
                switchToNextInputMethod(false)
                result.success(null)
            }
            "playHaptic" -> {
                flutterView?.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY)
                result.success(null)
            }
            "getEditorState" -> {
                val info = currentInputEditorInfo
                result.success(
                    mapOf(
                        "inputType" to (info?.inputType ?: 0),
                        "imeOptions" to (info?.imeOptions ?: 0),
                        "packageName" to info?.packageName,
                        "hintText" to info?.hintText?.toString()
                    )
                )
            }
            "getCursorInfo" -> {
                val conn = currentInputConnection
                val before = conn?.getTextBeforeCursor(100, 0)?.toString() ?: ""
                val after = conn?.getTextAfterCursor(100, 0)?.toString() ?: ""
                result.success(mapOf("textBefore" to before, "textAfter" to after))
            }
            "sendKey" -> {
                val conn = currentInputConnection
                val keyCode = call.argument<Int>("keyCode") ?: 0
                conn?.sendKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, keyCode))
                conn?.sendKeyEvent(android.view.KeyEvent(android.view.KeyEvent.ACTION_UP, keyCode))
                result.success(null)
            }
            else -> result.notImplemented()
        }
    }

    private fun calculateKeyboardHeight(): Int {
        val dm = resources.displayMetrics
        // Use 40% of screen height, clamped between 240dp and 360dp
        val pct = (dm.heightPixels * 0.40).toInt()
        val minPx = (240 * dm.density).toInt()
        val maxPx = (360 * dm.density).toInt()
        return pct.coerceIn(minPx, maxPx)
    }
}
