# Task 23 — Merge Relay final art set, evidence

## What this task did

Rendered art direction B ("glossy painted/3D-toy", `mr_art_direction: B` in
`decisions.md`) at final production quality for every slot the task calls
for, integrated it through the manifest bindings from task 07, and
extended the manifest with a new `chapterCard_<1-6>` slot family for the
Rescue chapter map. Numerals stay code-drawn on top of the bitmap art in
every case.

- 12 tile-tier cards (`tileFace_2.png` .. `tileFace_4096.png`) — full
  "card + face" renders (not just a floating face icon): the character
  sits in the upper ~40% and the lower ~55% is a plain surface in the same
  solid colour, matching `MrTokens.tileTierColors` exactly, for the
  numeral's contrast to hold.
- `homeScene.png` — the dawn-harbor hero banner.
- `boardFrame.png` — the board's cream tray texture, filling its frame
  edge to edge (no crop needed this time, unlike the task 20 dry run).
- `chapterCard_1.png` .. `chapterCard_6.png` — one themed vignette per
  Rescue chapter (Harbor / Foundry / Orchard / Bazaar / Glacier /
  Observatory), shown as a small 28x28 thumbnail on each chapter's card
  header.

All 20 generations were on-brief on the first try — no regenerations were
needed. Full prompts, tool/model/date per file, and post-processing notes
are in `apps-native/games/merge_relay/assets/art/LICENSES.md` (masters at
`.agents/resources/2026-09-25/merge-relay-art/set-1/final/raw/`).

## Integration

- `MrBitmapArtCache` (new, `lib/src/assets/mr_bitmap_art_cache.dart`)
  decodes the tile-tier and board-frame bitmaps ahead of time (a raw
  `CustomPainter.paint` can't await an asset decode mid-frame) and is read
  synchronously by `MergeRelayBoardArt.paintTile`/`paintBoardTray`. A
  tier/frame with no bundled file falls back to the existing procedural
  paint, unchanged. `highContrast` always keeps the procedural card (its
  firm ink outline is the mode's whole point).
- `homeScene`/`chapterCard` are plain widget-level `Image(AssetImage(...))`
  slots (like `logoWide`/`logoStacked` since task 22), so they "just work"
  once bundled — no cache needed there.
- The chapter map (`MergeRelayChapterCard`) now shows each chapter's
  `chapterCard_<n>.png` as a small rounded thumbnail beside its title — a
  fixed-size avatar, not a banner, so every card's height stays exactly
  what task 11 tuned it to (six chapters still fit the 1080x2400 golden).

## Evidence in this folder

- `goldens/screens/*.png` — every screen golden, regenerated with the
  final art bundled (`flutter test --update-goldens`).
- `goldens/tiles/tier_sheet.png` — all 12 named tiers + the 8192
  generic-fallback proof + two empty wells.
- `contact-sheet-after.png` — the Threes! anchor, the audit's "before"
  Home/Play renders, and the new Home/Play/Chapter-map/Tier-sheet goldens,
  side by side.
- `budgets.md` — the re-measured arm64 release APK size (27.1 MB, under
  the 40 MB budget).

## What the verifier should check

- `goldens/tiles/tier_sheet.png`: every tier's face sits above its numeral
  with a visible gap (no overlap), colours match the 12-step palette, and
  8192 correctly reuses tier 11's (4096's) art rather than looking
  undefined.
- `goldens/screens/home.png`: the hero banner shows the real illustrated
  scene (three character tiles over a sunset harbor), not the old
  gradient+stacked-tile-icon placeholder.
- `goldens/screens/chapter_map.png`: all six chapters show a distinct
  themed thumbnail; the layout still fits the frame with no overflow.
- `goldens/screens/play_rescue.png` / `play_endless.png`: the board tray
  shows the cream board-frame art, and occupied tiles show the bitmap
  card+face with the numeral legible on top.
- `contact-sheet-after.png`: the illustrated look reads as Threes!-grade
  next to the anchor and a clear step up from the "before" renders.
