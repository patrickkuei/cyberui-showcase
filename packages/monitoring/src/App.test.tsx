import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('renders the Dashboard route by default, with the nav, health badge, and action panel', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('What needs attention')).toBeInTheDocument();
    expect(screen.getByText(/All systems operational|Degraded performance/)).toBeInTheDocument();
  });

  it('navigates to the Endpoints page and back via real links (Review Focus #5)', async () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /primary/i });

    await userEvent.click(within(nav).getByRole('link', { name: 'Endpoints' }));
    expect(await screen.findByRole('heading', { name: 'Endpoints', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('Requests/sec')).not.toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Endpoints' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(within(nav).getByRole('link', { name: 'Dashboard' }));
    expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
  });

  it('navigates to Alerts and Reports (Review Focus #5)', async () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /primary/i });

    await userEvent.click(within(nav).getByRole('link', { name: 'Alerts' }));
    expect(await screen.findByRole('heading', { name: 'Alerts', level: 1 })).toBeInTheDocument();

    await userEvent.click(within(nav).getByRole('link', { name: 'Reports' }));
    expect(await screen.findByRole('heading', { name: 'Reports', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Usage report')).toBeInTheDocument();
  });

  it('nav links are keyboard-focusable real links, and Enter navigates (Review Focus #3)', async () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /primary/i });
    const endpointsLink = within(nav).getByRole('link', { name: 'Endpoints' });
    expect(endpointsLink.tagName).toBe('A');
    expect(endpointsLink).toHaveAttribute('href', '#/endpoints');

    expect(screen.queryByRole('heading', { name: 'Endpoints', level: 1 })).not.toBeInTheDocument();
    endpointsLink.focus();
    expect(endpointsLink).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: 'Endpoints', level: 1 })).toBeInTheDocument();
  });

  it('sets the document title to the current page', async () => {
    render(<App />);
    expect(document.title).toBe('Dashboard — Nexus AI Platform');
    const nav = screen.getByRole('navigation', { name: /primary/i });
    await userEvent.click(within(nav).getByRole('link', { name: 'Reports' }));
    await screen.findByRole('heading', { name: 'Reports', level: 1 });
    expect(document.title).toBe('Reports — Nexus AI Platform');
  });

  it("keeps the request volume chart's rendered SVG unchanged when the mock range toggle is clicked", async () => {
    render(<App />);
    const svgBefore = document.querySelector('svg.recharts-surface')?.outerHTML;
    expect(svgBefore).toBeDefined();

    const fiveMin = screen.getByRole('button', { name: '5m' });
    await userEvent.click(fiveMin);
    expect(fiveMin).toHaveAttribute('aria-pressed', 'true');

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
