# Framer visual prototyping

Use Framer to explore layouts, typography, interactions, and responsive behavior.
Convert designs manually between Framer and the Astro/Svelte site in either
direction. The repository and shared catalogs remain authoritative for the
implemented site and its product and pricing data.

Use the [design inspiration catalog](design-inspiration.md) to find curated
neo-brutalist, Swiss, and digital design references. Cite stable reference IDs
when exploring a direction in Framer. Each entry records inspiration to adapt;
the prototype and manual handoff define the chosen design.

The [homepage explorations](framer-prototypes.md) record the first three visual
directions, their project nodes, source references, and review scope.
The [second visual round](framer-visual-round-two.md) explores additional palettes,
graphic systems, and a standalone artwork gallery.

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
