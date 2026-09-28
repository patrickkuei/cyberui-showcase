# AI Product Monitoring Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `packages/monitoring`, a self-contained React + Vite demo of an AI product monitoring dashboard (stat tiles, live-simulated charts, an endpoint table, and an alerts feed) built with cyberui-2045, extractable standalone via `npx tiged`.

**Architecture:** A pure, timer-free simulation engine (`src/data/simulation.ts`) owns all dashboard state and is driven by a thin `useSimulatedMetrics` hook on a 2s interval. Presentational components (`StatTile`, three Recharts-based charts, `EndpointTable`, `AlertsFeed`) each render one slice of that state. `App.tsx` composes them into the page layout using cyberui-2045 components (`Card`, `Badge`, `Table`, `Timeline`, `SectionTitle`) for chrome and a small hand-authored `App.css` for layout, styled entirely through cyberui-2045's documented `--color-*` custom properties.

**Tech Stack:** React 19, Vite 7, TypeScript 5.8 (strict), cyberui-2045 ^2.6.0, Recharts ^2.15, Vitest 3 + @testing-library/react for tests.

**Spec:** `docs/superpowers/specs/2026-09-27-cyberui-showcase-design.md` (issue #6 body has this demo's brainstormed content/stack decisions)

## Global Constraints

- cyberui-2045 is a real npm dependency pinned to `^2.6.0` in `dependencies` — never a `workspace:` protocol range (spec: Dependency & Versioning).
- `packages/monitoring` must be fully standalone: no imports outside its own directory, no `workspace:` protocol anywhere in its `package.json`, importable via `npx tiged patrickkuei/cyberui-showcase/packages/monitoring my-app && cd my-app && npm install && npm run dev` (spec: Repository Structure).
- No backend or network calls for dashboard data — everything the page shows comes from the in-browser simulation in `src/data/simulation.ts`. No persistence.
- Accent color is cyan via cyberui-2045's existing default `--color-secondary` token — no CSS token override file for this package (brainstorm decision; the override file is introduced later for the violet agent-panel demo).
- Charting is done with Recharts, not a new cyberui-2045 component — building a chart into CyberUI itself is out of scope for this repo (brainstorm decision).
- **Styling for any markup we author ourselves (not cyberui-2045's own components) uses inline styles or a small hand-authored CSS file referencing cyberui-2045's documented `--color-*` custom properties only.** Never reuse cyberui-2045's internal Tailwind utility class names (`bg-primary`, `text-secondary`, `border-accent`, etc. — visible in its component source) in code this plan writes: the package README explicitly guarantees only the `--color-*` custom properties as stable ("All other CSS variables... are internal and may change"), and this package does not run Tailwind itself, so those class names only work when they happen to already appear in cyberui-2045's shipped stylesheet — that's not a foundation to build a flagship demo on.
- TypeScript strict mode, options copied from the root `tsconfig.json` (added in #5 / PR #10) as a starting point, not `extends`-ed — this package's `tsconfig.json` must be complete on its own.
- Node >=20; the repo root uses pnpm workspaces, but this package's own `package.json` must install and build correctly under plain `npm install` outside the monorepo (see Task 9).

## Review Focus

1. The simulated metrics drift to nonsensical values (negative latency, an error rate outside 0-100%) after many ticks — a person leaving the tab open would watch the "live" dashboard visibly break. Tested in Task 2.
2. The alerts feed grows unbounded the longer the tab stays open — invisible in a quick demo, a real memory/DOM-size leak on a monitor left running. Tested in Task 2.
3. `useSimulatedMetrics`'s `setInterval` isn't cleared on unmount — a dangling timer every time the page is torn down (real leak in an app that mounts/unmounts this view; noisy act() warnings in tests). Tested in Task 3.
4. Recharts' `<ResponsiveContainer>` renders at 0×0 with no explicit parent size, both in jsdom (no real layout) and in a real browser (any parent without a defined height) — charts silently render blank. Tested via a global test-environment fix in Task 1 and an explicit-height assertion in Task 5.
5. `package.json` accidentally ships a `workspace:` protocol range, or `src/` contains a relative import reaching outside `packages/monitoring` — either one breaks the `npx tiged` extraction path the whole spec depends on. Tested in Task 9 by actually running `npm install` on a copy of the package outside the workspace.

---

### Task 1: Scaffold `packages/monitoring`

**Files:**
- Create: `packages/monitoring/package.json`
- Create: `packages/monitoring/tsconfig.json`
- Create: `packages/monitoring/vite.config.ts`
- Create: `packages/monitoring/index.html`
- Create: `packages/monitoring/src/main.tsx`
- Create: `packages/monitoring/src/vite-env.d.ts`
- Create: `packages/monitoring/src/test/setup.ts`
- Create: `packages/monitoring/src/App.tsx`
- Test: `packages/monitoring/src/App.test.tsx`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working Vite dev/build/test toolchain other tasks assume exists; a placeholder `App.tsx` other tasks will grow; `src/test/setup.ts` (jest-dom matchers + the `ResizeObserver` stub + the `offsetWidth`/`offsetHeight` mock every later chart test relies on).

- [ ] **Step 1: Create `packages/monitoring/package.json`**

```json
{
  "name": "monitoring-dashboard-demo",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "cyberui-2045": "^2.6.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.6.0",
    "jsdom": "^25.0.1",
    "typescript": "~5.8.3",
    "vite": "^7.0.4",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Create `packages/monitoring/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/monitoring/vite.config.ts` and `packages/monitoring/index.html`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Product Monitoring — cyberui-2045</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `packages/monitoring/src/main.tsx`, `src/vite-env.d.ts`, and `src/test/setup.ts`**

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'cyberui-2045/styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Recharts' <ResponsiveContainer> sizes itself from the parent element's box
// size; jsdom never performs real layout, so offsetWidth/offsetHeight are
// always 0 and every chart would render as an empty 0x0 SVG in tests.
Object.defineProperties(HTMLElement.prototype, {
  offsetWidth: { configurable: true, value: 500 },
  offsetHeight: { configurable: true, value: 220 },
});
```

- [ ] **Step 5: Install dependencies from the repo root**

Run: `pnpm install`
Expected: resolves and links the new `monitoring-dashboard-demo` package into the workspace; `pnpm-lock.yaml` updates.

- [ ] **Step 6: Write the failing test**

```tsx
// src/App.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the dashboard scaffold', () => {
    render(<App />);
    expect(screen.getByText('AI Product Monitoring')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `src/App.tsx` does not exist yet.

- [ ] **Step 8: Create the minimal `packages/monitoring/src/App.tsx`**

```tsx
import { Card, SectionTitle } from 'cyberui-2045';

export default function App() {
  return (
    <main style={{ padding: '2rem' }}>
      <Card>
        <SectionTitle>AI Product Monitoring</SectionTitle>
        <p>Dashboard scaffold — panels land in later tasks.</p>
      </Card>
    </main>
  );
}
```

- [ ] **Step 9: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 10: Confirm the production build compiles**

Run: `pnpm --filter monitoring-dashboard-demo run build`
Expected: exits 0, produces `packages/monitoring/dist/`.

- [ ] **Step 11: Commit**

```bash
git add packages/monitoring
git commit -m "feat(monitoring): scaffold Vite + React + cyberui-2045 package"
```

---

### Task 2: Simulation engine

**Files:**
- Create: `packages/monitoring/src/data/simulation.ts`
- Test: `packages/monitoring/src/data/simulation.test.ts`

**Interfaces:**
- Consumes: nothing (pure module, no React, no timers).
- Produces: `MetricPoint`, `LatencyPoint`, `UsagePoint`, `EndpointStats`, `AlertSeverity`, `Alert`, `DashboardState` types; `HISTORY_LENGTH`, `MAX_ALERTS` constants; `createInitialState(now: number): DashboardState`; `tick(state: DashboardState, now: number, rng?: () => number): DashboardState`. Task 3 wraps `tick`/`createInitialState` in a hook; Tasks 4-7 read fields off `DashboardState`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/data/simulation.test.ts
import { describe, it, expect } from 'vitest';
import { createInitialState, tick, HISTORY_LENGTH, MAX_ALERTS } from './simulation';

describe('createInitialState', () => {
  it('seeds a rolling history of the configured length', () => {
    const state = createInitialState(1_700_000_000_000);
    expect(state.requestVolume).toHaveLength(HISTORY_LENGTH);
    expect(state.latencyPercentiles).toHaveLength(HISTORY_LENGTH);
    expect(state.usage).toHaveLength(HISTORY_LENGTH);
  });
});

describe('tick', () => {
  it('keeps the rolling history length constant', () => {
    let state = createInitialState(0);
    for (let i = 1; i <= 50; i++) {
      state = tick(state, i * 2000, () => 0.5);
    }
    expect(state.requestVolume).toHaveLength(HISTORY_LENGTH);
    expect(state.latencyPercentiles).toHaveLength(HISTORY_LENGTH);
    expect(state.usage).toHaveLength(HISTORY_LENGTH);
  });

  it('keeps metrics within realistic bounds over many ticks (Review Focus #1)', () => {
    let state = createInitialState(0);
    let seed = 0;
    const rng = () => {
      seed = (seed + 0.37) % 1;
      return seed;
    };
    for (let i = 1; i <= 2000; i++) {
      state = tick(state, i * 2000, rng);
      expect(state.errorRatePct).toBeGreaterThanOrEqual(0);
      expect(state.errorRatePct).toBeLessThanOrEqual(8);
      expect(state.p95LatencyMs).toBeGreaterThan(0);
      expect(state.requestsPerSec).toBeGreaterThan(0);
      for (const endpoint of state.endpoints) {
        expect(endpoint.errorRatePct).toBeGreaterThanOrEqual(0);
        expect(endpoint.avgLatencyMs).toBeGreaterThan(0);
      }
    }
  });

  it('caps the alerts feed length no matter how long the tab stays open (Review Focus #2)', () => {
    let state = createInitialState(0);
    const rng = () => 0; // always satisfies the rng() < 0.08 alert-append branch
    for (let i = 1; i <= 500; i++) {
      state = tick(state, i * 2000, rng);
      expect(state.alerts.length).toBeLessThanOrEqual(MAX_ALERTS);
    }
    expect(state.alerts).toHaveLength(MAX_ALERTS);
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./simulation` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/data/simulation.ts`**

```ts
export interface MetricPoint {
  t: number;
  value: number;
}

export interface LatencyPoint {
  t: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface UsagePoint {
  t: number;
  tokensPerMin: number;
  costPerHr: number;
}

export interface EndpointStats {
  name: string;
  requests: number;
  avgLatencyMs: number;
  errorRatePct: number;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: number;
}

export interface DashboardState {
  requestsPerSec: number;
  p95LatencyMs: number;
  errorRatePct: number;
  activeSessions: number;
  requestVolume: MetricPoint[];
  latencyPercentiles: LatencyPoint[];
  usage: UsagePoint[];
  endpoints: EndpointStats[];
  alerts: Alert[];
}

export const HISTORY_LENGTH = 30;
export const MAX_ALERTS = 20;

const ENDPOINT_NAMES = ['/v1/chat/completions', '/v1/embeddings', '/v1/images/generate', '/v1/models'];

const ALERT_MESSAGES: Record<AlertSeverity, string[]> = {
  critical: ['Error rate above threshold on us-east-1', 'p99 latency spike on /v1/chat/completions'],
  warning: ['Elevated latency on /v1/embeddings', 'Approaching rate limit for org acme-corp'],
  info: ['Deploy completed: model-router v2.3.1', 'Autoscaler added 2 nodes to inference pool'],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomWalk(value: number, delta: number, min: number, max: number, rng: () => number): number {
  return clamp(value + (rng() - 0.5) * delta, min, max);
}

export function createInitialState(now: number): DashboardState {
  const requestVolume: MetricPoint[] = [];
  const latencyPercentiles: LatencyPoint[] = [];
  const usage: UsagePoint[] = [];

  for (let i = HISTORY_LENGTH - 1; i >= 0; i--) {
    const t = now - i * 2000;
    requestVolume.push({ t, value: 420 });
    latencyPercentiles.push({ t, p50: 80, p95: 220, p99: 410 });
    usage.push({ t, tokensPerMin: 18000, costPerHr: 6.4 });
  }

  return {
    requestsPerSec: 420,
    p95LatencyMs: 220,
    errorRatePct: 0.4,
    activeSessions: 1280,
    requestVolume,
    latencyPercentiles,
    usage,
    endpoints: ENDPOINT_NAMES.map((name) => ({
      name,
      requests: 1000,
      avgLatencyMs: 150,
      errorRatePct: 0.3,
    })),
    alerts: [
      {
        id: 'seed-1',
        severity: 'info',
        message: 'Dashboard connected — streaming live metrics',
        timestamp: now,
      },
    ],
  };
}

export function tick(state: DashboardState, now: number, rng: () => number = Math.random): DashboardState {
  const requestsPerSec = randomWalk(state.requestsPerSec, 60, 50, 2000, rng);
  const p95LatencyMs = randomWalk(state.p95LatencyMs, 30, 40, 900, rng);
  const errorRatePct = randomWalk(state.errorRatePct, 0.6, 0, 8, rng);
  const activeSessions = randomWalk(state.activeSessions, 80, 20, 5000, rng);

  const p50 = clamp(p95LatencyMs * 0.4, 20, p95LatencyMs);
  const p99 = clamp(p95LatencyMs * 1.8, p95LatencyMs, 2000);
  const previousTokens = state.usage[state.usage.length - 1]?.tokensPerMin ?? 18000;
  const tokensPerMin = randomWalk(previousTokens, 1500, 2000, 60000, rng);
  const costPerHr = Number((tokensPerMin * 0.00035).toFixed(2));

  const requestVolume = [...state.requestVolume.slice(1), { t: now, value: requestsPerSec }];
  const latencyPercentiles = [...state.latencyPercentiles.slice(1), { t: now, p50, p95: p95LatencyMs, p99 }];
  const usage = [...state.usage.slice(1), { t: now, tokensPerMin, costPerHr }];

  const endpoints = state.endpoints.map((endpoint) => ({
    ...endpoint,
    requests: Math.round(randomWalk(endpoint.requests, 120, 10, 8000, rng)),
    avgLatencyMs: Math.round(randomWalk(endpoint.avgLatencyMs, 20, 30, 1200, rng)),
    errorRatePct: Number(randomWalk(endpoint.errorRatePct, 0.5, 0, 10, rng).toFixed(2)),
  }));

  let alerts = state.alerts;
  if (rng() < 0.08) {
    const severities: AlertSeverity[] = ['info', 'warning', 'critical'];
    const severity = severities[Math.floor(rng() * severities.length)] ?? 'info';
    const messages = ALERT_MESSAGES[severity];
    const message = messages[Math.floor(rng() * messages.length)] ?? messages[0] ?? 'Unknown event';
    alerts = [
      { id: `alert-${now}-${Math.floor(rng() * 100000)}`, severity, message, timestamp: now },
      ...state.alerts,
    ].slice(0, MAX_ALERTS);
  }

  return {
    requestsPerSec,
    p95LatencyMs,
    errorRatePct,
    activeSessions,
    requestVolume,
    latencyPercentiles,
    usage,
    endpoints,
    alerts,
  };
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/monitoring/src/data/simulation.ts packages/monitoring/src/data/simulation.test.ts
git commit -m "feat(monitoring): add dashboard simulation engine"
```

---

### Task 3: `useSimulatedMetrics` hook

**Files:**
- Create: `packages/monitoring/src/data/useSimulatedMetrics.ts`
- Test: `packages/monitoring/src/data/useSimulatedMetrics.test.ts`

**Interfaces:**
- Consumes: `createInitialState`, `tick`, `DashboardState` from `./simulation` (Task 2).
- Produces: `useSimulatedMetrics(intervalMs?: number): DashboardState`, used by `App.tsx` in Task 8.

- [ ] **Step 1: Write the failing tests**

```ts
// src/data/useSimulatedMetrics.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSimulatedMetrics } from './useSimulatedMetrics';

describe('useSimulatedMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances state on each interval tick', () => {
    const { result } = renderHook(() => useSimulatedMetrics(2000));
    const initial = result.current;

    vi.advanceTimersByTime(2000);
    expect(result.current).not.toBe(initial);
    expect(result.current.requestVolume).toHaveLength(initial.requestVolume.length);
  });

  it('clears its interval on unmount (Review Focus #3)', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useSimulatedMetrics(2000));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./useSimulatedMetrics` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/data/useSimulatedMetrics.ts`**

```ts
import { useEffect, useRef, useState } from 'react';
import { createInitialState, tick, type DashboardState } from './simulation';

export function useSimulatedMetrics(intervalMs = 2000): DashboardState {
  const [state, setState] = useState<DashboardState>(() => createInitialState(Date.now()));
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const id = setInterval(() => {
      setState(tick(stateRef.current, Date.now()));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return state;
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/monitoring/src/data/useSimulatedMetrics.ts packages/monitoring/src/data/useSimulatedMetrics.test.ts
git commit -m "feat(monitoring): add useSimulatedMetrics hook"
```

---

### Task 4: Format utils and `StatTile`

**Files:**
- Create: `packages/monitoring/src/utils/format.ts`
- Test: `packages/monitoring/src/utils/format.test.ts`
- Create: `packages/monitoring/src/components/StatTile.tsx`
- Test: `packages/monitoring/src/components/StatTile.test.tsx`

**Interfaces:**
- Consumes: nothing beyond plain numbers/timestamps.
- Produces: `formatCompactNumber`, `formatMs`, `formatPercent`, `formatCurrencyPerHour`, `formatRelativeTime` (used by Tasks 5-7); `StatTile` component (used by Task 8).

- [ ] **Step 1: Write the failing format tests**

```ts
// src/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCompactNumber, formatMs, formatPercent, formatCurrencyPerHour, formatRelativeTime } from './format';

describe('format utils', () => {
  it('formats large numbers compactly', () => {
    expect(formatCompactNumber(1280)).toBe('1.3K');
  });

  it('formats milliseconds', () => {
    expect(formatMs(219.6)).toBe('220 ms');
  });

  it('formats percentages to one decimal', () => {
    expect(formatPercent(0.4)).toBe('0.4%');
  });

  it('formats hourly cost', () => {
    expect(formatCurrencyPerHour(6.4)).toBe('$6.40/hr');
  });

  it('formats relative time', () => {
    const now = 1_700_000_000_000;
    expect(formatRelativeTime(now, now)).toBe('just now');
    expect(formatRelativeTime(now - 30_000, now)).toBe('30s ago');
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5m ago');
    expect(formatRelativeTime(now - 3 * 60 * 60_000, now)).toBe('3h ago');
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./format` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/utils/format.ts`**

```ts
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatMs(value: number): string {
  return `${Math.round(value)} ms`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatCurrencyPerHour(value: number): string {
  return `$${value.toFixed(2)}/hr`;
}

export function formatRelativeTime(timestampMs: number, nowMs: number): string {
  const diffSec = Math.max(0, Math.round((nowMs - timestampMs) / 1000));
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  return `${diffHr}h ago`;
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Write the failing `StatTile` test**

```tsx
// src/components/StatTile.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('renders the label and value', () => {
    render(<StatTile label="Requests/sec" value="1.3K" />);
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('1.3K')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./StatTile` does not exist yet.

- [ ] **Step 7: Implement `packages/monitoring/src/components/StatTile.tsx`**

```tsx
import { Card } from 'cyberui-2045';

export interface StatTileProps {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
}

const TONE_VAR: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'var(--color-default)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
};

export function StatTile({ label, value, tone = 'default' }: StatTileProps) {
  return (
    <Card title={label} variant="small" titleBorder={false}>
      <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: TONE_VAR[tone] }}>{value}</p>
    </Card>
  );
}
```

- [ ] **Step 8: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add packages/monitoring/src/utils/format.ts packages/monitoring/src/utils/format.test.ts packages/monitoring/src/components/StatTile.tsx packages/monitoring/src/components/StatTile.test.tsx
git commit -m "feat(monitoring): add format utils and StatTile"
```

---

### Task 5: Time-series charts

**Files:**
- Create: `packages/monitoring/src/theme/chartColors.ts`
- Create: `packages/monitoring/src/components/RequestVolumeChart.tsx`
- Test: `packages/monitoring/src/components/RequestVolumeChart.test.tsx`
- Create: `packages/monitoring/src/components/LatencyChart.tsx`
- Test: `packages/monitoring/src/components/LatencyChart.test.tsx`
- Create: `packages/monitoring/src/components/UsageChart.tsx`
- Test: `packages/monitoring/src/components/UsageChart.test.tsx`

**Interfaces:**
- Consumes: `MetricPoint`, `LatencyPoint`, `UsagePoint` from `../data/simulation` (Task 2); `formatCompactNumber`, `formatMs`, `formatCurrencyPerHour` from `../utils/format` (Task 4); the global `offsetWidth`/`offsetHeight`/`ResizeObserver` test fixes from Task 1's `src/test/setup.ts`.
- Produces: `useChartColors()`, `RequestVolumeChart`, `LatencyChart`, `UsageChart` — all consumed by `App.tsx` in Task 8.

- [ ] **Step 1: Implement `packages/monitoring/src/theme/chartColors.ts`**

(No test for this file directly — it's exercised through the chart component tests below, which fail if it's missing or returns unusable values.)

```ts
import { useMemo } from 'react';

export interface ChartColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  muted: string;
  border: string;
}

const FALLBACK: ChartColors = {
  primary: '#ff005d',
  secondary: '#00fff9',
  accent: '#fffb00',
  success: '#00ff9e',
  error: '#ff4f4f',
  warning: '#ffaa00',
  muted: '#8888aa',
  border: '#3c3c5e',
};

function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function useChartColors(): ChartColors {
  return useMemo(
    () => ({
      primary: readCssVar('--color-primary', FALLBACK.primary),
      secondary: readCssVar('--color-secondary', FALLBACK.secondary),
      accent: readCssVar('--color-accent', FALLBACK.accent),
      success: readCssVar('--color-success', FALLBACK.success),
      error: readCssVar('--color-error', FALLBACK.error),
      warning: readCssVar('--color-warning', FALLBACK.warning),
      muted: readCssVar('--color-muted', FALLBACK.muted),
      border: readCssVar('--color-border-default', FALLBACK.border),
    }),
    [],
  );
}
```

- [ ] **Step 2: Write the failing `RequestVolumeChart` test**

```tsx
// src/components/RequestVolumeChart.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RequestVolumeChart } from './RequestVolumeChart';

const DATA = [
  { t: 1, value: 100 },
  { t: 2, value: 150 },
  { t: 3, value: 200 },
];

describe('RequestVolumeChart', () => {
  it('renders a non-empty chart for the given data (Review Focus #4)', () => {
    const { container } = render(<RequestVolumeChart data={DATA} />);
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(svg?.getAttribute('height'))).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./RequestVolumeChart` does not exist yet.

- [ ] **Step 4: Implement `packages/monitoring/src/components/RequestVolumeChart.tsx`**

```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'cyberui-2045';
import type { MetricPoint } from '../data/simulation';
import { useChartColors } from '../theme/chartColors';
import { formatCompactNumber } from '../utils/format';

export interface RequestVolumeChartProps {
  data: MetricPoint[];
}

export function RequestVolumeChart({ data }: RequestVolumeChartProps) {
  const colors = useChartColors();

  return (
    <Card title="Request volume">
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={false} />
            <YAxis tickFormatter={formatCompactNumber} stroke={colors.muted} width={48} />
            <Tooltip
              formatter={(value) => [formatCompactNumber(Number(value)), 'req/s']}
              labelFormatter={() => ''}
              contentStyle={{ background: 'var(--color-surface)', border: `1px solid ${colors.border}` }}
            />
            <Area type="monotone" dataKey="value" stroke={colors.secondary} fill={colors.secondary} fillOpacity={0.25} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 6: Write the failing `LatencyChart` test**

```tsx
// src/components/LatencyChart.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LatencyChart } from './LatencyChart';

const DATA = [
  { t: 1, p50: 60, p95: 200, p99: 380 },
  { t: 2, p50: 65, p95: 210, p99: 390 },
];

describe('LatencyChart', () => {
  it('renders a non-empty chart with p50/p95/p99 series (Review Focus #4)', () => {
    const { container } = render(<LatencyChart data={DATA} />);
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
    expect(screen.getByText('p50')).toBeInTheDocument();
    expect(screen.getByText('p95')).toBeInTheDocument();
    expect(screen.getByText('p99')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./LatencyChart` does not exist yet.

- [ ] **Step 8: Implement `packages/monitoring/src/components/LatencyChart.tsx`**

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from 'cyberui-2045';
import type { LatencyPoint } from '../data/simulation';
import { useChartColors } from '../theme/chartColors';
import { formatMs } from '../utils/format';

export interface LatencyChartProps {
  data: LatencyPoint[];
}

export function LatencyChart({ data }: LatencyChartProps) {
  const colors = useChartColors();

  return (
    <Card title="Latency percentiles">
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={false} />
            <YAxis tickFormatter={formatMs} stroke={colors.muted} width={56} />
            <Tooltip
              formatter={(value) => [formatMs(Number(value)), '']}
              labelFormatter={() => ''}
              contentStyle={{ background: 'var(--color-surface)', border: `1px solid ${colors.border}` }}
            />
            <Legend />
            <Line type="monotone" dataKey="p50" name="p50" stroke={colors.success} dot={false} />
            <Line type="monotone" dataKey="p95" name="p95" stroke={colors.warning} dot={false} />
            <Line type="monotone" dataKey="p99" name="p99" stroke={colors.error} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 9: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 10: Write the failing `UsageChart` test**

```tsx
// src/components/UsageChart.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageChart } from './UsageChart';

const DATA = [
  { t: 1, tokensPerMin: 18000, costPerHr: 6.4 },
  { t: 2, tokensPerMin: 19500, costPerHr: 6.9 },
];

describe('UsageChart', () => {
  it('renders a non-empty chart and the latest hourly cost (Review Focus #4)', () => {
    const { container } = render(<UsageChart data={DATA} />);
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(0);
    expect(screen.getByText('$6.90/hr at current rate')).toBeInTheDocument();
  });
});
```

- [ ] **Step 11: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./UsageChart` does not exist yet.

- [ ] **Step 12: Implement `packages/monitoring/src/components/UsageChart.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'cyberui-2045';
import type { UsagePoint } from '../data/simulation';
import { useChartColors } from '../theme/chartColors';
import { formatCompactNumber, formatCurrencyPerHour } from '../utils/format';

export interface UsageChartProps {
  data: UsagePoint[];
}

export function UsageChart({ data }: UsageChartProps) {
  const colors = useChartColors();
  const latest = data[data.length - 1];

  return (
    <Card title="Token usage">
      {latest && (
        <p style={{ margin: '0 0 0.5rem', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          {formatCurrencyPerHour(latest.costPerHr)} at current rate
        </p>
      )}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
            <XAxis dataKey="t" tick={false} />
            <YAxis tickFormatter={formatCompactNumber} stroke={colors.muted} width={48} />
            <Tooltip
              formatter={(value) => [formatCompactNumber(Number(value)), 'tokens/min']}
              labelFormatter={() => ''}
              contentStyle={{ background: 'var(--color-surface)', border: `1px solid ${colors.border}` }}
            />
            <Bar dataKey="tokensPerMin" fill={colors.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

- [ ] **Step 13: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 14: Commit**

```bash
git add packages/monitoring/src/theme packages/monitoring/src/components/RequestVolumeChart.tsx packages/monitoring/src/components/RequestVolumeChart.test.tsx packages/monitoring/src/components/LatencyChart.tsx packages/monitoring/src/components/LatencyChart.test.tsx packages/monitoring/src/components/UsageChart.tsx packages/monitoring/src/components/UsageChart.test.tsx
git commit -m "feat(monitoring): add time-series charts"
```

---

### Task 6: `EndpointTable`

**Files:**
- Create: `packages/monitoring/src/components/EndpointTable.tsx`
- Test: `packages/monitoring/src/components/EndpointTable.test.tsx`

**Interfaces:**
- Consumes: `EndpointStats` from `../data/simulation` (Task 2); `formatCompactNumber`, `formatMs`, `formatPercent` from `../utils/format` (Task 4); cyberui-2045's `Table`/`TableColumn` (row type inferred from `columns`/`data`, no explicit generic needed).
- Produces: `EndpointTable`, consumed by `App.tsx` in Task 8.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/EndpointTable.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EndpointTable } from './EndpointTable';

const ENDPOINTS = [
  { name: '/v1/chat/completions', requests: 1280, avgLatencyMs: 145, errorRatePct: 0.6 },
  { name: '/v1/embeddings', requests: 640, avgLatencyMs: 60, errorRatePct: 0.1 },
];

describe('EndpointTable', () => {
  it('renders one row per endpoint with formatted values', () => {
    render(<EndpointTable endpoints={ENDPOINTS} />);
    expect(screen.getByText('/v1/chat/completions')).toBeInTheDocument();
    expect(screen.getByText('1.3K')).toBeInTheDocument();
    expect(screen.getByText('145 ms')).toBeInTheDocument();
    expect(screen.getByText('0.6%')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./EndpointTable` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/components/EndpointTable.tsx`**

```tsx
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
}

export function EndpointTable({ endpoints }: EndpointTableProps) {
  return (
    <Card title="Endpoints">
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

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/monitoring/src/components/EndpointTable.tsx packages/monitoring/src/components/EndpointTable.test.tsx
git commit -m "feat(monitoring): add EndpointTable"
```

---

### Task 7: `AlertsFeed`

**Files:**
- Create: `packages/monitoring/src/components/AlertsFeed.tsx`
- Test: `packages/monitoring/src/components/AlertsFeed.test.tsx`

**Interfaces:**
- Consumes: `Alert` from `../data/simulation` (Task 2); `formatRelativeTime` from `../utils/format` (Task 4); cyberui-2045's `Timeline`/`TimelineEvent`.
- Produces: `AlertsFeed`, consumed by `App.tsx` in Task 8.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/AlertsFeed.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsFeed } from './AlertsFeed';

const NOW = 1_700_000_000_000;
const ALERTS = [
  { id: '1', severity: 'critical' as const, message: 'Error rate above threshold on us-east-1', timestamp: NOW - 30_000 },
  { id: '2', severity: 'info' as const, message: 'Deploy completed: model-router v2.3.1', timestamp: NOW - 5 * 60_000 },
];

describe('AlertsFeed', () => {
  it('renders each alert with its message and relative time', () => {
    render(<AlertsFeed alerts={ALERTS} now={NOW} />);
    expect(screen.getByText('Error rate above threshold on us-east-1')).toBeInTheDocument();
    expect(screen.getByText('30s ago')).toBeInTheDocument();
    expect(screen.getByText('Deploy completed: model-router v2.3.1')).toBeInTheDocument();
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — `./AlertsFeed` does not exist yet.

- [ ] **Step 3: Implement `packages/monitoring/src/components/AlertsFeed.tsx`**

```tsx
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
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/monitoring/src/components/AlertsFeed.tsx packages/monitoring/src/components/AlertsFeed.test.tsx
git commit -m "feat(monitoring): add AlertsFeed"
```

---

### Task 8: Compose the dashboard page

**Files:**
- Modify: `packages/monitoring/src/App.tsx` (replaces Task 1's placeholder)
- Modify: `packages/monitoring/src/App.test.tsx` (replaces Task 1's placeholder test)
- Create: `packages/monitoring/src/App.css`

**Interfaces:**
- Consumes: `useSimulatedMetrics` (Task 3), `StatTile` (Task 4), `RequestVolumeChart`/`LatencyChart`/`UsageChart` (Task 5), `EndpointTable` (Task 6), `AlertsFeed` (Task 7), `formatCompactNumber`/`formatMs`/`formatPercent` (Task 4), cyberui-2045's `SectionTitle`/`Badge`.
- Produces: the finished `App.tsx` — nothing downstream in this plan consumes it further; this is the shippable page.

- [ ] **Step 1: Get visual design guidance**

Invoke `/frontend-design:frontend-design` for direction on typography, spacing, and visual hierarchy for this flagship dashboard page (dense data display, cyan cyberpunk accent, the header/stat-row/chart-grid/table+alerts structure below). Treat the `App.tsx`/`App.css` in the steps below as a working functional baseline to refine with that guidance — adjust spacing, grid proportions, and typography as it recommends rather than shipping the reference layout verbatim, but keep every element it wires together (header, 4 stat tiles, 3 charts, table, alerts feed) and keep all styling on cyberui-2045's documented `--color-*` custom properties per the Global Constraints.

- [ ] **Step 2: Write the failing test**

```tsx
// src/App.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the dashboard header, stat tiles, and panel titles', () => {
    render(<App />);

    expect(screen.getByText('Nexus AI Platform')).toBeInTheDocument();
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('p95 latency')).toBeInTheDocument();
    expect(screen.getByText('Error rate')).toBeInTheDocument();
    expect(screen.getByText('Active sessions')).toBeInTheDocument();
    expect(screen.getByText('Endpoints')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: FAIL — old placeholder `App.tsx` doesn't render this text.

- [ ] **Step 4: Replace `packages/monitoring/src/App.tsx`**

```tsx
import { SectionTitle, Badge } from 'cyberui-2045';
import { useSimulatedMetrics } from './data/useSimulatedMetrics';
import { StatTile } from './components/StatTile';
import { RequestVolumeChart } from './components/RequestVolumeChart';
import { LatencyChart } from './components/LatencyChart';
import { UsageChart } from './components/UsageChart';
import { EndpointTable } from './components/EndpointTable';
import { AlertsFeed } from './components/AlertsFeed';
import { formatCompactNumber, formatMs, formatPercent } from './utils/format';
import './App.css';

export default function App() {
  const state = useSimulatedMetrics();
  const isHealthy = state.errorRatePct < 2;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <SectionTitle showLine={false}>Nexus AI Platform</SectionTitle>
          <p className="dashboard-subtitle">Production monitoring — inference API</p>
        </div>
        <Badge variant={isHealthy ? 'success' : 'error'}>
          {isHealthy ? 'All systems operational' : 'Degraded performance'}
        </Badge>
      </header>

      <section className="stat-row">
        <StatTile label="Requests/sec" value={formatCompactNumber(state.requestsPerSec)} />
        <StatTile
          label="p95 latency"
          value={formatMs(state.p95LatencyMs)}
          tone={state.p95LatencyMs > 500 ? 'warning' : 'default'}
        />
        <StatTile
          label="Error rate"
          value={formatPercent(state.errorRatePct)}
          tone={state.errorRatePct > 2 ? 'error' : 'success'}
        />
        <StatTile label="Active sessions" value={formatCompactNumber(state.activeSessions)} />
      </section>

      <section className="chart-grid">
        <RequestVolumeChart data={state.requestVolume} />
        <LatencyChart data={state.latencyPercentiles} />
        <UsageChart data={state.usage} />
      </section>

      <section className="lower-grid">
        <EndpointTable endpoints={state.endpoints} />
        <AlertsFeed alerts={state.alerts} now={Date.now()} />
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Create `packages/monitoring/src/App.css`**

```css
.dashboard {
  min-height: 100vh;
  padding: 2rem clamp(1rem, 4vw, 3rem);
  background: var(--color-base);
  color: var(--color-default);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-subtitle {
  margin: 0.25rem 0 0;
  color: var(--color-muted);
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.lower-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1rem;
}

@media (max-width: 720px) {
  .lower-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Run the test, verify it passes**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS

- [ ] **Step 7: Manually check the real page**

Run: `pnpm --filter monitoring-dashboard-demo run dev` and open the printed local URL. Confirm the header, stat tiles, all three charts, the endpoint table, and the alerts feed render and that the numbers visibly change every ~2 seconds. Stop the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add packages/monitoring/src/App.tsx packages/monitoring/src/App.test.tsx packages/monitoring/src/App.css
git commit -m "feat(monitoring): compose the dashboard page"
```

---

### Task 9: Standalone build and extractability verification

**Files:**
- None created — this task only runs verification commands and fixes anything they surface.

**Interfaces:**
- Consumes: the complete `packages/monitoring` package from Tasks 1-8.
- Produces: nothing new; confirms the package satisfies the Global Constraints and closes out Review Focus #5.

- [ ] **Step 1: Run the full test suite one more time**

Run: `pnpm --filter monitoring-dashboard-demo run test`
Expected: PASS (all tests from Tasks 1-8).

- [ ] **Step 2: Grep for anything that would break `npx tiged` extraction (Review Focus #5)**

Run:
```bash
grep -n "workspace:" packages/monitoring/package.json
grep -rn "from '\.\./\.\./" packages/monitoring/src
```
Expected: both commands find nothing (exit with no matches). If either finds a match, fix it (replace the `workspace:` range with the real semver range, or the escaping import with a local one) before continuing.

- [ ] **Step 3: Prove the package installs and builds outside the monorepo (Review Focus #5)**

Run:
```bash
rm -rf /tmp/monitoring-extract-test
cp -r packages/monitoring /tmp/monitoring-extract-test
rm -rf /tmp/monitoring-extract-test/node_modules /tmp/monitoring-extract-test/dist
cd /tmp/monitoring-extract-test
npm install
npm run build
cd -
rm -rf /tmp/monitoring-extract-test
```
Expected: `npm install` and `npm run build` both succeed with a plain copy of the package directory and no pnpm workspace context — this is what a real user gets from `npx tiged`.

- [ ] **Step 4: Commit any fixes from Steps 2-3**

If Steps 2-3 required changes, commit them:
```bash
git add packages/monitoring
git commit -m "fix(monitoring): resolve standalone extraction issue"
```
If no changes were needed, skip this step — there is nothing to commit.
