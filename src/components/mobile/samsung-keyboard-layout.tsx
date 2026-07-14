'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, CornerDownLeft, ArrowUp, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ThemeDef } from '@/components/keyboard-data';
import type { Language } from './mobile-keyboard-app';

interface SamsungKeyboardLayoutProps {
  language: Language;
  onKeyPress: (key: string) => void;
  theme: ThemeDef;
  showNumberRow?: boolean;
}

const QWERTY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

const NUMBER_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const SYMBOL_ROW_1 = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];
const SYMBOL_ROW_2 = ['-', '_', '+', '=', '/', '\\', '[', ']', '{', '}'];
const SYMBOL_ROW_3 = [':', ';', '"', "'", '<', '>', ',', '.', '?'];

const AMHARIC_ROWS = [
  ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ'],
  ['ተ', 'ቸ', 'ኀ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ'],
  ['ዐ', 'ዘ', 'ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጠ', 'ጨ']
];

// Long press alternates (Samsung style)
const LONG_PRESS_ALTERNATES: Record<string, string[]> = {
  'a': ['á', 'à', 'â', 'ä', 'ã', 'å', 'æ', 'ā'],
  'e': ['é', 'è', 'ê', 'ë', 'ē', 'ė', 'ę'],
  'i': ['í', 'ì', 'î', 'ï', 'ī', 'į'],
  'o': ['ó', 'ò', 'ô', 'ö', 'õ', 'ō', 'ø', 'œ'],
  'u': ['ú', 'ù', 'û', 'ü', 'ū'],
  'n': ['ñ', 'ń'],
  's': ['š', 'ś', 'ş', 'ß'],
  'c': ['ç', 'ć', 'č'],
  'y': ['ý', 'ÿ'],
  'z': ['ž', 'ź', 'ż'],
  '0': ['°', '₀', '⁰'],
  '1': ['¹', '₁'],
  '2': ['²', '₂'],
  '3': ['³', '₃'],
  '!': ['¡'],
  '?': ['¿'],
  '$': ['€', '£', '¥', '₹', '₩'],
  '%': ['‰'],
  '-': ['–', '—', '•'],
  '+': ['±'],
  '=': ['≠', '≈', '∞'],
};

