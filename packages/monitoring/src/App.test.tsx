import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the dashboard header, stat tiles, and panel titles', () => {
    render(<App />);

    expect(screen.getByText('Nexus AI Platform')).toBeInTheDocument();
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('p95 latency')).toBeInTheDocument();
    // "Error rate" is both a stat tile label and the endpoint table's column header.
    expect(screen.getAllByText('Error rate')).toHaveLength(2);
    expect(screen.getByText('Active sessions')).toBeInTheDocument();
    expect(screen.getByText('Endpoints')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });
});
