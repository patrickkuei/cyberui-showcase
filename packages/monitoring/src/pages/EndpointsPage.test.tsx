import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EndpointsPage } from './EndpointsPage';

const ENDPOINTS = [{ name: '/v1/chat/completions', requests: 1280, avgLatencyMs: 145, errorRatePct: 0.6 }];

describe('EndpointsPage', () => {
  it('renders the page title and the endpoint table', () => {
    render(<EndpointsPage endpoints={ENDPOINTS} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Endpoints' })).toBeInTheDocument();
    expect(screen.getByText('/v1/chat/completions')).toBeInTheDocument();
  });

  it('shows the page title once, without a card title repeating it', () => {
    render(<EndpointsPage endpoints={ENDPOINTS} />);
    expect(screen.getAllByRole('heading', { name: 'Endpoints' })).toHaveLength(1);
  });
});
