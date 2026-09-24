---
epic: 15-ludo-launch
task: 12b-design-system
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/12a-gameplay-bugfix]
estimate: L
---

# Build the Ludo design system: fonts, theme, background, reusable chrome widgets

## Goal

Replace the stock Material 3 indigo-seed look with a bespoke Ludo design
system — bundled OFL display/body fonts, theme tokens and `ThemeData`,
outlined display text styles, a code-drawn royal-blue background painter
(pattern + vignette), and a set of reusable "chunky glossy" chrome widgets
(gold-framed panel, 3D button, ribbon banner, dialog frame, badge) — plus
the plumbing (font golden loading, manifest bitmap-slot support) that every
later restyle task (12c-12e) builds on. This task does not yet restyle any
existing screen; it builds the toolkit tasks 12c-12e apply.

## Context/Decisions

- **Target look**: see
  `.agents/resources/2026-09-24/ludo-visual-reference/README.md` and
  `ludo-king-reference.png` for the look-and-feel target (polish level
  only — never copy/trace any Ludo King asset). Deep royal-blue
  background with a faint repeating dice/board pattern and a vignette; gold
  accents; chunky rounded display font in white with a dark outline/
  shadow; glossy gradient buttons with a darker bottom edge and a press
  animation.
- **Fonts**: bundle an OFL-licensed chunky rounded display font (e.g.
  Lilita One) for headings/titles and an OFL-licensed rounded body font
  (e.g. Nunito or Baloo 2) for body text, under
  `apps-native/games/ludo/assets/fonts/`, each with its `OFL.txt`/license
  file committed alongside. Register both in `pubspec.yaml`. Never use the
  Material default system font anywhere in the app after this task lands
  (later tasks apply the theme; this task defines it).
- **Theme tokens**: `lib/src/theme/ludo_theme_tokens.dart` (color palette —
  royal-blue background, gold accent, per-seat red/green/yellow/blue —
  spacing scale, radii, shadow presets) and
  `lib/src/theme/ludo_theme.dart` exporting a `ThemeData` built from the
  tokens (fonts wired via `fontFamily`/`TextTheme`, `colorScheme` no longer
  `colorSchemeSeed: Colors.indigo`). `lib/src/theme/ludo_text_styles.dart`
  adds an outlined-title style (white fill, dark stroke/shadow, using
  `Text`'s `foreground`/`Shadow` or a stacked-text technique — pick one and
  document it) reused by every later heading.
- **Background painter**: `lib/src/theme/ludo_background_painter.dart`, a
  `CustomPainter` (or Flame component, matching how `ludo_game.dart`
  already draws) that renders the deep royal-blue fill, a faint repeating
  dice/board-pattern motif (drawn procedurally — small code-drawn dice pip
  clusters or board-cell outlines tiled at low opacity, not a bitmap), and
  a radial vignette darkening toward the edges. Must be cheap enough to run
  behind every screen without a visible frame-rate drop (verify via a
  widget test asserting a single build/paint call per frame under
  `tester.pump()`, not a perf profile).
