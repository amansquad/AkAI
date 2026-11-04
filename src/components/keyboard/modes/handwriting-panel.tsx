'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, PenTool, RotateCcw, Redo2, Sparkles, Undo2 } from 'lucide-react';
import type { ThemeDef } from '@/components/keyboard-data';

interface KeyboardHandwritingPanelProps {
  t: ThemeDef;
  language: 'english' | 'amharic';
  text: string;
  updateText: (newText: string) => void;
  customAccentStyle: React.CSSProperties;

  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  drawingPaths: { x: number; y: number }[][];
  hwUndoStack: { x: number; y: number }[][][];
  hwRedoStack: { x: number; y: number }[][][];
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  strokeColor: string;
  setStrokeColor: (c: string) => void;
  hwAutoRecognize: boolean;
  setHwAutoRecognize: (v: boolean) => void;
  hwStrokes: number;
  hwRecognizing: boolean;

  hwSuggestions: string[];
  hwWordSuggestions: string[];
  hwSentenceSuggestions: string[];
  selectedHwSuggestion: string | null;
  setSelectedHwSuggestion: (s: string | null) => void;

  startDrawing: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  stopDrawing: () => void;
  undoHwStroke: () => void;
  redoHwStroke: () => void;
  recognizeHandwriting: () => void;
  clearCanvas: () => void;
  confirmHwSuggestion: () => void;
}

