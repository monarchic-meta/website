# Hero sequence and interaction audit

**In progress — 2026-11-01.** All eighteen owner-selected references remain in
the [complete source list](heroes.md#complete-owner-selected-list). The target is
their complete opening experience: its meaningful states, interactions and
handoff into the following content. That experience can span several screens,
use an interactive viewport, or unfold over time. A first fold, a tall screenshot
or one looping graphic does not establish that coverage.

The existing [standalone recreations](../design-studies/standalone-heroes/handoff.md)
are preserved. Their saved-state, responsive and playback checks verify the
authored studies; they do not establish full fidelity to the source sequences.
The gaps below identify further source inspection and recreation work.

The additive [behavior recreation round](../design-studies/hero-behavior/README.md)
retains [authoring contracts for all eighteen references](../design-studies/hero-behavior/source-contracts/index.json).
New live actors and native interaction pages are being built against those
contracts. The source observations below retain their original evidence
boundaries; “current gap” describes the preserved first-fold study, rather than
claiming that a later local actor is saved and verified in Framer. The new
round records implementation and reload/Preview verification separately.

## Evidence boundary

“Earlier observation” means the browser or media observation recorded in the
[original review](heroes.md), supported where available by retained captures.
Different stills establish different appearances; they do not establish whether
time, scrolling or pointer input caused the change. Source code and gallery
descriptions likewise do not establish observed behavior.

The new Desktop browser pass adds sequence or control observations for Polar,
Artemii Lebedev, G!theimagineers, FORMAT, Unbelievably Crap, MECHA and Bleibtgleich.
FORMAT was followed to its footer, and Unbelievably Crap to its terminal scene;
the remaining visits cover the specific states described below. None of these
visits completes every interaction or responsive state. Current-site behavior
must stay separate from a different owner-selected archive revision. Type Face
and Ajedrez are recorded motion works, with no independent website supplied;
their temporal sequences require a media audit instead.

Session evidence is retained outside Git in
`hero-behavior-audit-2026-10-31`: `audit.json` maps all eighteen references to
source captures, recipe limits and inspection questions; `observations.json`
records the new browser actions, viewport/scroll metrics and screenshots.
Source-led changes remain credited in **Source inspiration**.

## HERO-001 — Type Face

[Selected gallery](https://recent.design/i/vmmug5r-type-face) ·
[Stephen Kelman's source post](https://x.com/stephenkelman/status/2093335231604367454)

- **Evidence:** the retained gallery movie and samples at 0, 2, 4, 6 and 8 seconds
  show sparse writing, a resolved head, rotation and later sparse patches.
  Continuous timing and the loop boundary have not been reviewed.
- **Earlier study gap:** the recreation supplies a rotating written surface on a
  credited head stand-in. It omits assembly and dispersal.
- **Next inspection:** watch the complete movie, record phase boundaries and
  inspect any player/input behavior. Do not invent a scrolling website for a
  motion post.

## HERO-002 — Ajedrez Film Poem

[Selected gallery](https://recent.design/i/qfy3385-ajedrez-film-poem) ·
[Julián Leiss's source post](https://x.com/julianleiss/status/2110868325052149925)

- **Evidence:** the actual 52-second source film is retained. Sampled contact
  sheets show chessboards, hands, photographs, diagrams and changing type
  compositions. Full pacing, sound and voiceover have not been audited.
- **Earlier study gap:** one native photographic spread replaces a changing film.
  The other scenes, cuts and temporal typography are absent.
- **Next inspection:** build a timestamped shot/type timeline from the complete
  film; distinguish observed audio from the gallery's description. Preserve the
  unverified underlying archival-photography attribution limit.

## HERO-003 — Agent-first Billing / Polar

[Selected gallery](https://recent.design/i/lzxaebw-agent-first-billing-landing-page) ·
[Primary field guide](https://polar.sh/field-guide) ·
[Credits chapter](https://polar.sh/field-guide?page=m-credits)

- **New Desktop browser observation:** start at the canonical URL without a
  query. At 1280×720, the document stays one viewport high while a 672px-tall
  inner pane holds 26,703px of guide content. The mark and construction guides
  resolve during an untouched wait. The first inner scroll exposes the lower
  chapter tiles; the second reaches a black Imagine film strip and the start
  of Core principles, with the URL changing to `?page=m-principle`. Fixed
  navigation surrounds this nested content.
- **New control observation:** selecting Credits jumps the pane to offset
  20,565 and `?page=m-credits`, with credit/event demonstrations. Selecting
  Agent-first Billing returns to offset 0 and the canonical URL. Query-selected
  Credits is a later chapter, not the landing hero.
- **Earlier study gap:** static construction geometry and chapter tiles do not
  reproduce assembly, nested scrolling, chapter jumps or changing demonstrations.
- **Still unverified:** complete assembly timing, film playback, all ten
  chapters, individual demo inputs, reverse scrolling and source Phone states.
  The landing-to-principles boundary is observed; the full guide is not audited.

## HERO-004 — Artemii Lebedev

[Selected gallery](https://www.siteinspire.com/website/13624-artemii-lebedev) ·
[Primary site](https://artemiilebedev.com/)

- **New Desktop browser observation:** project film plays beneath the compact
  utility panel and index in a 1280×720 viewport. Pressing the advertised Esc
  key adds a grainy raster treatment across the film and interface. Clicking
  Expand opens three broad information columns with current work, biography,
  articles and case links; Minimize restores the compact panel. After a downward
  wheel gesture the document remains 720px high at window offset 0, with no
  detected inner scroller. That gesture alone does not establish a scroll story.
- **Earlier study gap:** a fixed OXI photograph and selected row replace the film and
  project-selection experience. Hold, Esc effects and expansion are absent.
- **Still unverified:** isolated row hover versus click, click-and-hold view
  switching, other Esc states, project transitions and touch/Phone alternatives.

## HERO-005 — Maximilian Kaspar

[Selected gallery](https://www.siteinspire.com/website/13623-maximilian-kaspar) ·
[Primary site](https://www.maximiliankaspar.com/)

- **Evidence:** gallery Desktop/Phone stills establish the branching glyph form,
  grid and asymmetric statement. Earlier live visual navigation stalled. Current
  copy differs from the selected job-availability statement.
- **Earlier study gap:** a static native glyph contour and statement do not establish
  any source animation, pointer response or transition into projects.
- **Next inspection:** obtain a reliable live sequence; test stationary wait,
  pointer movement and scrolling separately. Preserve the gallery revision
  rather than silently substituting current wording or behavior.

## HERO-006 — Mac Moss Studio

[Selected gallery](https://www.siteinspire.com/website/13575-mac-moss-studio) ·
[Studio](https://macmoss.studio/) · [KEEN project](https://macmoss.studio/KEEN-2)

- **Earlier observation:** the twenty symbols change within their four-by-five
  matrix. The retained GIF was sampled into 125 vector frames at 12 fps; the
  opening capture includes the broad rail, runner and following media edge.
- **Earlier study gap:** all twenty cells animate, but the portfolio/media sequence,
  live clock, project navigation and rail behavior are not recreated.
- **Next inspection:** watch the complete loop in context, then scroll through
  following media and a project transition. Check rail persistence, runner/media
  behavior, actionable cells and the source's responsive ordering.

## HERO-007 — Cantor8

[Selected gallery](https://www.lapa.ninja/post/cantor8/) ·
[Primary site](https://www.cantor8.io/)

- **Earlier observation:** successive live frames showed changing filaments and
  peripheral labels. Initial scrolling retained navigation; the following
  content continues on cobalt.
- **Earlier study gap:** independent filament animation and static labels omit any
  source scroll progression, changing instrument labels or menu transition.
- **Next inspection:** separate time, pointer and scroll effects; follow the
  network/headline through the Foundation handoff. Check menu and contact
  behavior without submitting a form, then inspect Phone.

## HERO-008 — PP Neue Montreal

[Selected gallery](https://www.lapa.ninja/post/pp-neue-montreal/) ·
[Primary site](https://neuemontreal.com/)

- **Earlier observation:** the red opening leads into a black composition with
  green/cream type. A tall selected archive is retained, but the complete
  choreography and city-film playback were not reviewed.
- **Earlier study gap:** the recreation ends with the red composition and a film
  still; subsequent typographic scenes and type/scroll interactions are absent.
- **Next inspection:** map the red-to-black transition and subsequent scenes to
  determine the opening's real extent. Inspect the film, capsule navigation and
  genuine type controls. The current first-fold overlap is not a fidelity target.

## HERO-009 — Vercel

[Selected gallery](https://www.lapa.ninja/post/vercel-3/) ·
[Primary site](https://vercel.com/)

- **Evidence:** the selected dark full-page archive extends beyond the three
  opening zones into product content. Earlier current-site frames showed a
  changing halo/shadow, without isolating its input or full sequence. The current
  theme may differ from the selected dark revision.
- **Earlier study gap:** an approximate live halo does not recreate any selected
  pointer behavior, changing statements or product-section transition.
- **Next inspection:** obtain matching revision motion where possible; separately
  test current wait, pointer and first-scroll handoff. Do not apply current-site
  behavior to the dark archive without identifying that adaptation.

## HERO-010 — G!theimagineers

[Selected gallery](https://httpster.net/website/gtheimagineers/) ·
[Primary site](https://www.gtheimagineers.com/en.html)

- **New Desktop browser observation:** the document stays 720px high at window
  offset 0. Clicking each of the five chapter rails — Manifesto, Vision,
  Expertise, Experience and Contact — expands that chapter while compressing
  its neighbors. Vision's initial contour develops into dense rings during a
  stationary wait, alongside prose with its own scrollbar. Expertise adds a
  nested Skills area; Experience and Contact display different content. Selecting
  Manifesto returns to its chapter state. This is an interactive accordion
  viewport rather than an ordinary tall hero.
- **Earlier study gap:** one static expanded arrangement omits the accordion,
  arc-to-ring transition and other chapter states.
- **Still unverified:** full nested prose and Skills content, every settled
  geometric transition, isolated hover, keyboard and source Phone navigation.
  All five chapter selections were reached; their entire state space was not.

## HERO-011 — Jon Way Studio / JW.S

[Selected gallery](https://httpster.net/website/jon-way-studio/) ·
[Current destination](https://www.jonway.studio/)

- **Evidence:** the selected 2023 archive shows overlapping project fields,
  an information sheet and index. The previously reached current site was a
  different Jon Way/Stradis presentation, not proof of the archived controls.
- **Earlier study gap:** Navigate/Explore, project/index transitions and any moving
  information sheet remain static or absent.
- **Next inspection:** recover a matching recording or archived primary version.
  If unavailable, keep the selected interaction unknown; do not infer its
  behavior from the current replacement.

## HERO-012 — Mezmo

[Selected gallery](https://httpster.net/website/mezmo/) ·
[Current destination](https://www.mezmo.com/)

- **Evidence:** the selected 2022 green operational-diagram opening is retained
  as a still. The earlier configuration-panel click belongs to the different
  current AURA presentation, not that archived diagram.
- **Earlier study gap:** the native diagram has no verified source flow animation,
  module interaction or transition into the next section.
- **Next inspection:** seek a matching archive recording before assigning flow
  behavior. Keep current AURA inspection separate; no terminal command is needed
  merely to inspect a visual control.

## HERO-013 — FORMAT

[Selected gallery](https://www.awwwards.com/sites/format) ·
[Primary site](https://format.obys.agency/)

- **New Desktop browser observation:** at 1280×720, the document measured
  13,474px. Seventeen forward scroll captures followed entry from offset 0 to
  12,744 near the footer. The sequence moves from the architectural wordmark and
  Vertical sheet through Horizontal multimedia panels, giant circles and
  wobbling type, Triangle, crossing Circle/Triangle bands, circular slogans,
  flower/advice material and a rotating card, ending at the FORMAT footer.
  This is a long format essay, not one panel below a wordmark.
- **New interaction observation:** clicking Notes Mode from 0 to 1 adds visible
  yellow callouts. Enabling My 6 y.o. Daughter's Version adds colorful drawn
  overlays after loading, visible in the opening photograph and clock. Both
  controls were restored to 0. The complete alternate journey was not audited.
- **Earlier study gap:** the recreation contains the wordmark, one Vertical sheet and
  a native anchor. It omits the subsequent format sequence, continuous changes,
  Notes Mode and other interactions. An anchor is not equivalent to the source
  scroll choreography.
- **Still unverified:** hover, drag/physics, touch/Phone, reduced motion, reverse
  scrolling and exact timing/coupling of each animated element. The new traversal
  improves extent coverage; it does not complete this reference's interaction
  audit.

## HERO-014 — Unbelievably Crap

[Selected gallery](https://www.awwwards.com/sites/unbelievably-crap) ·
[Primary site](https://www.unbelievablycrap.com/)

- **New Desktop browser observation:** the document stays 720px high and window
  offset stays 0 throughout wheel input. The experience advances its own virtual
  timeline: a black full-body raster figure, biographical columns around changing
  poses, a torn white reveal, the white/red portrait with projected words and
  changing bars, red copy and another torn transition, then a terminal red scene
  with an exit message and tilted framed object. Further forward gestures retain
  that last composition while details continue moving.
- **Revision correction:** the white/red portrait selected in the gallery
  appears later in this same current live journey. Its difference from the black
  entrance is not evidence of a replacement revision. The existing recreation
  represents a middle scene rather than the complete opening.
- **New reverse observation:** three upward wheel advances return from the
  terminal scene toward the torn white transition, still at window offset 0.
  Work and Gallery are separately linked routes; neither was traversed in this
  pass. A taller document or ordinary document-scroll animation would not by
  itself recreate this control model.
- **Earlier study gap:** a white/red bust stand-in with local raster motion omits the
  introduction, full-body environment and virtual narrative, including the
  transitions and outro.
- **Still unverified:** exact wheel sensitivity and phase boundaries, complete
  reversal, pointer/drag/tearing controls, linked route transitions and source
  Phone/reduced-motion alternatives. Retain the geometry stand-in credit.

## HERO-015 — MECHA

[Selected gallery](https://www.awwwards.com/sites/mecha) ·
[Primary site](https://mecha-xyz.webflow.io/)

- **New Desktop browser observation:** distinguish the gray giant-MECHA loading
  frame from the settled white opening. The latter has a complete wireframe M
  centered in a broad left rail, an investment index below and a large serif
  manifesto on the right. The document measures about 10,775px at 1280×720.
  By offset 666, the first investment begins and the M is smaller and sideways;
  at 1,391 it remains beside the content. By 2,105 the mark is gone while the
  wordmark and index remain. The second investment enters near 2,796.
- **New control observation:** selecting Aescape in the left index moves to
  offset 3,144 and activates the second investment. The persistent rail and
  changing content are part of the sequence, not a fixed cropped logo frame.
- **Earlier study gap:** independent mark rotation under a fixed statement omits
  the settled opening's full rail composition, source scroll coupling, changing
  investment content and index transitions.
- **Still unverified:** exact mark-to-scroll coupling, reverse movement, the
  third investment and footer, isolated pointer effects and source Phone states.
  Current settled styling and the selected gallery image remain separately
  identified; the gallery's whole revision is not established by this visit.

## HERO-016 — Origin

[Selected gallery](https://minimal.gallery/origin/) ·
[Primary site](https://www.originbrand.io/)

- **Earlier observation:** pale light forms and information-card size changed
  across captures. Their input coupling was not isolated. The linked ambient
  dots-field video was not reviewed.
- **Earlier study gap:** the small approximate light loop sits inside a static
  wordmark/card composition. Card resizing, source input behavior and subsequent
  progression are absent.
- **Next inspection:** measure the card during untouched wait, hover/leave and
  scrolling separately. Follow the identity into programs; establish whether the
  ambient field belongs to that opening story and inspect Phone.

## HERO-017 — Bleibtgleich 2026

[Selected gallery](https://minimal.gallery/bleibtgleich-2026/) ·
[Primary site](https://bleibtgleich.dev/)

- **New Desktop browser observation:** initial blank captures precede the loaded
  hero and must not be used as its design. The loaded entry has an upper organic
  eye/mask form, an asymmetric name/service statement, central rule and Menu
  capsule. The document measures 5,892px at 1280×720. Forward captures around
  offsets 700, 1,439 and 2,113 reveal continued service type, a large execution
  statement, then scattered dimensional project fragments and organic forms.
  Work 24–26 enters near 2,823, about four viewport advances from the top.
- **Input limit:** a drag across the top mask changed its appearance while
  window offset stayed 0. Untouched time was not isolated, so this does not prove
  that drag, hover or scrolling alone drives the mask. Likewise, the first wheel
  gesture coincided with the loader finishing; it does not establish a reveal
  requiring input.
- **Earlier study gap:** a fixed black aperture, text and rule omit moving masks,
  image reveals and the complete identity-to-work progression.
- **Still unverified:** isolated time/pointer/scroll causality, mask media,
  continuous choreography, reverse movement and source Phone states. The work
  boundary is sampled, not every project or the footer.

## HERO-018 — pu—ente

[Selected gallery](https://minimal.gallery/pu-ente/) ·
[Primary entry](https://www.pu-ente.com/) ·
[Graphic-design branch](https://www.pu-ente.com/z/)

- **Earlier observation:** entry navigation reached the graphic-design branch.
  Its first geometric tiles were inspected; complete tile motion and gallery
  extent were not reviewed.
- **Earlier study gap:** the native entry links to an adapted same-page branch with
  three static motifs. It does not reproduce the source's separate-route/back
  behavior or complete graphic gallery.
- **Next inspection:** test gate hover/click, transition and return behavior,
  then inspect the Graphic branch's tile interactions and responsive layout.
  The Art branch remains excluded; its label in the gate does not reintroduce
  the removed Art & Visual Inspiration collection.

## Completion criteria

For each reference, record the selected revision, full sequence or state map,
meaningful input-to-state relationships and the boundary into subsequent
content. Inspect time, scroll and pointer independently before naming a cause.
Record reverse/back behavior and actual source Phone states where available.
Archive-only unknowns stay explicit when matching motion cannot be recovered.

Then compare the recreation with that source record: identify missing states,
source assets versus editable reconstruction, intentional adaptations and
untested interactions. Verify the authored behavior in actual Preview after a
reload. Saved-state preservation and source-behavior fidelity remain separate
checks. All eighteen references stay selected while this audit continues.
