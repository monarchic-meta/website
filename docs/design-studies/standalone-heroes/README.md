# Standalone source hero openings

These credited recreations expand the earlier
[bounded graphic studies](../hero-recreation-complete-handoff.md) into complete
opening compositions. Each HERO-001–018 belongs on its own regular Framer Web
page, with an explicit Phone treatment. The existing grouped Design boards
remain comparison material. Web collection indexes contain links rather than
mounting several heroes together.

Use the [source review](../../design-inspiration/heroes.md) to distinguish the
owner's selected revision from a site's current live design. A recreation
retains its creator, source links and fidelity notes under **Source inspiration**.
New code or native authorship does not turn a source composition into an original.

## Composition contract

The `native/HERO-xxx.json` recipes describe editable frames, shapes, text and
named groups. Each records its opening dimensions, Phone overrides, source
credit and intentional differences. Preserve their part order and responsive
inheritance. Place attribution and implementation notes below the opening.

For photographic apertures, use the separately credited source stills recorded
in the media provenance. Keep surrounding type, grids, framing and graphics
editable. A source photograph can be an asset; an entire screenshot must not
replace a reconstructed opening. A still from a film remains a still and must
not be reported as a recreated animation.

Procedural slots use the additive
[SourceHeroPageStudy component](../code-components/SourceHeroPageStudy.tsx):

| Source | Live mechanism |
| --- | --- |
| HERO-001 — Type Face | Surface writing on a credited head-geometry stand-in. |
| HERO-006 — Mac Moss Studio | Twenty source glyph cells reconstructed as animated vector contours. |
| HERO-007 — Cantor8 | A curved filament field with boundary nodes. |
| HERO-009 — Vercel | A dark triangle with moving light and halo. |
| HERO-014 — Unbelievably Crap | A raster portrait and red surface bars. |
| HERO-015 — MECHA | The credited source mark's crease geometry. |
| HERO-016 — Origin | A compact moving light tile inside native typography. |

The component supplies artwork rather than a full-page template. Its logical
dimensions and controls must match the native slot; stretching an unrelated
render does not establish the source's proportions. Native source navigation,
typography, negative space and media placement complete the opening. Origin's
playback control belongs below its small tile. Hide review labels where they
would introduce graphics absent from the source.

## Playback and verification

Canvas motion defaults off. Explicit editor opt-in is separate from Preview
animation; exports and thumbnails stay frozen. The existing shared coordinator
retains its per-window resource limits and resolution-aware still cache.

Verify the saved editor after a reload, then inspect Desktop and Phone Preview
for the complete opening, readable copy, source attribution, image crops and
working procedural playback. Native section links need an actual Preview click,
not just a stored URL. Preserve all prior Design boards and source files while
adding these pages. The [Framer workflow](../../framer-prototyping.md) governs
manual handoff to implementation.
