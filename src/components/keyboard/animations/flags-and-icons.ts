import { drawImageTheme, drawGlowBurst, drawCrestTheme } from './crest-helpers';

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
  // Procedural rock-hewn cross church, carved into stone under a starlit sky
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1c1310'); bg.addColorStop(1, '#4a2f1a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const sx = (i * 173 + w) % w, sy = (i * 97) % (h * 0.55);
    ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.35 * Math.abs(Math.sin(time + i))})`;
    ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.translate(w / 2, h * 0.62);
  const cs = Math.min(w, h) * 0.45;
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(-cs * 0.12, -cs * 0.5, cs * 0.24, cs);
  ctx.fillRect(-cs * 0.5, -cs * 0.12, cs, cs * 0.24);
  ctx.strokeStyle = `rgba(217,119,6,${0.4 + 0.15 * Math.sin(time * 0.8)})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(-cs * 0.12, -cs * 0.5, cs * 0.24, cs);
  ctx.strokeRect(-cs * 0.5, -cs * 0.12, cs, cs * 0.24);
  ctx.restore();
}

function drawNajashi(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural mosque silhouette — dome, minaret, crescent — at dusk
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#022c22'); bg.addColorStop(1, '#064e3b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h * 0.68);
  const r = Math.min(w, h) * 0.22;
  ctx.fillStyle = '#065f46';
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.fill();
  ctx.fillRect(-r, 0, r * 2, r * 0.6);
  ctx.fillRect(r * 1.3, -r * 0.9, r * 0.22, r * 1.5);
  ctx.beginPath(); ctx.arc(r * 1.41, -r * 0.95, r * 0.15, Math.PI, 0); ctx.fill();
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.6);
  ctx.strokeStyle = `rgba(52, 211, 153, ${0.3 + pulse * 0.3})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(r * 1.41, -r * 1.25, r * 0.1, 0.3, Math.PI * 1.7); ctx.stroke();
  ctx.restore();
}

function drawHarar(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural Harar Jegol — colorful walled-city houses
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1e3a8a'); bg.addColorStop(1, '#78350f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const colors = ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#f97316'];
  for (let i = 0; i < 10; i++) {
    const x = (i * (w / 10));
    const bh = h * (0.25 + 0.1 * Math.sin(i * 1.3));
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x, h - bh, w / 10 - 4, bh);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + (w / 10) * 0.3, h - bh * 0.6, (w / 10) * 0.2, bh * 0.25);
  }
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
  // Procedural obelisks silhouetted against a dusk sky
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1e293b'); bg.addColorStop(1, '#334155');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const glow = 0.5 + 0.5 * Math.sin(time * 0.5);
  ctx.fillStyle = `rgba(148, 163, 184, ${0.15 + glow * 0.1})`;
  ctx.beginPath(); ctx.ellipse(w / 2, h * 0.3, w * 0.4, h * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  [0.3, 0.5, 0.7].forEach((xr, i) => {
    const sh = h * (0.4 + i * 0.08);
    const sw = Math.min(w, h) * 0.06;
    ctx.fillStyle = '#475569';
    ctx.fillRect(w * xr - sw / 2, h - sh, sw, sh);
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(w * xr - sw / 2, h - sh);
    ctx.lineTo(w * xr, h - sh - sw * 0.8);
    ctx.lineTo(w * xr + sw / 2, h - sh);
    ctx.fill();
  });
}

function drawDebreDamo(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural clifftop monastery with a hanging rope
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#78350f'); bg.addColorStop(1, '#1c1917');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#44403c';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.55);
  ctx.lineTo(w * 0.55, h * 0.4);
  ctx.lineTo(w * 0.7, h * 0.55);
  ctx.lineTo(w, h * 0.5);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#92400e';
  ctx.fillRect(w * 0.6, h * 0.3, w * 0.12, h * 0.1);
  const sway = Math.sin(time * 1.2) * 4;
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.65, h * 0.4);
  ctx.quadraticCurveTo(w * 0.65 + sway, h * 0.5, w * 0.63, h * 0.62);
  ctx.stroke();
}

function drawDireDawa(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural desert city — camel caravan crossing dunes at sunset
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#9a3412'); bg.addColorStop(1, '#431407');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(234, 88, 12, 0.6)';
  ctx.beginPath(); ctx.arc(w * 0.75, h * 0.28, w * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#292524';
  for (let i = 0; i < 4; i++) {
    const x = ((i * 120 + time * 25) % (w + 160)) - 80;
    const y = h * 0.72;
    ctx.beginPath();
    ctx.ellipse(x, y, 18, 10, 0, 0, Math.PI * 2);
    ctx.moveTo(x - 6, y - 6); ctx.arc(x - 6, y - 14, 8, 0, Math.PI * 2);
    ctx.fill();
  }
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
  // Procedural salt flats cracked by volcanic heat
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#fef3c7'); bg.addColorStop(1, '#78350f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) {
    const x = (i * 97) % w, y = (i * 61) % h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 25 + Math.sin(i) * 10, y + 15);
    ctx.lineTo(x + 10, y + 30);
    ctx.stroke();
  }
  const glow = 0.5 + 0.5 * Math.sin(time);
  ctx.fillStyle = `rgba(234, 88, 12, ${0.15 + glow * 0.15})`;
  ctx.beginPath(); ctx.ellipse(w * 0.3, h * 0.85, w * 0.25, h * 0.08, 0, 0, Math.PI * 2); ctx.fill();
}

function drawOmo(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural tribal beadwork pattern beside the river
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1e3a8a'); bg.addColorStop(1, '#78350f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const colors = ['#ef4444', '#fbbf24', '#22c55e', '#f8fafc'];
  const rows = 6, cols = 10;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c / cols) * w + (r % 2 === 0 ? 0 : (w / cols) * 0.5);
      const y = h * 0.15 + r * (h * 0.1);
      const pulse = Math.sin(time + r + c) * 2;
      ctx.fillStyle = colors[(r + c) % colors.length];
      ctx.beginPath(); ctx.arc(x, y + pulse, 5, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawEthCross(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural ornate Ethiopian cross, gold on deep brown
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
  bg.addColorStop(0, '#431407'); bg.addColorStop(1, '#1c0a01');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.sin(time * 0.2) * 0.03);
  const r = Math.min(w, h) * 0.3;
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = r * 0.12;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.35); ctx.lineTo(r * 0.7, -r * 0.35); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * r * 0.75, Math.sin(angle) * r * 0.75, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24'; ctx.fill();
  }
  ctx.restore();
}

function drawTimkat(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural Timkat — water ripples under colorful ceremonial umbrellas
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0c4a6e'); bg.addColorStop(1, '#082f49');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 3; i++) {
    const t = (time * 0.4 + i * 0.5) % 1;
    const r = t * Math.min(w, h) * 0.4;
    ctx.strokeStyle = `rgba(253, 224, 71, ${(1 - t) * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w / 2, h * 0.65, r, 0, Math.PI * 2); ctx.stroke();
  }
  const colors = ['#ef4444', '#fbbf24', '#22c55e'];
  colors.forEach((c, i) => {
    const x = w * (0.3 + i * 0.2);
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x, h * 0.3, 22, Math.PI, 0); ctx.fill();
    ctx.fillRect(x - 2, h * 0.3, 4, 20);
  });
}

