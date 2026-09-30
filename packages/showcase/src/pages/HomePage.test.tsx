import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';
import { GALLERY_ITEMS } from '../data/galleryItems';

describe('HomePage', () => {
  it('renders the hero headline and CTAs into the gallery', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Real products,');
    expect(heading).toHaveTextContent('not a component playground.');
    const ctas = screen.getAllByRole('button', { name: 'View the gallery' });
    expect(ctas.length).toBeGreaterThanOrEqual(2); // hero CTA + closing CTA
  });

  it("does not list individual demos on Home — that's Gallery's job", () => {
    render(<HomePage />);
    expect(screen.queryByText('AI Product Monitoring')).not.toBeInTheDocument();
  });

  it('still shows the live-ticking readout as proof the hub itself is running', () => {
    render(<HomePage />);
    expect(screen.getByRole('status', { name: 'Example live metrics' })).toBeInTheDocument();
  });

  it('derives the closing-CTA demo count from GALLERY_ITEMS instead of a hardcoded string', () => {
    render(<HomePage />);
    const liveCount = GALLERY_ITEMS.filter((item) => item.status === 'live').length;
    const comingSoonCount = GALLERY_ITEMS.length - liveCount;
    expect(
      screen.getByText(`${liveCount} demo${liveCount === 1 ? '' : 's'} live today, ${comingSoonCount} more on the way.`)
    ).toBeInTheDocument();
  });
});
