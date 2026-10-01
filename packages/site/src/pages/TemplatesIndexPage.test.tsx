import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplatesIndexPage } from './TemplatesIndexPage';
import { TEMPLATES } from '../data/templates';

describe('TemplatesIndexPage', () => {
  it('renders one tile per template, live and coming-soon alike', () => {
    render(<TemplatesIndexPage />);
    for (const item of TEMPLATES) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    }
  });

  it('shows exactly one Live badge and four Coming soon badges', () => {
    render(<TemplatesIndexPage />);
    expect(screen.getAllByText('Live')).toHaveLength(1);
    expect(screen.getAllByText('Coming soon')).toHaveLength(4);
  });
});
