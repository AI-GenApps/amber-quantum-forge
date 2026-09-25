# Task 04 evidence — custom fonts for Meme Court and Peeklings

Copies of the screen goldens produced by task
`tasks/epics/16-games-portfolio-wave2/04-fonts-meme-court-and-peeklings.md`.
The checked-in goldens (source of truth for `flutter test`) live under each
app's `test/goldens/screens/`; these are copies for review, viewed with the
Read tool during task execution.

All goldens are rendered headless at exactly 1080x2400 **physical** pixels
(`tester.view.physicalSize = Size(1080, 2400)`, `devicePixelRatio = 3`,
confirmed with `file`) with the apps' real bundled fonts, plus the Flutter
SDK's Material Icons font, loaded via each app's
`test/flutter_test_config.dart` (copied verbatim from task 03's pattern, with
each app's own font-family map). No device or emulator was used (none exists
on this server).

## Meme Court — Bangers (titles/verdict/chips only) + Lexend (body + buttons)

Bangers is a caps-only comic/poster face with no lowercase-specific
letterforms, so per the task's decision record it is wired only onto
`headlineMedium`/`titleLarge` (the app bar title, section titles, and the
"Verdict" banner) and the `CourtPill` chip label — never onto paragraph copy.
Lexend is the `ThemeData`-level default (every Material widget, including
button labels).

- `meme_court_home.png` — home screen at rest, captions not yet picked
  (`apps-native/games/meme_court/test/goldens/screens/home_screen_test.dart`).
  "Meme Court" (app bar), "Practice round"/"Build the docket" (chips),
  "Choose the room's opening line"/"Alice's pick"/"Bea's pick" (section
  titles) all render in Bangers; the prompt, caption tiles, and "0 of 2
  captions ready" render in Lexend. No tofu, no clipped text, no overflow.
- `meme_court_in_play.png` — verdict screen, after both players submit,
  freeze, vote, and reveal
  (`.../in_play_test.dart`). "Verdict" and "Alice's caption takes the bench"
  render in Bangers; the quoted caption and result copy render in Lexend.
  The docket-picking steps scroll the list to reach "Freeze the captions";
  since the verdict screen's content is much shorter, the test explicitly
  drags the `ListView` back to the top before capturing (a scroll offset
  left over from the earlier steps otherwise clips the top of the
  "Practice round"/"Verdict ready" chip row — caught by viewing the first
  golden render and fixed before this evidence was captured).

**FilledButton fontFamily fix.** `CourtDesign.theme()`'s
`FilledButtonThemeData` already set an explicit
`textStyle: TextStyle(fontWeight: FontWeight.w800)` (no `fontFamily`) for
the "Freeze the captions" button. A `FilledButton`'s resolved `textStyle`
becomes its child's ambient `DefaultTextStyle` outright — `Material.build()`
uses `widget.textStyle ?? theme.textTheme.bodyMedium!` directly, it does not
merge the two — so with `fontFamily` unset there, the label would have
silently fallen back to the platform default font regardless of the app's
`ThemeData(fontFamily: ...)`. Confirmed by reading the Flutter SDK source
(`button_style_button.dart`'s `resolve<TextStyle?>` picks the whole
`widgetStyle.textStyle` over the theme default, and `material.dart`'s
`Material.build()` sets that as the new `DefaultTextStyle` with no merge).
Fixed by wrapping it with `MemeCourtTypography.body(...)`, which sets
`fontFamily: Lexend` while preserving the existing bold weight — no visual
change to weight/layout, only the font now resolves correctly. This is
asserted directly by `test/typography_test.dart` (which pumps into the
verdict state, where "Freeze the captions" and friends are on screen) and by
the dedicated `test/button_colors_test.dart` regression guard (asserts the
resolved label color, not just its family).

## Peeklings (internal id `snapquest`) — Baloo 2 (headings) + Andika (body + buttons)

