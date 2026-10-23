# Review: Lantern Loops retry batch, round 3 (final round)

Technical: backdrop-harbor 1024x1536 RGB, board zone x52..971 y261..1182 has 0 differing pixels versus round 2 (and round 1); mean colour 25,27,70 vs bridge 22,24,72. empty-archive 1024x1024 RGBA, corners and outer 4 percent alpha 0, bbox 154,359..869,787, nothing in the top 15 percent, 1949 edge-only semi-transparent pixels. No stray files in out/.
Contact sheets: a_full_on_grey, b_harbor_390_vs_bridge_garden, b_harbor_vs_bridge_full390, c_harbor_top_zoom, c_bridge_top_ref, c_harbor_boat_left, c_harbor_boat_right, c_harbor_bottom, c_empty_vs_accepted, c_empty_zoom, d_empty_archive_160_bgs.

## backdrop-harbor: ACCEPTED
- Every round-2 fault is fixed. The shore is now a real skyline in the bridge language: seven houses of clearly different widths, heights and pitches, an asymmetric lean-to, three chimney tabs, and a darker near sheet with varied roofs and two small stone-block bumps. No honeycomb repetition, no sails or flags on the shore.
- Exactly three rectangular amber lamps on thin posts, each attached to the roofline; three tiny windows, all on facades. No floating round dots.
- Boats now sit wholly on the lowest near-black water sheet, closed symmetric hulls, thin attached mast, one triangle sail, same hue and no cream rim, in the outer 14 percent. The water-edge line runs continuous across the full width with no rectangles or tonal blocks. Reeds and parapet blocks in the bottom side margins match the bridge language and keep x150..874 empty.
- Board zone is pixel-identical and calm; top band is mid-dark so HUD text has contrast; palette and paper texture match the accepted bridge (390 px side by side). The three backdrops (harbor, bridge, garden) are clearly distinguishable.
- Minor, invisible at display size: hairline luminance steps of 1 to 2 levels in the water near x145..165 and x864 (clone seams), only seen at 300 percent zoom; the two parapet bumps on the near sheet look like small chips; houses are still a little pentagon-heavy. None of this is noticeable at 390 px.

## empty-archive: REJECTED (final)
- The ribbon still does not read as an unfinished loop at 160 px. On night, indigo, teal and grey (d_empty_archive_160_bgs) it reads as a pair of corner brackets "[ ]" or a handle/frame: the bottom run is swallowed by the tray lip and merges with it, leaving a U-shaped form with a notch that is too small to read as a gap in a ribbon. This is the same fault cited in rounds 1 and 2.
- On the paper (#F6EAD3) background the cream ribbon and cream tray almost vanish into the background: only the dark lantern and navy back wall read, so the illustration fails the display-size contrast check (rubric 4).
- The ribbon and lantern still read as two unrelated objects standing side by side in a tray; the 'unlit lantern waiting for its ribbon loop' story is not instant (rubric 8). The lantern, with its tassel and lower cap hidden and body cropped to 268 px wide by about 235 px tall, reads as a squat grey pumpkin rather than the accepted lantern silhouette.
- Positives (not enough): clean alpha, tray front, finger slot, creases and paper texture consistent with the accepted set; accepted unlit sprite pasted unmodified.
- Stays rejected; use a placeholder.
