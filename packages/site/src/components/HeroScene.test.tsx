import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { HeroScene } from './HeroScene';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('HeroScene', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('animates the load-in when the user has no motion preference', () => {
    mockMatchMedia(false);
    const { container } = render(<HeroScene />);
    expect(container.querySelector('.hero-scene-animated')).toBeInTheDocument();
  });

  it('renders fully visible immediately when the user prefers reduced motion', () => {
    mockMatchMedia(true);
    const { container } = render(<HeroScene />);
    expect(container.querySelector('.hero-scene-animated')).not.toBeInTheDocument();
    expect(container.querySelector('.hero-scene')).toBeInTheDocument();
  });
});
