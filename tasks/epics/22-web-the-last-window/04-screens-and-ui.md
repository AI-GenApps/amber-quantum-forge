---
epic: 22-web-the-last-window
task: 04-screens-and-ui
status: todo
commit_scope: the-last-window
depends_on: [22-web-the-last-window/03-progression-and-save]
estimate: XL
owner: agent
---

# All screens, navigation, design tokens, fonts, accessibility

## Goal

Build every screen and sheet of the game with the kit primitives: title, home, day intro, stock plan, the shift screen (interior, three seats, drink, pastry and book stations, tray, clock, pause), shift result, story scene with choices and endings, decor shop, journal, recipe book, Late Shift lobby, settings, how to play and credits. Add the design tokens in the art-bible palette, the two OFL fonts, accessible contrast and hit areas, code-drawn visuals, and named image slots that fall back to tasteful code-drawn placeholders.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/the-last-window/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** `product.md` (screens, controls, accessibility, palette tokens, Day 1 tutorial left to task 05), `content-plan.md` (texts, walk-in types), `assets-index.md` (54 art slots, fonts).
- **Rendering:** DOM and CSS for screens and the interior; SVG for code-drawn busts, items, decor and interior fallbacks (pure functions from a palette and an expression to an SVG element tree, testable in happy-dom). No canvas is needed. No screenshot or pixel test exists.
- **Shift loop in the app:** `src/shift/Runner.ts` owns the engine state, a time accumulator and an injected scheduler (`requestAnimationFrame` in the browser, a manual scheduler in tests). It calls `tickShift` once per 100 ms of accumulated time, caps catch-up at 5 ticks per frame, pauses when the document is hidden or the pause sheet is open, and exposes a `useShift` hook. Tests drive it with a fake scheduler.
- **Image slots:** `src/art/slots.ts` lists the 54 slot ids (re-exported from the core list), `src/art/manifest.ts` lists which slots have a file in `public/art/` (empty in this task), and `<Portrait slot="customer-1" mood="happy" />`, `<ItemIcon slot="drink-2" />`, `<Backdrop slot="interior-rain" />` render the image when listed and the code-drawn fallback otherwise. Task 06 only flips manifest entries.
- **Fonts:** Young Serif (display, single weight 400) and Nunito Sans (body, variable `wght` 400 to 800). Download from `github.com/google/fonts` (`ofl/youngserif/YoungSerif-Regular.ttf`, `ofl/nunitosans/NunitoSans[YTLC,opsz,wdth,wght].ttf`, plus both `OFL.txt`) into `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/the-last-window/`, subset to Basic Latin, Latin-1 and the punctuation used (U+2013, U+2014, U+2018 to U+201D, U+2022, U+2026), pin the Nunito Sans `opsz` and `wdth` axes and keep `wght`, convert to woff2 with an ephemeral tool (for example `uvx --with fonttools --with brotli fonttools subset ...`; no project dependency changes), and place them in `public/fonts/` with the `OFL.txt` files. Each woff2 at most 120 KB, total at most 300 KB. Record the tool command and file hashes in the evidence README. Set `font-synthesis: none` so Young Serif is never faux-bolded.
- **Accessibility rules** (`product.md`): text contrast at least 4.5:1 and non-text at least 3:1 for every token pair used (also in high-contrast mode where text must reach 7:1); hit areas at least 44 x 44 CSS px for every button, step key, seat and toggle (`--wg-hit-min: 44px`); colour never the only signal (patience bar has a number under 10 s; mood tags are icon plus word); reduced motion honoured through the kit settings; `aria-live` announcements for arrivals, warnings and tips; text size setting 100 or 125 percent.
- **Navigation:** typed routes through the kit router: `title`, `home`, `day`, `prep`, `shift`, `result`, `scene`, `shop`, `journal`, `recipes`, `late`, `settings`, `howto`, `credits`. Sheets (`pause`, `quit`, `purchase`, `serveEmpty`, `reset`) are overlays with back interceptors. Android back closes sheets first, then pauses the shift, then pops. Use a `type` alias for the route map (an `interface extends Record` widens the keys).
- All strings go through the kit `defineStrings` table (`src/strings.ts`) plus the content strings from task 02, English only.

## Implementation Checklist

