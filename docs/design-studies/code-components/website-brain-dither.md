# Website brain — ordered dither

**WB-02** adds a live dithered treatment of the existing Monarchic website brain.
The [WB-01 source port](website-brain.md) remains available unchanged for
comparison. This is an additive Framer experiment, with no production-site
changes or automatic synchronization.

**Revision note — 2026-10-31:** the source hashes and saved-state receipts below
describe the original dither revision. The [loading performance handoff](website-brain-performance.md)
records the current shared/persistent preparation revision and its separate
verification record. The ordered-dither treatment remains unchanged.

## Construction and provenance

[WebsiteBrainDither.tsx](WebsiteBrainDither.tsx) is a self-contained Framer code
component. It preserves WB-01's anatomical geometry, static substrate, live
signals, inspection and trace interactions. The original website's 3,816 fibers
remain the underlying form.

The new pass quantizes the fully composed Canvas 2D artwork into black, dark
gold, gold and cream. A 4×4 or 8×8 Bayer threshold matrix distributes adjacent
palette colors to represent intermediate tones. Increasing Pixel pitch averages
the underlying image within each mark; it does not add an unrelated dot grid.
The matrix stays fixed in raster space while the brain moves through it.
Native status and interaction labels retain their original clear rendering.
WB-02 omits WB-01's soft HTML vignette so that a later translucent overlay does
not recolor the quantized artwork; the field border remains.

