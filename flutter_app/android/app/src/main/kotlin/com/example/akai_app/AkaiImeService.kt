package com.example.akai_app

import android.content.Context
import android.graphics.Color
import android.inputmethodservice.InputMethodService
import android.os.Handler
import android.os.Looper
import android.util.DisplayMetrics
import android.view.View
import android.view.WindowManager
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
 * AkaiImeService – Flutter-based Input Method Service
 */
class AkaiImeService : InputMethodService() {

    private var flutterEngine: FlutterEngine? = null
    private var flutterView: FlutterView? = null
    private var channel: MethodChannel? = null
    private var eventChannel: EventChannel? = null
    private var eventSink: EventChannel.EventSink? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    companion object {
        private const val CHANNEL = "com.akai.keyboard/control"
        private const val EVENTS = "com.akai.keyboard/events"
    }

    override fun onCreate() {
        super.onCreate()
        
        flutterEngine = FlutterEngine(this)
        
        val loader: FlutterLoader = FlutterInjector.instance().flutterLoader()
        loader.startInitialization(applicationContext)
        loader.ensureInitializationComplete(applicationContext, null)

        val entrypoint = DartExecutor.DartEntrypoint(
            loader.findAppBundlePath(),
            "keyboardMain"
        )
        flutterEngine?.dartExecutor?.executeDartEntrypoint(entrypoint)

        flutterEngine?.let { engine ->
            channel = MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL)
            channel?.setMethodCallHandler { call, result ->
                when (call.method) {
                    "commitText" -> {
                        val text = call.argument<String>("text")
                        currentInputConnection?.commitText(text, 1)
                        result.success(null)
                    }
                    "deleteText" -> {
                        val count = call.argument<Int>("count") ?: 1
                        currentInputConnection?.deleteSurroundingText(count, 0)
                        result.success(null)
                    }
                    "performAction" -> {
                        val action = currentInputEditorInfo?.imeOptions?.and(EditorInfo.IME_MASK_ACTION) 
                            ?: EditorInfo.IME_ACTION_NONE
                        if (action != EditorInfo.IME_ACTION_NONE) {
                            currentInputConnection?.performEditorAction(action)
                        } else {
                            currentInputConnection?.commitText("\n", 1)
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
                        result.success(mapOf(
                            "inputType" to info?.inputType,
                            "imeOptions" to info?.imeOptions,
                            "packageName" to info?.packageName,
                            "hintText" to info?.hintText?.toString()
                        ))
                    }
                    else -> result.notImplemented()
                }
            }

            eventChannel = EventChannel(engine.dartExecutor.binaryMessenger, EVENTS)
            eventChannel?.setStreamHandler(object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    eventSink = events
                }
                override fun onCancel(arguments: Any?) {
                    eventSink = null
                }
            })
        }
    }

    private fun keyboardHeightPx(): Int {
        val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val dm = DisplayMetrics()
        @Suppress("DEPRECATION")
        wm.defaultDisplay.getMetrics(dm)
        val density = dm.density
        val pct = (dm.heightPixels * 0.45).toInt()
        val minDp = (320 * density).toInt()
        val maxDp = (420 * density).toInt()
        return pct.coerceIn(minDp, maxDp)
    }

    override fun onCreateInputView(): View {
        val height = keyboardHeightPx()
        val root = FrameLayout(this)
        root.layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, height
        )
        root.setBackgroundColor(Color.TRANSPARENT)

        flutterView = FlutterView(this)
        flutterView?.attachToFlutterEngine(flutterEngine!!)
        flutterView?.layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, height
        )

        root.addView(flutterView)
        return root
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        eventSink?.success(mapOf(
            "type" to "inputStart",
            "inputType" to info?.inputType,
            "imeOptions" to info?.imeOptions,
            "packageName" to info?.packageName,
            "hintText" to info?.hintText?.toString()
        ))
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        super.onFinishInputView(finishingInput)
        eventSink?.success(mapOf("type" to "inputFinish"))
    }

    override fun onUpdateSelection(
        oldSelStart: Int, oldSelEnd: Int,
        newSelStart: Int, newSelEnd: Int,
        candidatesStart: Int, candidatesEnd: Int
    ) {
        super.onUpdateSelection(oldSelStart, oldSelEnd, newSelStart, newSelEnd, candidatesStart, candidatesEnd)
        eventSink?.success(mapOf(
            "type" to "selectionUpdate",
            "selectionStart" to newSelStart,
            "selectionEnd" to newSelEnd
        ))
    }

    override fun onDestroy() {
        flutterView?.detachFromFlutterEngine()
        flutterEngine?.destroy()
        flutterEngine = null
        flutterView = null
        super.onDestroy()
    }
}
