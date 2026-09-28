import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageChart } from './UsageChart';

const DATA = [
  { t: 1, tokensPerMin: 18000, costPerHr: 6.4 },
  { t: 2, tokensPerMin: 19500, costPerHr: 6.9 },
];

describe('UsageChart', () => {
  it('renders a non-empty chart and the latest hourly cost (Review Focus #4)', () => {
    const { container } = render(<UsageChart data={DATA} />);
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
    expect(screen.getByText('$6.90/hr at current rate')).toBeInTheDocument();
  });
});
