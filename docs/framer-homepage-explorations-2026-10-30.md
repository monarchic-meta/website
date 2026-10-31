# Homepage explorations — Black Instrument and Open Edition

The subsequent [Signal Loom, Vermilion Index and Cold Archive variations](framer-homepage-variations-2026-10-30.md)
extend these drafts. Counts and verification below record this earlier round.

Created **2026-10-30** in the existing Monarchic Framer project. These are two
unpublished visual prototypes, with manual handoff under the
[Framer workflow](framer-prototyping.md). They establish a comparison surface for
homepage composition and tone before product-page exploration begins. They do not
establish a final design system, copy deck, product taxonomy or pricing model.

## Shared journey

Both concepts follow the current [homepage brief](homepage-creative-brief.md)
and [shared navigation direction](shared-navigation.md):

1. Identity and vision: an independent R&D firm building AI agent capabilities
   and execution infrastructure, with a reason for the work.
2. Tangible problems: decomposing broad work, retaining the person's intent,
   carrying context forward and checking whether the result satisfies the request.
3. Featured products: RepoIntel and ExplicitMem as selected prototype examples.
4. Broad Solutions: repository intelligence, browser verification, memory and
   release work, with a route to the complete product catalog.
5. Latest Developments: BrowserOps and ReleaseOps as available-product examples.
6. Research Highlights: scoped ExplicitMem findings, their method and limitations.
7. Explore More and the comprehensive footer.

RepoIntel and ExplicitMem are illustrative featured choices, not owner-designated
flagships. The development selection is also provisional editorial content:
availability does not establish a newest-release date. The pages add no invented
dates, metrics, customers, testimonials, adoption or comparative superlatives.

The hierarchy provides a clear introduction before increasing depth. Specific
capabilities stay understandable; curiosity comes from the artwork, pacing and
optional routes to deeper information.

## Black Instrument

An ink and graphite field pairs large, quiet R&D identity with the existing
Machined extrusion logo material. Thin wire constructions, interrupted paths,
open section spacing and a pale research chapter extend the graphic language.
The two new hero placements reuse `LogoStudy.tsx` with its source unchanged,
labels hidden and Canvas motion off. Preview motion retains its existing pause,
reduced-motion and shared-resource behavior.

Reference traits: WEB-003's dark object-led composition, GRA-005's wire geometry,
and WEB-008's graphic footer scale. The canonical logo geometry retains the
provenance recorded in the [logo studies](design-studies/code-components/logo-studies.md).

## Open Edition

Warm paper, cobalt and orange support staggered editorial type, an interrupted
color band and a native ordered-dither counterform. The artwork consists of six
independently composed planes around a negative opening, using editable square
marks rather than a downloaded image. Limited-palette distribution describes
intermediate tones. Modular and filament constructions return at different
scales through the product and research chapters.

Reference traits: GRA-001's type and band relationship, WEB-006's cobalt/raster
treatment, CC-003's tonal palette distribution, GRA-005's geometry, and WEB-008's
footer composition. These are compositional influences, not recreated source
layouts. The 16px recipe grid is an intentional coarse native approximation;
Phone artwork scales its actual editable coordinates while the surrounding page
layout reflows. The featured graphics fit the 302px inner card width.

## Navigation and responsive states

The native navigation keeps Products, Solutions and Research equally weighted
on the desktop left, with Try Monarchic / Apps, search and hamburger controls
on the right. The native component includes signed-out, signed-in, Phone,
menu-open and hidden-mobile visual variants. Signed-in is a prototype state;
no authentication or shared-backend implementation is implied.

The thin development/research banner is in page flow immediately below the
sticky header, rather than fixed to the viewport. Returning visitors can take
those short routes while first-time visitors follow the page story. Phone uses
two compact stacked banner rows.

Products has four curated shortcuts: All products, Hosted MCPs, RepoIntel and
BrowserOps. The other dropdowns also use existing destinations and proposed
grouping labels.
The hamburger opens a native full-screen overlay with the complete category
and footer inventory, including all twenty-four local catalog products with six
marked In development. Its X is wired to native Close Overlay. The search control opens a
native search visual state with an editable input and real suggested links;
there is no query engine, result generation or account integration.

Native visible/hidden variants provide the layout states. An optional code
override adds banner-gated mobile direction behavior and modal scroll/focus
restoration. Pointer and keyboard interactions remain with Framer's native
controls, without synthetic dismissal events. The banner is concealed after
coverage and returns at the actual page top; upward movement below the top reveals navigation
without returning the banner. Desktop navigation stays visible in this pass;
desktop hide/reveal remains an open owner decision. The 809px behavior threshold,
8px direction hysteresis, 1px top tolerance and 180ms movement are prototype
choices, not shared design tokens. Reduced motion removes the movement duration.

The optional behavior wrapper is maintained separately in
[HomepageNavigationInteractions.tsx](design-studies/code-components/HomepageNavigationInteractions.tsx).
Its focused regression entry point is
[check-homepage-navigation.mjs](../scripts/check-homepage-navigation.mjs):

```sh
nix develop -c pnpm check:homepage-navigation
```

The wrapper is `38cbc56d5a0bb5f1124f9fe1084d99c62f04d6e241b60e5ea4648479b4b7c190`,
with the registered override `codeFile/do719OQ:withHomepageNavigation`. It is
attached manually to stable sticky Frame hosts: Black Instrument uses
`A_AGBMFGy` / `ZaPMB5dn9A_AGBMFGy`; Open Edition uses
`g6gZr6RBO` / `Dgfb_pP74g6gZr6RBO` for Desktop / inherited Phone. The existing
native navigation instances remain relative children with their IDs preserved;
the override is cleared from those instances. This keeps controller lifetime
separate from native responsive-variant replacement. All four banners carry
`homepage-rd-banner`; earlier native direction effects are cleared so the two
mechanisms do not compete. Native layers remain the editable layout authority.
The wrapper uses public DOM events and adds no graphic study, WebGL context,
authentication or search backend.

