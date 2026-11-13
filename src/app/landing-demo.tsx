'use client';

import React, { useRef, useState } from 'react';
import { ArrowRight, Delete, CornerDownLeft, Globe, X, ArrowBigUp } from 'lucide-react';

/*
  The landing page's keyboard demo, built for the page (not the app's own
  keyboard component): English QWERTY, the Ge'ez fidel with all seven forms per
  consonant, and AI translation of whatever has been typed.
*/

const ROWS_EN = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

/* First code point of each consonant's block in Unicode's Ethiopic range; the
   seven orders (ግዕዝ … ሳብዕ) follow it in order. */
const CONSONANT_BASES = [
  0x1200, 0x1208, 0x1210, 0x1218, 0x1220, 0x1228, 0x1230, 0x1238, 0x1240,
  0x1260, 0x1270, 0x1278, 0x1280, 0x1290, 0x1298, 0x12a0, 0x12a8, 0x12c8,
  0x12d0, 0x12d8, 0x12e8, 0x12f0, 0x1300, 0x1308, 0x1320, 0x1328, 0x1330,
  0x1338, 0x1340, 0x1348, 0x1350,
];
const CONSONANTS = CONSONANT_BASES.map((c) => String.fromCodePoint(c));
const PUNCT = ['።', '፣', '፧'];
const GRID_AM = [...CONSONANTS.map((c, i) => ({ ch: c, base: CONSONANT_BASES[i] })), ...PUNCT.map((p) => ({ ch: p, base: 0 }))];
const ORDERS = ['ግዕዝ', 'ካዕብ', 'ሣልስ', 'ራብዕ', 'ኀምስ', 'ሳድስ', 'ሳብዕ'];

const MAX = 240;

type Lang = 'en' | 'am';

