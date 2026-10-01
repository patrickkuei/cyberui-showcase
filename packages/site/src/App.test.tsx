import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the home page by default', () => {
    window.location.hash = '';
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Built by AI.');
  });

  it('renders the template page for a known template hash', () => {
    window.location.hash = '#/templates/monitoring';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'AI Product Monitoring' })).toBeInTheDocument();
  });

  it('renders the nav solid immediately on non-home routes (Review Focus #3)', () => {
    window.location.hash = '#/templates/monitoring';
    render(<App />);
    expect(screen.getByRole('navigation')).toHaveClass('site-nav-solid');
  });

  it('renders the nav transparent over the hero on Home, until scrolled', () => {
    window.location.hash = '';
    render(<App />);
    expect(screen.getByRole('navigation')).not.toHaveClass('site-nav-solid');
  });

  it('renders the templates index for #/templates', () => {
    window.location.hash = '#/templates';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'All templates' })).toBeInTheDocument();
  });

  it('renders the process page for #/process', () => {
    window.location.hash = '#/process';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'How we design' })).toBeInTheDocument();
  });
});
