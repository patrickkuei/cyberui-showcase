import { SectionTitle, Badge } from 'cyberui-2045';
import { useSimulatedMetrics } from './data/useSimulatedMetrics';
import { StatTile } from './components/StatTile';
import { RequestVolumeChart } from './components/RequestVolumeChart';
import { LatencyChart } from './components/LatencyChart';
import { UsageChart } from './components/UsageChart';
import { EndpointTable } from './components/EndpointTable';
import { AlertsFeed } from './components/AlertsFeed';
import { formatCompactNumber, formatMs, formatPercent } from './utils/format';
import './App.css';

const REFRESH_MS = 2000;

export default function App() {
  const state = useSimulatedMetrics(REFRESH_MS);
  // Same 2% threshold the Error rate tile uses, so badge and tile never disagree.
  const isHealthy = state.errorRatePct <= 2;

  return (
    <div className="dashboard">
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
          <StatTile label="Requests/sec" value={formatCompactNumber(state.requestsPerSec)} />
          <StatTile
            label="p95 latency"
            value={formatMs(state.p95LatencyMs)}
            tone={state.p95LatencyMs > 500 ? 'warning' : 'default'}
          />
          <StatTile
            label="Error rate"
            value={formatPercent(state.errorRatePct)}
            tone={state.errorRatePct > 2 ? 'error' : 'success'}
          />
          <StatTile label="Active sessions" value={formatCompactNumber(state.activeSessions)} />
        </section>

        <section className="chart-grid" aria-label="Trends">
          <div className="chart-cell chart-cell--primary">
            <RequestVolumeChart data={state.requestVolume} range="60s" onRangeChange={() => {}} />
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
