# Review: batch b3, round 3 (backdrop-delta, backdrop-estuary)

Both expected files present, valid PNG, 1024x1536 RGB opaque (aspect 2:3). out/ holds only the two PNGs and manifest.json.
Contact sheets: a-full.png, b-display.png (360 px with board zone and HUD/tray lines), c-consistency.png (valley, highland, delta, estuary side by side), e-delta-edges.png, e-estuary-edges.png, z-* close-ups. Transparent-background sheet (d) not applicable (opaque assets).

## Measurements
| | delta | estuary | valley (accepted) | highland (accepted) |
|---|---|---|---|---|
| mean luminance | 150.0 | 157.3 | 154.8 | 152.5 |
| board-zone std | 1.37 | 1.54 | 1.41 | 1.35 |
| board-zone range | 142..158 | 150..168 | 148..167 | 124..165 |
| y120..1170 min/max L | 125 / 165 | 150 / 168 | 74 / 199 | 49 / 220 |
| max saturation | 0.41 | 0.50 (lime clump) | n/a | n/a |

## backdrop-delta: ACCEPTED
- Round-2 faults fixed: islands and reeds are muted tan silt (max saturation 0.41, no orange/yellow), channels are green-grey with no blue or highlights, braids are confined to y < 100 at the top and y > 1380 at the bottom (the tray band is calm: row std 1.2 to 1.4 up to y 1400), the olive centre is flat (std 1.37), and a thin low-contrast channel runs down the left edge so the delta reads at the margin too.
- Hand matches the accepted valley and highland: crisp opaque shapes, 2 to 3 flat value steps, light top-left lip and darker down-right shade, quiet paper tooth. No text, objects, people, boats, blue, seams, vignette or frame.
- Distinct from valley (bright green, hedges) and highland (grey-sage, walls): olive plain with pale silt ribbons.
- Minor, not player-visible at display size: the left-edge channel edge undulates rather evenly, and the reed dabs are a little busy at 1x; at 360 px they read as tufts.

## backdrop-estuary: ACCEPTED
- Round-2 faults fixed: the top-left creek is now mud brown (no blue); exactly one muted grey-blue sea edge (about 121,148,153, saturation 0.20, clearly quieter than #3b8dc4) at the bottom, starting at y about 1461 (below the 1415 limit) with an irregular coast and one small sand tongue, no foam; the sand is darker mud-sand (mean L 157, inside the 155 to 165 target) and the centre is flat (std 1.54); the grass is chunky two-value clumps, not hatching.
- Tray band is calm except the thin sea strip at the very bottom edge (row std 1.5 to 2 up to y 1400).
- Matches the set in paint hand and edge treatment (dark mud rim on the shoreline, flat steps).
- Minor flags, accepted because they are small and cropped at the outer edge or under the HUD: the top-right salt-grass clump is a livelier lime (about 173,167,88, saturation 0.49) than the bible's #9bab7c; the top-left creek reads slightly like a dirt track; the sea has a handful of thin pale ripple strokes (muted, not foam). If the set is revisited, desaturate the grass toward #9bab7c.
