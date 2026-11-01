# Framer visual prototyping

The [project organization guide](framer-organization.md) records the
2026-10-31 folder and route map, stable page links and its verification status.
Use that map for current navigation; earlier handoffs retain their dated names
and routes as historical evidence.

Use Framer to explore layouts, typography, interactions, and responsive behavior.
Convert designs manually between Framer and the Astro/Svelte site in either
direction. The repository and shared catalogs remain authoritative for the
implemented site and its product and pricing data.

Use the [design inspiration catalog](design-inspiration.md) to find curated
neo-brutalist, cyberpunk, digital, neo-Y2K, dithered, and expressive Swiss design
references. Explore the [visual-language brief](design-inspiration/visual-language.md)
as a range of complementary directions. Cite stable reference IDs
when exploring a direction in Framer. Each entry records inspiration to adapt;
the prototype and manual handoff define the chosen design.

The [shared navigation brief](shared-navigation.md) records the owner's direction
for all Monarchic sites, including header priorities, authentication-dependent
app access, and the full-screen menu. It separates those decisions from open
destinations and inferred accessibility considerations.
The [homepage creative brief](homepage-creative-brief.md) records the homepage
journey, the slim R&D banner, and qualified content candidates.

The [homepage explorations](framer-prototypes.md) record the first three visual
directions, their project nodes, source references, and review scope.
The [second visual round](framer-visual-round-two.md) explores additional palettes,
graphic systems, and a standalone artwork gallery.
The later [Black Instrument and Open Edition homepage drafts](framer-homepage-explorations-2026-10-30.md)
apply the full homepage journey and shared navigation. Their
[Signal Loom, Vermilion Index and Cold Archive variations](framer-homepage-variations-2026-10-30.md)
explore distinct artwork and composition within that language.
The [website brain field port](design-studies/code-components/website-brain.md)
brings the current site's procedural neural artwork into its own Framer specimen
page, retaining a manual handoff between the implementations.
The separate [ordered-dither brain](design-studies/code-components/website-brain-dither.md)
explores a live limited-palette treatment alongside that unchanged port.
The [text-dither](design-studies/code-components/website-brain-text.md) and
[refined-fiber](design-studies/code-components/website-brain-fibers.md) variants
extend the same anatomical artwork with distinct live rendering treatments.
Their [loading performance handoff](design-studies/code-components/website-brain-performance.md)
records shared preparation, optional persistent caching and measurement limits.
The additive [solid-brain studies](design-studies/code-components/solid-brain.md)
use a credited MNI MRI-template surface for dither and text treatments, with
source provenance and saved verification recorded separately from the fibers.
The [eighteen-reference hero recreation set](design-studies/hero-recreation-complete-handoff.md)
keeps source-led native compositions and real procedural graphics on separate
Design pages and draft Preview labs. Its handoff records credits, source
substitutions, retained work and verification separately from the earlier
homepage prototypes.

The [original hero round](design-studies/original-heroes/handoff.md) follows that
source learning with nine independent compositions: two information fields, two
geometric identities, two research montages and three combinations. Native
typography and framing surround real procedural artwork; the new collection
belongs under Original compositions rather than Source inspiration. Its handoff
records the current delivery and verification status.

The [visual kitchen moodboard](framer-moodboard.md) brings catalog references and
independent graphic elements into six Design pages in the same project:
Reference library, Recreations, Originals, Live Creative Coding and
[Original Live Coding](design-studies/code-components/originals.md), plus
[Logo Studies](design-studies/code-components/logo-studies.md). Keep the
dense native artwork separate from live graphics, move existing groups instead
of duplicating them, and preserve source credits and stable study IDs.

## Standalone hero pages

The [standalone hero handoff](design-studies/standalone-heroes/handoff.md) records
the eighteen source openings, nine Round02 originals, page links and verification
boundaries. Its current manifest is separate from the earlier grouped-board
handoffs.

Each full hero experience gets its own regular Web page, opening directly on
the composition with an explicitly authored Phone treatment. The experience may
span multiple screens or use nested or virtual scrolling; its first viewport
does not define its extent. Grouped Design boards remain useful for comparison.
A Web collection index contains links rather than mounting every hero. Include
the defining typography, navigation, scale, negative space, media relationships
and interaction sequence, with source credit and fidelity notes outside the
opening.

Use the [hero sequence and interaction audit](design-inspiration/hero-behavior.md)
before recreating a source. Inspect its full sequence and transition into
following content, isolating time, scroll and pointer inputs before attributing
state changes to them. Record controls, reverse/back behavior and unknowns.
For static or recorded works, inspect the still or temporal sequence without
inventing scroll behavior. Keep the owner's selected archive revision distinct
from a different current site. Rendering quality, working playback and saved
persistence verify the authored prototype; source fidelity requires a separate
comparison with the observed source experience.

