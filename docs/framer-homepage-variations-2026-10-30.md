# Homepage variations — Signal Loom, Vermilion Index and Cold Archive

Authoring brief recorded **2026-10-30**. The owner likes
[Black Instrument and Open Edition](framer-homepage-explorations-2026-10-30.md)
and requested more homepage prototypes within the established language, with a
different treatment in each. These three drafts continue that exploration;
they do not reset the visual direction or establish final style and copy.

The three unpublished drafts are saved in Framer. Actual Desktop and Phone
Preview inspection confirmed the artwork, readable content and mobile header
behavior after an editor reload. Follow the
[manual Framer workflow](framer-prototyping.md); these remain visual explorations,
with owner selection and production implementation ahead.

## Shared story and content

Keep the [homepage journey](homepage-creative-brief.md): identity and vision,
the four tangible problems, featured products, broad Solutions, selected
developments, Research Highlights, then Explore More and the comprehensive
footer. Preserve the distinction between research and development throughout.

The native geometry is retained in
[artwork-recipes.mjs](design-studies/homepages/artwork-recipes.mjs).
`buildSignalLoom()` and `buildVermilionIndex()` return the editable parts used in
the authoring recipes. The module has no Framer connection or site-runtime
integration; importing the returned geometry remains a manual prototype step.

The four problems concern decomposition, alignment with intent, context/memory,
and verifying that the result satisfies the request. Present these as failure
modes AI systems can encounter. Do not imply that every product resolves all
four, or that Monarchic's developing long-running workflows are finished.

Retain the previous drafts' qualified factual selections. RepoIntel and
ExplicitMem are illustrative featured products, not owner-designated flagships.
BrowserOps and ReleaseOps are selected available-product examples, without
unverified release dates or claims that they are newest. Research findings keep
their individual method and evaluation limits. No new metrics, superiority
claims, customers, taxonomy, pricing or commercial promises are introduced.

## Signal Loom

Signal Loom clones the completed Black Instrument page at
`/prototypes/homepage-signal-loom`. Charcoal `#101010`, acid `#D9FF72`, warm white
`#EEEEE8` and dark olive `#283024` support an asymmetrical title and a broad,
unframed graphic field. Replace the clone's machined-logo hero with native
artwork rather than retaining the same left-copy/right-square composition.

The `signal-loom-geometry.json` recipe defines a **512×352** original zigzag
ribbon across three angular faces. It contains **313 individually editable
13px square marks on a 14px pitch**. A **4×4 Bayer ordered distribution between
adjacent palette tones** represents intermediate tones across the folds. This
deliberately authored palette distribution supports the ordered-dithering
description; an ordinary dot lattice alone would not. The long, uneven open
silhouette differs from Open Edition's closed counterform. It is a static native
construction, not a shader or a measured system visualization.

Reference traits: **GRA-008** supplies dimensional pixel light, **WEB-005** the
relationship between large type and a broad spatial field, and **GRA-011**
decomposition. These inform an independent composition, not a recreation of
their imagery or layout. Keep the marks and face groups selectable and named.

## Vermilion Index

Vermilion Index uses the completed Black Instrument structure at
`/prototypes/homepage-vermilion-index`. Warm cream `#EEE8DC`, charcoal `#17171B`
and vermilion `#E94E2A` support staggered poster-scale type and an optical graphic
crossing the lower hero edge. The inherited black navigation and lime action
remain a shared brand constant across this round. Body chapters can alternate
ruled entries and broad editorial spreads.

The `vermilion-index-geometry.json` recipe defines a **640×380** native optical
construction with **50 outlined ellipses** in two clipped, rotated plates:

- Plate A: `(24, 24, 400, 280)`, rotated −12°, with 28 concentric outlines.
- Plate B: `(260, 140, 340, 220)`, rotated +18°, with 22 concentric outlines.

Offset origins give the fields a directional sweep. Charcoal/vermilion strokes
are 1.5–2px in the Desktop recipe. A 30px cream interruption cuts through the
overlap; eight registration ticks complete the construction. All parts remain
editable native shapes and Frames, with no imported preview image.

