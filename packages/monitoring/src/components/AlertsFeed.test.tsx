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
});
