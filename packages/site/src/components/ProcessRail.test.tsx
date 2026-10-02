import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProcessRail } from './ProcessRail';
import { PROCESS_STAGES } from '../content/processStages';

const rail = (container: HTMLElement) => container.querySelector('ol.process-rail') as HTMLElement;

describe('ProcessRail', () => {
  it('renders ten items, hidden from assistive tech', () => {
    const { container } = render(<ProcessRail stages={PROCESS_STAGES} current={null} visible={false} />);
    expect(rail(container).querySelectorAll('li')).toHaveLength(10);
    expect(rail(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks exactly the current stage, and none when current is null', () => {
    const { container, rerender } = render(<ProcessRail stages={PROCESS_STAGES} current={3} visible />);
    const marked = () => [...rail(container).querySelectorAll('li[data-current="true"]')].map((li) => li.textContent);
    expect(marked()).toEqual(['03']);
    rerender(<ProcessRail stages={PROCESS_STAGES} current={null} visible />);
    expect(marked()).toEqual([]);
  });

  it('follows the visible prop', () => {
    const { container, rerender } = render(<ProcessRail stages={PROCESS_STAGES} current={null} visible={false} />);
    expect(rail(container)).toHaveAttribute('data-visible', 'false');
    rerender(<ProcessRail stages={PROCESS_STAGES} current={null} visible />);
    expect(rail(container)).toHaveAttribute('data-visible', 'true');
  });

  it('flags the four library-owned stages', () => {
    const { container } = render(<ProcessRail stages={PROCESS_STAGES} current={null} visible />);
    expect(rail(container).querySelectorAll('li[data-owner="library"]')).toHaveLength(4);
  });
});
