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

export type IncidentKind = 'errors' | 'latency';

/** A short, rare excursion away from healthy targets that decays back once it ends. */
export interface Incident {
  kind: IncidentKind;
  ticksLeft: number;
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
  /** The incident currently pushing metrics away from healthy targets, if any. */
  incident: Incident | null;
  /** Which threshold alarms are currently raised (alerts fire on raise and on resolve). */
  alarms: { errorRate: boolean; latency: boolean };
}

export const HISTORY_LENGTH = 30;
export const MAX_ALERTS = 20;
export const TICK_MS = 2000;

/** Same thresholds the page uses to colour the badge and stat tiles (App.tsx). */
export const ERROR_RATE_THRESHOLD_PCT = 2;
export const P95_LATENCY_THRESHOLD_MS = 500;

// Alarms clear with a little hysteresis so a value hovering at the threshold
// doesn't spam raise/resolve pairs into the feed.
const ERROR_RATE_RESOLVE_PCT = 1.5;
const P95_LATENCY_RESOLVE_MS = 420;

// Healthy targets every metric reverts toward.
const TARGETS = {
  requestsPerSec: 420,
  p95LatencyMs: 220,
  errorRatePct: 0.4,
  activeSessions: 1280,
  tokensPerMin: 18000,
};

// Targets while an incident of the given kind is active.
const INCIDENT_TARGETS: Record<IncidentKind, { errorRatePct: number; p95LatencyMs: number }> = {
  errors: { errorRatePct: 3.6, p95LatencyMs: 260 },
  latency: { errorRatePct: 0.7, p95LatencyMs: 640 },
};

/** Per-tick chance an incident starts (~one every 12 minutes at a 2s tick). */
const INCIDENT_CHANCE = 1 / 360;
const INCIDENT_MIN_TICKS = 10; // 20s
const INCIDENT_EXTRA_TICKS = 15; // up to +30s

/** Per-tick chance of a benign background event (deploys, autoscaling, quota notices). */
const BACKGROUND_ALERT_CHANCE = 0.04;

const ENDPOINT_BASELINES: readonly EndpointStats[] = [
  { name: '/v1/chat/completions', requests: 1800, avgLatencyMs: 320, errorRatePct: 0.5 },
  { name: '/v1/embeddings', requests: 1100, avgLatencyMs: 90, errorRatePct: 0.2 },
  { name: '/v1/images/generate', requests: 240, avgLatencyMs: 850, errorRatePct: 0.8 },
  { name: '/v1/models', requests: 600, avgLatencyMs: 40, errorRatePct: 0.05 },
];

