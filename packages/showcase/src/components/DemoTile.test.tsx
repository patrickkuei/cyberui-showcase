import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DemoTile } from './DemoTile';
import { getGalleryItem } from '../data/galleryItems';

describe('DemoTile', () => {
  it('renders a live demo as clickable with a Live badge', () => {
    const item = getGalleryItem('monitoring')!;
    render(<DemoTile item={item} size="large" />);
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View case study' })).toBeInTheDocument();
  });

  it('renders a coming-soon demo with no clickable or focusable affordance', () => {
    const item = getGalleryItem('agent-panel')!;
    render(<DemoTile item={item} size="small" />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it("points the image at the demo's own screenshot path, with the coming-soon graphic as fallback", () => {
    // Real 404-triggered fallback rendering only happens in a real browser
    // (happy-dom doesn't simulate image load failure) — see Review Focus #5
    // for the manual check this doesn't replace.
    const item = getGalleryItem('agent-panel')!;
    render(<DemoTile item={item} size="small" />);
    const img = screen.getByAltText('Agent Control Panel screenshot');
    expect(img).toHaveAttribute('src', './screenshots/agent-panel.png');
  });
});
