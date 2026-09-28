# Monitoring Dashboard Real Navigation & Density Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monitoring dashboard's decorative top nav with real client-side routing across four pages (Dashboard, Endpoints, Alerts, Reports), remove duplicated messaging (brand name in both nav and a giant hero; "operational" said twice, once by the badge and once by the action panel), tighten the layout for a denser data view, and add a new Reports page with genuinely new content (a usage summary and an audit log) that exercises cyberui-2045's `Button` and `Table` components.

**Architecture:** A tiny hash-based router (`useHashRoute`, no new dependency — `window.location.hash` + a `hashchange` listener) replaces the inert nav spans with real `<a href="#/...">` links. `App.tsx` becomes a thin shell: it owns the live simulation state, the nav, and route selection, and renders one of four page components. Each page component owns exactly the props it needs (not the whole `DashboardState`) and computes any page-local derived values itself — this is where the dashboard's stat-tile trend/action-panel logic moves to, out of `App.tsx`.

**Tech Stack:** Same as the existing package (React 19, Vite 7, TS strict, Vitest 4 + happy-dom, cyberui-2045, Recharts 3). No new dependencies.

**Spec:** `docs/superpowers/plans/2026-09-28-monitoring-dashboard.md` and `docs/superpowers/plans/2026-09-28-monitoring-dashboard-polish.md` (both already-shipped plans this one extends) and `docs/superpowers/specs/2026-09-27-cyberui-showcase-design.md`.

All code below is transcribed from the actual current files in this repo (read immediately before writing this plan), not reconstructed from memory.

## Global Constraints

- Styling for markup we author uses inline styles or `App.css`, referencing only cyberui-2045's documented `--color-*` custom properties — never cyberui-2045's internal Tailwind class names.
- No new dependencies. The router is hand-written; no `react-router` or similar.
- `packages/monitoring` stays standalone: no `workspace:` ranges, no imports outside the package.
- The nav's non-Dashboard links are now REAL navigation (real `<a>` elements, real route changes) — this is an explicit reversal of the earlier "inert nav" decision now that the product has real pages to go to. The chart time-range toggle and the ActionPanel's "Acknowledge" button remain intentionally mock/noop (per the earlier, still-valid decision) — don't change their behavior, only their surrounding layout if a task's CSS changes touch them incidentally.
- Existing public component APIs may gain new optional props; don't change the meaning of an existing prop.
- Avoid the "tracked-out ALL-CAPS eyebrow label above a heading" pattern (the current `SectionTitle`/"PRODUCTION INFERENCE API" usage is exactly this) — this plan replaces it with a plain-case page subtitle.

## Review Focus

1. The router must correctly fall back to the Dashboard route for an unknown/malformed hash (e.g. a stale bookmark, a typo) rather than rendering a blank page — tested in Task 1.
2. Removing the dynamic "healthy" line from `ActionPanel` must not leave the component silently rendering nothing useful when healthy — the static item must still render, and the card must never be empty — tested in Task 3.
3. Real `<a>` nav links must be keyboard-operable (focus-visible, `Enter` navigates) and the active link must be programmatically determinable (`aria-current="page"`), not just visually distinct by color — tested in Task 6.
4. `ReportsPage`'s "Export CSV"/"Download" buttons are mock — clicking them must give real, visible feedback (consistent with `ActionPanel`'s `Acknowledge` pattern) rather than doing nothing, so they don't feel broken — tested in Task 4.
5. The page-to-page navigation must actually swap rendered content (not just change a visual selection with the old content still showing) — tested in Task 6 by asserting Dashboard-only content (stat tiles) is absent on other routes and vice versa.

---

### Task 1: `useHashRoute` hook

**Files:**
- Create: `packages/monitoring/src/router/useHashRoute.ts`
- Test: `packages/monitoring/src/router/useHashRoute.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export type Route = 'dashboard' | 'endpoints' | 'alerts' | 'reports'` and `useHashRoute(): Route`. Consumed by Task 6 (the `App.tsx` shell).

- [ ] **Step 1: Write the failing tests**

