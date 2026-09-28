# Task 07 evidence — Merge Relay design system, fonts, screen goldens

Screen-golden harness output for
`tasks/epics/16-games-portfolio-wave2/07-mr-design-system-and-fonts.md`.
Source of truth: `apps-native/games/merge_relay/test/goldens/screens/*.png`
(committed with the task); these are copies for review, captured headless
via `flutter test` at 1080x2400 physical (DPR 3) with the app's real bundled
fonts (Fredoka, NunitoSans) loaded through
`apps-native/games/merge_relay/test/flutter_test_config.dart`. No physical
device or emulator exists on this server — every golden here is the visual
evidence in place of a device screenshot.

## Files

- `home.png` — Home, fresh launch (no saved session), real content loaded:
  "0 of 60 cleared".
- `chapter_list.png` — the "Rescue paths" bottom sheet, showing the real
  Chapter 1 ("Harbor") boards — First Light, Rope and Cleat, Low Tide, Ferry
  Lane, Salt Crate, ….
- `tutorial.png` — "First handoff" tutorial, step 1 of 2 (a scripted demo
  board, independent of the content catalog — unaffected by Round 2).
- `play_rescue.png` — Play screen, rescue mode, the real chapter 1 board 1
  ("First Light"), after skipping the tutorial.
- `play_endless.png` — Play screen, endless mode, reached from Home after
  the tutorial is already complete.
