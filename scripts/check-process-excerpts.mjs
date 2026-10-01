#!/usr/bin/env node
// Verifies that every excerpt shown on the /process page still appears
// verbatim in the file it claims to come from, and that the page's image
// evidence exists. Excerpts are copies, and a copy that no longer matches its
// source is a false claim on a page whose whole point is evidence.
//
// Lives at the repo root, not in packages/site, so the site package stays
// self-contained. The data it checks is
// packages/site/src/content/processEvidence.json (plain JSON so this script
// needs no build step).
//
// When it fails: copy the new text from the source file into the JSON
// excerpt (one array entry per line) and set `asOf` to the commit you
// copied it from.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * @param {Record<string, any>} evidence processEvidence.json, parsed
 * @param {string} repoRoot absolute path to the repository root
 * @returns {string[]} one human-readable problem per failure; empty when all is well
 */
export function checkEvidence(evidence, repoRoot) {
  const problems = [];
  for (const [stage, item] of Object.entries(evidence)) {
    if (item.kind === 'image') {
      const file = path.join(repoRoot, 'packages', 'site', 'public', item.src.replace(/^\.\//, ''));
      if (!existsSync(file)) problems.push(`Stage ${stage}: image ${item.src} not found at ${file}`);
      continue;
    }
    const sourceFile = path.join(repoRoot, item.source.path);
    if (!existsSync(sourceFile)) {
      problems.push(`Stage ${stage}: source file ${item.source.path} does not exist`);
      continue;
    }
    // Checkouts on Windows may have CRLF line endings; the JSON never does.
    const source = readFileSync(sourceFile, 'utf8').replace(/\r\n/g, '\n');
    if (!source.includes(item.excerpt.join('\n'))) {
      problems.push(
        `Stage ${stage}: excerpt no longer appears verbatim in ${item.source.path} (taken as of ${item.asOf}). ` +
          'Refresh it in packages/site/src/content/processEvidence.json and update asOf.'
      );
    }
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const evidenceFile = path.join(repoRoot, 'packages', 'site', 'src', 'content', 'processEvidence.json');
  const evidence = JSON.parse(readFileSync(evidenceFile, 'utf8'));
  const problems = checkEvidence(evidence, repoRoot);
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`process evidence OK (${Object.keys(evidence).length} stages checked)`);
}
