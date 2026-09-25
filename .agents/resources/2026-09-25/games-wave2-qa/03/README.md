# Task 03 evidence — custom fonts for Pocket Biome and Sixty-Second Heist

Copies of the screen goldens produced by task
`tasks/epics/16-games-portfolio-wave2/03-fonts-pocket-biome-and-heist.md`.
The checked-in goldens (source of truth for `flutter test`) live under each
app's `test/goldens/screens/`; these are copies for review, viewed with the
Read tool during task execution.

All goldens are rendered headless at exactly 1080x2400 **physical**
pixels (`tester.view.physicalSize = Size(1080, 2400)`, `devicePixelRatio
= 3`) with the apps' real bundled fonts, plus the Flutter SDK's Material
Icons font, loaded via each app's `test/flutter_test_config.dart`. No
device or emulator was used (none exists on this server).

Two fixes were needed to get real 1080x2400 PNGs with real icon glyphs
(caught in orchestrator review and corrected before this evidence was
captured):

- **Physical-pixel capture.** `matchesGoldenFile(Finder)` on its own
  does not respect `devicePixelRatio`: `MaterialApp`'s
  `Navigator`/`ModalRoute` machinery wraps every route's content in its
  own `RepaintBoundary`, and `matchesGoldenFile`'s built-in capture calls
  `toImage()` on the *nearest* boundary with the default `pixelRatio:
  1.0` — i.e. one output pixel per *logical* pixel, ignoring
  `devicePixelRatio` entirely (verified against the Flutter SDK source
  and by walking the live render-object tree in a throwaway probe test).
  That silently produced 360x800 PNGs (`1080/3 x 2400/3`). Each app now
  has `test/goldens/screens/physical_golden.dart`
  (`capturePhysicalGolden(tester, finder)`), which finds that same
  boundary but calls `toImage(pixelRatio: tester.view.devicePixelRatio)`
  explicitly, and every golden test passes its result (a `Future<Image>`)
  to `matchesGoldenFile` instead of a bare `Finder`. All four PNGs are now
  confirmed 1080x2400 via `file`.
