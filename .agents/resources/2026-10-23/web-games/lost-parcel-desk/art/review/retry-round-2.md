# Review, retry round 2 (Lost Parcel Desk)

Technical results (PIL): key-art and desk-backdrop 1024x1536 RGB, no alpha, no pure black/white. evidence-04-3 and evidence-08-1 1024x1024 RGBA, corners alpha 0, outer 6 percent border clear, extents 76 and 77 percent, no pure black/white; 04-3 has exactly one transparent hole (the hanging hole, 1720 px), 08-1 none. townsfolk-9 960x1280 RGBA, corners 0, 3 percent border clear, no holes. Contact sheets in this folder: a1/a2/a3 (full size on grey), b1 (evidence 54/84/220 on night and cream), b2 (12-bust row at 54x72 and 108x144 on night and cream), b3 (scenes at 390 px with overlay bands), c1 (evidence vs accepted anchors), c2 (key-art vs accepted icon and feature-graphic), d (transparent assets on night, cream, teal-deep, mustard).

## Verdicts

| asset | verdict |
|---|---|
| desk-backdrop | ACCEPTED |
| key-art | REJECTED |
| evidence-04-3 | REJECTED |
| evidence-08-1 | REJECTED |
| townsfolk-9 | REJECTED |

## desk-backdrop: ACCEPTED
Exactly what the brief asked for: flat near-neutral dark blotter (#1E2833-ish), 20 px wood strips left and right, 92 px bottom strip, no top strip, no props, pool, vignette or UI. Table zone mean luminance 15.3 percent (target 10 to 22), max 20.7 percent, so nothing competes with 84 px sprites; speckle grain is now visible at 100 percent and clumped like the accepted paper tooth, wood carries the faint cream gap on the inner left/bottom side. At 390 px with header and bottom bands it is a calm dark desk with a thin wooden rim. Minor, not a fail: very flat (98 unique colours), side strips are partly lost on cover-fit tall phones, the ink seam is nearly invisible against the dark blotter. Passes the rubric (no text, calm, palette-exact, no AI tells).

## key-art: REJECTED
Grain and layout are now fine, but the picture is still not the same press as accepted/feature-graphic.png and it carries the known failures:
- Lamp shade halftone is the forbidden loose block of 2-3-3 unequal dots inside the dome, plus a cream gloss streak with an inner lighter arc on the shade; four loose dots in a column on the wrong (left, lit) side of the neck.
- Magnifier lens overlaps the parcel's lower-right corner and the lamp pool (brief: lens clear of the parcel), and has a cream gloss crescent.
- Cast shadows are broken: one detached dot row running along the parcel bottom across the pool, loose clusters left of the lamp base, dots beside the lens at x 650 to 740, a dot stack peeking out of the parcel's right edge, a double cluster by the stamp. Not one crescent per object.
- Flat uniform-weight vector look: parcel and stamp have no overprint or shade at all; stamp is tiny and a near-black slab at 390 px.
- Pool is cut with a flat bottom and reads as a pale plate.
Rubric points 3, 4, 7 fail.

## evidence-04-3: REJECTED
Card, header band, hole, calm lower band and extent are good. But: (1) the cells still read as rings, key rings or bottle caps at 84 and 54 px, not batteries (an offset inner ring with a teal crescent between the rings looks like a thick donut); (2) cast shadow is wrong at the corners: double bottom row partly clipped under the keyline, right column two wide near the corner, a stray dot touching the top-right corner; (3) the brick dot "shade" in the lower-right band is a ragged stair-step triangle of irregular dots, not the regular crescent grid of accepted/evidence-05-2.png. Rubric points 2, 5, 8 fail.

## evidence-08-1: REJECTED
Silhouette is clean and alpha is correct, but the object reads as a bollard, candle holder or chimney on a flared cone, not as a cane tip, at 54, 84 and 220 px. The rubber is a flared trapezoid skirt (explicitly forbidden), the wood is a plain pillar, a keyline stub sticks out square above the end-grain ellipse on the left, the cast shadow has a loose dot touching the wood, a gap, then a different-pitch double cluster at the bottom-right, and the brick-deep dots are a ragged triangle with stray singles. Rubric points 2, 7, 8 fail; compared to accepted/evidence-09-3.png and evidence-10-1.png it has no overprint character.

## townsfolk-9: REJECTED
Face, cap, collar, tie and waistcoat match the cast, but the head sides are broken: hair is two hard-edged boxes with a flat horizontal top and flat vertical outer edge, a faceted cream/brown triangle highlight reads as a cut gem, and each ear sits in a bulging pod outside the head outline, unlike the organic hair of townsfolk-6/-10. The hearing aid (cream casing against brown with a small boxed clasp and tube) is unreadable at 54x72 and tangled at 108x144, so the gameplay clue fails. The neck has pasted rectangular tone bands with hard edges and a stray dot; sleeve dots are cream-2 on cream (invisible) and waistcoat dots form rectangular blocks. Rubric points 2, 4, 7, 8 fail.

## Actions
desk-backdrop copied to accepted/ and appended to accepted/manifest.json (round 2, batch retry). Round-3 brief with the four rejected assets written to retry/round-3/brief.md.
