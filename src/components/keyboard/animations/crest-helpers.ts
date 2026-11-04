// Shared image cache and rendering engine for the team-crest and
// flag/icon theme families — split out of live-wallpaper.tsx so neither
// scenic particle animations nor team crests load code they don't use.

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

export { drawImageTheme, drawGlowBurst, drawEnergyRings, drawEnergyParticles, drawCrestTheme };
