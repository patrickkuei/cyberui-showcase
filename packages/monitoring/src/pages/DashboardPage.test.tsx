import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { createInitialState } from '../data/simulation';

describe('DashboardPage', () => {
  it('renders the stat tiles, action panel, and charts', () => {
    const state = createInitialState(1_700_000_000_000, () => 0.5);
    render(<DashboardPage state={state} chartRange="60s" onChartRangeChange={() => {}} refreshMs={2000} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('p95 latency')).toBeInTheDocument();
    expect(screen.getByText('Error rate')).toBeInTheDocument();
    expect(screen.getByText('Active sessions')).toBeInTheDocument();
    expect(screen.getByText('What needs attention')).toBeInTheDocument();
    expect(screen.getByText('Request volume')).toBeInTheDocument();
  });

  it('derives the refresh wording from the refresh interval it is given', () => {
    const state = createInitialState(1_700_000_000_000, () => 0.5);
    render(<DashboardPage state={state} chartRange="60s" onChartRangeChange={() => {}} refreshMs={5000} />);
    expect(screen.getByText(/updated live every 5 seconds/)).toBeInTheDocument();
  });
});
