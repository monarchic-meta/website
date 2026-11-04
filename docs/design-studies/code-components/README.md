# Live Creative Coding studies

The [project organization guide](../../framer-organization.md) records the
2026-10-31 Design folders and runnable Web playground routes, with stable page
links and verification status. Earlier manifests preserve the names and paths
used by their dated proofs; consult the current map when opening a collection.

This page documents the twenty credited source-led studies. The eight
[original live compositions](originals.md) have their own Design page, draft
Preview lab, source files and [manifest](originals-manifest.json).
Thirteen [logo studies](logo-studies.md) have a separate Design page and draft lab,
using the canonical Monarchic SVG in independently authored live treatments.
The six line-motion studies use SVG masks and vector motion without allocating
WebGL contexts; the seven material treatments share the existing GPU budget,
including three monochrome 3D extrusions.

The [website brain field](website-brain.md) is a separate manual port of the
implemented Monarchic homepage element. It preserves that element's anatomical
Canvas 2D fibers and interactions in a reusable Framer component, rather than
adding another source-led bookmark adaptation.
Its separate [WB-02 ordered-dither variant](website-brain-dither.md) explores a
limited-palette live surface while preserving the original port.
The [WB-03 text-dither](website-brain-text.md) and
[WB-04 refined-fiber](website-brain-fibers.md) studies explore live glyphs and
finer anatomical bundles as separate additive treatments.
Their [loading performance handoff](website-brain-performance.md) records the
shared anatomy/plans, optional persistent cache and scoped before/after samples.
The separate [WB-05 / WB-06 solid-brain studies](solid-brain.md) use a credited
MNI MRI-template triangle mesh for dither and text treatments; their handoff
records mesh provenance, retained licensing and saved Framer verification.

The separate [hero recreation handoff](../hero-recreation-handoff.md) covers six
first-wave HERO references: four native studies and the Type Face/Cantor8 modes
of [HeroRecreationStudy.tsx](HeroRecreationStudy.tsx). These source-led studies
are separate from the twenty Creative Coding bookmarks and from independently
composed originals. The [complete-set handoff](../hero-recreation-complete-handoff.md)
adds the remaining twelve references, with eight native artworks and five live
counterparts, including both native and live Origin studies. The handoffs
distinguish local code validation from actual Framer placement, reload and
Preview evidence.

## Cantor8 opening and Foundation

[SourceCantorOpening.tsx](SourceCantorOpening.tsx) supplies native overrides for
HERO-007’s viewport opening, eleven-link Phone menu and ordinary Foundation
handoff. It retains the existing instrument and five hover/backdrop overrides;
no renderer, timer or animation loop is added. The source-led work remains
credited in Source inspiration.

The [provenance](assets/source-cantor-opening-provenance.json) separates its
50 passing local checks and completed native model authoring through MCP664
from pending actual paint, Preview and editor reload.
The fixture uses genuine source fonts as fixed external comparison inputs;
they are not copied into the repository or runtime. Native font admission has
its own bounded pilot. Rolling line hover/reveal has a separate module below.

```sh
nix build .#checks.x86_64-linux.source-cantor-opening --max-jobs 1 --cores 2
```

[SourceCantorRollingText.tsx](SourceCantorRollingText.tsx) adds the original
ten-label950ms roll and seven-link320ms opacity relation. Its43 focused checks
cover actual moving pixels, focus, edited text, frozen rendering and cleanup.
The [rolling provenance](assets/source-cantor-rolling-text-provenance.json)
keeps actual Framer admission, source-state comparison and reload distinct.

```sh
nix build .#checks.x86_64-linux.source-cantor-rolling-text --max-jobs 1 --cores 2
```

## Ajedrez measured word motion

The [two-track continuation](assets/source-ajedrez-two-track-extension-provenance.json)
adds144 literal glyph-geometry placements across74 recorded frames to
[SourceAjedrezSequence.tsx](SourceAjedrezSequence.tsx). Four overlapping-ink
states retain their baseline pose; the other82 actors still use sampled holds.
It preserves the earlier ten measured placements, independent wording and
existing shared clock. The40 focused checks and12 strict checks cover local
behavior; actual Framer delivery, Preview and reload remain separate.

