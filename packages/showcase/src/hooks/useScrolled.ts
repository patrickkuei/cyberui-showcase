import { useEffect, useState } from 'react';

/**
 * True once the page has scrolled past `thresholdPx`. Used by Nav to swap
 * from transparent-over-hero to a solid background — see Nav.tsx.
 */
export function useScrolled(thresholdPx: number): boolean {
  const [scrolled, setScrolled] = useState(() => window.scrollY > thresholdPx);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > thresholdPx);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [thresholdPx]);

  return scrolled;
}
