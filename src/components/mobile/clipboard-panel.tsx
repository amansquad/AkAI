'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, Copy } from 'lucide-react';
import type { ThemeDef } from '@/components/keyboard-data';

interface ClipboardPanelProps {
  onSelect: (text: string) => void;
  theme: ThemeDef;
}

interface ClipboardItem {
  id: string;
  text: string;
  timestamp: number;
}

export function ClipboardPanel({ onSelect, theme }: ClipboardPanelProps) {
  const [items, setItems] = useState<ClipboardItem[]>([]);

  // Load clipboard items from storage
  useEffect(() => {
    const saved = localStorage.getItem('akai_clipboard_items');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load clipboard items', e);
      }
    }
  }, []);

  // Save clipboard items to storage
  useEffect(() => {
    localStorage.setItem('akai_clipboard_items', JSON.stringify(items));
  }, [items]);

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleCopy = async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`${theme.card} backdrop-blur-sm border-b border-border/30 p-3`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${theme.keyText}`}>Clipboard History</h3>
          <span className={`text-sm ${theme.keyText} opacity-60`}>
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Clipboard items */}
      <ScrollArea className={`flex-1 ${theme.card} backdrop-blur-sm`}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <ClipboardList className={`w-16 h-16 ${theme.keyText} opacity-20 mb-4`} />
            <p className={`${theme.keyText} opacity-60`}>No clipboard items yet</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`
                  ${theme.key} ${theme.keyText}
                  rounded-lg p-3
                  border ${theme.border}
                `}
              >
                <button
                  onClick={() => onSelect(item.text)}
                  className="w-full text-left mb-2"
                >
                  <p className="line-clamp-3 text-sm">{item.text}</p>
                </button>

                <div className="flex items-center justify-between text-xs opacity-60">
                  <span>{formatTime(item.timestamp)}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(item.text)}
                      className="h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="h-6 px-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