Run `pnpm run check:source-ajedrez-two-track-extension`, or the matching Nix
check with `--max-jobs 1 --cores 2`. The older measured-word-fit entry point
delegates to this stronger suite for the current source and retains its earlier
assertions when explicitly given the historical five-frame source.

[SourceCantorOpeningRolling.tsx](SourceCantorOpeningRolling.tsx) is the separate
manual same-module package for the existing Opening code file. It preserves
all52 prior overrides and adds four rolling controls. Its
[package proof](assets/source-cantor-opening-rolling-provenance.json) records
51 rolling and52 retained Opening checks; the corrected native plan uses11
active families rather than the earlier hidden text layers. Framer source and11-family/22-copy bindings are independently read through793.
Actual paint, Preview and reload remain open. The leaf files above remain authoring inputs.

## MECHA Phone navigation

[SourceMechaPhoneNavigation.tsx](SourceMechaPhoneNavigation.tsx) preserves the
complete47-role Tomorrow/Contact source and adds30 menu roles in the same module.
The Phone menu uses the source clip transition, staggered four-link grid and
separate Join action. Its34 focused checks include rendered positions, link
defaults, the existing Contact context and the991/992 responsive boundary.

The complete35-family/70-part menu and74 bindings are independently read through835.
The [manual handoff](source-mecha-phone-navigation.md) and
[provenance](assets/source-mecha-phone-navigation-provenance.json) separate source
observations, local proof and authored Native state. Actual Preview and reload
remain unverified.

## Mecha contact mark

The named `MechaContactMark` export in [MechaScrollMark.tsx](MechaScrollMark.tsx)
recreates HERO-015’s contact-panel model using its genuine geometry and source
camera. It keeps translucent maroon and opaque cyan materials on a transparent
canvas. The existing renderer and eight default controls remain byte-exact.

Its [provenance](assets/mecha-scroll-mark-provenance.json) records eight strict
and coordinator checks plus 27 browser checks. The shared context limit remains
two; an additional 8MP alpha-output ledger makes the combined retained-display
ceiling 32MP. Source blending, spin timing and actual Framer composition retain
separate fidelity and Preview gates. The work is credited Source inspiration.

```sh
nix build .#checks.x86_64-linux.mecha-contact-mark --max-jobs 1 --cores 2
```

## Mecha contact panel

[SourceMechaContact.tsx](SourceMechaContact.tsx) composes the existing Tomorrow
sheet with a separate source contact dialog. Its40 native overrides preserve
the opening/closing timeline, editable fields and independent Phone scrolling.
The live mark above remains a separate component.

The [panel provenance](assets/source-mecha-contact-provenance.json) records57
local checks with genuine external comparison fonts. All48 native families/96parts and104 bindings are authored through773;
actual Framer runtime remains a separate gate. Source fonts are absent
from the current project; native and live fallback faces remain explicit fits.
The prototype retains a draft without submitting it or inventing success.

```sh
nix build .#checks.x86_64-linux.source-mecha-contact --max-jobs 1 --cores 2
```

[SourceMechaTomorrowContact.tsx](SourceMechaTomorrowContact.tsx) is the manual
same-module package for Framer’s existing Tomorrow code file. It preserves the
old15,281-byte controller and its seven exports, then adds40 Contact overrides
with private names isolated. Its [package proof](assets/source-mecha-tomorrow-contact-bundle-provenance.json)
records64 Contact checks and74 retained Tomorrow checks, including both panels
using the same provider. Framer source classification is positive through764, and all104 bindings
across96 native parts are independently read through773. Actual Preview and
reload remain independent gates.

The original leaf files above remain authoring inputs. Rebuilding is explicit:
`node scripts/build-source-mecha-tomorrow-contact.mjs --out /absolute/directory`.
This creates reviewable files without editing Framer or starting synchronization.

## FORMAT reading navigation

