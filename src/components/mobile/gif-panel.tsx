'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import type { ThemeDef } from '@/components/keyboard-data';

interface GifPanelProps {
  onSelect: (gifUrl: string) => void;
  theme: ThemeDef;
}

interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
  };
}

export function GifPanel({ onSelect, theme }: GifPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGifs = async () => {
      setLoading(true);
      try {
        const type = searchQuery ? 'search' : 'trending';
        const response = await fetch(`/api/giphy?type=${type}&q=${encodeURIComponent(searchQuery)}&limit=20`);
        const data = await response.json();
        setGifs(data.data || []);
      } catch (error) {
        console.error('Failed to fetch GIFs:', error);
        setGifs([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchGifs, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className={`${theme.card} backdrop-blur-sm border-b border-border/30 p-3`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search GIFs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* GIF grid */}
      <ScrollArea className={`flex-1 ${theme.card} backdrop-blur-sm`}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-3">
            {gifs.map((gif) => (
              <motion.button
                key={gif.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(gif.images.fixed_height.url)}
                className={`
                  ${theme.key}
                  rounded-lg overflow-hidden
                  aspect-video
                  hover:ring-2 hover:ring-primary
                  transition-all
                `}
              >
                <img
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
