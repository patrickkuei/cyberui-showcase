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
