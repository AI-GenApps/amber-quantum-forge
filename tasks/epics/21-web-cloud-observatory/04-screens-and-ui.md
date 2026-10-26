---
epic: 21-web-cloud-observatory
task: 04-screens-and-ui
status: todo
commit_scope: cloud-observatory
depends_on: [21-web-cloud-observatory/03-progression-and-save]
estimate: XL
owner: agent
---

# All screens, navigation, design tokens, fonts, accessibility

## Goal

Build every screen of the game on the kit primitives and the `GameSession` controller from task 03,
with the art-bible design tokens, the two bundled OFL fonts, accessible contrast and hit areas,
code-drawn visuals, and named image slots that fall back to tasteful code-drawn placeholders. The
game is fully playable end to end in a browser after this task, even before any art arrives.
Agents verify it headlessly only; the owner judges the look in the browser at the end.

## Context / Decisions

- Screens, controls and accessibility rules: `.agents/games/cloud-observatory/product.md`. Palette
  and font plan: `assets-index.md` (art bible). Art style: ink-and-watercolour celestial atlas,
  deep navy, gold-leaf linework, restrained and luminous. Star maps and constellation lines are
  drawn by code (SVG) in gold on navy, never from images.
- Use kit primitives: `Screen`, `Button`, `IconButton`, `Sheet`, `Modal`, `Toggle`, `Tabs`,
  `Toast`/`useToast`, `ProgressBar`, `Card`, the kit router
  (`createRouter`, `useCurrentScreen`, `useBackInterceptor`), kit `strings`, `registerFonts`,
  `assertNoPlatformFontFallback`, `preloadImages`, `createMotion`.
- Fonts: Cormorant Garamond (display, OFL) and Manrope (body, OFL), downloaded from
  github.com/google/fonts (`ofl/cormorantgaramond`, `ofl/manrope`) into
  `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/cloud-observatory/`, subset to Latin with
  `pyftsubset --flavor=woff2` (Python fontTools with brotli is installed), and committed under
  `apps-games/cloud-observatory/public/fonts/cormorant-garamond/` and `.../manrope/` with each
  family's `OFL.txt`. All woff2 files together at most 400 KB. No rendered text may use a platform
  default font: every CSS `font-family` stack ends in the bundled families only (plus the generic
  `serif`/`sans-serif` keyword as a last resort that the test accepts only after the bundled names).
- Image slots (33) are listed in `assets-index.md`. In this task every slot renders through
  `ArtImage slot="..."`, which consults `ART_MANIFEST` (empty now; task 06 fills it) and otherwise
  draws a code placeholder (SVG in the palette: gold line emblem, soft navy gradient washes, simple
  instrument glyphs). The placeholders must look intentional, not like missing images.
- The sound/haptic hooks arrive in task 05; here every interaction calls a `Feedback` interface
  (`sfx(id)`, `haptic(kind)`) with a null implementation.

## Implementation Checklist

Design system (`apps-games/cloud-observatory/src/ui/`):

- [x] `tokens.ts`: `ThemeTokens` from the art bible (`ink-950` ... `success`, the kit's token
      names mapped: background `#101A33`, surface `#172445`, raised `#22335C`, text `#F3E9D2`,
      muted text `#C9BFA4`, accent `#D8A94B`, accent text `#0B1226`, danger `#F08A78`, success
      `#8FCB9B`, focus `#EBCB85`), font stacks, radii, spacing, durations; a high-contrast variant;
      `applyTheme` wiring and a `--co-hit: 44px` token.
- [x] `styles.ts`: the app stylesheet injected once (`injectAppStyles`), font sizes in `rem` only,
      minimum 44 px hit areas on every interactive class, focus ring, reduced-motion media rules,
      safe-area insets, no text below 0.875rem.
- [x] `fonts.ts`: `registerAppFonts()` registering Cormorant Garamond (500, 700, italic 500) and
      Manrope (variable 400 to 700) from `/fonts/...` using the kit helper, awaited before first
      paint of text (with a short timeout so the app never blocks).
- [x] `ArtImage.tsx` + `art-manifest.ts` + `placeholders/*.tsx`: slot name union (33), manifest
      lookup, `<img>` with `width`/`height`/`decoding`/`alt` when present, code placeholder
      otherwise; decorative images use `alt=""` and `aria-hidden`.
- [x] `NumberText.tsx`: renders `formatNumber(value)` with an `aria-label` from
      `formatNumberWords`, tabular figures.

Sky map (`src/sky/`):

- [x] `SkyMap.tsx`: SVG viewBox `0 0 1000 1400`, gold lines and stars from core coordinates,
      background wash from CSS gradients, optional layers (`sky-far`, `nebula-mid`,
      `horizon-hills` through `ArtImage`) and a twinkle that respects reduced motion.
- [x] `ChartBoard.tsx`: numbered star targets with hit radius at least 24 CSS px (computed from the
      rendered width), next-star ring and number badge (not colour alone), wrong-tap shake, drawn
      segment animation, completion flourish; uses `hitTestStar` from core.
- [x] `ConstellationFigure.tsx`: small static drawing for atlas cards and the journal.

Screens (`src/screens/`, all portrait, safe-area aware):

- [x] `Title`: key art slot, Continue / New Journey, How to Play, Settings; first-run vs returning.
- [x] `ObserveTab`: sky with Gather target (large), starlight total and per second, Comet button
      (after the first chart), next-goal hint (cheapest affordable useful thing).
- [x] `BuildTab`: 8 instrument rows (art slot, name, owned, per-second, cost, buy ×1/×10/×Max
      toggle), upgrade chips per row, locked rows until unlocked, long-press repeat.
