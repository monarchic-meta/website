# Framer project organization

The **2026-10-31** organization keeps the existing **34 pages: 11 Design and
23 Web**, with their page IDs, artwork, credits and responsive states. Design
pages use native nested folders; Web pages use the hierarchy of their route
prefixes. The separate boards retain their contents and loading boundaries.
The names and routes below are saved and verified after an editor reload. The
[organization manifest](framer-organization-manifest.json) maps every stable page
ID from its former name and route to its current location, with proof hashes.

The project retains 160 code placements and 17 code sources. Folder organization
changes page membership, display names, routes and any internal links that need
the mapped route update. It preserves page types, descendant IDs, artwork,
component sources, controls, geometry and draft states. No new pages, artworks or
placements are introduced, and no existing work is pruned or converted between
Design and Web. The [manual Framer workflow](framer-prototyping.md) still governs
implementation handoff. This organization performed no publish operation or
synchronization with the implemented site.

## Design: editable visual collections

**Source inspiration** contains external references, recreations and close
adaptations. **Original compositions** contains independently composed studies,
including treatments of the canonical Monarchic logo. Authorship of recreation
code or native layers does not change their source-led classification.

The folder column describes real nested folders. The three native hero pages
share **Source inspiration → Heroes → Native**; they remain three separately
opened boards. Their two live counterparts share the adjacent **Live** folder.
The [bookmark moodboard](framer-moodboard.md) and
[hero handoff](design-studies/hero-recreation-complete-handoff.md) retain each
collection's source keys, credits and fidelity limits.

| Folder | Page | Contents |
| --- | --- | --- |
| Source inspiration | [Reference library](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=uj_I7x6To) | 77 source links, comparison media and credited live comparisons. |
| Source inspiration | [Bookmark recreations](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=a_19JJYFC) | Twenty native RE constructions. |
| Source inspiration | [Creative Coding](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=bY_Q8AQKP) | Twenty source-led LC studies, with a separate Web playground. |
| Source inspiration / Heroes / Native | [01 — Geometry & montage](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=H_ibyOQyy) | HERO-002, 003, 010 and 013. |
| Source inspiration / Heroes / Native | [02 — Type & editorial](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=tIkB2CJN_) | HERO-004, 005, 008 and 011. |
| Source inspiration / Heroes / Native | [03 — Systems & identity](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=bS3wbS1E4) | HERO-012, 016, 017 and 018. |
| Source inspiration / Heroes / Live | [01 — Type Face & Cantor8](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=RVzvNGZNT) | HERO-001 and 007 procedural studies. |
| Source inspiration / Heroes / Live | [02 — Light, vectors & wireframes](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=Q1tIlIqft) | HERO-006, 009, 014, 015 and 016 procedural studies. |
| Original compositions | [Graphic elements](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=sZvxQvQHd) | Eighteen retained MB studies and their combination playground. |
| Original compositions | [Live Creative Coding](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=sLT2tXsB2) | Eight independent OL studies. |
| Original compositions | [Logo treatments](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=wSe9_qdcJ) | Thirteen original treatments of the existing Monarchic logo. |

Static native artwork, source comparisons and asset specimens can stay on
Design pages. Live code components can also animate there through their explicit
**Canvas motion** opt-in. Component defaults keep that opt-in off; earlier saved
Creative Coding opt-ins are preserved. Editor motion retains its 12 fps /
1,000,000-pixel budget, while exports and thumbnails stay frozen. Keep the boards
separate so selecting a collection does not mount the whole visual library.

## Web: homepage concepts

Web folder labels below are human-readable descriptions of the route hierarchy.
The actual prefixes are `/concepts/...` and `/playgrounds/...`; the sidebar may
display their lowercase path segments. The Route column records the exact path,
rather than implying separate title-cased Web folder nodes.

**Concepts → Homepages** groups the earlier rounds and current directions.
Generation names identify their context without marking them rejected or
deprecated. They remain full-page, responsive concepts with links and page flow.
The later directions also retain their native navigation, overlays and mobile
scroll behavior. They are visual prototypes, not approved production pages.

The mandatory root **Home** remains unchanged at `/`. Actual editor inspection
identified it as the early **01 — System / Spec** homepage concept. It is not a
newly created mirror of the implemented website. The six-artwork graphic gallery
also keeps its Web page and responsive layouts under **Concepts → Graphic
studies**, including its existing navigation links.

| Folder | Page | Route |
| --- | --- | --- |
| Root | [Home](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=augiA20Il) | `/` |
| Concepts / Homepages / Round 1 | [Signal / Field](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=WJkUf4nHH) | `/concepts/homepages/round-1/signal-field` |
| Concepts / Homepages / Round 1 | [Research / Edition](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=FNWmJvk0a) | `/concepts/homepages/round-1/research-edition` |
| Concepts / Homepages / Round 2 | [Cobalt / Relay](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=CdGjtAu_e) | `/concepts/homepages/round-2/cobalt-relay` |
| Concepts / Homepages / Round 2 | [Interrupt / Poster](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=rERIFDhZ0) | `/concepts/homepages/round-2/interrupt-poster` |
| Concepts / Homepages / Round 2 | [Aperture / Habitat](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=bPKUhgBQB) | `/concepts/homepages/round-2/aperture-habitat` |
| Concepts / Homepages / Current directions | [Black Instrument](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=nubGK6NoO) | `/concepts/homepages/current/black-instrument` |
| Concepts / Homepages / Current directions | [Open Edition](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=X17ccaPKM) | `/concepts/homepages/current/open-edition` |
| Concepts / Homepages / Current directions | [Signal Loom](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=SNk2HAKFL) | `/concepts/homepages/current/signal-loom` |
| Concepts / Homepages / Current directions | [Vermilion Index](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=C7aTYd2hC) | `/concepts/homepages/current/vermilion-index` |
| Concepts / Homepages / Current directions | [Cold Archive](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=TkoZR4uk2) | `/concepts/homepages/current/cold-archive` |
| Concepts / Graphic studies | [Round 02 graphic gallery](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=NTBtSqs_B) | `/concepts/graphic-studies/round-02` |

