package com.akai.keyboard;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

public class KeyboardSettingsActivity extends Activity {

    private LinearLayout mainLayout;
    private Switch hapticSwitch;
    private Switch soundSwitch;
    private Switch autoCapitalizeSwitch;
    private Button enableKeyboardButton;
    private Button selectKeyboardButton;
    private KeyboardThemeManager themeManager;
    private LinearLayout themePreviewLayout;

    // Theme color buttons
    private Button darkThemeBtn;
    private Button oceanThemeBtn;
    private Button forestThemeBtn;
    private Button sunsetThemeBtn;
    private Button purpleThemeBtn;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        themeManager = new KeyboardThemeManager(this);
        initUI();
    }

    private void initUI() {
        // Create scroll view
        ScrollView scrollView = new ScrollView(this);
        
        mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setPadding(32, 32, 32, 32);
        mainLayout.setBackgroundColor(Color.parseColor("#1A1A2E"));

        // Title
        TextView title = createTitle("Akai Keyboard Settings");
        mainLayout.addView(title);

        // Status section
        TextView statusLabel = createLabel("Keyboard Status");
        mainLayout.addView(statusLabel);

        TextView statusText = createStatusText();
        mainLayout.addView(statusText);

        // Enable Keyboard Button
        enableKeyboardButton = createButton("Enable Akai Keyboard");
        enableKeyboardButton.setOnClickListener(v -> {
            Intent intent = new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS);
            startActivity(intent);
        });
        mainLayout.addView(enableKeyboardButton);

        // Select Keyboard Button
        selectKeyboardButton = createButton("Select Akai Keyboard");
        selectKeyboardButton.setOnClickListener(v -> {
            android.view.inputmethod.InputMethodManager imm =
                    (android.view.inputmethod.InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
            if (imm != null) {
                imm.showInputMethodPicker();
            }
        });
        mainLayout.addView(selectKeyboardButton);

        // Settings switches
        TextView settingsLabel = createLabel("Keyboard Preferences");
        mainLayout.addView(settingsLabel);

        hapticSwitch = createSwitch("Haptic Feedback");
        hapticSwitch.setChecked(themeManager.isHapticFeedbackEnabled());
        hapticSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            themeManager.setHapticFeedbackEnabled(isChecked);
        });
        mainLayout.addView(hapticSwitch);

        soundSwitch = createSwitch("Key Sound");
        soundSwitch.setChecked(themeManager.isSoundEnabled());
        soundSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            themeManager.setSoundEnabled(isChecked);
        });
        mainLayout.addView(soundSwitch);

        autoCapitalizeSwitch = createSwitch("Auto Capitalize");
        autoCapitalizeSwitch.setChecked(themeManager.isAutoCapitalizeEnabled());
        autoCapitalizeSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            themeManager.setAutoCapitalizeEnabled(isChecked);
        });
        mainLayout.addView(autoCapitalizeSwitch);

        // Theme section
        TextView themeLabel = createLabel("Theme");
        mainLayout.addView(themeLabel);

        // Theme preview
        themePreviewLayout = createThemePreview();
        mainLayout.addView(themePreviewLayout);

        // Theme selection buttons
        TextView themeSelectionLabel = createLabel("Select Theme");
        mainLayout.addView(themeSelectionLabel);

        // Theme buttons in a grid
        LinearLayout themeButtonsLayout = new LinearLayout(this);
        themeButtonsLayout.setOrientation(LinearLayout.HORIZONTAL);
        themeButtonsLayout.setGravity(Gravity.CENTER);

        darkThemeBtn = createThemeButton("Dark", Color.parseColor("#1A1A2E"), KeyboardThemeManager.THEME_DARK);
        oceanThemeBtn = createThemeButton("Ocean", Color.parseColor("#001F3F"), KeyboardThemeManager.THEME_OCEAN);
        forestThemeBtn = createThemeButton("Forest", Color.parseColor("#1B5E20"), KeyboardThemeManager.THEME_FOREST);
        sunsetThemeBtn = createThemeButton("Sunset", Color.parseColor("#BF360C"), KeyboardThemeManager.THEME_SUNSET);
        purpleThemeBtn = createThemeButton("Purple", Color.parseColor("#4A148C"), KeyboardThemeManager.THEME_PURPLE);

        themeButtonsLayout.addView(darkThemeBtn);
        themeButtonsLayout.addView(oceanThemeBtn);
        themeButtonsLayout.addView(forestThemeBtn);
        themeButtonsLayout.addView(sunsetThemeBtn);
        themeButtonsLayout.addView(purpleThemeBtn);

        mainLayout.addView(themeButtonsLayout);

        // About section
        TextView aboutLabel = createLabel("About");
        mainLayout.addView(aboutLabel);

        TextView aboutText = createInfoText("Akai Keyboard v1.0\nA beautiful and modern keyboard app");
        mainLayout.addView(aboutText);

        scrollView.addView(mainLayout);
        setContentView(scrollView);
    }

    private TextView createTitle(String text) {
        TextView textView = new TextView(this);
        textView.setText(text);
        textView.setTextSize(28);
        textView.setTextColor(Color.parseColor("#EAEAEA"));
        textView.setTypeface(null, Typeface.BOLD);
        textView.setPadding(0, 0, 0, 32);
        return textView;
    }

    private TextView createLabel(String text) {
        TextView textView = new TextView(this);
        textView.setText(text);
        textView.setTextSize(20);
        textView.setTextColor(Color.parseColor("#0F3460"));
        textView.setTypeface(null, Typeface.BOLD);
        textView.setPadding(0, 32, 0, 16);
        return textView;
    }

    private TextView createStatusText() {
        TextView textView = new TextView(this);
        textView.setText("Akai Keyboard is ready to use");
        textView.setTextSize(16);
        textView.setTextColor(Color.parseColor("#EAEAEA"));
        textView.setPadding(0, 0, 0, 16);
        return textView;
    }

    private TextView createInfoText(String text) {
        TextView textView = new TextView(this);
        textView.setText(text);
        textView.setTextSize(16);
        textView.setTextColor(Color.parseColor("#AAAAAA"));
        textView.setPadding(0, 8, 0, 8);
        return textView;
    }

    private Button createButton(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextSize(16);
        button.setBackgroundColor(Color.parseColor("#533483"));
        button.setTextColor(Color.WHITE);
        button.setPadding(32, 16, 32, 16);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, 16, 0, 16);
        button.setLayoutParams(params);

        return button;
    }

    private Button createThemeButton(String name, int color, int themeId) {
        Button button = new Button(this);
        button.setText(name);
        button.setTextSize(14);
        button.setBackgroundColor(color);
        button.setTextColor(Color.WHITE);
        button.setPadding(16, 12, 16, 12);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1.0f);
        params.setMargins(4, 0, 4, 0);
        button.setLayoutParams(params);

        button.setOnClickListener(v -> {
            themeManager.applyTheme(themeId);
            updateThemePreview();
            Toast.makeText(this, name + " theme applied", Toast.LENGTH_SHORT).show();
        });

        return button;
    }

    private LinearLayout createThemePreview() {
        LinearLayout preview = new LinearLayout(this);
        preview.setOrientation(LinearLayout.VERTICAL);
        preview.setPadding(16, 16, 16, 16);
        preview.setBackgroundColor(themeManager.getBackgroundColor());

        // Preview title
        TextView previewTitle = new TextView(this);
        previewTitle.setText("Theme Preview");
        previewTitle.setTextSize(18);
        previewTitle.setTextColor(themeManager.getTextColor());
        previewTitle.setTypeface(null, Typeface.BOLD);
        preview.addView(previewTitle);

        // Preview keyboard row
        LinearLayout keyboardRow = new LinearLayout(this);
        keyboardRow.setOrientation(LinearLayout.HORIZONTAL);
        keyboardRow.setGravity(Gravity.CENTER);
        keyboardRow.setPadding(0, 16, 0, 0);

        // Sample keys
        for (int i = 0; i < 5; i++) {
            TextView key = new TextView(this);
            key.setText(String.valueOf((char)('A' + i)));
            key.setTextSize(16);
            key.setTextColor(themeManager.getTextColor());
            key.setBackgroundColor(themeManager.getKeyColor());
            key.setPadding(24, 16, 24, 16);
            key.setTypeface(null, Typeface.BOLD);
            
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT);
            params.setMargins(4, 0, 4, 0);
            key.setLayoutParams(params);
            
            keyboardRow.addView(key);
        }

        preview.addView(keyboardRow);

        return preview;
    }

    private void updateThemePreview() {
        if (themePreviewLayout != null) {
            themePreviewLayout.setBackgroundColor(themeManager.getBackgroundColor());
            // Update preview children
            for (int i = 0; i < themePreviewLayout.getChildCount(); i++) {
                View child = themePreviewLayout.getChildAt(i);
                if (child instanceof TextView) {
                    ((TextView) child).setTextColor(themeManager.getTextColor());
                } else if (child instanceof LinearLayout) {
                    LinearLayout row = (LinearLayout) child;
                    for (int j = 0; j < row.getChildCount(); j++) {
                        View keyChild = row.getChildAt(j);
                        if (keyChild instanceof TextView) {
                            ((TextView) keyChild).setTextColor(themeManager.getTextColor());
                            ((TextView) keyChild).setBackgroundColor(themeManager.getKeyColor());
                        }
                    }
                }
            }
        }
    }

    private Switch createSwitch(String text) {
        Switch switchView = new Switch(this);
        switchView.setText(text);
        switchView.setTextSize(16);
        switchView.setTextColor(Color.parseColor("#EAEAEA"));
        switchView.setPadding(0, 16, 0, 16);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        switchView.setLayoutParams(params);

        return switchView;
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateStatus();
    }

    private void updateStatus() {
        boolean isEnabled = Settings.Secure.getString(getContentResolver(),
                Settings.Secure.ENABLED_INPUT_METHODS) != null &&
                Settings.Secure.getString(getContentResolver(),
                        Settings.Secure.ENABLED_INPUT_METHODS).contains(getPackageName());

        if (isEnabled) {
            enableKeyboardButton.setText("Keyboard Enabled");
            enableKeyboardButton.setBackgroundColor(Color.parseColor("#0F3460"));
        } else {
            enableKeyboardButton.setText("Enable Akai Keyboard");
            enableKeyboardButton.setBackgroundColor(Color.parseColor("#533483"));
        }
    }
}
