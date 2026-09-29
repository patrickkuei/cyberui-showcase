import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('renders the label and value', () => {
    render(<StatTile label="Requests/sec" value="1.3K" />);
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('1.3K')).toBeInTheDocument();
  });

  it('renders an icon and status line when provided', () => {
    render(
      <StatTile
        label="Requests/sec"
        value="1.3K"
        icon={<span data-testid="stat-icon">icon</span>}
        status="steady"
        statusTone="default"
      />,
    );
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
    expect(screen.getByText('steady')).toBeInTheDocument();
  });

  it('renders without an icon or status when not provided', () => {
    render(<StatTile label="Active sessions" value="1.3K" />);
    expect(screen.queryByTestId('stat-icon')).not.toBeInTheDocument();
  });
});