The six added overrides in [SourceHeroNativeBehaviors.tsx](SourceHeroNativeBehaviors.tsx)
recreate the separate upward-scroll bar, its mode buttons, source credits and
footer dismissal. All50 earlier roles remain byte-for-byte intact. The
[54-check proof](assets/source-format-back-navigation-provenance.json) compares
the original behavior/CSS and font geometry. Source56 is independently read
through775; all19 native families/57parts and45 bindings are independently read through787. Actual Framer paint, Preview
and reload remain open.

## FORMAT introductory clock

The seven added native overrides in [SourceFormatDetails.tsx](SourceFormatDetails.tsx)
recreate the ordinary introductory clock and its three viewport circles. The
prior144 overrides remain byte-exact. No renderer, media or wall clock is added;
one finite controller updates only while geometry changes.

The [provenance](assets/source-format-intro-clock-provenance.json) records85
passing local checks and native authoring through MCP684:23 families/69 copies
and126 genuine font tuples. Actual paint, Preview and reload remain open.
All eighteen Notes are authored through817. The alternate artwork/Sparks
chapters are authored through720/741; actual corresponding-state painting and
interaction comparisons remain separate.

```sh
nix build .#checks.x86_64-linux.source-format-intro-clock --max-jobs 1 --cores 2
```

## FORMAT source notes

[SourceFormatSharedNotes.tsx](SourceFormatSharedNotes.tsx) is the manual
same-module package containing the preserved Shared56 prefix and191 Details/Notes
roles. It reuses one Notes/Daughter store and the existing source layout. The
leaf [SourceFormatDetails.tsx](SourceFormatDetails.tsx) and
[SourceHeroNativeBehaviors.tsx](SourceHeroNativeBehaviors.tsx) remain retained
authoring inputs; Framer receives the combined247-role artifact.

The [package proof](assets/source-format-shared-notes-provenance.json) records
the source/shared browser regression,10 strict checks and52 Notes checks. All18
annotations retain source geometry,50ms stagger and matching tail pixels; their
copy is independently paraphrased. All91 editable families/273 native parts,
324 font tuples and1,572 role assignments are independently read through817.
No old Details-module references remain in this page; its file remains intact
for other owners. Actual paint, Preview and reload remain open.

`nix build .#checks.x86_64-linux.source-format-shared-notes --max-jobs 1 --cores 2`

## FORMAT alternate artwork effects

The 24 appended roles in [SourceHeroNativeBehaviors.tsx](SourceHeroNativeBehaviors.tsx)
add finite pixel reveals to 22 genuine artworks and scroll-driven corners to two
native plates. The previous 25 roles remain byte-exact. Source images stay
editable; temporary Canvas2D buffers disappear when the reveal finishes.

The [provenance](assets/source-format-daughter-provenance.json) records 40 focused
checks and the retained shared-module regression. Decoding is serial, temporary
buffers share a 2MP limit, and Canvas/export/thumbnail remain still. Failed or
interrupted work retains the native image. Framer authoring is read back through
MCP720: 11 new families, 33 Frame copies and 72 role assignments. Actual paint,
Preview and reload remain open. The separate four-sprite button effect is authored through MCP741; actual
Preview and reload remain open.

```sh
nix build .#checks.x86_64-linux.source-format-daughter-effects --max-jobs 1 --cores 2
```

## FORMAT Daughter particles

The appended `withFormatDaughterSparks` role in
[SourceHeroNativeBehaviors.tsx](SourceHeroNativeBehaviors.tsx) composes the
existing Daughter button. Four genuine source images follow its recorded
per-tick motion after an accepted activation. The prior 49 roles remain exact.

The [provenance](assets/source-format-daughter-sparks-provenance.json) records
34 portable checks, source-only Canvas/static freezes, serial decoding and
bounded bursts. Framer source and the three button copies are read back through
MCP741. Actual input, painting and reload remain open.

```sh
nix build .#checks.x86_64-linux.source-format-daughter-sparks --max-jobs 1 --cores 2
```

## Native source-video playback

[SourceNativeVideoVisibility.tsx](SourceNativeVideoVisibility.tsx) supplies the
`withVisibleNativeVideo` override for an existing native Video. Its first target
is HERO-006's genuine Eco-End film. It preserves the media and native controls,
pauses hidden/offscreen playback, and retains a manual Pause across viewport
and host changes. Canvas, export, thumbnail and reduced motion request stills;
the override creates no decoder, canvas, timer or animation loop.

