import { useState } from 'react';
import { Card, Button, Table } from 'cyberui-2045';
import type { TableColumn } from 'cyberui-2045';
import { MAX_ALERTS, type Alert, type EndpointStats } from '../data/simulation';
import { formatCompactNumber, formatRelativeTime } from '../utils/format';

export interface ReportsPageProps {
  requestsPerSec: number;
  latestCostPerHr: number;
  alerts: Alert[];
  endpoints: EndpointStats[];
}

/** The audit log lists every event the simulation keeps in memory. */
const AUDIT_LIMIT = MAX_ALERTS;

const AUDIT_COLUMNS: TableColumn<Alert>[] = [
  { key: 'timestamp', header: 'Time', render: (row) => formatRelativeTime(row.timestamp, Date.now()) },
  { key: 'message', header: 'Event' },
  { key: 'severity', header: 'Severity', align: 'right', render: (row) => row.severity.toUpperCase() },
];

const COST_COLUMNS: TableColumn<EndpointStats & { estCost: number }>[] = [
  { key: 'name', header: 'Endpoint' },
  { key: 'requests', header: 'Requests', align: 'right', render: (row) => formatCompactNumber(row.requests) },
  { key: 'estCost', header: 'Est. cost (24h)', align: 'right', render: (row) => `$${row.estCost.toFixed(2)}` },
];

export function ReportsPage({ requestsPerSec, latestCostPerHr, alerts, endpoints }: ReportsPageProps) {
  const [exported, setExported] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [compliancePackDownloaded, setCompliancePackDownloaded] = useState(false);

  const estimatedDailyRequests = requestsPerSec * 60 * 60 * 24;
  const estimatedDailyCost = latestCostPerHr * 24;

  const totalRequests = endpoints.reduce((sum, e) => sum + e.requests, 0);
  const endpointsWithCost = endpoints.map((endpoint) => ({
    ...endpoint,
    estCost: totalRequests > 0 ? (endpoint.requests / totalRequests) * estimatedDailyCost : 0,
  }));

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Usage and audit exports for finance and compliance.</p>
      </header>

      {/* Summary row: the finance headline and the compliance headline, side by side on wide screens. */}
      <div className="report-row">
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

        <section aria-label="Compliance">
          <Card title="Compliance">
            <div className="report-stats">
              <div className="report-stat">
                <span className="report-stat-label">Uptime (30d, est.)</span>
                <span className="report-stat-value">99.95%</span>
              </div>
              <div className="report-stat">
                <span className="report-stat-label">Data retention</span>
                <span className="report-stat-value">30 days</span>
              </div>
            </div>
            <p className="report-note">
              Illustrative only — this demo has no real historical uptime data to report on.
            </p>
            <div className="report-card-footer">
              {!compliancePackDownloaded ? (
                <Button variant="secondary" size="sm" onClick={() => setCompliancePackDownloaded(true)}>
                  Download compliance pack
                </Button>
              ) : (
                <span className="report-export-done">Downloaded</span>
              )}
            </div>
          </Card>
        </section>
      </div>

      {/* Detail tables follow the summary row's order: finance (cost) first, then compliance (audit). */}
      <section aria-label="Cost by endpoint">
        <Card title="Cost by endpoint">
          <Table
            columns={COST_COLUMNS}
            data={endpointsWithCost}
            getRowId={(row) => row.name}
            caption="Estimated 24h cost, allocated by each endpoint's share of request volume"
          />
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
