# First-wave hero recreation handoff

First wave completed and reviewed **2026-10-31**. Scope is the six studies selected
in the [recreation plan](hero-recreations.md): HERO-001, 002, 003, 007, 010 and
013. The other twelve references remain selected in that plan's backlog. This
wave contains source-led recreations and adaptations within **Source inspiration**;
no new independent originals or hybrid heroes are included.
The [manifest](hero-recreations/manifest.json) retains source hashes, native
artwork IDs, recipe files and verification scope for the six-study wave.

## Study scope and fidelity limits

| Reference | Authored mechanism | Required distinction |
| --- | --- | --- |
| [HERO-001 / Stephen Kelman](../design-inspiration/heroes.md#hero-001--type-face) | Live object-space writing on a head/bust surface, with rotation and optional pointer pose. | Lee Perry-Smith's licensed mesh is a documented geometry stand-in, not verified as Kelman's mesh. Text, typeface and material are changed; rotation is approximate, with no assembly/dispersal implementation. This is surface writing, not screen-space ASCII shading. |
| [HERO-002 / Julián Leiss](../design-inspiration/heroes.md#hero-002--ajedrez-film-poem) | Two native static compositions studying repeated film frames and differently proportioned overlapping image slots. | Neutral checkerboards/photo blocks replace the archival footage and hands. Changed annotations and static frames do not reproduce the film, full sequence or sound. |
| [HERO-003 / Polar](../design-inspiration/heroes.md#hero-003--agent-first-billing--polar) | Native mark construction, measuring guides, control points, type and chapter cells. | Static construction study with documented wording and chapter-icon simplifications; no verified recreation of the complete assembly cycle. |
| [HERO-007 / Cantor8, website by Artemii Lebedev](../design-inspiration/heroes.md#hero-007--cantor8) | Live bounded curves, boundary nodes and an independently written motion/pointer treatment on cobalt. | Approximate geometry, wind and timing rather than the original spring integrator. Peripheral labels are static; navigation/CTA chrome is omitted from this field study. Source wording remains source content. |
| [HERO-010 / Index Studio](../design-inspiration/heroes.md#hero-010--gtheimagineers) | Native offset contour circles, divided reading surface, rails and star geometry. | Measured 23-circle static state, neutral prose and static panel layout; no full accordion or contour-drawing cycle. |
| [HERO-013 / Obys × DES](../design-inspiration/heroes.md#hero-013--format) | Native geometric lettering, unequal overlapping panels, rules and type. | Approximate lettering/panel composition and neutral image stand-in; no full scroll/physics sequence or alternate modes. |

## Saved native work

The [07 / Hero Recreations Design page](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=H_ibyOQyy)
contains board `Rpq3XBp9I`. Root confirmed an actual editor reload and visual
review of all four artwork roots: named editable groups and credits were
retained, and the contour study's prose fits its panels.

| Reference | Saved artwork | Retained native recipe |
| --- | --- | --- |
| HERO-003 | [Polar](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=jYNcbRHFg) | [HERO-003.json](hero-recreations/native/HERO-003.json) |
| HERO-010 | [G!theimagineers](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=FGXi0U_xL) | [HERO-010.json](hero-recreations/native/HERO-010.json) |
| HERO-013 | [FORMAT](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=ARdPpi5ec) | [HERO-013.json](hero-recreations/native/HERO-013.json) |
| HERO-002 | [Ajedrez](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=ihmbR6lQG) | [HERO-002.json](hero-recreations/native/HERO-002.json) |

The recipes preserve **798 native parts**. The
[measured circles](hero-recreations/native/HERO-010-measured-circles.json) and
[board layout](hero-recreations/native/layout.json) retain the source measurements
and composition. These are manual authoring records, with no runtime sync.
Root's actual reload evidence is under the session's visualization artifacts:
`hero-recreations-2026-10-31/browser/native-HERO-{003,010,013,002}-after-reload.png`
and `native-after-reload.dom.txt`; `native-root-proof.json` records the checks
and evidence hashes. Planning previews are separate from this
actual-editor proof. The final read below confirms the 27-page baseline is preserved.

## Live placements and editor verification

The [08 / Hero Live Studies Design page](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=RVzvNGZNT)
has board `U2HV86K9l`. The separate draft lab is
`/prototypes/hero-recreations-lab`, page `VR2TaJCqa`, with Desktop root
`aQrE54dw7` and Phone root `H8Zf2szHA`.

| Reference | Design instance | Lab Desktop | Lab Phone |
| --- | --- | --- | --- |
| HERO-001 | `MTBA7CoHj` | `kL3s1UVYq` | `H8Zf2szHAkL3s1UVYq` |
| HERO-007 | `MNCM5qolT` | `lVWxjYalC` | `H8Zf2szHAlVWxjYalC` |

Source registration returned `codeFile/B4OuNLk:default`, a byte-exact readback
matching the reviewed source below and no code diagnostics. Fresh-schema repair
and readback confirmed all six complete presets. Root then reloaded the actual
live Design page and confirmed the correct modes, credits and frozen phase 2.

Editor Canvas motion was checked independently for both modes: Type Face
advanced from phase 2 to 5.38 and Cantor8 from 2 to 3.82, with visible motion.
Both cards refreshed their 2D frame resolution on zoom without hover, through
512, 768 and 1024-pixel long edges. Canvas motion was restored to **No** on both
Design instances before Preview work. Evidence is under
`hero-recreations-2026-10-31/browser/`: `live-after-reload.dom.txt`,
`live-canvas-default.json`, `canvas-typeface-motion.{json,png}` and
`canvas-cantor-motion.{json,png}`.

Actual Desktop and Phone Preview pass for both modes: visible phase advance,
Pause holding the frame and Play resuming, with clear credits. Evidence includes
`preview-desktop-{typeface,cantor}.png`, `desktop-{head,cantor}-pause.json`,
`preview-phone-typeface.png`, `phone-head-pause.json`,
`preview-phone-cantor-final.png` and `phone-cantor-pause.json`.

The final Cantor8 Phone instance is **351 × 560px with Scale 1**, using extra
vertical space for headline/ring/footer clearance. The Type Face Phone placement
remains **351 × 320px**. Scale 1 and the shared controls remain at their intended
presets in every instance; this is a layout adaptation, not a renderer/default
change. The whole-editor reload retained the final Phone layout and its adequate
401 × 640 generated frame. `phone-cantor-final-inspector.dom.txt` and
`phone-after-final-editor-reload.{json,png}` record that final state.

Known limitation: the experimental Phone Scale 0.8 value persisted in UI/MCP
readback, but Preview did not show the intended radius change after reload;
Scale 1 was restored and the final fix uses layout spacing. No root cause is
claimed for that control behavior.

`browser/live-root-proof.json` binds 17 actual-editor/Preview evidence files and
their hashes. Its scope is the visible/editor/Preview checks above. Pointer
responses, frozen export/thumbnail branches and shared GPU/restoration limits
are established separately by local/Nix checks; no actual Framer export image
or hardware frame-rate benchmark is claimed here.

## Procedural component and provenance

[HeroRecreationStudy.tsx](code-components/HeroRecreationStudy.tsx) exposes
`study: typeface | cantor`, animation, Canvas motion, speed, still time, scale,
density, type scale, motion span, pointer, colors and labels/credits. Canvas
motion defaults off; Preview animation defaults on. Exports and thumbnails are
frozen. Keep visible wrapper attribution if `showLabels` is disabled.

Reviewed source SHA-256:
`cd2887061f8be4cc77ce45a14bfdf205a6cf3a2e147a9ac48baad3dfaf0bbb20`.
The head data is embedded, so the component has no runtime three.js or model
download dependency. The [asset-specific license record](code-components/assets/hero-head-license.txt)
retains Lee Perry-Smith's *Infinite, 3D Head Scan* credit, upstream asset/hash,
CC BY 3.0 license and changes. The preparation script is
[build-framer-hero-head.mjs](../../scripts/build-framer-hero-head.mjs).

The component retains the existing shared coordinator: two contexts including
initialization, one live editor study or two live Preview studies; editor motion
at 12 fps, Preview at up to 30 fps, each within 1,000,000 output pixels. Stills
refine serially within 2,000,000 pixels. The separate writing atlas is
1,048,576 texels. Hardware frame rate has not been benchmarked.

## Local evidence and its scope

The frozen source above passed **27 focused groups** in
[check-hero-recreation-study.mjs](../../scripts/check-hero-recreation-study.mjs):
semantic TypeScript, pinned anatomy/provenance, surface-space text, generated
curve topology, resource cleanup, failure paths, control updates and frozen
render targets. These use bounded host/GL doubles for lifecycle assertions.

[check-hero-recreation-browser.mjs](../../scripts/check-hero-recreation-browser.mjs)
passed **four actual software-WebGL cases**: both modes at desktop and Phone
layouts. Receipts cover GLSL compilation and zero GL errors, meaningful artwork,
motion/pointer changes, deterministic still replay, cross-mode replay and
context restoration; the Phone head case also checks caption width/clearance.
These are local software-rendered pixels, not a hardware performance benchmark,
source-algorithm equivalence or proof of a Framer save.

Local receipts are under this session's visualization artifacts at
`hero-recreations-2026-10-31/validation/final-port/`: `handoff.json`,
`unit-result.json`, `browser/result.json` and `source-credit-review.txt`.
`check:hero-study-integration` also passed: **66 mixed placements in each of
Canvas and Preview**, 132 across separate target runs, using the five legacy
factories and Hero. Each run covers 27 zoom/DPR views and pans every card,
checking adequate source resolution and fresh shader/geometry/pose state through
cache handoff. The bounded host recorded at most **two contexts including
initialization** and **1,998,984 peak GPU output-surface pixels**. This is
shared-window integration evidence, distinct from actual software-WebGL pixels
and Framer saved state. Each target passed ten groups and cleaned up on unmount;
Canvas peaked at one context and Preview at two. Receipts are in
`hero-recreations-2026-10-31/validation/mixed-window/receipt.json` and
`check-result.json`, with source/test/host hashes retained in the manifest.
The flake's `hero-recreations` check also passed in the full Nix sandbox:
27 focused groups, 132 mixed placements and four actual software-WebGL cases
with zero GL errors. The check declares DejaVu through Fontconfig so Canvas text
has usable glyphs in the isolated environment; the renderer and artwork
thresholds are unchanged. The newer browser-test hash and parsed results are
recorded separately under `validation/nix-fonts/`; the earlier `final-port`
software-WebGL receipt remains historical evidence. The successful command was
`nix build .#checks.x86_64-linux.hero-recreations --no-link --print-out-paths -L`.

## Final saved-state and preservation proof

The frozen independent saved-state report passes **25/25 guards**. Final totals
are **30 pages, 145 code placements and 16 code sources**. The live-wave read
preserves all 28 post-native page hashes/order, all 139 prior presets/geometry
and all 15 prior source hashes/schemas; this includes the original 27 pages and
the unchanged native recreation page. All six new placements retain their
complete fourteen-control dictionaries, credits and Canvas motion off. Both
new pages' full normalized hashes match across the independent reads.

The exact current code export is enumerated, the fourteen-control schema
matches, and source bytes/hash match the reviewed component. Parent relations
are derived from the nested serialized hierarchy. The final proof composes the
complete preservation read with a bounded hierarchy/reflection read while
project/source writes were frozen; both new page hashes agree across them.

The manifest binds these immutable files under the session's
`hero-recreations-2026-10-31/` artifacts: `mcp/hero-wave-final-report.json`,
`mcp/hero-wave-node-map.json`, `mcp/hero-wave-proof-index.json` and
`mcp/live/hero-wave-after-raw.json`. The source-bound actual native/live proof
reports bind **22 browser evidence files** separately from the technical reads.

## Verification after future edits

- Record the native and live Design-page IDs, six source-study/artwork IDs,
  every code placement's Desktop/Phone target, code-file ID and actual source
  readback hash. Keep credits and simplifications with the saved studies.
- Reopen or reload the editor and verify named native parts, layer bounds,
  retained credits, sharp generated artwork and preserved original-page IDs.
  Check the final native source refinements against their comparison media.
- Inspect actual Preview pairs for Type Face and Cantor8 motion, pause/resume
  and pointer behavior; verify editor Canvas motion independently of Preview.
  Record any target not tested rather than inferring it from local harnesses.
- Confirm frozen exports/thumbnails, shared resource/quality checks and visible
  pan/zoom refresh at adequate resolution. Keep these results distinct from
  source-fidelity and saved-state evidence.
- Preserve the existing prototypes, native studies, originals and live studies.
  Keep the six-study result separate from the remaining twelve references and
  from the later independently composed original/hybrid phases.

Native/live IDs, presets, editor reload, separate Canvas motion, actual
Desktop/Phone Preview and whole-project preservation are recorded above.
Nothing here claims publication or a
production implementation change. Use the [manual handoff workflow](../framer-prototyping.md)
when an independently composed design is eventually selected for implementation.
