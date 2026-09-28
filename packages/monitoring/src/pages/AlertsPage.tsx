import { MAX_ALERTS, type Alert } from '../data/simulation';
import { AlertsFeed } from '../components/AlertsFeed';
import { StatTile } from '../components/StatTile';
import { ActivityIcon } from '../icons';

export interface AlertsPageProps {
  alerts: Alert[];
}

export function AlertsPage({ alerts }: AlertsPageProps) {
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;
  const infoCount = alerts.filter((a) => a.severity === 'info').length;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Alerts</h1>
        <p className="page-subtitle">Recent notable events across the platform.</p>
      </header>

      <section className="stat-row" aria-label="Alert summary">
        <StatTile label="Total alerts" value={String(alerts.length)} icon={<ActivityIcon />} />
        <StatTile
          label="Critical"
          value={String(criticalCount)}
          tone={criticalCount > 0 ? 'error' : 'default'}
        />
        <StatTile
          label="Warning"
          value={String(warningCount)}
          tone={warningCount > 0 ? 'warning' : 'default'}
        />
        <StatTile label="Info" value={String(infoCount)} />
      </section>

      <section aria-label="Alerts">
        {/* Show everything the simulation keeps; the page's <h1> names the feed. */}
        <AlertsFeed alerts={alerts} now={Date.now()} limit={MAX_ALERTS} />
      </section>
    </>
  );
}
