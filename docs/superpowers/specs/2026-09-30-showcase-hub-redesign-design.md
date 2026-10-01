# Showcase Hub Redesign — Design Notes (in progress)

**Date:** 2026-09-30
**Status:** Brainstorming in progress — captured incrementally, not yet a final approved spec
**Builds on:** [2026-09-27-cyberui-showcase-design.md](2026-09-27-cyberui-showcase-design.md) (original architecture — routes, iframe isolation, self-contained packages, demo-first build order — all still holds; this doc covers a redesign of the *hub's* IA and visual design, not a rebuild)

> **Naming amendment (2026-10-01):** "Gallery" was renamed **Templates** after this spec was written, because the audience is people building with AI who want a starting point to fork, not a portfolio to browse. Routes are now `/templates` and `/templates/:slug`, the nav item reads "Templates", and the code uses `TemplatesIndexPage`, `TemplatePage`, `TemplateTile` and `TEMPLATES`. The body below keeps the original wording as a record of the design process; read "Gallery" as "Templates". The repo was also renamed `cyberui-showcase` -> `cyberui-templates`, and `packages/showcase` -> `packages/site`.

> **Process page amendment (2026-10-01):** the `/process` page was redesigned after this spec was written, and no longer uses cyberui's `Timeline` component (its `description` is string-only and it has no neutral status; see patrickkuei/CyberUI#60). Each stage now carries a real artifact from this repo and an owner tag. See [2026-10-01-process-page-design.md](2026-10-01-process-page-design.md). The "Process (`/process`)" and "Process page" bullets below describe the original design and are kept as a record.

## Why this redesign

The original spec deliberately deferred "detailed page layout/visual design" as out of scope. With demo #1 (monitoring) shipped, the actual hub build has two problems worth fixing before demos 2-5 repeat them:

1. The home page desktop layout breaks with only 1 of 5 planned demos live — a single card in an `auto-fit` grid reads as unfinished, not minimal (see screenshot review at start of this conversation).
2. Component variant usage lacks restraint — `Card variant="accent"` (which hardcodes `border-accent`, i.e. the library's raw, unthemed yellow `--color-accent`) is applied to every gallery tile instead of one deliberate moment, undercutting the "spend your boldness in one place" principle and clashing with the demo's own cyan identity.

Separately, the user wants the showcase to document a real 10-stage product design process (Discovery → Research → IA → Wireframe → Visual Direction → Design System → High-Fidelity → Motion & Interaction → Prototype & Testing → Handoff), honestly marking which stages cyberui-2045 itself helps with, as its own content — both because it's a differentiator for the target audience and because the showcase's own redesign should visibly follow that same process.

## Decisions locked so far

- **Process content scope:** one standalone `/process` page explaining the 10-stage framework and cyberui-2045's honest role in it — not a per-demo treatment. Framing is **honest, not promotional**: stages the library doesn't touch (Discovery, Research, IA, Wireframe, Prototype & Testing) are shown as such, not glossed over. Matches this repo's existing honesty standard (see `packages/monitoring/README.md` precedent).
- **Per-demo case studies stay in their current format** (problem → decisions → takeaways) but should more clearly separate two things `caseStudies.ts` currently blends: *what problem the fictional product/demo solves* vs. *what cyberui-2045 specifically contributed*. Apply when case study copy is next touched — not an architectural change, a content-quality note for whoever writes demo #2's case study.
- **IA:** three top-level routes — `/` (Home, pure pitch), `/gallery` (index, all demos), `/gallery/:slug` (existing per-demo detail page, unchanged), `/process` (new). A **persistent, sticky nav** appears on every page: `[cyberui-2045 showcase]  Gallery  How we design`.
- **Gallery roadmap treatment:** show all 5 demos now, not just the 1 shipped. Shipped demos get a large tile; "coming soon" demos get small, dimmed, non-clickable tiles with a "Coming soon" badge instead of "Live". This turns current sparseness into a visible roadmap and scales without a relayout as more demos ship (rule stays "live = large, upcoming = small").
- **Hub token identity:** no override — hub chrome (nav, borders, home page) stays on cyberui's neutral defaults. Bold per-demo accent hues live only inside each demo's own card/detail page/iframe, so the hub never competes visually with the demo it's presenting. (The specific places color is allowed to break neutrality are enumerated in Visual Direction/Motion below, not here.)
- **Thumbnails:** use the library's `Image` component for Gallery grid tiles, `preview=false` since click already means "navigate," not "expand." Not `Carousel` — no demo needs multiple images yet. (Superseded by Visual Direction below: Home's hero is a procedural halftone scene, not a screenshot, so `Image` is never used there.)
- **"Coming soon" placeholder pattern:** point `Image`'s `src` at the path the real screenshot will eventually live at (e.g. `/screenshots/agent-panel.png`), which 404s today; `fallback` renders a generic "coming soon" graphic. When the real file is committed later, it starts resolving automatically — zero code change to "promote" a demo from placeholder to real. (Same spirit as the existing `ROUTES as const` / `Record<Route, ...>` pattern: make the missing thing fail gracefully instead of needing a manual toggle.)
- **Screenshots vs. live iframes:** static screenshots (via `Image`) on Home and Gallery; live `<iframe>` stays reserved for the demo detail page's Preview tab only (per original spec's per-demo token isolation reasoning — also avoids loading N live iframes on one grid page).
- **Copy** (headline "Real products, not a component playground," process-page stage copy, feature-highlight text): flagged for revision but deliberately deferred — write at implementation time, polish after the structure is built, not before.
- **Visual polish generally:** agreed to stay directional in this doc and refine hands-on once the redesign is actually running, rather than pin exact colors/imagery/motion timing now.

