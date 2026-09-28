import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { EndpointsPage } from './EndpointsPage';

const ENDPOINTS = [{ name: '/v1/chat/completions', requests: 1280, avgLatencyMs: 145, errorRatePct: 0.6 }];

describe('EndpointsPage', () => {
  it('renders the page title and the endpoint table', () => {
    render(<EndpointsPage endpoints={ENDPOINTS} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Endpoints' })).toBeInTheDocument();
    // Scoped to the table section: the new "Requests by endpoint" chart also renders the
    // endpoint name (as an axis tick), so an unscoped getByText would match both.
    expect(within(screen.getByRole('region', { name: 'Endpoints' })).getByText('/v1/chat/completions')).toBeInTheDocument();
  });

  it('shows the page title once, without a card title repeating it', () => {
    render(<EndpointsPage endpoints={ENDPOINTS} />);
    expect(screen.getAllByRole('heading', { name: 'Endpoints' })).toHaveLength(1);
  });

  it('shows a summary stat row with real weighted aggregates (Review Focus #3)', () => {
    const endpoints = [
      { name: '/a', requests: 100, avgLatencyMs: 100, errorRatePct: 1 },
      { name: '/b', requests: 300, avgLatencyMs: 300, errorRatePct: 5 },
    ];
    // Weighted avg latency: (100*100 + 300*300) / 400 = 250ms. Weighted error rate: (100*1 + 300*5) / 400 = 4%.
    render(<EndpointsPage endpoints={endpoints} />);
    expect(screen.getByText('Endpoints monitored')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('250 ms')).toBeInTheDocument();
    expect(screen.getByText('4.0%')).toBeInTheDocument();
  });
});
