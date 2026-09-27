# CyberUI Showcase — Design Spec

**Date:** 2026-09-27
**Status:** Approved (conversational design) — pending written-spec review
**Tracking issue:** patrickkuei/cyberui-showcase#1

## Problem

cyberui-2045's current GitHub Pages presence (Storybook + demo app) shows components in isolation. It doesn't answer the question a prospective user actually has: *"what can I build with this, and does it look good as a real product?"*

## Audience & Goal

Broad, non-technical-friendly audience: "vibe coders" (may or may not code), PMs/leads evaluating the library, and anyone who wants a cool, futuristic UI and is deciding whether cyberui-2045 gets them there. The goal is not developer documentation — it's inspiration + proof, with a low-friction path to "go build this."

## Selected Approach

**Content strategy:** Ship real, polished example applications (not component demos) covering four use cases, in priority order:

1. **AI SaaS dashboard** (flagship — build first)
2. Landing page / marketing site
3. Mobile-first app
4. Community / social interface

**Build order — demo-first:** Build and ship the dashboard demo completely before investing in showcase polish. Add a minimal hub linking to it. Repeat for each subsequent demo, growing the showcase incrementally. This was chosen over building the full showcase site upfront (landing, guides, case-study templates) and filling it in afterward — that alternative gives a more complete-feeling launch but delays shipping anything real by weeks and risks designing guides around demos that don't exist yet.

**Presentation style — embedded, not a live code editor:** Each demo gets a showcase page combining three things in one view: a live working preview, a read-only code view, and an inline case study (design/technical rationale). Two more-interactive alternatives were considered and rejected for the initial launch: a live in-browser code editor (StackBlitz/CodeSandbox-style, where visitors edit and re-run code), and an AI prompt box that generates custom design variations on demand. Both were rejected because the target audience (see Audience & Goal) cares about seeing a polished result, not editing code, and the AI option has an ongoing API cost with no revenue yet to fund it. Revisit the AI option once there's revenue to support it.

## Repository Structure

Single monorepo (this repo):

```
cyberui-showcase/
├── packages/
│   ├── showcase/       # Main showcase site (landing, gallery, per-demo pages)
│   ├── dashboard/       # AI SaaS dashboard demo — self-contained
│   ├── landing/         # Marketing landing page demo — self-contained
│   ├── mobile/          # Mobile-first app demo — self-contained
│   └── social/          # Community/social demo — self-contained
├── package.json         # pnpm workspace root
├── tsconfig.json         # shared base config (referenced, not imported at runtime)
└── README.md
```

**Why monorepo:** Solo maintainer, no deadline, 4-5 packages total — well under the threshold where monorepo friction (clone/build time, navigation) becomes a problem. Single CI/CD, single version, demos stay easy to keep in sync with cyberui-2045 releases.

**Why each demo package must be self-contained:** Each `packages/{dashboard,landing,mobile,social}` has its own `package.json` (cyberui-2045 as a normal npm dependency — not a workspace symlink) and imports nothing from a shared runtime layer. This means the folder is already a valid standalone project. Users extract just one demo via:

```bash
npx tiged patrickkuei/cyberui-showcase/packages/dashboard my-dashboard
cd my-dashboard && npm install && npm run dev
```

No cloning the whole monorepo, no workspace tooling leaking into the user's project. This mirrors the pattern used by `create-next-app --example` and MUI's template gallery.

**Naming:** Packages drop the redundant "demo-" prefix (`packages/dashboard`, not `packages/demo-dashboard`) since everything under `packages/` other than `showcase` is implicitly a demo. Showcase routes use `/gallery/*` (not `/demos/*`) to avoid an echo with the package names.

## Showcase Site

Routes: `/`, `/gallery/dashboard`, `/gallery/landing`, `/gallery/mobile`, `/gallery/social`.

Each `/gallery/*` page shows:
- A **live preview** via `<iframe>` pointing at that demo's separately-deployed static build (not rendered inline in the showcase's own React tree)
- A **code tab** with read-only key snippets
- An **inline case study** (Markdown/MDX: problem, design decisions, key snippet, takeaways) — no custom CMS, just content files per demo

**Why iframe, not inline rendering:** Each demo defines its own cyberui `@theme` token values (see theming below). Rendering demos inline in the showcase's own DOM would collide those token sets against each other and against the showcase's own theme. An iframe gives each demo its own document/CSSOM for free — the showcase doesn't need `postMessage` since it's just displaying, not communicating.

Detailed page layout/visual design is deliberately deferred — not part of this architectural spec.

## Theming

All four demos share cyberui-2045's core dark/neon cyberpunk visual language — that consistency is the actual product differentiator, not a limitation to engineer around. Each demo varies only its **accent hue** (e.g., cyan for dashboard, magenta for social) by overriding the same token names with different values. This casually demonstrates the token system is swappable without turning the showcase into a "look how themeable we are" pitch, which is not cyberui-2045's differentiator.

## Dependency & Versioning

- Each demo package depends on the **published npm version** of `cyberui-2045`, not a local workspace link. The showcase's job is to prove what a real `npm install cyberui-2045` gets you — a workspace link would show something users can't reproduce and could drift silently from what's published. Bump each demo's dependency deliberately when you want it to pick up new cyberui features.
- The `cyberui-showcase` monorepo has its **own independent version**, unrelated to cyberui-2045's version.

## Hosting & CI/CD

- **Host:** GitHub Pages (consistent with cyberui-2045's existing Storybook/demo-app hosting).
- **Pipeline:** One combined GitHub Actions workflow, triggered on push to `main`:
  1. Build `showcase` and all 4 demo packages.
  2. Copy each demo's static build output into `showcase/dist/live/<name>/`.
  3. Deploy the combined `showcase/dist/` as a single GitHub Pages artifact.
- **Why one workflow, not five:** At solo/small scale, splitting into per-package workflows adds deploy-ordering and partial-failure coordination with no real benefit.

## Explicitly Out of Scope for the Initial Launch

- Live in-browser code editor (StackBlitz/CodeSandbox-style) — see Presentation style above.
- AI-powered design remix/generation — see Presentation style above.
- Deep per-brand theming / "make it match your company colors" demos — not the differentiator; see Theming above.
- Analytics/usage tracking on the showcase.
- Automated tests for demo apps beyond a successful build.

None of these are ruled out permanently — they're deferred until there's a concrete reason (revenue, user demand, or a second iteration of the showcase) to justify the added cost and maintenance.

## Open Items for Implementation Planning

- Exact content of the AI dashboard demo (data, charts, panels) — functional detail, not structural.
