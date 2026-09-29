import { useEffect, useState, type ReactNode } from 'react';
import { Badge } from 'cyberui-2045';
import { useSimulatedMetrics } from './data/useSimulatedMetrics';
import { ROUTES, useHashRoute, type Route } from './router/useHashRoute';
import { DashboardPage } from './pages/DashboardPage';
import { EndpointsPage } from './pages/EndpointsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import type { ChartRange } from './components/ChartRangeToggle';
import { BellIcon } from './icons';
import './App.css';

const REFRESH_MS = 2000;

// Record<Route, ...> (here and for the pages below) makes adding a route
// without a label or a page a type error, instead of a blank <main>.
const ROUTE_LABELS: Record<Route, string> = {
  dashboard: 'Dashboard',
  endpoints: 'Endpoints',
  alerts: 'Alerts',
  reports: 'Reports',
};

export default function App() {
  const state = useSimulatedMetrics(REFRESH_MS);
  // Lives here, not in DashboardPage, so the chosen range survives leaving and returning to the Dashboard.
  const [chartRange, setChartRange] = useState<ChartRange>('60s');
  const route = useHashRoute();
  // Same 2% threshold the Error rate tile uses, so badge and tile never disagree.
  const isHealthy = state.errorRatePct <= 2;
  const latestUsage = state.usage[state.usage.length - 1];

  useEffect(() => {
    document.title = `${ROUTE_LABELS[route]} — Nexus AI Platform`;
  }, [route]);

  const pages: Record<Route, () => ReactNode> = {
    dashboard: () => (
      <DashboardPage
        state={state}
        chartRange={chartRange}
        onChartRangeChange={setChartRange}
        refreshMs={REFRESH_MS}
      />
    ),
    endpoints: () => <EndpointsPage endpoints={state.endpoints} />,
    alerts: () => <AlertsPage alerts={state.alerts} />,
    reports: () => (
      <ReportsPage
        requestsPerSec={state.requestsPerSec}
        latestCostPerHr={latestUsage?.costPerHr ?? 0}
        alerts={state.alerts}
        endpoints={state.endpoints}
      />
    ),
  };

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
          {ROUTES.map((itemRoute) => (
            <a
              key={itemRoute}
              href={`#/${itemRoute}`}
              className={route === itemRoute ? 'topnav-link topnav-link--active' : 'topnav-link'}
              aria-current={route === itemRoute ? 'page' : undefined}
            >
              {ROUTE_LABELS[itemRoute]}
            </a>
          ))}
        </div>
        <div className="topnav-status" role="status">
          <span className="live-dot" aria-hidden="true" />
          <Badge variant={isHealthy ? 'success' : 'error'}>
            {isHealthy ? 'All systems operational' : 'Degraded performance'}
          </Badge>
        </div>
        <BellIcon className="topnav-bell" />
      </nav>

      <main className="dashboard-body">{pages[route]()}</main>
    </div>
  );
}
