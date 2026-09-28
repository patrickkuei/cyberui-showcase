import { useState } from 'react';
import { Card, Button, Table } from 'cyberui-2045';
import type { TableColumn } from 'cyberui-2045';
import type { Alert } from '../data/simulation';
import { formatCompactNumber, formatRelativeTime } from '../utils/format';

export interface ReportsPageProps {
  requestsPerSec: number;
  latestCostPerHr: number;
  alerts: Alert[];
}

const AUDIT_LIMIT = 20;

const AUDIT_COLUMNS: TableColumn<Alert>[] = [
  { key: 'timestamp', header: 'Time', render: (row) => formatRelativeTime(row.timestamp, Date.now()) },
  { key: 'message', header: 'Event' },
  { key: 'severity', header: 'Severity', align: 'right', render: (row) => row.severity.toUpperCase() },
];

export function ReportsPage({ requestsPerSec, latestCostPerHr, alerts }: ReportsPageProps) {
  const [exported, setExported] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const estimatedDailyRequests = requestsPerSec * 60 * 60 * 24;
  const estimatedDailyCost = latestCostPerHr * 24;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Usage and audit exports for finance and compliance.</p>
      </header>

      <section aria-label="Usage report">
        <Card title="Usage report">
          <div className="report-stats">
            <div className="report-stat">
              <span className="report-stat-label">Requests (est., 24h)</span>
              <span className="report-stat-value">{formatCompactNumber(estimatedDailyRequests)}</span>
            </div>
            <div className="report-stat">
              <span className="report-stat-label">Cost (est., 24h)</span>
              <span className="report-stat-value">${estimatedDailyCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="report-card-footer">
            {!exported ? (
              <Button variant="secondary" size="sm" onClick={() => setExported(true)}>
                Export CSV
              </Button>
            ) : (
              <span className="report-export-done">Exported</span>
            )}
          </div>
        </Card>
      </section>

      <section aria-label="Audit log">
        <Card title="Audit log">
          <Table
            columns={AUDIT_COLUMNS}
            data={alerts.slice(0, AUDIT_LIMIT)}
            getRowId={(row) => row.id}
            caption={`${Math.min(alerts.length, AUDIT_LIMIT)} of ${alerts.length} logged events`}
          />
          <div className="report-card-footer">
            {!downloaded ? (
              <Button variant="secondary" size="sm" onClick={() => setDownloaded(true)}>
                Download
              </Button>
            ) : (
              <span className="report-export-done">Downloaded</span>
            )}
          </div>
        </Card>
      </section>
    </>
  );
}
