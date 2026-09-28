import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportsPage } from './ReportsPage';

const ALERTS = [
  { id: '1', severity: 'critical' as const, message: 'Error rate above threshold on us-east-1', timestamp: Date.now() - 30_000 },
  { id: '2', severity: 'info' as const, message: 'Deploy completed: model-router v2.3.1', timestamp: Date.now() - 5 * 60_000 },
];

describe('ReportsPage', () => {
  it('renders a usage estimate and an audit log row per alert', () => {
    render(<ReportsPage requestsPerSec={420} latestCostPerHr={6.3} alerts={ALERTS} />);
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Error rate above threshold on us-east-1')).toBeInTheDocument();
    expect(screen.getByText('Deploy completed: model-router v2.3.1')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('gives visible feedback when the mock export buttons are clicked (Review Focus #4)', async () => {
    render(<ReportsPage requestsPerSec={420} latestCostPerHr={6.3} alerts={ALERTS} />);
    const exportButton = screen.getByRole('button', { name: 'Export CSV' });
    await userEvent.click(exportButton);
    expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument();
    expect(screen.getByText('Exported')).toBeInTheDocument();

    const downloadButton = screen.getByRole('button', { name: 'Download' });
    await userEvent.click(downloadButton);
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    expect(screen.getByText('Downloaded')).toBeInTheDocument();
  });
});
