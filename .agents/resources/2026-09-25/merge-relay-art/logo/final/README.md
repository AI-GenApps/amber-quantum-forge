# Glow Rescue — final logo + icon (task 22)

Final-quality renders of the icon and wordmark directions picked at task 21
(`tasks/epics/16-games-portfolio-wave2/decisions.md`: `mr_icon: A`
"hero glow tile", `mr_wordmark: B` "merge spark"), plus the Pillow
post-processing and composites that produced the in-app assets.

## Tool, model, and smoke test

- Tool: `~/.local/bin/image-gen` (wraps `codex exec`), model `gpt-6-luna`
  (default — not overridden to `gpt-6-astra`; both final renders came back
  on-brief on the first try, no regeneration needed).
- Smoke test (`smoke-test.png`, ~68s): a single 1254x1254 RGB glow-tile
  icon, on-brief, confirming the tool still works before spending on the
  two final renders below. Run from a scratch temp dir (never the repo),
  `git status --porcelain` checked clean immediately after every
  generation — no stray files landed in the repo this run.

## Final renders

Both prompts reference their task 19/21-picked master by absolute path
("match the exact style... as closely as possible... this is the approved
direction, being re-rendered at final polish") to carry the chosen style
over exactly, per the epic's logo process (skill reference
`07-brand-name-logo.md`, step 4).

| File | Prompt | Result |
|---|---|---|
| `icon-raw.png` | "Final production-quality app icon, 1:1 square, for a premium casual mobile puzzle game called Glow Rescue. Match the exact style, palette, and composition of the reference image at `.../logo/A-hero-glow/icon.png` as closely as possible (this is the approved direction, being re-rendered at final polish): a single friendly rounded-square tile character, face-forward, warm golden-orange to yellow gradient glossy body, soft warm glow aura around it, simple minimal cute face (closed happy eyes, small smile, rosy cheeks), thick rounded darker-orange outline, warm cream background, no text, no watermark, crisp clean edges, reads clearly at small sizes like 48px, original character design" | RGB, 1254x1254, on-brief first try. Corner color `(253, 249, 232)` — near-identical to `MrTokens.paper` (`#FFF7EA`), so it blends almost seamlessly into the app's own background wherever it's composited. |
| `wordmark-raw.png` | "Final production-quality wordmark logotype graphic reading exactly 'Glow Rescue' (two words, capital G and R, rest lowercase). Match the exact style, palette, letterforms, and spark accent of the reference image at `.../logo/B-merge-spark/wordmark.png` as closely as possible (this is the approved direction, being re-rendered at final polish): bold rounded friendly display typeface, warm golden-yellow to orange gradient fill, thin dark-navy outline around the letters, a small bright four-point spark/flash icon placed between the two words, on a fully transparent background (PNG with alpha), flat vector illustration, clean crisp edges, premium casual mobile game branding, no other text, no watermark" | RGBA, 2172x724, real alpha (0-255) direct from the generator — no chroma-keying needed. Spelling verified as exactly "Glow Rescue" by eye. |

## Post-processing (Pillow, `/data/tools/pyenv/bin/python`)

