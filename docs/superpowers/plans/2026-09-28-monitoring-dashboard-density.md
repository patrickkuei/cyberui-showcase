# Monitoring Dashboard Content Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real, genuinely new content across all four pages of `packages/monitoring` — the user's own feedback after seeing the real-navigation redesign was "looks good but still not enough data" and asked for more cards/sections/blocks on every page. This plan adds summary stat rows, a new chart, cross-page teaser cards, and two new Reports cards, all derived from data the simulation already produces (no new simulation state needed).

**Architecture:** Two small, additive component API changes (an optional `footer` prop on `EndpointTable` and `AlertsFeed`) let the Dashboard reuse those two components at a smaller size as teaser cards linking into their full pages, instead of building new duplicate components. Endpoints and Alerts each gain a derived summary stat row computed in the page component itself (consistent with how `DashboardPage` already computes its own derived values). Reports gains two new cards using components already proven elsewhere in this codebase (`Card`, `Table`, `Button`).

**Tech Stack:** Same as the existing package (React 19, Vite 7, TS strict, Vitest 4 + happy-dom, cyberui-2045, Recharts 3). No new dependencies.

**Spec:** `docs/superpowers/plans/2026-09-28-monitoring-dashboard.md`, `docs/superpowers/plans/2026-09-28-monitoring-dashboard-polish.md`, and `docs/superpowers/plans/2026-09-28-monitoring-dashboard-navigation.md` (the three already-shipped plans this one extends) and `docs/superpowers/specs/2026-09-27-cyberui-showcase-design.md`.

All code below is transcribed from the actual current files in this repo (read immediately before writing this plan), not reconstructed from memory.

## Global Constraints

- Styling for markup we author uses inline styles or `App.css`, referencing only cyberui-2045's documented `--color-*` custom properties — never cyberui-2045's internal Tailwind class names.
- No new dependencies.
- `packages/monitoring` stays standalone: no `workspace:` ranges, no imports outside the package.
- Existing public component APIs may gain new optional props; don't change the meaning of an existing prop, don't break an existing test.
- All new numbers must be derived from data the simulation already produces (`DashboardState`'s existing fields) — no new fields added to `simulation.ts` in this plan. The Compliance card's "Uptime (30d, est.)" and "Data retention" values are explicitly illustrative/static (there is no real historical uptime data to derive from) — label them as estimates/illustrative, don't imply real historical aggregation.
- New interactive elements (the Compliance pack download button) follow the existing mock-feedback pattern already used by Export CSV/Download/Acknowledge: clicking gives real visible feedback (a button replaced by confirmation text), never a no-op click.

## Review Focus

1. `EndpointTable`'s and `AlertsFeed`'s new `footer` prop must not affect either component's existing callers (`EndpointsPage`, `AlertsPage`, `ReportsPage`'s alert table is actually its own `Table`, not `AlertsFeed` — check this) when the prop is omitted — tested in Task 1 by keeping every existing test passing unchanged.
2. The Dashboard's "Top 3 endpoints" must actually be the top 3 by request volume, not just the first 3 in array order — tested in Task 2 with endpoints deliberately given out of sorted order.
3. Endpoints' and Alerts' new summary stats must be real aggregates of the actual data passed in (weighted by traffic where the plan says "weighted"), not placeholder/static numbers — tested in Tasks 3 and 4 with concrete input/output pairs.
4. The new "Requests by endpoint" chart must render a real non-empty chart, consistent with every other chart in this codebase's Review Focus history — tested in Task 3.
5. The Compliance pack download button must give real visible feedback when clicked (per the Global Constraints mock-feedback rule) — tested in Task 5.

---

### Task 1: `footer` prop on `EndpointTable` and `AlertsFeed`

**Files:**
- Modify: `packages/monitoring/src/components/EndpointTable.tsx`
- Modify: `packages/monitoring/src/components/EndpointTable.test.tsx`
- Modify: `packages/monitoring/src/components/AlertsFeed.tsx`
- Modify: `packages/monitoring/src/components/AlertsFeed.test.tsx`