- [ ] `src/theme/tokens.ts`: the 12 palette tokens from `product.md`, the high-contrast variant, `applyTheme` mapping onto the kit tokens, font stacks (`"Nunito Sans", sans-serif` body and `"Young Serif", serif` display), spacing, radii, `--wg-hit-min`.
- [ ] Fonts into `public/fonts/` with `OFL.txt`, `registerFonts` at boot, `src/fonts.ts`, and the evidence README `.agents/resources/2026-10-23/web-games/the-last-window/04/README.md` with tool, commands, sizes and hashes.
- [ ] `src/art/{slots,manifest}.ts`, `src/art/{Portrait,ItemIcon,Backdrop}.tsx`, and `src/art/fallbacks/` with code-drawn SVG: 8 regular busts x 3 expressions (hair, outfit colour and accessory per the look in `content-plan.md`, same proportions), 6 walk-in silhouettes x 3 expressions, 16 item icons, 8 decor objects, and 3 interiors (morning, evening, rain with arched window, counter in the lower third, shelves, lamp glow, rain streaks that stop under reduced motion).
- [ ] `src/shift/Runner.ts`, `src/shift/useShift.ts`; `src/screens/Shift/` split into `Seats.tsx`, `DrinkStation.tsx`, `PastryStation.tsx`, `BookShelf.tsx`, `Tray.tsx`, `Hud.tsx` (clock, coins, patience bars with number under 10 s), `Ticket.tsx` (active order with mood chip), keyboard bindings (`1 2 3`, `Space`, `Escape`).
- [ ] `src/screens/Title.tsx` (key-art backdrop slot, tap to begin, loads the save, preloads fonts and listed art with `preloadImages` progress), `Home.tsx` (Continue Day N, Late Shift once open, Journal, Shop, Recipes, Settings, How to play, Credits), `Day.tsx` (title, weather art, regulars due with portraits), `Prep.tsx` (pastry kinds and book selection with shelf slots, stock cost, Suggest, Open shop), `Result.tsx` (earnings table, stars via `StarRating`, hearts with level-ups, scenes queued, Share), `Scene.tsx` (bust with expression per beat, speaker, text, tap or Enter to advance, choice buttons, ending title card, Journal save), `Shop.tsx` (interior preview with weather toggle, eight items with price, effect and lock state, purchase sheet), `Journal.tsx` (kit `Tabs`: Stories with ending titles and scene replay, Shop Diary), `Recipes.tsx`, `Late.tsx` (today's Late Shifts, streak, records, Lamp Bonus state), `Settings.tsx` (sound, music, haptics, reduced motion, high contrast, recipe guide, relaxed mode, text size, reset progress with confirm), `HowTo.tsx` (shell with six pages filled by task 05), `Credits.tsx` (fonts, audio and art licence lists fed by data files that tasks 05 and 06 extend), plus the Lantern Night finale cards on the Day 14 result.
- [ ] `src/sheets/{Pause,Quit,Purchase,ServeEmpty,Reset}.tsx`.
- [ ] `src/App.tsx` router host and `src/main.tsx` wiring (kit styles, theme, fonts, stores, lifecycle back button, `setupDisplay`).
- [ ] Tests (happy-dom, `act` from `preact/test-utils`): every screen renders from a loaded profile with the right elements; locked items cannot be opened; Home to Day to Prep to Shift to Result to Scene to Home flow with a scripted Day 1 using the fake scheduler; keyboard-only serving of one order; wrong step empties the cup in the UI; book pick and serve; patience bar reaches zero and the customer leaves; pause stops the clock; scene shows guarded beats and ending; purchase flow and insufficient coins; Late Shift button hidden before Day 14 and visible after; settings change tokens (high contrast, text size) and relaxed mode reaches the engine; back button routing; every `<button>` has an accessible name; every interactive element meets the hit token (assert stylesheet rules and inline sizes); `assertNoPlatformFontFallback` on every screen and sheet with both families; contrast test over every text and UI token pair (normal and high contrast); no `fetch`, `XMLHttpRequest` or `sendBeacon` in `src/` (grep test); fallback `Portrait` renders for all 8 regulars x 3 expressions and 6 walk-ins; an `img` is rendered when the manifest lists a slot; an empty manifest still renders a complete game.
- [ ] Update `assets-index.md` (font files actually shipped, sizes) and `decisions-log.md` (any tool or design choice) in this commit.

## Files Touched

- `apps-games/the-last-window/src/{theme,art,shift,screens,sheets}/**`, `src/{App,main,strings,fonts}.ts(x)`, `src/styles.css`
- `apps-games/the-last-window/public/fonts/**` (woff2 and `OFL.txt` files)
- `apps-games/the-last-window/index.html` (theme colour, preload hints only)
- `apps-games/the-last-window/test/**`
- `.agents/games/the-last-window/{assets-index,decisions-log}.md`
- `.agents/resources/2026-10-23/web-games/the-last-window/04/README.md`
- `tasks/epics/22-web-the-last-window/STATUS.md` (tick task 04)

## Acceptance Criteria

- All 14 routes and 5 sheets listed in `product.md` and this task exist, are reachable by the router, and render from a loaded profile.
- A Day 1 shift can be played, scored and followed by its evening scenes by keyboard and by scripted pointer events in tests.
- The contrast test passes for every token pair (text >= 4.5, UI >= 3, high contrast text >= 7); hit areas are >= 44 px; no rendered text falls back to a platform font.
- Fonts are bundled as woff2 with `OFL.txt`, within the size budgets, with provenance in the evidence README.
- All 54 art slots have a code-drawn fallback and an empty manifest still renders a complete game.
- No network call exists in `src/`; no source file exceeds 800 lines.

## Verification Commands

- `bun run --filter '@web-games/the-last-window*' typecheck`
- `bun run --filter '@web-games/the-last-window*' test`
- `bun run --filter '@web-games/the-last-window' build`
- `bunx biome check apps-games/the-last-window apps-games/the-last-window-core`

## Out of Scope

- Audio, haptics, the guided tutorial, first-time cards and final how-to text (task 05).
- Real designer art (task 06) and native projects (task 07).
- Visual QA of any kind (the owner does it in a browser).

## Commit message

`feat(the-last-window): add all screens, design tokens, fonts and accessibility [22-web-the-last-window/04]`
