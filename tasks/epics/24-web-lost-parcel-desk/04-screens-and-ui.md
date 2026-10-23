---
epic: 24-web-lost-parcel-desk
task: 04-screens-and-ui
status: pending
commit_scope: lost-parcel-desk
depends_on: [24-web-lost-parcel-desk/03-progression-and-save]
estimate: XL
owner: agent
---

# All screens, navigation, design tokens, fonts, accessibility

## Goal

Build every screen and sheet of `product.md` on the kit primitives: Home, Case files, Case intro, Evidence table, Object viewer (flip and magnifier), Deduction board, Reveal, Town map, Almanac, Ledger, Daily Parcel, Achievements, Records, Desk themes, Settings, How to play and Credits, with the riso design tokens, the bundled OFL fonts, accessible contrast and hit areas, code-drawn visuals in the art-bible palette and named image slots that fall back to tasteful code-drawn placeholders.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/lost-parcel-desk/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** `product.md` (screens, controls, accessibility, palette tokens), `content-plan.md` (themes, town places, almanac, glyph kinds), `assets-index.md` (67 art slots and their fallbacks).
- **Rendering:** DOM for every screen. The town map is one inline SVG built from the place data. Evidence objects, portraits and parcels are `<Sprite slot=... />` components: the image when the manifest lists the slot, else a code-drawn fallback. Drawing helpers are pure functions that return SVG nodes (no canvas), so happy-dom can assert them. No screenshot or pixel test exists.
- **Code-drawn visuals** (palette tokens only): 14 object glyphs (`tin cloth paper card key glove bag box metal wood lens lamp ticket hat`) drawn as flat riso shapes with a 1 to 2 px offset second colour layer for misregistration and a repeating dot pattern for grain; a paper-card component (cream with a hairline `line` border and a slight rotation seeded from the id) for notes, labels and profile cards; a rubber-stamp component (ink in `brick`, rotated, double border, Courier Prime Bold, text supplied by the caller); a corkboard-free pin (mustard-light disc) for pinned clues; a desk surface (cream or night, set by the desk theme) behind the evidence table; a code-drawn initials badge for portraits; a stamp-and-envelope badge for the icon fallback.
- **Image slots:** `src/art/slots.ts` lists the 67 slot ids; `src/art/manifest.ts` lists which slots have a file in `public/art/` (empty in this task); `<Sprite slot="evidence-02-3" />` renders the image when listed and the fallback otherwise. Text on notes, stamps and captions is always rendered by code in Courier Prime; art never carries text. Task 06 only flips manifest entries.
- **Fonts:** Courier Prime (display, clue text, stamps, labels) and IBM Plex Sans (body, UI, profile cards). Download from `github.com/google/fonts` (`ofl/courierprime/CourierPrime-Regular.ttf`, `CourierPrime-Bold.ttf`, `ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf` and the two `OFL.txt` files) into the scratch directory, subset to Basic Latin, Latin-1 and the punctuation used (U+2013, U+2014, U+2018 to U+201D, U+2022, U+2026), pin the Plex `wdth` axis and keep `wght`, convert to woff2 with an ephemeral tool (for example `uvx --with fonttools --with brotli fonttools subset ...`; no project dependency changes), and place them in `public/fonts/` with the family `OFL.txt` files. Each woff2 at most 120 KB, total at most 300 KB. Record the tool command and file hashes in the evidence README.
- **Accessibility rules** (`product.md`): text contrast at least 4.5:1 and non-text at least 3:1 for every token pair used (teal is never a text colour); hit areas at least 44 x 44 CSS px for every button, tray chip, toggle and link-menu item (`--wg-hit-min: 44px`), hotspots 48 px; every evidence face has a text equivalent in the DOM; an ARIA live region summarises the board; link states use icons and words, not colour alone; reduced motion honoured via kit settings; high contrast adds thicker outlines and pattern hatching on linked cards.
- **Navigation:** typed routes through the kit router: `boot`, `home`, `files`, `intro {caseId | daily}`, `table {caseId | daily}`, `viewer {caseId | daily, objectId}`, `board {caseId | daily}`, `reveal {caseId | daily}`, `map`, `almanac {tab}`, `ledger`, `daily`, `achievements`, `records`, `themes`, `settings`, `howto`, `credits`. Sheets (`accuse`, `hint`, `wrong`, `pause`, `confirm`, `chapter`, `card`) are overlays with back interceptors. Android back closes sheets first, then leaves the viewer, then the board, then pops.
- All strings go through the kit `defineStrings` table (`src/strings.ts`), English only.

