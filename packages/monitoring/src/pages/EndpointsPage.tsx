import type { EndpointStats } from '../data/simulation';
import { EndpointTable } from '../components/EndpointTable';
import { EndpointRequestsChart } from '../components/EndpointRequestsChart';
import { StatTile } from '../components/StatTile';
import { ActivityIcon, ClockIcon, AlertTriangleIcon, ServerIcon } from '../icons';
import { formatCompactNumber, formatMs, formatPercent } from '../utils/format';

export interface EndpointsPageProps {
  endpoints: EndpointStats[];
}

export function EndpointsPage({ endpoints }: EndpointsPageProps) {
  const totalRequests = endpoints.reduce((sum, e) => sum + e.requests, 0);
  const avgLatencyMs =
    totalRequests > 0 ? endpoints.reduce((sum, e) => sum + e.avgLatencyMs * e.requests, 0) / totalRequests : 0;
  const errorRatePct =
    totalRequests > 0 ? endpoints.reduce((sum, e) => sum + e.errorRatePct * e.requests, 0) / totalRequests : 0;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Endpoints</h1>
        <p className="page-subtitle">Request volume, latency, and error rate per route.</p>
      </header>

      <section className="stat-row" aria-label="Endpoint summary">
        <StatTile label="Endpoints monitored" value={String(endpoints.length)} icon={<ServerIcon />} />
        <StatTile label="Total requests" value={formatCompactNumber(totalRequests)} icon={<ActivityIcon />} />
        <StatTile label="Avg latency" value={formatMs(avgLatencyMs)} icon={<ClockIcon />} />
        <StatTile
          label="Overall error rate"
          value={formatPercent(errorRatePct)}
          tone={errorRatePct > 2 ? 'error' : 'success'}
          icon={<AlertTriangleIcon />}
        />
      </section>

      <section aria-label="Endpoints">
        <EndpointTable endpoints={endpoints} />
      </section>

      <section aria-label="Requests distribution">
        <EndpointRequestsChart endpoints={endpoints} />
      </section>
    </>
  );
}
