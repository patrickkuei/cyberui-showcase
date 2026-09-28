import { useEffect, useRef, useState } from 'react';
import { createInitialState, tick, type DashboardState } from './simulation';

export function useSimulatedMetrics(intervalMs = 2000): DashboardState {
  const [state, setState] = useState<DashboardState>(() => createInitialState(Date.now()));
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const id = setInterval(() => {
      setState(tick(stateRef.current, Date.now()));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return state;
}
