import type { CaseStudyContent } from './types';

// Plain typed content, not Markdown/MDX files — with exactly one case study
// so far, a parsing pipeline would be pure overhead. Move this to content
// files (per the original spec) if/when authoring case studies outside of
// code becomes worth it.
export const CASE_STUDIES: Record<string, CaseStudyContent> = {
  monitoring: {
    problem:
      "A team shipping an AI product needs an at-a-glance operational view — request volume, latency percentiles, error rate, per-endpoint breakdown, and a live alerts feed — before they have, or want to wire up, a real observability backend just to prototype the UI.",
    decisions: [
      {
        title: 'A pure, timer-free simulation engine',
        body: "All “live” data comes from one pure function, tick(state, now, rng), called every 2 seconds by a thin useSimulatedMetrics hook. Because the state transition is pure and seedable, the illusion of a live dashboard is fully unit-testable: tests run it for 2,000 simulated ticks and assert latency and error rate never drift into nonsense, and that the alerts feed never grows past its cap — the “dashboard quietly breaks after being left open” class of bug that a single render would never catch.",
      },
      {
        title: 'Charts read the theme, never hardcode it',
        body: "Every chart series pulls its color from cyberui-2045's --color-* custom properties through one useChartColors() hook, instead of a hardcoded hex value. Swapping the whole dashboard to a different accent hue — the way each demo in this showcase does — touches zero chart code.",
      },
      {
        title: 'Routing that turns a missing page into a compile error',
        body: 'Multi-page navigation (Dashboard / Endpoints / Alerts / Reports) is driven by `ROUTES = [...] as const` plus `Record<Route, ...>` maps for labels and page components. Add a fifth page and forget to wire its label or its component, and TypeScript refuses to compile — instead of shipping a nav link that opens a blank screen.',
      },
    ],
    keySnippet: {
      title: 'useChartColors — the one place chart color comes from',
      code: `function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim() || fallback;
}

export function useChartColors(): ChartColors {
  return useMemo(() => ({
    primary: readCssVar('--color-primary', FALLBACK.primary),
    secondary: readCssVar('--color-secondary', FALLBACK.secondary),
    // ...accent, success, error, warning, muted, border
  }), []);
}`,
      note: 'Every chart component calls this instead of importing a color constant — see packages/monitoring/src/theme/chartColors.ts.',
    },
    takeaways: [
      'A UI can feel live with zero backend if the illusion of liveness is a pure, seedable function — which also makes it trivial to run thousands of ticks in a test.',
      "Theming a whole dashboard for a new accent hue doesn't require touching a charting library at all, once every color lookup goes through one hook.",
      "TypeScript's `as const` plus mapped types catch “forgot to wire the new page” mistakes for free — reach for that before an if/else chain.",
    ],
  },
};