Catalog references [CC-003](../../design-inspiration/creative-coding.md#cc-003--pink--yellow-pixel-stipple-world)
and [WEB-006](../../design-inspiration/web-ui.md#web-006--dither-cards-and-character-graphics)
inform the limited-palette material direction. Their depicted compositions and
unverified source algorithms are not reproduced. Geometry comes from the
existing Monarchic website; the ordered-dither treatment is independently
authored.

## Controls and rendering

| Control | Default | Meaning |
| --- | --- | --- |
| Pixel pitch | 1 | Mark width/height in generated backing pixels, adjustable 1–4 |
| Exposure | 1.05 | Scales luminance before quantization |
| Contrast | 1 | Adjusts tone around a dark pivot |
| Bayer matrix | 4×4 | Ordered threshold size; 8×8 is also available |
| Animate / Canvas motion | On / Off | Preview animation and explicit editor opt-in |
| Speed / Still time | 1 / 8 | Motion multiplier and frozen phase |
| Inspect / trace / Site labels | On / On | Pointer/keyboard interaction and native labels |

Pixel pitch refers to generated raster pixels, so apparent mark size changes
with editor zoom, device pixel ratio and managed resolution. The brain's logical
dimensions and anatomy remain independent of that resolution.

The unchanged shared coordinator retains one live editor study or two live
Preview studies, serial still refinement, exact managed buffer dimensions, and
the existing 1 MP motion / 2 MP still limits. This component allocates zero WebGL
contexts. Canvas motion defaults off; exports, thumbnails and reduced-motion
artwork freeze. The renderer reads and quantizes a fresh opaque composed image
each frame, so the treatment does not accumulate across frames.

The additional Canvas 2D pixel readback and palette pass cost CPU time. They are
bounded by the managed output resolution; the still substrate and cached frames
remain additional 2D image memory. The original adapter's reduced-motion and
component-width label-layout differences still apply.

## Local verification

`nix develop -c pnpm check:website-brain-dither` passes. The
[focused check](../../../scripts/check-website-brain-dither.mjs) verifies the
original geometry/static/live passes and shared coordinator, Bayer rank
permutations, adjacent-tone coverage, monotonic tonal ramps, opaque palette-only
output, unchanged black backgrounds across the control bounds, and clipped
larger-pixel cells. It also exercises exact managed dimensions, trace expiry,
isolated geometry, fresh full-backing clears, nearest display-copy sampling,
and closure of all eight created substrate bitmaps.

Canvas doubles supply deterministic gray readback to test repeatable
quantization; they do not establish real framebuffer appearance. Source review
and the fresh-frame clearing checks establish that previous dithered output
does not feed the next composition. The final source is **273,231 bytes**,
SHA-256 `785f81ad5548dc05b7cc96e4509ea168fe335faac205635780f6ec3f796b2da1`.
Independent review found no material algorithm or buffer-sizing issue.
TypeScript semantic checking with DOM libraries and minimal external runtime
declarations returned no diagnostics; actual Framer diagnostics are a separate
gate.

Isolated CPU quantization medians were 2.77 / 4.08 ms for 768×634px Desktop,
0.69 / 0.91 ms for 384×350px Phone, and 11.71 / 17.14 ms at 2 MP (pitch 1 / 2).
These measurements exclude browser pixel readback, Canvas drawing and display
copying, and do not certify end-to-end frame rate.

Framer accepted the exact source above with no diagnostics and export
`codeFile/L42LjLE:default`. Its actual schema exposes all ten controls listed
above.

## Framer placement and review limits

The unpublished **[Website / Brain Dither](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=qawbJ_Hpc)**
page lives at `/prototypes/website-brain-dither`. Its native introductory text,
source link, WB-01 comparison link and catalog lineage remain editable. The
Desktop specimen has a 704px maximum width and 582px height; Phone retains a
responsive width and 320px height.

| Node | ID |
| --- | --- |
| Draft page | `qawbJ_Hpc` |
| Desktop / inherited Phone | `Ml4eCm5lR` / `M9g5nW9Nm` |
| Desktop brain / inherited Phone brain | `cuUlNM6oi` / `M9g5nW9NmcuUlNM6oi` |
| Native catalog lineage / original comparison link | `Xb6JSiGlo` / `pFxGOKhLg` |

The official Framer `api.tree.screenshot` call returned native JPEG image
content for both breakpoints. The inspected 1440×1224px Desktop and 390×1069px
Phone renders show the recognizable anatomical silhouette, cerebellum and
brainstem, visible tonal stippling, fitted labels and unclipped text. These
static images are retained as `static/desktop-mcp.jpg` and
`static/phone-mcp.jpg` under the task artifact directory
`website-brain-dither-2026-10-31`. They came directly from the tool's native image
blocks; they were not downloaded source artwork.

**Initial attempt: editor reload and live Preview verification were blocked.**
The existing browser tab and fresh Framer tabs repeatedly timed out during page
inspection; the unchanged WB-01 page also timed out, while a blank control tab
worked. Even capture of the returned static image in a separate browser tab
timed out. These observations do not establish the cause. No Canvas controls
were toggled, and no live browser phase, trace, pause/resume, editor opt-in,
touch gesture or exported-image behavior was verified for WB-02 in that attempt.
The local behavior checks and official static renders did not replace browser
review. The following post-reboot pass records the later actual editor checks
separately.

An independent saved-state read passes all **23 guards**: **23 pages, 131 study
placements and 12 code sources**, with both new Canvas-motion controls off.
All 22 preceding page hashes, 129 preceding placement dictionaries, 11 previous
source bytes/exports, native navigation definitions, behavior hosts and section
links remain exact. WB-01 retains source hash `3b4daaef…cf0d4`. Nothing was
published.

The task artifacts retain `mcp/website-brain-dither-final-report.json`,
`website-brain-dither-after-raw.json`, `website-brain-dither-node-map.json` and
`website-brain-dither-post-canvas-report.json`, with saved-state, static-render
and blocked browser checks labeled separately. The full final read is 84,007
bytes, SHA-256 `9d293f9c9994f80ccd5231e0a54c3bdafe8bb8a4f2ab9acfca1a1a40706db5a2`.
Exact source/test/typecheck receipts are in `validation/final-port`, and final
read-only source review is in `validation/independent-review.json`.

## Post-reboot browser verification — 2026-10-31

The browser became responsive after the owner's reboot. The unchanged final
source `785f81ad…b2da1` now passes actual Desktop/Phone Preview and editor review:

- Desktop phase advanced from 39.9387 to 60.9899; a mouse click emitted a signal
  trace. Pause retained exactly phase 71.06509999999989 across observations 6.8
  seconds apart, then Play resumed motion.
- Phone phase advanced from 74.9334 to 83.1541 and Enter emitted a signal trace.
  Its 351×320px field fits the observed 375px available width without horizontal
  overflow; Desktop remains 704×582px across 1425px available width.
- Desktop generated frames are 768×634px; Phone frames are 384×350px. Phone can
  retain the earlier larger display backing while the managed frames adapt.
- A full editor reload retained both ready frozen specimens at phase 8, with
  exact 384×317px Desktop and 384×335px Phone frames at 50% zoom.
- Explicit Canvas motion advanced only Desktop from 8.1 to 12.8; Phone remained
  at 8. Restoring No returned both to ready, phase 8. Browser error logs were
  empty.

These checks establish actual motion and saved reload behavior; they do not
certify a sustained frame rate. Sampled Desktop postprocess times were about
19–23 ms and Phone about 10 ms, including pixel readback/quantization/writeback
but excluding anatomical drawing and display copies. Real touch gestures,
continuous free-hover sweeps and exported images remain unverified.

Evidence is retained under `website-brain-dither-resume-2026-10-31/browser`:
`qa.json`, `desktop-preview.png`, `phone-preview.png` and `editor-restored.png`.
The earlier blocked record remains historical evidence of the first attempt.
The independent post-Canvas read passes all 13 preservation guards: all 23 page
hashes, 131 placement dictionaries and 12 source hashes/exports/schemas match
exactly after restoration. Canvas distribution remains 60 on / 71 off. Its
84,107-byte raw receipt has SHA-256
`394fcd6911b08fc0747ca74afd48cd9a09cd4e8214fcc00b42d1ad005fb97c0d`.
