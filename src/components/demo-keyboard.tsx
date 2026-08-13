'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Sparkles, Delete, CornerDownLeft, Mic, Smile, Languages, ArrowLeftRight } from 'lucide-react';

/*
  DEMO KEYBOARD — Premium interactive showcase

  Design principles:
  - Emerald green accents (Ethiopian Airlines signature)
  - Smooth glassmorphism effects
  - Purposeful animations and hover states
  - Clear visual hierarchy
  - Both English and Amharic native support
*/

const ENGLISH_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace']
];

const AMHARIC_ROWS = [
  ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ'],
  ['ተ', 'ቸ', 'ኀ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ'],
  ['shift', 'ዐ', 'ዘ', 'ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'backspace']
];

const AMHARIC_VOWELS = ['ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ', 'ኧ'];

const SUGGESTIONS_EN = ['the', 'and', 'for', 'you', 'are', 'not'];
const SUGGESTIONS_AM = ['እንዴት', 'እንደምን', 'አመሰግናለሁ', 'እባክዎ', 'ሰላም', 'እሺ'];

type Language = 'english' | 'amharic';

interface DemoKeyboardProps {
  onTextChange?: (text: string) => void;
}

export default function DemoKeyboard({ onTextChange }: DemoKeyboardProps) {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<Language>('english');
  const [shift, setShift] = useState(false);
  const [selectedConsonant, setSelectedConsonant] = useState<string | null>(null);
  const [showTranslate, setShowTranslate] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const currentRows = language === 'english' ? ENGLISH_ROWS : AMHARIC_ROWS;
  const suggestions = language === 'english' ? SUGGESTIONS_EN : SUGGESTIONS_AM;

  useEffect(() => {
    onTextChange?.(text);
  }, [text, onTextChange]);

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setText(prev => prev.slice(0, -1));
    } else if (key === 'shift') {
      setShift(!shift);
    } else if (key === 'space') {
      setText(prev => prev + ' ');
    } else if (key === 'enter') {
      setText(prev => prev + '\n');
    } else {
      const char = shift ? key.toUpperCase() : key;
      setText(prev => prev + char);
      setShift(false);
    }
  };

  const handleAmharicPress = (consonant: string) => {
    setSelectedConsonant(consonant);
  };

  const handleVowelSelect = (vowel: string) => {
    setText(prev => prev + vowel);
    setSelectedConsonant(null);
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    setShowTranslate(true);

    // Simulate AI translation
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (language === 'english') {
      setTranslatedText('ሰላም፣ እንዴት ነህ?'); // "Hello, how are you?" in Amharic
    } else {
      setTranslatedText('Hello, how are you?');
    }
    setIsTranslating(false);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'english' ? 'amharic' : 'english');
    setSelectedConsonant(null);
    setShift(false);
  };

  const renderKey = (key: string, index: number) => {
    const isSpecial = ['shift', 'backspace', 'space', 'enter'].includes(key);
    const isWide = key === 'space';

    if (key === 'backspace') {
      return (
        <motion.button
          key={index}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleKeyPress(key)}
          className="flex items-center justify-center h-12 px-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-emerald-500/40 transition-all shadow-lg backdrop-blur-sm"
        >
          <Delete className="w-4 h-4 text-white/80" />
        </motion.button>
      );
    }

    if (key === 'shift') {
      return (
        <motion.button
          key={index}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShift(!shift)}
          className={`flex items-center justify-center h-12 px-4 rounded-xl border transition-all shadow-lg backdrop-blur-sm ${
            shift
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-emerald-500/40 text-white/80'
          }`}
        >
          <span className="text-xs font-bold">⇧</span>
        </motion.button>
      );
    }

    return (
      <motion.button
        key={index}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => language === 'amharic' ? handleAmharicPress(key) : handleKeyPress(key)}
        className={`flex-1 flex items-center justify-center h-12 rounded-xl border transition-all shadow-lg backdrop-blur-sm font-medium ${
          selectedConsonant === key
            ? 'bg-emerald-500/30 border-emerald-500/60 text-white ring-2 ring-emerald-500/50'
            : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-emerald-500/40 text-white/90 hover:text-white hover:bg-white/15'
        }`}
      >
        {shift && language === 'english' ? key.toUpperCase() : key}
      </motion.button>
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-[rgb(18,18,20)] via-[rgb(25,25,28)] to-[rgb(18,18,20)] flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

      {/* Text Display Area */}
      <div className="flex-1 p-6 relative z-10 flex flex-col">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex-1 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Languages className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {language === 'english' ? 'English' : 'አማርኛ (Amharic)'}
                </h3>
                <p className="text-xs text-white/50">Type to start</p>
              </div>
            </div>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all text-xs font-medium text-emerald-400"
            >
              <Globe className="w-3.5 h-3.5" />
              Switch
            </button>
          </div>

          {/* Text content */}
          <div className="flex-1 overflow-y-auto mb-4">
            <p className="text-lg text-white/90 leading-relaxed whitespace-pre-wrap min-h-[80px] font-mono">
              {text || <span className="text-white/30">Start typing...</span>}
            </p>
          </div>

          {/* Translation Panel */}
          <AnimatePresence>
            {showTranslate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-amber-400">AI Translation</span>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  {isTranslating ? (
                    <div className="flex items-center gap-2 text-white/60">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      <span className="text-sm">Translating...</span>
                    </div>
                  ) : (
                    <p className="text-base text-white/90 font-mono">{translatedText}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggestions */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestions.map((suggestion, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setText(prev => prev + (prev ? ' ' : '') + suggestion)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 text-sm text-white/80 hover:text-white whitespace-nowrap transition-all"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Vowel selector for Amharic */}
      <AnimatePresence>
        {selectedConsonant && language === 'amharic' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-6 pb-2"
          >
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 backdrop-blur-xl rounded-xl border border-emerald-500/30 p-3 shadow-2xl">
              <div className="flex gap-2 overflow-x-auto">
                {AMHARIC_VOWELS.map((vowel, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVowelSelect(vowel)}
                    className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/10 hover:bg-white/20 border border-emerald-500/30 hover:border-emerald-500/60 flex items-center justify-center text-white font-medium transition-all"
                  >
                    {vowel}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard */}
      <div className="px-6 pb-6 relative z-10">
        <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-2xl rounded-2xl border border-white/10 p-4 shadow-2xl">
          {/* Keyboard rows */}
          <div className="space-y-2 mb-3">
            {currentRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1.5 justify-center">
                {row.map((key, keyIndex) => renderKey(key, keyIndex))}
              </div>
            ))}
          </div>

          {/* Bottom row with space, translate, etc */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setText('')}
              className="h-12 px-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-red-500/40 text-white/80 hover:text-red-400 transition-all shadow-lg backdrop-blur-sm flex items-center gap-2 text-sm font-medium"
            >
              Clear
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleKeyPress('space')}
              className="flex-1 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-emerald-500/40 text-white/60 hover:text-white/90 transition-all shadow-lg backdrop-blur-sm text-sm font-medium"
            >
              Space
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTranslate}
              disabled={!text || isTranslating}
              className="h-12 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              AI Translate
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleKeyPress('enter')}
              className="h-12 px-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-emerald-500/40 transition-all shadow-lg backdrop-blur-sm flex items-center"
            >
              <CornerDownLeft className="w-4 h-4 text-white/80" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Feature indicators */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-xl flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </motion.div>
      </div>
    </div>
  );
}
