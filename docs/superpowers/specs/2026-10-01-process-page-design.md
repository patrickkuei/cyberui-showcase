# `/process` ("How we design") Page — Design Spec

**Date:** 2026-10-01
**Status:** Design agreed section by section with the user; pending written-spec review
**Builds on:** [2026-09-30-showcase-hub-redesign-design.md](2026-09-30-showcase-hub-redesign-design.md), which created `/process` as a three-act `Timeline` page with short placeholder copy. This spec replaces that page's content model, layout and motion. Everything in the hub spec not mentioned here still holds (nav, neutral hub chrome, "spend the neon once per page").

This spec was produced by running the 10 stages the page describes against the page itself. Stages 1-6 are recorded below. Stages 7-10 are the implementation plan's job.

## 1. Discovery

**Problem.** Visitors who build products with an AI assistant arrive at `/process` from Home or Templates, deciding whether to trust cyberui-2045 as a starting point. The page claims a rigorous 10-stage process but shows none of it, so the claim can't be checked and reads as marketing.

**Audience.** The same people as Home: AI-assisted builders choosing a template to fork (the original spec also names vibe coders and PMs or leads evaluating the library). Many are solo, so nothing on the page may assume "your team".

**Voice.** Professional and specific, deliberately more formal than Home's plain voice. The page says "how we do it", so it should read like documentation of a real process, not a pitch. Stage names and headings stay consistent with the nav ("How we design").

**Success criteria.**
1. After one pass, a reader can name which stages the template covers (4 of 10) and which stay their own decision.
2. Every stage shows verifiable evidence from this repo, not just a description.
3. No stage is explained with generic filler.
4. Neon appears only in Act 2, and the page respects `prefers-reduced-motion`.

## 2. Research

