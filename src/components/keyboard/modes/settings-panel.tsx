'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Globe, Image, PenTool, Smile, Sparkles, Wand2 } from 'lucide-react';
import type { ThemeDef } from '@/components/keyboard-data';

interface KeyboardSettingsPanelProps {
  t: ThemeDef;

  desktopView: boolean;
  setDesktopView: (v: boolean) => void;

  keyboardHeight: 'compact' | 'normal' | 'tall';
  setKeyboardHeight: (v: 'compact' | 'normal' | 'tall') => void;

  keyboardSpacing: 'compact' | 'normal' | 'spacious';
  setKeyboardSpacing: (v: 'compact' | 'normal' | 'spacious') => void;

  toolbarStyle: 'active' | 'all' | 'icons';
  setToolbarStyle: (v: 'active' | 'all' | 'icons') => void;

  showNumberRow: boolean;
  setShowNumberRow: (v: boolean) => void;

  visibleButtons: Record<string, boolean>;
  setVisibleButtons: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  autoCapitalization: boolean;
  setAutoCapitalization: (v: boolean) => void;

  vibrateOnKeyPress: boolean;
  setVibrateOnKeyPress: (v: boolean) => void;

  hapticStrength: 'light' | 'medium' | 'strong';
  setHapticStrength: (v: 'light' | 'medium' | 'strong') => void;
  doVibrate: (strength?: number) => void;

  soundOnKeyPress: boolean;
  setSoundOnKeyPress: (v: boolean) => void;

  doubleSpacePeriod: boolean;
  setDoubleSpacePeriod: (v: boolean) => void;

  autoSpaceAfterPunctuation: boolean;
  setAutoSpaceAfterPunctuation: (v: boolean) => void;

  keyPopupOnLongPress: boolean;
  setKeyPopupOnLongPress: (v: boolean) => void;

  oneHandedMode: 'off' | 'left' | 'right';
  setOneHandedMode: (v: 'off' | 'left' | 'right') => void;
}

