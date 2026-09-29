import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LatencyChart } from './LatencyChart';

const DATA = [
  { t: 1, p50: 60, p95: 200, p99: 380 },
  { t: 2, p50: 65, p95: 210, p99: 390 },
];

describe('LatencyChart', () => {
  it('renders a non-empty chart with p50/p95/p99 series (Review Focus #4)', () => {
    const { container } = render(<LatencyChart data={DATA} />);
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
    expect(screen.getByText('p50')).toBeInTheDocument();
    expect(screen.getByText('p95')).toBeInTheDocument();
    expect(screen.getByText('p99')).toBeInTheDocument();
  });
});
