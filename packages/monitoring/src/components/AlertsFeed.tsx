import type { ReactNode } from 'react';
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

function renderTitle(alert: Alert): ReactNode {
  if (!alert.highlight || !alert.message.includes(alert.highlight)) {
    return alert.message;
  }
  const index = alert.message.indexOf(alert.highlight);
  const before = alert.message.slice(0, index);
  const after = alert.message.slice(index + alert.highlight.length);
  return (
    <>
      {before}
      <strong>{alert.highlight}</strong>
      {after}
    </>
  );
}

export function AlertsFeed({ alerts, now }: AlertsFeedProps) {
  const events = alerts.slice(0, VISIBLE_ALERTS).map((alert) => ({
    title: renderTitle(alert),
    time: formatRelativeTime(alert.timestamp, now),
    status: SEVERITY_TO_STATUS[alert.severity],
  })) as unknown as TimelineEvent[];

  return (
    <Card title="Alerts">
      <Timeline events={events} size="sm" />
    </Card>
  );
}
