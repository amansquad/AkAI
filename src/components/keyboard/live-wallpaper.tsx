'use client';

import React, { useEffect, useRef, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface LiveWallpaperProps {
  theme: string;
  className?: string;
}

type AnimState = Record<string, unknown>;

type AnimationFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  mx: number,
  my: number,
  state: AnimState
) => void;

// ─── Utility helpers ────────────────────────────────────────────────────────

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const dist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const hsl = (h: number, s: number, l: number, a = 1) =>
  `hsla(${h % 360},${s}%,${l}%,${a})`;

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  hue: number; sat: number; light: number; alpha: number;
  [key: string]: unknown;
}

function makeParticle(overrides: Partial<Particle> = {}): Particle {
  return {
    x: 0, y: 0, vx: 0, vy: 0,
    life: 1, maxLife: 1, size: 2,
    hue: 0, sat: 80, light: 60, alpha: 1,
    ...overrides,
  };
}

// ─── 1. Aurora ──────────────────────────────────────────────────────────────

function drawAurora(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.particles = Array.from({ length: 120 }, () =>
      makeParticle({
        x: rand(0, w), y: rand(0, h * 0.6),
        vx: rand(-0.2, 0.2), vy: rand(-0.3, 0.1),
        size: rand(1, 3), maxLife: rand(3, 8), life: rand(0, 1),
        hue: rand(120, 200), sat: rand(70, 100), light: rand(50, 80),
      })
    );
  }
  const particles = state.particles as Particle[];

  // Dark sky background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#020014');
  bg.addColorStop(0.5, '#050828');
  bg.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Aurora curtain layers
  const mouseInfluenceX = (mx / w - 0.5) * 60;
  const mouseInfluenceY = (my / h - 0.5) * 30;

  for (let layer = 0; layer < 4; layer++) {
    const baseY = h * (0.15 + layer * 0.1) + mouseInfluenceY * (layer * 0.3);
    const hues = [140, 170, 200, 280]; // green, cyan, blue, purple
    const alphas = [0.15, 0.12, 0.1, 0.08];

    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) {
      const wave1 = Math.sin((x + time * 40 + mouseInfluenceX) * 0.008 + layer) * 60;
      const wave2 = Math.sin((x - time * 25) * 0.012 + layer * 2) * 30;
      const wave3 = Math.sin((x + time * 60) * 0.005) * 20;
      const y = baseY + wave1 + wave2 + wave3;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, baseY - 80, 0, baseY + 200);
    grad.addColorStop(0, hsl(hues[layer], 90, 65, 0));
    grad.addColorStop(0.3, hsl(hues[layer], 90, 60, alphas[layer]));
    grad.addColorStop(0.6, hsl(hues[layer], 80, 50, alphas[layer] * 0.6));
    grad.addColorStop(1, hsl(hues[layer], 70, 30, 0));
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Shimmer particles
  for (const p of particles) {
    p.x += p.vx + Math.sin(time + p.y * 0.01) * 0.3;
    p.y += p.vy + Math.cos(time * 0.5 + p.x * 0.005) * 0.2;
    p.life -= 0.002;

    if (p.life <= 0 || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h * 0.8) {
      Object.assign(p, {
        x: rand(0, w), y: rand(0, h * 0.5),
        vx: rand(-0.3, 0.3), vy: rand(-0.4, 0.1),
        life: 1, maxLife: rand(3, 8), size: rand(1, 3),
        hue: rand(120, 200), light: rand(50, 80),
      });
    }

    const a = p.life * 0.6 * (0.5 + 0.5 * Math.sin(time * 3 + p.x));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, p.sat, p.light, a);
    ctx.fill();
  }

  // Bright stars
  for (let i = 0; i < 30; i++) {
    const sx = (Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5) * w;
    const sy = (Math.cos(i * 269.5 + 183.3) * 0.5 + 0.5) * h * 0.5;
    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 2 + i * 1.7));
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2 * twinkle, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.6 * twinkle})`;
    ctx.fill();
  }
}

// ─── 2. Lava ────────────────────────────────────────────────────────────────

function drawLava(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.bubbles = Array.from({ length: 30 }, () => ({
      x: rand(0, w), y: h - rand(0, h * 0.3),
      r: rand(8, 30), speed: rand(0.3, 1.2),
      phase: rand(0, Math.PI * 2), hue: rand(0, 40),
    }));
    state.embers = Array.from({ length: 100 }, () =>
      makeParticle({
        x: rand(0, w), y: h + rand(0, 50),
        vx: rand(-0.5, 0.5), vy: rand(-1.5, -0.3),
        size: rand(1, 4), maxLife: rand(2, 6), life: rand(0, 1),
        hue: rand(10, 50), sat: 100, light: rand(50, 80),
      })
    );
    state.veins = Array.from({ length: 15 }, () => ({
      points: Array.from({ length: 8 }, (_, j) => ({
        x: rand(0, w), y: h * 0.5 + rand(-h * 0.3, h * 0.3),
        ox: rand(0, w), oy: rand(0, h),
      })),
      hue: rand(0, 30),
    }));
  }
  const { bubbles, embers, veins } = state as { bubbles: typeof state.bubbles extends (infer T)[] ? T[] : never[]; embers: Particle[]; veins: typeof state.veins extends (infer T)[] ? T[] : never[] };

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1a0000');
  bg.addColorStop(0.4, '#2d0a00');
  bg.addColorStop(0.7, '#4a1000');
  bg.addColorStop(1, '#8b2000');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Glowing veins/cracks
  const lavaVeins = veins as { points: { x: number; y: number; ox: number; oy: number }[]; hue: number }[];
  for (const vein of lavaVeins) {
    ctx.beginPath();
    const pts = vein.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const wobbleX = Math.sin(time * 0.5 + i) * 10;
      const wobbleY = Math.cos(time * 0.3 + i * 0.7) * 8;
      ctx.lineTo(pts[i].x + wobbleX, pts[i].y + wobbleY);
    }
    ctx.strokeStyle = hsl(vein.hue, 100, 55, 0.3 + 0.15 * Math.sin(time * 2 + vein.hue));
    ctx.lineWidth = 2 + Math.sin(time * 3) * 1;
    ctx.shadowColor = hsl(vein.hue, 100, 60, 0.8);
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Bubbles
  for (const b of bubbles as { x: number; y: number; r: number; speed: number; phase: number; hue: number }[]) {
    b.y -= b.speed;
    b.x += Math.sin(time + b.phase) * 0.5;
    if (b.y + b.r < 0) {
      b.y = h + b.r;
      b.x = rand(0, w);
    }

    // Mouse splash effect
    const d = dist(b.x, b.y, mx, my);
    if (d < 80) {
      b.x += (b.x - mx) * 0.05;
      b.y += (b.y - my) * 0.05;
    }

    const pulse = 1 + 0.1 * Math.sin(time * 3 + b.phase);
    const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * pulse);
    grad.addColorStop(0, hsl(b.hue, 100, 70, 0.6));
    grad.addColorStop(0.6, hsl(b.hue + 10, 100, 50, 0.3));
    grad.addColorStop(1, hsl(b.hue + 20, 80, 30, 0));
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Embers
  for (const p of embers) {
    p.x += p.vx + Math.sin(time * 2 + p.x * 0.01) * 0.3;
    p.y += p.vy;
    p.life -= 0.005;

    if (p.life <= 0 || p.y < -20) {
      Object.assign(p, {
        x: rand(0, w), y: h + rand(0, 30),
        vx: rand(-0.5, 0.5), vy: rand(-1.5, -0.3),
        life: 1, size: rand(1, 4), hue: rand(10, 50), light: rand(50, 80),
      });
    }

    const a = p.life * 0.8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, 100, p.light, a);
    ctx.shadowColor = hsl(p.hue, 100, 60, 0.5);
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ─── 3. Ocean ───────────────────────────────────────────────────────────────

function drawOcean(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.ripples = [] as { x: number; y: number; r: number; alpha: number }[];
    state.fish = Array.from({ length: 6 }, () => ({
      x: rand(-50, w + 50), y: rand(h * 0.5, h),
      speed: rand(0.3, 1.2), dir: Math.random() > 0.5 ? 1 : -1,
      size: rand(8, 20), phase: rand(0, Math.PI * 2),
    }));
  }
  const ripples = (state.ripples || []) as { x: number; y: number; r: number; alpha: number }[];
  const fish = state.fish as { x: number; y: number; speed: number; dir: number; size: number; phase: number }[];

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.4);
  sky.addColorStop(0, '#001133');
  sky.addColorStop(1, '#003366');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Underwater
  const water = ctx.createLinearGradient(0, h * 0.35, 0, h);
  water.addColorStop(0, '#004477');
  water.addColorStop(0.5, '#002255');
  water.addColorStop(1, '#001122');
  ctx.fillStyle = water;
  ctx.fillRect(0, h * 0.35, w, h * 0.65);

  // Caustic light patterns
  for (let i = 0; i < 20; i++) {
    const cx = (Math.sin(i * 1.3 + time * 0.8) * 0.5 + 0.5) * w;
    const cy = h * 0.4 + (Math.cos(i * 2.1 + time * 0.5) * 0.5 + 0.5) * h * 0.5;
    const cr = 20 + 15 * Math.sin(time + i);
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100,200,255,${0.03 + 0.02 * Math.sin(time * 2 + i)})`;
    ctx.fill();
  }

  // Rolling waves
  for (let layer = 0; layer < 4; layer++) {
    const baseY = h * (0.32 + layer * 0.04);
    const mouseWave = (mx / w - 0.5) * 15;

    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 3) {
      const wave = Math.sin((x + time * (30 + layer * 10) + mouseWave) * 0.015 + layer) * (12 - layer * 2)
        + Math.sin((x - time * 20) * 0.008) * 8;
      ctx.lineTo(x, baseY + wave);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const alpha = 0.25 - layer * 0.04;
    ctx.fillStyle = `rgba(${0 + layer * 10},${60 + layer * 20},${140 + layer * 15},${alpha})`;
    ctx.fill();

    // Foam crests on top wave
    if (layer === 0) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const wave = Math.sin((x + time * 30 + mouseWave) * 0.015) * 12
          + Math.sin((x - time * 20) * 0.008) * 8;
        const foamAlpha = Math.max(0, Math.sin(x * 0.03 + time * 2) * 0.4);
        if (foamAlpha > 0.1) {
          ctx.moveTo(x, baseY + wave - 2);
          ctx.arc(x, baseY + wave - 2, 2 + foamAlpha * 3, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
    }
  }

  // Fish silhouettes
  for (const f of fish) {
    f.x += f.speed * f.dir;
    f.y += Math.sin(time + f.phase) * 0.3;
    if (f.x > w + 60) { f.x = -50; f.dir = 1; }
    if (f.x < -60) { f.x = w + 50; f.dir = -1; }

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.dir, 1);
    ctx.beginPath();
    // Body
    ctx.ellipse(0, 0, f.size, f.size * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,30,60,0.4)';
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(-f.size * 0.7, 0);
    ctx.lineTo(-f.size * 1.3, -f.size * 0.35);
    ctx.lineTo(-f.size * 1.3, f.size * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Ripples from mouse
  ripples.push({ x: mx, y: my, r: 0, alpha: 0.5 });
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rip = ripples[i];
    rip.r += 2;
    rip.alpha -= 0.01;
    if (rip.alpha <= 0) { ripples.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(150,220,255,${rip.alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (ripples.length > 20) ripples.splice(0, ripples.length - 20);
  state.ripples = ripples;
}

// ─── 4. Neon Pulse (Ultra Enhanced) ────────────────────────────────────────

function drawNeonPulse(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.sparks = Array.from({ length: 200 }, () =>
      makeParticle({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-2, 2), vy: rand(-2, 2),
        size: rand(1, 3), maxLife: rand(1, 4), life: rand(0, 1),
        hue: rand(270, 340), sat: 100, light: rand(60, 90),
      })
    );
    state.shapes = Array.from({ length: 6 }, () => ({
      x: rand(w * 0.15, w * 0.85), y: rand(h * 0.15, h * 0.85),
      r: rand(20, 55), rot: rand(0, Math.PI * 2),
      speed: rand(0.005, 0.02), sides: Math.floor(rand(3, 7)),
      hue: rand(270, 330),
    }));
    // Lightning bolt state
    state.lightningBolts = [] as { segments: { x: number; y: number }[]; life: number; hue: number }[];
    state.lastLightning = 0;
    // Shockwave rings state
    state.shockwaves = [] as { x: number; y: number; r: number; maxR: number; alpha: number; hue: number }[];
    // Energy beams state
    state.energyBeams = [] as { x: number; y: number; horizontal: boolean; life: number; hue: number; width: number }[];
    state.lastBeam = 0;
    // Neon rings from mouse
    state.neonRings = [] as { x: number; y: number; r: number; maxR: number; life: number; hue: number }[];
    state.lastRing = 0;
    // Digital rain columns
    const colW = 14;
    const cols = Math.ceil(w / colW);
    state.digitalColumns = Array.from({ length: cols }, () => ({
      y: rand(-h, 0), speed: rand(0.5, 2), chars: [] as string[],
    }));
    const charSet = '01アイウエオカキクケコ⚡█▓▒░';
    for (const col of (state.digitalColumns as { y: number; speed: number; chars: string[] }[])) {
      col.chars = Array.from({ length: Math.ceil(h / 14) + 3 }, () => charSet[Math.floor(Math.random() * charSet.length)]);
    }
    state.charSet = charSet;
    state.lastCharFlip = 0;
  }
  const sparks = state.sparks as Particle[];
  const shapes = state.shapes as { x: number; y: number; r: number; rot: number; speed: number; sides: number; hue: number }[];
  const lightningBolts = (state.lightningBolts || []) as { segments: { x: number; y: number }[]; life: number; hue: number }[];
  const shockwaves = (state.shockwaves || []) as { x: number; y: number; r: number; maxR: number; alpha: number; hue: number }[];
  const energyBeams = (state.energyBeams || []) as { x: number; y: number; horizontal: boolean; life: number; hue: number; width: number }[];
  const neonRings = (state.neonRings || []) as { x: number; y: number; r: number; maxR: number; life: number; hue: number }[];
  const digitalColumns = (state.digitalColumns || []) as { y: number; speed: number; chars: string[] }[];
  const charSet = (state.charSet || '01アイウ') as string;

  // ── Background with bass pulse ──
  const bassPulse = 0.3 + 0.2 * Math.pow(Math.sin(time * 1.5), 2);
  ctx.fillStyle = `rgba(10,0,16,${0.95 - bassPulse * 0.15})`;
  ctx.fillRect(0, 0, w, h);

  // ── Digital Rain Overlay (subtle) ──
  if (time - (state.lastCharFlip as number) > 0.08) {
    state.lastCharFlip = time;
    for (const col of digitalColumns) {
      if (Math.random() < 0.12) {
        const idx = Math.floor(Math.random() * col.chars.length);
        col.chars[idx] = charSet[Math.floor(Math.random() * charSet.length)];
      }
    }
  }
  const colW = 14;
  for (let i = 0; i < digitalColumns.length; i++) {
    const col = digitalColumns[i];
    const colX = i * colW;
    const d = Math.abs(colX - mx);
    const speedMult = d < 80 ? 1 + (1 - d / 80) * 2 : 1;
    col.y += col.speed * speedMult;
    if (col.y > h + 80) { col.y = rand(-200, -50); col.speed = rand(0.5, 2); }

    const startIdx = Math.floor(col.y / 14);
    for (let j = 0; j < col.chars.length; j++) {
      const charY = (startIdx + j) * 14;
      if (charY < -14 || charY > h + 14) continue;
      const isFirst = j === col.chars.length - 1;
      if (!isFirst) {
        const fade = clamp((charY - (col.y - col.chars.length * 14)) / (col.chars.length * 6), 0, 1);
        ctx.fillStyle = `rgba(180,0,255,${fade * 0.08})`;
        ctx.font = '12px monospace';
        ctx.fillText(col.chars[j], colX, charY);
      }
    }
  }

  // ── Grid ──
  const gridSize = 40;
  const pulse = 0.4 + 0.3 * Math.sin(time * 2);
  ctx.strokeStyle = `rgba(180,0,255,${0.06 * pulse})`;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Bright grid lines near mouse
  for (let x = 0; x < w; x += gridSize) {
    const d = Math.abs(x - mx);
    if (d < 120) {
      const a = (1 - d / 120) * 0.35 * pulse;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h);
      ctx.strokeStyle = `rgba(255,0,200,${a})`; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  for (let y = 0; y < h; y += gridSize) {
    const d = Math.abs(y - my);
    if (d < 120) {
      const a = (1 - d / 120) * 0.35 * pulse;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y);
      ctx.strokeStyle = `rgba(0,255,255,${a})`; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  // Grid intersection dots near mouse
  for (let x = 0; x < w; x += gridSize) {
    for (let y = 0; y < h; y += gridSize) {
      const d = dist(x, y, mx, my);
      if (d < 150) {
        const a = (1 - d / 150) * 0.6 * pulse;
        ctx.beginPath();
        ctx.arc(x, y, 2 + a * 3, 0, Math.PI * 2);
        ctx.fillStyle = hsl(290, 100, 80, a);
        ctx.shadowColor = hsl(290, 100, 70, a);
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  // ── Energy Beams ──
  if (time - (state.lastBeam as number) > rand(1, 3)) {
    state.lastBeam = time;
    const isHorizontal = Math.random() > 0.5;
    energyBeams.push({
      x: isHorizontal ? 0 : rand(0, w),
      y: isHorizontal ? rand(0, h) : 0,
      horizontal: isHorizontal,
      life: 1,
      hue: rand(270, 340),
      width: rand(2, 6),
    });
  }
  for (let i = energyBeams.length - 1; i >= 0; i--) {
    const beam = energyBeams[i];
    beam.life -= 0.02;
    if (beam.life <= 0) { energyBeams.splice(i, 1); continue; }

    const sweepProgress = 1 - beam.life;
    const beamAlpha = beam.life * 0.4 * (sweepProgress < 0.3 ? sweepProgress / 0.3 : 1);

    ctx.save();
    if (beam.horizontal) {
      const beamY = beam.y + sweepProgress * h * 0.5 * Math.sin(time + beam.y * 0.01);
      const beamGrad = ctx.createLinearGradient(0, beamY - 20, 0, beamY + 20);
      beamGrad.addColorStop(0, hsl(beam.hue, 100, 70, 0));
      beamGrad.addColorStop(0.3, hsl(beam.hue, 100, 80, beamAlpha * 0.3));
      beamGrad.addColorStop(0.5, hsl(beam.hue, 100, 90, beamAlpha));
      beamGrad.addColorStop(0.7, hsl(beam.hue, 100, 80, beamAlpha * 0.3));
      beamGrad.addColorStop(1, hsl(beam.hue, 100, 70, 0));
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, beamY - 20, w, 40);
      ctx.beginPath();
      ctx.moveTo(0, beamY);
      ctx.lineTo(w, beamY);
      ctx.strokeStyle = hsl(beam.hue, 100, 95, beamAlpha * 0.8);
      ctx.lineWidth = beam.width * beam.life;
      ctx.shadowColor = hsl(beam.hue, 100, 80, 1);
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      const beamX = beam.x + sweepProgress * w * 0.5 * Math.sin(time + beam.x * 0.01);
      const beamGrad = ctx.createLinearGradient(beamX - 20, 0, beamX + 20, 0);
      beamGrad.addColorStop(0, hsl(beam.hue, 100, 70, 0));
      beamGrad.addColorStop(0.3, hsl(beam.hue, 100, 80, beamAlpha * 0.3));
      beamGrad.addColorStop(0.5, hsl(beam.hue, 100, 90, beamAlpha));
      beamGrad.addColorStop(0.7, hsl(beam.hue, 100, 80, beamAlpha * 0.3));
      beamGrad.addColorStop(1, hsl(beam.hue, 100, 70, 0));
      ctx.fillStyle = beamGrad;
      ctx.fillRect(beamX - 20, 0, 40, h);
      ctx.beginPath();
      ctx.moveTo(beamX, 0);
      ctx.lineTo(beamX, h);
      ctx.strokeStyle = hsl(beam.hue, 100, 95, beamAlpha * 0.8);
      ctx.lineWidth = beam.width * beam.life;
      ctx.shadowColor = hsl(beam.hue, 100, 80, 1);
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  state.energyBeams = energyBeams;

  // ── Geometric Shapes with electric arcs between nearby shapes ──
  for (const s of shapes) {
    s.rot += s.speed;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.beginPath();
    for (let i = 0; i <= s.sides; i++) {
      const angle = (i / s.sides) * Math.PI * 2;
      const px = Math.cos(angle) * s.r;
      const py = Math.sin(angle) * s.r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const shapeAlpha = 0.5 + 0.3 * Math.sin(time * 3);
    ctx.strokeStyle = hsl(s.hue, 100, 60, shapeAlpha);
    ctx.lineWidth = 2.5;
    ctx.shadowColor = hsl(s.hue, 100, 60, 0.9);
    ctx.shadowBlur = 25;
    ctx.stroke();
    // Inner fill glow
    ctx.fillStyle = hsl(s.hue, 100, 50, 0.03 + 0.02 * Math.sin(time * 4));
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  // Electric arcs between nearby shapes
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const d = dist(shapes[i].x, shapes[i].y, shapes[j].x, shapes[j].y);
      if (d < 250) {
        const arcAlpha = (1 - d / 250) * 0.2;
        ctx.beginPath();
        ctx.moveTo(shapes[i].x, shapes[i].y);
        // Jagged arc
        const midX = (shapes[i].x + shapes[j].x) / 2 + rand(-20, 20);
        const midY = (shapes[i].y + shapes[j].y) / 2 + rand(-20, 20);
        ctx.quadraticCurveTo(midX, midY, shapes[j].x, shapes[j].y);
        ctx.strokeStyle = hsl(300, 100, 75, arcAlpha + 0.05 * Math.sin(time * 8));
        ctx.lineWidth = 1;
        ctx.shadowColor = hsl(300, 100, 70, 0.5);
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }

  // ── Lightning Bolts ──
  if (time - (state.lastLightning as number) > rand(1.5, 4)) {
    state.lastLightning = time;
    const startX = rand(w * 0.1, w * 0.9);
    const endX = rand(w * 0.1, w * 0.9);
    const segments: { x: number; y: number }[] = [{ x: startX, y: 0 }];
    const steps = 14;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      segments.push({
        x: lerp(startX, endX, t) + rand(-50, 50),
        y: lerp(0, h, t),
      });
    }
    segments.push({ x: endX, y: h });
    const branchCount = Math.floor(rand(1, 5));
    for (let b = 0; b < branchCount; b++) {
      const branchStart = Math.floor(rand(2, segments.length - 2));
      const branchSegs: { x: number; y: number }[] = [];
      const bp = segments[branchStart];
      let bx = bp.x;
      let by = bp.y;
      const bSteps = Math.floor(rand(3, 8));
      for (let i = 0; i <= bSteps; i++) {
        branchSegs.push({ x: bx, y: by });
        bx += rand(-35, 35);
        by += rand(10, 30);
      }
      lightningBolts.push({ segments: branchSegs, life: 1, hue: rand(200, 320) });
    }
    lightningBolts.push({ segments, life: 1, hue: rand(260, 330) });
    // Screen flash on lightning
    ctx.fillStyle = `rgba(200,100,255,0.04)`;
    ctx.fillRect(0, 0, w, h);
  }
  for (let i = lightningBolts.length - 1; i >= 0; i--) {
    const bolt = lightningBolts[i];
    bolt.life -= 0.04;
    if (bolt.life <= 0) { lightningBolts.splice(i, 1); continue; }

    ctx.beginPath();
    ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
    for (let j = 1; j < bolt.segments.length; j++) {
      ctx.lineTo(bolt.segments[j].x, bolt.segments[j].y);
    }
    ctx.strokeStyle = hsl(bolt.hue, 60, 80, bolt.life * 0.3);
    ctx.lineWidth = 10 * bolt.life;
    ctx.shadowColor = hsl(bolt.hue, 100, 80, 0.9);
    ctx.shadowBlur = 30;
    ctx.stroke();
    ctx.strokeStyle = hsl(bolt.hue, 80, 95, bolt.life * 0.9);
    ctx.lineWidth = 2.5 * bolt.life;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  state.lightningBolts = lightningBolts;

  // ── Shockwave Rings ──
  if (Math.random() < 0.015) {
    shockwaves.push({
      x: rand(w * 0.1, w * 0.9), y: rand(h * 0.1, h * 0.9),
      r: 0, maxR: rand(60, 180), alpha: 0.7, hue: rand(270, 340),
    });
  }
  for (const bolt of lightningBolts) {
    if (bolt.life > 0.85 && bolt.segments.length > 2) {
      const lastSeg = bolt.segments[bolt.segments.length - 1];
      if (Math.random() < 0.4) {
        shockwaves.push({
          x: lastSeg.x, y: lastSeg.y,
          r: 0, maxR: rand(50, 100), alpha: 0.6, hue: bolt.hue,
        });
      }
    }
  }
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.r += 3;
    sw.alpha = 0.7 * (1 - sw.r / sw.maxR);
    if (sw.r >= sw.maxR || sw.alpha <= 0) { shockwaves.splice(i, 1); continue; }

    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
    ctx.strokeStyle = hsl(sw.hue, 100, 70, sw.alpha);
    ctx.lineWidth = 2 + (1 - sw.r / sw.maxR) * 4;
    ctx.shadowColor = hsl(sw.hue, 100, 60, sw.alpha * 0.5);
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (shockwaves.length > 20) shockwaves.splice(0, shockwaves.length - 20);
  state.shockwaves = shockwaves;

  // ── Neon Rings from Mouse ──
  if (mx > 0 && my > 0 && time - (state.lastRing as number) > 0.3) {
    state.lastRing = time;
    neonRings.push({
      x: mx, y: my, r: 5, maxR: rand(40, 100),
      life: 1, hue: rand(270, 340),
    });
  }
  for (let i = neonRings.length - 1; i >= 0; i--) {
    const nr = neonRings[i];
    nr.r += 1.5;
    nr.life -= 0.03;
    if (nr.life <= 0 || nr.r >= nr.maxR) { neonRings.splice(i, 1); continue; }

    ctx.beginPath();
    ctx.arc(nr.x, nr.y, nr.r, 0, Math.PI * 2);
    ctx.strokeStyle = hsl(nr.hue, 100, 80, nr.life * 0.5);
    ctx.lineWidth = 1.5 + nr.life * 2;
    ctx.shadowColor = hsl(nr.hue, 100, 70, nr.life * 0.4);
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (neonRings.length > 25) neonRings.splice(0, neonRings.length - 25);
  state.neonRings = neonRings;

  // ── Sparks with connection lines ──
  for (const p of sparks) {
    const dx = mx - p.x;
    const dy = my - p.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d < 180) {
      p.vx += (dx / d) * 0.35;
      p.vy += (dy / d) * 0.35;
    }
    p.vx *= 0.98; p.vy *= 0.98;
    p.x += p.vx; p.y += p.vy;
    p.life -= 0.004;

    if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
      Object.assign(p, {
        x: rand(0, w), y: rand(0, h),
        vx: rand(-2, 2), vy: rand(-2, 2),
        life: 1, size: rand(1, 3),
        hue: rand(270, 340), light: rand(60, 90),
      });
    }

    const a = p.life * 0.7;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, 100, p.light, a);
    ctx.shadowColor = hsl(p.hue, 100, 70, 0.6);
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Connection lines between nearby sparks
  for (let i = 0; i < sparks.length; i++) {
    for (let j = i + 1; j < Math.min(i + 8, sparks.length); j++) {
      const d = dist(sparks[i].x, sparks[i].y, sparks[j].x, sparks[j].y);
      if (d < 60) {
        const lineAlpha = (1 - d / 60) * 0.15 * Math.min(sparks[i].life, sparks[j].life);
        ctx.beginPath();
        ctx.moveTo(sparks[i].x, sparks[i].y);
        ctx.lineTo(sparks[j].x, sparks[j].y);
        ctx.strokeStyle = hsl(sparks[i].hue, 100, 70, lineAlpha);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // ── Mouse Aura Effect ──
  if (mx > 0 && my > 0) {
    const flashIntensity = 0.04 + 0.03 * Math.sin(time * 8);
    const flashGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 150);
    flashGrad.addColorStop(0, hsl(300, 100, 90, flashIntensity));
    flashGrad.addColorStop(0.2, hsl(280, 100, 80, flashIntensity * 0.6));
    flashGrad.addColorStop(0.5, hsl(260, 100, 70, flashIntensity * 0.2));
    flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = flashGrad;
    ctx.fillRect(0, 0, w, h);

    // Orbiting dots around mouse
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time * 2;
      const orbitR = 30 + 10 * Math.sin(time * 3 + i);
      const ox = mx + Math.cos(angle) * orbitR;
      const oy = my + Math.sin(angle) * orbitR;
      ctx.beginPath();
      ctx.arc(ox, oy, 2, 0, Math.PI * 2);
      ctx.fillStyle = hsl(270 + i * 15, 100, 80, 0.5);
      ctx.shadowColor = hsl(270 + i * 15, 100, 70, 0.6);
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ── Pulsing corner accents ──
  const cornerPulse = 0.3 + 0.2 * Math.sin(time * 4);
  const corners = [[0, 0], [w, 0], [w, h], [0, h]];
  for (let ci = 0; ci < corners.length; ci++) {
    const [cx, cy] = corners[ci];
    const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
    cGrad.addColorStop(0, hsl(270 + ci * 20, 100, 60, cornerPulse * 0.06));
    cGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cGrad;
    ctx.fillRect(cx - 80, cy - 80, 160, 160);
  }
}

// ─── 5. Sunset ──────────────────────────────────────────────────────────────

function drawSunset(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.clouds = Array.from({ length: 8 }, () => ({
      x: rand(-100, w + 100), y: rand(h * 0.05, h * 0.35),
      w: rand(80, 200), h: rand(20, 50), speed: rand(0.1, 0.4),
      opacity: rand(0.2, 0.5),
    }));
    state.birds = Array.from({ length: 5 }, () => ({
      x: rand(-50, w + 50), y: rand(h * 0.1, h * 0.3),
      speed: rand(0.5, 1.5), wingPhase: rand(0, Math.PI * 2), size: rand(4, 8),
    }));
  }
  const clouds = state.clouds as { x: number; y: number; w: number; h: number; speed: number; opacity: number }[];
  const birds = state.birds as { x: number; y: number; speed: number; wingPhase: number; size: number }[];

  // Color-shifting sky
  const shift = Math.sin(time * 0.15) * 20;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, hsl(250 + shift, 60, 25));
  sky.addColorStop(0.3, hsl(320 + shift, 70, 35));
  sky.addColorStop(0.5, hsl(20 + shift, 85, 50));
  sky.addColorStop(0.7, hsl(35 + shift, 90, 55));
  sky.addColorStop(1, hsl(45 + shift, 80, 40));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun
  const sunX = w * 0.5 + (mx / w - 0.5) * 30;
  const sunY = h * 0.42 + (my / h - 0.5) * 15;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
  sunGrad.addColorStop(0, 'rgba(255,220,100,0.9)');
  sunGrad.addColorStop(0.3, 'rgba(255,180,60,0.5)');
  sunGrad.addColorStop(0.6, 'rgba(255,120,30,0.2)');
  sunGrad.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h);

  // Sun rays
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + time * 0.1;
    const rayLen = 120 + 30 * Math.sin(time * 2 + i);
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(sunX + Math.cos(angle) * rayLen, sunY + Math.sin(angle) * rayLen);
    ctx.strokeStyle = `rgba(255,200,80,${0.05 + 0.03 * Math.sin(time + i)})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Clouds
  const cloudDx = (mx / w - 0.5) * 20;
  for (const c of clouds) {
    c.x += c.speed + cloudDx * 0.02;
    if (c.x > w + 200) c.x = -200;
    if (c.x < -250) c.x = w + 150;

    const cGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.w * 0.5);
    cGrad.addColorStop(0, `rgba(255,180,140,${c.opacity})`);
    cGrad.addColorStop(0.5, `rgba(255,140,100,${c.opacity * 0.5})`);
    cGrad.addColorStop(1, 'rgba(255,100,80,0)');
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w * 0.5, c.h * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = cGrad;
    ctx.fill();
  }

  // Birds
  for (const b of birds) {
    b.x += b.speed;
    b.wingPhase += 0.08;
    if (b.x > w + 60) { b.x = -50; b.y = rand(h * 0.1, h * 0.3); }

    const wingY = Math.sin(b.wingPhase) * b.size * 0.5;
    ctx.beginPath();
    ctx.moveTo(b.x - b.size, b.y + wingY);
    ctx.quadraticCurveTo(b.x - b.size * 0.3, b.y - Math.abs(wingY) * 0.3, b.x, b.y);
    ctx.quadraticCurveTo(b.x + b.size * 0.3, b.y - Math.abs(wingY) * 0.3, b.x + b.size, b.y + wingY);
    ctx.strokeStyle = 'rgba(30,20,30,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ─── 6. Matrix ──────────────────────────────────────────────────────────────

function drawMatrix(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    const colW = 16;
    const cols = Math.ceil(w / colW);
    state.columns = Array.from({ length: cols }, () => ({
      y: rand(-h, 0), speed: rand(1, 4), chars: [] as string[],
    }));
    // Pre-fill characters
    const charSet = 'ሀለሐመሠረሰሸቀበተቸኀነኘአከኸወዘየደጀገጠጨፀፈፐ0123456789ABCDEFZ@#$%&';
    for (const col of state.columns as { y: number; speed: number; chars: string[] }[]) {
      const count = Math.ceil(h / 16) + 5;
      col.chars = Array.from({ length: count }, () => charSet[Math.floor(Math.random() * charSet.length)]);
    }
    state.charSet = charSet;
    state.lastFlip = 0;
  }
  const columns = state.columns as { y: number; speed: number; chars: string[] }[];
  const charSet = state.charSet as string;

  // Fade trail
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, w, h);

  // Flip random chars periodically
  if (time - (state.lastFlip as number) > 0.05) {
    state.lastFlip = time;
    for (const col of columns) {
      if (Math.random() < 0.1) {
        const idx = Math.floor(Math.random() * col.chars.length);
        col.chars[idx] = charSet[Math.floor(Math.random() * charSet.length)];
      }
    }
  }

  const colW = 16;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    // Mouse speeds up nearby columns
    const colX = i * colW;
    const d = Math.abs(colX - mx);
    const speedMult = d < 80 ? 1 + (1 - d / 80) * 3 : 1;

    col.y += col.speed * speedMult;
    if (col.y > h + 100) {
      col.y = rand(-200, -50);
      col.speed = rand(1, 4);
    }

    const startIdx = Math.floor(col.y / 16);
    for (let j = 0; j < col.chars.length; j++) {
      const charY = (startIdx + j) * 16;
      if (charY < -16 || charY > h + 16) continue;

      const isFirst = j === col.chars.length - 1;
      const fadeFromTop = clamp((charY - (col.y - col.chars.length * 16)) / (col.chars.length * 8), 0, 1);
      const alpha = isFirst ? 1 : fadeFromTop * 0.7;

      ctx.fillStyle = isFirst
        ? `rgba(180,255,180,${alpha})`
        : `rgba(0,${150 + Math.floor(fadeFromTop * 105)},0,${alpha})`;
      ctx.font = `${isFirst ? 'bold ' : ''}14px monospace`;
      ctx.fillText(col.chars[j], colX, charY);

      if (isFirst) {
        ctx.shadowColor = 'rgba(0,255,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText(col.chars[j], colX, charY);
        ctx.shadowBlur = 0;
      }
    }
  }
}

// ─── 7. Rainbow ─────────────────────────────────────────────────────────────

function drawRainbow(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.sparkles = Array.from({ length: 80 }, () => ({
      x: rand(0, w), y: rand(0, h),
      size: rand(1, 3), speed: rand(0.2, 0.8),
      hue: rand(0, 360), phase: rand(0, Math.PI * 2),
    }));
    state.bursts = [] as { x: number; y: number; r: number; hue: number; alpha: number }[];
  }
  const sparkles = state.sparkles as { x: number; y: number; size: number; speed: number; hue: number; phase: number }[];
  const bursts = (state.bursts || []) as { x: number; y: number; r: number; hue: number; alpha: number }[];

  // Dark background
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, w, h);

  // Flowing rainbow bands
  for (let band = 0; band < 6; band++) {
    const baseY = h * 0.3 + band * h * 0.08;
    const hueShift = time * 30 + band * 60;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) {
      const wave = Math.sin((x + time * 40) * 0.01 + band * 0.5) * 30
        + Math.sin((x - time * 20) * 0.02 + band) * 15;
      ctx.lineTo(x, baseY + wave);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = hsl(hueShift, 80, 55, 0.12);
    ctx.fill();
  }

  // Prismatic light refraction lines
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI + time * 0.2;
    const cx = w * 0.5 + Math.cos(time * 0.3 + i) * 100;
    const cy = h * 0.4 + Math.sin(time * 0.4 + i) * 80;
    const len = 200 + Math.sin(time + i) * 80;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    grad.addColorStop(0, hsl(i * 45 + time * 50, 100, 70, 0));
    grad.addColorStop(0.5, hsl(i * 45 + time * 50, 100, 70, 0.15));
    grad.addColorStop(1, hsl(i * 45 + time * 50, 100, 70, 0));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Sparkles
  for (const s of sparkles) {
    s.y -= s.speed;
    s.x += Math.sin(time + s.phase) * 0.3;
    s.hue += 0.5;
    if (s.y < -10) { s.y = h + 10; s.x = rand(0, w); }

    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 4 + s.phase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * twinkle, 0, Math.PI * 2);
    ctx.fillStyle = hsl(s.hue, 100, 75, 0.6 * twinkle);
    ctx.shadowColor = hsl(s.hue, 100, 70, 0.5);
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Mouse rainbow bursts
  bursts.push({ x: mx, y: my, r: 0, hue: (time * 60) % 360, alpha: 0.4 });
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.r += 3;
    b.alpha -= 0.015;
    if (b.alpha <= 0) { bursts.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    const bGrad = ctx.createRadialGradient(b.x, b.y, b.r * 0.5, b.x, b.y, b.r);
    bGrad.addColorStop(0, hsl(b.hue, 100, 70, 0));
    bGrad.addColorStop(0.7, hsl(b.hue, 100, 60, b.alpha * 0.5));
    bGrad.addColorStop(1, hsl(b.hue + 60, 100, 70, 0));
    ctx.strokeStyle = bGrad;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (bursts.length > 25) bursts.splice(0, bursts.length - 25);
  state.bursts = bursts;
}

// ─── 8. Fire ────────────────────────────────────────────────────────────────

function drawFire(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.flames = Array.from({ length: 200 }, () => ({
      x: rand(0, w), y: h + rand(0, 30),
      vx: rand(-0.5, 0.5), vy: rand(-3, -1),
      size: rand(3, 10), life: 1, maxLife: rand(1, 3),
      hue: rand(0, 40),
    }));
    state.sparks = Array.from({ length: 60 }, () =>
      makeParticle({
        x: rand(w * 0.2, w * 0.8), y: h,
        vx: rand(-1, 1), vy: rand(-4, -1),
        size: rand(1, 3), maxLife: rand(1, 3), life: rand(0, 1),
        hue: rand(20, 55), sat: 100, light: rand(60, 90),
      })
    );
  }
  const flames = state.flames as { x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number; hue: number }[];
  const sparks = state.sparks as Particle[];

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0a0000');
  bg.addColorStop(0.5, '#1a0500');
  bg.addColorStop(1, '#2d0800');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Heat shimmer at bottom
  const shimmerY = h * 0.7;
  for (let x = 0; x < w; x += 20) {
    const offset = Math.sin(x * 0.05 + time * 3) * 3;
    ctx.fillStyle = `rgba(255,100,0,${0.02 + 0.01 * Math.sin(time * 2 + x * 0.1)})`;
    ctx.fillRect(x, shimmerY + offset, 20, h - shimmerY);
  }

  // Flames
  const stirX = (mx / w - 0.5) * 2;
  for (const f of flames) {
    f.x += f.vx + Math.sin(time * 3 + f.y * 0.02) * 0.5 + stirX * 0.3;
    f.y += f.vy;
    f.vy *= 0.99;
    f.life -= 1 / (f.maxLife * 60);
    f.size *= 0.995;

    if (f.life <= 0 || f.y < -20 || f.size < 0.5) {
      Object.assign(f, {
        x: rand(w * 0.1, w * 0.9), y: h + rand(0, 20),
        vx: rand(-0.5, 0.5) + stirX * 0.2, vy: rand(-3, -1),
        size: rand(3, 10), life: 1, maxLife: rand(1, 3),
        hue: rand(0, 40),
      });
    }

    const a = f.life * 0.6;
    const light = 50 + (1 - f.life) * 20;
    const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
    grad.addColorStop(0, hsl(f.hue, 100, light + 20, a));
    grad.addColorStop(0.5, hsl(f.hue + 10, 100, light, a * 0.5));
    grad.addColorStop(1, hsl(f.hue + 20, 80, light - 10, 0));
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Hot glow at bottom
  const glow = ctx.createLinearGradient(0, h * 0.6, 0, h);
  glow.addColorStop(0, 'rgba(255,80,0,0)');
  glow.addColorStop(0.5, 'rgba(255,120,20,0.08)');
  glow.addColorStop(1, 'rgba(255,200,50,0.15)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);

  // Sparks / embers
  for (const p of sparks) {
    p.x += p.vx + Math.sin(time * 5 + p.x * 0.02) * 0.5;
    p.y += p.vy;
    p.vy *= 0.995;
    p.life -= 0.006;

    if (p.life <= 0 || p.y < -20) {
      Object.assign(p, {
        x: rand(w * 0.15, w * 0.85), y: h + rand(0, 10),
        vx: rand(-1, 1) + stirX * 0.3, vy: rand(-4, -1),
        life: 1, size: rand(1, 3),
        hue: rand(20, 55), light: rand(60, 90),
      });
    }

    const a = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, 100, p.light, a);
    ctx.shadowColor = hsl(p.hue, 100, 70, 0.5);
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ─── 9. Galaxy ──────────────────────────────────────────────────────────────

function drawGalaxy(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    // Star field with depth
    state.stars = Array.from({ length: 250 }, () => ({
      x: rand(0, w), y: rand(0, h), z: rand(0.2, 1),
      size: rand(0.5, 2.5), brightness: rand(0.3, 1),
      hue: rand(0, 60), phase: rand(0, Math.PI * 2),
    }));
    // Shooting stars
    state.shooters = [] as { x: number; y: number; vx: number; vy: number; life: number; len: number }[];
    state.lastShoot = 0;
  }
  const stars = state.stars as { x: number; y: number; z: number; size: number; brightness: number; hue: number; phase: number }[];
  const shooters = (state.shooters || []) as { x: number; y: number; vx: number; vy: number; life: number; len: number }[];

  // Background
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.7);
  bg.addColorStop(0, '#0d0520');
  bg.addColorStop(0.5, '#0a0318');
  bg.addColorStop(1, '#050210');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Nebula clouds
  const offsetX = (mx / w - 0.5) * 30;
  const offsetY = (my / h - 0.5) * 20;
  for (let i = 0; i < 4; i++) {
    const nx = w * (0.3 + i * 0.15) + offsetX * (1 + i * 0.3);
    const ny = h * (0.3 + i * 0.1) + offsetY * (1 + i * 0.2);
    const nSize = 100 + i * 30;
    const nHue = [260, 300, 220, 340][i];

    const neb = ctx.createRadialGradient(nx, ny, 0, nx, ny, nSize);
    neb.addColorStop(0, hsl(nHue, 60, 40, 0.08 + 0.03 * Math.sin(time * 0.5 + i)));
    neb.addColorStop(0.5, hsl(nHue + 20, 50, 30, 0.04));
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, w, h);
  }

  // Stars with parallax
  for (const s of stars) {
    const px = s.x + offsetX * s.z * 0.5;
    const py = s.y + offsetY * s.z * 0.5;
    const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + s.phase);
    const a = s.brightness * twinkle;

    ctx.beginPath();
    ctx.arc(px, py, s.size * s.z, 0, Math.PI * 2);
    ctx.fillStyle = hsl(s.hue, 30, 80 + s.brightness * 20, a);
    ctx.fill();

    // Bright star glow
    if (s.brightness > 0.8 && s.size > 1.5) {
      ctx.beginPath();
      ctx.arc(px, py, s.size * s.z * 3, 0, Math.PI * 2);
      ctx.fillStyle = hsl(s.hue, 40, 70, a * 0.15);
      ctx.fill();
    }
  }

  // Shooting stars
  if (time - (state.lastShoot as number) > rand(2, 5)) {
    state.lastShoot = time;
    shooters.push({
      x: rand(0, w), y: rand(0, h * 0.3),
      vx: rand(3, 7), vy: rand(1, 3),
      life: 1, len: rand(30, 80),
    });
  }
  for (let i = shooters.length - 1; i >= 0; i--) {
    const s = shooters[i];
    s.x += s.vx; s.y += s.vy;
    s.life -= 0.02;
    if (s.life <= 0 || s.x > w + 50 || s.y > h + 50) {
      shooters.splice(i, 1); continue;
    }
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * s.len * 0.15, s.y - s.vy * s.len * 0.15);
    const sGrad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * s.len * 0.15, s.y - s.vy * s.len * 0.15);
    sGrad.addColorStop(0, `rgba(255,255,255,${s.life * 0.8})`);
    sGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = sGrad;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  state.shooters = shooters;
}

// ─── 10. Waterfall ──────────────────────────────────────────────────────────

function drawWaterfall(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.drops = Array.from({ length: 200 }, () => ({
      x: rand(w * 0.35, w * 0.65), y: rand(-20, h),
      speed: rand(3, 8), size: rand(1, 3),
      drift: rand(-0.3, 0.3), alpha: rand(0.2, 0.7),
    }));
    state.mist = Array.from({ length: 60 }, () => ({
      x: rand(w * 0.2, w * 0.8), y: h - rand(0, h * 0.15),
      vx: rand(-0.5, 0.5), vy: rand(-0.8, -0.1),
      size: rand(10, 30), alpha: rand(0.05, 0.15),
    }));
    state.splashes = [] as { x: number; y: number; r: number; alpha: number }[];
  }
  const drops = state.drops as { x: number; y: number; speed: number; size: number; drift: number; alpha: number }[];
  const mist = state.mist as { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[];
  const splashes = (state.splashes || []) as { x: number; y: number; r: number; alpha: number }[];

  // Background - cliff
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0a1a10');
  bg.addColorStop(0.3, '#0d2818');
  bg.addColorStop(1, '#051510');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Cliff walls
  const cliffGrad1 = ctx.createLinearGradient(0, 0, w * 0.35, 0);
  cliffGrad1.addColorStop(0, '#1a3020');
  cliffGrad1.addColorStop(1, '#0d2015');
  ctx.fillStyle = cliffGrad1;
  ctx.fillRect(0, 0, w * 0.38, h);

  const cliffGrad2 = ctx.createLinearGradient(w * 0.62, 0, w, 0);
  cliffGrad2.addColorStop(0, '#0d2015');
  cliffGrad2.addColorStop(1, '#1a3020');
  ctx.fillStyle = cliffGrad2;
  ctx.fillRect(w * 0.62, 0, w * 0.38, h);

  // Water stream glow
  const waterGlow = ctx.createLinearGradient(w * 0.35, 0, w * 0.65, 0);
  waterGlow.addColorStop(0, 'rgba(30,100,150,0.05)');
  waterGlow.addColorStop(0.5, 'rgba(50,150,200,0.1)');
  waterGlow.addColorStop(1, 'rgba(30,100,150,0.05)');
  ctx.fillStyle = waterGlow;
  ctx.fillRect(w * 0.3, 0, w * 0.4, h);

  // Water drops
  for (const d of drops) {
    d.y += d.speed;
    d.x += d.drift + Math.sin(time * 2 + d.y * 0.02) * 0.3;
    // Mouse splash
    const dd = dist(d.x, d.y, mx, my);
    if (dd < 50) {
      d.x += (d.x - mx) * 0.05;
      d.y += (d.y - my) * 0.05;
    }
    if (d.y > h) {
      d.y = rand(-20, -5);
      d.x = rand(w * 0.35, w * 0.65);
      d.speed = rand(3, 8);
    }
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150,210,255,${d.alpha})`;
    ctx.fill();
  }

  // Water streams (continuous lines)
  for (let s = 0; s < 6; s++) {
    const sx = w * (0.38 + s * 0.04);
    ctx.beginPath();
    for (let y = 0; y <= h; y += 4) {
      const wx = sx + Math.sin(y * 0.02 + time * 3 + s) * 5;
      if (y === 0) ctx.moveTo(wx, y); else ctx.lineTo(wx, y);
    }
    ctx.strokeStyle = `rgba(100,180,230,${0.1 + 0.05 * Math.sin(time + s)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Mist at bottom
  for (const m of mist) {
    m.x += m.vx + Math.sin(time + m.x * 0.01) * 0.2;
    m.y += m.vy;
    m.alpha -= 0.0003;
    if (m.y < h * 0.5 || m.alpha <= 0) {
      m.x = rand(w * 0.2, w * 0.8);
      m.y = h - rand(0, h * 0.1);
      m.alpha = rand(0.05, 0.15);
    }
    const mGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size);
    mGrad.addColorStop(0, `rgba(180,220,255,${m.alpha})`);
    mGrad.addColorStop(1, 'rgba(180,220,255,0)');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rainbow refraction
  const rainbowX = w * 0.5 + Math.sin(time * 0.3) * 30;
  const rainbowY = h * 0.85;
  for (let c = 0; c < 7; c++) {
    const hue = c * 51;
    const r = 50 + c * 8;
    ctx.beginPath();
    ctx.arc(rainbowX, rainbowY, r, Math.PI, 0);
    ctx.strokeStyle = hsl(hue, 80, 60, 0.06);
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  // Splash ripples from mouse
  splashes.push({ x: mx, y: my, r: 0, alpha: 0.3 });
  for (let i = splashes.length - 1; i >= 0; i--) {
    const sp = splashes[i];
    sp.r += 2.5;
    sp.alpha -= 0.012;
    if (sp.alpha <= 0) { splashes.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(150,220,255,${sp.alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (splashes.length > 15) splashes.splice(0, splashes.length - 15);
  state.splashes = splashes;
}

// ─── 11. Autumn ─────────────────────────────────────────────────────────────

function drawAutumn(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.leaves = Array.from({ length: 80 }, () => ({
      x: rand(0, w), y: rand(-h * 0.3, h),
      vx: rand(-0.3, 0.3), vy: rand(0.5, 2),
      rot: rand(0, Math.PI * 2), rotSpeed: rand(-0.03, 0.03),
      size: rand(6, 16), hue: rand(10, 50),
      sway: rand(0.5, 2), swayPhase: rand(0, Math.PI * 2),
      type: Math.floor(rand(0, 3)), // 0=oval, 1=pointed, 2=maple-like
    }));
    state.particles = Array.from({ length: 50 }, () => ({
      x: rand(0, w), y: rand(0, h),
      vx: rand(-0.2, 0.2), vy: rand(-0.3, 0.3),
      size: rand(1, 2), alpha: rand(0.1, 0.4),
      hue: rand(30, 60),
    }));
  }
  const leaves = state.leaves as { x: number; y: number; vx: number; vy: number; rot: number; rotSpeed: number; size: number; hue: number; sway: number; swayPhase: number; type: number }[];
  const particles = state.particles as { x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number }[];

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#2a1505');
  bg.addColorStop(0.3, '#3a1a08');
  bg.addColorStop(0.7, '#2d1508');
  bg.addColorStop(1, '#1a0d04');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Background trees silhouettes
  for (let i = 0; i < 8; i++) {
    const tx = (i / 8) * w + 30;
    const th = h * (0.3 + 0.15 * Math.sin(i * 2.3));
    ctx.fillStyle = 'rgba(20,10,5,0.3)';
    ctx.fillRect(tx - 3, h - th, 6, th);
    // Canopy
    ctx.beginPath();
    ctx.arc(tx, h - th, 25 + i * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${40 + i * 5},${15 + i * 2},${5},0.2)`;
    ctx.fill();
  }

  // Wind from mouse
  const windX = (mx / w - 0.5) * 2;

  // Leaves
  for (const leaf of leaves) {
    leaf.x += leaf.vx + Math.sin(time * leaf.sway + leaf.swayPhase) * leaf.sway + windX * 0.8;
    leaf.y += leaf.vy;
    leaf.rot += leaf.rotSpeed + windX * 0.01;
    leaf.vx += windX * 0.005;
    leaf.vx *= 0.99;

    if (leaf.y > h + 20 || leaf.x < -40 || leaf.x > w + 40) {
      Object.assign(leaf, {
        x: rand(-20, w + 20), y: rand(-40, -10),
        vx: rand(-0.3, 0.3), vy: rand(0.5, 2),
        rot: rand(0, Math.PI * 2), hue: rand(10, 50),
      });
    }

    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot);

    const sat = 70 + 20 * Math.sin(leaf.hue * 0.1);
    const light = 35 + 15 * Math.sin(leaf.hue * 0.2);

    if (leaf.type === 0) {
      // Oval leaf
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size * 0.4, leaf.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = hsl(leaf.hue, sat, light, 0.8);
      ctx.fill();
      // Vein
      ctx.beginPath();
      ctx.moveTo(0, -leaf.size * 0.6);
      ctx.lineTo(0, leaf.size * 0.6);
      ctx.strokeStyle = hsl(leaf.hue - 10, sat, light - 10, 0.4);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    } else if (leaf.type === 1) {
      // Pointed leaf
      ctx.beginPath();
      ctx.moveTo(0, -leaf.size * 0.7);
      ctx.quadraticCurveTo(leaf.size * 0.4, 0, 0, leaf.size * 0.7);
      ctx.quadraticCurveTo(-leaf.size * 0.4, 0, 0, -leaf.size * 0.7);
      ctx.fillStyle = hsl(leaf.hue + 10, sat, light, 0.8);
      ctx.fill();
    } else {
      // Simple maple-ish
      ctx.beginPath();
      for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2 - Math.PI / 2;
        const outerR = leaf.size * 0.6;
        const innerR = leaf.size * 0.3;
        const ox = Math.cos(angle) * outerR;
        const oy = Math.sin(angle) * outerR;
        const iAngle = angle + Math.PI / 5;
        const ix = Math.cos(iAngle) * innerR;
        const iy = Math.sin(iAngle) * innerR;
        if (p === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.fillStyle = hsl(leaf.hue - 10, sat, light + 5, 0.8);
      ctx.fill();
    }
    ctx.restore();
  }

  // Floating particles
  for (const p of particles) {
    p.x += p.vx + windX * 0.3 + Math.sin(time + p.x * 0.01) * 0.2;
    p.y += p.vy;
    if (p.y > h || p.x < -10 || p.x > w + 10) {
      p.x = rand(0, w); p.y = rand(0, h);
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, 60, 60, p.alpha);
    ctx.fill();
  }
}

// ─── 12. Cyberpunk ──────────────────────────────────────────────────────────

function drawCyberpunk(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    // Generate city skyline
    state.buildings = Array.from({ length: 25 }, (_, i) => ({
      x: i * (w / 25),
      w: rand(20, 45),
      h: rand(60, 200),
      hue: rand(300, 360) % 360,
      windows: Math.floor(rand(3, 8)),
    }));
    state.scanY = 0;
    state.glitchTime = 0;
    state.holoShapes = Array.from({ length: 4 }, () => ({
      x: rand(w * 0.1, w * 0.9), y: rand(h * 0.15, h * 0.5),
      r: rand(15, 35), rot: rand(0, Math.PI * 2),
      speed: rand(0.01, 0.03), sides: Math.floor(rand(3, 6)),
      hue: rand(160, 200),
    }));
  }
  const buildings = state.buildings as { x: number; w: number; h: number; hue: number; windows: number }[];
  const holoShapes = state.holoShapes as { x: number; y: number; r: number; rot: number; speed: number; sides: number; hue: number }[];

  // Background
  ctx.fillStyle = '#080012';
  ctx.fillRect(0, 0, w, h);

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, '#120025');
  sky.addColorStop(1, '#080012');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.5);

  // City skyline silhouette
  const groundY = h * 0.7;
  for (const b of buildings) {
    const bx = b.x;
    const by = groundY - b.h;

    // Building body
    ctx.fillStyle = '#0a0515';
    ctx.fillRect(bx, by, b.w, b.h + h * 0.3);

    // Neon outline top
    ctx.strokeStyle = hsl(b.hue, 100, 50, 0.4 + 0.2 * Math.sin(time * 2 + b.x * 0.1));
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, b.w, b.h);

    // Windows
    for (let wy = 0; wy < b.windows; wy++) {
      for (let wx = 0; wx < 3; wx++) {
        const winX = bx + 4 + wx * ((b.w - 8) / 3);
        const winY = by + 8 + wy * ((b.h - 16) / b.windows);
        const on = Math.sin(time * 0.5 + b.x * 0.05 + wy * 0.3 + wx) > 0;
        if (on) {
          ctx.fillStyle = hsl(b.hue, 80, 60, 0.3 + 0.2 * Math.sin(time + wy));
          ctx.fillRect(winX, winY, 4, 4);
        }
      }
    }
  }

  // Ground
  ctx.fillStyle = '#050010';
  ctx.fillRect(0, groundY, w, h - groundY);

  // Neon ground reflections
  for (const b of buildings) {
    const reflGrad = ctx.createLinearGradient(b.x, groundY, b.x, groundY + 60);
    reflGrad.addColorStop(0, hsl(b.hue, 100, 50, 0.05));
    reflGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = reflGrad;
    ctx.fillRect(b.x - 5, groundY, b.w + 10, 60);
  }

  // Scanning horizontal line
  state.scanY = ((state.scanY as number) + 1.5) % h;
  const scanY = state.scanY as number;
  ctx.fillStyle = 'rgba(0,255,255,0.03)';
  ctx.fillRect(0, scanY - 2, w, 4);
  ctx.fillStyle = 'rgba(0,255,255,0.08)';
  ctx.fillRect(0, scanY, w, 1);

  // Glitch effect on mouse proximity
  const glitchStrength = Math.max(0, 1 - dist(mx, my, w * 0.5, h * 0.5) / (w * 0.4));
  if (glitchStrength > 0.2) {
    state.glitchTime = (state.glitchTime as number) + 0.1;
    const gt = state.glitchTime as number;
    if (Math.sin(gt * 10) > 0.7) {
      // Horizontal glitch bars
      for (let i = 0; i < 5; i++) {
        const gy = rand(0, h);
        const gh = rand(2, 8);
        const gx = rand(-20, 20) * glitchStrength;
        ctx.fillStyle = hsl(rand(300, 360) % 360, 100, 50, 0.1 * glitchStrength);
        ctx.fillRect(gx, gy, w, gh);
      }
    }
  }

  // Holographic shapes
  for (const s of holoShapes) {
    s.rot += s.speed;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.beginPath();
    for (let i = 0; i <= s.sides; i++) {
      const angle = (i / s.sides) * Math.PI * 2;
      const px = Math.cos(angle) * s.r;
      const py = Math.sin(angle) * s.r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = hsl(s.hue, 100, 60, 0.4 + 0.2 * Math.sin(time * 2 + s.hue));
    ctx.lineWidth = 1.5;
    ctx.shadowColor = hsl(s.hue, 100, 60, 0.6);
    ctx.shadowBlur = 12;
    ctx.stroke();
    // Inner shape
    ctx.beginPath();
    for (let i = 0; i <= s.sides; i++) {
      const angle = (i / s.sides) * Math.PI * 2 + Math.PI / s.sides;
      const px = Math.cos(angle) * s.r * 0.5;
      const py = Math.sin(angle) * s.r * 0.5;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = hsl(s.hue + 60, 100, 70, 0.2 + 0.1 * Math.sin(time * 3));
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Neon accent lines on edges
  const lineAlpha = 0.15 + 0.1 * Math.sin(time * 3);
  ctx.strokeStyle = hsl(330, 100, 60, lineAlpha);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.stroke();
  ctx.strokeStyle = hsl(180, 100, 60, lineAlpha);
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w, h); ctx.stroke();
}

// ─── 13. Snowfall ────────────────────────────────────────────────────────────

function drawSnowfall(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.snowflakes = Array.from({ length: 220 }, () => ({
      x: rand(0, w), y: rand(-h * 0.2, h),
      size: rand(1, 5), speed: rand(0.5, 2.5),
      drift: rand(-0.3, 0.3), swayPhase: rand(0, Math.PI * 2),
      swaySpeed: rand(0.5, 2), swayAmp: rand(0.3, 1.5),
      alpha: rand(0.3, 0.9), rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.02, 0.02),
    }));
    state.gusts = [] as { x: number; y: number; vx: number; life: number; alpha: number }[];
    state.gustTimer = 0;
  }
  const snowflakes = state.snowflakes as { x: number; y: number; size: number; speed: number; drift: number; swayPhase: number; swaySpeed: number; swayAmp: number; alpha: number; rotation: number; rotSpeed: number }[];
  const gusts = (state.gusts || []) as { x: number; y: number; vx: number; life: number; alpha: number }[];

  // Dark blue/purple night sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#050520');
  sky.addColorStop(0.3, '#0a0a35');
  sky.addColorStop(0.6, '#101045');
  sky.addColorStop(1, '#151530');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Stars in the sky
  for (let i = 0; i < 40; i++) {
    const sx = (Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5) * w;
    const sy = (Math.cos(i * 269.5 + 183.3) * 0.5 + 0.5) * h * 0.4;
    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 1.5 + i * 1.3));
    ctx.beginPath();
    ctx.arc(sx, sy, 1 * twinkle, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,210,255,${0.4 * twinkle})`;
    ctx.fill();
  }

  // Snow accumulation at bottom
  const snowGround = ctx.createLinearGradient(0, h * 0.88, 0, h);
  snowGround.addColorStop(0, 'rgba(200,210,230,0)');
  snowGround.addColorStop(0.3, 'rgba(200,210,230,0.05)');
  snowGround.addColorStop(1, 'rgba(220,225,240,0.15)');
  ctx.fillStyle = snowGround;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);

  // Wavy snow ground line
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 3) {
    const groundY = h * 0.92 + Math.sin(x * 0.02 + time * 0.2) * 3 + Math.sin(x * 0.05) * 2;
    ctx.lineTo(x, groundY);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(200,210,230,0.08)';
  ctx.fill();

  // ── Wind Gusts (horizontal streaks) ──
  if (time - (state.gustTimer as number) > rand(3, 8)) {
    state.gustTimer = time;
    gusts.push({
      x: -50,
      y: rand(h * 0.1, h * 0.7),
      vx: rand(4, 10),
      life: 1,
      alpha: rand(0.1, 0.25),
    });
  }
  for (let i = gusts.length - 1; i >= 0; i--) {
    const g = gusts[i];
    g.x += g.vx;
    g.life -= 0.008;
    if (g.life <= 0 || g.x > w + 100) { gusts.splice(i, 1); continue; }
    // Draw as horizontal streaks
    const streakLen = 60 + g.vx * 10;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x - streakLen, g.y + rand(-2, 2));
    ctx.strokeStyle = `rgba(180,200,230,${g.alpha * g.life})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (gusts.length > 5) gusts.splice(0, gusts.length - 5);
  state.gusts = gusts;

  // ── Snowflakes ──
  for (const s of snowflakes) {
    // Wind sway
    const sway = Math.sin(time * s.swaySpeed + s.swayPhase) * s.swayAmp;

    // Mouse warmth zone — melt/push snowflakes away
    const dx = s.x - mx;
    const dy = s.y - my;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    let pushX = 0;
    let pushY = 0;
    if (d < 100) {
      const force = (1 - d / 100) * 2;
      pushX = (dx / d) * force;
      pushY = (dy / d) * force - force * 0.5; // upward push (warmth rises)
    }

    s.x += s.drift + sway + pushX;
    s.y += s.speed + pushY;
    s.rotation += s.rotSpeed;

    if (s.y > h * 0.92 + Math.sin(s.x * 0.02) * 3) {
      // Accumulate at ground level
      Object.assign(s, {
        x: rand(0, w), y: rand(-30, -5),
        size: rand(1, 5), speed: rand(0.5, 2.5),
      });
    }
    if (s.x < -20) s.x = w + 10;
    if (s.x > w + 20) s.x = -10;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);

    if (s.size > 3) {
      // Larger snowflakes with crystal shape
      ctx.beginPath();
      for (let arm = 0; arm < 6; arm++) {
        const angle = (arm / 6) * Math.PI * 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * s.size, Math.sin(angle) * s.size);
      }
      ctx.strokeStyle = `rgba(220,230,255,${s.alpha * 0.6})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, s.size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,230,255,${s.alpha})`;
    ctx.fill();
    ctx.restore();
  }
}

// ─── 14. Bubbles ────────────────────────────────────────────────────────────

function drawBubbles(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.bubbles = Array.from({ length: 35 }, () => ({
      x: rand(w * 0.1, w * 0.9), y: h + rand(0, h * 0.3),
      r: rand(8, 35), speed: rand(0.3, 1.2),
      drift: rand(-0.2, 0.2), phase: rand(0, Math.PI * 2),
      hue: rand(0, 360), wobble: rand(0, Math.PI * 2),
    }));
    state.popParticles = [] as Particle[];
    state.causticTime = 0;
  }
  const bubbles = state.bubbles as { x: number; y: number; r: number; speed: number; drift: number; phase: number; hue: number; wobble: number }[];
  const popParticles = (state.popParticles || []) as Particle[];

  // Deep blue/purple background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#050520');
  bg.addColorStop(0.5, '#0a0a40');
  bg.addColorStop(1, '#080830');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Underwater light caustics
  for (let i = 0; i < 15; i++) {
    const cx = (Math.sin(i * 1.7 + time * 0.6) * 0.5 + 0.5) * w;
    const cy = (Math.cos(i * 2.3 + time * 0.4) * 0.5 + 0.5) * h;
    const cr = 30 + 20 * Math.sin(time * 0.8 + i);
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(60,100,200,${0.025 + 0.015 * Math.sin(time + i)})`;
    ctx.fill();
  }

  // Light rays from top
  for (let i = 0; i < 6; i++) {
    const rx = w * (0.15 + i * 0.14) + Math.sin(time * 0.3 + i) * 20;
    const rayGrad = ctx.createLinearGradient(rx, 0, rx + 30, h);
    rayGrad.addColorStop(0, `rgba(80,120,200,${0.03 + 0.02 * Math.sin(time * 0.5 + i)})`);
    rayGrad.addColorStop(0.5, `rgba(60,100,180,0.01)`);
    rayGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx + 50, h);
    ctx.lineTo(rx - 20, h);
    ctx.lineTo(rx - 10, 0);
    ctx.closePath();
    ctx.fill();
  }

  // ── Bubbles ──
  for (let bi = bubbles.length - 1; bi >= 0; bi--) {
    const b = bubbles[bi];
    b.y -= b.speed;
    b.x += b.drift + Math.sin(time * 0.8 + b.phase) * 0.5;
    b.wobble += 0.03;

    // Mouse repels bubbles
    const dx = b.x - mx;
    const dy = b.y - my;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d < 80 + b.r) {
      const force = (1 - d / (80 + b.r)) * 2;
      b.x += (dx / d) * force;
      b.y += (dy / d) * force;
    }

    // Pop at top
    if (b.y + b.r < -10) {
      // Create pop particles
      for (let p = 0; p < 8; p++) {
        popParticles.push(makeParticle({
          x: b.x, y: b.r > 0 ? 5 : b.y,
          vx: rand(-2, 2), vy: rand(-1, 1),
          size: rand(1, 3), maxLife: rand(0.3, 0.8), life: 1,
          hue: b.hue, sat: 80, light: 70, alpha: 0.7,
        }));
      }
      // Reset bubble
      Object.assign(b, {
        x: rand(w * 0.1, w * 0.9), y: h + rand(10, 60),
        r: rand(8, 35), speed: rand(0.3, 1.2),
        hue: rand(0, 360),
      });
    }

    // Draw bubble
    const wobbleX = Math.sin(b.wobble) * b.r * 0.05;
    const wobbleY = Math.cos(b.wobble * 1.3) * b.r * 0.05;

    ctx.save();
    ctx.translate(b.x + wobbleX, b.y + wobbleY);

    // Bubble body — semi-transparent
    const bodyGrad = ctx.createRadialGradient(-b.r * 0.2, -b.r * 0.2, 0, 0, 0, b.r);
    bodyGrad.addColorStop(0, `rgba(200,220,255,0.08)`);
    bodyGrad.addColorStop(0.7, `rgba(150,180,230,0.04)`);
    bodyGrad.addColorStop(0.9, `rgba(120,160,220,0.08)`);
    bodyGrad.addColorStop(1, `rgba(100,140,200,0.15)`);
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Bubble outline
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(180,200,240,0.2)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Iridescent/rainbow reflection
    const iriGrad = ctx.createLinearGradient(-b.r, -b.r, b.r, b.r);
    const hueShift = time * 20 + b.hue;
    iriGrad.addColorStop(0, hsl(hueShift, 80, 80, 0.15));
    iriGrad.addColorStop(0.3, hsl(hueShift + 60, 90, 75, 0.1));
    iriGrad.addColorStop(0.6, hsl(hueShift + 120, 80, 80, 0.12));
    iriGrad.addColorStop(1, hsl(hueShift + 180, 90, 75, 0.08));
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = iriGrad;
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.ellipse(-b.r * 0.25, -b.r * 0.3, b.r * 0.25, b.r * 0.15, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();

    ctx.restore();
  }

  // Pop particles
  for (let i = popParticles.length - 1; i >= 0; i--) {
    const p = popParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // gravity
    p.life -= 0.03;
    if (p.life <= 0) { popParticles.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, 80, 70, p.life * 0.7);
    ctx.fill();
  }
  if (popParticles.length > 50) popParticles.splice(0, popParticles.length - 50);
  state.popParticles = popParticles;
}

// ─── 15. Plasma ─────────────────────────────────────────────────────────────

function drawPlasma(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.blobs = Array.from({ length: 6 }, (_, i) => ({
      x: rand(w * 0.2, w * 0.8), y: rand(h * 0.2, h * 0.8),
      baseX: rand(w * 0.2, w * 0.8), baseY: rand(h * 0.2, h * 0.8),
      r: rand(40, 80), phase: rand(0, Math.PI * 2),
      speedX: rand(0.3, 0.8), speedY: rand(0.2, 0.6),
      hue: [320, 200, 120, 280, 160, 350][i],
      orbiters: Array.from({ length: 5 }, () => ({
        angle: rand(0, Math.PI * 2),
        dist: rand(30, 60),
        speed: rand(1, 3),
        size: rand(1, 3),
        hueOff: rand(-30, 30),
      })),
    }));
  }
  const blobs = state.blobs as { x: number; y: number; baseX: number; baseY: number; r: number; phase: number; speedX: number; speedY: number; hue: number; orbiters: { angle: number; dist: number; speed: number; size: number; hueOff: number }[] }[];

  // Deep black background
  ctx.fillStyle = '#020005';
  ctx.fillRect(0, 0, w, h);

  // ── Plasma Blobs ──
  for (const blob of blobs) {
    // Morphing movement using sine/cosine combinations
    blob.x = blob.baseX + Math.sin(time * blob.speedX + blob.phase) * w * 0.15
      + Math.cos(time * blob.speedX * 0.7 + blob.phase * 2) * w * 0.08;
    blob.y = blob.baseY + Math.cos(time * blob.speedY + blob.phase) * h * 0.15
      + Math.sin(time * blob.speedY * 0.6 + blob.phase * 1.5) * h * 0.08;

    // Mouse attracts plasma toward cursor
    const dx = mx - blob.x;
    const dy = my - blob.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d < 200) {
      const pull = (1 - d / 200) * 30;
      blob.x += (dx / d) * pull * 0.02;
      blob.y += (dy / d) * pull * 0.02;
    }

    // Morphing radius with sine combinations
    const morphR = blob.r + Math.sin(time * 1.5 + blob.phase) * 15
      + Math.cos(time * 2.3 + blob.phase * 0.7) * 10;

    // Pulsing glow
    const pulseGlow = 0.5 + 0.3 * Math.sin(time * 2 + blob.phase);

    // Color shifts through hot pink, electric blue, neon green, purple
    const colorShift = time * 15 + blob.phase * 30;
    const currentHue = (blob.hue + colorShift) % 360;

    // Outer glow
    const outerGrad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, morphR * 2);
    outerGrad.addColorStop(0, hsl(currentHue, 100, 60, 0.08 * pulseGlow));
    outerGrad.addColorStop(0.5, hsl(currentHue + 30, 80, 40, 0.03 * pulseGlow));
    outerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = outerGrad;
    ctx.fillRect(0, 0, w, h);

    // Main blob with morphing shape (using multiple radial gradients offset)
    for (let layer = 0; layer < 3; layer++) {
      const offsetAngle = time * (1 + layer * 0.3) + blob.phase + layer * 2;
      const ox = Math.cos(offsetAngle) * morphR * 0.15;
      const oy = Math.sin(offsetAngle * 0.7) * morphR * 0.15;
      const layerR = morphR * (0.8 + layer * 0.1);

      const grad = ctx.createRadialGradient(
        blob.x + ox, blob.y + oy, 0,
        blob.x + ox, blob.y + oy, layerR
      );
      const layerHue = (currentHue + layer * 40) % 360;
      const layerAlpha = (0.15 - layer * 0.03) * pulseGlow;
      grad.addColorStop(0, hsl(layerHue, 100, 65, layerAlpha));
      grad.addColorStop(0.4, hsl(layerHue + 20, 90, 50, layerAlpha * 0.6));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(blob.x + ox, blob.y + oy, layerR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Orbiting particles
    for (const orb of blob.orbiters) {
      orb.angle += orb.speed * 0.02;
      const orbX = blob.x + Math.cos(orb.angle) * (orb.dist + Math.sin(time * 2 + orb.angle) * 5);
      const orbY = blob.y + Math.sin(orb.angle) * (orb.dist + Math.cos(time * 1.5 + orb.angle) * 5);

      ctx.beginPath();
      ctx.arc(orbX, orbY, orb.size, 0, Math.PI * 2);
      const orbHue = (currentHue + orb.hueOff) % 360;
      ctx.fillStyle = hsl(orbHue, 100, 75, 0.6 + 0.3 * Math.sin(time * 3 + orb.angle));
      ctx.shadowColor = hsl(orbHue, 100, 60, 0.5);
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Trail
      const trailX = orbX - Math.cos(orb.angle) * 8;
      const trailY = orbY - Math.sin(orb.angle) * 8;
      ctx.beginPath();
      ctx.moveTo(orbX, orbY);
      ctx.lineTo(trailX, trailY);
      ctx.strokeStyle = hsl(orbHue, 100, 70, 0.2);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Energy field lines between nearby blobs
  for (let i = 0; i < blobs.length; i++) {
    for (let j = i + 1; j < blobs.length; j++) {
      const d = dist(blobs[i].x, blobs[i].y, blobs[j].x, blobs[j].y);
      if (d < 180) {
        ctx.beginPath();
        const midX = (blobs[i].x + blobs[j].x) / 2 + Math.sin(time * 3 + i) * 15;
        const midY = (blobs[i].y + blobs[j].y) / 2 + Math.cos(time * 2 + j) * 15;
        ctx.moveTo(blobs[i].x, blobs[i].y);
        ctx.quadraticCurveTo(midX, midY, blobs[j].x, blobs[j].y);
        ctx.strokeStyle = hsl((blobs[i].hue + blobs[j].hue) / 2, 100, 70, (1 - d / 180) * 0.15);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

// ─── 16. Deep Sea ───────────────────────────────────────────────────────────

function drawDeepSea(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.jellyfish = Array.from({ length: 18 }, () => ({
      x: rand(w * 0.05, w * 0.95), y: rand(h * 0.1, h * 0.9),
      baseY: rand(h * 0.2, h * 0.8),
      size: rand(10, 25), speed: rand(0.1, 0.4),
      phase: rand(0, Math.PI * 2), hue: rand(160, 220),
      pulsePhase: rand(0, Math.PI * 2),
      tentacles: Array.from({ length: Math.floor(rand(4, 8)) }, () => ({
        angle: rand(-0.5, 0.5),
        length: rand(15, 35),
        wavePhase: rand(0, Math.PI * 2),
        waveAmp: rand(3, 8),
      })),
    }));
    state.plankton = Array.from({ length: 80 }, () =>
      makeParticle({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-0.2, 0.2), vy: rand(-0.3, 0.1),
        size: rand(0.5, 2), maxLife: rand(5, 15), life: rand(0, 1),
        hue: rand(160, 200), sat: 80, light: rand(50, 80),
      })
    );
    state.bubbles = Array.from({ length: 15 }, () => ({
      x: rand(0, w), y: h + rand(0, 50),
      r: rand(2, 5), speed: rand(0.5, 1.5),
      drift: rand(-0.1, 0.1), alpha: rand(0.1, 0.3),
    }));
  }
  const jellyfish = state.jellyfish as { x: number; y: number; baseY: number; size: number; speed: number; phase: number; hue: number; pulsePhase: number; tentacles: { angle: number; length: number; wavePhase: number; waveAmp: number }[] }[];
  const plankton = state.plankton as Particle[];
  const bubbles = state.bubbles as { x: number; y: number; r: number; speed: number; drift: number; alpha: number }[];

  // Dark blue/black deep ocean gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#000815');
  bg.addColorStop(0.3, '#001025');
  bg.addColorStop(0.7, '#000d1a');
  bg.addColorStop(1, '#000510');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Mouse light source
  const lightGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 150);
  lightGrad.addColorStop(0, 'rgba(50,120,180,0.08)');
  lightGrad.addColorStop(0.5, 'rgba(30,80,140,0.03)');
  lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, w, h);

  // Gentle current lines
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const baseY = h * (0.2 + i * 0.15);
    for (let x = 0; x <= w; x += 4) {
      const y = baseY + Math.sin(x * 0.01 + time * 0.5 + i) * 15 + Math.cos(x * 0.005 + time * 0.3) * 10;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(20,60,100,${0.03 + 0.01 * Math.sin(time + i)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Glowing Plankton ──
  for (const p of plankton) {
    p.x += p.vx + Math.sin(time * 0.5 + p.y * 0.01) * 0.1;
    p.y += p.vy;
    p.life -= 0.001;

    // Illuminate near mouse
    const d = dist(p.x, p.y, mx, my);
    const nearMouse = d < 120;

    if (p.life <= 0 || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
      Object.assign(p, {
        x: rand(0, w), y: rand(0, h),
        vx: rand(-0.2, 0.2), vy: rand(-0.3, 0.1),
        life: 1, size: rand(0.5, 2),
        hue: rand(160, 200), light: rand(50, 80),
      });
    }

    const glow = nearMouse ? 0.8 : 0.3 + 0.2 * Math.sin(time * 3 + p.x * 0.1);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (nearMouse ? 1.5 : 1), 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, 80, p.light, glow * p.life);
    if (nearMouse) {
      ctx.shadowColor = hsl(p.hue, 90, 70, 0.5);
      ctx.shadowBlur = 8;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Jellyfish ──
  for (const jf of jellyfish) {
    // Gentle current sway
    jf.x += Math.sin(time * 0.3 + jf.phase) * 0.2;
    jf.y = jf.baseY + Math.sin(time * jf.speed + jf.phase) * 20 - time * jf.speed * 2 % h;

    // Wrap around
    if (jf.y < -50) {
      jf.y = h + 50;
      jf.baseY = jf.y;
      jf.x = rand(w * 0.05, w * 0.95);
    }

    // Mouse illumination
    const mouseDist = dist(jf.x, jf.y, mx, my);
    const illumination = mouseDist < 150 ? (1 - mouseDist / 150) : 0;
    const brightness = 0.5 + illumination * 0.5;

    // Pulse
    const pulse = 1 + 0.15 * Math.sin(time * 2 + jf.pulsePhase);

    ctx.save();
    ctx.translate(jf.x, jf.y);

    // Bioluminescent glow
    const glowR = jf.size * 2.5;
    const jfGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
    jfGlow.addColorStop(0, hsl(jf.hue, 80, 60, 0.1 * brightness));
    jfGlow.addColorStop(0.5, hsl(jf.hue, 70, 40, 0.04 * brightness));
    jfGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = jfGlow;
    ctx.fillRect(-glowR, -glowR, glowR * 2, glowR * 2);

    // Bell (dome)
    ctx.beginPath();
    ctx.ellipse(0, 0, jf.size * pulse, jf.size * 0.7 * pulse, 0, Math.PI, 0);
    const bellGrad = ctx.createRadialGradient(0, -jf.size * 0.3, 0, 0, 0, jf.size);
    bellGrad.addColorStop(0, hsl(jf.hue, 80, 70, 0.3 * brightness));
    bellGrad.addColorStop(0.5, hsl(jf.hue, 70, 50, 0.15 * brightness));
    bellGrad.addColorStop(1, hsl(jf.hue, 60, 30, 0.05));
    ctx.fillStyle = bellGrad;
    ctx.fill();

    // Bell outline
    ctx.beginPath();
    ctx.ellipse(0, 0, jf.size * pulse, jf.size * 0.7 * pulse, 0, Math.PI, 0);
    ctx.strokeStyle = hsl(jf.hue, 90, 70, 0.25 * brightness);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tentacles
    for (const tent of jf.tentacles) {
      ctx.beginPath();
      const tentBaseX = Math.sin(tent.angle) * jf.size * 0.5 * pulse;
      ctx.moveTo(tentBaseX, jf.size * 0.1);
      const segments = 8;
      let tx = tentBaseX;
      let ty = jf.size * 0.1;
      for (let s = 1; s <= segments; s++) {
        const t = s / segments;
        tx = tentBaseX + Math.sin(time * 1.5 + tent.wavePhase + s * 0.5) * tent.waveAmp * t;
        ty = jf.size * 0.1 + tent.length * t;
        ctx.lineTo(tx, ty);
      }
      ctx.strokeStyle = hsl(jf.hue, 70, 60, (0.15 + 0.1 * illumination) * (1 - 0.3));
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ── Bubble trails ──
  for (const b of bubbles) {
    b.y -= b.speed;
    b.x += b.drift + Math.sin(time + b.x * 0.01) * 0.2;
    if (b.y + b.r < 0) {
      b.y = h + rand(5, 30);
      b.x = rand(0, w);
    }
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(80,150,200,${b.alpha})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Highlight
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.2, b.y - b.r * 0.2, b.r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150,200,230,${b.alpha * 0.5})`;
    ctx.fill();
  }
}

// ─── 17. Crystal ────────────────────────────────────────────────────────────

function drawCrystal(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.crystals = Array.from({ length: 12 }, () => ({
      x: rand(w * 0.05, w * 0.95),
      y: rand(h * 0.4, h * 0.95),
      height: rand(30, 80),
      width: rand(8, 20),
      hue: rand(260, 320),
      rot: rand(-0.2, 0.2),
      rotSpeed: rand(-0.003, 0.003),
      pulsePhase: rand(0, Math.PI * 2),
      sides: Math.floor(rand(4, 7)),
    }));
    state.sparkles = Array.from({ length: 60 }, () =>
      makeParticle({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-0.1, 0.1), vy: rand(-0.2, 0),
        size: rand(1, 3), maxLife: rand(3, 8), life: rand(0, 1),
        hue: rand(260, 340), sat: 60, light: rand(60, 90),
      })
    );
    state.refractions = [] as { x1: number; y1: number; x2: number; y2: number; hue: number; life: number }[];
    state.refractTimer = 0;
  }
  const crystals = state.crystals as { x: number; y: number; height: number; width: number; hue: number; rot: number; rotSpeed: number; pulsePhase: number; sides: number }[];
  const sparkles = state.sparkles as Particle[];
  const refractions = (state.refractions || []) as { x1: number; y1: number; x2: number; y2: number; hue: number; life: number }[];

  // Dark purple/black cave background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0a0015');
  bg.addColorStop(0.5, '#0d0020');
  bg.addColorStop(1, '#080012');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Cave walls texture (subtle rocky patterns)
  for (let i = 0; i < 20; i++) {
    const cx = (Math.sin(i * 2.3 + 7.1) * 0.5 + 0.5) * w;
    const cy = (Math.cos(i * 3.7 + 1.3) * 0.5 + 0.5) * h;
    const cr = rand(20, 50);
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(20,5,35,${0.15 + 0.05 * Math.sin(i)})`;
    ctx.fill();
  }

  // Mouse as light source — ambient glow
  const lightGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 200);
  lightGrad.addColorStop(0, 'rgba(180,150,220,0.06)');
  lightGrad.addColorStop(0.3, 'rgba(140,100,180,0.03)');
  lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, w, h);

  // ── Crystal Formations ──
  for (const c of crystals) {
    c.rot += c.rotSpeed;
    const pulse = 1 + 0.05 * Math.sin(time * 1.5 + c.pulsePhase);

    // Mouse proximity increases glow
    const d = dist(c.x, c.y, mx, my);
    const nearMouse = d < 150;
    const glowIntensity = nearMouse ? (1 - d / 150) * 0.5 : 0;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);

    // Crystal glow
    const crystalGlow = ctx.createRadialGradient(0, -c.height * 0.3, 0, 0, -c.height * 0.3, c.height);
    crystalGlow.addColorStop(0, hsl(c.hue, 70, 60, 0.1 + glowIntensity * 0.15));
    crystalGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = crystalGlow;
    ctx.fillRect(-c.height, -c.height, c.height * 2, c.height * 2);

    // Crystal body (geometric prism shape)
    const hw = c.width * pulse;
    const ch = c.height * pulse;
    ctx.beginPath();
    // Main crystal point
    ctx.moveTo(0, -ch);       // top point
    ctx.lineTo(hw * 0.6, -ch * 0.3);
    ctx.lineTo(hw, ch * 0.2);
    ctx.lineTo(hw * 0.3, ch * 0.6);
    ctx.lineTo(0, ch);        // bottom
    ctx.lineTo(-hw * 0.3, ch * 0.6);
    ctx.lineTo(-hw, ch * 0.2);
    ctx.lineTo(-hw * 0.6, -ch * 0.3);
    ctx.closePath();

    // Fill with gradient
    const crystGrad = ctx.createLinearGradient(-hw, -ch, hw, ch);
    crystGrad.addColorStop(0, hsl(c.hue, 50, 40, 0.25 + glowIntensity * 0.2));
    crystGrad.addColorStop(0.3, hsl(c.hue + 20, 60, 55, 0.15 + glowIntensity * 0.15));
    crystGrad.addColorStop(0.7, hsl(c.hue - 10, 40, 35, 0.2 + glowIntensity * 0.1));
    crystGrad.addColorStop(1, hsl(c.hue + 10, 50, 30, 0.15));
    ctx.fillStyle = crystGrad;
    ctx.fill();

    // Crystal edges
    ctx.strokeStyle = hsl(c.hue, 70, 70, 0.3 + glowIntensity * 0.3);
    ctx.lineWidth = 1;
    ctx.shadowColor = hsl(c.hue, 80, 70, 0.5 + glowIntensity * 0.5);
    ctx.shadowBlur = 8 + glowIntensity * 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Facet lines
    ctx.beginPath();
    ctx.moveTo(0, -ch);
    ctx.lineTo(0, ch);
    ctx.strokeStyle = hsl(c.hue, 40, 60, 0.1 + glowIntensity * 0.1);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();

    // Create light refractions near mouse
    if (nearMouse && Math.random() < 0.05) {
      const refractAngle = Math.atan2(my - c.y, mx - c.x) + rand(-0.5, 0.5);
      const refractLen = rand(60, 150);
      refractions.push({
        x1: c.x, y1: c.y - c.height * 0.3,
        x2: c.x + Math.cos(refractAngle) * refractLen,
        y2: c.y - c.height * 0.3 + Math.sin(refractAngle) * refractLen,
        hue: rand(0, 360), life: 1,
      });
    }
  }

  // ── Light Refractions (rainbow prismatic beams) ──
  // Periodic refractions
  if (time - (state.refractTimer as number) > rand(1, 3)) {
    state.refractTimer = time;
    const srcX = rand(w * 0.2, w * 0.8);
    const srcY = rand(0, h * 0.3);
    const angle = rand(0.3, 1.2);
    const len = rand(80, 200);
    refractions.push({
      x1: srcX, y1: srcY,
      x2: srcX + Math.cos(angle) * len,
      y2: srcY + Math.sin(angle) * len,
      hue: rand(0, 360), life: 1,
    });
  }
  for (let i = refractions.length - 1; i >= 0; i--) {
    const ref = refractions[i];
    ref.life -= 0.015;
    if (ref.life <= 0) { refractions.splice(i, 1); continue; }

    const refGrad = ctx.createLinearGradient(ref.x1, ref.y1, ref.x2, ref.y2);
    const alpha = ref.life * 0.25;
    refGrad.addColorStop(0, hsl(ref.hue, 100, 80, 0));
    refGrad.addColorStop(0.2, hsl(ref.hue, 100, 70, alpha));
    refGrad.addColorStop(0.5, hsl(ref.hue + 60, 100, 75, alpha * 0.8));
    refGrad.addColorStop(0.8, hsl(ref.hue + 120, 100, 70, alpha * 0.5));
    refGrad.addColorStop(1, hsl(ref.hue + 180, 100, 80, 0));

    ctx.beginPath();
    ctx.moveTo(ref.x1, ref.y1);
    ctx.lineTo(ref.x2, ref.y2);
    ctx.strokeStyle = refGrad;
    ctx.lineWidth = 2 * ref.life;
    ctx.shadowColor = hsl(ref.hue, 100, 70, alpha * 0.5);
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (refractions.length > 15) refractions.splice(0, refractions.length - 15);
  state.refractions = refractions;

  // ── Sparkle Particles ──
  for (const p of sparkles) {
    p.x += p.vx + Math.sin(time + p.y * 0.01) * 0.1;
    p.y += p.vy;
    p.life -= 0.002;

    if (p.life <= 0 || p.x < -10 || p.x > w + 10 || p.y < -10) {
      Object.assign(p, {
        x: rand(0, w), y: rand(0, h),
        vx: rand(-0.1, 0.1), vy: rand(-0.2, 0),
        life: 1, size: rand(1, 3),
        hue: rand(260, 340), light: rand(60, 90),
      });
    }

    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 4 + p.x * 0.1 + p.y * 0.1));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * twinkle, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, p.sat, p.light, p.life * twinkle * 0.5);
    ctx.shadowColor = hsl(p.hue, 80, 70, 0.3);
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ─── 18. Storm ──────────────────────────────────────────────────────────────

function drawStorm(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.clouds = Array.from({ length: 12 }, () => ({
      x: rand(-100, w + 100), y: rand(-20, h * 0.25),
      w: rand(100, 250), h: rand(30, 60),
      speed: rand(0.2, 0.8), alpha: rand(0.3, 0.6),
    }));
    state.raindrops = Array.from({ length: 400 }, () => ({
      x: rand(0, w), y: rand(-h, h),
      speed: rand(5, 15), length: rand(10, 25),
      alpha: rand(0.1, 0.5),
    }));
    state.stormBolts = [] as { segments: { x: number; y: number }[]; life: number; hue: number }[];
    state.thunderRipples = [] as { x: number; y: number; r: number; alpha: number }[];
    state.lastStrike = 0;
    state.flashAlpha = 0;
  }
  const clouds = state.clouds as { x: number; y: number; w: number; h: number; speed: number; alpha: number }[];
  const raindrops = state.raindrops as { x: number; y: number; speed: number; length: number; alpha: number }[];
  const stormBolts = (state.stormBolts || []) as { segments: { x: number; y: number }[]; life: number; hue: number }[];
  const thunderRipples = (state.thunderRipples || []) as { x: number; y: number; r: number; alpha: number }[];

  // Dark grey/charcoal sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#151520');
  sky.addColorStop(0.3, '#1a1a2a');
  sky.addColorStop(0.7, '#121220');
  sky.addColorStop(1, '#0a0a15');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Flash illumination from lightning
  const flashA = state.flashAlpha as number;
  if (flashA > 0) {
    ctx.fillStyle = `rgba(200,210,240,${flashA})`;
    ctx.fillRect(0, 0, w, h);
    state.flashAlpha = flashA * 0.85;
    if (flashA < 0.01) state.flashAlpha = 0;
  }

  // ── Moving Clouds ──
  for (const c of clouds) {
    c.x += c.speed;
    if (c.x > w + 200) c.x = -250;

    const cloudGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.w * 0.5);
    cloudGrad.addColorStop(0, `rgba(40,40,55,${c.alpha})`);
    cloudGrad.addColorStop(0.5, `rgba(30,30,45,${c.alpha * 0.5})`);
    cloudGrad.addColorStop(1, 'rgba(20,20,30,0)');
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w * 0.5, c.h * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = cloudGrad;
    ctx.fill();
    // Secondary cloud mass
    ctx.beginPath();
    ctx.ellipse(c.x + c.w * 0.2, c.y - c.h * 0.2, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(35,35,50,${c.alpha * 0.4})`;
    ctx.fill();
  }

  // ── Rain ──
  const windAngle = (mx / w - 0.5) * 0.3; // Mouse influences rain angle
  for (const r of raindrops) {
    r.y += r.speed;
    r.x += Math.sin(windAngle) * r.speed * 0.5 + 1; // Diagonal rain
    if (r.y > h) {
      r.y = rand(-20, -5);
      r.x = rand(-20, w + 20);
    }
    if (r.x > w + 20) r.x = -10;

    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.x + Math.sin(windAngle) * r.length * 0.3, r.y + r.length);
    ctx.strokeStyle = `rgba(150,170,200,${r.alpha})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // ── Lightning Strikes ──
  // Mouse position influences where lightning strikes
  if (time - (state.lastStrike as number) > rand(2, 6)) {
    state.lastStrike = time;
    state.flashAlpha = 0.3 + Math.random() * 0.2; // Flash!

    // Target influenced by mouse
    const targetX = lerp(rand(w * 0.1, w * 0.9), mx, 0.4);
    const targetY = h;
    const startX = targetX + rand(-50, 50);
    const startY = 0;

    const segments: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const steps = 15;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      segments.push({
        x: lerp(startX, targetX, t) + rand(-35, 35) * (1 - t * 0.5),
        y: lerp(startY, targetY, t),
      });
    }
    segments.push({ x: targetX, y: targetY });

    stormBolts.push({ segments, life: 1, hue: rand(210, 250) });

    // Branches
    const branchCount = Math.floor(rand(2, 5));
    for (let b = 0; b < branchCount; b++) {
      const branchStart = Math.floor(rand(3, segments.length - 3));
      const bp = segments[branchStart];
      const branchSegs: { x: number; y: number }[] = [{ x: bp.x, y: bp.y }];
      let bx = bp.x;
      let by = bp.y;
      const bSteps = Math.floor(rand(3, 8));
      for (let i = 0; i < bSteps; i++) {
        bx += rand(-25, 25);
        by += rand(8, 25);
        branchSegs.push({ x: bx, y: by });
      }
      stormBolts.push({ segments: branchSegs, life: 0.8, hue: rand(200, 260) });
    }

    // Thunder ripple at impact point
    thunderRipples.push({ x: targetX, y: targetY, r: 0, alpha: 0.6 });
  }

  for (let i = stormBolts.length - 1; i >= 0; i--) {
    const bolt = stormBolts[i];
    bolt.life -= 0.04;
    if (bolt.life <= 0) { stormBolts.splice(i, 1); continue; }

    ctx.beginPath();
    ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
    for (let j = 1; j < bolt.segments.length; j++) {
      ctx.lineTo(bolt.segments[j].x, bolt.segments[j].y);
    }
    // Outer glow
    ctx.strokeStyle = hsl(bolt.hue, 50, 80, bolt.life * 0.35);
    ctx.lineWidth = 6 * bolt.life;
    ctx.shadowColor = hsl(bolt.hue, 80, 90, 0.8);
    ctx.shadowBlur = 20;
    ctx.stroke();
    // Core
    ctx.strokeStyle = hsl(bolt.hue, 70, 95, bolt.life * 0.9);
    ctx.lineWidth = 1.5 * bolt.life;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  state.stormBolts = stormBolts;

  // ── Thunder Ripples ──
  for (let i = thunderRipples.length - 1; i >= 0; i--) {
    const rip = thunderRipples[i];
    rip.r += 3;
    rip.alpha -= 0.008;
    if (rip.alpha <= 0) { thunderRipples.splice(i, 1); continue; }

    ctx.beginPath();
    ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
    ctx.strokeStyle = hsl(220, 60, 70, rip.alpha * 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Second ring
    if (rip.r > 20) {
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.r * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = hsl(230, 50, 60, rip.alpha * 0.3);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  if (thunderRipples.length > 10) thunderRipples.splice(0, thunderRipples.length - 10);
  state.thunderRipples = thunderRipples;
}

// ─── Cherry Blossom ──────────────────────────────────────────────────────────

function drawCherryBlossom(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.petals = Array.from({ length: 120 }, () => ({
      x: rand(-50, w + 50), y: rand(-h, 0),
      size: rand(4, 12), speed: rand(0.5, 2.5),
      drift: rand(-0.5, 0.5), rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.02, 0.02), hue: rand(330, 360),
      alpha: rand(0.4, 0.9),
    }));
    state.branches = Array.from({ length: 3 }, () => ({
      x: rand(w * 0.1, w * 0.9), y: rand(0, h * 0.3),
      length: rand(80, 200), angle: rand(-0.5, 0.5),
    }));
  }
  const petals = state.petals as { x: number; y: number; size: number; speed: number; drift: number; rotation: number; rotSpeed: number; hue: number; alpha: number }[];
  const branches = state.branches as { x: number; y: number; length: number; angle: number }[];

  // Gradient sky
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1a0010');
  bg.addColorStop(0.4, '#2d0020');
  bg.addColorStop(0.7, '#4a1030');
  bg.addColorStop(1, '#3d1525');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Wind from mouse
  const windX = (mx / w - 0.5) * 3;

  // Draw tree branches
  for (const b of branches) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle + Math.sin(time * 0.3) * 0.02);
    ctx.strokeStyle = 'rgba(80,40,30,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(b.length * 0.3, -20, b.length, -10 + Math.sin(time) * 5);
    ctx.stroke();
    // Sub-branches
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.length * 0.5, -15);
    ctx.quadraticCurveTo(b.length * 0.7, -35, b.length * 0.8, -30);
    ctx.stroke();
    ctx.restore();
  }

  // Draw petals
  for (const p of petals) {
    p.x += p.drift + windX * 0.5 + Math.sin(time * 2 + p.y * 0.01) * 0.8;
    p.y += p.speed;
    p.rotation += p.rotSpeed + windX * 0.01;

    if (p.y > h + 20 || p.x < -60 || p.x > w + 60) {
      Object.assign(p, {
        x: rand(-50, w + 50), y: rand(-40, -10),
        size: rand(4, 12), speed: rand(0.5, 2),
        drift: rand(-0.5, 0.5), rotation: rand(0, Math.PI * 2),
        hue: rand(330, 360), alpha: rand(0.4, 0.9),
      });
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha;
    // Petal shape (ellipse)
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, 70, 80, 0.7);
    ctx.fill();
    // Second petal
    ctx.beginPath();
    ctx.ellipse(p.size * 0.3, 0, p.size * 0.7, p.size * 0.35, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, 60, 85, 0.5);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Soft glow at mouse
  if (mx > 0 && my > 0) {
    const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
    glow.addColorStop(0, 'rgba(255,150,200,0.06)');
    glow.addColorStop(1, 'rgba(255,100,150,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }
}

// ─── Stardust ────────────────────────────────────────────────────────────────

function drawStardust(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.particles = Array.from({ length: 200 }, () =>
      makeParticle({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3),
        size: rand(0.5, 2.5), maxLife: rand(3, 10), life: rand(0, 1),
        hue: rand(30, 60), sat: rand(60, 100), light: rand(60, 95),
      })
    );
    state.trails = Array.from({ length: 8 }, () => ({
      x: rand(0, w), y: rand(0, h),
      length: rand(50, 200), angle: rand(0, Math.PI * 2),
      speed: rand(0.5, 2), hue: rand(30, 55),
    }));
  }
  const particles = state.particles as Particle[];
  const trails = state.trails as { x: number; y: number; length: number; angle: number; speed: number; hue: number }[];

  // Dark cosmic background
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.6);
  bg.addColorStop(0, '#1a0f00');
  bg.addColorStop(0.5, '#0d0800');
  bg.addColorStop(1, '#050300');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Nebula glow
  const offsetX = (mx / w - 0.5) * 20;
  for (let i = 0; i < 3; i++) {
    const nx = w * (0.3 + i * 0.2) + offsetX;
    const ny = h * (0.3 + i * 0.15);
    const neb = ctx.createRadialGradient(nx, ny, 0, nx, ny, 120);
    neb.addColorStop(0, hsl(40 + i * 20, 80, 40, 0.06 + 0.02 * Math.sin(time * 0.5 + i)));
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, w, h);
  }

  // Golden trails
  for (const t of trails) {
    t.angle += t.speed * 0.005;
    const endX = t.x + Math.cos(t.angle) * t.length;
    const endY = t.y + Math.sin(t.angle) * t.length;
    const grad = ctx.createLinearGradient(t.x, t.y, endX, endY);
    grad.addColorStop(0, hsl(t.hue, 100, 80, 0));
    grad.addColorStop(0.5, hsl(t.hue, 100, 70, 0.15 + 0.05 * Math.sin(time * 3 + t.hue)));
    grad.addColorStop(1, hsl(t.hue, 100, 80, 0));
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Particles
  for (const p of particles) {
    const dx = mx - p.x;
    const dy = my - p.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d < 120) {
      p.vx += (dx / d) * 0.15;
      p.vy += (dy / d) * 0.15;
    }
    p.vx *= 0.99;
    p.vy *= 0.99;
    p.x += p.vx + Math.sin(time + p.y * 0.005) * 0.2;
    p.y += p.vy + Math.cos(time * 0.7 + p.x * 0.005) * 0.2;
    p.life -= 0.003;

    if (p.life <= 0) {
      Object.assign(p, {
        x: rand(0, w), y: rand(0, h),
        vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3),
        life: 1, size: rand(0.5, 2.5),
        hue: rand(30, 60), light: rand(60, 95),
      });
    }

    const twinkle = 0.5 + 0.5 * Math.sin(time * 5 + p.x * 0.1 + p.y * 0.1);
    const a = p.life * 0.8 * twinkle;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, 100, p.light, a);
    ctx.shadowColor = hsl(p.hue, 100, 70, 0.5);
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ─── Vortex ──────────────────────────────────────────────────────────────────

function drawVortex(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.particles = Array.from({ length: 180 }, () =>
      makeParticle({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-1, 1), vy: rand(-1, 1),
        size: rand(1, 3), maxLife: rand(2, 6), life: rand(0, 1),
        hue: rand(100, 170), sat: 100, light: rand(50, 80),
      })
    );
    state.rings = Array.from({ length: 6 }, (_, i) => ({
      r: 30 + i * 40, speed: 0.3 + i * 0.1, hue: 120 + i * 10,
    }));
  }
  const particles = state.particles as Particle[];
  const rings = state.rings as { r: number; speed: number; hue: number }[];

  // Background
  ctx.fillStyle = '#020d08';
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5 + (mx - w * 0.5) * 0.1;
  const cy = h * 0.5 + (my - h * 0.5) * 0.1;

  // Spiral rings
  for (const ring of rings) {
    ring.r += Math.sin(time * 0.5) * 0.3;
    const drawR = Math.max(1, ring.r);
    ctx.beginPath();
    ctx.arc(cx, cy, drawR, 0, Math.PI * 2);
    ctx.strokeStyle = hsl(ring.hue, 80, 50, 0.1 + 0.05 * Math.sin(time * 2 + ring.hue));
    ctx.lineWidth = 2;
    ctx.stroke();

    // Spiral arm
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.1) {
      const spiralR = drawR * (a / (Math.PI * 4));
      const x = cx + Math.cos(a + time * ring.speed) * spiralR;
      const y = cy + Math.sin(a + time * ring.speed) * spiralR;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = hsl(ring.hue, 100, 60, 0.08);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Center glow
  const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
  centerGlow.addColorStop(0, hsl(140, 100, 70, 0.15 + 0.05 * Math.sin(time * 3)));
  centerGlow.addColorStop(0.5, hsl(120, 100, 50, 0.05));
  centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, w, h);

  // Particles spiral toward center
  for (const p of particles) {
    const dx = cx - p.x;
    const dy = cy - p.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const pullStrength = Math.min(0.5, 30 / d);
    // Tangential force (spiral)
    p.vx += (-dy / d) * 0.15 + (dx / d) * pullStrength;
    p.vy += (dx / d) * 0.15 + (dy / d) * pullStrength;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.004;

    if (p.life <= 0 || d < 10) {
      Object.assign(p, {
        x: rand(0, w), y: rand(0, h),
        vx: rand(-1, 1), vy: rand(-1, 1),
        life: 1, size: rand(1, 3),
        hue: rand(100, 170), light: rand(50, 80),
      });
    }

    const a = p.life * 0.7;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, 100, p.light, a);
    ctx.shadowColor = hsl(p.hue, 100, 60, 0.4);
    ctx.shadowBlur = 5;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ─── Northern Lights ─────────────────────────────────────────────────────────

function drawNorthernLights(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.stars = Array.from({ length: 150 }, () => ({
      x: rand(0, w), y: rand(0, h * 0.6),
      size: rand(0.5, 2), brightness: rand(0.3, 1),
      phase: rand(0, Math.PI * 2),
    }));
    state.particles = Array.from({ length: 80 }, () =>
      makeParticle({
        x: rand(0, w), y: rand(0, h * 0.5),
        vx: rand(-0.3, 0.3), vy: rand(-0.2, 0.1),
        size: rand(1, 3), maxLife: rand(3, 8), life: rand(0, 1),
        hue: rand(100, 200), sat: rand(60, 100), light: rand(50, 80),
      })
    );
  }
  const stars = state.stars as { x: number; y: number; size: number; brightness: number; phase: number }[];
  const particles = state.particles as Particle[];

  // Night sky
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#020020');
  bg.addColorStop(0.3, '#050840');
  bg.addColorStop(0.6, '#081050');
  bg.addColorStop(1, '#0a0820');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Vivid aurora curtains - more layers and brighter
  const mouseInfluenceX = (mx / w - 0.5) * 80;
  const mouseInfluenceY = (my / h - 0.5) * 40;
  const auroraLayers = 6;
  const hues = [100, 130, 160, 190, 220, 280];
  const alphas = [0.18, 0.15, 0.13, 0.11, 0.09, 0.07];

  for (let layer = 0; layer < auroraLayers; layer++) {
    const baseY = h * (0.1 + layer * 0.08) + mouseInfluenceY * (layer * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 3) {
      const wave1 = Math.sin((x + time * 50 + mouseInfluenceX) * 0.007 + layer) * 70;
      const wave2 = Math.sin((x - time * 30) * 0.011 + layer * 2) * 40;
      const wave3 = Math.sin((x + time * 80) * 0.004) * 30;
      const wave4 = Math.cos((x + time * 20) * 0.009 + layer * 0.5) * 20;
      const y = baseY + wave1 + wave2 + wave3 + wave4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, baseY - 100, 0, baseY + 250);
    grad.addColorStop(0, hsl(hues[layer], 95, 70, 0));
    grad.addColorStop(0.2, hsl(hues[layer], 95, 65, alphas[layer]));
    grad.addColorStop(0.5, hsl(hues[layer], 85, 55, alphas[layer] * 0.7));
    grad.addColorStop(0.8, hsl(hues[layer], 75, 40, alphas[layer] * 0.3));
    grad.addColorStop(1, hsl(hues[layer], 65, 25, 0));
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Vertical light rays
  for (let i = 0; i < 12; i++) {
    const rx = (Math.sin(i * 2.7 + time * 0.3) * 0.5 + 0.5) * w;
    const rayAlpha = 0.03 + 0.02 * Math.sin(time * 2 + i * 1.5);
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx + Math.sin(time + i) * 20, h);
    ctx.strokeStyle = hsl(140 + i * 10, 100, 70, rayAlpha);
    ctx.lineWidth = 4 + Math.sin(time + i) * 2;
    ctx.stroke();
  }

  // Stars
  for (const s of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(time * 3 + s.phase);
    const a = s.brightness * twinkle;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * twinkle, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fill();
  }

  // Shimmer particles
  for (const p of particles) {
    p.x += p.vx + Math.sin(time * 1.5 + p.y * 0.01) * 0.4;
    p.y += p.vy + Math.cos(time * 0.8 + p.x * 0.005) * 0.3;
    p.life -= 0.002;

    if (p.life <= 0) {
      Object.assign(p, {
        x: rand(0, w), y: rand(0, h * 0.5),
        vx: rand(-0.3, 0.3), vy: rand(-0.2, 0.1),
        life: 1, size: rand(1, 3),
        hue: rand(100, 200), light: rand(50, 80),
      });
    }

    const a = p.life * 0.5 * (0.5 + 0.5 * Math.sin(time * 4 + p.x));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = hsl(p.hue, p.sat, p.light, a);
    ctx.fill();
  }
}

function drawFireflies(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.flies = Array.from({ length: 50 }, () => ({
      x: rand(0, w), y: rand(0, h),
      vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5),
      size: rand(1.5, 3), hue: 60,
      phase: rand(0, Math.PI * 2),
    }));
  }
  const flies = state.flies as { x: number; y: number; vx: number; vy: number; size: number; hue: number; phase: number }[];
  ctx.fillStyle = '#050a05';
  ctx.fillRect(0, 0, w, h);

  for (const f of flies) {
    f.x += f.vx + Math.sin(time + f.phase) * 0.2;
    f.y += f.vy + Math.cos(time + f.phase) * 0.2;
    if (f.x < 0) f.x = w; if (f.x > w) f.x = 0;
    if (f.y < 0) f.y = h; if (f.y > h) f.y = 0;

    const flicker = 0.4 + 0.6 * Math.abs(Math.sin(time * 2 + f.phase));
    const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 4 * flicker);
    grad.addColorStop(0, hsl(f.hue, 100, 70, 0.8 * flicker));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.size * 4 * flicker, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath(); ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fillStyle = hsl(f.hue, 100, 90, 1);
    ctx.fill();
  }
}

function drawBinaryRain(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    const colW = 18;
    const cols = Math.ceil(w / colW);
    state.columns = Array.from({ length: cols }, () => ({
      y: rand(-h, 0), speed: rand(2, 6),
    }));
  }
  const columns = state.columns as { y: number; speed: number }[];
  ctx.fillStyle = 'rgba(0,5,15,0.2)';
  ctx.fillRect(0, 0, w, h);

  const colW = 18;
  ctx.font = 'bold 16px monospace';
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    col.y += col.speed;
    if (col.y > h + 100) col.y = -100;

    const char = Math.random() > 0.5 ? '1' : '0';
    const alpha = 0.5 + 0.5 * Math.sin(time * 5 + i);
    ctx.fillStyle = `rgba(0,255,255,${alpha})`;
    ctx.fillText(char, i * colW, col.y);

    if (Math.random() < 0.1) {
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = 10;
      ctx.fillText(char, i * colW, col.y);
      ctx.shadowBlur = 0;
    }
  }
}

function drawGeometricFlow(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.nodes = Array.from({ length: 40 }, () => ({
      x: rand(0, w), y: rand(0, h),
      vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5),
    }));
  }
  const nodes = state.nodes as { x: number; y: number; vx: number; vy: number }[];
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    n.x += n.vx; n.y += n.vy;
    if (n.x < 0 || n.x > w) n.vx *= -1;
    if (n.y < 0 || n.y > h) n.vy *= -1;

    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];
      const d = dist(n.x, n.y, n2.x, n2.y);
      if (d < 120) {
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = `rgba(100,100,255,${(1 - d / 120) * 0.4})`;
        ctx.stroke();
      }
    }

    ctx.beginPath();
    ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
}

// ─── Phase 4: Premium Live Themes ────────────────────────────────────────────

/**
 * Nebula: Twinkling starfield with drifting nebula gas clouds and shooting stars
 */
function drawNebula(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.stars) {
    state.stars = Array.from({ length: 120 }, () => ({
      x: rand(0, w), y: rand(0, h),
      size: rand(0.5, 2.5), twinkle: rand(0.5, 3), drift: rand(0.02, 0.1),
    }));
    state.clouds = Array.from({ length: 5 }, () => ({
      x: rand(0, w), y: rand(0.1 * h, 0.9 * h),
      r: rand(w * 0.25, w * 0.5), hue: rand(230, 310),
      dx: rand(-0.1, 0.1), dy: rand(-0.05, 0.05),
    }));
    state.shootingStars = [] as { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[];
    state.nextShoot = 0;
  }
  const typedState = state as { stars: any[]; clouds: any[]; shootingStars: any[]; nextShoot: number };
  const { stars, clouds } = typedState;

  // Deep space background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);

  // Nebula gas clouds
  for (const c of clouds) {
    const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    grad.addColorStop(0, hsl(c.hue, 70, 25, 0.18));
    grad.addColorStop(0.5, hsl(c.hue + 20, 60, 15, 0.08));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    c.x += c.dx; c.y += c.dy;
    if (c.x < -c.r) c.x = w + c.r;
    if (c.x > w + c.r) c.x = -c.r;
    if (c.y < -c.r) c.y = h + c.r;
    if (c.y > h + c.r) c.y = -c.r;
  }

  // Twinkling stars
  for (const s of stars) {
    const alpha = 0.2 + 0.8 * Math.abs(Math.sin(time * s.twinkle + s.x * 0.01));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * (0.7 + 0.3 * alpha), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 245, 220, ${alpha})`;
    ctx.shadowColor = 'rgba(200,200,255,0.8)';
    ctx.shadowBlur = s.size * 3;
    ctx.fill();
    ctx.shadowBlur = 0;
    s.x += s.drift * Math.cos(time * 0.1 + s.y);
    if (s.x > w) s.x = 0; if (s.x < 0) s.x = w;
  }

  // Shooting stars
  if (time > typedState.nextShoot) {
    typedState.shootingStars.push({ x: rand(0, w * 0.8), y: rand(0, h * 0.4), vx: rand(3, 6), vy: rand(1, 3), life: 0, maxLife: rand(0.5, 1.2) });
    typedState.nextShoot = time + rand(2, 5);
  }
  for (let i = typedState.shootingStars.length - 1; i >= 0; i--) {
    const ss = typedState.shootingStars[i];
    ss.life += 0.016;
    ss.x += ss.vx; ss.y += ss.vy;
    const alpha = 1 - ss.life / ss.maxLife;
    ctx.beginPath();
    ctx.moveTo(ss.x, ss.y);
    ctx.lineTo(ss.x - ss.vx * 8, ss.y - ss.vy * 8);
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (ss.life >= ss.maxLife) typedState.shootingStars.splice(i, 1);
  }
}

