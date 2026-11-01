# Original hero openings — round two

This round responds to the owner's review of [round one](../original-heroes/README.md):
the three directions need visibly different structures before they are combined.
Each recipe describes one complete hero for its own regular Framer Web page.
The earlier Design boards remain available for comparison.

| Recipe | Direction | Composition |
| --- | --- | --- |
| [OH-010 — Pathfield](native/OH-010.json) | Information field | A spatial writing environment with depth, parallax and distinct semantic anchors. |
| [OH-011 — Concordance](native/OH-011.json) | Information field | A dense, flat field of prose with a large reading interval cut through it. |
| [OH-012 — Axial Passage](native/OH-012.json) | Geometric identity | A solid monochrome Monarchic mark with depth and movement along its own diagonal axis. |
| [OH-013 — Letterform Engine](native/OH-013.json) | Geometric identity | Architectural lettering built from moving modules on vermilion. |
| [OH-014 — Report Cuts](native/OH-014.json) | Research montage | Large, rotated fragments of actual report copy, question counts and limitations. |
| [OH-015 — Research Film](native/OH-015.json) | Research montage | A dithered edit combining an architecture crop, a question table and a limitations excerpt. |
| [OH-016 — Semantic Aperture](native/OH-016.json) | Information + geometry | Workflow writing occupies an oversized owned-mark aperture on cobalt. |
| [OH-017 — Format Press](native/OH-017.json) | Geometry + montage | A monumental M exposes moving report and table fragments. |
| [OH-018 — Field Transmission](native/OH-018.json) | Combined direction | Writing, a smaller owned mark, a report crop and an architecture diagram cross an editorial identity seam. |

The first six compositions were compared in grayscale and on Phone before the
three combinations were developed. Color supplements their different density,
scale, material and motion. Their influence IDs refer to the
[source hero catalog](../hero-recreations.md), not imported source layouts.

## Editable composition and procedural artwork

The [self-contained component](../code-components/OriginalHeroRoundTwo.tsx)
generates the moving artwork. Native Framer layers carry company identity,
navigation, main copy and review credits. Each recipe has explicit Desktop and
Phone attributes; Phone is not a scaled desktop screenshot. Its `LiveArtSlot`
must be replaced with the registered component and the recipe's exact controls.
Keep the recipe's layer order when placing native overlays.

Preview motion, Pause/Play and pointer effects require separate checks from
editor Canvas motion. Canvas motion defaults off; exports and thumbnails stay
frozen. The shared resource coordinator limits simultaneous rendering and
refreshes still quality after zooming. A collection index should link to these
pages without mounting their artwork.

## Research material

The writing and fragments derive from the repository's product vocabulary,
[ExplicitMem benchmark](../../../src/lib/explicitmemBenchmark.ts) and
[SystemField diagram](../../../src/components/SystemField.astro). The diagram
is an architecture model, not a recording of live operations. The report crops
are newly typeset compositions of existing text and counts; they do not depict
additional publications or imply a combined evaluation result. The review
footer retains this scope and the underlying source paths.

OH-012, OH-016 and OH-018 use the existing Monarchic mark. The mark's authorship
is unchanged. These original arrangements contain no foreign identity assets.
Source recreations remain credited under **Source inspiration**.

Regenerate the nine native recipes with
`nix develop --command pnpm run build:original-hero-round-two`. This local
authoring command binds them to the current component source; it makes no Framer
calls. Reinspect the composites and manually apply any intended changes.