Use `withVisibleManualNativeVideo` for source media that should wait for Play.
It keeps Playing disabled until an admitted native Play event, retains manual
Pause across viewport/host changes, and can resume previously started media
when it returns to view. The original override manages autoplay source loops.
Both use the same visibility and cleanup implementation. The native player's
Play controls must remain available while Playing is disabled; this still
requires verification on the actual Framer instances.

The [provenance](assets/source-native-video-visibility-provenance.json) records
the focused Nix check and the integration boundary. The native-like React test
does not prove Framer's native host-ref or Playing-prop bridge. Keep serialized
Playing enabled until that bridge is observed in actual Preview; a missing live
host retains the caller's playback value. Actual offscreen suspension, idle
editor behavior and persistence after reload remain unverified.

```sh
nix build .#checks.x86_64-linux.source-native-video-visibility --max-jobs 1 --cores 2
```

## Original hero component

[OriginalHeroStudy.tsx](OriginalHeroStudy.tsx) supplies nine independently
composed Canvas 2D modes for the [original hero round](../original-heroes/handoff.md).
Information fields, geometric identity and editorial research montage are
explored separately before three combinations. Primary copy, links and layout
remain native editable layers. The existing Monarchic mark used in two modes
retains its pinned provenance; the mark itself is not newly authored.

The component exposes composition, motion, structure, artwork size, tonal pitch,
pointer and palette controls. Its automatic palette follows the selected mode;
the saved compositions use explicit custom palettes. Change the native stage
fill along with the artwork background to retain the seamless field. Canvas
motion starts off, Preview starts animated, and exports/thumbnails remain
frozen. The shared coordinator governs resolution, caching and live admission.

```sh
nix develop --command pnpm run check:original-hero-study
nix develop --command pnpm run check:original-hero-integration
nix develop --command pnpm run check:original-hero-browser
nix build .#checks.x86_64-linux.original-heroes --no-link -L
```

Local renderer/resource checks and actual Framer saved-state, typography and
interaction checks are separate evidence in the handoff.

## Hero recreation component

Choose `typeface` for HERO-001's wrapped surface writing or `cantor` for
HERO-007's bounded filament field. These are credited source-led adaptations:
the head geometry/text/font are substitutes, rotation is approximate with no
assembly/dispersal, and Cantor8 uses independently written curve motion with
static peripheral labels. The visible credits identify Stephen Kelman and
Cantor8 / website by Artemii Lebedev.

Preview animation defaults on; **Canvas motion defaults off** and only opts the
editor target into motion. `Animate`, `Speed`, `Still time`, `Motion span` and
`Pointer` control replay and pose. `Scale`, `Density`, `Type scale` and the color
controls adjust the appearance. `Labels / credits` defaults on; retain visible
wrapper attribution when hiding it. Exports/thumbnails stay frozen.

The embedded Lee Perry-Smith head has no runtime model fetch or three.js
dependency. Its [asset-specific CC BY 3.0 record](assets/hero-head-license.txt)
retains the exact upstream Git blob, author and quantization/material changes;
it is not verified as Kelman's source mesh. The writing atlas is a separate
**1,048,576 texels**, in addition to the shared output-pixel budget. The existing
shared coordinator still limits contexts, editor/Preview motion and serial
still refinement.

Run the local checks with the flake environment:

```sh
nix develop --command pnpm run check:hero-recreation-study
nix develop --command pnpm run check:hero-study-integration
nix develop --command pnpm run check:hero-recreation-browser
```

The focused check covers types, provenance and lifecycle. The integration check
exercises 66 mixed placements in each Canvas/Preview target across the five
legacy factories and Hero, including shared resource, resolution and submitted
shader/pose state. The browser check compiles actual GLSL and checks
software-WebGL pixels, replay and restoration. The flake's `hero-recreations`
check groups these three commands.
It declares DejaVu through Fontconfig for usable Canvas glyphs in the isolated
Nix browser environment; this does not change the Framer renderer or its
artwork thresholds.
Actual Framer reload/Preview evidence is separate in the handoff.
The first wave is saved and reload verified; both modes pass actual
Desktop/Phone Preview motion and pause/resume, with separate editor Canvas
checks. All eighteen source-led references are covered by the complete-set
handoff.

