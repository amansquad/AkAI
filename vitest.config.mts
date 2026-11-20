import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests for the website's API routes and their helpers: `npm test`.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
