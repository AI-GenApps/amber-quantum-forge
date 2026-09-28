---
epic: 16-games-portfolio-wave2
task: 07-mr-design-system-and-fonts
status: completed
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/06-mr-rescue-campaign-60]
estimate: L
owner: agent
---

# Merge Relay: design system, custom fonts, and screen-golden harness

## Goal

Replace the stock Material look with a Threes!-grade design system
(tokens, typography, chrome widgets, background) and build the
**screen-golden harness**. On this device-less server, those goldens are the
visual evidence that every later task and verifier looks at.

## Context / Decisions

- Visual target: `.agents/resources/2026-09-25/merge-relay-visual-reference/README.md`
  (task 01) and its style anchors. Match the polish level only; never copy
  Threes! art, characters, or palette exactly.
- Fonts: display **Fredoka** (`ofl/fredoka/Fredoka[wdth,wght].ttf`), used for
  tile numerals, titles, and buttons; body **Nunito Sans**
  (`ofl/nunitosans/NunitoSans[YTLC,opsz,wdth,wght].ttf` plus its italic).
  Each gets its `OFL.txt`. Flame board text must set `fontFamily: 'Fredoka'`.
  This also fixes the tile digits that rendered as white boxes in headless
  renders.
- Palette direction: warm cream play field, ink-navy text, and a
  per-tier tile palette with ≥12 steps (2 → 8192+) that pass WCAG AA
  contrast for the numeral. The palette gets a new **brand theme**; the
  existing `signal`/`ember` themes in `content/themes.json` stay as
  cosmetic variants, restyled to the new tokens.
- Chrome widgets (new, under `lib/src/ui/`): `MrPanel` (soft card with an
  offset shadow), `MrButton` (primary/secondary with a press-down animation),
  `MrPill` (stat chip), `MrDialog`, and `MrBackground` (a warm
  paper-textured or dotted background painter with a vignette, cheap enough
  to run on every screen).
- Manifest slots (`lib/src/assets/merge_relay_art_manifest.dart`): named
  slots (`homeScene`, `logoWide`, `logoStacked`, `tileFace_<tier>`, and
  `boardFrame`). Each slot uses `assets/art/<slot>.png` if it is bundled,
  otherwise a code-drawn fallback. Tests cover both paths; image decode runs
  inside `tester.runAsync`.
- **Screen-golden harness**: `test/goldens/screens_test.dart` renders
  Home, Chapter list, Tutorial, Play (rescue), Play (endless), Result,
  Settings, and Pause at 1080×2400 (DPR 3) with the real fonts loaded by
  `test/flutter_test_config.dart`. Flame loops never settle, so pump fixed
  durations instead of `pumpAndSettle`. Goldens live in
  `test/goldens/screens/*.png`. This task applies the new theme globally
  (fonts, colours, background), so the goldens show a real change; the
  per-screen layout restyle is task 11.

## Implementation Checklist

- [x] Add the fonts and OFL files, and register them in `pubspec.yaml`.
- [x] Add `lib/src/ui/{mr_tokens,mr_theme,mr_text_styles,mr_background,mr_panel,mr_button,mr_pill,mr_dialog}.dart`.
- [x] Add the art manifest with fallback-first slots, plus tests.
- [x] Replace `ThemeData` in `merge_relay_theme.dart`/`merge_relay_app.dart`
      with the new theme; remove any `colorSchemeSeed` or Material-default
      look.
- [x] Add `flutter_test_config.dart` (font loading), `typography_test.dart`
      (every text resolves to Fredoka or Nunito Sans), and the screen
      goldens.
- [x] Copy the goldens to `.agents/resources/2026-09-25/games-wave2-qa/07/`,
      build a side-by-side contact sheet against the task 01 anchors, and
      VIEW both.

## Files Touched

- `apps-native/games/merge_relay/{pubspec.yaml,assets/fonts/**,lib/src/ui/**,lib/src/assets/**,lib/src/merge_relay_theme.dart,lib/src/merge_relay_app.dart,test/**}`
- `apps-native/games/merge_relay/content/themes.json` (restyle values only)

## Acceptance Criteria

- The typography test passes, and the goldens show Fredoka numerals on tiles
  (no white boxes, no tofu).
- There are eight screen goldens, and none shows a Material-default look
  (purple/indigo seed, default Roboto, stock `ElevatedButton`).
- A widget test covers the pressed and resting geometry of `MrButton`.
- The manifest tests cover both the bitmap-present and fallback paths.
- The existing suite passes, with a test count ≥ task 06's.

## Verification Commands

- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run games:validate:strict`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`
- Device check: NOT RUN (no device); the verifier judges the screen goldens instead.

## Out of Scope

- Tile faces and board skin (task 08), motion (09), audio (10), and per-screen layout (11).

## Commit message

`feat(merge-relay): add design system, Fredoka/Nunito Sans fonts, and screen goldens [16-games-portfolio-wave2/07]`
