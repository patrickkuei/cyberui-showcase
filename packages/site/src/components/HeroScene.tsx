import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * The Home hero's one bold visual moment: a halftone/screentone glow, not
 * a literal screenshot or a plain neon-on-dark gradient. A flat dot
 * pattern is masked by a radial glow, so dots read as dense near the
 * center and dissolve toward the edges — the "gradient reproduced as
 * print dots" look. See design spec, Visual Direction, for why this beats
 * a screenshot (redundant with Templates) or a sourced/commissioned image
 * (real asset cost, no existing brand mark to build from).
 *
 * The CYBERUI wordmark underneath is revealed by a circular spotlight that
 * tracks the pointer — not literal dot-repulsion physics (that would mean
 * a <canvas> particle simulation, real complexity for a decorative
 * flourish), but the same payoff: sweep the cursor across the dots and
 * hidden text shows through. Position updates go straight onto the DOM via
 * a ref, not React state, so a mousemove storm never triggers a re-render.
 * This is pointer-triggered motion (identical in kind to the scroll-reveal
 * on /process), so it isn't gated behind prefers-reduced-motion — nothing
 * here auto-plays.
 */
export function HeroScene() {
  const reducedMotion = usePrefersReducedMotion();
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Listens on the scene's parent (.hero), not the scene itself: the
  // headline/CTA block is layered above the scene and covers most of it,
  // so pointer events over that block never reach the scene — the
  // spotlight would vanish whenever the cursor crossed the text.
  useEffect(() => {
    const spotlight = spotlightRef.current;
    const host = spotlight?.parentElement;
    if (!spotlight || !host) return;

    function onMove(event: PointerEvent) {
      const bounds = spotlight!.getBoundingClientRect();
      spotlight!.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`);
      spotlight!.style.setProperty('--spotlight-y', `${event.clientY - bounds.top}px`);
    }
    function onLeave() {
      spotlight!.style.setProperty('--spotlight-x', '-9999px');
    }

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  // The spotlight is a sibling of the scene, not a child: it has to paint
  // above .hero's legibility scrim (z-index 1) yet below the headline block
  // (z-index 2), and a child of .hero-scene can't escape that layer's order.
  return (
    <>
      <div
        className={`hero-scene${reducedMotion ? '' : ' hero-scene-animated'}`}
        aria-hidden="true"
      >
        {/* No viewBox on purpose: a viewBox + preserveAspectRatio would scale
            the dot pattern along with the container, so a wider (full-bleed)
            hero would render visibly bigger dots. Without one, 1 SVG unit =
            1 CSS px, so the 10px pattern tile stays a fixed physical size
            regardless of how wide .hero is. */}
        <svg className="hero-scene-halftone" width="100%" height="100%">
          <defs>
            <radialGradient id="heroGlow" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.9" />
              <stop offset="60%" stopColor="var(--color-secondary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
            </radialGradient>
            <pattern id="heroDots" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill="var(--color-secondary)" />
            </pattern>
            <mask id="heroDotMask">
              <rect width="100%" height="100%" fill="url(#heroGlow)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroDots)" mask="url(#heroDotMask)" />
        </svg>
      </div>
      <div ref={spotlightRef} className="hero-scene-spotlight-text" aria-hidden="true">
        <span className="hero-scene-spotlight-word">CYBERUI</span>
      </div>
    </>
  );
}