function drawGena(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural Gena (Ethiopian Christmas) — star and candlelight
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#064e3b'); bg.addColorStop(1, '#021810');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h * 0.3);
  const pulse = 0.7 + 0.3 * Math.sin(time * 1.5);
  ctx.fillStyle = `rgba(252, 211, 77, ${pulse})`;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const outer = Math.min(w, h) * 0.12, inner = outer * 0.4;
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.lineTo(Math.cos(angle + Math.PI / 5) * inner, Math.sin(angle + Math.PI / 5) * inner);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const x = w * (0.1 + i * 0.16);
    const flicker = 0.6 + 0.4 * Math.sin(time * 3 + i);
    ctx.fillStyle = `rgba(220, 38, 38, ${flicker})`;
    ctx.fillRect(x, h * 0.75, 4, 20);
    ctx.fillStyle = `rgba(251, 191, 36, ${flicker})`;
    ctx.beginPath(); ctx.arc(x + 2, h * 0.75 - 4, 4, 0, Math.PI * 2); ctx.fill();
  }
}

function drawEidCelebration(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Procedural Eid — crescent moon and festive lantern lights
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#14532d'); bg.addColorStop(1, '#052e16');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w * 0.7, h * 0.3);
  const r = Math.min(w, h) * 0.14;
  ctx.fillStyle = '#fde68a';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#14532d';
  ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.1, r * 0.85, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  for (let i = 0; i < 8; i++) {
    const tx = (i * 150 + time * 20) % w;
    const ty = h * 0.75 + Math.sin(time + i) * 10;
    const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i);
    ctx.fillStyle = `rgba(253, 224, 71, ${0.4 + pulse * 0.4})`;
    ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill();
  }
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

