import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'cyberui-2045';
import type { UsagePoint } from '../data/simulation';
import { useChartColors, chartTooltipProps } from '../theme/chartColors';
import { formatCompactNumber, formatCurrencyPerHour } from '../utils/format';

export interface UsageChartProps {
  data: UsagePoint[];
}

export function UsageChart({ data }: UsageChartProps) {
  const colors = useChartColors();
  const latest = data[data.length - 1];

  return (
    <Card variant="default" className="panel-surface">
      <h3 className="panel-title">Token usage</h3>
      {latest && (
        <p style={{ margin: '0 0 0.5rem', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          {formatCurrencyPerHour(latest.costPerHr)} at current rate
        </p>
      )}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={false} />
            <YAxis tickFormatter={formatCompactNumber} stroke={colors.muted} width={48} />
            <Tooltip
              formatter={(value) => [formatCompactNumber(Number(value)), 'tokens/min']}
              {...chartTooltipProps(colors)}
            />
            <Bar dataKey="tokensPerMin" fill={colors.accent} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
