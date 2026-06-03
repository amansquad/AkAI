package com.example.akai_app

import android.content.Intent
import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import io.flutter.embedding.android.FlutterView
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.engine.FlutterEngineCache
import io.flutter.embedding.engine.dart.DartExecutor
import io.flutter.plugin.common.MethodChannel

class AkaiImeService : InputMethodService() {

    companion object {
        private const val ENGINE_ID = "akai_keyboard_engine"
        private const val CHANNEL_NAME = "com.akai.keyboard/control"
    }

    private var flutterEngine: FlutterEngine? = null
    private var flutterView: FlutterView? = null
    private var methodChannel: MethodChannel? = null

    override fun onCreate() {
        super.onCreate()
        ensureFlutterEngine()
    }

    private fun ensureFlutterEngine() {
        if (flutterEngine != null) return

        val engine = FlutterEngineCache.getInstance().get(ENGINE_ID)
            ?: FlutterEngine(this).also { newEngine ->
                newEngine.dartExecutor.executeDartEntrypoint(
                    DartExecutor.DartEntrypoint.createDefault()
                )
                FlutterEngineCache.getInstance().put(ENGINE_ID, newEngine)
            }
        flutterEngine = engine
    }

    override fun onCreateInputView(): View {
        val engine = flutterEngine ?: return View(this)

        val view = FlutterView(this)
        view.attachToFlutterEngine(engine)

        methodChannel = MethodChannel(engine.dartExecutor.binaryMessenger, CHANNEL_NAME).apply {
            setMethodCallHandler { call, result ->
                when (call.method) {
                    "commitText" -> {
                        val text = call.argument<String>("text") ?: ""
                        currentInputConnection?.commitText(text, 1)
                        result.success(null)
                    }
                    "deleteText" -> {
                        val count = call.argument<Int>("count") ?: 1
                        currentInputConnection?.deleteSurroundingText(count, 0)
                        result.success(null)
                    }
                    "deleteWord" -> {
                        currentInputConnection?.let { ic ->
                            ic.deleteSurroundingText(1, 0)
                            val textBefore = ic.getTextBeforeCursor(50, 0)?.toString() ?: ""
                            val toDelete = textBefore.takeLastWhile { !it.isLetterOrDigit() || it == ' ' }
                            for (i in toDelete.indices) {
                                ic.deleteSurroundingText(1, 0)
                            }
                        }
                        result.success(null)
                    }
                    "performAction" -> {
                        val action = call.argument<String>("action") ?: "done"
                        val imeAction = when (action) {
                            "search" -> EditorInfo.IME_ACTION_SEARCH
                            "go" -> EditorInfo.IME_ACTION_GO
                            "send" -> EditorInfo.IME_ACTION_SEND
                            "next" -> EditorInfo.IME_ACTION_NEXT
                            "done" -> EditorInfo.IME_ACTION_DONE
                            "previous" -> EditorInfo.IME_ACTION_PREVIOUS
                            else -> EditorInfo.IME_ACTION_DONE
                        }
                        currentInputConnection?.performEditorAction(imeAction)
                        result.success(null)
                    }
                    "switchKeyboard" -> {
                        val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
                        imm.showInputMethodPicker()
                        result.success(null)
                    }
                    "hideKeyboard" -> {
                        requestHideSelf(0)
                        result.success(null)
                    }
                    "getEditorState" -> {
                        val info = currentInputEditorInfo
                        result.success(mapOf(
                            "inputType" to info?.inputType,
                            "imeOptions" to info?.imeOptions,
                            "imeActionLabel" to info?.actionLabel?.toString(),
                            "packageName" to info?.packageName,
                            "fieldName" to info?.fieldName,
                            "hintText" to info?.hintText?.toString()
                        ))
                    }
                    "getCursorInfo" -> {
                        val ic = currentInputConnection
                        val textBefore = ic?.getTextBeforeCursor(1000, 0)?.toString() ?: ""
                        val textAfter = ic?.getTextAfterCursor(1000, 0)?.toString() ?: ""
                        result.success(mapOf(
                            "textBefore" to textBefore,
                            "textAfter" to textAfter
                        ))
                    }
                    "sendKey" -> {
                        val keyCode = call.argument<Int>("keyCode") ?: 0
                        sendDownUpKeyEvents(keyCode)
                        result.success(null)
                    }
                    "playHaptic" -> {
                        view.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY)
                        result.success(null)
                    }
                    else -> result.notImplemented()
                }
            }
        }

        flutterView = view
        return view
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        super.onFinishInputView(finishingInput)
        methodChannel?.invokeMethod("onInputFinish", null)
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        flutterView?.let { view ->
            methodChannel?.invokeMethod("onInputStart", mapOf(
                "inputType" to info?.inputType,
                "imeOptions" to info?.imeOptions,
                "actionLabel" to info?.actionLabel?.toString(),
                "packageName" to info?.packageName,
                "hintText" to info?.hintText?.toString()
            ))
        }
    }

    override fun onUpdateSelection(
        oldSelStart: Int,
        oldSelEnd: Int,
        newSelStart: Int,
        newSelEnd: Int,
        candidatesStart: Int,
        candidatesEnd: Int
    ) {
        super.onUpdateSelection(oldSelStart, oldSelEnd, newSelStart, newSelEnd, candidatesStart, candidatesEnd)
        methodChannel?.invokeMethod("onSelectionUpdate", mapOf(
            "selectionStart" to newSelStart,
            "selectionEnd" to newSelEnd
        ))
    }

    override fun onDestroy() {
        super.onDestroy()
        flutterView?.detachFromFlutterEngine()
        flutterView = null
        methodChannel = null
    }
}
