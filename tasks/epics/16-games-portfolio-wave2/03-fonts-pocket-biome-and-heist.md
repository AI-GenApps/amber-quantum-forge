---
epic: 16-games-portfolio-wave2
task: 03-fonts-pocket-biome-and-heist
status: completed
commit_scope: games
depends_on: [16-games-portfolio-wave2/02-server-toolchain-verification]
estimate: M
owner: agent
---

# Custom fonts: Pocket Biome and Sixty-Second Heist

## Goal

Bundle the chosen OFL fonts in both apps and route **every** text surface
through them: Material `Text`, buttons, chips, and Flame `TextPaint`/canvas
labels. Prove it with goldens that load the real fonts.

## Context / Decisions

- Fonts (STATUS.md): **pocket_biome** display **Fraunces** (variable;
  set the `SOFT` axis to 100 through `FontVariation` wherever it's used for
  headings), body **Quicksand**. **sixty_second_heist** display **Bungee**,
  body **Chakra Petch** (Regular, Medium, SemiBold, Bold).
- Download sources are
  `https://github.com/google/fonts/raw/main/ofl/<family>/<file>`, for
  example `ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf`,
  `ofl/quicksand/Quicksand[wght].ttf`, `ofl/bungee/Bungee-Regular.ttf`,
  `ofl/chakrapetch/ChakraPetch-*.ttf`. Save them as
  `assets/fonts/<Family>/<file>` with the file renamed to drop the
  brackets (e.g. `Fraunces-Variable.ttf`), and include `OFL.txt`.
- Pattern to copy (read only; Ludo is frozen):
  `apps-native/games/ludo/pubspec.yaml` `fonts:` block and
  `apps-native/games/ludo/test/flutter_test_config.dart`.
- The app theme is built in each app's `lib/src/*_ui.dart` or `*_app.dart`.
  Set `ThemeData.fontFamily` to the body font and a `TextTheme` with the
  display font for `display*`, `headline*`, and `title*` styles. Replace
  any hard-coded `TextStyle` that bypasses the theme.
- Flame labels (e.g. Heist's `LOOT`/`EXIT` board labels) must pass
  `fontFamily` explicitly; Flame does not inherit the Material theme.
- **Gameplay, layout logic, and copy must not change.** Only text styling
  changes; small size or letter-spacing tweaks to avoid overflow are
  allowed.

## Implementation Checklist

- [x] Add the font files and `OFL.txt` files; register the families in each
      app's `pubspec.yaml`.
- [x] Add a theme typography file per app (e.g.
      `lib/src/pocket_biome_typography.dart`,
      `lib/src/heist_typography.dart`) and wire it into the `MaterialApp`
      theme.
- [x] Update Flame/canvas text to use the bundled families.
- [x] Add `test/flutter_test_config.dart` per app that loads the bundled
      fonts, plus Roboto from Flutter's `material_fonts` cache as a
      fallback only if a test needs it.
- [x] Add `test/goldens/screens/home.png` and one in-play golden per app
      (1080×2400 via `tester.view.physicalSize = Size(1080, 2400)` and
      `devicePixelRatio = 3`), plus `test/typography_test.dart`, which
      walks the widget tree and asserts that every `Text`/`RichText` resolves
      to a bundled family.
- [x] Copy the new goldens to
      `.agents/resources/2026-09-25/games-wave2-qa/03/` and VIEW them.

## Files Touched

- `apps-native/games/pocket_biome/{pubspec.yaml,assets/fonts/**,lib/src/**,test/**}`
- `apps-native/games/sixty_second_heist/{pubspec.yaml,assets/fonts/**,lib/src/**,test/**}`

## Acceptance Criteria

- `typography_test.dart` passes in both apps. It fails if any rendered text
  resolves to a family not bundled by that app.
- Goldens show the real glyphs (no tofu boxes), with no clipped text and
  no overflow stripes (the verifier views them).
- Every existing test still passes. Test counts are ≥ the task 02 baseline.
- The `OFL.txt` file is present beside every font file.

## Verification Commands

- `bun run games:format:check`
- `bun run games:analyze -- --app pocket_biome`
- `bun run games:test -- --app pocket_biome`
- `bun run games:analyze -- --app sixty_second_heist`
- `bun run games:test -- --app sixty_second_heist`
- `bun run games:validate:strict`
- `bun run games:build -- --app pocket_biome --platform android --mode debug --environment debug`
- `bun run games:build -- --app sixty_second_heist --platform android --mode debug --environment debug`
- Device check: NOT RUN (no device); the human checks this in task 25.

## Out of Scope

- Colour, layout, art, rename, or gameplay changes.

## Commit message

`feat(games): bundle custom fonts for Pocket Biome and Sixty-Second Heist [16-games-portfolio-wave2/03]`
