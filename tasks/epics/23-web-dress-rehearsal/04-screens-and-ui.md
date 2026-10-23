---
epic: 23-web-dress-rehearsal
task: 04-screens-and-ui
status: in-progress
commit_scope: dress-rehearsal
depends_on: [23-web-dress-rehearsal/03-progression-and-save]
estimate: XL
owner: agent
---

# All screens, navigation, design tokens, fonts, accessibility

## Goal

Build every screen and sheet of the game on the kit primitives: the flat-lay styling board with drag, tap and keyboard play, the closet tray, rule chips, harmony meter, result and export sheets, the image export renderer, the design tokens in the art-bible palette, the Playfair Display and DM Sans fonts, accessible contrast and hit areas, code-drawn visuals and named image slots that fall back to tasteful code-drawn placeholders.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/dress-rehearsal/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** `product.md` (screens, controls, accessibility, palette tokens, export), `content-plan.md` (chapters, pieces, strings), `assets-index.md` (63 art slots and their fallbacks, scale rules).
- **Rendering:** DOM for screens and for the board (slots and pieces are DOM elements so pointer events, focus and ARIA work in happy-dom). The export image is the only canvas: pure draw functions against a small `Draw2D` interface (the subset of `CanvasRenderingContext2D` used). happy-dom has no canvas, so tests inject a recording fake and assert the draw calls; the real context is passed only in the browser. No screenshot or pixel test exists.
- **Code-drawn visuals** (palette tokens only): one garment glyph drawer per category (top, bottom, dress, outer, shoes, bag, hat, accessory) filled with the piece's colour tag and outlined in ink, drawn as SVG on the board and tray and as canvas in the export; a client initial badge in the chapter accent; a linen board surface with paper grain; frames (Plain, Paper Border, Polaroid, Magazine Cover) as draw functions.
- **Image slots:** `src/art/slots.ts` lists the 63 slot ids; `src/art/manifest.ts` lists which slots have a file in `public/art/` (empty in this task); `<Sprite slot="item-riviera-1" />` renders the image when listed and the code-drawn fallback otherwise. Task 06 only flips manifest entries.
- **Fonts:** Playfair Display (display) and DM Sans (body). Download from `github.com/google/fonts` (`ofl/playfairdisplay/PlayfairDisplay[wght].ttf`, `PlayfairDisplay-Italic[wght].ttf`, `ofl/dmsans/DMSans[opsz,wght].ttf`) into `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/dress-rehearsal/`, subset to Basic Latin, Latin-1 and the punctuation used (U+2013, U+2014, U+2018 to U+201D, U+2022, U+2026), pin the DM Sans `opsz` axis at 14 and keep `wght`, convert to woff2 with an ephemeral tool (for example `uvx --with fonttools --with brotli fonttools subset ...`; no project dependency changes), and place them in `public/fonts/` with the family `OFL.txt` files. Each woff2 at most 120 KB, total at most 300 KB. Record the tool command and file hashes in the evidence README. Italic is registered with `style: "italic"` for client lines.
- **Accessibility rules** (`product.md`): text contrast at least 4.5:1 and non-text at least 3:1 for every token pair used (including the six chapter accents on paper and linen); hit areas at least 44 x 44 CSS px (`--wg-hit-min: 44px`) and board slots at least 88 x 88 at 360 px width; colour never the only signal (rule chips carry icons and text, swatches carry names, high contrast adds hatching and thicker outlines); drag never required; reduced motion honoured through kit settings; an ARIA live region announces placements, rule changes and results.
- **Navigation:** typed routes through the kit router: `boot`, `home`, `chapters`, `challenges {chapter}`, `styling {challengeId | daily}`, `daily`, `closet`, `clients`, `gallery`, `settings`, `howto`, `credits`. Sheets (`brief`, `result`, `export`, `pause`, `hint`, `confirm`) are overlays with back interceptors. Android back closes sheets first, then asks to leave a started look, then pops.
- All strings go through the kit `defineStrings` table (`src/strings.ts`), English only, using the core content strings from task 02.

## Implementation Checklist

