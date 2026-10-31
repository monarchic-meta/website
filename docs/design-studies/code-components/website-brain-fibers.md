# Website brain — refined fibers

**WB-04** explores a clearer, finer fiber treatment of the existing Monarchic
brain. It preserves the unchanged [WB-01 source port](website-brain.md) and
[WB-02 dither](website-brain-dither.md) for comparison. This is a separate
Framer study, without production changes or automatic synchronization.

## Construction

[WebsiteBrainFibers.tsx](WebsiteBrainFibers.tsx) retains all **3,816 original
anatomical centerlines**, including cortex, cerebellum and descending brainstem.
Its drawing treatment narrows the broad halo, tightens strand spacing/drift and
separates front and rear layers with restrained amber-to-cream shading.

A bounded selection of **92 original bundles** adds smoother continuous
fascicles. Regional quotas keep the cortex, cerebellum and stem represented;
each selected centerline uses at most 81 samples and three tapered parallel
hairs. The added paths are depth-sorted, remain attached to the existing
anatomy, and carry finite flowing signal windows without connecting one end
of a path to the other. This refines the original drawing rather than adding
an unrelated connection mesh.

Unlike the faithful WB-01 adapter, WB-04 intentionally changes static and live
drawing passes. The geometry and shared coordinator remain exact. All drawing
is Canvas 2D, without a per-frame pixel readback, bitmap postprocess or WebGL
context. Native labels and the existing inspection/trace controls remain.

## Controls

| Control | Saved preset | Range / behavior |
| --- | --- | --- |
| Strand width | 0.95 | 0.55–1.5 stroke scale |
| Depth separation | 0.4 | 0–1 front/rear contrast |
| Signal strength | 1 | 0–1.75 flowing signal intensity |
| Animate / Canvas motion | On / Off | Preview animation / explicit editor opt-in |
| Speed / Still time | 1 / 8 | Motion rate / frozen phase |
| Inspect / trace / Site labels | On / On | Interaction / native labels |

The reusable component's depth default remains 0.7. The saved Framer specimens
use 0.4 after comparing both treatments: 0.7 hid too much of the outer cortical
texture, while 0.4 restores volume without returning the broader halo. Strand
width and signal strength retain their original defaults.

Strand width and depth changes invalidate the static substrate as well as the
live artwork. Mutable projection buffers remain renderer-local. The unchanged
shared coordinator retains exact managed raster dimensions, serial still
refinement, one live editor or two live Preview studies, and the existing 1 MP
motion / 2 MP still limits. Editor motion defaults off; exports, thumbnails and
reduced-motion artwork freeze. The immutable 2D substrate remains additional
image memory outside the managed output's pixel count.

## Local verification

`nix develop -c pnpm check:website-brain-fibers` runs the
[focused check](../../../scripts/check-website-brain-fibers.mjs). Its eleven
groups cover preserved WB-01/WB-02 bytes, original geometry and shared pool,
strict semantic TypeScript with real DOM/minimal external host declarations,
bounded regional paths, finite projection, symmetric endpoint taper, actual
visual-control drawing changes, exact managed dimensions, trace timing/replay
and bitmap cleanup. All 14 created substrate bitmaps close; instrumented
renderer readbacks remain zero.

The reviewed source is **273,896 bytes**, SHA-256
`3574e281a5d254513d3cd207a3c3f1674a6f691042a60d3f2385731887ff2afe`.
Independent source review found no material correctness, cache or resource
blocker. Canvas doubles establish construction and lifecycle, not actual
pixel quality or full browser cadence.

## Framer placement

The unpublished **[Website / Brain Fibers](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=HQL8UQ3La)**
page is `/prototypes/website-brain-fibers`, with editable native introduction,
provenance and comparisons to WB-01/WB-02. Framer accepted the exact source
above with no diagnostics and export `codeFile/lJO8KgE:default`. Its nine
registered controls retain their source defaults; the two specimen placements
use the saved depth override described above.

| Node | ID |
| --- | --- |
| Draft page | `HQL8UQ3La` |
| Desktop / inherited Phone | `HY2tevtJd` / `FWFjf3wmf` |
| Desktop brain / inherited Phone brain | `uXVFZt_PQ` / `FWFjf3wmfuXVFZt_PQ` |

Actual Desktop review against WB-01's matching static pose confirms thinner
separated bundles and less halo. The first 0.7-depth specimen hid too much
frontal/crown texture. A native property trial at 0.4 restored more fine folds
and outer volume, so both new placements now use that saved override. The
source/default and the earlier 0.7 creation evidence remain unchanged.

The initial 0.7 Preview pass advanced Desktop phase 16.3861 → 41.3287, emitted a
mouse trace, held exactly phase 41.44740000000023 while paused, and resumed with
Play. Phone Enter activation emitted a trace. These behavior checks are kept
with their initial preset labels rather than relabeled as the later treatment.
After the 0.4 update, a full actual editor reload retains both ready stills at
phase 8, with exact 384×317px / 384×335px frames at 50% zoom. The native property
panel independently shows 0.4 on both Desktop and inherited Phone.

With the final preset, explicit editor Canvas motion advances Desktop from 8
to 21.3 while Phone stays frozen at 8. Restoring No returns both to ready,
phase 8. Final Phone Preview displays the finer bundles, responds to Enter with
a signal trace, and fits its 351×320px field within 375px available width. The
Desktop field is 704×582px across 1425px available width; generated frames are
768×634px Desktop and 384×350px Phone. Browser error logs are empty. These
observations establish authored behavior, without certifying a sustained frame
rate. Real touch gestures, free-hover sweeps and exported-image behavior remain
unverified.

Source-hashed browser observations and screenshots are retained under
`website-brain-expansion-2026-10-31/browser`. Local checks and fixtures are in
`validation/fibers`, with independent source review in
`validation/cross-review.json`. The original matching-pose comparison is
`static/wb-01-desktop.jpg`. Initial 0.7 images remain historical; final approved
native static renders are `static/wb-04-depth-0.4-desktop.jpg` and
`static/wb-04-depth-0.4-phone.jpg`, decoded from the official tool's returned
image blocks rather than downloaded media.

The final independent saved read passes all 14 global guards and both detailed
study checks. All 23 preceding page hashes, 131 placement dictionaries and 12
source hashes/exports/schemas remain exact, and WB-03's complete saved page hash
is unchanged after its Canvas test. Final totals are **25 pages, 135 placements
and 14 code sources**, with all four new Canvas controls off (60 prior opt-ins /
75 off). WB-04's two depth values are exactly 0.4; its source default remains
0.7. Nothing was published.

Shared preservation evidence is retained in
`mcp/website-brain-expansion-final-report.json`,
`website-brain-expansion-after-raw.json`, `website-brain-expansion-node-map.json`
and `website-brain-expansion-post-canvas-report.json`. The full raw read is
162,566 bytes, SHA-256
`b80cc92c039d34be2bdd1292dca3bbbe658f78077cc5c5a66ac9cf6c3a288dd7`.
The report keeps initial depth-0.7 behavior evidence distinct from final
depth-0.4 visual, motion and Canvas checks. Its final browser observations bind
the exact source hashes and record the remaining touch/export review limits.
