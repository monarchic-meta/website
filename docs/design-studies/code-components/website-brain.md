# Website brain field — Framer port

Started **2026-10-31** at the owner's request to recreate the current website's
brain element in the existing Framer project. **WB-01** is a manual port of an
existing Monarchic website element, not a new illustration or an X recreation.
The [current site](https://www.monarchic.io/) remains the visual reference.

**Revision note — 2026-10-31:** the source hashes and saved-state receipts below
describe the original port revision. The [loading performance handoff](website-brain-performance.md)
records the current shared/persistent preparation revision and its separate
verification record. The anatomical drawing and interaction treatment remain.

## Source and scope

The implementation sources are
[InteractiveBrain.astro](../../../src/components/InteractiveBrain.astro),
[interactive-brain.ts](../../../src/scripts/interactive-brain.ts), and the brain
rules in [global.css](../../../src/styles/global.css). Their recorded SHA-256s
before authoring are:

| Source | SHA-256 |
| --- | --- |
| `src/scripts/interactive-brain.ts` | `c5024620207d5a801582a745f16dc1663500b3bb20a455e9d6bd9b35364ecc7e` |
| `src/components/InteractiveBrain.astro` | `c84e726fea7336555e62b8b0d6154c7216127db66acc766b66648ea006f541e5` |
| `src/styles/global.css` | `4fb80853080b3bb529b7f5475ab147e6e25803ac43cc1687646bc6602c48f1ef` |

The source is procedural Canvas 2D, with deterministic three-dimensional fiber
geometry projected into layered drawings. It does not require WebGL, downloaded
artwork, external textures or a new package. Preserve the cortical guides,
regional tracts, cerebellum, brainstem, static fiber substrate and live signal
passes. Original geometry and drawing functions belong in the self-contained
[WebsiteBrain.tsx](WebsiteBrain.tsx); Framer-specific lifecycle and resource
handling wrap that source rather than replacing the anatomy with a generic mesh.

The production files and existing Framer prototypes remain unchanged. This is a
deliberate code handoff under the [Framer workflow](../../framer-prototyping.md),
without automatic synchronization or production publication.

## Component and placement

The dedicated unpublished `/prototypes/website-brain` page is named
**[Website / Brain Field](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=nDuZgzAIZ)**,
with native editable introductory/provenance text and one reusable brain
component on Desktop and inherited Phone. The live website's
observed Desktop field is about 707×582px; its Phone field is 373×320px. Use a
centered maximum 704×582px Desktop specimen and a responsive approximately
350×320px Phone specimen, retaining the silhouette and legible control labels.

Editor motion defaults off. Explicit Canvas motion is restricted to the actual
canvas target; exports and thumbnails remain frozen. The existing per-window
coordinator contract provides serial still refinement, stable sharp cached
artwork, one live editor study or two live Preview studies, and the existing
per-output 1 MP motion / 2 MP still limits. The brain renderer uses zero WebGL
contexts. Its immutable substrate cache is additional 2D image memory and must
be released on replacement or disposal; the pixel limit describes the managed
output, not the sum of every temporary/cached 2D allocation.

Keep Preview motion, Pause/Play, reduced motion, real hover rotation, matched
tap/click traces and Enter/Space activation. Touch swipes remain page scrolling;
scrolling releases inspection and suppresses layout-generated pointer movement.

Intentional adapter differences: Pause/Play is explicit, editor motion defaults
off, and the label layout responds to the component's width rather than the
whole viewport. Reduced motion freezes the artwork and does not emit trace
animation; the source site's brief reduced-motion pulse is not reproduced.
None of those differences changes the anatomical geometry or drawing passes.

## Verification and saved state

`nix develop -c pnpm check:website-brain` passes. The retained
[focused check](../../../scripts/check-website-brain-port.mjs) compares the entire
geometry preamble, static drawing pass, live drawing pass and shared coordinator
with their source implementations. Its instrumented Canvas 2D execution creates
all **3,816 fibers**, verifies concurrent preparation, isolated projection data,
trace selection and 2.2-second expiry, no trace replay after renderer handoff,
bounded resize setters, and disposal of all eight test-created substrate bitmaps.
This establishes behavior and provenance; it does not establish image quality.

The accepted component is 266,210 bytes with SHA-256
`3b4daaef8469f119271233ab0b530851939234e3d06fb5092f01dd5b67dcf0d4`.
TypeScript semantic checking with DOM libraries and minimal external React/Framer
declarations also returned no diagnostics; those declarations do not certify the
actual Framer API types.
Framer's older CSS typings require an assertion on the inline style containing
`containerType`; the actual container-query CSS remains intact.

Independent review also passes geometry sharing, out-of-order/stale ImageBitmap
lifetime, inert disposal, and coexistence with the unchanged existing
`LogoStudy` coordinator. The bounded coexistence fixture peaks at two leases and
970,120 managed output pixels. Its report and reviewed source are retained in
`validation/independent-review`; these checks do not measure actual browser
frame rate, React mounting, or image quality.

Actual editor inspection caught a managed-buffer rounding defect: demand
384×317 produced 383×317, leaving the cache perpetually inadequate. Managed
output and substrate now use the coordinator's exact integer dimensions, while
the uniform ratio remains the anatomical drawing scale. Regression checks cover
384×317, 384×318, 384×335, 768×632 and 768×634, including the one-axis change
that leaves the drawing ratio unchanged. The substrate signature includes both
backing dimensions so this change invalidates the old bitmap.

Framer accepted the exact final source above with no diagnostics and retained
export `codeFile/i6kAFWm:default`. Its six controls are Animate, Canvas motion,
Speed, Still time, Inspect / trace, and Site labels. Saved presets are
`true / false / 1 / 8 / true / true` on both placements.

| Node | ID |
| --- | --- |
| Draft page | `nDuZgzAIZ` |
| Desktop / inherited Phone | `qPmi2H6MQ` / `NPN2oSbad` |
| Desktop brain / inherited Phone brain | `LVFKt4MHu` / `NPN2oSbadLVFKt4MHu` |
| Native specimen wrapper | `gif_LaA7A` |

After a full Framer reload, both frozen editor specimens settle at **ready**,
phase 8: 384×317px Desktop and 384×335px Phone at the inspected 50% zoom. The
frames meet their exact requested dimensions; neither remains in the inadequate
pending state. Both stills retain the cortical fibers, cerebellum and brainstem
seen on the live website.

Final-source Preview inspection confirms a 704×582px Desktop field and a
351×320px Phone field. Content fits the observed 1425px / 375px available widths
without horizontal overflow. Desktop generates 768×634px frames; Phone generates
384×350px frames and may retain a larger sharp display backing during the
breakpoint handoff. Both report all 3,816 fibers with no component errors.
Preview phase advances, Enter emits a propagating trace on both breakpoints,
Pause retains exactly phase 23.490900000095355 across separate observations, and
Play resumes motion. The browser's error log is empty.

The earlier wrapper candidate `34f6aedd…` was separately tested with Canvas
motion enabled: only Desktop advanced from 8.36 to 15.5545 while Phone stayed at
8; disabling it restored both to 8. A pointer click also emitted a trace on that
candidate. Those observations are source-labeled in the browser record, not
relabeled as final-source tests. Final source `3b4daaef…` was verified with both
Canvas controls off after reload. Continuous free-hover camera sweeps, real
touch-device gestures, and Framer-exported images were not independently checked;
the corresponding source interaction/rendering logic is retained and reviewed.

Browser source captures are retained under the task artifact directory
`website-brain-2026-10-31/browser/website-source-{desktop,phone}.png`.
Final browser evidence is `browser/preview-qa.json` and
`browser/framer-{editor,desktop,phone}-final.png`. Each observation records its
component hash so the pre-fix and final-source checks stay distinct. Final local
check receipts and replay fixtures are in `validation/final-port`.

The independent saved read passes all 21 guards: **22 pages, 129 study placements
and 11 code sources**, with 60 existing Canvas-motion opt-ins and 69 placements
off. All 21 preceding page hashes, 127 prior placement dictionaries, ten previous
source bytes/exports, two native navigation definitions, behavior hosts and
section-link objects remain exact. The new page hash is also exactly restored
after the temporary Canvas opt-in test. Nothing was published.

The `mcp/website-brain-final-report.json`, `website-brain-after-raw.json`,
`website-brain-node-map.json` and `website-brain-post-canvas-report.json` retain
the source, controls, node map and preservation evidence. The complete final
read payload is 81,156 bytes, SHA-256
`cd4d7ed7c558bcd9b7f493c6c181a6595599c81fc3687415f62fa3b15687a9d8`.
The prior typing and rounding candidates remain separate diagnostic history.
