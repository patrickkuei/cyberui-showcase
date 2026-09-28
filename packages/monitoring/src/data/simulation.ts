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