**Interfaces:**
- Consumes: unchanged.
- Produces: `EndpointTableProps`/`AlertsFeedProps` gain optional `footer?: ReactNode`, rendered as the last child inside the `Card`, after the `Table`/`Timeline`. Consumed by Task 2 (`DashboardPage`'s teaser row).

- [ ] **Step 1: Write the failing tests**

Add to `EndpointTable.test.tsx` (keep the existing test):
```tsx
it('renders an optional footer after the table', () => {
  render(
    <EndpointTable
      endpoints={[{ name: '/v1/models', requests: 100, avgLatencyMs: 10, errorRatePct: 0.1 }]}
      footer={<a href="#/endpoints">View all endpoints →</a>}
    />,
  );
  expect(screen.getByRole('link', { name: 'View all endpoints →' })).toBeInTheDocument();
});
```

Add to `AlertsFeed.test.tsx` (keep the existing tests):
```tsx
it('renders an optional footer after the feed', () => {
  render(
    <AlertsFeed
      alerts={[{ id: '1', severity: 'info' as const, message: 'Hello', timestamp: NOW }]}
      now={NOW}
      footer={<a href="#/alerts">View all alerts →</a>}
    />,
  );
  expect(screen.getByRole('link', { name: 'View all alerts →' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — neither component accepts `footer` yet.

- [ ] **Step 3: Update `packages/monitoring/src/components/EndpointTable.tsx`**

Change:
```tsx
export interface EndpointTableProps {
  endpoints: EndpointStats[];
  /** Optional card heading; omit it when the surrounding page already names the table. */
  title?: string;
}

export function EndpointTable({ endpoints, title }: EndpointTableProps) {
  return (
    <Card title={title}>
      <Table
        columns={COLUMNS}
        data={endpoints}
        getRowId={(row) => row.name}
        caption="Per-endpoint request volume, latency, and error rate"
      />
    </Card>
  );
}
```
to:
```tsx
export interface EndpointTableProps {
  endpoints: EndpointStats[];
  /** Optional card heading; omit it when the surrounding page already names the table. */
  title?: string;
  /** Optional content rendered below the table (e.g. a "View all" link). */
  footer?: ReactNode;
}

export function EndpointTable({ endpoints, title, footer }: EndpointTableProps) {
  return (
    <Card title={title}>
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
```
Add `import type { ReactNode } from 'react';` at the top of the file (not currently imported there — check first, it may not be needed if another import already brings it in).

- [ ] **Step 4: Update `packages/monitoring/src/components/AlertsFeed.tsx`**

Change:
```tsx
export interface AlertsFeedProps {
  alerts: Alert[];
  now: number;
  limit?: number;
  /** Optional card heading; omit it when the surrounding page already names the feed. */
  title?: string;
}
```
to:
```tsx
export interface AlertsFeedProps {
  alerts: Alert[];
  now: number;
  limit?: number;
  /** Optional card heading; omit it when the surrounding page already names the feed. */
  title?: string;
  /** Optional content rendered below the timeline (e.g. a "View all" link). */
  footer?: ReactNode;
}
```
Change:
```tsx
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
```
to:
```tsx
export function AlertsFeed({ alerts, now, limit = VISIBLE_ALERTS, title, footer }: AlertsFeedProps) {
  const events: AlertTimelineEvent[] = alerts.slice(0, limit).map((alert) => ({
    title: renderTitle(alert),
    time: formatRelativeTime(alert.timestamp, now),
    status: SEVERITY_TO_STATUS[alert.severity],
  }));

  return (
    <Card title={title}>
      <Timeline events={events as unknown as TimelineEvent[]} size="sm" />
      {footer}
    </Card>
  );
}
```
`ReactNode` is already imported in this file (`import type { ReactNode } from 'react';`) — reuse it, don't add a duplicate import.

- [ ] **Step 5: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS (all `EndpointTable` and `AlertsFeed` tests, old and new).

- [ ] **Step 6: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add packages/monitoring/src/components/EndpointTable.tsx packages/monitoring/src/components/EndpointTable.test.tsx packages/monitoring/src/components/AlertsFeed.tsx packages/monitoring/src/components/AlertsFeed.test.tsx
git commit -m "feat(monitoring): add an optional footer slot to EndpointTable and AlertsFeed"
```

---

### Task 2: Dashboard teaser row (Top endpoints, Recent alerts)

**Files:**
- Modify: `packages/monitoring/src/pages/DashboardPage.tsx`
- Modify: `packages/monitoring/src/pages/DashboardPage.test.tsx`
- Modify: `packages/monitoring/src/App.css`

**Interfaces:**
- Consumes: `EndpointTable`/`AlertsFeed` with Task 1's `footer` prop; `EndpointStats`/`Alert` from `../data/simulation` (already available via `state`, already a `DashboardPageProps` field).
- Produces: nothing new for other tasks — this is a leaf integration.

- [ ] **Step 1: Write the failing test**

Add to `DashboardPage.test.tsx` (keep the existing test; check its current imports/setup first and match its style — it already imports `createInitialState` and calls `render`):
```tsx
it('shows a top-endpoints teaser and a recent-alerts teaser, each linking to its full page', () => {
  const state = createInitialState(1_700_000_000_000, () => 0.5);
  render(
    <DashboardPage state={state} chartRange="60s" onChartRangeChange={() => {}} refreshMs={2000} />,
  );
  expect(screen.getByText('Top endpoints')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View all endpoints →' })).toHaveAttribute('href', '#/endpoints');
  expect(screen.getByText('Recent alerts')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View all alerts →' })).toHaveAttribute('href', '#/alerts');
});

it('shows the top 3 endpoints by request volume, not array order (Review Focus #2)', () => {
  const state = createInitialState(1_700_000_000_000, () => 0.5);
  const scrambled = {
    ...state,
    endpoints: [
      { name: '/low', requests: 10, avgLatencyMs: 50, errorRatePct: 0.1 },
      { name: '/high', requests: 9000, avgLatencyMs: 50, errorRatePct: 0.1 },
      { name: '/mid-a', requests: 500, avgLatencyMs: 50, errorRatePct: 0.1 },
      { name: '/mid-b', requests: 400, avgLatencyMs: 50, errorRatePct: 0.1 },
    ],
  };
  render(
    <DashboardPage state={scrambled} chartRange="60s" onChartRangeChange={() => {}} refreshMs={2000} />,
  );
  expect(screen.getByText('/high')).toBeInTheDocument();
  expect(screen.getByText('/mid-a')).toBeInTheDocument();
  expect(screen.getByText('/mid-b')).toBeInTheDocument();
  expect(screen.queryByText('/low')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — no teaser row exists yet.

- [ ] **Step 3: Update `packages/monitoring/src/pages/DashboardPage.tsx`**

Add these imports (alongside the existing ones):
```tsx
import { EndpointTable } from '../components/EndpointTable';
import { AlertsFeed } from '../components/AlertsFeed';
```

Add, inside the component body, before the `return`:
```tsx
const topEndpoints = [...state.endpoints].sort((a, b) => b.requests - a.requests).slice(0, 3);
```

Add this new `<section>` immediately after the existing `<section className="chart-grid" ...>...</section>` block (as a new sibling inside the outer `<>...</>` fragment, not nested inside chart-grid):
```tsx
<section className="teaser-row" aria-label="More on this platform">
  <div className="teaser-cell">
    <EndpointTable
      title="Top endpoints"
      endpoints={topEndpoints}
      footer={
        <a className="card-link" href="#/endpoints">
          View all endpoints →
        </a>
      }
    />
  </div>
  <div className="teaser-cell">
    <AlertsFeed
      title="Recent alerts"
      alerts={state.alerts}
      now={Date.now()}
      limit={3}
      footer={
        <a className="card-link" href="#/alerts">
          View all alerts →
        </a>
      }
    />
  </div>
</section>
```

- [ ] **Step 4: Add the new CSS to `packages/monitoring/src/App.css`**

Append near the end of the file (after the existing "Reports page" section, or wherever fits — this repo's convention is a `/* ---- Section name ---- */` comment header per block):
```css
/* ---- Dashboard teasers -------------------------------------------------- */

.teaser-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--gap);
}

.teaser-cell {
  min-width: 0;
}

@media (min-width: 960px) {
  .teaser-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.card-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
  color: var(--color-secondary);
  font-size: 0.8125rem;
  text-decoration: none;
}

.card-link:hover {
  text-decoration: underline;
}

.card-link:focus-visible {
  outline: 2px solid var(--color-secondary);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 6: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add packages/monitoring/src/pages/DashboardPage.tsx packages/monitoring/src/pages/DashboardPage.test.tsx packages/monitoring/src/App.css
git commit -m "feat(monitoring): add Top endpoints and Recent alerts teasers to the Dashboard"
```

---

### Task 3: Endpoints summary stats and a new "Requests by endpoint" chart

**Files:**
- Create: `packages/monitoring/src/components/EndpointRequestsChart.tsx`
- Test: `packages/monitoring/src/components/EndpointRequestsChart.test.tsx`
- Modify: `packages/monitoring/src/pages/EndpointsPage.tsx`
- Modify: `packages/monitoring/src/pages/EndpointsPage.test.tsx`

**Interfaces:**
- Consumes: `EndpointStats` from `../data/simulation`; `useChartColors`/`chartTooltipProps` from `../theme/chartColors`; `formatCompactNumber`/`formatMs`/`formatPercent` from `../utils/format`; `StatTile`; `ActivityIcon`/`ClockIcon`/`AlertTriangleIcon`/`ServerIcon` from `../icons`.
- Produces: `EndpointRequestsChart({ endpoints })`. Consumed only by `EndpointsPage` in this task.

- [ ] **Step 1: Write the failing chart test**

```tsx
// src/components/EndpointRequestsChart.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EndpointRequestsChart } from './EndpointRequestsChart';

const ENDPOINTS = [
  { name: '/v1/chat/completions', requests: 1800, avgLatencyMs: 320, errorRatePct: 0.5 },
  { name: '/v1/embeddings', requests: 1100, avgLatencyMs: 90, errorRatePct: 0.2 },
];

describe('EndpointRequestsChart', () => {
  it('renders a non-empty chart for the given endpoints (Review Focus #4)', () => {
    const { container } = render(<EndpointRequestsChart endpoints={ENDPOINTS} />);
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(svg?.getAttribute('height'))).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./EndpointRequestsChart` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/components/EndpointRequestsChart.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'cyberui-2045';
import type { EndpointStats } from '../data/simulation';
import { useChartColors, chartTooltipProps } from '../theme/chartColors';
import { formatCompactNumber } from '../utils/format';

export interface EndpointRequestsChartProps {
  endpoints: EndpointStats[];
}

export function EndpointRequestsChart({ endpoints }: EndpointRequestsChartProps) {
  const colors = useChartColors();

  return (
    <Card title="Requests by endpoint">
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={endpoints}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={colors.muted} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatCompactNumber} stroke={colors.muted} width={48} />
            <Tooltip
              formatter={(value) => [formatCompactNumber(Number(value)), 'requests']}
              {...chartTooltipProps(colors)}
            />
            <Bar dataKey="requests" fill={colors.secondary} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Write the failing `EndpointsPage` tests for the new stats**

Read `EndpointsPage.test.tsx`'s current content first (it already has one test with a single-endpoint fixture). Add:
```tsx
it('shows a summary stat row with real weighted aggregates (Review Focus #3)', () => {
  const endpoints = [
    { name: '/a', requests: 100, avgLatencyMs: 100, errorRatePct: 1 },
    { name: '/b', requests: 300, avgLatencyMs: 300, errorRatePct: 5 },
  ];
  // Weighted avg latency: (100*100 + 300*300) / 400 = 250ms. Weighted error rate: (100*1 + 300*5) / 400 = 4%.
  render(<EndpointsPage endpoints={endpoints} />);
  expect(screen.getByText('Endpoints monitored')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('400')).toBeInTheDocument();
  expect(screen.getByText('250 ms')).toBeInTheDocument();
  expect(screen.getByText('4.0%')).toBeInTheDocument();
});
```

- [ ] **Step 6: Run the tests, verify the new one fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `EndpointsPage` doesn't render a stat row yet.

- [ ] **Step 7: Update `packages/monitoring/src/pages/EndpointsPage.tsx` in full**

```tsx
import type { EndpointStats } from '../data/simulation';
import { EndpointTable } from '../components/EndpointTable';
import { EndpointRequestsChart } from '../components/EndpointRequestsChart';
import { StatTile } from '../components/StatTile';
import { ActivityIcon, ClockIcon, AlertTriangleIcon, ServerIcon } from '../icons';
import { formatCompactNumber, formatMs, formatPercent } from '../utils/format';

export interface EndpointsPageProps {
  endpoints: EndpointStats[];
}

export function EndpointsPage({ endpoints }: EndpointsPageProps) {
  const totalRequests = endpoints.reduce((sum, e) => sum + e.requests, 0);
  const avgLatencyMs =
    totalRequests > 0 ? endpoints.reduce((sum, e) => sum + e.avgLatencyMs * e.requests, 0) / totalRequests : 0;
  const errorRatePct =
    totalRequests > 0 ? endpoints.reduce((sum, e) => sum + e.errorRatePct * e.requests, 0) / totalRequests : 0;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Endpoints</h1>
        <p className="page-subtitle">Request volume, latency, and error rate per route.</p>
      </header>

      <section className="stat-row" aria-label="Endpoint summary">
        <StatTile label="Endpoints monitored" value={String(endpoints.length)} icon={<ServerIcon />} />
        <StatTile label="Total requests" value={formatCompactNumber(totalRequests)} icon={<ActivityIcon />} />
        <StatTile label="Avg latency" value={formatMs(avgLatencyMs)} icon={<ClockIcon />} />
        <StatTile
          label="Overall error rate"
          value={formatPercent(errorRatePct)}
          tone={errorRatePct > 2 ? 'error' : 'success'}
          icon={<AlertTriangleIcon />}
        />
      </section>

      <section aria-label="Endpoints">
        <EndpointTable endpoints={endpoints} />
      </section>

      <section aria-label="Requests distribution">
        <EndpointRequestsChart endpoints={endpoints} />
      </section>
    </>
  );
}
```

Note: with only 2 endpoints in the test fixture, `formatCompactNumber(400)` returns `'400'` (Intl compact notation doesn't abbreviate below 1000) — this matches the test's assertion above.

- [ ] **Step 8: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS (all `EndpointsPage` and `EndpointRequestsChart` tests).

- [ ] **Step 9: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean.

- [ ] **Step 10: Commit**

```bash
git add packages/monitoring/src/components/EndpointRequestsChart.tsx packages/monitoring/src/components/EndpointRequestsChart.test.tsx packages/monitoring/src/pages/EndpointsPage.tsx packages/monitoring/src/pages/EndpointsPage.test.tsx
git commit -m "feat(monitoring): add endpoint summary stats and a requests-by-endpoint chart"
```

---

### Task 4: Alerts summary stats

**Files:**
- Modify: `packages/monitoring/src/pages/AlertsPage.tsx`
- Modify: `packages/monitoring/src/pages/AlertsPage.test.tsx`

**Interfaces:**
- Consumes: `Alert` from `../data/simulation` (unchanged); `StatTile`; `ActivityIcon` from `../icons`.
- Produces: nothing new for other tasks — leaf integration.

- [ ] **Step 1: Write the failing test**

Read `AlertsPage.test.tsx`'s current content first (it has one test with a 12-alert, all-`info`-severity fixture). Add:
```tsx
it('shows a summary stat row with real severity counts (Review Focus #3)', () => {
  const alerts = [
    { id: '1', severity: 'critical' as const, message: 'a', timestamp: Date.now() },
    { id: '2', severity: 'critical' as const, message: 'b', timestamp: Date.now() },
    { id: '3', severity: 'warning' as const, message: 'c', timestamp: Date.now() },
    { id: '4', severity: 'info' as const, message: 'd', timestamp: Date.now() },
  ];
  render(<AlertsPage alerts={alerts} />);
  expect(screen.getByText('Total alerts')).toBeInTheDocument();
  expect(screen.getByText('4')).toBeInTheDocument();
  expect(screen.getByText('Critical')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('Warning')).toBeInTheDocument();
  expect(screen.getByText('Info')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — no stat row exists yet.

- [ ] **Step 3: Update `packages/monitoring/src/pages/AlertsPage.tsx` in full**

```tsx
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
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/monitoring/src/pages/AlertsPage.tsx packages/monitoring/src/pages/AlertsPage.test.tsx
git commit -m "feat(monitoring): add an alert severity summary stat row"
```

---

### Task 5: Reports — Compliance card and Cost-by-endpoint card

**Files:**
- Modify: `packages/monitoring/src/pages/ReportsPage.tsx`
- Modify: `packages/monitoring/src/pages/ReportsPage.test.tsx`
- Modify: `packages/monitoring/src/App.tsx`
- Modify: `packages/monitoring/src/App.css`

**Interfaces:**
- Consumes: `EndpointStats` from `../data/simulation` (new); everything `ReportsPage` already consumed.
- Produces: `ReportsPageProps` gains a new required `endpoints: EndpointStats[]` field. `App.tsx`'s `pages.reports` call site is updated to pass `endpoints={state.endpoints}` (it already has `state` in scope).

This task adds the most net-new visual content in this plan — invoke `/frontend-design:frontend-design` for guidance on integrating two more cards into a page that already has two, so Reports doesn't feel like an unstructured pile of cards. The structure below is a functional baseline to refine, not a fixed spec — keep every element it wires together.

- [ ] **Step 1: Get visual design guidance**

Invoke the `frontend-design:frontend-design` skill via the Skill tool. Use its guidance for how the four Reports cards (Usage report, Compliance, Audit log, Cost by endpoint) should be grouped/ordered/spaced — e.g. whether two related cards should sit side-by-side on wide screens (there's already a precedent for this: `ActionPanel` and its `.action-panel` grid CSS on the Dashboard).

- [ ] **Step 2: Write the failing tests**

Read `ReportsPage.test.tsx`'s current content first (it has two tests using an `ALERTS` fixture and calls `ReportsPage` with `requestsPerSec`/`latestCostPerHr`/`alerts`). Update both existing calls to also pass a new `endpoints` prop (a small fixture, e.g. two endpoints), then add:
```tsx
it('shows a compliance card with a mock download button that gives real feedback (Review Focus #5)', async () => {
  render(
    <ReportsPage requestsPerSec={420} latestCostPerHr={6.3} alerts={ALERTS} endpoints={ENDPOINTS} />,
  );
  expect(screen.getByText('Compliance')).toBeInTheDocument();
  const button = screen.getByRole('button', { name: 'Download compliance pack' });
  await userEvent.click(button);
  expect(screen.queryByRole('button', { name: 'Download compliance pack' })).not.toBeInTheDocument();
  expect(screen.getAllByText('Downloaded').length).toBeGreaterThan(0);
});

it('shows a cost-by-endpoint table allocated by traffic share', () => {
  render(
    <ReportsPage requestsPerSec={420} latestCostPerHr={6.3} alerts={ALERTS} endpoints={ENDPOINTS} />,
  );
  expect(screen.getByText('Cost by endpoint')).toBeInTheDocument();
  for (const endpoint of ENDPOINTS) {
    expect(screen.getByText(endpoint.name)).toBeInTheDocument();
  }
});
```
Define `const ENDPOINTS = [{ name: '/v1/chat/completions', requests: 300, avgLatencyMs: 200, errorRatePct: 0.5 }, { name: '/v1/embeddings', requests: 100, avgLatencyMs: 60, errorRatePct: 0.1 }];` near the file's existing `ALERTS` constant. Import `userEvent` from `@testing-library/user-event` if not already imported in this file.

- [ ] **Step 3: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `ReportsPage` doesn't accept `endpoints` yet, no Compliance/Cost-by-endpoint cards exist.

- [ ] **Step 4: Update `packages/monitoring/src/pages/ReportsPage.tsx`**

Add to the imports: `import type { EndpointStats } from '../data/simulation';` (alongside the existing `Alert` import from the same module — combine into one import statement rather than two).

Change the props interface:
```tsx
export interface ReportsPageProps {
  requestsPerSec: number;
  latestCostPerHr: number;
  alerts: Alert[];
  endpoints: EndpointStats[];
}
```

Add a second piece of local state and derived cost-by-endpoint data inside the component, alongside the existing `exported`/`downloaded` state and `estimatedDailyRequests`/`estimatedDailyCost` derivations:
```tsx
const [compliancePackDownloaded, setCompliancePackDownloaded] = useState(false);

const totalRequests = endpoints.reduce((sum, e) => sum + e.requests, 0);
const endpointsWithCost = endpoints.map((endpoint) => ({
  ...endpoint,
  estCost: totalRequests > 0 ? (endpoint.requests / totalRequests) * estimatedDailyCost : 0,
}));
```

Add a new columns constant near `AUDIT_COLUMNS`:
```tsx
const COST_COLUMNS: TableColumn<EndpointStats & { estCost: number }>[] = [
  { key: 'name', header: 'Endpoint' },
  { key: 'requests', header: 'Requests', align: 'right', render: (row) => formatCompactNumber(row.requests) },
  { key: 'estCost', header: 'Est. cost (24h)', align: 'right', render: (row) => `$${row.estCost.toFixed(2)}` },
];
```

Add two new `<section>` blocks. Where exactly they go relative to the existing "Usage report" and "Audit log" sections is guided by Step 1's frontend-design pass — a reasonable default (refine per that guidance) is Compliance right after Usage report, and Cost by endpoint right after Audit log:
```tsx
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
```
```tsx
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
```

- [ ] **Step 5: Update `packages/monitoring/src/App.tsx`**

In the `pages.reports` entry, add the new prop:
```tsx
reports: () => (
  <ReportsPage
    requestsPerSec={state.requestsPerSec}
    latestCostPerHr={latestUsage?.costPerHr ?? 0}
    alerts={state.alerts}
    endpoints={state.endpoints}
  />
),
```

- [ ] **Step 6: Add the new CSS to `packages/monitoring/src/App.css`**

Append near the existing "Reports page" section:
```css
.report-note {
  margin: 0.75rem 0 0;
  color: var(--color-muted);
  font-size: 0.8125rem;
}
```
If Step 1's frontend-design guidance calls for a two-column layout for related Reports cards on wide screens, add that grid CSS here too, following the same `.action-panel`-style pattern already established (a class on the relevant `Card`s' wrapping `<section>`s, a `@media (min-width: 960px)` rule) — keep it if it's a real improvement, or leave the cards single-column/stacked if that reads better; this is a judgment call the design guidance should settle.

- [ ] **Step 7: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS (all `ReportsPage` and `App` tests, old and new).

- [ ] **Step 8: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add packages/monitoring/src/pages/ReportsPage.tsx packages/monitoring/src/pages/ReportsPage.test.tsx packages/monitoring/src/App.tsx packages/monitoring/src/App.css
git commit -m "feat(monitoring): add Compliance and Cost-by-endpoint cards to Reports"
```
