# `/process` Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/process` ("How we design") page so every one of the 10 stages shows real evidence from this repo, an owner tag (Your decision / Included), and a scroll reveal that never shifts the layout.

**Architecture:** Editorial copy lives in `processStages.ts`; machine-checkable evidence (verbatim excerpts, one screenshot) lives in `processEvidence.json`. A uniform `ProcessStageRow` (spine, diamond node, owner `Badge`, summary, evidence via an extended `CodeViewer`) replaces the old plain/`Timeline` act renderers. Acts are derived from runs of consecutive same-owner stages, so the owner split and the act grouping cannot disagree. A root-level Node script verifies every excerpt still appears verbatim in its source file.

**Tech Stack:** React 19, TypeScript ~5.8, Vite, Vitest + Testing Library (`happy-dom`), `cyberui-2045` ^2.6.0 (`Badge`), Node's built-in `node:test` for the root script.

**Spec:** [docs/superpowers/specs/2026-10-01-process-page-design.md](../specs/2026-10-01-process-page-design.md). Read it before starting; it carries the reasoning this plan only references. Also read the repo-root `CLAUDE.md` (comment standards for forkable code).

## Global Constraints

- Work on a new branch off `main` named `polish/process-page`. Do not commit to `main`.
- End every commit message with the line `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Node >=20.19, TypeScript ~5.8.3, React 19, `noUncheckedIndexedAccess` is on (indexing an array or record gives `T | undefined`).
- `packages/site` stays self-contained: no imports from other `packages/*`, nothing imported from outside `packages/site`. The excerpt check script lives at the repo root (`scripts/`) for exactly that reason.
- No new project dependencies. Do not add Playwright (or any browser tool) as a dependency of the repo; the screenshot in Task 8 is a one-off run from a scratch directory outside the repo.
- All asset paths are relative (`./screenshots/x.png`), because `vite.config.ts` sets `base: './'`.
- Neon discipline (spec §5): the accent appears only in Act 2 (nodes, glow, "Included" tags) plus the fill of segments 5-8 in the overview strip. Nothing else on this page glows or uses the accent. Do not use warning/error colors.
- The site routes on the URL hash (`#/process`), so never add in-page `#anchor` links on this page; they would break routing.
- All styling goes in the single shared `packages/site/src/App.css`, in comment-delimited sections. No per-component CSS files.
- Voice: professional and specific (spec §1). No marketing filler.
- Every stage's summary, caveat and excerpt copy in this plan is final; copy it exactly.

## Review Focus

Failure modes the spec implies but a happy-path test would miss. Each has a test in the task named.

1. **Content hidden forever.** `IntersectionObserver` missing, never firing, or `prefers-reduced-motion` on must leave every row fully visible, and a row that is merely not yet revealed must keep its text in the DOM. (Tasks 3 and 5)
2. **Stale excerpt.** Someone edits a source doc and the page quietly shows text that no longer exists there. The check must fail naming the stage. (Task 7)
3. **Windows line endings.** A checkout with CRLF must not make a correct excerpt fail. (Task 7)
4. **Accent leak.** "Included" tags and accent styling must appear only inside the Included act, never in the Your-decision acts. (Task 6)
5. **Acts out of step with owners.** Flipping one stage's owner must fail loudly rather than silently produce a different act structure. (Task 1)
6. **Wide ASCII diagram on a phone.** Diagram excerpts scroll inside their own block; prose excerpts wrap; the page never scrolls sideways. Layout can't be tested in `happy-dom`, so Task 9 has a manual check, and Task 2 pins the wrap/scroll switch in markup.

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/site/src/content/processEvidence.json` (create) | Per-stage evidence: verbatim excerpts or the screenshot, source, `asOf`, caveats. Plain JSON so the root script can read it without TypeScript. |
| `packages/site/src/content/processStages.ts` (rewrite) | Types, 10 stages' editorial copy, `OWNER_LABEL`, `groupIntoActs`, counts, `sourceUrl`. |
| `packages/site/src/content/processStages.test.ts` (create) | Data invariants. |
| `packages/site/src/content/types.ts` (modify) | `CodeSnippet` gains optional `sourceHref`, `asOf`, `wrap`. |
| `packages/site/src/components/CodeViewer.tsx` (modify) + `CodeViewer.test.tsx` (create) | Render provenance line and wrap switch. |
| `packages/site/src/hooks/useStageReveal.ts` (create) + test | Two-step, monotonic, opacity-only reveal state. Replaces `useRevealOnScroll.ts`. |
| `packages/site/src/test/intersectionObserver.ts` (create) | Shared test stub for `IntersectionObserver`. |
| `packages/site/src/components/ProcessOverview.tsx` (create) + test | The 10-segment strip and legend. |
| `packages/site/src/components/ProcessStageRow.tsx` (create) + test | One stage: node, header, owner tag, summary, evidence, caveat. |
| `packages/site/src/pages/ProcessPage.tsx` (rewrite) + test (rewrite) | Intro, strip, acts. |
| `packages/site/src/components/ProcessAct.tsx`, `ProcessActTwo.tsx`, `packages/site/src/hooks/useRevealOnScroll.ts` (delete) | Dead after Task 6. |
| `scripts/check-process-excerpts.mjs` + `.test.mjs` (create), root `package.json` (modify) | Excerpt drift check. |
| `packages/site/public/screenshots/home-hero.png` (create) | Stage 7 evidence. |
| `packages/site/src/App.css` (modify) | New process styles; old process styles removed. |
| `docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md` (modify) | Amendment note: `Timeline` no longer used. |

Existing helpers you will reuse: `usePrefersReducedMotion` (`packages/site/src/hooks/usePrefersReducedMotion.ts`), the `Badge` component from `cyberui-2045`, and the `.code-block*` CSS in `App.css`.

---

### Task 1: Content model and data

**Files:**
- Create: `packages/site/src/content/processEvidence.json`
- Rewrite: `packages/site/src/content/processStages.ts`
- Test: `packages/site/src/content/processStages.test.ts`

**Interfaces:**
- Produces (used by every later task):
  - `type Owner = 'you' | 'library'`
  - `OWNER_LABEL: Record<Owner, string>`
  - `interface ProcessStage { number: number; title: string; summary: string; owner: Owner; evidence: StageEvidence }`
  - `type StageEvidence` (a union, see code below)
  - `PROCESS_STAGES: ProcessStage[]` (10 items, numbers 1 to 10 in order)
  - `TOTAL_STAGES: number`, `INCLUDED_STAGES: number`
  - `interface ProcessAct { title: string; lede: string; owner: Owner; stages: ProcessStage[] }`
  - `groupIntoActs(stages: readonly ProcessStage[]): ProcessAct[]`
  - `sourceUrl(path: string): string`
- The old exports `ACT_1`, `ACT_2`, `ACT_3`, `ProcessStage` (old shape) disappear. `ProcessAct.tsx`/`ProcessActTwo.tsx` still import them until Task 6 deletes them, so `tsc` will fail between Task 1 and Task 6. That is expected; run only vitest in these tasks, and `tsc` again in Task 6.

- [ ] **Step 1: Create the branch**

```bash
git switch main && git pull --ff-only && git switch -c polish/process-page
```

The spec and this plan are already in the working tree as untracked files (they carry over to the new branch). Commit them first, so the branch history starts with the design:

```bash
git add docs/superpowers/specs/2026-10-01-process-page-design.md docs/superpowers/plans/2026-10-01-process-page.md
git commit -m "docs: design spec and implementation plan for the /process page"
```

- [ ] **Step 2: Write the failing test**

Create `packages/site/src/content/processStages.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  PROCESS_STAGES,
  INCLUDED_STAGES,
  TOTAL_STAGES,
  OWNER_LABEL,
  groupIntoActs,
  sourceUrl,
  type ProcessStage,
} from './processStages';

describe('PROCESS_STAGES', () => {
  it('has the ten stages, numbered 1 to 10 in order', () => {
    expect(PROCESS_STAGES.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(TOTAL_STAGES).toBe(10);
  });

  it('marks exactly stages 5 to 8 as included in the library', () => {
    const included = PROCESS_STAGES.filter((s) => s.owner === 'library').map((s) => s.number);
    expect(included).toEqual([5, 6, 7, 8]);
    expect(INCLUDED_STAGES).toBe(4);
  });

  it('labels owners for display', () => {
    expect(OWNER_LABEL).toEqual({ you: 'Your decision', library: 'Included' });
  });

  it('carries a caveat on stages 2 and 9 only', () => {
    const withCaveat = PROCESS_STAGES.filter((s) => s.evidence.caveat).map((s) => s.number);
    expect(withCaveat).toEqual([2, 9]);
  });

  it('gives every stage evidence with a repo source and a commit', () => {
    for (const stage of PROCESS_STAGES) {
      expect(stage.summary.length, `stage ${stage.number} summary`).toBeGreaterThan(40);
      expect(stage.evidence.source.path, `stage ${stage.number} source`).toMatch(/^(docs|packages)\//);
      expect(stage.evidence.asOf, `stage ${stage.number} asOf`).toMatch(/^[0-9a-f]{7,40}$/);
      if (stage.evidence.kind === 'excerpt') {
        expect(stage.evidence.excerpt.trim().length, `stage ${stage.number} excerpt`).toBeGreaterThan(0);
      }
    }
  });

  it('uses an image only for stage 7, with a relative path', () => {
    const images = PROCESS_STAGES.filter((s) => s.evidence.kind === 'image');
    expect(images.map((s) => s.number)).toEqual([7]);
    const evidence = images[0]?.evidence;
    expect(evidence?.kind === 'image' && evidence.src).toBe('./screenshots/home-hero.png');
  });

  it('joins multi-line excerpts with newlines', () => {
    const stage3 = PROCESS_STAGES.find((s) => s.number === 3);
    const evidence = stage3?.evidence;
    expect(evidence?.kind === 'excerpt' && evidence.excerpt.split('\n')).toHaveLength(4);
  });
});

describe('groupIntoActs', () => {
  it('splits into runs of consecutive same-owner stages', () => {
    const acts = groupIntoActs(PROCESS_STAGES);
    expect(acts.map((a) => a.owner)).toEqual(['you', 'library', 'you']);
    expect(acts.map((a) => a.stages.map((s) => s.number))).toEqual([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]);
    expect(acts.map((a) => a.title)).toEqual([
      'Decisions that come first',
      'Where the template does the work',
      'Proving it works',
    ]);
  });

  it('throws when an owner change would silently produce a different act structure', () => {
    const flipped: ProcessStage[] = PROCESS_STAGES.map((s) =>
      s.number === 3 ? { ...s, owner: 'library' as const } : s
    );
    expect(() => groupIntoActs(flipped)).toThrow(/expected 3 acts/);
  });
});

describe('sourceUrl', () => {
  it('links a repo path to the file on main', () => {
    expect(sourceUrl('docs/x.md')).toBe('https://github.com/patrickkuei/cyberui-templates/blob/main/docs/x.md');
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `cd packages/site && pnpm exec vitest run src/content/processStages.test.ts`
Expected: FAIL (the old module has none of these exports).

- [ ] **Step 4: Create the evidence data**

Create `packages/site/src/content/processEvidence.json`. Excerpts are verbatim copies of text in the named files as of commit `c0c11b6`; each excerpt is an array of lines joined with `\n`. Copy exactly, including indentation, dashes and box-drawing characters:

```json
{
  "1": {
    "kind": "excerpt",
    "source": {
      "path": "docs/superpowers/specs/2026-09-27-cyberui-showcase-design.md",
      "label": "Original design spec › Problem"
    },
    "asOf": "c0c11b6",
    "excerpt": [
      "cyberui-2045's current GitHub Pages presence (Storybook + demo app) shows components in isolation. It doesn't answer the question a prospective user actually has: *\"what can I build with this, and does it look good as a real product?\"*"
    ]
  },
  "2": {
    "kind": "excerpt",
    "source": {
      "path": "docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md",
      "label": "Hub redesign spec › Visual Direction (rejected hero alternatives)"
    },
    "asOf": "c0c11b6",
    "excerpt": [
      "- A real demo screenshot as the hero — redundant with Gallery, and undersells the hero's actual job (mood/identity, not proof — proof comes seconds later in Gallery).",
      "  - A commissioned/sourced static illustration or a designed logo mark — real asset-production cost with no existing brand mark to build from; inconsistent with this being a solo-maintainer, no-deadline project (same reasoning that ruled out the AI-remix feature in the original spec).",
      "  - A plain grid-horizon + glow scene — closer to the generic \"dark mode + one accent glow\" AI-design cliché than the halftone approach; halftone/screentone is a concrete, referenceable cyberpunk-manga vernacular detail (Akira/Ghost in the Shell-era print aesthetic), not generic decoration."
    ],
    "caveat": "No user interviews or surveys were run. The reasoning comes from reviewing screenshots of the existing page and weighing alternatives, not from talking to visitors."
  },
  "3": {
    "kind": "excerpt",
    "diagram": true,
    "source": {
      "path": "docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md",
      "label": "Hub redesign spec › Information Architecture"
    },
    "asOf": "c0c11b6",
    "excerpt": [
      "/              Home — pure pitch: hero (image-led) + intro/value-prop + closing CTA",
      "/gallery       Gallery index — bento-style grid, all 5 demos (1 live, 4 coming soon)",
      "/gallery/:slug Existing demo detail page (Preview / Code / Case Study tabs) — unchanged",
      "/process       \"How we design\" — 10-stage framework as a 3-act narrative (new)"
    ]
  },
  "4": {
    "kind": "excerpt",
    "diagram": true,
    "source": {
      "path": "docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md",
      "label": "Hub redesign spec › Wireframe › Home"
    },
    "asOf": "c0c11b6",
    "excerpt": [
      "┌───────────────────────────────────────────────────┐",
      "│ [nav — sticky]                                     │",
      "│  ┌───────────────────────────────────────────┐    │",
      "│  │  [ halftone/screentone glow scene —         │    │",
      "│  │    see Visual Direction — not a screenshot] │    │",
      "│  │  headline (copy TBD)                        │    │",
      "│  │  [ VIEW THE GALLERY ] ← one loud CTA        │    │",
      "│  └───────────────────────────────────────────┘    │",
      "│  ─── What cyberui-2045 actually is ───────────────│",
      "│  1-2 sentence positioning + quiet, text-led        │",
      "│  feature highlights (tokens/theming, component     │",
      "│  count, dark-mode-native, accessible by default)   │",
      "│  — not a SaaS-card grid.                           │",
      "│  ─── closing CTA ──────────────────────────────────│",
      "│  \"One demo live, four more coming.\" [ VIEW GALLERY]│",
      "└───────────────────────────────────────────────────┘"
    ]
  },
  "5": {
    "kind": "excerpt",
    "source": {
      "path": "docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md",
      "label": "Hub redesign spec › Visual Direction"
    },
    "asOf": "c0c11b6",
    "excerpt": [
      "**Principle governing this whole pass:** spend the neon once per page, and only where it means something. Home spends it on the hero. `/process` spends it on Act 2. Gallery spends it on the one actionable tile (see Motion below). Nothing else glows."
    ]
  },
  "6": {
    "kind": "excerpt",
    "source": {
      "path": "docs/superpowers/specs/2026-09-27-cyberui-showcase-design.md",
      "label": "Original design spec › Theming"
    },
    "asOf": "c0c11b6",
    "excerpt": [
      "All five demos share cyberui-2045's core dark/neon cyberpunk visual language — that consistency is the actual product differentiator, not a limitation to engineer around. Each demo varies only its **accent hue** (e.g., cyan for the monitoring dashboard, violet for the agent control panel, magenta for social) by overriding the same token names with different values. This casually demonstrates the token system is swappable without turning the showcase into a \"look how themeable we are\" pitch, which is not cyberui-2045's differentiator."
    ]
  },
  "7": {
    "kind": "image",
    "source": {
      "path": "packages/site/src/components/HeroScene.tsx",
      "label": "Home hero (HeroScene.tsx)"
    },
    "asOf": "c0c11b6",
    "src": "./screenshots/home-hero.png",
    "alt": "The Home page hero: a cyan halftone glow behind the headline \"Built by AI. Ready for yours.\""
  },
  "8": {
    "kind": "excerpt",
    "source": {
      "path": "docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md",
      "label": "Hub redesign spec › Motion & Interaction"
    },
    "asOf": "c0c11b6",
    "excerpt": [
      "Same \"spend it once, and only where it means something\" principle applied to motion — avoids the generic tell of fade-slide-up entrances on every section and hover glow on every card."
    ]
  },
  "9": {
    "kind": "excerpt",
    "source": {
      "path": "docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md",
      "label": "Hub redesign spec › Prototype & Testing"
    },
    "asOf": "c0c11b6",
    "excerpt": [
      "**Prototype & Testing:** the iterative wireframe/visual-direction discussion in this doc *is* the prototype pass for a project this size — no separate mockup tool or user-testing round planned. Verification happens by building it and screenshot-reviewing against this doc (the same method used to diagnose the original page's problems at the start of this conversation). Existing component tests (`App.test.tsx`, `HomePage.test.tsx`, `GalleryPage.test.tsx`) get updated/extended for the new routes and components during implementation — an implementation-plan concern, not a design decision captured here."
    ],
    "caveat": "No user-testing round was run. Verification was building the page and reviewing screenshots against the spec, plus component tests for rendering and routing."
  },
  "10": {
    "kind": "excerpt",
    "source": {
      "path": "docs/superpowers/plans/2026-09-30-showcase-hub-redesign.md",
      "label": "Hub redesign implementation plan"
    },
    "asOf": "c0c11b6",
    "excerpt": [
      "**Goal:** Redesign the `packages/showcase` hub (Home, a new Gallery index, and a new Process page) per the approved design spec — fix the single-card-in-a-void layout and undisciplined accent usage, and add an honest \"how we design\" page.",
      "",
      "**Architecture:** Four routes (`/`, `/gallery`, `/gallery/:slug`, `/process`) behind a persistent nav, sharing one `GalleryItem` data model extended with per-demo accent hex and shipped/coming-soon status. New shared pieces (`Nav`, `DemoTile`, `HeroScene`, `ProcessAct`/`ProcessActTwo`) are small, single-purpose components; the existing demo detail page (`GalleryPage`, `CodeViewer`, `CaseStudy`) is untouched except for its back-link target and a new not-yet-shipped branch."
    ]
  }
}
```

(Task 7's script is the authority on whether these transcriptions match. If it later reports a mismatch, replace that stage's lines with the exact lines from the source file, for example with `sed -n 'START,ENDp' <file>`.)

- [ ] **Step 5: Rewrite `processStages.ts`**

Replace the whole file:

```ts
import evidenceJson from './processEvidence.json';

/**
 * Who decides a stage. A typed field, not a per-act array, on purpose: the act
 * grouping (groupIntoActs) and the "N of 10 included" count are both derived
 * from it, so they cannot drift apart. Copy this pattern for any list whose
 * subgroups must stay consistent with a per-item attribute.
 */
