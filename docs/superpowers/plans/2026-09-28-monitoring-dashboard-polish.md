# Monitoring Dashboard Polish & Zero-Warning Install Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `packages/monitoring`'s `npm install` to zero errors/warnings (Vitest 4, Recharts 3, happy-dom), then add visual polish inspired by a reference security dashboard: a top nav bar, stat-tile status lines with icons, a mock chart time-range control, richer alert text, and a "what needs attention" action panel.

**Architecture:** Task 1 migrates the test/runtime dependency chain in isolation, with the existing test suite as the safety net. Tasks 2-6 each add one small, independently-testable piece (icon set, trend helper, range toggle, alert rich-text, action panel) without touching `App.tsx`. Task 7 is the single integration point that wires all of it into `App.tsx`/`App.css` — mirroring how the original build's Task 8 was the only task that touched the composed page, which kept each prior task's diff reviewable in isolation.

**Tech Stack:** Same as the existing package (React 19, Vite 7, TS strict) plus Vitest 4, Recharts 3, and `happy-dom` replacing `jsdom` as the test environment.

**Spec:** `docs/superpowers/plans/2026-09-28-monitoring-dashboard.md` (original build plan — this plan extends that package, not the repo-level spec) and `docs/superpowers/specs/2026-09-27-cyberui-showcase-design.md`.

All code in Tasks 4, 5, and 7 below is transcribed directly from the actual current files in this repo (read immediately before writing this plan) — not reconstructed from memory of the original plan text.

## Global Constraints

- Styling for markup we author uses inline styles or `App.css`, referencing only cyberui-2045's documented `--color-*` custom properties (`--color-primary`, `--color-secondary`, `--color-accent`, `--color-success`, `--color-error`, `--color-warning`, `--color-base`, `--color-surface`, `--color-border-default`, `--color-default`, `--color-muted`, `--color-inverse`) — never cyberui-2045's internal Tailwind class names.
- No new runtime dependencies beyond what each task explicitly names (`@testing-library/user-event` as a devDependency in Task 4). No network calls, no web fonts.
- `packages/monitoring` stays standalone: no `workspace:` ranges, no imports outside the package.
- **Zero-warning bar for Task 1:** a fresh `npm install` in a clean copy of `packages/monitoring` (no pre-existing `node_modules`, outside the pnpm workspace) must print no `npm warn`, no deprecation notices, and `npm audit` must report 0 vulnerabilities. This is the task's acceptance criterion, not a nice-to-have.
- All new interactive elements added in this plan (nav tabs, chart range toggle, action-panel button) are **mock/noop by explicit product decision** — this is a forkable demo, not a real product. They must look and behave like real UI (hover/active states, keyboard-operable where it's a real `<button>`) but are not required to change simulated data.
- Existing public component APIs (`StatTile`, `EndpointTable`, `AlertsFeed`, `RequestVolumeChart`/`LatencyChart`/`UsageChart`) may gain new **optional** props (required for `RequestVolumeChart`'s new `range`/`onRangeChange`, since every caller is updated in the same plan); do not remove or change the meaning of existing props, and do not break existing tests except where a task explicitly updates them.

## Review Focus

1. Recharts 3's `ResponsiveContainer` sizes itself via a real `ResizeObserver` firing with a populated `contentRect`, unlike Recharts 2.15.4 which this package's tests satisfied via a `getBoundingClientRect` mock. If Task 1's environment swap doesn't actually make charts size non-zero under the new stack, every chart test would pass for the wrong reason or fail outright — tested by keeping the existing "renders a non-empty chart" assertions genuinely meaningful (real non-zero SVG dimensions), not weakened.
2. A `prepare`/lifecycle script from a newly-resolved transitive dependency could reintroduce exactly the `husky install` failure seen earlier when this package's `node_modules` is freshly installed — tested by Task 1's mandatory clean-room install check (a real `npm install` in a directory with no pre-existing `node_modules`, not just `pnpm install` at the repo root).
3. The new mock chart-range toggle could look like it's lying (three buttons that appear to change data but don't) — tested by giving it an accessible label that says it's display-only, and by tests confirming the chart's underlying SVG is unchanged after a range-button click.
4. The new top nav's inert links (`Endpoints`, `Alerts`, `Settings`) must not trap keyboard focus or announce as broken buttons to assistive tech — addressed by using non-interactive `<span aria-disabled="true">` elements (not `<button disabled>`, which some screen readers still announce as an actionable-but-broken control), and tested in Task 7 by asserting they carry no `button`/`link` role.
5. `ActionPanel`'s "Acknowledge" state must reset when the underlying condition changes (a healthy dashboard shouldn't show a stale "Acknowledged" badge for an incident that already ended, nor should a brand-new incident inherit a stale acknowledgment) — tested by Task 6's own test.

---

### Task 1: Dependency and test-environment migration (Vitest 4, Recharts 3, happy-dom)

**Files:**
- Modify: `packages/monitoring/package.json`
- Modify: `packages/monitoring/src/test/setup.ts`
- Modify: `packages/monitoring/vite.config.ts`
- Modify: `packages/monitoring/src/components/RequestVolumeChart.tsx`, `LatencyChart.tsx`, `UsageChart.tsx` (only if Recharts 3's API requires it — verify empirically, do not change anything Recharts 3 doesn't require)
- Modify: those components' test files, only if Recharts 3 changes what's observable in the rendered output

**Interfaces:**
- Consumes: nothing new.
- Produces: the same public component APIs (`RequestVolumeChartProps`, `LatencyChartProps`, `UsageChartProps` unchanged) on top of Recharts 3; all later tasks build on this dependency set.

