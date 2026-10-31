# Shared navigation direction

Owner brief recorded on **2026-10-30** for every Monarchic site. This records the
current design direction for future prototypes and implementation; it does not
describe a shipped navigation system.

## Owner decisions

Present Monarchic as an **R&D firm** through three equally important categories:
**Products**, **Solutions**, and **Research**. Place these together on the left
of the header, with conventional account and action controls on the right.
Their equal importance should be apparent in the composition; exact dimensions
and styling remain open.

Use the inviting label **Try Monarchic** when signed out, rather than the
clichéd or demanding **Get started**. After sign-in, this entry becomes **Apps**
and leads to a dashboard or launcher for Monarchic's web apps. The apps are
intentionally separate sites, hosted separately with different backends. Shared
navigation should make them discoverable without implying a single site or
backend.

Products, Solutions, Research, and the state-appropriate Try Monarchic / Apps
entry each have a hover dropdown with relevant entries. The brief does not yet
select the entries or their destinations. Include a **magnifying-glass search
control** and a **hamburger menu control** in the header.

The hamburger opens a **full-screen splash/navigation overlay**, rather than a
sidebar or a small dropdown. It should include all principal categories and
their subsections, along with destinations normally found in the footer, such
as legal and careers. An **X in the top-right** replaces the hamburger while
the overlay is open. Closing it returns to the same underlying page and context.

The owner cited Anthropic's full-screen menu as a **behavior reference**. The
centered logo and arbitrary left/right organization are not part of the desired
direction. The reference does not determine Monarchic's visual layout or menu
taxonomy.

## Banner and scroll behavior

The owner clarified the following behavior on **2026-10-30**. The slim split R&D
banner described in the [homepage creative brief](homepage-creative-brief.md)
starts directly below the navbar at the top of the page. It belongs to the page
and is visible at the initial top position; it does not travel with the navbar
as a persistent announcement strip. The owner's earlier phrase "fixed at top of
screen" describes where it is first encountered, not a viewport-fixed banner.

As the visitor scrolls down, the navbar passes over and covers the banner. On
**mobile**, after the banner is covered, continued downward scrolling slides the
navbar upward out of view. Reversing to upward scrolling reveals the navbar
again. That reveal does not bring the banner back; the banner returns only when
the visitor reaches the top of the page again. The owner has not yet selected
whether desktop uses the same hide/reveal behavior.

Record these distinct review states in prototypes and handoffs:

| State | Navbar | Banner | Menu / underlying page |
| --- | --- | --- | --- |
| Initial page top | Visible above the banner. | Visible directly below the navbar. | Menu closed. |
| Downward, after banner coverage | On mobile, slides above the viewport as downward scrolling continues. Desktop hide/reveal remains open. | Covered and no longer visible. | Continue on the same page. |
| Upward, below page top | On mobile, returns to view. | Remains absent. | Continue on the same page. |
| Page top again | Visible above the banner. | Visible again in its original page-top position. | Menu closed unless the visitor opens it. |
| Full-screen menu open | Hamburger is replaced by the top-right X. | Do not bring the page-top banner into the menu when opening below the top. | Full-screen navigation covers the underlying page; closing restores that page and context. |

This records visibility and sequence, rather than selecting CSS positioning,
pixel thresholds, animation timings, or a desktop rule. It also does not decide
which other pages carry a banner.

## Implementation considerations

The following are accessibility considerations inferred for implementation,
rather than additional owner-specified visual decisions:

- Provide click, keyboard, and touch equivalents for the hover dropdowns; every
  destination must remain reachable without a pointer hover.
- Give icon controls accessible names, expose expanded states, and make focus
  visible. Use links for destinations and buttons for disclosure controls.
- For a modal full-screen overlay, manage focus within it, support Escape to
  close, and return focus to the opener. Preserve the underlying page's context
  and restore its scroll position when closing.
- Account for reduced motion if the overlay or dropdowns animate. Exact motion
  and transition treatments have not been selected.
- For the mobile scroll behavior, keep focused controls available and prevent
  scroll-driven hiding from moving keyboard focus offscreen. Keep the menu's
  close control available while it is open. These are inferred interaction
  safeguards, not additional owner-selected motion rules.
- Apply reduced-motion handling to navbar hide/reveal as well. Review direction
  changes and small scroll movements. After anchor navigation or browser scroll
  restoration, check the banner against the actual page position rather than
  assuming that navigation returned to the top.

## Framer interaction review

