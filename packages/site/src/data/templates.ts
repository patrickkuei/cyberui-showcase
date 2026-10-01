export type TemplateStatus = 'live' | 'coming-soon';

export interface Template {
  slug: string;
  name: string;
  tagline: string;
  /** Human label for the template's accent hue (spec: Theming) — display only. */
  accentLabel: string;
  /**
   * The template's accent hex value. Used to scope cyberui's --color-accent /
   * --color-secondary custom properties to just this template's own tile
   * tile (its hover glow) — never applied to hub chrome, which stays on
   * cyberui's raw defaults. See design spec, Motion & Interaction.
   */
  accentHex: string;
  status: TemplateStatus;
  /**
   * Path to a static screenshot, relative to the site's own index.html.
   * For a 'coming-soon' template this intentionally points at a file that
   * doesn't exist yet — Image's `fallback` prop covers the resulting
   * load error, and the real screenshot starts resolving automatically
   * once that file is committed. No code change needed to "promote" a
   * template from placeholder to real.
   */
  screenshotSrc: string;
  /**
   * Path to the template's built index.html, relative to the site's own
   * index.html. In production this is populated by the CI workflow copying
   * each template's dist into site/dist/live/<slug>/ (see #8); for local
   * dev, run `npm run sync-templates` first to populate public/live/<slug>/.
   * Only meaningful when status is 'live'.
   */
  livePreviewPath: string;
}

export const TEMPLATES: Template[] = [
  {
    slug: 'monitoring',
    name: 'AI Product Monitoring',
    tagline: 'Request volume, latency percentiles, error rate, and a live alerts feed for a production AI API.',
    accentLabel: 'Cyan',
    accentHex: '#00fff9',
    status: 'live',
    screenshotSrc: './screenshots/monitoring.png',
    livePreviewPath: './live/monitoring/index.html',
  },
  {
    slug: 'agent-panel',
    name: 'Agent Control Panel',
    tagline: 'Conversation logs, task queue, live status, and the reasoning trail behind an AI assistant.',
    accentLabel: 'Violet',
    accentHex: '#8b5cf6',
    status: 'coming-soon',
    screenshotSrc: './screenshots/agent-panel.png',
    livePreviewPath: '',
  },
  {
    slug: 'landing',
    name: 'Landing Page',
    tagline: 'A marketing site built entirely from cyberui-2045 — proof the library holds up outside a dashboard.',
    accentLabel: 'Amber',
    accentHex: '#ffb800',
    status: 'coming-soon',
    screenshotSrc: './screenshots/landing.png',
    livePreviewPath: '',
  },
  {
    slug: 'mobile',
    name: 'Mobile App',
    tagline: 'A mobile-first interface — the same dark/neon system at phone width.',
    accentLabel: 'Green',
    accentHex: '#00e676',
    status: 'coming-soon',
    screenshotSrc: './screenshots/mobile.png',
    livePreviewPath: '',
  },
  {
    slug: 'social',
    name: 'Community / Social',
    tagline: 'Profiles, feeds, and reactions — a social interface in the same visual language.',
    accentLabel: 'Magenta',
    accentHex: '#ff00e5',
    status: 'coming-soon',
    screenshotSrc: './screenshots/social.png',
    livePreviewPath: '',
  },
];

export function getTemplate(slug: string): Template | undefined {
  return TEMPLATES.find((item) => item.slug === slug);
}

export function isLive(item: Template): boolean {
  return item.status === 'live';
}
