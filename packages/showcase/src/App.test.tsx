import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the home page by default', () => {
    window.location.hash = '';
    render(<App />);
    expect(screen.getByText('AI Product Monitoring')).toBeInTheDocument();
  });

  it('renders the gallery page for a known demo hash', () => {
    window.location.hash = '#/gallery/monitoring';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'AI Product Monitoring' })).toBeInTheDocument();
  });
});
