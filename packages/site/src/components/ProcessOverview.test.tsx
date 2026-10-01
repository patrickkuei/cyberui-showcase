import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ProcessOverview } from './ProcessOverview';
import { PROCESS_STAGES } from '../content/processStages';

describe('ProcessOverview', () => {
  it('shows one numbered segment per stage', () => {
    render(<ProcessOverview stages={PROCESS_STAGES} />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(10);
    expect(items[0]).toHaveTextContent('01');
    expect(items[9]).toHaveTextContent('10');
  });

  it('marks the included stages without relying on color alone', () => {
    render(<ProcessOverview stages={PROCESS_STAGES} />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    const included = items.filter((li) => li.getAttribute('data-owner') === 'library');
    expect(included).toHaveLength(4);
    // Each segment carries its stage, title and owner as text for assistive tech.
    expect(items[4]).toHaveTextContent('Stage 5: Visual Direction, Included');
    expect(items[0]).toHaveTextContent('Stage 1: Discovery, Your decision');
  });

  it('explains both kinds of segment in a legend', () => {
    const { container } = render(<ProcessOverview stages={PROCESS_STAGES} />);
    const legend = container.querySelector('.process-overview-legend') as HTMLElement;
    expect(within(legend).getByText('Your decision')).toBeInTheDocument();
    expect(within(legend).getByText('Included')).toBeInTheDocument();
  });
});
