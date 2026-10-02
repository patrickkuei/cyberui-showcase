import { useEffect, useState, type RefObject } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * A thin band (5% tall) about a third of the way down the viewport: the top
 * 35% and bottom 60% are cut away.
 */
export const READING_BAND_MARGIN = '-35% 0px -60% 0px';

/**
 * Drives the /process left progress rail.
 *
 * - `current`: the number of the stage row crossing the reading band. A band,
 *   not "the most visible row": rows are taller than the band, so exactly one
 *   crosses it at a time and there is no tie to break. Between rows (none in
 *   the band) the last value is kept.
 * - `pastOverview`: true once the inline strip (overviewRef) is out of the
 *   viewport AND above it. The "above" check keeps the rail from appearing
 *   when the strip is merely below the fold.
 *
 * The band alone cannot reach the last stage: at maximum scroll the last
 * row's top never gets up to the band (the page cannot scroll further), and
 * on a tall viewport even the one before it can be missed. So a third
 * observer watches an end-of-page sentinel (endRef, the last child of the
 * page); while it is in view `current` is the last stage. When it leaves
 * view `current` is left alone: the band observer takes over as the reader
 * scrolls back up.
 *
 * The rail is a decorative extra, so content must never depend on it: with
 * prefers-reduced-motion, or in a browser without IntersectionObserver, no
 * observers are created and the result is { current: null, pastOverview: false }
 * from the first render, i.e. the rail never appears.
 *
 * Rows are found by their `data-stage-number` attribute inside rootRef.
 */
export function useProcessScrollSpy(
  rootRef: RefObject<HTMLElement | null>,
  overviewRef: RefObject<HTMLElement | null>,
  endRef: RefObject<HTMLElement | null>,
): { current: number | null; pastOverview: boolean } {
  const reducedMotion = usePrefersReducedMotion();
  const canObserve = typeof IntersectionObserver !== 'undefined';
  const [current, setCurrent] = useState<number | null>(null);
  const [pastOverview, setPastOverview] = useState(false);

  useEffect(() => {
    if (reducedMotion || !canObserve) return;
    const observers: IntersectionObserver[] = [];

    const overview = overviewRef.current;
    if (overview) {
      const observer = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setPastOverview(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      }, { threshold: 0 });
      observer.observe(overview);
      observers.push(observer);
    }

    const root = rootRef.current;
    if (root) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const n = Number((entry.target as HTMLElement).dataset.stageNumber);
            if (!Number.isNaN(n)) setCurrent(n);
          }
        },
        { rootMargin: READING_BAND_MARGIN },
      );
      root.querySelectorAll('[data-stage-number]').forEach((row) => observer.observe(row));
      observers.push(observer);
    }

    const end = endRef.current;
    if (root && end) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          const numbers = [...root.querySelectorAll<HTMLElement>('[data-stage-number]')]
            .map((row) => Number(row.dataset.stageNumber))
            .filter((n) => !Number.isNaN(n));
          if (numbers.length > 0) setCurrent(Math.max(...numbers));
        },
        { threshold: 0 },
      );
      observer.observe(end);
      observers.push(observer);
    }

    return () => observers.forEach((observer) => observer.disconnect());
  }, [reducedMotion, canObserve, rootRef, overviewRef, endRef]);

  if (reducedMotion || !canObserve) return { current: null, pastOverview: false };
  return { current, pastOverview };
}
