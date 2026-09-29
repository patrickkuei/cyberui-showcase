import type { ReactNode } from 'react';
import { Card, Table } from 'cyberui-2045';
import type { TableColumn } from 'cyberui-2045';
import type { EndpointStats } from '../data/simulation';
import { formatCompactNumber, formatMs, formatPercent } from '../utils/format';

const COLUMNS: TableColumn<EndpointStats>[] = [
  { key: 'name', header: 'Endpoint' },
  { key: 'requests', header: 'Requests', align: 'right', render: (row) => formatCompactNumber(row.requests) },
  { key: 'avgLatencyMs', header: 'Avg latency', align: 'right', render: (row) => formatMs(row.avgLatencyMs) },
  { key: 'errorRatePct', header: 'Error rate', align: 'right', render: (row) => formatPercent(row.errorRatePct) },
];

export interface EndpointTableProps {
  endpoints: EndpointStats[];
  /** Optional card heading; omit it when the surrounding page already names the table. */
  title?: string;
  /** Optional content rendered below the table (e.g. a "View all" link). */
  footer?: ReactNode;
}

export function EndpointTable({ endpoints, title, footer }: EndpointTableProps) {
  return (
    <Card title={title} className="panel-surface">
      <Table
        columns={COLUMNS}
        data={endpoints}
        getRowId={(row) => row.name}
        caption="Per-endpoint request volume, latency, and error rate"
      />
      {footer}
    </Card>
  );
}