Keep the first information-field, geometric-identity and research-montage
originals visibly distinct before combining them. Information must function as
an inhabited field; identity studies center on an evolving geometric actor;
montages edit genuine research or diagram fragments. Vary the underlying
composition, material and motion, and review the first six in grayscale at small
size. Palette changes and a shared graphic-plus-caption arrangement do not
establish different directions. Keep earlier work available for comparison.

## Native editable studies

Build new visual-element recreations primarily from native Framer frames,
shapes, text, and named groups. Keep parts such as dots, tiles, wires, lettering,
and registration marks separately selectable. Inspect the source image before
authoring; preserve its palette and recognizable motif, and record intentional
simplifications in the handoff.

Selected external artwork may inform atmosphere, color, or material. The current
brief favors original graphic elements that can enrich web/UI work; it does not
ask for new paintings or narrative scenery. Preserve varied non-type treatments
alongside expressive typography. The Art & Visual Inspiration collection was
removed from the catalog and moodboard at the owner's request; X bookmarks are
unchanged. Preserve the remaining work, and await specific examples before any
further pruning. Creative Coding sits alongside Web / UI and Graphic Design in
the reference library. Add credited editable recreations where practical, and
record whether a motion reference has only been recreated as a static study.

Keep imported post previews in the comparison library. The existing SVG and
bitmap asset studies retain their recorded media; a native recreation should
expose the graphic's construction as editable layers. Label external work and
recreations with the exact source key and attribution in **Source inspiration**.
They remain source-led work even when Codex builds their native layers.

The [native recreation recipes](design-studies/recreations/README.md) retain the
manual authoring sources and source credits; the
[recreation manifest](design-studies/recreations/manifest.json) records saved
Framer node IDs and native layer counts. Confirm changes in the actual editor
after a reload before reporting them as saved. These recipes do not integrate
with the site runtime or automatically synchronize Framer and the repository.

During the native-study and Creative Coding rounds, MCP readbacks preceded
confirmation in the loaded editor. A successful program result, returned node IDs or
`changedNodeCount: 0` does not establish saved persistence. Compare the actual
editor with the intended IDs and content, and check reload survival before
retrying a create operation; delayed delivery could otherwise produce duplicates.
Let the layer panel load, observe the selection after copying, then read the
clipboard. Auto-height rich text can retain placeholder bounds in copied data;
use the measured editor dimensions and visual inspection when checking clipping.

Code-component File controls receive URLs in React, but native tree edits need
the actual tool-returned asset references. Read every requested media value back
after writing it; validate arrays of files separately. A component can compile
while Framer silently omits unsupported property values. When the representation
is unclear, set one real value through the native picker and inspect its public
model before applying the remaining bindings.
An array can require typed file entries even when an individual File control
accepts a single asset reference. Preserve the native picker representation and
item order; do not infer the array format from its React prop type.

Native component variants can use IDs as values while the picker displays names.
Read a genuine picker assignment back through the public model and verify the
responsive result in Preview. A stored display name can survive a readback while
the generated component still falls back to its default variant.

Resolve source fonts to genuine available faces. A native picker selection may
be needed to activate a newly uploaded custom face. Verify the rendered paragraph's
family, weight, tracking and line count in Preview: a requested font name does
not prove that Framer avoided a fallback. Preserve source positions while giving
single-word text boxes a documented allowance for native layout rounding.

Check generated paragraph and inline-span styles after changing native text
metrics. The public outer node and its virtual text children can report the
requested values while Preview retains earlier inline formatting. If those
disagree, apply the intended metrics through the native text controls and check
Preview again. Verify each responsive layout separately before capturing the
next preservation baseline.

Use supported image-fitting properties. If the public model does not expose Fit,
use an image frame with the intended fitted aspect ratio or set Fit in the native
editor; dropping a contain instruction can crop the source graphic. Test the
whole document extent too: sticky headings need a suitable overflow ancestor,
and the final animation state must be reachable before the prototype ends.

