# Native source recreations

Sixteen source-led graphic studies for the [Framer visual kitchen](../../framer-moodboard.md).
They recreate selected observed motifs as native Framer frames and text on
1600 × 1000 artboards. Their named parts can be selected, moved, recolored,
resized, or regrouped individually. They contain no embedded SVG or raster
artwork. All 16 saved studies were confirmed in the Framer editor and remained
after a reload. The [manifest](manifest.json) records their saved Framer node IDs
and native layer counts.

These **RE-01–16** studies belong in **Source inspiration**, alongside the
comparison library. They are recreations of credited source work, not Monarchic
original compositions or approved branding. They add to the earlier **24 MB
asset studies**: 23 independent compositions and the MB-23 source-led adaptation.
Those asset files and the existing website prototypes are preserved.

## Recipes and credits

The accounts below are posting accounts. Each linked source key resolves to the
exact post represented in the [source index](../moodboard/references.json).
Suffixes such as `GRA-001-03` distinguish posts under the stable catalog ID;
they do not create new stable references.

| Recipe | Source key / posting account | Named native parts |
| --- | --- | --- |
| [RE-01 Finding signal](re-01-finding-signal.mjs) | [GRA-001-03](https://x.com/tdeser/status/2102051003574911054) / @tdeser | Orange band, staggered headlines, rules, microtype |
| [RE-02 Bracket SP-1](re-02-bracket-sp1.mjs) | [GRA-002-03](https://x.com/kyleanthony/status/2098567618605003090) / @kyleanthony | Rounded letter strokes, bracket counters, eight-dot loader |
| [RE-03 Stepped N](re-03-stepped-n.mjs) | [GRA-003](https://x.com/kyleanthony/status/2104541893728350394) / @kyleanthony | Stair bands, mark sizes, source wordmark, construction rules |
| [RE-04 Colored edge tiles](re-04-colored-edge-tiles.mjs) | [GRA-004](https://x.com/ayushsoni_io/status/2095474754165867000) / @ayushsoni_io | Tile families, colored rails, source statement |
| [RE-05 Wireframe petals](re-05-wireframe-petals.mjs) | [GRA-005](https://x.com/MoizArshi29/status/2097998312331001947) / @MoizArshi29 | Ellipse families, crosshair, circle/diamond detail, colored nodes |
| [RE-06 Dot-matrix event](re-06-dot-matrix-event.mjs) | [GRA-006](https://x.com/_zuji/status/2100138045404319993) / @_zuji | Glyph dots, vertical event columns, coordinate strip |
| [RE-07 Halftone cubes](re-07-halftone-stair-cubes.mjs) | [GRA-007](https://x.com/LouiseVisual/status/2094010373934338106) / @LouiseVisual | Five cube groups, skewed faces, individual halftone dots |
| [RE-08 Cyan pixel flower](re-08-cyan-pixel-flower.mjs) | [GRA-008](https://x.com/Skirook/status/2092866327828627927) / @Skirook | Ten petal pixel families, hub pixels, curved stem |
| [RE-09 Orange ticket](re-09-orange-ticket.mjs) | [GRA-009](https://x.com/designbyaron/status/2099928493119152212) / @designbyaron | Diagonal ticket, source typography, icon row, visual barcode |
| [RE-10 ICHOR technical strip](re-10-ichor-technical-strip.mjs) | [GRA-010](https://x.com/notgauze/status/2100124489296368084) / @notgauze | Registration crosses, lime accent, bent bar, cropped lettering |
| [RE-11 Burgundy dot report](re-11-burgundy-dot-report.mjs) | [GRA-013](https://x.com/olegcoada/status/2102734075606020172) / @olegcoada | Dot-matrix figure, faint grid, report lettering |
| [RE-12 Orbital reticle](re-12-orbital-reticle.mjs) | [WEB-001](https://x.com/kyleanthony/status/2102373344519586084) / @kyleanthony | Circular reticle, radial ticks, bracket, spectral bands |
| [RE-13 Hatched registration frame](re-13-hatched-registration-frame.mjs) | [WEB-004](https://x.com/shivangshah_/status/2098007256218714207) / @shivangshah_ | Grid, hatched bands, registration marks, inset type |
| [RE-14 Cobalt radial dither](re-14-cobalt-radial-dither.mjs) | [WEB-006](https://x.com/praveenisomer/status/2107433191036326234) / @praveenisomer | Radial pixel/bar cloud with coarse editable sampling |
| [RE-15 Orange raster cubes](re-15-orange-raster-cubes.mjs) | [WEB-007](https://x.com/oguzyagizkara/status/2100171221493027080) / @oguzyagizkara | Three sliced cubes, connectors, coordinate tags |
| [RE-16 Satto circle S](re-16-satto-circle-s.mjs) | [WEB-012](https://x.com/Satto_studio/status/2094148642168832020) / @Satto_studio | Fifteen-circle S, scattered source text clusters |

## Edit and hand off

In Framer, expand a study's named groups in Layers and edit its component parts.
Keep source keys, posting-account credits, and simplification notes with
duplicates. Source wording, identities, and metrics inside the artwork belong
to the reference; they do not become Monarchic product claims.

Each `.mjs` exports its ID, name, source key, background, simplification notes,
and `build(h)` construction. The notes identify reduced mesh or dot density,
font substitutions, static motion frames, omitted textures, and intentional
cropping. [recipe-tools.mjs](recipe-tools.mjs) compiles the manual authoring
recipes into native Framer layer descriptions.

These files are authoring and handoff sources, not site runtime components or
automatic Framer synchronization. Changes in either direction require an
explicit manual authoring step under the [Framer workflow](../../framer-prototyping.md).
