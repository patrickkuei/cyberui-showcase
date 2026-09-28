import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EndpointTable } from './EndpointTable';

const ENDPOINTS = [
  { name: '/v1/chat/completions', requests: 1280, avgLatencyMs: 145, errorRatePct: 0.6 },
  { name: '/v1/embeddings', requests: 640, avgLatencyMs: 60, errorRatePct: 0.1 },
];

describe('EndpointTable', () => {
  it('renders one row per endpoint with formatted values', () => {
    render(<EndpointTable endpoints={ENDPOINTS} />);
    expect(screen.getByText('/v1/chat/completions')).toBeInTheDocument();
    expect(screen.getByText('1.3K')).toBeInTheDocument();
    expect(screen.getByText('145 ms')).toBeInTheDocument();
    expect(screen.getByText('0.6%')).toBeInTheDocument();
  });
});
