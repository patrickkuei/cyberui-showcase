import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionPanel } from './ActionPanel';

describe('ActionPanel', () => {
  it('renders the headline', () => {
    render(<ActionPanel headline="All systems operational — no action needed" headlineTone="success" />);
    expect(screen.getByText('All systems operational — no action needed')).toBeInTheDocument();
  });

  it('shows an action button that becomes an acknowledged state when clicked (Review Focus #5)', async () => {
    render(
      <ActionPanel
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

  it('resets the acknowledged state when the headline changes (Review Focus #5)', async () => {
    const { rerender } = render(
      <ActionPanel headline="Investigating elevated error rate (3.1%)" headlineTone="error" primaryActionLabel="Acknowledge" />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    expect(screen.getByText(/Acknowledged/)).toBeInTheDocument();

    rerender(
      <ActionPanel headline="Investigating a new latency spike" headlineTone="error" primaryActionLabel="Acknowledge" />,
    );
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeInTheDocument();
  });

  it('omits the action button entirely when no primaryActionLabel is given', () => {
    render(<ActionPanel headline="All systems operational — no action needed" headlineTone="success" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
