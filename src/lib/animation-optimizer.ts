/**
 * Animation Performance Utilities
 *
 * Optimizes canvas animations and CSS animations for better performance,
 * battery life, and reduced motion support
 */

// Detect user preferences and device capabilities
export const getAnimationSettings = () => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isLowEndDevice =
    typeof navigator !== 'undefined' &&
    navigator.hardwareConcurrency ? navigator.hardwareConcurrency < 4 : false;

  const isMobile =
    typeof navigator !== 'undefined' &&
    /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);

  return {
    prefersReducedMotion,
    isLowEndDevice,
    isMobile,
    // Recommended settings
    targetFPS: prefersReducedMotion ? 0 : isLowEndDevice ? 30 : isMobile ? 30 : 60,
    particleCount: prefersReducedMotion ? 0 : isLowEndDevice ? 50 : isMobile ? 80 : 200,
    enableBlur: !isLowEndDevice && !isMobile,
    enableShadows: !isLowEndDevice,
  };
};

// Throttle animation frame rate
export class AnimationThrottler {
  private lastTime = 0;
  private frameInterval: number;

  constructor(fps: number) {
    this.frameInterval = 1000 / fps;
  }

  shouldRender(currentTime: number): boolean {
    if (currentTime - this.lastTime >= this.frameInterval) {
      this.lastTime = currentTime;
      return true;
    }
    return false;
  }
}

// Visibility-based animation pausing
export class VisibilityManager {
  private isVisible = true;
  private observers: Set<() => void> = new Set();

  constructor(element: HTMLElement) {
    // Intersection Observer for viewport visibility
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting;
        this.notifyObservers();
      },
      { threshold: 0.1 }
    );

    intersectionObserver.observe(element);

    // Page Visibility API for tab visibility
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
        this.notifyObservers();
      });
    }
  }

  onVisibilityChange(callback: () => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers() {
    this.observers.forEach(callback => callback());
  }

  get visible(): boolean {
    return this.isVisible;
  }
}

// Battery-aware animations
export class BatteryManager {
  private isLowBattery = false;
  private batteryLevel = 1;

  constructor() {
    this.initBatteryAPI();
  }

  private async initBatteryAPI() {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        this.batteryLevel = battery.level;
        this.isLowBattery = battery.level < 0.2;

        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.isLowBattery = battery.level < 0.2;
        });
      } catch (error) {
        console.log('Battery API not available');
      }
    }
  }

  shouldReduceAnimations(): boolean {
    return this.isLowBattery;
  }

  getBatteryLevel(): number {
    return this.batteryLevel;
  }
}

// Optimized RAF loop with automatic pause
export class OptimizedAnimationLoop {
  private rafId: number | null = null;
  private isRunning = false;
  private throttler: AnimationThrottler;
  private visibilityManager: VisibilityManager;
  private callback: (time: number) => void;

  constructor(
    element: HTMLElement,
    callback: (time: number) => void,
    fps: number = 60
  ) {
    this.callback = callback;
    this.throttler = new AnimationThrottler(fps);
    this.visibilityManager = new VisibilityManager(element);

    // Auto-pause when not visible
    this.visibilityManager.onVisibilityChange(() => {
      if (this.visibilityManager.visible) {
        this.start();
      } else {
        this.pause();
      }
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop(performance.now());
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  stop() {
    this.pause();
  }

  private loop(time: number) {
    if (!this.isRunning) return;

    if (this.throttler.shouldRender(time)) {
      this.callback(time);
    }

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }
}

// Canvas optimization utilities
export const optimizeCanvas = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d', {
    alpha: true,
    desynchronized: true, // Better performance on some browsers
    willReadFrequently: false,
  });

  // Enable hardware acceleration hints
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low'; // Faster than 'high'
  }

  return ctx;
};

// Particle pool for better memory management
export class ParticlePool<T> {
  private pool: T[] = [];
  private activeParticles: Set<T> = new Set();
  private factory: () => T;

  constructor(factory: () => T, initialSize: number = 100) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    let particle = this.pool.pop();
    if (!particle) {
      particle = this.factory();
    }
    this.activeParticles.add(particle);
    return particle;
  }

  release(particle: T) {
    this.activeParticles.delete(particle);
    this.pool.push(particle);
  }

  clear() {
    this.activeParticles.clear();
    this.pool = [];
  }

  get activeCount(): number {
    return this.activeParticles.size;
  }
}

/**
 * Usage Example:
 *
 * import { OptimizedAnimationLoop, getAnimationSettings, BatteryManager } from '@/lib/animation-optimizer';
 *
 * const settings = getAnimationSettings();
 * const battery = new BatteryManager();
 *
 * if (settings.prefersReducedMotion) {
 *   // Don't start animations
 * } else {
 *   const loop = new OptimizedAnimationLoop(
 *     canvasElement,
 *     (time) => {
 *       // Animation logic
 *       if (battery.shouldReduceAnimations()) {
 *         // Use fewer particles, simpler effects
 *       }
 *     },
 *     settings.targetFPS
 *   );
 *   loop.start();
 * }
 */