/**
 * Ocean Waves: Rolling gradient waves with foam and particle reflections
 */
function drawOceanWaves(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.foam) {
    state.foam = Array.from({ length: 30 }, () => ({
      x: rand(0, w), y: rand(h * 0.5, h), size: rand(1, 4), alpha: rand(0.3, 1),
    }));
  }
  const { foam } = state as { foam: any[] };

  // Deep ocean gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#000d1a');
  bg.addColorStop(0.5, '#001f3f');
  bg.addColorStop(1, '#003366');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Surface light refraction shimmer
  for (let i = 0; i < 8; i++) {
    const shimX = (w * 0.1 * i + time * 30 * (i % 2 === 0 ? 1 : -1)) % w;
    const shimY = h * 0.3 + Math.sin(time + i) * 20;
    const shimGrad = ctx.createRadialGradient(shimX, shimY, 0, shimX, shimY, 60);
    shimGrad.addColorStop(0, 'rgba(100,200,255,0.08)');
    shimGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shimGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Wave layers (back to front)
  const waveLayers = [
    { yBase: 0.45, amp: 15, speed: 0.4, color: 'rgba(0,80,160,0.5)', width: 2 },
    { yBase: 0.55, amp: 12, speed: 0.6, color: 'rgba(0,100,200,0.55)', width: 2 },
    { yBase: 0.62, amp: 10, speed: 0.8, color: 'rgba(0,130,220,0.6)', width: 1.5 },
    { yBase: 0.7, amp: 8, speed: 1.2, color: 'rgba(0,160,230,0.7)', width: 1.5 },
    { yBase: 0.78, amp: 6, speed: 1.6, color: 'rgba(50,180,240,0.8)', width: 1 },
  ];

  for (const layer of waveLayers) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 5) {
      const y = h * layer.yBase + Math.sin(x * 0.015 + time * layer.speed) * layer.amp
        + Math.sin(x * 0.008 - time * layer.speed * 0.7) * (layer.amp * 0.5);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
    ctx.strokeStyle = layer.color.replace(/[\d.]+\)$/, '0.9)');
    ctx.lineWidth = layer.width;
    ctx.stroke();
  }

  // Foam particles
  for (const f of foam) {
    f.x += Math.sin(time * 0.8 + f.y * 0.05) * 0.4;
    f.alpha = 0.2 + 0.6 * Math.abs(Math.sin(time * 0.5 + f.x * 0.05));
    ctx.beginPath();
    ctx.arc(f.x, f.y + Math.sin(time + f.x * 0.1) * 4, f.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,240,255,${f.alpha * 0.5})`;
    ctx.fill();
    if (f.x > w) f.x = 0; if (f.x < 0) f.x = w;
  }
}

/**
 * Lava Lamp: Rising metaball-like blobs with warm glow
 */
function drawLavaLamp(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.blobs) {
    state.blobs = Array.from({ length: 7 }, () => ({
      x: rand(w * 0.15, w * 0.85),
      y: rand(0, h),
      r: rand(35, 75),
      vy: rand(0.4, 1.2) * (Math.random() > 0.5 ? 1 : -1),
      phase: rand(0, Math.PI * 2),
      hue: rand(0, 40),
    }));
  }
  const { blobs } = state as { blobs: any[] };

  // Dark warm background
  ctx.fillStyle = '#100400';
  ctx.fillRect(0, 0, w, h);

  // Subtle ambient glow
  const ambient = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.8);
  ambient.addColorStop(0, 'rgba(180,40,0,0.2)');
  ambient.addColorStop(1, 'transparent');
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, w, h);

  // Move and draw blobs
  for (const b of blobs) {
    b.y += b.vy * 0.4;
    b.x += Math.sin(time * 0.3 + b.phase) * 0.8;
    // Bounce within container
    if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }
    if (b.y + b.r > h) { b.y = h - b.r; b.vy = -Math.abs(b.vy); }
    if (b.x - b.r < 0) b.x = b.r + 5;
    if (b.x + b.r > w) b.x = w - b.r - 5;

    // Soft metaball glow
    const xOff = Math.sin(time * 0.7 + b.phase) * 15;
    const yOff = Math.cos(time * 0.5 + b.phase) * 10;
    const grad = ctx.createRadialGradient(b.x + xOff, b.y + yOff, 0, b.x + xOff, b.y + yOff, b.r * 1.4);
    grad.addColorStop(0, hsl(b.hue, 100, 60, 0.9));
    grad.addColorStop(0.6, hsl(b.hue + 10, 100, 45, 0.5));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x + xOff, b.y + yOff, b.r * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top and bottom caps (glass effect)
  const capGrad = ctx.createLinearGradient(0, 0, 0, h * 0.12);
  capGrad.addColorStop(0, 'rgba(0,0,0,0.8)');
  capGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = capGrad;
  ctx.fillRect(0, 0, w, h * 0.12);

  const capGrad2 = ctx.createLinearGradient(0, h * 0.88, 0, h);
  capGrad2.addColorStop(0, 'transparent');
  capGrad2.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = capGrad2;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

/**
 * Circuit Board: Animated digital traces pulsing with data signals
 */
function drawCircuitBoard(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  const GRID = 40;
  if (!state.traces) {
    const nodes: { x: number; y: number; connected: { x: number; y: number }[] }[] = [];
    for (let gx = GRID; gx < w; gx += GRID) {
      for (let gy = GRID; gy < h; gy += GRID) {
        if (Math.random() > 0.55) {
          nodes.push({ x: gx, y: gy, connected: [] });
        }
      }
    }
    // Connect nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = Math.abs(nodes[i].x - nodes[j].x);
        const dy = Math.abs(nodes[i].y - nodes[j].y);
        if ((dx === GRID && dy === 0) || (dx === 0 && dy === GRID)) {
          nodes[i].connected.push(nodes[j]);
        }
      }
    }
    state.traces = nodes;
    state.signals = Array.from({ length: 8 }, (_, i) => ({
      nodeIdx: Math.floor(rand(0, nodes.length)),
      progress: rand(0, 1),
      speed: rand(0.4, 1.2),
      hue: i % 2 === 0 ? 120 : 160,
    }));
  }

  const { traces, signals } = state as { traces: any[]; signals: any[] };

  ctx.fillStyle = '#030a03';
  ctx.fillRect(0, 0, w, h);

  // Grid lines (faint)
  ctx.strokeStyle = 'rgba(0,60,0,0.4)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += GRID) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += GRID) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Draw traces
  for (const node of traces) {
    for (const conn of node.connected) {
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(conn.x, conn.y);
      ctx.strokeStyle = 'rgba(0,180,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Draw nodes
  for (const node of traces) {
    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.5 + node.x * 0.05 + node.y * 0.05));
    ctx.beginPath();
    ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = hsl(120, 100, 50, pulse);
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 8 * pulse;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Animate signals along traces
  for (const sig of signals) {
    if (sig.nodeIdx >= traces.length) { sig.nodeIdx = 0; continue; }
    const node = traces[sig.nodeIdx];
    if (!node.connected.length) { sig.nodeIdx = Math.floor(rand(0, traces.length)); continue; }
    const connIdx = Math.floor(sig.progress * node.connected.length) % node.connected.length;
    const conn = node.connected[connIdx];
    const t = (sig.progress * node.connected.length) % 1;
    const sx = node.x + (conn.x - node.x) * t;
    const sy = node.y + (conn.y - node.y) * t;
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fillStyle = hsl(sig.hue, 100, 70, 0.95);
    ctx.shadowColor = hsl(sig.hue, 100, 60, 1);
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    sig.progress += sig.speed * 0.016;
    if (sig.progress >= 1) {
      sig.progress = 0;
      if (node.connected.length > 0) {
        const next = node.connected[Math.floor(rand(0, node.connected.length))];
        sig.nodeIdx = traces.indexOf(next);
        if (sig.nodeIdx < 0) sig.nodeIdx = Math.floor(rand(0, traces.length));
      }
    }
  }
}

// ─── 31. Unified Waving Flag Logic ──────────────────────────────────────────

function drawWavingLayer(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, colors: string[], bands = 3, type: 'h' | 'v' = 'h') {
  for (let i = 0; i < bands; i++) {
    ctx.beginPath();
    if (type === 'h') {
      const startY = (h / bands) * i;
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 5) {
        const wave = Math.sin(x * 0.005 + time * 1.5 + i) * 15;
        ctx.lineTo(x, (h / bands) * (i + 1) + wave);
      }
      ctx.lineTo(w, h);
    }
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
  }
}

function drawFlagTriangle(ctx: CanvasRenderingContext2D, h: number, color: string, time: number) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const wave = Math.sin(time * 1.5) * 10;
    ctx.lineTo(h * 0.4 + wave, h / 2);
    ctx.lineTo(0, h);
    ctx.fillStyle = color;
    ctx.fill();
}

// Star helper
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) {
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawEthFlag(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_Ethiopia.svg', 'rgba(0, 155, 72, 1)');
}

function drawAdey(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
  bg.addColorStop(0, '#15803d'); bg.addColorStop(1, '#14532d');
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
  
  // Interactive Glow
  if (mx > -500) {
    const spot = ctx.createRadialGradient(mx, my, 0, mx, my, w * 0.5);
    spot.addColorStop(0, 'rgba(250, 204, 21, 0.15)');
    spot.addColorStop(1, 'transparent');
    ctx.fillStyle = spot; ctx.fillRect(0,0,w,h);
  }

  ctx.save();
  const ox = mx > -500 ? (mx - w/2) * 0.05 : 0;
  const oy = my > -500 ? (my - h/2) * 0.05 : 0;
  ctx.translate(w/2 + ox, h/2 + oy);
  const rot = time * 0.5; ctx.rotate(rot);
  for(let i=0; i<12; i++) {
    ctx.rotate(Math.PI/6);
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.ellipse(0, 40, 15, 45, 0, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = '#78350f';
  ctx.beginPath(); ctx.arc(0,0, 25, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawCoffee(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  const bg = ctx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0, '#2d1a12'); bg.addColorStop(1, '#1a0d01');
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
  
  if (mx > -500) {
    const spot = ctx.createRadialGradient(mx, my, 0, mx, my, w * 0.4);
    spot.addColorStop(0, 'rgba(146, 64, 14, 0.2)');
    spot.addColorStop(1, 'transparent');
    ctx.fillStyle = spot; ctx.fillRect(0,0,w,h);
  }

  for(let i=0; i<15; i++) {
    const x = (i*137)%w, y = h - ((time*50 + i*80)%h);
    // Mouse interaction for bubbles
    const dx = mx - x, dy = my - y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const scale = mx > -500 && dist < 100 ? 1.5 : 1;
    
    ctx.fillStyle = mx > -500 && dist < 100 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.arc(x,y, 40 * scale, 0, Math.PI*2); ctx.fill();
  }
}

let imgCache: Record<string, HTMLImageElement> = {};

function drawImageTheme(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, src: string, auraColor: string) {
  if (!imgCache[src]) {
    const img = new Image();
    img.src = src;
    img.onload = () => { imgCache[src] = img; };
    return;
  }
  const img = imgCache[src];
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
  
  // Interactive Ambient Aura
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.8);
  const glow = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * (0.7 + pulse * 0.2));
  glow.addColorStop(0, auraColor.replace('1)', `${0.15 + pulse*0.1})`));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.fillRect(0,0,w,h);

  // Interactive Cursor Spotlight
  if (mx > -500) {
    const spot = ctx.createRadialGradient(mx, my, 0, mx, my, w * 0.4);
    spot.addColorStop(0, auraColor.replace('1)', '0.12)'));
    spot.addColorStop(1, 'transparent');
    ctx.fillStyle = spot; ctx.fillRect(0,0,w,h);
  }

  // Soft-Cover Fitting + Interactive Parallax
  const iw = img.width, ih = img.height;
  const drift = 0.025;
  const px = mx > -500 ? (mx - w/2) / (w/2) * -15 : 0;
  const py = my > -500 ? (my - h/2) / (h/2) * -10 : 0;
  
  const scale = 1.05 + 0.05 * Math.sin(time * 0.4);
  const ratio = Math.max(w / iw, h / ih) * scale;
  const nw = iw * ratio, nh = ih * ratio;
  const ox = Math.sin(time * 0.2) * w * drift + px;
  const oy = Math.cos(time * 0.15) * h * drift + py;
  
  ctx.save();
  ctx.translate(w/2 + ox, h/2 + oy);
  // Subtle rotation for "floating" feel
  ctx.rotate(Math.sin(time * 0.1) * 0.015);
  ctx.drawImage(img, -nw/2, -nh/2, nw, nh);
  ctx.restore();

  // Interactive Floating Particles
  for(let i=0; i<20; i++) {
    const baseX = (i * 137 + time * 20) % w;
    const baseY = (i * 91 + time * 15) % h;
    
    // Proximity to cursor
    const dx = mx - baseX;
    const dy = my - baseY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const attract = mx > -500 && dist < 150 ? (150 - dist) / 150 : 0;
    
    const px = baseX + (dx * attract * 0.2);
    const py = baseY + (dy * attract * 0.2);
    
    const pa = (0.05 + 0.1 * Math.sin(time + i)) * (1 + attract * 2);
    ctx.fillStyle = `rgba(255,255,255,${pa})`;
    ctx.beginPath(); ctx.arc(px, py, 1.2 + attract, 0, Math.PI*2); ctx.fill();
  }

  // Light Sweep/Shimmer (Responsive to hover)
  const sweepX = (time * 0.15 % 1.5) * w - w * 0.25;
  const shimmer = ctx.createLinearGradient(sweepX, 0, sweepX + w*0.3, 0);
  shimmer.addColorStop(0, 'transparent');
  shimmer.addColorStop(0.5, mx > -500 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)');
  shimmer.addColorStop(1, 'transparent');
  ctx.fillStyle = shimmer;
  ctx.fillRect(0,0,w,h);

  // Premium Vignette (Shifts with cursor)
  const vx = w/2 + (mx > -500 ? (mx - w/2) * 0.1 : 0);
  const vy = h/2 + (my > -500 ? (my - h/2) * 0.1 : 0);
  const vig = ctx.createRadialGradient(vx, vy, w*0.4, vx, vy, w*1.0);
  vig.addColorStop(0, 'transparent'); vig.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = vig; ctx.fillRect(0,0,w,h);
}

function drawJudahLion(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/judah_lion.png', 'rgba(251, 191, 36, 1)');
}

function drawAddis(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/themes/addis_ababa.png', 'rgba(59, 130, 246, 1)');
}

function drawCentralEthiopia(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawAddis(ctx, w, h, time, mx, my);
}

// ─── Regional Flags (High Fidelity Image Based) ──────────────────────────────

function drawAfar(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_the_Afar_Region.svg', 'rgba(29, 78, 216, 1)');
}

function drawAmhara(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_the_Amhara_Region.svg', 'rgba(250, 204, 21, 1)');
}

function drawOromia(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_the_Oromia_Region.svg', 'rgba(220, 38, 38, 1)');
}

function drawSomali(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_the_Somali_Region_(1994-2008,_2018-).svg', 'rgba(22, 163, 74, 1)');
}

function drawTigray(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_the_Tigray_Region.svg', 'rgba(239, 51, 64, 1)');
}

function drawSidama(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_Sidama.svg', 'rgba(10, 61, 145, 1)');
}

function drawBenishangul(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_the_Benishangul-Gumuz_Region.svg', 'rgba(10, 10, 10, 1)');
}

function drawGambella(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_the_Gambella_Region.svg', 'rgba(29, 78, 216, 1)');
}

function drawHarari(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Harari_Flag.svg', 'rgba(22, 163, 74, 1)');
}

function drawSouthEthiopia(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_Southern_Ethiopia.png', 'rgba(10, 61, 145, 1)');
}

function drawSouthWestEthiopia(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawImageTheme(ctx, w, h, time, mx, my, '/flags/Flag_of_South_West_Ethiopia.svg', 'rgba(10, 61, 145, 1)');
}

// ─── Heritage Restoration ────────────────────────────────────────────────────────

function drawLalibela(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Warm stone + subtle cross glow
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0b0a09');
  bg.addColorStop(1, '#1c1917');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const pulse = 0.55 + 0.45 * Math.sin(time * 1.3);

  // Cross silhouette
  const crossW = Math.min(w, h) * 0.14;
  const crossH = Math.min(w, h) * 0.36;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(time * 0.35) * 0.02);
  ctx.shadowColor = `rgba(251, 191, 36, ${0.12 + pulse * 0.12})`;
  ctx.shadowBlur = 28 + pulse * 22;
  ctx.fillStyle = '#d6a65a';
  ctx.fillRect(-crossW / 2, -crossH / 2, crossW, crossH);
  ctx.fillRect(-crossH / 2, -crossW / 2, crossH, crossW);
  ctx.restore();

  // Floating dust
  for (let i = 0; i < 26; i++) {
    const x = (i * 97) % w;
    const y = (i * 53 + time * 18) % h;
    const a = 0.04 + 0.05 * (0.5 + 0.5 * Math.sin(time + i));
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMeskel(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Ember field + central flame
  ctx.fillStyle = '#240707';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const baseY = h * 0.72;
  const flicker = 0.85 + 0.15 * Math.sin(time * 9);

  // Flame gradient
  const g = ctx.createRadialGradient(cx, baseY, 10, cx, baseY, Math.min(w, h) * 0.55);
  g.addColorStop(0, `rgba(251, 191, 36, ${0.35 * flicker})`);
  g.addColorStop(0.35, `rgba(249, 115, 22, ${0.22 * flicker})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Ember sparks
  for (let i = 0; i < 40; i++) {
    const x = ((i * 83) % w) + Math.sin(time * 1.2 + i) * 12;
    const y = baseY - ((time * 55 + i * 28) % (h * 0.7));
    ctx.fillStyle = `rgba(251, 191, 36, ${0.03 + 0.08 * (0.5 + 0.5 * Math.sin(time * 2 + i))})`;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNajashi(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Emerald night + mosque silhouette
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#052e16');
  bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const float = Math.sin(time * 1.2) * 6;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  // Base
  ctx.fillRect(cx - w * 0.18, h * 0.58, w * 0.36, h * 0.26);
  // Dome
  ctx.beginPath();
  ctx.arc(cx, h * 0.58 + float, w * 0.12, Math.PI, 0);
  ctx.fill();
  // Minaret
  ctx.fillRect(cx + w * 0.22, h * 0.42, w * 0.05, h * 0.42);
  ctx.beginPath();
  ctx.arc(cx + w * 0.245, h * 0.42, w * 0.035, Math.PI, 0);
  ctx.fill();

  // Star glow
  const starPulse = 0.6 + 0.4 * Math.sin(time * 2.2);
  ctx.shadowColor = `rgba(34, 197, 94, ${0.25 + 0.2 * starPulse})`;
  ctx.shadowBlur = 18 + 10 * starPulse;
  drawStar(ctx, cx - w * 0.18, h * 0.22, 5, 18, 8, `rgba(255, 255, 255, ${0.75})`);
  ctx.shadowBlur = 0;
}

function drawHarar(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Harar wall / gate vibe
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0f766e');
  bg.addColorStop(1, '#1e293b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Brick pattern
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  const bw = 38;
  const bh = 18;
  const offset = (Math.sin(time * 0.6) * 8);
  for (let y = 0; y < h + bh; y += bh) {
    for (let x = -bw; x < w + bh; x += bw) {
      const ox = (Math.floor(y / bh) % 2) * (bw / 2) + offset;
      ctx.fillRect(x + ox, y, bw - 2, bh - 2);
    }
  }
  ctx.globalAlpha = 1;

  // Gate arch
  const cx = w / 2;
  const archW = Math.min(w, h) * 0.55;
  const archH = Math.min(w, h) * 0.7;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.moveTo(cx - archW / 2, h * 0.92);
  ctx.lineTo(cx - archW / 2, h * 0.92 - archH * 0.55);
  ctx.quadraticCurveTo(cx, h * 0.92 - archH, cx + archW / 2, h * 0.92 - archH * 0.55);
  ctx.lineTo(cx + archW / 2, h * 0.92);
  ctx.closePath();
  ctx.fill();
}

function drawLantern(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Indigo night + lantern glow
  ctx.fillStyle = '#0b1027';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h * 0.42 + Math.sin(time * 1.1) * 6;
  const r = Math.min(w, h) * 0.12;
  const pulse = 0.6 + 0.4 * Math.sin(time * 2.6);

  // Glow
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.65);
  g.addColorStop(0, `rgba(251, 191, 36, ${0.22 + pulse * 0.12})`);
  g.addColorStop(0.45, `rgba(245, 158, 11, ${0.12 + pulse * 0.06})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Lantern body
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(cx - r * 0.9, cy - r * 1.1, r * 1.8, r * 2.2);

  // Stars
  for (let i = 0; i < 30; i++) {
    const x = (i * 97) % w;
    const y = (i * 41 + time * 6) % h;
    const a = 0.03 + 0.06 * (0.5 + 0.5 * Math.sin(time + i));
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, 2, 2);
  }
}



// ─── 33. New Heritage Collections (Premium) ────────────────────────────────

function drawAxumStela(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Cosmic night background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#020617'); bgGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, w, h);
  
  // Distant stars
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + 0.3 * Math.sin(time + i)})`;
    ctx.beginPath(); ctx.arc((i * 77) % w, (i * 123) % h, 1, 0, Math.PI*2); ctx.fill();
  }
  
  // Stela Silhouette (The Great Stele)
  const pulse = 0.8 + 0.2 * Math.sin(time * 0.5);
  ctx.save(); ctx.translate(w/2, h);
  
  // Main body
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.moveTo(-45, 0); ctx.lineTo(-40, -h * 0.85);
  ctx.quadraticCurveTo(0, -h * 0.95, 40, -h * 0.85); ctx.lineTo(45, 0);
  ctx.fill();
  
  // Glowing markings (Ge'ez symbols)
  ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 20 * pulse;
  ctx.fillStyle = `rgba(96, 165, 250, ${0.1 + 0.2 * pulse})`;
  const markers = 10;
  for (let i = 0; i < markers; i++) {
    const y = -h * 0.1 - (i * (h * 0.07));
    ctx.fillRect(-15, y, 30, 2);
    ctx.beginPath(); ctx.arc(0, y - 5, 3, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawDebreDamo(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Morning Mist / Highland Blue
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#171717'); skyGrad.addColorStop(1, '#404040');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, w, h);
  
  // Distant peaks
  ctx.fillStyle = '#262626';
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w*0.3, h*0.6); ctx.lineTo(w*0.6, h); ctx.fill();
  
  // Main Cliff (Amba)
  ctx.fillStyle = '#0c0c0c';
  ctx.beginPath();
  ctx.moveTo(w * 0.4, h); ctx.lineTo(w * 0.45, h * 0.3);
  ctx.lineTo(w * 0.85, h * 0.3); ctx.lineTo(w * 0.9, h);
  ctx.fill();
  
  // The Rope (Life line)
  const swing = Math.sin(time * 1.2) * 5;
  ctx.strokeStyle = '#525252'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.3);
  ctx.quadraticCurveTo(w * 0.5 + swing, h * 0.5, w * 0.5, h * 0.7);
  ctx.stroke();
  
  // Morning Mist particles
  for (let i = 0; i < 20; i++) {
    const drift = time * 20 + i * 50;
    ctx.fillStyle = `rgba(255, 255, 255, 0.03)`;
    ctx.beginPath(); ctx.arc((drift % (w + 200)) - 100, h * 0.7 + Math.sin(time + i) * 20, 40, 0, Math.PI*2); ctx.fill();
  }
}

function drawDireDawa(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Sunset over the railway city
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#fb923c'); skyGrad.addColorStop(0.5, '#db2777'); skyGrad.addColorStop(1, '#4c0519');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, w, h);
  
  // Minaret silhouette
  ctx.save(); ctx.translate(w * 0.5, h);
  ctx.fillStyle = '#1a0d11';
  // Base
  ctx.fillRect(-30, -h * 0.4, 60, h * 0.4);
  // Balcony
  ctx.fillRect(-40, -h * 0.4, 80, 10);
  // Tower
  ctx.fillRect(-15, -h * 0.65, 30, h * 0.25);
  // Dome
  ctx.beginPath(); ctx.arc(0, -h * 0.65, 20, Math.PI, 0); ctx.fill();
  // Spire
  ctx.fillRect(-2, -h * 0.75, 4, h * 0.1);
  ctx.restore();
  
  // Animated "Prayer Beads" border
  const beadCount = 33;
  for (let i = 0; i < beadCount; i++) {
    const angle = (i / beadCount) * Math.PI * 2 + time * 0.2;
    const x = w/2 + Math.cos(angle) * (w * 0.45);
    const y = h/2 + Math.sin(angle) * (h * 0.35);
    const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i);
    ctx.fillStyle = `rgba(251, 191, 36, ${0.1 + pulse * 0.2})`;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
  }
}

function drawTeff(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Highland Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#0ea5e9'); skyGrad.addColorStop(1, '#bae6fd');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, w, h);
  
  // Distant blue mountains
  ctx.fillStyle = '#0369a1'; ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w*0.2, h*0.6); ctx.lineTo(w*0.4, h*0.7); ctx.lineTo(w*0.7, h*0.5); ctx.lineTo(w, h); ctx.fill();
  ctx.globalAlpha = 1;
  
  // Waving Teff (Physics-based stalks)
  const stalkCount = 100;
  for (let i = 0; i < stalkCount; i++) {
    const x = (w / stalkCount) * i;
    const hStalk = h * 0.3 + Math.sin(i * 0.5) * 20;
    const wave = Math.sin(time * 2 + i * 0.2) * 15;
    
    ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + wave * 0.5, h - hStalk * 0.5, x + wave, h - hStalk);
    ctx.stroke();
    
    // The grain head
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath(); ctx.ellipse(x + wave, h - hStalk, 4, 8, Math.PI/4 + wave*0.01, 0, Math.PI*2); ctx.fill();
  }
}

