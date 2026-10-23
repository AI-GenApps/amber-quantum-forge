---
epic: 20-web-floodplain-dispatch
task: 04-screens-and-ui
status: todo
commit_scope: floodplain-dispatch
depends_on: [20-web-floodplain-dispatch/03-progression-and-save]
estimate: XL
owner: agent
---

# All screens, navigation, design tokens, fonts, accessibility

## Goal

Build every screen in the app on the kit primitives: boot, home, region and level select, the planning board with its Canvas 2D renderer, season playback, result sheet, piece inspector, daily, themes, records, settings, how-to-play shell, credits and the modals. Add the design tokens from the art-bible palette, the seven map themes, the bundled OFL fonts, accessible contrast and hit areas, and named image slots that fall back to tasteful code-drawn placeholders.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/floodplain-dispatch/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** `product.md` (screens, controls, accessibility, palette tokens), `content-plan.md` (themes, pieces, scenery), `assets-index.md` (20 art slots and their fallbacks).
- **Rendering:** DOM for screens, one Canvas 2D element for the board. happy-dom has no canvas, so the board is drawn by pure functions against a small `Draw2D` interface (the subset of `CanvasRenderingContext2D` used). Tests inject a recording fake and assert the draw calls; the real context is passed only in the browser. No screenshot or pixel test exists.
- **Code-drawn visuals** (palette tokens only): height shading by terrain level (lighter = higher) with the top-left light, 2 px ink shoreline around water, water depth by blue ramp (water-light to water-deep) with hatching when high contrast is on, canals as carved grooves, fields as crop rows, scenery cells as simple code trees and rocks, houses with roofs by kind, pump arrow, sluice bars, sandbag stack, reservoir tank, inlet spring, sea waves, badges for supplied, dry, flooded and irrigated with icons and text.
- **Image slots:** `src/art/slots.ts` lists the 20 slot ids; `src/art/manifest.ts` lists which slots have a file in `public/art/` (empty in this task); `<Sprite slot="house-cottage" />` renders the image when listed and the code-drawn fallback otherwise. Task 06 only flips manifest entries.
- **Fonts:** Bricolage Grotesque (display) and Atkinson Hyperlegible (body). Download from `github.com/google/fonts` (`ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf`, `ofl/atkinsonhyperlegible/AtkinsonHyperlegible-Regular.ttf` and `-Bold.ttf`) into the scratch directory, subset to Basic Latin, Latin-1 and the punctuation used (U+2013, U+2014, U+2018 to U+201D, U+2022, U+2026), pin the Bricolage `wdth` and `opsz` axes and keep `wght`, convert to woff2 with an ephemeral tool (for example `uvx --with fonttools --with brotli fonttools subset ...`; no project dependency changes), and place them in `public/fonts/` with the family `OFL.txt` files. Each woff2 at most 120 KB, total at most 300 KB. Record the tool command and file hashes in the evidence README.
- **Accessibility rules** (`product.md`): text contrast at least 4.5:1 and non-text at least 3:1 for every token pair used; hit areas at least 44 x 44 CSS px for every button, tray tool and toggle (`--wg-hit-min: 44px`); the board uses zoom steps (fit, 1.5x, 2x), a keyboard cursor and an ARIA live summary; reduced motion honoured via kit settings; high contrast adds hatching and thicker outlines; colour never the only signal.
- **Navigation:** typed routes through the kit router: `boot`, `home`, `regions`, `levels {region}`, `board {mapId | daily}`, `daily`, `themes`, `records`, `settings`, `howto`, `credits`. Sheets (`result`, `inspector`, `pause`, `hint`, `confirm`) are overlays with back interceptors. Android back closes sheets first, then stops playback, then pops.
- All strings go through the kit `defineStrings` table (`src/strings.ts`), English only.

## Implementation Checklist

