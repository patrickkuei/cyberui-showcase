import type { DashboardState } from '../data/simulation';
import { StatTile } from '../components/StatTile';
import { RequestVolumeChart } from '../components/RequestVolumeChart';
import { LatencyChart } from '../components/LatencyChart';
import { UsageChart } from '../components/UsageChart';
import { ActionPanel } from '../components/ActionPanel';
import type { ChartRange } from '../components/ChartRangeToggle';
import { ActivityIcon, ClockIcon, AlertTriangleIcon, UsersIcon } from '../icons';
import { describeRequestRate, describeLatency, describeErrorRate } from '../utils/trend';
import { formatCompactNumber, formatMs, formatPercent } from '../utils/format';

export interface DashboardPageProps {
  state: DashboardState;
  chartRange: ChartRange;
  onChartRangeChange: (range: ChartRange) => void;
  /** The live refresh interval, so the subtitle can't drift from the real one. */
  refreshMs: number;
}

export function DashboardPage({ state, chartRange, onChartRangeChange, refreshMs }: DashboardPageProps) {
  // requestVolume's last point is the current value, so the baseline is the 5 points before it.
  const recentRequestRates = state.requestVolume.slice(-6, -1).map((p) => p.value);
  const requestTrend = describeRequestRate(state.requestsPerSec, recentRequestRates);
  const latencyTrend = describeLatency(state.p95LatencyMs);
  const errorTrend = describeErrorRate(state.errorRatePct);

  // The action panel watches both alarms, using the same thresholds as the stat tiles.
  // incidentKey stays stable while an incident continues, so an acknowledgment
  // survives the headline's live number ticking on every refresh.
  const hasErrorIncident = state.errorRatePct > 2;
  const hasLatencyIncident = state.p95LatencyMs > 500;
  const actionIncidentKey = hasErrorIncident ? 'errors' : hasLatencyIncident ? 'latency' : 'healthy';
  const actionHeadline =
    actionIncidentKey === 'errors'
      ? `Investigating elevated error rate (${formatPercent(state.errorRatePct)})`
      : actionIncidentKey === 'latency'
        ? `Investigating elevated p95 latency (${formatMs(state.p95LatencyMs)})`
        : 'No action needed. Every metric is within its threshold.';
  const actionTone: 'success' | 'error' = actionIncidentKey === 'healthy' ? 'success' : 'error';

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{`Production inference API, updated live every ${refreshMs / 1000} seconds.`}</p>
      </header>

      <section className="stat-row" aria-label="Key metrics">
        <StatTile
          label="Requests/sec"
          value={formatCompactNumber(state.requestsPerSec)}
          icon={<ActivityIcon />}
          status={requestTrend.text}
          statusTone={requestTrend.tone}
        />
        <StatTile
          label="p95 latency"
          value={formatMs(state.p95LatencyMs)}
          tone={state.p95LatencyMs > 500 ? 'warning' : 'default'}
          icon={<ClockIcon />}
          status={latencyTrend.text}
          statusTone={latencyTrend.tone}
        />
        <StatTile
          label="Error rate"
          value={formatPercent(state.errorRatePct)}
          tone={state.errorRatePct > 2 ? 'error' : 'success'}
          icon={<AlertTriangleIcon />}
          status={errorTrend.text}
          statusTone={errorTrend.tone}
        />
        <StatTile
          label="Active sessions"
          value={formatCompactNumber(state.activeSessions)}
          icon={<UsersIcon />}
          status="within normal range"
          statusTone="default"
        />
      </section>

      <section className="action-row" aria-label="Recommended actions">
        <ActionPanel
          incidentKey={actionIncidentKey}
          headline={actionHeadline}
          headlineTone={actionTone}
          primaryActionLabel={actionIncidentKey === 'healthy' ? undefined : 'Acknowledge'}
        />
      </section>

      <section className="chart-grid" aria-label="Trends">
        <div className="chart-cell chart-cell--primary">
          <RequestVolumeChart data={state.requestVolume} range={chartRange} onRangeChange={onChartRangeChange} />
        </div>
        <div className="chart-cell">
          <LatencyChart data={state.latencyPercentiles} />
        </div>
        <div className="chart-cell">
          <UsageChart data={state.usage} />
        </div>
      </section>
    </>
  );
}
