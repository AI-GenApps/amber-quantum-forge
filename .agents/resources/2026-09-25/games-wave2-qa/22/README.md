# Task 22 QA evidence — Glow Rescue final logo/icon + integration

Copies of the goldens and launcher-icon renders a human verifier can check
without running Flutter. Art masters, prompts, and full post-processing
notes live at `.agents/resources/2026-09-25/merge-relay-art/logo/final/`.

## Goldens (`goldens/`)

Rendered by `flutter test test/goldens/screens_test.dart` (1080x2400
physical, DPR 3, except `home_small.png` at 360x640 physical DPR 1), real
bundled fonts loaded via `test/flutter_test_config.dart`. All 13 tests in
this file pass.

**Fix round 1 (orchestrator review):** the first pass's logo lockups were
correctly *positioned* but sized far too small (the header's `logoWide`
only reached ~1/3 of its own width, and the welcome `logoStacked` read as
a small badge) — both were accidentally driven by a fixed *height*
constraint (34dp / 150dp) rather than width, so `BoxFit.contain` shrank
them to whatever that tiny height implied. This round re-derives both from
an explicit target *width* instead (the height then follows from each
bitmap's own aspect ratio):

- `home.png` / `home_small.png` — the header's `logoWide` (now
  wordmark-only; the small tile icon was dropped from this lockup per the
  review, since the wide lockup already carried it and it made the header
  read cramped) is sized to 60% of the header's own width. Measured via
  the real `RenderBox` (not pixel-color scanning, which undercounts soft
  edges): **192.0 x 53.3dp** at physical 1080x2400/DPR3 (content width
  320dp → 60.0%) and identically 192.0 x 53.3dp at physical 360x640/DPR1
  (same logical layout, confirming no clipping at the small size). The
  settings button sits 80dp clear of the wordmark's right edge in both —
  no collision.
- `welcome.png` — the stacked `logoStacked` (icon-over-wordmark, unchanged
  composite) is sized to 65% of the *full* screen width (not the narrower
  padded content width — the review asked for "60-70% of the screen
  width"): **202.8 x 201.5dp** at a 360dp-wide screen (=56.3% of the full
  1080px-physical golden, 65% of its own `outer.maxWidth`). It now reads
  as the hero. Flat empty bands re-measured after the resize (row-scan for
  paper/dot-only bands ≥20px tall): the largest is 296px of 2400px
  (**12.3%**), well under the 25% failure threshold; next-largest is
  169px (7.0%).
- `settings.png` — the sheet's own content is unchanged; only the dimmed
  home-screen backdrop behind it shows the bigger bitmap header.

**Fix round 2 (orchestrator review):** `welcome.png` showed a visible pale
square behind the glowing tile — the icon master is opaque RGB (correct
for the launcher icon), but `logoStacked.png` had composited it straight
in at full alpha without removing that flat cream background. Fixed by
building a separate `icon_transparent.png` master (key-out with a soft,
distance-from-background threshold — fully transparent within 10 units of
the sampled corner color, fully opaque past 55, interpolated between —
so the tile's own soft glow keeps smooth partial alpha instead of a
hard-edged ring) and rebuilding `logo_stacked.png`/`assets/art/logoStacked.png`
from it. `icon.png` itself (used for the launcher icon) is untouched and
stays opaque, as it should. Verified with Pillow (corners and a strip
around the icon are alpha 0; the tile's own interior still reaches alpha
255 — full script output in the masters README) and with a new Dart test,
`test/merge_relay_art_manifest_test.dart`'s "logoStacked.png background
alpha" group, which decodes the real shipped asset and checks the same
thing. `welcome.png` was regenerated and viewed at full size and zoomed
into the icon's edges — no visible box or seam against the dotted paper
background at any zoom level; `home.png`/`home_small.png`/`settings.png`
are byte-identical to fix round 1 (they don't use `logoStacked`).

A real bug surfaced and was fixed during this task's *first* pass (before
this review): `AssetImage`'s real decode happens on a background isolate
that plain `tester.pump()` never waits for, so goldens captured the header
completely blank until the two logo assets were explicitly precached
(awaiting their real decode `Future`) inside `tester.runAsync` before each
boot — see `test/goldens/screens_test.dart`'s `_precacheAssetImage` doc
comment. This round additionally found and fixed the same underlying
"below the fold of the default 600-tall `flutter test` surface" issue in
six *non-golden* test files (`widget_test.dart`,
`merge_relay_onboarding_test.dart`, `typography_test.dart`,
`solo_v1_scope_test.dart`, `merge_relay_pgs_ui_test.dart`) whose
`tester.tap(find.text('Play rescue'))` / `"Let's play"` calls stopped
hitting those buttons once the taller header/hero logo pushed them past
y=600 on that non-portrait default test window — fixed with
`tester.ensureVisible(...)` before each affected tap, the same idiom this
codebase already used for the Settings sheet's "Replay tutorial".

## Launcher icons (`launcher-icons/`)

Rendered by `bun run games:icons -- --app merge_relay` from the final
`icon.png` embedded (base64) into
`apps-native/games/merge_relay/assets/branding/icon.svg`.
`bun run games:icons:check` passes (every density exists and matches).

- `android/ic_launcher-*.png`: the 5 legacy mipmap densities (mdpi 48px
  through xxxhdpi 192px) — reads clearly even at the smallest (48px) size.
- `android/ic_launcher_foreground-432.png`: the adaptive-icon foreground
  layer. The motif (the full opaque icon, matching how Ludo's own
  foreground layer works) is scaled to 66% of the 432px canvas, centered —
  inside the adaptive-icon safe zone.
- `ios/Icon-App-1024x1024@1x.png` and `Icon-App-60x60@3x-180.png`: the
  App Store marketing icon and the largest iPhone home-screen size.

## Verification commands run for this task

All passed; see the task file's Verification Commands section and the
implementer's final report for full output.

- `bun run games:icons -- --app merge_relay`
- `bun run games:icons:check`
- `du -k apps-native/games/merge_relay/assets/art/*.png` — `logoWide.png`
  140 KB (wordmark-only as of fix round 1, down from 188 KB), `logoStacked.png`
  224 KB (rebuilt with a transparent icon in fix round 2, same size;
  budget: < 600 KB each).
- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay` — 256 tests pass (was 255
  after fix round 1; +1 for fix round 2's new `logoStacked.png` background
  alpha test), stable across repeated full-suite runs.
- `bun run games:validate:strict`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`
