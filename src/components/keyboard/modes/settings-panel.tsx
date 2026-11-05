'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Image, Palette, PenTool, RotateCcw, Smile, Sparkles,
} from 'lucide-react';
import type { ThemeDef } from '@/components/keyboard-data';
import { DEFAULT_PREFS, type KeyboardPrefs } from '@/components/keyboard/prefs';

interface KeyboardSettingsPanelProps {
  t: ThemeDef;
  prefs: KeyboardPrefs;
  setPref: <K extends keyof KeyboardPrefs>(key: K, value: KeyboardPrefs[K]) => void;
  /** True inside the Android keyboard, where desktop-only options are hidden. */
  isIme: boolean;
  /** Vibrate once at the given strength (1–5), regardless of the on/off setting. */
  previewHaptic: (level: number) => void;
  /** Play one key click at the given volume (0–100), regardless of the on/off setting. */
  previewSound: (volume: number) => void;
  onOpenThemes: () => void;
  onReset: () => void;
}

// ─── Building blocks ────────────────────────────────────────────────────────

function Section({ t, title, children }: { t: ThemeDef; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className={`px-1 text-[10px] font-bold uppercase tracking-wider ${t.keyText} opacity-50`}>{title}</h3>
      <div className={`rounded-xl ${t.card} ${t.border} border divide-y divide-white/5 overflow-hidden`}>
        {children}
      </div>
    </section>
  );
}

