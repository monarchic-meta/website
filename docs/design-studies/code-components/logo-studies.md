# Original logo treatments

Four procedural treatments use the existing Monarchic symbol from the [pinned logo repository](https://github.com/monarchic-meta/logo/blob/1844d35d6ffdedf2356ec929c36bb5c0454cf645/logo.svg). The material, contour and motion compositions are new; the logo geometry is existing brand artwork.

| ID | Study | Construction and motion | Catalog influences |
| --- | --- | --- | --- |
| LG-01 | Pigment relief | A shallow extrusion uses warm pigment, tonal dithering and moving surface light. | CC-003, GRA-002 |
| LG-02 | Optical counterform | Fine distance contours radiate around the mark while preserving its open diagonal cut. | GRA-003, GRA-005 |
| LG-03 | Chrome cut | A beveled extrusion reflects a locally authored studio environment with restrained spectral accents. | GRA-012, CC-016 |
| LG-04 | Phosphor carrier | A layered pixel-light field carries a moving signal along the diagonal counterform. | GRA-008, CC-019 |

[LogoStudy.tsx](LogoStudy.tsx) is self-contained. Its synchronous vector raster and cached signed-distance atlas derive from the exact [canonical SVG](assets/monarchic-logo.svg); [the reusable helper](assets/monarchic-logo-sdf.ts) and [asset-check utility](../../../scripts/build-framer-logo-assets.mjs) record the construction. The 1024-square distance field is sampled from an antialiased pixel grid, rather than an analytic Bezier distance. It retains the four closed source features and the diagonal negative space. Chrome normals are smoothed from this sampled grid; subtle sidewall striations remain at close inspection. Nothing fetches an image or font at runtime.

Catalog references inform material, texture and composition. The existing Monarchic geometry is shared across independently authored treatments.

The [logo manifest](logo-manifest.json) is authoritative for presets, source hashes, provenance and saved placements. Palette, scale, intensity, grain, speed, motion span and pointer controls are available; Relief applies to the dimensional pigment and chrome treatments. Canvas motion defaults off. Preview animation shares the existing per-window resource coordinator; exports and thumbnails are still. These are exploratory logo treatments, with owner style feedback pending.

The [06 / Logo Studies Design page](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=wSe9_qdcJ) has a [separate draft lab](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=XFbUB39EK), with [Desktop 1200](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=CaR79pbR4) and [inherited Phone 390](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=BoGMiXsRD). After reload, all four board graphics were ready at adequate resolution. The four studies moved in both Preview sizes; Pause/Play and a Canvas-motion opt-in/restoration were checked. All twelve new saved presets retain Canvas motion off, and the previous 84 placements are preserved.

Current local checks cover eight TypeScript files, eighteen GLSL stages, 24 phase/aspect samples and eighteen control samples. Motion span and the dimensional modes’ Relief controls change their actual GPU output. The complete 60-, 84- and 96-placement resource suites pass separately. The manifest links the current source-bound evidence; actual Framer exported images have not been reviewed.

This remains a manual Framer handoff. No production-site change, publication or automatic synchronization is introduced.
