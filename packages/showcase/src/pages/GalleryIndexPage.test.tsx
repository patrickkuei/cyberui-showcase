import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GalleryIndexPage } from './GalleryIndexPage';
import { GALLERY_ITEMS } from '../data/galleryItems';

describe('GalleryIndexPage', () => {
  it('renders one tile per demo, live and coming-soon alike', () => {
    render(<GalleryIndexPage />);
    for (const item of GALLERY_ITEMS) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    }
  });

  it('shows exactly one Live badge and four Coming soon badges', () => {
    render(<GalleryIndexPage />);
    expect(screen.getAllByText('Live')).toHaveLength(1);
    expect(screen.getAllByText('Coming soon')).toHaveLength(4);
  });
});
