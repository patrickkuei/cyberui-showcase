import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Nav } from './Nav';

describe('Nav', () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('renders links to templates and process', () => {
    render(<Nav />);
    expect(screen.getByRole('link', { name: 'Templates' })).toHaveAttribute('href', '#/templates');
    expect(screen.getByRole('link', { name: 'How we design' })).toHaveAttribute('href', '#/process');
  });

  it('is solid from the first paint when transparentUntilScroll is not set', () => {
    render(<Nav />);
    expect(screen.getByRole('navigation')).toHaveClass('site-nav-solid');
  });

  it('starts transparent over the hero and becomes solid once scrolled past it', () => {
    render(<Nav transparentUntilScroll />);
    const nav = screen.getByRole('navigation');
    expect(nav).not.toHaveClass('site-nav-solid');

    Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
    fireEvent.scroll(window);
    expect(nav).toHaveClass('site-nav-solid');
  });
});
