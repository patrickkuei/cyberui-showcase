import { useEffect, useState } from 'react';
import { createInitialState, tick, type DashboardState } from './simulation';

export function useSimulatedMetrics(intervalMs = 2000): DashboardState {
  const [state, setState] = useState<DashboardState>(() => createInitialState(Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => tick(prev, Date.now()));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return state;
}
