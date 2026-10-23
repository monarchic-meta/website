# Live Creative Coding studies

[CreativeCodingStudy.tsx](CreativeCodingStudy.tsx) is a self-contained React 18
Framer code component with four live WebGL studies. It uses React and Framer
only; there are no npm dependencies, external textures, copied source shaders,
or network requests. The Astro/Svelte site does not import this authoring file.
Its directory is excluded from the website's TypeScript project because Framer
provides the React/Framer runtime and checks the code inside its own project.

These are **source-led adaptations**, kept with Source inspiration. Their
geometry and GLSL are independently authored from the observed references;
the source algorithms, exact geometry, timing and interaction were not verified
or reproduced. Existing native RE studies remain available separately.

| Study | Reference | Live behavior | Intentional differences |
| --- | --- | --- | --- |
| LC-01 / Ordered terrain | [CC-003 / @GaloAndStuff](https://x.com/GaloAndStuff/status/2094074141557117090) | Ray-marched rolling surface, three-color ordered tonal dithering, pointer-controlled viewpoint | Independent terrain rather than the depicted world; a 4×4 Bayer matrix studies its limited-palette tonal language |
| LC-02 / Suspended point field | [CC-001 / @yuruyurau](https://x.com/yuruyurau/status/2093710258120331463) | 13,248 GPU points, continuous canopy and pinched drape, moving strands and viewpoint | Independently parameterized surface and motion; no source formula or point data |
| LC-03 / Coronal light | [CC-005 / @XorDev](https://x.com/XorDev/status/2093488121392300374) | Volumetric cyan/magenta aperture, traveling filaments and light plumes, pointer response | Independent density/noise field; source shader code and exact light model are not adopted |
| LC-04 / Wave | [CC-010 / @XorDev](https://x.com/XorDev/status/2093074820661387392) | Moving luminous ribbon, folded flow and pointer response | Independent ribbon geometry, light field and motion; source shader code and exact timing are not adopted |

## Controls

Choose the study, then adjust animation, speed, still time, intensity, pointer
response and credits. The dither study also has a pixel-size control measured in
**CSS pixels**, rather than device pixels. Color controls accept Framer's CSS
colors; the renderer is opaque and ignores palette alpha. Use these palettes:

- Ordered terrain: primary `#efc8c8`, secondary `#d6b442`, ink `#424855`.
- Point field: white additive points on black; intensity controls their light.
- Coronal: primary `#49efff`, secondary `#b12aff`.
- Wave: primary `#c6ff9f`, secondary `#b777ff`.

**Canvas motion** defaults off. With animation enabled, opting in allows motion
on the Framer editor canvas at up to **12 fps and 150,000 pixels**. The component
uses `RenderTarget.canvas` together with `useIsStaticRenderer` to distinguish
that authoring target from exports and thumbnails, which remain frozen at
**Still time**.

Framer Preview runs at up to **30 fps and 650,000 pixels**, with DPR capped at
1.5. Visitors can pause and resume it with a keyboard-accessible button. Reduced
motion holds a still frame; hidden tabs and offscreen components stop their
animation loops. Canvas motion is an instance-level authoring choice and does
not change the export policy.

Source labels and links accompany each placement. If labels are hidden for a
material-only experiment, keep its external credit card beside the component.
Keep independently composed Monarchic work in Original compositions.

## Authoring and handoff

Edit the TSX source in this repository, then deliberately apply it to Framer's
code file through MCP or the code editor. This is a manual authoring workflow,
not synchronization with the website. Inspect Framer's returned code diagnostics,
check all four modes, and reload the actual editor before recording placement
as saved. Check Preview motion, opt-in canvas motion and frozen exports
separately. Record whether Canvas motion is enabled on each saved placement.

For site implementation, manually port the selected rendering behavior into the
existing Astro/Svelte component architecture. The study component and any
prototype routes in Framer do not deploy changes to the website.

## Saved placements and verification

The initial three-study round is saved in the moodboard's
[Live Creative Coding area](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=qPREnLG7B)
under Source inspiration. Open the separate
[Creative Coding lab in Preview](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=SqfboNSM6&view=preview)
for motion and pointer response. The lab is an unpublished **draft** with a
1200px desktop artboard. The component also renders at narrow sizes; the lab
does not yet define a separate mobile layout.

[manifest.json](manifest.json) records the source hash, code export, controls,
source credits and exact saved node IDs. For that initial round on 2026-10-23,
actual editor reloads, native layer copies and visual checks confirmed all six
component instances and their credits. Framer reported no code diagnostics. Actual Framer Preview
checks confirmed motion and pause/resume; separate browser GPU checks covered
all three rendering modes, three-color dither output, narrow rendering and
WebGL context restoration. RGB/HSL, transparent, Display P3 and inherited-token
palette normalization were also checked in the browser.

That initial preservation audit confirmed all 20 native study trees, 77 reference trees
and 18 original groups remained intact. Existing page identities/routes are
preserved. These checks do not establish exact source-video fidelity or
production-site integration. Screenshots and verification inputs are retained
in this Codex task's local `live-creative-coding` artifacts.

## Four-study revision — saved and verified

The revision adds LC-04 / Wave on a second row of the live area and appends a
fourth card to the same draft lab. The earlier LC-01–03 live cards retain their
geometry. CC-001, CC-003, CC-005 and CC-010 have code components as their main
reference-card artwork, with the external posters retained as comparison
thumbnails. Each adaptation keeps its source credit and its own classification.

The saved inventory is **20 native studies, four live studies, 18 originals and
77 source entries**. The eight source-led adaptations comprise four static native
studies and four live studies; additional placements do not create new studies.
The live area is 3,500px high and the Source frame is 17,300px high. All twelve
instances have Canvas motion enabled: four reference previews, four live-area
studies and four lab studies. Open the
[Coronal reference card](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=vLDEOerxD)
or the [Wave reference card](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=CS7lNlz7V)
to compare the running code with its small, labeled source poster.

On 2026-10-23, a full editor reload and 615 saved-node assertions verified the
new placements, controls, thumbnail assets, source links and geometry. All
20 native study trees, 18 original groups and 73 untouched reference trees
match fresh baselines. The four revised reference cards retain their IDs,
positions and source assets. Wave and Coronal visibly animate in the editor;
Wave also runs and pauses/resumes in actual Framer Preview. Browser GPU checks
confirm Wave changes over time, draws at narrow sizes and respects the canvas
pixel budget with no GL errors. Focused target/lifecycle checks cover the
export/thumbnail freeze guards, frame cap and reduced motion; no exported image
was manually inspected during this revision. Framer code diagnostics are empty.
Proof inputs and screenshots are retained in this task's local
`live-creative-coding-correction` artifacts. The manifest retains the earlier
three-study verification separately from this current proof.
