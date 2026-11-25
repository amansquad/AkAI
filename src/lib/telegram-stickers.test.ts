import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { convert, tgsFrames } from './telegram-stickers';

/** A one-second .tgs at 60 fps: a red square sliding from left to right on a clear background. */
function slidingSquare(): Buffer {
  const lottie = {
    v: '5.5.2', fr: 60, ip: 0, op: 60, w: 512, h: 512, ddd: 0, assets: [],
    layers: [{
      ddd: 0, ind: 1, ty: 4, nm: 'square', sr: 1, ip: 0, op: 60, st: 0, bm: 0,
      ks: {
        o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] },
        p: { a: 1, k: [{ t: 0, s: [100, 256, 0], i: { x: 1, y: 1 }, o: { x: 0, y: 0 } }, { t: 59, s: [412, 256, 0] }] },
      },
      shapes: [{
        ty: 'gr', nm: 'g',
        it: [
          { ty: 'rc', d: 1, s: { a: 0, k: [120, 120] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 } },
          { ty: 'fl', c: { a: 0, k: [1, 0, 0, 1] }, o: { a: 0, k: 100 }, r: 1 },
          { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
        ],
      }],
    }],
  };
  return gzipSync(JSON.stringify(lottie));
}

const SIZE = 512;
/** RGBA of pixel (x, y) in frame [f]. */
const pixel = (rgba: Buffer, f: number, x: number, y: number) => {
  const i = f * SIZE * SIZE * 4 + (y * SIZE + x) * 4;
  return [...rgba.subarray(i, i + 4)];
};

describe('tgsFrames', () => {
  it('draws a .tgs at 12 frames a second, moving and on a clear background', async () => {
    const out = await tgsFrames(slidingSquare());
    expect(out).not.toBeNull();
    expect(out!.count).toBe(12);
    expect(out!.rgba.length).toBe(12 * SIZE * SIZE * 4);
    // The square starts on the left and ends on the right; the corner stays clear.
    const red = (p: number[]) => p[0] > 200 && p[1] < 50 && p[2] < 50 && p[3] > 200;
    expect(red(pixel(out!.rgba, 0, 100, 256))).toBe(true);
    expect(red(pixel(out!.rgba, 11, 100, 256))).toBe(false);
    expect(red(pixel(out!.rgba, 11, 390, 256))).toBe(true);
    expect(pixel(out!.rgba, 0, 5, 5)[3]).toBe(0);
  });

  it('draws only the first frame for a still', async () => {
    expect((await tgsFrames(slidingSquare(), true))!.count).toBe(1);
  });

  it('gives null for something that is not a .tgs', async () => {
    expect(await tgsFrames(Buffer.from('not gzip'))).toBeNull();
    expect(await tgsFrames(gzipSync('{"no": "animation"}'))).toBeNull();
  });
});

describe('convert', () => {
  it('turns a .tgs into an animated WebP and a GIF', async () => {
    const webp = await convert(slidingSquare(), 'anim', 'tgs');
    expect(webp?.subarray(0, 4).toString()).toBe('RIFF');
    expect(webp?.includes(Buffer.from('ANIM'))).toBe(true);
    const gif = await convert(slidingSquare(), 'gif', 'tgs');
    expect(gif?.subarray(0, 6).toString()).toBe('GIF89a');
  }, 30_000);
});
