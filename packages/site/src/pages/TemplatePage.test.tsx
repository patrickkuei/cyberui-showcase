import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplatePage } from './TemplatePage';

describe('TemplatePage', () => {
  it('shows the live preview iframe by default', () => {
    render(<TemplatePage slug="monitoring" />);
    const frame = screen.getByTitle('AI Product Monitoring live preview');
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveAttribute('src', './live/monitoring/index.html');
  });

  it('switches to the Code tab and shows a snippet', async () => {
    render(<TemplatePage slug="monitoring" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Code' }));
    expect(screen.getByText('Bounded random walk — src/data/simulation.ts')).toBeInTheDocument();
  });

  it('switches to the Case Study tab and shows the problem statement', async () => {
    render(<TemplatePage slug="monitoring" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Case Study' }));
    expect(screen.getByText(/A team shipping an AI product/)).toBeInTheDocument();
  });

  it('shows a fallback for an unknown template slug', () => {
    render(<TemplatePage slug="nonexistent" />);
    expect(screen.getByText('No template named "nonexistent" yet.')).toBeInTheDocument();
  });

  it('links back to the templates index, not home', () => {
    render(<TemplatePage slug="monitoring" />);
    expect(screen.getByRole('link', { name: 'All templates' })).toHaveAttribute('href', '#/templates');
  });

  it('shows a not-yet-built message for a template that exists but has not shipped', () => {
    render(<TemplatePage slug="agent-panel" />);
    expect(screen.getByText(/isn't built yet/)).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
