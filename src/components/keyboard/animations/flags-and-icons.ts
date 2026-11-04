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
  drawCrestTheme(ctx, w, h, time, mx, my, '/teams/faith/lalibela.png', '#422006', 'rgba(245, 158, 11, 1)', 'Lalibela');
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

export {
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
