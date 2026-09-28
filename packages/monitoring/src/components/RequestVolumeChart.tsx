import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'cyberui-2045';
import type { MetricPoint } from '../data/simulation';
import { useChartColors, chartTooltipProps } from '../theme/chartColors';
import { formatCompactNumber } from '../utils/format';

export interface RequestVolumeChartProps {
  data: MetricPoint[];
}

export function RequestVolumeChart({ data }: RequestVolumeChartProps) {
  const colors = useChartColors();

  return (
    <Card title="Request volume">
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
            <Area type="monotone" dataKey="value" stroke={colors.secondary} fill={colors.secondary} fillOpacity={0.25} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
