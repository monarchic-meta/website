# Website legibility review

This pass addresses the September 6 critique supplied on September 12, 2026.
The pasted attachment contains `Image` placeholders rather than screenshots. A later screenshot identifies the “Read report” action in the announcement bar.

| Critique | Change and verification |
| --- | --- |
| Pixelated header and footer wordmarks | `Wordmark.astro` frames the original 2172 × 724 asset at its native coordinates, then scales it once. Both placements use this component instead of CSS masking. Desktop and mobile screenshots cover both placements. The source remains a raster image; this is not a replacement vector drawing. |
| Brain enters tracking while scrolling | Mouse inspection requires pointer movement outside a scroll interval. Touch gestures belong to scrolling; a completed tap triggers a trace. The browser check verifies wheel scrolling, an actual touch swipe, tap, keyboard, and reduced motion. |
| Too much black across pages | Warm-gray introductions and selected reading sections alternate with charcoal sections. Page margins, panels, and cards have separate tones. Product, research, company, security, and legal routes are included in responsive checks. |
| Inconsistent borders and permanent Developer highlight | Neutral rules share a color token. Plan cards use the same resting border and highlight on hover or focus. Browser assertions check the Developer card against Individual at rest and during interaction. |
| Sparse Products index | Three task-based entry points link directly to RepoIntel, ExplicitMem, and BrowserOps. |
| Org Fleet spacing | Presentation formatting consistently spells the name “Org Fleet” in catalog cards, workflow links, metadata, and product copy. Catalog IDs and the shared source artifact stay unchanged. |
| Long product pages | Catalog section links wrap on mobile. A back-to-top link appears after scrolling and returns keyboard focus to the header. |
| Uneven rows and excessive white | Workflow entries have consistent minimum height and vertically centered labels. Dark lists alternate charcoal tones; light lists alternate warm-gray tones. Homepage method headings align at the top. |
| Contrastive copy | Removed “Systems, not demos” from the homepage and footer, and simplified the future-work introduction. |
| Oddly sized D / lettering off | Removed forced horizontal navigation scaling and the global letter-spacing override. The supplied “Read report” screenshot led to a 12px action label using the site font and a fixed-size SVG arrow; both announcement variants were checked at 320, 390, 768, and 1440 pixels. Whether this screenshot also identifies the separate “lettering off” comment is still unconfirmed. |

## Validation

Run `pnpm check`, `pnpm build`, the existing catalog/contract checks, and the
browser smoke suite. `pnpm check:legibility` adds eleven-route checks at 320,
390, 768, 1024, and 1440 pixels, plus interaction regression coverage. See the
README for the preview and Chromium setup.

The stale public usage policy export was refreshed after comparing the generated
artifact: only `source.commit` changed. No pricing or usage rules changed.

Visual evidence is written outside the repository to
`/tmp/monarchic-legibility`. The staging links in the attachment could not be
opened through the browsing tool; verification uses the local build.

## Consistent surface palette

Following review of staging, gray surfaces use fixed roles instead of changing
with section order. Dark sections use `surface` (`#202020`), and cards and inset
panels use `surface-raised` (`#3c3c3c`). Light sections use `paper` (`#f2f0e8`),
and light panels use `paper-muted` (`#d6d3c9`). Repeated rows alternate within
those pairs. Card grids keep one panel color. Black remains for the navigation,
footer, and brain field; yellow marks actions and the existing principle panel.
