# Task 08 evidence — Merge Relay character tiles and board skin

Evidence for
`tasks/epics/16-games-portfolio-wave2/08-mr-tiles-and-board.md`. No physical
device or emulator exists on this server; all evidence below is rendered
headless via `flutter test` with the app's real bundled fonts (Fredoka,
NunitoSans) loaded through
`apps-native/games/merge_relay/test/flutter_test_config.dart`.

## Files

- `tier_sheet.png` — copy of the new golden
  `apps-native/games/merge_relay/test/goldens/tiles/tier_sheet.png`
  (source of truth, committed with the task): all 12 named tile tiers (2
  through 4096/"8192+"), plus an 8192 tile proving the generic fallback
  (values above the last named tier reuse tier 11's colour/face instead of
  looking undefined), plus two empty wells for a side-by-side check that
  slots read as pale trays, not dark holes. Rendered at 1080x2400 physical
  (DPR 3, via the same `capturePhysicalGolden` helper the screen goldens
  use).
- `play_rescue.png` / `play_endless.png` — copies of the updated screen
  goldens (`test/goldens/screens/*.png`), showing the new tile faces and
  the light cream board tray in context on the real play screen.
- `contact-sheet.png` — the tier sheet and the rescue-play golden laid out
  next to two named Threes! style anchors (`threes-anchor-01`,
  `threes-anchor-03` from
  `.agents/resources/2026-09-25/threes-store-reference/`) for a
  side-by-side quality-bar comparison. Original art only — no Threes!
  character designs, exact palette values, or card layout (Threes! puts the
  face below the numeral; this task's Context explicitly requires the face
  **above** the numeral) are used anywhere in Merge Relay.

## What changed (task 08)

- **`lib/src/ui/tiles/` (new)**: `mr_tile_expression.dart` (12 original
  eye/mouth combinations, sleepy -> euphoric, each with optional
  blush/sparkle flair — indices beyond 11 clamp to the last entry, the
  "generic fallback for higher tiers"), `mr_tile_face_painter.dart` (draws
  one expression into a face box with simple vector primitives — arcs,
  circles, a 4-point sparkle), `mr_tile_card_painter.dart` (the physical
  card: a soft offset drop shadow, a full silhouette in a darker "edge"
  shade with the lighter tier fill drawn on top and pulled up by the edge
  height, so a sliver of the edge colour reads as the tile's bottom
  thickness; an optional ink outline in high-contrast mode), and
  `mr_board_tray_painter.dart` (the tray: a soft cream panel with a faint
  inner-shadow arc near the top, replacing the old flat dark-navy fill; and
  empty wells: a pale fill with a soft inset shadow top-left / rim stroke,
  reading as a shallow slot rather than a hole).
- **`lib/src/ui/mr_tokens.dart`**: added `tileEdgeColorFor` (darkens a
  tier's fill by 16% HSL lightness, keeping the same hue, for the card's
  thickness edge).
- **`lib/src/merge_relay_theme.dart`**: `board`/`slot` on both
  `signalRelayTheme` and `emberRelayTheme` — previously dark ink-navy /
  dark purple, a holdover from the pre-task-07 flat theme — are now a soft
  cream tray and a barely-darker pale well, matching the Threes!-style warm
  paper board. This also restyles the tutorial's mini-board preview and the
  Flame-canvas board (`merge_relay_game.dart`'s `render()`), which both
  share the same `MergeRelayBoardArt.paint` entry point.
- **`lib/src/merge_relay_board_art.dart`** (rewritten): each occupied cell
  now draws (1) the physical card via `paintTileCard`, (2) the tier's face
  in a top zone (`faceBoxFor`) via `paintTileFace`, (3) the numeral in a
  bottom zone (`numeralBoxFor`) — the two zones have a deliberate gap so
  they never touch, let alone overlap. `paintTile` is public so the
  tier-sheet golden reuses the exact same per-tile paint logic instead of
  duplicating it. Added a `highContrast` parameter threaded through to the
  card/well/face painters (firmer ink outlines, bigger eyes, stronger
  blush) and a new `numeralFontScaleFor`/`numeralTextPainterFor` pair
  shared by production code and the new numeral-ratio test.
- **High-contrast preference**: `MergeRelayPreferences.highContrast` (new
  field, `merge_relay_models.dart`), `setHighContrast` (
  `merge_relay_game_preferences.dart`), persisted in
  `merge_relay_save_state.dart` / parsed back in
  `merge_relay_game_restore_parsing.dart`, and a new "High contrast" switch
  in the Settings sheet (`merge_relay_overlays.dart`, between "Reduce
  motion" and "Sound"). Wired into the real board (
  `merge_relay_board_widget.dart`), the tutorial's mini-board (
  `merge_relay_tutorial.dart`), and the Flame-canvas board (
  `merge_relay_game.dart`).
