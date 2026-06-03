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
import android.widget.TextView;

public class MainActivity extends Activity {

    private Button enableButton;
    private Button settingsButton;
    private Button testButton;
    private TextView statusText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initUI();
    }

    private void initUI() {
        LinearLayout mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setGravity(Gravity.CENTER);
        mainLayout.setPadding(48, 48, 48, 48);
        mainLayout.setBackgroundColor(Color.parseColor("#1A1A2E"));

        // App Logo/Title
        TextView logo = new TextView(this);
        logo.setText("⌨️");
        logo.setTextSize(72);
        logo.setGravity(Gravity.CENTER);
        mainLayout.addView(logo);

        TextView title = new TextView(this);
        title.setText("Akai Keyboard");
        title.setTextSize(32);
        title.setTextColor(Color.parseColor("#EAEAEA"));
        title.setTypeface(null, Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, 16, 0, 8);
        mainLayout.addView(title);

        TextView subtitle = new TextView(this);
        subtitle.setText("A beautiful and modern keyboard");
        subtitle.setTextSize(16);
        subtitle.setTextColor(Color.parseColor("#AAAAAA"));
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, 0, 0, 48);
        mainLayout.addView(subtitle);

        // Status
        statusText = new TextView(this);
        statusText.setText("Checking keyboard status...");
        statusText.setTextSize(16);
        statusText.setTextColor(Color.parseColor("#EAEAEA"));
        statusText.setGravity(Gravity.CENTER);
        statusText.setPadding(0, 0, 0, 32);
        mainLayout.addView(statusText);

        // Enable Button
        enableButton = createButton("Enable Akai Keyboard");
        enableButton.setOnClickListener(v -> {
            Intent intent = new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS);
            startActivity(intent);
        });
        mainLayout.addView(enableButton);

        // Settings Button
        settingsButton = createButton("Keyboard Settings");
        settingsButton.setOnClickListener(v -> {
            Intent intent = new Intent(this, KeyboardSettingsActivity.class);
            startActivity(intent);
        });
        mainLayout.addView(settingsButton);

        // Test Button
        testButton = createButton("Test Keyboard");
        testButton.setOnClickListener(v -> {
            android.view.inputmethod.InputMethodManager imm =
                    (android.view.inputmethod.InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
            if (imm != null) {
                imm.showInputMethodPicker();
            }
        });
        mainLayout.addView(testButton);

        // Instructions
        TextView instructions = new TextView(this);
        instructions.setText("1. Tap 'Enable Akai Keyboard' to enable the keyboard\n" +
                "2. Go to Settings > System > Language & Input\n" +
                "3. Select 'Akai Keyboard' as your default keyboard\n" +
                "4. Tap 'Test Keyboard' to try it out!");
        instructions.setTextSize(14);
        instructions.setTextColor(Color.parseColor("#888888"));
        instructions.setGravity(Gravity.CENTER);
        instructions.setPadding(0, 48, 0, 0);
        mainLayout.addView(instructions);

        setContentView(mainLayout);
    }

    private Button createButton(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextSize(18);
        button.setBackgroundColor(Color.parseColor("#533483"));
        button.setTextColor(Color.WHITE);
        button.setPadding(48, 24, 48, 24);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, 16, 0, 16);
        button.setLayoutParams(params);

        return button;
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
            statusText.setText("✅ Akai Keyboard is enabled and ready!");
            statusText.setTextColor(Color.parseColor("#4CAF50"));
            enableButton.setText("Keyboard Enabled");
            enableButton.setBackgroundColor(Color.parseColor("#0F3460"));
        } else {
            statusText.setText("⚠️ Akai Keyboard is not enabled");
            statusText.setTextColor(Color.parseColor("#F44336"));
            enableButton.setText("Enable Akai Keyboard");
            enableButton.setBackgroundColor(Color.parseColor("#533483"));
        }
    }
}
