# Framer moodboard — visual kitchen

Created **2026-10-22** from the [inspiration catalog](design-inspiration.md).

[Open the moodboard](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=uj_I7x6To) in the existing Monarchic project under
**Design → Moodboard / Visual kitchen**. This is a freeform design canvas for
independent graphics, materials, strips, corner treatments, and collage pieces.
The six homepage directions and the earlier graphic gallery are preserved.

The [studio wall](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=rI0h8QiJa) contains **24 original studies** alongside
**18 attributed source previews and one video-reference link**. Each original
has its own named MB-xx group. Source previews retain their posting accounts,
catalog IDs, and clickable post links. They cover GRA-001–013 and ART-001–006;
the original studies also adapt selected WEB references. This brings the
catalog's visual breadth into Framer without treating every bookmark as a
single common style.

## Explore the clusters

| Canvas area | Original studies | Source shelf |
| --- | --- | --- |
| [01 / Printed fragments](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=RRt4qsw5N) | MB-01 Signal spine; MB-02 Research ticket; MB-03 Corner impression | GRA-001, GRA-009, GRA-013 |
| [02 / Material + machine](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=ytPwUrrNp) | MB-04 Folded label; MB-05 Acetate overlay; MB-06 Night port | GRA-010, ART-003, GRA-011 |
| [03 / Modular offcuts](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=vuvw3HJUm) | MB-07 Counterweights; MB-08 Punched roll; MB-09 Scale echoes | GRA-003, GRA-004 |
| [04 / Electronic residue](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=QYLEgHpRs) | MB-10 Pixel comet; MB-11 Perforated gate; MB-12 Scan band | GRA-008, GRA-006, GRA-002 |
| [05 / Drawn forces](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=snksw98G2) | MB-13 Tension net; MB-14 Terrain tape; MB-15 Raster junction | GRA-005 |
| [06 / Surface experiments](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=sEnKbVSmF) | MB-16 Printed drape; MB-17 Chrome hinge; MB-18 Grain fissure | GRA-007, GRA-012 |
| [07 / Schematic worlds](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=d0TE9fATh) | MB-19 Infrastructure grove; MB-20 Suspended mass; MB-21 Cutaway capsule | ART-001, ART-004, ART-002 |
| [08 / Atmosphere](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=T65WXz278) | MB-22 Warm windows; MB-23 Blue nocturne; MB-24 Engraved horizon | ART-005, ART-006 |

The reference shelf uses still previews, including one video poster. GRA-004
remains a link to its motion study because a still asset was unavailable.
Some source previews are cropped to the shelf frames; open the post to inspect
the full composition. These excerpts do not establish full-gallery or full-video
review, authorship, production method, or a license for implementation.

## Try combinations

Select a named study in Layers, duplicate its group, and move the duplicate to
the [combination playground](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=hakGOoQNh) beneath the wall. Crop,
layer, resize, and compare a few elements before placing them in an existing
page prototype. The wall is a reference shelf, while the playground is working
space; neither defines an approved design system or production page.

Captions and grouping frames are native Framer layers. The 22 vector studies
are SVG nodes: their placement is editable on the canvas, and internal paths
can be changed through their SVG source. The chrome hinge and blue nocturne
are bitmap studies made with built-in image_gen. The chrome has transparent
surroundings and an open center. Source previews are separate reference layers.

## Retained sources and handoff

The [artwork index](design-studies/moodboard/README.md) links the original SVGs,
PNGs, and image-generation prompts. The
[study manifest](design-studies/moodboard/manifest.json) records dimensions,
reference IDs, and exact Framer group/artwork IDs. The
[source-post index](design-studies/moodboard/references.json) records attribution,
review dates, and Framer reference-group IDs. The repository retains original
studies and public source links; source previews live in the Framer workspace.

Conversion to or from site code remains manual under the
[Framer workflow](framer-prototyping.md). No runtime feed, token synchronization,
site implementation, or publishing change is introduced.

## Verification

All 22 SVGs rendered with the repository-pinned Nix librsvg. The asset audit
checked XML, viewBoxes, unique local IDs, resolved fragments, absence of external
resources/scripts, all 28 referenced catalog IDs, and PNG structure/dimensions.
MB-17 is 1111 × 1415 RGBA with actual transparency; MB-23 is 1080 × 1456 opaque
RGB. No application code or dependency changes require application tests.

The full wall and all eight clusters were visually reviewed in the Framer editor
at an overview scale and at 44% close-up scale. Terrain tape and Grain fissure
were moved down 30px after review to separate their top edges from adjacent
captions. Both bitmap fills are retained in the original study groups; temporary
upload frames were removed. All 18 source-image asset references, their 18 image
links, and all 19 caption links were checked against the recorded source posts.

Final overview and eight editor captures are retained in this Codex task's local
visualization artifacts. The MCP capture transport ended before returning its
screenshots, so visual verification used the saved browser captures. The design
page and both bitmap placements were confirmed in the editor. Nothing was
published, and all seven existing web-page IDs and routes remain intact.
