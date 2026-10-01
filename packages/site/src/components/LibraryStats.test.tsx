import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LibraryStats } from './LibraryStats';

describe('LibraryStats', () => {
  it('shows the component count and palette injected from the installed cyberui-2045', () => {
    render(<LibraryStats />);
    const { components, palette } = __LIBRARY_STATS__;
    expect(screen.getByText(String(components))).toBeInTheDocument();
    for (const { hex } of palette) expect(screen.getByText(hex)).toBeInTheDocument();
  });

  it('injects plausible real values (guards against the build-time read silently returning empty)', () => {
    expect(__LIBRARY_STATS__.components).toBeGreaterThan(10);
    expect(__LIBRARY_STATS__.palette).toHaveLength(5);
    for (const { hex } of __LIBRARY_STATS__.palette) expect(hex).toMatch(/^#[0-9a-fA-F]{3,8}$/);
  });

  it('says the numbers are counted at build time', () => {
    render(<LibraryStats />);
    expect(screen.getByText(/Counted when this site was built/)).toBeInTheDocument();
  });
});
