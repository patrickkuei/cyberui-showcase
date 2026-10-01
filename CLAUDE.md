# cyberui-templates — working notes for Claude

This file is for whoever (human or Claude) is developing *in this repo*. It
never ships to an end user: each `packages/*` template is designed to be forked
out on its own (e.g. via `npx tiged`), and this file stays behind at the
repo root when that happens. It is not the documentation a forker sees.

**What a forker actually sees is the template package's own source** — its
README and its in-code comments. That's the only documentation that
travels with a fork. So when you change a template package, the comment you'd
normally skip because "the user already has this conversation for
context" is exactly the comment a forker's AI assistant won't have. Write
it into the code, not just into your reply to the person driving this
session.

## What's worth commenting in a template package

Not everything — keep the default discipline (comment WHY, not WHAT, only
when a reader would otherwise be surprised). In a forkable template, "a reader"
includes someone who has never seen this conversation. Concretely, that
raises the bar for:

- **Library behavior that isn't obvious from the type signature** — e.g.
  cyberui-2045's `Card` renders no `<h3>` at all when `title` is omitted
  (not an empty one). A prop's own JSDoc is the right place for this, not
  every call site.
- **A pattern meant to be copied** — e.g. `useHashRoute.ts`'s
  `ROUTES = [...] as const` → `Route = (typeof ROUTES)[number]`, or
  `App.tsx`'s `Record<Route, ...>` maps, which make adding a route without
  wiring its label/page a compile error instead of a silent gap. Someone
  adding a 5th page needs to know this trick exists before they reach for
  an `if/else` chain instead.
- **A shared low-level helper's contract** — e.g. `chartColors.ts`'s
  `chartTooltipProps`/`useChartColors`: any new Recharts chart should read
  colors from there, not hardcode hex values, and the `cursor` field exists
  specifically because Recharts' BarChart tooltip defaults to an unstyled
  `#ccc` box that clashes with a dark theme.
- **A recurring test-fragility trap specific to composing this library** —
  reusing a table/chart/component across pages tends to duplicate visible
  text (a stat label vs. a column header, a chart tick vs. a table cell).
  This repo's fix every time has been to scope the RTL query with
  `within(...)`, never to rename text or weaken the assertion. Worth a
  one-line comment at the *first* new collision in a file, not repeated
  everywhere.
- **A deliberately mock/simulated behavior** — anything that isn't real
  (mock buttons, simulated data, illustrative-only figures) should say so
  where a forker would otherwise think it's live, matching the honesty
  standard already set in `packages/monitoring/README.md`.

## Don't do this

- Don't turn this into a doc-generation exercise — most of the code in
  this repo is already commented at the right density; re-read before
  assuming a gap exists.
- Don't put this file's own content into a template package's `CLAUDE.md` —
  template packages don't get one. Their documentation is their README plus
  their source comments.
- Don't add a skill or process file to a template package for the same reason:
  it's dead weight to anyone who forks the package without this repo's
  tooling.

## Repo structure

- `packages/<name>/` — one standalone, independently forkable template app per
  cyberui-2045 use case. Each stays self-contained: no `workspace:` ranges,
  no imports outside its own package.
- `docs/superpowers/plans/` — implementation plans for work done via the
  subagent-driven-development skill. Historical record of *this repo's*
  development, not part of any template package.
