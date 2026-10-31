# Website brain — loading performance

The **2026-10-31** loading revision applies to [WB-01](website-brain.md),
[WB-02](website-brain-dither.md), [WB-03](website-brain-text.md) and
[WB-04](website-brain-fibers.md). It reuses the same anatomical data and base
render plans instead of rebuilding them for each material or renderer. The
four earlier handoffs retain their original authoring and saved-state receipts;
this page records the current performance revision.

## Preparation and cache boundaries

Within one window, the four standalone components join one preparation promise
and reuse its **3,816 fibers** and base render plans. Each renderer still owns
its mutable projection and visibility data. WB-04 copies the three plan arrays
it adjusts, preserving the shared base. Rejected generation is propagated and
evicted so a later request can retry; an old rejection cannot remove a newer job.

A best-effort, per-origin IndexedDB cache also permits reuse across iframe
realms and reloads when browser storage policy allows it. One canonical record
in the dedicated `monarchic.website-brain.derived` database stores ten packed
typed-array planes, **2,496,732 bytes**, rather than 41,976 individual views.
It preserves all point/plan Float32 bytes and numeric metadata; decoding
reconstructs exact-sized arrays and the all-zero projection seeds. Rendered
images, live projections and interaction state are not persisted.

The manual key binds the accepted original source
`c5024620207d5a801582a745f16dc1663500b3bb20a455e9d6bd9b35364ecc7e`
and `packed-v2` schema. Validation checks constructors, dimensions, offsets,
finite values, metadata bounds and an accidental-corruption checksum. A source
or schema change requires an explicit version review; this is derived-data
caching, not automatic Astro/Framer synchronization.

Reads have a **200 ms** budget, capped at 250 ms if configured differently,
including coarse checks during checksum validation and decoding. Absent,
restricted, blocked, corrupt, incompatible or slow storage falls back to normal
generation. Late database handles close; no storage-access permission is
requested. Supported misses and invalid records queue a write after 300 ms.
Packing, checksum work and the storage transaction are all deferred and are not
awaited by artwork preparation. Unsupported storage avoids that packing job.
Writes coalesce and replace only the component's own canonical cache store.

One-shot stills use the exact static Canvas substrate directly, avoiding an
asynchronous ImageBitmap that would resolve after their renderer was disposed.
Live renderer bitmap replacement and disposal remain guarded.

## Current source revision

| Study | Source | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| WB-01 | [WebsiteBrain.tsx](WebsiteBrain.tsx) | 290,054 | `922d3c257bcf86502d729f657980c70ab4aae243d1780e0e2a1d0513c763bac1` |
| WB-02 | [WebsiteBrainDither.tsx](WebsiteBrainDither.tsx) | 297,075 | `b1ce26e3582d7a6d00f09d790aa9569101dcc33289da965b12ca703c6e0041c2` |
| WB-03 | [WebsiteBrainText.tsx](WebsiteBrainText.tsx) | 298,454 | `f8d78914a801206f6bdff76c0ae0de616fc6eb962ff2154a46fd8dcc1894b53f` |
| WB-04 | [WebsiteBrainFibers.tsx](WebsiteBrainFibers.tsx) | 297,884 | `bb3d4b53a6fdc5df94b59b248ca803c85405d699994fdae2c6e0c741dc7a7732` |

The accepted anatomical helpers and each material's static/live drawing passes
remain unchanged. The shared coordinator, controls, saved-preset intent,
Canvas-motion opt-in, frozen exports/thumbnails and resource limits remain:
12 fps / 1 MP editor motion, serial stills up to 2 MP, and the existing one-live
editor / two-live Preview policy. These Canvas 2D renderers add no WebGL
contexts. Geometry data and the static substrate are additional memory; the
pixel caps describe managed output, not every cached allocation.

The implemented website and production source files are unchanged. No prototype
is published or automatically synchronized by this revision.

## Measured local browser samples

The local harness executes the actual Canvas 2D renderer at **768×634 pixels**.
These individual, nonstatistical samples include module import, preparation,
renderer setup, drawing, copying and two animation frames. They exclude Framer
bootstrap and compilation. This is a renderer fixture, not a complete
React/Framer page mount; it does not establish a whole-app speedup or sustained
frame rate.

| Material | Before: fresh module preparation | After | Reuse in the after sample |
| --- | ---: | ---: | --- |
| Original | 1,275.5 ms | 211.7 ms | Shared-ready data from the persistent hit |
| Ordered dither | 1,847.6 ms | 246.3 ms | Shared-ready data from the persistent hit |
| Text dither | 1,709.0 ms | 248.7 ms | Shared-ready data from the persistent hit |
| Refined fibers | 1,605.6 ms | 601.0 ms | First persistent hit; preparation 181.8 ms |

Initial uncached anatomy generation still costs roughly **1–2 seconds** in
this fixture; baseline first-frame observations ranged about 1.4–2.5 seconds.
Storage is optional, so a cold or unavailable cache retains that work. The table
compares cold preparation with persistent/shared reuse, not faster uncached
geometry generation. In this final-source sequence, WB-04 ran first and read the
persistent record in 180.6 ms while other checks were running; the remaining
three then reused its ready data. Earlier lower-deadline samples are retained
as history rather than presented as final-source timings.

The native IndexedDB fixture separately measured 49.9 ms packing, 45.3 ms
decoding, a 0.1 ms write enqueue and three successful reads of 49.9, 46.7 and
43.9 ms. Enqueue time excludes the deferred encoding and eventual disk write.
A fresh-document read with the final policy took **131.7 ms** (132.2 ms total).
Cold decoding includes JIT/setup work: earlier 80/100 ms budgets rejected valid
records, motivating the bounded 200/250 ms policy rather than repeated
regeneration.

