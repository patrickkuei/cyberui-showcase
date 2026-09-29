import { describe, it, expect } from 'vitest';
import { createInitialState, tick, HISTORY_LENGTH, MAX_ALERTS } from './simulation';

// Tiny deterministic PRNG (mulberry32) so statistical tests are reproducible.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('createInitialState', () => {
  it('seeds a rolling history of the configured length', () => {
    const state = createInitialState(1_700_000_000_000);
    expect(state.requestVolume).toHaveLength(HISTORY_LENGTH);
    expect(state.latencyPercentiles).toHaveLength(HISTORY_LENGTH);
    expect(state.usage).toHaveLength(HISTORY_LENGTH);
  });

  it('seeds a varied history, 2s apart and ending at now, so charts look alive on first paint', () => {
    const now = 1_700_000_000_000;
    const state = createInitialState(now, mulberry32(7));
    expect(state.requestVolume.at(-1)?.t).toBe(now);
    state.requestVolume.forEach((point, i) => {
      expect(point.t).toBe(now - (HISTORY_LENGTH - 1 - i) * 2000);
    });
    expect(new Set(state.requestVolume.map((p) => p.value)).size).toBeGreaterThan(1);
    expect(new Set(state.latencyPercentiles.map((p) => p.p95)).size).toBeGreaterThan(1);
    expect(new Set(state.usage.map((p) => p.tokensPerMin)).size).toBeGreaterThan(1);
    for (const point of state.usage) {
      expect(point.costPerHr).toBe(Number((point.tokensPerMin * 0.00035).toFixed(2)));
    }
    // Headline numbers agree with the latest history point.
    expect(state.requestsPerSec).toBe(state.requestVolume.at(-1)?.value);
    expect(state.p95LatencyMs).toBe(state.latencyPercentiles.at(-1)?.p95);
    // First paint is healthy.
    expect(state.errorRatePct).toBeLessThanOrEqual(2);
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

  it('stays healthy most of the time: error rate above 2% on < 10% of ticks', () => {
    const rng = mulberry32(42);
    let state = createInitialState(0, rng);
    let degraded = 0;
    const ticks = 2000;
    for (let i = 1; i <= ticks; i++) {
      state = tick(state, i * 2000, rng);
      if (state.errorRatePct > 2) degraded++;
    }
    expect(degraded / ticks).toBeLessThan(0.1);
  });

  it('only raises a critical error-rate alert while the error rate is actually above threshold', () => {
    const rng = mulberry32(1234);
    let state = createInitialState(0, rng);
    let fired = 0;
    for (let i = 1; i <= 5000; i++) {
      const now = i * 2000;
      state = tick(state, now, rng);
      const added = state.alerts.filter((alert) => alert.timestamp === now);
      for (const alert of added) {
        if (alert.severity === 'critical') {
          fired++;
          expect(alert.message).toMatch(/^Error rate above threshold/);
          expect(state.errorRatePct).toBeGreaterThan(2);
        }
      }
    }
    // The seeded run must actually exercise the incident path.
    expect(fired).toBeGreaterThan(0);
  });

  it('caps the alerts feed length no matter how long the tab stays open (Review Focus #2)', () => {
    let state = createInitialState(0);
    const rng = () => 0; // always satisfies every alert-append probability check
    for (let i = 1; i <= 500; i++) {
      state = tick(state, i * 2000, rng);
      expect(state.alerts.length).toBeLessThanOrEqual(MAX_ALERTS);
    }
    expect(state.alerts).toHaveLength(MAX_ALERTS);
  });
});