export default function KeyboardSettingsPanel({
  t, desktopView, setDesktopView, keyboardHeight, setKeyboardHeight,
  keyboardSpacing, setKeyboardSpacing, toolbarStyle, setToolbarStyle,
  showNumberRow, setShowNumberRow, visibleButtons, setVisibleButtons,
  autoCapitalization, setAutoCapitalization, vibrateOnKeyPress, setVibrateOnKeyPress,
  hapticStrength, setHapticStrength, doVibrate, soundOnKeyPress, setSoundOnKeyPress,
  doubleSpacePeriod, setDoubleSpacePeriod, autoSpaceAfterPunctuation, setAutoSpaceAfterPunctuation,
  keyPopupOnLongPress, setKeyPopupOnLongPress, oneHandedMode, setOneHandedMode,
}: KeyboardSettingsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
        <span className={`text-xs font-medium ${t.keyText} opacity-70`}>Keyboard Settings</span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-4">
        {/* Desktop View toggle */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Desktop View</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Wide layout for larger screens</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDesktopView(!desktopView)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${desktopView ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div
              animate={{ x: desktopView ? 16 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </div>

        {/* Keyboard height selector */}
        <div className={`p-3 rounded-xl ${t.card} ${t.border} border`}>
          <p className={`text-xs font-medium mb-2 ${t.keyText}`}>Keyboard Height</p>
          <div className="flex gap-2">
            {(['compact', 'normal', 'tall'] as const).map(h => (
              <motion.button
                key={h}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setKeyboardHeight(h)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  keyboardHeight === h ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
                }`}
              >
                {h}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Keyboard Spacing */}
        <div className={`p-3 rounded-xl ${t.card} ${t.border} border`}>
          <p className={`text-xs font-medium mb-2 ${t.keyText}`}>Key Spacing (Density)</p>
          <div className="flex gap-2">
            {(['compact', 'normal', 'spacious'] as const).map(spacing => (
              <motion.button
                key={spacing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setKeyboardSpacing(spacing)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  keyboardSpacing === spacing ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
                }`}
              >
                {spacing}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Toolbar Style */}
        <div className={`p-3 rounded-xl ${t.card} ${t.border} border`}>
          <p className={`text-xs font-medium mb-2 ${t.keyText}`}>Toolbar Style (Mobile)</p>
          <div className="flex gap-2">
            {[
               { id: 'active', label: 'Active Only' },
               { id: 'all', label: 'All Labels' },
               { id: 'icons', label: 'Icons Only' }
            ].map(style => (
              <motion.button
                key={style.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setToolbarStyle(style.id as 'active' | 'all' | 'icons')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
                  toolbarStyle === style.id ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
                }`}
              >
                {style.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Show number row toggle */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${t.suggestion} ${t.keyText} opacity-80`}>
                <Globe className="w-4 h-4" />
             </div>
             <div>
                <p className={`text-xs font-bold ${t.keyText}`}>Show Number Row</p>
                <p className={`text-[10px] ${t.keyText} opacity-50`}>Always show numbers</p>
             </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNumberRow(!showNumberRow)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${showNumberRow ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div animate={{ x: showNumberRow ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
          </motion.button>
        </div>

        {/* Dynamic Buttons Toggle */}
        <div className={`p-4 rounded-2xl ${t.card} ${t.border} border space-y-4`}>
          <div className="flex items-center gap-2 mb-1">
             <Wand2 className={`w-4 h-4 ${t.accentText} opacity-70`} />
             <p className={`text-xs font-bold ${t.keyText} uppercase tracking-tight`}>Toolbar Buttons</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'stickers', label: 'Stickers', icon: Smile },
              { id: 'gifs', label: 'GIFs', icon: Image },
              { id: 'clipboard', label: 'Clipboard', icon: ClipboardList },
              { id: 'handwriting', label: 'Handwriting', icon: PenTool },
              { id: 'translate', label: 'Language AI', icon: Sparkles },
            ].map(btn => (
              <div key={btn.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <btn.icon className={`w-4 h-4 ${t.keyText} opacity-40`} />
                  <span className={`text-[11px] font-medium ${t.keyText}`}>{btn.label}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setVisibleButtons(prev => ({ ...prev, [btn.id]: !prev[btn.id] }))}
                  className={`w-8 h-4 rounded-full transition-colors flex items-center ${visibleButtons[btn.id] ? t.accent : 'bg-gray-600'}`}
                >
                  <motion.div animate={{ x: visibleButtons[btn.id] ? 14 : 2 }} className="w-3 h-3 bg-white rounded-full shadow-sm" />
                </motion.button>
              </div>
            ))}
          </div>
        </div>

        {/* Auto Capitalization */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Auto Capitalization</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Capitalize start of sentences</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setAutoCapitalization(!autoCapitalization)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${autoCapitalization ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div animate={{ x: autoCapitalization ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
          </motion.button>
        </div>

        {/* Vibrate on Keypress */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Vibrate on Keypress</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Haptic feedback for every key</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setVibrateOnKeyPress(!vibrateOnKeyPress)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${vibrateOnKeyPress ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div animate={{ x: vibrateOnKeyPress ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
          </motion.button>
        </div>

        {/* Haptic Strength (only meaningful while vibration is on) */}
        {vibrateOnKeyPress && (
          <div className={`p-3 rounded-xl ${t.card} ${t.border} border`}>
            <p className={`text-xs font-medium mb-2 ${t.keyText}`}>Haptic Strength</p>
            <div className="flex gap-2">
              {(['light', 'medium', 'strong'] as const).map(s => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setHapticStrength(s); doVibrate({ light: 5, medium: 12, strong: 25 }[s]); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    hapticStrength === s ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
                  }`}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Sound on Keypress */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Sound on Keypress</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Play a click sound per key</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSoundOnKeyPress(!soundOnKeyPress)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${soundOnKeyPress ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div animate={{ x: soundOnKeyPress ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
          </motion.button>
        </div>

        {/* Double-space for period */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Double-Space for Period</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Tap space twice to insert ". "</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDoubleSpacePeriod(!doubleSpacePeriod)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${doubleSpacePeriod ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div animate={{ x: doubleSpacePeriod ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
          </motion.button>
        </div>

        {/* Auto-space after punctuation */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Auto-Space After Punctuation</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Add space after . ! ? ; :</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setAutoSpaceAfterPunctuation(!autoSpaceAfterPunctuation)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${autoSpaceAfterPunctuation ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div animate={{ x: autoSpaceAfterPunctuation ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
          </motion.button>
        </div>

        {/* Key popup on long press */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Key Popup on Long Press</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Show alternate characters on long press</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setKeyPopupOnLongPress(!keyPopupOnLongPress)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${keyPopupOnLongPress ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div animate={{ x: keyPopupOnLongPress ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
          </motion.button>
        </div>

        {/* One-Handed Mode */}
        <div className={`p-3 rounded-xl ${t.card} ${t.border} border`}>
          <p className={`text-xs font-medium mb-2 ${t.keyText}`}>One-Handed Mode</p>
          <p className={`text-[10px] ${t.keyText} opacity-50 mb-2`}>Shrink and shift the keyboard for thumb reach</p>
          <div className="flex gap-2">
            {([
              { id: 'off', label: 'Off' },
              { id: 'left', label: 'Left' },
              { id: 'right', label: 'Right' },
            ] as const).map(opt => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOneHandedMode(opt.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  oneHandedMode === opt.id ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
                }`}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
