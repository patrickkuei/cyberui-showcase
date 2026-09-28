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
