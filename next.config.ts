import type { NextConfig } from "next";

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

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
};

export default withBundleAnalyzer(nextConfig);