Apply a **Phone stroke floor of 1 CSS px after coordinate scaling**. Uniformly
scaling the Desktop recipe to 302–320px would otherwise reduce its 1.5px strokes
to approximately 0.71–0.75px. Review the dense overlap at the actual Phone size.
The fine contours are an intentional optical treatment, not evidence of a
physical simulation.

Reference traits: **GRA-007** informs print contrast, **GRA-013** structured
display/body hierarchy, **WEB-001** the contrast between scale and fine cells,
and **GRA-002** technical framing. The ellipse arrangement and interruption are
independent; the source posters' lettering, statistics and layouts are not copied.

## Cold Archive

Cold Archive clones the completed Black Instrument page at
`/prototypes/homepage-cold-archive`. Ice gray `#E9ECEB` and graphite `#131919`
pair with restrained lime from the existing dark navigation. Put the material
object on the left and type on the right, with narrow editorial alignment rails
and spacious pale chapters. Change composition and pacing as well as color.
The hero field matches LG-13's fixed `#E9E9E9` background so the material blends
into the composition; the broader chapters use the cooler gray.

Reuse [LogoStudy.tsx](design-studies/code-components/LogoStudy.tsx), mode
`glass` / **LG-13**, for two new Desktop/Phone placements. Keep the logo
monochromatic, source byte-exact and **Canvas motion off**. Retain the component's
existing pause, reduced-motion, static-rendering and shared-resource behavior.
The source recorded in the [material manifest](design-studies/code-components/logo-manifest.json)
is `d35aa37adc1bd80c9b41c15cdbc8dbc339c81efe624b270e630d1f4bb043a9cf`.

LG-13 is an existing independently composed logo treatment using the canonical
brand geometry; the logo itself was not authored for this page. Its sampled
distance field and filtered normals approximate a glass-like extrusion. One
bounded transmission segment refracts a procedural technical field; this is not
a recursive reflection or physical-caustic simulation. See the
[logo handoff](design-studies/code-components/logo-studies.md) for provenance and
the existing material limitations.

Reference traits: **WEB-014** informs icy object/type relationships, while
**CC-008** and **CC-009** inform refraction vocabulary. They do not turn LG-13
into a source recreation or imply a new component implementation.

## Navigation and responsive authoring

Keep the [shared navigation](shared-navigation.md), slim split R&D banner,
Try Monarchic / Apps variants, full-screen menu and search. Reuse the final
navigation override unchanged. New page-owned overlay targets, stable hosts,
inherited Phone bindings, accessible labels and the literal banner DOM ID
`homepage-rd-banner` are preserved and verified below. Hero actions target
their new page's own Solutions section.

The six hero links required native editor authoring: select the CTA layer, keep
its own page in **Link to**, then choose **Section → #solutions**. Plain href
patches exposed the same path/fragment text in MCP readback but compiled without
the section fragment. Do not treat that public string as proof of native section
binding or overwrite these links just to normalize their text. Actual Preview
links now include `#solutions`, and Phone clicks reach the new page's own chapter.

Bring a compact 180–220px artwork view before the long explanation on Phone,
with headings around 48–52px and reachable actions. Scale the native coordinates
instead of clipping Desktop-sized artwork into a narrow box. Preserve the four
Problems and all seven ordered chapters.

The previous prototypes' known interaction limits remain relevant:
**Escape did not close relative dropdowns**, and pointer-activated X closure was
not established by the available automation. Keyboard X and full-screen-menu
Escape were verified on those earlier pages. Do not extend those results to the
new clones without checking their actual Preview behavior. Search remains a
native input with suggested links, without a connected search service; signed-in
navigation remains a demonstration state, without authentication integration.

## Saved pages, preservation and review

| Concept | Draft route | Page / Desktop / inherited Phone |
| --- | --- | --- |
| [Signal Loom](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=SNk2HAKFL) | `/prototypes/homepage-signal-loom` | `SNk2HAKFL` / `Y2ig2aafG` / `bEHwJs3d2` |
| [Vermilion Index](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=C7aTYd2hC) | `/prototypes/homepage-vermilion-index` | `C7aTYd2hC` / `lRwPpqJ1y` / `x4NPov8sh` |
| [Cold Archive](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=TkoZR4uk2) | `/prototypes/homepage-cold-archive` | `TkoZR4uk2` / `gg6TA30TV` / `nmvv0vCT_` |

