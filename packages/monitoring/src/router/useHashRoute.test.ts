import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHashRoute } from './useHashRoute';

describe('useHashRoute', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('defaults to dashboard when there is no hash', () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toBe('dashboard');
  });

  it('reads a known route from the initial hash', () => {
    window.location.hash = '#/endpoints';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toBe('endpoints');
  });

  it('falls back to dashboard for an unknown hash (Review Focus #1)', () => {
    window.location.hash = '#/nope';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toBe('dashboard');
  });

  it('updates when the hash changes', () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toBe('dashboard');

    act(() => {
      window.location.hash = '#/alerts';
      window.dispatchEvent(new Event('hashchange'));
    });

    expect(result.current).toBe('alerts');
  });
});
