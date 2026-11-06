package com.akai.keyboard;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.view.View;

/** The red / white / blue airmail stripe, the app's border on every screen. */
final class ChevronBand extends View {

    private static final int[] COLORS = {
            Color.parseColor("#D9412F"), // signal red
            Color.parseColor("#F7F2E4"), // stamp paper
            Color.parseColor("#2F3CB8"), // airmail blue
            Color.parseColor("#F7F2E4"),
    };

    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path path = new Path();

    ChevronBand(Context context) {
        super(context);
    }

    @Override
    protected void onDraw(Canvas c) {
        float h = getHeight();
        float w = h * 2.2f;
        int i = 0;
        for (float x = -h; x < getWidth() + h; x += w, i++) {
            paint.setColor(COLORS[i % COLORS.length]);
            path.reset();
            path.moveTo(x, h);
            path.lineTo(x + h, 0);
            path.lineTo(x + h + w, 0);
            path.lineTo(x + w, h);
            path.close();
            c.drawPath(path, paint);
        }
    }
}
