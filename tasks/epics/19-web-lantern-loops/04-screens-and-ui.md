---
epic: 19-web-lantern-loops
task: 04-screens-and-ui
status: in-progress
commit_scope: lantern-loops
depends_on: [19-web-lantern-loops/03-progression-and-save]
estimate: XL
owner: agent
---

# All screens, navigation, design tokens, fonts, accessibility

## Goal

Build the complete UI of Lantern Loops with the kit primitives: the 13 screens in `product.md`, the
SVG puzzle board (tiles, loops, lanterns, stones, mirrors, gates, anchors, conflicts) drawn by code in
the art-bible palette, typed navigation, the design tokens, the bundled Fraunces and Nunito fonts,
accessible contrast and hit areas, and named image slots that fall back to tasteful code-drawn
placeholders. After this task the game is fully playable end to end in a browser (the owner verifies
that later); agents verify it with component and interaction tests only.

## Context / Decisions

- Screens (`product.md`): Boot, Home, Chapters, Puzzle list, Puzzle, Win sheet, Daily, Archive,
  Statistics, Settings, How to play (content in task 05), Onboarding (flow in task 05, a shell here),
  About and licences. Overlays: pause sheet, restart confirm, hint confirm, chapter-unlocked
  celebration, coach card, toast.
- Navigation: kit `createRouter` with a typed `Routes` map (`boot`, `home`, `chapters`,
  `puzzleList{chapter}`, `puzzle{id}` for campaign, tutorial and daily keys, `daily`, `archive`, `stats`,
  `settings`, `howto{page}`, `about`); Android back button via the kit lifecycle `onBack`; sheets use
  `useBackInterceptor`.
- State: small store modules in `src/state/` with a subscribe hook; services from task 03; no extra
  libraries (no signals, no router lib).
- Fonts: Fraunces (display) and Nunito (body), OFL, from github.com/google/fonts (`ofl/fraunces`,
  `ofl/nunito`), subset to Latin and converted to woff2 under `public/fonts/` with `OFL.txt` for each;
  each file <= 120 KB. Convert with fonttools (`pyftsubset`, `--flavor=woff2`) installed in a venv under
  `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/lantern-loops/`; delete downloads when done. Register
  with the kit `registerFonts`; the CSS font stacks name only these families (final fallback `serif` /
  `sans-serif` is allowed only after the bundled family loads, and the kit helper test must pass).
- Palette (art bible, `content-plan.md` section 7): indigo `#12132E` / `#1E2050`, teal `#0E5A5F`, paper
  cream `#F6EAD3`, ink `#241B2F`, lantern colours amber `#F2A33A`, rose `#E9657F`, jade `#3FBF98`, azure
  `#4EA6EA`, violet `#9A7DE3`, unlit `#5C6385`. Adjust a hex only to meet contrast and update
  `content-plan.md` in the same commit.
- Lantern glyphs: circle, diamond, triangle, square, star; colour is never the only cue; high-contrast
  setting thickens outlines and adds glyphs to tiles.
- Image slots: `src/art/slots.ts` lists the 15 slot ids (`assets-index.md`) with file name, display size and
  a fallback component. Files are discovered with `import.meta.glob("./files/*.webp", { eager: true,
  query: "?url" })` so a missing file simply renders the fallback and task 06 adds files without code
  changes. Fallbacks: backdrops are layered paper-cut SVG scenes per chapter; lanterns are SVG lanterns;
  medallion and empty-archive are SVG drawings.
- Hit areas: all buttons, toggles, tabs >= 44 x 44 css px (token `--ll-hit: 44px` applied through the kit
  components and our CSS); board cell size from a pure `layoutBoard(viewportW, viewportH, n)` with a floor
  of 36 px and fits a 340 px wide viewport for n = 9. happy-dom has no layout engine, so assert the pure
  function and the stylesheet text.
- Board input: pointer events (`pointerdown/move/up/cancel`) with `touch-action: none`; drag maps to core
  `dragPath`; tap to `tapCell` with the current brush; long-press 500 ms erases; keyboard map in
  `product.md`; per-cell `aria-label`; polite live region for conflicts and the win.
- Text: all copy in a `defineStrings` table (`src/strings.ts`, English); no hard-coded copy in components.

## Implementation Checklist

- [x] Fonts downloaded, subset, converted, committed with `OFL.txt`; provenance (source URL, commit,
      SHA-256, subset command, sizes) recorded in `assets-index.md` and
      `.agents/resources/2026-10-23/web-games/lantern-loops/04/README.md`.
- [x] `src/theme/tokens.ts`: `ThemeTokens` values for dark UI, high-contrast variant, `applyTheme` at boot;
      `src/theme/palette.ts` exports the lantern colours and glyph map; `src/theme/styles.ts` game CSS.
