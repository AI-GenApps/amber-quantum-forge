# Task 06 - art integration evidence

Date: 2026-10-23. Input (read-only): `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/floodplain-dispatch/`, folder `accepted/`
and the review notes of the designer loop. Only slots with an accepted verdict (recorded in `verdicts.json`, each verdict
quoted from a review note copied to `../art/review/`) were converted; nothing else was read into the repo. Designer
batches: b1 (icon, key-art, house-cottage, pump), b2 (eleven objects), b3 (four backdrops, feature graphic), retry (key-art).

Nobody looked at the images (no visual QA). The designer loop's reviews are the quality gate; this task only runs
automated checks (dimensions, alpha, coverage, bytes).

## Per-slot decisions

| Slot | Decision | Designer batch, round | Verdict quoted | Runtime | Master |
|---|---|---|---|---|---|
| `icon` | master only (store asset) | b1 round 4 | `## icon - ACCEPTED` | - | `art/masters/icon.webp` 1024x1024, 73,996 B |
| `key-art` | rejected, placeholder kept | retry round 3 | `## key-art: REJECTED (final round, stays rejected)` | - | - |
| `house-cottage` | integrated | b1 round 1 | `## house-cottage: ACCEPTED` | `/art/house-cottage.webp` 192x192, 5,826 B, q82 | `art/masters/house-cottage.webp` 1024x1024, 87,116 B |
| `pump` | integrated | b1 round 2 | `## pump: ACCEPTED` | `/art/pump.webp` 192x192, 6,640 B, q82 | `art/masters/pump.webp` 1024x1024, 72,404 B |
| `house-townhouse` | integrated | b2 round 1 | `- house-townhouse: ACCEPT` | `/art/house-townhouse.webp` 192x192, 5,832 B, q82 | `art/masters/house-townhouse.webp` 1024x1024, 68,768 B |
| `house-mill` | integrated | b2 round 1 | `- house-mill: ACCEPT` | `/art/house-mill.webp` 192x192, 6,676 B, q82 | `art/masters/house-mill.webp` 1024x1024, 79,080 B |
| `house-barn` | integrated | b2 round 1 | `- house-barn: ACCEPT` | `/art/house-barn.webp` 192x192, 5,730 B, q82 | `art/masters/house-barn.webp` 1024x1024, 72,830 B |
| `house-school` | integrated | b2 round 1 | `- house-school: ACCEPT` | `/art/house-school.webp` 192x192, 5,868 B, q82 | `art/masters/house-school.webp` 1024x1024, 71,674 B |
| `reservoir` | integrated | b2 round 1 | `- reservoir: ACCEPT` | `/art/reservoir.webp` 192x192, 5,948 B, q82 | `art/masters/reservoir.webp` 1024x1024, 62,904 B |
| `sluice-gate` | integrated | b2 round 1 | `- sluice-gate: ACCEPT` | `/art/sluice-gate.webp` 192x192, 7,086 B, q82 | `art/masters/sluice-gate.webp` 1024x1024, 80,340 B |
| `sandbag-barrier` | integrated | b2 round 1 | `- sandbag-barrier: ACCEPT` | `/art/sandbag-barrier.webp` 192x192, 5,700 B, q82 | `art/masters/sandbag-barrier.webp` 1024x1024, 65,828 B |
| `windmill` | integrated | b2 round 1 | `- windmill: ACCEPT` | `/art/windmill.webp` 192x192, 10,682 B, q82 | `art/masters/windmill.webp` 1024x1024, 106,178 B |
| `tree-oak` | integrated | b2 round 1 | `- tree-oak: ACCEPT` | `/art/tree-oak.webp` 192x192, 7,780 B, q82 | `art/masters/tree-oak.webp` 1024x1024, 77,910 B |
| `tree-poplar` | integrated | b2 round 1 | `- tree-poplar: ACCEPT` | `/art/tree-poplar.webp` 192x192, 4,354 B, q82 | `art/masters/tree-poplar.webp` 1024x1024, 38,594 B |
| `tree-willow` | integrated | b2 round 1 | `- tree-willow: ACCEPT` | `/art/tree-willow.webp` 192x192, 8,810 B, q82 | `art/masters/tree-willow.webp` 1024x1024, 89,780 B |
| `backdrop-valley` | integrated | b3 round 2 | `## backdrop-valley - ACCEPTED` | `/art/backdrop-valley.webp` 800x1200, 13,586 B, q82 | `art/masters/backdrop-valley.webp` 1024x1536, 44,600 B |
| `backdrop-delta` | integrated | b3 round 3 | `## backdrop-delta: ACCEPTED` | `/art/backdrop-delta.webp` 800x1200, 14,118 B, q82 | `art/masters/backdrop-delta.webp` 1024x1536, 38,548 B |
| `backdrop-highland` | integrated | b3 round 2 | `## backdrop-highland - ACCEPTED` | `/art/backdrop-highland.webp` 800x1200, 24,536 B, q82 | `art/masters/backdrop-highland.webp` 1024x1536, 66,748 B |
| `backdrop-estuary` | integrated | b3 round 3 | `## backdrop-estuary: ACCEPTED` | `/art/backdrop-estuary.webp` 800x1200, 14,414 B, q82 | `art/masters/backdrop-estuary.webp` 1024x1536, 41,848 B |
| `feature-graphic` | master only (store asset) | b3 round 2 | `## feature-graphic - ACCEPTED` | - | `art/masters/feature-graphic.webp` 1536x1024, 147,146 B |

