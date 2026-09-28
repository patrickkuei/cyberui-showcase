import type { ReactNode } from 'react';
import { Card, Timeline } from 'cyberui-2045';
import type { TimelineEvent } from 'cyberui-2045';
import type { Alert } from '../data/simulation';
import { formatRelativeTime } from '../utils/format';

export interface AlertsFeedProps {
  alerts: Alert[];
  now: number;
  limit?: number;
  /** Optional card heading; omit it when the surrounding page already names the feed. */
  title?: string;
}

const SEVERITY_TO_STATUS: Record<Alert['severity'], NonNullable<TimelineEvent['status']>> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

/** How many of the most recent alerts the card shows (the simulation keeps more in memory). */
const VISIBLE_ALERTS = 8;

/** TimelineEvent with ReactNode title for rendering rich alert text. */
type AlertTimelineEvent = Omit<TimelineEvent, 'title'> & { title: ReactNode };

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

export function AlertsFeed({ alerts, now, limit = VISIBLE_ALERTS, title }: AlertsFeedProps) {
  const events: AlertTimelineEvent[] = alerts.slice(0, limit).map((alert) => ({
    title: renderTitle(alert),
    time: formatRelativeTime(alert.timestamp, now),
    status: SEVERITY_TO_STATUS[alert.severity],
  }));

  return (
    <Card title={title}>
      <Timeline events={events as unknown as TimelineEvent[]} size="sm" />
    </Card>
  );
}
