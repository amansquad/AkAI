package com.example.akai_app

import android.view.View
import android.view.inputmethod.EditorInfo
import io.flutter.embedding.android.FlutterView
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.engine.FlutterEngineCache
import io.flutter.embedding.engine.dart.DartExecutor
import android.inputmethodservice.InputMethodService
import android.content.Context
import android.view.ViewGroup
import android.widget.FrameLayout

class KeyboardIME : InputMethodService() {
    private var flutterEngine: FlutterEngine? = null
    private var flutterView: FlutterView? = null

    override fun onCreate() {
        super.onCreate()
        
        // Initialize Flutter Engine
        flutterEngine = FlutterEngine(this)
        flutterEngine?.dartExecutor?.executeDartEntrypoint(
            DartExecutor.DartEntrypoint.createDefault()
        )
        
        // Cache the engine if needed
        FlutterEngineCache.getInstance().put("akai_engine", flutterEngine)
    }

    override fun onCreateInputView(): View {
        val screenWidth = resources.displayMetrics.widthPixels
        val keyboardHeight = (resources.displayMetrics.heightPixels * 0.4).toInt()

        val root = FrameLayout(this)
        root.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )

        flutterView = FlutterView(this)
        flutterView?.attachToFlutterEngine(flutterEngine!!)
        flutterView?.layoutParams = FrameLayout.LayoutParams(
            screenWidth,
            keyboardHeight
        )

        root.addView(flutterView)
        return root
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        // You could send the EditorInfo to Flutter here via a MethodChannel
    }

    override fun onDestroy() {
        flutterView?.detachFromFlutterEngine()
        flutterEngine?.destroy()
        flutterEngine = null
        super.onDestroy()
    }
}
