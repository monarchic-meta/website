# Homepage creative brief

Owner direction recorded on **2026-10-30**. Dial in the visual style first;
concrete development selections and final copy will follow. This is a brief for
future prototypes and manual implementation, not a record of shipped changes.
The [shared navigation direction](shared-navigation.md) applies unchanged.

Use the homepage first as a proving ground for visual style and tone, drawing on
the existing style mix. This is continued exploration, not a reset or a final
design system. Keep detailed copy open and refine the homepage alongside the
product pages as those stories develop.

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
- The problems to foreground and the owner-selected flagship products.
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
