# Original Monarchic hero candidates

These nine independently composed openings follow the completed
[eighteen source recreations](../hero-recreation-complete-handoff.md). They are
**Original compositions**: six family explorations precede three syntheses.
The [homepage brief](../../homepage-creative-brief.md) governs identity, restrained
claims, gradual depth and ordinary scrolling after the opening.

All nine Desktop and Phone native compositions have been reviewed locally with
actual code-generated artwork. That review uses fallback font metrics and does
not establish a Framer save, working Framer animation or final typography. Final
placement, source hashes and actual verification belong to the separate manifest
and handoff for this round.

| ID / recipe | Family / live mode | Whole-opening idea |
| --- | --- | --- |
| [OH-001](native/OH-001.json) — Counterfield | Information field / `counterfield` | Fine information currents surround a broad upper reading interval on deep olive black; native type crosses the field. |
| [OH-002](native/OH-002.json) — Context atlas | Information field / `atlas` | A cobalt ribbon crosses warm paper above a low, monumental company name and an offset introductory window. |
| [OH-003](native/OH-003.json) — Axial identity | Geometric identity / `axial` | The existing owned mark occupies the center; native Research and Development frame opposing edges in monochrome. |
| [OH-004](native/OH-004.json) — Room for systems | Geometric identity / `fold` | An acid native title plane cuts diagonally through an original pale fold on cobalt, interleaving type and geometry. |
| [OH-005](native/OH-005.json) — Questions become work | Research montage / `palimpsest` | Original geometric specimens interleave above and below a native horizontal reading cut. |
| [OH-006](native/OH-006.json) — Research takes shape | Research montage / `assemblage` | A vermilion block montage is framed by large words at opposing edges, with clipped ivory and cobalt planes. |
| [OH-007](native/OH-007.json) — Systems in the making | Synthesis / `counterfold` | Information material, a folded identity gesture and editorial cuts open around a central native statement. |
| [OH-008](native/OH-008.json) — Monarchic in orbit | Synthesis / `indexorbit` | Staggered MON / ARCHIC type interrupts a cobalt orbital assembly and changing information grains. |
| [OH-009](native/OH-009.json) — A wider view | Synthesis / `researchfield` | An original changing assembly carries information material inside an editorial field, with the statement on the lower fold. |

The geometry and layouts are independent arrangements. HERO influence IDs record
lessons about density, material, scale, crop and revelation; they do not import
source compositions, wording or assets. OH-003 and OH-008 use Monarchic's
existing canonical mark and retain its source path and
hash. The mark itself is not newly authored. No foreign mark or head/brain mesh
is part of this round.

Montage means generated graphic specimens and their relationships. These studies
contain no fake research papers, invented charts, benchmark values, customer
claims or depictions of live operations. The review footer identifies the work
as original visual metaphor outside the hero. The small R&D strip links selected
existing RepoIntel and ExplicitMem material without a latest-release claim.

## Native and live layers

[mode-contract.json](mode-contract.json) records four separate Design families
and four responsive Web playgrounds: Information fields, Geometric identity,
Research montage and Synthesis. Keep these collections separate; do not mount
all nine openings together in one large board.

Each desktop opening is **1200 × 850**, centered in a same-background 1440px Web
viewport. Its opaque live artwork is **960 × 600** at `(120, 112)`, with an
identical background so the component boundary disappears. Native typography,
crop rules and quiet reading veils extend beyond that field. The nine native
arrangements deliberately differ; the live slot is not a bordered image card.

Phone is an explicit **351 × 700** composition inside the 390px viewport, with
**351 × 440** artwork at `(0, 104)`. Each native part supplies its own `phone`
attribute differences. The Framer adapter must apply them to actual inherited
`$originalId` matches, preserving responsive inheritance rather than inventing
compound node IDs or uniformly scaling desktop type.

`parts` order is authoritative. The sole `LiveArtSlot` becomes a registered
`OriginalHeroStudy` instance. Earlier native parts remain behind it; later parts
overlay it. No rendered headline, body copy or UI label belongs in the code
artwork. `artwork.quietZones` describes the corresponding desktop/phone reading
intervals for the procedural renderer; masks and type must not hide its focal
form. Actual composite review remains necessary.

Each `artwork.instanceProps` records all sixteen source-defined controls,
including its mode, `customColors: true`, explicit background/primary/ink/accent
colors, Preview animation, Canvas motion off and visible playback controls.
Confirm the defaults against the fresh registered schema before placement.
OH-004 uses dark ink inside the pale folded geometry while
its separate native typography is light on cobalt. Keep native copy colors and
artwork palette roles distinct.

The code component retains the existing motion/resource contract. Canvas motion
is an explicit editor-only opt-in; Preview is checked separately. Exports and
thumbnails stay frozen. No animation completion, waiting period or captured
scroll is required to continue below the opening. The quiet header establishes
R&D identity; full authentication, dropdown, search and menu behavior is outside
this hero-only round.

## Local composition preview

The [preview helper](render-native-previews.mjs) writes SVG/HTML inspection aids
outside the repository. It has no Framer connection and uses fallback font
metrics. It can composite separately rendered local PNGs from the actual code
component using a JSON image map:

```json
{
  "OH-001": {
    "desktop": "/absolute/path/counterfield-desktop.png",
    "phone": "/absolute/path/counterfield-phone.png"
  }
}
```

```sh
nix develop --command node docs/design-studies/original-heroes/render-native-previews.mjs \
  --images /absolute/path/images.json \
  --output /absolute/path/composition-previews
```

Without `--images`, the result is explicitly native-only, with no substitute
artwork. These SVGs are not imported as the Framer design. Review actual
composites and then the saved Framer editor for font resolution, visible
artwork, headline clearance, source/influence footer, Phone layout and playback.