export type Owner = 'you' | 'library';

/**
 * A Record (not an if/else) so adding an Owner without a display label is a
 * compile error, the same pattern as App.tsx's Record<Route, ...> maps.
 */
export const OWNER_LABEL: Record<Owner, string> = {
  you: 'Your decision',
  library: 'Included',
};

interface EvidenceBase {
  /** Repo-relative path of the file the evidence comes from. */
  source: { path: string; label: string };
  /** Commit the evidence was taken from. */
  asOf: string;
  /**
   * What was NOT done for this stage. Present on stages whose real process
   * was thinner than the stage name suggests (Research, Prototype & Testing).
   * The page shows it as "Not done: ..." beside the artifact; never invent
   * evidence to fill a gap, say what the gap is.
   */
  caveat?: string;
}

export type StageEvidence =
  | (EvidenceBase & {
      kind: 'excerpt';
      /** Verbatim text from `source.path`. Checked by scripts/check-process-excerpts.mjs. */
      excerpt: string;
      /** Box-drawing or column-aligned text: scrolls inside its block instead of wrapping. */
      diagram?: boolean;
    })
  | (EvidenceBase & { kind: 'image'; src: string; alt: string });

export interface ProcessStage {
  number: number;
  title: string;
  /** Professional voice, 2-3 sentences. */
  summary: string;
  owner: Owner;
  evidence: StageEvidence;
}

