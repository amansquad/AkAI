package com.akai.keyboard;

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import io.flutter.plugin.common.MethodChannel;

public class SettingsChannel {
    public static void setup(MethodChannel channel, Context context) {
        channel.setMethodCallHandler((call, result) -> {
            if (call.method.equals("openInputMethodSettings")) {
                Intent intent = new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                result.success(true);
            } else {
                result.notImplemented();
            }
        });
    }
}
