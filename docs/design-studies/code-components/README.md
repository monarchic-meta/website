# Live Creative Coding studies

[CreativeCodingStudy.tsx](CreativeCodingStudy.tsx) is a self-contained React 18
Framer code component with three live WebGL studies. It uses React and Framer
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

## Controls

Choose the study, then adjust animation, speed, still time, intensity, pointer
response and credits. The dither study also has a pixel-size control measured in
**CSS pixels**, rather than device pixels. Color controls accept Framer's CSS
colors; the renderer is opaque and ignores palette alpha. Use these palettes:

- Ordered terrain: primary `#efc8c8`, secondary `#d6b442`, ink `#424855`.
- Point field: white additive points on black; intensity controls their light.
- Coronal: primary `#49efff`, secondary `#b12aff`.

The editor canvas and exports show a deterministic frame at **Still time** using
Framer's `useIsStaticRenderer`. Motion runs in Framer Preview. Visitors can pause
and resume it with a keyboard-accessible button. Reduced motion holds a still
frame; hidden tabs and offscreen components stop their animation loops. The
renderer caps output at 650,000 pixels, DPR 1.5 and 30 frames per second.

Source labels and links accompany each placement. If labels are hidden for a
material-only experiment, keep its external credit card beside the component.
Keep independently composed Monarchic work in Original compositions.

## Authoring and handoff

Edit the TSX source in this repository, then deliberately apply it to Framer's
code file through MCP or the code editor. This is a manual authoring workflow,
not synchronization with the website. Inspect Framer's returned code diagnostics,
check all three modes, and reload the actual editor before recording placement
as saved. Open the lab's Preview to assess motion; the moodboard still frame is
intentional.

For site implementation, manually port the selected rendering behavior into the
existing Astro/Svelte component architecture. The study component and any
prototype routes in Framer do not deploy changes to the website.

Placement and verification details are recorded after the live Framer check.
