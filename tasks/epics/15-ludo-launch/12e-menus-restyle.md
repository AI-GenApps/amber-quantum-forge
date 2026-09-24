---
epic: 15-ludo-launch
task: 12e-menus-restyle
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/12d2-board-and-layout-fidelity]
estimate: L
---

# Restyle every non-board screen to the target look

## Goal

Apply the design system from task 12b to every remaining screen — splash,
onboarding (welcome/profile/tutorial), home lobby, mode setup sheet,
pass-and-play interstitial, pause dialog, results, settings, and
how-to-play — so no screen in the app still shows the Material-default
look (white backgrounds, system font, big empty areas), and regenerate
every affected golden.

## Context/Decisions

- See `.agents/resources/2026-09-24/ludo-visual-reference/README.md` and
  `ludo-king-reference.png` for the target look. Every screen below gets
  the royal-blue background painter (12b) behind its content, the bundled
  fonts, and 12b's chrome widgets (`LudoPanel`, `Ludo3dButton`,
  `RibbonBanner`, `LudoDialogFrame`, `Badge`) in place of raw Material
  widgets — no screen keeps a plain white `Scaffold` background or
  default `ElevatedButton`/`AlertDialog` styling after this task.
- **Splash** (`lib/src/screens/splash_screen.dart`): replace any generic
  loading UI with a code-drawn logo lockup (the app name in the outlined
  display font over the background painter, plus a simple original mark —
  not a copy of any Ludo King logo). No bitmap logo asset required; this
  can be entirely code-drawn.
- **Onboarding** (`onboarding_welcome_screen.dart`,
  `onboarding_profile_screen.dart`, `onboarding_tutorial_screen.dart`):
  apply background, fonts, and `Ludo3dButton` for primary actions; keep
  existing flow/logic (task 07) unchanged — paint only.