- `snapquest_home.png` — home screen at rest, first target ("red") active
  (`apps-native/games/snapquest/test/goldens/screens/home_screen_test.dart`).
  "Peeklings" (app bar), "Today's target" panel's "red", "Desk hunt",
  "Camera scan" section titles render in Baloo 2; body copy, chips, and
  button labels render in Andika. No tofu, no clipped text, no overflow.
- `snapquest_in_play.png` — after completing the first desk hunt (Emberling
  joins the album, second target "blue" now active)
  (`.../in_play_test.dart`). Same font pairing; also shows the "Your little
  collection" album panel.

**Glyph fallback (target/desk symbols).** The task flagged that Peeklings'
target glyphs (`●`, `◇`, `✦`) must still render even if Baloo 2/Andika lack
them. Verified with `fontTools` against each font's `cmap` table
(`TTFont(path).getBestCmap()`): **neither font contains U+25CF (●), U+25C7
(◇), or U+2726 (✦)**. Per the task's instruction, these are now drawn as
vector shapes instead of `Text` — `apps-native/games/snapquest/lib/snapquest_glyphs.dart`'s
`SnapGlyph` widget (`CustomPaint`: a filled circle, a stroked diamond, and an
8-vertex sparkle/star), wired into `SnapTargetCard` and `SnapObjectTile` in
`snapquest_cards.dart` in place of the old `Text(symbol, ...)`. Both goldens
show the three shapes rendering crisply (filled red circle, blue diamond
outline, gold 4-point sparkle) with no fallback tofu. This is asserted by
`test/typography_test.dart`'s dedicated test ("target and desk symbols fall
back to drawn SnapGlyph shapes, never text glyphs"), which counts the
`SnapGlyph` widgets on screen and confirms each shape kind is present, plus a
second assertion (`_expectNoRawGlyphText`) walking every live `RichText` and
failing if any of the three symbol characters ever appear as literal text.

## Verification

All commands below were run from the repo root with the environment prefix
from `tasks/epics/16-games-portfolio-wave2/STATUS.md`:

- `bun run games:format:check` — pass (one formatting fix applied to
  `in_play_test.dart`/`typography_test.dart` via `bun run games:format`
  first, then re-verified clean)
- `bun run games:analyze -- --app meme_court` — pass, no issues
- `bun run games:test -- --app meme_court` — pass (10 app-scoped tests: 2
  goldens, 2 typography, 1 button-color regression guard, 5 widget)
- `bun run games:analyze -- --app snapquest` — pass, no issues
- `bun run games:test -- --app snapquest` — pass (25 app-scoped tests: 2
  goldens, 3 typography incl. the glyph-fallback test, 1 button-color
  regression guard, 6 widget, 6 camera-capture-capability, 7
  camera-package-frame-source). Also independently re-run with
  `--concurrency=1` for a clean, non-interleaved log and with each test file
  run individually — same 25/25 pass count either way; the default-
  concurrency run's console occasionally reprints a stale test *name* next
  to a later `+N` counter (a cosmetic `flutter_tools` compact-reporter
  artifact under heavy file parallelism), but the pass/fail tally and every
  individual test's result are correct and match exactly across all three
  ways of running the suite.
- `bun run games:validate:strict` — pass
- `bun run games:build -- --app meme_court --platform android --mode debug --environment debug` — pass, built `app-debug.apk`
- `bun run games:build -- --app snapquest --platform android --mode debug --environment debug` — pass, built `app-debug.apk`
- Device check: NOT RUN (no device on this server; human checks at task 25).

`test/typography_test.dart` in each app walks every `RichText` in the live
widget tree (the fully-merged style Flutter actually paints with — see
`Text.build()`) and asserts every non-empty `TextSpan` resolves to one of
that app's two bundled font families, skipping `Icon`-produced spans
(`inherit: false`, MaterialIcons glyphs — expected and out of scope).

