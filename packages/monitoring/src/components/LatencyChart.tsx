import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from 'cyberui-2045';
import type { LatencyPoint } from '../data/simulation';
import { useChartColors, chartTooltipProps } from '../theme/chartColors';
import { formatMs } from '../utils/format';

export interface LatencyChartProps {
  data: LatencyPoint[];
}

export function LatencyChart({ data }: LatencyChartProps) {
  const colors = useChartColors();

  return (
    <Card title="Latency percentiles">
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={false} />
            <YAxis tickFormatter={formatMs} stroke={colors.muted} width={56} />
            <Tooltip
              formatter={(value, name) => [formatMs(Number(value)), name]}
              {...chartTooltipProps(colors)}
            />
            <Legend />
            <Line type="monotone" dataKey="p50" name="p50" stroke={colors.success} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="p95" name="p95" stroke={colors.warning} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="p99" name="p99" stroke={colors.error} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
