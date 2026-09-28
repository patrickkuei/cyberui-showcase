import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createInitialState, type DashboardState } from './data/simulation';

// Drive App with a fixed, controllable state instead of the live simulation.
const mocked = vi.hoisted(() => ({ state: null as DashboardState | null }));
vi.mock('./data/useSimulatedMetrics', () => ({
  useSimulatedMetrics: () => mocked.state,
}));

import App from './App';

function stateWith(overrides: Partial<DashboardState>): DashboardState {
  return { ...createInitialState(1_700_000_000_000, () => 0.5), ...overrides };
}

describe('App action panel', () => {
  beforeEach(() => {
    mocked.state = null;
  });

  it('reports a latency-only incident as a latency incident, not an error-rate one', () => {
    mocked.state = stateWith({ errorRatePct: 0.4, p95LatencyMs: 612 });
    render(<App />);
    expect(screen.getByText(/Investigating elevated p95 latency/)).toBeInTheDocument();
    expect(screen.queryByText(/elevated error rate/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeInTheDocument();
  });

  it('keeps an acknowledgment across refreshes while the same incident continues', async () => {
    mocked.state = stateWith({ errorRatePct: 3.1, p95LatencyMs: 220 });
    const { rerender } = render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    expect(screen.getByText('Acknowledged')).toBeInTheDocument();

    // Next tick: the percentage moves but it is still the same error-rate incident.
    mocked.state = stateWith({ errorRatePct: 3.4, p95LatencyMs: 220 });
    rerender(<App />);
    expect(screen.getByText('Acknowledged')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acknowledge' })).not.toBeInTheDocument();
  });

  it('shows no action when every metric is within its threshold', () => {
    mocked.state = stateWith({ errorRatePct: 0.4, p95LatencyMs: 220 });
    render(<App />);
    expect(screen.queryByText(/Investigating/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acknowledge' })).not.toBeInTheDocument();
  });
});
