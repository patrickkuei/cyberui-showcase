import { describe, it, expect } from 'vitest';
import { TEMPLATES, getTemplate, isLive } from './templates';

describe('templates', () => {
  it('has exactly one live template and four coming-soon templates', () => {
    const live = TEMPLATES.filter((item) => item.status === 'live');
    const comingSoon = TEMPLATES.filter((item) => item.status === 'coming-soon');
    expect(live).toHaveLength(1);
    expect(comingSoon).toHaveLength(4);
  });

  it("isLive reflects each item's status", () => {
    const monitoring = getTemplate('monitoring')!;
    const agentPanel = getTemplate('agent-panel')!;
    expect(isLive(monitoring)).toBe(true);
    expect(isLive(agentPanel)).toBe(false);
  });

  it('every item has a distinct accent hex', () => {
    const hexValues = TEMPLATES.map((item) => item.accentHex);
    expect(new Set(hexValues).size).toBe(hexValues.length);
  });

  it("every item's screenshot path is relative, matching the vite base: './' convention", () => {
    for (const item of TEMPLATES) {
      expect(item.screenshotSrc.startsWith('./screenshots/')).toBe(true);
    }
  });
});
