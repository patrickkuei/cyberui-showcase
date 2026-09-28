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

export function AlertsFeed({ alerts, now }: AlertsFeedProps) {
  const events: TimelineEvent[] = alerts.map((alert) => ({
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
