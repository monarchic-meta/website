# Solid brain surface studies

WB-05 (ordered dither) and WB-06 (text) are additive **Source inspiration**
studies using an MRI-template surface mesh. They address the request for a solid
brain with visible folds, rather than another treatment of the website's fiber
field. The four existing [website brain studies](website-brain-performance.md)
remain separate and unchanged.

The self-contained [SolidBrainStudy.tsx](SolidBrainStudy.tsx) shades the triangle
surface in WebGL, then applies a GPU tonal-dither or glyph-atlas pass. Material references
are [CC-003](../../design-inspiration/creative-coding.md#cc-003--pink--yellow-pixel-stipple-world)
for limited-palette tonal distribution and
[WEB-006](../../design-inspiration/web-ui.md#web-006--dither-cards-and-character-graphics)
for dither/text graphics. Those references do not supply the brain anatomy or a
verified rendering algorithm. Neither the anatomical mesh nor its folds were
newly authored for these studies.

## Anatomical source and attribution

The local [MZ3 asset](assets/mni152_2009mini.mz3) is pinned to Chris Rorden's
[Surf Ice sample](https://github.com/neurolabusc/surf-ice/blob/69f80b6e676ce56d1d99825c3579e59fc1e7e419/sample/mni152_2009mini.mz3):

| Field | Value |
| --- | --- |
| Repository commit | `69f80b6e676ce56d1d99825c3579e59fc1e7e419` |
| Path | `sample/mni152_2009mini.mz3` |
| Git blob | `55f8a2d872b0c976c5538e5c1e533ab77af03a03` |
| File size | 508,369 bytes |
| SHA-256 | `05f9c228c4608c47f2d11542fa2bb8b8d75d9f8c5bf2d3ed4930d303a72f95a7` |

The accompanying [primary reference](https://github.com/neurolabusc/surf-ice/blob/69f80b6e676ce56d1d99825c3579e59fc1e7e419/sample/Reference.txt)
describes `mni152_2009_50.gii` as an isosurface at intensity 50 of a
brain-extracted average template from 152 individuals, linked to the
[MNI ICBM152 nonlinear 2009 atlas](https://www.mcgill.ca/bic/software/tools-data-analysis/anatomical-mri/atlases/icbm152-non-linear-2009).
The [original addition](https://github.com/neurolabusc/surf-ice/commit/1642bd28c475c8d524f9302baeb2497e742366e4)
contains that reference and both the full and mini MZ3 files.
[Rorden's explanation](https://neurostars.org/t/how-to-draw-symbols-which-indicate-stimulation-locations-on-rendered-brain/26611/16)
confirms that the mini file contains fewer triangles. The reference uses the
older GII name; the mini reduction method and parameters are not documented in
these sources. This is an averaged intensity isosurface, not an individual
FreeSurfer pial reconstruction.

Retain credit to **MNI / Louis Collins / McConnell Brain Imaging Centre,
Montreal Neurological Institute, McGill University**, and to **Chris Rorden /
Surf Ice** for the distributed mesh. The atlas page permits use, copying,
modification and distribution with its copyright notice retained. The complete
notice and source URLs are in [mni152-LICENSE.txt](assets/mni152-LICENSE.txt).
The Surf Ice software's BSD license is not substituted for the atlas notice.

## Manual mesh preparation

[build-framer-brain-surface.mjs](../../../scripts/build-framer-brain-surface.mjs)
checks the pinned asset hash and prepares the embedded geometry locally. It
retains all **28,929 vertices and 58,038 triangles** from the mini file; the
repository preparation adds no further mesh decimation. Vertex reindexing
shortens topology deltas without changing connectivity.

The display transform is `[-Y, Z, -X]`, centered at the source bounds midpoint
and normalized so its largest dimension spans two units. Normals are
area-weighted, with a deterministic first-strongest-incident-face fallback at
36 source vertices whose opposing faces cancel the normal sum. Geometry and
topology remain intact. A local neighbor-based cavity term darkens recesses;
this is neither a visibility-based ambient-occlusion bake nor a physical light solve.

| Packed representation | Recorded result |
| --- | --- |
| Position encoding | 12 bits per coordinate |
| Maximum coordinate error | 0.0002441924 normalized units, about 0.022 mm at source scale |
| Normal encoding | Octahedral; maximum angular error 0.930719 degrees |
| Packed payload | 553,861 bytes; 738,484 base64 characters |
| Packed SHA-256 | `6da203c83dadcbd17084ac4dd3d35ef09765b05a21e8248d46ecd9e6caac382c` |

The payload is embedded for synchronous local decoding. It needs no runtime
mesh download, old fiber generation or persistent anatomy cache. Preparation is
a manual authoring step; it does not synchronize Framer or the production site.
The preparation receipt is `source/mesh-preparation.json` under the local
`solid-brain-studies-2026-10-31` artifact directory.

To regenerate the embedded section manually from the pinned local asset:

```sh
nix develop -c pnpm build:framer-brain-surface
```

## Component and controls

Frozen source: **797,649 bytes**, SHA-256
`c49251207b700decc5e6e10244a8a24479ca3713c388b6f262dad09c054d8374`.
One context renders the lit mesh into a color/depth framebuffer, then applies
the selected material in a full-screen pass. There is no per-frame CPU pixel
readback. The text atlas uses local system monospace glyphs; font appearance can
vary by platform. The default ramp is ` .:-=+*#%@` and glyph size is **6 CSS
pixels**. Pixel pitch and glyph size are converted to backing-raster cells,
with a one-physical-pixel floor, rather than using atlas dimensions as spacing.

Other defaults are Animate on, Canvas motion off, speed 0.65, still time 8,
scale 1, view angle −12°, exposure 1.05, contrast 1.1, Fold shade 0.85 and
pixel pitch 1.3. Gold, bone and ink default to `#ffd21a`, `#f2efda` and
`#000000`. Inspect controls pointer rotation; Pause retains the current phase
and camera through a resize. Touch, unchanged-position and recent-scroll
pointer moves are filtered in capture without preventing page pan.

The coordinator, surface hook and palette resolver are byte-identical to the
existing LogoStudy implementation. The runtime retains explicit editor-only
Canvas motion at **12 fps / 1 MP**, serial stills up to **2 MP**, frozen
exports/thumbnails and the shared two-context limit. The color/depth attachments
are additional memory; the pixel caps describe managed output dimensions.

An actual Framer Phone screenshot exposed overlap between the internal title
and the surface. The final fit changes only the minimum top allowance from
42 to 64 CSS pixels. At the default pose in a 351×320 logical surface, projected
anatomy now begins at 70.724 CSS pixels instead of 50.566, below the title's
roughly 60-pixel lower edge. Desktop framing remains unchanged at a projected
top of 89.719 CSS pixels in 704×582. These bounds are checked from submitted
matrices; final Framer Phone screenshots confirm clear titles in both modes.

## Local verification

```sh
nix develop -c pnpm check:solid-brain-study
```

The [focused check](../../../scripts/check-solid-brain-study.mjs), SHA-256
`82a3043084d3e8e5f28f03ad01cb10ccbe92094043736402df1eddc581ef3209`,
passes **22 groups** with strict semantic TypeScript. It covers pinned topology,
finite normals, decoder reuse, complete samplers, two-pass draw state, CSS cell
scaling, atlas reuse, exact managed resizing, paused-camera retention, pointer
capture, projected Phone title clearance, context restoration and
allocation-failure cleanup. Its driver/font doubles release all **14 allocated
contexts**, leave **zero resources**, perform
no renderer readbacks and respect the 2 MP bound. They do not establish actual
GPU image quality or frame rate.

The independent mesh audit reproduces the prepared outputs and verifies every
source position and triangle, all 36 fallback normals and eight malformed-codec
rejections. Evidence is in `validation/mesh-audit`; the renderer review and exact
context-handler delta are in `validation/renderer-review`. Current focused
receipts and source/test snapshots are in `validation/phone-framing-fix`;
`validation/renderer-final` retains the preceding 21-group source revision.

Local actual-WebGL samples cover both modes at Desktop and Phone dimensions,
with complete rendered anatomy and GL error 0. At the preceding `9081e79f`
revision, `WEBGL_lose_context` checks for text/Desktop and dither/Phone restore at phase 8
with error 0 and the same lit-pixel counts and aggregate color sums. Their
receipts are `browser/final-text-desktop-restoration.json` and
`browser/final-dither-phone-restoration-fixed.json`. The earlier failed
`final-dither-phone-restoration.json` and files marked `before-restorefix`
remain historical failures, not passing evidence. The final Phone-fit delta
changes framing only; geometry, shaders and context lifecycle are byte-identical
to that tested restoration revision. Its screenshots and pixel counts have not
been relabeled as the new fit.

Sampled local browser mesh decoding took roughly **24–47 ms**; CPU draw
submission was roughly **1–3 ms** in ordinary samples. Submission time does not
measure GPU completion or establish sustained fps, and these renderer samples
exclude Framer bootstrap. Text/Desktop resolves the default 6 CSS pixels to
about 6.536 physical pixels at a 768×634 raster for a 704×582 logical surface.

The retained `check:framer-studies` resource regressions also pass for the
unchanged eight older modules, including the 60-, 96- and 105-placement cases.
Their common coordinator supports the integration contract; they are not an
actual mixed execution of 109 placements including this new component. Actual
Framer integration is recorded separately below.

## Saved Framer pages and runtime

| Study | Draft page | Responsive nodes | Code instances: Desktop / Phone |
| --- | --- | --- | --- |
| WB-05 / Ordered surface | [Brain Surface Dither](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=fRamy0U53) | [Desktop](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=v3T1OJAka), [Phone](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=Iirn1z2LE) | `ZTEbm2TnF` / `Iirn1z2LEZTEbm2TnF` |
| WB-06 / Text surface | [Brain Surface Text](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=Co5wpXpOb) | [Desktop](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=ceCBydTKN), [Phone](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=P2KOmYOF5) | `QI_6LCFdc` / `P2KOmYOF5QI_6LCFdc` |

Draft routes are `/prototypes/brain-surface-dither` and
`/prototypes/brain-surface-text`. Both use `codeFile/iamvsi4:default`, with
byte-exact final source readback, no diagnostics and 18 registered controls.
Saved presets match the defaults above, with the appropriate study mode. The
Desktop art is 704×582 within a 1440-pixel layout; Phone uses a 390-pixel layout
and 320-pixel art height. Its observed Preview content width is 351 pixels.
Native provenance and comparison links connect the two solid studies and all
four retained fiber studies.

After final-source editor reloads, all four specimens are ready at phase 8,
report **28,929 vertices / 58,038 triangles**, and meet the inspected raster
demands: 384×317 Desktop and 384×335 Phone. Final Phone Preview screenshots show
clear internal titles in both modes. WB-05 Desktop Preview was left running.
Current observations are source-bound in `browser/framer-final-runtime.json`;
screenshots include `framer-dither-preview-final.png`,
`framer-dither-phone-final.png` and `framer-text-phone-final.png` in `browser`.

Canvas opt-in and pause/resize/Play were tested at the preceding `9081e79f`
source, before the sole Phone-fit constant changed. They remain explicitly
bound to that source in `browser/framer-canvas-preview-before-fit.json`:

- WB-05 Canvas advanced to phase 11.965 while Phone stayed at 8. Preview
  advanced 13.117→28.347; Pause held 28.42417 through Phone resize, and Play
  resumed at 28.48456.
- WB-06 Canvas advanced to phase 10.86 while Phone stayed at 8. Preview was
  live at 30.82455; Pause held 30.94253 through Phone resize, and Play resumed
  at 31.09359.

Both opt-ins were restored to No. The final-source reload and independent saved
read confirm all four new placements have Canvas motion off. The reviewed
one-constant fit delta preserves geometry, shading, timing, pointer and context
lifecycle; the earlier interaction captures have not been relabeled as new-source
tests. No manual Framer-export still comparison or sustained-fps measurement is
claimed; the Framer images are actual viewer screenshots.

## Preservation and evidence

The final independent saved read passes **19 guards**: all 25 earlier page
hashes and IDs, 135 earlier placement controls/geometry records, 14 earlier
sources/exports/schemas, native navigation bindings, CTA objects and definitions
remain exact. The two new page hashes, presets, credits and six links per study
are verified. Totals are **27 pages, 139 code placements and 15 source files**;
Canvas motion is true for the retained 60 and false for 79, including the four
new placements.

The final raw proof, `mcp/solid-brain-after-raw.json`, is **222,214 bytes**,
SHA-256 `9b7abebd7678e57a0cffc2cf0fb81f96421d221bf69b511978210de5ad7d6f20`.
Its report, node map and post-Canvas record are
`mcp/solid-brain-final-report.json`, `mcp/solid-brain-node-map.json` and
`mcp/solid-brain-post-canvas-report.json`. Earlier source and rendering receipts
remain historical at their recorded revisions. Nothing was published from
Framer or integrated into the implemented website.