// Evidence is plain JSON (not TypeScript) so the repo-root drift check can read
// it with no build step. Excerpts are stored as arrays of lines.
interface RawEvidence {
  kind: 'excerpt' | 'image';
  source: { path: string; label: string };
  asOf: string;
  caveat?: string;
  excerpt?: string[];
  diagram?: boolean;
  src?: string;
  alt?: string;
}

const RAW_EVIDENCE = evidenceJson as unknown as Record<string, RawEvidence>;

function evidenceFor(number: number): StageEvidence {
  const raw = RAW_EVIDENCE[String(number)];
  if (!raw) throw new Error(`processEvidence.json has no entry for stage ${number}`);
  const base = { source: raw.source, asOf: raw.asOf, ...(raw.caveat ? { caveat: raw.caveat } : {}) };
  if (raw.kind === 'image') {
    if (!raw.src || !raw.alt) throw new Error(`processEvidence.json stage ${number}: image needs src and alt`);
    return { ...base, kind: 'image', src: raw.src, alt: raw.alt };
  }
  if (!raw.excerpt || raw.excerpt.length === 0) {
    throw new Error(`processEvidence.json stage ${number}: excerpt needs at least one line`);
  }
  return { ...base, kind: 'excerpt', excerpt: raw.excerpt.join('\n'), ...(raw.diagram ? { diagram: true } : {}) };
}

const REPO_BLOB_BASE = 'https://github.com/patrickkuei/cyberui-templates/blob/main/';

/** Link to a repo file on main. */
export function sourceUrl(path: string): string {
  return `${REPO_BLOB_BASE}${path}`;
}

type StageCopy = Omit<ProcessStage, 'evidence'>;

const STAGE_COPY: readonly StageCopy[] = [
  {
    number: 1,
    title: 'Discovery',
    owner: 'you',
    summary:
      'We began by writing down the question a visitor actually arrives with, before choosing anything to build: what can I build with this library, and does it look good as a real product? That question, and the audience that asks it, fixed the scope for every later stage.',
  },
  {
    number: 2,
    title: 'Research',
    owner: 'you',
    summary:
      'Research here was desk work, not fieldwork. We reviewed screenshots of the first version of the hub and weighed alternatives for each major decision, recording why each rejected option lost. The hero image options below are one example.',
  },
  {
    number: 3,
    title: 'Information Architecture',
    owner: 'you',
    summary:
      'Before drawing any screen we fixed the routes and navigation: a pitch page, an index of templates, a page per template, and this process page, behind one persistent nav. The excerpt is the route tree as first written; "Gallery" was later renamed "Templates" once it was clear visitors want a starting point to fork, not a portfolio to browse.',
  },
  {
    number: 4,
    title: 'Wireframe',
    owner: 'you',
    summary:
      'Layout was argued in ASCII boxes in the design spec before any color or component was chosen. The sketch shows the Home page as first drawn: one hero with one primary action, a short value proposition, and a closing call to action. The built page changed in places.',
  },
  {
    number: 5,
    title: 'Visual Direction',
    owner: 'library',
    summary:
      "With the structure fixed, the look reduced to one rule: spend the neon once per page, and only where it means something. cyberui-2045's tokens carry color, type and glow, so applying the rule meant choosing where to point them, not defining a palette.",
  },
  {
    number: 6,
    title: 'Design System',
    owner: 'library',
    summary:
      'cyberui-2045 supplies the component set and its variants, so the open question was how little to vary. Each template overrides only its accent hue and reuses everything else, which keeps templates consistent without a bespoke design system per template.',
  },
  {
    number: 7,
    title: 'High-Fidelity',
    owner: 'library',
    summary:
      'For pages built from cyberui-2045 components, the finished visuals are the components themselves, so there is no separate mockup to translate into code. The image shows the Home hero as built. It is the exception: a custom halftone scene local to this site, and the one place the hub allows full color.',
  },
  {
    number: 8,
    title: 'Motion & Interaction',
    owner: 'library',
    summary:
      'Hover, focus and glow states ship inside each component. What we added was restraint: the same once-per-page rule applied to motion, so animation is limited to a few places where it answers something the visitor did or marks a first impression.',
  },
  {
    number: 9,
    title: 'Prototype & Testing',
    owner: 'you',
    summary:
      'For a project this size the written design discussion served as the prototype, and verification was building the page and reviewing screenshots against the spec, plus component tests for routing and rendering. We are explicit below about what that does not cover.',
  },
  {
    number: 10,
    title: 'Handoff',
    owner: 'you',
    summary:
      'The code is the handoff. The design spec and implementation plan, linked here, were given to the agents that built the site, and the work shipped as 14 reviewed pull requests (#13 to #26). With cyberui-2045 components there is no separate specification to translate into code.',
  },
];

export const PROCESS_STAGES: ProcessStage[] = STAGE_COPY.map((copy) => ({
  ...copy,
  evidence: evidenceFor(copy.number),
}));

export const TOTAL_STAGES = PROCESS_STAGES.length;
export const INCLUDED_STAGES = PROCESS_STAGES.filter((s) => s.owner === 'library').length;

export interface ProcessAct {
  title: string;
  lede: string;
  owner: Owner;
  stages: ProcessStage[];
}

// One entry per run of consecutive same-owner stages, in page order.
const ACT_COPY: readonly { title: string; lede: string }[] = [
  {
    title: 'Decisions that come first',
    lede: 'These stages come before any pixels, and a template cannot make them for you.',
  },
  {
    title: 'Where the template does the work',
    lede: 'The stages cyberui-2045 settles in advance: the look, the components, the finished visuals and the motion.',
  },
  {
    title: 'Proving it works',
    lede: 'Testing stays yours. Handoff is short, because the code you ship is the specification.',
  },
];

/**
 * Groups stages into acts: each act is a run of consecutive stages with the
 * same owner. Throws if the number of runs no longer matches ACT_COPY, which
 * is what happens when an owner is changed without updating the act copy.
 */
