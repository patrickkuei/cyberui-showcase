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
    // Disambiguated from AlertsFeed's own "Alerts" card title (an <h3>) via role/level.
    expect(screen.getByRole('heading', { level: 1, name: 'Alerts' })).toBeInTheDocument();
    expect(screen.getAllByText(/^Alert number \d+$/).length).toBeGreaterThan(8);
  });
});
