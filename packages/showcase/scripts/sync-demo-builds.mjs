#!/usr/bin/env node
// For local dev only: builds each demo package and copies its static output
// into public/live/<slug>/ so the Preview iframe has something to point at.
// The CI workflow (see .github/workflows/deploy.yml) does the equivalent
// copy into showcase/dist/live/<slug>/ for production. Keep this list in
// sync with src/data/galleryItems.ts.
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const showcaseDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(showcaseDir, '..', '..');

const DEMOS = [{ slug: 'monitoring', pnpmFilter: 'monitoring-dashboard-demo' }];

for (const { slug, pnpmFilter } of DEMOS) {
  console.log(`[sync-demos] building ${pnpmFilter}...`);
  execSync(`pnpm --filter ${pnpmFilter} run build`, { cwd: repoRoot, stdio: 'inherit' });

  const src = path.join(repoRoot, 'packages', slug, 'dist');
  const dest = path.join(showcaseDir, 'public', 'live', slug);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[sync-demos] copied packages/${slug}/dist -> public/live/${slug}/`);
}