- [x] `src/board/layout.ts` (`layoutBoard`), `src/board/BoardView.tsx` (SVG), `TileShape.tsx`,
      `LanternGlyph.tsx`, `StoneGlyph.tsx`, `MirrorGlyph.tsx`, `GateGlyph.tsx`, `ConflictLayer.tsx`,
      `useBoardInput.ts` (pointer + keyboard), `src/board/winSequence.ts` (pure timeline; reduced motion
      skips it).
- [x] `src/art/slots.ts`, `ArtImage.tsx`, `src/art/fallbacks/*.tsx` (4 backdrops, lantern, medallion,
      empty-archive, key-art scene).
- [x] `src/screens/{Boot,Home,Chapters,PuzzleList,Puzzle,Daily,Archive,Stats,Settings,About,HowTo,Onboarding}.tsx`
      plus `src/overlays/{WinSheet,PauseSheet,ConfirmSheet,HintSheet,UnlockCelebration,CoachCard}.tsx`.
- [x] Puzzle screen wiring: core history (undo/redo), brush switch persisted in the profile, hint flow
      (confirm, spend token, apply, lock), restart confirm, autosave to the runs store every move and on
      lifecycle pause, timer pauses when hidden, win flow calls the task 03 services and opens the win sheet
      with stars, time, tokens earned, events (freeze used, milestone, chapter unlocked).
- [x] Home daily card (tier name, streak flame, freeze, solved tick), Daily screen (medallion, mechanics
      strip), Archive tabs (To play, Completed with empty-archive art), Statistics (bars drawn in SVG), Settings
      (kit toggles plus showTimer, showConflicts, hidePathInShare, replay tutorial, reset progress with a
      two-step confirm).
- [x] `src/App.tsx` router outlet with transitions; `src/main.tsx` boots fonts, theme, services, lifecycle.
- [x] `src/strings.ts` with all copy; `src/a11y/` helpers (cell labels, live region).

## Files Touched

- `apps-games/lantern-loops/src/**` (theme, board, art, screens, overlays, state, strings, a11y),
  `index.html` (theme-color, font preload links), `public/fonts/**` (woff2 + `OFL.txt`)
- `apps-games/lantern-loops/test/**` (component, interaction, tokens, layout, fonts, strings tests)
- `.agents/games/lantern-loops/{assets-index,product,decisions-log}.md`,
  `.agents/resources/2026-10-23/web-games/lantern-loops/04/**`

## Acceptance Criteria

- [x] Every screen and overlay has a render test with seeded profile fixtures (fresh, mid-game with locked
      chapters, finished) asserting key text, roles and navigation targets; chapter cards show locked
      state and "N stars to go" with the 45/120/210 thresholds.
- [x] Board tests: renders a fixture for each mechanic (stone numbers, both mirror slashes, gates with
      glyphs, anchors with tacks, five lantern colours); a simulated pointer drag across cells produces the
      expected tiles; tap cycles follow the brush; long-press erases; stones, anchors and hint-locked cells
      ignore input; keyboard play solves a 5x5 fixture without a pointer; conflict markers appear and clear
      per `product.md`; solving a fixture opens the win sheet with the right star count.
- [x] Contrast test: text/background token pairs >= 4.5:1 and graphical pairs (tile ribbon, glyphs, unlit
      lantern) >= 3:1 in both default and high-contrast themes; prints the table.
- [x] Hit-area test: `layoutBoard` gives cell >= 36 px for n = 5..9 at 340x640, 360x740, 390x844 and
      >= 44 px for n <= 7 at 390 wide; stylesheet contains `min-height: var(--ll-hit)` for controls and
      `--ll-hit` equals 44px.
- [x] Font test: for every screen render, the kit `assertNoPlatformFontFallback` passes with families
      Fraunces and Nunito; woff2 files exist, are <= 120 KB, and each has an `OFL.txt`.
- [x] Art slot test: all 15 slot ids resolve to either a file URL or a fallback; with no files present
      every screen still renders; fallbacks contain no `<text>` outside the bundled families.
- [x] Reduced motion: with the setting on, no WAAPI animation is started by the win sequence or screen
      transitions (assert on the kit motion mock).
- [x] Strings: no component contains a hard-coded user-facing literal (test scans `src/screens` and
      `src/overlays` for JSX text nodes outside the string table, allowing glyphs and numbers).
- [x] Android back: with a sheet open it closes the sheet; on a screen it pops; on Home it asks to exit
      (router and lifecycle mocks).
- [x] All verification commands below pass; no file over 800 lines.

## Verification Commands

```
bun run --filter '@web-games/lantern-loops*' typecheck
bun run --filter '@web-games/lantern-loops*' test
bun run --filter '@web-games/lantern-loops' build
bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core
```

## Out of Scope

Audio and haptics hooks, motion polish beyond the win sequence and transitions, the onboarding flow
logic and how-to-play page content (task 05), image art (task 06), Capacitor platform projects (07),
any browser, screenshot or device check.

## Commit message

`feat(lantern-loops): all screens, board, design tokens and fonts [19-web-lantern-loops/04]`
