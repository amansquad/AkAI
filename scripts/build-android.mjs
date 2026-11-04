// Static export (output: "export", used for the Capacitor/Android bundle)
// can only include Route Handlers that export GET with no dynamic request
// data — POST-only routes (translate, handwriting-recognize) are silently
// skipped, but /api/giphy exports GET and reads searchParams, which Next
// refuses to build statically. The Android app never calls its own bundled
// copy anyway (native requests go through getApiBaseUrl() to the deployed
// site), so this script just moves that one route out of the way for the
// duration of the static build and restores it afterward.
import { existsSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const giphyDir = path.join(process.cwd(), 'src/app/api/giphy');
// Moved fully outside src/app so Next's router can't pick it up as a route
// by any folder-naming convention while it's hidden.
const hiddenDir = path.join(process.cwd(), '.giphy-excluded-from-android');

const moved = existsSync(giphyDir);
if (moved) renameSync(giphyDir, hiddenDir);

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
  if (moved && existsSync(hiddenDir)) renameSync(hiddenDir, giphyDir);
}
