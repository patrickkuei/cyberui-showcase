import '@testing-library/jest-dom/vitest';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// cyberui-2045's TabNavigation measures its container to pick a responsive
// mode (scroll/wrap/dropdown); jsdom/happy-dom never perform real layout, so
// without these stubs it renders nothing to interact with in tests.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

Object.defineProperties(HTMLElement.prototype, {
  offsetWidth: { configurable: true, value: 1024 },
  offsetHeight: { configurable: true, value: 48 },
});
