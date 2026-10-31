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

Use this brief with the [Framer workflow](framer-prototyping.md) and
[visual-language brief](design-inspiration/visual-language.md). Record the chosen
routes, responsive states, interaction details, and prototype links when those
decisions are made. Existing site code and Framer work remain separate from this
documentation-only decision record.