export default function LandingDemo() {
  const [lang, setLang] = useState<Lang>('en');
  const [text, setText] = useState('');
  const [shift, setShift] = useState(true);
  const [open, setOpen] = useState<number | null>(null); // base of the consonant whose forms are showing
  const [result, setResult] = useState<{ text: string; to: Lang } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const lastTranslate = useRef(0);

  const add = (s: string) => {
    setResult(null);
    setErr('');
    setText((t) => (Array.from(t).length >= MAX ? t : t + s));
  };
  const typeLetter = (ch: string) => {
    add(shift ? ch.toUpperCase() : ch);
    setShift(false);
  };
  const back = () => {
    setResult(null);
    setErr('');
    setText((t) => {
      const next = Array.from(t).slice(0, -1).join('');
      if (!next || /[.!?]\s*$/.test(next) || next.endsWith('\n')) setShift(true);
      return next;
    });
  };
  const space = () => {
    add(' ');
    if (/[.!?።]\s?$/.test(text)) setShift(true);
  };
  const switchLang = () => {
    setLang((l) => (l === 'en' ? 'am' : 'en'));
    setOpen(null);
  };

  const translate = async () => {
    const q = text.trim();
    if (!q || busy) return;
    // The demo is public and the translator costs money: keep it to one line at a time.
    if (Date.now() - lastTranslate.current < 4000) {
      setErr('One moment, then try again.');
      return;
    }
    lastTranslate.current = Date.now();
    const to: Lang = /[ሀ-፿]/.test(q) ? 'en' : 'am';
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: q.slice(0, 200), sourceLang: to === 'am' ? 'English' : 'Amharic', targetLang: to === 'am' ? 'Amharic' : 'English' }),
      });
      const data = await r.json();
      if (!r.ok || !data.translation) throw new Error('x');
      setResult({ text: data.translation, to });
    } catch {
      setErr("Couldn't translate just now. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const hasText = text.length > 0;
  const textIsAm = /[ሀ-፿]/.test(text);

  return (
    <div className="kd">
      <div className="kd__bar">
        <span className="kd__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={28} height={28} />
          AkAI
        </span>
        <div className="kd__seg" role="group" aria-label="Keyboard language">
          <button type="button" aria-pressed={lang === 'en'} onClick={() => lang !== 'en' && switchLang()}>EN</button>
          <button type="button" aria-pressed={lang === 'am'} onClick={() => lang !== 'am' && switchLang()} className="land-geez">አማ</button>
        </div>
      </div>

      <div className="kd__sheet">
        <div className="kd__paper" aria-live="polite">
          {hasText ? (
            <p className={`kd__typed ${textIsAm ? 'land-geez' : ''}`}>
              {text}
              <span className="land-caret" aria-hidden="true" />
            </p>
          ) : (
            <p className="kd__ph">
              {lang === 'en' ? 'Tap the keys and type a line…' : 'ቁልፎቹን ነክተው ይጻፉ…'}
              <span className="land-caret" aria-hidden="true" />
            </p>
          )}
          {result && (
            <div className="kd__result">
              <span className="kd__tag">{result.to === 'am' ? 'AMHARIC · አማርኛ' : 'ENGLISH'}</span>
              <p className={result.to === 'am' ? 'land-geez' : ''}>{result.text}</p>
            </div>
          )}
          {err && <p className="kd__err" role="status">{err}</p>}
        </div>
        <div className="kd__actions">
          <button type="button" className="kd__translate" onClick={translate} disabled={!hasText || busy}>
            {busy ? 'Translating…' : (<>Translate <ArrowRight size={16} aria-hidden="true" /></>)}
          </button>
          <button type="button" className="kd__clear" onClick={() => { setText(''); setResult(null); setErr(''); setShift(true); }} disabled={!hasText} aria-label="Clear text">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="kd__keys">
        {lang === 'en' ? (
          <>
            {ROWS_EN.map((row, ri) => (
              <div className="kd__row" key={row} style={{ paddingInline: ri === 1 ? '5%' : 0 }}>
                {ri === 2 && (
                  <button type="button" className={`kd-key kd-key--mod ${shift ? 'is-on' : ''}`} style={{ flex: 1.5 }} onClick={() => setShift((s) => !s)} aria-pressed={shift} aria-label="Shift">
                    <ArrowBigUp size={18} aria-hidden="true" />
                  </button>
                )}
                {row.split('').map((ch) => (
                  <button type="button" key={ch} className="kd-key" onClick={() => typeLetter(ch)}>
                    {shift ? ch.toUpperCase() : ch}
                  </button>
                ))}
                {ri === 2 && (
                  <button type="button" className="kd-key kd-key--mod" style={{ flex: 1.5 }} onClick={back} aria-label="Backspace">
                    <Delete size={18} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            <div className="kd__row">
              <button type="button" className="kd-key kd-key--mod" style={{ flex: 1.4 }} onClick={() => add(',')}>,</button>
              <button type="button" className="kd-key kd-key--lang" style={{ flex: 1.6 }} onClick={switchLang} aria-label="Switch to Amharic">
                <Globe size={16} aria-hidden="true" /> <span className="land-geez">አማ</span>
              </button>
              <button type="button" className="kd-key kd-key--space" style={{ flex: 5 }} onClick={space} aria-label="Space">English</button>
              <button type="button" className="kd-key kd-key--mod" style={{ flex: 1.4 }} onClick={() => { add('.'); setShift(true); }}>.</button>
              <button type="button" className="kd-key kd-key--go" style={{ flex: 1.6 }} onClick={() => { add('\n'); setShift(true); }} aria-label="New line">
                <CornerDownLeft size={18} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <>
            {open !== null && (
              <div className="kd__forms" role="group" aria-label="Seven forms">
                {ORDERS.map((o, k) => (
                  <button type="button" key={o} className="kd-form" onClick={() => { add(String.fromCodePoint(open + k)); setOpen(null); }}>
                    <span className="land-geez">{String.fromCodePoint(open + k)}</span>
                    <small className="land-geez">{o}</small>
                  </button>
                ))}
              </div>
            )}
            <div className="kd__grid">
              {GRID_AM.map(({ ch, base }) => (
                <button
                  type="button"
                  key={ch}
                  className={`kd-key land-geez ${open === base && base ? 'is-on' : ''} ${base ? '' : 'kd-key--mod'}`}
                  aria-label={base ? `${ch}, show its seven forms` : ch}
                  onClick={() => (base ? setOpen(open === base ? null : base) : add(ch))}
                >
                  {ch}
                </button>
              ))}
            </div>
            <div className="kd__row">
              <button type="button" className="kd-key kd-key--lang" style={{ flex: 1.6 }} onClick={switchLang} aria-label="Switch to English">
                <Globe size={16} aria-hidden="true" /> EN
              </button>
              <button type="button" className="kd-key kd-key--space land-geez" style={{ flex: 5 }} onClick={() => add(' ')} aria-label="Space">አማርኛ</button>
              <button type="button" className="kd-key kd-key--mod" style={{ flex: 1.5 }} onClick={back} aria-label="Backspace">
                <Delete size={18} aria-hidden="true" />
              </button>
              <button type="button" className="kd-key kd-key--go" style={{ flex: 1.5 }} onClick={() => add('\n')} aria-label="New line">
                <CornerDownLeft size={18} aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
