import type { CodeSnippet } from './types';

export const CODE_SNIPPETS: Record<string, CodeSnippet[]> = {
  monitoring: [
    {
      title: 'Bounded random walk — src/data/simulation.ts',
      code: `function randomWalk(value: number, delta: number, min: number, max: number, rng: () => number): number {
  return clamp(value + (rng() - 0.5) * delta, min, max);
}`,
      note: 'Every simulated metric moves through this — bounded so a tab left open all day never drifts into negative latency or a >100% error rate.',
    },
    {
      title: 'A capped alerts feed — src/data/simulation.ts',
      code: `alerts = [
  { id: \`alert-\${now}-\${Math.floor(rng() * 100000)}\`, severity, message, timestamp: now },
  ...state.alerts,
].slice(0, MAX_ALERTS);`,
      note: 'New alerts prepend, then the list is sliced back to MAX_ALERTS — an unbounded array here is a real memory leak on a monitor left running for days.',
    },
    {
      title: "A route table that can't silently drift — src/router/useHashRoute.ts",
      code: `export const ROUTES = ['dashboard', 'endpoints', 'alerts', 'reports'] as const;
export type Route = (typeof ROUTES)[number];

const ROUTE_LABELS: Record<Route, string> = { /* every Route, or it won't compile */ };`,
      note: 'Route is derived from ROUTES, and every Record<Route, ...> map must be exhaustive — adding a page without its label is a type error, not a blank screen.',
    },
  ],
};