1. **`icon.png`**: `icon-raw.png` resized to exactly 1024x1024 (LANCZOS).
   Kept as a full-bleed opaque square (matching how real premium app icons
   ship, and task 19's own note on this) — no alpha needed. This is the
   file embedded (base64) into `assets/branding/icon.svg` for the launcher
   icons.
2. **`wordmark.png`**: `wordmark-raw.png` cropped to its opaque alpha
   bounding box + 14px margin, then eroded 1px and de-fringed (a
   blur-based edge-color pull-in under semi-transparent pixels, keeping
   fully-opaque interior pixels untouched) to remove any generator-edge
   fringe. Verified with Pillow: alpha ranges 0-254 (a real, non-degenerate
   alpha channel). `wordmark_check.png` composites it over a checkerboard
   — no visible fringe on any letterform or the spark accent.
3. **`logo_stacked.png`**: a pure Pillow composition (no further AI
   generation) of `icon_transparent.png` (see fix round 2 below) +
   `wordmark.png` onto a transparent canvas, icon-over-wordmark,
   downscaled to ≤1024px on its longest side. Copied into the app as
   `assets/art/logoStacked.png` (224 KB, well under the 600 KB in-app
   budget).
   `logo_wide.png` was **originally** the same composite but
   side-by-side (icon + wordmark); **fix round 1** (orchestrator review)
   replaced it with just the cleaned `wordmark.png` resized (≤1024px, no
   compositing) — the review asked to drop the small tile icon from the
   header lockup since the header already reads the wordmark as the brand
   element and the icon made it look cramped at the corrected, bigger
   size. `assets/art/logoWide.png` is now 140 KB. Full provenance in
   `apps-native/games/merge_relay/assets/art/LICENSES.md`.
4. **`sheet.png`**: a review sheet on the app's own paper background
   (`MrTokens.paper`, `#FFF7EA`) showing the icon, wordmark, wide lockup,
   and stacked lockup together.

## Integration summary (see the task's commit for the full diff)

- Launcher icons: `icon.png` embedded (base64 `<image>`) into
  `apps-native/games/merge_relay/assets/branding/icon.svg` (background
  rect `#fdf9e8`, matching the icon's own corner color), then
  `bun run games:icons -- --app merge_relay` regenerated every Android
  (legacy + adaptive, safe-zone-respecting foreground layer) and iOS
  density; `bun run games:icons:check` passes.
- In-app: `MergeRelayArtManifest.logoWide`/`logoStacked` (already-existing
  manifest slots from task 07) now resolve to the two bitmaps above
  instead of always falling to the code-drawn text fallback. Both slots
  switched from `BoxFit.cover` to `BoxFit.contain` (a small, necessary
  manifest change) so a lockup is never cropped. The welcome screen
  (previously a literal `'GLOW\nRESCUE'` `Text` widget) now calls
  `MergeRelayArtManifest.logoStacked()`; the home header already called
  `logoWide()` since task 11.
- **Real bug found and fixed**: `AssetImage`'s real, file-backed decode
  happens on a background isolate that a plain `tester.pump()` never waits
  for, no matter how many times it's called — the first golden run after
  wiring the bitmaps in showed a completely blank header (no bitmap *and*
  no fallback text, since decoding was merely pending, not failed). Fixed
  by precaching both logo assets (awaiting their real decode `Future`
  directly, proven fast — tens of milliseconds — in this investigation)
  inside `tester.runAsync()` before every golden boots the app, in
  `test/goldens/screens_test.dart` and `test/widget_test.dart`.
- Goldens updated: `welcome.png`, `home.png`, `home_small.png`,
  `settings.png` (the last only differs by ~1% — the dimmed home-screen
  backdrop behind the settings sheet now shows the bitmap header). All 13
  golden tests and the full 255-test `merge_relay` suite pass.

## Fix round 1 (orchestrator review — sizing)

The first pass's lockups were positioned correctly but sized much too
small: the header's `logoWide` reached only ~1/3 of its own width, and the
welcome `logoStacked` read as a small badge in an otherwise empty upper
area. Root cause: both were driven by a fixed *height* (34dp header /
150dp welcome), so `BoxFit.contain` shrank each to whatever tiny width
(header) or unbalanced size (welcome) that height implied, instead of the
other way around. Fixed in `lib/src/merge_relay_home_art.dart` and
`lib/src/screens/merge_relay_welcome.dart` by deriving an explicit target
*width* instead (60% of the header's own width; 65% of the welcome
screen's full width) and letting height follow from each bitmap's own
aspect ratio — verified against the real `RenderBox` size (not
pixel-color scanning, which undercounts soft/anti-aliased edges): header
192.0x53.3dp (60.0% of a 320dp content width, identical at both
1080x2400/DPR3 and 360x640/DPR1 — no clipping), welcome 202.8x201.5dp
(65.0% of `outer.maxWidth`). `logoWide.png` also dropped its icon (now
wordmark-only) per the review's note that the small tile made the bigger
header lockup look cramped. Flat empty bands on the welcome golden stayed
well under the 25% failure threshold (largest: 12.3%) after the resize.

This also surfaced a below-the-fold test bug unrelated to the golden
harness: six non-golden test files' `tester.tap(find.text('Play rescue'))`
/ `"Let's play"` calls stopped hitting those buttons on the default
800x600 `flutter test` window once the taller logos pushed them past
y=600 — fixed with `tester.ensureVisible(...)` before each affected tap
(the same idiom the codebase already used for "Replay tutorial").

## Fix round 2 (orchestrator review — icon background not transparent)

The icon master (`icon.png`) is opaque RGB — correct for the launcher icon,
but `logo_stacked.png` composited it straight in at full alpha (=255)
without removing that flat cream background, so `welcome.png` showed a
visible pale square behind the glowing tile against the app's own,
slightly different dotted-paper background.

**Fix**: key the background out of a *separate* `icon_transparent.png`
(masters folder only; `icon.png` itself is untouched and stays opaque —
correct for the launcher icon per the review) with a soft,
distance-from-background threshold (fully transparent within 10 units of
the sampled corner color, fully opaque past 55 units, linearly
interpolated in between), so the tile's own soft glow — a gradient from
cream into orange — fades out as smooth partial alpha instead of leaving a
hard-edged cutout ring. `logo_stacked.png` was rebuilt from this
transparent icon + the existing `wordmark.png`, same layout as before.
`assets/art/logoStacked.png` was updated in place (still 224 KB).

Script output (`/data/tools/pyenv/bin/python`, run from a scratch temp
dir):

```
sampled background (252.5, 248.5, 232.0)
icon_transparent.png (1024, 1024) alpha extrema (0, 255)
corner alpha samples: [0, 0, 0, 0]
center alpha: 255
logo_stacked.png (610, 606) 223.04 KB
logo_stacked.png corner alpha: [0, 0, 0, 0]
ring-around-icon alpha samples: [((111, 210), 0), ((499, 210), 0), ((305, 16), 0)]
```

Re-verified directly against the shipped in-app file
(`apps-native/games/merge_relay/assets/art/logoStacked.png`):

```
mode RGBA size (610, 606)
corner alpha: [0, 0, 0, 0]
left-of-icon alpha (x=2..10): [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
top-of-icon alpha (y=2..10): [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
alpha extrema: (0, 255)
```

The same check is now also asserted at the Dart level — real decode,
real shipped asset, not a fake bundle — in
`test/merge_relay_art_manifest_test.dart`'s new group `logoStacked.png
background alpha (task 22 fix round 2)`: it decodes
`assets/art/logoStacked.png` via `rootBundle`/`dart:ui`, and checks the
four canvas corners plus a strip left of the icon are alpha `0` while the
tile's own interior (same row) is alpha `255` — proving a real soft
key-out, not an accidentally all-transparent image.

`welcome.png` was regenerated and viewed: the tile's glow now fades
directly into the screen's own dotted paper background with no visible
box or seam at any zoom level.