export function groupIntoActs(stages: readonly ProcessStage[]): ProcessAct[] {
  const runs: { owner: Owner; stages: ProcessStage[] }[] = [];
  for (const stage of stages) {
    const last = runs[runs.length - 1];
    if (last && last.owner === stage.owner) last.stages.push(stage);
    else runs.push({ owner: stage.owner, stages: [stage] });
  }
  if (runs.length !== ACT_COPY.length) {
    throw new Error(
      `expected ${ACT_COPY.length} acts (runs of consecutive stages with the same owner), got ${runs.length}. ` +
        'If the owner split changed on purpose, update ACT_COPY to match.'
    );
  }
  return runs.map((run, i) => ({ ...ACT_COPY[i]!, ...run }));
}
```

- [ ] **Step 6: Run the test**

Run: `cd packages/site && pnpm exec vitest run src/content/processStages.test.ts`
Expected: PASS (all tests).

- [ ] **Step 7: Commit**

```bash
git add packages/site/src/content/processEvidence.json packages/site/src/content/processStages.ts packages/site/src/content/processStages.test.ts
git commit -m "feat(site): process stage content model with per-stage evidence"
```

---

### Task 2: Extend `CodeViewer` with provenance and a wrap switch

**Files:**
- Modify: `packages/site/src/content/types.ts`
- Modify: `packages/site/src/components/CodeViewer.tsx`
- Modify: `packages/site/src/App.css` (append; do not edit existing rules)
- Test: `packages/site/src/components/CodeViewer.test.tsx` (create)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `CodeSnippet` gains optional `sourceHref?: string`, `asOf?: string`, `wrap?: boolean`. Existing callers (`TemplatePage`, `CaseStudy`) pass none of them and must render exactly as before.

- [ ] **Step 1: Write the failing test**

Create `packages/site/src/components/CodeViewer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeViewer } from './CodeViewer';

