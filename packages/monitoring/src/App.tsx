import { useState } from 'react';
import { SectionTitle, Badge } from 'cyberui-2045';
import { useSimulatedMetrics } from './data/useSimulatedMetrics';
import { StatTile } from './components/StatTile';
import { RequestVolumeChart } from './components/RequestVolumeChart';
import { LatencyChart } from './components/LatencyChart';
import { UsageChart } from './components/UsageChart';
import { EndpointTable } from './components/EndpointTable';
import { AlertsFeed } from './components/AlertsFeed';
import { ActionPanel } from './components/ActionPanel';
import type { ChartRange } from './components/ChartRangeToggle';
import { ActivityIcon, ClockIcon, AlertTriangleIcon, UsersIcon, BellIcon } from './icons';
import { describeRequestRate, describeLatency, describeErrorRate } from './utils/trend';
import { formatCompactNumber, formatMs, formatPercent } from './utils/format';
import './App.css';

const REFRESH_MS = 2000;

// Only "Dashboard" exists in this demo; the rest are rendered inert (span + aria-disabled),
// not as buttons or links that would go nowhere.
const NAV_ITEMS = ['Dashboard', 'Endpoints', 'Alerts', 'Settings'] as const;

export default function App() {
  const state = useSimulatedMetrics(REFRESH_MS);
  const [chartRange, setChartRange] = useState<ChartRange>('60s');
  // Same 2% threshold the Error rate tile uses, so badge and tile never disagree.
  const isHealthy = state.errorRatePct <= 2;

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
    <div className="dashboard">
      <nav className="topnav" aria-label="Primary">
        <div className="topnav-brand">
          <span className="topnav-logo" aria-hidden="true">
            ⬡
          </span>
          <span className="topnav-name">Nexus</span>
        </div>
        <div className="topnav-links">
          {NAV_ITEMS.map((item) =>
            item === 'Dashboard' ? (
              <span key={item} className="topnav-link topnav-link--active" aria-current="page">
                {item}
              </span>
            ) : (
              <span key={item} className="topnav-link" aria-disabled="true">
                {item}
              </span>
            ),
          )}
        </div>
        <BellIcon className="topnav-bell" />
      </nav>

      <header className="dashboard-header">
        <div className="dashboard-heading">
          <h1 className="dashboard-title">Nexus AI Platform</h1>
          <p className="dashboard-live">
            <span className="live-dot" aria-hidden="true" />
            Live, refreshing every {REFRESH_MS / 1000} seconds
          </p>
        </div>
        <div className="dashboard-status" role="status">
          <Badge variant={isHealthy ? 'success' : 'error'}>
            {isHealthy ? 'All systems operational' : 'Degraded performance'}
          </Badge>
        </div>
      </header>

      <SectionTitle size="sm" className="dashboard-scope">
        Production inference API
      </SectionTitle>

      <main className="dashboard-body">
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
            <RequestVolumeChart data={state.requestVolume} range={chartRange} onRangeChange={setChartRange} />
          </div>
          <div className="chart-cell">
            <LatencyChart data={state.latencyPercentiles} />
          </div>
          <div className="chart-cell">
            <UsageChart data={state.usage} />
          </div>
        </section>

        <section className="lower-grid" aria-label="Endpoints and alerts">
          <div className="lower-cell">
            <EndpointTable endpoints={state.endpoints} />
          </div>
          <div className="lower-cell">
            <AlertsFeed alerts={state.alerts} now={Date.now()} />
          </div>
        </section>
      </main>
    </div>
  );
}
