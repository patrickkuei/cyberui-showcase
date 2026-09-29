import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'cyberui-2045';
import type { EndpointStats } from '../data/simulation';
import { useChartColors, chartTooltipProps } from '../theme/chartColors';
import { formatCompactNumber } from '../utils/format';

export interface EndpointRequestsChartProps {
  endpoints: EndpointStats[];
}

export function EndpointRequestsChart({ endpoints }: EndpointRequestsChartProps) {
  const colors = useChartColors();

  return (
    <Card title="Requests by endpoint" className="panel-surface">
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={endpoints} margin={{ bottom: 24 }}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              stroke={colors.muted}
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={70}
            />
            <YAxis tickFormatter={formatCompactNumber} stroke={colors.muted} width={48} />
            <Tooltip
              formatter={(value) => [formatCompactNumber(Number(value)), 'requests']}
              {...chartTooltipProps(colors)}
            />
            <Bar dataKey="requests" fill={colors.secondary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
