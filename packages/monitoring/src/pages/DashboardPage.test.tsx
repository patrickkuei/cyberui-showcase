import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { createInitialState } from '../data/simulation';

describe('DashboardPage', () => {
  it('renders the stat tiles, action panel, and charts', () => {
    const state = createInitialState(1_700_000_000_000, () => 0.5);
    render(<DashboardPage state={state} chartRange="60s" onChartRangeChange={() => {}} refreshMs={2000} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    const statRow = within(screen.getByLabelText('Key metrics'));
    expect(statRow.getByText('Requests/sec')).toBeInTheDocument();
    expect(statRow.getByText('p95 latency')).toBeInTheDocument();
    expect(statRow.getByText('Error rate')).toBeInTheDocument();
    expect(statRow.getByText('Active sessions')).toBeInTheDocument();
    expect(screen.getByText('What needs attention')).toBeInTheDocument();
    expect(screen.getByText('Request volume')).toBeInTheDocument();
  });

  it('derives the refresh wording from the refresh interval it is given', () => {
    const state = createInitialState(1_700_000_000_000, () => 0.5);
    render(<DashboardPage state={state} chartRange="60s" onChartRangeChange={() => {}} refreshMs={5000} />);
    expect(screen.getByText(/updated live every 5 seconds/)).toBeInTheDocument();
  });

  it('shows a top-endpoints teaser and a recent-alerts teaser, each linking to its full page', () => {
    const state = createInitialState(1_700_000_000_000, () => 0.5);
    render(
      <DashboardPage state={state} chartRange="60s" onChartRangeChange={() => {}} refreshMs={2000} />,
    );
    expect(screen.getByText('Top endpoints')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all endpoints →' })).toHaveAttribute('href', '#/endpoints');
    expect(screen.getByText('Recent alerts')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all alerts →' })).toHaveAttribute('href', '#/alerts');
  });

  it('shows the top 3 endpoints by request volume, not array order (Review Focus #2)', () => {
    const state = createInitialState(1_700_000_000_000, () => 0.5);
    const scrambled = {
      ...state,
      endpoints: [
        { name: '/low', requests: 10, avgLatencyMs: 50, errorRatePct: 0.1 },
        { name: '/high', requests: 9000, avgLatencyMs: 50, errorRatePct: 0.1 },
        { name: '/mid-a', requests: 500, avgLatencyMs: 50, errorRatePct: 0.1 },
        { name: '/mid-b', requests: 400, avgLatencyMs: 50, errorRatePct: 0.1 },
      ],
    };
    render(
      <DashboardPage state={scrambled} chartRange="60s" onChartRangeChange={() => {}} refreshMs={2000} />,
    );
    expect(screen.getByText('/high')).toBeInTheDocument();
    expect(screen.getByText('/mid-a')).toBeInTheDocument();
    expect(screen.getByText('/mid-b')).toBeInTheDocument();
    expect(screen.queryByText('/low')).not.toBeInTheDocument();
  });
});
