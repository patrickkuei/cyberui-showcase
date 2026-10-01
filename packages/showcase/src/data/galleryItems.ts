export interface GalleryItem {
  slug: string;
  name: string;
  tagline: string;
  /** Human label for the demo's accent hue (spec: Theming) — display only. */
  accentLabel: string;
  /**
   * Path to the demo's built index.html, relative to showcase's own
   * index.html. In production this is populated by the CI workflow copying
   * each demo's dist into showcase/dist/live/<slug>/ (see #8); for local
   * dev, run `npm run sync-demos` first to populate public/live/<slug>/.
   */
  livePreviewPath: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    slug: 'monitoring',
    name: 'AI Product Monitoring',
    tagline: 'Request volume, latency percentiles, error rate, and a live alerts feed for a production AI API.',
    accentLabel: 'Cyan',
    livePreviewPath: './live/monitoring/index.html',
  },
];

export function getGalleryItem(slug: string): GalleryItem | undefined {
  return GALLERY_ITEMS.find((item) => item.slug === slug);
}
