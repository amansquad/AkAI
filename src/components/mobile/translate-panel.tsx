'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft, Loader2, Volume2 } from 'lucide-react';
import type { ThemeDef } from '@/components/keyboard-data';
import type { Language } from './mobile-keyboard-app';

interface TranslatePanelProps {
  onTranslate: (text: string) => void;
  theme: ThemeDef;
  language: Language;
}

export function TranslatePanel({ onTranslate, theme, language }: TranslatePanelProps) {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLang, setSourceLang] = useState<'English' | 'Amharic'>('English');
  const [targetLang, setTargetLang] = useState<'English' | 'Amharic'>('Amharic');

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          sourceLang,
          targetLang
        })
      });

      const data = await response.json();
      setTranslatedText(data.translation || 'Translation failed.');
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Error connecting to translation service.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleSpeak = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'English' ? 'en-US' : 'am-ET';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`h-full flex flex-col ${theme.card} backdrop-blur-sm`}>
      {/* Language selector */}
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {sourceLang}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSwapLanguages}
          className="mx-2"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {targetLang}
        </Button>
      </div>

      {/* Source text */}
      <div className="flex-1 p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${theme.keyText}`}>Source</span>
          {sourceText && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSpeak(sourceText, sourceLang)}
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Enter text to translate..."
          className={`min-h-[120px] resize-none ${theme.key} ${theme.keyText} border-none`}
        />
      </div>

      {/* Translate button */}
      <div className="p-4 border-b border-border/30">
        <Button
          onClick={handleTranslate}
          disabled={!sourceText.trim() || isTranslating}
          className="w-full"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            'Translate'
          )}
        </Button>
      </div>

      {/* Translated text */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${theme.keyText}`}>Translation</span>
          {translatedText && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSpeak(translatedText, targetLang)}
              >
                <Volume2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => onTranslate(translatedText)}
              >
                Use
              </Button>
            </div>
          )}
        </div>
        <div className={`min-h-[120px] ${theme.key} ${theme.keyText} rounded-lg p-3`}>
          {translatedText || (
            <span className="opacity-60">Translation will appear here...</span>
          )}
        </div>
      </div>
    </div>
  );
}
