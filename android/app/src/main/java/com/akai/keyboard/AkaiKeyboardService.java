package com.akai.keyboard;

import android.content.Context;
import android.content.Intent;
import android.inputmethodservice.InputMethodService;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.os.Handler;
import android.text.InputType;
import android.os.Looper;
import android.util.Log;
import android.view.HapticFeedbackConstants;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.FrameLayout;

/**
 * Hosts the real AkAI keyboard UI (the same React app at /keyboard-ime, built
 * via `npm run build:android` and bundled into assets/public by
 * `npx cap sync android`) inside a WebView, instead of a separate native
 * renderer. The WebView is created once and kept alive across IME sessions
 * (a "hot start") rather than reloaded every time the input view reappears.
 */
public class AkaiKeyboardService extends InputMethodService {

    private static final String TAG = "AkaiKeyboardService";

    /** Starting height, in dp, until the page reports its own. */
    private static final int DEFAULT_HEIGHT_DP = 350;
    private static final int MIN_HEIGHT_DP = 180;
    private static final int MAX_HEIGHT_DP = 900;
    /** The keyboard never takes more than this share of the screen, however tall the user sets it. */
    private static final float MAX_SCREEN_SHARE = 0.7f;

    private FrameLayout container;
    private WebView webView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public View onCreateInputView() {
        Log.d(TAG, "onCreateInputView");
        // targetSdk 36 enforces edge-to-edge by default, which clips this
        // window's frame to a tiny fallback height unless it explicitly
        // opts out and manages its own insets.
        if (getWindow() != null && getWindow().getWindow() != null) {
            androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow().getWindow(), true);
        }
        if (container == null) {
            container = createContainer();
        }
        ViewGroup parent = (ViewGroup) container.getParent();
        if (parent != null) {
            parent.removeView(container);
        }
        return container;
    }

    private FrameLayout createContainer() {
        FrameLayout layout = (FrameLayout) getLayoutInflater().inflate(R.layout.ime_container, null);

        // The height has to live on the *child*, not the container:
        // InputMethodService.setInputView() re-adds whatever onCreateInputView()
        // returns with its own MATCH_PARENT x WRAP_CONTENT LayoutParams,
        // discarding ours. So the container always measures WRAP_CONTENT and
        // the keyboard's real height comes from this fixed child height.
        // Only the starting height, used until the page measures itself and
        // calls setHeight() below. From then on the input view tracks the
        // keyboard's real height, so no layout leaves dead space under the
        // keys and none has its bottom row clipped.
        int heightPx = (int) (DEFAULT_HEIGHT_DP * getResources().getDisplayMetrics().density);

        WebView wv = AkaiWebAppView.create(this, "/keyboard-ime.html", new AkaiKeyboardBridge(), "AkaiKeyboard");
        wv.setLayoutParams(new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, heightPx));
        webView = wv;

        layout.addView(wv);

        // Lift the keyboard clear of the system navigation bar. The IME window
        // extends to the bottom of the screen, so without this the navigation
        // bar's hide-keyboard arrow and IME-switcher globe sit on top of the
        // keyboard's own bottom row. Padding on the container (which measures
        // wrap_content) adds to the window height rather than shrinking the
        // keyboard, so the layout above is unaffected.
        layout.setPadding(0, 0, 0, navigationBarHeightPx());

        return layout;
    }

    /**
     * The current navigation bar height, which differs between gesture
     * navigation (a slim pill) and three-button navigation. Falls back to a
     * gesture-sized gap if the platform resource is unavailable.
     */
    private int navigationBarHeightPx() {
        float density = getResources().getDisplayMetrics().density;
        int resId = getResources().getIdentifier("navigation_bar_height", "dimen", "android");
        int px = resId > 0 ? getResources().getDimensionPixelSize(resId) : 0;
        return Math.max(px, (int) (24 * density));
    }

    /**
     * The WebView is created once and kept alive across IME sessions, so
     * between sessions it is a live page that nothing is showing. Chromium
     * stops delivering animation frames to a page it is not drawing, and a
     * paused WebView that is never resumed leaves the live-theme wallpaper
     * frozen on its last frame. Pausing and resuming it explicitly keeps the
     * page's idea of whether it is visible in step with reality.
     */
    @Override
    public void onWindowShown() {
        super.onWindowShown();
        if (webView != null) {
            webView.onResume();
        }
    }

    /**
     * Settings are saved from the settings screen, a different WebView from
     * this one. The keyboard only reads them when its page loads, so when the
     * settings screen has been used, reload the page to pick the changes up.
     */
    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        inputKind = classifyInput(info);
        if (KeyboardSettingsActivity.settingsTouched && webView != null) {
            KeyboardSettingsActivity.settingsTouched = false;
            // The reloaded page asks for the kind itself once it has mounted.
            webView.reload();
        } else {
            publishInputKind();
        }
    }

    /** What the focused field wants: text, number, phone, datetime, email, url, password or none. */
    private volatile String inputKind = "text";

    private static String classifyInput(EditorInfo info) {
        if (info == null) return "text";
        int type = info.inputType;
        switch (type & InputType.TYPE_MASK_CLASS) {
            case InputType.TYPE_CLASS_NUMBER:
                // A numeric password (a PIN) is still just digits.
                return "number";
            case InputType.TYPE_CLASS_PHONE:
                return "phone";
            case InputType.TYPE_CLASS_DATETIME:
                return "datetime";
            case InputType.TYPE_CLASS_TEXT: {
                int variation = type & InputType.TYPE_MASK_VARIATION;
                if (variation == InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
                        || variation == InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS) return "email";
                if (variation == InputType.TYPE_TEXT_VARIATION_URI) return "url";
                if (variation == InputType.TYPE_TEXT_VARIATION_PASSWORD
                        || variation == InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD
                        || variation == InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD) return "password";
                return "text";
            }
            default:
                return type == InputType.TYPE_NULL ? "none" : "text";
        }
    }

    /** Tells the keyboard page which kind of field just got focus. */
    private void publishInputKind() {
        if (webView == null) return;
        final String kind = inputKind;
        webView.evaluateJavascript(
                "window.__akaiInputKind='" + kind + "';"
                + "window.dispatchEvent(new CustomEvent('akai-input-kind',{detail:'" + kind + "'}));",
                null);
    }

    @Override
    public void onWindowHidden() {
        super.onWindowHidden();
        if (webView != null) {
            webView.onPause();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
    }

    /** Vibration length and amplitude per strength level. Index 0 is unused. */
    private static final long[] HAPTIC_MS = {0, 8, 12, 18, 26, 36};
    private static final int[] HAPTIC_AMPLITUDE = {0, 40, 80, 130, 190, 255};

    private Vibrator vibrator;

    private Vibrator vibrator() {
        if (vibrator == null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager manager = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                if (manager != null) vibrator = manager.getDefaultVibrator();
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }
        }
        return vibrator;
    }

    private void vibrate(int level) {
        int l = Math.max(1, Math.min(5, level));
        Vibrator v = vibrator();
        if (v == null || !v.hasVibrator()) {
            // No motor: fall back to the system's own key-tap feedback.
            if (webView != null) webView.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Strength comes from amplitude where the motor supports it, and
            // from length everywhere, so the levels still differ on phones
            // that can only switch the motor on and off.
            int amplitude = v.hasAmplitudeControl() ? HAPTIC_AMPLITUDE[l] : VibrationEffect.DEFAULT_AMPLITUDE;
            v.vibrate(VibrationEffect.createOneShot(HAPTIC_MS[l], amplitude));
        } else {
            v.vibrate(HAPTIC_MS[l]);
        }
    }

    /**
     * Exposed to the WebView as `window.AkaiKeyboard`. Methods arrive on a
     * background (Binder) thread, so hop back to the main thread before
     * touching the InputConnection.
     */
    private class AkaiKeyboardBridge {

        @JavascriptInterface
        public void commitText(final String text) {
            mainHandler.post(() -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null && text != null) {
                    ic.commitText(text, 1);
                }
            });
        }

        @JavascriptInterface
        public void deleteSurroundingText(final int count) {
            mainHandler.post(() -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null && count > 0) {
                    ic.deleteSurroundingText(count, 0);
                }
            });
        }

        @JavascriptInterface
        public void performEnter() {
            mainHandler.post(() -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic == null) return;
                ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER));
                ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER));
            });
        }

        @JavascriptInterface
        public void performSpace() {
            mainHandler.post(() -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null) {
                    ic.commitText(" ", 1);
                }
            });
        }

        /** The kind of field the keyboard is typing into; read by the page when it loads. */
        @JavascriptInterface
        public String getInputKind() {
            return inputKind;
        }

        /** Opens the app's settings screen and tucks the keyboard away. */
        @JavascriptInterface
        public void openSettings() {
            mainHandler.post(() -> {
                Intent intent = new Intent(AkaiKeyboardService.this, KeyboardSettingsActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                requestHideSelf(0);
            });
        }

        /** Moves the host app's caret. dir is left, right, up or down. */
        @JavascriptInterface
        public void moveCursor(final String dir) {
            final int code;
            if ("left".equals(dir)) code = KeyEvent.KEYCODE_DPAD_LEFT;
            else if ("right".equals(dir)) code = KeyEvent.KEYCODE_DPAD_RIGHT;
            else if ("up".equals(dir)) code = KeyEvent.KEYCODE_DPAD_UP;
            else if ("down".equals(dir)) code = KeyEvent.KEYCODE_DPAD_DOWN;
            else return;
            mainHandler.post(() -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic == null) return;
                ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, code));
                ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, code));
            });
        }

        /**
         * Called by the page whenever its measured height changes, in CSS
         * pixels (which map 1:1 to dp at the WebView's default scale).
         */
        @JavascriptInterface
        public void setHeight(final int cssPx) {
            mainHandler.post(() -> {
                if (webView == null) return;
                float density = getResources().getDisplayMetrics().density;
                int px = Math.round(cssPx * density);
                int maxPx = Math.min((int) (MAX_HEIGHT_DP * density),
                        (int) (getResources().getDisplayMetrics().heightPixels * MAX_SCREEN_SHARE));
                px = Math.max((int) (MIN_HEIGHT_DP * density), Math.min(maxPx, px));
                ViewGroup.LayoutParams lp = webView.getLayoutParams();
                // Ignore sub-pixel churn; only a real change is worth a relayout.
                if (lp != null && Math.abs(lp.height - px) >= 4) {
                    Log.d(TAG, "setHeight " + cssPx + "css -> " + px + "px (was " + lp.height + ")");
                    lp.height = px;
                    webView.setLayoutParams(lp);
                    webView.requestLayout();
                    if (container != null) {
                        container.requestLayout();
                    }
                    // The framework sizes the input window from the view
                    // hierarchy it last measured, so nudge it to measure again.
                    updateInputViewShown();
                }
            });
        }

        /** Kept for pages that call it without a strength. */
        @JavascriptInterface
        public void playHaptic() {
            playHaptic(3);
        }

        /**
         * One key-press vibration at a strength from 1 (barely there) to 5.
         * The page's own navigator.vibrate cannot do this: the WebView has no
         * vibrate permission of its own, so before this existed key-press
         * vibration silently did nothing.
         */
        @JavascriptInterface
        public void playHaptic(final int level) {
            mainHandler.post(() -> vibrate(level));
        }
    }
}
