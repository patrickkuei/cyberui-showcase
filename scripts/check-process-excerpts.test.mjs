import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkEvidence } from './check-process-excerpts.mjs';

function fixtureRepo(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'excerpts-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

const excerptEntry = (lines, sourcePath = 'docs/spec.md') => ({
  kind: 'excerpt',
  source: { path: sourcePath, label: 'Spec' },
  asOf: 'abc1234',
  excerpt: lines,
});

test('passes when a multi-line excerpt appears verbatim in its source', () => {
  const root = fixtureRepo({ 'docs/spec.md': 'intro\nline one\n  line two\noutro\n' });
  assert.deepEqual(checkEvidence({ 1: excerptEntry(['line one', '  line two']) }, root), []);
});

test('is not fooled by Windows line endings in the source file', () => {
  const root = fixtureRepo({ 'docs/spec.md': 'intro\r\nline one\r\n  line two\r\noutro\r\n' });
  assert.deepEqual(checkEvidence({ 1: excerptEntry(['line one', '  line two']) }, root), []);
});

test('fails, naming the stage, when the source text has changed', () => {
  const root = fixtureRepo({ 'docs/spec.md': 'intro\nline ONE\n  line two\n' });
  const problems = checkEvidence({ 4: excerptEntry(['line one', '  line two']) }, root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Stage 4/);
  assert.match(problems[0], /docs\/spec\.md/);
  assert.match(problems[0], /asOf/);
});

test('fails when the source file is gone', () => {
  const root = fixtureRepo({});
  const problems = checkEvidence({ 2: excerptEntry(['x']) }, root);
  assert.match(problems[0], /Stage 2/);
  assert.match(problems[0], /does not exist/);
});

test('checks that an image file exists under the site public folder', () => {
  const image = { kind: 'image', source: { path: 'packages/site/x.tsx', label: 'x' }, asOf: 'abc1234', src: './screenshots/a.png', alt: 'a' };
  const missing = checkEvidence({ 7: image }, fixtureRepo({}));
  assert.match(missing[0], /Stage 7/);
  const present = checkEvidence({ 7: image }, fixtureRepo({ 'packages/site/public/screenshots/a.png': 'png' }));
  assert.deepEqual(present, []);
});
