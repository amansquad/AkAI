// Bundles the pictures behind the themes whose animation name is a picture
// path (the region flags, Addis Ababa, the Judah lion...). The Flutter app
// downloads these from the website; the native keyboard ships them, so they
// work offline. SVG flags are rasterised here, since Android cannot draw SVG.
//
// Run from the repo root:  node native_keyboard/tools/gen-backdrops.mjs
// Output: native_keyboard/app/src/main/assets/backdrops/<name>.webp
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const themes = fs.readFileSync('native_keyboard/app/src/main/java/com/akai/nativekb/ThemeData.kt', 'utf8');
const outDir = 'native_keyboard/app/src/main/assets/backdrops';
fs.mkdirSync(outDir, { recursive: true });

// Must match Backdrops.assetName() in the app.
const assetName = (live) => live.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();

const lives = [...new Set([...themes.matchAll(/PaletteDef\("[^"]*", "[^"]*", "[^"]*", "[a-z]*", "(\/[^"]+)"/g)].map(m => m[1]))];
let total = 0;
for (const live of lives) {
  const src = ['png', 'webp', 'jpg', 'svg'].map(e => `public${live}.${e}`).find(f => fs.existsSync(f));
  if (!src) { console.warn(`no picture for ${live}`); continue; }
  const out = path.join(outDir, assetName(live) + '.webp');
  // Wide enough for a phone keyboard; SVGs are rendered at a density that gives that width.
  const input = src.endsWith('.svg') ? sharp(src, { density: 300 }) : sharp(src);
  await input.resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: !src.endsWith('.svg') })
    .flatten({ background: '#000000' })
    .webp({ quality: 78 })
    .toFile(out);
  const size = fs.statSync(out).size;
  total += size;
  console.log(`${live} <- ${src}: ${Math.round(size / 1024)} KB`);
}
console.log(`${lives.length} pictures, ${Math.round(total / 1024)} KB in all`);
