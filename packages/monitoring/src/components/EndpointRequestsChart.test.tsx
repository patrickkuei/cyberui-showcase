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

  it('renders every endpoint name as an x-axis tick, even with 4 endpoints on a narrow chart (Review Focus #4)', () => {
    // Regression for the whole-branch review finding: Recharts' automatic tick interval
    // was dropping 2 of 4 endpoint-name labels at mobile widths. interval={0} forces all
    // of them to render regardless of the measured/available width.
    const fourEndpoints = [
      { name: '/v1/chat/completions', requests: 1800, avgLatencyMs: 320, errorRatePct: 0.5 },
      { name: '/v1/embeddings', requests: 1100, avgLatencyMs: 90, errorRatePct: 0.2 },
      { name: '/v1/images/generate', requests: 240, avgLatencyMs: 850, errorRatePct: 0.8 },
      { name: '/v1/models', requests: 600, avgLatencyMs: 40, errorRatePct: 0.05 },
    ];
    const { container } = render(<EndpointRequestsChart endpoints={fourEndpoints} />);
    // Scoped to the x-axis's own tick-labels layer: the y-axis renders its own tick-value
    // text nodes (formatted request counts) in a sibling layer, which an unscoped query
    // would also match.
    const tickLabels = Array.from(
      container.querySelectorAll('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value'),
    ).map((node) => node.textContent);
    expect(tickLabels).toEqual([
      '/v1/chat/completions',
      '/v1/embeddings',
      '/v1/images/generate',
      '/v1/models',
    ]);
  });
});