- **Material Icons glyphs.** Bundling only the app's own fonts left every
  `Icon` (leaf, sparkles, plant-sprout, chevrons, play/pause/restart,
  etc.) rendering as an empty tofu box, because `MaterialIcons` was never
  loaded into the test font registry. Both `flutter_test_config.dart`
  files now also load
  `$FLUTTER_ROOT/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf`
  straight off disk (`FLUTTER_ROOT` env var first, falling back to this
  server's fixed `/data/tools/flutter` install) under the `MaterialIcons`
  family via `FontLoader`, since it isn't a pub asset `rootBundle` can
  load. Icons now render as real glyphs in every golden.

`typography_test.dart` in each app still deliberately skips
`Icon`-produced `TextSpan`s (`style.inherit == false`) — that check is
about the apps' own copy, not about whether Material Icons happens to be
loaded in a given test run.

## Round 2 — button label colors and Heist title wrap

Orchestrator review round 2 compared these goldens pixel-for-pixel
against the pre-task-03 device captures in
`docs-internal/gaming/evidence/visual/` (`pocket-biome-final-harvest.png`,
`sixty-second-heist-final-success.png`) and found two more problems,
both fixed and re-verified before this evidence was recaptured:

- **Button label colors.** In `pocket_biome_home.png`, "Plant Mossling"
  rendered as barely-visible dark text on the dark green button instead
  of white; in `sixty_second_heist_home.png`/`in_play.png`, "Run plan"
  rendered dark on red instead of white, and the Up/Wait/Down/Left/Right
  and "Clear plan" labels rendered faint grey instead of dark navy.
  **Root cause, confirmed with a throwaway probe test (not committed) by
  printing the actually-resolved `TextStyle.color`:** this was a test
  *timing* bug, not the font wrapper functions overriding color —
  `PocketBiomeTypography.body()`/`.heading()` and
  `HeistTypography.body()`/`.heading()` only ever call
  `TextStyle.copyWith(fontFamily: ...)` and never touch `color`, and a
  probe using the real `HeistTypography.theme()` with an
  already-hydrated game showed the correct full-opacity ink color.
  `PocketBiomeApp`/`SixtySecondHeistApp` create their game and call
  `restore()` in `initState()` *without awaiting it*, so every
  action button mounts disabled for the first frame and only flips to
  enabled a microtask later once the (synchronous, in-memory) save read
  resolves. Material's `ButtonStyleButton` animates its foreground color
  between disabled and enabled states via an internal
  `AnimatedDefaultTextStyle`; capturing the golden at `t=0` (a single bare
  `pump()`) froze that animation at its disabled starting color (measured
  alpha `0.3804` — Material's exact default disabled-opacity) even though
  `onPressed` was already non-null by then. Fix: each golden test now
  does an extra `await tester.pump(const Duration(milliseconds: 300))`
  after the initial pump (comfortably past Material's default 200ms
  transition) before capturing. Verified the fix is real, not
  coincidental, by reverting it and confirming the new
  `button_colors_test.dart` regression test fails with the exact same
  `alpha: 0.3804` color, then restoring it and confirming the test
  passes again.
- **Heist title wrapping to two lines.** Bungee runs considerably wider
  per character than the font this size was originally tuned for, so
  "Sixty-Second Heist" no longer fit one line at 360 logical width; in
  `in_play.png` this pushed the "MISSION 1" + status-pill header off the
  top of the viewport and clipped the bottom hint text
  ("...Watch the hazards."). Fixed by wrapping the title `Text` in
  `FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft,
  child: Text(..., softWrap: false, ...))` in
  `lib/src/heist_ui.dart`'s `_HeistHeader` — this scales the title down
  just enough to keep it on one line at whatever width it's given
  (verified against the Flutter SDK's `RenderFittedBox` dry-layout
  algorithm: for `BoxFit.scaleDown` it measures the child unconstrained,
  then only ever shrinks, never grows, to fit) instead of guessing a
  fixed smaller font size for one specific test width. No copy change.
  `home.png` was also checked and had the same wrap; both are fixed now.

**New regression guards:** `apps-native/games/pocket_biome/test/button_colors_test.dart`
and `apps-native/games/sixty_second_heist/test/button_colors_test.dart`
assert the *resolved* (fully merged, paint-time) color of the primary
button label — full opacity and near-white luminance on the
Plant-Mossling/Run-plan primary buttons, plus dark-navy luminance on
Heist's outlined directional buttons — so this exact regression (a
golden nobody diffs pixel-by-pixel by eye) can't silently reappear.

**Explicit comparison performed:** all four regenerated goldens were
viewed with the Read tool and compared side-by-side against
`docs-internal/gaming/evidence/visual/pocket-biome-final-harvest.png`
and `docs-internal/gaming/evidence/visual/sixty-second-heist-final-success.png`
for: button label color/contrast (Plant Mossling white-on-ink, Nothing
ready grey-on-paper/disabled — matches original, since it's genuinely
disabled with `harvestable == -1`; Run plan white-on-coral;
Up/Wait/Down/Left/Right/Clear plan dark-navy/coral on outlined buttons),
header layout (MISSION 1 + status pill fully visible, not pushed off),
title single-line, and bottom hint text fully visible with no clipping.
All matched.

## Pocket Biome — Fraunces (SOFT axis 100, headings) + Quicksand (body)

- `pocket_biome_home.png` — home screen at rest
  (`apps-native/games/pocket_biome/test/goldens/screens/home_screen_test.dart`).
  "Pocket Biome" renders in Fraunces (soft serif); body copy, stat labels,
  and buttons render in Quicksand, with real Material Icons glyphs (leaf,
  sparkles). No tofu, no clipped text, no overflow stripes. The "Plant
  Mossling" and "Nothing ready" button labels — which wrapped onto two
  lines once Quicksand replaced the default font, since it runs a little
  wider at the same size — were also fixed: `BiomeActions` in
  `lib/src/pocket_biome_controls.dart` now uses a tighter button label
  style (`letterSpacing: 0`, `fontSize: 14`), a smaller leading icon
  (18px), and tighter horizontal padding, with no copy change. Confirmed
  fitting on one line at both 1080x2400 physical and 360x640 logical (a
  throwaway probe test, not committed).
- `pocket_biome_in_play.png` — after planting a Mossling
  (`.../in_play_test.dart`). The terrarium's canvas-drawn pot label
  ("Mossling") is painted directly by `PocketBiomeArt`/`TextPainter` (not a
  Flutter widget), so it needed its own explicit `fontFamily` — it renders
  in Quicksand with real glyphs.

## Sixty-Second Heist — Bungee (headings + board signage) + Chakra Petch (body)

- `sixty_second_heist_home.png` — home screen at rest
  (`apps-native/games/sixty_second_heist/test/goldens/screens/home_screen_test.dart`).
  "Sixty-Second Heist" and the vault board's "LOOT"/"EXIT" signage
  (canvas-drawn by `HeistBoardSymbols`, explicit `fontFamily`) render in
  Bungee; body copy, stat labels, chips, and buttons render in Chakra
  Petch, with real Material Icons glyphs throughout (Up/Down/Left/Right
  chevrons, pause, restart, play). Reviewed specifically for the same
  wrap/clipping risk found in Pocket Biome's buttons — none found: every
  directional button, "Clear plan", and "Run plan" fits its label on one
  line with no code changes needed.
- `sixty_second_heist_in_play.png` — with a two-step route planned
  (`.../in_play_test.dart`). The route-order chips ("1 RIGHT", "2 RIGHT")
  render in Chakra Petch; the LOOT/EXIT signage remains Bungee.

## Verification

Re-run after all five fixes (physical-pixel goldens, Material Icons,
Pocket Biome button one-line fit, button label color timing, Heist title
wrap). All commands below were run from the repo root with the
environment prefix from `tasks/epics/16-games-portfolio-wave2/STATUS.md`:

- `bun run games:format:check` — pass
- `bun run games:analyze -- --app pocket_biome` — pass, no issues
- `bun run games:test -- --app pocket_biome` — pass (13 app-scoped tests:
  2 goldens, 1 typography, 1 button-color regression guard, 9 widget)
- `bun run games:analyze -- --app sixty_second_heist` — pass, no issues
- `bun run games:test -- --app sixty_second_heist` — pass (13 app-scoped
  tests: 2 goldens, 1 typography, 1 button-color regression guard, 9
  widget)
- `bun run games:validate:strict` — pass
- `bun run games:build -- --app pocket_biome --platform android --mode debug --environment debug` — pass, built `app-debug.apk`
- `bun run games:build -- --app sixty_second_heist --platform android --mode debug --environment debug` — pass, built `app-debug.apk`
- Device check: NOT RUN (no device on this server; human checks at task 25).

`test/typography_test.dart` in each app walks every `RichText` in the live
widget tree (the fully-merged style Flutter actually paints with — see
`Text.build()`) and asserts every non-empty `TextSpan` resolves to one of
that app's two bundled font families, skipping `Icon`-produced spans
(`inherit: false`, MaterialIcons glyphs — expected and out of scope).
