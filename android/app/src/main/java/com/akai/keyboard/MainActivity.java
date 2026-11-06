package com.akai.keyboard;

import android.app.Activity;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.view.inputmethod.InputMethodInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.List;

/**
 * Setup flow for enabling AkAI Keyboard. Shows one step at a time based on
 * actual system state (not enabled -> enabled but not default -> ready).
 *
 * The look follows the website: an ultramarine airmail ground, a red/white/
 * blue chevron border, and English and Amharic as two equal perforated
 * stamps. Everything is drawn in code so there are no extra resources.
 */
public class MainActivity extends Activity {

    // The website's inks, as sRGB.
    private static final int GROUND = Color.parseColor("#1B2178");
    private static final int GROUND_DEEP = Color.parseColor("#11164F");
    private static final int PAPER = Color.parseColor("#F7F2E4");
    private static final int INK = Color.parseColor("#141A47");
    private static final int INK_DIM = Color.parseColor("#4A5088");
    private static final int ON_GROUND_DIM = Color.parseColor("#B9BEE6");
    private static final int YELLOW = Color.parseColor("#FFD84A");
    private static final int GREEN = Color.parseColor("#1F8A4C");
    private static final int RED = Color.parseColor("#D9412F");
    private static final int BLUE = Color.parseColor("#2F3CB8");

    private LinearLayout content;

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

    private int dp(float v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private void render() {
        boolean enabled = isEnabled();
        boolean isDefault = isDefault();
        int step = !enabled ? 0 : !isDefault ? 1 : 2;

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(GROUND);
        scroll.setFillViewport(true);
        scroll.setOverScrollMode(View.OVER_SCROLL_NEVER);

        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER_HORIZONTAL);
        content.setPadding(dp(20), dp(12), dp(20), dp(28));
        scroll.addView(content, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        // Targeting a recent SDK draws the app edge to edge, so keep the
        // content clear of the status and navigation bars.
        scroll.setOnApplyWindowInsetsListener((v, insets) -> {
            content.setPadding(dp(20), insets.getSystemWindowInsetTop() + dp(12),
                    dp(20), insets.getSystemWindowInsetBottom() + dp(28));
            return insets;
        });

        addChevronBorder();
        addStamps();
        addTitle();
        addProgress(step);

        if (step == 0) {
            renderEnableStep();
        } else if (step == 1) {
            renderActivateStep();
        } else {
            renderReadyStep();
        }

        addFooter();
        setContentView(scroll);
    }

    // ── Pieces ──────────────────────────────────────────────────────────

    /** The red / white / blue airmail stripe along the top. */
    private void addChevronBorder() {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(12));
        lp.setMargins(0, 0, 0, dp(28));
        content.addView(new ChevronBand(this), lp);
    }

