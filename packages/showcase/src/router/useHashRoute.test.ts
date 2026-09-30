import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHashRoute } from './useHashRoute';

describe('useHashRoute', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('parses the empty hash as home', () => {
    window.location.hash = '';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'home' });
  });

  it('parses #/gallery as the gallery index', () => {
    window.location.hash = '#/gallery';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'gallery-index' });
  });

  it('parses #/gallery/monitoring as a gallery detail route', () => {
    window.location.hash = '#/gallery/monitoring';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'gallery', slug: 'monitoring' });
  });

  it('parses #/process as the process route', () => {
    window.location.hash = '#/process';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'process' });
  });

  it('parses an unknown hash as not-found', () => {
    window.location.hash = '#/nonsense';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'not-found' });
  });
});