The focused command passes twenty-five regression groups and strict TypeScript
checking. Actual Preview after a full editor reload verified the Phone sequence
on both pages: downward at 160px hides the 64px navbar, upward at 120px reveals it
while the banner remains hidden, and true page top returns the banner. Desktop
navigation stays visible. After the menu's animated Escape exit, Phone scrolling
resumes correctly. A temporary child-list observer detects completion of native
exit, restores context once and disconnects; it does not force dismissal or poll.

Actual native dropdown switching keeps one panel when moving from Products to
Solutions, and outside clicks dismiss dropdowns. **Escape does not close the
native relative dropdowns** in these prototypes. The full-screen menu does close
with native Escape and restores the underlying scroll context and opener focus.
Keyboard activation of X with Enter also closes the menu and search and returns
focus to their openers. Search accepts input without a connected search service.
Pointer-activated X closure was not established by the available automation;
native Tap and locator/coordinate activation were unreliable in those checks.
The verified close paths are keyboard X and native menu Escape. Browser focus
trapping was not established by the focused DOM-double tests.

The body footer includes a named Help & reference group: Support, Setup guide,
and Methods & findings. These link to `/company#contact`, the configured separate
app's setup route, and `/research/explicitmem`. No documentation/API-hub or careers
route was identified in the current website source; neither destination is
fabricated. The owner's broader unified documentation/help direction remains an
architectural target.
Existing Company, Research, Products, Hosted MCPs, Workspaces & roles, Security,
Setup, Privacy, Terms and support destinations remain grounded in the repository.

## Content and implementation boundaries

The product descriptions come from the local public catalog/details and workflow
proofs. ReleaseOps checks supplied release-readiness facts; this prototype does
not imply that its example inspects a repository or creates release tags.

The research highlights remain separate: the fixed LongMemEval-S synthesis
profile retains a temporal-answer mismatch for review; the cross-dataset
candidate-generation profile shows a smaller-pool coverage limitation. Neither
is a generic memory-accuracy claim or a head-to-head comparison. The research
links lead to the published methods and scoped results.

Space Grotesk and IBM Plex Mono are the font choices used for this pass.
Their use, the palettes and the artwork relationships are proposals, not final
shared tokens. Production Astro/Svelte code, catalog data, billing, prices,
limits, settings, publishing and the existing prototypes remain unchanged.
No automatic asset, design-token, code or CMS synchronization was added.

## Saved state and review

The drafts are separate unpublished WebPages:

| Concept | Page | Desktop / inherited Phone |
| --- | --- | --- |
| [Black Instrument](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=nubGK6NoO) | `nubGK6NoO` | `fUGUdTVRK` / `ZaPMB5dn9` |
| [Open Edition](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=X17ccaPKM) | `X17ccaPKM` | `q4Uy20s5j` / `Dgfb_pP74` |

The draft paths are `/prototypes/homepage-black-instrument` and
`/prototypes/homepage-open-edition`. Desktop is 1440px; Phone is 390px with
inherited content and explicit layout/graphic overrides.

After a full editor reload, actual Desktop and Phone Preview showed all four
Problems and the Help group in both directions. Body content fits its available
width: the observed Desktop content was 1425px and Phone content 375px after the
Preview scrollbar. The Phone featured graphics fit the padded inner cards;
Black's “Development.” line fits without clipping. Its reused Machined extrusion
hero animates in Preview with the expected source and study mode.

The final independent saved-main read passes all seventeen summary guards:
sixteen prior pages retain their complete stored hashes, all 123 previous study
placements and Canvas settings remain intact, and nine prior code sources and
exports are exact. All thirty-two primary and Phone body section hashes also
remain exact. The two new Machined extrusion instances bring the count to 125,
with Canvas motion off on both: sixty legacy placements retain their earlier
opt-in and sixty-five remain off. The optional behavior override is the only new
code path, bringing the source count to ten. Its exact current source, clean
write receipt, registered export, four stable hosts and four preserved native
navigation children are verified independently.

The saved-node map records both complete body hierarchies and the two reused hero
placements (`moMY6WGOq` and `ZaPMB5dn9moMY6WGOq`). The native art groups retain
stable catalog IDs in their Layers names as well as this handoff.

Evidence is retained in the task artifact directory
`homepage-explorations-2026-10-30`: `mcp/homepage-final-report.json`,
`mcp/homepage-after-raw.json`, `mcp/homepage-final-integrity.json`,
`mcp/homepage-node-map.json`, the authoring recipes, tool receipts and actual
Framer captures. The complete final payload is 127,574 bytes, SHA-256
`945c7760fa2b6759b790e86875e91e0d083244cf8a15d48fec110cb5013fa404`.
It came from one read-only official `exec`; no pagination was needed. The earlier
`21cf` source-era proof remains under `prior-navigation-source21cf/mcp`.
The incomplete paginated result and interrupted local bootstraps remain
diagnostic history, separate from the complete final proof.

Actual final-source Preview records are in `framer/final-preview-qa.json`;
`framer/{black,edition}-{desktop,phone}-final.png` records the four final views.
Both Desktop bodies fit 1425px of content and both Phone bodies fit 375px without
horizontal document overflow. The results above distinguish working behavior
from the remaining dropdown-Escape and pointer-X verification limits. They are
technical and composition review results, not owner acceptance of final style
or copy. Nothing was published or transferred automatically to production.