- `result.png` — Result screen after clearing the real "First Light" board
  by replaying the exact winning move line `MergeRescueSolver` (the same
  solver task 06's own tests use) computes for it.
- `settings.png` — the Settings bottom sheet opened from Home.
- `pause.png` — the in-play Pause overlay.
- `contact-sheet.png` — the eight Round 2 goldens laid out next to two named
  Threes! style anchors (`threes-anchor-01`, `threes-anchor-03`, from
  `.agents/resources/2026-09-25/threes-store-reference/`) for a side-by-side
  quality-bar comparison. Original art only — no Threes! art, characters,
  or exact palette values are used anywhere in Merge Relay.

## What changed (task 07)

- Bundled fonts: **Fredoka** (`Fredoka[wdth,wght].ttf`, display — tile
  numerals, titles, buttons) and **NunitoSans**
  (`NunitoSans[YTLC,opsz,wdth,wght].ttf` + italic, body), each with its
  `OFL.txt`, registered in `pubspec.yaml`.
- New design-system layer under `lib/src/ui/`: `mr_tokens.dart` (brand
  palette — warm cream paper, ink-navy text, a 12-step WCAG-AA tile-tier
  palette from 2 to 8192+), `mr_text_styles.dart`, `mr_theme.dart` (builds
  `ThemeData` with an explicit `ColorScheme`, never `colorSchemeSeed`),
  `mr_background.dart` (a dotted paper texture + vignette, applied to every
  route in `merge_relay_ui.dart`), `mr_panel.dart`, `mr_button.dart` (a
  press-down pill button — see
  `apps-native/games/merge_relay/test/mr_button_test.dart` for its pressed
  vs. resting geometry test), `mr_pill.dart`, `mr_dialog.dart`.
- `lib/src/assets/merge_relay_art_manifest.dart`: named art slots
  (`homeScene`, `logoWide`, `logoStacked`, `tileFace_<tier>`, `boardFrame`)
  that try `assets/art/<slot>.png` and fall back to a code-drawn placeholder
  — no bitmaps ship in this task, so every slot in these goldens renders its
  fallback; tested in `test/merge_relay_art_manifest_test.dart` (both the
  fallback and a faked "bundled" path).
- `merge_relay_theme.dart`: `signalRelayTheme`/`emberRelayTheme` restyled
  onto the shared brand tokens (both now use the warm cream paper / ink-navy
  base); `materialThemeFor` now delegates to `MrTheme.build`.
- `merge_relay_board_art.dart`: tile numerals now set `fontFamily:
  'Fredoka'` explicitly (fixes the audit's white-box/tofu digits — that
  `TextPainter` call sits outside the widget tree, so it never inherited
  the ambient font) and pull their fill/numeral color from the new 12-step
  token palette instead of the old 6-branch accent-color switch.
- Every `FontWeight.w900` "title" text across the home/tutorial/play/
  result/pause/settings screens now explicitly requests Fredoka (previously
  these inherited whatever the ambient default happened to be).
- Fixed a legibility bug the new Pause golden surfaced: the panel's
  "Resume" `FilledButton` defaulted to an ink background on the panel's own
  ink background (both derive from `colorScheme.primary` = ink), making the
  label invisible. It now explicitly uses a paper background / ink
  foreground.

## Judged against the visual reference

Checked each golden against
`.agents/resources/2026-09-25/merge-relay-visual-reference/README.md`'s
Do/Don't checklist and the two named Threes! anchors:

- Fredoka numerals render as real glyphs on every populated tile — no white
  boxes, no tofu (the audit's headline bug for this screen).
- No screen uses Material-default indigo/purple, default Roboto, or a bare
  stock `ElevatedButton`/`ListTile` look; the warm cream background, ink-navy
  chrome, and rounded pill buttons are consistent across all eight screens.
- The dotted background texture (`MrBackground`) is applied globally so no
  large region reads as a flat, dead zone, even where a screen's content
  doesn't fill the full 800dp logical height — the deeper per-screen
  composition (adding a home-scene mascot, filling the lower half of Play,
  etc.) is task 11's job, out of scope here.
- Tile faces are still flat color swatches (no per-tier character/face) —
  expected and explicitly out of scope; task 08 adds character tiles.
- Buttons the app doesn't yet render through the new `MrButton` widget
  (Play/Result/Settings/Pause still use themed `FilledButton`/
  `OutlinedButton`/`TextButton`) pick up the new rounded, Fredoka-labelled
  theme globally via `MrTheme`, per the task's "apply the theme globally,
  per-screen restyle is task 11" scope note.

## Round 2 (orchestrator review)

The orchestrator reviewed the first contact sheet and flagged three issues,
all fixed and re-verified without touching task 06's content:

1. **Pause panel translucency.** `_PausePanel`'s background was
   `theme.ink.withValues(alpha: 0.94)`, letting the board's tiles show
   through behind "Restart run"/"Finish here"/"Home" and making "Finish
   here" read as if it overlapped a tile. `lib/src/merge_relay_pause_panel.dart`
   now uses a fully opaque `theme.ink` fill (plus `MrTokens.cardShadow`) —
   see the new `pause.png`.

2. **Settings palette chip contrast.** `_ThemeChoice`
   (`lib/src/merge_relay_overlays.dart`) relied on `ChoiceChip`'s default
   `ChipTheme` derivation, which read as washed-out gray for the unselected
   label against this custom `ColorScheme`. It now sets explicit colors:
   selected = solid ink fill, paper label, paper checkmark; unselected =
   paper fill, full-opacity ink label, a visible ink border. Both clear
   WCAG AA, and the states are visually distinct (fill + checkmark, not
   just an opacity shift) — see the new `settings.png`.

3. **Stale 5-board fallback content.** The first pass pumped
   `const MergeRelayApp()` with no `content`, so `MergeRelayGame` fell back
   to `MergeRelayContentCatalog.fallback` — a small generated 5-board dev
   catalog (`rescue-signal`/`rescue-echo`/`rescue-crossing`/…) meant for
   fast, content-decoupled unit tests, **not** task 06's real 60-board,
   6-chapter campaign. `test/goldens/screens_test.dart` now loads the real
   content the same way `main.dart` does —
   `await MergeRelayContentCatalog.load()` reading
   `content/rescue_boards.json` — and passes it as `MergeRelayApp(content:
   ...)`. The `result.png` golden now replays the real winning move line
   for chapter 1 board 1, computed with the same `MergeRescueSolver` task
   06's tests use, instead of a hand-picked swipe sequence tuned for the
   fallback board.

   **Finding, as requested:** the app itself does **not** fall back to the
   5-board catalog in production. `lib/main.dart` always calls `await
   MergeRelayContentCatalog.load()` before `runApp`; on success it passes
   real `content`, on failure it passes a non-null `contentError` (which
   `MergeRelayApp` routes to a dedicated `_MergeRelayContentFailure` screen,
   never the game). `content` and `contentError` are never both null on the
   path from `main.dart`, so `MergeRelayGame`'s
   `content ?? MergeRelayContentCatalog.fallback` fallback is unreachable
   there — it only ever fires when a test constructs `MergeRelayApp()`
   without `content`, e.g. `test/widget_test.dart`, which uses it
   deliberately for a fast, content-decoupled smoke test of app flow (not a
   visual-evidence golden).

   **A second bug surfaced while fixing this:** the first attempt to load
   content directly inside a `testWidgets` body hung every one of the eight
   tests for the full 10-minute timeout. `testWidgets` bodies run inside
   `flutter_test`'s fake-async zone for deterministic `pump()`-driven
   scheduling; `rootBundle.loadString`'s real file read never completes
   there without briefly stepping outside that zone. Fixed by wrapping the
   load in `tester.runAsync` (`_loadContent` in `screens_test.dart`) — this
   is exactly what the epic's own environment notes warn about ("read the
   asset bytes inside `tester.runAsync` if needed"); confirmed fixed by
   first running the single `home` golden alone (passed in ~1s) before
   regenerating all eight.

## Verification (run from the repo root, in
`/home/ashutosh/PROJECTS/AI-GenApps/amber-quantum-forge`)

All commands below were run with the required environment prefix
(`PATH=/data/tools/bun/bin:/data/tools/flutter/bin:/data/tools/jdk17/bin:$PATH
PUB_CACHE=/data/tools/pub-cache JAVA_HOME=/data/tools/jdk17
ANDROID_HOME=/data/tools/android-sdk ANDROID_SDK_ROOT=/data/tools/android-sdk
BUN_INSTALL_CACHE_DIR=/data/tools/bun-cache
GRADLE_USER_HOME=/data/tools/gradle-home`):

| Command | Result |
|---|---|
| `bun run games:format:check` | pass |
| `bun run games:analyze -- --app merge_relay` | pass, no issues |
| `bun run games:test -- --app merge_relay` | pass, 155/155 (baseline from task 06 was 134; +21 new: 5 art-manifest, 5 typography, 3 `MrButton`, 8 screen goldens) — re-run clean after the Round 2 fixes |
| `bun run games:validate:strict` | pass |
| `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug` | pass, `build/app/outputs/flutter-apk/app-debug.apk` |
| Device check | NOT RUN — no physical device or emulator on this server; these goldens are the visual evidence in its place |