## Information Architecture

```
/              Home — pure pitch: hero (image-led) + intro/value-prop + closing CTA
/gallery       Gallery index — bento-style grid, all 5 demos (1 live, 4 coming soon)
/gallery/:slug Existing demo detail page (Preview / Code / Case Study tabs) — unchanged
/process       "How we design" — 10-stage framework as a 3-act narrative (new)

Nav (new, persistent/sticky on every page):
  [cyberui-2045 showcase]        Gallery   How we design
```

## Wireframe

### Home

```
┌───────────────────────────────────────────────────┐
│ [nav — sticky]                                     │
│  ┌───────────────────────────────────────────┐    │
│  │  [ halftone/screentone glow scene —         │    │
│  │    see Visual Direction — not a screenshot] │    │
│  │  headline (copy TBD)                        │    │
│  │  [ VIEW THE GALLERY ] ← one loud CTA        │    │
│  └───────────────────────────────────────────┘    │
│  ─── What cyberui-2045 actually is ───────────────│
│  1-2 sentence positioning + quiet, text-led        │
│  feature highlights (tokens/theming, component     │
│  count, dark-mode-native, accessible by default)   │
│  — not a SaaS-card grid.                           │
│  ─── closing CTA ──────────────────────────────────│
│  "One demo live, four more coming." [ VIEW GALLERY]│
└───────────────────────────────────────────────────┘
```
No demo teaser/spotlight on Home — Home's job is the pitch, Gallery's job is the proof. Reaching Gallery is covered three ways: sticky nav, hero CTA, closing CTA — no need to duplicate demo content to compensate.

### Gallery (`/gallery`)

```
[nav — sticky]
All demos

┌─────────────────────────────┐  ┌───────────┐
│ [large image]                │  │[sm image] │
│ AI Product Monitoring        │  │Agent Panel│
│ tagline · Live · cyan        │  │Coming soon│
│ [ View case study ]          │  └───────────┘
└─────────────────────────────┘  ┌───────────┐
                                  │[sm image] │
                                  │Landing    │
                                  │Coming soon│
                                  └───────────┘
(Mobile, Social continue as more small tiles)
```
Tiles show only screenshot + name + one-line tagline + status badge. All depth (Preview/Code/Case Study) stays on the detail page — Gallery is an index, never a second place content lives.