function drawEnkutatash(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Ethiopian New Year — golden Adey Abeba flowers under a bright new sun
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#fef9c3'); bg.addColorStop(1, '#166534');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const pulse = 0.8 + 0.2 * Math.sin(time * 0.8);
  ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
  ctx.beginPath(); ctx.arc(w * 0.5, h * 0.22, Math.min(w, h) * 0.1, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 14; i++) {
    const x = (i * 83 + Math.sin(time + i) * 8) % w;
    const y = h * (0.55 + (i % 3) * 0.12);
    ctx.fillStyle = '#facc15';
    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(x + Math.cos(angle) * 6, y + Math.sin(angle) * 6, 4, 2.5, angle, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawIrreecha(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Oromo thanksgiving festival — green fields by the river, golden grass
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#15803d'); bg.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w * 0.5, h);
  const bg2 = ctx.createLinearGradient(0, 0, 0, h);
  bg2.addColorStop(0, '#166534'); bg2.addColorStop(1, '#0369a1');
  ctx.fillStyle = bg2; ctx.fillRect(w * 0.5, 0, w * 0.5, h);
  for (let i = 0; i < 20; i++) {
    const x = (i * 53) % w;
    const sway = Math.sin(time * 1.5 + i) * 6;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + sway, h - 35); ctx.stroke();
  }
}

function drawFasika(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Fasika (Orthodox Easter) — candles and a glowing dawn
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#fda4af'); bg.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const pulse = 0.6 + 0.4 * Math.sin(time);
  ctx.fillStyle = `rgba(254, 240, 138, ${pulse})`;
  ctx.beginPath(); ctx.arc(w / 2, h * 0.75, Math.min(w, h) * 0.18, Math.PI, 0); ctx.fill();
  for (let i = 0; i < 7; i++) {
    const x = w * (0.08 + i * 0.13);
    const flicker = 0.5 + 0.5 * Math.sin(time * 3 + i);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x, h * 0.78, 3, 18);
    ctx.fillStyle = `rgba(251, 146, 60, ${flicker})`;
    ctx.beginPath(); ctx.arc(x + 1.5, h * 0.78 - 4, 3.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawAshenda(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number) {
  // Ashenda — Tigray girls' festival, colorful woven sistrum patterns
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#be185d'); bg.addColorStop(1, '#581c87');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const colors = ['#fbbf24', '#f8fafc', '#22c55e', '#ef4444'];
  for (let ring = 0; ring < 4; ring++) {
    const r = (ring + 1) * Math.min(w, h) * 0.08;
    const rot = time * 0.3 * (ring % 2 === 0 ? 1 : -1);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rot);
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      ctx.fillStyle = colors[(ring + i) % colors.length];
      ctx.beginPath(); ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

export {
  drawEnkutatash,
  drawIrreecha,
  drawFasika,
  drawAshenda,
  drawEthFlag,
  drawAdey,
  drawCoffee,
  drawJudahLion,
  drawAddis,
  drawCentralEthiopia,
  drawAfar,
  drawAmhara,
  drawOromia,
  drawSomali,
  drawTigray,
  drawSidama,
  drawBenishangul,
  drawGambella,
  drawHarari,
  drawSouthEthiopia,
  drawSouthWestEthiopia,
  drawMaryamIcon,
  drawLalibela,
  drawNajashi,
  drawHarar,
  drawLantern,
  drawAxumStela,
  drawDebreDamo,
  drawDireDawa,
  drawTeff,
  drawDanakil,
  drawOmo,
  drawEthCross,
  drawTimkat,
  drawGena,
  drawEidCelebration,
  drawAngelCloud,
};
