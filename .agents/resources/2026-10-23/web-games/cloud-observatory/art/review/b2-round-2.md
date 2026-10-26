# Review: Cloud Observatory b2 round 2

Result: both assets ACCEPTED (horizon-hills, emblem-ship). No round-3 brief needed.

## horizon-hills (1024x1536 RGBA) - ACCEPTED
Technical: alpha 255 at (0,1400), (1023,1400), (512,1535), (0,1535), (1023,1535); every pixel of the bottom row opaque; alpha 0 everywhere above y=1014 (first opaque row 1098, about 71.5 percent); no pure black. Edge-to-edge and bottom-to-bottom, so the round-1 floating-slab fault is fixed.
Round-1 fixes verified:
- Rim light is now a soft, broken watercolour teal wash a few px wide on the far-ridge crest, fading into the ridge colour; no crisp outline stroke. It is slightly brighter at the highest peaks (max about rgb 87,148,169) but reads as paper-grain-broken wash, not a vector halo, at 1x.
- Three clear value steps (far about ink-700, mid ink-800, near ink-950, bottom about rgb 10,17,37 = no pure black). Crests at about 71 / 76 / 80 percent. Near ridge has a level plateau across roughly x 22-80 percent at about y 80 percent where the building stands.
- 8 small pines, uneven, none on the shelf, sides only. Hand-painted wobble on ridge edges. Fine paper grain consistent with sky-far / nebula-mid; no tiling or banding seen even at 4x brightness.
Context (b-hills-in-context): sits correctly under observatory-building and sky-far/nebula-mid, tab-bar zone is dark and calm, no overlay conflicts. Clean on dark, parchment and magenta.
Nits (not player-visible): rim a touch strong at the tallest peak; near ridge is nearly flat dark, which is what the brief wanted.

## emblem-ship (1024x1024 RGBA) - ACCEPTED
Technical: corners alpha 0, max alpha beyond r=480 is 0, bounding box 32-991 (the ring). Frame (ring, disc wash, hairline ring, blooms) is PIXEL-IDENTICAL to accepted emblem-lyre, emblem-whale and emblem-crown (mean diff 0.0, alpha diff 0 over the whole non-figure area).
Figure: ship faces right; one smooth continuous crescent hull with a single plank line and no dent in the keel (round-1 fault fixed); raised bow at right with bowsprit visibly growing out of the hull tip via a collar; small raised stern block at left; mast seated in the deck, boom collared to the mast, single triangular sail billowing right, pennant streaming right, three thin separate wave strokes below. Bounding box about 515 x 477 px, centred, well inside the hairline ring, light top-left. No text, stars, rigging web or extras.
Consistency: gold-leaf ramp, flake/crackle texture, engraved line weight and shading match lyre, whale, serpent, archer, crown, lantern (c-ship-with-accepted). Reads instantly as a sailing ship at 144, 96 and 48 px (b-ship-sizes) and is distinct from its siblings.
Nits (not player-visible at display size): stern block is a little boxy; scale-pattern texture on hull and sail is the same family as the serpent/whale scales.

Contact sheets in this folder: a-*, b-*, c-*, d-*, z-* (zoom crops).
