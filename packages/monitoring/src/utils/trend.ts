export type Tone = 'default' | 'success' | 'warning' | 'error';

export interface Trend {
  text: string;
  tone: Tone;
}

// Per-tick noise on requests/sec is about ±30 around ~420, so compare against a
// short rolling average and only call it a trend beyond an 8% relative move.
const REQUEST_RATE_STEADY_RATIO = 0.08;

export function describeRequestRate(current: number, recentValues: number[]): Trend {
  if (recentValues.length === 0) return { text: 'steady', tone: 'default' };
  const baseline = recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length;
  if (baseline === 0) return { text: 'steady', tone: 'default' };
  const relativeDelta = (current - baseline) / baseline;
  if (Math.abs(relativeDelta) < REQUEST_RATE_STEADY_RATIO) {
    return { text: 'steady', tone: 'default' };
  }
  // Falling traffic isn't a fault by itself, so it stays neutral rather than amber.
  return relativeDelta > 0 ? { text: 'rising', tone: 'success' } : { text: 'falling', tone: 'default' };
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