Runtime art total: 153,586 bytes in 17 files (budget 8,000,000). The designer inbox manifest has no thread message ids;
batch and round come from `../art/designer-manifest.json`.

## Final status of rejected and undelivered slots

- `key-art`: REJECTED in the final round (retry round 3). Technical checks pass, but canal feeders end in blunt rounded
  water caps at the plot edge, the fork reads as a pitchfork with an enclosed lens-shaped island and a near right-angle T
  at the river, the water reads as a plastic tube, fields are flat stickers with a straight-cut fringed right edge, the left
  river end is a scalloped paw that does not match the right end, the slab right rim has a dashed stair-step edge, and the
  slab is flat against the 3/4 sprites. It stays rejected; the title screen keeps its code-drawn placeholder. No
  `key-art` file is committed (no master, no runtime file).
- No slot is missing: all 20 have either an accepted verdict or the rejection above.

## Tool and commands

```
cd apps-games/floodplain-dispatch
bun run build:art            # = bun run scripts/build-art.ts [--inbox <path>]
```

`scripts/build-art.ts` (sharp 0.35.3): reads `accepted/manifest.json`, requires an accepted verdict per slot whose quoted
line exists in the copied review note and whose batch and round equal the designer manifest, then per slot

1. master: original pixels as WebP quality 90 (alpha quality 100, effort 6), alpha dropped for opaque slots;
2. runtime (bundle slots only): lanczos3 resize to 192 x 192 (sprites) or 800 x 1200 (backdrops), WebP quality 82 (ladder
   82, 78, 74, 70, 66 until under the size cap; every file passed at 82), alpha quality 100;
3. checks from `scripts/art-lib.ts` on master and runtime, all collected before anything is written; any violation prints the
   slot id and exits 1 with no file written;
4. writes masters, runtime files, `06/provenance.json`, the generated block in `src/art/manifest.ts` and the provenance table
   in `.agents/games/floodplain-dispatch/assets-index.md`. Deterministic: a second run leaves no diff.

Checks: format webp, no animation, no EXIF, exact aspect (1:1, 2:3 or 3:2), exact runtime size, masters not smaller than the
runtime size; sprites: alpha channel, four corners alpha 0, outer 3 percent border alpha 0, opaque (alpha >= 128) coverage
25 to 90 percent (poplar minimum 10 percent and sandbag barrier 24 percent, reasons in `decisions-log.md`), bounding box
(alpha >= 16) at most 85 percent of the frame in each dimension; opaque slots: every pixel alpha 255; at most 250,000 bytes
per sprite, 400,000 per 800 x 1200 file, 8,000,000 total. `test/art-assets.test.ts` re-runs them on the committed files.

## Integration in the game

- `src/art/manifest.ts`: generated `ART_ENTRIES` (slot, url, pixel size); `ART_MANIFEST` derives from it. Store slots and the
  rejected slot are not in it.
- Canvas: `createPreload({ images })` keeps each decoded `Image` by slot id, `app.images` feeds `drawSprite` (already built
  for it), so board houses, pieces, trees and the windmill use the art; `Sprite` renders `<img>` in the tray.
- `src/art/Backdrop.tsx`: region backdrop behind the board screen (fallback: palette gradient), scrim, high-contrast plain mode.
- Credits: one grouped art row.
