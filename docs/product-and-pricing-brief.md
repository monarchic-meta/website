# Product and pricing direction

Owner direction recorded on **2026-10-30**, alongside the
[homepage creative brief](homepage-creative-brief.md). This is a design and
commercial target for later decisions. It does not change the current product
catalog, prices, entitlements, billing rules or backend behavior.

## Owner's intended site roles

The main website serves both discovery/conversion and existing users. It should
centralize documentation, help, support, tutorials, API documentation, and
technical and design documentation. This does not mean placing all that content
on the homepage; its organization and destinations remain open.

The actual tools remain separate web apps elsewhere, reached through the Apps
launcher and relevant links. They may share underlying research, libraries or
backend infrastructure while retaining distinct app and backend boundaries.
This direction does not select domains, routes, authentication, deployment or
storage arrangements, or require the tools to move into the main website.

Complete and review the homepage before beginning the first individual product
page. Later product-page work may prompt further homepage refinements.

## Owner's product-story direction

The product overview should communicate the breadth of Monarchic's offering.
Prominent examples on the homepage should lead into that wider set of products
and solutions, rather than define the apparent limit of the company.

Each individual product story should:

1. Begin with a tangible problem and why it matters to the visitor.
2. Visually demonstrate what the product does and the benefit it provides.
   Diagrams and concrete behavior should help show the idea without requiring
   a non-specialist to understand machine-learning internals.
3. Reveal deeper mechanisms and supporting research through optional detail,
   with the relevant mechanism/research links near the bottom of the story.
4. Provide a clear path to conversion or purchase. Exact actions and destinations
   still need to match the product's availability and the shared account model.

Use quiet confidence and progressive discovery throughout: establish the
problem and value, demonstrate the behavior, then offer depth and evidence.
Benchmark recollections and claims of model superiority from the conversation
are not approved product claims. Research examples must remain tied to their
named dataset, configuration, method and limitations.

## Owner's target pricing direction

- **Shared plans:** bundle access across multiple products, with product-specific
  included usage, rather than requiring a separate plan for every product.
- **Separate API access:** make usage-based access visible, billed according to
  use of each product. The owner used the term **usage window**, but its meaning
  has not been defined; it does not yet specify a billing period or unit.
- **Presentation:** show plans first, while keeping API access prominent and easy
  to discover in the pricing journey. Do not bury it at the bottom of the page.

No plan names, prices, rates, allowance quantities, API inclusion, overage rules
or usage-window definitions are approved by this brief. It does not establish
which products belong in a plan or whether API use shares a plan's allowance.

## Current offering and open decisions

The implemented [hosted MCP catalog page](../src/pages/products/hosted-mcps.astro)
currently describes an account-level weekly execution allowance shared across
available MCPs, self-service pausing at the included limit, no automatic overage
charges, and separately arranged Enterprise capacity. The
[catalog code](../src/lib/pricing.ts) and
[generated usage policy](../src/lib/usage-policy.generated.json) remain the
existing implementation contracts. This local-source description is not a new
live billing verification. The target direction above must not be presented as
an already available replacement.

Still to decide: product groupings and flagship selections; problem-led stories
and demonstrations; plan access and per-product included usage; the API purchase
path, metering units, rates, usage windows, inclusion and overages; and how those
choices relate to the current offering. Pricing layout and responsive details
also remain open beyond plans appearing first and API access staying prominent.
Documentation and support information architecture, cross-site destinations and
integration details also remain undecided; no new routes are established here.

Follow the [shared navigation direction](shared-navigation.md) and
[manual Framer workflow](framer-prototyping.md) when prototyping. This record
authorizes no pricing-page implementation, billing change, production deployment
or Framer mutation.
