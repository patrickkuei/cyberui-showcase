import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the dashboard header, stat tiles, and panel titles', () => {
    render(<App />);

    expect(screen.getByText('Nexus AI Platform')).toBeInTheDocument();
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('p95 latency')).toBeInTheDocument();
    // "Error rate" is both a stat tile label and the endpoint table's column header.
    expect(screen.getAllByText('Error rate')).toHaveLength(2);
    expect(screen.getByText('Active sessions')).toBeInTheDocument();
    // "Endpoints" and "Alerts" are also nav labels, so check the panel titles inside <main>.
    const main = screen.getByRole('main');
    expect(within(main).getByText('Endpoints')).toBeInTheDocument();
    expect(within(main).getByText('Alerts')).toBeInTheDocument();
  });

  it('renders the top nav and the action panel', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByText('What needs attention')).toBeInTheDocument();
  });

  it('marks the unimplemented nav links as inert rather than broken buttons (Review Focus #4)', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /primary/i });
    const endpointsLink = within(nav).getByText('Endpoints');
    expect(endpointsLink.tagName).toBe('SPAN');
    expect(endpointsLink).toHaveAttribute('aria-disabled', 'true');
    expect(within(nav).getByText('Dashboard')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: 'Endpoints' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Endpoints' })).not.toBeInTheDocument();
  });

  it("keeps the request volume chart's rendered SVG unchanged when the mock range toggle is clicked (Review Focus #3)", () => {
    render(<App />);
    const svgBefore = document.querySelector('svg.recharts-surface')?.outerHTML;
    // Guard against a vacuous pass where no chart rendered (undefined === undefined).
    expect(svgBefore).toBeDefined();

    screen.getByRole('button', { name: '5m' }).click();

    const svgAfter = document.querySelector('svg.recharts-surface')?.outerHTML;
    expect(svgAfter).toBe(svgBefore);
  });

  it('moves the pressed state to the clicked range, proving the toggle is wired to real state', async () => {
    render(<App />);
    const fiveMin = screen.getByRole('button', { name: '5m' });
    expect(fiveMin).toHaveAttribute('aria-pressed', 'false');

    fiveMin.click();

    expect(await screen.findByRole('button', { name: '5m', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '60s' })).toHaveAttribute('aria-pressed', 'false');
  });
});
