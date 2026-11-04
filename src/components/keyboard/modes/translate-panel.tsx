'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Copy, Languages, Loader2, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ThemeDef } from '@/components/keyboard-data';

interface KeyboardTranslatePanelProps {
  t: ThemeDef;
  translateFrom: 'English' | 'Amharic';
  setTranslateFrom: (lang: 'English' | 'Amharic') => void;
  translateInput: string;
  setTranslateInput: (text: string) => void;
  translateOutput: string;
  setTranslateOutput: (text: string) => void;
  isTranslating: boolean;
  handleTranslate: () => void;
  handleUseTranslation: () => void;
}

export default function KeyboardTranslatePanel({
  t, translateFrom, setTranslateFrom, translateInput, setTranslateInput,
  translateOutput, setTranslateOutput, isTranslating, handleTranslate, handleUseTranslation,
}: KeyboardTranslatePanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
        <span className={`text-xs font-medium ${t.keyText} opacity-70`}>AI Translator</span>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm"
            onClick={() => { setTranslateFrom(translateFrom === 'English' ? 'Amharic' : 'English'); setTranslateInput(''); setTranslateOutput(''); }}
            className={`h-7 text-xs gap-1 ${t.keyText}`}>
            <ArrowRightLeft className="w-3 h-3" />Switch
          </Button>
        </motion.div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-center"><span className={`text-xs font-semibold ${t.keyText}`}>{translateFrom}</span></div>
          <ArrowRightLeft className={`w-4 h-4 ${t.keyText} opacity-50`} />
          <div className="flex-1 text-center"><span className={`text-xs font-semibold ${t.keyText}`}>{translateFrom === 'English' ? 'Amharic' : 'English'}</span></div>
        </div>
        <div className="space-y-2">
          <textarea value={translateInput} onChange={e => setTranslateInput(e.target.value)}
            placeholder={translateFrom === 'English' ? 'Type in English...' : 'በአማርኛ ይጻፉ...'}
            className={`w-full p-3 text-sm rounded-xl ${t.card} ${t.border} border focus:outline-none resize-none min-h-[60px] ${t.keyText} placeholder:opacity-40`}
            rows={2} />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleTranslate} disabled={isTranslating || !translateInput.trim()}
              className={`w-full gap-2 ${t.accent} ${t.accentText}`} size="sm">
              {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
              {isTranslating ? 'Translating...' : 'Translate'}
            </Button>
          </motion.div>
        </div>
        {translateOutput && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl ${t.accent}/10 ${t.border} border`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className={`text-xs font-medium mb-1 ${t.keyText}`}>Translation</p>
                <p className={`text-sm ${t.keyText}`}>{translateOutput}</p>
              </div>
              <div className="flex gap-1">
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" onClick={handleUseTranslation} className="h-7 w-7 p-0"><Send className="w-3 h-3" /></Button>
                  </motion.div>
                </TooltipTrigger><TooltipContent>Use in text</TooltipContent></Tooltip></TooltipProvider>
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(translateOutput)} className="h-7 w-7 p-0"><Copy className="w-3 h-3" /></Button>
                  </motion.div>
                </TooltipTrigger><TooltipContent>Copy</TooltipContent></Tooltip></TooltipProvider>
              </div>
            </div>
          </motion.div>
        )}
        <div className="mt-auto pt-2">
          <p className={`text-[10px] text-center ${t.keyText} opacity-40`}>
            <Sparkles className="w-3 h-3 inline-block mr-1" />Powered by AI • English ↔ Amharic
          </p>
        </div>
      </div>
    </div>
  );
}
