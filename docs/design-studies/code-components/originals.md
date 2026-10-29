# Original live compositions

Eight independently composed procedural graphics explore the owner's mix of neo-brutalism, digital and cyberpunk design, tonal dithering, neo-Y2K materials and expressive Swiss type. They are graphic building blocks rather than page implementations. They do not recreate a catalog post or embed external artwork.

The [05 / Original Live Coding Design page](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=sLT2tXsB2) belongs to **Original compositions**. Its [separate draft lab](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=N5Uh3X9KH) supports [Desktop 1200](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=S3xrHWCL7) and [inherited Phone 390](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=G00fi3nIM). The twenty source-led live adaptations remain on their existing page with their credits.

| ID | Composition | Construction and motion |
| --- | --- | --- |
| OL-01 | Threshold press | Cutout pigment slabs, ordered tonal stipple, offset ink and moving print pressure. |
| OL-02 | Signal loom | Broad routing ribbons weave over and under each other, interrupted by negative-space cuts. |
| OL-03 | Phosphor atlas | Broken laser arcs, scanning traces and discrete signal rails on dark phosphor. |
| OL-04 | Vector swarm | Asymmetric vector marks travel through an elastic contour field with open space. |
| OL-05 | Chrome hinge | Three articulated punched chrome plates, raised creases and changing hard-surface reflections. |
| OL-06 | Fault line | Angular paper-like shards open a deep fault in a vermilion, pink and ink composition. |
| OL-07 | Glyph engine | A locally drawn MONARCHIC type atlas becomes an oversized, cropped kinetic poster. |
| OL-08 | Orbit relay | Open rectilinear gates interlock at different depths around moving signal packets. |

[OriginalSignalStudy.tsx](OriginalSignalStudy.tsx) contains OL-01–04; [OriginalFormStudy.tsx](OriginalFormStudy.tsx) contains OL-05–08. The [original-study manifest](originals-manifest.json) records palettes, controls, source hashes, placements and verification separately from the source-led manifest. Framer supplies React and its runtime; these files add no dependencies or production-site behavior.

Choose a study and adjust palette, scale, grain, intensity, speed and pointer response. Signal loom adds ribbon width; the Form family exposes motion span and Fault line relief. Pause/Play freezes and resumes the live frame. The type atlas uses local Canvas 2D text and system font fallbacks, so exact letter shapes can vary across platforms.

Canvas motion defaults off in both code and saved placements. Preview animates by default, with reduced-motion, hidden-page and offscreen suspension. An explicit editor-canvas opt-in is limited to RenderTarget.canvas. Exports and thumbnails stay still. All seven standalone families share the existing v2 per-window coordinator: two WebGL contexts including initialization, one editor animation or two Preview animations, serial generated stills, adequate cached raster resolution, and sharp handoff frames. Keep the 60 source-led placements in regression coverage alongside these 24 original placements.

Saved verification on 2026-10-29 checked the two exact code hashes, all 24 placements and controls, the separate Design page and draft lab after an editor reload. All eight originals moved in both actual Framer Preview breakpoints. With a 15px classic scrollbar, the artwork filled 1065×680 at Desktop 1200 and 335×280 at Phone 390; the nominal overlay-scrollbar widths are 1080/350. The phone had no horizontal overflow and retained 44px native headings. OL-05 stayed pixel-identical while paused and resumed motion. Its temporary Canvas motion opt-in produced an animated 1024×636 frame, then was restored to off; a fresh saved-state read confirmed all 24 placements off, and another editor reload confirmed ready artwork.

Local GPU testing sampled all eight originals at phases 0, 8 and 16 in 960×600 and 350×280 aspects, plus all 28 original/source-led modes at one desktop phase. The resource suite retains its complete 60-placement legacy run and adds a seven-family 84-placement run; each passed 12 assertion groups with at most two contexts and 1,998,984 active pixels. Semantic TypeScript and all 16 GLSL stages passed. The [manifest](originals-manifest.json) links the evidence and limits each claim to its verified surface; actual exported images have not been reviewed.

This is a manual Framer-to-code handoff. Nothing is published, synchronized or imported into the Astro/Svelte site. These are exploratory compositions rather than approved brand marks or functional interface/product behavior.
