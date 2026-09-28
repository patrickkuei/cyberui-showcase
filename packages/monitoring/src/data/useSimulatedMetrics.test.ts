import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSimulatedMetrics } from './useSimulatedMetrics';

describe('useSimulatedMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances state on each interval tick', () => {
    const { result } = renderHook(() => useSimulatedMetrics(2000));
    const initial = result.current;

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).not.toBe(initial);
    expect(result.current.requestVolume).toHaveLength(initial.requestVolume.length);
  });

  it('clears its interval on unmount (Review Focus #3)', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useSimulatedMetrics(2000));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
