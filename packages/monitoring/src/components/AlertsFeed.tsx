import { Card, Timeline } from 'cyberui-2045';
import type { TimelineEvent } from 'cyberui-2045';
import type { Alert } from '../data/simulation';
import { formatRelativeTime } from '../utils/format';

export interface AlertsFeedProps {
  alerts: Alert[];
  now: number;
}

const SEVERITY_TO_STATUS: Record<Alert['severity'], NonNullable<TimelineEvent['status']>> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

/** How many of the most recent alerts the card shows (the simulation keeps more in memory). */
const VISIBLE_ALERTS = 8;

export function AlertsFeed({ alerts, now }: AlertsFeedProps) {
  const events: TimelineEvent[] = alerts.slice(0, VISIBLE_ALERTS).map((alert) => ({
    title: alert.message,
    time: formatRelativeTime(alert.timestamp, now),
    status: SEVERITY_TO_STATUS[alert.severity],
  }));

  return (
    <Card title="Alerts">
      <Timeline events={events} size="sm" />
    </Card>
  );
}
