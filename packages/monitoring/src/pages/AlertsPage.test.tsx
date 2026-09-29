import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsPage } from './AlertsPage';

const ALERTS = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  severity: 'info' as const,
  message: `Alert number ${i}`,
  timestamp: Date.now() - i * 1000,
}));

describe('AlertsPage', () => {
  it('renders the page title and more than 8 alerts', () => {
    render(<AlertsPage alerts={ALERTS} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Alerts' })).toBeInTheDocument();
    expect(screen.getAllByText(/^Alert number \d+$/).length).toBeGreaterThan(8);
  });

  it('shows the page title once, without a card title repeating it', () => {
    render(<AlertsPage alerts={ALERTS} />);
    expect(screen.getAllByRole('heading', { name: 'Alerts' })).toHaveLength(1);
  });

  it('shows a summary stat row with real severity counts (Review Focus #3)', () => {
    const alerts = [
      { id: '1', severity: 'critical' as const, message: 'a', timestamp: Date.now() },
      { id: '2', severity: 'critical' as const, message: 'b', timestamp: Date.now() },
      { id: '3', severity: 'warning' as const, message: 'c', timestamp: Date.now() },
      { id: '4', severity: 'info' as const, message: 'd', timestamp: Date.now() },
    ];
    render(<AlertsPage alerts={alerts} />);
    expect(screen.getByText('Total alerts')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });
});
