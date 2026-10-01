import { useEffect, useState } from 'react';

interface ReadoutState {
  requestsPerSec: number;
  p95Ms: number;
  uptimePct: number;
}

const INITIAL: ReadoutState = { requestsPerSec: 1240, p95Ms: 214, uptimePct: 99.97 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function step(state: ReadoutState): ReadoutState {
  return {
    requestsPerSec: Math.round(clamp(state.requestsPerSec + (Math.random() - 0.5) * 80, 900, 1600)),
    p95Ms: Math.round(clamp(state.p95Ms + (Math.random() - 0.5) * 20, 160, 320)),
    uptimePct: Number(clamp(state.uptimePct + (Math.random() - 0.5) * 0.01, 99.9, 100).toFixed(2)),
  };
}

/**
 * A small self-contained ticking readout for the hero — not a real system,
 * just the same "bounded random walk" idea the monitoring demo's simulation
 * engine uses, reimplemented locally so this package stays self-contained.
 * The point isn't the numbers; it's proving the hub itself is a running
 * thing, not a screenshot, before a visitor clicks into a demo.
 */
export function LiveReadout() {
  const [state, setState] = useState<ReadoutState>(INITIAL);

  useEffect(() => {
    const id = setInterval(() => setState(step), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="live-readout" role="status" aria-label="Example live metrics">
      <span className="live-readout-dot" aria-hidden="true" />
      <span className="live-readout-item">
        <span className="live-readout-value">{state.requestsPerSec.toLocaleString('en-US')}</span> req/s
      </span>
      <span className="live-readout-divider" aria-hidden="true" />
      <span className="live-readout-item">
        <span className="live-readout-value">{state.p95Ms}</span> ms p95
      </span>
      <span className="live-readout-divider" aria-hidden="true" />
      <span className="live-readout-item">
        <span className="live-readout-value">{state.uptimePct}</span>% uptime
      </span>
    </div>
  );
}
