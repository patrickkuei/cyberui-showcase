# Showcase Hub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Naming amendment (2026-10-01):** this plan is the record of what was executed, so it keeps the original names. "Gallery" was later renamed **Templates** — see the amendment in the design spec. Read `/gallery` as `/templates`, `GalleryItem`/`GALLERY_ITEMS` as `Template`/`TEMPLATES`, `GalleryPage`/`GalleryIndexPage` as `TemplatePage`/`TemplatesIndexPage`, and `DemoTile` as `TemplateTile`. The repo was also renamed `cyberui-showcase` -> `cyberui-templates`, and `packages/showcase` -> `packages/site`.

**Goal:** Redesign the `packages/showcase` hub (Home, a new Gallery index, and a new Process page) per the approved design spec — fix the single-card-in-a-void layout and undisciplined accent usage, and add an honest "how we design" page.

**Architecture:** Four routes (`/`, `/gallery`, `/gallery/:slug`, `/process`) behind a persistent nav, sharing one `GalleryItem` data model extended with per-demo accent hex and shipped/coming-soon status. New shared pieces (`Nav`, `DemoTile`, `HeroScene`, `ProcessAct`/`ProcessActTwo`) are small, single-purpose components; the existing demo detail page (`GalleryPage`, `CodeViewer`, `CaseStudy`) is untouched except for its back-link target and a new not-yet-shipped branch.

**Tech Stack:** React 19, TypeScript, Vite, Vitest + Testing Library (`happy-dom`), `cyberui-2045` ^2.6.0 (`Card`, `Image`, `Badge`, `Button`, `Timeline`, `GradientText`).

**Spec:** [docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md](../specs/2026-09-30-showcase-hub-redesign-design.md)

## Global Constraints

