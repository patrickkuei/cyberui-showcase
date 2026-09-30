import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * The Home hero's one bold visual moment: a halftone/screentone glow, not
 * a literal screenshot or a plain neon-on-dark gradient. A flat dot
 * pattern is masked by a radial glow, so dots read as dense near the
 * center and dissolve toward the edges — the "gradient reproduced as
 * print dots" look. See design spec, Visual Direction, for why this beats
 * a screenshot (redundant with Gallery) or a sourced/commissioned image
 * (real asset cost, no existing brand mark to build from).
 */
export function HeroScene() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className={`hero-scene${reducedMotion ? '' : ' hero-scene-animated'}`} aria-hidden="true">
      <svg className="hero-scene-halftone" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
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
            <rect width="800" height="500" fill="url(#heroGlow)" />
          </mask>
        </defs>
        <rect width="800" height="500" fill="url(#heroDots)" mask="url(#heroDotMask)" />
      </svg>
    </div>
  );
}