Regenerate the pinned embedded mesh only when needed with
`nix develop --command pnpm run build:framer-hero-head`; that package script
already includes `--write` and validates the upstream blob before changing the
authoring source.

## Additional hero mechanisms

[HeroMechanismStudy.tsx](HeroMechanismStudy.tsx) supplies five independently
implemented renderers for credited source-led recreations and adaptations:

| Mode | Reference | Runtime mechanism and limits |
| --- | --- | --- |
| `macmoss` | HERO-006 / Mac Moss / KEEN | Four source-identified animated symbol cells, reconstructed as two-tone vector contours sampled at 12 fps. The other sixteen cells are omitted. No GIF, pixel mask or remote media is displayed at runtime. |
| `vercel` | HERO-009 / Vercel | Canvas paths and gradients approximate the selected dark triangle and asymmetric halo. Motion is independently authored; exact archive timing is unverified. |
| `raster` | HERO-014 / Liubomyr Ulytskyi | WebGL renders the selected portrait composition's raster/scan treatment. The licensed Lee Perry-Smith head is an explicit geometry stand-in, with changed typography and camera motion. |
| `mecha` | HERO-015 / Widelab, Grzegorz Leśniewicz | Canvas 2D projects crease edges derived from the inspected source mark, with approximate hidden lines and timed orientation. Geometry remains source-led; no independent asset-license claim or full scroll sequence. |
| `origin` | HERO-016 / Origin Studio | Three procedural blurred light forms approximate the changing small source tile. The native hero composition is a separate counterpart. |

