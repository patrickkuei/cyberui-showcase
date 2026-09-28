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
