import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'cyberui-2045';
import type { MetricPoint } from '../data/simulation';
import { useChartColors, chartTooltipProps } from '../theme/chartColors';
import { formatCompactNumber } from '../utils/format';
import { ChartRangeToggle, type ChartRange } from './ChartRangeToggle';

export interface RequestVolumeChartProps {
  data: MetricPoint[];
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
}

export function RequestVolumeChart({ data, range, onRangeChange }: RequestVolumeChartProps) {
  const colors = useChartColors();

  return (
    <Card variant="default">
      <div className="chart-card-header">
        <h3 className="panel-title">Request volume</h3>
        <ChartRangeToggle value={range} onChange={onRangeChange} />
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={false} />
            <YAxis tickFormatter={formatCompactNumber} stroke={colors.muted} width={48} />
            <Tooltip
              formatter={(value) => [formatCompactNumber(Number(value)), 'req/s']}
              {...chartTooltipProps(colors)}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.secondary}
              fill={colors.secondary}
              fillOpacity={0.25}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
