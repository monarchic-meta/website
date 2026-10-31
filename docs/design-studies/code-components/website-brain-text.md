# Website brain — live text dither

**WB-03** renders the existing Monarchic brain as image-driven ASCII glyphs.
It is an additive visual study alongside the unchanged [WB-01 port](website-brain.md)
and [WB-02 tonal dither](website-brain-dither.md). Production code is unchanged;
the Framer component is a manual handoff.

**Revision note — 2026-10-31:** the source hashes and saved-state receipts below
describe the original text revision. The [loading performance handoff](website-brain-performance.md)
records the current shared/persistent preparation revision and its separate
verification record. The glyph treatment remains unchanged.

## Construction

[WebsiteBrainText.tsx](WebsiteBrainText.tsx) preserves the original 3,816-fiber
geometry, static substrate, live drawing passes, inspection and signal traces.
Each freshly composed frame is divided into square glyph cells. A blend of
72% mean luminance and 28% peak luminance selects a character from an ordered
ramp, retaining fine bright fibers that a plain average would erase.

This is actual image-to-glyph rendering. A small native Canvas monospace atlas
is rasterized on size/ramp changes and cached as packed character masks; the
per-frame pass stamps those masks into a reused opaque image buffer. Empty
black cells remain empty. Gold and cream glyphs include normal font edge
coverage; this is distinct from WB-02's four-color Bayer quantization. Custom
ramps express the owner's chosen light-to-dark ordering rather than a measured
physical-coverage guarantee. The glyph shape depends on the platform's available
monospace font.

[WEB-006](../../design-inspiration/web-ui.md#web-006--dither-cards-and-character-graphics)
informs the digital material direction. Neither its depicted composition nor
its unverified source algorithm is copied. The anatomy comes from the current
Monarchic website, and this glyph treatment is independently authored.
Native status labels remain clear text outside the glyph artwork.

## Controls

| Control | Default | Range / behavior |
| --- | --- | --- |
| Glyph size | 8 | 6–20 generated backing pixels per cell |
| Density | 1.25 | 0.5–2.5 tonal gain |
| Contrast | 1 | 0.5–2 around a dark pivot |
| ASCII ramp | ` .:-=+*#%@` | Printable ASCII, at most 32 characters including a leading blank |
| Animate / Canvas motion | On / Off | Preview animation / explicit editor opt-in |
| Speed / Still time | 1 / 8 | Motion rate / frozen phase |
| Inspect / trace / Site labels | On / On | Interaction / native labels |

Glyph size uses backing pixels, so cell density relative to the anatomy changes
with managed resolution, editor zoom and device pixel ratio. The original
anatomical dimensions remain logical CSS dimensions. Exports, thumbnails and
reduced motion freeze; Canvas animation requires an explicit opt-in. The
unchanged shared coordinator retains serial still refinement, one live editor
or two live Preview studies, and the existing 1 MP motion / 2 MP still bounds.
The component creates no WebGL context. Pixel readback and glyph output add CPU
work and 2D image memory.

## Local verification

`nix develop -c pnpm check:website-brain-text` runs the
[focused check](../../../scripts/check-website-brain-text.mjs). It checks exact
source geometry/drawing/coordinator provenance, glyph and tone bounds, black
preservation, clipped cells, opaque output, atomic atlas cache replacement and
failure cleanup, exact managed sizes, fresh full-backing clears, traces and
bitmap lifetime. Canvas/font doubles establish algorithm behavior rather than
actual font appearance or browser frame rate. Separate semantic TypeScript
checking with real DOM libraries and minimal external runtime declarations
returned no diagnostics.

The reviewed source is **274,610 bytes**, SHA-256
`b8257b7c1008ead1e0601d1121231cda9e7030db5ca7543fad7dff3bad5516fc`.
Independent source review found no material issue. Isolated cell aggregation
and cached-mask stamping medians were 5.79 ms at 768×634px, 0.94 ms at
384×350px and 21.80 ms at 2 MP. These timings exclude real font preparation,
pixel readback, anatomical drawing and display copying.

## Framer placement

The unpublished **[Website / Brain Text](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=Dau8jUKIN)**
page is `/prototypes/website-brain-text`, with editable native introduction,
provenance and comparison links to WB-01/WB-02. Framer accepted the exact source
above with no diagnostics and export `codeFile/G9StD6P:default`; all ten
registered controls retain the defaults above.

| Node | ID |
| --- | --- |
| Draft page | `Dau8jUKIN` |
| Desktop / inherited Phone | `Ss4H3QlvM` / `ig02Ok4Pu` |
| Desktop brain / inherited Phone brain | `slLgkepH8` / `ig02Ok4PuslLgkepH8` |

The initial actual editor frames settle ready at phase 8, with 384×317px Desktop
and 384×335px Phone output at 50% zoom. Desktop Preview shows actual small
monospace glyphs defining the anatomy, rather than a downloaded image or a text
block containing code. The 8px default retains the silhouette and distinct
cerebellum/stem while keeping the glyph material visible.

Actual Preview phase advances on Desktop (16.6934 → 25.2976) and Phone
(30.5973 → 52.5194). A Desktop mouse click and Phone Enter activation each
emit a signal trace. Pause retains exactly phase 25.579800000000052 across
observations 12.4 seconds apart, and Play resumes motion. Desktop is 704×582px
with 768×634px generated frames; Phone is 351×320px with 384×350px generated
frames. Both fit the observed 1425px / 375px available widths without horizontal
overflow, and browser error logs are empty. These are observed behavior checks,
not a sustained frame-rate guarantee.

A full editor reload retains both ready stills at phase 8. Canvas motion was
tested separately: Desktop advanced from 8 to 19.8 while Phone remained at 8;
restoring No returned both to ready at phase 8. The unchanged source and saved
Canvas-off presets are retained. Actual touch gestures, free-hover sweeps and
exported-image behavior were not independently verified.

Source-hashed browser observations and screenshots are retained under
`website-brain-expansion-2026-10-31/browser`. Exact local test/typecheck receipts
are in `validation/text-final`; independent source review is in
`validation/cross-review.json`. Official native static image blocks are decoded
under `static`, with their source/image hashes in `static/native-images.json`.