This task is investigative — the exact code changes Recharts 3 requires (if any) can only be discovered by running it, not predicted in advance. Follow the steps, adapting as the empirical results dictate, but do not weaken any assertion to make it pass; fix the underlying cause.

- [ ] **Step 1: Bump versions in `packages/monitoring/package.json`**

Change `"recharts": "^2.15.0"` to `"recharts": "3.10.1"`.

Change:
```json
"jsdom": "^25.0.1",
"vitest": "^3.2.4"
```
to:
```json
"happy-dom": "^19.0.0",
"vitest": "4.1.11"
```
(remove the `jsdom` line entirely — it's replaced by `happy-dom`).

- [ ] **Step 2: Update `packages/monitoring/vite.config.ts`'s test environment**

Change `environment: 'jsdom'` to `environment: 'happy-dom'`.

- [ ] **Step 3: Install and run the existing suite to see what actually breaks**

Run: `pnpm install` (from the repo root), then `pnpm --filter monitoring-dashboard-demo run test`.

Expect failures — do not assume none. Read every failure. Likely candidates, in order of likelihood:
- Chart tests' `svg.recharts-surface` width/height assertions returning 0 again, because the current `src/test/setup.ts` (a `getBoundingClientRect` mock plus a `ResizeObserverStub` whose `observe()`/`unobserve()`/`disconnect()` are all no-ops that never invoke the stored callback) was tuned for Recharts 2.15.4 + jsdom, not Recharts 3 + happy-dom. happy-dom implements a real `ResizeObserver` whose callback fires with an actual `contentRect`, and its `getComputedStyle` reflects explicit inline pixel dimensions on an element (verified: a `<div style="width: 100px">` reports `getComputedStyle(el).width === '100px'` under happy-dom). Investigate whether removing the `getBoundingClientRect` mock and instead giving the chart wrapper `<div style={{ height: 220 }}>` (already present in every chart component) enough explicit sizing — or making the `ResizeObserverStub` a minimal real implementation whose `observe()` synchronously invokes its callback with a `contentRect` derived from the observed element's own computed style — makes Recharts 3's `ResponsiveContainer` size correctly under happy-dom. Prefer the smallest fix that makes the assertion pass for a real reason (the SVG actually receives a non-zero width/height Recharts computed from something), not a fix that hard-codes a fake value.
- TypeScript strict-mode errors from Recharts 3's updated type definitions — this package does not use `ReferenceLine` or forward chart refs (the two documented v3 breaking changes that would affect it), so if `tsc --noEmit` (via `pnpm --filter monitoring-dashboard-demo run build`) reports something in a chart component, read the actual reported type and adjust that call site's typing (prefer contextual inference over explicit annotations, consistent with this package's existing style) rather than casting to `any`.
- Vitest 4 config errors — this package doesn't use `workspace`, `singleThread`/`singleFork`, or the `test(name, fn, options)` third-argument form anywhere (the three documented v3→v4 breaking changes), so none of these should apply; if `vite.config.ts`'s `test` block errors, read the actual message.

- [ ] **Step 4: Fix whatever Step 3 surfaced, re-running the focused test file after each change**

Do not touch `src/data/simulation.ts`, `src/data/useSimulatedMetrics.ts`, or any non-chart component — this task's blast radius is the test environment and the three chart components only.

- [ ] **Step 5: Run the full suite and the build**

Run: `pnpm --filter monitoring-dashboard-demo run test` — expect all 22 existing tests to pass, pristine output.
Run: `pnpm --filter monitoring-dashboard-demo run build` — expect a clean exit.

- [ ] **Step 6: Verify the zero-warning install bar in a genuinely clean copy**

```bash
rm -rf /tmp/monitoring-zero-warn-check
cp -r packages/monitoring /tmp/monitoring-zero-warn-check
rm -rf /tmp/monitoring-zero-warn-check/node_modules /tmp/monitoring-zero-warn-check/dist
cd /tmp/monitoring-zero-warn-check
npm install
npm audit
cd -
rm -rf /tmp/monitoring-zero-warn-check
```
Expected: `npm install` prints no `npm warn` lines and no deprecation notices; `npm audit` reports `found 0 vulnerabilities`. If anything still prints, it is a real problem to fix (a version pin, not an acceptable exception) — this step is the task's actual acceptance bar.

- [ ] **Step 7: Commit**

```bash
git add packages/monitoring/package.json pnpm-lock.yaml packages/monitoring/vite.config.ts packages/monitoring/src/test/setup.ts
git add packages/monitoring/src/components/RequestVolumeChart.tsx packages/monitoring/src/components/LatencyChart.tsx packages/monitoring/src/components/UsageChart.tsx
git commit -m "chore(monitoring): migrate to Vitest 4, Recharts 3, happy-dom for a zero-warning install"
```
(Only the chart component files that Step 4 actually changed will show as modified — `git add` is safe to run on unmodified tracked files too, it's a no-op for them.)

---

### Task 2: Icon set

**Files:**
- Create: `packages/monitoring/src/icons/index.tsx`
- Test: `packages/monitoring/src/icons/index.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `ActivityIcon`, `ClockIcon`, `AlertTriangleIcon`, `UsersIcon`, `ServerIcon`, `BellIcon` — each `(props: { size?: number; className?: string }) => JSX.Element`, default `size = 16`, rendering an `<svg aria-hidden="true">` that inherits color via `stroke="currentColor"` (always paired with visible text elsewhere, never used as the only label). Consumed by Task 7 (`ActivityIcon`, `ClockIcon`, `AlertTriangleIcon`, `UsersIcon` on stat tiles; `BellIcon` in the nav bar). `ServerIcon` is exported for future use but not consumed by this plan.

- [ ] **Step 1: Write the failing test**

```tsx
// src/icons/index.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ActivityIcon, ClockIcon, AlertTriangleIcon, UsersIcon, ServerIcon, BellIcon } from './index';

const ICONS = { ActivityIcon, ClockIcon, AlertTriangleIcon, UsersIcon, ServerIcon, BellIcon };

describe('icon set', () => {
  for (const [name, Icon] of Object.entries(ICONS)) {
    it(`${name} renders an accessible, sized svg`, () => {
      const { container } = render(<Icon size={24} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(svg?.getAttribute('width')).toBe('24');
      expect(svg?.getAttribute('height')).toBe('24');
    });
  }
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./index` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/icons/index.tsx`**

```tsx
export interface IconProps {
  size?: number;
  className?: string;
}

function baseProps(size: number, className: string | undefined) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': 'true' as const,
    className,
  };
}

export function ActivityIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M3 12h4l2.5 7L14 5l2.5 7H21" />
    </svg>
  );
}

export function ClockIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function AlertTriangleIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M10.6 3.5 2.3 18a1.5 1.5 0 0 0 1.3 2.2h16.8a1.5 1.5 0 0 0 1.3-2.2L13.4 3.5a1.6 1.6 0 0 0-2.8 0Z" />
      <path d="M12 9.5v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function UsersIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16.5 5.2a3.25 3.25 0 0 1 0 6.1" />
      <path d="M18.5 14.7c2.6.6 4 2.4 4 5.3" />
    </svg>
  );
}

export function ServerIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3" y="4" width="18" height="6.5" rx="1.5" />
      <rect x="3" y="13.5" width="18" height="6.5" rx="1.5" />
      <path d="M7 7.25h.01" />
      <path d="M7 16.75h.01" />
    </svg>
  );
}

export function BellIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/monitoring/src/icons
git commit -m "feat(monitoring): add a small hand-authored icon set"
```

---

### Task 3: Trend/status helper and `StatTile` icon + status line

**Files:**
- Create: `packages/monitoring/src/utils/trend.ts`
- Test: `packages/monitoring/src/utils/trend.test.ts`
- Modify: `packages/monitoring/src/components/StatTile.tsx`
- Modify: `packages/monitoring/src/components/StatTile.test.tsx` (add cases; the existing test stays as-is)

**Interfaces:**
- Consumes: nothing new (icons are passed in by the caller in Task 7, not imported by `StatTile` itself).
- Produces: `describeRequestRate(current: number, previous: number)`, `describeLatency(p95LatencyMs: number)`, `describeErrorRate(errorRatePct: number)` — each returns `{ text: string; tone: 'default' | 'success' | 'warning' | 'error' }`. `StatTile` gains optional `icon?: React.ReactNode`, `status?: string`, `statusTone?: 'default' | 'success' | 'warning' | 'error'`. Task 7 imports the helpers and passes their output, plus an icon from Task 2, into `StatTile`.

- [ ] **Step 1: Write the failing helper tests**

```ts
// src/utils/trend.test.ts
import { describe, it, expect } from 'vitest';
import { describeRequestRate, describeLatency, describeErrorRate } from './trend';

describe('describeRequestRate', () => {
  it('reports steady when the change is small', () => {
    expect(describeRequestRate(420, 410)).toEqual({ text: 'steady', tone: 'default' });
  });
  it('reports rising on a meaningful increase', () => {
    expect(describeRequestRate(500, 420)).toEqual({ text: 'rising', tone: 'success' });
  });
  it('reports falling on a meaningful decrease', () => {
    expect(describeRequestRate(340, 420)).toEqual({ text: 'falling', tone: 'warning' });
  });
});

describe('describeLatency', () => {
  it('reports within target under 500ms', () => {
    expect(describeLatency(220)).toEqual({ text: 'within target', tone: 'success' });
  });
  it('reports elevated at or above 500ms', () => {
    expect(describeLatency(520)).toEqual({ text: 'elevated', tone: 'warning' });
  });
});

describe('describeErrorRate', () => {
  it('reports healthy at or under 2%', () => {
    expect(describeErrorRate(0.5)).toEqual({ text: 'healthy', tone: 'success' });
  });
  it('reports above threshold over 2%', () => {
    expect(describeErrorRate(3.1)).toEqual({ text: 'above threshold', tone: 'error' });
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./trend` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/utils/trend.ts`**

```ts
export type Tone = 'default' | 'success' | 'warning' | 'error';

export interface Trend {
  text: string;
  tone: Tone;
}

const REQUEST_RATE_STEADY_DELTA = 15;

export function describeRequestRate(current: number, previous: number): Trend {
  const delta = current - previous;
  if (Math.abs(delta) < REQUEST_RATE_STEADY_DELTA) {
    return { text: 'steady', tone: 'default' };
  }
  return delta > 0 ? { text: 'rising', tone: 'success' } : { text: 'falling', tone: 'warning' };
}

export function describeLatency(p95LatencyMs: number): Trend {
  return p95LatencyMs >= 500
    ? { text: 'elevated', tone: 'warning' }
    : { text: 'within target', tone: 'success' };
}

export function describeErrorRate(errorRatePct: number): Trend {
  return errorRatePct > 2
    ? { text: 'above threshold', tone: 'error' }
    : { text: 'healthy', tone: 'success' };
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Write the failing `StatTile` tests for the new props**

Add to the existing `StatTile.test.tsx` (keep the existing test as-is):

```tsx
it('renders an icon and status line when provided', () => {
  render(
    <StatTile
      label="Requests/sec"
      value="1.3K"
      icon={<span data-testid="stat-icon">icon</span>}
      status="steady"
      statusTone="default"
    />,
  );
  expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  expect(screen.getByText('steady')).toBeInTheDocument();
});

it('renders without an icon or status when not provided', () => {
  render(<StatTile label="Active sessions" value="1.3K" />);
  expect(screen.queryByTestId('stat-icon')).not.toBeInTheDocument();
});
```

- [ ] **Step 6: Run the tests, verify the new ones fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `StatTile` doesn't accept `icon`/`status`/`statusTone` yet.

- [ ] **Step 7: Update `packages/monitoring/src/components/StatTile.tsx`**

```tsx
import type { ReactNode } from 'react';
import { Card } from 'cyberui-2045';

export interface StatTileProps {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
  icon?: ReactNode;
  status?: string;
  statusTone?: 'default' | 'success' | 'warning' | 'error';
}

const TONE_VAR: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'var(--color-default)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
};

export function StatTile({ label, value, tone = 'default', icon, status, statusTone = 'default' }: StatTileProps) {
  return (
    <Card title={label} variant="small" titleBorder={false}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon && (
          <span style={{ color: 'var(--color-secondary)', display: 'inline-flex' }} aria-hidden="true">
            {icon}
          </span>
        )}
        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: TONE_VAR[tone] }}>{value}</p>
      </div>
      {status && (
        <p
          style={{
            margin: '0.375rem 0 0',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: TONE_VAR[statusTone],
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: 6, height: 6, borderRadius: '9999px', background: 'currentColor', display: 'inline-block' }}
          />
          {status}
        </p>
      )}
    </Card>
  );
}
```

- [ ] **Step 8: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS (all `StatTile` tests, including the original one, still green)

- [ ] **Step 9: Commit**

```bash
git add packages/monitoring/src/utils/trend.ts packages/monitoring/src/utils/trend.test.ts packages/monitoring/src/components/StatTile.tsx packages/monitoring/src/components/StatTile.test.tsx
git commit -m "feat(monitoring): add trend helper and StatTile icon/status line"
```

---

### Task 4: Chart panel header pattern and mock time-range toggle

**Files:**
- Create: `packages/monitoring/src/components/ChartRangeToggle.tsx`
- Test: `packages/monitoring/src/components/ChartRangeToggle.test.tsx`
- Modify: `packages/monitoring/src/components/RequestVolumeChart.tsx`
- Modify: `packages/monitoring/src/components/RequestVolumeChart.test.tsx`
- Modify: `packages/monitoring/src/components/LatencyChart.tsx`
- Modify: `packages/monitoring/src/components/UsageChart.tsx`
- Modify: `packages/monitoring/package.json` (add `@testing-library/user-event`)

**Interfaces:**
- Consumes: `MetricPoint` (unchanged); `useChartColors`/`chartTooltipProps` from `../theme/chartColors` (unchanged).
- Produces: `ChartRangeToggle({ value, onChange })` where `value: ChartRange` (`'60s' | '5m' | '15m'`) and `onChange: (value: ChartRange) => void`; exports the `ChartRange` type. `RequestVolumeChart` gains two new **required** props, `range: ChartRange` and `onRangeChange: (value: ChartRange) => void`. Task 7 owns the `chartRange` state and passes it down.

Only `RequestVolumeChart` gets the range toggle (it's the primary/hero chart). `LatencyChart` and `UsageChart` get the same custom title styling for visual consistency, but no toggle.

**Before Step 7:** check whether Task 1 changed anything in `RequestVolumeChart.tsx` beyond this plan's transcribed content (check its commit, or diff against what Step 7 is about to write). If Task 1 made a real Recharts-3-compatibility fix in this file, carry that fix forward into the replacement below rather than silently reverting it.

- [ ] **Step 1: Add `@testing-library/user-event` and write the failing `ChartRangeToggle` test**

In `packages/monitoring/package.json`, add to `devDependencies`: `"@testing-library/user-event": "^14.5.2"`. Run `pnpm install` from the repo root.

```tsx
// src/components/ChartRangeToggle.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartRangeToggle } from './ChartRangeToggle';

describe('ChartRangeToggle', () => {
  it('marks the current value as pressed and calls onChange with the clicked value', async () => {
    const onChange = vi.fn();
    render(<ChartRangeToggle value="60s" onChange={onChange} />);

    expect(screen.getByRole('button', { name: '60s' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '5m' })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: '15m' }));
    expect(onChange).toHaveBeenCalledWith('15m');
  });

  it('labels the control as display-only for assistive tech (Review Focus #3)', () => {
    render(<ChartRangeToggle value="60s" onChange={() => {}} />);
    expect(screen.getByRole('group', { name: /display only/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./ChartRangeToggle` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/components/ChartRangeToggle.tsx`**

```tsx
export type ChartRange = '60s' | '5m' | '15m';

export interface ChartRangeToggleProps {
  value: ChartRange;
  onChange: (value: ChartRange) => void;
}

const RANGES: ChartRange[] = ['60s', '5m', '15m'];

export function ChartRangeToggle({ value, onChange }: ChartRangeToggleProps) {
  return (
    <div className="range-toggle" role="group" aria-label="Chart time range (display only in this demo)">
      {RANGES.map((range) => {
        const active = range === value;
        return (
          <button
            key={range}
            type="button"
            className={active ? 'range-toggle-btn range-toggle-btn--active' : 'range-toggle-btn'}
            aria-pressed={active}
            onClick={() => onChange(range)}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Write the failing `RequestVolumeChart` test update**

Replace `packages/monitoring/src/components/RequestVolumeChart.test.tsx` in full:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequestVolumeChart } from './RequestVolumeChart';

const DATA = [
  { t: 1, value: 100 },
  { t: 2, value: 150 },
  { t: 3, value: 200 },
];

describe('RequestVolumeChart', () => {
  it('renders a non-empty chart for the given data (Review Focus #4, original plan)', () => {
    const { container } = render(<RequestVolumeChart data={DATA} range="60s" onRangeChange={() => {}} />);
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(svg?.getAttribute('height'))).toBeGreaterThan(0);
  });

  it('renders the range toggle and forwards range changes without altering the chart data (Review Focus #3)', () => {
    const onRangeChange = vi.fn();
    const { rerender, container } = render(<RequestVolumeChart data={DATA} range="60s" onRangeChange={onRangeChange} />);
    const svgBefore = container.querySelector('svg.recharts-surface')?.outerHTML;

    screen.getByRole('button', { name: '5m' }).click();
    expect(onRangeChange).toHaveBeenCalledWith('5m');

    rerender(<RequestVolumeChart data={DATA} range="5m" onRangeChange={onRangeChange} />);
    const svgAfter = container.querySelector('svg.recharts-surface')?.outerHTML;
    expect(svgAfter).toBe(svgBefore);
  });
});
```

- [ ] **Step 6: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `RequestVolumeChart` doesn't accept `range`/`onRangeChange` yet.

- [ ] **Step 7: Replace `packages/monitoring/src/components/RequestVolumeChart.tsx` in full**

```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'cyberui-2045';
import type { MetricPoint } from '../data/simulation';
import { useChartColors, chartTooltipProps } from '../theme/chartColors';
import { formatCompactNumber } from '../utils/format';
import { ChartRangeToggle, type ChartRange } from './ChartRangeToggle';

export interface RequestVolumeChartProps {
  data: MetricPoint[];
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
}

export function RequestVolumeChart({ data, range, onRangeChange }: RequestVolumeChartProps) {
  const colors = useChartColors();

  return (
    <Card variant="default">
      <div className="chart-card-header">
        <h3 className="panel-title">Request volume</h3>
        <ChartRangeToggle value={range} onChange={onRangeChange} />
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={false} />
            <YAxis tickFormatter={formatCompactNumber} stroke={colors.muted} width={48} />
            <Tooltip
              formatter={(value) => [formatCompactNumber(Number(value)), 'req/s']}
              {...chartTooltipProps(colors)}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.secondary}
              fill={colors.secondary}
              fillOpacity={0.25}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 8: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 9: Give `LatencyChart` and `UsageChart` the same title styling (no toggle)**

In `packages/monitoring/src/components/LatencyChart.tsx`, change:
```tsx
    <Card title="Latency percentiles">
```
to:
```tsx
    <Card variant="default">
      <h3 className="panel-title">Latency percentiles</h3>
```
(add the matching closing — the `<Card>` still wraps everything, only its `title` prop is replaced by an explicit `<h3>` as the first child; every other line, including the `</Card>` at the end, stays exactly as it is).

In `packages/monitoring/src/components/UsageChart.tsx`, change:
```tsx
    <Card title="Token usage">
```
to:
```tsx
    <Card variant="default">
      <h3 className="panel-title">Token usage</h3>
```
(same pattern — everything else in the file, including the cost-per-hour paragraph and the chart, stays unchanged).

- [ ] **Step 10: Run the full suite and build**

Run: `pnpm --filter monitoring-dashboard-demo run test` and `pnpm --filter monitoring-dashboard-demo run build`
Expected: PASS / clean build. (`LatencyChart`/`UsageChart` tests assert on chart content and legend text, not the `Card` title prop, so the visible heading text is unchanged and these should pass without modification — if either test does query the title text directly, it will still find it, since `<h3 className="panel-title">Token usage</h3>` renders the identical visible string "Token usage" the `Card` title prop used to.)

- [ ] **Step 11: Commit**

```bash
git add packages/monitoring/src/components/ChartRangeToggle.tsx packages/monitoring/src/components/ChartRangeToggle.test.tsx packages/monitoring/src/components/RequestVolumeChart.tsx packages/monitoring/src/components/RequestVolumeChart.test.tsx packages/monitoring/src/components/LatencyChart.tsx packages/monitoring/src/components/UsageChart.tsx packages/monitoring/package.json
git add pnpm-lock.yaml
git commit -m "feat(monitoring): add chart panel header pattern and mock range toggle"
```

---

### Task 5: Rich alert text

**Files:**
- Modify: `packages/monitoring/src/data/simulation.ts`
- Modify: `packages/monitoring/src/components/AlertsFeed.tsx`
- Modify: `packages/monitoring/src/components/AlertsFeed.test.tsx` (add cases; both existing tests stay as-is — they use plain object literals without `highlight`, which remains valid since it's optional)

**Interfaces:**
- Consumes: `Alert`, `AlertSeverity` from `../data/simulation`; `TimelineEvent` from `cyberui-2045` (unchanged).
- Produces: `Alert` gains an optional `highlight?: string` field — the exact substring of `message` to render bold. `AlertsFeed` renders `title` as a `ReactNode` (bold segment + rest) when `highlight` is present, plain text otherwise.

- [ ] **Step 1: Write the failing `AlertsFeed` test**

Add to `packages/monitoring/src/components/AlertsFeed.test.tsx` (keep both existing tests):

```tsx
it('bolds the highlighted phrase within an alert message', () => {
  const alerts = [
    {
      id: '1',
      severity: 'critical' as const,
      message: 'Error rate above threshold on us-east-1',
      highlight: 'Error rate above threshold',
      timestamp: NOW - 30_000,
    },
  ];
  render(<AlertsFeed alerts={alerts} now={NOW} />);
  const bold = screen.getByText('Error rate above threshold');
  expect(bold.tagName).toBe('STRONG');
  expect(screen.getByText(/on us-east-1/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests, verify the new one fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `Alert` has no `highlight` field yet and `AlertsFeed` doesn't render it.

- [ ] **Step 3: Update `packages/monitoring/src/data/simulation.ts`**

Change the `Alert` interface:
```ts
export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  /** Exact substring of `message` that AlertsFeed bolds; omitted messages render as plain text. */
  highlight?: string;
  timestamp: number;
}
```

Change the `BACKGROUND_ALERTS` array:
```ts
const BACKGROUND_ALERTS: readonly { severity: AlertSeverity; message: string; highlight: string }[] = [
  { severity: 'info', message: 'Deploy completed: model-router v2.3.1', highlight: 'Deploy completed' },
  { severity: 'info', message: 'Autoscaler added 2 nodes to inference pool', highlight: 'Autoscaler added 2 nodes' },
  { severity: 'warning', message: 'Approaching rate limit for org acme-corp', highlight: 'Approaching rate limit' },
];
```

In `createInitialState`, change the seed alert:
```ts
alerts: [
  {
    id: 'seed-1',
    severity: 'info',
    message: 'Dashboard connected — streaming live metrics',
    highlight: 'Dashboard connected',
    timestamp: now,
  },
],
```

In `step`, change the `push` helper and its call sites:
```ts
const push = (severity: AlertSeverity, message: string, highlight: string): void => {
  newAlerts.unshift({
    id: `alert-${now}-${newAlerts.length}-${Math.floor(rng() * 100000)}`,
    severity,
    message,
    highlight,
    timestamp: now,
  });
};

const alarms = { ...state.alarms };
if (!alarms.errorRate && errorRatePct > ERROR_RATE_THRESHOLD_PCT) {
  alarms.errorRate = true;
  push('critical', 'Error rate above threshold on us-east-1', 'Error rate above threshold');
} else if (alarms.errorRate && errorRatePct < ERROR_RATE_RESOLVE_PCT) {
  alarms.errorRate = false;
  push('info', 'Resolved: error rate back to normal', 'Resolved');
}
if (!alarms.latency && p95LatencyMs > P95_LATENCY_THRESHOLD_MS) {
  alarms.latency = true;
  push('warning', 'p95 latency spike on /v1/chat/completions', 'p95 latency spike');
} else if (alarms.latency && p95LatencyMs < P95_LATENCY_RESOLVE_MS) {
  alarms.latency = false;
  push('info', 'Resolved: p95 latency back to normal', 'Resolved');
}
if (rng() < BACKGROUND_ALERT_CHANCE) {
  const event = BACKGROUND_ALERTS[Math.floor(rng() * BACKGROUND_ALERTS.length)] ?? BACKGROUND_ALERTS[0];
  if (event) push(event.severity, event.message, event.highlight);
}
```

Every other line in `simulation.ts` (the mean-reverting logic, endpoint handling, `alarms`/`incident` bookkeeping) is unchanged.

- [ ] **Step 4: Update `packages/monitoring/src/components/AlertsFeed.tsx` in full**

```tsx
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
  const events: TimelineEvent[] = alerts.slice(0, VISIBLE_ALERTS).map((alert) => ({
    title: renderTitle(alert),
    time: formatRelativeTime(alert.timestamp, now),
    status: SEVERITY_TO_STATUS[alert.severity],
  }));

  return (
    <Card title="Alerts">
      <Timeline events={events} size="sm" />
    </Card>
  );
}
```

- [ ] **Step 5: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS (all `AlertsFeed` and `simulation` tests, old and new).

- [ ] **Step 6: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add packages/monitoring/src/data/simulation.ts packages/monitoring/src/components/AlertsFeed.tsx packages/monitoring/src/components/AlertsFeed.test.tsx
git commit -m "feat(monitoring): bold the key phrase in each alert message"
```

---

### Task 6: `ActionPanel`

**Files:**
- Create: `packages/monitoring/src/components/ActionPanel.tsx`
- Test: `packages/monitoring/src/components/ActionPanel.test.tsx`

**Interfaces:**
- Consumes: nothing from other tasks — deliberately decoupled from `DashboardState` internals so it's independently testable; Task 7 computes its props from `isHealthy`, a value `App.tsx` already has.
- Produces: `ActionPanel({ headline, headlineTone, primaryActionLabel? })` where `headlineTone: 'success' | 'error'`. Consumed by Task 7.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/ActionPanel.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionPanel } from './ActionPanel';

describe('ActionPanel', () => {
  it('renders the headline', () => {
    render(<ActionPanel headline="All systems operational — no action needed" headlineTone="success" />);
    expect(screen.getByText('All systems operational — no action needed')).toBeInTheDocument();
  });

  it('shows an action button that becomes an acknowledged state when clicked (Review Focus #5)', async () => {
    render(
      <ActionPanel
        headline="Investigating elevated error rate (3.1%)"
        headlineTone="error"
        primaryActionLabel="Acknowledge"
      />,
    );
    const button = screen.getByRole('button', { name: 'Acknowledge' });
    await userEvent.click(button);
    expect(screen.queryByRole('button', { name: 'Acknowledge' })).not.toBeInTheDocument();
    expect(screen.getByText(/Acknowledged/)).toBeInTheDocument();
  });

  it('resets the acknowledged state when the headline changes (Review Focus #5)', async () => {
    const { rerender } = render(
      <ActionPanel headline="Investigating elevated error rate (3.1%)" headlineTone="error" primaryActionLabel="Acknowledge" />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    expect(screen.getByText(/Acknowledged/)).toBeInTheDocument();

    rerender(
      <ActionPanel headline="Investigating a new latency spike" headlineTone="error" primaryActionLabel="Acknowledge" />,
    );
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeInTheDocument();
  });

  it('omits the action button entirely when no primaryActionLabel is given', () => {
    render(<ActionPanel headline="All systems operational — no action needed" headlineTone="success" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

(`@testing-library/user-event` is already a devDependency from Task 4.)

- [ ] **Step 2: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./ActionPanel` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/components/ActionPanel.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Card } from 'cyberui-2045';

export interface ActionPanelProps {
  headline: string;
  headlineTone: 'success' | 'error';
  primaryActionLabel?: string;
}

const TONE_VAR: Record<ActionPanelProps['headlineTone'], string> = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
};

export function ActionPanel({ headline, headlineTone, primaryActionLabel }: ActionPanelProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    setAcknowledged(false);
  }, [headline]);

  return (
    <Card title="What needs attention">
      <div className="action-item">
        <span className="action-dot" style={{ background: TONE_VAR[headlineTone] }} aria-hidden="true" />
        <div className="action-item-body">
          <p className="action-item-title">{headline}</p>
          {primaryActionLabel && !acknowledged && (
            <button type="button" className="action-item-button" onClick={() => setAcknowledged(true)}>
              {primaryActionLabel}
            </button>
          )}
          {primaryActionLabel && acknowledged && <span className="action-item-done">Acknowledged</span>}
        </div>
      </div>
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

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/monitoring/src/components/ActionPanel.tsx packages/monitoring/src/components/ActionPanel.test.tsx
git commit -m "feat(monitoring): add ActionPanel"
```

---

### Task 7: Integration — top nav bar, and wiring everything into `App.tsx`

**Files:**
- Modify: `packages/monitoring/src/App.tsx`
- Modify: `packages/monitoring/src/App.css`
- Modify: `packages/monitoring/src/App.test.tsx`

**Interfaces:**
- Consumes: `ActivityIcon`/`ClockIcon`/`AlertTriangleIcon`/`UsersIcon`/`BellIcon` (Task 2); `describeRequestRate`/`describeLatency`/`describeErrorRate` and `StatTile`'s new props (Task 3); `RequestVolumeChart`'s new `range`/`onRangeChange` props and `ChartRange` type (Task 4); `AlertsFeed` unchanged props, now rendering rich text (Task 5); `ActionPanel` (Task 6).
- Produces: the finished page. Nothing downstream in this plan consumes it further.

- [ ] **Step 1: Get visual design guidance**

Invoke `/frontend-design:frontend-design` for direction on integrating a top nav bar and an action panel into the existing page without it feeling bolted-on — this adds two new UI surfaces to a page with an established visual language (see the file header comment in `App.css`: "an instrument panel... one loud element, everything else quiet"). Use its guidance for spacing, nav bar density, and action panel placement; the structure below is a functional baseline to refine, not a fixed spec — keep every element it wires together.

- [ ] **Step 2: Replace `packages/monitoring/src/App.tsx` in full**

```tsx
import { useState } from 'react';
import { SectionTitle, Badge } from 'cyberui-2045';
import { useSimulatedMetrics } from './data/useSimulatedMetrics';
import { StatTile } from './components/StatTile';
import { RequestVolumeChart } from './components/RequestVolumeChart';
import { LatencyChart } from './components/LatencyChart';
import { UsageChart } from './components/UsageChart';
import { EndpointTable } from './components/EndpointTable';
import { AlertsFeed } from './components/AlertsFeed';
import { ActionPanel } from './components/ActionPanel';
import type { ChartRange } from './components/ChartRangeToggle';
import { ActivityIcon, ClockIcon, AlertTriangleIcon, UsersIcon, BellIcon } from './icons';
import { describeRequestRate, describeLatency, describeErrorRate } from './utils/trend';
import { formatCompactNumber, formatMs, formatPercent } from './utils/format';
import './App.css';

const REFRESH_MS = 2000;

export default function App() {
  const state = useSimulatedMetrics(REFRESH_MS);
  const [chartRange, setChartRange] = useState<ChartRange>('60s');
  // Same 2% threshold the Error rate tile uses, so badge and tile never disagree.
  const isHealthy = state.errorRatePct <= 2;

  const previousRequestRate = state.requestVolume[state.requestVolume.length - 2]?.value ?? state.requestsPerSec;
  const requestTrend = describeRequestRate(state.requestsPerSec, previousRequestRate);
  const latencyTrend = describeLatency(state.p95LatencyMs);
  const errorTrend = describeErrorRate(state.errorRatePct);

  const actionHeadline = isHealthy
    ? 'All systems operational — no action needed'
    : `Investigating elevated error rate (${formatPercent(state.errorRatePct)})`;
  const actionTone: 'success' | 'error' = isHealthy ? 'success' : 'error';

  return (
    <div className="dashboard">
      <nav className="topnav" aria-label="Primary">
        <div className="topnav-brand">
          <span className="topnav-logo" aria-hidden="true">⬡</span>
          <span className="topnav-name">NEXUS</span>
        </div>
        <div className="topnav-links">
          <span className="topnav-link topnav-link--active">Dashboard</span>
          <span className="topnav-link" aria-disabled="true">Endpoints</span>
          <span className="topnav-link" aria-disabled="true">Alerts</span>
          <span className="topnav-link" aria-disabled="true">Settings</span>
        </div>
        <BellIcon className="topnav-bell" />
      </nav>

      <header className="dashboard-header">
        <div className="dashboard-heading">
          <h1 className="dashboard-title">Nexus AI Platform</h1>
          <p className="dashboard-live">
            <span className="live-dot" aria-hidden="true" />
            Live, refreshing every {REFRESH_MS / 1000} seconds
          </p>
        </div>
        <div className="dashboard-status" role="status">
          <Badge variant={isHealthy ? 'success' : 'error'}>
            {isHealthy ? 'All systems operational' : 'Degraded performance'}
          </Badge>
        </div>
      </header>

      <SectionTitle size="sm" className="dashboard-scope">
        Production inference API
      </SectionTitle>

      <main className="dashboard-body">
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

        <section aria-label="Recommended actions">
          <ActionPanel
            headline={actionHeadline}
            headlineTone={actionTone}
            primaryActionLabel={isHealthy ? undefined : 'Acknowledge'}
          />
        </section>

        <section className="chart-grid" aria-label="Trends">
          <div className="chart-cell chart-cell--primary">
            <RequestVolumeChart data={state.requestVolume} range={chartRange} onRangeChange={setChartRange} />
          </div>
          <div className="chart-cell">
            <LatencyChart data={state.latencyPercentiles} />
          </div>
          <div className="chart-cell">
            <UsageChart data={state.usage} />
          </div>
        </section>

        <section className="lower-grid" aria-label="Endpoints and alerts">
          <div className="lower-cell">
            <EndpointTable endpoints={state.endpoints} />
          </div>
          <div className="lower-cell">
            <AlertsFeed alerts={state.alerts} now={Date.now()} />
          </div>
        </section>
      </main>
    </div>
  );
}
```

Note the new `<section aria-label="Recommended actions">` needs no new CSS class — it's a direct child of `.dashboard-body`, which already applies `gap: var(--gap)` between all its children, so spacing is automatic.

- [ ] **Step 3: Write the failing test additions**

Add to `App.test.tsx` (keep the existing test):

```tsx
it('renders the top nav and the action panel', () => {
  render(<App />);
  expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
  expect(screen.getByText('What needs attention')).toBeInTheDocument();
});

it('marks the unimplemented nav links as inert rather than broken buttons (Review Focus #4)', () => {
  render(<App />);
  const endpointsLink = screen.getByText('Endpoints');
  expect(endpointsLink.tagName).toBe('SPAN');
  expect(endpointsLink).toHaveAttribute('aria-disabled', 'true');
  expect(screen.queryByRole('button', { name: 'Endpoints' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Endpoints' })).not.toBeInTheDocument();
});

it("keeps the request volume chart's rendered SVG unchanged when the mock range toggle is clicked (Review Focus #3)", () => {
  render(<App />);
  const svgBefore = document.querySelector('svg.recharts-surface')?.outerHTML;

  screen.getByRole('button', { name: '5m' }).click();

  const svgAfter = document.querySelector('svg.recharts-surface')?.outerHTML;
  expect(svgAfter).toBe(svgBefore);
});
```

- [ ] **Step 4: Run the tests, verify the new ones fail (and re-run after Step 2's replacement to confirm the existing test still passes)**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: after Step 2's `App.tsx` replacement and before this step's test additions, the original `App.test.tsx` case should already pass (every element it checks for — "Nexus AI Platform", the four stat labels, `getAllByText('Error rate')` length 2, "Endpoints", "Alerts" — is still present in the new markup). The two new tests in this step should FAIL before you've confirmed them against the running app (they test structure that Step 2 already added, so if Step 2 was applied first they may already pass — if so, that's expected and fine; the TDD value here is in having written the assertions before trusting the integration).

- [ ] **Step 5: Add the new CSS to `packages/monitoring/src/App.css`**

Append at the end of the file (do not remove any existing rule):

```css
/* ---- Top nav ----------------------------------------------------------- */

.topnav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  margin: calc(-1 * clamp(1.25rem, 3vw, 2.5rem)) calc(-1 * clamp(1rem, 3.5vw, 3rem)) 1.5rem;
  border-bottom: 1px solid var(--color-border-default);
}

.topnav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-secondary);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.topnav-logo {
  font-size: 1.25rem;
}

.topnav-links {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.topnav-link {
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.topnav-link--active {
  background: var(--color-surface);
  color: var(--color-secondary);
}

.topnav-bell {
  color: var(--color-muted);
  flex: none;
}

@media (max-width: 640px) {
  .topnav-links {
    display: none;
  }
}

/* ---- Shared chart/panel title ------------------------------------------ */

.panel-title {
  margin: 0 0 1rem;
  color: var(--color-secondary);
  font-size: 1.25rem;
  font-weight: 600;
}

.chart-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.chart-card-header .panel-title {
  margin: 0;
}

/* ---- Mock chart range toggle -------------------------------------------- */

.range-toggle {
  display: flex;
  gap: 0.25rem;
}

.range-toggle-btn {
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border-default);
  background: transparent;
  color: var(--color-muted);
  font-size: 0.75rem;
  cursor: pointer;
}

.range-toggle-btn--active {
  background: var(--color-surface);
  color: var(--color-secondary);
  border-color: var(--color-secondary);
}

/* ---- Action panel -------------------------------------------------------- */

.action-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-default);
}

.action-item--static {
  border-bottom: none;
}

.action-dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  margin-top: 0.375rem;
  flex-shrink: 0;
}

.action-item-body {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.action-item-title {
  margin: 0;
  color: var(--color-default);
}

.action-item-subtitle {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.875rem;
}

.action-item-button {
  align-self: flex-start;
  padding: 0.375rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-secondary);
  background: transparent;
  color: var(--color-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
}

.action-item-done {
  color: var(--color-success);
  font-size: 0.8125rem;
}
```

- [ ] **Step 6: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS (all tests, old and new).

- [ ] **Step 7: Run the build**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: clean exit.

- [ ] **Step 8: Commit**

```bash
git add packages/monitoring/src/App.tsx packages/monitoring/src/App.css packages/monitoring/src/App.test.tsx
git commit -m "feat(monitoring): integrate nav bar, stat trends, chart range toggle, and ActionPanel"
```
