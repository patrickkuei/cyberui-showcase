import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionPanel } from './ActionPanel';

describe('ActionPanel', () => {
  it('shows only the static item when there is no incident (Review Focus #2)', () => {
    render(
      <ActionPanel
        incidentKey="healthy"
        headline="All systems operational — no action needed"
        headlineTone="success"
      />,
    );
    expect(screen.queryByText('All systems operational — no action needed')).not.toBeInTheDocument();
    expect(screen.getByText('Model rollout: model-router v2.3.1')).toBeInTheDocument();
  });

  it('shows an action button that becomes an acknowledged state when clicked (Review Focus #5)', async () => {
    render(
      <ActionPanel
        incidentKey="errors"
        headline="Investigating elevated error rate (3.1%)"
        headlineTone="error"
        primaryActionLabel="Acknowledge"
      />,
    );
    const button = screen.getByRole('button', { name: 'Acknowledge' });
    await userEvent.click(button);
    expect(screen.queryByRole('button', { name: 'Acknowledge' })).not.toBeInTheDocument();
    expect(screen.getByText(/Acknowledged/)).toBeInTheDocument();
  });

  it('keeps the acknowledgment when only the headline text changes within the same incident', async () => {
    const { rerender } = render(
      <ActionPanel
        incidentKey="errors"
        headline="Investigating elevated error rate (3.1%)"
        headlineTone="error"
        primaryActionLabel="Acknowledge"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    expect(screen.getByText(/Acknowledged/)).toBeInTheDocument();

    // The live percentage ticks every refresh; that is not a new incident.
    rerender(
      <ActionPanel
        incidentKey="errors"
        headline="Investigating elevated error rate (3.4%)"
        headlineTone="error"
        primaryActionLabel="Acknowledge"
      />,
    );
    expect(screen.getByText('Investigating elevated error rate (3.4%)')).toBeInTheDocument();
    expect(screen.getByText(/Acknowledged/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acknowledge' })).not.toBeInTheDocument();
  });

  it('resets the acknowledged state when a genuinely new incident starts (Review Focus #5)', async () => {
    const { rerender } = render(
      <ActionPanel
        incidentKey="errors"
        headline="Investigating elevated error rate (3.1%)"
        headlineTone="error"
        primaryActionLabel="Acknowledge"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    expect(screen.getByText(/Acknowledged/)).toBeInTheDocument();

    rerender(
      <ActionPanel
        incidentKey="latency"
        headline="Investigating elevated p95 latency (612ms)"
        headlineTone="error"
        primaryActionLabel="Acknowledge"
      />,
    );
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeInTheDocument();
    expect(screen.queryByText(/Acknowledged/)).not.toBeInTheDocument();
  });

  it('omits the action button entirely when no primaryActionLabel is given', () => {
    render(
      <ActionPanel
        incidentKey="healthy"
        headline="All systems operational — no action needed"
        headlineTone="success"
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('tags its card with the action-panel class used by the wide-screen layout', () => {
    const { container } = render(
      <ActionPanel incidentKey="healthy" headline="No action needed." headlineTone="success" />,
    );
    expect(container.querySelector('.action-panel')).not.toBeNull();
  });
});
