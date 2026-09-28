import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EndpointsPage } from './EndpointsPage';

const ENDPOINTS = [{ name: '/v1/chat/completions', requests: 1280, avgLatencyMs: 145, errorRatePct: 0.6 }];

describe('EndpointsPage', () => {
  it('renders the page title and the endpoint table', () => {
    render(<EndpointsPage endpoints={ENDPOINTS} />);
    // Disambiguated from EndpointTable's own "Endpoints" card title (an <h3>) via role/level.
    expect(screen.getByRole('heading', { level: 1, name: 'Endpoints' })).toBeInTheDocument();
    expect(screen.getByText('/v1/chat/completions')).toBeInTheDocument();
  });
});
