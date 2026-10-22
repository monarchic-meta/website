# Visual kitchen sources

Original graphics for the [Framer moodboard](../../framer-moodboard.md), created
2026-10-22. These are independent elements to combine, crop, and try in future
page explorations. They are not approved logos, product diagrams, or site assets.

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
  [Creation prompt](mb-23-prompt.txt).

[references.json](references.json) records the 19 attributed source-post links
represented on the Framer shelf. Source previews are reference material in the
design workspace; the repository retains public post links and original studies.
Posting accounts do not establish original authorship or an implementation license.

All 22 SVGs were rendered with the repository-pinned Nix librsvg. A separate
audit checked manifest dimensions, XML, local fragment references, catalog IDs,
and PNG structure and transparency. No application code or package dependencies
change in this artwork set.
