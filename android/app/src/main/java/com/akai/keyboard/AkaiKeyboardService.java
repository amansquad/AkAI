package com.akai.keyboard;

import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.inputmethodservice.InputMethodService;
import android.inputmethodservice.Keyboard;
import android.inputmethodservice.KeyboardView;
import android.os.Handler;
import android.os.Looper;
import android.view.GestureDetector;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.widget.LinearLayout;
import android.widget.PopupWindow;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

public class AkaiKeyboardService extends InputMethodService implements AkaiKeyboardView.OnKeyboardListener {

    private AkaiKeyboardView customKeyboardView;
    private InputConnection inputConnection;
    private EditorInfo editorInfo;
    private boolean isShifted = false;
    private boolean isSymbolsMode = false;
    private Handler handler;
    private KeyboardThemeManager themeManager;

    // Theme colors
    private int backgroundColor = Color.parseColor("#1A1A2E");
    private int keyBackgroundColor = Color.parseColor("#16213E");
    private int keyTextColor = Color.parseColor("#EAEAEA");
    private int accentColor = Color.parseColor("#0F3460");
    private int specialKeyColor = Color.parseColor("#533483");

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        themeManager = new KeyboardThemeManager(this);
        loadThemeColors();
    }

    private void loadThemeColors() {
        backgroundColor = themeManager.getBackgroundColor();
        keyBackgroundColor = themeManager.getKeyColor();
        keyTextColor = themeManager.getTextColor();
        accentColor = themeManager.getAccentColor();
        specialKeyColor = themeManager.getSpecialKeyColor();
    }

    @Override
    public View onCreateInputView() {
        // Create the main container
        LinearLayout mainContainer = new LinearLayout(this);
        mainContainer.setOrientation(LinearLayout.VERTICAL);
        mainContainer.setBackgroundColor(backgroundColor);

        // Create the custom keyboard view
        customKeyboardView = new AkaiKeyboardView(this);
        customKeyboardView.setOnKeyListener(this);
        customKeyboardView.setBackgroundColor(backgroundColor);
        customKeyboardView.setAccentColor(accentColor);
        customKeyboardView.setKeyBackgroundColor(keyBackgroundColor);
        customKeyboardView.setKeyTextColor(keyTextColor);
        customKeyboardView.setSpecialKeyColor(specialKeyColor);

        // Create emoji bar
        LinearLayout emojiBar = createEmojiBar();
        emojiBar.setBackgroundColor(Color.parseColor("#0D1117"));

        mainContainer.addView(emojiBar, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));

        mainContainer.addView(customKeyboardView, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));

        return mainContainer;
    }

    private LinearLayout createEmojiBar() {
        LinearLayout emojiBar = new LinearLayout(this);
        emojiBar.setOrientation(LinearLayout.HORIZONTAL);
        emojiBar.setPadding(8, 8, 8, 8);
        emojiBar.setGravity(android.view.Gravity.CENTER_VERTICAL);

        // Emoji button
        TextView emojiButton = createBarButton("\uD83D\uDE00");
        emojiButton.setOnClickListener(v -> {
            // Toggle keyboard type
            int currentType = customKeyboardView.isSymbolsMode() ? 1 : 0;
            int newType = (currentType + 1) % 2;
            customKeyboardView.setSymbolsMode(newType == 1);
            customKeyboardView.invalidate();
        });

        // Settings button
        TextView settingsButton = createBarButton("\u2699\uFE0F");
        settingsButton.setOnClickListener(v -> openSettings());

        emojiBar.addView(emojiButton);
        emojiBar.addView(settingsButton);

        return emojiBar;
    }

    private TextView createBarButton(String text) {
        TextView button = new TextView(this);
        button.setText(text);
        button.setTextSize(24);
        button.setPadding(16, 8, 16, 8);
        button.setBackgroundColor(Color.TRANSPARENT);
        return button;
    }

    private void openSettings() {
        Intent intent = new Intent(this, KeyboardSettingsActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
    }

    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        editorInfo = info;
        inputConnection = getCurrentInputConnection();
        
        // Refresh theme colors when keyboard is shown
        loadThemeColors();
        if (customKeyboardView != null) {
            customKeyboardView.setAccentColor(accentColor);
            customKeyboardView.setKeyBackgroundColor(keyBackgroundColor);
            customKeyboardView.setKeyTextColor(keyTextColor);
            customKeyboardView.setSpecialKeyColor(specialKeyColor);
            customKeyboardView.invalidate();
        }
    }

    @Override
    public void onKey(int primaryCode, int[] keyCodes) {
        if (inputConnection == null) return;

        switch (primaryCode) {
            case -1: // Shift
                isShifted = !isShifted;
                customKeyboardView.setShifted(isShifted);
                customKeyboardView.invalidate();
                break;
            case -2: // Symbols
                isSymbolsMode = !isSymbolsMode;
                customKeyboardView.setSymbolsMode(isSymbolsMode);
                customKeyboardView.invalidate();
                break;
            case -3: // Space
                inputConnection.commitText(" ", 1);
                break;
            case -4: // Backspace
                inputConnection.deleteSurroundingText(1, 0);
                break;
            case -5: // Enter
                inputConnection.performEditorAction(EditorInfo.IME_ACTION_DONE);
                break;
            case -6: // Next
                inputConnection.performEditorAction(EditorInfo.IME_ACTION_NEXT);
                break;
            default:
                char character = (char) primaryCode;
                if (isShifted && character >= 'a' && character <= 'z') {
                    character = Character.toUpperCase(character);
                }
                inputConnection.commitText(String.valueOf(character), 1);
                break;
        }
    }

    @Override
    public void onPress(int primaryCode) {
        // Add haptic feedback on key press
        if (themeManager.isHapticFeedbackEnabled()) {
            performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
        }
    }

    @Override
    public void onRelease(int primaryCode) {
        // Key released
    }

    @Override
    public void swipeLeft() {
        // Switch to symbols keyboard
        isSymbolsMode = !isSymbolsMode;
        if (customKeyboardView != null) {
            customKeyboardView.setSymbolsMode(isSymbolsMode);
            customKeyboardView.invalidate();
        }
    }

    @Override
    public void swipeRight() {
        // Switch back to letters keyboard
        isSymbolsMode = false;
        if (customKeyboardView != null) {
            customKeyboardView.setSymbolsMode(false);
            customKeyboardView.invalidate();
        }
    }

    @Override
    public void swipeDown() {
        // Hide keyboard
        requestHideSelf(0);
    }

    @Override
    public void swipeUp() {
        // Could show additional options
    }
}
