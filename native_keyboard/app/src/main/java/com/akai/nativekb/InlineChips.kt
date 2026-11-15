package com.akai.nativekb

import android.content.Context
import android.os.Build
import android.util.Size
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InlineSuggestion
import android.view.inputmethod.InlineSuggestionsRequest
import android.view.inputmethod.InlineSuggestionsResponse
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.inline.InlinePresentationSpec
import androidx.annotation.RequiresApi
import androidx.autofill.inline.UiVersions
import androidx.autofill.inline.v1.InlineSuggestionUi

/**
 * Autofill chips from the user's password manager (Android 11 and newer), shown
 * in a row over the top of the keyboard while a login or address field is focused.
 */
class InlineChips(private val context: Context) {
    private val density = context.resources.displayMetrics.density
    private fun dp(v: Float) = (v * density).toInt()

    private val row = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(6f), 0, dp(6f), 0)
    }

    /** The view to lay over the keyboard; hidden while there are no chips. */
    val view = HorizontalScrollView(context).apply {
        isHorizontalScrollBarEnabled = false
        visibility = View.GONE
        addView(row, ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.MATCH_PARENT))
    }

    fun layoutParams() = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(46f), Gravity.TOP)

    fun setBackground(color: Int) = view.setBackgroundColor(color)

    @RequiresApi(Build.VERSION_CODES.R)
    fun request(): InlineSuggestionsRequest {
        val style = UiVersions.newStylesBuilder().addStyle(InlineSuggestionUi.newStyleBuilder().build()).build()
        val spec = InlinePresentationSpec.Builder(Size(dp(64f), dp(32f)), Size(dp(280f), dp(40f)))
            .setStyle(style)
            .build()
        return InlineSuggestionsRequest.Builder(listOf(spec)).setMaxSuggestionCount(6).build()
    }

    private var generation = 0

    @RequiresApi(Build.VERSION_CODES.R)
    fun show(response: InlineSuggestionsResponse): Boolean {
        val list: List<InlineSuggestion> = response.inlineSuggestions
        val gen = ++generation
        row.removeAllViews()
        if (list.isEmpty()) { view.visibility = View.GONE; return true }
        val views = arrayOfNulls<View>(list.size)
        var left = list.size
        for ((i, s) in list.withIndex()) {
            s.inflate(context, Size(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT), context.mainExecutor) { v ->
                if (gen != generation) return@inflate
                views[i] = v
                if (--left == 0) {
                    // Add them in the order the autofill service gave, once all are ready.
                    for (child in views) if (child != null) row.addView(child, LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { marginEnd = dp(6f) })
                    view.visibility = if (row.childCount > 0) View.VISIBLE else View.GONE
                }
            }
        }
        return true
    }

    fun hide() {
        generation++
        row.removeAllViews()
        view.visibility = View.GONE
    }
}
