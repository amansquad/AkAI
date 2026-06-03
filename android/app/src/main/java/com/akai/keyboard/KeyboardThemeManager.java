package com.akai.keyboard;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;

public class KeyboardThemeManager {
    private static final String PREFS_NAME = "AkaiKeyboardPrefs";
    private static final String KEY_ACCENT_COLOR = "accent_color";
    private static final String KEY_BACKGROUND_COLOR = "background_color";
    private static final String KEY_KEY_COLOR = "key_color";
    private static final String KEY_TEXT_COLOR = "text_color";
    private static final String KEY_SPECIAL_KEY_COLOR = "special_key_color";
    private static final String KEY_HAPTIC_FEEDBACK = "haptic_feedback";
    private static final String KEY_SOUND_ENABLED = "sound_enabled";
    private static final String KEY_AUTO_CAPITALIZE = "auto_capitalize";

    // Default colors
    private static final int DEFAULT_ACCENT_COLOR = Color.parseColor("#0F3460");
    private static final int DEFAULT_BACKGROUND_COLOR = Color.parseColor("#1A1A2E");
    private static final int DEFAULT_KEY_COLOR = Color.parseColor("#16213E");
    private static final int DEFAULT_TEXT_COLOR = Color.parseColor("#EAEAEA");
    private static final int DEFAULT_SPECIAL_KEY_COLOR = Color.parseColor("#533483");

    // Preset themes
    public static final int THEME_DARK = 0;
    public static final int THEME_OCEAN = 1;
    public static final int THEME_FOREST = 2;
    public static final int THEME_SUNSET = 3;
    public static final int THEME_PURPLE = 4;

    private SharedPreferences prefs;
    private SharedPreferences.Editor editor;

    public KeyboardThemeManager(Context context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        editor = prefs.edit();
    }

    public int getAccentColor() {
        return prefs.getInt(KEY_ACCENT_COLOR, DEFAULT_ACCENT_COLOR);
    }

    public void setAccentColor(int color) {
        editor.putInt(KEY_ACCENT_COLOR, color);
        editor.apply();
    }

    public int getBackgroundColor() {
        return prefs.getInt(KEY_BACKGROUND_COLOR, DEFAULT_BACKGROUND_COLOR);
    }

    public void setBackgroundColor(int color) {
        editor.putInt(KEY_BACKGROUND_COLOR, color);
        editor.apply();
    }

    public int getKeyColor() {
        return prefs.getInt(KEY_KEY_COLOR, DEFAULT_KEY_COLOR);
    }

    public void setKeyColor(int color) {
        editor.putInt(KEY_KEY_COLOR, color);
        editor.apply();
    }

    public int getTextColor() {
        return prefs.getInt(KEY_TEXT_COLOR, DEFAULT_TEXT_COLOR);
    }

    public void setTextColor(int color) {
        editor.putInt(KEY_TEXT_COLOR, color);
        editor.apply();
    }

    public int getSpecialKeyColor() {
        return prefs.getInt(KEY_SPECIAL_KEY_COLOR, DEFAULT_SPECIAL_KEY_COLOR);
    }

    public void setSpecialKeyColor(int color) {
        editor.putInt(KEY_SPECIAL_KEY_COLOR, color);
        editor.apply();
    }

    public boolean isHapticFeedbackEnabled() {
        return prefs.getBoolean(KEY_HAPTIC_FEEDBACK, true);
    }

    public void setHapticFeedbackEnabled(boolean enabled) {
        editor.putBoolean(KEY_HAPTIC_FEEDBACK, enabled);
        editor.apply();
    }

    public boolean isSoundEnabled() {
        return prefs.getBoolean(KEY_SOUND_ENABLED, false);
    }

    public void setSoundEnabled(boolean enabled) {
        editor.putBoolean(KEY_SOUND_ENABLED, enabled);
        editor.apply();
    }

    public boolean isAutoCapitalizeEnabled() {
        return prefs.getBoolean(KEY_AUTO_CAPITALIZE, true);
    }

    public void setAutoCapitalizeEnabled(boolean enabled) {
        editor.putBoolean(KEY_AUTO_CAPITALIZE, enabled);
        editor.apply();
    }

    public void applyTheme(int themeId) {
        switch (themeId) {
            case THEME_DARK:
                setDarkTheme();
                break;
            case THEME_OCEAN:
                setOceanTheme();
                break;
            case THEME_FOREST:
                setForestTheme();
                break;
            case THEME_SUNSET:
                setSunsetTheme();
                break;
            case THEME_PURPLE:
                setPurpleTheme();
                break;
        }
    }

    private void setDarkTheme() {
        setAccentColor(Color.parseColor("#0F3460"));
        setBackgroundColor(Color.parseColor("#1A1A2E"));
        setKeyColor(Color.parseColor("#16213E"));
        setTextColor(Color.parseColor("#EAEAEA"));
        setSpecialKeyColor(Color.parseColor("#533483"));
    }

    private void setOceanTheme() {
        setAccentColor(Color.parseColor("#006994"));
        setBackgroundColor(Color.parseColor("#001F3F"));
        setKeyColor(Color.parseColor("#003366"));
        setTextColor(Color.parseColor("#E0F7FA"));
        setSpecialKeyColor(Color.parseColor("#004C8C"));
    }

    private void setForestTheme() {
        setAccentColor(Color.parseColor("#2E7D32"));
        setBackgroundColor(Color.parseColor("#1B5E20"));
        setKeyColor(Color.parseColor("#388E3C"));
        setTextColor(Color.parseColor("#E8F5E9"));
        setSpecialKeyColor(Color.parseColor("#4CAF50"));
    }

    private void setSunsetTheme() {
        setAccentColor(Color.parseColor("#FF5722"));
        setBackgroundColor(Color.parseColor("#BF360C"));
        setKeyColor(Color.parseColor("#E64A19"));
        setTextColor(Color.parseColor("#FBE9E7"));
        setSpecialKeyColor(Color.parseColor("#FF7043"));
    }

    private void setPurpleTheme() {
        setAccentColor(Color.parseColor("#7B1FA2"));
        setBackgroundColor(Color.parseColor("#4A148C"));
        setKeyColor(Color.parseColor("#6A1B9A"));
        setTextColor(Color.parseColor("#F3E5F5"));
        setSpecialKeyColor(Color.parseColor("#9C27B0"));
    }

    public void resetToDefault() {
        editor.clear();
        editor.apply();
    }
}
