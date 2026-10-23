# Lantern Loops b2 round 1 review

Technical: all 11 files present, exact sizes (1024x1024 sprites, 1024x1536 backdrops, 1536x1024 feature graphic). Sprites RGBA, corners and 4 percent border alpha 0, alpha mask byte-identical to accepted lantern-amber. Opaque assets are RGB with no alpha. Sheets: a-lanterns-grey, b-lanterns-small, b-backdrops-390, b-medallion-archive-display, b-feature-crop, c-consistency, d-lanterns-4bg, d-transparent-two-bg, plus zoom crops.

Verdicts: ACCEPTED 7 (lantern-rose, lantern-jade, lantern-azure, lantern-violet, lantern-unlit, backdrop-garden, backdrop-bridge). REJECTED 4 (backdrop-sky, daily-medallion, empty-archive, feature-graphic).

## lantern-rose, lantern-jade, lantern-azure, lantern-violet, lantern-unlit: ACCEPTED
- Identical silhouette, caps, cord, ribs, texture and paper edge to accepted amber (alpha identical). Sampled panel colours match the bible hex families (rose #ef6b78 flank, jade #4cc19d, azure #49a7f1, violet #a783e9, unlit #64678a).
- Five hues and five window shapes (diamond, triangle up, square, star, none) are unmistakable at 48 px on night, indigo, paper and teal. Unlit clearly reads as off: no window, no core.
- Edges clean on all four backgrounds, no fringe, no text.
- Notes (not blocking): the amber tassel is kept on every colour, as the brief demanded and as in the accepted icon; the transparent pixels carry stray RGB under alpha 0 (harmless unless a viewer ignores alpha). The unlit outer panels are close to night #12132E, so the app should place it on a lighter chip.

## backdrop-garden: ACCEPTED
- Teal paper-theatre scene in the same world as the icon. Top band carries wall coping, two blossom branches and two small rose lanterns inside the outer 15 percent; board zone is calm (mean luma 0.17, only 5 faint wave bands); bottom hedge starts at about 81 percent, stepping stones and petals only at the margins. No text, no creatures, no sparkle, no vignette.
- Notes: blossoms are a warmer coral than blossom #F3B6C3 and the stamen lines are slightly fussy, and a standing petal sits on each wall post. All in the margins and small, so tolerated.

## backdrop-bridge: ACCEPTED (weakest accepted)
- Six clean arches resting on piers, three small amber lamps, calm banded river in the board zone, reeds and parapets in the bottom band, mean luma 0.11 (slightly under target but safe for the board). No impossible structure, no text.
- Notes: very monochrome indigo, silver-teal is barely present, reed clumps are near mirror clones, glints are soft streaks. Acceptable under the scrim.

## backdrop-sky: REJECTED
- Airbrushed gradient: the dusty rose band (y 55 to 69 percent, inside the board zone) is a smooth indigo-to-mauve gradient (#21245a to #372757 over about 150 px), explicitly forbidden (bands must be stepped paper layers).
- Palette brief not met: no muted azure (#3E6FB8) mid zone and no violet-to-azure progression; the whole sky is near-monochrome deep indigo (about #181e51), almost the same as backdrop-bridge, so the chapter reads as another navy panel.
- The lanterns and cloud banks themselves are good (10 lanterns, top-left and bottom-right clusters, none in the board zone).

## daily-medallion: REJECTED
- Construction error: the petals at 3 and 9 o'clock are cut off flat by a straight vertical edge at x=72 and x=951 (rows 465 to 555), so the 16 petals are not equal and the scallop is not a clean circle. Visible at 240 px.
- Petals vary in shading and shape (left/right mean difference 7.5), not an exact rotational set. Ring windows are saturated yellow rather than the ivory/bright cores of the lantern window.
- Otherwise good: empty indigo plate (46 percent), cream ring with 16 evenly spaced circle windows, 86 percent disc, clean alpha.

## empty-archive: REJECTED
- Depth and contact are broken: the tray is drawn in a top-down perspective (trapezoid floor) while the lantern is a flat elevation; the lantern's body overlaps the tray's back wall and its bottom cap and tassel tip land on the floor/front edge, so it reads as a lantern standing in front of or hovering over the box, not sitting in it. No contact shadow or seat.
- The ribbon is a short flat C-segment with chopped ends that reads as a headband fragment, not a cream board ribbon curled in an open loop.
- The composition is a flat blue box plus lantern; the whole thing is low and wide, a weak, unclear story at 160 px.

## feature-graphic: REJECTED
- Airbrushed bright blob / partial moon clipped at the left edge (x 0 to 10, y 440 to 520, pixels up to #8690c6): forbidden moon and glow, and a visible stray artefact.
- The ribbon is a flat uniform cream stadium outline with no paper edge, no thickness and no light spill from the lanterns; it reads as a vector paperclip, not a luminous cut-paper ribbon, and the "light spilling onto the ribbon" requirement is missing.
- Weak composition: the focal group sits in the upper half, the top 20 percent is empty navy, the right "sky" is just violet clouds, house shapes are flat grey-violet slabs. Lantern designs and bridge/boat are fine.
