# website

Public website for Monarchic.

Start with the [documentation index](docs/README.md) for current contracts,
operator procedures, and historical design reviews.

## Approved planning contracts

The approved WebInfo interview defines the next corporate-site information
architecture in [`webcomposer/site-map.contract.json`](webcomposer/site-map.contract.json)
and [`webcomposer/page-maps.json`](webcomposer/page-maps.json). Its routes are:

- `/`
- `/products`
- `/products/[slug]`
- `/research`
- `/research/[slug]`
- `/company`
- `/security`
- `/privacy`
- `/terms`

The contracts supersede older planning assumptions such as `/about`. The
substantive company page now lives at `/company`, with `/about` retained only as
a compatibility redirect. Newer product-catalog decisions still retain the
standalone `/waitlist` and substantive `/research/explicitmem` routes.

Portable interview artifacts and reuse instructions live in
[`webinfo/`](webinfo/README.md). Validate the handoff with:

```bash
pnpm check:webcomposer
pnpm check:webinfo-artifacts
```

## Homepage presentation

The homepage uses sentence-case display headings, regular-weight section titles,
and medium-weight subheadings. Uppercase monospace labels are reserved for short
metadata. Keep display sizes stable across breakpoints and check wrapping at
320px as well as desktop widths. `ArrowIcon.astro` supplies decorative SVG arrows
for homepage links; the link text carries the accessible name.

Paper backgrounds support longer reading sections. Yellow identifies actions and
interactive details rather than filling statement panels. Keep the interactive
brain and existing typeface as recognizable elements of the site.

## Current Scope

The site is Monarchic's Astro-based corporate site and public product research
surface. It currently owns:

- the company-led home page at `/`
- the public products catalog at `/products`
- workspace and role guidance at `/products/hosted-mcps#workspaces`, including Owner-only billing and access troubleshooting
- individual product detail pages at `/products/[slug]`
- the research index at `/research`
- the approved, artifact-backed ExplicitMem report at `/research/explicitmem`;
  product workflow checks do not automatically create research pages
- the current trust boundary at `/security`
- the company, mission, approach, and operator page at `/company`
- a compatibility redirect from `/about` to `/company`
- privacy and service terms at `/privacy` and `/terms`
- generated `robots.txt` and `sitemap.xml` endpoints

Authentication, plan selection, account pages, API-key management, and hosted
MCP setup live in `../monarchic-webapp`.

## Stack

- Astro as the site shell
- Tailwind CSS v4 for styling
- a self-hosted Space Grotesk variable font bundled through Fontsource
- Svelte for the interactive waitlist form
- A canvas brain component in `src/components/InteractiveBrain.astro`, with
  interaction logic in `src/scripts/interactive-brain.ts`
- Shared canonical/Open Graph/Twitter metadata through
  `src/components/SeoHead.astro`
- A 1200x630 branded social preview image at `public/social-card.png`

## Development workflow

Use the Nix flake for the development environment and packaging. The dev shell
provides Node.js, pnpm, Jujutsu, and Chromium, with Playwright configured to use
that Chromium executable.

```bash
nix develop
pnpm install --frozen-lockfile
pnpm dev
```

Use pnpm for dependencies and package scripts. Build the packaged static site
with `nix build`; the output is available at `result/dist`. Run `nix flake check`
for the package, Astro diagnostics, contracts, and local static smoke checks.
Full browser checks remain available through the smoke and legibility commands
below.

Use Jujutsu for version control. Review each change and commit the smallest
coherent unit with a Conventional Commit message, for example:

```bash
jj status
jj diff
jj commit -m "docs: clarify website setup" README.md
```

Keep unrelated changes in separate commits. Use `jj commit --interactive` when
individual hunks need to be split.

## Commands

- `pnpm install --frozen-lockfile`
- `pnpm dev`
- `pnpm check`
- `pnpm check:legibility` (requires a running local preview)
- `pnpm check:webcomposer`
- `pnpm build`
- `pnpm preview`
- `pnpm smoke:local`
- `pnpm smoke:production`
- `pnpm smoke:production:www`
- `pnpm smoke:production:apex`
- `pnpm smoke:staging`
- `pnpm astro -- --help`

The project currently expects Node `>=22.12.0`.

For the responsive and interaction regression checks, run `pnpm build`, then
`pnpm preview --host 127.0.0.1 --port 4332` in a separate terminal, followed by
`pnpm check:legibility`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if Chromium is
provided by Nix. The check covers eleven routes at five widths, wordmark sizing,
plan hover/focus states, back-to-top, and brain scrolling/tapping. Screenshots
are written to `/tmp/monarchic-legibility`; override that location with
`MONARCHIC_VISUAL_EVIDENCE_DIR`.

On NixOS, run browser smoke inside the repository dev shell so Playwright uses
the packaged Chromium build:

```bash
nix develop -c pnpm smoke:production
```

GitHub Actions runs the shared Monarchic Nix CI workflow on `main`. That
workflow builds the flake packages, runs the flake checks, and leaves release
smoke commands as explicit flake apps.

Run production release smoke with:

```bash
nix run .#smoke-production
```

Run staging release smoke with:

```bash
nix run .#smoke-staging
```

Use [`docs/release-smoke-runbook.md`](docs/release-smoke-runbook.md) for the
live deployment checklist and current smoke evidence.

## Layout