- [ ] `src/theme/tokens.ts`: the 14 palette tokens, `neutralTheme` overrides through `applyTheme`, font stacks (`"Atkinson Hyperlegible", sans-serif`, `"Bricolage Grotesque", sans-serif`), spacing, radii, `--wg-hit-min`.
- [ ] `src/theme/mapThemes.ts`: terrain, field, scenery and light palettes for the seven themes (Gouache Meadow, Harvest Ochre, Reed and Mist, Terracotta Dry, Slate Highland, Night Lantern, Paper Blueprint) keyed by core `ThemeDef.id`.
- [ ] Fonts into `public/fonts/` with `OFL.txt`, `registerFonts` at boot, `src/fonts.ts` listing families, and an evidence README `.agents/resources/2026-10-23/web-games/floodplain-dispatch/04/README.md` with the tool, commands, sizes and hashes.
- [ ] `src/board/draw.ts` (pure draw functions for terrain, water, pieces, badges, cursor, ghost hint), `src/board/Board.tsx` (canvas host, resize, zoom steps, pointer painting and tap, keyboard cursor), `src/board/model.ts` (view model from core board plus frames), `src/board/a11y.ts` (text summary).
- [ ] `src/screens/Boot.tsx`: preloads fonts and listed art with `preloadImages` progress, then routes to home.
- [ ] `src/screens/Home.tsx` (Play, Daily with streak, Themes, Records, How to play, Settings), `Regions.tsx` (four cards with stars and lock state), `Levels.tsx` (ten tiles with stars, par, locked state), `Board.tsx` screen (tray with tool buttons showing cost and remaining budget, forecast bar, budget meter, undo, redo, clear, zoom, Run, hint).
- [ ] `src/screens/Playback.tsx` behaviour within the board screen: week counter, 1x 2x 4x speed, pause, scrub bar, live badges, Edit button; reduced motion jumps week to week.
- [ ] `src/sheets/Result.tsx` (stars, headline, score, spend vs par, partials, Next, Retry, Edit, Share through `shareContent`), `Inspector.tsx` (rotate pump, gate weeks with two steppers, remove), `Pause.tsx`, `HintConfirm.tsx`, `Confirm.tsx` (reset, exit).
- [ ] `src/screens/Daily.tsx` (today's map, streak, freezes with buy button, last 14 days), `Themes.tsx` (seven themes, stars needed, apply), `Records.tsx` (best per map, history, totals), `Settings.tsx` (sound, music, haptics, reduced motion, high contrast, reset progress with confirm), `HowTo.tsx` (shell with six empty pages filled by task 05), `Credits.tsx` (fonts, audio and art licences list fed by data files that tasks 05 and 06 extend).
- [ ] `src/art/{slots,manifest}.ts`, `src/art/Sprite.tsx`, and `src/art/fallbacks.ts` code-drawn drawings per slot.
- [ ] `src/App.tsx` router host and `src/main.tsx` wiring (kit styles, theme, fonts, stores, lifecycle back button).
- [ ] Tests (happy-dom, `act` from `preact/test-utils`): every screen renders with the loaded profile and shows the right elements; locked regions and maps cannot be opened; Home to Regions to Levels to Board to Result flow with a scripted placement and run; keyboard-only play of v01 (arrow keys, Enter, Space) reaches a cleared result; undo and redo; hint spends coins and draws a ghost; gate inspector changes weeks; pump rotation; playback speed and scrub; reduced motion path; high-contrast flag changes draw calls (hatching ops present); back button routing; every `<button>` has an accessible name; every interactive element has `min-width` and `min-height` of the hit token (assert the stylesheet rules and the inline sizes of tray tools); `assertNoPlatformFontFallback` on every screen with both families; contrast function test over every text and UI token pair against the thresholds, for all seven themes; no `fetch`, `XMLHttpRequest` or `sendBeacon` usage in `src/` (grep test); draw functions called with a recording context produce the expected call sequences for a small fixture board; `Sprite` falls back when the manifest lacks a slot and renders an `img` when it has one.
- [ ] Update `assets-index.md` (font files actually shipped, sizes) and `decisions-log.md` (any tool or design choice) in this commit.

## Files Touched

- `apps-games/floodplain-dispatch/src/{theme,board,screens,sheets,art}/**`, `src/{App,main,strings,fonts}.ts(x)`
- `apps-games/floodplain-dispatch/public/fonts/*.woff2`, `OFL.txt` files
- `apps-games/floodplain-dispatch/index.html` (theme colour, preload hints only)
- `apps-games/floodplain-dispatch/test/**`
- `.agents/games/floodplain-dispatch/{assets-index,decisions-log}.md`
- `.agents/resources/2026-10-23/web-games/floodplain-dispatch/04/README.md`
- `tasks/epics/20-web-floodplain-dispatch/STATUS.md` (tick task 04)

## Acceptance Criteria

- All 14 screens and sheets listed in `product.md` exist, are reachable by the router, and render from a loaded profile.
- A full campaign map can be planned, run, read and retried by keyboard and by scripted pointer events in tests.
- The contrast test passes for every token pair in all seven themes (text >= 4.5, UI >= 3); hit areas are >= 44 px; no rendered text falls back to a platform font.
- Fonts are bundled as woff2 with `OFL.txt`, within the size budgets, with provenance in the evidence README.
- All 20 art slots have a code-drawn fallback and an empty manifest still renders a complete game.
- No network call exists in `src/`; no source file exceeds 800 lines.

## Verification Commands

- `bun run --filter '@web-games/floodplain-dispatch*' typecheck`
- `bun run --filter '@web-games/floodplain-dispatch*' test`
- `bun run --filter '@web-games/floodplain-dispatch' build`
- `bunx biome check apps-games/floodplain-dispatch apps-games/floodplain-dispatch-core`

## Out of Scope

- Audio, haptics, motion polish and the tutorial (task 05).
- Importing designer art (task 06).
- Native projects (task 07).
- Any browser, screenshot or device check.

## Commit message

`feat(floodplain-dispatch): add all screens, board renderer, design tokens and fonts [20-web-floodplain-dispatch/04]`
