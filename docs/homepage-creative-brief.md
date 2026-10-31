# Homepage creative brief

Owner direction recorded on **2026-10-30**. Dial in the visual style first;
concrete development selections and final copy will follow. This is a brief for
future prototypes and manual implementation, not a record of shipped changes.
The [shared navigation direction](shared-navigation.md) applies unchanged.
The opening direction below incorporates the owner's **2026-10-31** clarification.

Use the homepage first as a proving ground for visual style and tone, drawing on
the existing style mix. This is continued exploration, not a reset or a final
design system. Complete and review the homepage first, then begin the first
individual product page. Detailed copy remains open, and later homepage
refinements can accompany product-page work after that initial review.

## Homepage opening

Make the homepage opening unusually original, bold and immediately compelling.
The owner wants the visual composition to break the familiar headline-on-one-side,
illustration-on-the-other formula. Boldness belongs to the design: copy stays
restrained, direct and assured, with credible claims and clear identity and
purpose early in the experience. Visitors should understand who Monarchic is and
what it does while discovering the greater scope and weight of its work over time.

This is Monarchic's significant first public identity statement. It should feel
deliberately authored and specific to the company, like a compelling book cover
that invites deeper reading through distinctive craft and quiet intrigue. The
18 selected sites are principally references for captivating heroes. Study the
mechanisms that attract attention and create curiosity, then compose an original
Monarchic opening; they are not templates for copying whole sites or recognizable
compositions. Standard content patterns remain available deeper in the page.

The owner finds the current site competent but familiar, with little reason to
read further. The intended premium experience sets a craft bar across composition,
original graphics, typography, motion, interactions and details. The distinctive
hero sets a standard carried through the whole experience. That craft should
make the identity memorable and express Monarchic's conviction and ambition;
deeper evidence substantiates the confidence. Premium describes quality within
the full established style mix, without selecting pricing or a luxury/corporate
minimalist aesthetic. The owner's “S-tier” description sets a creative
expectation, not a verified public product claim or approval for superiority
language.

The owner's analogy to the opening of Nolan's *The Dark Knight* describes
immediate engagement that sustains a slow burn, with significance becoming
clearer as the experience unfolds. It is a tonal and structural reference, not
an instruction to imitate the film, capture scrolling or impose a waiting period.
After identity, the problems and flagship-product sections can transition into
ordinary free scrolling. Exact opening composition and interaction remain open.

Subpages prioritize clear navigation and may use more conventional heroes,
including split compositions. The homepage is the place to establish the more
distinctive opening. The [hero reference review](design-inspiration/heroes.md)
records specific visual and motion mechanisms for exploration; its references
do not prescribe a page structure or approve any factual claim.

Proceed in stages: first make credited recreations to learn the selected heroes'
visual mechanisms, then produce a substantial range of independently composed
originals, and only afterward explore original combinations. The eventual mix
should harmonize **immersive information field**, **evolving geometric identity**
and **editorial research montage**. These are complementary avenues, not an
exclusive choice; motion can contribute to all three. Reviewable recreations
come before new originals or hybrid heroes, following the
bounded first-wave plan. External work,
recreations and close adaptations remain credited within **Source inspiration**;
**Original compositions** is reserved for independently composed work.

## Company vision and research thesis

Monarchic aims to develop general-purpose AI systems capabilities across domains.
Its research addresses planning, heuristics and strategy, persistent memory,
alignment, judgment and taste, and verification. The identity should communicate
that broad ambition through concrete capabilities people can understand.

The owner's research thesis is that, as model providers make inference cheaper,
systems developers can make those models practical through better orchestration,
planning and strategies. He sees a possible major next era in AI systems. This
is company vision and a research thesis, not an established forecast or a claim
of achieved universal capability. Product availability, in-development work and
benchmark evidence retain their existing qualifications below; this positioning
does not select a hero composition or approve superiority claims.

## Owner's intended journey

Directly below the navbar, place a **slim, two-part banner**: one development on
the left and one research highlight on the right. It signals both sides of R&D
and gives returning visitors a quick indication of recent work, without letting
news dominate the hero.

The main page then tells this story in order:

1. **Identity and vision.** Introduce Monarchic as a research **and** development
   firm and explain what it is working toward before presenting individual work.
2. **Tangible problems.** Establish the concrete problems people recognize and
   the value of addressing them, in language accessible to non-specialists.
