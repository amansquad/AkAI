'use client';

import React, { useEffect, useRef, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface LiveWallpaperProps {
  theme: string;
  className?: string;
  /** Paint one representative frame and stop — for thumbnails and grids,
   * where dozens of live rAF loops running at once would tank the page. */
  static?: boolean;
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

// ─── Theme → animation resolution ──────────────────────────────────────────
//
// Animations live in three lazily-imported modules (scenic particle
// animations, football crests, flag/cultural icons) instead of one 4.7k-line
// file, so picking a football theme never pulls in the scenic particle code
// and vice versa. THEME_ANIMATION_REFS only records which module + export
// name a theme needs; resolveAnimationFn() dynamically imports that module
// on first use and caches the resolved function.

type AnimationGroup = 'scenic' | 'football' | 'flags';

type AnimationModule = Record<string, AnimationFn>;

const GROUP_LOADERS: Record<AnimationGroup, () => Promise<AnimationModule>> = {
  scenic: () => import('./animations/scenic') as unknown as Promise<AnimationModule>,
  football: () => import('./animations/football-crests') as unknown as Promise<AnimationModule>,
  flags: () => import('./animations/flags-and-icons') as unknown as Promise<AnimationModule>,
};

const THEME_ANIMATION_REFS: Record<string, [AnimationGroup, string]> = {
  prism_live: ['scenic', 'drawPrism'],
  aurora_live: ['scenic', 'drawAurora'],
  lava_live: ['scenic', 'drawLava'],
  ocean_live: ['scenic', 'drawOcean'],
  neon_pulse_live: ['scenic', 'drawNeonPulse'],
  sunset_live: ['scenic', 'drawSunset'],
  matrix_live: ['scenic', 'drawMatrix'],
  rainbow_live: ['scenic', 'drawRainbow'],
  fire_live: ['scenic', 'drawFire'],
  galaxy_live: ['scenic', 'drawGalaxy'],
  waterfall_live: ['scenic', 'drawWaterfall'],
  autumn_live: ['scenic', 'drawAutumn'],
  cyberpunk_live: ['scenic', 'drawCyberpunk'],
  snowfall_live: ['scenic', 'drawSnowfall'],
  bubbles_live: ['scenic', 'drawBubbles'],
  plasma_live: ['scenic', 'drawPlasma'],
  deep_sea_live: ['scenic', 'drawDeepSea'],
  crystal_live: ['scenic', 'drawCrystal'],
  storm_live: ['scenic', 'drawStorm'],
  cherry_blossom_live: ['scenic', 'drawCherryBlossom'],
  stardust_live: ['scenic', 'drawStardust'],
  vortex_live: ['scenic', 'drawVortex'],
  northern_lights_live: ['scenic', 'drawNorthernLights'],
  fireflies_live: ['scenic', 'drawFireflies'],
  binary_rain_live: ['scenic', 'drawBinaryRain'],
  geometric_flow_live: ['scenic', 'drawGeometricFlow'],
  nebula_live: ['scenic', 'drawNebula'],
  ocean_waves_live: ['scenic', 'drawOceanWaves'],
  lava_lamp_live: ['scenic', 'drawLavaLamp'],
  circuit_board_live: ['scenic', 'drawCircuitBoard'],
  eth_flag_live: ['flags', 'drawEthFlag'],
  adey_live: ['flags', 'drawAdey'],
  coffee_live: ['flags', 'drawCoffee'],
  lion_live: ['flags', 'drawJudahLion'],
  reg_addis_live: ['flags', 'drawCentralEthiopia'],
  reg_afar_live: ['flags', 'drawAfar'],
  reg_amhara_live: ['flags', 'drawAmhara'],
  reg_benishangul_live: ['flags', 'drawBenishangul'],
  reg_gambella_live: ['flags', 'drawGambella'],
  reg_harari_live: ['flags', 'drawHarari'],
  reg_oromia_live: ['flags', 'drawOromia'],
  judah_lion: ['flags', 'drawJudahLion'],
  adey: ['flags', 'drawAdey'],
  coffee: ['flags', 'drawCoffee'],
  lion: ['flags', 'drawJudahLion'],
  eth_flag: ['flags', 'drawEthFlag'],
  reg_addis: ['flags', 'drawCentralEthiopia'],
  reg_afar: ['flags', 'drawAfar'],
  reg_amhara: ['flags', 'drawAmhara'],
  reg_benishangul: ['flags', 'drawBenishangul'],
  reg_gambella: ['flags', 'drawGambella'],
  reg_harari: ['flags', 'drawHarari'],
  reg_oromia: ['flags', 'drawOromia'],
  reg_sidama: ['flags', 'drawSidama'],
  reg_somali: ['flags', 'drawSomali'],
  reg_tigray: ['flags', 'drawTigray'],
  reg_south: ['flags', 'drawSouthEthiopia'],
  reg_sw_eth: ['flags', 'drawSouthWestEthiopia'],
  ortho_lalibela: ['flags', 'drawLalibela'],
  ortho_meskel: ['scenic', 'drawMeskel'],
  islam_najashi: ['flags', 'drawNajashi'],
  islam_harar: ['flags', 'drawHarar'],
  islam_lantern: ['flags', 'drawLantern'],
  ortho_axum: ['flags', 'drawAxumStela'],
  ortho_damo: ['flags', 'drawDebreDamo'],
  islam_dawa: ['flags', 'drawDireDawa'],
  cult_teff: ['flags', 'drawTeff'],
  cult_danakil: ['flags', 'drawDanakil'],
  cult_omo: ['flags', 'drawOmo'],
  ortho_maryam: ['flags', 'drawMaryamIcon'],
  ortho_cross: ['flags', 'drawEthCross'],
  ortho_timkat: ['flags', 'drawTimkat'],
  faith_gena: ['flags', 'drawGena'],
  faith_eid: ['flags', 'drawEidCelebration'],
  faith_sabbath: ['scenic', 'drawSabbath'],
  ortho_angel: ['flags', 'drawAngelCloud'],
  fb_stgeorge: ['football', 'drawFbStGeorge'],
  fb_coffee: ['football', 'drawFbCoffee'],
  fb_mekelle: ['football', 'drawFbMekelle'],
  fb_diredawa: ['football', 'drawFbDiredawa'],
  fb_arbaminch: ['football', 'drawFbArbaMinch'],
  fb_electric: ['football', 'drawFbElectric'],
  fb_insurance: ['football', 'drawFbInsurance'],
  fb_shire: ['football', 'drawFbShire'],
  fb_welwalo: ['football', 'drawFbWelwalo'],
  fb_woldia: ['football', 'drawFbWoldia'],
  fb_mekelakeya: ['football', 'drawFbMekelakeya'],
  fb_hawassa: ['football', 'drawFbHawassa'],
  fb_bahirdar: ['football', 'drawFbBahirDar'],
  fb_fasil: ['football', 'drawFbFasil'],
  fb_adama: ['football', 'drawFbAdama'],
  fb_sidama: ['football', 'drawFbSidama'],
  fb_wolaita: ['football', 'drawFbWolaita'],
  fb_cbe: ['football', 'drawFbCBE'],
  fb_hadiya: ['football', 'drawFbHadiya'],
  fb_negele_arsi: ['football', 'drawFbNegeleArsi'],
  fb_realmadrid: ['football', 'drawFbRealMadrid'],
  fb_barca: ['football', 'drawFbBarcelona'],
  fb_manutd: ['football', 'drawFbManUtd'],
  fb_arsenal: ['football', 'drawFbArsenal'],
  fb_mancity: ['football', 'drawFbManCity'],
  fb_chelsea: ['football', 'drawFbChelsea'],
  fb_liverpool: ['football', 'drawFbLiverpool'],
  fb_psg: ['football', 'drawFbPSG'],
  fb_bayern: ['football', 'drawFbBayern'],
  fb_dortmund: ['football', 'drawFbDortmund'],
  fb_juventus: ['football', 'drawFbJuventus'],
  fb_inter: ['football', 'drawFbInter'],
  fb_milan: ['football', 'drawFbACMilan'],
  fb_spurs: ['football', 'drawFbSpurs'],
  fb_monaco: ['football', 'drawFbMonaco'],
  fb_leipzig: ['football', 'drawFbLeipzig'],
  fb_stgeorge_live: ['football', 'drawFbStGeorge'],
  fb_coffee_live: ['football', 'drawFbCoffee'],
  fb_negele_arsi_live: ['football', 'drawFbNegeleArsi'],
  neon_pulse: ['scenic', 'drawNeonPulse'],
  fireflies: ['scenic', 'drawFireflies'],
  binary_rain: ['scenic', 'drawBinaryRain'],
  geometric_flow: ['scenic', 'drawGeometricFlow'],
  nebula: ['scenic', 'drawNebula'],
  ocean_waves: ['scenic', 'drawOceanWaves'],
  lava_lamp: ['scenic', 'drawLavaLamp'],
  circuit_board: ['scenic', 'drawCircuitBoard'],
  starfield_live: ['scenic', 'drawStarfield'],
  meteor_live: ['scenic', 'drawMeteorShower'],
  fireworks_live: ['scenic', 'drawFireworks'],
  bokeh_live: ['scenic', 'drawBokeh'],
  ripples_live: ['scenic', 'drawRipples'],
  glitch_live: ['scenic', 'drawGlitch'],
  starfield: ['scenic', 'drawStarfield'],
  meteor_shower: ['scenic', 'drawMeteorShower'],
  fireworks: ['scenic', 'drawFireworks'],
  bokeh: ['scenic', 'drawBokeh'],
  city_lights: ['scenic', 'drawBokeh'],
  ripples: ['scenic', 'drawRipples'],
  zen_pond: ['scenic', 'drawRipples'],
  glitch: ['scenic', 'drawGlitch'],
};

const resolvedAnimationCache: Record<string, AnimationFn> = {};

async function resolveAnimationFn(theme: string): Promise<AnimationFn | undefined> {
  const cached = resolvedAnimationCache[theme];
  if (cached) return cached;

  const ref = THEME_ANIMATION_REFS[theme];
  if (!ref) return undefined;

  const [group, exportName] = ref;
  const mod = await GROUP_LOADERS[group]();
  const fn = mod[exportName];
  if (fn) resolvedAnimationCache[theme] = fn;
  return fn;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function LiveWallpaper({ theme, className = '', static: staticFrame = false }: LiveWallpaperProps) {
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

    let running = true;
    let resizeObserver: ResizeObserver | null = null;

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

    resolveAnimationFn(theme).then((animFn) => {
      if (!running || !animFn) return;

      resizeCanvas();
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      if (canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement);
      }

      if (staticFrame) {
        // One representative mid-animation frame, no rAF loop.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.save();
        animFn(ctx, w, h, 3.5, -1000, -1000, stateRef.current);
        ctx.restore();
        return;
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
    });

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver?.disconnect();
    };
  }, [theme, staticFrame]);

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