### Process (`/process`)

Narrative in three acts using cyberui's `Timeline` component (vertical event history — built for this), not a flat 10-row table. Revealed progressively (scroll), not dumped at once.

```
Act 1 — Before the pixels
  Discovery → Research → Information Architecture → Wireframe
  "Entirely on your team. No library does this for you."

Act 2 — Where cyberui-2045 takes over
  Visual Direction → Design System → High-Fidelity → Motion & Interaction
  "The four stages this library actually exists to accelerate."

Act 3 — Proving it's real
  Prototype & Testing → Handoff
  "Back to your team for testing. Handoff barely exists — the code
  you shipped already *is* the handoff."
```
Each stage gets 1-2 sentences of story copy (written at implementation time).

## Visual Direction

Kept directional — exact values tuned once it's running, not pinned here.

- **Color discipline:** hub chrome (nav, page background, gallery tile borders/text) stays on cyberui's neutral defaults (`--color-base`, `--color-surface`, `--color-border-default`, `--color-muted`) — unchanged from today. Exactly three places carry **persistent** (always-on) color — nowhere else breaks neutrality:
  1. **Home hero** — shows real color (see below). This is proof-adjacent content, not hub chrome, so it's exempt from the "neutral hub" rule.
  2. **`/process` Act 2** — Timeline markers for Visual Direction / Design System / High-Fidelity / Motion & Interaction get a cyan glow; Act 1 and Act 3 stay neutral. The color encodes meaning (this is the library's part of the story), it isn't decoration.
  3. **Gallery's one live tile** — a permanent glow/border, scoped to that demo's own accent hue. Originally speced as hover-only ("not persistent, tile looks neutral at rest"); revised during implementation once it turned out `Card variant="accent"` glows permanently by the library's own CSS, not on hover — and the persistent version reads better in practice: it makes the one real demo visually obvious at a glance against four coming-soon tiles, instead of only to a visitor who happens to hover. See the implementation plan's final-review ruling (2026-09-30).
- **Hero treatment — halftone/screentone glow, not a literal screenshot or a plain neon-glow-on-dark gradient.** A radial accent-colored glow behind the headline that dithers into visible halftone dots at its edges (the "gradient reproduced as print dots" look), rather than a smooth CSS blur. Rejected alternatives and why:
  - A real demo screenshot as the hero — redundant with Gallery, and undersells the hero's actual job (mood/identity, not proof — proof comes seconds later in Gallery).
  - A commissioned/sourced static illustration or a designed logo mark — real asset-production cost with no existing brand mark to build from; inconsistent with this being a solo-maintainer, no-deadline project (same reasoning that ruled out the AI-remix feature in the original spec).
  - A plain grid-horizon + glow scene — closer to the generic "dark mode + one accent glow" AI-design cliché than the halftone approach; halftone/screentone is a concrete, referenceable cyberpunk-manga vernacular detail (Akira/Ghost in the Shell-era print aesthetic), not generic decoration.
  - Headline sits in/over the glow using cyberui's own `GradientText`/`SectionTitle` components — gives a logo-like treatment without needing a designed logo asset.
- **Type:** no change — IBM Plex Sans/Mono stays; it already reads cleanly (confirmed via the screenshots taken during the initial page review), and a third typeface would be decoration without a reason.
- **Principle governing this whole pass:** spend the neon once per page, and only where it means something. Home spends it on the hero. `/process` spends it on Act 2. Gallery spends it on the one actionable tile (see Motion below). Nothing else glows.

## Motion & Interaction

Same "spend it once, and only where it means something" principle applied to motion — avoids the generic tell of fade-slide-up entrances on every section and hover glow on every card.

- **Home hero — the one orchestrated load-in on the page.** The halftone glow resolves/develops into focus on load (dots settling, like a print or photo resolving — thematically consistent with the halftone technique itself); headline appears once it settles. Intro section and closing CTA have zero entrance motion.
- **Nav — functional, not decorative.** Transparent/blended over the hero image, gains a solid background + bottom border once scrolled past it. Exists for legibility against two different backgrounds, not for flair.
- **Process timeline — scroll-reveal, because it IS the storytelling mechanism**, not decoration on top of one. Stages appear as each act is scrolled into view. This is motion answering the user's own action (scrolling), which is on firmer ground than an autoplay entrance per the frontend-design skill's guidance.
- **Gallery — persistent glow reserved for the one actionable tile** (revised from hover-only, see Visual Direction above). The large "live" tile's glow is scoped to *that demo's own accent hue* (already tracked as `accentLabel` per demo in `galleryItems.ts`) via a local `--color-accent` override on that tile — not the hub's raw default yellow, which is the root cause of the original "every card glows yellow" bug. Small "coming soon" tiles scope `--color-accent` to a neutral token instead (fixing the same library-default-leak bug class in `Image`'s own inherent border) and stay otherwise inert: no hover motion, since implying interactivity there would be misleading.
- **Accessibility baseline:** both the hero load-in and the timeline scroll-reveal respect `prefers-reduced-motion` — content still renders, just without the animated transition.

