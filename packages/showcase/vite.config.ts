/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset URLs so the build works standalone and when served from a
  // subpath (e.g. a GitHub Pages project site, or nested under a combined
  // showcase deploy) — same convention as packages/monitoring.
  base: './',
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
