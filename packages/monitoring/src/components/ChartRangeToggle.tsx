export type ChartRange = '60s' | '5m' | '15m';

export interface ChartRangeToggleProps {
  value: ChartRange;
  onChange: (value: ChartRange) => void;
}

const RANGES: ChartRange[] = ['60s', '5m', '15m'];

export function ChartRangeToggle({ value, onChange }: ChartRangeToggleProps) {
  return (
    <div className="range-toggle" role="group" aria-label="Chart time range (display only in this demo)">
      {RANGES.map((range) => {
        const active = range === value;
        return (
          <button
            key={range}
            type="button"
            className={active ? 'range-toggle-btn range-toggle-btn--active' : 'range-toggle-btn'}
            aria-pressed={active}
            onClick={() => onChange(range)}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}
