# AGENTS.md

## Repository Workflow

- Use Nix flakes for packaging, reproducible development environments, and system
  tooling. Keep `flake.nix` and `flake.lock` as the project entry points.
- Use pnpm for Node.js dependencies and package scripts. Keep `pnpm-lock.yaml`
  updated with dependency changes and use `pnpm install --frozen-lockfile` when
  reproducing the locked environment.
- Use Jujutsu (`jj`) for version control, including status, diffs, commits,
  bookmarks, and remote synchronization.
- Keep commits atomic: split work into the smallest independently reviewable,
  coherent changes. Keep unrelated edits in separate commits.
- Use Conventional Commit messages, such as `docs: document development workflow`
  or `fix: correct canonical URL handling`.

## Visual Prototyping

- Use Framer for visual prototypes, with manual handoff in either direction
  between Framer and the Astro/Svelte implementation.
- Keep code and shared catalogs authoritative for the implemented site. Do not
  introduce automatic code, asset, design-token, or CMS synchronization.
- Consult the [design inspiration catalog](docs/design-inspiration.md) for
  curated visual references. Cite its stable reference IDs in Framer experiments
  and handoffs; references inform exploration rather than implementation specs.
- Explore the owner's full mix of neo-brutalism, cyberpunk, digital, neo-Y2K,
  dithering, and expressive Swiss composition. Swiss means type as image,
  color, scale, cropping, and unexpected placement here; clean fonts alone do
  not define the brief. Non-typographic geometry, materials, textures, and
  effects are equally useful. Individual studies may explore different styles.
- Include the whole Web & UI Design bookmark folder in the catalog. Keep
  source coverage distinct from depth of media inspection, and expand brief
  entries before assuming the owner's selected references are less useful.
- Build new visual-element recreations primarily from native Framer frames,
  shapes, text, and named groups so their parts can be selected and edited.
  Inspect the source first, retain its source key, and record simplifications.
  Keep imported post images as comparison references; preserve explicit SVG
  and bitmap asset studies as assets. Selected external artwork can supply
  atmosphere or material references; making new paintings or narrative scenery
  is outside the current graphic-element brief. The owner removed the Art &
  Visual Inspiration collection from the catalog and moodboard, while keeping
  the X bookmarks intact. Preserve the remaining original and recreated work;
  further pruning requires owner-selected examples. Expand Creative Coding with
  shaders, vectors, glass, point meshes, motion references and tonal dithering.
- Keep external work, recreations, and close adaptations credited within
  **Source inspiration**, including when Codex authors the recreation or
  adaptation. Reserve **Original compositions** for independently composed work.
- Follow [the Framer workflow](docs/framer-prototyping.md) and record the relevant
  project/node links, responsive states, and intentional differences when
  implementing a prototype. Confirm changes in the Framer editor after a reload
  before reporting them as saved. Framer edits are not versioned by Jujutsu.

## Required Internal Skills

When working in this repo, use these skills from the `internal-skills` repo:

- `halt`
- `tools`
- `lang`
- `nix`
- `test`
- `docs`
- `review`
- `vcs`
- `cleanup`
- `debug`
- `handoff`
