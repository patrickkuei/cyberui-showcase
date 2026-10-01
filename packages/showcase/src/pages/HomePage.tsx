import { Badge, Button, Card } from 'cyberui-2045';
import { GALLERY_ITEMS } from '../data/galleryItems';
import { LiveReadout } from '../components/LiveReadout';

export function HomePage() {
  return (
    <div className="home">
      <header className="hero">
        <h1 className="hero-title">
          Real products,
          <br />
          not a component playground.
        </h1>
        <LiveReadout />
        <p className="hero-subtitle">
          cyberui-2045 in production: an AI monitoring dashboard, end to end — the running app, the code
          behind it, and the decisions that shaped it.
        </p>
        <Button
          variant="primary"
          onClick={() => {
            window.location.hash = GALLERY_ITEMS[0] ? `#/gallery/${GALLERY_ITEMS[0].slug}` : '#/';
          }}
        >
          View the gallery
        </Button>
      </header>

      <section className="gallery-grid" aria-label="Demo gallery">
        {GALLERY_ITEMS.map((item) => (
          <Card key={item.slug} title={item.name} variant="accent">
            <p className="gallery-tile-tagline">{item.tagline}</p>
            <div className="gallery-tile-footer">
              <Badge variant="success" size="sm">
                Live
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  window.location.hash = `#/gallery/${item.slug}`;
                }}
              >
                View case study
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
