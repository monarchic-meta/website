# Live Creative Coding studies

Five self-contained React 18 Framer code components author twenty live WebGL
studies, one for each Creative Coding bookmark. [CreativeCodingStudy.tsx](CreativeCodingStudy.tsx)
contains LC-01–04; [MaterialCodingStudy.tsx](MaterialCodingStudy.tsx) contains
LC-05–08; [PointCodingStudy.tsx](PointCodingStudy.tsx),
[FieldCodingStudy.tsx](FieldCodingStudy.tsx) and
[InterfaceCodingStudy.tsx](InterfaceCodingStudy.tsx) add LC-09–20. They use React
and Framer only, with no npm dependencies, external textures, copied source
shaders or network requests. Glass and technical UI modes generate their own
local textures. The Astro/Svelte site does not import these authoring files. This directory is
excluded from the website's TypeScript project because Framer provides the
React/Framer runtime and checks the code inside its own project.

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
| LC-05 / Capsule depth | [CC-004 / @kellymilligannz](https://x.com/kellymilligannz/status/2095011696180171077) | Layered dark capsules, moving overlap and adjustable soft focus | Analytic capsule layers and a soft-focus approximation; no physical depth-of-field or source physics simulation |
| LC-06 / Glass refraction | [CC-008 / @AlbiaHossain](https://x.com/AlbiaHossain/status/2093330866143662498) | Moving glass panels visibly refract a locally generated interface texture | Original Canvas 2D UI artwork resampled by the shader; no screenshot, DOM capture or source-site asset |
| LC-07 / Triangle lattice | [CC-013 / @YoheiNishitsuji](https://x.com/YoheiNishitsuji/status/2098603831944945735) | Rotating recursive angular geometry with open triangular holes | Independent five-level nearest-vertex iterated construction with angular leaves; source formula and exact geometry are not adopted |
| LC-08 / Spectral grain | [CC-016 / @Jaenam97](https://x.com/Jaenam97/status/2098418240900804947) | Reflective-looking torus, spectral rim, moving highlights and surface grain | Ray-marched torus with an approximate environment and spectral material; not a path tracer or physical spectral simulation |

| LC-09 / Folded white point mesh | [CC-007 / @yuruyurau](https://x.com/yuruyurau/status/2093711731084415124) | GPU point sheet with a pinched fold, opening wings and local ripples | Independent parametric sheet; source formula and complete timing are not reproduced |
| LC-10 / Curling point gesture | [CC-014 / @yuruyurau](https://x.com/yuruyurau/status/2098075684593893667) | Tapering curled point body with fine upper contour trails | Source-led cropped gesture; independent geometry, contour family and motion |
| LC-11 / Connected mesh loops | [CC-015 / @yuruyurau](https://x.com/yuruyurau/status/2098070701597192431) | Connected figure-eight point surface, breathing loops and traveling deformation | Original continuous loop surface; exact source topology and motion are unverified |
| LC-12 / Curved mesh feather | [CC-020 / @yuruyurau](https://x.com/yuruyurau/status/2100230050063024467) | Arcing point fan, folded feather-like silhouette and bending side filaments | Independent spine, fan and filaments; source formula and motion are not reproduced |
| LC-13 / Electric radial / icy filaments | [CC-006 / @YoheiNishitsuji](https://x.com/YoheiNishitsuji/status/2106013834540732704) | Dense icy polar ridges and moving electric filaments | Independent warped polar field; source shader and light model are not adopted |
| LC-14 / Icy ridge / layered flow | [CC-017 / @YoheiNishitsuji](https://x.com/YoheiNishitsuji/status/2098403689421570237) | Diagonal luminous edge and stacked blue ridges with dark negative space | Independent advecting ridge field; source geometry and timing are approximated |
| LC-15 / Warm corridor / recursive relief | [CC-018 / @XorDev](https://x.com/XorDev/status/2099543044945023343) | Forward-moving square corridor with warm ribs and fractured relief | Repeated distance-field ribs and bounded relief; no claim of source fractal or physical lighting |
| LC-16 / Glyph trails / luminous gestures | [CC-019 / @tsumiki_room](https://x.com/tsumiki_room/status/2099891155282612462) | Original luminous gestures with drifting poses and three temporal echoes | Independent abstract paths; no source glyphs or TouchDesigner project |
| LC-17 / Temporal glyph / afterimages | [CC-002 / @threejs](https://x.com/threejs/status/2093387984741761280) | Original bilateral wing glyph, nested frames and temporal afterimages | Independent wing geometry and echo algorithm; CC-002 also credits [afterimage](https://x.com/i/status/2093373917218103449) |
| LC-18 / Glass pixel glyphs / nine modules | [CC-009 / @dnatsuuu](https://x.com/dnatsuuu/status/2093175907867656302) | Nine original pixel glyphs inside moving glass-like tiles | Local original glyph texture and illustrative refraction; no physical glass-cube simulation |
| LC-19 / Chromatic loops / granular surface | [CC-011 / @zozuar](https://x.com/zozuar/status/2094068054590190033) | Three rotating chromatic loops with granular surface shading | Independent toroidal arrangement and motion; source formula and exact topology are not adopted |
| LC-20 / Technical keycaps / signal paths | [CC-012 / @icanvardar](https://x.com/icanvardar/status/2094171308795826332) | Original keycaps, terminal and connector atlas with traveling signals | Generated original UI texture and decorative signals; no working authentication or copied interface |

## Controls

Choose the study, then adjust animation, speed, still time, intensity, pointer
response and credits. The dither study also has a pixel-size control measured in
**CSS pixels**, rather than device pixels. Color controls accept Framer's CSS
colors; the renderer is opaque and ignores palette alpha. Use these palettes:

- Ordered terrain: primary `#efc8c8`, secondary `#d6b442`, ink `#424855`.
- Point field: white additive points on black; intensity controls their light.
- Coronal: primary `#49efff`, secondary `#b12aff`.
- Wave: primary `#c6ff9f`, secondary `#b777ff`.

MaterialCodingStudy adds **Scale** for its four modes, **Focus** for capsules,
**Refraction** for glass and **Grain** for the spectral ring. Its palette controls
change the material colors. Shared controls retain animation, speed, still time,
intensity, pointer response and source labels.

PointCodingStudy adds **Scale** and **Density** for its four point-built surfaces.
FieldCodingStudy exposes **Scale** and spatial **Grain** for the four field modes.
InterfaceCodingStudy adds **Scale**, **Echo depth** for afterimages,
**Refraction** for glass glyphs and **Grain** for chromatic loops. Palette controls
change the authored colors; the source credits remain attached to each mode.

**Canvas motion** defaults off. With animation enabled, opting in allows motion
on the Framer editor canvas at up to **12 fps and 1,000,000 pixels**. All five components
use `RenderTarget.canvas` together with `useIsStaticRenderer` to distinguish
that authoring target from exports and thumbnails, which remain frozen at
**Still time**.

Framer Preview runs at up to **30 fps and 1,000,000 pixels**, with DPR capped at
2. Visitors can pause and resume it with a keyboard-accessible button. Canvas
motion is an instance-level authoring choice and does not change the export
policy.

All five standalone files share a coordinator through `Symbol.for` in their
browser window. It allows at most **two WebGL contexts**, including initial
compilation, with **one editor animation** or **two Preview animations**. A
visible card without a live slot keeps a locally generated frame on a 2D canvas.
The overview therefore retains the shader artwork while releasing its GPU
context. These frames come from the authored code, not the external source
posters. A bounded cache shares matching stills between placements.

Generated stills are rendered one job per task at the required screen resolution,
up to **2,000,000 pixels**. Raster tiers follow transformed screen size and DPR,
with a minimum 384px long edge, and refresh when zoom or display density grows.
Shader CSS dimensions stay untransformed, so zoom does not change the meaning
of pixel-size controls. Mounted offscreen cards receive a small initial frame;
visible cards refine without requiring hover or Play. Small cards remain still;
close-up cards can animate, with hover, keyboard focus and Play giving priority.
Releasing a live slot retains its sharp frame and animation phase. Hidden and
offscreen cards release GPU contexts; reduced motion holds generated stills.
The limit applies within one browser window/JavaScript realm, not across tabs
or unrelated Framer iframes.

The shared still cache is bounded by **8 million pixels and 64 entries**.
Retained display buffers have a separate **24 million pixel** budget; memory
pressure can reduce offscreen buffers, which refine again when visible. A cache
hit must have enough detail for the current view. Failed cache copies retain
the previous frame and allow other cards to continue loading.

Exports and thumbnails render synchronously at **Still time**, copy their
generated frame to 2D, then dispose the temporary GPU renderer. They do not wait
for viewport admission. Existing live leases are released before this one-shot
render, so static capture also respects the shared context limit.

Run `nix develop -c pnpm check:framer-studies` or build
`nix build .#checks.x86_64-linux.framer-studies --no-link` for the resource
regression suite. It exercises the five actual source modules with deterministic
DOM/WebGL doubles: mixed placements, queue progress, context ownership, phase,
pause, visibility, reduced motion, static targets, StrictMode and isolated
render/copy failures. It does not execute GLSL; actual browser and Framer visual
checks remain necessary.

Source labels and links accompany each placement. If labels are hidden for a
material-only experiment, keep its external credit card beside the component.
Keep independently composed Monarchic work in Original compositions.

## Authoring and handoff

Edit the TSX source in this repository, then deliberately apply it to Framer's
code file through MCP or the code editor. This is a manual authoring workflow,
not synchronization with the website. Inspect Framer's returned code diagnostics,
check the affected modes, and reload the actual editor before recording placement
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

## Earlier four-study revision — saved proof

The revision adds LC-04 / Wave on a second row of the live area and appends a
fourth card to the same draft lab. The earlier LC-01–03 live cards retain their
geometry. CC-001, CC-003, CC-005 and CC-010 have code components as their main
reference-card artwork, with the external posters retained as comparison
thumbnails. Each adaptation keeps its source credit and its own classification.

At that stage the saved inventory was **20 native studies, four live studies,
18 originals and 77 source entries**. Its eight source-led adaptations comprised
four static native studies and four live studies; additional placements do not
create new studies.
The live area was 3,500px high and the Source frame was 17,300px high. All twelve
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
three-study and four-study verification as historical evidence.

## Material revision — saved and verified

LC-05–08 add capsules, refractive UI glass, recursive triangles and a grainy
spectral ring through MaterialCodingStudy. All four modes have compiled on the
GPU and their local visuals have been reviewed. A fresh editor reload and
**31,799 native-state assertions** confirmed their saved placements, exact
controls, source thumbnails, credit links and geometry.

At that stage the saved inventory was **eight live studies and 24 code instances**, alongside
the same 20 native studies, 18 originals and 77 source entries: **28 source
studies** in total. Twelve source-led adaptations comprise four static native
studies and eight live studies. Each new study has a live-area card, a draft-lab card and main artwork on its
corresponding reference card; external source posters remain comparison
thumbnails. The existing twelve code instances and four earlier live cards are
retained.

The layout fills vacant live-area cells: LC-05 at `(2410, 1820)`, LC-06 at
`(4760, 1820)`, LC-07 at `(60, 3520)` and LC-08 at `(2410, 3520)`. The
live-area height is 5,200px inside a 19,000px Source frame. The lab keeps its
existing draft route. The earlier 615-check proof applies to the four-study
round only.

All four new studies rendered, changed between measured frames and paused and
resumed in actual Framer Preview. All four reference-card artworks rendered;
Spectral motion was also measured on the editor canvas. Fresh baseline
comparisons preserve all 20 native study trees, 18 original groups, 73 untouched
reference trees, all 77 reference group IDs, the earlier four main/lab cards and
their twelve code instances. The four intentionally revised reference cards
retain their original poster assets and credits. The original four-mode
component source remained unchanged during that material revision.

Proof inputs and screenshots for that eight-study revision are retained in this
task's local `live-material-studies` artifacts. Exact source algorithms, complete source
clips and physical material fidelity remain unverified. No actual Framer export
image was manually inspected. The lab remains an unpublished draft, and these
authoring changes do not integrate the components into the production site.

## Twenty-reference completion — saved and verified

LC-09–20 extend the authored set to all twenty bookmarked references with four
point surfaces, four light/relief fields, afterimages, glass glyphs, chromatic
loops and technical UI signals. The twelve new modes passed local GPU
compilation and changed between deterministic time samples; their local visuals
were reviewed. CC-002 retains both @threejs as the posting account and the
credited original display name [afterimage](https://x.com/i/status/2093373917218103449).
That support URL does not add a twenty-first bookmark. During that completion
round, both earlier component sources were byte-preserved and the earlier eight
study records remained unchanged. The later loading recovery updates all five
runtime files while preserving their shader formulas and property controls.

The saved inventory is **20 live studies and 60 code instances**:
one live-area card, one draft-lab card and one reference-card artwork per study.
Together with **20 native studies**, this is **40 source studies**;
**24 source-led adaptations** comprise four static native adaptations and
20 live adaptations. The **18 originals and 77 source URLs** retain their
identities. The expanded live area is **12,000px high**
inside a **25,800px Source frame**, with the same draft lab route. All source
posters stay as comparison thumbnails beside the executable artwork.

On 2026-10-23, fresh full navigation reloads of Source inspiration and the draft
lab, exact control readback and **35,886 native-state assertions** verified this
completion. All 20 native study trees, 18 original groups, all 77 reference IDs,
65 untouched reference subtrees, the earlier eight main/lab cards and their
24 code instances are preserved. The twelve revised reference cards retain
their source posters, credits and evidence. All five code sources match their
accepted Framer readback, with no code diagnostics. The live-area heading and
Source guide both reflect the full twenty-study set.

All twelve new studies rendered and changed between aligned frames in actual
Framer Preview; each Pause/Play transition was checked. Representative
editor-canvas motion was measured for LC-09, LC-13 and LC-20. The final LC-20
technical view was visually checked after its duplicate overlay title was
removed, while retaining the credit, eyebrow and native heading. CC-002's
credited-original link and source-led classification remain visible.

Proof and screenshots for that completion round are retained in this task's local
`live-complete-creative-coding` artifacts. The 31,799-check proof above describes
the earlier eight-study revision, and the 615-check proof describes its earlier
four-study revision. Source algorithms, complete clips and physical fidelity
remain unverified. No actual Framer export image was manually inspected. The
lab remains an unpublished draft; these authoring changes do not integrate the
components into the production site.

## Initial loading recovery — historical verification

The editor displayed **Failed to load canvas** at 13% zoom. Pausing the sixty
Canvas motion flags, closing the duplicate verification tab and reloading
recovered it. Investigation found eager allocations and offscreen retained
contexts; per-instance frame/pixel caps did not bound the full board. The exact
original failure cause was not conclusively isolated.

This round introduced a shared two-context coordinator with 24,000-pixel stills
and 150,000-pixel editor animation. Its shader literals and complete
property-control schemas remained byte-identical. The five existing Framer files
accepted those updated sources with exact hash readbacks,
empty diagnostics and unchanged component export IDs. All sixty temporary
motion flags were restored, with every saved control and geometry field matching
the pre-pause baseline.

Fresh editor navigation loaded the full Source board at 3%, all twenty live-area
studies at 5%, and the Coronal close-up at 40%. The forty Source displays finished
warming with 40,174 total 2D buffer pixels in that overview. Aligned screenshots
confirmed Coronal editor motion and Preview motion for one study from each of
the five component families. Temporal Preview pause/resume also worked. No
browser warning/error or graphics-fallback message was observed.

**34,179 native-state assertions** compared complete Source, Original and Lab
trees with the completed twenty-study round, excluding module revision hints.
At that stage, all placements, source assets, credits, controls and geometry were preserved.
The earlier 35,886-check proof is retained as historical evidence in the manifest.
This verifies saved presence and preservation; it does not establish adequate
raster quality when zooming into the artwork.

The eleven-case regression suite and its Nix flake check passed. A separate browser
harness mounted all five actual modules as sixty mixed placements: all sixty
generated overview frames appeared, with one peak GPU context during cold
warming and none retained afterward. Static export and thumbnail targets each
completed sixty generated frames at Still time and released all GPU contexts.
These target checks used a local React/Framer harness; no PNG exported by the
Framer desktop app or generated project thumbnail was inspected. The web editor
did not expose asset-export controls.

Later inspection found that size-independent cache keys, the small still cap and
downscaling on slot release left close-ups blurry. The initial tests checked
frame presence and resource limits; they did not require every visible card to
refine after zoom or retain sharpness after handoff.

Proof, source baselines, receipts and screenshots for this initial round are retained in this
task's local `framer-loading-recovery` artifacts. The draft lab and production
website remain separate; nothing was published.

## Quality correction and four-page organization

The correction separates GPU ownership from retained image quality. Visible
cards refine to their screen-size/DPR raster tier without requiring focus, and
cache hits must provide enough source pixels. Releasing a live slot retains the
displayed phase, pointer and sharp frame. Shader CSS dimensions remain logical,
so zoom does not redefine the dither pixel-size control. Turning Mouse off while
paused clears its held pointer effect.

The current limits are two shared contexts, one editor animation or two Preview
animations, one million pixels per live renderer and two million per generated
still. Raster tiers have a 384px minimum long edge, 128px steps and DPR capped at
2. The matching-still cache holds at most eight million pixels and 64 entries;
offscreen display buffers can be reduced under the separate 24-million-pixel
budget. All five shader literal sets and property-control schemas remain
unchanged.

Before the page split, fresh Framer reloads showed all 20 visible studies meeting
their raster demand in the 5% live-gallery view, all 18 visible displays meeting
demand at 13%, and all four visible displays meeting demand in the 40% Coronal
view. Aligned artwork measurements confirmed editor motion for one mode from
each of the five component families. **34,179 native-state assertions** verified
the complete saved trees before any page reorganization. That proof is retained
separately; it does not describe the intentional reparenting and outer layout
changes of the later page split.

The twelve-group regression checks all sixty spatial placements, 36 combinations
of placement type, zoom and DPR, focus-free upgrades, pan/cache reuse, retained
phase and pointer, failed-resize rollback and queue recovery. The Nix check
passes. In the real-GPU harness, all 44 visible overview cards matched fresh
same-phase/pointer shader renders, covering all twenty modes; two close-up
comparisons at DPR 2 also passed. These comparisons use actual effective source
resolution and artwork detail, rather than treating a nonempty buffer as proof
of a usable image.

The large board is now separated into four design pages, each opened after fresh
navigation and visually inspected:

| Design page | Contents |
| --- | --- |
| [01 / Reference library](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=uj_I7x6To) | 77 source entries, including the 20 code reference artworks and their source-poster comparisons |
| [02 / Recreations](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=a_19JJYFC) | 20 native editable RE studies |
| [03 / Originals](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=sZvxQvQHd) | 18 independent MB compositions |
| [04 / Live Creative Coding](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=bY_Q8AQKP) | 20 live code-study cards |

The sixty code instances are distributed across the Reference library, Live
Creative Coding and the existing draft lab: twenty in each. All twenty visible
code displays met their raster demand after the Reference and Live pages were
reloaded; Recreations and Originals contain no code-component instances. The
reference Source frame is now 6,100px high. Whole authoring frames moved to the
new pages, while reference categories were arranged into a smaller library.
Study IDs, controls, credits and internal artwork geometry stay distinct from
these intentional parent and outer-position changes. The pre-split 34,179-check
comparison does not claim that the reorganized page trees are unchanged.

Quality proof, source readbacks, native copies and screenshots are retained in
this task's local `framer-quality-recovery` artifacts. No actual Framer-exported
PNG or generated project thumbnail was manually inspected. The lab remains an
unpublished draft and the production website does not import these components.