function drawDanakil(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Surreal Acid Colors
  const bgGrad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
  bgGrad.addColorStop(0, '#facc15'); bgGrad.addColorStop(0.7, '#65a30d'); bgGrad.addColorStop(1, '#1a2e05');
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, w, h);
  
  // Heat distortion bubbles
  for (let i = 0; i < 40; i++) {
    const pX = (i * 137) % w;
    const pY = (i * 91 + time * 50) % (h + 100) - 50;
    const size = Math.max(0.1, 10 + 20 * Math.sin(time + i));
    
    ctx.beginPath(); ctx.arc(pX, pY, size, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
    ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
    ctx.stroke();
  }
  
  // Sulfur crystalline patterns
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.1)';
  for (let i = 0; i < 10; i++) {
    const r = 50 + i * 40 + Math.sin(time * 0.5) * 20;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.2) {
      const x = w/2 + Math.cos(a) * r;
      const y = h/2 + Math.sin(a) * r;
      ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  }
}

function drawOmo(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Body paint / Tribal Pattern
  ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, w, h);
  const size = 120;
  const t = time * 0.8;
  for (let x = 0; x < w + size; x += size) {
    for (let y = 0; y < h + size; y += size) {
        ctx.save(); ctx.translate(x, y);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.globalAlpha = 0.3;
        const shift = Math.sin(t + (x+y)*0.01) * 30;
        ctx.beginPath(); ctx.arc(shift, 0, 40, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = '#ef4444'; ctx.globalAlpha = 0.2;
        if ((Math.floor(x/size) + Math.floor(y/size)) % 5 === 0) {
            ctx.beginPath(); ctx.rect(-20 + shift, -20, 40, 40); ctx.fill();
        }
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.arc(-30 + i*20 + shift, 50, 3, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }
  }
}


// ─── Faith / Orthodox / Religion Themes ─────────────────────────────────────

function drawMaryamIcon(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  const src = '/faith/maryam.png';
  if (!imgCache[src]) {
    const img = new Image();
    img.src = src;
    img.onload = () => { imgCache[src] = img; };
    return;
  }
  const img = imgCache[src];

  // Subtle slow zoom animation
  const zoom = 1.05 + 0.05 * Math.sin(time * 0.2);
  
  // Interactive parallax
  const px = mx > -500 ? (mx - w/2) / (w/2) * -15 : 0;
  const py = my > -500 ? (my - h/2) / (h/2) * -12 : 0;

  // Background cover logic
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const nw = img.width * scale;
  const nh = img.height * scale;
  const ox = (w - nw) / 2 + px;
  const oy = (h - nh) / 2 + py;

  ctx.save();
  // Divine background glow
  const bgGrad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
  bgGrad.addColorStop(0, '#1e1b4b'); bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, w, h);

  // Draw background image
  ctx.globalAlpha = 0.85;
  ctx.drawImage(img, ox, oy, nw, nh);
  ctx.globalAlpha = 1;

  // Heavenly rays overlay
  ctx.translate(w/2 + px * 0.5, h/2 + py * 0.5);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + time * 0.1;
    const grad = ctx.createLinearGradient(0, 0, Math.cos(angle) * w, Math.sin(angle) * h);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.08)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, w, angle - 0.2, angle + 0.2);
    ctx.fill();
  }
  ctx.restore();

  // Floating dust/light motes
  for (let i = 0; i < 20; i++) {
    const tx = (i * 137 + time * 20) % w;
    const ty = (i * 211 + time * 15) % h;
    const ta = 0.1 + 0.2 * Math.abs(Math.sin(time + i));
    ctx.fillStyle = `rgba(251, 191, 36, ${ta})`;
    ctx.beginPath(); ctx.arc(tx, ty, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  drawClubText(ctx, w/2, h*0.88, 'ማርያም አማላጅ ናት', Math.min(w,h)*0.08, 'rgba(250,204,21,1)');
}

function drawEthCross(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Deep indigo / night sky
  const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.8);
  bg.addColorStop(0, '#1e1b4b'); bg.addColorStop(1, '#0f0a1a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  // Rotating halo of gold particles
  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI * 2 + time * 0.3;
    const r = Math.min(w, h) * 0.36 + Math.sin(time * 2 + i) * 5;
    const x = w/2 + Math.cos(angle) * r;
    const y = h/2 + Math.sin(angle) * r;
    const a = 0.3 + 0.5 * Math.abs(Math.sin(time + i * 0.3));
    ctx.fillStyle = `rgba(251,191,36,${a})`;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Radiant glow behind cross
  const glowSize = Math.min(w, h) * 0.35 + Math.sin(time) * 10;
  const glow = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, glowSize);
  glow.addColorStop(0, 'rgba(251,191,36,0.25)'); glow.addColorStop(1, 'rgba(251,191,36,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);

  // Ethiopian Orthodox Cross (Lalibela-style)
  ctx.save(); ctx.translate(w/2, h/2);
  const pulse = 1 + 0.04 * Math.sin(time * 1.5);
  ctx.scale(pulse, pulse);
  const cw = Math.min(w, h) * 0.14;
  const ch = Math.min(w, h) * 0.38;
  // Shadow
  ctx.shadowColor = 'rgba(251,191,36,0.7)'; ctx.shadowBlur = 30;
  // Vertical bar
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-cw * 0.3, -ch * 0.5, cw * 0.6, ch);
  // Horizontal bar
  ctx.fillRect(-cw * 0.5, -ch * 0.12, cw, ch * 0.25);
  // Crown/loops at top (decorative)
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(i * cw * 0.5, -ch * 0.5 - cw * 0.15, cw * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bottom root
  ctx.fillRect(-cw * 0.2, ch * 0.4, cw * 0.4, cw * 0.4);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Stars in the background
  for (let i = 0; i < 30; i++) {
    const sx = ((i * 137) % w), sy = ((i * 211) % h);
    const sa = 0.2 + 0.6 * Math.abs(Math.sin(time * 0.5 + i));
    ctx.fillStyle = `rgba(255,255,255,${sa})`;
    ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawTimkat(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Blue water + white sky — Ethiopian Epiphany (Timkat)
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, '#bae6fd'); sky.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.5);

  const water = ctx.createLinearGradient(0, h * 0.5, 0, h);
  water.addColorStop(0, '#0369a1'); water.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = water; ctx.fillRect(0, h * 0.5, w, h * 0.5);

  // Water shimmer
  for (let i = 0; i < 20; i++) {
    const wx = (i / 20) * w;
    const wy = h * 0.5 + Math.sin(time * 2 + i) * 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wx - 20, wy); ctx.lineTo(wx + 20, wy); ctx.stroke();
  }

  // Floating candles on water
  for (let i = 0; i < 7; i++) {
    const cx = (w * 0.1) + i * (w * 0.12) + Math.sin(time + i) * 10;
    const cy = h * 0.62 + Math.cos(time * 0.7 + i) * 8;
    // Candle body
    ctx.fillStyle = '#fef3c7'; ctx.fillRect(cx - 6, cy - 20, 12, 24);
    // Flame
    const flicker = Math.sin(time * 8 + i) * 3;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.ellipse(cx + flicker * 0.3, cy - 26, 5, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(cx + flicker * 0.2, cy - 27, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Glow
    const cGlow = ctx.createRadialGradient(cx, cy - 26, 0, cx, cy - 26, 20);
    cGlow.addColorStop(0, 'rgba(251,191,36,0.25)'); cGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = cGlow; ctx.fillRect(cx - 25, cy - 50, 50, 50);
  }

  // Cross in the sky
  const cx = w/2, cy = h * 0.22;
  ctx.save(); ctx.translate(cx, cy);
  const scale = 0.8 + 0.1 * Math.sin(time * 0.8);
  ctx.scale(scale, scale);
  ctx.shadowColor = 'rgba(251,191,36,0.7)'; ctx.shadowBlur = 20;
  ctx.fillStyle = '#b45309';
  ctx.fillRect(-5, -30, 10, 60); ctx.fillRect(-20, -5, 40, 10);
  ctx.restore();
}

function drawEidCelebration(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Midnight teal sky
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#042f2e'); bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  // Crescent moon
  const moonX = w * 0.75, moonY = h * 0.18;
  ctx.fillStyle = '#fde68a';
  ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(moonX, moonY, 35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#042f2e';
  ctx.beginPath(); ctx.arc(moonX + 18, moonY - 10, 28, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Star inside crescent
  ctx.fillStyle = '#fde68a';
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI/2;
    const sr = 8, lr = 18;
    const sx = moonX + 50 + Math.cos(angle) * lr;
    const sy = moonY - 5 + Math.sin(angle) * lr;
    const ia = angle + Math.PI / 5;
    const sx2 = moonX + 50 + Math.cos(ia) * sr;
    const sy2 = moonY - 5 + Math.sin(ia) * sr;
    if (i === 0) ctx.beginPath();
    ctx.lineTo(sx, sy); ctx.lineTo(sx2, sy2);
  }
  ctx.closePath(); ctx.fill();

  // Hanging lanterns
  const lanternCount = 6;
  for (let i = 0; i < lanternCount; i++) {
    const lx = (w / (lanternCount + 1)) * (i + 1);
    const sway = Math.sin(time * 0.8 + i) * 12;
    const ly = h * 0.2 + Math.sin(time * 0.5 + i * 0.7) * 15;
    // Rope
    ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx + sway, ly - 25); ctx.stroke();
    // Lantern body
    ctx.save(); ctx.translate(lx + sway, ly);
    const hue = (i * 60 + time * 20) % 360;
    ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
    ctx.shadowColor = `hsl(${hue}, 90%, 55%)`; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,200,0.6)';
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Stars
  for (let i = 0; i < 40; i++) {
    const sx = (i * 97 + 23) % w, sy = (i * 137) % (h * 0.5);
    const a = 0.3 + 0.5 * Math.abs(Math.sin(time + i));
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI * 2); ctx.fill();
  }
}

function drawGena(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Ethiopian Christmas (Gena) — Holy fire / golden incense
  const bg = ctx.createRadialGradient(w/2, h * 0.4, 0, w/2, h/2, w * 0.7);
  bg.addColorStop(0, '#451a03'); bg.addColorStop(0.5, '#1c0a00'); bg.addColorStop(1, '#0c0500');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  // Incense smoke wisps
  for (let i = 0; i < 5; i++) {
    const ix = w * 0.2 + i * w * 0.15;
    const iy = h;
    const wiggle = Math.sin(time * 1.2 + i * 1.5) * 20;
    ctx.strokeStyle = `rgba(255,255,200,${0.04 + 0.03 * i})`;
    ctx.lineWidth = 10 - i;
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.bezierCurveTo(ix + wiggle, iy - h * 0.3, ix - wiggle, iy - h * 0.6, ix + wiggle * 0.5, iy - h * 0.9);
    ctx.stroke();
  }

  // Flame cluster (campfire style) center
  const flames = [[-15, 0, 18, '#ef4444'], [0, -10, 22, '#f97316'], [15, 5, 16, '#ef4444'],
                  [0, -15, 14, '#fbbf24'], [0, -25, 8, '#fef08a']];
  ctx.save(); ctx.translate(w/2, h * 0.65);
  for (const [fx, fy, fh, fc] of flames) {
    const f = fx as number, fyr = fy as number, fhr = fh as number, color = fc as string;
    const flicker = Math.sin(time * 7 + f) * 4;
    ctx.fillStyle = color;
    ctx.shadowColor = '#f97316'; ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.ellipse(f + flicker * 0.3, fyr - flicker, fhr * 0.4, fhr * 0.7, flicker * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Cross silhouette
  ctx.save(); ctx.translate(w/2, h * 0.28);
  ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 25;
  ctx.fillStyle = '#fbbf24';
  const scale = 0.8 + 0.08 * Math.sin(time);
  ctx.scale(scale, scale);
  ctx.fillRect(-6, -40, 12, 80); ctx.fillRect(-25, -10, 50, 12);
  ctx.restore();

  // Flying ember sparks
  for (let i = 0; i < 30; i++) {
    const t = (time * 0.5 + i * 0.13) % 1;
    const ex = w/2 + Math.sin(i * 2.5) * 60 - 30 + (Math.random() - 0.5) * 20;
    const ey = h * 0.65 - t * h * 0.6;
    const ea = 1 - t;
    ctx.fillStyle = `rgba(251,191,36,${ea * 0.9})`;
    ctx.beginPath(); ctx.arc(ex, ey, 2 * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
  }
}

function drawSabbath(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Warm Jewish Sabbath candle ambiance
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1a0a00'); bg.addColorStop(1, '#0d0500');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  // Two candles
  const candles = [w * 0.35, w * 0.65];
  for (const cx of candles) {
    const cy = h * 0.65;
    const flicker = Math.sin(time * 6 + cx) * 3;

    // Candle body
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(cx - 10, cy - 60, 20, 80);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(cx - 10, cy - 60, 20, 8);

    // Flame
    const fGlow = ctx.createRadialGradient(cx + flicker * 0.2, cy - 75, 0, cx, cy - 65, 35);
    fGlow.addColorStop(0, 'rgba(255,255,200,0.5)'); fGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = fGlow; ctx.fillRect(cx - 40, cy - 110, 80, 80);

    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.ellipse(cx + flicker * 0.3, cy - 78, 7, 16, flicker * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.ellipse(cx + flicker * 0.1, cy - 80, 3, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Star of David in the center (glowing gold)
  const sx = w/2, sy = h * 0.35;
  ctx.save(); ctx.translate(sx, sy);
  const starPulse = 1 + 0.06 * Math.sin(time * 1.5);
  ctx.scale(starPulse, starPulse);
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
  ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 15;
  const r = 30;
  for (let spin = 0; spin < 2; spin++) {
    ctx.beginPath();
    for (let v = 0; v < 3; v++) {
      const a = ((v / 3) * Math.PI * 2) - Math.PI/2 + spin * Math.PI/3;
      if (v === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.stroke();
  }
  ctx.restore();

  // Floating motes
  for (let i = 0; i < 20; i++) {
    const mx = (i * 71) % w;
    const my = h - ((time * 25 + i * 60) % h);
    ctx.fillStyle = `rgba(251,191,36,${0.05 + 0.1 * Math.abs(Math.sin(time + i))})`;
    ctx.beginPath(); ctx.arc(mx, my, 2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawAngelCloud(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Heavenly cloud theme for Orthodox theotokos (Maryam) concept — painted golden hour
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1a103a'); bg.addColorStop(0.5, '#2d1b69'); bg.addColorStop(1, '#0f0a1a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  // Drifting cloud puffs
  for (let i = 0; i < 8; i++) {
    const drift = (time * 18 + i * 110) % (w + 200) - 100;
    const cy = h * (0.1 + (i % 3) * 0.2) + Math.sin(time * 0.3 + i) * 15;
    const opa = 0.05 + 0.08 * Math.abs(Math.sin(time * 0.2 + i));
    ctx.fillStyle = `rgba(167,139,250,${opa})`;
    ctx.beginPath(); ctx.arc(drift, cy, 60, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(drift + 40, cy + 15, 45, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(drift - 35, cy + 10, 50, 0, Math.PI * 2); ctx.fill();
  }

  // Central divine glow
  const parallaxX = (mx / w - 0.5) * 20;
  const parallaxY = (my / h - 0.5) * 20;
  const radGlow = ctx.createRadialGradient(w/2 + parallaxX, h/2 + parallaxY, 0, w/2, h/2, Math.min(w,h) * 0.45);
  radGlow.addColorStop(0, `rgba(251,191,36,${0.18 + 0.05 * Math.sin(time)})`);
  radGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = radGlow; ctx.fillRect(0, 0, w, h);

  // Rotating golden rays
  ctx.save(); ctx.translate(w/2 + parallaxX, h/2 + parallaxY);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + time * 0.15;
    const len = Math.min(w, h) * 0.35 + Math.sin(time + i) * 15;
    ctx.strokeStyle = `rgba(251,191,36,${0.05 + 0.04 * Math.abs(Math.sin(time * 0.5 + i))})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len); ctx.stroke();
  }
  ctx.restore();

  // Twinkling stars
  for (let i = 0; i < 35; i++) {
    const tx = (i * 137 + 11) % w;
    const ty = (i * 211 + 7) % h;
    const ta = 0.2 + 0.6 * Math.abs(Math.sin(time * 0.8 + i));
    ctx.fillStyle = `rgba(255,255,255,${ta})`;
    ctx.beginPath(); ctx.arc(tx, ty, 1.3, 0, Math.PI * 2); ctx.fill();
  }
}

// ─── Football Club Crest Helper ──────────────────────────────────────────────
function drawShield(ctx: CanvasRenderingContext2D, cx: number, cy: number, sw: number, sh: number, topColor: string, bottomColor: string) {
  const x = cx - sw / 2, y = cy - sh / 2;
  ctx.beginPath();
  ctx.moveTo(x + sw * 0.15, y);
  ctx.lineTo(x + sw * 0.85, y);
  ctx.lineTo(x + sw, y + sh * 0.35);
  ctx.quadraticCurveTo(x + sw, y + sh * 0.75, cx, y + sh);
  ctx.quadraticCurveTo(x, y + sh * 0.75, x, y + sh * 0.35);
  ctx.lineTo(x + sw * 0.15, y);
  ctx.closePath();
  // Gradient fill
  const grad = ctx.createLinearGradient(cx, y, cx, y + sh);
  grad.addColorStop(0, topColor); grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
}

function drawClubText(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, size: number, color: string) {
  ctx.save();
  ctx.font = `900 ${size}px 'Arial Black', Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function drawCrestCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, border: string) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = border; ctx.lineWidth = 4; ctx.stroke();
}

function drawGlowBurst(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, time: number) {
  ctx.save();
  const layers = 3;
  for (let i = 0; i < layers; i++) {
    const pulse = 0.5 + 0.5 * Math.sin(time * (1 + i * 0.5));
    const size = r * (1.2 + i * 0.4 + pulse * 0.2);
    const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, size);
    grad.addColorStop(0, color.replace('1)', `${0.15 / (i + 1)})`));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
  }
  ctx.restore();
}

function drawEnergyRings(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, time: number) {
  ctx.save();
  for (let i = 0; i < 2; i++) {
    const ringT = (time * 0.8 + i * 0.5) % 1;
    const ringR = r * (0.8 + ringT * 0.6);
    const alpha = (1 - ringT) * 0.3;
    ctx.strokeStyle = color.replace('1)', `${alpha})`);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnergyParticles(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, time: number) {
  ctx.save();
  const particleCount = 12;
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + time * 0.5;
    const dist = r * (0.9 + 0.3 * Math.sin(time * 2 + i));
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const size = 1.5 + Math.sin(time * 3 + i);
    
    ctx.fillStyle = color.replace('1)', '0.6)');
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Tiny trail
    ctx.strokeStyle = color.replace('1)', '0.2)');
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx + Math.cos(angle) * (dist - 15), cy + Math.sin(angle) * (dist - 15));
    ctx.stroke();
  }
  ctx.restore();
}

function drawCrestTheme(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, src: string, clubColor: string, glowColor: string, text: string) {
  if (!imgCache[src]) {
    const img = new Image();
    img.src = src;
    img.onload = () => { imgCache[src] = img; };
    return;
  }
  const img = imgCache[src];
  
  // Background Gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, clubColor);
  bg.addColorStop(0.5, clubColor); // Deeper primary color area
  bg.addColorStop(1, '#000');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

  // Subtle Vignette
  const vignette = ctx.createRadialGradient(w/2, h/2, Math.min(w,h) * 0.2, w/2, h/2, Math.max(w,h) * 0.8);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);

  const cx = w/2, cy = h*0.42;
  const baseR = Math.min(w, h) * 0.3;

  // Interactive Aura Glow
  const pulse = 1 + Math.sin(time * 2.5) * 0.04;
  drawGlowBurst(ctx, cx, cy, baseR * 0.8, glowColor, time);
  
  // Fun Animations: Rings and Particles
  drawEnergyRings(ctx, cx, cy, baseR, glowColor, time);
  drawEnergyParticles(ctx, cx, cy, baseR, glowColor, time);

  if (mx > -500) {
    const spot = ctx.createRadialGradient(mx, my, 0, mx, my, w * 0.4);
    spot.addColorStop(0, glowColor.replace('1)', '0.12)'));
    spot.addColorStop(1, 'transparent');
    ctx.fillStyle = spot; ctx.fillRect(0, 0, w, h);
  }

  // Interactive Parallax for Crest
  const px = mx > -500 ? (mx - w/2) / (w/2) * -10 : 0;
  const py = my > -500 ? (my - h/2) / (h/2) * -8 : 0;

  // Render crest – strip near-white background via off-screen canvas
  const cw = Math.min(w, h) * 0.6;
  const ratio = Math.min(cw / img.width, cw / img.height);
  const nw = Math.round(img.width * ratio * pulse);
  const nh = Math.round(img.height * ratio * pulse);

  // Build (and cache) a white-free version of the image
  const cacheKey = `${src}_clean`;
  const anyCache = imgCache as Record<string, unknown>;
  if (!anyCache[cacheKey] && nw > 0 && nh > 0) {
    const off = document.createElement('canvas');
    off.width = nw; off.height = nh;
    const offCtx = off.getContext('2d');
    if (offCtx) {
      offCtx.drawImage(img, 0, 0, nw, nh);
      const imgData = offCtx.getImageData(0, 0, nw, nh);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (r > 238 && g > 238 && b > 238) {
          d[i + 3] = 0; // fully transparent
        } else if (r > 215 && g > 215 && b > 215) {
          const brightness = (r + g + b) / 3;
          d[i + 3] = Math.round(((255 - brightness) / 40) * 255);
        }
      }
      offCtx.putImageData(imgData, 0, 0);
      anyCache[cacheKey] = off;
    }
  }
  const cleanCanvas = anyCache[cacheKey] as HTMLCanvasElement | undefined;

  ctx.save();
  ctx.translate(cx + px, cy + py);
  ctx.rotate(Math.sin(time * 0.6) * 0.015);
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 22;
  if (cleanCanvas) {
    ctx.drawImage(cleanCanvas, -nw/2, -nh/2, nw, nh);
  } else {
    ctx.drawImage(img, -nw/2, -nh/2, nw, nh);
  }
  
  // Interactive Gloss/Shine over crest
  if (mx > -500) {
    const dx = mx - (cx + px);
    const dy = my - (cy + py);
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < nw/2) {
      const shine = ctx.createRadialGradient(dx, dy, 0, dx, dy, nw*0.5);
      shine.addColorStop(0, 'rgba(255,255,255,0.2)');
      shine.addColorStop(1, 'transparent');
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = shine;
      ctx.beginPath(); ctx.arc(0, 0, nw/2, 0, Math.PI*2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.restore();

  // Floating Dust
  for(let i=0; i<15; i++) {
    const x = (i * 137 + time * 15) % w;
    const y = (i * 91 + time * 10) % h;
    const a = 0.05 + 0.05 * Math.sin(time + i);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI*2); ctx.fill();
  }
  // User requested to remove the team text (outside logo)
  // drawClubText(ctx, cx, h*0.85, text, Math.min(w,h)*0.07, glowColor);
}

// ─── Ethiopian Clubs ────────────────────────────────────────────────────────

function drawFbStGeorge(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Saint George FC.webp', '#7f1d1d', 'rgba(234, 179, 8, 1)', 'St. George');
}

function drawFbCoffee(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Ethiopian_Coffee_S.C.svg', '#1c0a01', 'rgba(251, 191, 36, 1)', 'Coffee');
}

function drawFbMekelle(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Mekelle 70 Enderta.webp', '#dc2626', 'rgba(251, 191, 36, 1)', 'Mekelle 70');
}

function drawFbDiredawa(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Dire Dawa City SC.webp', '#1d4ed8', 'rgba(251, 146, 60, 1)', 'Dire Dawa City');
}

function drawFbArbaMinch(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Arba Minch City FC.webp', '#15803d', 'rgba(255, 255, 255, 1)', 'Arba Minch');
}

function drawFbElectric(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Ethiopian Electric Power Corporation FC.webp', '#1e3a8a', 'rgba(250, 204, 21, 1)', 'Electric');
}

function drawFbInsurance(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Ethiopian Insurance Corporation SC.webp', '#b91c1c', 'rgba(255, 255, 255, 1)', 'Insurance');
}

function drawFbShire(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Suhul Shire FC.webp', '#991b1b', 'rgba(29, 78, 216, 1)', 'Suhul Shire');
}

function drawFbWelwalo(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Welwalo Adigrat University FC.webp', '#1e3a8a', 'rgba(251, 191, 36, 1)', 'Welwalo');
}

function drawFbWoldia(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Use a fallback or generic crest if image missing, but try to use what's likely
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Defence SC.webp', '#1e3a8a', 'rgba(255, 255, 255, 1)', 'Woldia SC');
}

function drawFbMekelakeya(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Defence SC.webp', '#064e3b', 'rgba(251, 191, 36, 1)', 'Mekelakeya');
}

function drawFbHawassa(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Hawassa City SC.webp', '#0c4a6e', 'rgba(56, 189, 248, 1)', 'Hawassa City');
}

function drawFbBahirDar(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Bahir Dar Kenema FC.webp', '#1d4ed8', 'rgba(251, 191, 36, 1)', 'Bahir Dar');
}

function drawFbFasil(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Fasil Kenema FC.webp', '#991b1b', 'rgba(255, 255, 255, 1)', 'Fasil Kenema');
}

function drawFbAdama(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Adama City FC.webp', '#0c4a6e', 'rgba(255, 255, 255, 1)', 'Adama City');
}

function drawFbSidama(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Sidaama Bunna FC.webp', '#b91c1c', 'rgba(5, 150, 105, 1)', 'Sidama Coffee');
}

function drawFbWolaita(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Wolaitta Dicha SC.webp', '#f59e0b', 'rgba(0,0,0,1)', 'Wolaita Dicha');
}

function drawFbCBE(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Ethiopia Nigd Bank SA.webp', '#2563eb', 'rgba(255, 255, 255, 1)', 'Nigd Bank');
}

function drawFbHadiya(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Hadiya Hossana FC.webp', '#1e40af', 'rgba(96, 165, 250, 1)', 'Hadiya Hossana');
}

function drawFbNegeleArsi(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/Ethiopian/Negele Arsii Town FC.webp', '#991b1b', 'rgba(250, 204, 21, 1)', 'Negele Arsi');
}

// ─── European Clubs ─────────────────────────────────────────────────────────

function drawFbRealMadrid(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/real-madrid-footballlogos-org.png', '#0f172a', 'rgba(253, 224, 71, 1)', 'Real Madrid');
}

function drawFbBarcelona(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/fc-barcelona-footballlogos-org.png', '#172554', 'rgba(250,204,21,1)', 'FC Barcelona');
}

function drawFbManUtd(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/manchester-united-footballlogos-org.png', '#7f1d1d', 'rgba(245,158,11,1)', 'Man United');
}

function drawFbArsenal(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/arsenal-footballlogos-org.png', '#7f1d1d', 'rgba(220,38,38,1)', 'Arsenal FC');
}

function drawFbManCity(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/manchester-city-footballlogos-org.png', '#0c4a6e', 'rgba(56,189,248,1)', 'Man City');
}

function drawFbChelsea(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/chelsea-footballlogos-org.png', '#1e3a8a', 'rgba(250,204,21,1)', 'Chelsea FC');
}

function drawFbLiverpool(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/liverpool-fc-footballlogos-org.png', '#7f1d1d', 'rgba(13,148,136,1)', 'Liverpool FC');
}

function drawFbPSG(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/paris-saint-germain-footballlogos-org.png', '#172554', 'rgba(220,38,38,1)', 'Paris SG');
}

function drawFbBayern(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/bayern-munich-footballlogos-org.png', '#7f1d1d', 'rgba(255,255,255,1)', 'Bayern Munich');
}

function drawFbDortmund(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/borussia-dortmund-footballlogos-org.png', '#422006', 'rgba(234,179,8,1)', 'Borussia Dortmund');
}

function drawFbJuventus(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/juventus-footballlogos-org.png', '#18181b', 'rgba(255,255,255,1)', 'Juventus');
}

function drawFbInter(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/inter-milan-footballlogos-org.png', '#1e3a8a', 'rgba(251,191,36,1)', 'Inter Milan');
}

function drawFbACMilan(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/European/ac-milan-footballlogos-org.png', '#7f1d1d', 'rgba(255,255,255,1)', 'AC Milan');
}

// ─── Religious & Cultural Themes ────────────────────────────────────────────

const imgCache: Record<string, HTMLImageElement> = {};

function drawMaryamIcon(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
   // Use the provided Maryam image with a spiritual aura
   drawCrestTheme(ctx, w, h, time, mx, my, '/faith/maryam.png', '#0f172a', 'rgba(251, 191, 36, 1)', 'Holy Maryam');
   
   // Add divine light rays
   ctx.save();
   ctx.translate(w/2, h*0.42);
   const rayCount = 8;
   for (let i = 0; i < rayCount; i++) {
     const angle = (i / rayCount) * Math.PI * 2 + time * 0.2;
     const length = Math.min(w, h) * 0.8;
     const grad = ctx.createLinearGradient(0, 0, Math.cos(angle) * length, Math.sin(angle) * length);
     grad.addColorStop(0, 'rgba(255, 255, 200, 0.2)');
     grad.addColorStop(1, 'transparent');
     ctx.strokeStyle = grad;
     ctx.lineWidth = 15;
     ctx.beginPath();
     ctx.moveTo(0, 0);
     ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
     ctx.stroke();
   }
   ctx.restore();
}

function drawLalibela(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/faith/lalibela.png', '#422006', 'rgba(245, 158, 11, 1)', 'Lalibela');
}

function drawMeskel(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural Meskel fire theme
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#450a0a'); bg.addColorStop(1, '#000');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  drawFire(ctx, w, h, time, mx, my, {});
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌼 Meskel 🌼', w/2, h * 0.8);
}

function drawNajashi(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/faith/najashi.png', '#064e3b', 'rgba(52, 211, 153, 1)', 'Al-Najashi');
}

function drawHarar(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/culture/harar.png', '#1e3a8a', 'rgba(251, 191, 36, 1)', 'Harar Jegol');
}

function drawLantern(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural glowing lanterns
  const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
  bg.addColorStop(0, '#020617'); bg.addColorStop(1, '#000');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  for(let i=0; i<8; i++) {
    const tx = (i * 150 + time * 30) % w;
    const ty = h * 0.3 + Math.sin(time + i) * 40;
    drawGlowBurst(ctx, tx, ty, 30, 'rgba(251, 191, 36, 1)', time);
  }
}

function drawAxumStela(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/culture/axum.png', '#1e293b', 'rgba(148, 163, 184, 1)', 'Axum Stela');
}

function drawDebreDamo(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/faith/damo.png', '#451a03', 'rgba(251, 191, 36, 1)', 'Debre Damo');
}

function drawDireDawa(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/culture/diredawa.png', '#0c4a6e', 'rgba(56, 189, 248, 1)', 'Dire Dawa');
}

function drawTeff(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Golden teff field
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#78350f'); bg.addColorStop(1, '#1c1917');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  for(let i=0; i<50; i++) {
    const x = (i * 17) % w;
    const bh = 40 + Math.sin(time + i) * 20;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + Math.sin(time) * 10, h - bh); ctx.stroke();
  }
}

function drawDanakil(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/culture/danakil.png', '#7c2d12', 'rgba(234, 179, 8, 1)', 'Danakil');
}

function drawOmo(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/culture/omo.png', '#1e3a8a', 'rgba(147, 197, 253, 1)', 'Omo Valley');
}

function drawEthCross(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/faith/cross.png', '#431407', 'rgba(251, 191, 36, 1)', 'Holy Cross');
}

function drawTimkat(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/faith/timkat.png', '#1e3a8a', 'rgba(253, 224, 71, 1)', 'Timkat');
}

function drawGena(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/faith/gena.png', '#064e3b', 'rgba(220, 38, 38, 1)', 'Gena');
}

function drawEidCelebration(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/faith/eid.png', '#14532d', 'rgba(253, 224, 71, 1)', 'Eid Mubarak');
}

function drawSabbath(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Peaceful purple theme
  const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
  bg.addColorStop(0, '#1e1b4b'); bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  drawStardust(ctx, w, h, time, mx, my, {});
}

function drawAngelCloud(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Heavenly clouds
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#e0f2fe'); bg.addColorStop(1, '#7dd3fc');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  for(let i=0; i<5; i++) {
    const x = (i * 200 + time * 20) % (w + 200) - 100;
    const y = h * 0.2 + i * 50;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI * 2); ctx.fill();
  }
}



const THEME_ANIMATIONS: Record<string, AnimationFn> = {
  aurora_live: drawAurora, lava_live: drawLava, ocean_live: drawOcean,
  neon_pulse_live: drawNeonPulse, sunset_live: drawSunset, matrix_live: drawMatrix,
  rainbow_live: drawRainbow, fire_live: drawFire, galaxy_live: drawGalaxy,
  waterfall_live: drawWaterfall, autumn_live: drawAutumn, cyberpunk_live: drawCyberpunk,
  snowfall_live: drawSnowfall, bubbles_live: drawBubbles, plasma_live: drawPlasma,
  deep_sea_live: drawDeepSea, crystal_live: drawCrystal, storm_live: drawStorm,
  cherry_blossom_live: drawCherryBlossom, stardust_live: drawStardust, vortex_live: drawVortex,
  northern_lights_live: drawNorthernLights, fireflies_live: drawFireflies,
  binary_rain_live: drawBinaryRain, geometric_flow_live: drawGeometricFlow,
  nebula_live: drawNebula, ocean_waves_live: drawOceanWaves, lava_lamp_live: drawLavaLamp,
  circuit_board_live: drawCircuitBoard, eth_flag_live: drawEthFlag, adey_live: drawAdey,
  coffee_live: drawCoffee, lion_live: drawJudahLion, reg_addis_live: drawCentralEthiopia,
  reg_afar_live: drawAfar, reg_amhara_live: drawAmhara, reg_benishangul_live: drawBenishangul,
  reg_gambella_live: drawGambella, reg_harari_live: drawHarari, reg_oromia_live: drawOromia,
  judah_lion: drawJudahLion, adey: drawAdey, coffee: drawCoffee, lion: drawJudahLion, 
  eth_flag: drawEthFlag, reg_addis: drawCentralEthiopia, reg_afar: drawAfar, 
  reg_amhara: drawAmhara, reg_benishangul: drawBenishangul, 
  reg_gambella: drawGambella, reg_harari: drawHarari, reg_oromia: drawOromia,
  reg_sidama: drawSidama, reg_somali: drawSomali, reg_tigray: drawTigray,
  reg_south: drawSouthEthiopia, reg_sw_eth: drawSouthWestEthiopia,
  ortho_lalibela: drawLalibela, ortho_meskel: drawMeskel, islam_najashi: drawNajashi,
  islam_harar: drawHarar, islam_lantern: drawLantern, ortho_axum: drawAxumStela,
  ortho_damo: drawDebreDamo, islam_dawa: drawDireDawa, cult_teff: drawTeff,
  cult_danakil: drawDanakil, cult_omo: drawOmo,
  // Faith / Orthodox / Religion themes
  ortho_maryam: drawMaryamIcon, ortho_cross: drawEthCross, ortho_timkat: drawTimkat,
  faith_gena: drawGena, faith_eid: drawEidCelebration, faith_sabbath: drawSabbath,
  ortho_angel: drawAngelCloud,
  fb_stgeorge: drawFbStGeorge, fb_coffee: drawFbCoffee, fb_mekelle: drawFbMekelle, 
  fb_diredawa: drawFbDiredawa, fb_arbaminch: drawFbArbaMinch, fb_electric: drawFbElectric,
  fb_insurance: drawFbInsurance, fb_shire: drawFbShire, fb_welwalo: drawFbWelwalo,
  fb_woldia: drawFbWoldia, fb_mekelakeya: drawFbMekelakeya, fb_hawassa: drawFbHawassa, 
  fb_bahirdar: drawFbBahirDar, fb_fasil: drawFbFasil, fb_adama: drawFbAdama,
  fb_sidama: drawFbSidama, fb_wolaita: drawFbWolaita, fb_cbe: drawFbCBE, 
  fb_hadiya: drawFbHadiya, fb_negele_arsi: drawFbNegeleArsi,
  fb_realmadrid: drawFbRealMadrid, fb_barca: drawFbBarcelona,
  fb_manutd: drawFbManUtd, fb_arsenal: drawFbArsenal, fb_mancity: drawFbManCity, 
  fb_chelsea: drawFbChelsea, fb_liverpool: drawFbLiverpool, fb_psg: drawFbPSG,
  fb_bayern: drawFbBayern, fb_dortmund: drawFbDortmund, fb_juventus: drawFbJuventus, 
  fb_inter: drawFbInter, fb_milan: drawFbACMilan, fb_spurs: drawFbSpurs,
  // Animation specific aliases
  fb_stgeorge_live: drawFbStGeorge, fb_coffee_live: drawFbCoffee,
  fb_negele_arsi_live: drawFbNegeleArsi,
  neon_pulse: drawNeonPulse, fireflies: drawFireflies, binary_rain: drawBinaryRain,
  geometric_flow: drawGeometricFlow, nebula: drawNebula, ocean_waves: drawOceanWaves,
  lava_lamp: drawLavaLamp, circuit_board: drawCircuitBoard,
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function LiveWallpaper({ theme, className = '' }: LiveWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const stateRef = useRef<AnimState>({});
  const themeRef = useRef(theme);

  // Reset state when theme changes
  useEffect(() => {
    if (themeRef.current !== theme) {
      themeRef.current = theme;
      stateRef.current = {};
    }
  }, [theme]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (touch) {
      mouseRef.current = {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height),
      };
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animFn = THEME_ANIMATIONS[theme];
    if (!animFn) return;

    let running = true;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      // Reset state on resize
      stateRef.current = {};
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      if (!running) return;

      const time = (now - startTime) / 1000;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.save();
      animFn(ctx, w, h, time, mouseRef.current.x / dpr, mouseRef.current.y / dpr, stateRef.current);
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      aria-hidden="true"
    />
  );
}

export { LiveWallpaper };