```ts
// src/router/useHashRoute.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHashRoute } from './useHashRoute';

describe('useHashRoute', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('defaults to dashboard when there is no hash', () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toBe('dashboard');
  });

  it('reads a known route from the initial hash', () => {
    window.location.hash = '#/endpoints';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toBe('endpoints');
  });

  it('falls back to dashboard for an unknown hash (Review Focus #1)', () => {
    window.location.hash = '#/nope';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toBe('dashboard');
  });

  it('updates when the hash changes', () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toBe('dashboard');

    act(() => {
      window.location.hash = '#/alerts';
      window.dispatchEvent(new Event('hashchange'));
    });

    expect(result.current).toBe('alerts');
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./useHashRoute` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/router/useHashRoute.ts`**

```ts
import { useEffect, useState } from 'react';

export type Route = 'dashboard' | 'endpoints' | 'alerts' | 'reports';

const ROUTES: readonly Route[] = ['dashboard', 'endpoints', 'alerts', 'reports'];
const DEFAULT_ROUTE: Route = 'dashboard';

function parseHash(hash: string): Route {
  const value = hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(value) ? (value as Route) : DEFAULT_ROUTE;
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/monitoring/src/router
git commit -m "feat(monitoring): add a hash-based route hook"
```

---

### Task 2: `AlertsFeed` gains an optional `limit` prop

**Files:**
- Modify: `packages/monitoring/src/components/AlertsFeed.tsx`
- Modify: `packages/monitoring/src/components/AlertsFeed.test.tsx` (add a case; keep the existing two as-is)

**Interfaces:**
- Consumes: unchanged (`Alert` from `../data/simulation`).
- Produces: `AlertsFeedProps` gains optional `limit?: number` (default `8`, same as the current hard-coded `VISIBLE_ALERTS`). Consumed by Task 5's `AlertsPage`, which passes a larger limit so its dedicated page isn't cropped to a sidebar-widget length.

- [ ] **Step 1: Write the failing test**

Add to `AlertsFeed.test.tsx` (keep both existing tests):

```tsx
it('respects a custom limit', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    severity: 'info' as const,
    message: `Alert number ${i}`,
    timestamp: NOW - i * 1000,
  }));
  render(<AlertsFeed alerts={many} now={NOW} limit={3} />);
  expect(screen.getAllByText(/^Alert number \d+$/)).toHaveLength(3);
});
```

(Use the file's existing `NOW` constant — read the current file first to match its exact name/import style.)

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `AlertsFeed` doesn't accept `limit` yet.

- [ ] **Step 3: Update `packages/monitoring/src/components/AlertsFeed.tsx`**

Change:
```tsx
export interface AlertsFeedProps {
  alerts: Alert[];
  now: number;
}
```
to:
```tsx
export interface AlertsFeedProps {
  alerts: Alert[];
  now: number;
  limit?: number;
}
```

Change:
```tsx
export function AlertsFeed({ alerts, now }: AlertsFeedProps) {
  const events: AlertTimelineEvent[] = alerts.slice(0, VISIBLE_ALERTS).map((alert) => ({
```
to:
```tsx
export function AlertsFeed({ alerts, now, limit = VISIBLE_ALERTS }: AlertsFeedProps) {
  const events: AlertTimelineEvent[] = alerts.slice(0, limit).map((alert) => ({
```

Every other line in the file is unchanged.

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS (all `AlertsFeed` tests, old and new).

- [ ] **Step 5: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/monitoring/src/components/AlertsFeed.tsx packages/monitoring/src/components/AlertsFeed.test.tsx
git commit -m "feat(monitoring): let AlertsFeed show more than 8 alerts on its own page"
```

---

### Task 3: `ActionPanel` only shows the dynamic row when there's a real incident

**Files:**
- Modify: `packages/monitoring/src/components/ActionPanel.tsx`
- Modify: `packages/monitoring/src/components/ActionPanel.test.tsx`

**Interfaces:**
- Consumes: unchanged.
- Produces: unchanged public props (`incidentKey`, `headline`, `headlineTone`, `primaryActionLabel?`) — only the render logic changes. No consumers need updating for this alone (Task 5's `DashboardPage` will pass the same shape it already computes).

**Why:** Today the card always renders a dot + headline sentence even when everything is healthy ("No action needed. Every metric is within its threshold.") — which just restates the nav badge a second time. This task makes the dynamic row appear only when there's something to acknowledge; when healthy, only the static informational item shows, so the card has one job (surface real incidents) instead of two (also re-confirming health).

- [ ] **Step 1: Update the failing/changed test in `ActionPanel.test.tsx`**

Replace the file's first test (`'renders the headline'`) with:

```tsx
it('shows only the static item when there is no incident (Review Focus #2)', () => {
  render(
    <ActionPanel
      incidentKey="healthy"
      headline="All systems operational — no action needed"
      headlineTone="success"
    />,
  );
  expect(screen.queryByText('All systems operational — no action needed')).not.toBeInTheDocument();
  expect(screen.getByText('Model rollout: model-router v2.3.1')).toBeInTheDocument();
});
```

Keep every other test in the file exactly as-is (they all pass `primaryActionLabel`, so they're testing the branch that still renders the dynamic row).

- [ ] **Step 2: Run the tests, verify the changed one fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — the current code always renders the headline text regardless of `primaryActionLabel`.

- [ ] **Step 3: Update `packages/monitoring/src/components/ActionPanel.tsx`**

Change the return statement's first `<div className="action-item">...</div>` block to be conditional on `primaryActionLabel` being present:

```tsx
export function ActionPanel({ incidentKey, headline, headlineTone, primaryActionLabel }: ActionPanelProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [prevIncidentKey, setPrevIncidentKey] = useState(incidentKey);
  if (incidentKey !== prevIncidentKey) {
    setPrevIncidentKey(incidentKey);
    setAcknowledged(false);
  }

  return (
    <Card title="What needs attention" className="action-panel">
      {primaryActionLabel && (
        <div className="action-item">
          <span className="action-dot" style={{ background: TONE_VAR[headlineTone] }} aria-hidden="true" />
          <div className="action-item-body">
            <p className="action-item-title">{headline}</p>
            {!acknowledged ? (
              <button type="button" className="action-item-button" onClick={() => setAcknowledged(true)}>
                {primaryActionLabel}
              </button>
            ) : (
              <span className="action-item-done">Acknowledged</span>
            )}
          </div>
        </div>
      )}
      <div className="action-item action-item--static">
        <span className="action-dot" style={{ background: 'var(--color-success)' }} aria-hidden="true" />
        <div className="action-item-body">
          <p className="action-item-title">Model rollout: model-router v2.3.1</p>
          <p className="action-item-subtitle">Deployed to all regions, 0 rollbacks.</p>
        </div>
      </div>
    </Card>
  );
}
```

(Everything else — imports, `ActionPanelProps`, `TONE_VAR` — is unchanged.)

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS (all `ActionPanel` tests). Note: the existing App-level test `App.actionPanel.test.tsx`'s "shows no action when every metric is within its threshold" test already only asserts the absence of "Investigating"/the button — it does not assert the old healthy sentence's presence, so it should keep passing unmodified. Confirm this by running the full suite in the next step, not by assumption.

- [ ] **Step 5: Run the full suite and the build**

Run: `pnpm --filter monitoring-dashboard-demo run test` and `pnpm --filter monitoring-dashboard-demo run build`
Expected: PASS / clean.

- [ ] **Step 6: Commit**

```bash
git add packages/monitoring/src/components/ActionPanel.tsx packages/monitoring/src/components/ActionPanel.test.tsx
git commit -m "fix(monitoring): stop ActionPanel restating the health badge when nothing needs attention"
```

---

### Task 4: `ReportsPage` — new content

**Files:**
- Create: `packages/monitoring/src/pages/ReportsPage.tsx`
- Test: `packages/monitoring/src/pages/ReportsPage.test.tsx`

**Interfaces:**
- Consumes: `Alert` from `../data/simulation`; `formatCompactNumber`, `formatRelativeTime` from `../utils/format`; cyberui-2045's `Card`, `Button`, `Table` (confirmed exports: `Button` accepts `variant?: 'primary'|'secondary'|'danger'|'ghost'`, `children`, and standard `<button>` attributes including `onClick`; `Table`/`TableColumn` as already used in `EndpointTable.tsx`).
- Produces: `ReportsPage({ requestsPerSec, latestCostPerHr, alerts }: ReportsPageProps)`. Consumed by Task 6's `App.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/pages/ReportsPage.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportsPage } from './ReportsPage';

const ALERTS = [
  { id: '1', severity: 'critical' as const, message: 'Error rate above threshold on us-east-1', timestamp: Date.now() - 30_000 },
  { id: '2', severity: 'info' as const, message: 'Deploy completed: model-router v2.3.1', timestamp: Date.now() - 5 * 60_000 },
];

describe('ReportsPage', () => {
  it('renders a usage estimate and an audit log row per alert', () => {
    render(<ReportsPage requestsPerSec={420} latestCostPerHr={6.3} alerts={ALERTS} />);
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Error rate above threshold on us-east-1')).toBeInTheDocument();
    expect(screen.getByText('Deploy completed: model-router v2.3.1')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('gives visible feedback when the mock export buttons are clicked (Review Focus #4)', async () => {
    render(<ReportsPage requestsPerSec={420} latestCostPerHr={6.3} alerts={ALERTS} />);
    const exportButton = screen.getByRole('button', { name: 'Export CSV' });
    await userEvent.click(exportButton);
    expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument();
    expect(screen.getByText('Exported')).toBeInTheDocument();

    const downloadButton = screen.getByRole('button', { name: 'Download' });
    await userEvent.click(downloadButton);
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    expect(screen.getByText('Downloaded')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./ReportsPage` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/pages/ReportsPage.tsx`**

```tsx
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
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean. (If `Table`'s generic type isn't inferred cleanly from `columns`/`data` here the way it is in `EndpointTable.tsx`, read that file's exact pattern again and match it — don't add an explicit generic annotation unless the existing file does.)

- [ ] **Step 6: Commit**

```bash
git add packages/monitoring/src/pages/ReportsPage.tsx packages/monitoring/src/pages/ReportsPage.test.tsx
git commit -m "feat(monitoring): add a Reports page (usage estimate + audit log)"
```

---

### Task 5: `DashboardPage`, `EndpointsPage`, `AlertsPage`

**Files:**
- Create: `packages/monitoring/src/pages/DashboardPage.tsx`
- Test: `packages/monitoring/src/pages/DashboardPage.test.tsx`
- Create: `packages/monitoring/src/pages/EndpointsPage.tsx`
- Test: `packages/monitoring/src/pages/EndpointsPage.test.tsx`
- Create: `packages/monitoring/src/pages/AlertsPage.tsx`
- Test: `packages/monitoring/src/pages/AlertsPage.test.tsx`

**Interfaces:**
- Consumes: `DashboardState`, `EndpointStats`, `Alert` types from `../data/simulation`; `StatTile`, `RequestVolumeChart`, `LatencyChart`, `UsageChart`, `EndpointTable`, `AlertsFeed` (with Task 2's new `limit` prop), `ActionPanel` (with Task 3's fixed behavior); `ChartRange` type from `../components/ChartRangeToggle`; icons from `../icons`; `describeRequestRate`/`describeLatency`/`describeErrorRate` from `../utils/trend`; `formatCompactNumber`/`formatMs`/`formatPercent` from `../utils/format`.
- Produces: `DashboardPage({ state, chartRange, onChartRangeChange })`, `EndpointsPage({ endpoints })`, `AlertsPage({ alerts })`. All three consumed by Task 6's `App.tsx`.

This task moves the trend/action-panel computation logic that currently lives in `App.tsx` into `DashboardPage` — read the current `App.tsx` (already quoted below) as the source of truth for that logic; don't re-derive it differently.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/pages/DashboardPage.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { createInitialState } from '../data/simulation';

describe('DashboardPage', () => {
  it('renders the stat tiles, action panel, and charts', () => {
    const state = createInitialState(1_700_000_000_000, () => 0.5);
    render(<DashboardPage state={state} chartRange="60s" onChartRangeChange={() => {}} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('p95 latency')).toBeInTheDocument();
    expect(screen.getByText('Error rate')).toBeInTheDocument();
    expect(screen.getByText('Active sessions')).toBeInTheDocument();
    expect(screen.getByText('What needs attention')).toBeInTheDocument();
    expect(screen.getByText('Request volume')).toBeInTheDocument();
  });
});
```

```tsx
// src/pages/EndpointsPage.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EndpointsPage } from './EndpointsPage';

const ENDPOINTS = [{ name: '/v1/chat/completions', requests: 1280, avgLatencyMs: 145, errorRatePct: 0.6 }];

describe('EndpointsPage', () => {
  it('renders the page title and the endpoint table', () => {
    render(<EndpointsPage endpoints={ENDPOINTS} />);
    expect(screen.getByText('Endpoints')).toBeInTheDocument();
    expect(screen.getByText('/v1/chat/completions')).toBeInTheDocument();
  });
});
```

```tsx
// src/pages/AlertsPage.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsPage } from './AlertsPage';

const ALERTS = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  severity: 'info' as const,
  message: `Alert number ${i}`,
  timestamp: Date.now() - i * 1000,
}));

describe('AlertsPage', () => {
  it('renders the page title and more than 8 alerts', () => {
    render(<AlertsPage alerts={ALERTS} />);
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getAllByText(/^Alert number \d+$/).length).toBeGreaterThan(8);
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — none of the three page modules exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/pages/DashboardPage.tsx`**

```tsx
import type { DashboardState } from '../data/simulation';
import { StatTile } from '../components/StatTile';
import { RequestVolumeChart } from '../components/RequestVolumeChart';
import { LatencyChart } from '../components/LatencyChart';
import { UsageChart } from '../components/UsageChart';
import { ActionPanel } from '../components/ActionPanel';
import type { ChartRange } from '../components/ChartRangeToggle';
import { ActivityIcon, ClockIcon, AlertTriangleIcon, UsersIcon } from '../icons';
import { describeRequestRate, describeLatency, describeErrorRate } from '../utils/trend';
import { formatCompactNumber, formatMs, formatPercent } from '../utils/format';

export interface DashboardPageProps {
  state: DashboardState;
  chartRange: ChartRange;
  onChartRangeChange: (range: ChartRange) => void;
}

export function DashboardPage({ state, chartRange, onChartRangeChange }: DashboardPageProps) {
  // requestVolume's last point is the current value, so the baseline is the 5 points before it.
  const recentRequestRates = state.requestVolume.slice(-6, -1).map((p) => p.value);
  const requestTrend = describeRequestRate(state.requestsPerSec, recentRequestRates);
  const latencyTrend = describeLatency(state.p95LatencyMs);
  const errorTrend = describeErrorRate(state.errorRatePct);

  // The action panel watches both alarms, using the same thresholds as the stat tiles.
  // incidentKey stays stable while an incident continues, so an acknowledgment
  // survives the headline's live number ticking on every refresh.
  const hasErrorIncident = state.errorRatePct > 2;
  const hasLatencyIncident = state.p95LatencyMs > 500;
  const actionIncidentKey = hasErrorIncident ? 'errors' : hasLatencyIncident ? 'latency' : 'healthy';
  const actionHeadline =
    actionIncidentKey === 'errors'
      ? `Investigating elevated error rate (${formatPercent(state.errorRatePct)})`
      : actionIncidentKey === 'latency'
        ? `Investigating elevated p95 latency (${formatMs(state.p95LatencyMs)})`
        : 'No action needed. Every metric is within its threshold.';
  const actionTone: 'success' | 'error' = actionIncidentKey === 'healthy' ? 'success' : 'error';

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Production inference API, updated live every 2 seconds.</p>
      </header>

      <section className="stat-row" aria-label="Key metrics">
        <StatTile
          label="Requests/sec"
          value={formatCompactNumber(state.requestsPerSec)}
          icon={<ActivityIcon />}
          status={requestTrend.text}
          statusTone={requestTrend.tone}
        />
        <StatTile
          label="p95 latency"
          value={formatMs(state.p95LatencyMs)}
          tone={state.p95LatencyMs > 500 ? 'warning' : 'default'}
          icon={<ClockIcon />}
          status={latencyTrend.text}
          statusTone={latencyTrend.tone}
        />
        <StatTile
          label="Error rate"
          value={formatPercent(state.errorRatePct)}
          tone={state.errorRatePct > 2 ? 'error' : 'success'}
          icon={<AlertTriangleIcon />}
          status={errorTrend.text}
          statusTone={errorTrend.tone}
        />
        <StatTile
          label="Active sessions"
          value={formatCompactNumber(state.activeSessions)}
          icon={<UsersIcon />}
          status="within normal range"
          statusTone="default"
        />
      </section>

      <section className="action-row" aria-label="Recommended actions">
        <ActionPanel
          incidentKey={actionIncidentKey}
          headline={actionHeadline}
          headlineTone={actionTone}
          primaryActionLabel={actionIncidentKey === 'healthy' ? undefined : 'Acknowledge'}
        />
      </section>

      <section className="chart-grid" aria-label="Trends">
        <div className="chart-cell chart-cell--primary">
          <RequestVolumeChart data={state.requestVolume} range={chartRange} onRangeChange={onChartRangeChange} />
        </div>
        <div className="chart-cell">
          <LatencyChart data={state.latencyPercentiles} />
        </div>
        <div className="chart-cell">
          <UsageChart data={state.usage} />
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Implement `packages/monitoring/src/pages/EndpointsPage.tsx`**

```tsx
import type { EndpointStats } from '../data/simulation';
import { EndpointTable } from '../components/EndpointTable';

export interface EndpointsPageProps {
  endpoints: EndpointStats[];
}

export function EndpointsPage({ endpoints }: EndpointsPageProps) {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Endpoints</h1>
        <p className="page-subtitle">Request volume, latency, and error rate per route.</p>
      </header>
      <section aria-label="Endpoints">
        <EndpointTable endpoints={endpoints} />
      </section>
    </>
  );
}
```

- [ ] **Step 5: Implement `packages/monitoring/src/pages/AlertsPage.tsx`**

```tsx
import type { Alert } from '../data/simulation';
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
        <AlertsFeed alerts={alerts} now={Date.now()} limit={20} />
      </section>
    </>
  );
}
```

- [ ] **Step 6: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 7: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add packages/monitoring/src/pages/DashboardPage.tsx packages/monitoring/src/pages/DashboardPage.test.tsx packages/monitoring/src/pages/EndpointsPage.tsx packages/monitoring/src/pages/EndpointsPage.test.tsx packages/monitoring/src/pages/AlertsPage.tsx packages/monitoring/src/pages/AlertsPage.test.tsx
git commit -m "feat(monitoring): extract Dashboard, Endpoints, and Alerts into page components"
```

---

### Task 6: Integration — real nav, routing, density, and the final App.css pass

**Files:**
- Modify: `packages/monitoring/src/App.tsx`
- Modify: `packages/monitoring/src/App.css`
- Modify: `packages/monitoring/src/App.test.tsx`
- Modify: `packages/monitoring/src/App.actionPanel.test.tsx` (only if a route change affects how it locates elements — check first; it renders `<App />` directly and asserts on Dashboard-page content, which is the default route, so it likely needs no change beyond confirming it still passes)

**Interfaces:**
- Consumes: `useHashRoute`/`Route` (Task 1); `DashboardPage`/`EndpointsPage`/`AlertsPage` (Task 5); `ReportsPage` (Task 4).
- Produces: the finished, routed page. Nothing downstream consumes it further.

- [ ] **Step 1: Get visual design guidance**

Invoke `/frontend-design:frontend-design` for direction on the density/spacing retune and the nav's new real-link states (hover, focus, active) — the structure below is a functional baseline to refine, not a fixed spec, but keep every route and every element it wires together. In particular: reduce the page's outer side padding (`--pad-inline`) for a denser, more data-forward feel (the reference dashboard this whole redesign is inspired by uses noticeably tighter gutters than this page currently does), and make sure the shrunk page-title heading still reads as a clear, confident heading rather than an afterthought.

- [ ] **Step 2: Read the current `App.tsx` and `App.css` in full before editing**

Both are quoted in full in this brief already, but re-read the actual files first — this task is the only one touching them, but confirm nothing changed since this plan was written.

- [ ] **Step 3: Write the failing test additions — replace `App.test.tsx` in full**

```tsx
// src/App.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('renders the Dashboard route by default, with the nav, health badge, and action panel', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('What needs attention')).toBeInTheDocument();
    expect(screen.getByText(/All systems operational|Degraded performance/)).toBeInTheDocument();
  });

  it('navigates to the Endpoints page and back via real links (Review Focus #5)', async () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /primary/i });

    await userEvent.click(within(nav).getByRole('link', { name: 'Endpoints' }));
    expect(await screen.findByRole('heading', { name: 'Endpoints', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('Requests/sec')).not.toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Endpoints' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(within(nav).getByRole('link', { name: 'Dashboard' }));
    expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
  });

  it('navigates to Alerts and Reports (Review Focus #5)', async () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /primary/i });

    await userEvent.click(within(nav).getByRole('link', { name: 'Alerts' }));
    expect(await screen.findByRole('heading', { name: 'Alerts', level: 1 })).toBeInTheDocument();

    await userEvent.click(within(nav).getByRole('link', { name: 'Reports' }));
    expect(await screen.findByRole('heading', { name: 'Reports', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Usage report')).toBeInTheDocument();
  });

  it('nav links are keyboard-focusable real links (Review Focus #3)', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /primary/i });
    const endpointsLink = within(nav).getByRole('link', { name: 'Endpoints' });
    expect(endpointsLink.tagName).toBe('A');
    expect(endpointsLink).toHaveAttribute('href', '#/endpoints');
  });

  it("keeps the request volume chart's rendered SVG unchanged when the mock range toggle is clicked", async () => {
    render(<App />);
    const svgBefore = document.querySelector('svg.recharts-surface')?.outerHTML;
    expect(svgBefore).toBeDefined();

    const fiveMin = screen.getByRole('button', { name: '5m' });
    await userEvent.click(fiveMin);
    expect(fiveMin).toHaveAttribute('aria-pressed', 'true');

    const svgAfter = document.querySelector('svg.recharts-surface')?.outerHTML;
    expect(svgAfter).toBe(svgBefore);
  });
});
```

- [ ] **Step 4: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — no routing exists yet, nav links are still inert spans.

- [ ] **Step 5: Replace `packages/monitoring/src/App.tsx` in full**

```tsx
import { useState } from 'react';
import { Badge } from 'cyberui-2045';
import { useSimulatedMetrics } from './data/useSimulatedMetrics';
import { useHashRoute, type Route } from './router/useHashRoute';
import { DashboardPage } from './pages/DashboardPage';
import { EndpointsPage } from './pages/EndpointsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import type { ChartRange } from './components/ChartRangeToggle';
import { BellIcon } from './icons';
import './App.css';

const REFRESH_MS = 2000;

const NAV_ITEMS: readonly { label: string; route: Route }[] = [
  { label: 'Dashboard', route: 'dashboard' },
  { label: 'Endpoints', route: 'endpoints' },
  { label: 'Alerts', route: 'alerts' },
  { label: 'Reports', route: 'reports' },
];

export default function App() {
  const state = useSimulatedMetrics(REFRESH_MS);
  const [chartRange, setChartRange] = useState<ChartRange>('60s');
  const route = useHashRoute();
  // Same 2% threshold the Error rate tile uses, so badge and tile never disagree.
  const isHealthy = state.errorRatePct <= 2;
  const latestUsage = state.usage[state.usage.length - 1];

  return (
    <div className="dashboard">
      <nav className="topnav" aria-label="Primary">
        <div className="topnav-brand">
          <span className="topnav-logo" aria-hidden="true">
            ⬡
          </span>
          <span className="topnav-name">Nexus</span>
        </div>
        <div className="topnav-links">
          {NAV_ITEMS.map(({ label, route: itemRoute }) => (
            <a
              key={itemRoute}
              href={`#/${itemRoute}`}
              className={route === itemRoute ? 'topnav-link topnav-link--active' : 'topnav-link'}
              aria-current={route === itemRoute ? 'page' : undefined}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="topnav-status">
          <span className="live-dot" aria-hidden="true" />
          <Badge variant={isHealthy ? 'success' : 'error'}>
            {isHealthy ? 'All systems operational' : 'Degraded performance'}
          </Badge>
        </div>
        <BellIcon className="topnav-bell" />
      </nav>

      <main className="dashboard-body">
        {route === 'dashboard' && (
          <DashboardPage state={state} chartRange={chartRange} onChartRangeChange={setChartRange} />
        )}
        {route === 'endpoints' && <EndpointsPage endpoints={state.endpoints} />}
        {route === 'alerts' && <AlertsPage alerts={state.alerts} />}
        {route === 'reports' && (
          <ReportsPage
            requestsPerSec={state.requestsPerSec}
            latestCostPerHr={latestUsage?.costPerHr ?? 0}
            alerts={state.alerts}
          />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Update `packages/monitoring/src/App.css`**

Remove these rules entirely (the hero and its scope label, both superseded by the new page header + nav status): `.dashboard-header`, `.dashboard-heading`, `.dashboard-title`, `.dashboard-live`, `.dashboard-status`, `.dashboard-scope`. Keep the `.live-dot` rule and its `@keyframes live-pulse` / `prefers-reduced-motion` block exactly as they are — they're reused inside the new `.topnav-status`.

Change the density tokens at the top of the file:
```css
.dashboard {
  --gap: clamp(0.75rem, 1.4vw, 1.25rem);
  --readout-font: Bahnschrift, 'DIN Alternate', 'DIN 2014', 'Roboto Condensed', 'Arial Narrow', sans-serif;
  --pad-top: clamp(0.875rem, 1.6vw, 1.25rem);
  --pad-inline: clamp(0.875rem, 2vw, 1.5rem);

  box-sizing: border-box;
  min-height: 100vh;
  max-width: 1480px;
  margin: 0 auto;
  padding: var(--pad-top) var(--pad-inline) 3rem;
  color: var(--color-default);
  font-variant-numeric: tabular-nums;
}
```
(only `--pad-top` and `--pad-inline` change value; everything else in this block stays the same.)

Add new rules for the page header pattern (replaces the old hero) — place near where `.dashboard-scope` used to be:
```css
/* ---- Page header (per route) ------------------------------------------ */

.page-header {
  margin-bottom: clamp(1.25rem, 2.5vw, 2rem);
}

.page-title {
  margin: 0;
  font-family: var(--readout-font);
  font-size: clamp(1.5rem, 1rem + 2vw, 2.25rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--color-default);
}

.page-subtitle {
  margin: 0.5rem 0 0;
  color: var(--color-muted);
  font-size: 0.9375rem;
}
```

Add the nav status group (replaces the old `.dashboard-status`, sits in the nav now):
```css
.topnav-status {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
```

Update `.topnav-link` (it's a real `<a>` now, not an inert `<span>`) — change:
```css
.topnav-link {
  display: flex;
  align-items: center;
  margin-bottom: -1px; /* lets the active rule overlap the nav's border */
  border-bottom: 2px solid transparent;
  font-size: 0.8125rem;
  color: var(--color-muted);
  cursor: default;
}
```
to:
```css
.topnav-link {
  display: flex;
  align-items: center;
  margin-bottom: -1px; /* lets the active rule overlap the nav's border */
  border-bottom: 2px solid transparent;
  font-size: 0.8125rem;
  color: var(--color-muted);
  text-decoration: none;
}

.topnav-link:hover {
  color: var(--color-default);
}

.topnav-link:focus-visible {
  outline: 2px solid var(--color-secondary);
  outline-offset: 2px;
}
```
(`.topnav-link--active` stays exactly as it is.)

Add layout rules for `ReportsPage`, near the end of the file with the other component-specific sections:
```css
/* ---- Reports page -------------------------------------------------------- */

.report-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.report-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.report-stat-label {
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.report-stat-value {
  font-family: var(--readout-font);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-default);
}

.report-card-footer {
  margin-top: 1rem;
}

.report-export-done {
  color: var(--color-success);
  font-size: 0.8125rem;
}
```

Every other rule in `App.css` not mentioned above (the chart grid, lower grid, action panel, range toggle, panel title, etc.) stays exactly as it is — this task only touches the hero/header, the nav link states, the density tokens, and adds the Reports-specific rules.

- [ ] **Step 7: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS (all tests, old and new). If `App.actionPanel.test.tsx` fails, read why — it renders `<App />` directly, which defaults to the Dashboard route, so its assertions about the action panel should still hold; fix only if something genuinely changed for it, don't weaken its assertions to make it pass.

- [ ] **Step 8: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean exit.

- [ ] **Step 9: Commit**

```bash
git add packages/monitoring/src/App.tsx packages/monitoring/src/App.css packages/monitoring/src/App.test.tsx packages/monitoring/src/App.actionPanel.test.tsx
git commit -m "feat(monitoring): real multi-page navigation, denser layout, drop duplicated hero/badge messaging"
```
