import type { NextConfig } from "next";
import { readFileSync } from "node:fs";

// The APK's version (written by `npm run apk:info`), for its download name.
const apkVersion: string = JSON.parse(readFileSync("./src/lib/apk-info.json", "utf8")).version;

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// `npm run build:android` produces the static bundle Capacitor packages into
// the Android app (no server, so /api routes can't exist there — the app
// calls the deployed site's API instead, see src/lib/api-base-url.ts).
// `npm run build` (used by Vercel) stays a normal server build so /api/*
// route handlers (translate, handwriting-recognize) actually work.
const isCapacitorBuild =
  process.env.AKAI_BUILD_TARGET === 'android' ||
  process.env.npm_lifecycle_event === 'build:android';

const nextConfig: NextConfig = {
  ...(isCapacitorBuild ? { output: "export" as const } : {}),
  images: {
    unoptimized: isCapacitorBuild, // Required for static export
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // /api/stickers/file runs ffmpeg to turn Telegram video stickers into
  // animated WebP and GIF. Keep the package unbundled so it can find its
  // binary, and ship the binary with that route.
  // .tgs (vector) stickers are drawn first by ThorVG's WebAssembly build in
  // @lottiefiles/dotlottie-web, read from the package folder.
  serverExternalPackages: ['ffmpeg-static', '@lottiefiles/dotlottie-web'],
  outputFileTracingIncludes: {
    '/api/stickers/file': [
      './node_modules/ffmpeg-static/ffmpeg*',
      './node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm',
    ],
  },

  // The download is served as /AkAI-keyboard-v<version>.apk, so phones save it
  // under a name that says which version it is; there is still one file,
  // public/AkAI-keyboard.apk. The header names it the same way for browsers
  // that take the name from there, and for old links to /AkAI-keyboard.apk.
  ...(isCapacitorBuild ? {} : {
    async rewrites() {
      return [{ source: "/AkAI-keyboard-v:version.apk", destination: "/AkAI-keyboard.apk" }];
    },
    async headers() {
      const apk = [
        { key: "Content-Type", value: "application/vnd.android.package-archive" },
        { key: "Content-Disposition", value: `attachment; filename="AkAI-keyboard-v${apkVersion}.apk"` },
      ];
      return [
        { source: "/AkAI-keyboard.apk", headers: apk },
        { source: "/AkAI-keyboard-v:version.apk", headers: apk },
      ];
    },
  }),

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
};

export default withBundleAnalyzer(nextConfig);
