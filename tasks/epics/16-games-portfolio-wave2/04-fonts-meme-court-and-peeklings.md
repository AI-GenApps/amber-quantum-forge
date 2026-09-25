---
epic: 16-games-portfolio-wave2
task: 04-fonts-meme-court-and-peeklings
status: pending
commit_scope: games
depends_on: [16-games-portfolio-wave2/03-fonts-pocket-biome-and-heist]
estimate: M
owner: agent
---

# Custom fonts: Meme Court and Peeklings

## Goal

Apply the task 03 approach to `meme_court` and `snapquest` (public title
Peeklings): bundled OFL fonts on every text surface, proven by goldens and a
typography test.

## Context / Decisions

- Fonts (STATUS.md): **meme_court** display **Bangers** (a caps-only comic
  face, so use it only for titles, the verdict banner and chips, never for
  paragraphs), body **Lexend** (variable). **snapquest** display
  **Baloo 2** (variable), body **Andika** (Regular/Bold/Italic/BoldItalic).
- Download sources are `ofl/bangers/Bangers-Regular.ttf`,
  `ofl/lexend/Lexend[wght].ttf`, `ofl/baloo2/Baloo2[wght].ttf`, and
  `ofl/andika/Andika-*.ttf` in `github.com/google/fonts` (raw), each with
  its `OFL.txt`. Rename files to drop the brackets.
- Reuse the structure, test names, and golden sizes that task 03 created, so
  the four apps stay consistent.
- Peeklings' target glyphs (`●`, `◇`, `✦`) must still render. If Andika or
  Baloo 2 lacks them, draw the shapes with an `Icon`/`CustomPaint` instead
  of falling back to a system font, and assert this in a test.
- **Gameplay, layout logic, and copy must not change.**

## Implementation Checklist

- [ ] Add the fonts and `OFL.txt` files, and register them in both pubspecs.
- [ ] Add a typography file per app and wire it into the theme.
      Update any Flame or canvas text.
- [ ] Add `test/flutter_test_config.dart`, `test/typography_test.dart`, and
      `test/goldens/screens/{home,in-play}.png` per app, at 1080×2400.
- [ ] Handle the Peeklings glyph fallback as described above.
- [ ] Copy the goldens to `.agents/resources/2026-09-25/games-wave2-qa/04/`
      and VIEW them.

## Files Touched

- `apps-native/games/meme_court/{pubspec.yaml,assets/fonts/**,lib/**,test/**}`
- `apps-native/games/snapquest/{pubspec.yaml,assets/fonts/**,lib/**,test/**}`

## Acceptance Criteria

- `typography_test.dart` passes in both apps.
- Goldens show the real glyphs, including the Peeklings target symbols,
  with no tofu, clipping, or overflow.
- Existing tests pass. Counts are ≥ the task 02 baseline.

## Verification Commands

- `bun run games:format:check`
- `bun run games:analyze -- --app meme_court`
- `bun run games:test -- --app meme_court`
- `bun run games:analyze -- --app snapquest`
- `bun run games:test -- --app snapquest`
- `bun run games:validate:strict`
- `bun run games:build -- --app meme_court --platform android --mode debug --environment debug`
- `bun run games:build -- --app snapquest --platform android --mode debug --environment debug`
- Device check: NOT RUN (no device).

## Out of Scope

- Any other visual or gameplay change. Renaming SnapQuest's internal id.

## Commit message

`feat(games): bundle custom fonts for Meme Court and Peeklings [16-games-portfolio-wave2/04]`