describe('CodeViewer', () => {
  it('renders a plain snippet with no provenance line (existing callers unchanged)', () => {
    render(<CodeViewer snippets={[{ title: 'Example', code: 'const a = 1;' }]} />);
    expect(screen.getByText('Example')).toBeInTheDocument();
    expect(screen.getByText('const a = 1;')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/as of/i)).not.toBeInTheDocument();
  });

  it('links to the full source file in a new tab when sourceHref is given', () => {
    render(
      <CodeViewer snippets={[{ title: 'Spec', code: 'x', sourceHref: 'https://example.com/file.md', asOf: 'c0c11b6' }]} />
    );
    const link = screen.getByRole('link', { name: /full file/i });
    expect(link).toHaveAttribute('href', 'https://example.com/file.md');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(screen.getByText('c0c11b6')).toBeInTheDocument();
  });

  it('wraps long lines only when wrap is set, so diagrams can keep scrolling instead', () => {
    const { container, rerender } = render(<CodeViewer snippets={[{ title: 'Prose', code: 'x', wrap: true }]} />);
    expect(container.querySelector('pre')).toHaveClass('code-block-wrap');
    rerender(<CodeViewer snippets={[{ title: 'Diagram', code: 'x' }]} />);
    expect(container.querySelector('pre')).not.toHaveClass('code-block-wrap');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd packages/site && pnpm exec vitest run src/components/CodeViewer.test.tsx`
Expected: FAIL (no link rendered, no `code-block-wrap` class). The first test passes already; that is fine, it pins backward compatibility.

- [ ] **Step 3: Extend the type**

In `packages/site/src/content/types.ts`, replace the `CodeSnippet` interface with:

```ts
export interface CodeSnippet {
  title: string;
  code: string;
  note?: string;
  /** Adds a "Full file" link under the block. Used by /process evidence panels. */
  sourceHref?: string;
  /** Commit the snippet was taken from; shown beside the "Full file" link. */
  asOf?: string;
  /**
   * Wrap long lines instead of scrolling horizontally. Right for prose;
   * leave unset for diagrams and code, where line breaks are the content.
   */
  wrap?: boolean;
}
```

- [ ] **Step 4: Update the component**

Replace the contents of `packages/site/src/components/CodeViewer.tsx`:

```tsx
import type { CodeSnippet } from '../content/types';

export interface CodeViewerProps {
  snippets: CodeSnippet[];
}

export function CodeViewer({ snippets }: CodeViewerProps) {
  if (snippets.length === 0) {
    return <p className="code-viewer-empty">No snippets yet for this template.</p>;
  }

  return (
    <div className="code-viewer">
      {snippets.map((snippet) => (
        <figure className="code-block" key={snippet.title}>
          <figcaption>{snippet.title}</figcaption>
          <pre className={snippet.wrap ? 'code-block-wrap' : undefined}>
            <code>{snippet.code}</code>
          </pre>
          {(snippet.sourceHref || snippet.asOf) && (
            <p className="code-block-source">
              {snippet.sourceHref && (
                <a href={snippet.sourceHref} target="_blank" rel="noreferrer">
                  Full file ↗
                </a>
              )}
              {snippet.sourceHref && snippet.asOf && ' · '}
              {snippet.asOf && (
                <>
                  as of <code>{snippet.asOf}</code>
                </>
              )}
            </p>
          )}
          {snippet.note && <p className="code-block-note">{snippet.note}</p>}
        </figure>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Append the CSS**

Append to the end of `packages/site/src/App.css`:

```css

/* ---- Code block provenance line + wrapped variant (used by /process evidence) ---- */

.code-block pre.code-block-wrap code {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.code-block-source {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.code-block-source a {
  color: var(--color-secondary);
}

.code-block-source code {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}
```

- [ ] **Step 6: Run the tests**

Run: `cd packages/site && pnpm exec vitest run src/components/CodeViewer.test.tsx src/pages/TemplatePage.test.tsx`
Expected: PASS (the Template page tests confirm existing callers are unchanged).

- [ ] **Step 7: Commit**

```bash
git add packages/site/src/content/types.ts packages/site/src/components/CodeViewer.tsx packages/site/src/components/CodeViewer.test.tsx packages/site/src/App.css
git commit -m "feat(site): CodeViewer provenance line and wrap option"
```

---

### Task 3: Two-step reveal hook

**Files:**
- Create: `packages/site/src/hooks/useStageReveal.ts`
- Create: `packages/site/src/test/intersectionObserver.ts`
- Test: `packages/site/src/hooks/useStageReveal.test.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion` from `./usePrefersReducedMotion`.
- Produces:
  - `type RevealStage = 'pending' | 'header' | 'full'`
  - `READING_ZONE_MARGIN: string` (`'0px 0px -40% 0px'`)
  - `useStageReveal<T extends HTMLElement>(): { ref: RefObject<T | null>; stage: RevealStage }`
  - test helper `stubIntersectionObserver(mode: 'immediate' | 'never'): void` from `src/test/intersectionObserver.ts`

- [ ] **Step 1: Write the shared test helper**

Create `packages/site/src/test/intersectionObserver.ts`:

```ts
import { vi } from 'vitest';

/**
 * happy-dom's IntersectionObserver is a no-op that never calls back, so tests
 * choose a behavior. 'immediate' reports every observed element as
 * intersecting at observe() time, which is what a real browser does for
 * content already in view. 'never' stays silent, like an element far below
 * the fold. Pair with `vi.unstubAllGlobals()` in afterEach.
 */
export function stubIntersectionObserver(mode: 'immediate' | 'never'): void {
  class Stub {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      if (mode === 'immediate') {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
    }
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', Stub);
}
```

- [ ] **Step 2: Write the failing test**

Create `packages/site/src/hooks/useStageReveal.test.tsx`:

```tsx
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useStageReveal, READING_ZONE_MARGIN } from './useStageReveal';

// An IntersectionObserver the test can fire by hand, one instance per
// observer the hook creates, identified by its rootMargin.
class ControlledObserver {
  static instances: ControlledObserver[] = [];
  constructor(
    private callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {
    ControlledObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  fire(isIntersecting = true) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

function Probe() {
  const { ref, stage } = useStageReveal<HTMLDivElement>();
  return <div ref={ref} data-testid="probe" data-stage={stage} />;
}

const stageOf = () => screen.getByTestId('probe').getAttribute('data-stage');
const headerObserver = () => ControlledObserver.instances.find((o) => !o.options?.rootMargin)!;
const readingObserver = () => ControlledObserver.instances.find((o) => o.options?.rootMargin === READING_ZONE_MARGIN)!;

afterEach(() => {
  ControlledObserver.instances = [];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useStageReveal', () => {
  it('starts pending, then header, then full as the element climbs the viewport', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    render(<Probe />);
    expect(stageOf()).toBe('pending');
    act(() => headerObserver().fire());
    expect(stageOf()).toBe('header');
    act(() => readingObserver().fire());
    expect(stageOf()).toBe('full');
  });

  it('never goes backwards: a late header callback cannot downgrade full', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    render(<Probe />);
    act(() => readingObserver().fire());
    expect(stageOf()).toBe('full');
    act(() => headerObserver().fire());
    expect(stageOf()).toBe('full');
  });

  it('ignores callbacks where the element is not intersecting', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    render(<Probe />);
    act(() => headerObserver().fire(false));
    expect(stageOf()).toBe('pending');
  });

  it('is fully visible when the browser has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Probe />);
    expect(stageOf()).toBe('full');
  });

  it('is fully visible, with no observers created, under prefers-reduced-motion', () => {
    vi.stubGlobal('IntersectionObserver', ControlledObserver);
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList);
    render(<Probe />);
    expect(stageOf()).toBe('full');
    expect(ControlledObserver.instances).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `cd packages/site && pnpm exec vitest run src/hooks/useStageReveal.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement the hook**

Create `packages/site/src/hooks/useStageReveal.ts`:

```ts
import { useEffect, useRef, useState, type RefObject } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export type RevealStage = 'pending' | 'header' | 'full';

/**
 * Shrinks the observer's viewport from the bottom by 40%, so the "full"
 * observer fires once the element's top has climbed into the upper 60% of
 * the screen: roughly where someone is reading.
 */
export const READING_ZONE_MARGIN = '0px 0px -40% 0px';

const RANK: Record<RevealStage, number> = { pending: 0, header: 1, full: 2 };

/**
 * Two-step, one-way reveal for a long page of stacked rows:
 *   pending -> header (the row has risen into view) -> full (it reached the reading zone).
 *
 * This hook only reports a stage; the caller must animate OPACITY ONLY and
 * keep the row's height constant in every stage. Changing height while
 * someone scrolls makes the content under their eyes jump.
 *
 * Content must never depend on an observer to become visible: with
 * prefers-reduced-motion, or in a browser without IntersectionObserver, the
 * stage is 'full' from the first render.
 */
export function useStageReveal<T extends HTMLElement>(): { ref: RefObject<T | null>; stage: RevealStage } {
  const ref = useRef<T | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const canObserve = typeof IntersectionObserver !== 'undefined';
  const [stage, setStage] = useState<RevealStage>(reducedMotion || !canObserve ? 'full' : 'pending');

  useEffect(() => {
    if (reducedMotion || !canObserve) {
      setStage('full');
      return;
    }
    const node = ref.current;
    if (!node) return;

    const raiseTo = (next: RevealStage) => setStage((current) => (RANK[next] > RANK[current] ? next : current));
    // Each callback disconnects the observer it received, so each fires once.
    const watch = (next: RevealStage, options?: IntersectionObserverInit) => {
      const observer = new IntersectionObserver((entries, self) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          raiseTo(next);
          self.disconnect();
        }
      }, options);
      observer.observe(node);
      return observer;
    };

    const observers = [watch('header'), watch('full', { rootMargin: READING_ZONE_MARGIN })];
    return () => observers.forEach((observer) => observer.disconnect());
  }, [reducedMotion, canObserve]);

  return { ref, stage };
}
```

- [ ] **Step 5: Run the test**

Run: `cd packages/site && pnpm exec vitest run src/hooks/useStageReveal.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/site/src/hooks/useStageReveal.ts packages/site/src/hooks/useStageReveal.test.tsx packages/site/src/test/intersectionObserver.ts
git commit -m "feat(site): two-step opacity-only reveal hook"
```

---

### Task 4: Overview strip

**Files:**
- Create: `packages/site/src/components/ProcessOverview.tsx`
- Modify: `packages/site/src/App.css` (append)
- Test: `packages/site/src/components/ProcessOverview.test.tsx`

**Interfaces:**
- Consumes: `ProcessStage`, `OWNER_LABEL` from `../content/processStages`.
- Produces: `ProcessOverview({ stages }: { stages: readonly ProcessStage[] })`.

- [ ] **Step 1: Write the failing test**

Create `packages/site/src/components/ProcessOverview.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ProcessOverview } from './ProcessOverview';
import { PROCESS_STAGES } from '../content/processStages';

describe('ProcessOverview', () => {
  it('shows one numbered segment per stage', () => {
    render(<ProcessOverview stages={PROCESS_STAGES} />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(10);
    expect(items[0]).toHaveTextContent('01');
    expect(items[9]).toHaveTextContent('10');
  });

  it('marks the included stages without relying on color alone', () => {
    render(<ProcessOverview stages={PROCESS_STAGES} />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    const included = items.filter((li) => li.getAttribute('data-owner') === 'library');
    expect(included).toHaveLength(4);
    // Each segment carries its stage, title and owner as text for assistive tech.
    expect(items[4]).toHaveAttribute('aria-label', 'Stage 5: Visual Direction, Included');
    expect(items[0]).toHaveAttribute('aria-label', 'Stage 1: Discovery, Your decision');
  });

  it('explains both kinds of segment in a legend', () => {
    const { container } = render(<ProcessOverview stages={PROCESS_STAGES} />);
    const legend = container.querySelector('.process-overview-legend') as HTMLElement;
    expect(within(legend).getByText('Your decision')).toBeInTheDocument();
    expect(within(legend).getByText('Included')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd packages/site && pnpm exec vitest run src/components/ProcessOverview.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `packages/site/src/components/ProcessOverview.tsx`:

```tsx
import { OWNER_LABEL, type ProcessStage } from '../content/processStages';

export interface ProcessOverviewProps {
  stages: readonly ProcessStage[];
}

/**
 * The 10 stages at a glance, with the included ones filled. Custom markup
 * rather than the library's Steps or SegmentedProgress: those model progress
 * (completed/pending, or a contiguous filled run), and this is an ownership
 * split where the filled segments are 5 to 8, not the first four.
 * Static on purpose: no links, because the site routes on the URL hash.
 */
export function ProcessOverview({ stages }: ProcessOverviewProps) {
  return (
    <figure className="process-overview">
      <ol className="process-overview-strip">
        {stages.map((stage) => (
          <li
            key={stage.number}
            data-owner={stage.owner}
            aria-label={`Stage ${stage.number}: ${stage.title}, ${OWNER_LABEL[stage.owner]}`}
          >
            <span aria-hidden="true">{String(stage.number).padStart(2, '0')}</span>
          </li>
        ))}
      </ol>
      <p className="process-overview-legend">
        <span>
          <i className="process-overview-swatch process-overview-swatch-you" aria-hidden="true" />
          {OWNER_LABEL.you}
        </span>
        <span>
          <i className="process-overview-swatch process-overview-swatch-library" aria-hidden="true" />
          {OWNER_LABEL.library}
        </span>
      </p>
    </figure>
  );
}
```

- [ ] **Step 4: Append the CSS**

Append to `packages/site/src/App.css`:

```css

/* ---- Process overview strip ---- */

/* The one cyan on /process. Matches the monitoring template's accent
   (TEMPLATES in src/data/templates.ts). Act 2 and the strip's filled
   segments read it; nothing else on the page does. */
.process-page {
  --process-accent: #00fff9;
}

.process-overview {
  margin: 0;
}

.process-overview-strip {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
}

.process-overview-strip li {
  padding: 0.45rem 0;
  text-align: center;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.8125rem;
  color: var(--color-muted);
  border: 1px solid var(--color-border-default);
}

.process-overview-strip li[data-owner='library'] {
  background: var(--process-accent);
  border-color: var(--process-accent);
  color: var(--color-base);
}

.process-overview-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.process-overview-swatch {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  margin-right: 0.4rem;
  border: 1px solid var(--color-border-default);
}

.process-overview-swatch-library {
  background: var(--process-accent);
  border-color: var(--process-accent);
}

@media (max-width: 520px) {
  .process-overview-strip {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

- [ ] **Step 5: Run the test**

Run: `cd packages/site && pnpm exec vitest run src/components/ProcessOverview.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/site/src/components/ProcessOverview.tsx packages/site/src/components/ProcessOverview.test.tsx packages/site/src/App.css
git commit -m "feat(site): process overview strip"
```

---

### Task 5: Stage row

**Files:**
- Create: `packages/site/src/components/ProcessStageRow.tsx`
- Modify: `packages/site/src/App.css` (append)
- Test: `packages/site/src/components/ProcessStageRow.test.tsx`

**Interfaces:**
- Consumes: `ProcessStage`, `OWNER_LABEL`, `PROCESS_STAGES`, `sourceUrl` from `../content/processStages`; `CodeViewer` (Task 2); `useStageReveal` (Task 3); `stubIntersectionObserver` (Task 3); `Badge` from `cyberui-2045`.
- Produces: `ProcessStageRow({ stage }: { stage: ProcessStage })`, which renders an `<li>` (so the caller wraps rows in an `<ol>`), with attributes `data-owner` and `data-reveal`.

- [ ] **Step 1: Write the failing test**

Create `packages/site/src/components/ProcessStageRow.test.tsx`:

```tsx
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessStageRow } from './ProcessStageRow';
import { PROCESS_STAGES, type ProcessStage } from '../content/processStages';
import { stubIntersectionObserver } from '../test/intersectionObserver';

function stage(number: number): ProcessStage {
  const found = PROCESS_STAGES.find((s) => s.number === number);
  if (!found) throw new Error(`no stage ${number}`);
  return found;
}

function renderRow(number: number) {
  return render(
    <ol>
      <ProcessStageRow stage={stage(number)} />
    </ol>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('ProcessStageRow', () => {
  it('shows the stage number, title and owner tag', () => {
    stubIntersectionObserver('immediate');
    renderRow(5);
    expect(screen.getByText('05')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Visual Direction' })).toBeInTheDocument();
    expect(screen.getByText('Included')).toBeInTheDocument();
  });

  it('tags stages the reader decides as "Your decision"', () => {
    stubIntersectionObserver('immediate');
    renderRow(1);
    expect(screen.getByText('Your decision')).toBeInTheDocument();
    expect(screen.queryByText('Included')).not.toBeInTheDocument();
  });

  it('shows the excerpt and links to the full file on main', () => {
    stubIntersectionObserver('immediate');
    renderRow(1);
    expect(screen.getByText(/what can I build with this/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /full file/i })).toHaveAttribute(
      'href',
      'https://github.com/patrickkuei/cyberui-templates/blob/main/docs/superpowers/specs/2026-09-27-cyberui-showcase-design.md'
    );
  });

  it('wraps prose excerpts but lets diagram excerpts scroll', () => {
    stubIntersectionObserver('immediate');
    const prose = renderRow(1);
    expect(prose.container.querySelector('pre')).toHaveClass('code-block-wrap');
    prose.unmount();
    const diagram = renderRow(4);
    expect(diagram.container.querySelector('pre')).not.toHaveClass('code-block-wrap');
  });

  it('states what was not done on stages that have a caveat, and only those', () => {
    stubIntersectionObserver('immediate');
    const withCaveat = renderRow(2);
    expect(screen.getByText('Not done:')).toBeInTheDocument();
    expect(screen.getByText(/No user interviews/)).toBeInTheDocument();
    withCaveat.unmount();
    renderRow(1);
    expect(screen.queryByText('Not done:')).not.toBeInTheDocument();
  });

  it('shows the screenshot for the image stage, with alt text and a source link', () => {
    stubIntersectionObserver('immediate');
    renderRow(7);
    expect(screen.getByAltText(/Home page hero/)).toHaveAttribute('src', './screenshots/home-hero.png');
    expect(screen.getByRole('link', { name: /source/i })).toHaveAttribute(
      'href',
      'https://github.com/patrickkuei/cyberui-templates/blob/main/packages/site/src/components/HeroScene.tsx'
    );
  });

  it('keeps all text in the DOM before the row is revealed, so reveal never changes the layout', () => {
    stubIntersectionObserver('never');
    const { container } = renderRow(1);
    expect(container.querySelector('li')).toHaveAttribute('data-reveal', 'pending');
    expect(screen.getByText(stage(1).summary)).toBeInTheDocument();
    expect(screen.getByText(/what can I build with this/)).toBeInTheDocument();
  });

  it('is revealed in full once the observer reports it in view', () => {
    stubIntersectionObserver('immediate');
    const { container } = renderRow(1);
    expect(container.querySelector('li')).toHaveAttribute('data-reveal', 'full');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd packages/site && pnpm exec vitest run src/components/ProcessStageRow.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `packages/site/src/components/ProcessStageRow.tsx`:

```tsx
import { Badge } from 'cyberui-2045';
import { CodeViewer } from './CodeViewer';
import { OWNER_LABEL, sourceUrl, type ProcessStage } from '../content/processStages';
import { useStageReveal } from '../hooks/useStageReveal';

export interface ProcessStageRowProps {
  stage: ProcessStage;
}

/**
 * One stage of the process: a spine node, a header (number, title, owner
 * tag), then a body (summary, evidence, optional caveat). Renders an <li>;
 * wrap rows in an <ol>.
 *
 * Reveal is opacity-only and driven by data-reveal (see useStageReveal and
 * the .process-stage rules in App.css). Every part is always in the DOM, so
 * text is selectable/searchable and screen readers read all of it.
 *
 * The owner tag is a library Badge. "Included" uses variant="accent", which
 * is cyan only inside .process-act-included (that class scopes --color-accent).
 * "Your decision" uses variant="secondary" with --color-secondary scoped to
 * the muted token in CSS, the same technique TemplateTile uses so a neutral
 * badge never falls back to the library's raw default color.
 */
export function ProcessStageRow({ stage }: ProcessStageRowProps) {
  const { ref, stage: reveal } = useStageReveal<HTMLLIElement>();
  const { evidence } = stage;

  return (
    <li ref={ref} className="process-stage" data-owner={stage.owner} data-reveal={reveal}>
      <span className="process-stage-node" aria-hidden="true" />
      <div className="process-stage-header">
        <span className="process-stage-number">{String(stage.number).padStart(2, '0')}</span>
        <h3>{stage.title}</h3>
        <span className={`process-owner process-owner-${stage.owner}`}>
          <Badge variant={stage.owner === 'library' ? 'accent' : 'secondary'} size="sm">
            {OWNER_LABEL[stage.owner]}
          </Badge>
        </span>
      </div>
      <div className="process-stage-body">
        <p className="process-stage-summary">{stage.summary}</p>
        {evidence.kind === 'excerpt' ? (
          <CodeViewer
            snippets={[
              {
                title: evidence.source.label,
                code: evidence.excerpt,
                sourceHref: sourceUrl(evidence.source.path),
                asOf: evidence.asOf,
                wrap: !evidence.diagram,
              },
            ]}
          />
        ) : (
          <figure className="code-block process-evidence-image">
            <figcaption>{evidence.source.label}</figcaption>
            <img src={evidence.src} alt={evidence.alt} loading="lazy" />
            <p className="code-block-source">
              <a href={sourceUrl(evidence.source.path)} target="_blank" rel="noreferrer">
                Source ↗
              </a>
              {' · '}as of <code>{evidence.asOf}</code>
            </p>
          </figure>
        )}
        {evidence.caveat && (
          <p className="process-stage-caveat">
            <strong>Not done:</strong> {evidence.caveat}
          </p>
        )}
      </div>
    </li>
  );
}
```

- [ ] **Step 4: Append the CSS**

Append to `packages/site/src/App.css`:

```css

/* ---- Process stage row ---- */

.process-stage {
  position: relative;
  padding-left: 2.25rem;
}

/* Spine: a 1px line through each row, running on through the gap to the next. */
.process-stage::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 1.1rem;
  bottom: -2rem;
  width: 1px;
  background: var(--color-border-default);
}

.process-stage:last-child::before {
  display: none;
}

.process-stage-node {
  position: absolute;
  left: 0.125rem;
  top: 0.7rem;
  width: 0.75rem;
  height: 0.75rem;
  transform: rotate(45deg);
  background: var(--color-base);
  border: 1px solid var(--color-muted);
}

.process-stage-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.process-stage-number {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.875rem;
  color: var(--color-muted);
}

.process-stage-header h3 {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-default);
}

/* Neutral "Your decision" badge: Badge variant="secondary" paints itself with
   --color-secondary, so point that at the muted token (see TemplateTile). */
.process-owner-you {
  --color-secondary: var(--color-muted);
}

.process-stage-summary {
  margin: 0.75rem 0 1rem;
  max-width: 68ch;
  color: var(--color-muted);
  line-height: 1.6;
}

.process-stage-caveat {
  margin: 0.75rem 0 0;
  padding-left: 0.75rem;
  border-left: 2px solid var(--color-border-default);
  max-width: 68ch;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--color-muted);
}

.process-evidence-image img {
  display: block;
  max-width: 100%;
  height: auto;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
}

/* Reveal. Opacity only, and every part keeps its height in every state, so
   nothing shifts while the page scrolls. Default (no data-reveal rule
   matches) is fully visible; see useStageReveal. */
.process-stage-node,
.process-stage-header,
.process-stage-body {
  transition: opacity 500ms ease-out;
}

.process-stage[data-reveal='pending'] .process-stage-node,
.process-stage[data-reveal='pending'] .process-stage-header {
  opacity: 0;
}

.process-stage[data-reveal='pending'] .process-stage-body,
.process-stage[data-reveal='header'] .process-stage-body {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .process-stage-node,
  .process-stage-header,
  .process-stage-body {
    transition: none;
  }
}

@media print {
  .process-stage .process-stage-node,
  .process-stage .process-stage-header,
  .process-stage .process-stage-body {
    opacity: 1;
  }
}
```

- [ ] **Step 5: Run the test**

Run: `cd packages/site && pnpm exec vitest run src/components/ProcessStageRow.test.tsx`
Expected: PASS (8 tests).

If "Your decision" or "Included" is matched twice or not at all, check that nothing else on the row renders the same text; the badge is the only place.

- [ ] **Step 6: Commit**

```bash
git add packages/site/src/components/ProcessStageRow.tsx packages/site/src/components/ProcessStageRow.test.tsx packages/site/src/App.css
git commit -m "feat(site): process stage row with spine, owner tag and evidence"
```

---

### Task 6: Assemble the page; retire the old renderers

**Files:**
- Rewrite: `packages/site/src/pages/ProcessPage.tsx`
- Rewrite: `packages/site/src/pages/ProcessPage.test.tsx`
- Delete: `packages/site/src/components/ProcessAct.tsx`, `packages/site/src/components/ProcessActTwo.tsx`, `packages/site/src/hooks/useRevealOnScroll.ts`
- Modify: `packages/site/src/App.css` (remove old process rules, add act rules)

**Interfaces:**
- Consumes: `PROCESS_STAGES`, `groupIntoActs`, `INCLUDED_STAGES`, `TOTAL_STAGES` (Task 1); `ProcessOverview` (Task 4); `ProcessStageRow` (Task 5); `stubIntersectionObserver` (Task 3).
- Produces: `ProcessPage()` (no props), the same export the router already uses (`App.tsx` imports it; do not change `App.tsx`).

- [ ] **Step 1: Write the failing test**

Replace `packages/site/src/pages/ProcessPage.test.tsx`:

```tsx
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ProcessPage } from './ProcessPage';
import { stubIntersectionObserver } from '../test/intersectionObserver';

afterEach(() => vi.unstubAllGlobals());

function actSection(name: string): HTMLElement {
  const section = screen.getByRole('heading', { level: 2, name }).closest('section');
  if (!section) throw new Error(`no section for act "${name}"`);
  return section;
}

describe('ProcessPage', () => {
  it('states the split honestly in its intro, derived from the data', () => {
    stubIntersectionObserver('immediate');
    render(<ProcessPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'How we design' })).toBeInTheDocument();
    expect(screen.getByText(/4 of 10 stages are included in a cyberui-2045 template/)).toBeInTheDocument();
    expect(screen.getByText(/the other 6 remain your decisions/)).toBeInTheDocument();
  });

  it('renders three acts and all ten stages', () => {
    stubIntersectionObserver('immediate');
    render(<ProcessPage />);
    expect(screen.getByRole('heading', { level: 2, name: 'Decisions that come first' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Where the template does the work' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Proving it works' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(10);
  });

  it('puts the stages in their acts', () => {
    stubIntersectionObserver('immediate');
    render(<ProcessPage />);
    // Scoped with within(): stage titles also appear in the overview strip's
    // aria-labels and elsewhere, so unscoped text queries would collide.
    const act1 = within(actSection('Decisions that come first'));
    const act2 = within(actSection('Where the template does the work'));
    const act3 = within(actSection('Proving it works'));
    expect(act1.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Discovery',
      'Research',
      'Information Architecture',
      'Wireframe',
    ]);
    expect(act2.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Visual Direction',
      'Design System',
      'High-Fidelity',
      'Motion & Interaction',
    ]);
    expect(act3.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Prototype & Testing',
      'Handoff',
    ]);
  });

  it('keeps the "Included" tag, and so the accent, inside the included act only', () => {
    stubIntersectionObserver('immediate');
    render(<ProcessPage />);
    const act1 = actSection('Decisions that come first');
    const act2 = actSection('Where the template does the work');
    const act3 = actSection('Proving it works');
    expect(act2).toHaveClass('process-act-included');
    expect(within(act2).getAllByText('Included')).toHaveLength(4);
    expect(within(act2).queryByText('Your decision')).not.toBeInTheDocument();
    for (const act of [act1, act3]) {
      expect(act).not.toHaveClass('process-act-included');
      expect(within(act).queryByText('Included')).not.toBeInTheDocument();
    }
  });

  it('says plainly what was not done on the two stages that have a caveat', () => {
    stubIntersectionObserver('immediate');
    render(<ProcessPage />);
    expect(screen.getAllByText('Not done:')).toHaveLength(2);
  });

  it('shows every stage in full when nothing has been revealed yet (no hidden-forever content)', () => {
    stubIntersectionObserver('never');
    const { container } = render(<ProcessPage />);
    expect(container.querySelectorAll('.process-stage')).toHaveLength(10);
    // Text is in the DOM even though the observers have not fired.
    expect(screen.getByText(/what can I build with this/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd packages/site && pnpm exec vitest run src/pages/ProcessPage.test.tsx`
Expected: FAIL (the old page has none of this).

- [ ] **Step 3: Rewrite the page**

Replace `packages/site/src/pages/ProcessPage.tsx`:

```tsx
import { ProcessOverview } from '../components/ProcessOverview';
import { ProcessStageRow } from '../components/ProcessStageRow';
import { INCLUDED_STAGES, PROCESS_STAGES, TOTAL_STAGES, groupIntoActs } from '../content/processStages';

/**
 * "How we design": the ten stages of making a product, each with the real
 * artifact we produced for it while building this site, and an honest tag
 * for who decides. Acts are derived from the stages' owners (see
 * groupIntoActs); only the included act carries the accent. Design spec:
 * docs/superpowers/specs/2026-10-01-process-page-design.md.
 */
export function ProcessPage() {
  const acts = groupIntoActs(PROCESS_STAGES);
  const intro =
    `${INCLUDED_STAGES} of ${TOTAL_STAGES} stages are included in a cyberui-2045 template; ` +
    `the other ${TOTAL_STAGES - INCLUDED_STAGES} remain your decisions. ` +
    'Each stage below shows what we produced for it while building this site, and says plainly where we produced less.';

  return (
    <div className="process-page">
      <h1>How we design</h1>
      <p className="process-intro">{intro}</p>

      <ProcessOverview stages={PROCESS_STAGES} />

      {acts.map((act) => (
        <section
          key={act.title}
          className={`process-act ${act.owner === 'library' ? 'process-act-included' : 'process-act-yours'}`}
        >
          <h2>{act.title}</h2>
          <p className="process-act-lede">{act.lede}</p>
          <ol className="process-act-stages">
            {act.stages.map((stage) => (
              <ProcessStageRow key={stage.number} stage={stage} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Delete the dead code**

```bash
git rm packages/site/src/components/ProcessAct.tsx packages/site/src/components/ProcessActTwo.tsx packages/site/src/hooks/useRevealOnScroll.ts
```

Then confirm nothing still imports them: use Grep for `ProcessAct\b|ProcessActTwo|useRevealOnScroll` under `packages/site/src`. Expected: no matches.

- [ ] **Step 5: Update the CSS**

In `packages/site/src/App.css`, inside the `/* ---- Process page ---- */` section:

1. Delete these rules entirely: `.process-reveal`, `.process-reveal-visible`, `.process-act-plain .process-act-stages`, `.process-act-plain .process-act-stages h3`, `.process-act-plain .process-act-stages p`.
2. Keep `.process-page`, `.process-intro`, `.process-act h2`, `.process-act-lede` as they are.
3. Append this at the end of the file:

```css

/* ---- Process acts ---- */

.process-act-stages {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* The only place on /process where the accent leaks into the library's own
   tokens: inside the included act, Badge variant="accent" and Badge
   variant="secondary" paint cyan, and the nodes glow (below). */
.process-act-included {
  --color-accent: var(--process-accent);
  --color-secondary: var(--process-accent);
}

.process-act-included .process-stage-node {
  background: var(--process-accent);
  border-color: var(--process-accent);
  box-shadow: 0 0 10px var(--process-accent);
}
```

- [ ] **Step 6: Run the full suite and the typecheck**

Run: `cd packages/site && pnpm exec vitest run && pnpm exec tsc --noEmit`
Expected: all tests PASS (including `App.test.tsx`'s "renders the process page for #/process", which asserts the `How we design` heading), and `tsc` prints nothing.

- [ ] **Step 7: Commit**

```bash
git add -A packages/site
git commit -m "feat(site): rebuild /process as evidence-backed stage rows"
```

---

### Task 7: Excerpt drift check

**Files:**
- Create: `scripts/check-process-excerpts.mjs`
- Test: `scripts/check-process-excerpts.test.mjs`
- Modify: `package.json` (repo root)

**Interfaces:**
- Consumes: the shape of `packages/site/src/content/processEvidence.json` (Task 1): an object keyed by stage number whose values have `kind` (`'excerpt'` or `'image'`), `source.path`, `asOf`, and either `excerpt: string[]` or `src`.
- Produces: `checkEvidence(evidence, repoRoot): string[]` (empty means all good), exported for the test; the file also works as a CLI.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-process-excerpts.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkEvidence } from './check-process-excerpts.mjs';

function fixtureRepo(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'excerpts-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

const excerptEntry = (lines, sourcePath = 'docs/spec.md') => ({
  kind: 'excerpt',
  source: { path: sourcePath, label: 'Spec' },
  asOf: 'abc1234',
  excerpt: lines,
});

test('passes when a multi-line excerpt appears verbatim in its source', () => {
  const root = fixtureRepo({ 'docs/spec.md': 'intro\nline one\n  line two\noutro\n' });
  assert.deepEqual(checkEvidence({ 1: excerptEntry(['line one', '  line two']) }, root), []);
});

test('is not fooled by Windows line endings in the source file', () => {
  const root = fixtureRepo({ 'docs/spec.md': 'intro\r\nline one\r\n  line two\r\noutro\r\n' });
  assert.deepEqual(checkEvidence({ 1: excerptEntry(['line one', '  line two']) }, root), []);
});

test('fails, naming the stage, when the source text has changed', () => {
  const root = fixtureRepo({ 'docs/spec.md': 'intro\nline ONE\n  line two\n' });
  const problems = checkEvidence({ 4: excerptEntry(['line one', '  line two']) }, root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Stage 4/);
  assert.match(problems[0], /docs\/spec\.md/);
  assert.match(problems[0], /asOf/);
});

test('fails when the source file is gone', () => {
  const root = fixtureRepo({});
  const problems = checkEvidence({ 2: excerptEntry(['x']) }, root);
  assert.match(problems[0], /Stage 2/);
  assert.match(problems[0], /does not exist/);
});

test('checks that an image file exists under the site public folder', () => {
  const image = { kind: 'image', source: { path: 'packages/site/x.tsx', label: 'x' }, asOf: 'abc1234', src: './screenshots/a.png', alt: 'a' };
  const missing = checkEvidence({ 7: image }, fixtureRepo({}));
  assert.match(missing[0], /Stage 7/);
  const present = checkEvidence({ 7: image }, fixtureRepo({ 'packages/site/public/screenshots/a.png': 'png' }));
  assert.deepEqual(present, []);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test scripts/check-process-excerpts.test.mjs`
Expected: FAIL (cannot find module `./check-process-excerpts.mjs`).

- [ ] **Step 3: Implement the script**

Create `scripts/check-process-excerpts.mjs`:

```js
#!/usr/bin/env node
// Verifies that every excerpt shown on the /process page still appears
// verbatim in the file it claims to come from, and that the page's image
// evidence exists. Excerpts are copies, and a copy that no longer matches its
// source is a false claim on a page whose whole point is evidence.
//
// Lives at the repo root, not in packages/site, so the site package stays
// self-contained. The data it checks is
// packages/site/src/content/processEvidence.json (plain JSON so this script
// needs no build step).
//
// When it fails: copy the new text from the source file into the JSON
// excerpt (one array entry per line) and set `asOf` to the commit you
// copied it from.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * @param {Record<string, any>} evidence processEvidence.json, parsed
 * @param {string} repoRoot absolute path to the repository root
 * @returns {string[]} one human-readable problem per failure; empty when all is well
 */
export function checkEvidence(evidence, repoRoot) {
  const problems = [];
  for (const [stage, item] of Object.entries(evidence)) {
    if (item.kind === 'image') {
      const file = path.join(repoRoot, 'packages', 'site', 'public', item.src.replace(/^\.\//, ''));
      if (!existsSync(file)) problems.push(`Stage ${stage}: image ${item.src} not found at ${file}`);
      continue;
    }
    const sourceFile = path.join(repoRoot, item.source.path);
    if (!existsSync(sourceFile)) {
      problems.push(`Stage ${stage}: source file ${item.source.path} does not exist`);
      continue;
    }
    // Checkouts on Windows may have CRLF line endings; the JSON never does.
    const source = readFileSync(sourceFile, 'utf8').replace(/\r\n/g, '\n');
    if (!source.includes(item.excerpt.join('\n'))) {
      problems.push(
        `Stage ${stage}: excerpt no longer appears verbatim in ${item.source.path} (taken as of ${item.asOf}). ` +
          'Refresh it in packages/site/src/content/processEvidence.json and update asOf.'
      );
    }
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const evidenceFile = path.join(repoRoot, 'packages', 'site', 'src', 'content', 'processEvidence.json');
  const evidence = JSON.parse(readFileSync(evidenceFile, 'utf8'));
  const problems = checkEvidence(evidence, repoRoot);
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`process evidence OK (${Object.keys(evidence).length} stages checked)`);
}
```

- [ ] **Step 4: Add the root scripts**

In the root `package.json`, add a `scripts` block (after `"license"`):

```json
  "scripts": {
    "check:process-excerpts": "node scripts/check-process-excerpts.mjs",
    "test:scripts": "node --test scripts/check-process-excerpts.test.mjs"
  },
```

- [ ] **Step 5: Run the tests**

Run: `pnpm run test:scripts`
Expected: PASS (5 tests).

- [ ] **Step 6: Run the real check against the real data**

Run: `pnpm run check:process-excerpts`
Expected: the stage 7 image is not committed yet (Task 8), so this prints exactly one problem, `Stage 7: image ./screenshots/home-hero.png not found ...`, and exits 1. **Every other stage must pass.** If any other stage is reported, you mistranscribed that excerpt in Task 1: replace its lines in `processEvidence.json` with the exact lines from the source file (`sed -n 'START,ENDp' <file>`), rerun, and amend nothing else.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-process-excerpts.mjs scripts/check-process-excerpts.test.mjs package.json
git commit -m "chore: check that /process excerpts still match their source files"
```

If Step 6 made you edit `processEvidence.json`, include it: `git add packages/site/src/content/processEvidence.json` before committing.

---

### Task 8: Capture the Home hero screenshot (stage 7 evidence)

**Files:**
- Create: `packages/site/public/screenshots/home-hero.png` (binary)

Not a TDD task: it adds a committed static asset, like the monitoring screenshot. No source changes. The check in Task 7 is its test.

- [ ] **Step 1: Start the dev server**

```bash
pnpm --filter cyberui-templates-site run dev
```

Expected: serving on `http://localhost:5173` (or the next free port; use whatever the terminal prints below).

- [ ] **Step 2: Capture from a scratch directory outside the repo**

This is a one-off local tool run, not a project dependency (see Global Constraints).

```bash
SHOT_DIR="$(mktemp -d)" && cd "$SHOT_DIR" && npm init -y >/dev/null && npm install playwright@1.63.0 && npx playwright install chromium
```

Write `capture.mjs` in that directory:

```js
import { chromium } from 'playwright';

const [, , url, out] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(url);
await page.waitForSelector('.hero');
// The hero "develops" from blur on load; wait for it to settle.
await page.waitForTimeout(3000);
await page.locator('.hero').screenshot({ path: out });
await browser.close();
```

Run it (replace the port if different):

```bash
node capture.mjs "http://localhost:5173/#/" home-hero.png
```

- [ ] **Step 3: Move it into the repo and look at it**

```bash
mv home-hero.png <repo>/packages/site/public/screenshots/home-hero.png
```

Open the image. It must show the cyan halftone glow behind the headline "Built by AI. Ready for yours.", fully developed (not blurred or blank). If it is blurred or empty, increase the wait and recapture. Keep the file under about 500 KB; if larger, recapture at the same viewport and let it be.

- [ ] **Step 4: Run the excerpt check**

Run: `pnpm run check:process-excerpts`
Expected: `process evidence OK (10 stages checked)`.

- [ ] **Step 5: Commit**

```bash
git add packages/site/public/screenshots/home-hero.png
git commit -m "chore(site): add Home hero screenshot as stage 7 evidence"
```

---

### Task 9: Spec amendment and final verification

**Files:**
- Modify: `docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md` (add one amendment note)

- [ ] **Step 1: Record the spec amendment**

In `docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md`, directly below the existing `> **Naming amendment (2026-10-01):** ...` block, add:

```markdown
> **Process page amendment (2026-10-01):** the `/process` page was redesigned after this spec was written, and no longer uses cyberui's `Timeline` component (its `description` is string-only and it has no neutral status; see patrickkuei/CyberUI#60). Each stage now carries a real artifact from this repo and an owner tag. See [2026-10-01-process-page-design.md](2026-10-01-process-page-design.md). The "Process (`/process`)" and "Process page" bullets below describe the original design and are kept as a record.
```

- [ ] **Step 2: Run everything**

```bash
cd packages/site && pnpm exec vitest run && pnpm exec tsc --noEmit && pnpm run build
cd ../.. && pnpm run test:scripts && pnpm run check:process-excerpts
```

Expected: all site tests PASS; `tsc` and the build clean; script tests PASS; `process evidence OK (10 stages checked)`.

- [ ] **Step 3: Confirm no dead code or stale references remain**

Use Grep under `packages/site/src` for `ACT_1|ACT_2|ACT_3|process-act-plain|process-act-glow|process-reveal`. Expected: no matches.

- [ ] **Step 4: Manual visual check (needs a human; happy-dom has no layout)**

Start `pnpm --filter cyberui-templates-site run dev`, open `http://localhost:5173/#/process`, and check:

1. **Desktop (about 1280px):** the strip shows 10 segments with 5 to 8 filled cyan; only Act 2 has cyan nodes, a glow and cyan "Included" tags; Acts 1 and 3 have hollow neutral nodes and grey "Your decision" tags. Confirm the grey tag reads as a quiet label, not a loud button. If it is too loud, make `.process-owner-you` use a plain bordered span instead of `Badge`.
2. **Scrolling down:** each row's header and node fade in as it rises into view, then its summary and evidence fade in; nothing jumps or shifts.
3. **Phone width (375px, DevTools device mode):** the strip wraps to two rows; the page never scrolls sideways; the stage 3 and 4 diagrams scroll inside their own block; prose excerpts wrap.
4. **Reduced motion:** DevTools, Rendering, "Emulate CSS prefers-reduced-motion: reduce", reload. Every row is fully visible immediately, no fades.
5. **Print preview:** everything is visible.
6. Click a "Full file" link: it opens the file on GitHub in a new tab.

Report anything that fails with a screenshot; do not paper over it.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-09-30-showcase-hub-redesign-design.md
git commit -m "docs: amend hub spec, /process no longer uses Timeline"
```

- [ ] **Step 6: Hand off**

Use superpowers:finishing-a-development-branch to decide how to integrate `polish/process-page` (the repo's convention is a PR per branch). Include in the PR description: the link to the spec, that the stage 9 visual check in Step 4 was done by a human, and that issue patrickkuei/CyberUI#60 tracks the `Timeline` limitations.
