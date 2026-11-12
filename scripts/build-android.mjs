// Static export (output: "export", used for the Capacitor/Android bundle)
// can only include Route Handlers that export GET with no dynamic request
// data — POST-only routes (translate, handwriting-recognize) are silently
// skipped, but /api/giphy and /api/themes export GET and read searchParams,
// which Next refuses to build statically. The Android app never calls its own
// bundled copy anyway (native requests go through getApiBaseUrl() to the
// deployed site), so this script just moves those routes out of the way for
// the duration of the static build and restores them afterward.
import { existsSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Moved fully outside src/app so Next's router can't pick them up as routes
// by any folder-naming convention while they're hidden.
const routes = ['giphy', 'themes'].map((name) => ({
  dir: path.join(process.cwd(), 'src/app/api', name),
  hidden: path.join(process.cwd(), `.${name}-excluded-from-android`),
}));

const moved = routes.filter((r) => existsSync(r.dir));
for (const r of moved) renameSync(r.dir, r.hidden);

try {
  const result = spawnSync('npx', ['next', 'build'], {
    stdio: 'inherit',
    shell: true,
    // `npx` resets npm_lifecycle_event for the child it spawns, so
    // next.config.ts can't rely on that alone — pass an explicit flag too.
    env: { ...process.env, AKAI_BUILD_TARGET: 'android' },
  });
  process.exitCode = result.status ?? 1;
} finally {
  for (const r of moved) if (existsSync(r.hidden)) renameSync(r.hidden, r.dir);
}
