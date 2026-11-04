package com.akai.keyboard;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.List;

/**
 * Setup flow for enabling AkAI Keyboard. Shows one step at a time based on
 * actual system state (not enabled -> enabled but not default -> ready),
 * each with benefit-focused copy explaining *why* the next tap is needed,
 * instead of dropping the user straight into a system settings dialog.
 */
public class MainActivity extends Activity {

    private LinearLayout rootLayout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        render();
    }

    @Override
    protected void onResume() {
        super.onResume();
        render();
    }

    /**
     * Settings.Secure.ENABLED_INPUT_METHODS is restricted on API 34+ (throws
     * SecurityException) — use InputMethodManager, the supported API for
     * this, instead.
     */
    private boolean isEnabled() {
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        if (imm == null) return false;
        List<InputMethodInfo> enabledImes = imm.getEnabledInputMethodList();
        for (InputMethodInfo info : enabledImes) {
            if (getPackageName().equals(info.getPackageName())) {
                return true;
            }
        }
        return false;
    }

    private boolean isDefault() {
        // DEFAULT_INPUT_METHOD isn't on the restricted-keys list, but read
        // defensively anyway so a future platform restriction degrades to
        // "show the activation step" instead of crashing the whole screen.
        try {
            String current = Settings.Secure.getString(getContentResolver(), Settings.Secure.DEFAULT_INPUT_METHOD);
            return current != null && current.startsWith(getPackageName());
        } catch (SecurityException e) {
            return false;
        }
    }

    private void render() {
        boolean enabled = isEnabled();
        boolean isDefault = isDefault();

        ScrollView scroll = new ScrollView(this);
        scroll.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        scroll.setBackgroundColor(Color.parseColor("#1A1A2E"));

        rootLayout = new LinearLayout(this);
        rootLayout.setOrientation(LinearLayout.VERTICAL);
        rootLayout.setGravity(Gravity.CENTER);
        rootLayout.setPadding(48, 64, 48, 64);
        scroll.addView(rootLayout);

        addLogo();
        addTitle();
        addProgressDots(enabled, isDefault);

        if (!enabled) {
            renderEnableStep();
        } else if (!isDefault) {
            renderActivateStep();
        } else {
            renderReadyStep();
        }

        setContentView(scroll);
    }

    private void addLogo() {
        TextView logo = new TextView(this);
        logo.setText("⌨️");
        logo.setTextSize(64);
        logo.setGravity(Gravity.CENTER);
        rootLayout.addView(logo);
    }

    private void addTitle() {
        TextView title = new TextView(this);
        title.setText("AkAI Keyboard");
        title.setTextSize(28);
        title.setTextColor(Color.parseColor("#EAEAEA"));
        title.setTypeface(null, Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, 16, 0, 32);
        rootLayout.addView(title);
    }

    /** Three dots showing which setup step the user is on. */
    private void addProgressDots(boolean enabled, boolean isDefault) {
        LinearLayout dots = new LinearLayout(this);
        dots.setOrientation(LinearLayout.HORIZONTAL);
        dots.setGravity(Gravity.CENTER);

        int step = !enabled ? 0 : !isDefault ? 1 : 2;
        for (int i = 0; i < 3; i++) {
            TextView dot = new TextView(this);
            dot.setText(i == step ? "●" : "○");
            dot.setTextSize(14);
            dot.setTextColor(i <= step ? Color.parseColor("#4CAF50") : Color.parseColor("#555566"));
            dot.setPadding(8, 0, 8, 0);
            dots.addView(dot);
        }
        dots.setPadding(0, 0, 0, 40);
        rootLayout.addView(dots);
    }

    /** Step 1: explain the benefit, then let the user add AkAI to the system's keyboard list. */
    private void renderEnableStep() {
        addBenefitCard(
                "Type Amharic & English natively",
                "Full Ge'ez script and QWERTY in one keyboard, with AI translation built in — " +
                        "no switching apps, no copy-pasting into a translator."
        );
        addBenefitCard(
                "Private by design",
                "Everything happens on your device. AkAI never logs your keystrokes or sends " +
                        "what you type anywhere."
        );

        addStepLabel("Step 1 of 2: Add AkAI to your keyboards");
        addBody("Android needs you to explicitly allow a new keyboard before any app can offer " +
                "it. Tap below to open your keyboard list, then switch AkAI Keyboard on.");

        addButton("Add AkAI Keyboard", () -> {
            Intent intent = new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS);
            startActivity(intent);
        });
    }

    /** Step 2: keyboard is enabled but not the active default yet. */
    private void renderActivateStep() {
        TextView check = new TextView(this);
        check.setText("✅ AkAI Keyboard is enabled");
        check.setTextSize(16);
        check.setTextColor(Color.parseColor("#4CAF50"));
        check.setGravity(Gravity.CENTER);
        check.setPadding(0, 0, 0, 24);
        rootLayout.addView(check);

        addStepLabel("Step 2 of 2: Switch to it");
        addBody("One more tap — pick AkAI Keyboard from the picker so it's the keyboard that " +
                "actually opens when you type.");

        addButton("Switch to AkAI Keyboard", () -> {
            android.view.inputmethod.InputMethodManager imm =
                    (android.view.inputmethod.InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
            if (imm != null) {
                imm.showInputMethodPicker();
            }
        });

        addSecondaryButton("Keyboard Settings", () -> {
            startActivity(new Intent(this, KeyboardSettingsActivity.class));
        });
    }

    /** Step 3: fully set up. */
    private void renderReadyStep() {
        TextView ready = new TextView(this);
        ready.setText("🎉 You're all set!");
        ready.setTextSize(20);
        ready.setTextColor(Color.parseColor("#4CAF50"));
        ready.setTypeface(null, Typeface.BOLD);
        ready.setGravity(Gravity.CENTER);
        ready.setPadding(0, 0, 0, 12);
        rootLayout.addView(ready);

        addBody("AkAI Keyboard is active. Open any app and start typing in Amharic or English.");

        addButton("Test the Keyboard", () -> {
            android.view.inputmethod.InputMethodManager imm =
                    (android.view.inputmethod.InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
            if (imm != null) {
                imm.showInputMethodPicker();
            }
        });

        addSecondaryButton("Keyboard Settings", () -> {
            startActivity(new Intent(this, KeyboardSettingsActivity.class));
        });
    }

    private void addStepLabel(String text) {
        TextView label = new TextView(this);
        label.setText(text);
        label.setTextSize(13);
        label.setTextColor(Color.parseColor("#8B8BA7"));
        label.setGravity(Gravity.CENTER);
        label.setPadding(0, 8, 0, 4);
        rootLayout.addView(label);
    }

    private void addBody(String text) {
        TextView body = new TextView(this);
        body.setText(text);
        body.setTextSize(15);
        body.setTextColor(Color.parseColor("#CCCCDD"));
        body.setGravity(Gravity.CENTER);
        body.setPadding(16, 0, 16, 24);
        rootLayout.addView(body);
    }

    /** A short card stating one concrete benefit — why the permission is worth granting. */
    private void addBenefitCard(String title, String body) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundColor(Color.parseColor("#232A4D"));
        card.setPadding(24, 20, 24, 20);
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        cardParams.setMargins(0, 0, 0, 16);
        card.setLayoutParams(cardParams);

        TextView titleView = new TextView(this);
        titleView.setText(title);
        titleView.setTextSize(15);
        titleView.setTypeface(null, Typeface.BOLD);
        titleView.setTextColor(Color.parseColor("#EAEAEA"));
        card.addView(titleView);

        TextView bodyView = new TextView(this);
        bodyView.setText(body);
        bodyView.setTextSize(13);
        bodyView.setTextColor(Color.parseColor("#AAAAC0"));
        bodyView.setPadding(0, 6, 0, 0);
        card.addView(bodyView);

        rootLayout.addView(card);
    }

    private interface Action {
        void run();
    }

    private void addButton(String text, Action onClick) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextSize(17);
        button.setBackgroundColor(Color.parseColor("#533483"));
        button.setTextColor(Color.WHITE);
        button.setPadding(48, 28, 48, 28);
        button.setOnClickListener((View v) -> onClick.run());

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, 8, 0, 8);
        button.setLayoutParams(params);

        rootLayout.addView(button);
    }

    private void addSecondaryButton(String text, Action onClick) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextSize(15);
        button.setBackgroundColor(Color.parseColor("#0F3460"));
        button.setTextColor(Color.parseColor("#CCCCDD"));
        button.setPadding(48, 20, 48, 20);
        button.setOnClickListener((View v) -> onClick.run());

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, 8, 0, 8);
        button.setLayoutParams(params);

        rootLayout.addView(button);
    }
}
