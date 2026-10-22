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