Framer supports native scroll-direction triggers with Scroll Animations and
Scroll Variants, including navigation that hides downward and returns upward.
See the official [Scroll Direction update](https://www.framer.com/updates/scroll-direction)
and [navigation lesson](https://www.framer.com/academy/lessons/scroll-direction).
This confirms platform capability; it does not establish that an existing
Monarchic prototype has these interactions wired.

Prefer an editable native navigation component with visible and hidden states
where the available editor controls can express the sequence. Verify the
banner-coverage gate separately from direction detection: hiding immediately
on the first downward movement would skip the owner's requested cover-then-hide
sequence. Check all five states in Preview at the relevant breakpoints, then
reload the editor to confirm saved changes, following the
[Framer workflow](framer-prototyping.md).

If the authoring route cannot express or verify the combined sequence, retain
clearly identified static state studies and record the missing interaction in
the handoff. Static frames establish appearance only. Do not describe them as a
working scroll interaction. The two homepage studies now use the optional interaction override described
below because native direction triggers hid the header before banner coverage.

## Open decisions

- Dropdown entries, subsection taxonomy, destination URLs, and the final footer
  inventory. No new products, availability claims, or roadmap promises are
  established by this brief.
- The search scope, result presentation, and interaction after activating the
  search icon.
- The signed-out Try Monarchic destination, account-control labels, authentication
  integration across sites, and the launcher/dashboard implementation.
- Logo placement, overlay organization, visual treatment, and responsive behavior,
  including when header categories collapse and how dropdowns behave on touch.
- Desktop navbar persistence versus direction-based hide/reveal; the explicit
  hide/reveal decision currently applies to mobile.
- The banner-coverage boundary, page-top tolerance, scroll-distance threshold
  for direction changes, and handling of small movements or overscroll. These
  need review against actual navbar/banner dimensions rather than invented
  values in the decision record.
- Navbar slide duration, easing, travel, and reduced-motion treatment; behavior
  when a dropdown or search is open; and whether pages without a banner use a
  different hide trigger.

Use this brief with the [Framer workflow](framer-prototyping.md) and
[visual-language brief](design-inspiration/visual-language.md). Record the chosen
routes, responsive states, interaction details, and prototype links when those
decisions are made. The following prototype record distinguishes tested behavior from the owner
decisions above. The implemented Astro/Svelte site remains separate.

## Homepage prototype implementation — 2026-10-30

The unpublished [Black Instrument](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=nubGK6NoO)
and [Open Edition](https://framer.com/projects/monarchic-io--V4oBgJHPFpR16fflzUp7-1YmJt?node=X17ccaPKM)
pages retain native editable navigation, dropdowns, banners, links, and full-screen
menu/search layers. Their Desktop/Phone navigation instances sit inside native
frames named **Navigation / stable behavior host**. The optional
[HomepageNavigationInteractions.tsx](design-studies/code-components/HomepageNavigationInteractions.tsx)
override attaches to those stable frames, preserving native component and page IDs.
The existing nine code-study sources remain unchanged.

Prototype choices, pending owner review:

- Desktop keeps the navbar visible. Phone uses a maximum width of 809px, an
  8px direction threshold, a 1px page-top tolerance, and a 180ms slide. Reduced
  motion removes the slide transition. These values are implementation choices.
- The gate measures the actual banner and navbar. Once covered, the banner's
  paint stays hidden while its layout remains in place until page top, including
  upward scrolling near the top. Canvas and static exports remain inert.
- Products has four curated shortcuts: All products, Hosted MCPs, RepoIntel,
  and BrowserOps. The full-screen menu includes all 24 current MCP destinations;
  six retain their **In development** qualification. ExplicitMem and ReleaseOps
  are included there. No Careers link is present because no current route was
  verified. The menu also includes verified page and footer destinations.
- Try Monarchic / Apps signed-out and signed-in variants demonstrate navigation
  states. They do not implement authentication or an app launcher. Search opens
  a native input and suggested links; no search service is connected.

Actual Preview checks confirmed mobile cover-then-hide, upward reveal with the
banner still absent, banner return at page top, Desktop persistence, full-viewport
menu/search, keyboard-activated X closure, and opener-focus restoration. A
stable-host keyboard close check also preserved the exact underlying scroll
position. Search accepts input and returns focus to its opener after X + Enter.
Pointer-activated X closure was not established: the available automation did
not reliably trigger native Tap, and locator activation could scroll before the
pointer event. The verified close paths are keyboard X and native menu Escape.

Actual Preview after a full editor reload confirmed that opening Solutions
closes the previously opened Products dropdown. Real outside clicks also close
dropdowns. **Escape does not close the native relative dropdowns** in these
prototypes; this remains an accessibility limitation against the implementation
considerations above. The full-screen menu does close with Escape, restoring
the exact underlying scroll position and opener focus. These are separate native
behaviors. The override passes native pointer and keyboard events through without
synthetic outside clicks. After modal Escape, a temporary child-list observer
waits for the native close control to disappear, then restores context; it does
not force native closure. The observer disconnects after restoration, cancellation
or disposal, and remains inactive during ordinary scrolling. Final Preview on the
saved override confirmed that scrolling resumes after the menu's delayed Escape
exit: Phone down at 160px hides the navbar, up at 120px reveals it with the banner
still hidden, and true page top restores the banner.

The dedicated `pnpm check:homepage-navigation` command passes 25 focused groups,
including semantic TypeScript, scroll state, context restoration and delayed
native-exit lifecycle checks with deterministic DOM doubles. They do not establish Framer overlay dismissal, browser focus trapping or
rendered layout; those require actual Preview checks after a full editor reload.
