# Original live compositions

Eight independently composed procedural graphics form a visual calibration set. After the owner said the first pass did not match the intended style, four anchors were reworked and four studies retained. The revised style awaits the owner's feedback. These are graphic building blocks with no embedded external artwork.

The [05 / Original Live Coding Design page](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=sLT2tXsB2) belongs to **Original compositions**. Its [separate draft lab](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=N5Uh3X9KH) supports [Desktop 1200](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=S3xrHWCL7) and [inherited Phone 390](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=G00fi3nIM). The twenty source-led live adaptations remain on their existing page with their credits.

| ID | Composition | Construction and motion |
| --- | --- | --- |
| OL-01 | Threshold press | A thick folded rust-and-charcoal form with a long negative opening is shaded through limited-palette tonal dithering on a warm paper field. |
| OL-02 | Signal loom | Broad routing ribbons weave over and under each other, interrupted by negative-space cuts. |
| OL-03 | Phosphor atlas | An asymmetric folded phosphor mesh carries dense fine strands, dark gaps and a concentrated cyan-white signal through a navy field. |
| OL-04 | Vector swarm | Asymmetric vector marks travel through an elastic contour field with open space. |
| OL-05 | Chrome hinge | One asymmetric curled optical membrane has varying thickness, a triangular counterform, broad pale reflections and dark transmitted areas that refract a locally generated stripe/type field. |
| OL-06 | Fault line | Angular paper-like shards open a deep fault in a vermilion, pink and ink composition. |
| OL-07 | Glyph engine | A locally constructed nine-cell stencil alphabet becomes cropped and staggered MON/ARCH/IC fragments, with shared stroke pitch, chamfered counters, diagonal cuts and one displaced orange interruption. |
| OL-08 | Orbit relay | Open rectilinear gates interlock at different depths around moving signal packets. |

[OriginalSignalStudy.tsx](OriginalSignalStudy.tsx) contains OL-01–04; [OriginalFormStudy.tsx](OriginalFormStudy.tsx) contains OL-05–08. The [original-study manifest](originals-manifest.json) records palettes, controls, source hashes, placements and verification separately from the source-led manifest. Framer supplies React and its runtime; these files add no dependencies or production-site behavior.

Choose a study and adjust palette, scale, grain, intensity, speed and pointer response. Signal loom adds ribbon width; the Form family exposes motion span and Fault line relief. Pause/Play freezes and resumes the live frame. OL-07's primary letters are constructed locally from geometric strokes and counterforms; only small factual labels use platform monospace fallbacks.

Canvas motion defaults off in both code and saved placements. Preview animates by default, with reduced-motion, hidden-page and offscreen suspension. An explicit editor-canvas opt-in is limited to RenderTarget.canvas. Exports and thumbnails stay still. All seven standalone families share the existing v2 per-window coordinator: two WebGL contexts including initialization, one editor animation or two Preview animations, serial generated stills, adequate cached raster resolution, and sharp handoff frames. Keep the 60 source-led placements in regression coverage alongside these 24 original placements.

The second pass reworks OL-01's tonal dithered form, OL-03's dense phosphor mesh, OL-05's optical membrane and OL-07's custom typography. OL-02, OL-04, OL-06 and OL-08 remain intact. The catalog influences are material and composition principles; the forms and letter construction are original. The [manifest](originals-manifest.json) records the specific catalog IDs, previous descriptions and palettes, the first saved proof, and current technical evidence. Saved-state verification and style approval are separate: the revised anchors await owner feedback.

After reload, all eight board artworks were ready at adequate resolution. The four revised anchors moved in both Desktop and Phone Preview; OL-05 stayed pixel-identical while paused and resumed. Its Canvas opt-in moved, then was restored off, confirmed by a fresh read of all 24 saved presets. Actual artwork measured 1065×680 and 335×280 with the classic scrollbar. Local GPU sampling produced 48 original phase/aspect frames plus 28 mixed-mode samples, 68 distinct frames in total. Seven-file TypeScript, all 16 GLSL stages and the complete 60-placement legacy and 84-placement mixed resource runs passed. The four retained originals also matched their previous desktop phase-8 RGB frames exactly. Historical first-pass browser measurements and motion checks remain in previousSavedVerification and its original artifact folder; they are not reused as proof of the revised visuals. Actual exported images have not been reviewed.

This is a manual Framer-to-code handoff. Nothing is published, synchronized or imported into the Astro/Svelte site. These are exploratory compositions rather than approved brand marks or functional interface/product behavior.
