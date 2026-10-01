import { useEffect, useRef, useState, type RefObject } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * True once the referenced element has entered the viewport. With
 * prefers-reduced-motion, starts (and stays) true — content must never
 * depend on an observer firing to become visible. IntersectionObserver
 * (not a scroll-position poll) is used specifically because its callback
 * fires immediately for an element that's already in the viewport at
 * observe() time, which is what keeps an act that's already on-screen at
 * page load from ever getting stuck invisible. See design spec, Motion &
 * Interaction, and Review Focus #2.
 */
export function useRevealOnScroll<T extends HTMLElement>(): { ref: RefObject<T | null>; visible: boolean } {
  const ref = useRef<T | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion || !ref.current) return;
    const node = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return { ref, visible };
}