- **Home lobby** (`home_lobby_screen.dart`): large illustrated mode tiles
  (Computer/Pass N Play/Friends/Online) built from `LudoPanel` with a
  distinct icon/illustration per tile (code-drawn, e.g. simple geometric
  dice/board glyphs — not photographic), a profile header (avatar + name
  using 12b's widgets), and no large empty unstyled areas — verify by a
  layout test asserting the lobby's content fills the viewport without a
  single dominant empty `SizedBox`/`Spacer` region (approximate via a
  golden review, documented in the PR).
- **Mode setup sheet** (`mode_setup_sheet.dart`): restyle the bottom sheet
  container, toggles, and color/difficulty pickers with `LudoPanel`/
  `Ludo3dButton`; keep existing controls/logic (task 09) unchanged.
- **Pass-and-play interstitial** (`pass_and_play_interstitial.dart`):
  restyle the "Pass to <player>" card with `LudoPanel` and the outlined
  title style; keep dismiss/don't-show-again logic (task 12) unchanged.
- **Pause dialog** (`pause_quit_dialog.dart`): rebuild on
  `LudoDialogFrame` in place of raw `AlertDialog`; keep toggle bindings to
  `ludo_sound_settings.dart` (task 09) unchanged.
- **Results** (`results_screen.dart`): trophy graphic (code-drawn, e.g. a
  simple gold cup shape via `CustomPainter`), per-seat rank rows, a
  `RibbonBanner` for the winner, and a `Ludo3dButton` rematch action;
  keep existing rematch/navigation logic (task 10) unchanged.
- **Settings** (`settings_screen.dart`) and **how-to-play**
  (`how_to_play_screen.dart`): apply background/fonts/`LudoPanel` list
  rows; how-to-play keeps its existing diagrams (task 07/10) but restyles
  their frame/chrome to match, and each rule's diagram must remain legible
  against the new background (verify contrast).
- **Golden regeneration**: every golden capturing one of these screens
  (tasks 07, 08, 09, 10, 12) must be regenerated to reflect the new look.

## Implementation Checklist

- [ ] Restyle `lib/src/screens/splash_screen.dart` with a code-drawn logo
  lockup over the background painter.
- [ ] Restyle `lib/src/screens/onboarding_welcome_screen.dart`,
  `onboarding_profile_screen.dart`, `onboarding_tutorial_screen.dart`
  (paint only).
- [ ] Restyle `lib/src/screens/home_lobby_screen.dart`: illustrated mode
  tiles, profile header, no large empty areas.
- [ ] Restyle `lib/src/screens/mode_setup_sheet.dart` (paint only).
- [ ] Restyle `lib/src/screens/pass_and_play_interstitial.dart` (paint
  only).
- [ ] Rebuild `lib/src/screens/pause_quit_dialog.dart` on
  `LudoDialogFrame`.
- [ ] Restyle `lib/src/screens/results_screen.dart`: trophy graphic, rank
  rows, `RibbonBanner`, rematch button.
- [ ] Restyle `lib/src/screens/settings_screen.dart` and
  `lib/src/screens/how_to_play_screen.dart`.
- [ ] Regenerate every golden under `test/goldens/` for the screens above.
- [ ] Update the relevant existing test files (`test/screens/*_test.dart`)
  only where widget-finder lookups change due to the new widget tree (e.g.
  `find.byType(AlertDialog)` -> `find.byType(LudoDialogFrame)`); logic
  assertions themselves stay unchanged.
- [ ] Grep the `lib/src/` tree for remaining raw `AlertDialog`,
  `ElevatedButton`, `colorSchemeSeed`, and default `Scaffold(color: ...)`
  Material usage outside of task 12b's own widget internals; resolve or
  document any deliberate exception.

## Files Touched

- `apps-native/games/ludo/lib/src/screens/splash_screen.dart`
- `apps-native/games/ludo/lib/src/screens/onboarding_welcome_screen.dart`
- `apps-native/games/ludo/lib/src/screens/onboarding_profile_screen.dart`
- `apps-native/games/ludo/lib/src/screens/onboarding_tutorial_screen.dart`
- `apps-native/games/ludo/lib/src/screens/home_lobby_screen.dart`
- `apps-native/games/ludo/lib/src/screens/mode_setup_sheet.dart`
- `apps-native/games/ludo/lib/src/screens/pass_and_play_interstitial.dart`
- `apps-native/games/ludo/lib/src/screens/pause_quit_dialog.dart`
- `apps-native/games/ludo/lib/src/screens/results_screen.dart`
- `apps-native/games/ludo/lib/src/screens/settings_screen.dart`
- `apps-native/games/ludo/lib/src/screens/how_to_play_screen.dart`
- `apps-native/games/ludo/lib/app.dart` (theme wiring, `ThemeData` from
  12b)
- `apps-native/games/ludo/test/screens/*.dart`
- `apps-native/games/ludo/test/goldens/*.png`

## Acceptance Criteria

- `lib/app.dart`'s `MaterialApp` no longer sets `colorSchemeSeed:
  Colors.indigo`; it uses 12b's `ludoTheme`.
- Every screen listed above renders the royal-blue background painter
  behind its content and uses the bundled fonts (verified visually via
  regenerated goldens).
- A grep for `AlertDialog(` and `colorSchemeSeed` under `lib/src/` returns
  no remaining matches (or each match is documented as a deliberate
  exception in the commit body).
- All existing screen-logic tests (task 07/08/09/10/12's behavioral
  assertions) still pass unchanged in substance after finder updates.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- Device verification (physical device, serial `RZ8R32EAB7T`):
  1. `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
  2. `adb -s RZ8R32EAB7T install -r apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
  3. `adb -s RZ8R32EAB7T shell monkey -p app.w3dev.ludo.debug -c android.intent.category.LAUNCHER 1`
  4. Navigate through splash, onboarding, lobby, mode setup, pass-and-play
     interstitial, pause dialog, results, settings, and how-to-play,
     capturing each with
     `adb -s RZ8R32EAB7T exec-out screencap -p > <file>.png`.
  5. View each screenshot (Read tool) and compare against
     `.agents/resources/2026-09-24/ludo-visual-reference/ludo-king-reference.png`.
  - If the device is not attached, report NOT RUN.

## Out of Scope

- Board/HUD restyle (12c/12d, already landed).
- Full device visual QA sweep with evidence capture (12f handles the
  systematic per-screen evidence folder and fix-and-recapture loop; this
  task's own device verification is a spot check, not the final sweep).
- Any bitmap art asset content (human art session between 12f and 13).

## Commit message

`feat(ludo): restyle onboarding, lobby, dialogs, results, and settings screens [15-ludo-launch/12e]`