- Node >=20.19, TypeScript ~5.8.3, React 19 — matches `packages/showcase/package.json`, unchanged.
- All asset paths are relative (`./screenshots/x.png`, not `/screenshots/x.png`) — `vite.config.ts` sets `base: './'` so the build works standalone and under a subpath; the existing `./live/monitoring/index.html` path follows this and new paths must match it.
- `packages/showcase` stays self-contained: no imports from other `packages/*`, no new `workspace:` ranges (per root `CLAUDE.md`).
- No new project dependencies. In particular, do not add Playwright (or any browser-automation tool) as a `devDependency` — screenshot capture (Task 12) is a one-off manual step producing a committed static asset, not a build-time pipeline; this matches the spec's "solo-maintainer, no-deadline" reasoning for rejecting asset-production overhead elsewhere.
- Component variant discipline (spec, Visual Direction): `Card variant="accent"` and any persistent glow/accent styling is reserved for the specific places the spec names (Home hero, Process Act 2, Gallery's one live tile). Do not apply accent variants elsewhere "for consistency."
- Hub chrome (nav, page backgrounds, gallery tile borders) stays on cyberui's neutral default tokens; never add a hub-wide `--color-accent`/`--color-secondary`/`--color-primary` override in `App.css` or `main.tsx`.
- "Coming soon" content must read as honestly unfinished, not implied as real — matches this repo's existing honesty standard (`packages/monitoring/README.md`).
- Follow the existing single shared `App.css` convention (no per-component CSS files) — the codebase currently keeps all showcase styling in one file with comment-delimited sections; add new sections the same way rather than splitting files.

## Review Focus

1. Visiting `/gallery/agent-panel` (or any coming-soon slug) directly must show a clear "not built yet" message, not a broken/blank Preview tab trying to render an iframe or case study that doesn't exist. (Task 7)
2. `prefers-reduced-motion: reduce`, and an element that's already in the viewport at page load — Process acts and the Home hero must render fully visible immediately, never stuck at zero opacity waiting on an animation or observer callback that's skipped. (Tasks 8, 10, 11)
3. Nav legibility on `/gallery`, `/gallery/:slug`, and `/process` — none of these pages has a hero image behind the nav, so the nav must render with its solid background from the very first paint there, never the transparent-over-hero state that only makes sense on Home. (Tasks 3, 4)
4. "Coming soon" tiles must not be focusable or clickable (no dead button/link sitting in the tab order that does nothing), while the one live tile stays fully keyboard-operable via a real `<button>`. (Task 5)
5. `Image`'s `src` intentionally 404s for a not-yet-shipped demo's screenshot — the automated test can only check that `src`/`fallback` are wired correctly (JSDOM/`happy-dom` don't simulate real image loading failures), so this needs one manual check against the actual running dev server before calling Task 5 done, not just a passing unit test. (Task 5)

## File Structure

```
packages/showcase/src/
  data/
    galleryItems.ts          MODIFY — add accentHex, status, screenshotSrc, isLive()
    galleryItems.test.ts     CREATE
  router/
    useHashRoute.ts          MODIFY — add 'gallery-index' and 'process' routes
    useHashRoute.test.ts     CREATE
  hooks/
    useScrolled.ts            CREATE
    usePrefersReducedMotion.ts CREATE
    useRevealOnScroll.ts      CREATE
  components/
    Nav.tsx / Nav.test.tsx                 CREATE
    DemoTile.tsx / DemoTile.test.tsx        CREATE
    HeroScene.tsx / HeroScene.test.tsx      CREATE
    ProcessAct.tsx                          CREATE
    ProcessActTwo.tsx                       CREATE
  content/
    processStages.ts          CREATE
  assets/
    comingSoonFallback.ts     CREATE
  pages/
    HomePage.tsx / HomePage.test.tsx        MODIFY (rewrite)
    GalleryIndexPage.tsx / .test.tsx        CREATE
    GalleryPage.tsx / GalleryPage.test.tsx  MODIFY
    ProcessPage.tsx / ProcessPage.test.tsx  CREATE
  App.tsx / App.test.tsx      MODIFY
  App.css                     MODIFY (new sections, remove dead .gallery-grid/.gallery-tile-* rules)
packages/showcase/public/
  screenshots/monitoring.png  CREATE (binary asset, Task 12)
```

---

## Task 1: Extend the gallery item data model

**Files:**
- Modify: `packages/showcase/src/data/galleryItems.ts`
- Test: `packages/showcase/src/data/galleryItems.test.ts`

**Interfaces:**
- Produces: `type DemoStatus = 'live' | 'coming-soon'`; `interface GalleryItem { slug: string; name: string; tagline: string; accentLabel: string; accentHex: string; status: DemoStatus; screenshotSrc: string; livePreviewPath: string }`; `GALLERY_ITEMS: GalleryItem[]` (5 items); `getGalleryItem(slug: string): GalleryItem | undefined` (unchanged signature); `isLive(item: GalleryItem): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/showcase/src/data/galleryItems.test.ts
import { describe, it, expect } from 'vitest';
import { GALLERY_ITEMS, getGalleryItem, isLive } from './galleryItems';

describe('galleryItems', () => {
  it('has exactly one live demo and four coming-soon demos', () => {
    const live = GALLERY_ITEMS.filter((item) => item.status === 'live');
    const comingSoon = GALLERY_ITEMS.filter((item) => item.status === 'coming-soon');
    expect(live).toHaveLength(1);
    expect(comingSoon).toHaveLength(4);
  });

  it("isLive reflects each item's status", () => {
    const monitoring = getGalleryItem('monitoring')!;
    const agentPanel = getGalleryItem('agent-panel')!;
    expect(isLive(monitoring)).toBe(true);
    expect(isLive(agentPanel)).toBe(false);
  });

  it('every item has a distinct accent hex', () => {
    const hexValues = GALLERY_ITEMS.map((item) => item.accentHex);
    expect(new Set(hexValues).size).toBe(hexValues.length);
  });

  it("every item's screenshot path is relative, matching the vite base: './' convention", () => {
    for (const item of GALLERY_ITEMS) {
      expect(item.screenshotSrc.startsWith('./screenshots/')).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `packages/showcase`): `npm run test -- galleryItems`
Expected: FAIL — `isLive` is not exported, `accentHex`/`status`/`screenshotSrc` don't exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// packages/showcase/src/data/galleryItems.ts
export type DemoStatus = 'live' | 'coming-soon';

export interface GalleryItem {
  slug: string;
  name: string;
  tagline: string;
  /** Human label for the demo's accent hue (spec: Theming) — display only. */
  accentLabel: string;
  /**
   * The demo's accent hex value. Used to scope cyberui's --color-accent /
   * --color-secondary custom properties to just this demo's own gallery
   * tile (its hover glow) — never applied to hub chrome, which stays on
   * cyberui's raw defaults. See design spec, Motion & Interaction.
   */
  accentHex: string;
  status: DemoStatus;
  /**
   * Path to a static screenshot, relative to showcase's own index.html.
   * For a 'coming-soon' demo this intentionally points at a file that
   * doesn't exist yet — Image's `fallback` prop covers the resulting
   * load error, and the real screenshot starts resolving automatically
   * once that file is committed. No code change needed to "promote" a
   * demo from placeholder to real.
   */
  screenshotSrc: string;
  /**
   * Path to the demo's built index.html, relative to showcase's own
   * index.html. In production this is populated by the CI workflow copying
   * each demo's dist into showcase/dist/live/<slug>/ (see #8); for local
   * dev, run `npm run sync-demos` first to populate public/live/<slug>/.
   * Only meaningful when status is 'live'.
   */
  livePreviewPath: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
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

export function getGalleryItem(slug: string): GalleryItem | undefined {
  return GALLERY_ITEMS.find((item) => item.slug === slug);
}

export function isLive(item: GalleryItem): boolean {
  return item.status === 'live';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- galleryItems`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/showcase/src/data/galleryItems.ts packages/showcase/src/data/galleryItems.test.ts
git commit -m "feat(showcase): add status/accentHex/screenshotSrc to gallery item data model"
```

---

## Task 2: Router — add `/gallery` index and `/process` routes

**Files:**
- Modify: `packages/showcase/src/router/useHashRoute.ts`
- Test: `packages/showcase/src/router/useHashRoute.test.ts`

**Interfaces:**
- Produces: `type Route = { name: 'home' } | { name: 'gallery-index' } | { name: 'gallery'; slug: string } | { name: 'process' } | { name: 'not-found' }`; `useHashRoute(): Route` (same hook name/signature).

- [ ] **Step 1: Write the failing test**

```ts
// packages/showcase/src/router/useHashRoute.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHashRoute } from './useHashRoute';

describe('useHashRoute', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('parses the empty hash as home', () => {
    window.location.hash = '';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'home' });
  });

  it('parses #/gallery as the gallery index', () => {
    window.location.hash = '#/gallery';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'gallery-index' });
  });

  it('parses #/gallery/monitoring as a gallery detail route', () => {
    window.location.hash = '#/gallery/monitoring';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'gallery', slug: 'monitoring' });
  });

  it('parses #/process as the process route', () => {
    window.location.hash = '#/process';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'process' });
  });

  it('parses an unknown hash as not-found', () => {
    window.location.hash = '#/nonsense';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toEqual({ name: 'not-found' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- useHashRoute`
Expected: FAIL — `#/gallery` currently parses as `{ name: 'home' }`, not `{ name: 'gallery-index' }`; `#/process` currently parses as `{ name: 'not-found' }`.

- [ ] **Step 3: Write the implementation**

```ts
// packages/showcase/src/router/useHashRoute.ts
import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'gallery-index' }
  | { name: 'gallery'; slug: string }
  | { name: 'process' }
  | { name: 'not-found' };

// Gallery slugs come from data (GALLERY_ITEMS), not a fixed union like
// monitoring's `ROUTES = [...] as const` — so this router parses a slug out
// of the hash instead of matching against a known tuple. Whether a slug is a
// real demo is validated where it's rendered (GalleryPage), not here.
function parseHash(hash: string): Route {
  const value = hash.replace(/^#\/?/, '');
  if (value === '') return { name: 'home' };
  if (value === 'gallery') return { name: 'gallery-index' };
  if (value.startsWith('gallery/')) {
    const slug = value.slice('gallery/'.length);
    return slug ? { name: 'gallery', slug } : { name: 'gallery-index' };
  }
  if (value === 'process') return { name: 'process' };
  return { name: 'not-found' };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- useHashRoute`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/showcase/src/router/useHashRoute.ts packages/showcase/src/router/useHashRoute.test.ts
git commit -m "feat(showcase): add gallery-index and process routes"
```

---

## Task 3: `Nav` component + `useScrolled` hook

**Files:**
- Create: `packages/showcase/src/hooks/useScrolled.ts`
- Create: `packages/showcase/src/components/Nav.tsx`
- Test: `packages/showcase/src/components/Nav.test.tsx`
- Modify: `packages/showcase/src/App.css` (new `.site-nav*` section)

**Interfaces:**
- Produces: `useScrolled(thresholdPx: number): boolean`; `Nav({ transparentUntilScroll?: boolean }): JSX.Element`, rendering a `<nav>` (role `navigation`) with links "Gallery" (`#/gallery`) and "How we design" (`#/process`), toggling class `site-nav-solid`.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/showcase/src/components/Nav.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Nav } from './Nav';

describe('Nav', () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('renders links to gallery and process', () => {
    render(<Nav />);
    expect(screen.getByRole('link', { name: 'Gallery' })).toHaveAttribute('href', '#/gallery');
    expect(screen.getByRole('link', { name: 'How we design' })).toHaveAttribute('href', '#/process');
  });

  it('is solid from the first paint when transparentUntilScroll is not set', () => {
    render(<Nav />);
    expect(screen.getByRole('navigation')).toHaveClass('site-nav-solid');
  });

  it('starts transparent over the hero and becomes solid once scrolled past it', () => {
    render(<Nav transparentUntilScroll />);
    const nav = screen.getByRole('navigation');
    expect(nav).not.toHaveClass('site-nav-solid');

    Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
    fireEvent.scroll(window);
    expect(nav).toHaveClass('site-nav-solid');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- Nav.test`
Expected: FAIL — `./Nav` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// packages/showcase/src/hooks/useScrolled.ts
import { useEffect, useState } from 'react';

/**
 * True once the page has scrolled past `thresholdPx`. Used by Nav to swap
 * from transparent-over-hero to a solid background — see Nav.tsx.
 */
export function useScrolled(thresholdPx: number): boolean {
  const [scrolled, setScrolled] = useState(() => window.scrollY > thresholdPx);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > thresholdPx);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [thresholdPx]);

  return scrolled;
}
```

```tsx
// packages/showcase/src/components/Nav.tsx
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
```

```css
/* packages/showcase/src/App.css — append */

/* ---- Site nav ---- */

.site-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem clamp(1.25rem, 4vw, 2rem);
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background-color 200ms ease-out, border-color 200ms ease-out;
}

.site-nav-solid {
  background: var(--color-base);
  border-bottom: 1px solid var(--color-border-default);
}

.site-nav-brand {
  color: var(--color-default);
  text-decoration: none;
  font-weight: 600;
}

.site-nav-links {
  display: flex;
  gap: 1.5rem;
}

.site-nav-links a {
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.9375rem;
}

.site-nav-links a:hover,
.site-nav-links a:focus-visible {
  color: var(--color-secondary);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- Nav.test`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/showcase/src/hooks/useScrolled.ts packages/showcase/src/components/Nav.tsx packages/showcase/src/components/Nav.test.tsx packages/showcase/src/App.css
git commit -m "feat(showcase): add sticky Nav component"
```

---

## Task 4: Wire `Nav` into `App.tsx`

**Files:**
- Modify: `packages/showcase/src/App.tsx`
- Modify: `packages/showcase/src/App.test.tsx`

**Interfaces:**
- Consumes: `Nav` from Task 3, `Route` from Task 2.
- Produces: `App` renders `<Nav transparentUntilScroll={route.name === 'home'} />` on every route, above `<main className="shell">`.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/showcase/src/App.test.tsx — add these tests to the existing describe block
it('renders the nav solid immediately on non-home routes (Review Focus #3)', () => {
  window.location.hash = '#/gallery/monitoring';
  render(<App />);
  expect(screen.getByRole('navigation')).toHaveClass('site-nav-solid');
});

it('renders the nav transparent over the hero on Home, until scrolled', () => {
  window.location.hash = '';
  render(<App />);
  expect(screen.getByRole('navigation')).not.toHaveClass('site-nav-solid');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- App.test`
Expected: FAIL — no `<nav>` in the current `App` output at all yet, so neither class assertion has anything to check against.

- [ ] **Step 3: Write the implementation**

```tsx
// packages/showcase/src/App.tsx
import { useHashRoute } from './router/useHashRoute';
import { HomePage } from './pages/HomePage';
import { GalleryPage } from './pages/GalleryPage';
import { Nav } from './components/Nav';
import './App.css';

export default function App() {
  const route = useHashRoute();

  return (
    <>
      <Nav transparentUntilScroll={route.name === 'home'} />
      <main className="shell">
        {route.name === 'gallery' ? (
          <GalleryPage slug={route.slug} />
        ) : (
          // v0: gallery-index, process, and not-found all fall back to
          // Home until their own pages land (Tasks 6 and 11).
          <HomePage />
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- App.test`
Expected: PASS (all `App.test.tsx` tests)

- [ ] **Step 5: Commit**

```bash
git add packages/showcase/src/App.tsx packages/showcase/src/App.test.tsx
git commit -m "feat(showcase): render Nav on every route, solid on non-home routes"
```

---

## Task 5: "Coming soon" fallback graphic + `DemoTile` component

**Files:**
- Create: `packages/showcase/src/assets/comingSoonFallback.ts`
- Create: `packages/showcase/src/components/DemoTile.tsx`
- Test: `packages/showcase/src/components/DemoTile.test.tsx`
- Modify: `packages/showcase/src/App.css` (new `.demo-tile*` section)

**Interfaces:**
- Consumes: `GalleryItem` from Task 1 (`data/galleryItems.ts`).
- Produces: `COMING_SOON_FALLBACK: string` (a `data:image/svg+xml` URI); `DemoTile({ item: GalleryItem; size: 'large' | 'small' }): JSX.Element`.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/showcase/src/components/DemoTile.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DemoTile } from './DemoTile';
import { getGalleryItem } from '../data/galleryItems';

describe('DemoTile', () => {
  it('renders a live demo as clickable with a Live badge', () => {
    const item = getGalleryItem('monitoring')!;
    render(<DemoTile item={item} size="large" />);
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View case study' })).toBeInTheDocument();
  });

  it('renders a coming-soon demo with no clickable or focusable affordance', () => {
    const item = getGalleryItem('agent-panel')!;
    render(<DemoTile item={item} size="small" />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it("points the image at the demo's own screenshot path, with the coming-soon graphic as fallback", () => {
    // Real 404-triggered fallback rendering only happens in a real browser
    // (happy-dom doesn't simulate image load failure) — see Review Focus #5
    // for the manual check this doesn't replace.
    const item = getGalleryItem('agent-panel')!;
    render(<DemoTile item={item} size="small" />);
    const img = screen.getByAltText('Agent Control Panel screenshot');
    expect(img).toHaveAttribute('src', './screenshots/agent-panel.png');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- DemoTile.test`
Expected: FAIL — `./DemoTile` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// packages/showcase/src/assets/comingSoonFallback.ts

/**
 * A neutral, dot-textured placeholder — no photo, no baked-in text (the
 * "Coming soon" label lives in the tile's own Badge, not the image). An
 * inline SVG data URI, so there's no external asset to source or license
 * — see design spec, Visual Direction, for why nothing on this site reaches
 * for a sourced/commissioned image.
 */
export const COMING_SOON_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">` +
      `<rect width="400" height="300" fill="#2d2d44" />` +
      `<pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">` +
      `<circle cx="2" cy="2" r="1.4" fill="#4a4a68" />` +
      `</pattern>` +
      `<rect width="400" height="300" fill="url(#dots)" />` +
      `</svg>`
  );
```

```tsx
// packages/showcase/src/components/DemoTile.tsx
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
  const accentStyle = live
    ? ({ '--color-accent': item.accentHex, '--color-secondary': item.accentHex } as CSSProperties)
    : undefined;

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
```

```css
/* packages/showcase/src/App.css — append */

/* ---- Demo tiles (Gallery index) ---- */

.demo-tile-image {
  width: 100%;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}

.demo-tile-tagline {
  margin: 0 0 1.25rem;
  color: var(--color-muted);
  line-height: 1.55;
}

.demo-tile-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.demo-tile-dimmed {
  opacity: 0.6;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- DemoTile.test`
Expected: PASS (3 tests)

- [ ] **Step 5: Manual check (Review Focus #5)**

Not automatable in `happy-dom` — start the dev server (`npm run dev`), navigate to a page rendering a `DemoTile` for a coming-soon slug (available once Task 6 wires `GalleryIndexPage`; a quick temporary render in `App.tsx` works too if checking before Task 6), and confirm in the browser that the 404'd screenshot path visibly falls back to the dot-pattern graphic, not a broken-image icon.

- [ ] **Step 6: Commit**

```bash
git add packages/showcase/src/assets/comingSoonFallback.ts packages/showcase/src/components/DemoTile.tsx packages/showcase/src/components/DemoTile.test.tsx packages/showcase/src/App.css
git commit -m "feat(showcase): add DemoTile with per-demo scoped accent and coming-soon fallback"
```

---

## Task 6: `GalleryIndexPage` + wire `/gallery` route

**Files:**
- Create: `packages/showcase/src/pages/GalleryIndexPage.tsx`
- Test: `packages/showcase/src/pages/GalleryIndexPage.test.tsx`
- Modify: `packages/showcase/src/App.tsx`
- Modify: `packages/showcase/src/App.test.tsx`
- Modify: `packages/showcase/src/App.css` (new `.gallery-index*` section; remove now-dead `.gallery-grid`/`.gallery-tile-*` rules — those belonged to the old Home-page grid this task's page replaces)

**Interfaces:**
- Consumes: `GALLERY_ITEMS` from Task 1, `DemoTile` from Task 5.
- Produces: `GalleryIndexPage(): JSX.Element`.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/showcase/src/pages/GalleryIndexPage.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GalleryIndexPage } from './GalleryIndexPage';
import { GALLERY_ITEMS } from '../data/galleryItems';

describe('GalleryIndexPage', () => {
  it('renders one tile per demo, live and coming-soon alike', () => {
    render(<GalleryIndexPage />);
    for (const item of GALLERY_ITEMS) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    }
  });

  it('shows exactly one Live badge and four Coming soon badges', () => {
    render(<GalleryIndexPage />);
    expect(screen.getAllByText('Live')).toHaveLength(1);
    expect(screen.getAllByText('Coming soon')).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- GalleryIndexPage`
Expected: FAIL — `./GalleryIndexPage` does not exist yet.

- [ ] **Step 3: Write the implementation**

```tsx
// packages/showcase/src/pages/GalleryIndexPage.tsx
import { GALLERY_ITEMS } from '../data/galleryItems';
import { DemoTile } from '../components/DemoTile';

export function GalleryIndexPage() {
  return (
    <div className="gallery-index">
      <h1>All demos</h1>
      <div className="gallery-index-grid">
        {GALLERY_ITEMS.map((item) => (
          <DemoTile key={item.slug} item={item} size={item.status === 'live' ? 'large' : 'small'} />
        ))}
      </div>
    </div>
  );
}
```

```tsx
// packages/showcase/src/App.tsx
import { useHashRoute } from './router/useHashRoute';
import { HomePage } from './pages/HomePage';
import { GalleryIndexPage } from './pages/GalleryIndexPage';
import { GalleryPage } from './pages/GalleryPage';
import { Nav } from './components/Nav';
import './App.css';

export default function App() {
  const route = useHashRoute();

  return (
    <>
      <Nav transparentUntilScroll={route.name === 'home'} />
      <main className="shell">
        {route.name === 'gallery' ? (
          <GalleryPage slug={route.slug} />
        ) : route.name === 'gallery-index' ? (
          <GalleryIndexPage />
        ) : (
          // v0: process and not-found fall back to Home until Task 11.
          <HomePage />
        )}
      </main>
    </>
  );
}
```

```tsx
// packages/showcase/src/App.test.tsx — add this test to the existing describe block
it('renders the gallery index for #/gallery', () => {
  window.location.hash = '#/gallery';
  render(<App />);
  expect(screen.getByRole('heading', { name: 'All demos' })).toBeInTheDocument();
});
```

```css
/* packages/showcase/src/App.css —
   1) append this new section
   2) DELETE the old ".gallery-grid", ".gallery-tile-tagline", and
      ".gallery-tile-footer" rules under the "/* ---- Home / hero ---- */"
      comment block — dead now that Home no longer renders a demo grid
      (see Task 9), replaced by .gallery-index-grid / .demo-tile-* below */

/* ---- Gallery index ---- */

.gallery-index {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.gallery-index-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  grid-auto-rows: min-content;
  gap: 1.25rem;
}

.demo-tile-large {
  grid-column: span 2;
}

@media (max-width: 640px) {
  .demo-tile-large {
    grid-column: span 1;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- GalleryIndexPage App.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/showcase/src/pages/GalleryIndexPage.tsx packages/showcase/src/pages/GalleryIndexPage.test.tsx packages/showcase/src/App.tsx packages/showcase/src/App.test.tsx packages/showcase/src/App.css
git commit -m "feat(showcase): add GalleryIndexPage with asymmetric live/coming-soon grid"
```

---

## Task 7: Update `GalleryPage` — back-link to `/gallery`, handle a not-yet-shipped slug

**Files:**
- Modify: `packages/showcase/src/pages/GalleryPage.tsx`
- Modify: `packages/showcase/src/pages/GalleryPage.test.tsx`

**Interfaces:**
- Consumes: `getGalleryItem`, `isLive` from Task 1.
- Produces: `GalleryPage` unchanged prop signature (`{ slug: string }`); adds a branch for an existing-but-not-live item.

- [ ] **Step 1: Write the failing tests**

```tsx
// packages/showcase/src/pages/GalleryPage.test.tsx — add to the existing describe block
it('links back to the gallery index, not home', () => {
  render(<GalleryPage slug="monitoring" />);
  expect(screen.getByRole('link', { name: 'All demos' })).toHaveAttribute('href', '#/gallery');
});

it('shows a not-yet-built message for a demo that exists but has not shipped', () => {
  render(<GalleryPage slug="agent-panel" />);
  expect(screen.getByText(/isn't built yet/)).toBeInTheDocument();
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- GalleryPage.test`
Expected: FAIL — back-link still points to `#/`; there's no not-yet-built branch, so `agent-panel` currently renders Preview/Code/Case Study tabs against a demo with no live preview.

- [ ] **Step 3: Write the implementation**

```tsx
// packages/showcase/src/pages/GalleryPage.tsx
import { useState } from 'react';
import { Badge, TabNavigation } from 'cyberui-2045';
import { getGalleryItem, isLive } from '../data/galleryItems';
import { CASE_STUDIES } from '../content/caseStudies';
import { CODE_SNIPPETS } from '../content/codeSnippets';
import { CaseStudy } from '../components/CaseStudy';
import { CodeViewer } from '../components/CodeViewer';

const TABS = ['Preview', 'Code', 'Case Study'] as const;
type Tab = (typeof TABS)[number];

export interface GalleryPageProps {
  slug: string;
}

export function GalleryPage({ slug }: GalleryPageProps) {
  const [tab, setTab] = useState<Tab>('Preview');
  const item = getGalleryItem(slug);

  if (!item) {
    return (
      <div className="gallery-page">
        <a className="back-link" href="#/gallery">
          All demos
        </a>
        <p>No demo named "{slug}" yet.</p>
      </div>
    );
  }

  if (!isLive(item)) {
    return (
      <div className="gallery-page">
        <a className="back-link" href="#/gallery">
          All demos
        </a>
        <h1>{item.name}</h1>
        <p>This demo isn't built yet — check back soon, or see what's live now.</p>
      </div>
    );
  }

  const caseStudy = CASE_STUDIES[item.slug];
  const snippets = CODE_SNIPPETS[item.slug] ?? [];

  return (
    <div className="gallery-page">
      <a className="back-link" href="#/gallery">
        All demos
      </a>

      <header className="gallery-page-header">
        <h1>{item.name}</h1>
        <Badge variant="secondary" size="sm">
          {item.accentLabel} accent
        </Badge>
      </header>
      <p className="gallery-page-tagline">{item.tagline}</p>

      <TabNavigation tabs={TABS} activeTab={tab} onTabChange={(next) => setTab(next as Tab)} />

      <div className="gallery-page-body">
        {tab === 'Preview' && (
          <div className="preview-frame">
            <iframe title={`${item.name} live preview`} src={item.livePreviewPath} />
          </div>
        )}
        {tab === 'Code' && <CodeViewer snippets={snippets} />}
        {tab === 'Case Study' && caseStudy && <CaseStudy content={caseStudy} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- GalleryPage.test`
Expected: PASS (all `GalleryPage.test.tsx` tests)

- [ ] **Step 5: Commit**

```bash
git add packages/showcase/src/pages/GalleryPage.tsx packages/showcase/src/pages/GalleryPage.test.tsx
git commit -m "fix(showcase): GalleryPage links to /gallery and handles not-yet-shipped demos"
```

---

## Task 8: `HeroScene` component (halftone glow, respects reduced motion)

**Files:**
- Create: `packages/showcase/src/hooks/usePrefersReducedMotion.ts`
- Create: `packages/showcase/src/components/HeroScene.tsx`
- Test: `packages/showcase/src/components/HeroScene.test.tsx`
- Modify: `packages/showcase/src/App.css` (new `.hero-scene*` section)

**Interfaces:**
- Produces: `usePrefersReducedMotion(): boolean`; `HeroScene(): JSX.Element` — an `aria-hidden` decorative SVG scene, class `hero-scene-animated` present only when motion is not reduced.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/showcase/src/components/HeroScene.test.tsx
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { HeroScene } from './HeroScene';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('HeroScene', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('animates the load-in when the user has no motion preference', () => {
    mockMatchMedia(false);
    const { container } = render(<HeroScene />);
    expect(container.querySelector('.hero-scene-animated')).toBeInTheDocument();
  });

  it('renders fully visible immediately when the user prefers reduced motion', () => {
    mockMatchMedia(true);
    const { container } = render(<HeroScene />);
    expect(container.querySelector('.hero-scene-animated')).not.toBeInTheDocument();
    expect(container.querySelector('.hero-scene')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- HeroScene.test`
Expected: FAIL — `./HeroScene` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// packages/showcase/src/hooks/usePrefersReducedMotion.ts
import { useEffect, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

```tsx
// packages/showcase/src/components/HeroScene.tsx
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
```

```css
/* packages/showcase/src/App.css — append */

/* ---- Hero scene (Home only) ---- */

.hero-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 1;
}

.hero-scene-halftone {
  width: 100%;
  height: 100%;
}

.hero-scene-animated {
  animation: hero-scene-develop 900ms ease-out;
}

@keyframes hero-scene-develop {
  from {
    opacity: 0;
    filter: blur(6px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- HeroScene.test`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/showcase/src/hooks/usePrefersReducedMotion.ts packages/showcase/src/components/HeroScene.tsx packages/showcase/src/components/HeroScene.test.tsx packages/showcase/src/App.css
git commit -m "feat(showcase): add halftone HeroScene, respecting prefers-reduced-motion"
```

---

## Task 9: Rewrite `HomePage`

**Files:**
- Modify: `packages/showcase/src/pages/HomePage.tsx`
- Modify: `packages/showcase/src/pages/HomePage.test.tsx`
- Modify: `packages/showcase/src/App.test.tsx` (update the "renders the home page by default" assertion — Home no longer lists demo names)
- Modify: `packages/showcase/src/App.css` (new `.hero-content`/`.home-intro`/`.home-features`/`.home-closing-cta` section)

**Interfaces:**
- Consumes: `HeroScene` (Task 8), `LiveReadout` (existing, unchanged).
- Produces: `HomePage(): JSX.Element` — hero (image-led) + intro/value-prop section + closing CTA. No per-demo content (that's `GalleryIndexPage`'s job now).

- [ ] **Step 1: Write the failing tests**

```tsx
// packages/showcase/src/pages/HomePage.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders the hero headline and CTAs into the gallery', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Real products,');
    expect(heading).toHaveTextContent('not a component playground.');
    const ctas = screen.getAllByRole('button', { name: 'View the gallery' });
    expect(ctas.length).toBeGreaterThanOrEqual(2); // hero CTA + closing CTA
  });

  it("does not list individual demos on Home — that's Gallery's job", () => {
    render(<HomePage />);
    expect(screen.queryByText('AI Product Monitoring')).not.toBeInTheDocument();
  });

  it('still shows the live-ticking readout as proof the hub itself is running', () => {
    render(<HomePage />);
    expect(screen.getByRole('status', { name: 'Example live metrics' })).toBeInTheDocument();
  });
});
```

```tsx
// packages/showcase/src/App.test.tsx — REPLACE the existing
// "renders the home page by default" test body with:
it('renders the home page by default', () => {
  window.location.hash = '';
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Real products,');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- HomePage.test App.test`
Expected: FAIL — current `HomePage` still renders the per-demo grid and only one CTA.

- [ ] **Step 3: Write the implementation**

```tsx
// packages/showcase/src/pages/HomePage.tsx
import { Button, GradientText } from 'cyberui-2045';
import { HeroScene } from '../components/HeroScene';
import { LiveReadout } from '../components/LiveReadout';

function goToGallery() {
  window.location.hash = '#/gallery';
}

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
        <p>One demo live today, four more on the way.</p>
        <Button variant="primary" onClick={goToGallery}>
          View the gallery
        </Button>
      </section>
    </div>
  );
}
```

```css
/* packages/showcase/src/App.css —
   1) REPLACE the entire "/* ---- Home / hero ---- */" section (down to,
      but not including, "/* ---- Gallery detail page ---- */") with the
      rules below — the old .hero-title/.hero-subtitle/.live-readout*
      rules assumed a plain-text hero; keep .live-readout* (still used,
      just relocated into .home-intro) and replace the rest */

/* ---- Home / hero ---- */

.home {
  display: flex;
  flex-direction: column;
  gap: clamp(2.5rem, 6vw, 4rem);
}

.hero {
  position: relative;
  min-height: min(70vh, 520px);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 8px;
  background: var(--color-base);
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.25rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  max-width: 40rem;
  background: linear-gradient(to top, var(--color-base) 20%, transparent 100%);
}

.hero-title {
  margin: 0;
  font-size: clamp(2.25rem, 5vw, 3.25rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.live-readout {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.live-readout-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-secondary);
  box-shadow: 0 0 8px var(--color-secondary);
  flex-shrink: 0;
}

.live-readout-value {
  color: var(--color-secondary);
  font-weight: 500;
}

.live-readout-divider {
  width: 1px;
  height: 0.875rem;
  background: var(--color-border-default);
}

.home-intro {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  max-width: 42rem;
}

.home-intro h2 {
  margin: 0;
  font-size: 1.5rem;
}

.home-intro p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
}

.home-features {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  color: var(--color-muted);
  line-height: 1.6;
}

.home-closing-cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.home-closing-cta p {
  margin: 0;
  color: var(--color-muted);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- HomePage.test App.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/showcase/src/pages/HomePage.tsx packages/showcase/src/pages/HomePage.test.tsx packages/showcase/src/App.test.tsx packages/showcase/src/App.css
git commit -m "feat(showcase): rewrite HomePage as an image-led pitch, remove per-demo grid"
```

---

## Task 10: Process content + `ProcessAct` (plain) + `ProcessActTwo` (glowing Timeline)

**Files:**
- Create: `packages/showcase/src/content/processStages.ts`
- Create: `packages/showcase/src/components/ProcessAct.tsx`
- Create: `packages/showcase/src/components/ProcessActTwo.tsx`
- Create: `packages/showcase/src/hooks/useRevealOnScroll.ts`
- Modify: `packages/showcase/src/App.css` (new `.process-act*` section)

**Interfaces:**
- Consumes: `usePrefersReducedMotion` from Task 8.
- Produces: `interface ProcessStage { title: string; time: string; description: string }`; `ACT_1: ProcessStage[]`, `ACT_2: ProcessStage[]`, `ACT_3: ProcessStage[]`; `ProcessAct({ title, lede, stages }: { title: string; lede: string; stages: ProcessStage[] }): JSX.Element`; `ProcessActTwo(): JSX.Element`; `useRevealOnScroll<T extends HTMLElement>(): { ref: RefObject<T | null>; visible: boolean }`.

No test file for this task in isolation — `ProcessAct`/`ProcessActTwo`/`useRevealOnScroll` are exercised through `ProcessPage` in Task 11, where the full page's behavior (including the reduced-motion and already-in-viewport cases from Review Focus #2) is easier to assert than through three separate shallow-render tests that would just duplicate each other. This is a deliberate exception to "every task has its own test" — the three pieces have no independently meaningful behavior apart from how `ProcessPage` composes them.

- [ ] **Step 1: Write the content and components**

```ts
// packages/showcase/src/content/processStages.ts
export interface ProcessStage {
  title: string;
  time: string;
  description: string;
}

export const ACT_1: ProcessStage[] = [
  {
    title: 'Discovery',
    time: 'Stage 1',
    description: 'Who is actually stuck, and on what — before anyone opens a design tool.',
  },
  {
    title: 'Research',
    time: 'Stage 2',
    description:
      "Talking to the people who'd use it, and to the data already sitting in support tickets and logs.",
  },
  {
    title: 'Information Architecture',
    time: 'Stage 3',
    description: 'What the product even contains, and how its pieces relate — before a single screen is drawn.',
  },
  {
    title: 'Wireframe',
    time: 'Stage 4',
    description: 'Where things sit on the page, argued in boxes and arrows before anyone picks a color.',
  },
];

export const ACT_2: ProcessStage[] = [
  {
    title: 'Visual Direction',
    time: 'Stage 5',
    description: "cyberui-2045's tokens set color, type, and glow in one place — swap the accent hue, the whole app re-themes.",
  },
  {
    title: 'Design System',
    time: 'Stage 6',
    description: '30+ production components with consistent variants, so "what should a danger button look like" is already answered.',
  },
  {
    title: 'High-Fidelity',
    time: 'Stage 7',
    description: 'The components you drop in are already the finished pixels — no separate polish pass to translate a mockup into code.',
  },
  {
    title: 'Motion & Interaction',
    time: 'Stage 8',
    description: 'Hover, focus, and glow states ship built into every component, not hand-rolled per project.',
  },
];

export const ACT_3: ProcessStage[] = [
  {
    title: 'Prototype & Testing',
    time: 'Stage 9',
    description: "Does it actually work for someone who isn't you? No library answers that for you.",
  },
  {
    title: 'Handoff',
    time: 'Stage 10',
    description:
      "The code you shipped already is the handoff — there's no separate spec to translate, because cyberui-2045 components are the real thing.",
  },
];
```

```tsx
// packages/showcase/src/components/ProcessAct.tsx
import type { ProcessStage } from '../content/processStages';

export interface ProcessActProps {
  title: string;
  lede: string;
  stages: ProcessStage[];
}

/**
 * Plain, unglowing list — deliberately NOT cyberui's Timeline component.
 * These stages are ones the library has no part in, and the page's
 * honesty requirement extends to its own construction: the stage that
 * gets the library's fancy glowing component is the one the library
 * actually does. See ProcessActTwo for that one, and design spec,
 * Visual Direction, for why the distinction matters.
 */
export function ProcessAct({ title, lede, stages }: ProcessActProps) {
  return (
    <section className="process-act process-act-plain">
      <h2>{title}</h2>
      <p className="process-act-lede">{lede}</p>
      <ol className="process-act-stages">
        {stages.map((stage) => (
          <li key={stage.title}>
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

```tsx
// packages/showcase/src/components/ProcessActTwo.tsx
import { Timeline } from 'cyberui-2045';
import { ACT_2 } from '../content/processStages';

export function ProcessActTwo() {
  const events = ACT_2.map((stage) => ({
    title: stage.title,
    time: stage.time,
    description: stage.description,
    status: 'info' as const,
  }));

  return (
    <section className="process-act process-act-glow">
      <h2>Where cyberui-2045 takes over</h2>
      <p className="process-act-lede">The four stages this library actually exists to accelerate.</p>
      <Timeline events={events} />
    </section>
  );
}
```

```ts
// packages/showcase/src/hooks/useRevealOnScroll.ts
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
      ([entry]) => {
        if (entry.isIntersecting) {
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
```

```css
/* packages/showcase/src/App.css — append */

/* ---- Process page ---- */

.process-page {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.process-intro {
  max-width: 60ch;
  color: var(--color-muted);
  line-height: 1.6;
}

.process-reveal {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 500ms ease-out, transform 500ms ease-out;
}

.process-reveal-visible {
  opacity: 1;
  transform: translateY(0);
}

.process-act h2 {
  margin: 0 0 0.5rem;
  font-size: 1.375rem;
}

.process-act-lede {
  margin: 0 0 1.5rem;
  color: var(--color-muted);
  max-width: 60ch;
}

.process-act-plain .process-act-stages {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.process-act-plain .process-act-stages h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-default);
}

.process-act-plain .process-act-stages p {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.55;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/showcase/src/content/processStages.ts packages/showcase/src/components/ProcessAct.tsx packages/showcase/src/components/ProcessActTwo.tsx packages/showcase/src/hooks/useRevealOnScroll.ts packages/showcase/src/App.css
git commit -m "feat(showcase): add process-stage content and plain/glowing act renderers"
```

---

## Task 11: `ProcessPage` + wire `/process` route

**Files:**
- Create: `packages/showcase/src/pages/ProcessPage.tsx`
- Test: `packages/showcase/src/pages/ProcessPage.test.tsx`
- Modify: `packages/showcase/src/App.tsx`
- Modify: `packages/showcase/src/App.test.tsx`

**Interfaces:**
- Consumes: `ProcessAct`, `ProcessActTwo`, `useRevealOnScroll`, `ACT_1`/`ACT_3` from Task 10.
- Produces: `ProcessPage(): JSX.Element`.

- [ ] **Step 1: Write the failing tests**

```tsx
// packages/showcase/src/pages/ProcessPage.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessPage } from './ProcessPage';

beforeEach(() => {
  // happy-dom doesn't implement IntersectionObserver; this stub reports
  // every observed element as immediately visible, matching real-browser
  // behavior for content already in the viewport when observe() runs —
  // see Review Focus #2 and useRevealOnScroll's own comment.
  class StubIntersectionObserver {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    }
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', StubIntersectionObserver);
});

describe('ProcessPage', () => {
  it('renders all three acts with their stage titles', () => {
    render(<ProcessPage />);
    expect(screen.getByRole('heading', { name: 'Before the pixels' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Where cyberui-2045 takes over' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Proving it's real" })).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    expect(screen.getByText('Visual Direction')).toBeInTheDocument();
    expect(screen.getByText('Handoff')).toBeInTheDocument();
  });

  it('is honest that cyberui-2045 only covers four of the ten stages', () => {
    render(<ProcessPage />);
    expect(screen.getByText(/only helps with four of them/)).toBeInTheDocument();
  });
});
```

```tsx
// packages/showcase/src/App.test.tsx — add to the existing describe block
it('renders the process page for #/process', () => {
  window.location.hash = '#/process';
  render(<App />);
  expect(screen.getByRole('heading', { name: 'How we design' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- ProcessPage.test App.test`
Expected: FAIL — `./ProcessPage` does not exist yet; `#/process` still falls back to Home.

- [ ] **Step 3: Write the implementation**

```tsx
// packages/showcase/src/pages/ProcessPage.tsx
import { ProcessAct } from '../components/ProcessAct';
import { ProcessActTwo } from '../components/ProcessActTwo';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { ACT_1, ACT_3 } from '../content/processStages';

function useReveal() {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();
  return { ref, className: `process-reveal${visible ? ' process-reveal-visible' : ''}` };
}

export function ProcessPage() {
  const act1 = useReveal();
  const act2 = useReveal();
  const act3 = useReveal();

  return (
    <div className="process-page">
      <h1>How we design</h1>
      <p className="process-intro">
        Ten stages go into a real product. cyberui-2045 only helps with four of them — here's
        honestly which ones.
      </p>

      <div ref={act1.ref} className={act1.className}>
        <ProcessAct
          title="Before the pixels"
          lede="Entirely on your team. No library does this for you."
          stages={ACT_1}
        />
      </div>

      <div ref={act2.ref} className={act2.className}>
        <ProcessActTwo />
      </div>

      <div ref={act3.ref} className={act3.className}>
        <ProcessAct
          title="Proving it's real"
          lede="Back to your team for testing. Handoff barely exists — the code you shipped already is the handoff."
          stages={ACT_3}
        />
      </div>
    </div>
  );
}
```

```tsx
// packages/showcase/src/App.tsx
import { useHashRoute } from './router/useHashRoute';
import { HomePage } from './pages/HomePage';
import { GalleryIndexPage } from './pages/GalleryIndexPage';
import { GalleryPage } from './pages/GalleryPage';
import { ProcessPage } from './pages/ProcessPage';
import { Nav } from './components/Nav';
import './App.css';

export default function App() {
  const route = useHashRoute();

  return (
    <>
      <Nav transparentUntilScroll={route.name === 'home'} />
      <main className="shell">
        {route.name === 'gallery' ? (
          <GalleryPage slug={route.slug} />
        ) : route.name === 'gallery-index' ? (
          <GalleryIndexPage />
        ) : route.name === 'process' ? (
          <ProcessPage />
        ) : (
          // v0: an unrecognized hash falls back to Home.
          <HomePage />
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- ProcessPage.test App.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/showcase/src/pages/ProcessPage.tsx packages/showcase/src/pages/ProcessPage.test.tsx packages/showcase/src/App.tsx packages/showcase/src/App.test.tsx
git commit -m "feat(showcase): add ProcessPage as a three-act narrative, wire /process route"
```

---

## Task 12: Capture and commit the monitoring demo's screenshot

**Files:**
- Create: `packages/showcase/public/screenshots/monitoring.png` (binary asset)

Not a TDD task — this replaces a currently-404ing `screenshotSrc` (from Task 1) with the real file, which is exactly the "promote a demo with zero code change" mechanism the data model was built for. No source or test file changes.

- [ ] **Step 1: Populate the local live build**

```bash
cd packages/showcase
npm run sync-demos
```
Expected: `public/live/monitoring/index.html` exists (builds `packages/monitoring` and copies its `dist/` in).

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```
Expected: serving on `http://localhost:5173` (or the next free port — check the terminal output).

- [ ] **Step 3: Capture the screenshot**

From a scratch directory outside the repo (this is a one-off local tool run, not a project dependency — see Global Constraints):

```bash
mkdir -p /tmp/shot && cd /tmp/shot
npm init -y
npm install playwright@1.63.0
npx playwright install chromium
```

```js
// /tmp/shot/capture.mjs
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:5173/live/monitoring/index.html');
await page.waitForTimeout(800);
await page.screenshot({ path: 'monitoring.png' });
await browser.close();
```

```bash
node /tmp/shot/capture.mjs
```

- [ ] **Step 4: Move the screenshot into the repo and verify it renders**

```bash
mkdir -p packages/showcase/public/screenshots
mv /tmp/shot/monitoring.png packages/showcase/public/screenshots/monitoring.png
```

With the dev server still running, open `http://localhost:5173/#/gallery` in a browser and confirm the large tile shows the real dashboard screenshot (not the dot-pattern fallback).

- [ ] **Step 5: Commit**

```bash
git add packages/showcase/public/screenshots/monitoring.png
git commit -m "chore(showcase): add monitoring demo screenshot"
```

---

## Final verification

- [ ] Run the full suite: `cd packages/showcase && npm run test` — all tests pass.
- [ ] Run the typecheck + build: `npm run build` — no TypeScript errors.
- [ ] Manually re-run Review Focus #5 (coming-soon fallback) and #3 (nav solid on `/gallery`, `/gallery/:slug`, `/process`) against the running dev server — these aren't fully covered by `happy-dom`.
