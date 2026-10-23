# Review: Lantern Loops retry batch, round 1

Technical: all four files exist, sizes correct (key-art and backdrop-harbor 1024x1536 RGB, feature-graphic 1536x1024 RGB, empty-archive 1024x1024 RGBA with corners and outer 4 percent alpha 0, bbox 154,267..869,787 inside the 78 percent box). Median colours: key-art RGB 16,20,71 and harbor 24,26,68 (match accepted bridge 19,22,70); feature-graphic median 27,33,89 and mean 47,49,99, noticeably brighter and bluer than the bridge. Contact sheets: a_full_on_grey, b_display_390, b_feature_crop, c_harbor_zoom, c_key_zoom, c_key_vs_accepted, d_empty_archive.

## key-art: ACCEPTED
- Reads at 390 px as one hero lantern on a garland over a calm harbour; title band (y 0-28 percent) is calm dark indigo, button band calm.
- Hero is the accepted amber sprite (same object as the icon lantern), cord loop meets the rope at the sag, nothing crosses its body, flat cut-edge halo disc, layer shadows down-right. Four smaller lanterns on cords of different lengths, layout not mirrored.
- Palette matches accepted backdrop-bridge (median 16,20,71 vs 19,22,70); paper texture, edge weight and shadow direction consistent with icon and bridge. No text, posts, pier, boats, cream rims on dark shapes. Reflection bars are flat and sit under each lantern.
- Minor, not player-visible at display size: the shore masts are plain sticks; the second (8 percent) halo disc is nearly invisible; the right end of the lower water sheet has a slight curl. Acceptable.

## backdrop-harbor: REJECTED
- The new nearer shore is a mess: the three "masts" are thin lines with a horizontal spar, so they read as crosses or grave markers rather than masts with furled sails. Two shore sheet runs float as detached thin horizontal slivers (x about 440-545 and 580-700, y about 190), so the quay is not a closed shape (rubric 2).
- Three tiny amber window squares (x 224, 525, 904, y 228) float on empty indigo below the shore line, attached to nothing.
- The two boats are nearly invisible: dark on dark, only a sliver of hull and a thin sail cropped at the canvas edge, and the left one shows almost no hull. They do not read as boats and add nothing (rubric 4, 8).
- Overall still much sparser than accepted backdrop-bridge (no bridge-like depth, no lamp posts, reeds or parapet); the brief's goal of "as rich as the Bridge" is not met. The board zone is correctly calm (mean luminance 12.1 percent, which is under the 12 to 28 percent target band by a hair but visually fine) and the quay scallops at the bottom are fine.

## empty-archive: REJECTED
- The ribbon hoop with a gap in its right run reads as the LETTER "C" at 160 px (see d_empty_archive). That breaks rubric 1 and rubric 8: it does not read as an unfinished ribbon loop.
- Composition is split: a lantern on the left, a "C" on the right, with a dead gap between them and the lantern not nestled in the tray; the hoop's bottom end sits on top of the front lip rather than inside the tray. The lantern's bottom cap sits above the front wall instead of being hidden by it, so it does not read as "seated in the box".
- The ribbon's top end shows an odd notch where the backing sheet steps; ends do not clearly show the second sheet.
- Technical alpha is clean (corners 0, border 0), but 2,722 semi-transparent pixels exist (edges only, acceptable). Tray, front wall, finger slot and creases are acceptable and the lantern is the accepted unlit sprite.

## feature-graphic: REJECTED
- The big cream rounded ring with a flat plum + indigo slab inside reads as a UI text field or signboard, not as "a loop of light". It is the brightest and largest mass (about 40 percent of the frame width by 23 percent height) with a dead flat interior, which breaks the "dead slab" rule (rubric 7) and steals focus from the lanterns.
- The five lanterns are tiny (about 12 percent of the height) and at 300 px wide become dots; the five colours and glyphs are weak as the focal point (rubric 4).
- The light-spill discs are barely visible, blurry pastel smudges on the ring's lower run, not cut-edged stepped paper discs; this reads as airbrush (rubric 7).
- Overall brightness and saturation drift: mean RGB 47,49,99 against the bridge's 22,24,73, and the sky sheets are brighter blue-violet than accepted backdrop-sky. The scene (bridge, houses, lamp, clouds) itself is clean and the reflection bars are correctly placed.
