import { Button, GradientText } from 'cyberui-2045';
import { HeroScene } from '../components/HeroScene';
import { LiveReadout } from '../components/LiveReadout';
import { GALLERY_ITEMS } from '../data/galleryItems';

function goToGallery() {
  window.location.hash = '#/gallery';
}

// Derived from GALLERY_ITEMS (not hardcoded) so this sentence doesn't go
// stale the moment a second demo ships.
const liveCount = GALLERY_ITEMS.filter((item) => item.status === 'live').length;
const comingSoonCount = GALLERY_ITEMS.length - liveCount;
const closingCtaText = `${liveCount} demo${liveCount === 1 ? '' : 's'} live today, ${comingSoonCount} more on the way.`;

export function HomePage() {
  return (
    <div className="home">
      <section className="hero">
        <HeroScene />
        <div className="hero-content">
          <GradientText as="h1" variant="accent" className="hero-title">
            Real products,
            <br />
            not a component playground.
          </GradientText>
          <Button variant="primary" onClick={goToGallery}>
            View the gallery
          </Button>
        </div>
      </section>

      <section className="home-intro">
        <h2>What cyberui-2045 actually is</h2>
        <p>
          A production-ready dark/neon component library, not a Storybook of parts in isolation —
          every demo in the gallery is a real, working app built from it.
        </p>
        <LiveReadout />
        <ul className="home-features">
          <li>Token-based theming — one accent hue swap re-themes an entire app, no per-component edits.</li>
          <li>30+ components, from buttons to a keyboard-navigable date picker.</li>
          <li>Dark-mode-native — not a light theme with the colors inverted.</li>
          <li>Accessible by default — keyboard navigation and focus states built in, not bolted on.</li>
        </ul>
      </section>

      <section className="home-closing-cta">
        <p>{closingCtaText}</p>
        <Button variant="primary" onClick={goToGallery}>
          View the gallery
        </Button>
      </section>
    </div>
  );
}