Check the editor's status messages when saved layers are absent from Preview.
The Ajedrez page's 3,433 native models survived saved reads while Framer reported
that the web page was too large to update; Preview retained an empty stage.
The saved model remained available for editing. Framer's
[size-limit guidance](https://www.framer.com/help/articles/module-too-large-warning/)
recommends reusable components. Package the largest scene groups with the
supported native component conversion, retain editable parts and actual ID
lineage, and verify responsive variants, override placement and playback after
conversion. Verify generated-page output alongside the saved tree.

In the Ajedrez export, an instance's authored opacity remained on a generated
outer container while its override controlled the inner component root. An
opaque inner root could not overcome that hidden ancestor. Keep reused scene
instances opaque and put their timed visibility override on an ordinary parent
Frame. Check actual ancestor styles and visible artwork in Preview.

Saved definition attributes also differed from the generated page: the native
definition editor showed current artwork while page instances retained older
contents. A reversible native opacity edit, `1 → 0.99 → 1`, on each explicitly
opaque Primary variant refreshed the page Canvas. Full Preview then exposed the
1,048,576-byte module limit. Check component publication, Phone metrics and page
compilation together; correct saved attributes alone do not establish success.

## Live code graphics

Use [Framer code components](design-studies/code-components/README.md) for live
shaders, point surfaces, procedural textures and motion. Native layers are useful
for editing individual shapes; a code component exposes its source and visual
parameters instead. Keep both forms where they help exploration.

The code component sources are self-contained TypeScript/React under
`docs/design-studies/code-components`. Framer supplies their runtime and code-file
diagnostics; the website's TypeScript project excludes this authoring directory.
Locked React 18 development dependencies support isolated browser tests; these
components do not integrate into the Astro/Svelte site runtime.

Keep exports and thumbnails static. Editor-canvas motion defaults off; expose an
explicit **Canvas motion** opt-in when seeing the effect beside its reference
helps authoring. Combine `RenderTarget.canvas` with `useIsStaticRenderer` so that
the opt-in cannot animate export or thumbnail rendering. The Creative Coding
budgets are 12 fps and 1,000,000 pixels on the canvas, and 30 fps and 1,000,000 pixels
in Preview. Verify those targets separately, including the default still frame.

Budget the whole board as well as each instance. The WebGL study files share a
per-window coordinator capped at two WebGL contexts, including initialization.
Only one editor study animates at a time; Preview admits up to two. Zoomed-out
cards retain code-generated 2D frames and release their GPU contexts. Generate
still refinements serially at up to 2,000,000 pixels. Follow transformed screen
bounds and DPR when choosing raster detail, while preserving logical CSS units
inside the shaders. Verify that every visible card upgrades after zoom or pan,
retains detail after focus handoff, and recovers from cached-copy failures.
Retain the 60-instance source-led regression and the mixed 84-instance set with
24 original placements. Also check the retained 96-instance set with twelve logo
placements and the 105-instance set with nine additional 3D logo placements,
at multiple zoom/DPR settings, hidden/offscreen
cleanup and synchronous static capture. Nonempty pixels alone do not establish
usable image quality; a frame-rate cap alone does not bound context allocation.

Include a pause control, respect reduced motion, stop rendering offscreen,
release GPU resources, and verify context restoration. Keep executable source-led
adaptations easy to find beside their catalog references, while retaining the
external poster as a clearly labeled comparison thumbnail and preserving its
source link. A running adaptation does not establish that the source algorithm
was reproduced. Keep the existing static native studies available separately.

## Workspace and connection

- [Monarchic Framer project](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt)
- [Initial project node](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=augiA20Il)
- [Official Framer MCP documentation](https://www.framer.com/mcp/)
- Remote MCP endpoint: `https://mcp.framer.com/mcp`

Codex's project server definition lives in
[`.codex/config.toml`](../.codex/config.toml). The remote connection needs no
additional Node dependencies or Nix packages. Each contributor authorizes their
own Framer account from the repository root:

```sh
codex mcp login framer
```

Complete the browser authorization for the intended Framer account, then restart
or reconnect the MCP client or start a new Codex session to load its tools. Check
access to the intended project before working on its prototype. A configured
server does not by itself confirm authentication or project access. Keep account
credentials and connection secrets out of version control.

MCP provides a way to work with the Framer prototype. It does not establish
automatic source, asset, design-token, or CMS synchronization with this repo.
Framer changes live in Framer and are not versioned by Jujutsu.

## Authoring methods used in this project

The early Signal / Field, Research / Edition, Cobalt / Relay and Graphic Studies
briefs were submitted through the browser to Framer's built-in Agent. Its chat
history records that work. Subsequent moodboard organization and native graphic
recreations use direct MCP layer operations and browser editor actions. These
are different authoring routes; a prompt visible in the Agent panel does not
mean every later edit used that Agent. Check the actual tool history when
describing the route used for a particular change.

## Manual handoff

For Framer-to-code work, inspect the relevant prototype and implement the chosen
behavior using the site's existing Astro/Svelte components and data contracts.
For code-to-Framer work, use the implemented page as a reference and recreate the
parts needed for the next visual experiment.

Capture these details in the repository change or PR description when handing
off a design:

- The explicit Framer project and node links and the affected site routes or
  components.
- Relevant inspiration reference IDs and the specific traits adapted from them.
- Screenshots or exported assets when they clarify the intended result.
- Target breakpoints and important interaction states, including hover, focus,
  expanded, loading, or error states where applicable.
- Intentional differences between the prototype and implementation, with enough
  context to distinguish a design choice from unfinished work.

Use existing repository validation for the implementation. Continue using Nix
flakes for tooling, pnpm for Node dependencies and scripts, and Jujutsu for
atomic commits with Conventional Commit messages. Prototyping does not change
the site's release workflow.
