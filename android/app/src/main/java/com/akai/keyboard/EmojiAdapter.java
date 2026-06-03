package com.akai.keyboard;

import android.graphics.Color;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class EmojiAdapter extends RecyclerView.Adapter<EmojiAdapter.EmojiViewHolder> {

    private List<String> emojis;
    private OnEmojiClickListener listener;

    public interface OnEmojiClickListener {
        void onEmojiClick(String emoji);
    }

    public EmojiAdapter(OnEmojiClickListener listener) {
        this.listener = listener;
        this.emojis = new ArrayList<>();
        initEmojiList();
    }

    private void initEmojiList() {
        // Smileys & People
        emojis.add("\uD83D\uDE00"); // Grinning Face
        emojis.add("\uD83D\uDE03"); // Grinning Face with Big Eyes
        emojis.add("\uD83D\uDE04"); // Grinning Face with Smiling Eyes
        emojis.add("\uD83D\uDE01"); // Beaming Face with Smiling Eyes
        emojis.add("\uD83D\uDE06"); // Grinning Squinting Face
        emojis.add("\uD83D\uDE05"); // Grinning Face with Sweat
        emojis.add("\uD83D\uDE02"); // Face with Tears of Joy
        emojis.add("\uD83E\uDD23"); // Rolling on the Floor Laughing
        emojis.add("\uD83D\uDE0A"); // Smiling Face with Smiling Eyes
        emojis.add("\uD83D\uDE07"); // Smiling Face with Halo
        emojis.add("\uD83D\uDE42"); // Slightly Smiling Face
        emojis.add("\uD83D\uDE43"); // Upside-Down Face
        emojis.add("\uD83D\uDE09"); // Winking Face
        emojis.add("\uD83D\uDE0C"); // Relieved Face
        emojis.add("\uD83D\uDE0D"); // Smiling Face with Heart-Eyes
        emojis.add("\uD83E\uDD70"); // Smiling Face with Smiling Eyes and Hand
        emojis.add("\uD83D\uDE18"); // Face Blowing a Kiss
        emojis.add("\uD83D\uDE17"); // Kissing Face
        emojis.add("\uD83D\uDE19"); // Kissing Face with Smiling Eyes
        emojis.add("\uD83D\uDE1A"); // Kissing Face with Closed Eyes
        
        // Hearts
        emojis.add("\u2764\uFE0F"); // Red Heart
        emojis.add("\uD83D\uDC94"); // Heart with Ribbon
        emojis.add("\uD83D\uDC95"); // Two Hearts
        emojis.add("\uD83D\uDC96"); // Sparkling Heart
        emojis.add("\uD83D\uDC97"); // Growing Heart
        emojis.add("\uD83D\uDC98"); // Heart with Arrow
        emojis.add("\uD83D\uDC99"); // Blue Heart
        emojis.add("\uD83D\uDC9A"); // Green Heart
        emojis.add("\uD83D\uDC9B"); // Yellow Heart
        emojis.add("\uD83D\uDC9C"); // Purple Heart
        
        // Hand gestures
        emojis.add("\uD83D\uDC4D"); // Thumbs Up
        emojis.add("\uD83D\uDC4E"); // Thumbs Down
        emojis.add("\uD83D\uDC4B"); // Waving Hand
        emojis.add("\uD83E\uDD1C"); // Leftwards Hand
        emojis.add("\uD83E\uDD1B"); // Rightwards Hand
        emojis.add("\uD83D\uDC4C"); // OK Hand
        emojis.add("\u270A"); // Raised Fist
        emojis.add("\uD83E\uDD1A"); // Clapping Hands
        emojis.add("\uD83D\uDC4F"); // Clapping Hands
        emojis.add("\uD83D\uDE4C"); // Raising Hands
        
        // Objects
        emojis.add("\uD83D\uDD25"); // Fire
        emojis.add("\u2B50"); // Star
        emojis.add("\uD83C\uDF1F"); // Glowing Star
        emojis.add("\u2728"); // Sparkles
        emojis.add("\uD83D\uDCA1"); // Light Bulb
        emojis.add("\uD83C\uDFAF"); // Bullseye
        emojis.add("\uD83C\uDFC6"); // Trophy
        emojis.add("\uD83D\uDC8E"); // Gem Stone
        emojis.add("\uD83D\uDC8D"); // Ring
        emojis.add("\uD83D\uDC84"); // Lipstick
        
        // Animals
        emojis.add("\uD83D\uDC36"); // Dog Face
        emojis.add("\uD83D\uDC31"); // Cat Face
        emojis.add("\uD83D\uDC2D"); // Mouse Face
        emojis.add("\uD83D\uDC39"); // Hamster Face
        emojis.add("\uD83D\uDC30"); // Rabbit Face
        emojis.add("\uD83E\uDD8A"); // Fox Face
        emojis.add("\uD83D\uDC3B"); // Bear Face
        emojis.add("\uD83D\uDC3C"); // Panda Face
        emojis.add("\uD83E\uDD81"); // Lion
        emojis.add("\uD83D\uDC2F"); // Tiger Face
        
        // Food
        emojis.add("\uD83C\uDF55"); // Pizza
        emojis.add("\uD83C\uDF54"); // Hamburger
        emojis.add("\uD83C\uDF69"); // Pretzel
        emojis.add("\uD83C\uDF70"); // Apple
        emojis.add("\uD83C\uDF4E"); // Pear
        emojis.add("\uD83C\uDF53"); // Strawberry
        emojis.add("\uD83C\uDF51"); // Peach
        emojis.add("\uD83C\uDF52"); // Cherry
        emojis.add("\uD83C\uDF47"); // Grapes
        emojis.add("\uD83C\uDF49"); // Watermelon
        
        // Activities
        emojis.add("\u26BD"); // Soccer Ball
        emojis.add("\uD83C\uDFC0"); // Basketball
        emojis.add("\uD83C\uDFC8"); // Football
        emojis.add("\u26BE"); // Baseball
        emojis.add("\uD83C\uDFBE"); // Tennis
        emojis.add("\u26F3"); // Golf
        emojis.add("\uD83C\uDFBF"); // Skis
        emojis.add("\uD83C\uDFC4"); // Surfing
        emojis.add("\uD83E\uDD38"); // Climbing
        emojis.add("\uD83E\uDD3A"); // Weightlifting
        
        // Travel
        emojis.add("\uD83D\uDE80"); // Rocket
        emojis.add("\u2708\uFE0F"); // Airplane
        emojis.add("\uD83D\uDE82"); // Locomotive
        emojis.add("\uD83D\uDE97"); // Car
        emojis.add("\uD83D\uDE95"); // Ambulance
        emojis.add("\uD83D\uDE91"); // Fire Engine
        emojis.add("\uD83D\uDE92"); // Police Car
        emojis.add("\uD83C\uDFE0"); // House
        emojis.add("\uD83C\uDFE2"); // Office Building
        emojis.add("\uD83C\uDFEF"); // Hospital
        
        // Symbols
        emojis.add("\u2764\uFE0F"); // Red Heart
        emojis.add("\uD83D\uDC94"); // Heart with Ribbon
        emojis.add("\u2705"); // Check Mark
        emojis.add("\u274C"); // Cross Mark
        emojis.add("\u26A0\uFE0F"); // Warning
        emojis.add("\u2139\uFE0F"); // Information
        emojis.add("\u2753"); // Question Mark
        emojis.add("\u2757"); // Exclamation Mark
        emojis.add("\u2611\uFE0F"); // Ballot Box with Check
        emojis.add("\uD83D\uDD17"); // Link
    }

    @NonNull
    @Override
    public EmojiViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        TextView textView = new TextView(parent.getContext());
        textView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));
        textView.setPadding(16, 16, 16, 16);
        textView.setGravity(Gravity.CENTER);
        textView.setTextSize(24);
        textView.setTypeface(null, Typeface.BOLD);
        textView.setTextColor(Color.WHITE);
        textView.setBackgroundColor(Color.parseColor("#1A1A2E"));
        return new EmojiViewHolder(textView);
    }

    @Override
    public void onBindViewHolder(@NonNull EmojiViewHolder holder, int position) {
        String emoji = emojis.get(position);
        holder.bind(emoji);
    }

    @Override
    public int getItemCount() {
        return emojis.size();
    }

    public void addEmojis(List<String> newEmojis) {
        int startPos = emojis.size();
        emojis.addAll(newEmojis);
        notifyItemRangeInserted(startPos, newEmojis.size());
    }

    public void filterEmojis(String query) {
        List<String> filtered = new ArrayList<>();
        for (String emoji : emojis) {
            if (emoji.contains(query)) {
                filtered.add(emoji);
            }
        }
        emojis = filtered;
        notifyDataSetChanged();
    }

    class EmojiViewHolder extends RecyclerView.ViewHolder {
        private TextView textView;

        public EmojiViewHolder(@NonNull View itemView) {
            super(itemView);
            textView = (TextView) itemView;
        }

        public void bind(String emoji) {
            textView.setText(emoji);
            textView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onEmojiClick(emoji);
                }
            });
        }
    }
}