The [provenance record](assets/hero-mechanism-provenance.json) identifies source
assets, selected cells, mesh topology, hashes, stand-ins and omissions. Preserve
the [head's CC BY 3.0 credit](assets/hero-head-license.txt). Retain visible wrapper
attribution if disabling `Labels / credits`.

`Animate`, `Speed`, `Still time`, `Motion span` and `Pointer` control playback.
`Artwork size` changes the artwork inside its logical layout, without using
Framer's placement-scale field. Mode-specific controls expose density, light,
blur, raster pitch and colors. `Canvas motion` defaults off and only enables
motion on the editor canvas; Preview animates by default. Exports and thumbnails
remain frozen. These modes use the same shared coordinator and resource limits
as the earlier studies, including fresh renderer surfaces when changing between
Canvas 2D and WebGL.

```sh
nix develop --command pnpm run check:hero-mechanism-study
nix develop --command pnpm run check:hero-mechanism-integration
nix develop --command pnpm run check:hero-mechanism-browser
nix build .#checks.x86_64-linux.hero-mechanisms --no-link -L
```

The focused check covers strict types, pinned payloads, controls and lifecycle.
The new integration harness exercises all seven actual factories as 81 mixed
placements per target, retaining the older harness unchanged. Its bounded
recording host checks vector paths/gradients and shader state, cache adequacy,
context-kind changes and shared limits. The browser check inspects actual
Canvas/WebGL pixels at desktop and phone sizes, including portrait quality
independently of its red bars. Framer saved-state and motion evidence belongs in
the complete-set handoff; these local checks do not establish a Framer save or
hardware performance.

To regenerate the pinned source-derived vectors/mark, provide inspected local
copies of the exact source assets to the offline preparation command:

```sh
nix run .#prepare-framer-hero-mechanisms -- \
  --mac-gif /absolute/path/Comp_3.gif \
  --mecha-glb /absolute/path/M_Mecha._v2.glb \
  --output /absolute/path/preparation-artifacts
```

The Nix app supplies Node, pnpm and ffmpeg. The builder checks both input hashes
before processing; add `--write` only to update the embedded authoring data.
Original GIF/GLB files and source JavaScript are not runtime dependencies.

## Creative Coding component inventory

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
| LC-01 / Ordered terrain | [CC-003 / @GaloAndStuff](https://x.com/GaloAndStuff/status/2094074141557117090) | Close ray-marched folded terrain without a horizon, three-tone ordered dithering and pointer-controlled viewpoint | Independent terrain and 4×4 Bayer tonal construction; source geometry, camera path and timing are approximated |
| LC-02 / Suspended point field | [CC-001 / @yuruyurau](https://x.com/yuruyurau/status/2093710258120331463) | 13,248 GPU points form a compact canopy, narrow throat, reopened hanging drape and loose curling tails | Independently parameterized surface and motion; no source formula or point data |
| LC-03 / Coronal light | [CC-005 / @XorDev](https://x.com/XorDev/status/2093488121392300374) | Volumetric cyan/magenta aperture with uneven translucent folds, localized white-hot filaments and escaping plumes | Independent density/noise field and approximate emission; source shader and exact light model are not adopted |
| LC-04 / Wave | [CC-010 / @XorDev](https://x.com/XorDev/status/2093074820661387392) | Narrow luminous folded spine with long irregular translucent streamers and pointer response | Independent ribbon geometry, contour field and motion; source shader and exact timing are not adopted |
| LC-05 / Capsule depth | [CC-004 / @kellymilligannz](https://x.com/kellymilligannz/status/2095011696180171077) | Scattered dark rods and end-on capsules with layered overlap and adjustable soft focus | Analytic capsule layers and a soft-focus approximation; no physical depth-of-field or source physics simulation |
| LC-06 / Glass refraction | [CC-008 / @AlbiaHossain](https://x.com/AlbiaHossain/status/2093330866143662498) | Five close-fitting uneven glass panes with fine seams and restrained refraction of a locally generated interface | Local Canvas 2D artwork and independently authored pane geometry; no screenshot, DOM capture or source-site asset |
| LC-07 / Triangle lattice | [CC-013 / @YoheiNishitsuji](https://x.com/YoheiNishitsuji/status/2098603831944945735) | Rotating six-level tetrahedral recursion with angular leaves and open triangular holes | Independent nearest-vertex iterated construction; source formula and exact geometry are not adopted |
| LC-08 / Spectral grain | [CC-016 / @Jaenam97](https://x.com/Jaenam97/status/2098418240900804947) | Reflective torus with broad silver material, a blue/yellow inner arc, cyan grazing band and grain | Ray-marched torus with an approximate environment and spectral material; not a path tracer or physical spectral simulation |
| LC-09 / Folded white point mesh | [CC-007 / @yuruyurau](https://x.com/yuruyurau/status/2093711731084415124) | Two lobed folded mesh patches with connected lengthwise/transverse filament families and loose rooted contours | Independent parametric topology; source formula and complete motion are not reproduced |
| LC-10 / Curling point gesture | [CC-014 / @yuruyurau](https://x.com/yuruyurau/status/2098075684593893667) | Two flared hanging mesh pouches with loosely curling upward/downward tendrils | Independent folded surfaces and contour families; part of the source poster remains cropped |
| LC-11 / Connected mesh loops | [CC-015 / @yuruyurau](https://x.com/yuruyurau/status/2098070701597192431) | Two separate irregular mesh pouches, one tilted with descending trails and one upright with rising tendrils | Independent pouch topology and temporal deformation; source algorithm and motion are unverified |
| LC-12 / Curved mesh feather | [CC-020 / @yuruyurau](https://x.com/yuruyurau/status/2100230050063024467) | Asymmetric C-curved plume with twelve fine swept mesh hooks and twenty-four related loose filaments | Independent curved spine, branching topology and motion; source formula and exact filaments are not reproduced |
| LC-13 / Electric radial / icy filaments | [CC-006 / @YoheiNishitsuji](https://x.com/YoheiNishitsuji/status/2106013834540732704) | Seven overlapping radial chamber tiers with smaller nested icy folds, dark blue gaps and a hot center | Independent polar chamber field approximates sampled optical volume; source shader and light model are not adopted |
| LC-14 / Icy ridge / layered flow | [CC-017 / @YoheiNishitsuji](https://x.com/YoheiNishitsuji/status/2098403689421570237) | Fine turbulent icy striations, a bright layered diagonal lip and a broader merging tributary | Independent advecting ridge field; source volume, geometry and timing are approximated |
| LC-15 / Warm corridor / recursive relief | [CC-018 / @XorDev](https://x.com/XorDev/status/2099543044945023343) | Forward-moving coarse chipped corridor relief, deep burgundy recesses and broad marbled yellow-white heated faces | Independently composed distance-field architecture and emission; no claim of source fractal recursion or physical lighting |
| LC-16 / Glyph trails / luminous gestures | [CC-019 / @tsumiki_room](https://x.com/tsumiki_room/status/2099891155282612462) | Varied luminous cursive loops, compact bright dashes, faint scratches, temporal echoes and subtle grain | Independent analytic writing paths and echo animation; no source glyph paths or TouchDesigner project |
| LC-17 / Temporal glyph / afterimages | [CC-002 / @threejs](https://x.com/threejs/status/2093387984741761280) | Compact filled bilateral wing glyph with warm pale glow, nested frames and restrained temporal afterimages | Independent wing geometry and echo algorithm; CC-002 also credits [afterimage](https://x.com/i/status/2093373917218103449) |
| LC-18 / Glass pixel glyphs / nine modules | [CC-009 / @dnatsuuu](https://x.com/dnatsuuu/status/2093175907867656302) | Nine glass modules with varied pixel-cat imagery, clear regions, thin beveled rims and offset front/rear imagery | Locally generated motifs and an approximate glass/environment model; no source pixels or exact physical simulation |
| LC-19 / Chromatic loops / granular surface | [CC-011 / @zozuar](https://x.com/zozuar/status/2094068054590190033) | One rotating over-under tubular knot with continuous chromatic transitions and granular shading | Independent parametric knot and motion; source formula and exact topology are not adopted |
| LC-20 / Technical keycaps / signal paths | [CC-012 / @icanvardar](https://x.com/icanvardar/status/2094171308795826332) | Four restrained technical diagram cards and a shell strip, animated keycaps, connector, ticket and revocation highlights | Locally drawn source-led diagram atlas and decorative signals; authentication and terminal behavior are not functional |

## Second live fidelity pass — 2026-10-29

All twenty studies were refined against archived sampled source frames and,
where available, direct source-poster inspection. The pass corrects source
structure as well as material: connected hanging mesh pouches replace the
figure-eight surface, finer curling branch meshes enrich the feather, smaller
nested chambers replace oversized radial leaves, and broad heated relief replaces
a uniform brick corridor. Glass, grain, dither, light, glyph and technical-diagram
studies also follow the inspected source compositions more closely. These remain
independently authored source-led approximations; the original algorithms,
complete source clips and matching motion are unverified.

Changes in Creative, Material, Point and Field are confined to their GLSL shader
literals. Interface also updates its local `paintPanel` texture artwork. Source
credits, controls, defaults, exports, renderer lifecycle and the shared GPU
coordinator remain unchanged. The resource-test double now supplies a
CanvasGradient with `addColorStop` for the local keycap artwork; existing
assertions remain intact.

Local validation passes: twelve resource-check groups across sixty mixed
placements with at most two contexts, TypeScript semantic checks with no
diagnostics, and all twelve shader literals compiled with Nix-provided GLSL
validation. The actual GPU comparison rendered all twenty final studies at
phases 0, 8 and 16, producing sixty source-hashed frames without renderer errors.

The five existing Framer files returned byte-exact source with unchanged
component IDs and exports, and no code diagnostics. Independent fresh-main
verification retained all sixty placement controls and geometry, twenty native
artwork/credit trees, seventy-seven source groups (sixty-six preview assets and
eleven link-only cards), eighteen originals and four separate Design pages.
After actual editor reload, Live Creative Coding and the Reference library each
showed twenty ready generated artworks with a 384px minimum long edge; visible
artwork was also inspected at 13% zoom.

Aligned actual Preview screenshot pairs showed motion in all twenty modes.
LC-09 paused with zero changed artwork pixels, then resumed live. Separately,
LC-09 editor-canvas motion retained an 896 × 559 generated frame across roughly
873 × 546 CSS pixels. The current manifest records this second live-only proof;
the previous ten-study proof remains historical. Evidence is retained under
`live-refinement-round-two-2026-10-29` in this task's artifacts. These checks verify
saved authored behavior, while exact source algorithms and complete source-clip
motion fidelity remain unverified. No actual Framer-exported image was inspected,
and nothing was published or integrated into the production site.

## First sampled-frame fidelity pass — 2026-10-29 (historical)

The following records the earlier ten-study pass. The table and second-pass
section above describe the current twenty-study behavior.

Ten local studies were refined by comparing generated artwork with archived
sampled source stills:

- LC-03: thicker white-hot Coronal folds, asymmetric plumes and continuous color.
- LC-08: broader reflections across the metal body.
- LC-09: two distinct branching folded mesh patches.
- LC-12: a continuous curved feather body with subordinate barbs.
- LC-13: pointed petal chambers and closed nested contours.
- LC-14: irregular icy folds and crossing tributaries.
- LC-15: chipped relief, red surfaces and selective hot fractures.
- LC-16: a wider vocabulary of luminous marks.
- LC-17: a smaller filled wing silhouette with rounded chambers and shorter tips.
- LC-18: deeper glass volumes, internal pixel imagery and tighter spacing.

The manifest records each change with its existing source key. These are visual
refinements from sampled stills, including partially cropped feed frames for
LC-08, LC-14 and LC-15. They do not establish exact source algorithms, complete
clip coverage or matching motion. The local pixel-cat artwork in LC-18 is an
authored approximation of the source's imagery class.

The shared renderer, resource budgets, public controls, defaults and source
credits are unchanged; the additional local texture edit is confined to the
glass pixel atlas. The twelve resource-check groups, TypeScript semantic checks
and offline GLSL validation pass.

The five existing Framer files accepted byte-exact source readback with unchanged
exports and no code diagnostics. All sixty saved code-instance controls and
geometry were preserved. After reload, Live Creative Coding and the Reference
library each showed twenty ready generated artworks with a 384px minimum long
edge; visible cards also refined automatically at 13% zoom. Representative
LC-09 editor-canvas motion retained an 896 × 559 generated frame across
873 × 546 CSS pixels.

Aligned actual Preview frames showed motion in all ten refined modes. LC-09
paused with no changed artwork pixels and resumed moving. The local GPU harness
also rendered all twenty modes at phases 0, 8 and 16 without errors. The manifest
keeps this live-only saved verification separate from the prior quality/page-split
proof and the native recreation revisions. Evidence is retained in this task's
`recreation-refinement-2026-10-29/live` and `live-validation` artifacts. Complete
source-clip fidelity and source algorithms remain unverified; no actual
Framer-exported image was inspected, and nothing was published or integrated into
the production site.

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
regression suite. It exercises the source-led, original and logo modules with deterministic
DOM/WebGL doubles: mixed placements, queue progress, context ownership, phase,
pause, visibility, reduced motion, static targets, StrictMode and isolated
render/copy failures. Separate runs retain 60 source-led placements, 84 including
the original compositions, and 96 including the logo treatments. It does not execute GLSL; actual browser and Framer visual
checks remain necessary.

Run `nix develop -c node scripts/check-framer-logo-drop.mjs` for the separate SVG
motion regression. It checks the real component hooks and shared clock with
deterministic host doubles: static targets, pause, visibility, reduced motion,
motion-slot limits, loop continuity and cleanup. Browser SVG rendering and actual
Framer playback are verified separately in the [logo handoff](logo-studies.md).

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

The separate [homepage explorations](../../framer-homepage-explorations-2026-10-30.md)
use an optional [HomepageNavigationInteractions.tsx](HomepageNavigationInteractions.tsx)
behavior wrapper around their editable native navigation. Attach it manually in
Framer using the returned override export ID. This helper adds no graphic study
or GPU context; production navigation, authentication and search services remain
separate implementation work. Run its focused lifecycle and interaction checks
with `nix develop -c pnpm check:homepage-navigation`, backed by
[check-homepage-navigation.mjs](../../../scripts/check-homepage-navigation.mjs).

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