## Design System notes

Component/variant decisions consolidated from the sections above — no new components needed from cyberui-2045 itself, but two new showcase-local pieces:

- **New: sticky site nav** — not a cyberui component (none exists in the library's manifest for this); a small custom component local to the showcase package, transparent-over-hero → solid-on-scroll per Motion above.
- **New: hero scene** — custom CSS/SVG halftone glow, local to the showcase package (Home only).
- **Gallery grid:** CSS grid, asymmetric (large tile for shipped demos, small tiles for "coming soon"), not a component from the library — plain layout CSS.
- **Gallery tiles:** `Card variant="accent"` for the one large/live tile (scoped to its own demo accent hue, see Motion), `Card variant="default"` or `"small"` for "coming soon" tiles (no glow, dimmed via opacity). `Image` component for all thumbnails — `preview=false` in the grid (click already means "navigate"), `preview=true` reserved for the demo detail page. `Image`'s `fallback` prop handles the "coming soon" case: `src` points at the real screenshot's eventual path (404s today), `fallback` renders a generic placeholder — promoting a demo from placeholder to real screenshot later needs zero code change.
- **Process page:** cyberui's `Timeline` component, three acts, Act 2 gets the cyan glow treatment described in Visual Direction; scroll-reveal per Motion.
- **Unchanged:** demo detail page (`Preview`/`Code`/`Case Study` tabs via `TabNavigation`), iframe isolation for live previews, `CodeViewer`/`CaseStudy` components — none of this redesign touches them.

## Prototype & Testing / Handoff

Honestly scaled to project size — this is also a nice consistency check against `/process`'s own claim that these stages are "on your team, not the library":

- **Prototype & Testing:** the iterative wireframe/visual-direction discussion in this doc *is* the prototype pass for a project this size — no separate mockup tool or user-testing round planned. Verification happens by building it and screenshot-reviewing against this doc (the same method used to diagnose the original page's problems at the start of this conversation). Existing component tests (`App.test.tsx`, `HomePage.test.tsx`, `GalleryPage.test.tsx`) get updated/extended for the new routes and components during implementation — an implementation-plan concern, not a design decision captured here.
- **Handoff:** this spec, plus the implementation plan it produces via `writing-plans`, is the handoff — no separate handoff artifact.

## Status

Design agreed section-by-section with the user (IA → Wireframe → Visual Direction → Motion & Interaction). Ready for spec self-review, then user review of this file, then `writing-plans`.