Final-source Desktop dither/text sample frames are pixel-byte-identical
before/after. The original/fibers differ in **12/two of 1,947,648 channels by one
level**; repeating the unchanged original already differed in three channels by
one level. Earlier-deadline Phone dither/text samples are exact; Phone
original/fibers differ in six/two of 537,600 channels by one level. The final
source changes only two read-deadline constants, verified by an independent
diff. These small differences are consistent with Canvas raster/readback
variability; universal pixel identity is not claimed.

## Focused verification

```sh
nix develop -c pnpm check:website-brain-load
```

The [load check](../../../scripts/check-website-brain-load.mjs), SHA-256
`95843d8c163f6015be489d864591331cc2a42e307805f690140fd2fe65fa4dc7`,
passes 14 focused groups. It pins the complete original source, geometry/plan
preamble and reviewed codec fingerprint; verifies shared preparation and plan
identity, exact anatomical output, persistent-hit and failure integration,
generation retry, WB-04 isolation, bitmap cleanup and stale effect/observer
cleanup. A supported-miss regression leaves the write promise unresolved while
preparation still completes, proving that artwork preparation does not await it.

The retained `check:website-brain`, `check:website-brain-dither`,
`check:website-brain-text` and `check:website-brain-fibers` commands also pass.
The isolated cache check passes eight groups covering exact round trips,
malformed records, denial, blocked/hung operations, late handles and writes.
Type checks use real DOM libraries with minimal external React/Framer
declarations; the fiber check strictly checks the integrated common helper.
These host-double checks establish behavior, not browser pixels or frame rate.

Public `data-brain-*` load metadata records preparation origin/timing and the
coordinator's first committed usable raster. That callback is not a guaranteed
browser-presentation timestamp or an end-to-end Framer loading measurement.

Evidence is retained under the local artifact directory
`website-brain-load-optimization-2026-10-31`: browser samples in
`browser/final-source-actual-pixel-parity.json`,
`browser/persistent-codec-native.json`,
`browser/cold-helper-final-policy.json` and
`browser/optimized-pixel-comparisons-desktop-phone.json`; focused receipts in
`validation/final-200ms` and `validation/persistent-cache`. The preceding
`validation/final-focused` and `validation/nonblocking-write-regression`
receipts remain historical records of the earlier deadline candidate.

## Framer runtime observations

The four source uploads returned byte-exact readback, no diagnostics and
preserved registered schemas. The final independent preservation read also
passes. The observed timings below start at **component mount**, not Framer
navigation or bootstrap.

| Observation | Cache read / generation | First committed usable raster |
| --- | --- | --- |
| WB-03 first editor full-app reload | 200.4 ms timeout; 1,331.1 ms generation | 2,015.1 ms Desktop / 2,232.9 ms Phone |
| WB-01 editor full-app reload | 202 ms timeout; 1,288 ms generation | 1,703 ms Desktop / 1,824 ms Phone |
| WB-03 Desktop Preview | 135.3 ms persistent hit; no geometry/plan generation | 405.8 ms |
| WB-03 second editor full-app reload | 121.9 ms persistent hit; no geometry/plan generation | 398.7 ms Desktop / 607.4 ms Phone |
| WB-02 editor full-app reload | 157.1 ms persistent hit | 358.4 ms Desktop / 522.6 ms Phone |
| WB-02 Desktop Preview | 111.4 ms persistent hit | 365.6 ms |
| WB-04 editor full-app reload | 166.1 ms persistent hit | 360.8 ms Desktop / 549.8 ms Phone |
| WB-04 first Desktop Preview | 200.5 ms timeout; 1,424.4 ms generation | 1,832.5 ms |

Full editor startup pressure can still exhaust the optional cache read budget
and trigger normal generation. Later persistent hits avoid that generation;
these samples do not promise a fast hit on every reload or measure the complete
Framer startup. After actual editor reloads, all four pages' Desktop and Phone
stills settle at ready, phase 8, meeting the inspected 384×317 / 384×335 raster
demands with Canvas motion off.

Normal editor page switches also reused prepared data: WB-02 preparation was
1.2 / 1.3 ms with first rasters at 281.8 / 476.8 ms; WB-04 preparation was 1.2 / 1.1 ms
with first rasters at 186.0 / 298.8 ms (Desktop / Phone). These are in-session
reuse samples, not fresh persistent reads.

WB-03 Preview phase advanced from about 12.19 to 27.90, Enter produced one
propagating trace, and Pause held phase 28.8755 through a Phone resize. WB-01 and
WB-02 Preview were live at phases 12.1551 and 12.3526. WB-04 advanced from
15.7548 to 19.2917, Enter
produced one trace, Pause held 19.5401 through Phone, and Play resumed live at
19.7081. Desktop was restored running. Observations are recorded in
`browser/framer-runtime.json`; the final view is
`browser/framer-fibers-preview.png`.

Runtime QA did not change saved controls. No new manual Framer-export image or
sustained frame-rate verification is claimed.

## Saved state and preservation

The final independent read passes **all 16 guards**: all 25 page hashes/IDs,
135 placement control/geometry records, 14 code paths/exports, four public
schemas/defaults, navigation/CTA data and eight brain presets are preserved.
Only the four approved component sources changed; the other ten source files
remain exact. All eight brain placements have Canvas motion off. WB-04 keeps
its saved Depth separation **0.4** and generic component default **0.7**.

The raw final proof is **96,098 bytes**, SHA-256
`62881c394068a18ee2acd90bb79064c4e66754db6e045f0dba2ba5a7fafc7c20`,
retained with the `mcp` receipts in the task artifact. Nothing was published from
Framer; production files remain unchanged. Earlier handoff receipts remain
historical evidence for their explicitly recorded source revisions.
