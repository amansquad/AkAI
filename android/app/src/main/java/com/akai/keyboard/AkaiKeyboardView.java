package com.akai.keyboard;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.util.AttributeSet;
import android.view.GestureDetector;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;

import java.util.ArrayList;
import java.util.List;

public class AkaiKeyboardView extends View {

    private Paint keyPaint;
    private Paint textPaint;
    private Paint specialPaint;
    private Paint shadowPaint;
    private Paint swipePaint;
    private Rect keyRect;
    private GestureDetector gestureDetector;
    private OnKeyListener keyListener;

    // Keyboard state
    private boolean isShifted = false;
    private boolean isSymbolsMode = false;
    private int keyboardType = 0; // 0: letters, 1: numbers/symbols, 2: emojis

    // Theme colors
    private int backgroundColor = Color.parseColor("#1A1A2E");
    private int keyBackgroundColor = Color.parseColor("#16213E");
    private int keyTextColor = Color.parseColor("#EAEAEA");
    private int accentColor = Color.parseColor("#0F3460");
    private int specialKeyColor = Color.parseColor("#533483");

    // Swipe typing
    private Path swipePath;
    private List<float[]> swipePoints;
    private boolean isSwiping = false;
    private float lastSwipeX, lastSwipeY;

    // Keyboard layouts
    private String[][] letterKeys = {
        {"Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"},
        {"A", "S", "D", "F", "G", "H", "J", "K", "L"},
        {"Z", "X", "C", "V", "B", "N", "M"}
    };

    private String[][] symbolKeys = {
        {"1", "2", "3", "4", "5", "6", "7", "8", "9", "0"},
        {"@", "#", "$", "%", "&", "*", "-", "+", "="},
        {".", ",", "!", "?", "'", "\"", ":", ";"}
    };

    private String[] bottomKeys = {" ", "\u232B", "\u21B5"}; // Space, Backspace, Enter

    public interface OnKeyListener {
        void onKey(int primaryCode, int[] keyCodes);
        void onPress(int primaryCode);
        void onRelease(int primaryCode);
        void swipeLeft();
        void swipeRight();
        void swipeDown();
        void swipeUp();
    }

    public AkaiKeyboardView(Context context) {
        super(context);
        init();
    }

    public AkaiKeyboardView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public AkaiKeyboardView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        keyPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        specialPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        shadowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        swipePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        keyRect = new Rect();
        swipePath = new Path();
        swipePoints = new ArrayList<>();

        textPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        textPaint.setTextAlign(Paint.Align.CENTER);

        swipePaint.setColor(accentColor);
        swipePaint.setStrokeWidth(8);
        swipePaint.setStyle(Paint.Style.STROKE);
        swipePaint.setStrokeCap(Paint.Cap.ROUND);
        swipePaint.setStrokeJoin(Paint.Join.ROUND);