3. **Flagship products.** Show prominent products as tangible responses to those
   problems. The owner has not yet selected which products occupy these slots.
4. **Broad Solutions.** Show the breadth of products through what they help
   people do. The company should not read as if it has only two products.
   Solution groupings and their product mappings have not been selected.
5. **Latest Developments.** Present a few released or finished things,
   after the company, problems, products and Solutions have supplied context.
   This is not a place to present unfinished work as released.
6. **Research Highlights.** Select findings with enough explanation of **how**
   they were reached to make them meaningful. Avoid a chronological
   latest-research feed and excessive technical disclosure.
7. **Explore More.** Create a deliberate closing and next-steps section before
   the comprehensive footer. Its destinations remain to be chosen.

The small banner and the later development/research sections have different
roles: immediate orientation for returning visitors versus a contextual story
for first-time visitors. Exact banner content and update cadence remain open.

The owner identified these tangible AI failure modes to explore in the problems
section:

- Decomposing a problem into concrete, manageable pieces.
- Keeping work aligned with the user's intent.
- Retaining context and memory across steps or sessions.
- Verifying, testing and validating that the output satisfies the request.

Present these as difficulties AI systems can encounter, not universal
incapabilities. Map a product response only to its verified capabilities; this
brief does not claim every product resolves every failure mode. Monarchic's
long-running workflows remain in development.

Use **quiet confidence and progressive discovery**: establish the company and
its value first, then let visitors discover the depth of the work and its
evidence. Demonstrations and supported findings should carry the story; avoid
shouting superiority or using unsupported superlatives. Conversational enthusiasm
about benchmark performance or a model's suitability is not approved homepage
copy. Any eventual research claim must retain its verified scope and limits.

## Content candidates, not final selections

The following suggestions come from the repository's current public content.
They offer grounded material for visual exploration; they do not establish which
items are newest or approve final homepage copy.

| Candidate | Existing route | Qualified copy direction |
| --- | --- | --- |
| RepoIntel | `/products/mcp-repointel` | Give agents an indexed repository map, workflow context and source-file citations. |
| BrowserOps | `/products/mcp-browserops` | Inspect a page with reviewable screenshots, console failures and network observations. |
| ExplicitMem research | `/research/explicitmem` | Explain how fixed retrieval and answer-synthesis profiles perform across separately scoped evaluations, with their methods and limits. |

[Product details](../src/lib/productDetails.ts),
[workflow contracts](../src/lib/productWorkflowProofs.ts), and the
[public catalog](../src/lib/pricing.coming-soon.json) support the two product
examples. Despite that catalog file's name, these entries are marked available
and production. RepoIntel's example reads an already-indexed revision; BrowserOps
operates within a bounded browser request. Neither example is evidence of a new
release date or unrestricted capability.

The [research inventory](../src/lib/mcpResearch.ts) exposes one approved report:
[ExplicitMem](../src/pages/research/explicitmem.astro). Its
[evaluation definitions](../src/lib/explicitmemBenchmark.ts) keep LongMemEval-S
answer synthesis, LoCoMo retrieval, cross-dataset candidate generation and generic
answer support distinct. A highlight can select one finding and summarize its
method; it must not turn those measures into a general agent-accuracy claim or
imply several separate research publications.

For **Latest Developments** and the development half of the banner, confirm the
finished milestone and its release status before adding recency language. Local
availability is not release chronology, and this review did not check a live
deployment. Until a release selection is confirmed, present any prototype sample
as a selected product or development example without claiming it is the latest.
The catalog still labels Monarchic's long-running agent workflows as **in
development**; that is not an eligible finished-release example.

## Still to decide

- Final identity copy, visual composition, artwork and responsive treatment.
- Which problem examples to emphasize, their demonstrations, and the
  owner-selected flagship products.
- Solution categories, breadth of examples, and links between solutions and products.
- Which completed developments to feature, their supporting release evidence,
  and the two banner selections.
- Which research findings and method details to surface publicly, and their
  level of technical disclosure.
- Explore More destinations and the comprehensive footer inventory.

The [product and pricing brief](product-and-pricing-brief.md) records the intended
product-page storytelling and future commercial direction. Use the
[visual-language brief](design-inspiration/visual-language.md) and
[Framer workflow](framer-prototyping.md) for exploration and handoff. Do not infer
additional decisions from missing parts of the voice conversation. Existing
website routes, product claims and Framer work remain unchanged by this record.
