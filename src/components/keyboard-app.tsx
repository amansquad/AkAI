'use client';

import React, { useState, useCallback, useRef, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard, Smile, Image, ClipboardList, Languages,
  Delete, CornerDownLeft, Copy, Trash2, Plus,
  ArrowRightLeft, Loader2, Sparkles, Send, Globe,
  ArrowUp, Pen, Palette, X, Settings, Sun, Moon, Monitor, Wand2, ImagePlus,
  SquareCheck, LogOut, Undo2, Redo2, Zap, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';

export type KeyboardMode = 'keyboard' | 'stickers' | 'gifs' | 'clipboard' | 'translate' | 'handwriting' | 'settings' | 'themes';
export type Language = 'english' | 'amharic';
export type ThemeName = string;

interface KeyboardAppProps {
  onTextChange?: (text: string) => void;
}

interface ThemeDef {
  name: string; flag: string;
  bg: string; card: string; key: string; keyHover: string; keyActive: string; keyText: string;
  specialKey: string; accent: string; accentText: string; border: string;
  tabBar: string; tabActive: string; tabActiveText: string; suggestion: string;
  isLive?: boolean; liveClass?: string; category?: 'solid' | 'live' | 'custom';
}

interface CustomThemeData {
  id: string; name: string;
  bgColor: string; keyColor: string; keyTextColor: string; accentColor: string; specialKeyColor: string;
  bgImageUrl?: string; bgGifUrl?: string;
}

interface GiphyGif {
  id: string;
  url: string;
  title: string;
  images: { fixed_height: { url: string } };
  _fallback?: { emoji: string; label: string };
}

// ─── Theme Definitions ────────────────────────────────────────────────────
const THEMES: Record<string, ThemeDef> = {
  default: {
    name: 'Classic', flag: '⬜', category: 'solid',
    bg: 'bg-background', card: 'bg-card', key: 'bg-card', keyHover: 'hover:bg-accent',
    keyActive: 'bg-primary text-primary-foreground', keyText: 'text-foreground',
    specialKey: 'bg-muted/80', accent: 'bg-primary', accentText: 'text-primary-foreground',
    border: 'border-border/50', tabBar: 'bg-muted/20', tabActive: 'bg-primary', tabActiveText: 'text-primary-foreground',
    suggestion: 'bg-muted/60',
  },
  midnight: {
    name: 'Midnight', flag: '🌙', category: 'solid',
    bg: 'bg-slate-950', card: 'bg-slate-900', key: 'bg-slate-800', keyHover: 'hover:bg-slate-700',
    keyActive: 'bg-violet-600 text-white', keyText: 'text-slate-100',
    specialKey: 'bg-slate-700', accent: 'bg-violet-600', accentText: 'text-white',
    border: 'border-slate-700/50', tabBar: 'bg-slate-900', tabActive: 'bg-violet-600', tabActiveText: 'text-white',
    suggestion: 'bg-slate-800',
  },
  ocean: {
    name: 'Ocean', flag: '🌊', category: 'solid',
    bg: 'bg-cyan-950', card: 'bg-cyan-900', key: 'bg-cyan-800', keyHover: 'hover:bg-cyan-700',
    keyActive: 'bg-teal-500 text-white', keyText: 'text-cyan-50',
    specialKey: 'bg-cyan-700', accent: 'bg-teal-500', accentText: 'text-white',
    border: 'border-cyan-700/50', tabBar: 'bg-cyan-900', tabActive: 'bg-teal-500', tabActiveText: 'text-white',
    suggestion: 'bg-cyan-800',
  },
  sunset: {
    name: 'Sunset', flag: '🌅', category: 'solid',
    bg: 'bg-orange-950', card: 'bg-orange-900', key: 'bg-orange-800', keyHover: 'hover:bg-orange-700',
    keyActive: 'bg-amber-500 text-white', keyText: 'text-orange-50',
    specialKey: 'bg-orange-700', accent: 'bg-amber-500', accentText: 'text-white',
    border: 'border-orange-700/50', tabBar: 'bg-orange-900', tabActive: 'bg-amber-500', tabActiveText: 'text-white',
    suggestion: 'bg-orange-800',
  },
  forest: {
    name: 'Forest', flag: '🌿', category: 'solid',
    bg: 'bg-green-950', card: 'bg-green-900', key: 'bg-green-800', keyHover: 'hover:bg-green-700',
    keyActive: 'bg-emerald-500 text-white', keyText: 'text-green-50',
    specialKey: 'bg-green-700', accent: 'bg-emerald-500', accentText: 'text-white',
    border: 'border-green-700/50', tabBar: 'bg-green-900', tabActive: 'bg-emerald-500', tabActiveText: 'text-white',
    suggestion: 'bg-green-800',
  },
  ethiopian: {
    name: 'Ethiopian', flag: '🇪🇹', category: 'solid',
    bg: 'bg-gradient-to-b from-green-900 to-yellow-900', card: 'bg-green-800/80', key: 'bg-green-700', keyHover: 'hover:bg-yellow-600',
    keyActive: 'bg-yellow-500 text-green-900', keyText: 'text-green-50',
    specialKey: 'bg-yellow-700', accent: 'bg-yellow-500', accentText: 'text-green-900',
    border: 'border-yellow-600/50', tabBar: 'bg-green-900', tabActive: 'bg-yellow-500', tabActiveText: 'text-green-900',
    suggestion: 'bg-green-700',
  },
  rose: {
    name: 'Rose', flag: '🌹', category: 'solid',
    bg: 'bg-rose-950', card: 'bg-rose-900', key: 'bg-rose-800', keyHover: 'hover:bg-rose-700',
    keyActive: 'bg-pink-500 text-white', keyText: 'text-rose-50',
    specialKey: 'bg-rose-700', accent: 'bg-pink-500', accentText: 'text-white',
    border: 'border-rose-700/50', tabBar: 'bg-rose-900', tabActive: 'bg-pink-500', tabActiveText: 'text-white',
    suggestion: 'bg-rose-800',
  },
  neon: {
    name: 'Neon', flag: '💜', category: 'solid',
    bg: 'bg-gray-950', card: 'bg-gray-900', key: 'bg-gray-800', keyHover: 'hover:bg-gray-700',
    keyActive: 'bg-lime-400 text-gray-950', keyText: 'text-gray-100',
    specialKey: 'bg-gray-700', accent: 'bg-lime-400', accentText: 'text-gray-950',
    border: 'border-gray-700/50', tabBar: 'bg-gray-900', tabActive: 'bg-lime-400', tabActiveText: 'text-gray-950',
    suggestion: 'bg-gray-800',
  },
  candy: {
    name: 'Candy', flag: '🍬', category: 'solid',
    bg: 'bg-fuchsia-950', card: 'bg-fuchsia-900', key: 'bg-fuchsia-800', keyHover: 'hover:bg-fuchsia-700',
    keyActive: 'bg-pink-400 text-white', keyText: 'text-fuchsia-50',
    specialKey: 'bg-fuchsia-700', accent: 'bg-pink-400', accentText: 'text-white',
    border: 'border-fuchsia-700/50', tabBar: 'bg-fuchsia-900', tabActive: 'bg-pink-400', tabActiveText: 'text-white',
    suggestion: 'bg-fuchsia-800',
  },
  arctic: {
    name: 'Arctic', flag: '❄️', category: 'solid',
    bg: 'bg-sky-950', card: 'bg-sky-900', key: 'bg-sky-800', keyHover: 'hover:bg-sky-700',
    keyActive: 'bg-sky-400 text-sky-950', keyText: 'text-sky-50',
    specialKey: 'bg-sky-700', accent: 'bg-sky-400', accentText: 'text-sky-950',
    border: 'border-sky-700/50', tabBar: 'bg-sky-900', tabActive: 'bg-sky-400', tabActiveText: 'text-sky-950',
    suggestion: 'bg-sky-800',
  },
  cherry: {
    name: 'Cherry', flag: '🍒', category: 'solid',
    bg: 'bg-red-950', card: 'bg-red-900', key: 'bg-red-800', keyHover: 'hover:bg-red-700',
    keyActive: 'bg-red-400 text-white', keyText: 'text-red-50',
    specialKey: 'bg-red-700', accent: 'bg-red-400', accentText: 'text-white',
    border: 'border-red-700/50', tabBar: 'bg-red-900', tabActive: 'bg-red-400', tabActiveText: 'text-white',
    suggestion: 'bg-red-800',
  },
  sand: {
    name: 'Sand', flag: '🏜️', category: 'solid',
    bg: 'bg-amber-950', card: 'bg-amber-900', key: 'bg-amber-800', keyHover: 'hover:bg-amber-700',
    keyActive: 'bg-amber-400 text-amber-950', keyText: 'text-amber-50',
    specialKey: 'bg-amber-700', accent: 'bg-amber-400', accentText: 'text-amber-950',
    border: 'border-amber-700/50', tabBar: 'bg-amber-900', tabActive: 'bg-amber-400', tabActiveText: 'text-amber-950',
    suggestion: 'bg-amber-800',
  },
  lavender: {
    name: 'Lavender', flag: '💐', category: 'solid',
    bg: 'bg-purple-950', card: 'bg-purple-900', key: 'bg-purple-800', keyHover: 'hover:bg-purple-700',
    keyActive: 'bg-purple-400 text-white', keyText: 'text-purple-50',
    specialKey: 'bg-purple-700', accent: 'bg-purple-400', accentText: 'text-white',
    border: 'border-purple-700/50', tabBar: 'bg-purple-900', tabActive: 'bg-purple-400', tabActiveText: 'text-white',
    suggestion: 'bg-purple-800',
  },
  teal: {
    name: 'Teal', flag: '🦚', category: 'solid',
    bg: 'bg-teal-950', card: 'bg-teal-900', key: 'bg-teal-800', keyHover: 'hover:bg-teal-700',
    keyActive: 'bg-teal-400 text-teal-950', keyText: 'text-teal-50',
    specialKey: 'bg-teal-700', accent: 'bg-teal-400', accentText: 'text-teal-950',
    border: 'border-teal-700/50', tabBar: 'bg-teal-900', tabActive: 'bg-teal-400', tabActiveText: 'text-teal-950',
    suggestion: 'bg-teal-800',
  },
  crimson: {
    name: 'Crimson', flag: '🔮', category: 'solid',
    bg: 'bg-rose-950', card: 'bg-rose-900', key: 'bg-rose-800', keyHover: 'hover:bg-rose-700',
    keyActive: 'bg-rose-400 text-white', keyText: 'text-rose-50',
    specialKey: 'bg-rose-700', accent: 'bg-rose-400', accentText: 'text-white',
    border: 'border-rose-700/50', tabBar: 'bg-rose-900', tabActive: 'bg-rose-400', tabActiveText: 'text-white',
    suggestion: 'bg-rose-800',
  },
  moss: {
    name: 'Moss', flag: '🌱', category: 'solid',
    bg: 'bg-lime-950', card: 'bg-lime-900', key: 'bg-lime-800', keyHover: 'hover:bg-lime-700',
    keyActive: 'bg-lime-400 text-lime-950', keyText: 'text-lime-50',
    specialKey: 'bg-lime-700', accent: 'bg-lime-400', accentText: 'text-lime-950',
    border: 'border-lime-700/50', tabBar: 'bg-lime-900', tabActive: 'bg-lime-400', tabActiveText: 'text-lime-950',
    suggestion: 'bg-lime-800',
  },
  storm: {
    name: 'Storm', flag: '⛈️', category: 'solid',
    bg: 'bg-zinc-950', card: 'bg-zinc-900', key: 'bg-zinc-800', keyHover: 'hover:bg-zinc-700',
    keyActive: 'bg-zinc-400 text-zinc-950', keyText: 'text-zinc-100',
    specialKey: 'bg-zinc-700', accent: 'bg-zinc-400', accentText: 'text-zinc-950',
    border: 'border-zinc-700/50', tabBar: 'bg-zinc-900', tabActive: 'bg-zinc-400', tabActiveText: 'text-zinc-950',
    suggestion: 'bg-zinc-800',
  },
  peach: {
    name: 'Peach', flag: '🍑', category: 'solid',
    bg: 'bg-orange-950', card: 'bg-orange-900', key: 'bg-orange-800', keyHover: 'hover:bg-orange-700',
    keyActive: 'bg-orange-300 text-orange-950', keyText: 'text-orange-50',
    specialKey: 'bg-orange-700', accent: 'bg-orange-300', accentText: 'text-orange-950',
    border: 'border-orange-700/50', tabBar: 'bg-orange-900', tabActive: 'bg-orange-300', tabActiveText: 'text-orange-950',
    suggestion: 'bg-orange-800',
  },
  indigo: {
    name: 'Indigo', flag: '🔵', category: 'solid',
    bg: 'bg-blue-950', card: 'bg-blue-900', key: 'bg-blue-800', keyHover: 'hover:bg-blue-700',
    keyActive: 'bg-blue-400 text-white', keyText: 'text-blue-50',
    specialKey: 'bg-blue-700', accent: 'bg-blue-400', accentText: 'text-white',
    border: 'border-blue-700/50', tabBar: 'bg-blue-900', tabActive: 'bg-blue-400', tabActiveText: 'text-white',
    suggestion: 'bg-blue-800',
  },
  gold: {
    name: 'Gold', flag: '👑', category: 'solid',
    bg: 'bg-yellow-950', card: 'bg-yellow-900', key: 'bg-yellow-800', keyHover: 'hover:bg-yellow-700',
    keyActive: 'bg-yellow-400 text-yellow-950', keyText: 'text-yellow-50',
    specialKey: 'bg-yellow-700', accent: 'bg-yellow-400', accentText: 'text-yellow-950',
    border: 'border-yellow-700/50', tabBar: 'bg-yellow-900', tabActive: 'bg-yellow-400', tabActiveText: 'text-yellow-950',
    suggestion: 'bg-yellow-800',
  },
  // ─── NEW SOLID THEMES ──────────────────────────────────────────────────
  volcano: {
    name: 'Volcano', flag: '🌋', category: 'solid',
    bg: 'bg-red-950', card: 'bg-red-900', key: 'bg-red-800', keyHover: 'hover:bg-orange-700',
    keyActive: 'bg-orange-500 text-white', keyText: 'text-red-50',
    specialKey: 'bg-red-700', accent: 'bg-orange-500', accentText: 'text-white',
    border: 'border-red-700/50', tabBar: 'bg-red-900', tabActive: 'bg-orange-500', tabActiveText: 'text-white',
    suggestion: 'bg-red-800',
  },
  carbon: {
    name: 'Carbon', flag: '🖤', category: 'solid',
    bg: 'bg-neutral-950', card: 'bg-neutral-900', key: 'bg-neutral-800', keyHover: 'hover:bg-neutral-700',
    keyActive: 'bg-neutral-300 text-neutral-950', keyText: 'text-neutral-100',
    specialKey: 'bg-neutral-700', accent: 'bg-neutral-300', accentText: 'text-neutral-950',
    border: 'border-neutral-700/50', tabBar: 'bg-neutral-900', tabActive: 'bg-neutral-300', tabActiveText: 'text-neutral-950',
    suggestion: 'bg-neutral-800',
  },
  sapphire: {
    name: 'Sapphire', flag: '💎', category: 'solid',
    bg: 'bg-blue-950', card: 'bg-blue-900', key: 'bg-blue-800', keyHover: 'hover:bg-blue-700',
    keyActive: 'bg-blue-300 text-blue-950', keyText: 'text-blue-50',
    specialKey: 'bg-blue-700', accent: 'bg-blue-300', accentText: 'text-blue-950',
    border: 'border-blue-700/50', tabBar: 'bg-blue-900', tabActive: 'bg-blue-300', tabActiveText: 'text-blue-950',
    suggestion: 'bg-blue-800',
  },
  coral: {
    name: 'Coral', flag: '🪸', category: 'solid',
    bg: 'bg-orange-950', card: 'bg-orange-900', key: 'bg-orange-800', keyHover: 'hover:bg-pink-700',
    keyActive: 'bg-pink-400 text-white', keyText: 'text-orange-50',
    specialKey: 'bg-orange-700', accent: 'bg-pink-400', accentText: 'text-white',
    border: 'border-orange-700/50', tabBar: 'bg-orange-900', tabActive: 'bg-pink-400', tabActiveText: 'text-white',
    suggestion: 'bg-orange-800',
  },
  jade: {
    name: 'Jade', flag: '🟢', category: 'solid',
    bg: 'bg-emerald-950', card: 'bg-emerald-900', key: 'bg-emerald-800', keyHover: 'hover:bg-emerald-700',
    keyActive: 'bg-emerald-400 text-emerald-950', keyText: 'text-emerald-50',
    specialKey: 'bg-emerald-700', accent: 'bg-emerald-400', accentText: 'text-emerald-950',
    border: 'border-emerald-700/50', tabBar: 'bg-emerald-900', tabActive: 'bg-emerald-400', tabActiveText: 'text-emerald-950',
    suggestion: 'bg-emerald-800',
  },
  ruby: {
    name: 'Ruby', flag: '♦️', category: 'solid',
    bg: 'bg-red-950', card: 'bg-red-900', key: 'bg-red-800', keyHover: 'hover:bg-red-600',
    keyActive: 'bg-red-300 text-red-950', keyText: 'text-red-50',
    specialKey: 'bg-red-700', accent: 'bg-red-300', accentText: 'text-red-950',
    border: 'border-red-700/50', tabBar: 'bg-red-900', tabActive: 'bg-red-300', tabActiveText: 'text-red-950',
    suggestion: 'bg-red-800',
  },
  platinum: {
    name: 'Platinum', flag: '🪩', category: 'solid',
    bg: 'bg-gray-100', card: 'bg-gray-200', key: 'bg-gray-300', keyHover: 'hover:bg-gray-400',
    keyActive: 'bg-gray-600 text-white', keyText: 'text-gray-800',
    specialKey: 'bg-gray-400', accent: 'bg-gray-600', accentText: 'text-white',
    border: 'border-gray-400/50', tabBar: 'bg-gray-100', tabActive: 'bg-gray-600', tabActiveText: 'text-white',
    suggestion: 'bg-gray-300',
  },
  copper: {
    name: 'Copper', flag: '🟤', category: 'solid',
    bg: 'bg-amber-950', card: 'bg-amber-900', key: 'bg-amber-800', keyHover: 'hover:bg-amber-600',
    keyActive: 'bg-amber-300 text-amber-950', keyText: 'text-amber-50',
    specialKey: 'bg-amber-700', accent: 'bg-amber-300', accentText: 'text-amber-950',
    border: 'border-amber-700/50', tabBar: 'bg-amber-900', tabActive: 'bg-amber-300', tabActiveText: 'text-amber-950',
    suggestion: 'bg-amber-800',
  },
  emerald: {
    name: 'Emerald', flag: '💚', category: 'solid',
    bg: 'bg-green-950', card: 'bg-green-900', key: 'bg-green-800', keyHover: 'hover:bg-green-600',
    keyActive: 'bg-green-300 text-green-950', keyText: 'text-green-50',
    specialKey: 'bg-green-700', accent: 'bg-green-300', accentText: 'text-green-950',
    border: 'border-green-700/50', tabBar: 'bg-green-900', tabActive: 'bg-green-300', tabActiveText: 'text-green-950',
    suggestion: 'bg-green-800',
  },
  marble: {
    name: 'Marble', flag: '🏛️', category: 'solid',
    bg: 'bg-stone-100', card: 'bg-stone-200', key: 'bg-stone-300', keyHover: 'hover:bg-stone-400',
    keyActive: 'bg-stone-600 text-white', keyText: 'text-stone-800',
    specialKey: 'bg-stone-400', accent: 'bg-stone-600', accentText: 'text-white',
    border: 'border-stone-400/50', tabBar: 'bg-stone-100', tabActive: 'bg-stone-600', tabActiveText: 'text-white',
    suggestion: 'bg-stone-300',
  },
  obsidian: {
    name: 'Obsidian', flag: '⬛', category: 'solid',
    bg: 'bg-black', card: 'bg-gray-950', key: 'bg-gray-900', keyHover: 'hover:bg-gray-800',
    keyActive: 'bg-gray-500 text-white', keyText: 'text-gray-100',
    specialKey: 'bg-gray-800', accent: 'bg-gray-500', accentText: 'text-white',
    border: 'border-gray-800/50', tabBar: 'bg-black', tabActive: 'bg-gray-500', tabActiveText: 'text-white',
    suggestion: 'bg-gray-900',
  },
  turquoise: {
    name: 'Turquoise', flag: '💠', category: 'solid',
    bg: 'bg-teal-950', card: 'bg-teal-900', key: 'bg-teal-800', keyHover: 'hover:bg-teal-600',
    keyActive: 'bg-teal-300 text-teal-950', keyText: 'text-teal-50',
    specialKey: 'bg-teal-700', accent: 'bg-teal-300', accentText: 'text-teal-950',
    border: 'border-teal-700/50', tabBar: 'bg-teal-900', tabActive: 'bg-teal-300', tabActiveText: 'text-teal-950',
    suggestion: 'bg-teal-800',
  },
  magenta: {
    name: 'Magenta', flag: '🩷', category: 'solid',
    bg: 'bg-pink-950', card: 'bg-pink-900', key: 'bg-pink-800', keyHover: 'hover:bg-pink-700',
    keyActive: 'bg-pink-400 text-white', keyText: 'text-pink-50',
    specialKey: 'bg-pink-700', accent: 'bg-pink-400', accentText: 'text-white',
    border: 'border-pink-700/50', tabBar: 'bg-pink-900', tabActive: 'bg-pink-400', tabActiveText: 'text-white',
    suggestion: 'bg-pink-800',
  },
  cinnamon: {
    name: 'Cinnamon', flag: '🫎', category: 'solid',
    bg: 'bg-stone-950', card: 'bg-stone-900', key: 'bg-stone-800', keyHover: 'hover:bg-stone-700',
    keyActive: 'bg-amber-600 text-white', keyText: 'text-stone-100',
    specialKey: 'bg-stone-700', accent: 'bg-amber-600', accentText: 'text-white',
    border: 'border-stone-700/50', tabBar: 'bg-stone-900', tabActive: 'bg-amber-600', tabActiveText: 'text-white',
    suggestion: 'bg-stone-800',
  },
  slate: {
    name: 'Slate', flag: '🪨', category: 'solid',
    bg: 'bg-slate-950', card: 'bg-slate-900', key: 'bg-slate-800', keyHover: 'hover:bg-slate-600',
    keyActive: 'bg-slate-300 text-slate-950', keyText: 'text-slate-50',
    specialKey: 'bg-slate-700', accent: 'bg-slate-300', accentText: 'text-slate-950',
    border: 'border-slate-700/50', tabBar: 'bg-slate-900', tabActive: 'bg-slate-300', tabActiveText: 'text-slate-950',
    suggestion: 'bg-slate-800',
  },
  honey: {
    name: 'Honey', flag: '🍯', category: 'solid',
    bg: 'bg-yellow-950', card: 'bg-yellow-900', key: 'bg-yellow-800', keyHover: 'hover:bg-yellow-600',
    keyActive: 'bg-yellow-300 text-yellow-950', keyText: 'text-yellow-50',
    specialKey: 'bg-yellow-700', accent: 'bg-yellow-300', accentText: 'text-yellow-950',
    border: 'border-yellow-700/50', tabBar: 'bg-yellow-900', tabActive: 'bg-yellow-300', tabActiveText: 'text-yellow-950',
    suggestion: 'bg-yellow-800',
  },
  abyss: {
    name: 'Abyss', flag: '🕳️', category: 'solid',
    bg: 'bg-gray-950', card: 'bg-gray-900', key: 'bg-gray-800', keyHover: 'hover:bg-blue-900',
    keyActive: 'bg-blue-600 text-white', keyText: 'text-gray-100',
    specialKey: 'bg-gray-800', accent: 'bg-blue-600', accentText: 'text-white',
    border: 'border-gray-800/50', tabBar: 'bg-gray-950', tabActive: 'bg-blue-600', tabActiveText: 'text-white',
    suggestion: 'bg-gray-800',
  },
  frost: {
    name: 'Frost', flag: '🧊', category: 'solid',
    bg: 'bg-sky-50', card: 'bg-sky-100', key: 'bg-sky-200', keyHover: 'hover:bg-sky-300',
    keyActive: 'bg-sky-600 text-white', keyText: 'text-sky-900',
    specialKey: 'bg-sky-300', accent: 'bg-sky-600', accentText: 'text-white',
    border: 'border-sky-300/50', tabBar: 'bg-sky-50', tabActive: 'bg-sky-600', tabActiveText: 'text-white',
    suggestion: 'bg-sky-200',
  },
  blossom: {
    name: 'Blossom', flag: '🌸', category: 'solid',
    bg: 'bg-pink-50', card: 'bg-pink-100', key: 'bg-pink-200', keyHover: 'hover:bg-pink-300',
    keyActive: 'bg-pink-600 text-white', keyText: 'text-pink-900',
    specialKey: 'bg-pink-300', accent: 'bg-pink-600', accentText: 'text-white',
    border: 'border-pink-300/50', tabBar: 'bg-pink-50', tabActive: 'bg-pink-600', tabActiveText: 'text-white',
    suggestion: 'bg-pink-200',
  },
  // ─── LIVE THEMES ──────────────────────────────────────────────────────
  aurora_live: {
    name: 'Aurora', flag: '🌌', category: 'live', isLive: true, liveClass: 'theme-aurora-live',
    bg: 'bg-slate-950', card: 'bg-slate-900/80', key: 'bg-slate-800/90', keyHover: 'hover:bg-cyan-700',
    keyActive: 'bg-cyan-400 text-gray-950', keyText: 'text-cyan-50',
    specialKey: 'bg-slate-700', accent: 'bg-cyan-400', accentText: 'text-gray-950',
    border: 'border-cyan-700/30', tabBar: 'bg-slate-900/80', tabActive: 'bg-cyan-400', tabActiveText: 'text-gray-950',
    suggestion: 'bg-slate-800/80',
  },
  lava_live: {
    name: 'Lava', flag: '🌋', category: 'live', isLive: true, liveClass: 'theme-lava-live',
    bg: 'bg-red-950', card: 'bg-red-900/80', key: 'bg-red-800/90', keyHover: 'hover:bg-orange-600',
    keyActive: 'bg-orange-400 text-red-950', keyText: 'text-orange-50',
    specialKey: 'bg-red-700', accent: 'bg-orange-400', accentText: 'text-red-950',
    border: 'border-orange-700/30', tabBar: 'bg-red-900/80', tabActive: 'bg-orange-400', tabActiveText: 'text-red-950',
    suggestion: 'bg-red-800/80',
  },
  ocean_live: {
    name: 'Ocean Wave', flag: '🌊', category: 'live', isLive: true, liveClass: 'theme-ocean-live',
    bg: 'bg-blue-950', card: 'bg-blue-900/80', key: 'bg-blue-800/90', keyHover: 'hover:bg-cyan-700',
    keyActive: 'bg-cyan-400 text-blue-950', keyText: 'text-cyan-50',
    specialKey: 'bg-blue-700', accent: 'bg-cyan-400', accentText: 'text-blue-950',
    border: 'border-cyan-700/30', tabBar: 'bg-blue-900/80', tabActive: 'bg-cyan-400', tabActiveText: 'text-blue-950',
    suggestion: 'bg-blue-800/80',
  },
  neon_pulse: {
    name: 'Neon Pulse', flag: '⚡', category: 'live', isLive: true, liveClass: 'theme-neon-pulse-live',
    bg: 'bg-gray-950', card: 'bg-gray-900/80', key: 'bg-gray-800/90', keyHover: 'hover:bg-violet-700',
    keyActive: 'bg-violet-400 text-gray-950', keyText: 'text-violet-100',
    specialKey: 'bg-gray-700', accent: 'bg-violet-400', accentText: 'text-gray-950',
    border: 'border-violet-700/30', tabBar: 'bg-gray-900/80', tabActive: 'bg-violet-400', tabActiveText: 'text-gray-950',
    suggestion: 'bg-gray-800/80',
  },
  sunset_live: {
    name: 'Sunset Glow', flag: '🌇', category: 'live', isLive: true, liveClass: 'theme-sunset-live',
    bg: 'bg-orange-950', card: 'bg-orange-900/80', key: 'bg-orange-800/90', keyHover: 'hover:bg-pink-700',
    keyActive: 'bg-pink-400 text-white', keyText: 'text-orange-50',
    specialKey: 'bg-orange-700', accent: 'bg-pink-400', accentText: 'text-white',
    border: 'border-pink-700/30', tabBar: 'bg-orange-900/80', tabActive: 'bg-pink-400', tabActiveText: 'text-white',
    suggestion: 'bg-orange-800/80',
  },
  matrix_live: {
    name: 'Matrix', flag: '🟩', category: 'live', isLive: true, liveClass: 'theme-matrix-live',
    bg: 'bg-black', card: 'bg-green-950/80', key: 'bg-green-900/90', keyHover: 'hover:bg-green-700',
    keyActive: 'bg-green-400 text-black', keyText: 'text-green-100',
    specialKey: 'bg-green-900', accent: 'bg-green-400', accentText: 'text-black',
    border: 'border-green-700/30', tabBar: 'bg-black/80', tabActive: 'bg-green-400', tabActiveText: 'text-black',
    suggestion: 'bg-green-900/80',
  },
  rainbow_live: {
    name: 'Rainbow', flag: '🌈', category: 'live', isLive: true, liveClass: 'theme-rainbow-live',
    bg: 'bg-gray-950', card: 'bg-gray-900/80', key: 'bg-gray-800/90', keyHover: 'hover:bg-gray-700',
    keyActive: 'bg-white text-gray-950', keyText: 'text-white',
    specialKey: 'bg-gray-700', accent: 'bg-white', accentText: 'text-gray-950',
    border: 'border-white/20', tabBar: 'bg-gray-900/80', tabActive: 'bg-white', tabActiveText: 'text-gray-950',
    suggestion: 'bg-gray-800/80',
  },
  fire_live: {
    name: 'Fire', flag: '🔥', category: 'live', isLive: true, liveClass: 'theme-fire-live',
    bg: 'bg-red-950', card: 'bg-red-900/80', key: 'bg-red-800/90', keyHover: 'hover:bg-yellow-700',
    keyActive: 'bg-yellow-400 text-red-950', keyText: 'text-yellow-50',
    specialKey: 'bg-red-700', accent: 'bg-yellow-400', accentText: 'text-red-950',
    border: 'border-yellow-700/30', tabBar: 'bg-red-900/80', tabActive: 'bg-yellow-400', tabActiveText: 'text-red-950',
    suggestion: 'bg-red-800/80',
  },
  galaxy_live: {
    name: 'Galaxy', flag: '🪐', category: 'live', isLive: true, liveClass: 'theme-galaxy-live',
    bg: 'bg-purple-950', card: 'bg-purple-900/80', key: 'bg-purple-800/90', keyHover: 'hover:bg-indigo-700',
    keyActive: 'bg-indigo-400 text-white', keyText: 'text-purple-100',
    specialKey: 'bg-purple-700', accent: 'bg-indigo-400', accentText: 'text-white',
    border: 'border-indigo-700/30', tabBar: 'bg-purple-900/80', tabActive: 'bg-indigo-400', tabActiveText: 'text-white',
    suggestion: 'bg-purple-800/80',
  },
  waterfall_live: {
    name: 'Waterfall', flag: '💧', category: 'live', isLive: true, liveClass: 'theme-waterfall-live',
    bg: 'bg-teal-950', card: 'bg-teal-900/80', key: 'bg-teal-800/90', keyHover: 'hover:bg-cyan-600',
    keyActive: 'bg-cyan-300 text-teal-950', keyText: 'text-teal-50',
    specialKey: 'bg-teal-700', accent: 'bg-cyan-300', accentText: 'text-teal-950',
    border: 'border-cyan-600/30', tabBar: 'bg-teal-900/80', tabActive: 'bg-cyan-300', tabActiveText: 'text-teal-950',
    suggestion: 'bg-teal-800/80',
  },
  autumn_live: {
    name: 'Autumn', flag: '🍂', category: 'live', isLive: true, liveClass: 'theme-autumn-live',
    bg: 'bg-orange-950', card: 'bg-orange-900/80', key: 'bg-orange-800/90', keyHover: 'hover:bg-amber-600',
    keyActive: 'bg-amber-400 text-orange-950', keyText: 'text-orange-50',
    specialKey: 'bg-orange-700', accent: 'bg-amber-400', accentText: 'text-orange-950',
    border: 'border-amber-600/30', tabBar: 'bg-orange-900/80', tabActive: 'bg-amber-400', tabActiveText: 'text-orange-950',
    suggestion: 'bg-orange-800/80',
  },
  cyberpunk_live: {
    name: 'Cyberpunk', flag: '🤖', category: 'live', isLive: true, liveClass: 'theme-cyberpunk-live',
    bg: 'bg-gray-950', card: 'bg-gray-900/80', key: 'bg-gray-800/90', keyHover: 'hover:bg-pink-700',
    keyActive: 'bg-pink-400 text-gray-950', keyText: 'text-cyan-100',
    specialKey: 'bg-gray-700', accent: 'bg-pink-400', accentText: 'text-gray-950',
    border: 'border-cyan-500/30', tabBar: 'bg-gray-900/80', tabActive: 'bg-pink-400', tabActiveText: 'text-gray-950',
    suggestion: 'bg-gray-800/80',
  },
};

// ─── Long Press Alternates ────────────────────────────────────────────────
const LONG_PRESS_ALTERNATES: Record<string, string[]> = {
  'a': ['@', 'á', 'à', 'ä', 'ã', 'â'],
  'e': ['é', 'è', 'ë', 'ê', '3'],
  'i': ['í', 'ì', 'ï', 'î', '8'],
  'o': ['ó', 'ò', 'ö', 'õ', 'ô', '9'],
  'u': ['ú', 'ù', 'ü', 'û', '7'],
  'c': ['ç', 'ć', 'č'],
  'n': ['ñ', 'ń', 'ň'],
  's': ['ß', 'ś', 'š'],
  '.': [',', ';', ':', '!', '?'],
  ',': [';', ':', '!', '?', '.'],
};

// ─── Amharic Character Data ───────────────────────────────────────────────
const AMHARIC_ROWS: string[][] = [
  ['ሀ', 'ለ', 'ሐ', 'መ', 'ሠ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ'],
  ['ተ', 'ቸ', 'ኀ', 'ነ', 'ኘ', 'አ', 'ከ', 'ኸ', 'ወ', 'ዘ'],
  ['ዠ', 'የ', 'ደ', 'ጀ', 'ገ', 'ጠ', 'ጨ', 'ጰ', 'ፀ', 'ፈ'],
  ['ፐ', 'ቨ', 'ሟ', 'ኟ', 'ዟ', 'ጟ', '፟'],
];

const AMHARIC_VOWELS: Record<string, string[]> = {
  'ሀ': ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'],
  'ለ': ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ', 'ሏ'],
  'ሐ': ['ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ', 'ሗ'],
  'መ': ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ', 'ሟ'],
  'ሠ': ['ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ', 'ሧ'],
  'ረ': ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ', 'ሯ'],
  'ሰ': ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ', 'ሷ'],
  'ሸ': ['ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ', 'ሿ'],
  'ቀ': ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ', 'ቋ'],
  'በ': ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ', 'ቧ'],
  'ተ': ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ', 'ቷ'],
  'ቸ': ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ', 'ቿ'],
  'ኀ': ['ኀ', 'ኁ', 'ኂ', 'ኃ', 'ኄ', 'ኅ', 'ኆ', 'ኋ'],
  'ነ': ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ', 'ኗ'],
  'ኘ': ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ', 'ኟ'],
  'አ': ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ'],
  'ከ': ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ', 'ኳ'],
  'ኸ': ['ኸ', 'ኹ', 'ኺ', 'ኻ', 'ኼ', 'ኽ', 'ኾ'],
  'ወ': ['ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ', 'ዏ'],
  'ዘ': ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ', 'ዟ'],
  'ዠ': ['ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ', 'ዧ'],
  'የ': ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'],
  'ደ': ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ', 'ዷ'],
  'ጀ': ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ', 'ጇ'],
  'ገ': ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ', 'ጓ'],
  'ጠ': ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ', 'ጧ'],
  'ጨ': ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ', 'ጯ'],
  'ጰ': ['ጰ', 'ጱ', 'ጲ', 'ጳ', 'ጴ', 'ጵ', 'ጶ', 'ጷ'],
  'ፀ': ['ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ', 'ፆ'],
  'ፈ': ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ', 'ፏ'],
  'ፐ': ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ', 'ፗ'],
  'ቨ': ['ቨ', 'ቩ', 'ቪ', 'ቫ', 'ቬ', 'ቭ', 'ቮ'],
  'ሟ': ['ሟ'],
  'ኟ': ['ኟ'],
  'ዟ': ['ዟ'],
  'ጟ': ['ጟ'],
  '፟': ['፟'],
};

// Ethiopian / Ge'ez numbers
const ETHIOPIAN_NUMBERS = ['፩','፪','፫','፬','፭','፮','፯','፰','፱','፲','፳','፴','፵','፶','፷','፸','፹','፺','፻','፼'];
const ETHIOPIAN_SYMBOLS = ['፣','።','፤','፡','፥','፦','፧','፨','—','«','»','′','″'];

// ─── Sticker Data ─────────────────────────────────────────────────────────
const STICKER_CATEGORIES = [
  { id: 'smileys', name: 'Smileys', icon: '😀', stickers: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'] },
  { id: 'hearts', name: 'Love', icon: '❤️', stickers: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫶','🤝','💏','💑','🏩','💒','💍','💎','🌹','🌷','💐','🌸','🌺','🦋','✨','💫','🌟','⭐'] },
  { id: 'hands', name: 'Gestures', icon: '👍', stickers: ['👍','👎','👊','✊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄'] },
  { id: 'animals', name: 'Animals', icon: '🐱', stickers: ['🐱','🐶','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔'] },
  { id: 'food', name: 'Food', icon: '☕', stickers: ['☕','🍲','🫓','🍕','🍔','🍟','🌮','🍜','🍣','🍩','🍪','🎂','🍰','🧃','🍎','🍇','🍊','🍋','🍌','🍉','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🫛','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯'] },
  { id: 'nature', name: 'Nature', icon: '🌸', stickers: ['🌸','🌺','🌻','🌹','🌷','💐','🌳','🌴','🌵','🍀','🌈','⭐','🌙','☀️','❄️','🔥','🌦️','🌤️','⛅','🌥️','🌦️','🌧️','⛈️','🌩️','🌪️','🌫️','🌬️','🌀','🌊','💧','💦','☔','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🌍','🌎','🌏','🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','🌙','🌚','🌛','🌜','☀️','🌝','🌞','⭐','🌟','🌠','🌌','☁️','⛅','⛈️','🌤️','🌥️','🌦️','🌧️','🌨️','🌩️','🌪️'] },
  { id: 'travel', name: 'Travel', icon: '✈️', stickers: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','⛽','🛞','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🛶','🚤','🛳️','⛴️','🛥️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🗺️','🧭','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏟️','🏛️','🏗️','🧱','🪨','🪵','🛖','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩️','🕋'] },
  { id: 'sports', name: 'Sports', icon: '⚽', stickers: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤸','🤺','⛹️','🤾','🏌️','🏇','🧘','🛀','🛌','🤱','👩‍🍼','👨‍🍼','🧑‍🍼','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🪈','🎲','♟️','🎯','🎳','🎮','🕹️','🧩','🪄','🎰'] },
  { id: 'objects', name: 'Objects', icon: '💡', stickers: ['💡','🔦','🕯️','💎','🔑','🗝️','🪤','🧲','💰','💳','💴','💵','💶','💷','🪙','💸','🧾','💼','📁','📂','📅','📆','🗒️','🗓️','📇','📈','📉','📊','📋','📌','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','🗑️','🔒','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','🛠️','🗡️','⚔️','💣','🪃','🏹','🛡️','🪚','🔧','🪛','🔩','⚙️','🗜️','⚖️','🦯','🔗','⛓️','🪝','🧰','🧲','🪜','🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🩻','🚪','🛗','🪞','🪟','🛏️','🛋️','🪑','🚽','🪠','🚿','🛁','🪤','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪥','🧽','🧯','🛒','🚬','⚰️','🪦','⚱️','🧿','🪬','🗿','🪧','🪪'] },
  { id: 'symbols', name: 'Symbols', icon: '💫', stickers: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','👁️‍🗨️','🔚','🔙','🔛','🔝','🔜','〰️','➰','➿','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛'] },
  { id: 'flags', name: 'Flags', icon: '🏁', stickers: ['🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇪🇹','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇵🇹','🇧🇷','🇷🇺','🇨🇳','🇯🇵','🇰🇷','🇮🇳','🇦🇺','🇨🇦','🇲🇽','🇦🇷','🇿🇦','🇳🇬','🇰🇪','🇪🇬','🇸🇦','🇦🇪','🇶🇦','🇮🇱','🇹🇷','🇬🇷','🇳🇱','🇧🇪','🇨🇭','🇦🇹','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇵🇱','🇺🇦','🇨🇿','🇮🇪','🇮🇸','🇳🇿','🇸🇬','🇹🇭','🇻🇳','🇲🇾','🇵🇭','🇮🇩','🇵🇰','🇧🇩','🇱🇰','🇲🇲','🇰🇭','🇱🇦'] },
  { id: 'ethiopian', name: 'Ethiopia', icon: '🇪🇹', stickers: ['🇪🇹','☕','🎶','🥁','🏔️','🌍','🦁','🦅','☀️','🌿','🍲','🫓','🎭','💃','🕺','🎪','💪','🔥','👑','💎','✨','💫','🌟','🙏','❤️','🫶','🎊','🥳','🎉','⭐','🌈','🦋','🌸','🌺','🎵','🎤','🪘','🪇','🎺','🎶','🎵','🎼','🏙️','🕌','⛪','🗺️','📖','🪡','🧵','🧶','🪆','🏺','🌍','🌎','🌏'] },
];

const GIF_CATEGORIES = [
  { id: 'hello', name: 'Hello', emoji: '👋' },
  { id: 'thanks', name: 'Thanks', emoji: '🙏' },
  { id: 'love', name: 'Love', emoji: '❤️' },
  { id: 'laugh', name: 'Laugh', emoji: '😂' },
  { id: 'celebrate', name: 'Celebrate', emoji: '🎉' },
  { id: 'sad', name: 'Sad', emoji: '😢' },
  { id: 'cool', name: 'Cool', emoji: '😎' },
  { id: 'fire', name: 'Fire', emoji: '🔥' },
  { id: 'angry', name: 'Angry', emoji: '😡' },
  { id: 'sleepy', name: 'Sleepy', emoji: '😴' },
  { id: 'thinking', name: 'Think', emoji: '🤔' },
  { id: 'shocked', name: 'Shocked', emoji: '😱' },
  { id: 'peace', name: 'Peace', emoji: '✌️' },
  { id: 'hug', name: 'Hug', emoji: '🤗' },
];

const GIF_ITEMS: Record<string, { emoji: string; label: string; animation: string }[]> = {
  hello: [
    { emoji: '👋', label: 'Hey!', animation: 'wave' },
    { emoji: '🤗', label: 'Hi there!', animation: 'bounce' },
    { emoji: '✨', label: 'Hello!', animation: 'sparkle' },
    { emoji: '🙌', label: 'Yo!', animation: 'pulse' },
    { emoji: '🫶', label: 'Hi love!', animation: 'heartbeat' },
    { emoji: '😊', label: 'Hi!', animation: 'bounce' },
  ],
  thanks: [
    { emoji: '🙏', label: 'Thank you!', animation: 'pulse' },
    { emoji: '💕', label: 'Thanks!', animation: 'heartbeat' },
    { emoji: '✨', label: 'Appreciate it!', animation: 'sparkle' },
    { emoji: '🤝', label: 'Much obliged!', animation: 'wave' },
    { emoji: '💝', label: 'So kind!', animation: 'heartbeat' },
    { emoji: '🌟', label: 'You rock!', animation: 'sparkle' },
  ],
  love: [
    { emoji: '❤️', label: 'Love you!', animation: 'heartbeat' },
    { emoji: '😘', label: 'Muah!', animation: 'bounce' },
    { emoji: '💕', label: 'So much!', animation: 'heartbeat' },
    { emoji: '🥰', label: 'My love!', animation: 'pulse' },
    { emoji: '💗', label: 'Forever!', animation: 'heartbeat' },
    { emoji: '💑', label: 'Together!', animation: 'pulse' },
  ],
  laugh: [
    { emoji: '😂', label: 'LMAO!', animation: 'bounce' },
    { emoji: '🤣', label: 'Haha!', animation: 'shake' },
    { emoji: '😆', label: 'LOL!', animation: 'bounce' },
    { emoji: '😹', label: 'Too funny!', animation: 'shake' },
    { emoji: '🤭', label: 'Hehe!', animation: 'pulse' },
    { emoji: '😜', label: 'Silly!', animation: 'bounce' },
  ],
  celebrate: [
    { emoji: '🎉', label: 'Party!', animation: 'bounce' },
    { emoji: '🎊', label: 'Yay!', animation: 'shake' },
    { emoji: '🥳', label: 'Woohoo!', animation: 'bounce' },
    { emoji: '🍾', label: 'Cheers!', animation: 'sparkle' },
    { emoji: '🏆', label: 'Champion!', animation: 'pulse' },
    { emoji: '✨', label: 'Amazing!', animation: 'sparkle' },
  ],
  sad: [
    { emoji: '😢', label: 'So sad', animation: 'pulse' },
    { emoji: '😭', label: 'Crying!', animation: 'shake' },
    { emoji: '💔', label: 'Heartbroken', animation: 'heartbeat' },
    { emoji: '🥺', label: 'Please!', animation: 'pulse' },
    { emoji: '😞', label: 'Disappointed', animation: 'wave' },
    { emoji: '😔', label: 'Down', animation: 'pulse' },
  ],
  cool: [
    { emoji: '😎', label: 'Cool!', animation: 'bounce' },
    { emoji: '🔥', label: 'Fire!', animation: 'sparkle' },
    { emoji: '💪', label: 'Strong!', animation: 'pulse' },
    { emoji: '✌️', label: 'Peace!', animation: 'wave' },
    { emoji: '🤩', label: 'Awesome!', animation: 'sparkle' },
    { emoji: '💯', label: '100!', animation: 'bounce' },
  ],
  fire: [
    { emoji: '🔥', label: 'Lit!', animation: 'sparkle' },
    { emoji: '💥', label: 'Boom!', animation: 'shake' },
    { emoji: '⚡', label: 'Electric!', animation: 'sparkle' },
    { emoji: '🌟', label: 'Star!', animation: 'pulse' },
    { emoji: '☄️', label: 'Comet!', animation: 'shake' },
    { emoji: '🌪️', label: 'Storm!', animation: 'shake' },
  ],
  angry: [
    { emoji: '😡', label: 'Angry!', animation: 'shake' },
    { emoji: '🤬', label: 'Furious!', animation: 'shake' },
    { emoji: '😤', label: 'Huff!', animation: 'pulse' },
    { emoji: '💢', label: 'Mad!', animation: 'shake' },
    { emoji: '👊', label: 'Fight!', animation: 'bounce' },
    { emoji: '👹', label: 'Demon!', animation: 'pulse' },
  ],
  sleepy: [
    { emoji: '😴', label: 'Sleeping!', animation: 'pulse' },
    { emoji: '🥱', label: 'Yawn!', animation: 'bounce' },
    { emoji: '😪', label: 'Tired!', animation: 'pulse' },
    { emoji: '🛌', label: 'Bed time!', animation: 'wave' },
    { emoji: '💤', label: 'Zzz!', animation: 'bounce' },
    { emoji: '🌙', label: 'Night!', animation: 'sparkle' },
  ],
  thinking: [
    { emoji: '🤔', label: 'Hmm...', animation: 'pulse' },
    { emoji: '🧐', label: 'Inspect!', animation: 'wave' },
    { emoji: '🤨', label: 'Really?', animation: 'pulse' },
    { emoji: '💡', label: 'Idea!', animation: 'sparkle' },
    { emoji: '💭', label: 'Thinking...', animation: 'pulse' },
    { emoji: '🫤', label: 'Not sure', animation: 'wave' },
  ],
  shocked: [
    { emoji: '😱', label: 'OMG!', animation: 'shake' },
    { emoji: '😲', label: 'What?!', animation: 'bounce' },
    { emoji: '😨', label: 'Scared!', animation: 'shake' },
    { emoji: '🫢', label: 'Gasp!', animation: 'pulse' },
    { emoji: '😯', label: 'Wow!', animation: 'bounce' },
    { emoji: '🙀', label: 'Shocked!', animation: 'shake' },
  ],
  peace: [
    { emoji: '✌️', label: 'Peace!', animation: 'wave' },
    { emoji: '🕊️', label: 'Dove!', animation: 'bounce' },
    { emoji: '☮️', label: 'Harmony!', animation: 'sparkle' },
    { emoji: '🤞', label: 'Fingers!', animation: 'pulse' },
    { emoji: '🌍', label: 'World!', animation: 'sparkle' },
    { emoji: '🌸', label: 'Calm!', animation: 'pulse' },
  ],
  hug: [
    { emoji: '🤗', label: 'Hug!', animation: 'heartbeat' },
    { emoji: '🫂', label: 'Cuddle!', animation: 'pulse' },
    { emoji: '🤗', label: 'Comfort!', animation: 'bounce' },
    { emoji: '💕', label: 'Care!', animation: 'heartbeat' },
    { emoji: '🥰', label: 'Sweet!', animation: 'pulse' },
    { emoji: '💝', label: 'Warmth!', animation: 'heartbeat' },
  ],
};

// ─── Suggestions Data ─────────────────────────────────────────────────────
const ENGLISH_SUGGESTIONS: Record<string, string[]> = {
  '': ['the','be','to','of','and'],
  't': ['the','to','that','this','they'],
  'th': ['the','this','that','there','them'],
  'the': ['there','their','them','then','these'],
  'i': ['is','it','in','if','I'],
  'a': ['and','are','as','at','all'],
  'an': ['and','another','any','answer'],
  's': ['so','some','she','said','should'],
  'w': ['was','with','will','we','what'],
  'h': ['have','he','had','his','how'],
  'b': ['but','by','been','be','but'],
  'no': ['not','now','know','nothing'],
  'wh': ['what','when','where','which','who'],
  'ho': ['how','home','hope','house'],
  'go': ['going','good','got','great'],
  'lo': ['love','like','long','look'],
  'he': ['hello','here','help','her'],
  'ha': ['have','has','had','happy'],
  'thi': ['this','think','thing','things'],
  'goo': ['good','going','got','great'],
  'than': ['that','thank','thanks','than'],
  'ple': ['please','place','people','plan'],
};

const AMHARIC_SUGGESTIONS: Record<string, string[]> = {
  '': ['እኔ','አንቺ','እሱ','ይህ','ያ'],
  'እ': ['እኔ','እሱ','እሷ','እንዴት','እሺ'],
  'አ': ['አንቺ','አዎ','አሁን','አለ','አማርኛ'],
  'ሰ': ['ሰላም','ሰው','ሰዓት'],
  'መ': ['መሆን','መጥፎ','መልካም'],
  'ከ': ['ከዚህ','ከትናንት'],
  'ወ': ['ወደ','ወጣ','ወደፊት'],
  'እን': ['እንዴት','እንደ','እንደዚህ'],
  'ሰላ': ['ሰላም','ሰላምና','ሰላምደህ'],
  'አማ': ['አማርኛ','አማራ','አማረን'],
  'መል': ['መልካም','መልዕትት','መልስ'],
  'ጥሩ': ['ጥሩ','ጥሩነት'],
  'ስለ': ['ስለዚህ','ስለው'],
  'ያ': ['ያ','ያም','ያህል'],
};

const NEXT_WORD_EN: Record<string, string[]> = {
  'the': ['world','people','way','day','first'],
  'i': ['am','was','have','will','can'],
  'to': ['the','be','do','make','have'],
  'and': ['then','also','more','now','that'],
  'hello': ['there','friend','world','how','everyone'],
  'good': ['morning','night','luck','job','bye'],
  'thank': ['you','your','for','so','very'],
  'how': ['are','to','do','about','much'],
  'please': ['help','come','call','wait','tell'],
  'we': ['are','will','can','have','should'],
  'they': ['are','were','will','can','have'],
  'it': ['is','was','will','can','has'],
  'is': ['a','the','not','very','so'],
  'love': ['you','it','this','that','her'],
};

const NEXT_WORD_AM: Record<string, string[]> = {
  'ሰላም': ['አለም','ስላሴ','መልካም','ደህና','ሰላምና'],
  'እኔ': ['ነኝ','ነበርኩ','ማለት','እፈልጋለሁ'],
  'መልካም': ['ቀን','ሰዓት','እድል','ሰው'],
  'እንዴት': ['ነህ','ነሽ','ነው','አለ'],
  'ጥሩ': ['ቀን','ሰው','ስራ','ነገር'],
  'አመሰግናለሁ': ['ወድዴህ','በጣም','ሁሉ'],
  'ደህና': ['ሆን','መሆን','ኑር'],
};

// ─── Main Component ───────────────────────────────────────────────────────
export default function KeyboardApp({ onTextChange }: KeyboardAppProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<KeyboardMode>('keyboard');
  const [prevMode, setPrevMode] = useState<KeyboardMode>('keyboard');
  const [language, setLanguage] = useState<Language>('english');
  const [shiftActive, setShiftActive] = useState(false);
  const [symbolsActive, setSymbolsActive] = useState(false);
  const [activeStickerCategory, setActiveStickerCategory] = useState('smileys');
  const [activeGifCategory, setActiveGifCategory] = useState('hello');
  const [clipboardItems, setClipboardItems] = useState<{ id: string; text: string; timestamp: number }[]>([
    { id: '1', text: 'Hello, how are you?', timestamp: Date.now() - 60000 },
    { id: '2', text: 'እንዴት ነህ?', timestamp: Date.now() - 30000 },
    { id: '3', text: 'See you tomorrow!', timestamp: Date.now() - 10000 },
  ]);
  const [selectedConsonant, setSelectedConsonant] = useState<string | null>(null);
  const [translateFrom, setTranslateFrom] = useState<'English' | 'Amharic'>('English');
  const [translateInput, setTranslateInput] = useState('');
  const [translateOutput, setTranslateOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [nextWordSuggestions, setNextWordSuggestions] = useState<string[]>([]);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeName>('default');
  const { resolvedTheme: appTheme, setTheme: setAppTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  // Custom themes
  const [customThemes, setCustomThemes] = useState<CustomThemeData[]>([]);
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [customName, setCustomName] = useState('My Theme');
  const [customBgColor, setCustomBgColor] = useState('#1a1a2e');
  const [customKeyColor, setCustomKeyColor] = useState('#16213e');
  const [customKeyTextColor, setCustomKeyTextColor] = useState('#e0e0ff');
  const [customAccentColor, setCustomAccentColor] = useState('#7c3aed');
  const [customSpecialKeyColor, setCustomSpecialKeyColor] = useState('#2d2d5e');
  const [customBgImageUrl, setCustomBgImageUrl] = useState('');
  const [customBgGifUrl, setCustomBgGifUrl] = useState('');
  // Theme picker category
  const [themeCategory, setThemeCategory] = useState<'all' | 'solid' | 'live' | 'custom'>('all');
  // Desktop view
  const [desktopView, setDesktopView] = useState(false);
  // Giphy
  const [giphyResults, setGiphyResults] = useState<GiphyGif[] | null>(null);
  const [giphyLoading, setGiphyLoading] = useState(false);
  const [giphyQuery, setGiphyQuery] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPaths, setDrawingPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  // New state for Change 1: Long press
  const [longPressKey, setLongPressKey] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New state for Change 2: Recent emojis
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // New state for Change 4: Handwriting suggestions
  const [hwSuggestions, setHwSuggestions] = useState<string[]>([]);
  const [hwWordSuggestions, setHwWordSuggestions] = useState<string[]>([]);
  const [hwSentenceSuggestions, setHwSentenceSuggestions] = useState<string[]>([]);
  const [selectedHwSuggestion, setSelectedHwSuggestion] = useState<string | null>(null);
  const [hwRecognizing, setHwRecognizing] = useState(false);
  const [hwStrokes, setHwStrokes] = useState(0);

  // New state for Change 6: Settings
  const [keyPressFeedback, setKeyPressFeedback] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState<'compact' | 'normal' | 'tall'>('normal');
  const [showNumberRow, setShowNumberRow] = useState(true);
  const [autoSpaceAfterPunctuation, setAutoSpaceAfterPunctuation] = useState(true);
  const [keyPopupOnLongPress, setKeyPopupOnLongPress] = useState(true);

  // Animation state for Change 7
  const [textBounce, setTextBounce] = useState(false);
  const [rippleKey, setRippleKey] = useState<string | null>(null);

  // Desktop settings modal state
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);

  // Desktop undo/redo state
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Auto-detect desktop mode on mount + resize
  useEffect(() => {
    const checkDesktop = () => {
      if (window.innerWidth >= 768) {
        setDesktopView(true);
      }
    };
    checkDesktop();
    const handleResize = () => {
      setDesktopView(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Build merged theme (built-in + custom)
  const getCustomThemeDef = (ct: CustomThemeData): ThemeDef => ({
    name: ct.name, flag: '🎨', category: 'custom',
    bg: 'bg-gray-950', card: 'bg-gray-900/80', key: 'bg-gray-800/90', keyHover: 'hover:bg-gray-700',
    keyActive: 'bg-gray-300 text-gray-950', keyText: 'text-gray-100',
    specialKey: 'bg-gray-700', accent: 'bg-gray-300', accentText: 'text-gray-950',
    border: 'border-gray-700/30', tabBar: 'bg-gray-900/80', tabActive: 'bg-gray-300', tabActiveText: 'text-gray-950',
    suggestion: 'bg-gray-800/80',
  });

  const allThemes = { ...THEMES };
  customThemes.forEach(ct => { allThemes[`custom_${ct.id}`] = getCustomThemeDef(ct); });

  const t = allThemes[theme] || THEMES.default;

  // Custom theme style overrides
  const customThemeData = theme.startsWith('custom_') ? customThemes.find(ct => `custom_${ct.id}` === theme) : null;
  const customBgStyle: React.CSSProperties = customThemeData ? {
    backgroundColor: customThemeData.bgColor,
    backgroundImage: customThemeData.bgGifUrl ? `url(${customThemeData.bgGifUrl})` : customThemeData.bgImageUrl ? `url(${customThemeData.bgImageUrl})` : undefined,
    backgroundSize: 'cover', backgroundPosition: 'center',
  } : {};
  const customKeyStyle: React.CSSProperties = customThemeData ? { backgroundColor: customThemeData.keyColor, color: customThemeData.keyTextColor } : {};
  const customAccentStyle: React.CSSProperties = customThemeData ? { backgroundColor: customThemeData.accentColor } : {};
  const customSpecialStyle: React.CSSProperties = customThemeData ? { backgroundColor: customThemeData.specialKeyColor } : {};

  // Create custom theme
  const handleCreateCustomTheme = useCallback(() => {
    const id = Date.now().toString();
    const newTheme: CustomThemeData = {
      id, name: customName || 'Custom Theme',
      bgColor: customBgColor, keyColor: customKeyColor, keyTextColor: customKeyTextColor,
      accentColor: customAccentColor, specialKeyColor: customSpecialKeyColor,
      bgImageUrl: customBgImageUrl || undefined, bgGifUrl: customBgGifUrl || undefined,
    };
    setCustomThemes(prev => [...prev, newTheme]);
    setTheme(`custom_${id}`);
    setShowCustomCreator(false);
    setMode('keyboard');
  }, [customName, customBgColor, customKeyColor, customKeyTextColor, customAccentColor, customSpecialKeyColor, customBgImageUrl, customBgGifUrl]);

  // Fetch Giphy
  const fetchGiphy = useCallback(async (query: string) => {
    setGiphyLoading(true);
    try {
      const type = query ? 'search' : 'trending';
      const res = await fetch(`/api/giphy?type=${type}&q=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setGiphyResults(data.data || []);
    } catch {
      setGiphyResults(null);
    } finally {
      setGiphyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'gifs') fetchGiphy(giphyQuery);
  }, [mode, giphyQuery, fetchGiphy]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const updateText = useCallback((newText: string) => {
    setText(newText);
    onTextChange?.(newText);
    // Trigger bounce animation
    setTextBounce(true);
    setTimeout(() => setTextBounce(false), 300);
    // Update suggestions
    const words = newText.trim().split(/\s+/);
    const lastWord = words[words.length - 1]?.toLowerCase() || '';
    if (language === 'english') {
      setSuggestions(ENGLISH_SUGGESTIONS[lastWord] || ENGLISH_SUGGESTIONS[lastWord.slice(0, 2)] || []);
      const prevWord = words.length > 1 ? words[words.length - 2]?.toLowerCase() : '';
      setNextWordSuggestions(prevWord ? (NEXT_WORD_EN[prevWord] || []) : []);
    } else {
      setSuggestions(AMHARIC_SUGGESTIONS[lastWord] || AMHARIC_SUGGESTIONS[lastWord.slice(0, 2)] || []);
      const prevWord = words.length > 1 ? words[words.length - 2] || '' : '';
      setNextWordSuggestions(prevWord ? (NEXT_WORD_AM[prevWord] || []) : []);
    }
  }, [onTextChange, language]);

  // Change 2: Add emoji to recent
  const addRecentEmoji = useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 24);
    });
  }, []);

  const handleSuggestionClick = useCallback((word: string) => {
    const words = text.trim().split(/\s+/);
    if (words.length > 0 && words[words.length - 1] !== '') {
      words[words.length - 1] = word;
      updateText(words.join(' ') + ' ');
    } else {
      updateText(text + word + ' ');
    }
  }, [text, updateText]);

  const handleNextWordClick = useCallback((word: string) => {
    updateText(text + word + ' ');
  }, [text, updateText]);

  const handleKeyPress = useCallback((key: string) => {
    // Ripple effect
    setRippleKey(key);
    setTimeout(() => setRippleKey(null), 400);

    if (key === 'backspace') {
      updateText(text.slice(0, -1));
    } else if (key === 'space') {
      updateText(text + ' ');
    } else if (key === 'enter') {
      updateText(text + '\n');
    } else if (key === 'shift') {
      setShiftActive(!shiftActive);
    } else if (key === 'symbols') {
      setSymbolsActive(!symbolsActive);
      setShiftActive(false);
      setSelectedConsonant(null);
    } else {
      let char = key;
      if (shiftActive && key.length === 1 && key.match(/[a-z]/)) {
        char = key.toUpperCase();
      }
      let newText = text + char;
      // Auto-space after punctuation
      if (autoSpaceAfterPunctuation && key.length === 1 && ['.','!','?',';',':'].includes(key)) {
        newText = text + char + ' ';
      }
      updateText(newText);
      if (shiftActive) setShiftActive(false);
    }
  }, [text, shiftActive, symbolsActive, updateText, autoSpaceAfterPunctuation]);

  const handleAmharicPress = useCallback((consonant: string) => {
    const vowels = AMHARIC_VOWELS[consonant];
    if (vowels && vowels.length > 0) {
      setSelectedConsonant(consonant);
      updateText(text + vowels[0]);
    }
  }, [text, updateText]);

  const handleVowelSelect = useCallback((vowel: string) => {
    const lastChar = text.slice(-1);
    const currentConsonant = selectedConsonant;
    if (currentConsonant && AMHARIC_VOWELS[currentConsonant]?.includes(lastChar)) {
      updateText(text.slice(0, -1) + vowel);
    } else {
      updateText(text + vowel);
    }
  }, [text, selectedConsonant, updateText]);

  // Change 1: Long press handlers
  const handlePointerDown = useCallback((key: string) => {
    if (language !== 'english') return;
    if (!keyPopupOnLongPress) return;
    if (!LONG_PRESS_ALTERNATES[key]) return;
    longPressTimerRef.current = setTimeout(() => {
      setLongPressKey(key);
    }, 300);
  }, [language, keyPopupOnLongPress]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleAlternateSelect = useCallback((alt: string) => {
    updateText(text + alt);
    setLongPressKey(null);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [text, updateText]);

  // ─── Handwriting Canvas ─────────────────────────────────────────────
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setCurrentPath([{ x, y }]);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setCurrentPath(prev => [...prev, { x, y }]);

    ctx.strokeStyle = theme === 'default' ? '#333' : '#fff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentPath.length > 0) {
      const lastPoint = currentPath[currentPath.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, [isDrawing, currentPath, theme]);

  const stopDrawing = useCallback(() => {
    if (currentPath.length > 0) {
      setDrawingPaths(prev => [...prev, currentPath]);
      const newStrokeCount = drawingPaths.length + 1;
      setHwStrokes(newStrokeCount);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [currentPath, drawingPaths.length]);

  // AI-powered handwriting recognition
  const recognizeHandwriting = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || drawingPaths.length === 0) return;

    setHwRecognizing(true);
    try {
      // Capture canvas as base64 image
      const imageData = canvas.toDataURL('image/png');

      const res = await fetch('/api/handwriting-recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, language }),
      });

      if (res.ok) {
        const data = await res.json();
        const chars = data.characters || [];
        const words = data.words || [];
        const sentences = data.sentences || [];

        setHwSuggestions(chars);
        setHwWordSuggestions(words);
        setHwSentenceSuggestions(sentences);
        if (chars.length > 0) setSelectedHwSuggestion(chars[0]);
        else if (words.length > 0) setSelectedHwSuggestion(words[0]);
        else if (sentences.length > 0) setSelectedHwSuggestion(sentences[0]);
      } else {
        // Fallback: generate local suggestions
        const fallbackChars = language === 'english'
          ? ['a','e','i','o','u','n','s','t'].sort(() => Math.random() - 0.5).slice(0, 5)
          : ['ሀ','ለ','መ','ሰ','በ','ወ','ነ','ገ'].sort(() => Math.random() - 0.5).slice(0, 5);
        setHwSuggestions(fallbackChars);
        if (fallbackChars.length > 0) setSelectedHwSuggestion(fallbackChars[0]);
      }
    } catch {
      // Fallback on error
      const fallbackChars = language === 'english'
        ? ['a','b','c','d','e'].sort(() => Math.random() - 0.5).slice(0, 5)
        : ['ሀ','ለ','መ','ሰ','በ'].sort(() => Math.random() - 0.5).slice(0, 5);
      setHwSuggestions(fallbackChars);
      if (fallbackChars.length > 0) setSelectedHwSuggestion(fallbackChars[0]);
    } finally {
      setHwRecognizing(false);
    }
  }, [drawingPaths.length, language]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingPaths([]);
    setCurrentPath([]);
    setHwSuggestions([]);
    setHwWordSuggestions([]);
    setHwSentenceSuggestions([]);
    setSelectedHwSuggestion(null);
    setHwStrokes(0);
  }, []);

  const confirmHwSuggestion = useCallback(() => {
    if (selectedHwSuggestion) {
      const separator = text.length > 0 && !text.endsWith(' ') ? ' ' : '';
      updateText(text + separator + selectedHwSuggestion);
      clearCanvas();
    }
  }, [selectedHwSuggestion, text, updateText, clearCanvas]);

  // ─── Translation ────────────────────────────────────────────────────
  const handleTranslate = useCallback(async () => {
    if (!translateInput.trim()) return;
    setIsTranslating(true);
    try {
      const sourceLang = translateFrom === 'English' ? 'English' : 'Amharic';
      const targetLang = translateFrom === 'English' ? 'Amharic' : 'English';
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: translateInput, sourceLang, targetLang }),
      });
      const data = await response.json();
      setTranslateOutput(data.translation || 'Translation failed.');
    } catch {
      setTranslateOutput('Error connecting to translation service.');
    } finally {
      setIsTranslating(false);
    }
  }, [translateInput, translateFrom]);

  const handleUseTranslation = useCallback(() => {
    if (translateOutput) updateText(text + translateOutput + ' ');
  }, [text, translateOutput, updateText]);

  // ─── English Keyboard Rows ──────────────────────────────────────────
  // Change 3: Language button moved into bottom row
  const ENGLISH_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['symbols', 'language', 'space', '.', 'enter'],
  ];

  const SYMBOL_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '%', '&', '-', '+', '(', ')', '/'],
    ['shift', '*', '"', "'", ':', ';', '!', '?', '~', 'backspace'],
    ['symbols', 'language', 'space', '\\', 'enter'],
  ];

  const ETHIOPIAN_NUM_ROW_1 = ['፩','፪','፫','፬','፭','፮','፯','፰','፱','፲'];
  const ETHIOPIAN_NUM_ROW_2 = ['፳','፴','፵','፶','፷','፸','፹','፺','፻','፼'];
  const ETHIOPIAN_SYM_ROW = ['፣','።','፤','፡','፥','፦','፧','፨','«','»'];

  // Change 3: Language toggle handler (now from keyboard row)
  const handleLanguageToggle = useCallback(() => {
    setLanguage(language === 'english' ? 'amharic' : 'english');
    setSelectedConsonant(null);
    setSymbolsActive(false);
    if (mode !== 'keyboard') setMode('keyboard');
  }, [language, mode]);

  const renderEnglishKey = (key: string) => {
    const isSpecial = ['shift', 'backspace', 'symbols', 'space', 'enter', 'language'].includes(key);
    const isWide = key === 'space';
    const isMedium = key === 'shift' || key === 'backspace' || key === 'symbols' || key === 'enter' || key === 'language';
    let displayKey = key;
    if (key === 'backspace') displayKey = '⌫';
    if (key === 'symbols') displayKey = symbolsActive ? (language === 'amharic' ? 'አማ' : 'ABC') : (language === 'amharic' ? '፩፪' : '?123');
    if (key === 'space') displayKey = language === 'amharic' ? 'አማርኛ' : 'English';
    if (key === 'enter') displayKey = '↵';
    if (key === 'language') displayKey = language === 'english' ? '🌐 አማ' : '🌐 EN';
    if (shiftActive && !isSpecial && key.length === 1 && key.match(/[a-z]/)) displayKey = key.toUpperCase();
    const isHovered = hoveredKey === key;
    const isLongPressed = longPressKey === key;
    const isRippled = rippleKey === key;

    return (
      <motion.button
        key={key}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05, y: -1 }}
        onMouseEnter={() => setHoveredKey(key)}
        onMouseLeave={() => { setHoveredKey(null); handlePointerUp(); }}
        onClick={() => {
          if (key === 'language') {
            handleLanguageToggle();
          } else {
            handleKeyPress(key);
          }
        }}
        onPointerDown={() => handlePointerDown(key)}
        onPointerUp={handlePointerUp}
        className={`
          relative flex items-center justify-center rounded-xl font-medium
          transition-all duration-150 select-none overflow-visible
          ${isWide ? 'flex-[3] h-11' : isMedium ? 'flex-[1.5] h-11' : 'flex-1 h-11'}
          ${isHovered ? `${t.keyHover} shadow-md` : ''}
          ${isSpecial ? `${t.specialKey} ${t.keyText}` : `${t.key} ${t.keyText} ${t.border} border shadow-sm`}
        `}
      >
        {/* Ripple effect */}
        {isRippled && (
          <motion.span
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 rounded-xl ${t.accent} pointer-events-none`}
          />
        )}
        {key === 'shift' && <ArrowUp className={`w-4 h-4 ${shiftActive ? 'text-yellow-500' : ''}`} />}
        {key === 'backspace' && <Delete className="w-4 h-4" />}
        {key === 'enter' && <CornerDownLeft className="w-4 h-4" />}
        {key === 'language' && <span className="text-[10px] font-bold">{displayKey}</span>}
        {key !== 'shift' && key !== 'backspace' && key !== 'enter' && key !== 'language' && (
          <span className={isWide ? 'text-xs' : 'text-sm'}>{displayKey}</span>
        )}
        {/* Change 1: Long press popup */}
        {isLongPressed && LONG_PRESS_ALTERNATES[key] && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 ${t.card} ${t.border} border rounded-xl shadow-2xl p-1.5 z-50 flex gap-1 min-w-max`}
          >
            {LONG_PRESS_ALTERNATES[key].map((alt, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleAlternateSelect(alt); }}
                className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium ${t.key} ${t.keyText} ${t.keyHover} ${t.border} border shadow-sm`}
              >
                {alt}
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.button>
    );
  };

  // ─── Render Panels ─────────────────────────────────────────────────
  const renderSuggestions = () => (
    <div className="flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto scrollbar-hide">
      {suggestions.length > 0 && suggestions.map((word, i) => (
        <motion.button
          key={`sug-${i}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSuggestionClick(word)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${t.suggestion} ${t.keyText} hover:opacity-80 transition-opacity`}
        >
          {word}
        </motion.button>
      ))}
      {nextWordSuggestions.length > 0 && (
        <>
          <div className={`w-px h-5 ${t.border}`} />
          {nextWordSuggestions.slice(0, 3).map((word, i) => (
            <motion.button
              key={`next-${i}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNextWordClick(word)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-70 ${t.suggestion} ${t.keyText} hover:opacity-100 transition-opacity`}
            >
              {word}
            </motion.button>
          ))}
        </>
      )}
      {suggestions.length === 0 && nextWordSuggestions.length === 0 && (
        <span className="text-[10px] text-muted-foreground/50 px-2">
          {language === 'english' ? 'Start typing for suggestions...' : 'ጽፍ ጥቆማ ለማግኘት...'}
        </span>
      )}
    </div>
  );

  // Change 2: Stickers with recent emojis
  const renderStickers = () => {
    const category = activeStickerCategory === 'recent'
      ? { id: 'recent', name: 'Recent', icon: '🕐', stickers: recentEmojis }
      : STICKER_CATEGORIES.find(c => c.id === activeStickerCategory);
    const allCategories = [
      ...(recentEmojis.length > 0 ? [{ id: 'recent', name: 'Recent', icon: '🕐', stickers: recentEmojis }] : []),
      ...STICKER_CATEGORIES,
    ];
    return (
      <div className="flex flex-col h-full">
        <div className="flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide border-b border-border/30">
          {allCategories.map(cat => (
            <motion.button key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveStickerCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeStickerCategory === cat.id ? `${t.tabActive} ${t.tabActiveText} shadow-sm` : `${t.suggestion} ${t.keyText}`}`}>
              <span>{cat.icon}</span><span>{cat.name}</span>
            </motion.button>
          ))}
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          {activeStickerCategory === 'recent' && recentEmojis.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${t.keyText} opacity-50`}>
              <span className="text-2xl mb-2">🕐</span>
              <span className="text-xs">No recent emojis yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {category?.stickers.map((sticker, i) => (
                <motion.button key={i} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
                  onClick={() => { updateText(text + sticker); addRecentEmoji(sticker); }}
                  className={`flex items-center justify-center p-2 rounded-xl ${t.key} ${t.border} border shadow-sm text-2xl aspect-square`}>
                  {sticker}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGifs = () => (
    <div className="flex flex-col h-full">
      <div className={`flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide border-b border-border/30`}>
        {/* Search bar */}
        <div className={`flex items-center gap-1 flex-1 px-2 py-1 rounded-lg ${t.card} ${t.border} border`}>
          <input
            type="text"
            value={giphyQuery}
            onChange={e => setGiphyQuery(e.target.value)}
            placeholder="Search GIFs..."
            className={`flex-1 bg-transparent text-xs outline-none ${t.keyText} placeholder:opacity-40`}
          />
          {giphyQuery && (
            <button onClick={() => setGiphyQuery('')} className="opacity-50 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {GIF_CATEGORIES.slice(0, 6).map(cat => (
          <motion.button key={cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGiphyQuery(cat.name.toLowerCase())}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              giphyQuery === cat.name.toLowerCase() ? `${t.tabActive} ${t.tabActiveText} shadow-sm` : `${t.suggestion} ${t.keyText}`}`}>
            <span>{cat.emoji}</span><span className="hidden sm:inline">{cat.name}</span>
          </motion.button>
        ))}
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        {giphyLoading ? (
          <div className={`flex items-center justify-center h-full ${t.keyText}`}>
            <Loader2 className="w-6 h-6 animate-spin opacity-50" />
          </div>
        ) : giphyResults && giphyResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {giphyResults.map((gif, i) => (
              <motion.button key={gif.id || i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const emoji = gif._fallback?.emoji || '🖼️';
                  updateText(text + emoji + ' ');
                  addRecentEmoji(emoji);
                }}
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl ${t.key} ${t.border} border shadow-sm aspect-video overflow-hidden`}
              >
                {gif.images?.fixed_height?.url && !gif._fallback ? (
                  <img
                    src={gif.images.fixed_height.url}
                    alt={gif.title || 'GIF'}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <motion.span className="text-3xl"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                    {gif._fallback?.emoji || '🖼️'}
                  </motion.span>
                )}
                <span className={`text-[9px] font-medium mt-1 ${t.keyText} opacity-70 truncate w-full text-center`}>
                  {gif._fallback?.label || gif.title?.slice(0, 15) || 'GIF'}
                </span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(GIF_ITEMS[activeGifCategory] || GIF_ITEMS.hello).map((gif, i) => (
              <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                onClick={() => { updateText(text + gif.emoji + ' '); addRecentEmoji(gif.emoji); }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl ${t.key} ${t.border} border shadow-sm aspect-video relative overflow-hidden`}
              >
                <motion.span className="text-3xl relative z-10"
                  animate={
                    gif.animation === 'bounce' ? { y: [0, -4, 0] } :
                    gif.animation === 'pulse' ? { scale: [1, 1.1, 1] } :
                    gif.animation === 'shake' ? { x: [0, -2, 2, 0] } :
                    gif.animation === 'sparkle' ? { opacity: [1, 0.7, 1] } :
                    gif.animation === 'wave' ? { rotate: [0, 15, -15, 0] } :
                    gif.animation === 'heartbeat' ? { scale: [1, 1.15, 1, 1.15, 1] } : {}
                  }
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                  {gif.emoji}
                </motion.span>
                <span className={`text-[10px] font-medium mt-1 relative z-10 ${t.keyText} opacity-70`}>{gif.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderClipboard = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
        <span className={`text-xs font-medium ${t.keyText} opacity-70`}>Clipboard History</span>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm" onClick={() => { if (text.trim()) setClipboardItems(prev => [{ id: Date.now().toString(), text: text.trim(), timestamp: Date.now() }, ...prev]); }}
            className={`h-7 text-xs gap-1 ${t.keyText}`}>
            <Plus className="w-3 h-3" />Add Current
          </Button>
        </motion.div>
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

  const renderTranslate = () => (
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

  // Change 4: Enhanced handwriting with AI word/sentence recognition
  const renderHandwriting = () => {
    const hasAnySuggestions = hwSuggestions.length > 0 || hwWordSuggestions.length > 0 || hwSentenceSuggestions.length > 0;

    return (
    <div className="flex flex-col h-full overflow-hidden relative z-10">
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-1.5 border-b shrink-0 ${t.border}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${t.keyText}`}>✏️ Handwriting</span>
          {hwStrokes > 0 && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.accent} ${t.accentText}`} style={customAccentStyle}>
              {hwStrokes} stroke{hwStrokes !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-1 items-center">
          {drawingPaths.length > 0 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={recognizeHandwriting}
                disabled={hwRecognizing}
                className={`h-6 text-[10px] gap-1 ${t.accentText}`}
                style={customAccentStyle}>
                {hwRecognizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {hwRecognizing ? 'Recognizing...' : 'Recognize'}
              </Button>
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="sm" onClick={clearCanvas} className={`h-6 text-[10px] gap-1 ${t.keyText}`}>
              <Trash2 className="w-3 h-3" />Clear
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Suggestions area - ALWAYS visible, solid background */}
      <div className="shrink-0 border-b"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)' }}>

        {hasAnySuggestions ? (
          <div className="px-2 py-2 max-h-[140px] overflow-y-auto">
            {/* Sentences */}
            {hwSentenceSuggestions.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Languages className="w-3 h-3 text-emerald-400" />
                  <p className="text-[10px] font-semibold text-emerald-300">
                    {language === 'english' ? 'Sentences' : 'ዓረፍተ ነገሮች'}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {hwSentenceSuggestions.map((sug, i) => (
                    <motion.button
                      key={`s${i}`}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedHwSuggestion(sug);
                        const separator = text.length > 0 && !text.endsWith(' ') ? ' ' : '';
                        updateText(text + separator + sug);
                        clearCanvas();
                      }}
                      className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                        ${selectedHwSuggestion === sug
                          ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50 shadow-md'
                          : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'}`}
                    >
                      {sug}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Words */}
            {hwWordSuggestions.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <p className="text-[10px] font-semibold text-cyan-300">
                    {language === 'english' ? 'Words' : 'ቃላት'}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {hwWordSuggestions.map((sug, i) => (
                    <motion.button
                      key={`w${i}`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedHwSuggestion(sug);
                        const separator = text.length > 0 && !text.endsWith(' ') ? ' ' : '';
                        updateText(text + separator + sug);
                        clearCanvas();
                      }}
                      className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all
                        ${selectedHwSuggestion === sug
                          ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50 shadow-md'
                          : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'}`}
                    >
                      {sug}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Characters */}
            {hwSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Pen className="w-3 h-3 text-amber-400" />
                  <p className="text-[10px] font-semibold text-amber-300">
                    {language === 'english' ? 'Characters' : 'ፊደላት'}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {hwSuggestions.map((sug, i) => (
                    <motion.button
                      key={`c${i}`}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedHwSuggestion(sug);
                        updateText(text + sug);
                        clearCanvas();
                      }}
                      className={`flex items-center justify-center min-w-[36px] h-9 px-2 rounded-lg text-sm font-bold border transition-all
                        ${selectedHwSuggestion === sug
                          ? 'bg-amber-500/30 text-amber-200 border-amber-400/50 shadow-md'
                          : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'}`}
                    >
                      {sug}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-3 py-2 text-center">
            {hwRecognizing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <p className="text-[10px] text-cyan-300">AI recognizing your handwriting...</p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] text-white/50">
                  {language === 'english'
                    ? '✍️ Draw characters, words, or sentences below'
                    : '✍️ ከታች ፊደላት፣ ቃላት ወይም ዓረፍተ ነገሮች ይጻፉ'}
                </p>
                <p className="text-[9px] text-white/30 mt-0.5">
                  {language === 'english'
                    ? 'Draw multiple strokes, then tap Recognize'
                    : 'ብዙ ስታይሮኮች ይጻፉ፣ ከዚያ አስተውል ይጫኑ'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Canvas area - takes remaining space */}
      <div className="flex-1 p-2 min-h-0">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-full rounded-xl border-2 border-dashed cursor-crosshair touch-none`}
          style={{
            touchAction: 'none',
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        />
      </div>

      {/* Bottom action bar */}
      {hasAnySuggestions && selectedHwSuggestion && (
        <div className="shrink-0 px-3 py-1.5 border-t"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={confirmHwSuggestion} className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500 text-white" size="sm">
              <CornerDownLeft className="w-3.5 h-3.5" />
              Insert &quot;{selectedHwSuggestion.length > 20 ? selectedHwSuggestion.substring(0, 20) + '...' : selectedHwSuggestion}&quot;
            </Button>
          </motion.div>
        </div>
      )}
    </div>
    );
  };

  // Change 6: Settings panel (NO theme picker - themes are in themes button)
  const renderSettings = () => (
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

        {/* Show number row toggle */}
        <div className={`flex items-center justify-between p-3 rounded-xl ${t.card} ${t.border} border`}>
          <div>
            <p className={`text-xs font-medium ${t.keyText}`}>Show Number Row</p>
            <p className={`text-[10px] ${t.keyText} opacity-50`}>Always show number row above letters</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNumberRow(!showNumberRow)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center ${showNumberRow ? t.accent : 'bg-gray-600'}`}
          >
            <motion.div
              animate={{ x: showNumberRow ? 16 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </div>

        {/* Auto-space after punctuation toggle */}
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
            <motion.div
              animate={{ x: autoSpaceAfterPunctuation ? 16 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </div>

        {/* Key popup on long press toggle */}
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
            <motion.div
              animate={{ x: keyPopupOnLongPress ? 16 : 2 }}
              className="w-5 h-5 bg-white rounded-full shadow-sm"
            />
          </motion.button>
        </div>
      </div>
    </div>
  );

  // ─── Full-Screen Theme Picker ────────────────────────────────────────
  const renderThemePickerPanel = () => {
    const filteredThemes = Object.entries(allThemes).filter(([key, tData]) => {
      if (themeCategory === 'all') return true;
      if (themeCategory === 'solid') return tData.category === 'solid';
      if (themeCategory === 'live') return tData.category === 'live';
      if (themeCategory === 'custom') return key.startsWith('custom_');
      return true;
    });

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={`flex items-center justify-between px-3 py-2 border-b ${t.border}`}>
          <span className={`text-sm font-bold ${t.keyText}`}>🎨 Themes</span>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowCustomCreator(true); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium ${t.accent} ${t.accentText}`}
            >
              <Plus className="w-3 h-3" />Create
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMode('keyboard')}
              className={`${t.keyText} opacity-50 hover:opacity-100`}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Category tabs */}
        <div className={`flex gap-1 px-2 py-1.5 border-b ${t.border}`}>
          {(['all', 'solid', 'live', 'custom'] as const).map(cat => (
            <motion.button key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setThemeCategory(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold capitalize transition-all ${
                themeCategory === cat ? `${t.tabActive} ${t.tabActiveText} shadow-sm` : `${t.suggestion} ${t.keyText}`
              }`}
            >
              {cat === 'all' ? '✨ All' : cat === 'solid' ? '🎨 Solid' : cat === 'live' ? '⚡ Live' : '🖌️ Custom'}
            </motion.button>
          ))}
        </div>

        {/* Custom Theme Creator */}
        <AnimatePresence>
          {showCustomCreator && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b"
              style={{ borderColor: 'rgba(128,128,128,0.2)' }}
            >
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${t.keyText}`}>Create Custom Theme</span>
                  <button onClick={() => setShowCustomCreator(false)} className="opacity-50 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                </div>
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="Theme name" className={`w-full px-2 py-1.5 rounded-lg text-xs ${t.card} ${t.border} border ${t.keyText} outline-none`} />
                <div className="grid grid-cols-5 gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <label className={`text-[8px] ${t.keyText} opacity-60`}>Background</label>
                    <input type="color" value={customBgColor} onChange={e => setCustomBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className={`text-[8px] ${t.keyText} opacity-60`}>Keys</label>
                    <input type="color" value={customKeyColor} onChange={e => setCustomKeyColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className={`text-[8px] ${t.keyText} opacity-60`}>Text</label>
                    <input type="color" value={customKeyTextColor} onChange={e => setCustomKeyTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className={`text-[8px] ${t.keyText} opacity-60`}>Accent</label>
                    <input type="color" value={customAccentColor} onChange={e => setCustomAccentColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className={`text-[8px] ${t.keyText} opacity-60`}>Special</label>
                    <input type="color" value={customSpecialKeyColor} onChange={e => setCustomSpecialKeyColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                  </div>
                </div>
                <input type="text" value={customBgImageUrl} onChange={e => setCustomBgImageUrl(e.target.value)}
                  placeholder="Background image URL (optional)" className={`w-full px-2 py-1.5 rounded-lg text-[10px] ${t.card} ${t.border} border ${t.keyText} outline-none`} />
                <input type="text" value={customBgGifUrl} onChange={e => setCustomBgGifUrl(e.target.value)}
                  placeholder="Background GIF URL (optional)" className={`w-full px-2 py-1.5 rounded-lg text-[10px] ${t.card} ${t.border} border ${t.keyText} outline-none`} />
                {/* Preview */}
                <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: customBgColor, height: 48 }}>
                  <div className="flex items-center justify-center gap-1 p-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: customKeyColor }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: customAccentColor }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: customSpecialKeyColor }} />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateCustomTheme}
                  className={`w-full py-1.5 rounded-lg text-xs font-medium ${t.accent} ${t.accentText}`}
                >
                  💾 Save & Apply Theme
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Themes grid */}
        <div className="flex-1 p-2 overflow-y-auto max-h-[350px]">
          {themeCategory === 'custom' && customThemes.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${t.keyText} opacity-50`}>
              <span className="text-2xl mb-2">🎨</span>
              <span className="text-xs">No custom themes yet</span>
              <span className="text-[10px] mt-1">Click &quot;Create&quot; to make one</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {filteredThemes.map(([key, tData]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setTheme(key); setMode('keyboard'); }}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all overflow-hidden ${
                    theme === key ? `${t.accent} ${t.accentText} border-transparent shadow-md` : `${t.card} ${t.border} border`
                  }`}
                >
                  {/* Live theme 3D image preview */}
                  {tData.isLive && tData.liveClass && (
                    <>
                      <div className={`absolute inset-0 ${tData.liveClass} pointer-events-none`} style={{ borderRadius: 'inherit' }} />
                      <div className={`absolute inset-0 live-fx-${key.replace('_live', '')} pointer-events-none`} style={{ borderRadius: 'inherit' }} />
                      <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
                        borderRadius: 'inherit'
                      }} />
                    </>
                  )}
                  {/* Custom theme bg preview */}
                  {key.startsWith('custom_') && (() => {
                    const ct = customThemes.find(c => `custom_${c.id}` === key);
                    return ct ? (
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: ct.bgColor, opacity: 0.3 }} />
                    ) : null;
                  })()}
                  <span className="text-lg relative z-10">{tData.flag}</span>
                  <span className="text-[8px] font-semibold leading-tight relative z-10 text-center">{tData.name}</span>
                  <div className="flex gap-0.5 mt-0.5 relative z-10">
                    <span className={`w-2 h-2 rounded-full ${tData.key.replace('hover:', '').split(' ')[0]}`} />
                    <span className={`w-2 h-2 rounded-full ${tData.accent.replace('hover:', '').split(' ')[0]}`} />
                    <span className={`w-2 h-2 rounded-full ${tData.bg.replace('hover:', '').split(' ')[0]}`} />
                  </div>
                  {tData.isLive && (
                    <span className="absolute top-1 right-1 text-[7px] bg-white/20 rounded px-0.5 z-10 pointer-events-none">LIVE</span>
                  )}
                  {/* Delete button for custom themes */}
                  {key.startsWith('custom_') && (
                    <button
                      onClick={e => { e.stopPropagation(); setCustomThemes(prev => prev.filter(ct => `custom_${ct.id}` !== key)); if (theme === key) setTheme('default'); }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center bg-red-500/70 text-white rounded-full text-[8px] z-20 hover:bg-red-500"
                    >×</button>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Vowel Family Row (above keyboard) ────────────────────────────
  const renderVowelRow = () => {
    if (language !== 'amharic' || !selectedConsonant) return null;
    const vowels = AMHARIC_VOWELS[selectedConsonant];
    if (!vowels || vowels.length <= 1) return null;
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="flex gap-1 justify-center overflow-hidden"
      >
        <span className={`flex items-center text-[9px] ${t.keyText} opacity-40 mr-0.5`}>ድምፅ</span>
        {vowels.map((v, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.08, y: -1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVowelSelect(v)}
            className={`flex items-center justify-center flex-1 h-9 rounded-lg text-sm font-medium transition-colors
              ${text.endsWith(v) ? `${t.accent} ${t.accentText}` : `${t.key} ${t.keyText} ${t.keyHover}`}
              ${t.border} border shadow-sm`}
          >
            {v}
          </motion.button>
        ))}
      </motion.div>
    );
  };

  // ─── Panel transition direction (Change 7) ─────────────────────────
  const modeOrder: KeyboardMode[] = ['keyboard', 'stickers', 'gifs', 'clipboard', 'translate', 'handwriting', 'settings', 'themes'];
  const getPanelVariants = (direction: number) => ({
    initial: { opacity: 0, x: direction > 0 ? 50 : -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction > 0 ? -50 : 50 },
  });

  const handleModeChange = useCallback((newMode: KeyboardMode) => {
    const oldIdx = modeOrder.indexOf(mode);
    const newIdx = modeOrder.indexOf(newMode);
    const direction = newIdx > oldIdx ? 1 : -1;
    setPrevMode(mode);
    setMode(newMode);
    // Store direction for animation
    (window as unknown as Record<string, number>).__panelDirection = direction;
    if (newMode === 'keyboard') {
      setSymbolsActive(false);
      setSelectedConsonant(null);
    }
  }, [mode]);

  const getDirection = () => {
    return (window as unknown as Record<string, number>).__panelDirection || 1;
  };

  // Keyboard height class
  const kbHeightClass = keyboardHeight === 'compact' ? 'min-h-[180px]' : keyboardHeight === 'tall' ? 'min-h-[280px]' : 'min-h-[220px]';
  const kbPanelHeight = keyboardHeight === 'compact' ? 'h-[200px]' : keyboardHeight === 'tall' ? 'h-[300px]' : 'h-[240px]';
  const kbKeyHeight = keyboardHeight === 'compact' ? 'h-9' : keyboardHeight === 'tall' ? 'h-13' : 'h-11';

  // ─── Desktop Render Functions ─────────────────────────────────────────

  // Number row shift characters mapping
  const NUMBER_SHIFT_CHARS: Record<string, string> = {
    '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
    '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
  };

  // Desktop text area with toolbar
  const renderDesktopTextArea = () => {
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    const handleUndo = () => {
      if (undoStack.length > 0) {
        const prev = undoStack[undoStack.length - 1];
        setRedoStack(prev => [...prev, text]);
        setUndoStack(prev => prev.slice(0, -1));
        updateText(prev);
      }
    };
    const handleRedo = () => {
      if (redoStack.length > 0) {
        const next = redoStack[redoStack.length - 1];
        setUndoStack(prev => [...prev, text]);
        setRedoStack(prev => prev.slice(0, -1));
        updateText(next);
      }
    };
    const handleTextChange = (newText: string) => {
      setUndoStack(prev => [...prev, text]);
      setRedoStack([]);
      updateText(newText);
    };

    return (
      <div className="desktop-text-editor">
        {/* Toolbar */}
        <div className={`desktop-toolbar ${t.card} ${t.border} border`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                  onClick={handleUndo}
                  className={`flex items-center justify-center w-7 h-7 rounded-md ${t.suggestion} ${t.keyText} transition-colors`}
                  disabled={undoStack.length === 0}>
                  <Undo2 className="w-3.5 h-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                  onClick={handleRedo}
                  className={`flex items-center justify-center w-7 h-7 rounded-md ${t.suggestion} ${t.keyText} transition-colors`}
                  disabled={redoStack.length === 0}>
                  <Redo2 className="w-3.5 h-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className={`w-px h-4 mx-1 ${t.border} bg-current opacity-20`} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                  onClick={() => navigator.clipboard?.writeText(text)}
                  className={`flex items-center justify-center w-7 h-7 rounded-md ${t.suggestion} ${t.keyText} transition-colors`}
                  disabled={!text}>
                  <Copy className="w-3.5 h-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Copy text</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                  onClick={() => { if (text) updateText(text); /* select all via focus */ }}
                  className={`flex items-center justify-center w-7 h-7 rounded-md ${t.suggestion} ${t.keyText} transition-colors`}
                  disabled={!text}>
                  <SquareCheck className="w-3.5 h-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Select all</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                  onClick={() => handleTextChange('')}
                  className={`flex items-center justify-center w-7 h-7 rounded-md ${t.suggestion} ${t.keyText} transition-colors`}
                  disabled={!text}>
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Clear text</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex-1" />
          <span className={`text-[10px] ${t.keyText} opacity-40`}>
            {charCount} chars · {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
          {/* Language badge with animated border */}
          <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold desktop-language-badge ${t.accent} ${t.accentText}`}
            style={customThemeData ? { backgroundColor: customThemeData.accentColor, color: customThemeData.keyTextColor } : {}}>
            {language === 'english' ? 'EN' : 'አማ'}
          </span>
          {/* Send button with green styling */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => { if (text) { navigator.clipboard?.writeText(text); }}}
            disabled={!text}
            className={`ml-2 flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${text ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
            <Send className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        {/* Separator line between toolbar and text */}
        <div className={`h-px ${t.border} opacity-30`} />
        {/* Text content */}
        <div className={`${t.card} ${t.border} border border-t-0 rounded-t-none p-3 min-h-[80px] max-h-[160px] overflow-y-auto`}
          style={customThemeData ? { backgroundColor: customThemeData.specialKeyColor + '40' } : {}}>
          {text ? (
            <motion.p
              key={text.slice(-1)}
              initial={textBounce ? { scale: 1.01 } : {}}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${t.keyText} desktop-cursor`}
              style={customThemeData ? { color: customThemeData.keyTextColor } : {}}>
              {text}
            </motion.p>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 gap-1">
              <Zap className={`w-5 h-5 opacity-20 ${t.keyText}`} />
              <p className={`text-sm italic opacity-50 ${t.keyText}`}
                style={customThemeData ? { color: customThemeData.keyTextColor } : {}}>
                {language === 'english' ? 'Start typing with the keyboard below...' : 'ከታች በሚገኘው ቁልፍ ይጻፉ...'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Desktop tab bar
  const renderDesktopTabBar = () => {
    const tabs = [
      { id: 'keyboard' as KeyboardMode, label: 'Keyboard', icon: Keyboard, emoji: '⌨️' },
      { id: 'stickers' as KeyboardMode, label: 'Stickers', icon: Smile, emoji: '😀' },
      { id: 'gifs' as KeyboardMode, label: 'GIFs', icon: Image, emoji: '🎬' },
      { id: 'clipboard' as KeyboardMode, label: 'Clipboard', icon: ClipboardList, emoji: '📋' },
      { id: 'translate' as KeyboardMode, label: 'Translate', icon: Sparkles, emoji: '✨' },
      { id: 'handwriting' as KeyboardMode, label: 'Draw', icon: Pen, emoji: '✏️' },
    ];
    return (
      <div className={`desktop-tab-bar border-b ${t.border} ${t.tabBar}`}
        style={customThemeData ? { backgroundColor: customThemeData.specialKeyColor + '20' } : {}}>
        {/* AkAI branding on left side */}
        <div className="flex items-center gap-1.5 mr-3 pr-3 border-r border-current/10">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] ${t.accent} ${t.accentText}`}
            style={customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
            Ak
          </div>
          <span className={`text-xs font-bold tracking-wide ${t.keyText} opacity-70`}>AkAI</span>
        </div>
        {/* Tab items with pill-style indicator */}
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleModeChange(tab.id)}
            className={`desktop-tab-item ${mode === tab.id ? 'active' : ''} ${t.keyText}`}
            style={mode === tab.id && customThemeData ? { color: customThemeData.accentColor, backgroundColor: customThemeData.accentColor + '15' } : customThemeData ? { color: customThemeData.keyTextColor } : {}}>
            <span className="text-sm">{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        <div className="flex-1" />
        {/* Separator between tabs and controls */}
        <div className={`w-px h-5 mx-2 ${t.border} bg-current opacity-15`} />
        {/* Right-side controls - slightly larger */}
        <div className="flex items-center gap-1.5 py-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.08 }}
                  onClick={() => handleModeChange('themes')}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg ${t.suggestion} ${t.keyText} ${theme !== 'default' ? 'ring-1 ring-primary/30' : ''}`}
                  style={customThemeData ? { color: customThemeData.keyTextColor } : {}}>
                  <Palette className="w-4.5 h-4.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Themes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.08 }}
                  onClick={() => setAppTheme(appTheme === 'dark' ? 'light' : 'dark')}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg ${t.suggestion} ${t.keyText}`}
                  style={customThemeData ? { color: customThemeData.keyTextColor } : {}}>
                  {mounted && appTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Toggle dark mode</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.08 }}
                  onClick={() => setShowDesktopSettings(true)}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg ${t.suggestion} ${t.keyText}`}
                  style={customThemeData ? { color: customThemeData.keyTextColor } : {}}>
                  <Settings className="w-4.5 h-4.5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.08 }}
                  onClick={() => setDesktopView(false)}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-lg ${t.accent} ${t.accentText} text-xs font-semibold shadow-md`}
                  style={customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile</span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Switch to mobile view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  };

  // Desktop 3D key component
  const renderDesktopKey = (key: string, flex?: string, tooltip?: string) => {
    const isSpecial = ['shift', 'backspace', 'symbols', 'space', 'enter', 'language', 'tab', 'esc', 'caps'].includes(key);
    const isWide = key === 'space';
    const isMedium = key === 'shift' || key === 'backspace' || key === 'enter' || key === 'tab' || key === 'caps' || key === 'symbols' || key === 'language';
    const isFunction = key === 'esc' || key === 'tab' || key === 'caps' || key === 'language';
    let displayKey = key;
    let subLabel = '';

    if (key === 'backspace') displayKey = '⌫';
    if (key === 'symbols') displayKey = symbolsActive ? (language === 'amharic' ? 'አማ' : 'ABC') : (language === 'amharic' ? '፩፪' : '?123');
    if (key === 'space') displayKey = language === 'amharic' ? 'አማርኛ' : 'Space';
    if (key === 'enter') displayKey = 'Enter';
    if (key === 'tab') displayKey = 'Tab';
    if (key === 'esc') displayKey = 'Esc';
    if (key === 'caps') displayKey = 'Caps';
    if (key === 'language') displayKey = language === 'english' ? '🌐 አማ' : '🌐 EN';
    if (shiftActive && !isSpecial && key.length === 1 && key.match(/[a-z]/)) {
      displayKey = key.toUpperCase();
    }
    // Sub-labels for number row
    if (NUMBER_SHIFT_CHARS[key]) {
      subLabel = NUMBER_SHIFT_CHARS[key];
    }
    // Sub-labels for some letter keys
    if (!isSpecial && key.length === 1) {
      const shiftChar = shiftActive ? key : key.toUpperCase();
      if (key.match(/[a-z]/) && !shiftActive) {
        subLabel = key.toUpperCase();
      }
    }

    const flexClass = flex || (isWide ? 'flex-[4]' : isMedium ? 'flex-[1.8]' : 'flex-1');
    const isRippled = rippleKey === key;
    const isLongPressed = longPressKey === key;

    return (
      <motion.button
        key={key}
        whileTap={{ translateY: 1, boxShadow: '0 1px 0 0 rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 3px rgba(0,0,0,0.1)' }}
        onClick={() => {
          if (key === 'language') {
            handleLanguageToggle();
          } else if (key === 'tab') {
            updateText(text + '    ');
          } else if (key === 'esc') {
            // Do nothing or close panel
          } else if (key === 'caps') {
            setShiftActive(!shiftActive);
          } else {
            handleKeyPress(key);
          }
        }}
        onPointerDown={() => handlePointerDown(key)}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`
          desktop-key-3d ${isRippled ? 'desktop-key-press' : ''}
          relative flex items-center justify-center font-medium
          select-none overflow-visible ${flexClass}
          ${isSpecial
            ? `${t.specialKey} ${t.keyText} desktop-key-special`
            : `${t.key} ${t.keyText} ${t.border} border`
          }
          ${isFunction ? 'desktop-key-function' : ''}
        `}
        style={customThemeData && !isSpecial ? { backgroundColor: customThemeData.keyColor, color: customThemeData.keyTextColor } : customThemeData && isSpecial ? { backgroundColor: customThemeData.specialKeyColor, color: customThemeData.keyTextColor } : {}}
      >
        {/* Tooltip on special keys */}
        {tooltip && (
          <span className={`desktop-key-tooltip ${t.card} ${t.keyText} ${t.border} border shadow-lg`}>
            {tooltip}
          </span>
        )}
        {/* LED indicator for Caps/Shift state */}
        {(key === 'caps' || key === 'shift') && (
          <span className={`desktop-led-indicator ${shiftActive ? 'desktop-led-on' : ''}`} />
        )}
        {/* Sub-label (shift character) */}
        {subLabel && !isSpecial && (
          <span className="desktop-key-sublabel">{subLabel}</span>
        )}
        {/* Icons for special keys */}
        {key === 'shift' && <ArrowUp className={`w-4 h-4 ${shiftActive ? 'text-yellow-500' : ''}`} />}
        {key === 'backspace' && <Delete className="w-4 h-4" />}
        {key === 'enter' && <CornerDownLeft className="w-4 h-4" />}
        {key === 'esc' && <LogOut className="w-3.5 h-3.5" />}
        {key === 'caps' && (
          <div className="flex items-center gap-1">
            <ArrowUp className={`w-3.5 h-3.5 ${shiftActive ? 'text-yellow-500' : ''}`} />
            <span className="text-[10px]">Caps</span>
          </div>
        )}
        {key === 'tab' && <span className="text-[10px] font-medium">Tab</span>}
        {key === 'language' && <span className="text-[10px] font-bold">{displayKey}</span>}
        {key !== 'shift' && key !== 'backspace' && key !== 'enter' && key !== 'esc' && key !== 'caps' && key !== 'tab' && key !== 'language' && (
          <span className={isWide ? 'text-xs' : 'text-sm'}>{displayKey}</span>
        )}
        {/* Long press popup */}
        {isLongPressed && LONG_PRESS_ALTERNATES[key] && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 ${t.card} ${t.border} border rounded-xl shadow-2xl p-1.5 z-50 flex gap-1 min-w-max`}>
            {LONG_PRESS_ALTERNATES[key].map((alt, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); handleAlternateSelect(alt); }}
                className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium ${t.key} ${t.keyText} ${t.keyHover} ${t.border} border shadow-sm`}>
                {alt}
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.button>
    );
  };

  // Desktop keyboard with 3D keys and function row - NO DUPLICATES
  const renderDesktopKeyboard = () => {
    // Desktop-specific rows - only character keys, special keys added explicitly in layout
    const DESKTOP_QWERTY_ROWS = [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ];
    const DESKTOP_SYMBOL_ROWS = [
      ['@', '#', '$', '%', '&', '-', '+', '(', ')', '/'],
      ['*', '"', "'", ':', ';', '!', '?', '~'],
    ];

    return (
      <div className="desktop-keyboard-chassis">
        {/* Function row */}
        <div className="desktop-key-row desktop-function-row desktop-function-row-styled">
          {renderDesktopKey('esc', 'flex-[1.2]', 'Esc')}
          {renderDesktopKey('tab', 'flex-[1.5]', 'Insert tab')}
          {renderDesktopKey('caps', 'flex-[1.8]', shiftActive ? 'Caps ON' : 'Toggle uppercase')}
          <div className="flex-1" />
          {renderDesktopKey('language', 'flex-[1.5]', 'Switch language')}
        </div>

        {/* Number row - always visible */}
        <div className="desktop-key-row desktop-number-row">
          {['1','2','3','4','5','6','7','8','9','0'].map(k => renderDesktopKey(k))}
        </div>

        {/* Main key area */}
        {language === 'english' ? (
          <>
            {symbolsActive ? (
              <>
                {/* Symbol row 1 */}
                <div className="desktop-key-row desktop-letter-row">
                  {DESKTOP_SYMBOL_ROWS[0].map(key => renderDesktopKey(key))}
                </div>
                {/* Symbol row 2 with shift & backspace */}
                <div className="desktop-key-row desktop-letter-row">
                  {renderDesktopKey('shift', 'flex-[1.5]', 'Toggle shift')}
                  {DESKTOP_SYMBOL_ROWS[1].map(key => renderDesktopKey(key))}
                  {renderDesktopKey('backspace', 'flex-[2]', 'Delete')}
                </div>
              </>
            ) : (
              <>
                {/* QWERTY Row 1 */}
                <div className="desktop-key-row desktop-letter-row">
                  {DESKTOP_QWERTY_ROWS[0].map(key => renderDesktopKey(key))}
                </div>
                {/* QWERTY Row 2 */}
                <div className="desktop-key-row desktop-letter-row">
                  {DESKTOP_QWERTY_ROWS[1].map(key => renderDesktopKey(key))}
                </div>
                {/* QWERTY Row 3 with shift & backspace */}
                <div className="desktop-key-row desktop-letter-row">
                  {renderDesktopKey('shift', 'flex-[1.5]', 'Toggle shift')}
                  {DESKTOP_QWERTY_ROWS[2].map(key => renderDesktopKey(key))}
                  {renderDesktopKey('backspace', 'flex-[2]', 'Delete')}
                </div>
              </>
            )}
            {/* Bottom row */}
            <div className="desktop-key-row desktop-letter-row">
              {renderDesktopKey('symbols', 'flex-[1.5]', 'Toggle symbols')}
              {renderDesktopKey(',', 'flex-[0.8]')}
              {renderDesktopKey('space', 'flex-[5]')}
              {renderDesktopKey('.', 'flex-[0.8]')}
              {renderDesktopKey('enter', 'flex-[2]', 'New line')}
            </div>
          </>
        ) : (
          <>
            {/* Amharic keyboard rows */}
            {AMHARIC_ROWS.map((row, rowIdx) => (
              <div key={rowIdx} className="desktop-key-row desktop-letter-row">
                {row.map(consonant => {
                  return (
                    <motion.button
                      key={consonant}
                      whileTap={{ translateY: 1, boxShadow: '0 1px 0 0 rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 3px rgba(0,0,0,0.1)' }}
                      onClick={() => handleAmharicPress(consonant)}
                      className={`desktop-key-3d flex-1 flex items-center justify-center text-sm font-medium select-none overflow-visible
                        ${selectedConsonant === consonant ? `${t.accent} ${t.accentText}` : `${t.key} ${t.keyText} ${t.border} border`}
                      `}
                      style={customThemeData && selectedConsonant !== consonant ? { backgroundColor: customThemeData.keyColor, color: customThemeData.keyTextColor } : customThemeData && selectedConsonant === consonant ? { backgroundColor: customThemeData.accentColor } : {}}
                    >
                      {consonant}
                    </motion.button>
                  );
                })}
              </div>
            ))}
            {/* Vowel row */}
            {renderVowelRow()}
            {/* Bottom row */}
            <div className="desktop-key-row desktop-letter-row">
              {renderDesktopKey('symbols', 'flex-[1.5]', 'Toggle symbols')}
              {renderDesktopKey(',', 'flex-[0.8]')}
              {renderDesktopKey('space', 'flex-[5]')}
              {renderDesktopKey('.', 'flex-[0.8]')}
              {renderDesktopKey('enter', 'flex-[2]', 'New line')}
            </div>
          </>
        )}

        {/* Suggestions bar */}
        <div className={`mt-1 ${t.tabBar} rounded-lg`}>
          {renderSuggestions()}
        </div>

        {/* AkAI branding - improved */}
        <span className="desktop-branding desktop-branding-enhanced">
          <span className="desktop-branding-dot" />
          AkAI
        </span>
      </div>
    );
  };

  // Desktop side panel for non-keyboard modes
  const renderDesktopSidePanel = () => {
    if (mode === 'keyboard' || mode === 'settings' || mode === 'themes') return null;
    return (
      <div className={`desktop-side-panel ${t.card} ${t.border} border flex flex-col desktop-side-panel-enhanced`}
        style={customThemeData ? { backgroundColor: customThemeData.specialKeyColor + '30' } : {}}>
        {/* Side panel header with close button - more prominent */}
        <div className={`flex items-center justify-between px-3 py-2.5 border-b ${t.border} ${t.suggestion}`}>
          <div className="flex items-center gap-2">
            {mode === 'stickers' && <Smile className={`w-4 h-4 ${t.keyText} opacity-70`} />}
            {mode === 'gifs' && <Image className={`w-4 h-4 ${t.keyText} opacity-70`} />}
            {mode === 'clipboard' && <ClipboardList className={`w-4 h-4 ${t.keyText} opacity-70`} />}
            {mode === 'translate' && <Sparkles className={`w-4 h-4 ${t.keyText} opacity-70`} />}
            {mode === 'handwriting' && <Pen className={`w-4 h-4 ${t.keyText} opacity-70`} />}
            <span className={`text-xs font-semibold ${t.keyText}`}>
              {mode === 'stickers' && 'Stickers'}
              {mode === 'gifs' && 'GIFs'}
              {mode === 'clipboard' && 'Clipboard'}
              {mode === 'translate' && 'Translate'}
              {mode === 'handwriting' && 'Draw'}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setMode('keyboard')}
            className={`w-6 h-6 flex items-center justify-center rounded-md ${t.suggestion} ${t.keyText}`}>
            <X className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        {/* Side panel content */}
        <div className="desktop-side-panel-content flex-1">
          {mode === 'stickers' && renderStickers()}
          {mode === 'gifs' && renderGifs()}
          {mode === 'clipboard' && renderClipboard()}
          {mode === 'translate' && renderTranslate()}
          {mode === 'handwriting' && renderHandwriting()}
        </div>
      </div>
    );
  };

  // Desktop settings modal
  const renderDesktopSettingsModal = () => {
    if (!showDesktopSettings) return null;
    return (
      <div className="desktop-settings-overlay" onClick={() => setShowDesktopSettings(false)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`desktop-settings-modal ${t.card} ${t.border} border shadow-2xl`}
          onClick={e => e.stopPropagation()}
          style={customThemeData ? { backgroundColor: customThemeData.bgColor } : {}}>
          {/* Modal header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
            <span className={`text-sm font-bold ${t.keyText}`}>⚙️ Settings</span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setShowDesktopSettings(false)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg ${t.suggestion} ${t.keyText}`}>
              <X className="w-4 h-4" />
            </motion.button>
          </div>
          {/* Modal content */}
          <div className="p-4 overflow-y-auto max-h-[60vh] flex flex-col gap-3"
            style={customThemeData ? { color: customThemeData.keyTextColor } : {}}>
            {/* Keyboard height selector */}
            <div className={`p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <p className={`text-xs font-medium mb-2 ${t.keyText}`}>Keyboard Height</p>
              <div className="flex gap-2">
                {(['compact', 'normal', 'tall'] as const).map(h => (
                  <motion.button key={h}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setKeyboardHeight(h)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      keyboardHeight === h ? `${t.accent} ${t.accentText}` : `${t.suggestion} ${t.keyText}`
                    }`}
                    style={keyboardHeight === h && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                    {h}
                  </motion.button>
                ))}
              </div>
            </div>
            {/* Show number row */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <div>
                <p className={`text-xs font-medium ${t.keyText}`}>Show Number Row</p>
                <p className={`text-[10px] ${t.keyText} opacity-50`}>Always show numbers above letters</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setShowNumberRow(!showNumberRow)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${showNumberRow ? t.accent : 'bg-gray-600'}`}
                style={showNumberRow && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                <motion.div animate={{ x: showNumberRow ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </motion.button>
            </div>
            {/* Auto-space */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <div>
                <p className={`text-xs font-medium ${t.keyText}`}>Auto-Space After Punctuation</p>
                <p className={`text-[10px] ${t.keyText} opacity-50`}>Add space after . ! ? ; :</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setAutoSpaceAfterPunctuation(!autoSpaceAfterPunctuation)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${autoSpaceAfterPunctuation ? t.accent : 'bg-gray-600'}`}
                style={autoSpaceAfterPunctuation && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                <motion.div animate={{ x: autoSpaceAfterPunctuation ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </motion.button>
            </div>
            {/* Key popup on long press */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${t.key} ${t.border} border`}
              style={customThemeData ? { backgroundColor: customThemeData.keyColor + '60' } : {}}>
              <div>
                <p className={`text-xs font-medium ${t.keyText}`}>Key Popup on Long Press</p>
                <p className={`text-[10px] ${t.keyText} opacity-50`}>Show alternate characters on long press</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setKeyPopupOnLongPress(!keyPopupOnLongPress)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${keyPopupOnLongPress ? t.accent : 'bg-gray-600'}`}
                style={keyPopupOnLongPress && customThemeData ? { backgroundColor: customThemeData.accentColor } : {}}>
                <motion.div animate={{ x: keyPopupOnLongPress ? 16 : 2 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Main desktop view
  const renderDesktopView = () => {
    const isSidePanelOpen = mode !== 'keyboard' && mode !== 'settings' && mode !== 'themes';
    return (
      <>
        {/* Desktop Tab Bar */}
        {renderDesktopTabBar()}

        {/* Main content area: text editor + keyboard + side panel */}
        <div className="flex-1 flex flex-col p-3 gap-3 relative z-10">
          {/* Text editor area */}
          {renderDesktopTextArea()}

          {/* Keyboard + Side Panel row */}
          <div className="flex gap-3 flex-1 min-h-0">
            {/* Keyboard - shrinks when side panel is open */}
            <div className={`flex-1 transition-all duration-300 ${isSidePanelOpen ? '' : ''}`}>
              {mode === 'themes' ? (
                <div className={`${t.card} ${t.border} border rounded-xl h-full overflow-hidden`}
                  style={customThemeData ? { backgroundColor: customThemeData.specialKeyColor + '30' } : {}}>
                  {renderThemePickerPanel()}
                </div>
              ) : (
                renderDesktopKeyboard()
              )}
            </div>
            {/* Side panel */}
            {isSidePanelOpen && renderDesktopSidePanel()}
          </div>
        </div>

        {/* Settings modal overlay */}
        {renderDesktopSettingsModal()}

        {/* Floating mobile view toggle - always visible */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setDesktopView(false)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all"
          style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'white',
          }}
        >
          <Smartphone className="w-4 h-4" />
          <span className="text-xs font-semibold">Mobile View</span>
        </motion.button>
      </>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────
  const currentRows = symbolsActive ? SYMBOL_ROWS : ENGLISH_ROWS;

  return (
    <div className={`flex flex-col h-full ${t.bg} rounded-lg overflow-hidden transition-colors duration-300 relative ${desktopView ? 'desktop-keyboard-layout' : ''} ${t.isLive ? 'live-keyboard-active' : ''}`}
      style={customBgStyle}>
      {/* Live theme background overlay - 3D image with animation */}
      {t.isLive && t.liveClass && (
        <>
          {/* Base animated image */}
          <div className={`absolute inset-0 ${t.liveClass}`} style={{ borderRadius: 'inherit', zIndex: 0 }} />
          {/* Theme-specific animated effect layer */}
          <div className={`absolute inset-0 live-fx-${theme.replace('_live', '')} pointer-events-none`} style={{ borderRadius: 'inherit', zIndex: 1 }} />
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.45) 100%)',
            borderRadius: 'inherit',
            zIndex: 2
          }} />
        </>
      )}

      {/* ─── DESKTOP VIEW ─── */}
      {desktopView ? (
        <div className="flex-1 flex flex-col relative z-10">
          {renderDesktopView()}
        </div>
      ) : mode === 'themes' ? (
        <div className="flex-1 flex flex-col relative z-10">
          {renderThemePickerPanel()}
        </div>
      ) : (
        <>
          {/* Text Display Area */}
          <div className={`kb-text-area ${desktopView ? 'flex-1 min-h-[80px]' : 'flex-1 min-h-[60px]'} p-2 relative z-10`}>
            <div className={`h-full rounded-xl ${t.isLive ? 'border-white/10' : t.border} border p-2.5 overflow-y-auto`}
              style={customThemeData ? { backgroundColor: customThemeData.specialKeyColor + '40' } : t.isLive ? { backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' } : {}}>
              {text ? (
                <motion.p
                  key={text.slice(-1)}
                  initial={textBounce ? { scale: 1.02 } : {}}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${t.keyText}`}
                  style={customThemeData ? { color: customThemeData.keyTextColor } : {}}
                >{text}</motion.p>
              ) : (
                <p className={`text-sm italic opacity-40 ${t.keyText}`}
                  style={customThemeData ? { color: customThemeData.keyTextColor } : {}}
                >{language === 'english' ? 'Tap the keyboard to start typing...' : 'ቁልፉን መታ በማድረግ ይጻፉ...'}</p>
              )}
            </div>
          </div>

          {/* Suggestions Bar */}
          {mode === 'keyboard' && (
            <div className={`${t.isLive ? '' : t.tabBar} border-t border-b ${t.isLive ? 'border-white/10' : t.border} relative z-10`}
              style={t.isLive ? { backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' } : {}}>
              {renderSuggestions()}
            </div>
          )}

          {/* Mode Tab Bar */}
          <div className={`flex items-center gap-0.5 px-2 py-1.5 border-t ${t.isLive ? 'border-white/10' : t.border} ${t.isLive ? '' : t.tabBar} relative z-10`}
            style={customThemeData ? { backgroundColor: customThemeData.specialKeyColor + '20' } : t.isLive ? { backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' } : {}}>
            {[
              { id: 'keyboard' as KeyboardMode, label: language === 'english' ? 'ABC' : 'አማ', icon: Keyboard },
              { id: 'stickers' as KeyboardMode, label: 'Stickers', icon: Smile },
              { id: 'gifs' as KeyboardMode, label: 'GIFs', icon: Image },
              { id: 'clipboard' as KeyboardMode, label: 'Clip', icon: ClipboardList },
              { id: 'translate' as KeyboardMode, label: 'AI', icon: Sparkles },
              { id: 'handwriting' as KeyboardMode, label: 'Draw', icon: Pen },
              { id: 'settings' as KeyboardMode, label: 'Set', icon: Settings },
            ].map(tab => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleModeChange(tab.id)}
                className={`
                  flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all duration-200 relative
                  ${mode === tab.id
                    ? `${t.tabActive} ${t.tabActiveText} shadow-sm`
                    : `${t.keyText} opacity-60 hover:opacity-100`}
                `}
                style={mode === tab.id && customThemeData ? customAccentStyle : customThemeData ? { color: customThemeData.keyTextColor } : {}}
              >
                {mode === tab.id && (
                  <motion.div
                    className={`absolute inset-0 rounded-xl ${t.accent} opacity-20`}
                    animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                )}
                <tab.icon className="w-3.5 h-3.5 relative z-10" />
                <span className="text-[10px] font-medium relative z-10">{tab.label}</span>
              </motion.button>
            ))}
            {/* Theme Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => handleModeChange('themes')}
              className={`flex items-center justify-center w-8 h-8 rounded-xl ${t.suggestion} ${t.keyText} ${theme !== 'default' ? 'ring-1 ring-primary/30' : ''}`}
              style={customThemeData ? { color: customThemeData.keyTextColor } : {}}
              title="Change theme"
            >
              <Palette className="w-3.5 h-3.5" />
            </motion.button>
            {/* Dark Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => setAppTheme(appTheme === 'dark' ? 'light' : 'dark')}
              className={`flex items-center justify-center w-8 h-8 rounded-xl ${t.suggestion} ${t.keyText}`}
              style={customThemeData ? { color: customThemeData.keyTextColor } : {}}
              title="Toggle dark mode"
            >
              {mounted && appTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </motion.button>
            {/* Desktop View Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => setDesktopView(!desktopView)}
              className={`flex items-center justify-center w-8 h-8 rounded-xl ${t.suggestion} ${t.keyText}`}
              style={customThemeData ? { color: customThemeData.keyTextColor } : {}}
              title="Toggle desktop view"
            >
              <Monitor className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Keyboard Content */}
          <div className={`kb-input-area ${t.isLive ? 'bg-transparent' : t.bg} border-t ${t.border} relative z-10`}
            style={{
              ...(customThemeData ? { backgroundColor: customThemeData.bgColor + '80' } : {}),
              ...(t.isLive ? { backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' } : {})
            }}>
            <AnimatePresence mode="wait">
          {mode === 'keyboard' && (
            <motion.div
              key="keyboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <div className="flex flex-col gap-1.5 p-2">
                {/* ─── Number Row (conditionally visible based on settings) ─── */}
                {!symbolsActive && showNumberRow && (
                  <div className="flex gap-1">
                    {(language === 'english'
                      ? ['1','2','3','4','5','6','7','8','9','0']
                      : ETHIOPIAN_NUM_ROW_1
                    ).map((num, i) => (
                      <motion.button key={i}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => updateText(text + num)}
                        className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-xl text-sm font-medium ${t.suggestion} ${t.keyText} ${t.keyHover} ${t.border} border`}
                      >
                        {num}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* ─── Vowel Family Row (when Amharic consonant selected) ─── */}
                {renderVowelRow()}

                {/* ─── English Keyboard ─── */}
                {language === 'english' && currentRows && currentRows.map((row, ri) => (
                  <div key={ri} className={`flex gap-1 ${ri === 1 ? 'px-4' : ''}`}>
                    {row.map(key => renderEnglishKey(key))}
                  </div>
                ))}

                {/* ─── Amharic Letter Keyboard ─── */}
                {language === 'amharic' && !symbolsActive && (
                  <>
                    {AMHARIC_ROWS.map((row, ri) => (
                      <div key={ri} className="flex gap-1 justify-center">
                        {row.map(consonant => {
                          const isHovered = hoveredKey === consonant;
                          const isSelected = selectedConsonant === consonant;
                          return (
                            <motion.button
                              key={consonant}
                              whileTap={{ scale: 0.92 }}
                              whileHover={{ scale: 1.08, y: -1 }}
                              onMouseEnter={() => setHoveredKey(consonant)}
                              onMouseLeave={() => setHoveredKey(null)}
                              onClick={() => handleAmharicPress(consonant)}
                              className={`
                                relative flex items-center justify-center flex-1 ${kbKeyHeight} rounded-xl font-medium
                                transition-all duration-150 select-none text-base
                                ${isSelected ? `ring-2 ring-yellow-500/60` : ''}
                                ${isHovered ? `${t.keyHover} shadow-md` : ''}
                                ${t.key} ${t.keyText} ${t.border} border shadow-sm
                              `}
                            >
                              {/* Change 7: Glow effect on active consonant */}
                              {isSelected && (
                                <motion.div
                                  className="absolute inset-0 rounded-xl"
                                  animate={{ boxShadow: ['0 0 0px rgba(234,179,8,0)', '0 0 12px rgba(234,179,8,0.4)', '0 0 0px rgba(234,179,8,0)'] }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                />
                              )}
                              {consonant}
                            </motion.button>
                          );
                        })}
                      </div>
                    ))}
                    {/* Change 3: Amharic special keys row with language button */}
                    <div className="flex gap-1">
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => { setSymbolsActive(true); setSelectedConsonant(null); }}
                        className={`flex-[1.5] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.specialKey} ${t.keyText} text-xs font-medium`}>
                        ፩፪
                      </motion.button>
                      {/* Language toggle button in Amharic row */}
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                        onClick={handleLanguageToggle}
                        className={`flex-[1.5] flex items-center justify-center gap-1 ${kbKeyHeight} rounded-xl ${t.accent} ${t.accentText} text-[10px] font-bold shadow-sm`}
                        title={`Switch to ${language === 'english' ? 'Amharic' : 'English'}`}
                      >
                        <Globe className="w-3 h-3" />EN
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('space')}
                        className={`flex-[3] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.key} ${t.keyText} ${t.border} border shadow-sm text-xs font-medium`}>
                        አማርኛ
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('backspace')}
                        className={`flex-[1.5] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.specialKey} ${t.keyText}`}>
                        <Delete className="w-4 h-4" />
                      </motion.button>
                    </div>

                  </>
                )}

                {/* ─── Amharic Symbols Mode (Ethiopian numbers + symbols) ─── */}
                {language === 'amharic' && symbolsActive && (
                  <>
                    <div className="flex gap-1 justify-center">
                      {ETHIOPIAN_NUM_ROW_1.map((num, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + num)}
                          className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-xl text-base font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                          {num}
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex gap-1 justify-center">
                      {ETHIOPIAN_NUM_ROW_2.map((num, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + num)}
                          className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-xl text-base font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                          {num}
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex gap-1 justify-center">
                      {ETHIOPIAN_SYM_ROW.map((sym, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + sym)}
                          className={`flex-1 flex items-center justify-center ${kbKeyHeight} rounded-xl text-sm font-medium ${t.key} ${t.keyText} ${t.border} border shadow-sm ${t.keyHover}`}>
                          {sym}
                        </motion.button>
                      ))}
                    </div>
                    {/* More Ethiopian punctuation & common symbols */}
                    <div className="flex gap-1 justify-center">
                      {['′','″','«','»','—','…','·','⟐'].map((sym, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.92 }}
                          onClick={() => updateText(text + sym)}
                          className={`flex-1 flex items-center justify-center h-9 rounded-lg text-sm font-medium ${t.suggestion} ${t.keyText} ${t.keyHover}`}>
                          {sym}
                        </motion.button>
                      ))}
                    </div>
                    {/* Change 3: Amharic symbols bottom row with language button */}
                    <div className="flex gap-1">
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => setSymbolsActive(false)}
                        className={`flex-[1.5] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.specialKey} ${t.keyText} text-xs`}>
                        አማ
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
                        onClick={handleLanguageToggle}
                        className={`flex-[1.5] flex items-center justify-center gap-1 ${kbKeyHeight} rounded-xl ${t.accent} ${t.accentText} text-[10px] font-bold shadow-sm`}
                      >
                        <Globe className="w-3 h-3" />EN
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('space')}
                        className={`flex-[3] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.key} ${t.keyText} ${t.border} border shadow-sm text-xs`}>
                        አማርኛ
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => handleKeyPress('backspace')}
                        className={`flex-[1.5] flex items-center justify-center ${kbKeyHeight} rounded-xl ${t.specialKey} ${t.keyText}`}>
                        <Delete className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </>
                )}

                {/* ─── English extra symbols when in symbols mode ─── */}
                {language === 'english' && symbolsActive && (
                  <div className="flex gap-1">
                    {['_','=','^','<','>','{','}'].map((sym, i) => (
                      <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                        onClick={() => updateText(text + sym)}
                        className={`flex-1 flex items-center justify-center h-9 rounded-lg text-sm ${t.suggestion} ${t.keyText} ${t.keyHover}`}>
                        {sym}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {mode === 'stickers' && (
            <motion.div key="stickers" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={kbPanelHeight}>
              {renderStickers()}
            </motion.div>
          )}
          {mode === 'gifs' && (
            <motion.div key="gifs" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={kbPanelHeight}>
              {renderGifs()}
            </motion.div>
          )}
          {mode === 'clipboard' && (
            <motion.div key="clipboard" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={kbPanelHeight}>
              {renderClipboard()}
            </motion.div>
          )}
          {mode === 'translate' && (
            <motion.div key="translate" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={keyboardHeight === 'compact' ? 'h-[260px]' : keyboardHeight === 'tall' ? 'h-[360px]' : 'h-[300px]'}>
              {renderTranslate()}
            </motion.div>
          )}
          {mode === 'handwriting' && (
            <motion.div key="handwriting" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={keyboardHeight === 'compact' ? 'h-[280px]' : keyboardHeight === 'tall' ? 'h-[380px]' : 'h-[320px]'}>
              {renderHandwriting()}
            </motion.div>
          )}
          {mode === 'settings' && (
            <motion.div key="settings" variants={getPanelVariants(getDirection())} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className={keyboardHeight === 'compact' ? 'h-[280px]' : keyboardHeight === 'tall' ? 'h-[380px]' : 'h-[320px]'}>
              {renderSettings()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )}
    </div>
  );
}
