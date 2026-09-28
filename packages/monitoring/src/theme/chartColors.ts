import { useMemo, type CSSProperties } from 'react';

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

export function chartTooltipProps(colors: ChartColors): {
  labelFormatter: () => string;
  contentStyle: CSSProperties;
  cursor: { fill: string; fillOpacity: number };
} {
  return {
    labelFormatter: () => '',
    contentStyle: { background: 'var(--color-surface)', border: `1px solid ${colors.border}` },
    // Recharts' BarChart tooltip defaults to an unstyled #ccc cursor rectangle spanning the
    // full category width and chart height; without this it reads as a stray light-grey box
    // against the dark theme.
    cursor: { fill: colors.border, fillOpacity: 0.3 },
  };
}
