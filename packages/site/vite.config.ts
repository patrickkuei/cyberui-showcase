/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Real numbers about the installed cyberui-2045, read from its own files at
// build time (its package.json `exports` doesn't expose them to imports, so
// this reads them off disk). Nothing here is hand-typed, so the home page's
// stats can't drift from what's actually installed.
function readLibraryStats() {
  const pkgDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'node_modules', 'cyberui-2045');
  const manifest = JSON.parse(readFileSync(path.join(pkgDir, 'dist', 'component-manifest.json'), 'utf8'));
  const css = readFileSync(path.join(pkgDir, 'dist', 'cyberui-2045.css'), 'utf8');
  // The five main colors, as the library's own CSS declares them.
  const palette = (['primary', 'secondary', 'accent', 'base', 'surface'] as const).map((name) => {
    const hex = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8})`))?.[1];
    if (!hex) throw new Error(`cyberui-2045 CSS has no --color-${name} hex value`);
    return { name, hex };
  });
  return {
    components: manifest.components.length as number,
    palette,
  };
}

export default defineConfig({
  // Relative asset URLs so the build works standalone and when served from a
  // subpath (e.g. a GitHub Pages project site, or nested under a combined
  // site deploy) — same convention as packages/monitoring.
  base: './',
  plugins: [react()],
  define: {
    __LIBRARY_STATS__: JSON.stringify(readLibraryStats()),
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
