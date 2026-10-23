# Visual kitchen sources

Graphic studies for the [Framer moodboard](../../framer-moodboard.md), created
2026-10-22. The **18 retained MB asset studies**, MB-01–18, are independent
compositions. They are not approved logos, product diagrams, or site assets.

The same Framer design page separates **Source inspiration** from
**Original compositions**. The retained asset set has 17 SVG studies and the
MB-17 chrome bitmap, corresponding to the first six three-study composition
clusters. The source comparison library follows the current
[inspiration catalog](../../design-inspiration.md). Inspiration IDs remain
citations rather than source previews mixed into the composition clusters.

The later [16 native RE studies](../recreations/README.md) add source-led
recreations above the comparison library. Their frames, dots, wires, and text
are editable as individual Framer layers. They belong in Source inspiration and
retain source credits alongside the 18 independent MB assets. Their
[separate manifest](../recreations/manifest.json) records the saved native-study
nodes; the MB manifest continues to describe only the earlier asset studies.

External work, recreations, and close adaptations of source compositions belong
in Source inspiration, even when Codex made the recreation or adaptation. Credit
the source, link its post, and label the relationship. Do not present those works
as our original compositions. Cropping, recoloring, tracing, or AI regeneration
of a source composition does not change that attribution policy.

[manifest.json](manifest.json) records the 18 retained studies, source filenames, intrinsic
dimensions, and inspiration IDs. Resolve IDs through the
[inspiration catalog](../../design-inspiration.md).

The 17 SVGs are standalone original compositions with no external resources.
Framer stores each in an SVG node within a movable group. Edit its SVG source
to change internal paths; captions and placement frames are native Framer layers.
Decorative lettering uses system font fallbacks, so glyph widths can vary.

The retained bitmap study was made with built-in image_gen:

- [MB-17 Chrome hinge](mb-17-chrome-hinge.png): 1111 × 1415 RGBA PNG with
  transparent surroundings and central opening. [Creation and framing prompts](mb-17-prompt.txt).

The initial batch on 2026-10-22 contained 24 MB studies. At the owner's request,
MB-19–24 and the MB-23 generation prompt have been removed from the asset set,
including the source-led painting adaptation. Their earlier files and source
credits remain recoverable from repository history. The 18 retained assets keep
their existing bytes, MB identifiers, and Framer group/artwork IDs. Framer removal
and saved-editor checks are recorded in the [moodboard handoff](../../framer-moodboard.md).

MB-05 and MB-06 retain ART-003 only in `historicalSourceRefs`, with its original
post URL and posting account. Their active `refs` contain Graphic Design IDs;
the historical metadata does not restore the removed Art collection.

[references.json](references.json) records the active external source links.
Source previews are reference material in the design workspace; the repository
retains public source links and the 18 study assets.
Site/support destinations use link cards without fabricated site previews.
Posting accounts do not establish original authorship or an implementation license.

Source records can retain historical `evidence` and `reviewed` values.
Use `displayKind`, `previewCollectedDate`, and the saved Framer mappings for the
current gallery. For example, GRA-004 now has a video poster while its earlier
evidence remains `link only`. The [coverage record](catalog-coverage.json) records
catalog coverage and the scope of saved-editor verification.

WEB-014–017 expand four formerly brief Web / UI posts into full catalog entries.
Their legacy WEB-SECONDARY source keys, source URLs, and Framer node mappings
are retained. All 19 posts from that bookmark folder remain included. The
[visual-language brief](../../design-inspiration/visual-language.md) records
the independent visual directions to expand.

The retained SVGs were rendered with the repository-pinned Nix librsvg during
the initial artwork review. A separate
audit checked manifest dimensions, XML, local fragment references, catalog IDs,
and PNG structure and transparency. No application code or package dependencies
change in this artwork set.