**How others present process.** Agency-style pages (e.g. Ocean Cyber's "How we design", The Alien Design) list phases with descriptions and no evidence. Design-system process docs (Morningstar) describe their process. Principles pages (GOV.UK, Radix, shadcn) state values. No surveyed example shows the real artifacts of its own process beside each stage. That is this page's differentiator, and it means there is no template to copy. (Findings are from search summaries; the pages were not opened.)

**Evidence in this repo.** Strong artifacts exist for stages 1, 3, 4, 5, 6, 7, 8 and 10. Stage 2 (Research) has only the rejected alternatives, with no user interviews. Stage 9 (Prototype & Testing) had no user-testing round. The page says so rather than inventing evidence.

## 3. Information architecture

**Structure.** Unchanged: three acts (before the pixels / where the template does the work / proving it), plus a static overview strip at the top. Every stage in every act carries evidence.

**Who decides, not "team".** Each stage has an owner of `'you' | 'library'`, displayed as **Your decision** and **Included**. Stages 5-8 are Included; 1-4 and 9-10 are Your decision. The act grouping and the "4 of 10" count are derived from this field so they cannot disagree.

**Content model** (replaces `{ title, time, description }`):

```ts
type Owner = 'you' | 'library';

interface EvidenceBase {
  source: { path: string; label: string };  // repo path, links to main
  asOf: string;                             // commit the evidence was taken from
  caveat?: string;                          // what was NOT done, one plain sentence; required for stages 2 and 9
  invite?: { prompt: string; issueTitle: string; issueBody: string };  // the ask that goes with a caveat; set together with it
}

type StageEvidence =
  | (EvidenceBase & { kind: 'excerpt'; excerpt: string; diagram?: boolean })  // diagram: scrolls instead of wrapping, set in one system monospace font with a tight line height
  | (EvidenceBase & { kind: 'image'; src: string; alt: string });              // stage 7 only

interface ProcessStage {
  number: number;
  title: string;
  summary: string;                 // professional voice, 2-3 sentences
  owner: Owner;
  evidence: StageEvidence;
}
```

`caveat` lives inside `evidence` on purpose: stages 2 and 9 still show a real artifact, plus a plain statement of what was skipped. Each caveat comes with an `invite`: a sentence asking the visitor to help, and a title and body prefilled into a GitHub new-issue link (`issues/new?title=...&body=...`; `labels` is not set, because GitHub only applies it when the label exists and the visitor may apply it). The prefilled body gives visitors prompts to answer instead of a blank box. `caveat` and `invite` must be set together; the data loader throws otherwise. Stage 7's evidence is an image, which is why `StageEvidence` is a union.

**Where the data lives.** Editorial copy (titles, summaries, owners) is in `processStages.ts`. Evidence is in `processEvidence.json`, so the excerpt-drift script (below) can read it with plain Node, without a TypeScript step.

**Excerpt per stage** (verbatim, taken at implementation time):

| # | Stage | Owner | Excerpt from |
|---|---|---|---|
| 1 | Discovery | you | Original spec: Problem |
| 2 | Research | you | Hub spec: the rejected hero alternatives. Caveat: no user interviews. |
| 3 | Information Architecture | you | Hub spec: route tree |
| 4 | Wireframe | you | Hub spec: Home wireframe |
| 5 | Visual Direction | library | Hub spec: the "spend the neon once" principle |
| 6 | Design System | library | Original spec: Theming |
| 7 | High-Fidelity | library | Cropped screenshot of the Home hero, captured like the monitoring one |
| 8 | Motion & Interaction | library | Hub spec: Motion principle paragraph |
| 9 | Prototype & Testing | you | Hub spec: Prototype & Testing. Caveat: no user testing. |
| 10 | Handoff | you | Implementation plan: the Goal and Architecture paragraphs. The summary names PRs #13-#26. |

Stage 10 stays `'you'` so the 4-of-10 claim holds. Its summary can say that the template removes most of the handoff work.

**Staleness.** A repo-level script (outside `packages/site`, which stays self-contained) checks that every `excerpt` still appears verbatim in its source file at HEAD, and fails with a message to refresh `asOf` if not. Stage 7's screenshot is exempt. The check runs in CI (`.github/workflows/checks.yml`, on pull requests and pushes to main; it needs no install because the script uses only Node built-ins), so drift fails a PR instead of going unnoticed. Diagram excerpts (box-drawing art, column-aligned text) are rendered in one system monospace stack at line-height 1.25, because box-drawing glyphs are often missing from a web font and the substituted font's cell width would misalign the art; the Home wireframe in the hub spec was also re-aligned to a clean 55-column rectangle (it had been 53 to 55 columns wide), and that excerpt's `asOf` is the commit that did it.

## 4. Wireframe

Overview strip on top, then the three acts as one uniform stage row.

```
How we design
Ten stages. Four are included in the template; six remain your decisions.

 ┌ overview ───────────────────────────────────────────┐
 │ 01 02 03 04 │ 05 06 07 08 │ 09 10                   │
 │ ░  ░  ░  ░  │ █  █  █  █  │ ░  ░                   │
 │ ░ Your decision      █ Included                      │
 └─────────────────────────────────────────────────────┘

ACT 1 · lede
   ◆ 01  Discovery                      [ Your decision ]
   │   Summary…
   │   ┌ Evidence · original spec › Problem ──────────┐
   │   │ verbatim excerpt (monospace)                  │
   │   └ Full file ↗ · as of c0c11b6 ──────────────────┘
   │   Open to input: … Open an issue ↗ (stages 2 and 9 only)
   ◆ 02  …
ACT 2 · same rows, accent nodes and tags, tag reads [ Included ]
ACT 3 · same rows
```

Each stage is a row with a vertical spine and a diamond node. Evidence is expanded by default; length is acceptable.

**Why not the library `Timeline`.** Its events accept `{ title, description?: string, time, status }`. A string description cannot hold an excerpt, a link or a caveat, and it has no neutral status. Filed as patrickkuei/CyberUI#60. This amends the hub spec's "Process page: cyberui's `Timeline` component". Revisit if #60 lands.

**Mobile.** The strip stays on one row: ten small fixed-size squares (2rem, 1.75rem at phone widths) that shrink slightly below about 356px rather than wrap. Rows stack. Wide excerpts (the ASCII wireframe is about 55 columns) scroll horizontally inside their own block; the page never scrolls sideways.

## 5. Visual direction

All within the hub rule: neutral chrome, neon only in Act 2, no new colors.

- **Spine:** 1px neutral border line. **Nodes:** diamonds. Your decision is hollow and neutral. Included is filled with the accent and glows, which only happens in Act 2. The accent is a scoped local override on the Act 2 container, the same technique as the live template tile.
- **Owner tag:** a text label, never color alone, styled to match the overview strip's squares exactly (one visual vocabulary): neutral outline for Your decision; accent fill with dark text for Included; no glow.
- **Stage number:** mono, muted (`05`). Title at weight 600 in the default text color.
- **Evidence panel:** surface background, mono, 1px neutral border, no glow even in Act 2 (the glow belongs to node and tag). A muted label line above gives source › section.
- **Caveat:** muted text with an "Open to input:" label and a neutral left rule: the plain statement of what was not done, then the invitation, then a neutral underlined "Open an issue" link. No warning color.
- **Overview strip:** a compact, quiet glance bar: a visible caption ("The 10 stages of making a product"), ten small fixed-size squares with visible numbers (outline for Your decision, accent fill for 5-8), and a legend beneath. No labels and no tooltip. A tooltip was tried and dropped: the library `Tooltip` opens on hover and focus only (never on touch), has a 200 ms default delay and a heavy neon glow (filed as patrickkuei/CyberUI#61). The stage names are in the rows directly below, and screen readers get "Stage N: Title, Owner" from visually hidden text; the squares are not tab stops.
- **Corners:** a 4px radius on the strip squares and the owner tags (2px on the legend swatches), matching the site's 6px code blocks and 8px buttons instead of sharp corners.
- **Background dots:** a faint, static, neutral halftone dot field behind this page only (the existing `--color-border-default` dots at 10px, like the Home stat cards), fixed to the viewport and masked to fade diagonally, with one opacity knob (`--process-dots-opacity`). It is scoped to `.process-page` and hidden in print. While the reader is in the Included act (the current stage's `owner` is `library`), the dots fade from the base strength to a brighter one over 400ms (`--process-dots-opacity` 0.5 to `--process-dots-opacity-included` 0.9; same neutral color, only the strength changes), signalling that the reader has entered the part the template does. It is one fixed layer, because a per-act layer would only fill the content column; the change follows the current stage, so it flips near the act boundary rather than exactly at it. With reduced motion or without `IntersectionObserver` the dots stay at the base strength. It never uses the accent, so "neon only where it means something" still holds, and Home's cyan hero dots stay the one loud use. `.process-page` is `isolation: isolate` so the layer paints above the body's opaque background but under the content.
- **Progress rail (wide screens only):** a vertical rail of the same ten chips, fixed in the page's left margin at a set distance from the content column (one CSS knob, `--process-rail-gap`, 72px by default, floored at 4px from the screen edge), that fades in once the inline strip has scrolled out of view and rings the stage currently being read (a plain solid outline: no glow, no accent). The inline strip stays as the first-view glance, the only version on phones and narrow windows, and the home of the caption and legend. The rail is a decorative duplicate: `aria-hidden`, not focusable, not clickable. It is opacity-only, and with `prefers-reduced-motion` or without `IntersectionObserver` it never appears. It is shown only where the left margin can hold it (viewport width of about 1320px and up, and tall enough to clear the nav), hidden in print. The current stage is the row crossing a thin band a third of the way down the viewport. Because the last stage cannot scroll up to that band, an end-of-page sentinel makes the rail show the last stage whenever the very end of the page is on screen (independent of viewport height).
- **Closing block:** after stage 10, a quiet section so the page ends deliberately instead of stopping: a heading ("Start from the result"), one sentence with the derived counts ("A template starts you with the 4 included stages already done, and you take the other 6 from there."), and a plain neutral link to the templates page that reuses Home's call-to-action wording ("Pick a starting point →"), with generous bottom space. It is deliberately not a library `Button`, because a primary button would add a second neon spot to a page where the included act is meant to be the only one.
- **Type:** unchanged (IBM Plex Sans/Mono).
- To check on screen: that the accent-filled "Included" tag reads as a status label, not a call to action.

## 6. Design system (components)

| Need | Use |
|---|---|
| Owner tag | Small custom `OwnerTag` (a plain labeled span) sharing the strip squares' look. A library `Badge` was tried first and dropped: it cannot render an outline, so the tags did not match the strip. |
| Evidence excerpt | Site-local `CodeViewer`, extended for source link, "as of" line and inline horizontal scroll |
| Overview strip | Custom CSS. `Steps` and `SegmentedProgress` model progress, not an ownership split. No tooltip (see §5). |
| Spine and nodes | Custom CSS (see §4) |
| Row container | Decide at implementation (`Card` versus plain markup) |

No new library components are needed. Library gaps are filed in #60 only.

## 7. Motion

Per-stage, two-step reveal, answering the user's own scroll (the hub spec already allows this):
1. The row's header and spine node fade in as soon as the row rises into view.
2. The summary and evidence fade in once the row's top reaches the upper 60% of the viewport (the reading zone).

**Rules:**
- Row height is reserved from the start and only opacity animates, so nothing shifts while scrolling.
- Default state is fully visible. The hidden state is applied only after mount and only when `IntersectionObserver` exists, so print and browsers without `IntersectionObserver` get everything. (In-page `#anchor` links are not used anywhere on this page: the site routes on the URL hash, so they would break routing.) (The current `.process-reveal` hides content by default and this fixes that.)
- `prefers-reduced-motion`: everything shown, no transitions.
- Content is always in the DOM, so screen readers read all of it. Nothing is swapped.

## Stages 7-10: for the implementation plan

- **7 High-Fidelity:** build the rows, strip and spine; capture the Home hero screenshot; extend `CodeViewer`.
- **8 Motion:** extend the reveal hook to two thresholds.
- **9 Prototype & Testing:** RTL tests scoped with `within(...)`; the excerpt-drift script; visual check at desktop and phone widths by a human; a reduced-motion check.
- **10 Handoff:** this spec and its plan. Per the repo's CLAUDE.md, forker-facing comments in code for the typed `owner` field (the compile-time pattern to copy), the `caveat` contract, and the excerpt-drift check.

## Out of scope

- Click-to-jump on the progress rail (see §5). The site routes on the URL hash, so it would need `scrollIntoView` handlers rather than anchors; revisit if wanted.
- A third "AI-assisted" owner value. It would need evidence per stage; revisit as a v2 showing how AI-assisted work went in this project.
- Any change to the library itself (see #60).