## Implementation Checklist

- [ ] `src/theme/tokens.ts`: the 13 palette tokens, `applyTheme` overrides, font stacks (`"IBM Plex Sans", system-ui, sans-serif`, `"Courier Prime", "Courier New", monospace`), spacing, radii, `--wg-hit-min`; `src/theme/deskThemes.ts`: palettes for the 5 desk themes keyed by core theme id (Mustard Riso, Teal Blotter, Brick Ledger, Midnight Sorting Room, Gold Rubber Stamp), each pair checked by the contrast test.
- [ ] Fonts into `public/fonts/` with `OFL.txt`, `registerFonts` at boot, `src/fonts.ts` listing the families, and the evidence README `.agents/resources/2026-10-23/web-games/lost-parcel-desk/04/README.md` with the tool, commands, sizes and hashes.
- [ ] `src/ui/` components: `PaperCard`, `RubberStamp`, `Pin`, `ClueChip` (tag, state: found, pinned, linked), `ProfileCard` (portrait slot, name, trade, four fact lines, link buttons, returned state), `LinkMenu` (Fits, Rules out, Remove link), `StampRow` (1 to 3 stamps), `PostageCounter`, `Typewriter` (types the reveal; instant under reduced motion), `Glyph` (the 14 drawings), `Sprite`.
- [ ] `src/screens/Boot.tsx` (preloads fonts and listed art with `preloadImages` progress, then routes to home), `Home.tsx` (desk scene, Continue or Case files, Daily Parcel with streak, Town map, Almanac, Achievements, Settings), `Files.tsx` (12 folders by chapter with lock state, best stamps, chapter intro and outro sheets), `Intro.tsx` (closed parcel, torn label, found-at line, Open parcel), `Table.tsx` (4 or 5 objects laid out on the desk, clue tray count, Board button, hint), `Viewer.tsx` (flip button and swipe, magnifier toggle with 48 px hotspot discs, the object's clue list, previous and next, Pin buttons), `Board.tsx` (pinned clues, 3 profile cards, link menu, hint, Accuse with confirm), `Reveal.tsx` (accusation result, typed reveal, falling stamp, ledger fragment card, Next, Replay, Share through `shareContent`).
- [ ] `src/screens/Map.tsx` (SVG town map: streets, 12 places filled or outlined by case state, tap a place for its case), `Almanac.tsx` (tabs Clues and Townsfolk; 24 clue entries from the content, 12 profiles, unlocked when met; every clue tag on the board and viewer links to its entry), `Ledger.tsx`, `Daily.tsx` (today's case, streak, freezes with a buy button, last 14 days), `Achievements.tsx`, `Records.tsx`, `Themes.tsx` (5 themes, stamps needed, apply), `Settings.tsx` (sound, music, haptics, reduced motion, high contrast, reset progress with confirm), `HowTo.tsx` (shell with six empty pages filled by task 05), `Credits.tsx` (fonts, audio and art licence lists fed by data files that tasks 05 and 06 extend).
- [ ] `src/sheets/` for `AccuseConfirm`, `HintConfirm` (shows the price and the postage left), `WrongNote` ("Return to sender" stamp and the `explainWrong` line), `Pause`, `Confirm` (reset, exit), `ChapterSheet`, `CardSheet` (mechanic cards, used by task 05), `AchievementToast`.
- [ ] `src/art/{slots,manifest,fallbacks}.ts` and `Sprite.tsx` with one code-drawn fallback per slot kind (49 evidence objects through their `glyph`, 12 portraits through initials, 2 parcels, desk backdrop, key art, icon).
- [ ] `src/App.tsx` router host and `src/main.tsx` wiring (kit styles, theme, fonts, stores, lifecycle back button, game store from task 03).
- [ ] Tests (happy-dom, `act` from `preact/test-utils`): every screen renders with a loaded profile and shows the right elements; locked chapters and cases cannot be opened; Home to Files to Intro to Table to Viewer to Board to Reveal flow with scripted taps on case 01; keyboard-only play of case 01 (Tab, arrows, F, M, P, L, A) reaches a 3-stamp reveal; a wrong accusation shows the note and costs a stamp; two wrong accusations deliver by elimination with 1 stamp; flip shows the back clue; the magnifier shows hotspots only when on and a hotspot tap finds a zoom clue; pin, unpin, link, rule-out and remove-link; the Accuse button explains the two-witness rule at 0 and 1 fits; a hint spends postage, pins the clues and draws the links; a pair is bracketed when both clues are linked; the reduced-motion path swaps faces and shows the reveal at once; high contrast changes the card classes and outlines; back-button routing; every `<button>` has an accessible name; every interactive element has `min-width` and `min-height` of the hit token (assert the stylesheet rules and inline sizes of chips and hotspots); `assertNoPlatformFontFallback` on every screen with both families; a contrast function test over every text and UI token pair against the thresholds, for all 5 desk themes; every evidence face has a text equivalent; no `fetch`, `XMLHttpRequest` or `sendBeacon` usage in `src/` (grep test); `Sprite` falls back when the manifest lacks a slot and renders an `img` when it has one; all 14 glyphs render distinct SVG output.
- [ ] Update `assets-index.md` (font files actually shipped, sizes) and `decisions-log.md` (any tool or design choice) in this commit.

## Files Touched

- `apps-games/lost-parcel-desk/src/{theme,ui,screens,sheets,art}/**`, `src/{App,main,strings,fonts}.ts(x)`
- `apps-games/lost-parcel-desk/public/fonts/*.woff2`, `OFL.txt` files
- `apps-games/lost-parcel-desk/index.html` (theme colour, preload hints only)
- `apps-games/lost-parcel-desk/test/**`
- `.agents/games/lost-parcel-desk/{assets-index,decisions-log}.md`
- `.agents/resources/2026-10-23/web-games/lost-parcel-desk/04/README.md`
- `tasks/epics/24-web-lost-parcel-desk/STATUS.md` (tick task 04)

## Acceptance Criteria

- All 18 screens listed in `product.md`, the sheets (accuse, hint, wrong note, pause, confirm, chapter, card) and the achievement toast exist, are reachable by the router, and render from a loaded profile.
- A full campaign case (case 01) can be inspected, pinned, linked, accused and revealed by keyboard and by scripted pointer events in tests, including the wrong-accusation and elimination paths.
- The contrast test passes for every token pair in all 5 desk themes (text >= 4.5, UI >= 3); hit areas are >= 44 px (hotspots 48); no rendered text falls back to a platform font.
- Fonts are bundled as woff2 with `OFL.txt`, within the size budgets, with provenance in the evidence README.
- All 67 art slots have a code-drawn fallback and an empty manifest still renders a complete game.
- No network call exists in `src/`; no source file exceeds 800 lines.

## Verification Commands

- `bun run --filter '@web-games/lost-parcel-desk*' typecheck`
- `bun run --filter '@web-games/lost-parcel-desk*' test`
- `bun run --filter '@web-games/lost-parcel-desk' build`
- `bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core`

## Out of Scope

- Audio, haptics, motion polish, the tutorial and the how-to text (task 05).
- Importing designer art (task 06).
- Native projects (task 07).
- Any browser, screenshot or device check.

## Commit message

`feat(lost-parcel-desk): add all screens, evidence viewer, deduction board, design tokens and fonts [24-web-lost-parcel-desk/04]`