- **Reusable chrome widgets** (`lib/src/widgets/`, new files):
  `LudoPanel` (gold-framed glossy rounded-rect card, used later for player
  cards and dialogs), `Ludo3dButton` (gradient fill + darker bottom edge +
  press-down scale/offset animation on tap-down, released on tap-up),
  `RibbonBanner` (angled/pennant banner for callouts and results ranks),
  `LudoDialogFrame` (wraps `LudoPanel` with a dialog-appropriate size/
  padding, replacing raw `AlertDialog` styling in later tasks), `Badge` (a
  small circular/pill accent badge, e.g. for notification counts or rank
  numbers). Each is a standalone widget with its own widget test; none is
  wired into an existing screen yet (that's 12d/12e).
- **Golden font loading**: golden tests only show real glyphs if the
  bundled fonts are loaded before rendering. Add
  `apps-native/games/ludo/test/flutter_test_config.dart` with a
  `testExecutable` that calls `loadAppFonts()` (via `golden_toolkit` if
  already a dependency, otherwise `FontLoader` registering each bundled
  font family from its asset bytes) before running the test suite. Confirm
  this file is picked up automatically by `flutter test` (no per-file
  import needed) and that a widget test rendering the new outlined-title
  style produces the real font's glyphs, not tofu/fallback boxes, in a
  golden captured for this task's own new widgets.
- **Manifest bitmap-slot support**: extend
  `lib/src/assets/ludo_art_manifest.dart` so any visual slot can
  optionally resolve to a bitmap asset at `assets/art/<slot>.png` — if the
  file exists (checked via `AssetManifest`/`rootBundle` lookup, not a
  hardcoded boolean), the slot renders that `Image`; otherwise it falls
  back to the existing code-drawn painter unchanged. This does not add any
  actual bitmap files (none exist yet — the human art session between 12f
  and 13 fills them in); it only adds the resolution logic and a fallback
  test for a slot with no bitmap present, plus a test using a temporary/
  fake bundle to prove a present bitmap is used when available.

## Implementation Checklist

- [ ] Source and bundle OFL display + body fonts under
  `apps-native/games/ludo/assets/fonts/`, with `OFL.txt` license files;
  register in `pubspec.yaml`.
- [ ] Create `lib/src/theme/ludo_theme_tokens.dart` (palette, spacing,
  radii, shadows).
- [ ] Create `lib/src/theme/ludo_theme.dart` exporting a `ThemeData` built
  from the tokens and bundled fonts.
- [ ] Create `lib/src/theme/ludo_text_styles.dart` including an outlined-
  title style.
- [ ] Create `lib/src/theme/ludo_background_painter.dart` (pattern +
  vignette).
- [ ] Create `lib/src/widgets/ludo_panel.dart`, `ludo_3d_button.dart`,
  `ribbon_banner.dart`, `ludo_dialog_frame.dart`, `ludo_badge.dart`.
- [ ] Create `apps-native/games/ludo/test/flutter_test_config.dart` loading
  bundled fonts for goldens.
- [ ] Extend `lib/src/assets/ludo_art_manifest.dart` with optional
  bitmap-slot resolution (`assets/art/<slot>.png` if present, else the
  existing code-drawn fallback).
- [ ] Add widget tests + goldens for each new chrome widget under
  `test/widgets/` and `test/goldens/design_system/`.
- [ ] Add `test/assets/ludo_art_manifest_bitmap_test.dart` covering both the
  present-bitmap and fallback paths.
- [ ] Add `test/theme/ludo_background_painter_test.dart` asserting a single
  paint call per pump and that colors match the token palette.

## Files Touched

- `apps-native/games/ludo/assets/fonts/*` (font files + `OFL.txt`)
- `apps-native/games/ludo/pubspec.yaml`
- `apps-native/games/ludo/lib/src/theme/ludo_theme_tokens.dart`
- `apps-native/games/ludo/lib/src/theme/ludo_theme.dart`
- `apps-native/games/ludo/lib/src/theme/ludo_text_styles.dart`
- `apps-native/games/ludo/lib/src/theme/ludo_background_painter.dart`
- `apps-native/games/ludo/lib/src/widgets/ludo_panel.dart`
- `apps-native/games/ludo/lib/src/widgets/ludo_3d_button.dart`
- `apps-native/games/ludo/lib/src/widgets/ribbon_banner.dart`
- `apps-native/games/ludo/lib/src/widgets/ludo_dialog_frame.dart`
- `apps-native/games/ludo/lib/src/widgets/ludo_badge.dart`
- `apps-native/games/ludo/lib/src/assets/ludo_art_manifest.dart`
- `apps-native/games/ludo/test/flutter_test_config.dart`
- `apps-native/games/ludo/test/widgets/*.dart`
- `apps-native/games/ludo/test/theme/*.dart`
- `apps-native/games/ludo/test/assets/ludo_art_manifest_bitmap_test.dart`
- `apps-native/games/ludo/test/goldens/design_system/*.png`

## Acceptance Criteria

- Bundled fonts render with real glyphs (no tofu) in this task's own
  goldens, proving `flutter_test_config.dart`'s font loading works.
- Every new chrome widget (`LudoPanel`, `Ludo3dButton`, `RibbonBanner`,
  `LudoDialogFrame`, `Badge`) has a passing widget test and golden.
- `Ludo3dButton` visibly changes appearance (scale/offset) between its
  resting and pressed states, verified by a widget test comparing rendered
  geometry/opacity before and during a `tester.startGesture` press.
- `LudoArtManifest`'s bitmap-slot resolution uses a present
  `assets/art/<slot>.png` when available and falls back to the existing
  code-drawn painter when absent, both covered by tests — no bitmap files
  are added by this task.
- `git diff --stat` shows only font files (with license files),
  `.dart` files, and golden `.png` files under `test/goldens/`.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- Device verification: this task builds toolkit widgets not yet wired into
  any screen, so there is no visible on-device change to verify. Report
  NOT APPLICABLE for the device-screenshot step; still run
  `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
  and `adb -s RZ8R32EAB7T install -r apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
  to confirm the app still builds and installs with the new fonts/assets
  bundled (report NOT RUN if the device is not attached).

## Out of Scope

- Applying the theme/widgets to any existing screen (tasks 12c-12e).
- Any bitmap art asset content (the human art session between 12f and 13).
- Board/token restyle (12c), HUD restyle (12d), menu restyle (12e).

## Commit message

`feat(ludo): add design system tokens, fonts, background painter, and chrome widgets [15-ludo-launch/12b]`
