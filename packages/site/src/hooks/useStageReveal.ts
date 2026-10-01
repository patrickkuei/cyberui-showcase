import { useEffect, useRef, useState, type RefObject } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export type RevealStage = 'pending' | 'header' | 'full';

/**
 * Shrinks the observer's viewport from the bottom by 40%, so the "full"
 * observer fires once the element's top has climbed into the upper 60% of
 * the screen: roughly where someone is reading.
 */
export const READING_ZONE_MARGIN = '0px 0px -40% 0px';

const RANK: Record<RevealStage, number> = { pending: 0, header: 1, full: 2 };

/**
 * Two-step, one-way reveal for a long page of stacked rows:
 *   pending -> header (the row has risen into view) -> full (it reached the reading zone).
 *
 * This hook only reports a stage; the caller must animate OPACITY ONLY and
 * keep the row's height constant in every stage. Changing height while
 * someone scrolls makes the content under their eyes jump.
 *
 * Content must never depend on an observer to become visible: with
 * prefers-reduced-motion, or in a browser without IntersectionObserver, the
 * stage is 'full' from the first render.
 */
export function useStageReveal<T extends HTMLElement>(): { ref: RefObject<T | null>; stage: RevealStage } {
  const ref = useRef<T | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const canObserve = typeof IntersectionObserver !== 'undefined';
  const [stage, setStage] = useState<RevealStage>(reducedMotion || !canObserve ? 'full' : 'pending');

  useEffect(() => {
    if (reducedMotion || !canObserve) {
      setStage('full');
      return;
    }
    const node = ref.current;
    if (!node) return;

    const raiseTo = (next: RevealStage) => setStage((current) => (RANK[next] > RANK[current] ? next : current));
    // Each callback disconnects the observer it received, so each fires once.
    const watch = (next: RevealStage, options?: IntersectionObserverInit) => {
      const observer = new IntersectionObserver((entries, self) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          raiseTo(next);
          self.disconnect();
        }
      }, options);
      observer.observe(node);
      return observer;
    };

    const observers = [watch('header'), watch('full', { rootMargin: READING_ZONE_MARGIN })];
    return () => observers.forEach((observer) => observer.disconnect());
  }, [reducedMotion, canObserve]);

  return { ref, stage };
}
