# Source hero recreations

Recreate the selected source closely: composition, artwork, typography, scale,
materials, interaction and the complete sequence into following content. Compare
corresponding states directly. A working animation, first-fold resemblance or
shared visual template does not establish source fidelity.

The [complete owner-selected list](../../design-inspiration/heroes.md#complete-owner-selected-list)
contains all eighteen references. The [source contracts](source-contracts/index.json)
distinguish retained browser/media observations, current public-code facts,
independently fitted behavior and unresolved questions. Current redesigns do not
replace selected archive revisions. Each runnable hero belongs on its own regular
Framer Web page, credited within **Source inspiration**.

The earlier [standalone openings](../standalone-heroes/handoff.md) remain intact as
comparison material. Their sealed manifests describe that earlier round. Local
code tests, saved editor readbacks, actual Preview behavior and source similarity
are separate checks; none substitutes for the others.

## Authoring components

Native frames, text, shapes and individual source-media apertures remain editable.
Code supplies procedural rendering or behavior that native layers would flatten.
No automatic synchronization with the production Astro/Svelte site is introduced.

| Reference | Code | Source characteristic and limits |
| --- | --- | --- |
| HERO-001 / Type Face | [TypeFaceSequence](../code-components/TypeFaceSequence.tsx) | Complete 9.6-second assembly, turn and dispersal; credited substitute head, writing and font; fitted timing |
| HERO-002 / Ajedrez | [SourceAjedrezSequence](../code-components/SourceAjedrezSequence.tsx) | All 37 native scene groups across the 52.314558-second film; photographic motion and audio remain distinct gaps |
| HERO-004 / Artemii Lebedev | [SourcePortfolioFilmStudy](../code-components/SourcePortfolioFilmStudy.tsx) | Genuine project films, source-supported selection/transition timing and native utility interface; immersive layout and later effects are fitted |
| HERO-005 / Maximilian Kaspar | [SourceKasparASCIIStudy](../code-components/SourceKasparASCIIStudy.tsx) | Actual botanical mesh, pale ASCII reveal and rotation; one selected mesh and an independently adapted Phone layout |
| HERO-006 / Mac Moss | [SourceMacMossPortfolio](../code-components/SourceMacMossPortfolio.tsx) | Four-photo manual sequence and clock beside the retained 20-cell atlas; source timezone unresolved |
| HERO-007 / Cantor8 | [SourceCantorInstrument](../code-components/SourceCantorInstrument.tsx) | Source-informed Canvas2D filaments, local spring response and timed labels; independent seeds/integration and Phone adaptation |
| HERO-008 / PP Neue Montreal | [SourceTypeProximity](../code-components/SourceTypeProximity.tsx), [native section behaviors](../code-components/SourceMontrealBehaviors.tsx), [split glyph flow](../code-components/SourceMontrealGlyphFlow.tsx) | Actual variable fonts, editable proximity letters, postcard flips, attraction panels, eighteen weight states and source-derived pinned glyph geometry; source films remain separate apertures |
| HERO-009 / Vercel | [SourceVercelLightStudy](../code-components/SourceVercelLightStudy.tsx) | Upright triangle, spill, grain and native capability states; independent material fit and unknown capability-to-light mapping |
| HERO-013 / FORMAT | [SourceHeroNativeBehaviors](../code-components/SourceHeroNativeBehaviors.tsx), [SourceFormatDetails](../code-components/SourceFormatDetails.tsx) | Source-derived document geometry, separate early and late cards, native fan, clocks, word reel, windows, gauge and poster sequence; exact source logo geometry and individual source photographs; interpolation and Phone remain fitted |
| HERO-014 / Unbelievably Crap | [SourceHeroJourneyStudy](../code-components/SourceHeroJourneyStudy.tsx) | Actual figure and head through reversible virtual scenes; fitted camera/input curve and substitute biography |
| HERO-015 / MECHA | [MechaScrollMark](../code-components/MechaScrollMark.tsx) | Actual M geometry, scroll poses and exit; native index/rail bindings use SourceHeroNativeBehaviors |
| HERO-017 / Bleibtgleich | [SourceBleibtMark](../code-components/SourceBleibtMark.tsx), [OpeningField](../code-components/SourceBleibtOpeningField.tsx), [ProjectField](../code-components/SourceBleibtProjectField.tsx) | Exact final source mark, actual source project images, pointer reveal and native image belt; independent CPU fluid and CSS3D replace source rendering |
| HERO-018 / pu—ente | [SourcePuenteBehaviors](../code-components/SourcePuenteBehaviors.tsx) | Native two-half gate, source-supported curtain, fifteen actual Graphic projects and clipped trail; current-code facts remain distinct from observed input |

Kaspar requires its sibling `SourceKasparASCIIData.ts`. The virtual journey needs
`SourceHeroJourneyData0.ts` and `SourceHeroJourneyData1.ts`. Register the exact plain
data modules first. Do not replace actual source geometry or project artwork with
unrelated stand-ins without recording that difference.

HERO-003 / Polar and HERO-010 / G! primarily use native navigation and compositions.
HERO-011 / Jon Way and HERO-012 / Mezmo retain selected historical layouts; the
matching historical interaction sequences remain unverified. HERO-016 / Origin
keeps its changing light inside the original small utility card rather than
expanding it into a full-screen graphic.

## Interaction and rendering checks

Framer native motion layers expose `onTap`. A DOM fixture that forwards `onClick`
alone can pass while the real native control fails. Preserve caller handlers,
refs and cancellation, consume duplicate tap/click channels once, and test with a
native-like adapter that deliberately drops `onClick`. Verify the actual pointer
and keyboard controls in Framer Preview after a reload. Decorative transparent
layers must not intercept those controls.

Keep native scene groups mounted at opacity zero when an override reveals them.
Check the actual authored Phone positions and visibility: inherited absolute
coordinates do not become ordinary flow automatically. The FORMAT Desktop
[recipe](native/HERO-013.json) and [Phone adaptation](native/HERO-013-phone.json)
are separate; Desktop actor tracks apply only at widths of at least 1280px.

Exports, thumbnails and the default editor canvas remain static. Canvas motion is
an explicit opt-in at 12fps and 1MP. Preview animation, native navigation and
resource admission require their own checks. Procedural raster actors preserve
the existing per-window v2 budget: at most two initializing/live WebGL contexts,
one live editor study or two live Preview studies, serial still refinement up to
2MP, resolution-aware cached frames and cleanup outside visibility. Native CSS3D
and Canvas2D actors allocate no WebGL contexts.

The film actor also needs a separate asynchronous decoder budget. Static and
unready surfaces show genuine still posters; a nonempty canvas is insufficient
proof of motion or image quality. Test selected timestamps against decoded frames
and preserve the last sharp frame during focus handoff and errors.

## Reproducible validation

Use pnpm through the locked Nix environment. React 18 dependencies are development
fixtures; the authoring components are excluded from production site TypeScript.
Focused checks inspect types, source data, geometry and lifecycle. Real ReactDOM
browser fixtures check inputs, timing, actual pixels, reduced motion, static
exports, resolution and resource recovery. Nix outputs keep PNG/JSON evidence
under `evidence`.

```sh
nix build --no-link -L .#checks.x86_64-linux.hero-behavior
nix build --no-link -L .#checks.x86_64-linux.native-hero-behaviors
nix build --no-link -L .#checks.x86_64-linux.source-native-tap
nix build --no-link -L .#checks.x86_64-linux.hero-behavior-integration
```

The additive mixed check preserves all sixty legacy placements in each tested
pool realm and adds the new procedural actors. It compares fresh artwork pixels
and resource counts. Native source fidelity, actual Framer compilation and saved
page verification remain separate, reference-specific requirements. Use the
[sequence audit](../../design-inspiration/hero-behavior.md) for those boundaries.
