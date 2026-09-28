import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('renders the label and value', () => {
    render(<StatTile label="Requests/sec" value="1.3K" />);
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('1.3K')).toBeInTheDocument();
  });
});
