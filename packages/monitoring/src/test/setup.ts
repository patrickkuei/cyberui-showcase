import '@testing-library/jest-dom/vitest';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Recharts' <ResponsiveContainer> sizes itself from the parent element's box
// size; jsdom never performs real layout, so offsetWidth/offsetHeight are
// always 0 and every chart would render as an empty 0x0 SVG in tests.
Object.defineProperties(HTMLElement.prototype, {
  offsetWidth: { configurable: true, value: 500 },
  offsetHeight: { configurable: true, value: 220 },
});

// Recharts 2.15.4's <ResponsiveContainer> does NOT read offsetWidth/
// offsetHeight above — it measures its container via
// `containerRef.current.getBoundingClientRect()` on mount and via the
// ResizeObserver callback's `entries[0].contentRect` thereafter (see
// node_modules/recharts/es6/component/ResponsiveContainer.js). jsdom's
// getBoundingClientRect() always returns an all-zero DOMRect, so without
// this mock every chart's computed size stays at 0 and Recharts warns
// "The width(0) and height(0) of chart should be greater than 0" while
// rendering a 0x0 <svg class="recharts-surface">. Mock it to match the
// offsetWidth/offsetHeight fixture above so ResponsiveContainer measures a
// real, non-zero size.
Element.prototype.getBoundingClientRect = function getBoundingClientRect(): DOMRect {
  return {
    width: 500,
    height: 220,
    top: 0,
    left: 0,
    right: 500,
    bottom: 220,
    x: 0,
    y: 0,
    toJSON() {
      return this;
    },
  };
};
