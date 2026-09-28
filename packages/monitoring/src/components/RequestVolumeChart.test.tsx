import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequestVolumeChart } from './RequestVolumeChart';

const DATA = [
  { t: 1, value: 100 },
  { t: 2, value: 150 },
  { t: 3, value: 200 },
];

describe('RequestVolumeChart', () => {
  it('renders a non-empty chart for the given data (Review Focus #4, original plan)', () => {
    const { container } = render(<RequestVolumeChart data={DATA} range="60s" onRangeChange={() => {}} />);
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(svg?.getAttribute('height'))).toBeGreaterThan(0);
  });

  it('renders the range toggle and forwards range changes without altering the chart data (Review Focus #3)', () => {
    const onRangeChange = vi.fn();
    const { rerender, container } = render(<RequestVolumeChart data={DATA} range="60s" onRangeChange={onRangeChange} />);
    const svgBefore = container.querySelector('svg.recharts-surface')?.outerHTML;

    screen.getByRole('button', { name: '5m' }).click();
    expect(onRangeChange).toHaveBeenCalledWith('5m');

    rerender(<RequestVolumeChart data={DATA} range="5m" onRangeChange={onRangeChange} />);
    const svgAfter = container.querySelector('svg.recharts-surface')?.outerHTML;
    expect(svgAfter).toBe(svgBefore);
  });
});
