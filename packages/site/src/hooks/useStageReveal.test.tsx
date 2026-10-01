import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useStageReveal, READING_ZONE_MARGIN } from './useStageReveal';

// An IntersectionObserver the test can fire by hand, one instance per
// observer the hook creates, identified by its rootMargin.
class ControlledObserver {
  static instances: ControlledObserver[] = [];
  constructor(
    private callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {
    ControlledObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  fire(isIntersecting = true) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

function Probe() {
  const { ref, stage } = useStageReveal<HTMLDivElement>();
  return <div ref={ref} data-testid="probe" data-stage={stage} />;
}

const stageOf = () => screen.getByTestId('probe').getAttribute('data-stage');
const headerObserver = () => ControlledObserver.instances.find((o) => !o.options?.rootMargin)!;
const readingObserver = () => ControlledObserver.instances.find((o) => o.options?.rootMargin === READING_ZONE_MARGIN)!;

afterEach(() => {
  ControlledObserver.instances = [];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useStageReveal', () => {
  it('starts pending, then header, then full as the element climbs the viewport', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    render(<Probe />);
    expect(stageOf()).toBe('pending');
    act(() => headerObserver().fire());
    expect(stageOf()).toBe('header');
    act(() => readingObserver().fire());
    expect(stageOf()).toBe('full');
  });

  it('never goes backwards: a late header callback cannot downgrade full', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    render(<Probe />);
    act(() => readingObserver().fire());
    expect(stageOf()).toBe('full');
    act(() => headerObserver().fire());
    expect(stageOf()).toBe('full');
  });

  it('ignores callbacks where the element is not intersecting', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    render(<Probe />);
    act(() => headerObserver().fire(false));
    expect(stageOf()).toBe('pending');
  });

  it('is fully visible when the browser has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Probe />);
    expect(stageOf()).toBe('full');
  });

  it('is fully visible, with no observers created, under prefers-reduced-motion', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList);
    render(<Probe />);
    expect(stageOf()).toBe('full');
    expect(ControlledObserver.instances).toHaveLength(0);
  });
});