    /** English and Amharic as two equal stamps, slightly tilted. */
    private void addStamps() {
        FrameLayout pair = new FrameLayout(this);
        pair.setClipChildren(false);

        StampView en = new StampView(this, GREEN, "Aa", "ENGLISH", false);
        StampView am = new StampView(this, RED, "አማ", "አማርኛ", true);
        en.setRotation(-5);
        am.setRotation(4);

        FrameLayout.LayoutParams enLp = new FrameLayout.LayoutParams(dp(118), dp(150));
        enLp.gravity = Gravity.CENTER_HORIZONTAL;
        enLp.leftMargin = -dp(80);
        FrameLayout.LayoutParams amLp = new FrameLayout.LayoutParams(dp(118), dp(150));
        amLp.gravity = Gravity.CENTER_HORIZONTAL;
        amLp.leftMargin = dp(60);
        amLp.topMargin = dp(10);
        pair.addView(en, enLp);
        pair.addView(am, amLp);

        content.addView(pair, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(176)));
    }

    private void addTitle() {
        TextView title = new TextView(this);
        title.setText("AkAI");
        title.setTextSize(52);
        title.setTypeface(AkaiFonts.display(this));
        title.setTextColor(PAPER);
        title.setLetterSpacing(-0.02f);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(18), 0, 0);
        content.addView(title);

        TextView sub = label("THE KEYBOARD FOR TWO SCRIPTS", YELLOW);
        sub.setGravity(Gravity.CENTER);
        sub.setPadding(0, dp(2), 0, dp(24));
        content.addView(sub);
    }

    /** Three bars: finished and current steps are yellow. */
    private void addProgress(int step) {
        LinearLayout bars = new LinearLayout(this);
        bars.setOrientation(LinearLayout.HORIZONTAL);
        for (int i = 0; i < 3; i++) {
            View bar = new View(this);
            bar.setBackground(rect(i <= step ? YELLOW : GROUND_DEEP, 2));
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(5), 1f);
            if (i > 0) lp.leftMargin = dp(6);
            bars.addView(bar, lp);
        }
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 0, 0, dp(18));
        content.addView(bars, lp);
    }

    private void addFooter() {
        TextView foot = label("ሰላም  ·  A LETTER HOME, TYPED IN TWO SCRIPTS", ON_GROUND_DIM);
        foot.setGravity(Gravity.CENTER);
        foot.setPadding(0, dp(24), 0, 0);
        content.addView(foot);
    }

    // ── Steps ───────────────────────────────────────────────────────────

    /** Step 1: explain the benefit, then let the user add AkAI to the system's keyboard list. */
    private void renderEnableStep() {
        LinearLayout panel = panel();
        panelHeading(panel, "Add AkAI to your keyboards");
        panelBody(panel, "Android asks you to allow a new keyboard before any app can use it. " +
                "Open your keyboard list and switch AkAI on.");
        panelPoint(panel, "Full Ge'ez fidel and QWERTY in one keyboard");
        panelPoint(panel, "Private by design: nothing you type leaves your phone");
        panelButton(panel, "Add AkAI Keyboard", true, () ->
                startActivity(new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)));
    }

    /** Step 2: keyboard is enabled but not the active default yet. */
    private void renderActivateStep() {
        LinearLayout panel = panel();
        panelHeading(panel, "Switch to AkAI");
        panelBody(panel, "AkAI is switched on. One more tap: choose it from the picker so it is " +
                "the keyboard that opens when you type.");
        panelButton(panel, "Switch to AkAI Keyboard", true, this::showPicker);
        panelButton(panel, "Keyboard settings", false, this::openSettings);
    }

    /** Step 3: fully set up. */
    private void renderReadyStep() {
        LinearLayout panel = panel();
        panelHeading(panel, "You're ready to type");
        panelBody(panel, "AkAI is your active keyboard. Open any app and write in Amharic or English. " +
                "Tap the globe key to switch between them.");
        panelButton(panel, "Test the keyboard", true, this::showPicker);
        panelButton(panel, "Keyboard settings", false, this::openSettings);
    }

    private void showPicker() {
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        if (imm != null) imm.showInputMethodPicker();
    }

    private void openSettings() {
        startActivity(new Intent(this, KeyboardSettingsActivity.class));
    }

    // ── Building blocks ─────────────────────────────────────────────────

    private GradientDrawable rect(int color, float radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radiusDp));
        return d;
    }

    private TextView label(String text, int color) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(11);
        t.setTextColor(color);
        t.setTypeface(Typeface.MONOSPACE);
        t.setLetterSpacing(0.14f);
        return t;
    }

    /** A sheet of stamp paper holding the current step. */
    private LinearLayout panel() {
        LinearLayout p = new LinearLayout(this);
        p.setOrientation(LinearLayout.VERTICAL);
        p.setBackground(rect(PAPER, 4));
        p.setPadding(dp(20), dp(20), dp(20), dp(20));
        p.setElevation(dp(6));
        content.addView(p, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        return p;
    }

    private void panelHeading(LinearLayout panel, String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(24);
        t.setTypeface(AkaiFonts.display(this));
        t.setTextColor(INK);
        t.setPadding(0, 0, 0, dp(8));
        panel.addView(t);
    }

    private void panelBody(LinearLayout panel, String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(15);
        t.setTextColor(INK_DIM);
        t.setLineSpacing(0, 1.2f);
        t.setPadding(0, 0, 0, dp(14));
        panel.addView(t);
    }

    private void panelPoint(LinearLayout panel, String text) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(0, 0, 0, dp(8));

        View tick = new View(this) {
            private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
            private final Path path = new Path();

            @Override
            protected void onDraw(Canvas c) {
                float w = getWidth();
                float h = getHeight();
                p.setStyle(Paint.Style.STROKE);
                p.setStrokeCap(Paint.Cap.ROUND);
                p.setStrokeJoin(Paint.Join.ROUND);
                p.setStrokeWidth(dp(2.2f));
                p.setColor(GREEN);
                path.reset();
                path.moveTo(w * 0.16f, h * 0.54f);
                path.lineTo(w * 0.42f, h * 0.78f);
                path.lineTo(w * 0.84f, h * 0.26f);
                c.drawPath(path, p);
            }
        };
        LinearLayout.LayoutParams tickLp = new LinearLayout.LayoutParams(dp(20), dp(20));
        tickLp.setMargins(0, dp(1), dp(10), 0);
        row.addView(tick, tickLp);

        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(14);
        t.setTextColor(INK);
        row.addView(t, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        panel.addView(row);
    }

    private interface Action {
        void run();
    }

    /** Yellow primary button, or a quiet outlined one for secondary actions. */
    private void panelButton(LinearLayout panel, String text, boolean primary, Action onClick) {
        Button b = new Button(this);
        b.setText(text);
        b.setAllCaps(false);
        b.setTextSize(16);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setTextColor(INK);
        b.setStateListAnimator(null);

        GradientDrawable bg = rect(primary ? YELLOW : Color.TRANSPARENT, 4);
        if (!primary) bg.setStroke(dp(2), INK);
        b.setBackground(new RippleDrawable(ColorStateList.valueOf(Color.parseColor("#22141A47")), bg, null));
        b.setOnClickListener((View v) -> onClick.run());

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(56));
        lp.topMargin = dp(primary ? 6 : 10);
        panel.addView(b, lp);
    }

    /** A perforated postage stamp: cream paper, a coloured print field, a big glyph. */
    private static final class StampView extends View {
        private final int field;
        private final String glyph;
        private final String caption;
        private final boolean geez;
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        StampView(Activity a, int field, String glyph, String caption, boolean geez) {
            super(a);
            this.field = field;
            this.glyph = glyph;
            this.caption = caption;
            this.geez = geez;
            float d = a.getResources().getDisplayMetrics().density;
            setElevation(8 * d);
            setOutlineProvider(ViewOutlineProvider.BOUNDS);
        }

        @Override
        protected void onDraw(Canvas c) {
            float d = getResources().getDisplayMetrics().density;
            float w = getWidth();
            float h = getHeight();

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(PAPER);
            c.drawRect(0, 0, w, h, paint);

            // Perforations: holes cut out of the paper along every edge. The
            // sheet behind is the same ultramarine as the page.
            paint.setColor(GROUND);
            float r = 3.5f * d;
            float step = 11f * d;
            for (float x = step / 2; x < w; x += step) {
                c.drawCircle(x, 0, r, paint);
                c.drawCircle(x, h, r, paint);
            }
            for (float y = step / 2; y < h; y += step) {
                c.drawCircle(0, y, r, paint);
                c.drawCircle(w, y, r, paint);
            }

            // Print field.
            float m = 14 * d;
            paint.setColor(field);
            c.drawRect(m, m, w - m, h - m - 20 * d, paint);

            // Glyph.
            paint.setColor(Color.WHITE);
            paint.setTextAlign(Paint.Align.CENTER);
            paint.setTypeface(geez ? Typeface.create(Typeface.SERIF, Typeface.BOLD)
                    : AkaiFonts.display(getContext()));
            paint.setTextSize(46 * d);
            float cy = (m + (h - m - 20 * d)) / 2f;
            c.drawText(glyph, w / 2f, cy + 16 * d, paint);

            // Caption on the paper.
            paint.setColor(INK);
            paint.setTypeface(geez ? Typeface.create(Typeface.SERIF, Typeface.BOLD) : Typeface.MONOSPACE);
            paint.setTextSize(10 * d);
            paint.setLetterSpacing(geez ? 0f : 0.14f);
            c.drawText(caption, w / 2f, h - m + 1 * d, paint);
            paint.setLetterSpacing(0f);
        }
    }
}
