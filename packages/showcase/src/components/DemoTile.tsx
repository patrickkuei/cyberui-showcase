import type { CSSProperties } from 'react';
import { Badge, Button, Card, Image } from 'cyberui-2045';
import type { GalleryItem } from '../data/galleryItems';
import { COMING_SOON_FALLBACK } from '../assets/comingSoonFallback';

export interface DemoTileProps {
  item: GalleryItem;
  /** Large tile for a shipped demo; small for "coming soon" — see design spec, Wireframe (Gallery). */
  size: 'large' | 'small';
}

export function DemoTile({ item, size }: DemoTileProps) {
  const live = item.status === 'live';

  // Scopes this demo's own accent hue to just this one tile — never a
  // hub-wide token override. This is also the fix for the original bug
  // this redesign started from: Card's accent variant always reads the
  // raw, unthemed --color-accent unless something scopes it locally.
  // See design spec, Motion & Interaction.
  // For coming-soon tiles, scope accent to neutral to ensure Image's
  // inherent border-accent/30 renders as subtle neutral chrome instead
  // of falling back to the library's raw yellow default.
  // --color-secondary is NOT just a glow color: Card reads it for its
  // <h3> title text color, and Badge variant="secondary" reads it as the
  // badge's own background (with text-inverse on top). So the coming-soon
  // branch deliberately points --color-secondary at --color-muted (a
  // light neutral text token), not at --color-border-default like accent
  // — reusing the dark border token here nearly wiped out the demo name
  // and the "Coming soon" badge against the dark page background.
  const accentStyle = (
    live
      ? { '--color-accent': item.accentHex, '--color-secondary': item.accentHex }
      : { '--color-accent': 'var(--color-border-default)', '--color-secondary': 'var(--color-muted)' }
  ) as CSSProperties;

  return (
    <Card
      variant={live ? 'accent' : 'small'}
      title={item.name}
      titleBorder={live}
      className={`demo-tile demo-tile-${size}${live ? '' : ' demo-tile-dimmed'}`}
      style={accentStyle}
    >
      <Image
        src={item.screenshotSrc}
        alt={`${item.name} screenshot`}
        fallback={COMING_SOON_FALLBACK}
        preview={false}
        className="demo-tile-image"
      />
      <p className="demo-tile-tagline">{item.tagline}</p>
      <div className="demo-tile-footer">
        <Badge variant={live ? 'success' : 'secondary'} size="sm">
          {live ? 'Live' : 'Coming soon'}
        </Badge>
        {live && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.hash = `#/gallery/${item.slug}`;
            }}
          >
            View case study
          </Button>
        )}
      </div>
    </Card>
  );
}
