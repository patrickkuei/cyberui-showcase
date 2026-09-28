import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RequestVolumeChart } from './RequestVolumeChart';

const DATA = [
  { t: 1, value: 100 },
  { t: 2, value: 150 },
  { t: 3, value: 200 },
];

describe('RequestVolumeChart', () => {
  it('renders a non-empty chart for the given data (Review Focus #4)', () => {
    const { container } = render(<RequestVolumeChart data={DATA} />);
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(svg?.getAttribute('height'))).toBeGreaterThan(0);
  });
});
