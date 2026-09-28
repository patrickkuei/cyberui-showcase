import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsFeed } from './AlertsFeed';

const NOW = 1_700_000_000_000;
const ALERTS = [
  { id: '1', severity: 'critical' as const, message: 'Error rate above threshold on us-east-1', timestamp: NOW - 30_000 },
  { id: '2', severity: 'info' as const, message: 'Deploy completed: model-router v2.3.1', timestamp: NOW - 5 * 60_000 },
];

describe('AlertsFeed', () => {
  it('renders each alert with its message and relative time', () => {
    render(<AlertsFeed alerts={ALERTS} now={NOW} />);
    expect(screen.getByText('Error rate above threshold on us-east-1')).toBeInTheDocument();
    expect(screen.getByText('30s ago')).toBeInTheDocument();
    expect(screen.getByText('Deploy completed: model-router v2.3.1')).toBeInTheDocument();
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('shows only the latest 8 alerts', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      severity: 'info' as const,
      message: `Alert number ${i}`,
      timestamp: NOW - i * 1000,
    }));
    render(<AlertsFeed alerts={many} now={NOW} />);
    expect(screen.getAllByText(/^Alert number \d+$/)).toHaveLength(8);
    expect(screen.getByText('Alert number 7')).toBeInTheDocument();
    expect(screen.queryByText('Alert number 8')).not.toBeInTheDocument();
  });
});
