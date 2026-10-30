# Original live compositions

Eight independently composed procedural graphics form a visual calibration set. After the owner identified OL-02, OL-04, OL-06 and OL-08 as out of style, those four were reworked while OL-01, OL-03, OL-05 and OL-07 were retained unchanged. The current set awaits the owner's style feedback. These are graphic building blocks with no embedded external artwork.

The [05 / Original Live Coding Design page](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=sLT2tXsB2) belongs to **Original compositions**. Its [separate draft lab](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=N5Uh3X9KH) supports [Desktop 1200](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=S3xrHWCL7) and [inherited Phone 390](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=G00fi3nIM). The twenty source-led live adaptations remain on their existing page with their credits.

| ID | Composition | Construction and motion |
| --- | --- | --- |
| OL-01 | Threshold press | A thick folded rust-and-charcoal form with a long negative opening is shaded through limited-palette tonal dithering on a warm paper field. |
| OL-02 | Signal loom | Dense black-and-ivory optical contours form an asymmetric open counter-slit, with a restrained rust cut edge and resolution-aware line coverage. |
| OL-03 | Phosphor atlas | An asymmetric folded phosphor mesh carries dense fine strands, dark gaps and a concentrated cyan-white signal through a navy field. |
| OL-04 | Vector swarm | Two intersecting pleated emissive surfaces concentrate a white-hot seam and cyan/magenta caustic peaks around deep negative pockets in a violet field. |
| OL-05 | Chrome hinge | One asymmetric curled optical membrane has varying thickness, a triangular counterform, broad pale reflections and dark transmitted areas that refract a locally generated stripe/type field. |
| OL-06 | Fault line | Dense thermal scan columns describe a stepped volumetric relief around an angular cut, using warm emissive value bands against deep aubergine. |
| OL-07 | Glyph engine | A locally constructed nine-cell stencil alphabet becomes cropped and staggered MON/ARCH/IC fragments, with shared stroke pitch, chamfered counters, diagonal cuts and one displaced orange interruption. |
| OL-08 | Orbit relay | One thick amber optical solid with two unequal open channels has gently curved faces, thickness-dependent absorption and shifted transmission of a locally generated stripe field on pale lilac. |

[OriginalSignalStudy.tsx](OriginalSignalStudy.tsx) contains OL-01–04; [OriginalFormStudy.tsx](OriginalFormStudy.tsx) contains OL-05–08. The [original-study manifest](originals-manifest.json) records palettes, controls, source hashes, placements and verification separately from the source-led manifest. Framer supplies React and its runtime; these files add no dependencies or production-site behavior.

Choose a study and adjust palette, scale, grain, intensity, speed and pointer response. The families retain their existing visual controls for field width, motion span and relief. OL-07 retains an inherited limitation: its generic Mouse toggle does not alter the glyph image. Pause/Play freezes and resumes the live frame. OL-07's primary letters are constructed locally from geometric strokes and counterforms; only small factual labels use platform monospace fallbacks.

Canvas motion defaults off in both code and saved placements. Preview animates by default, with reduced-motion, hidden-page and offscreen suspension. An explicit editor-canvas opt-in is limited to RenderTarget.canvas. Exports and thumbnails stay still. All WebGL study families share the existing v2 per-window coordinator: two WebGL contexts including initialization, one editor animation or two Preview animations, serial generated stills, adequate cached raster resolution, and sharp handoff frames. Keep the 60 source-led placements in regression coverage alongside these 24 original placements.

Catalog references inform material, texture and composition principles; the forms and formulas are independently authored. Saved-state verification and the owner's style judgment remain separate.

After reload, all eight board artworks were ready at adequate resolution. The four revised studies moved in Desktop and Phone Preview; pause/resume and all 24 saved Canvas-off presets were verified. The existing Relief and Motion span controls now work, with fresh endpoint checks and 48 pixel-identical default frames for the final Motion span repair. Final GPU evidence covers 68 distinct frames; seven-file TypeScript and all 16 GLSL stages pass. The manifest explicitly scopes reuse of the unchanged runtime's legacy 60-placement and mixed 84-placement resource runs and the earlier OL-06 Canvas test, and preserves both intermediate repair candidates and the earlier bounded Relief-rounding diagnostic.

The [manifest](originals-manifest.json) keeps the full first saved proof, the complete revision 2 proof in savedVerificationHistory, the previous style-calibration record, and the earlier even-study descriptions, palettes, notes and hashes. Previous actual motion checks remain historical. Actual Framer exported images have not been reviewed.

This is a manual Framer-to-code handoff. Nothing is published, synchronized or imported into the Astro/Svelte site. These are exploratory compositions rather than approved brand marks or functional interface/product behavior.
