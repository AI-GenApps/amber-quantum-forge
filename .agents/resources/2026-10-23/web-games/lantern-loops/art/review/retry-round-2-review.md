# Review: Lantern Loops retry batch, round 2

Technical: all three files exist with the right sizes. backdrop-harbor 1024x1536 RGB (median 24,25,66, matches bridge 19,22,70); board zone x52..971 y261..1182 has 0 differing pixels versus round-1, and no pixel changed outside the allowed top band and margin boat patches. empty-archive 1024x1024 RGBA, corners and outer 4 percent border alpha 0, top 15 percent empty, bbox 154,396..869,787 inside the 78 percent box (1537 edge-only semi-transparent pixels, fine). feature-graphic 1536x1024 RGB, median 18,24,69, mean 38,39,79 (bridge mean 22,24,73; much closer than round 1's 47,49,99). Contact sheets: a_full_on_grey, b_harbor_390_vs_bridge, b_feature_crop_300, c_harbor_top_zoom, c_harbor_boats_zoom, c_empty_vs_accepted, c_feature_vs_accepted, c_feature_zoom, d_empty_archive_160, d_empty_archive_dark_light.

## feature-graphic: ACCEPTED
- Now reads as a ribbon LOOP with the scene visible through its open centre, not a signboard slab: constant-width cream rounded rectangle, two stacked sheets (paper-2 backing 5 px down-right), no glow.
- Five accepted lantern sprites, unmodified, larger (about 18-20 percent of height), varied cord lengths and scales, distinct hue and distinct glyph (circle, diamond, triangle, square, star) even at 300 px wide. Reflection bars sit under each lantern in its colour.
- Palette now matches accepted bridge/sky family: no neon cobalt, no peach or cream in the sky, three stepped sky sheets, corner clouds clear of the ribbon, three clean arches, houses with two amber windows and one rectangular lamp.
- Survives the 1024x500 centre crop with everything essential inside. No text, no halo bloom.
- Minor, not objectionable at display size: cords start slightly over the ribbon face; the second spill disc is very faint; ribbon is still the largest pale mass (acceptable, cream paper and lanterns are meant to be the brightest things).

## backdrop-harbor: REJECTED
- Boat patches are visible as rectangles: the lighter water-sheet edge line starts abruptly at x about 143 (left) and stops at about x 880 (right) with hard vertical steps; a darker rectangular patch shows behind each boat (c_harbor_boats_zoom). The hulls straddle the sheet edge so the water around them is inconsistent. The brief explicitly said no rectangular seams.
- The two amber round dots at (75,181) and (823,181) float at the edge of a house/quay, attached to nothing (the exact fault called out in round 1 for the window dots). Other windows are fine.
- The masts read badly: sails are pasted flat over the faces of houses at x 45 and 930, and the one at x 535 is a pennant-on-a-pole above the quay roofline. They look like flags stuck onto buildings, not moored boats' masts.
- The far-shore houses are one identical pentagon/hexagon shape repeated (honeycomb / game-token look), no chimneys, no roof variety, no stone detail; the near sheet is a row of identical triangular gables. Compared side by side with accepted backdrop-bridge at 390 px (b_harbor_390_vs_bridge) the top band is still much sparser, and the bottom band has no reeds or parapet blocks like the bridge, just plain scallops.
- Good and kept: board zone untouched and calm, quay is now one closed sheet, boats are now legible as boats (curved hull, mast, triangle sail), no cream rims.

## empty-archive: REJECTED
- The ribbon now reads as a letter "U" / a bracket "[ ]" at 160 px (d_empty_archive_160): two short vertical stubs with a wide 130 px gap in the top run and the bottom hidden behind the lip. It does not read as an unfinished loop of ribbon; at small size it looks like a handle or a pair of ears. Rubric 1 and 8.
- The ribbon is small and thin next to the lantern and pushed to the right with a dead gap; the pair still reads as two unrelated objects, not one story.
- The lantern is the accepted unlit sprite and is correctly seated behind the lip (bottom cap crossing and tassel hidden), tray, finger slot and creases are fine. But with the tassel and lower cap hidden and the sprite scaled to 354 px it reads squat, close to the pumpkin look the brief wanted to avoid; it is smaller than the 40-45 percent height rule.
- Backing sheet is now a clean 5 px offset (notch fixed).
