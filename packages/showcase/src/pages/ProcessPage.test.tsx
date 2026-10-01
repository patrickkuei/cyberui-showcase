import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessPage } from './ProcessPage';

beforeEach(() => {
  // happy-dom doesn't implement IntersectionObserver; this stub reports
  // every observed element as immediately visible, matching real-browser
  // behavior for content already in the viewport when observe() runs —
  // see Review Focus #2 and useRevealOnScroll's own comment.
  class StubIntersectionObserver {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    }
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', StubIntersectionObserver);
});

describe('ProcessPage', () => {
  it('renders all three acts with their stage titles', () => {
    const { container } = render(<ProcessPage />);
    expect(screen.getByRole('heading', { name: 'Before the pixels' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Where cyberui-2045 takes over' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Proving it's real" })).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    expect(screen.getByText('Visual Direction')).toBeInTheDocument();
    expect(screen.getByText('Handoff')).toBeInTheDocument();
    // Verify all three act wrapper divs have the process-reveal-visible class
    // (catch regressions in useRevealOnScroll returning visible: false)
    expect(container.querySelectorAll('.process-reveal-visible')).toHaveLength(3);
  });

  it('is honest that cyberui-2045 only covers four of the ten stages', () => {
    render(<ProcessPage />);
    expect(screen.getByText(/only helps with four of them/)).toBeInTheDocument();
  });
});
