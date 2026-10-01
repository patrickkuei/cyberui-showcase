import { describe, it, expect } from 'vitest';
import { GALLERY_ITEMS, getGalleryItem, isLive } from './galleryItems';

describe('galleryItems', () => {
  it('has exactly one live demo and four coming-soon demos', () => {
    const live = GALLERY_ITEMS.filter((item) => item.status === 'live');
    const comingSoon = GALLERY_ITEMS.filter((item) => item.status === 'coming-soon');
    expect(live).toHaveLength(1);
    expect(comingSoon).toHaveLength(4);
  });

  it("isLive reflects each item's status", () => {
    const monitoring = getGalleryItem('monitoring')!;
    const agentPanel = getGalleryItem('agent-panel')!;
    expect(isLive(monitoring)).toBe(true);
    expect(isLive(agentPanel)).toBe(false);
  });

  it('every item has a distinct accent hex', () => {
    const hexValues = GALLERY_ITEMS.map((item) => item.accentHex);
    expect(new Set(hexValues).size).toBe(hexValues.length);
  });

  it("every item's screenshot path is relative, matching the vite base: './' convention", () => {
    for (const item of GALLERY_ITEMS) {
      expect(item.screenshotSrc.startsWith('./screenshots/')).toBe(true);
    }
  });
});
