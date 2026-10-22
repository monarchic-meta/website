# Visual kitchen sources

Graphic studies for the [Framer moodboard](../../framer-moodboard.md), created
2026-10-22. The 24 retained assets comprise **23 independent compositions and
one source-led adaptation**. They are not approved logos, product diagrams,
or site assets.

The same Framer design page separates **Source inspiration** from
**Original compositions**. The composition wall holds the 22 SVG studies and
MB-17 chrome bitmap. The source wall holds the catalog's 68 external URLs
(58 X posts with visual previews and 10 site/support link cards), organized as
Web / UI 19, Graphic design 27, Art / Visual 12, and Sites / Supporting links 10.
Its separate **Made here / source-led adaptation** area holds MB-23. The first
seven composition clusters each contain three studies; Atmosphere contains two.
Inspiration IDs remain citations rather than source previews mixed into those
clusters.

External work, recreations, and close adaptations of source compositions belong
in Source inspiration, even when Codex made the recreation or adaptation. Credit
the source, link its post, and label the relationship. Do not present those works
as our original compositions. Cropping, recoloring, tracing, or AI regeneration
of a source composition does not change that attribution policy.

[manifest.json](manifest.json) records all 24 studies, source filenames, intrinsic
dimensions, and inspiration IDs. Resolve IDs through the
[inspiration catalog](../../design-inspiration.md).

The 22 SVGs are standalone original compositions with no external resources.
Framer stores each in an SVG node within a movable group. Edit its SVG source
to change internal paths; captions and placement frames are native Framer layers.
Decorative lettering uses system font fallbacks, so glyph widths can vary.

Two bitmap studies were made with built-in image_gen:

- [MB-17 Chrome hinge](mb-17-chrome-hinge.png): 1111 × 1415 RGBA PNG with
  transparent surroundings and central opening. [Creation and framing prompts](mb-17-prompt.txt).
- [MB-23 Blue nocturne](mb-23-blue-nocturne.png): 1080 × 1456 opaque RGB PNG.
  **AI-assisted adaptation made here, influenced by ART-005**; its warm-disk and
  reflection composition closely follows that source. It belongs in Source
  inspiration, not Original compositions. The generated bitmap is not attributed
  to the external artist. [Creation prompt](mb-23-prompt.txt).

The original handoff called all 24 studies original. The 23-plus-one classification
above replaces that label without replacing assets or changing their existing
MB identifiers or Framer group/artwork IDs.

[references.json](references.json) records the 68 external source URLs across all
39 stable catalog entries. Source previews are reference material in the design
workspace; the repository retains public source links and the 24 study assets.
Site/support destinations use link cards without fabricated site previews.
Posting accounts do not establish original authorship or an implementation license.

The earlier 19 records retain their historical `evidence` and `reviewed` values.
Use `displayKind`, `previewCollectedDate`, and the saved Framer mappings for the
current gallery. For example, GRA-004 now has a video poster while its earlier
evidence remains `link only`. The [coverage record](catalog-coverage.json) maps
every catalog entry and source URL to its saved group and category.

All 22 SVGs were rendered with the repository-pinned Nix librsvg. A separate
audit checked manifest dimensions, XML, local fragment references, catalog IDs,
and PNG structure and transparency. No application code or package dependencies
change in this artwork set.