An independent saved read passes all twelve preservation/body guards:
**21 pages, 127 code-study placements and ten unchanged code sources**, with
60 existing Canvas-motion opt-ins and 67 placements off. All 18 preceding page
hashes, 125 preceding study placements' identity, controls and geometry, source
bytes/exports and two shared navigation definitions remain exact. Only Cold
Archive adds code-study placements; Signal and Vermilion add native artwork.
Native primary/Phone parts match the recipes: 313 marks and 61 contour-plate
parts, including true `50%` ellipse radii and at least 1px Phone borders/ticks.

Desktop is 1440px and Phone is 390px. The observed content widths are 1425px and
375px after the Preview scrollbar; all six bodies fit without horizontal document
overflow. Actual Phone review shows compact artwork before the long explanation,
all four Problems and the full chapter sequence. Vermilion's ellipse pseudo-border
renders at 1 CSS px on Phone. Cold's glass is visible at 500px Desktop / 200px
Phone, and its Play/Pause control changes state correctly; it was resumed.
Dark inherited product/Solutions panels were recolored in the two pale concepts
to retain text contrast. Decorative footer wordmarks intentionally remain subtle.

The mobile gate passes on all three: down-scroll hides the navigation after the
banner is covered, up-scroll restores navigation while the banner stays hidden,
and true top restores the banner. Signal and Vermilion were observed at
160px down / 120px up / 0; Cold at 332px down / 292px up / 0 after heading-focus
automation first scrolled it. All three full-screen menu bindings open correctly.
Signal and Cold menu/search keyboard X closure restores the corresponding opener;
Vermilion menu Escape does so too. Relative-dropdown Escape and pointer-X limits
remain inherited from the preceding round; those behaviors were not expanded.

The six stable behavior hosts are `XLRWNo5w6` / `bEHwJs3d2XLRWNo5w6`,
`pmtLe93Ft` / `x4NPov8shpmtLe93Ft`, and
`Ehne105R1` / `nmvv0vCT_Ehne105R1`. Original graphics are
`gCWFtTnqR` / `bEHwJs3d2gCWFtTnqR` and
`r8BLtLKMp` / `x4NPov8shr8BLtLKMp`. Cold's glass instances are
`AvsVzGG1G` / `nmvv0vCT_AvsVzGG1G`.

Evidence is retained under the task artifact directory
`homepage-round-two-2026-10-30`: `mcp/homepage-round-two-final-report.json`,
`mcp/homepage-round-two-after-raw.json`, `mcp/homepage-round-two-node-map.json`,
the native recipes and authoring/recovery receipts. The complete preservation
payload is 97,668 bytes, SHA-256
`abc8c878c92ec2def979b3909c54d5181d333dd8f2f6ba598b155805d3124dbe`.
This snapshot predates the final native section-link repair: its stored href
strings did not prove compiled behavior. The final link read is
`mcp/homepage-round-two-focused-links-report.json`; it rechecks the six targets,
protected navigation/banner data, ten sources and prior placement dictionaries.
Signal and Vermilion's public page hashes remain exact. Native UI explicitly
stored `openInNewTab:false` on Cold's two CTA links; removing only those two
default fields from a local serialized copy reproduces its prior page hash
exactly, as recorded in `mcp/homepage-round-two-cold-default-report.json`.
Responsive observations and actual captures are
under `framer/preview-qa.json` and `framer/*-{desktop,phone}*.png`.

After the native link repair, Signal and Vermilion expose correct fragment links
on both breakpoints. Actual Phone clicks place their own Solutions heading at
134px (scroll 3556px and 3726px). Cold Desktop reaches its own section at scroll
2633px; after a full project reload Cold Phone reaches its own section at scroll
3504px, with the heading at 134px. These compiled checks supply the native-binding
evidence that stored href strings alone cannot provide.

Owner review remains pending. The owner's positive response to the preceding
two concepts does not select final style, copy or any of these new variations.

Use the [visual-language brief](design-inspiration/visual-language.md) and stable
reference IDs in the [catalog](design-inspiration.md). Recipe previews are
planning evidence only; do not import them as substitutes for the native parts.
Production Astro/Svelte code, catalog facts, billing and publication remain
outside this visual-prototyping record. No automatic synchronization is added.