export function SamsungKeyboardLayout({
  language,
  onKeyPress,
  theme,
  showNumberRow = true
}: SamsungKeyboardLayoutProps) {
  const [shiftActive, setShiftActive] = useState(false);
  const [symbolsActive, setSymbolsActive] = useState(false);
  const [longPressKey, setLongPressKey] = useState<string | null>(null);
  const [longPressPosition, setLongPressPosition] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rippleKey, setRippleKey] = useState<string | null>(null);

  const rows = language === 'english'
    ? (symbolsActive ? [SYMBOL_ROW_1, SYMBOL_ROW_2, SYMBOL_ROW_3] : QWERTY_ROWS)
    : AMHARIC_ROWS;

  const handlePointerDown = useCallback((key: string, event: React.PointerEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setLongPressPosition({ x: rect.left, y: rect.top });

    if (LONG_PRESS_ALTERNATES[key]) {
      longPressTimerRef.current = setTimeout(() => {
        setLongPressKey(key);
      }, 500);
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleKeyClick = useCallback((key: string) => {
    if (longPressKey) return; // Don't trigger if long press menu is open

    setRippleKey(key);
    setTimeout(() => setRippleKey(null), 300);

    if (key === 'shift') {
      setShiftActive(!shiftActive);
      return;
    }

    if (key === 'symbols') {
      setSymbolsActive(!symbolsActive);
      return;
    }

    let finalKey = key;
    if (shiftActive && key.length === 1 && key.match(/[a-z]/)) {
      finalKey = key.toUpperCase();
      setShiftActive(false); // Auto-disable shift after one character
    }

    onKeyPress(finalKey);
  }, [onKeyPress, shiftActive, symbolsActive, longPressKey]);

  const handleAlternateSelect = useCallback((alt: string) => {
    onKeyPress(alt);
    setLongPressKey(null);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [onKeyPress]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const renderKey = (key: string, extraClasses = '') => {
    const isRippling = rippleKey === key;
    const hasAlternates = LONG_PRESS_ALTERNATES[key];

    return (
      <motion.div
        key={key}
        className="relative"
        whileTap={{ scale: 0.95 }}
      >
        <Button
          className={`
            ${theme.key} ${theme.keyText} ${theme.keyHover}
            relative overflow-hidden
            h-12 rounded-lg font-medium text-base
            shadow-sm backdrop-blur-sm
            transition-all duration-150
            ${extraClasses}
            ${shiftActive && key === 'shift' ? theme.keyActive : ''}
            ${symbolsActive && key === 'symbols' ? theme.keyActive : ''}
          `}
          onPointerDown={(e) => handlePointerDown(key, e)}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={() => handleKeyClick(key)}
        >
          <span className="relative z-10">
            {shiftActive && key.length === 1 && key.match(/[a-z]/)
              ? key.toUpperCase()
              : key}
          </span>

          {/* Ripple effect */}
          {isRippling && (
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-lg"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Indicator for alternates */}
          {hasAlternates && (
            <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-current opacity-30" />
          )}
        </Button>
      </motion.div>
    );
  };

  const renderSpecialKey = (icon: React.ReactNode, key: string, extraClasses = '') => {
    const isRippling = rippleKey === key;

    return (
      <motion.div
        key={key}
        className="relative"
        whileTap={{ scale: 0.95 }}
      >
        <Button
          className={`
            ${theme.specialKey} ${theme.keyText} ${theme.keyHover}
            relative overflow-hidden
            h-12 rounded-lg
            shadow-sm backdrop-blur-sm
            transition-all duration-150
            ${extraClasses}
          `}
          onClick={() => handleKeyClick(key)}
        >
          <span className="relative z-10">{icon}</span>

          {/* Ripple effect */}
          {isRippling && (
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-lg"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </Button>
      </motion.div>
    );
  };

  return (
    <div className="p-2 space-y-1">
      {/* Number row (optional) */}
      {showNumberRow && !symbolsActive && (
        <div className="grid grid-cols-10 gap-1">
          {NUMBER_ROW.map((num) => renderKey(num))}
        </div>
      )}

      {/* Main keyboard rows */}
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex justify-center gap-1"
          style={{
            paddingLeft: rowIdx === 1 ? '5%' : rowIdx === 2 ? '10%' : 0,
            paddingRight: rowIdx === 1 ? '5%' : rowIdx === 2 ? '10%' : 0
          }}
        >
          {row.map((key) => (
            <div key={key} className="flex-1">
              {renderKey(key)}
            </div>
          ))}
        </div>
      ))}

      {/* Bottom row */}
      <div className="grid grid-cols-12 gap-1">
        <div className="col-span-2">
          {renderSpecialKey(
            symbolsActive ? '123' : '?123',
            'symbols',
            'text-sm'
          )}
        </div>
        
        <div className="col-span-1">
          {renderSpecialKey(<Globe className="w-5 h-5" />, 'language')}
        </div>

        <div className="col-span-1">
          {renderKey(',')}
        </div>

        <div className="col-span-4">
          {renderKey('space', 'col-span-4 text-sm')}
        </div>

        <div className="col-span-1">
          {renderKey('.')}
        </div>

        <div className="col-span-2">
          {renderSpecialKey(<ArrowUp className="w-5 h-5" />, 'shift')}
        </div>

        <div className="col-span-1">
          {renderSpecialKey(<Delete className="w-5 h-5" />, 'backspace')}
        </div>
      </div>

      {/* Long press popup */}
      <AnimatePresence>
        {longPressKey && LONG_PRESS_ALTERNATES[longPressKey] && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setLongPressKey(null)}
            />

            {/* Alternates popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className={`
                fixed z-50 ${theme.card} backdrop-blur-lg
                rounded-xl shadow-2xl p-2
                border ${theme.border}
              `}
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: '120px'
              }}
            >
              <div className="flex gap-2">
                {LONG_PRESS_ALTERNATES[longPressKey].map((alt) => (
                  <Button
                    key={alt}
                    onClick={() => handleAlternateSelect(alt)}
                    className={`
                      ${theme.key} ${theme.keyText} ${theme.keyHover}
                      h-12 w-12 rounded-lg text-lg font-medium
                      shadow-sm
                    `}
                  >
                    {alt}
                  </Button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