function Row({ t, label, hint, children, icon: Icon }: {
  t: ThemeDef; label: string; hint?: string; children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && <Icon className={`w-4 h-4 shrink-0 ${t.keyText} opacity-50`} />}
        <div className="min-w-0">
          <p className={`text-xs font-medium ${t.keyText}`}>{label}</p>
          {hint && <p className={`text-[10px] leading-snug ${t.keyText} opacity-50`}>{hint}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ t, on, onChange, label }: { t: ThemeDef; on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      whileTap={{ scale: 0.9 }}
      onClick={() => onChange(!on)}
      className={`w-10 h-6 rounded-full transition-colors flex items-center ${on ? t.accent : 'bg-gray-600'}`}
    >
      <motion.div animate={{ x: on ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
    </motion.button>
  );
}

function Choice<V extends string>({ t, value, options, onChange }: {
  t: ThemeDef; value: V; options: readonly { id: V; label: string }[]; onChange: (v: V) => void;
}) {
  return (
    <div className="flex gap-1.5 px-3 pb-2.5">
      {options.map(opt => (
        <motion.button
          key={opt.id}
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(opt.id)}
          aria-pressed={value === opt.id}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            value === opt.id ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
          }`}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
}

function Slider({ t, value, min, max, step = 1, onChange, onCommit, label, format }: {
  t: ThemeDef; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; onCommit?: (v: number) => void;
  label: string; format: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 pb-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={e => {
          const v = Number(e.target.value);
          onChange(v);
          onCommit?.(v);
        }}
        className="flex-1 h-1.5 cursor-pointer"
        style={{ accentColor: 'currentColor' }}
      />
      <span className={`w-14 text-right text-[11px] font-medium tabular-nums ${t.keyText}`}>{format(value)}</span>
    </div>
  );
}

const HAPTIC_LABELS = ['', 'Very light', 'Light', 'Medium', 'Strong', 'Very strong'];

const TOOLBAR_BUTTONS = [
  { id: 'stickers', label: 'Emoji & stickers', icon: Smile },
  { id: 'gifs', label: 'GIFs', icon: Image },
  { id: 'clipboard', label: 'Clipboard', icon: ClipboardList },
  { id: 'translate', label: 'AI translate', icon: Sparkles },
  { id: 'handwriting', label: 'Handwriting', icon: PenTool },
  { id: 'themes', label: 'Theme button', icon: Palette },
] as const;

// ─── Panel ──────────────────────────────────────────────────────────────────

export default function KeyboardSettingsPanel({
  t, prefs, setPref, isIme, previewHaptic, previewSound, onOpenThemes, onReset,
}: KeyboardSettingsPanelProps) {
  const toggleButton = (id: string) =>
    setPref('visibleButtons', { ...prefs.visibleButtons, [id]: prefs.visibleButtons[id] === false });

  const isDefault = (Object.keys(DEFAULT_PREFS) as (keyof KeyboardPrefs)[])
    .every(k => JSON.stringify(prefs[k]) === JSON.stringify(DEFAULT_PREFS[k]));

  // A second tap confirms. Not window.confirm: inside the Android keyboard
  // there is no activity window for a dialog to attach to.
  const [confirmingReset, setConfirmingReset] = React.useState(false);
  React.useEffect(() => {
    if (!confirmingReset) return;
    const timer = setTimeout(() => setConfirmingReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingReset]);

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
        <span className={`text-xs font-medium ${t.keyText} opacity-70`}>Keyboard Settings</span>
      </div>

      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-4">
        {/* ── Look ── */}
        <Section t={t} title="Look">
          <Row t={t} label="Theme" hint="Colours and live wallpapers" icon={Palette}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={onOpenThemes}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${t.accent} ${t.accentText}`}
            >
              Change
            </motion.button>
          </Row>
          <Row t={t} label="Key-press animation" hint="Glow and bounce when a key is tapped">
            <Toggle t={t} label="Key-press animation" on={prefs.keyAnimations} onChange={v => setPref('keyAnimations', v)} />
          </Row>
        </Section>

        {/* ── Top bar ── */}
        <Section t={t} title="Top bar">
          <Row t={t} label="Suggestion bar" hint="Word suggestions above the keys">
            <Toggle t={t} label="Suggestion bar" on={prefs.showSuggestionBar} onChange={v => setPref('showSuggestionBar', v)} />
          </Row>
          {prefs.showSuggestionBar && (
            <Row t={t} label="Word of the Day" hint="Shown in the bar before you start typing">
              <Toggle t={t} label="Word of the Day" on={prefs.showWordOfTheDay} onChange={v => setPref('showWordOfTheDay', v)} />
            </Row>
          )}
          <div className="pt-2.5">
            <p className={`px-3 pb-2 text-xs font-medium ${t.keyText}`}>Toolbar labels</p>
            <Choice
              t={t}
              value={prefs.toolbarStyle}
              onChange={v => setPref('toolbarStyle', v)}
              options={[
                { id: 'active', label: 'Active only' },
                { id: 'all', label: 'All labels' },
                { id: 'icons', label: 'Icons only' },
              ] as const}
            />
          </div>
        </Section>

        {/* ── Toolbar buttons ── */}
        <Section t={t} title="Toolbar buttons">
          {TOOLBAR_BUTTONS.map(btn => (
            <Row
              key={btn.id}
              t={t}
              label={btn.label}
              icon={btn.icon}
              hint={btn.id === 'themes' ? 'Themes stay available from Look, above' : undefined}
            >
              <Toggle t={t} label={btn.label} on={prefs.visibleButtons[btn.id] !== false} onChange={() => toggleButton(btn.id)} />
            </Row>
          ))}
        </Section>

        {/* ── Keys ── */}
        <Section t={t} title="Keys">
          <div className="pt-2.5">
            <p className={`px-3 pb-2 text-xs font-medium ${t.keyText}`}>Keyboard height</p>
            <Choice
              t={t}
              value={prefs.keyboardHeight}
              onChange={v => setPref('keyboardHeight', v)}
              options={[
                { id: 'compact', label: 'Compact' },
                { id: 'normal', label: 'Normal' },
                { id: 'tall', label: 'Tall' },
              ] as const}
            />
          </div>
          <div className="pt-2.5">
            <p className={`px-3 pb-2 text-xs font-medium ${t.keyText}`}>Space between keys</p>
            <Choice
              t={t}
              value={prefs.keyboardSpacing}
              onChange={v => setPref('keyboardSpacing', v)}
              options={[
                { id: 'compact', label: 'Tight' },
                { id: 'normal', label: 'Normal' },
                { id: 'spacious', label: 'Roomy' },
              ] as const}
            />
          </div>
          <div className="pt-2.5">
            <p className={`px-3 pb-2 text-xs font-medium ${t.keyText}`}>Key label size</p>
            <Choice
              t={t}
              value={prefs.keyTextSize}
              onChange={v => setPref('keyTextSize', v)}
              options={[
                { id: 'small', label: 'Small' },
                { id: 'medium', label: 'Medium' },
                { id: 'large', label: 'Large' },
              ] as const}
            />
          </div>
          <Row t={t} label="Number row" hint="A row of numbers above the letters">
            <Toggle t={t} label="Number row" on={prefs.showNumberRow} onChange={v => setPref('showNumberRow', v)} />
          </Row>
          <Row t={t} label="Symbol hints" hint="Small symbols in the corner of letter keys">
            <Toggle t={t} label="Symbol hints" on={prefs.showKeyHints} onChange={v => setPref('showKeyHints', v)} />
          </Row>
          <Row t={t} label="Microphone key" hint="Voice typing stays on a long press of space">
            <Toggle t={t} label="Microphone key" on={prefs.showMicKey} onChange={v => setPref('showMicKey', v)} />
          </Row>
          <div className="pt-2.5">
            <p className={`px-3 text-xs font-medium ${t.keyText}`}>One-handed mode</p>
            <p className={`px-3 pb-2 text-[10px] ${t.keyText} opacity-50`}>Shrink the keyboard towards one thumb</p>
            <Choice
              t={t}
              value={prefs.oneHandedMode}
              onChange={v => setPref('oneHandedMode', v)}
              options={[
                { id: 'left', label: 'Left' },
                { id: 'off', label: 'Off' },
                { id: 'right', label: 'Right' },
              ] as const}
            />
          </div>
        </Section>

        {/* ── Typing ── */}
        <Section t={t} title="Typing">
          <Row t={t} label="Auto-capitalise" hint="Capital letter at the start of a sentence">
            <Toggle t={t} label="Auto-capitalise" on={prefs.autoCapitalization} onChange={v => setPref('autoCapitalization', v)} />
          </Row>
          <Row t={t} label="Double-space full stop" hint='Tap space twice to type ". "'>
            <Toggle t={t} label="Double-space full stop" on={prefs.doubleSpacePeriod} onChange={v => setPref('doubleSpacePeriod', v)} />
          </Row>
          <Row t={t} label="Space after punctuation" hint="After . ! ? ; :">
            <Toggle t={t} label="Space after punctuation" on={prefs.autoSpaceAfterPunctuation} onChange={v => setPref('autoSpaceAfterPunctuation', v)} />
          </Row>
          <Row t={t} label="Long-press popup" hint="Hold a key for accents, or for every vowel form of a fidel">
            <Toggle t={t} label="Long-press popup" on={prefs.keyPopupOnLongPress} onChange={v => setPref('keyPopupOnLongPress', v)} />
          </Row>
          {prefs.keyPopupOnLongPress && (
            <div className="pt-2.5">
              <p className={`px-3 pb-2 text-xs font-medium ${t.keyText}`}>How long to hold</p>
              <Choice
                t={t}
                value={prefs.longPressDelay}
                onChange={v => setPref('longPressDelay', v)}
                options={[
                  { id: 'short', label: 'Short' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'long', label: 'Long' },
                ] as const}
              />
            </div>
          )}
        </Section>

        {/* ── Feedback ── */}
        <Section t={t} title="Key-press feedback">
          <Row t={t} label="Vibration" hint="A short buzz on every key">
            <Toggle
              t={t}
              label="Vibration"
              on={prefs.vibrateOnKeyPress}
              onChange={v => { setPref('vibrateOnKeyPress', v); if (v) previewHaptic(prefs.hapticLevel); }}
            />
          </Row>
          {prefs.vibrateOnKeyPress && (
            <Slider
              t={t}
              label="Vibration strength"
              value={prefs.hapticLevel}
              min={1}
              max={5}
              onChange={v => setPref('hapticLevel', v)}
              onCommit={previewHaptic}
              format={v => HAPTIC_LABELS[v]}
            />
          )}
          <Row t={t} label="Sound" hint="A soft click on every key">
            <Toggle
              t={t}
              label="Sound"
              on={prefs.soundOnKeyPress}
              onChange={v => { setPref('soundOnKeyPress', v); if (v) previewSound(prefs.soundVolume); }}
            />
          </Row>
          {prefs.soundOnKeyPress && (
            <Slider
              t={t}
              label="Click volume"
              value={prefs.soundVolume}
              min={5}
              max={100}
              step={5}
              onChange={v => setPref('soundVolume', v)}
              onCommit={previewSound}
              format={v => `${v}%`}
            />
          )}
        </Section>

        {/* Desktop-only: a wide layout means nothing inside a phone keyboard. */}
        {!isIme && (
          <Section t={t} title="Layout">
            <Row t={t} label="Desktop view" hint="Wide layout for larger screens">
              <Toggle t={t} label="Desktop view" on={prefs.desktopView} onChange={v => setPref('desktopView', v)} />
            </Row>
          </Section>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={isDefault}
          onClick={() => {
            if (confirmingReset) { onReset(); setConfirmingReset(false); }
            else setConfirmingReset(true);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border ${
            confirmingReset ? 'bg-red-500/80 text-white border-red-400' : `${t.border} ${t.keyText}`
          } ${isDefault ? 'opacity-30' : 'opacity-90 hover:opacity-100'}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {confirmingReset ? 'Tap again to reset' : 'Reset to defaults'}
        </motion.button>
        <p className={`-mt-2 text-center text-[10px] ${t.keyText} opacity-40`}>Your theme and custom themes are kept.</p>
      </div>
    </div>
  );
}
