import { vi } from 'vitest';

/**
 * happy-dom's IntersectionObserver is a no-op that never calls back, so tests
 * choose a behavior. 'immediate' reports every observed element as
 * intersecting at observe() time, which is what a real browser does for
 * content already in view. 'never' stays silent, like an element far below
 * the fold. Pair with `vi.unstubAllGlobals()` in afterEach.
 */
export function stubIntersectionObserver(mode: 'immediate' | 'never'): void {
  class Stub {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      if (mode === 'immediate') {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
    }
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', Stub);
}
