import { useScrolled } from '../hooks/useScrolled';

export interface NavProps {
  /**
   * Only Home has a hero scene behind the nav worth blending into. Every
   * other page renders solid from the first paint — nav transparency is
   * functional (legibility over the hero), not decorative, so it never
   * applies where there's no hero to blend with. See design spec, Motion
   * & Interaction, and Review Focus #3.
   */
  transparentUntilScroll?: boolean;
}

export function Nav({ transparentUntilScroll = false }: NavProps) {
  const scrolledPastHero = useScrolled(80);
  const solid = !transparentUntilScroll || scrolledPastHero;

  return (
    <nav className={`site-nav${solid ? ' site-nav-solid' : ''}`}>
      <a className="site-nav-brand" href="#/">
        cyberui-2045 showcase
      </a>
      <div className="site-nav-links">
        <a href="#/gallery">Gallery</a>
        <a href="#/process">How we design</a>
      </div>
    </nav>
  );
}