**Comparison against pre-task-04 device captures.** All four regenerated
goldens were viewed with the Read tool and compared side-by-side against
`docs-internal/gaming/evidence/visual/meme-court-final-relaunch.png`,
`meme-court-final-verdict.png`, `snapquest-final-primary-start.png`, and
`snapquest-final-primary-first-success.png` for label color/contrast,
layout, and chip/button/panel positions. All matched: same colors, same
layout, same button contrast (white-on-ink "Freeze the captions", dark-ink
"Try the camera"/desk tiles) — the only visible difference is the intended
font swap (system default → Bangers/Lexend, Baloo 2/Andika), plus
Peeklings' target/desk symbols now being crisp drawn vector shapes instead
of text glyphs (visually near-identical to the originals' Roboto-rendered
● ◇ ✦).

No `test/goldens/**/failures/` diff artifacts were produced by either app
(checked with `find ... -path "*failures*"` after every `flutter test` run).

## Round 2 — Peeklings pill/tile wrap regressions (orchestrator review)

Orchestrator review compared `snapquest_home.png` against
`docs-internal/gaming/evidence/visual/snapquest-final-primary-start.png` and
found two wrap regressions Andika's wider metrics introduced, both fixed and
re-verified before this evidence was recaptured:

- **Status pills wrapped to two rows.** "Desk or camera"/"0 hunts
  complete"/"0 in album" no longer fit one `Wrap` row at 360 logical width;
  "0 in album" dropped to a second row. **Measured, not guessed:** a
  throwaway probe test (not committed) used `RenderParagraph.
  computeMaxIntrinsicWidth` on the live widget tree to get the real
  Andika-bold-12 intrinsic widths (93.9 + 103.1 + 63.1 = 260.0px), against a
  320px available row width once the `SnapPill` padding (12px/side ×3) and
  `Wrap` spacing (8px ×2 gaps) are subtracted — a genuine ~28px deficit, not
  a sub-pixel rounding issue. Fixed in `lib/snapquest_theme.dart`'s
  `SnapPill`: horizontal padding 12→8px plus `letterSpacing: -0.2` (font
  size kept at 12px — the task's "don't go below ~12" floor). Re-measured
  after the fix: real widths drop to 87.6 + 95.9 + 58.6 = 242.0px, total row
  width 306px, comfortable ~14px margin under 320px.
- **Desk-hunt tile labels wrapped to two lines.** "Red pebble" and "Golden
  leaf" (but not the shorter "Blue shell") wrapped inside their ~66px-wide
  tile text column. **Measured:** the live `RenderParagraph`'s assigned box
  width (65.9px) was a hair narrower than its own max intrinsic content
  width (65.96px) — a sub-pixel-scale miss, not a large gap. Fixed in
  `lib/snapquest_cards.dart`'s `SnapObjectTile` by wrapping the label in
  `FittedBox(fit: BoxFit.scaleDown)` around a `softWrap: false` `Text` (the
  same pattern task 03 used for Sixty-Second Heist's title, and the
  approach the orchestrator review itself suggested) — self-correcting
  against any future font-metric drift instead of chasing another
  sub-pixel padding tweak. Re-measured after the fix: the tile text box
  reports height 16 (one line) for all three labels; "Blue shell" (which
  already fit) renders unscaled.

Both `snapquest_home.png` and `snapquest_in_play.png` were regenerated,
viewed with the Read tool, and now show all three pills on one row and all
three desk-tile labels on one line each, matching
`snapquest-final-primary-start.png`/`snapquest-final-primary-first-success.png`.
`meme_court_home.png`/`meme_court_in_play.png` were also re-viewed
specifically for the same risk — no analogous wraps found; every chip,
title, and button label still fits on one line/row as originally captured.

Re-ran for `snapquest` only (`meme_court` was untouched this round):
`bun run games:format:check` (pass), `bun run games:analyze -- --app
snapquest` (pass, no issues), `bun run games:test -- --app snapquest`
(pass, 25/25), `bun run games:validate:strict` (pass), `bun run games:build
-- --app snapquest --platform android --mode debug --environment debug`
(pass, built `app-debug.apk`). No `failures/` artifacts. The throwaway
measurement probe (`test/_probe_widths_test.dart`) was deleted before this
verification pass — it is not part of the app's test suite.