        gestureDetector = new GestureDetector(getContext(), new GestureDetector.SimpleOnGestureListener() {
            @Override
            public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
                if (e1 == null || e2 == null) return false;
                float diffX = e2.getX() - e1.getX();
                float diffY = e2.getY() - e1.getY();

                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 100) {
                        if (keyListener != null) keyListener.swipeRight();
                    } else if (diffX < -100) {
                        if (keyListener != null) keyListener.swipeLeft();
                    }
                } else {
                    if (diffY > 100) {
                        if (keyListener != null) keyListener.swipeDown();
                    } else if (diffY < -100) {
                        if (keyListener != null) keyListener.swipeUp();
                    }
                }
                return true;
            }
        });
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        drawKeyboard(canvas);
        if (isSwiping && swipePoints.size() > 1) {
            drawSwipePath(canvas);
        }
    }

    private void drawKeyboard(Canvas canvas) {
        int width = getWidth();
        int height = getHeight();
        int keyWidth = width / 10;
        int keyHeight = height / 5;
        int padding = 4;

        // Draw background
        canvas.drawColor(backgroundColor);

        // Draw keys based on current mode
        String[][] keys = isSymbolsMode ? symbolKeys : letterKeys;

        for (int row = 0; row < keys.length; row++) {
            for (int col = 0; col < keys[row].length; col++) {
                int x = col * keyWidth + padding;
                int y = row * keyHeight + padding;
                int w = keyWidth - padding * 2;
                int h = keyHeight - padding * 2;

                keyRect.set(x, y, x + w, y + h);

                // Draw key shadow
                shadowPaint.setColor(Color.parseColor("#000000"));
                shadowPaint.setAlpha(50);
                canvas.drawRoundRect(new Rect(x + 2, y + 2, x + w + 2, y + h + 2), 12, 12, shadowPaint);

                // Draw key background
                keyPaint.setColor(keyBackgroundColor);
                canvas.drawRoundRect(keyRect, 12, 12, keyPaint);

                // Draw key text
                textPaint.setColor(keyTextColor);
                textPaint.setTextSize(36);
                float textY = y + h / 2 - (textPaint.descent() + textPaint.ascent()) / 2;

                String keyText = keys[row][col];
                if (isShifted && keyText.length() == 1 && Character.isLetter(keyText.charAt(0))) {
                    keyText = keyText.toUpperCase();
                }

                canvas.drawText(keyText, x + w / 2, textY, textPaint);
            }
        }

        // Draw bottom row (space, backspace, enter)
        drawBottomRow(canvas, width, height, keyWidth, keyHeight);
    }

    private void drawBottomRow(Canvas canvas, int width, int height, int keyWidth, int keyHeight) {
        int bottomY = 4 * keyHeight;
        int padding = 4;

        // Space key (wide)
        int spaceWidth = keyWidth * 6;
        keyRect.set(padding, bottomY + padding, spaceWidth - padding, bottomY + keyHeight - padding);
        keyPaint.setColor(keyBackgroundColor);
        canvas.drawRoundRect(keyRect, 12, 12, keyPaint);
        textPaint.setColor(keyTextColor);
        textPaint.setTextSize(36);
        float textY = bottomY + keyHeight / 2 - (textPaint.descent() + textPaint.ascent()) / 2;
        canvas.drawText(" ", spaceWidth / 2, textY, textPaint);

        // Backspace key
        int backX = spaceWidth + padding;
        keyRect.set(backX, bottomY + padding, backX + keyWidth * 2 - padding, bottomY + keyHeight - padding);
        specialPaint.setColor(specialKeyColor);
        canvas.drawRoundRect(keyRect, 12, 12, specialPaint);
        textPaint.setColor(keyTextColor);
        canvas.drawText("\u232B", backX + keyWidth, textY, textPaint);

        // Enter key
        int enterX = backX + keyWidth * 2;
        keyRect.set(enterX, bottomY + padding, enterX + keyWidth * 2 - padding, bottomY + keyHeight - padding);
        specialPaint.setColor(accentColor);
        canvas.drawRoundRect(keyRect, 12, 12, specialPaint);
        textPaint.setColor(keyTextColor);
        canvas.drawText("\u21B5", enterX + keyWidth, textY, textPaint);
    }

    private void drawSwipePath(Canvas canvas) {
        if (swipePoints.size() < 2) return;

        swipePath.reset();
        swipePath.moveTo(swipePoints.get(0)[0], swipePoints.get(0)[1]);

        for (int i = 1; i < swipePoints.size(); i++) {
            swipePath.lineTo(swipePoints.get(i)[0], swipePoints.get(i)[1]);
        }

        canvas.drawPath(swipePath, swipePaint);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        gestureDetector.onTouchEvent(event);

        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:
                lastSwipeX = event.getX();
                lastSwipeY = event.getY();
                swipePoints.clear();
                swipePoints.add(new float[]{lastSwipeX, lastSwipeY});
                isSwiping = true;
                handleKeyPress(event.getX(), event.getY());
                performHapticFeedback();
                return true;

            case MotionEvent.ACTION_MOVE:
                float currentX = event.getX();
                float currentY = event.getY();

                if (isSwiping) {
                    swipePoints.add(new float[]{currentX, currentY});
                    invalidate();
                }
                return true;

            case MotionEvent.ACTION_UP:
                isSwiping = false;
                handleKeyRelease(event.getX(), event.getY());
                swipePoints.clear();
                invalidate();
                return true;
        }

        return super.onTouchEvent(event);
    }

    private void handleKeyPress(float x, float y) {
        int keyWidth = getWidth() / 10;
        int keyHeight = getHeight() / 5;

        int row = (int) (y / keyHeight);
        int col = (int) (x / keyWidth);

        String[][] keys = isSymbolsMode ? symbolKeys : letterKeys;

        if (row >= 0 && row < keys.length) {
            if (col >= 0 && col < keys[row].length) {
                String key = keys[row][col];
                if (keyListener != null) {
                    keyListener.onKey(key.charAt(0), null);
                    keyListener.onPress(key.charAt(0));
                }
            }
        }

        // Handle bottom row
        if (row == 4) {
            if (col < 6) {
                // Space
                if (keyListener != null) keyListener.onKey(-3, null);
            } else if (col < 8) {
                // Backspace
                if (keyListener != null) keyListener.onKey(-4, null);
            } else {
                // Enter
                if (keyListener != null) keyListener.onKey(-5, null);
            }
        }
    }

    private void handleKeyRelease(float x, float y) {
        if (keyListener != null) {
            keyListener.onRelease(0);
        }
    }

    private void performHapticFeedback() {
        performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
    }

    public void setOnKeyListener(OnKeyListener listener) {
        this.keyListener = listener;
    }

    public void setShifted(boolean shifted) {
        this.isShifted = shifted;
        invalidate();
    }

    public void setSymbolsMode(boolean symbolsMode) {
        this.isSymbolsMode = symbolsMode;
        invalidate();
    }

    public void setKeyboardType(int type) {
        this.keyboardType = type;
        this.isSymbolsMode = (type == 1);
        invalidate();
    }

    public void setAccentColor(int color) {
        this.accentColor = color;
        swipePaint.setColor(color);
    }

    public void setKeyBackgroundColor(int color) {
        this.keyBackgroundColor = color;
    }

    public void setKeyTextColor(int color) {
        this.keyTextColor = color;
    }

    public void setSpecialKeyColor(int color) {
        this.specialKeyColor = color;
    }

    public boolean isShifted() {
        return isShifted;
    }

    public boolean isSymbolsMode() {
        return isSymbolsMode;
    }
}