const BACKGROUND_ALERTS: readonly { severity: AlertSeverity; message: string }[] = [
  { severity: 'info', message: 'Deploy completed: model-router v2.3.1' },
  { severity: 'info', message: 'Autoscaler added 2 nodes to inference pool' },
  { severity: 'warning', message: 'Approaching rate limit for org acme-corp' },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Mean-reverting walk: each step pulls a fraction `pull` of the way back
 * toward `target`, then adds uniform noise of width `noise`. The clamp is only
 * a safety bound; in practice values stay near the target.
 */
function revert(
  value: number,
  target: number,
  pull: number,
  noise: number,
  min: number,
  max: number,
  rng: () => number,
): number {
  return clamp(value + (target - value) * pull + (rng() - 0.5) * noise, min, max);
}

function costPerHrFor(tokensPerMin: number): number {
  return Number((tokensPerMin * 0.00035).toFixed(2));
}

function baseState(t: number): DashboardState {
  const p95 = TARGETS.p95LatencyMs;
  return {
    requestsPerSec: TARGETS.requestsPerSec,
    p95LatencyMs: p95,
    errorRatePct: TARGETS.errorRatePct,
    activeSessions: TARGETS.activeSessions,
    requestVolume: Array.from({ length: HISTORY_LENGTH }, () => ({ t, value: TARGETS.requestsPerSec })),
    latencyPercentiles: Array.from({ length: HISTORY_LENGTH }, () => ({ t, p50: p95 * 0.4, p95, p99: p95 * 1.8 })),
    usage: Array.from({ length: HISTORY_LENGTH }, () => ({
      t,
      tokensPerMin: TARGETS.tokensPerMin,
      costPerHr: costPerHrFor(TARGETS.tokensPerMin),
    })),
    endpoints: ENDPOINT_BASELINES.map((baseline) => ({ ...baseline })),
    alerts: [],
    incident: null,
    alarms: { errorRate: false, latency: false },
  };
}

export function createInitialState(now: number, rng: () => number = Math.random): DashboardState {
  // Run the real tick logic across the whole history window (incidents
  // disabled, so first paint is healthy) so the charts are already varied.
  // Every history point gets overwritten, ending at `now`, 2s apart.
  let state = baseState(now - HISTORY_LENGTH * TICK_MS);
  for (let i = HISTORY_LENGTH - 1; i >= 0; i--) {
    state = step(state, now - i * TICK_MS, rng, false);
  }
  return {
    ...state,
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
  return step(state, now, rng, true);
}

function step(state: DashboardState, now: number, rng: () => number, allowIncidents: boolean): DashboardState {
  // Incident lifecycle: rare, short, then metrics decay back to healthy.
  let incident: Incident | null = state.incident;
  if (incident) {
    incident = incident.ticksLeft > 1 ? { ...incident, ticksLeft: incident.ticksLeft - 1 } : null;
  } else if (allowIncidents && rng() < INCIDENT_CHANCE) {
    incident = {
      kind: rng() < 0.5 ? 'errors' : 'latency',
      ticksLeft: INCIDENT_MIN_TICKS + Math.floor(rng() * (INCIDENT_EXTRA_TICKS + 1)),
    };
  }
  const incidentTargets = incident ? INCIDENT_TARGETS[incident.kind] : null;
  // Incidents ramp in quickly; recovery uses the gentler normal pull.
  const pull = incident ? 0.3 : 0.1;

  // Headline metrics.
  const requestsPerSec = revert(state.requestsPerSec, TARGETS.requestsPerSec, 0.08, 60, 50, 2000, rng);
  const p95LatencyMs = revert(
    state.p95LatencyMs,
    incidentTargets?.p95LatencyMs ?? TARGETS.p95LatencyMs,
    pull,
    40,
    40,
    900,
    rng,
  );
  const errorRatePct = revert(
    state.errorRatePct,
    incidentTargets?.errorRatePct ?? TARGETS.errorRatePct,
    pull,
    0.3,
    0,
    8,
    rng,
  );
  const activeSessions = revert(state.activeSessions, TARGETS.activeSessions, 0.05, 80, 20, 5000, rng);

  const p50 = clamp(p95LatencyMs * 0.4, 20, p95LatencyMs);
  const p99 = clamp(p95LatencyMs * 1.8, p95LatencyMs, 2000);
  const previousTokens = state.usage[state.usage.length - 1]?.tokensPerMin ?? TARGETS.tokensPerMin;
  const tokensPerMin = revert(previousTokens, TARGETS.tokensPerMin, 0.1, 1500, 2000, 60000, rng);
  const costPerHr = costPerHrFor(tokensPerMin);

  const requestVolume = [...state.requestVolume.slice(1), { t: now, value: requestsPerSec }];
  const latencyPercentiles = [...state.latencyPercentiles.slice(1), { t: now, p50, p95: p95LatencyMs, p99 }];
  const usage = [...state.usage.slice(1), { t: now, tokensPerMin, costPerHr }];

  // Endpoints revert to their own baselines; incidents land on /v1/chat/completions.
  const endpoints = state.endpoints.map((endpoint, index) => {
    const baseline = ENDPOINT_BASELINES[index] ?? endpoint;
    const affected = index === 0 && incident !== null;
    const errorTarget = affected && incident?.kind === 'errors' ? 6 : baseline.errorRatePct;
    const latencyTarget =
      affected && incident?.kind === 'latency' ? baseline.avgLatencyMs * 2.2 : baseline.avgLatencyMs;
    const endpointPull = affected ? 0.3 : 0.1;
    return {
      ...endpoint,
      requests: Math.round(revert(endpoint.requests, baseline.requests, 0.1, baseline.requests * 0.1, 10, 8000, rng)),
      avgLatencyMs: Math.round(
        revert(endpoint.avgLatencyMs, latencyTarget, endpointPull, baseline.avgLatencyMs * 0.12, 5, 3000, rng),
      ),
      errorRatePct: Number(
        revert(
          endpoint.errorRatePct,
          errorTarget,
          endpointPull,
          Math.max(0.05, baseline.errorRatePct * 0.4),
          0,
          10,
          rng,
        ).toFixed(2),
      ),
    };
  });

  // Alerts: threshold alarms are derived from the current metrics (so a
  // critical error-rate alert only ever fires while the error rate really is
  // above threshold), plus occasional benign background events.
  const newAlerts: Alert[] = [];
  const push = (severity: AlertSeverity, message: string): void => {
    newAlerts.unshift({
      id: `alert-${now}-${newAlerts.length}-${Math.floor(rng() * 100000)}`,
      severity,
      message,
      timestamp: now,
    });
  };

  const alarms = { ...state.alarms };
  if (!alarms.errorRate && errorRatePct > ERROR_RATE_THRESHOLD_PCT) {
    alarms.errorRate = true;
    push('critical', 'Error rate above threshold on us-east-1');
  } else if (alarms.errorRate && errorRatePct < ERROR_RATE_RESOLVE_PCT) {
    alarms.errorRate = false;
    push('info', 'Resolved: error rate back to normal');
  }
  if (!alarms.latency && p95LatencyMs > P95_LATENCY_THRESHOLD_MS) {
    alarms.latency = true;
    push('warning', 'p95 latency spike on /v1/chat/completions');
  } else if (alarms.latency && p95LatencyMs < P95_LATENCY_RESOLVE_MS) {
    alarms.latency = false;
    push('info', 'Resolved: p95 latency back to normal');
  }
  if (rng() < BACKGROUND_ALERT_CHANCE) {
    const event = BACKGROUND_ALERTS[Math.floor(rng() * BACKGROUND_ALERTS.length)] ?? BACKGROUND_ALERTS[0];
    if (event) push(event.severity, event.message);
  }

  const alerts = newAlerts.length > 0 ? [...newAlerts, ...state.alerts].slice(0, MAX_ALERTS) : state.alerts;

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
    incident,
    alarms,
  };
}
