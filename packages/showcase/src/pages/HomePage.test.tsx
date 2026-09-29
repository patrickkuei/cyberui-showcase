import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders the hero and one gallery tile per demo', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Real products,');
    expect(heading).toHaveTextContent('not a component playground.');
    expect(screen.getByText('AI Product Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
