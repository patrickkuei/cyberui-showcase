import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the home page by default', () => {
    window.location.hash = '';
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Real products,');
  });

  it('renders the gallery page for a known demo hash', () => {
    window.location.hash = '#/gallery/monitoring';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'AI Product Monitoring' })).toBeInTheDocument();
  });

  it('renders the nav solid immediately on non-home routes (Review Focus #3)', () => {
    window.location.hash = '#/gallery/monitoring';
    render(<App />);
    expect(screen.getByRole('navigation')).toHaveClass('site-nav-solid');
  });

  it('renders the nav transparent over the hero on Home, until scrolled', () => {
    window.location.hash = '';
    render(<App />);
    expect(screen.getByRole('navigation')).not.toHaveClass('site-nav-solid');
  });

  it('renders the gallery index for #/gallery', () => {
    window.location.hash = '#/gallery';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'All demos' })).toBeInTheDocument();
  });
});
