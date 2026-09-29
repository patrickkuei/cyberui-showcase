import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartRangeToggle } from './ChartRangeToggle';

describe('ChartRangeToggle', () => {
  it('marks the current value as pressed and calls onChange with the clicked value', async () => {
    const onChange = vi.fn();
    render(<ChartRangeToggle value="60s" onChange={onChange} />);

    expect(screen.getByRole('button', { name: '60s' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '5m' })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: '15m' }));
    expect(onChange).toHaveBeenCalledWith('15m');
  });

  it('labels the control as display-only for assistive tech (Review Focus #3)', () => {
    render(<ChartRangeToggle value="60s" onChange={() => {}} />);
    expect(screen.getByRole('group', { name: /display only/i })).toBeInTheDocument();
  });
});
