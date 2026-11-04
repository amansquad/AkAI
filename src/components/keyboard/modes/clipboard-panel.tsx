'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Copy, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ThemeDef } from '@/components/keyboard-data';

export interface ClipboardItem {
  id: string;
  text: string;
  timestamp: number;
}

interface KeyboardClipboardPanelProps {
  t: ThemeDef;
  text: string;
  clipboardItems: ClipboardItem[];
  setClipboardItems: React.Dispatch<React.SetStateAction<ClipboardItem[]>>;
  updateText: (newText: string) => void;
}

export default function KeyboardClipboardPanel({
  t, text, clipboardItems, setClipboardItems, updateText,
}: KeyboardClipboardPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
        <span className={`text-xs font-medium ${t.keyText} opacity-70`}>Clipboard History</span>
        <div className="flex items-center gap-1">
          {clipboardItems.length > 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" onClick={() => setClipboardItems([])}
                className={`h-7 text-xs gap-1 text-red-500`}>
                <Trash2 className="w-3 h-3" />Clear All
              </Button>
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="sm" onClick={() => { if (text.trim()) setClipboardItems(prev => [{ id: Date.now().toString(), text: text.trim(), timestamp: Date.now() }, ...prev]); }}
              className={`h-7 text-xs gap-1 ${t.keyText}`}>
              <Plus className="w-3 h-3" />Add Current
            </Button>
          </motion.div>
        </div>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        {clipboardItems.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full ${t.keyText} opacity-50`}>
            <ClipboardList className="w-8 h-8 mb-2" />
            <span className="text-xs">No clipboard items</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {clipboardItems.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 p-2.5 rounded-xl ${t.card} ${t.border} border shadow-sm group`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${t.keyText}`}>{item.text}</p>
                  <p className={`text-[10px] ${t.keyText} opacity-50 mt-0.5`}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" onClick={() => updateText(text + item.text)} className="h-7 w-7 p-0"><Copy className="w-3 h-3" /></Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" onClick={() => setClipboardItems(prev => prev.filter(i => i.id !== item.id))} className="h-7 w-7 p-0 text-red-500"><Trash2 className="w-3 h-3" /></Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
