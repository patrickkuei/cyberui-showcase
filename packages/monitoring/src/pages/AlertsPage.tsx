import { MAX_ALERTS, type Alert } from '../data/simulation';
import { AlertsFeed } from '../components/AlertsFeed';

export interface AlertsPageProps {
  alerts: Alert[];
}

export function AlertsPage({ alerts }: AlertsPageProps) {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Alerts</h1>
        <p className="page-subtitle">Recent notable events across the platform.</p>
      </header>
      <section aria-label="Alerts">
        {/* Show everything the simulation keeps; the page's <h1> names the feed. */}
        <AlertsFeed alerts={alerts} now={Date.now()} limit={MAX_ALERTS} />
      </section>
    </>
  );
}
