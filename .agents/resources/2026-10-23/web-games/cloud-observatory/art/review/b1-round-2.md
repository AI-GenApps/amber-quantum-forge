# Review b1 round 2 - Cloud Observatory (strict)

Result: 2 of 4 accepted (observatory-building, key-art). Rejected: icon, emblem-lyre.

Technical (PIL): all present, correct size/mode. icon 1024x1024 RGB; key-art 1024x1536 RGB; observatory-building 1024x1024 RGBA, corners and 31 px border alpha 0, bbox x153-871 (70 pct wide), y72-940 (85 pct tall), base 92 pct, tip 7 pct; emblem-lyre 1024x1024 RGBA, corners and border alpha 0, ring reaches r480. Clean edges on dark, parchment and magenta. Contact sheets: a_full_grey.png, a_key_full.png, b_display.png (48/96/192 icon, circle mask, emblem 48/96/144, building 320, key-art 360x540 with bands), d_*_bgs.png, z_detail1-3.png.

Shared: the round-1 oil-filter tessellation is largely gone on stone, sky and nebula, but a fine swirl-polygon texture is still visible at 2x zoom inside the gold of the icon star/dome and the emblem foil and disc.

## observatory-building - ACCEPTED
- Cool stone (#7F86A0/#4A5272 range, mean about 141,142,158) in clear planes, only faint warm stains and a low teal fill at lower right; no opal blotches. Slim right side wall, base perfectly horizontal at 92 pct, gable/terrace junction resolved with a parapet, chimney embedded behind the roof, two arched windows (one lamp-lit), arched timber door with brass handle. Dome is a clean cap, ribs and open slit aligned, telescope connected and pointing up-left. Contour about 4 px, parchment rim top-left. Matte two-step foil with crackle.
- Readable at 320 px: strong silhouette, gold dome is the focal point.
- Accepted with notes (not visible at display size): the contour weight is fairly uniform, the gold carries slight hammered texture at 2x zoom, gold is a touch saturated. Later sprites should match this treatment rather than push it further.

## key-art - ACCEPTED
- Same building as the accepted sprite; scale about 30 pct of height, base at about 72 pct. Title band (0-30 pct) dark and calm, button band (78-100 pct) calm dark ridge with no light; no text, no UI, no moon, no constellation cluster (title dots are widely spaced).
- Smooth wet-in-wet teal/rose nebula drifting diagonally, restrained; ridge calm; three pines and a low wall as briefed. The gold star is a small gouache dab on the telescope axis (14 px at 1024), visible as a tiny gold cross at 360 px; the telescope clearly aims at it. Gold dome and lamp window are the warmest mass.
- Accepted with notes: the cel-inked house sits a little crisper than the soft sky, and the star dab is at the minimum readable size. Not a player-noticeable break.

## icon - REJECTED
- Construction: the dome floats in open sky on a thin stepped slab with a stray roof-wedge fragment; no building under it (reads as a cloche on a shelf).
- Impact: whole motif is small (dome about 28 pct width, star 15 pct); at 48 px the dome is a small blob in a lot of empty sky. Not award calibre.
- Star: faceted clip-art eight-point star, not cut foil; visible swirl-polygon texture inside star, dome and sky at zoom.
- Positives: tube does aim at the star, sky watercolour is good, central-circle safe area respected, no text.

## emblem-lyre - REJECTED (anchor of 12 emblems)
- Gold is a single flat tone on the figure and ring: no gold-light/gold-shade planes, no ring light/shadow lines (bible 8.2); reads as a flat vector cut-out on a painted disc, not engraved foil.
- Glossy white specular streak on the left arm (plastic gloss) instead of a matte parchment accent.
- Sound box with a flanged top rim and flared hull lines reads as a boat hull/basket, hurting the instant "lyre" read.
- Swirl texture remains in the foil and the disc at zoom; ring edge slightly wobbly.
- Positives: five strings, near-exact mirror construction, scrolls and crossbar engraving, frame radii and transparent border correct, readable at 48/96/144 px.