- [x] `src/theme/tokens.ts`: the 14 palette tokens, the six chapter accents, `applyTheme` overrides, font stacks (`"DM Sans", sans-serif`, `"Playfair Display", serif`), spacing, radii, `--wg-hit-min`; `src/theme/contrast.ts` (WCAG ratio function used by tests).
- [x] Fonts into `public/fonts/` with `OFL.txt`, `registerFonts` at boot, `src/fonts.ts` listing families, and the evidence README `.agents/resources/2026-10-23/web-games/dress-rehearsal/04/README.md` with the tool, commands, sizes and hashes.
- [x] `src/board/model.ts` (view model from core look, challenge and unlocked pieces), `src/board/Board.tsx` (slot grid for sets A to G with the dress slot spanning top and bottom, pointer drag, tap-to-place, remove, swap), `src/board/Tray.tsx` (eight category tabs, piece cards with name, colour swatch and tag icons), `src/board/RuleChips.tsx` (met and unmet with icon and detail text), `src/board/HarmonyMeter.tsx` (0 to 100 with the five named parts), `src/board/keyboard.ts` (Tab, arrows, Enter, Backspace, Ctrl+Z, Ctrl+Y, Space), `src/board/a11y.ts` (live announcements), `src/board/history.ts` (undo and redo stack).
- [x] `src/glyphs/*.ts(x)`: the eight garment glyph drawers (SVG components and canvas versions), the client badge, the linen surface.
- [x] `src/export/render.ts` (pure `renderBoard(draw, look, challenge, frame, size)` to a `Draw2D`), `src/export/frames.ts` (four frames), `src/export/share.ts` (PNG blob via `canvas.toBlob`, Web Share with files, download link, text via kit `shareContent`; every failure handled).
- [x] `src/screens/Boot.tsx` (fonts and listed art with progress, then home), `Home.tsx` (Play, Daily Fitting with streak, Closet, Clients, Gallery, How to play, Settings), `Chapters.tsx` (six cards with stars, lock and stars needed), `Challenges.tsx` (tiles with client avatar, best stars, locked state), `Styling.tsx` (board, tray, chips, meter, undo, redo, clear, hint, Finish look), `Daily.tsx` (today's challenge, streak, freezes with buy button, last 14 days), `Closet.tsx` (48 pieces by theme, tags, locked silhouettes), `Clients.tsx` (six cards, affinity, unlocked lines), `Gallery.tsx` (24 slots, share, delete), `Settings.tsx` (sound, music, haptics, reduced motion, high contrast, reset progress with confirm), `HowTo.tsx` (shell with six empty pages filled by task 05), `Credits.tsx` (fonts, audio and art licence lists fed by data files that tasks 05 and 06 extend).
- [x] `src/sheets/Brief.tsx`, `Result.tsx` (stars with 120 ms stagger placeholder, rule breakdown, harmony breakdown, client reaction line, Save to gallery, Export, Next, Retry, Edit), `Export.tsx` (frame picker with prices, preview, Share), `Pause.tsx`, `HintConfirm.tsx`, `Confirm.tsx`.
- [x] `src/art/{slots,manifest}.ts`, `src/art/Sprite.tsx`, `src/art/fallbacks.ts` (code-drawn drawings per slot).
- [x] `src/App.tsx` router host and `src/main.tsx` wiring (kit styles, theme, fonts, stores, lifecycle back button).
- [x] Tests (happy-dom, `act` from `preact/test-utils`): every screen renders from a loaded profile and shows the right elements; locked chapters and challenges cannot be opened; Home to Chapters to Challenges to Brief to Styling to Result flow with scripted placements for `riv-01`; scripted pointer drag and drop, tap-to-place and keyboard-only play of `riv-01` all reach a three-star result; wrong-category drop is refused; one-piece rule clears pieces on `riv-03`; swap, remove, undo, redo, clear; live rule chips and harmony update after every placement; hint spends coins and highlights one piece; Finish look disabled until complete; result sheet shows the right stars and client line; gallery save, full gallery, delete; export draw-call sequence for a small fixture look in each of the four frames and the locked-frame purchase; daily screen with streak and freeze purchase; closet silhouettes for locked themes; back-button routing; every `<button>` has an accessible name; every interactive element has `min-width` and `min-height` of the hit token (assert the stylesheet rules and inline sizes); `assertNoPlatformFontFallback` on every screen with both families; contrast function test over every text and UI token pair, including the six accents on paper and linen; reduced motion and high contrast flags change the output; no `fetch`, `XMLHttpRequest` or `sendBeacon` in `src/` (grep test); `Sprite` falls back when the manifest lacks a slot and renders an `img` when it has one.
- [x] Update `assets-index.md` (font files actually shipped, sizes) and `decisions-log.md` (any tool or design choice) in this commit.

## Files Touched

- `apps-games/dress-rehearsal/src/{theme,board,glyphs,export,screens,sheets,art}/**`, `src/{App,main,strings,fonts}.ts(x)`
- `apps-games/dress-rehearsal/public/fonts/**` (woff2 and `OFL.txt` files)
- `apps-games/dress-rehearsal/index.html` (theme colour, preload hints only)
- `apps-games/dress-rehearsal/test/**`
- `.agents/games/dress-rehearsal/{assets-index,decisions-log}.md`
- `.agents/resources/2026-10-23/web-games/dress-rehearsal/04/README.md`
- `tasks/epics/23-web-dress-rehearsal/STATUS.md` (tick task 04)

## Acceptance Criteria

- All 15 screens and sheets listed in `product.md` exist, are reachable by the router, and render from a loaded profile.
- A full campaign challenge can be styled, finished, read and retried by drag, tap and keyboard in tests.
- The contrast test passes for every token pair (text >= 4.5, UI >= 3); hit areas are >= 44 px; no rendered text falls back to a platform font.
- Fonts are bundled as woff2 with `OFL.txt`, within the size budgets, with provenance in the evidence README.
- All 63 art slots have a code-drawn fallback and an empty manifest still renders a complete game.
- The export renderer produces the expected draw calls for all four frames.
- No network call exists in `src/`; no source file exceeds 800 lines.

## Verification Commands

- `bun run --filter '@web-games/dress-rehearsal*' typecheck`
- `bun run --filter '@web-games/dress-rehearsal*' test`
- `bun run --filter '@web-games/dress-rehearsal' build`
- `bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core`

## Out of Scope

- Audio, haptics, motion polish and the tutorial (task 05).
- Importing designer art (task 06).
- Native projects (task 07).
- Any browser, screenshot or device check.

## Commit message

`feat(dress-rehearsal): add all screens, styling board, design tokens and fonts [23-web-dress-rehearsal/04]`
