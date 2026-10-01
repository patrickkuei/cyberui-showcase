import { describe, it, expect } from 'vitest';
import {
  PROCESS_STAGES,
  INCLUDED_STAGES,
  TOTAL_STAGES,
  OWNER_LABEL,
  groupIntoActs,
  sourceUrl,
  type ProcessStage,
} from './processStages';

describe('PROCESS_STAGES', () => {
  it('has the ten stages, numbered 1 to 10 in order', () => {
    expect(PROCESS_STAGES.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(TOTAL_STAGES).toBe(10);
  });

  it('marks exactly stages 5 to 8 as included in the library', () => {
    const included = PROCESS_STAGES.filter((s) => s.owner === 'library').map((s) => s.number);
    expect(included).toEqual([5, 6, 7, 8]);
    expect(INCLUDED_STAGES).toBe(4);
  });

  it('labels owners for display', () => {
    expect(OWNER_LABEL).toEqual({ you: 'Your decision', library: 'Included' });
  });

  it('carries a caveat on stages 2 and 9 only', () => {
    const withCaveat = PROCESS_STAGES.filter((s) => s.evidence.caveat).map((s) => s.number);
    expect(withCaveat).toEqual([2, 9]);
  });

  it('gives every stage evidence with a repo source and a commit', () => {
    for (const stage of PROCESS_STAGES) {
      expect(stage.summary.length, `stage ${stage.number} summary`).toBeGreaterThan(40);
      expect(stage.evidence.source.path, `stage ${stage.number} source`).toMatch(/^(docs|packages)\//);
      expect(stage.evidence.asOf, `stage ${stage.number} asOf`).toMatch(/^[0-9a-f]{7,40}$/);
      if (stage.evidence.kind === 'excerpt') {
        expect(stage.evidence.excerpt.trim().length, `stage ${stage.number} excerpt`).toBeGreaterThan(0);
      }
    }
  });

  it('uses an image only for stage 7, with a relative path', () => {
    const images = PROCESS_STAGES.filter((s) => s.evidence.kind === 'image');
    expect(images.map((s) => s.number)).toEqual([7]);
    const evidence = images[0]?.evidence;
    expect(evidence?.kind === 'image' && evidence.src).toBe('./screenshots/home-hero.png');
  });

  it('joins multi-line excerpts with newlines', () => {
    const stage3 = PROCESS_STAGES.find((s) => s.number === 3);
    const evidence = stage3?.evidence;
    expect(evidence?.kind === 'excerpt' && evidence.excerpt.split('\n')).toHaveLength(4);
  });
});

describe('groupIntoActs', () => {
  it('splits into runs of consecutive same-owner stages', () => {
    const acts = groupIntoActs(PROCESS_STAGES);
    expect(acts.map((a) => a.owner)).toEqual(['you', 'library', 'you']);
    expect(acts.map((a) => a.stages.map((s) => s.number))).toEqual([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]);
    expect(acts.map((a) => a.title)).toEqual([
      'Decisions that come first',
      'Where the template does the work',
      'Proving it works',
    ]);
  });

  it('throws when an owner change would silently produce a different act structure', () => {
    const flipped: ProcessStage[] = PROCESS_STAGES.map((s) =>
      s.number === 3 ? { ...s, owner: 'library' as const } : s
    );
    expect(() => groupIntoActs(flipped)).toThrow(/expected 3 acts/);
  });
});

describe('sourceUrl', () => {
  it('links a repo path to the file on main', () => {
    expect(sourceUrl('docs/x.md')).toBe('https://github.com/patrickkuei/cyberui-templates/blob/main/docs/x.md');
  });
});