## Web: runnable playgrounds

**Playgrounds** separates source-led studies, independent compositions and
Monarchic graphic experiments. Web Preview provides complete input, native
interaction and responsive checks alongside animation. Canvas playback alone
does not establish hover, keyboard, trace activation, menu behavior or Phone
layout. The existing source Creative Coding playground is documented as a
1200px Desktop page; its documentation does not establish a Phone breakpoint.

The six brain pages remain separate. WB-01 ports the implemented site's fiber
element; WB-02–04 explore treatments of that website-derived anatomy. WB-05/06
use the credited external MNI MRI-template mesh. Their placement under
**Monarchic graphics** is a browsing category, not a claim that Monarchic authored
the MRI anatomy. Keep source provenance visible in each specimen.

| Folder | Page | Route |
| --- | --- | --- |
| Playgrounds / Source inspiration | [Creative coding](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=SqfboNSM6) | `/playgrounds/source-inspiration/creative-coding` |
| Playgrounds / Source inspiration / Heroes | [Surface writing & filaments](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=VR2TaJCqa) | `/playgrounds/source-inspiration/heroes/surface-writing-filaments` |
| Playgrounds / Source inspiration / Heroes | [Light, vectors & wireframes](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=iUjJa5763) | `/playgrounds/source-inspiration/heroes/light-vectors-wireframes` |
| Playgrounds / Original compositions | [Creative coding](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=N5Uh3X9KH) | `/playgrounds/original-compositions/creative-coding` |
| Playgrounds / Monarchic graphics | [Logo treatments](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=XFbUB39EK) | `/playgrounds/monarchic-graphics/logo-treatments` |
| Playgrounds / Monarchic graphics / Brain | [Website fiber field](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=nDuZgzAIZ) | `/playgrounds/monarchic-graphics/brain/website-fiber-field` |
| Playgrounds / Monarchic graphics / Brain | [Ordered dither](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=qawbJ_Hpc) | `/playgrounds/monarchic-graphics/brain/ordered-dither` |
| Playgrounds / Monarchic graphics / Brain | [Text dither](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=Dau8jUKIN) | `/playgrounds/monarchic-graphics/brain/text-dither` |
| Playgrounds / Monarchic graphics / Brain | [Refined fibers](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=HQL8UQ3La) | `/playgrounds/monarchic-graphics/brain/refined-fibers` |
| Playgrounds / Monarchic graphics / Brain | [Solid anatomy — Dither](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=fRamy0U53) | `/playgrounds/monarchic-graphics/brain/solid-dither` |
| Playgrounds / Monarchic graphics / Brain | [Solid anatomy — Text](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=Co5wpXpOb) | `/playgrounds/monarchic-graphics/brain/solid-text` |

## Current routes and historical evidence

This guide is the current navigation map. Earlier handoffs and frozen manifests
retain their dated page names, `/prototypes/...`
routes and proof hashes. Preserve those records as evidence of the state they
verified. A folder, name or path change can alter a whole-page hash without
changing its artwork. The organization proof must distinguish those declared
metadata changes and necessary internal-link repairs from preserved content.

Stable `?node=` editor links above retain their page targets. Internal page-ID
links should keep their IDs; hardcoded route links require the explicit old/new
mapping and a fresh check. Source post URLs, creator links and links to the
implemented Monarchic site keep their existing destinations. Folder organization
does not add redirects or publish prototype routes.

## Saved verification

The final saved capture and an independent local comparison passed on
**2026-10-31**. All 34 complete stored page trees match their baseline after
reversing only 33 declared page names, 22 route changes and 48 specific link
targets. Framer automatically remapped those links; the conditional repair found
all 42 owning nodes already correct and wrote nothing. Six further serialized
entries are virtual text runs. All other link attributes and six `#solutions`
fragments remain exact.

The 25 independent checks preserve all page IDs/types, descendants, 160 full
placement controls and geometry, 17 source files, component schemas, shared
native definitions and 22 existing Web draft states. Home's complete stored
body is unchanged. Five new native Design folders and eleven organizational
references group the existing pages; their physical content is preserved.

Actual editor reload confirmed all 34 pages and their hierarchy. Twelve browser
checks cover retained native/live artwork, Desktop and Phone live Preview with
Pause/Play, gallery navigation to Signal / Field, brain-study peer navigation,
and the three moved homepage solutions anchors. Signal Loom's anchor was also
checked at Phone width. The anchors land below the header at 90px.

The manifest records the capture hashes, complete page-tree artifact, local
validation, browser evidence and scope limits. The compact baseline does not
prove unchanged unreferenced asset bytes or the whole route-segment graph; full
page bodies, asset references, existing asset-folder structure and exact final
page paths are checked. New folder child order is recorded. Renderer code did
not change, so existing renderer-regression evidence remains separate from this
organization verification.

Treat an MCP result or timeout as provisional. Inspect the saved project and
reload the editor before retrying creation: delayed delivery can otherwise
produce duplicate work.
