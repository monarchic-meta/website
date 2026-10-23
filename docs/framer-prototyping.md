# Framer visual prototyping

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

The [homepage explorations](framer-prototypes.md) record the first three visual
directions, their project nodes, source references, and review scope.
The [second visual round](framer-visual-round-two.md) explores additional palettes,
graphic systems, and a standalone artwork gallery.
The [visual kitchen moodboard](framer-moodboard.md) brings catalog references and
independent graphic elements into a separate design canvas in the same project.

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

During the native-study and Creative Coding rounds, the MCP session showed new
nodes before the reloaded editor did. The Creative Coding gallery took roughly
11 minutes to become visible. A successful program result, returned node IDs or
`changedNodeCount: 0` does not establish saved persistence. Compare the actual
editor with the intended IDs and content, and check reload survival before
retrying a create operation; delayed delivery could otherwise produce duplicates.

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
