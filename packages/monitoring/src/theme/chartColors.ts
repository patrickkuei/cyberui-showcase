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
