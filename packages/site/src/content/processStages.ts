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
      'The code is the handoff. The implementation plan, linked here, and the design spec behind it were given to the agents that built the site, and the work shipped as 14 reviewed pull requests (#13 to #26). With cyberui-2045 components there is no separate specification to translate into code.',
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
