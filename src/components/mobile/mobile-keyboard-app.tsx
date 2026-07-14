'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveWallpaper } from '@/components/keyboard/live-wallpaper';
import {
  Keyboard, Smile, Image, ClipboardList, Languages,
  Delete, CornerDownLeft, Settings, Palette, Mic, MicOff,
  Sparkles, Globe, ArrowLeft, X, Search, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { THEMES, type ThemeDef } from '@/components/keyboard-data';
import { SamsungKeyboardLayout } from './samsung-keyboard-layout';
import { ThemeSelector } from './theme-selector';
import { StickerPanel } from './sticker-panel';
import { GifPanel } from './gif-panel';
import { ClipboardPanel } from './clipboard-panel';
import { TranslatePanel } from './translate-panel';

export type KeyboardMode = 'keyboard' | 'stickers' | 'gifs' | 'clipboard' | 'translate' | 'themes' | 'settings';
export type Language = 'english' | 'amharic';

export default function MobileKeyboardApp() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<KeyboardMode>('keyboard');
  const [language, setLanguage] = useState<Language>('english');
  const [theme, setTheme] = useState<string>('default');
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Settings
  const [vibrateOnKeyPress, setVibrateOnKeyPress] = useState(true);
  const [soundOnKeyPress, setSoundOnKeyPress] = useState(true);
  const [autoCapitalization, setAutoCapitalization] = useState(true);
  const [showNumberRow, setShowNumberRow] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Get current theme
  const currentTheme = THEMES[theme] || THEMES.default;

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('akai_mobile_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVibrateOnKeyPress(parsed.vibrate ?? true);
        setSoundOnKeyPress(parsed.sound ?? true);
        setAutoCapitalization(parsed.autoCap ?? true);
        setShowNumberRow(parsed.numberRow ?? true);
        setTheme(parsed.theme ?? 'default');
        setLanguage(parsed.language ?? 'english');
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem('akai_mobile_settings', JSON.stringify({
      vibrate: vibrateOnKeyPress,
      sound: soundOnKeyPress,
      autoCap: autoCapitalization,
      numberRow: showNumberRow,
      theme,
      language
    }));
  }, [vibrateOnKeyPress, soundOnKeyPress, autoCapitalization, showNumberRow, theme, language]);

  const doVibrate = useCallback((strength = 10) => {
    if (vibrateOnKeyPress && window.navigator.vibrate) {
      window.navigator.vibrate(strength);
    }
  }, [vibrateOnKeyPress]);

  const playClickSound = useCallback(() => {
    if (!soundOnKeyPress) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      // Audio context might be blocked
    }
  }, [soundOnKeyPress]);

  const updateText = useCallback((newText: string) => {
    setText(newText);
    
    // Update suggestions based on last word
    const words = newText.trim().split(/\s+/);
    const lastWord = words[words.length - 1]?.toLowerCase() || '';
    
    // Mock suggestions - in real app, use ML model or API
    if (lastWord.length > 0) {
      const mockSuggestions = [
        lastWord + 'ing',
        lastWord + 'ed',
        lastWord + 's'
      ];
      setSuggestions(mockSuggestions.slice(0, 3));
    } else {
      setSuggestions([]);
    }
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    doVibrate(10);
    playClickSound();

    if (key === 'backspace') {
      updateText(text.slice(0, -1));
    } else if (key === 'space') {
      updateText(text + ' ');
    } else if (key === 'enter') {
      updateText(text + '\n');
    } else {
      let char = key;
      
      // Auto-capitalization
      if (autoCapitalization && char.length === 1 && char.match(/[a-z]/)) {
        const trimmed = text.trim();
        const shouldCap = text === '' ||
          trimmed.endsWith('.') ||
          trimmed.endsWith('!') ||
          trimmed.endsWith('?') ||
          text.endsWith('\n');
        if (shouldCap) {
          char = char.toUpperCase();
        }
      }
      
      updateText(text + char);
    }
  }, [text, updateText, autoCapitalization, doVibrate, playClickSound]);

  const startVoiceRecognition = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Voice recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = language === 'english' ? 'en-US' : 'am-ET';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      setIsListening(false);
      console.error('Voice error:', e.error);
    };
    recognition.onresult = (e: any) => {
      const results: any[] = Array.from(e.results);
      const transcript = results.map((r: any) => r[0].transcript).join('');
      if (results[results.length - 1].isFinal) {
        updateText(text + (text && text[text.length - 1] !== ' ' ? ' ' : '') + transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, language, text, updateText]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    const words = text.trim().split(/\s+/);
    if (words.length > 0 && words[words.length - 1] !== '' && text && !text.endsWith(' ')) {
      words[words.length - 1] = suggestion;
      updateText(words.join(' ') + ' ');
    } else {
      updateText(text + suggestion + ' ');
    }
  }, [text, updateText]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Text Display Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          <motion.textarea
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full min-h-[200px] p-4 bg-card rounded-lg border border-border/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-lg"
            placeholder="Start typing..."
            value={text}
            onChange={(e) => updateText(e.target.value)}
          />
          
          {/* Stats */}
          <div className="mt-2 text-xs text-muted-foreground flex gap-4">
            <span>{text.length} characters</span>
            <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>
      </div>

      {/* Keyboard Area */}
      <div
        className={`relative ${currentTheme.bg} border-t border-border/30`}
        style={{
          height: mode === 'keyboard' ? 'auto' : '60vh',
          maxHeight: '70vh'
        }}
      >
        {/* Live Wallpaper Background */}
        {currentTheme.isLive && (
          <div className="absolute inset-0 pointer-events-none">
            <LiveWallpaper theme={theme} className="w-full h-full" />
          </div>
        )}

        <div className="relative z-10">
          {/* Suggestions Bar */}
          {mode === 'keyboard' && suggestions.length > 0 && (
            <div className={`flex gap-2 px-2 py-2 ${currentTheme.card} backdrop-blur-sm overflow-x-auto`}>
              {suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="ghost"
                  className={`${currentTheme.suggestion} ${currentTheme.keyText} whitespace-nowrap rounded-full`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          {/* Mode Content */}
          <AnimatePresence mode="wait">
            {mode === 'keyboard' && (
              <motion.div
                key="keyboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <SamsungKeyboardLayout
                  language={language}
                  onKeyPress={handleKeyPress}
                  theme={currentTheme}
                  showNumberRow={showNumberRow}
                />
              </motion.div>
            )}

            {mode === 'stickers' && (
              <motion.div
                key="stickers"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <StickerPanel
                  onSelect={(sticker) => {
                    updateText(text + sticker);
                    setMode('keyboard');
                  }}
                  theme={currentTheme}
                />
              </motion.div>
            )}

            {mode === 'gifs' && (
              <motion.div
                key="gifs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <GifPanel
                  onSelect={(gif) => {
                    updateText(text + ` [GIF: ${gif}] `);
                    setMode('keyboard');
                  }}
                  theme={currentTheme}
                />
              </motion.div>
            )}

            {mode === 'clipboard' && (
              <motion.div
                key="clipboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ClipboardPanel
                  onSelect={(clipText) => {
                    updateText(text + clipText);
                    setMode('keyboard');
                  }}
                  theme={currentTheme}
                />
              </motion.div>
            )}

            {mode === 'translate' && (
              <motion.div
                key="translate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <TranslatePanel
                  onTranslate={(translated) => {
                    updateText(text + translated);
                    setMode('keyboard');
                  }}
                  theme={currentTheme}
                  language={language}
                />
              </motion.div>
            )}

            {mode === 'themes' && (
              <motion.div
                key="themes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ThemeSelector
                  currentTheme={theme}
                  onSelectTheme={(newTheme) => {
                    setTheme(newTheme);
                    setMode('keyboard');
                  }}
                  onClose={() => setMode('keyboard')}
                />
              </motion.div>
            )}

            {mode === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className={`${currentTheme.card} backdrop-blur-sm p-6 h-full overflow-y-auto`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${currentTheme.keyText}`}>Settings</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMode('keyboard')}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={currentTheme.keyText}>Vibrate on key press</span>
                    <input
                      type="checkbox"
                      checked={vibrateOnKeyPress}
                      onChange={(e) => setVibrateOnKeyPress(e.target.checked)}
                      className="w-6 h-6"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={currentTheme.keyText}>Sound on key press</span>
                    <input
                      type="checkbox"
                      checked={soundOnKeyPress}
                      onChange={(e) => setSoundOnKeyPress(e.target.checked)}
                      className="w-6 h-6"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={currentTheme.keyText}>Auto-capitalization</span>
                    <input
                      type="checkbox"
                      checked={autoCapitalization}
                      onChange={(e) => setAutoCapitalization(e.target.checked)}
                      className="w-6 h-6"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={currentTheme.keyText}>Show number row</span>
                    <input
                      type="checkbox"
                      checked={showNumberRow}
                      onChange={(e) => setShowNumberRow(e.target.checked)}
                      className="w-6 h-6"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Navigation Bar */}
          <div className={`flex items-center justify-around ${currentTheme.tabBar} backdrop-blur-sm border-t border-border/30 py-3 px-2`}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode(mode === 'keyboard' ? 'stickers' : 'keyboard')}
              className={`flex flex-col items-center gap-1 ${mode === 'stickers' ? currentTheme.tabActive : ''} ${currentTheme.keyText}`}
            >
              <Smile className="w-5 h-5" />
              <span className="text-xs">Emoji</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode(mode === 'gifs' ? 'keyboard' : 'gifs')}
              className={`flex flex-col items-center gap-1 ${mode === 'gifs' ? currentTheme.tabActive : ''} ${currentTheme.keyText}`}
            >
              <Image className="w-5 h-5" />
              <span className="text-xs">GIF</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode(mode === 'clipboard' ? 'keyboard' : 'clipboard')}
              className={`flex flex-col items-center gap-1 ${mode === 'clipboard' ? currentTheme.tabActive : ''} ${currentTheme.keyText}`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="text-xs">Clips</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode(mode === 'translate' ? 'keyboard' : 'translate')}
              className={`flex flex-col items-center gap-1 ${mode === 'translate' ? currentTheme.tabActive : ''} ${currentTheme.keyText}`}
            >
              <Languages className="w-5 h-5" />
              <span className="text-xs">Translate</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={startVoiceRecognition}
              className={`flex flex-col items-center gap-1 ${isListening ? currentTheme.accent : ''} ${currentTheme.keyText}`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-xs">Voice</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode(mode === 'themes' ? 'keyboard' : 'themes')}
              className={`flex flex-col items-center gap-1 ${mode === 'themes' ? currentTheme.tabActive : ''} ${currentTheme.keyText}`}
            >
              <Palette className="w-5 h-5" />
              <span className="text-xs">Themes</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode(mode === 'settings' ? 'keyboard' : 'settings')}
              className={`flex flex-col items-center gap-1 ${mode === 'settings' ? currentTheme.tabActive : ''} ${currentTheme.keyText}`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
