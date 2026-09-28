import '@testing-library/jest-dom/vitest';

// cyberui-2045 checks for its stylesheet at import time by reading
// --color-primary from document.documentElement and warns "Stylesheet not
// detected" when it's missing. Tests don't load CSS, so provide the token
// inline (setup runs before any test module imports cyberui-2045).
document.documentElement.style.setProperty('--color-primary', '#ff005d');

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Recharts 2.15.4's <ResponsiveContainer> measures its container via
// `containerRef.current.getBoundingClientRect()` on mount and via the
// ResizeObserver callback's `entries[0].contentRect` thereafter (see
// node_modules/recharts/es6/component/ResponsiveContainer.js). jsdom's
// getBoundingClientRect() always returns an all-zero DOMRect, so without
// this mock every chart's computed size stays at 0 and Recharts warns
// "The width(0) and height(0) of chart should be greater than 0" while
// rendering a 0x0 <svg class="recharts-surface">. Mock it so
// ResponsiveContainer measures a real, non-zero size.
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
