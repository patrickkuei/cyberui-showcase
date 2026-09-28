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

  const previousRequestRate = state.requestVolume[state.requestVolume.length - 2]?.value ?? state.requestsPerSec;
  const requestTrend = describeRequestRate(state.requestsPerSec, previousRequestRate);
  const latencyTrend = describeLatency(state.p95LatencyMs);
  const errorTrend = describeErrorRate(state.errorRatePct);

  const actionHeadline = isHealthy
    ? 'No action needed. Every metric is within its threshold.'
    : `Investigating elevated error rate (${formatPercent(state.errorRatePct)})`;
  const actionTone: 'success' | 'error' = isHealthy ? 'success' : 'error';

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
            headline={actionHeadline}
            headlineTone={actionTone}
            primaryActionLabel={isHealthy ? undefined : 'Acknowledge'}
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
