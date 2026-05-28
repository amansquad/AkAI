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
  for (const vein of veins) {
    ctx.beginPath();
    const pts = vein.points as { x: number; y: number; ox: number; oy: number }[];
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const wobbleX = Math.sin(time * 0.5 + i) * 10;
      const wobbleY = Math.cos(time * 0.3 + i * 0.7) * 8;
      ctx.lineTo(pts[i].x + wobbleX, pts[i].y + wobbleY);
    }
    ctx.strokeStyle = hsl(vein.hue as number, 100, 55, 0.3 + 0.15 * Math.sin(time * 2 + (vein.hue as number)));
    ctx.lineWidth = 2 + Math.sin(time * 3) * 1;
    ctx.shadowColor = hsl(vein.hue as number, 100, 60, 0.8);
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

// ─── 4. Neon Pulse ─────────────────────────────────────────────────────────

function drawNeonPulse(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, state: AnimState) {
  if (!state.init) {
    state.init = true;
    state.sparks = Array.from({ length: 150 }, () =>
      makeParticle({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-2, 2), vy: rand(-2, 2),
        size: rand(1, 3), maxLife: rand(1, 4), life: rand(0, 1),
        hue: rand(270, 340), sat: 100, light: rand(60, 90),
      })
    );
    state.shapes = Array.from({ length: 5 }, () => ({
      x: rand(w * 0.2, w * 0.8), y: rand(h * 0.2, h * 0.8),
      r: rand(20, 50), rot: rand(0, Math.PI * 2),
      speed: rand(0.005, 0.02), sides: Math.floor(rand(3, 7)),
      hue: rand(270, 330),
    }));
  }
  const sparks = state.sparks as Particle[];
  const shapes = state.shapes as { x: number; y: number; r: number; rot: number; speed: number; sides: number; hue: number }[];

  // Background
  ctx.fillStyle = '#0a0010';
  ctx.fillRect(0, 0, w, h);

  // Grid
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
    if (d < 100) {
      const a = (1 - d / 100) * 0.3 * pulse;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h);
      ctx.strokeStyle = `rgba(255,0,200,${a})`; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }
  for (let y = 0; y < h; y += gridSize) {
    const d = Math.abs(y - my);
    if (d < 100) {
      const a = (1 - d / 100) * 0.3 * pulse;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y);
      ctx.strokeStyle = `rgba(0,255,255,${a})`; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  // Geometric shapes
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
    ctx.strokeStyle = hsl(s.hue, 100, 60, 0.5 + 0.2 * Math.sin(time * 3));
    ctx.lineWidth = 2;
    ctx.shadowColor = hsl(s.hue, 100, 60, 0.8);
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Sparks
  for (const p of sparks) {
    // Attract toward mouse
    const dx = mx - p.x;
    const dy = my - p.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (d < 150) {
      p.vx += (dx / d) * 0.3;
      p.vy += (dy / d) * 0.3;
    }
    p.vx *= 0.98; p.vy *= 0.98;
    p.x += p.vx; p.y += p.vy;
    p.life -= 0.005;

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

// ─── Theme Animation Map ────────────────────────────────────────────────────

const THEME_ANIMATIONS: Record<string, AnimationFn> = {
  aurora_live: drawAurora,
  lava_live: drawLava,
  ocean_live: drawOcean,
  neon_pulse_live: drawNeonPulse,
  sunset_live: drawSunset,
  matrix_live: drawMatrix,
  rainbow_live: drawRainbow,
  fire_live: drawFire,
  galaxy_live: drawGalaxy,
  waterfall_live: drawWaterfall,
  autumn_live: drawAutumn,
  cyberpunk_live: drawCyberpunk,
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
