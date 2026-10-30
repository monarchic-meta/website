# Original logo treatments

Seven treatments use the existing Monarchic symbol from the [pinned logo repository](https://github.com/monarchic-meta/logo/blob/1844d35d6ffdedf2356ec929c36bb5c0454cf645/logo.svg): four procedural material studies and three SVG motion studies. The treatments and choreography are new; the logo geometry is existing brand artwork.

| ID | Study | Construction and motion | Direction |
| --- | --- | --- | --- |
| LG-01 | Pigment relief | A shallow extrusion uses warm pigment, tonal dithering and moving surface light. | CC-003, GRA-002 |
| LG-02 | Optical counterform | Fine distance contours radiate around the mark while preserving its open diagonal cut. | GRA-003, GRA-005 |
| LG-03 | Chrome cut | A beveled extrusion reflects a locally authored studio environment with restrained spectral accents. | GRA-012, CC-016 |
| LG-04 | Phosphor carrier | A layered pixel-light field carries a moving signal along the diagonal counterform. | GRA-008, CC-019 |
| LG-05 | Gravity pass | The diagonal line falls vertically through the fixed circle and pauses in the assembled mark. | Direct owner motion brief |
| LG-06 | Magnetic catch | The line drops, overshoots, settles into the mark, then releases downward. | Direct owner motion brief |
| LG-07 | Signal fall | Two transient line echoes follow the falling carrier and disappear in the assembled pose. | Direct owner motion brief |

[LogoStudy.tsx](LogoStudy.tsx) contains the first four treatments. Its synchronous vector raster and cached 1024-square signed-distance atlas derive from the [canonical SVG](assets/monarchic-logo.svg); [the helper](assets/monarchic-logo-sdf.ts) and [asset-check utility](../../../scripts/build-framer-logo-assets.mjs) record the construction. The sampled distance field retains the four closed source features and diagonal negative space. It is not an analytic Bezier distance; subtle grid-derived chrome sidewall striations remain at close inspection. Catalog references inform materials, textures and composition.

[LogoDropStudy.tsx](LogoDropStudy.tsx) contains the three motion treatments. The circle uses the source's eight cubic pieces, while one finite diagonal parallelogram keeps the source's horizontal end caps. Only that line moves vertically. Two instance-unique luminance masks preserve the negative cut through the circle while allowing separate colors. Mask antialiasing differs from the canonical compound path; this is not a pixel-identical assembled raster. Registration marks, the echo variant's dot field and transient outlines are additional treatment elements. The line and its cut fade together at the loop boundary to conceal the reset at smaller Scale or Travel values.

The [material manifest](logo-manifest.json) retains the first four studies' presets, provenance and verification. The separate [motion manifest](logo-drop-manifest.json) records LG-05–07. Material controls include palette, grain, motion span and dimensional Relief; motion controls include palette, scale, travel, spring bounce, echo strength, speed and still phase. The default still phase is assembled in all three motion variants. Canvas motion defaults off, and exports and thumbnails remain still. The SVG clock uses no WebGL context or image buffer, allows one active SVG Canvas study or two active SVG Preview studies, and yields motion slots to active WebGL studies. Neither component fetches an image or font at runtime.

The [06 / Logo Studies Design page](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=wSe9_qdcJ) and its [draft lab](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=XFbUB39EK) now contain seven treatments and 21 placements, with [Desktop 1200](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=CaR79pbR4) and [inherited Phone 390](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=BoGMiXsRD). The three new SVG studies were checked after an editor reload, moved in both Preview sizes, and passed Pause/Play plus Canvas-motion opt-in/restoration. All nine new saved presets keep Canvas motion off; the previous 96 placements are retained.

New SVG checks cover one TypeScript component, 13 deterministic motion/lifecycle groups and 18 graphics-only phase/aspect snapshots. The clock allocates no canvas, image or WebGL surfaces. Source-byte guards preserve the eight existing components; the earlier material manifest retains its separate GPU and resource evidence. The motion manifest links current saved-state and browser proof. Actual Framer exports have not been reviewed.

The existing four material studies and their source remain unchanged. Owner style feedback is pending. These are manual Framer handoffs; no production-site change, publication or automatic synchronization is introduced.
