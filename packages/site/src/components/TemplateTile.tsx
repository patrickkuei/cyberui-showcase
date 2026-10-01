import type { CSSProperties } from 'react';
import { Badge, Button, Card, Image } from 'cyberui-2045';
import type { Template } from '../data/templates';
import { COMING_SOON_FALLBACK } from '../assets/comingSoonFallback';

export interface TemplateTileProps {
  item: Template;
  /** Large tile for a shipped template; small for "coming soon" — see design spec, Wireframe (Templates). */
  size: 'large' | 'small';
}

export function TemplateTile({ item, size }: TemplateTileProps) {
  const live = item.status === 'live';

  // Scopes this template's own accent hue to just this one tile — never a
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
  // — reusing the dark border token here nearly wiped out the template name
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
      className={`template-tile template-tile-${size}${live ? '' : ' template-tile-dimmed'}`}
      style={accentStyle}
    >
      <Image
        src={item.screenshotSrc}
        alt={`${item.name} screenshot`}
        fallback={COMING_SOON_FALLBACK}
        preview={false}
        className="template-tile-image"
      />
      <p className="template-tile-tagline">{item.tagline}</p>
      <div className="template-tile-footer">
        <Badge variant={live ? 'success' : 'secondary'} size="sm">
          {live ? 'Live' : 'Coming soon'}
        </Badge>
        {live && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.hash = `#/templates/${item.slug}`;
            }}
          >
            View case study
          </Button>
        )}
      </div>
    </Card>
  );
}