- **Tests**: `test/ui/tiles/mr_tile_numeral_test.dart` (new) — measures the
  actual rendered numeral height (with the real bundled Fredoka font)
  against the tile height for values 2/64/512/4096, asserting the >= 40%
  (1-2 digits) / >= 28% (4+ digits) floors from the task's Context, and
  asserts the face box never intersects the numeral box at three tile
  sizes. `test/goldens/tiles/tier_sheet_test.dart` (new) — the tier-sheet
  golden described above. `test/merge_relay_preferences_test.dart` — added
  a high-contrast persistence round-trip test. `test/widget_test.dart` —
  the existing Settings test now also asserts the "High contrast" switch
  is present and toggles it. All eight `test/goldens/screens_test.dart`
  goldens were regenerated (`--update-goldens`) since the board's visuals
  changed; no other screen layout changed (task 11's job).

## Judged against the visual reference

- The tier sheet shows 12 clearly distinct tier colours and expressions
  (sleepy at 2/4, calm/content through the low-mid tiers, blush appears
  from 32 up, sparkle + upward "^ ^" happy eyes from 256/512 up, star eyes
  at the top two tiers) plus the 8192 fallback tile, which is visually
  identical to 4096 as intended. Every numeral is large and legible against
  its tile fill (ink on the light tiers, cream on the dark tiers — reusing
  the already WCAG-AA-picked `tileNumeralColorFor`).
- `play_rescue.png`/`play_endless.png`: the board tray is now a soft cream
  panel, and every empty cell is a pale slot with a faint inset shadow —
  no dark holes, matching the task's "Empty wells read as slots, not dark
  holes" requirement. Verified pixel colours directly (not just visually)
  with Pillow: an occupied cell samples exactly `(255, 233, 198)` (the
  tier-4 fill, `0xffffe9c6`) and the tray background samples `(241-243,
  231-233, 212-214)` — close to `signalRelayTheme.board` (`0xfff6ecd8`),
  darkened slightly by the tray's inner-shadow arc — confirming the pale
  colours are correct and not a rendering/scaling artifact.
- Compared side-by-side with the two Threes! anchors in `contact-sheet.png`:
  same family of "physical card with a coloured bottom edge, big legible
  numeral, warm palette" quality bar, while deliberately not copying
  Threes!'s character designs, its below-the-numeral face placement, or
  its uniform tan edge colour (this task's Context specifies a per-tier
  darker-shade edge instead).
- The tutorial's small mini-board preview (`tutorial.png`) renders the same
  code path at a much smaller cell size (~40 logical px, constrained by a
  fixed `210`-tall box that predates this task); the tile corner radius
  (18, unchanged from before this task) reads as more rounded there and
  the face is small but present — this proportion issue is pre-existing
  (confirmed by diffing against the task 07 baseline PNG) and out of
  scope; the real play-screen board (task 08's actual target) is
  unaffected and reads clearly.

## Verification (run from the repo root, in
`/home/ashutosh/PROJECTS/AI-GenApps/amber-quantum-forge`, with the required
environment prefix
`PATH=/data/tools/bun/bin:/data/tools/flutter/bin:/data/tools/jdk17/bin:$PATH
PUB_CACHE=/data/tools/pub-cache JAVA_HOME=/data/tools/jdk17
ANDROID_HOME=/data/tools/android-sdk ANDROID_SDK_ROOT=/data/tools/android-sdk
BUN_INSTALL_CACHE_DIR=/data/tools/bun-cache
GRADLE_USER_HOME=/data/tools/gradle-home`):

| Command | Result |
|---|---|
| `bun run games:format:check` | pass |
| `bun run games:analyze -- --app merge_relay` | pass, no issues |
| `bun run games:test -- --app merge_relay` | pass, 162/162 (baseline from task 07 was 155; +7 new: 5 numeral/face-overlap, 1 tier-sheet golden, 1 high-contrast persistence) |
| `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug` | pass, `build/app/outputs/flutter-apk/app-debug.apk` |
| Device check | NOT RUN — no physical device or emulator on this server; these goldens are the visual evidence in its place |
