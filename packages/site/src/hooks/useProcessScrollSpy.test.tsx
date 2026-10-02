import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { useProcessScrollSpy, READING_BAND_MARGIN } from './useProcessScrollSpy';

// An IntersectionObserver the test can fire by hand, one instance per
// observer the hook creates, identified by its options.
class ControlledObserver {
  static instances: ControlledObserver[] = [];
  constructor(
    private callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    ControlledObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  fire(entry: Partial<IntersectionObserverEntry>) {
    this.callback([entry as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

function Probe() {
  const rootRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const { current, pastOverview } = useProcessScrollSpy(rootRef, overviewRef);
  return (
    <div ref={rootRef} data-testid="root" data-current={String(current)} data-past={String(pastOverview)}>
      <div ref={overviewRef} data-testid="overview" />
      <div data-stage-number="1" data-testid="row-1" />
      <div data-stage-number="2" data-testid="row-2" />
      <div data-stage-number="3" data-testid="row-3" />
    </div>
  );
}

const attr = (name: 'data-current' | 'data-past') => screen.getByTestId('root').getAttribute(name);
const overviewObserver = () => ControlledObserver.instances.find((o) => o.options?.rootMargin === undefined)!;
const rowObserver = () => ControlledObserver.instances.find((o) => o.options?.rootMargin === READING_BAND_MARGIN)!;

afterEach(() => {
  ControlledObserver.instances = [];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useProcessScrollSpy', () => {
  it('starts with no current stage and the overview not passed', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    render(<Probe />);
    expect(attr('data-current')).toBe('null');
    expect(attr('data-past')).toBe('false');
    expect(rowObserver().options?.rootMargin).toBe('-35% 0px -60% 0px');
  });

  it('is past the overview only when it is out of view and above the viewport', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    render(<Probe />);
    act(() => overviewObserver().fire({ isIntersecting: false, boundingClientRect: { top: -50 } as DOMRectReadOnly }));
    expect(attr('data-past')).toBe('true');
    act(() => overviewObserver().fire({ isIntersecting: true, boundingClientRect: { top: 10 } as DOMRectReadOnly }));
    expect(attr('data-past')).toBe('false');
    // Below the fold: not intersecting, but not scrolled past either.
    act(() => overviewObserver().fire({ isIntersecting: false, boundingClientRect: { top: 900 } as DOMRectReadOnly }));
    expect(attr('data-past')).toBe('false');
  });

  it('tracks the row crossing the reading band and keeps it between rows', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    render(<Probe />);
    act(() => rowObserver().fire({ isIntersecting: true, target: screen.getByTestId('row-2') }));
    expect(attr('data-current')).toBe('2');
    act(() => rowObserver().fire({ isIntersecting: true, target: screen.getByTestId('row-3') }));
    expect(attr('data-current')).toBe('3');
    act(() => rowObserver().fire({ isIntersecting: false, target: screen.getByTestId('row-3') }));
    expect(attr('data-current')).toBe('3');
  });

  it('creates no observers and reports nothing without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Probe />);
    expect(attr('data-current')).toBe('null');
    expect(attr('data-past')).toBe('false');
  });

  it('creates no observers and reports nothing under prefers-reduced-motion', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList);
    render(<Probe />);
    expect(ControlledObserver.instances).toHaveLength(0);
    expect(attr('data-current')).toBe('null');
    expect(attr('data-past')).toBe('false');
  });
});