```text
/
├── public/
│   ├── favicon.svg
│   ├── social-card.png
│   └── social-card.svg
├── src/
│   ├── components/
│   │   ├── InteractiveBrain.astro
│   │   ├── ProductWorkflowProof.astro
│   │   ├── SeoHead.astro
│   │   └── WaitlistForm.svelte
│   ├── lib/
│   │   ├── explicitmemBenchmark.ts
│   │   ├── mcpResearch.ts
│   │   ├── pricing.ts
│   │   ├── productDetails.ts
│   │   └── productWorkflowProofs.ts
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro (compatibility redirect)
│   │   ├── build-info.json.ts
│   │   ├── company.astro
│   │   ├── privacy.astro
│   │   ├── robots.txt.ts
│   │   ├── security.astro
│   │   ├── sitemap.xml.ts
│   │   ├── terms.astro
│   │   ├── tutorial.astro (redirect to webapp setup)
│   │   ├── waitlist.astro
│   │   ├── products/
│   │   │   ├── index.astro
│   │   │   ├── hosted-mcps.astro
│   │   │   └── [slug].astro
│   │   └── research/
│   │       ├── index.astro
│   │       └── explicitmem.astro
│   ├── scripts/
│   │   └── interactive-brain.ts
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── svelte.config.js
└── package.json
```

## Notes

- `src/lib/pricing.ts`, `src/lib/pricing.generated.json`,
  `src/lib/pricing.public.generated.json`, `src/lib/pricing.coming-soon.json`,
  `src/lib/productDetails.ts`, and `src/lib/catalog.manifest.json` are generated
  deploy artifacts copied from `../shared/product-catalog`. Edit the shared
  catalog, then run `pnpm sync:shared-catalog` from `../monarchic-webapp`.
- `pnpm check:shared-catalog` compares the website and webapp generated catalog
  artifacts against `../shared/product-catalog` when the sibling workspace is
  present. In a standalone website checkout it skips the sibling comparison
  while still validating the committed manifest and build-info contract.
- `src/lib/usage-policy.generated.json` is the fail-closed public subset of
  `monarchic-mcp-catalog`. Run `pnpm sync:mcp-pricing` after catalog changes.
  The sync includes approved subscription prices, cadence, rollover, stop
  behavior, and aggregate class coverage while deliberately excluding
  provisional operation rates and unpublished allowance quantities.
- `pnpm check:mcp-pricing` validates the committed public subset and its plan
  prices. When the source catalog is available locally, it also fails on drift;
  standalone deploy checkouts validate the committed artifact without needing
  the sibling repository.
- `/build-info.json` exposes one sorted `catalog.planSlugs` inventory plus
  aggregate `catalog.manifestDigest` and `catalog.artifactDigest` values for
  generated artifacts. The live smoke verifies that shape and both digests
  without publishing internal file names or per-file hashes. The endpoint is
  marked `noindex, nofollow`.
- `vercel.json` defines the expected static deployment settings. Set
  `PUBLIC_MONARCHIC_WEBSITE_BASE_URL`, `PUBLIC_MONARCHIC_API_BASE_URL`, and
  `PUBLIC_MONARCHIC_WEBAPP_BASE_URL` from
  `env.example` in Vercel before deploying.
- `vercel.json` also applies the website CSP, HSTS, framing, MIME-sniffing,
  referrer, and browser-permission headers. Keep the CSP API origins aligned
  with the production and staging waitlist endpoints.
- Available MCP product pages render a website-local, schema-grounded workflow
  proof. Those examples must keep their permission and content-isolation
  boundaries beside the request, output, and estimated usage impact.
- `src/lib/mcpResearch.ts` associates the approved ExplicitMem research report
  with its catalog product. `src/lib/explicitmemBenchmark.ts` holds its published
  study summaries. Research coverage is independent of catalog coverage;
  product workflow proofs do not create research routes.
- Set `PUBLIC_MONARCHIC_WEBSITE_BASE_URL` when building non-production
  environments that need canonical URLs, Open Graph URLs, robots output, and
  sitemap entries to point somewhere other than `https://monarchic.io`.
- Set `PUBLIC_MONARCHIC_API_BASE_URL` when the website waitlist should submit
  somewhere other than `https://api.monarchic.io`.
- Set `PUBLIC_MONARCHIC_WEBAPP_BASE_URL` when available-plan purchase links
  should open somewhere other than `https://app.monarchic.io`.
- `pnpm smoke:local` builds the static site, starts `astro preview` on
  `127.0.0.1:4332`, runs the production smoke assertions against that local
  preview, and stops the server. Override the port with
  `MONARCHIC_WEBSITE_LOCAL_PORT`.
- `pnpm smoke:production` uses Playwright to verify the live site HTTP
  response, `robots.txt`, `sitemap.xml`, homepage metadata, product pages,
  the ExplicitMem research route, reciprocal product links, the waitlist form
  contract, and horizontal overflow against
  `https://www.monarchic.io` while keeping canonical URLs pinned to
  `https://monarchic.io`. Override the target with
  `MONARCHIC_WEBSITE_SMOKE_URL`. Override expected canonical links with
  `MONARCHIC_WEBSITE_EXPECTED_CANONICAL_URL`, which is useful when smoking a
  local preview built with production canonical URLs.
  On NixOS, prefer `nix develop -c pnpm smoke:production` so the smoke script
  gets a Chromium executable with the required shared libraries.
- `pnpm smoke:production:www` is an alias for the current production release
  gate.
- `pnpm smoke:production:apex` runs the same gate against
  `https://monarchic.io`. Use it while investigating apex DNS or edge routing.
- `dist/` contains generated build output and should be treated as an artifact,
  not as source.