- [x] `AtlasTab`: 12 constellation cards (emblem slot, state locked/ready/charted, cost, prerequisite
      text), opens the Chart Table; total bonus line ("+30% starlight from the atlas").
- [x] `ChartTable`: full-screen board, progress dots, mistakes counter text, cancel, completion
      sheet with reward summary and the new lore entry link.
- [x] `EclipseTab`: pending shards, Eclipse button (enabled at 5) with a confirm modal listing what
      resets and what stays, boon grid (10) with cost, owned and affordable states, shard balance.
- [x] `JournalTab`: six chapters with progress, entries (locked shows the unlock hint), chapter
      cards with the `lore-1..6` slots, reading view.
- [x] `WelcomeBack` sheet, `Comet` screen (tracing board, streak, claimed state), `Achievements`
      (20 rows with progress), `Statistics`, `Settings` (kit toggles, reset progress with a
      two-step confirm), `HowToPlay` (4 pages, text only here; the onboarding flow is task 05),
      `EclipseSequence` (full-screen transition; static card when motion is reduced), `ChapterCard`.
- [x] `App.tsx`: router wiring, tab bar via kit `Tabs`, header menu, back-button interception
      (sheet first, then screen, then confirm-exit on the Observe tab), game loop driving
      `session.tick` from an injected animation-frame scheduler capped at 10 ticks per second of
      game time, pause on `visibilitychange`/lifecycle pause.
- [x] Dev fast-forward: `?devspeed=N` (N between 1 and 600) multiplies the tick delta in dev builds
      only (`import.meta.env.DEV`); production builds ignore it (test both branches with an injected
      flag). Used by the owner QA to reach the Eclipse quickly.
- [x] `strings.ts`: every user-facing string in a kit `defineStrings` table (English only).
- [x] Replace the title stub in `main.tsx`; keep `GAME_TITLE` in `brand.ts`.

Tests (happy-dom, using Preact `act` and DOM queries):

- [x] Render every screen against a seeded session at three progress points (new, mid, late) and
      assert key content (counts of rows, cards, boons, entries, achievements: 8, 12, 10, 30, 20).
- [x] Interaction flows: tap Gather increases starlight; buying updates rows; locked rows can't be
      bought; atlas card opens the board; a full chart by tapping stars in order completes and
      shows the sheet; a wrong tap shows the miss state; Eclipse confirm resets and banks shards;
      boon purchase deducts shards; journal opens an unlocked entry and not a locked one; Comet
      claim once per date; settings toggles persist through the kit settings store.
- [x] Accessibility tests: contrast of every token pair used for text computed from hex (at least
      4.5:1; list the pairs); every `button`, `[role=tab]` and chart target has an accessible name;
      the stylesheet declares at least 44 px on `.co-btn`, `.co-tab`, `.co-chip`; font sizes use
      `rem`; no `font-size` below 0.875rem; chart targets expose `aria-label` ("Star 3 of 7, next");
      starlight live region is throttled (fake clock) to once per 5 seconds; the next star has a
      ring and a number badge; reduced-motion removes the twinkle and animation classes.
- [x] `assertNoPlatformFontFallback` on each rendered screen with `Cormorant Garamond` and
      `Manrope`; a CSS scan test asserts every `font-family` declaration lists only bundled
      families (and a generic keyword last).
- [x] Font asset test: the woff2 files and both `OFL.txt` exist, total woff2 bytes at most 400,000
      (kit `assertAssetBudget`).
- [x] Back-button tests: sheet closes first, then screen pops, then the exit confirm on Observe.
- [x] Placeholder tests: all 33 slots render a placeholder with the manifest empty and an `<img>`
      when the manifest lists the slot.
- [x] Update `assets-index.md` (fonts: files, sizes, licence) and `product.md` if a control changed.

## Files Touched

- `apps-games/cloud-observatory/src/{App.tsx,main.tsx,brand.ts,strings.ts}`
- `apps-games/cloud-observatory/src/{ui,sky,screens,components}/**`
- `apps-games/cloud-observatory/public/fonts/**` (woff2 + `OFL.txt` per family)
- `apps-games/cloud-observatory/test/**`
- `.agents/games/cloud-observatory/{assets-index,product,decisions-log}.md`
- `.agents/resources/2026-10-23/web-games/cloud-observatory/04/README.md` (font sources, sizes, subset command)
- `tasks/epics/21-web-cloud-observatory/STATUS.md` (tick task 04)

## Acceptance Criteria

- Every screen in `product.md` exists and renders in tests; all flows listed above pass.
- Text contrast pairs are at least 4.5:1 (computed in a test); targets are at least 44 px by
  stylesheet; star hit radius at least 24 CSS px.
- Both fonts are bundled with their `OFL.txt`; total woff2 at most 400 KB; no platform font fallback.
- All 33 image slots resolve to either the manifest image or a code placeholder; none shows a
  broken-image state.
- The app builds (`vite build`) and the JS bundle stays under 300 KB gzip (measured and recorded;
  the hard gate is task 08).
- Core purity test still green; no network API used.
- No browser, screenshot or device was used by the agent.

## Verification Commands

- `bun run --filter '@web-games/cloud-observatory*' typecheck`
- `bun run --filter '@web-games/cloud-observatory*' test`
- `bun run --filter '@web-games/cloud-observatory' build`
- `bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core`

## Out of Scope

- Audio, haptics implementations, onboarding flow and motion polish beyond the base transitions
  (task 05).
- Real art images (task 06) and Capacitor projects (task 07).
- Visual QA of any kind by agents; layout judgement is the owner's.
- Changing the kit or dependencies.

## Commit message

`feat(cloud-observatory): add all screens, design tokens, fonts and accessibility [21-web-cloud-observatory/04]`
