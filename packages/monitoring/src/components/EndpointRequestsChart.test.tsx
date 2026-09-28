import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EndpointRequestsChart } from './EndpointRequestsChart';

const ENDPOINTS = [
  { name: '/v1/chat/completions', requests: 1800, avgLatencyMs: 320, errorRatePct: 0.5 },
  { name: '/v1/embeddings', requests: 1100, avgLatencyMs: 90, errorRatePct: 0.2 },
];

describe('EndpointRequestsChart', () => {
  it('renders a non-empty chart for the given endpoints (Review Focus #4)', () => {
    const { container } = render(<EndpointRequestsChart endpoints={ENDPOINTS} />);
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(svg?.getAttribute('height'))).toBeGreaterThan(0);
  });
});
