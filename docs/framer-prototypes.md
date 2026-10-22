# Framer homepage explorations

First pass created **2026-10-22** in the
[Monarchic Framer project](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt).
These are editable visual prototypes for comparing directions. The
[manual Framer workflow](framer-prototyping.md) still governs conversion to or
from the Astro/Svelte site; no implementation or release is implied.

Continue with [round two](framer-visual-round-two.md) for additional homepage
directions and a separate gallery of original graphic studies.

## Concepts

| Direction | Framer page | Breakpoints | References |
| --- | --- | --- | --- |
| 01 System / Spec | [Home](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=augiA20Il), `/` | [Desktop 1440px](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=WQLkyLRf1); [Phone 390px](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=S9RH_u8O1) | WEB-001, WEB-002, GRA-001, GRA-005 |
| 02 Signal / Field | [Draft page](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=WJkUf4nHH), `/prototypes/signal-field` | [Desktop 1440px](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=zFHratdNU); [Phone 390px](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=EF5JEBjPn) | WEB-003, WEB-005, WEB-006, GRA-007, GRA-008, ART-001 |
| 03 Research / Edition | [Draft page](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=FNWmJvk0a), `/prototypes/research-edition` | [Desktop 1440px](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=ORSC5FXWx); [Phone 390px](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=MVQSVCzZe) | GRA-001, GRA-002, GRA-007, SITE-002, WEB-010, WEB-011 |

Reference IDs resolve through the [design inspiration catalog](design-inspiration.md).

### 01 System / Spec

The starting recommendation for structure: an off-white engineering sheet,
bordered navigation cells, an oversized statement with an explanatory sidecar,
and an original yellow wireframe lattice on black. Ruled product columns,
a yellow development band, and public-record links complete the page.

Adapted traits: WEB-001/002's specification hierarchy and borders, GRA-001's type
scale, and GRA-005's restrained technical illustration. Phone layout stacks
the statement, explanation, actions, diagram, and registers.

### 02 Signal / Field

A dark editorial cover pairs large warm-white type with an original yellow dot
form. A light product register changes the rhythm below it; research and
development appear as distinct panels before the footer.

Adapted traits: WEB-003/005's diagram presence, WEB-006's digital image treatment,
and GRA-007/008's raster-like texture. The illustration uses native dot layers in
Framer. The dense dot layer tree is a visual study; choose an appropriate asset
or rendering approach during a manual handoff. Phone layout places copy and
actions before the artwork. Any motion remains to be designed.

### 03 Research / Edition

A paper-led Swiss editorial direction: a large Monarchic masthead, unboxed
navigation, a principle statement, a ruled capability index, and a yellow
research spread with an original geometric study. Typography and negative space
carry the composition.

Adapted traits: GRA-001's editorial hierarchy, SITE-002's information structure,
and the catalog's composition and print studies. The premise is accountable
execution: a person should be able to assign a job and review the result.

## Shared content and visual choices

- Space Grotesk for primary typography; IBM Plex Mono for supporting labels.
- Warm paper `#f2f0e8`, ink `#080808`, and signal yellow `#ffd21a`, with restrained
  gray surfaces and rules. Reusable Framer styles are named under `Prototype`.
- Copy and product roles come from the implemented homepage and public catalog.
  The **17 available hosted MCPs** label is a static snapshot checked on
  2026-10-22, not a synchronized product feed.
- RepoIntel, ExplicitMem, and ReleaseOps are the selected product examples.
  Long-running Monarchic workflows are explicitly **in development**.
- Research links lead to ExplicitMem's published methods and results. No general
  accuracy, customer, adoption, or live telemetry claim was invented.
- Prototype actions use absolute links to existing public pages. Those
  destinations are outside these three Framer explorations; interior product
  pages and app flows have not been prototyped here.

## Review and handoff

Desktop 1440px and Phone 390px screenshots were visually reviewed on 2026-10-22.
The first pass corrected navigation sizing, button clipping, phone heading
wrapping, and footer wrapping. Live preview spot checks covered all three
concepts at 390px and Signal / Field at 1440px; action destinations were
inspected in the rendered previews. Supporting labels are intentionally small;
mobile pacing and the relative emphasis on artwork versus products remain
design decisions for the next iteration.

Before using a concept for implementation, select the direction and record the
exact affected nodes, target routes, intermediate widths, keyboard/focus/hover
states, and any motion or reduced-motion behavior. This pass does not establish
accessibility or performance conformance. Framer's existing Home retains its
page identity; the two alternate pages are drafts. Nothing was published.

Initial creation used the configured Framer MCP. Later MCP edit calls stopped
responding, so the remaining prototypes and refinements were completed through
Framer's editor agent. Check live project access before the next MCP editing
session.

The diagrams are original prototype artwork. Use the selected composition and
visual principles when implementing; the Framer layer tree is not a generated
source contract. Source code, product data, pricing, and deployment stay under
their existing repository workflows.