export default function KeyboardHandwritingPanel({
  t, language, text, updateText, customAccentStyle,
  canvasRef, drawingPaths, hwUndoStack, hwRedoStack,
  strokeWidth, setStrokeWidth, strokeColor, setStrokeColor,
  hwAutoRecognize, setHwAutoRecognize, hwStrokes, hwRecognizing,
  hwSuggestions, hwWordSuggestions, hwSentenceSuggestions,
  selectedHwSuggestion, setSelectedHwSuggestion,
  startDrawing, draw, stopDrawing, undoHwStroke, redoHwStroke,
  recognizeHandwriting, clearCanvas, confirmHwSuggestion,
}: KeyboardHandwritingPanelProps) {
  const hasAnySuggestions = hwSuggestions.length > 0 || hwWordSuggestions.length > 0 || hwSentenceSuggestions.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden relative z-10 glass-container">
      {/* Premium Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b shrink-0 ${t.border}`}
        style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${t.accent} ${t.accentText}`} style={customAccentStyle}>
            <PenTool className="w-3.5 h-3.5" />
          </div>
          <span className={`text-xs font-bold tracking-tight ${t.keyText}`}>
            {language === 'english' ? 'Handwriting' : 'የእጅ ጽሑፍ'}
          </span>
          {hwStrokes > 0 && (
            <span className="text-[9px] opacity-40 font-mono">{hwStrokes}s</span>
          )}
        </div>
        <div className="flex gap-1.5 items-center">
          {/* Undo */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={undoHwStroke} disabled={hwUndoStack.length === 0}
            className={`h-7 w-7 p-0 rounded-full flex items-center justify-center transition-all ${hwUndoStack.length === 0 ? 'opacity-30' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
            <Undo2 className="w-3.5 h-3.5" />
          </motion.button>
          {/* Redo */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={redoHwStroke} disabled={hwRedoStack.length === 0}
            className={`h-7 w-7 p-0 rounded-full flex items-center justify-center transition-all ${hwRedoStack.length === 0 ? 'opacity-30' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
            <Redo2 className="w-3.5 h-3.5" />
          </motion.button>
          {/* Recognize */}
          {drawingPaths.length > 0 && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={recognizeHandwriting} disabled={hwRecognizing}
              className={`h-7 px-3 text-[10px] font-bold gap-1 rounded-full flex items-center ${t.accentText} shadow-lg`}
              style={customAccentStyle}>
              {hwRecognizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {hwRecognizing ? '...' : 'AI'}
            </motion.button>
          )}
          {/* Clear */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={clearCanvas}
            className="h-7 w-7 p-0 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-red-500/20 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Tools row - stroke width & auto-recognize toggle */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-1.5 border-b" style={{ background: 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-1.5">
          {[2, 3, 5, 8].map(w => (
            <button key={w} onClick={() => setStrokeWidth(w)}
              className={`rounded-full transition-all ${strokeWidth === w ? 'ring-2 ring-cyan-400/60' : 'opacity-40 hover:opacity-70'}`}
              style={{ width: w * 2 + 8, height: w * 2 + 8, backgroundColor: strokeColor }}>
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-1.5">
          {['#ffffff', '#00d4ff', '#ff6b6b', '#51cf66', '#ffd43b'].map(c => (
            <button key={c} onClick={() => setStrokeColor(c)}
              className={`w-4 h-4 rounded-full border transition-all ${strokeColor === c ? 'ring-2 ring-white/50 scale-110' : 'border-white/20 hover:scale-110'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="w-px h-4 bg-white/10" />
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={hwAutoRecognize} onChange={e => setHwAutoRecognize(e.target.checked)}
            className="w-3 h-3 accent-cyan-400" />
          <span className="text-[9px] opacity-50 font-medium">Auto-AI</span>
        </label>
      </div>

      {/* Suggestions area */}
      <div className="shrink-0 relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
        {hasAnySuggestions ? (
          <div className="px-3 py-2 max-h-[140px] overflow-y-auto custom-scrollbar">
            {hwSentenceSuggestions.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5 opacity-70">
                  {language === 'english' ? 'Predictions' : 'ግምቶች'}
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {hwSentenceSuggestions.map((sug, i) => (
                    <motion.button key={`s${i}`} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedHwSuggestion(sug);
                        const sep = text.length > 0 && !text.endsWith(' ') ? ' ' : '';
                        updateText(text + sep + sug);
                        clearCanvas();
                      }}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all
                        ${selectedHwSuggestion === sug
                          ? 'bg-emerald-500/30 text-white border-emerald-400/50'
                          : 'bg-white/5 text-white/80 border-white/10 hover:border-white/30'}`}>
                      {sug}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {hwWordSuggestions.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-300 mb-1.5 opacity-70">
                  {language === 'english' ? 'Words' : 'ቃላት'}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {hwWordSuggestions.map((sug, i) => (
                    <motion.button key={`w${i}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedHwSuggestion(sug);
                        const sep = text.length > 0 && !text.endsWith(' ') ? ' ' : '';
                        updateText(text + sep + sug);
                        clearCanvas();
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all
                        ${selectedHwSuggestion === sug
                          ? 'bg-cyan-500/30 text-white border-cyan-400/50'
                          : 'bg-white/5 text-white/80 border-white/10'}`}>
                      {sug}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {hwSuggestions.length > 0 && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300 mb-1.5 opacity-70">
                  {language === 'english' ? 'Letters' : 'ፊደላት'}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {hwSuggestions.map((sug, i) => (
                    <motion.button key={`c${i}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedHwSuggestion(sug);
                        updateText(text + sug);
                        clearCanvas();
                      }}
                      className={`flex items-center justify-center min-w-[36px] h-9 rounded-lg text-base font-bold border transition-all
                        ${selectedHwSuggestion === sug
                          ? 'bg-amber-500/30 text-white border-amber-400/50 shadow-lg'
                          : 'bg-white/5 text-white/90 border-white/10'}`}>
                      {sug}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-4 text-center bg-black/10">
            {hwRecognizing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400/50" />
                <p className="text-[11px] font-medium text-cyan-200/80">Analysing...</p>
              </div>
            ) : (
              <p className="text-[10px] opacity-30 font-medium">
                {language === 'english'
                  ? '✍️ Draw characters, words, or sentences below'
                  : '✍️ ከታች ፊደላት፣ ቃላት ወይም ዓረፍተ ነገሮች ይጻፉ'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div className="flex-1 p-2 min-h-0 relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={280}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full rounded-xl border-2 border-white/5 cursor-crosshair touch-none transition-all"
          style={{
            touchAction: 'none',
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.5) 100%)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
          }}
        />
        {drawingPaths.length === 0 && !hwRecognizing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-8">
            <span className="text-3xl font-black italic tracking-widest uppercase opacity-30">AkAI</span>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {hasAnySuggestions && selectedHwSuggestion && (
        <div className="shrink-0 px-3 py-2 border-t bg-black/40 backdrop-blur-md border-white/10">
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={confirmHwSuggestion}
            className="w-full h-9 gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-xl shadow-cyan-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Insert &quot;{selectedHwSuggestion.length > 22 ? selectedHwSuggestion.substring(0, 22) + '...' : selectedHwSuggestion}&quot;
          </motion.button>
        </div>
      )}
    </div>
  );
}
