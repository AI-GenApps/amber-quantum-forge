# Lantern Loops - RETRY batch, round 3 (two assets still rejected)

Read `../../art-bible.md` first (all of it). `feature-graphic` was ACCEPTED in round 2 and is now in `../../accepted/feature-graphic.png`; `key-art` was accepted in round 1. Do not redeliver either. This round covers ONLY: `backdrop-harbor` and `empty-archive`. Reviewer feedback is in `../round-2/review/review.md`; contact sheets are in `../round-2/review/`. The round-2 deliverables are in `../round-2/out/`. Where the ROUND-3 revision notes are more specific than anything below, they win; then the round-2 notes (R1, R2), then the original specification.

Delivery: deliver both files. A simpler piece that exists beats an ambitious piece that does not. Do not leave stray files in `out/`.

## ROUND-3 REVISION NOTES (read these first)

### N1. `backdrop-harbor`
Base to edit: `../round-2/out/backdrop-harbor.png` (board zone x 52..971, y 261..1182 verified pixel-identical to round 1; keep it so, keep the three water sheets, the bottom sheets and the scalloped quay edge unchanged). Kept as good: one closed near-shore sheet, boat hull/mast/triangle-sail style (legible, same hue, no cream rim), the calm board zone.
What is wrong (see `../round-2/review/c_harbor_top_zoom.png`, `c_harbor_boats_zoom.png`, `b_harbor_390_vs_bridge.png`):
1. Boat patches show as rectangles: the lighter water-sheet edge line starts abruptly at x about 143 (left) and ends at about x 880 (right) with hard vertical steps, and a darker rectangle sits behind each boat. The hulls straddle the sheet edge.
2. Two amber round dots at (75,181) and (823,181) float at a house edge, attached to nothing.
3. The sails are pasted flat over house faces at x 45 and x 930; the mast at x 535 is a pennant on a pole. They read as flags stuck on buildings.
4. All far-shore houses are one identical hexagon/pentagon shape (honeycomb look); the near sheet is identical triangle gables; no chimneys, stone blocks or roof variety; the bottom band has no reeds or parapet blocks. Still much sparser than `../../accepted/backdrop-bridge.png`.
What to change:
- Water around boats: the sheet edge line must run continuous and unbroken across the full canvas width (x 0..1023), exactly as in round 1, with no vertical steps, no darker rectangles, no texture break. Sit each boat entirely on ONE sheet: put both hulls (and their reflections-free water) wholly inside the lowest near-black sheet, hull bottom at least 20 px below the sheet edge line, so nothing straddles the edge. Keep them in the outer 14 percent (left x 10..135, right x 889..1018), about 120 px wide, same hue as the water but at least 10 percent lighter, sail 15 to 20 percent brighter than the water, one thin mast attached to the hull, one triangle sail, thin same-hue top-left edge, small down-right ink shadow. Rebuild the water texture around them by cloning surrounding paper texture, not by a flat patch. Verify at 400 percent there is no rectangle.
- Remove the three mast+sail objects from the shore. Instead use the bridge language: exactly 3 small rectangular amber lamps (about 14 x 20 px) on short thin lacquer posts (same hue as the near shore, 10 to 15 percent lighter, no cream rim) standing on the quay roofline, at different x (for example 150, 520, 880), each fully attached to the shore. No sails, no flags, no crossbars on the shore.
- Remove the two floating round amber dots. At most 3 tiny amber window squares, each fully inside a house facade (the existing ones at (284,179), (121,226), (823,226) are fine if kept inside a facade).
- Make the houses a real skyline in the `backdrop-bridge` style: 5 to 7 flat gabled houses of clearly different widths, heights and roof pitches (include at least one lean-to / asymmetric roof, at least two chimney tabs), not a repeated hexagon; the near sheet gets varied roofs too (not identical triangles) with one or two stone-block parapet bumps. Keep two value-separated layers (far lighter, near darker) with a down-right ink shadow.
- Bottom band only (y 1250..1536, outside the board zone): add 2 small reed or low parapet-block silhouettes in the outer 12 percent on each side in the bridge style (same hue as the near-black sheet, 6 to 10 percent lighter, no cream), nothing within x 150..874.
- Everything else must stay pixel-identical to `../round-2/out/backdrop-harbor.png` except the regions you edit; the board zone must remain at zero different pixels.

### N2. `empty-archive`
Base: keep the round-2 tray from `../round-2/out/empty-archive.png` EXACTLY (tray x154..870 y614..788, back wall, folded lip, finger slot, creases, end flaps: all fine) and the accepted `lantern-unlit.png` pasted unmodified. Keep the seating (front lip hides the lower cap and tassel). Change the ribbon and the lantern scale.
What is wrong (see `../round-2/review/d_empty_archive_160.png`): the ribbon reads as a letter "U" or a bracket "[ ]" at 160 px: two short vertical stubs and a 130 px (more than half of the hoop width) gap. It is small, thin and pushed right, so it reads as two unrelated objects. The lantern is only 354 px tall and reads squat.
What to change:
- The ribbon must read as a nearly CLOSED rounded-rectangle loop with a SMALL break, not as two stubs. Outer size about 250 px wide by 230 px tall (taller than before, bigger than the previous 230x200), constant width 18 px, quarter-circle corners radius about 60 px, straight runs. ONE gap of only 44 to 56 px (about one quarter of the top run, never more than a third of the hoop width) in the top run, placed off-centre toward the right (the gap centre at about 62 percent along the top run), with two plain SQUARE-cut ends, each showing the paper-2 sheet 5 px down-right. The long left piece of the top run, the left side, the bottom (hidden behind the lip) and the right side are all present and continuous so the silhouette is clearly a ring with a notch, not a "U". No curl, ball, taper or second gap. Backing sheet exactly 5 px down-right, no steps.
- Position: hoop axis at about x 66 percent, bottom hidden behind the front lip y 676, top of the hoop within 5 percent of the lantern's top (the cord loop tip). Gap between lantern body and hoop 50 to 70 px.
- Lantern: enlarge the unmodified accepted unlit sprite uniformly so the full sprite (cord loop to tassel tip, tassel hidden) is 400 to 440 px tall (about 40 to 43 percent of the canvas height), axis at about x 36 percent, still seated behind the lip with the bottom cap half hidden and the tassel hidden. Keep the whole group inside the 78 percent box (x 11..89, y 11..89) and nothing in the top 15 percent.
- Check at 160 px over #12132E, #1E2050, #F6EAD3 and #0E5A5F: the ribbon must read as "a ribbon ring with a small cut" (like a ring that is not closed yet), never as the letter U, C, G, n or a bracket or handle. If it still reads as a letter at 160 px, shrink the gap further.

---

# ROUND-2 REVISION NOTES (context; round-3 notes above win)

### R1. `backdrop-harbor` (start again from the round-1 file, not from b1/round-4)
Base to edit: `../round-1/out/backdrop-harbor.png`. Keep the board zone (x 52..971, y 261..1182), the three water sheets, bottom sheets and the scalloped quay edge at the very bottom pixel-identical. Change ONLY the top band y 0..246 and the two margin boats.
What is wrong:
1. The three masts are thin vertical lines with a horizontal spar, which look like crosses or grave markers. The nearer-shore sheet has detached thin horizontal slivers floating at y about 190 (x 440-545 and 580-700): the quay is not a closed shape.
2. Three small amber window squares at y 228 (x 224, 525, 904) float on empty indigo, attached to nothing.
3. The two boats are near-invisible (dark on dark, one is only a sail sliver) and do not read as boats.
4. Overall still far less rich than `../../accepted/backdrop-bridge.png` in the top band.
What to change:
- Rebuild the near shore in the top band as ONE closed, continuous sheet along its whole width (no gaps, no slivers): a row of 5 to 7 flat gabled warehouses of different widths and heights with a straight quay edge at its bottom, in a slightly darker indigo than the far shore, with a down-right ink shadow onto the far shore. Every window dot must sit INSIDE a house or on its facade, never on empty sky. Keep exactly 3 amber lamp points on the far shore and at most 3 tiny amber window dots, all on houses.
- Replace the cross masts with proper masts: 2 or 3 thin masts that rise from behind the quay roofline (starting at a roof or dock edge, not hanging in space), each with ONE small furled-sail triangle hanging off one side (flat triangle, muted paper-shade value, no horizontal crossbar forming a "+" shape). Alternatively use the bridge language: small rectangular amber lamps on short lacquer posts along the quay edge (like `backdrop-bridge`), max 3. Either is fine, but nothing may read as a cross.
- Make the two margin boats readable: each hull a closed, smooth, symmetric curved shape about 10 to 12 percent of the canvas width, lighter than the water around it by at least 10 percent value (same hue, no cream or tan), with a thin same-hue top-left edge and a small down-right ink shadow, one thin mast and one triangular sail 15 to 20 percent brighter than the water. Place them at the outer 14 percent only (left x 0..140, right x 884..1024), y about 1130 to 1250, fully visible (not cropped to a sliver; a crop of at most 20 percent of the boat is fine).
- Match the Bridge's richness in the top band: add one low flat sheet of rooftops or quay stonework as the nearer layer and optionally a few tiny reed or mast silhouettes in the side margins only. Still at most 6 layers and nothing in the board zone.
- Keep every flat sheet's edge the same hue as the sheet, 10 to 15 percent lighter on top-left only.
Accepted references to match: `../../accepted/backdrop-bridge.png` (houses, lamps on posts, parapet blocks).

### R2. `empty-archive`
Base: reuse the round-1 tray (`../round-1/out/empty-archive.png`) as the model for the tray, finger slot, creases and end flaps; they were fine. Re-build the lantern/ribbon relationship. What is wrong:
1. The ribbon hoop with its gap in the RIGHT run reads as the letter "C" at 160 px. The gap must not sit on a vertical run.
2. The lantern is not seated in the tray: its bottom cap sits on top of the front wall rather than behind it, so the front wall does not hide the lower cap and tassel.
3. The ribbon sits at the right with a dead gap, so the picture reads as two separate objects.
4. The hoop's top end shows an odd notch where its backing sheet steps.
What to change:
- Put the open gap in the TOP run of the hoop, centred, about 120 to 150 px wide (so the ribbon is a rounded rectangle with a break at the top, like an open "n"-shaped frame with a notch, NOT a "C", "U", "G" or "n" letter). Make the hoop wider than tall (outer about 230 px wide by 200 px tall) so it reads as a loop of ribbon, with the two cut ends clearly square and showing the paper-2 backing sheet at the same 5 px offset as the rest.
- Seat both objects inside the tray: the front wall's top lip must cross the lantern at the level of the bottom cap, hiding the cap's lower half and the whole tassel (as the first round-1 brief required); the hoop's bottom run is hidden behind the front wall too.
- Tighten the composition: lantern axis at about x 36 to 38 percent, hoop axis at about x 64 to 66 percent, gap between lantern body and hoop 60 to 80 px, tops within 5 percent of each other, whole group centred horizontally in the 78 percent box.
- Fix the backing-sheet notch: the second sheet follows the ribbon exactly 5 px down-right, with no steps at the ends.
- Reuse the accepted `../../accepted/lantern-unlit.png` unmodified (it was correctly pasted in round 1). Alpha rules unchanged (corners and outer 4 percent border alpha 0, nothing in the top 15 percent).


---

# ORIGINAL SPECIFICATION (context)

## 0. The one strategy change: stop re-drawing what is already accepted

Most failures came from the generator re-drawing objects that already exist as accepted pixels, and drawing them worse every time (squat pumpkin lantern, sphere lantern, cream-rimmed posts). Therefore:

1. Every lantern that appears in any of these four assets MUST be the accepted sprite itself, placed (scaled uniformly, never stretched, never recoloured, never redrawn) from `../../accepted/lantern-unlit.png`, `lantern-amber.png`, `lantern-rose.png`, `lantern-jade.png`, `lantern-azure.png`, `lantern-violet.png`. Composite them with exact native alpha. Bible section 8 is satisfied by construction. The only things you add around a pasted lantern are a soft ink layer shadow (down-right, 25 to 35 percent, 1 to 1.5 percent of canvas width) and, where stated, flat stepped halo discs.
2. Where geometry is the problem (ribbon, tray, boat, bridge), first build a FLAT LAYOUT GUIDE (simple solid-colour shapes in the exact hex values, exact positions and sizes written below), then render it as cut paper by sketch-to-render / precise-object-edit with the guide as reference. This is the method that finally produced the accepted `lantern-amber` (b1 round 3, `lantern-flat-layout-guide.png`). Instruct the generator to keep the guide's silhouette and placement exactly and only add paper fibre, thin paper edges and layer shadows.
3. For `backdrop-harbor`, do NOT regenerate from scratch. Start from `../../b1/round-4/out/backdrop-harbor.png` (its shore, three water sheets, texture, board zone and near-black bottom sheet were all judged correct) and change only what is listed below. Composite the edited region back over the untouched original so the board zone stays pixel-identical.
4. Deliver all four files. In b1 round 4 `key-art.png` was simply never delivered and was therefore rejected as missing. A simpler piece that exists beats an ambitious piece that does not.

## 1. Recurring failures: these are the MUST-NOTs for all four assets

Each item below was cited by reviewers more than once. The reviewer will check them first.

1. **Bright cream or tan rim lines on dark objects.** Harbor posts and rope-coil bars carried a continuous paper-2 line (about RGB 211,188,167) along every top edge in rounds 3 and 4; it read as a metallic rim and made them the brightest items in the bottom band. RULE: on any dark (lacquer, night, indigo, stone, hull) shape, the paper edge is the SAME hue as the shape, only about 10 to 15 percent lighter, top-left only. No cream, no tan, no paper-2 stroke on dark shapes anywhere. The accepted lantern caps' short left-half rim is the only cream rim allowed, and it comes with the pasted sprite.
2. **Stacked-disc / stepped-tower / game-piece shapes.** Posts on three stacked rounded bars (Hanoi tower, chess piece), the key-art pier built from three stacked rectangles (ziggurat). RULE: no mooring posts, no bollards, no rope coils, no stepped piers, no pedestals, no stacks of horizontal bars anywhere.
3. **3D / render drift.** Bevelled wood posts with grain, twisted hemp rope, metal chain and rings, plank decks, airbrushed radial glows, bevelled washers. RULE: every shape is one flat sheet of paper with a thin edge; ropes and cords are thin flat lacquer strips of constant width; no wood grain, no planks, no gradients across a shape.
4. **Ribbon shapes that do not read as the game's ribbon.** Seen so far: hook / shepherd's crook, horseshoe handle with ball ends, sine-wave squiggle, hollow flat "sausage", paperclip / stadium outline, speech-bubble outline with uneven width. RULE (applies to `empty-archive` and `feature-graphic`): the ribbon is the board ribbon: constant width everywhere, a rounded-RECTANGLE path with generous quarter-circle corners (same corner language as the board tiles), straight runs between the corners, square-cut ends where it is open. No sine waves, no wobble, no tapering, no ball ends, no self-crossing. It is built from two stacked sheets: top sheet cream #F6EAD3, a second sheet #E4D2B0 (paper-2) peeking out 4 to 6 px down-right as thickness, plus an ink layer shadow on whatever is under it. Never a glowing rim.
5. **Re-drawn lanterns that are not the accepted lantern** (near-sphere, pumpkin, 3D ellipse caps, wire hooks). RULE: use the accepted sprites (section 0). No lantern may be smaller than 90 px tall in a 1024 px canvas except where stated.
6. **Tangents, impaling and crowding.** Post running through a lantern; a lantern hanging directly against a post; tassel tips touching a parapet, a roofline or a wave edge; cloud tip overlapping the hero shape; stray artefact blobs at canvas edges. RULE: keep at least 4 percent of the canvas width of clear air around every lantern body and at least 40 px between any tassel tip and the nearest edge or line beneath it. Nothing runs through a lantern. No object is clipped by the canvas edge unless it is explicitly a margin decoration.
7. **Dead slabs and dead space.** Featureless cream tray front, flat empty navy top 30 percent, a harbor that is only three flat bands and two posts. RULE: every large surface carries structure (a fold, a second sheet, a cut-out, a stepped band edge with visible paper thickness) or is deliberately a small part of the picture. No surface larger than about 25 percent of the canvas is a single flat tone with no edge or texture event.
8. **Mirror clones and chains.** Left/right near-mirror garlands, two straight vertical columns of lanterns hanging one from another. RULE: lanterns hang from a rope or ribbon at varied cord lengths, varied sizes, asymmetric left and right, never one lantern hanging from another.
9. **Palette drift.** Electric royal blue (#011048 to #0B20AA) sky and clouds; saturated blue water (#28308A); peach or cream cloud edges (warm fill in a backdrop); mauve posts lighter and warmer than their sheet; a more saturated outer disc than the lantern. RULE: sample colours from `../../accepted/backdrop-bridge.png` (median about RGB 19,22,70 to 23,26,78), `../../accepted/backdrop-sky.png` and `../../accepted/icon.png`. Only the bible hexes. Warm only in lantern bodies, lamp windows and their immediate spill. Lanterns and ribbon are always the brightest, most saturated things.
10. **"Pasted on" look.** Objects with no layer shadow onto what is behind them, ribbon floating above scene layers with an airbrushed smudge for a shadow, lanterns lying on top of rooflines. RULE: every sheet and every pasted sprite casts the standard ink (#241B2F) layer shadow down-right, soft-edged but with a readable shape, and every object sits at a definite layer depth.
11. **Missing delivery or wrong manifest.** Missing files count as rejected.

Also always forbidden (bible 12): text, faces, people, animals, birds, moon, stars, sparkle, bokeh, god rays, lens flare, outer glow bloom, vignette, frame or border, gloss, outlines, a board/grid/tiles/stones/numbers/UI inside the art.

## 2. Accepted assets to match (open them; compare side by side before delivering)

| File (in `../../accepted/`) | Match it for |
|---|---|
| `lantern-unlit.png`, `lantern-amber.png`, `lantern-rose.png`, `lantern-jade.png`, `lantern-azure.png`, `lantern-violet.png` | The ONLY lantern construction. Paste, do not redraw. Note all six keep the amber tassel; leave it. |
| `icon.png` | Paper edge weight (thin lighter cut edge top-left, about 5 to 8 px at 1024), disc and wave sheets with soft down-right ink shadows, muted teal band, texture scale. |
| `backdrop-bridge.png` | Water sheets with visible wavy paper edges, houses and bridge language (flat gabled houses with chimney tabs, stone blocks, semicircular arches resting on piers, small rectangular amber lamps on posts), the exact indigo values, bottom-band reeds and parapet blocks at the margins. This is the closest relative of the new harbor and feature graphic. |
| `backdrop-sky.png` | Stepped violet to indigo-mist to azure paper bands, flat cut-paper cloud banks with lighter top-left edges, tiny lanterns as pasted sprites. |
| `backdrop-garden.png` | Edge and shadow treatment on teal sheets; margin-only detail rule. |
| `daily-medallion.png` | Cream (#F6EAD3) plus paper-2 two-sheet construction and thin cut edge. Use it as the reference for how cream paper should look with thickness. |

Same paper fibre (3 to 5 percent, fine, irregular), same edge, same top-left light, same ink shadow direction on everything.

---



---

## 3. Assets (rejected ones only)

### 3.2 `backdrop-harbor` (opaque, 1024 x 1536, portrait 2:3)

- Purpose (unchanged): background of the Harbor chapter puzzle screens and list. First chapter, most-seen backdrop. The board sits on top in the centre; keep it calm there.
- Previous failures: posts and rope coils with bright cream-tan rims read as a stacked game piece (rounds 1 to 4); the rest of the scene judged "extremely sparse and flat for the most-seen backdrop".
- Start from `../../b1/round-4/out/backdrop-harbor.png` and keep EXACTLY, pixel for pixel: the board zone (y 17 to 77 percent, three water sheets, the faint reflection strips), paper texture, sheet edges and the near-black bottom sheets' colours. Make these changes only:
  1. REMOVE both mooring posts and all their stacked bars and rims entirely (inpaint with the surrounding near-black sheet). No posts, coils, bollards or ropes anywhere in the new image.
  2. ADD a second, nearer shore layer in the top band (y 8 to 16 percent), in front of the existing far shore: a lower, darker sheet of warehouse gables and one small crane-free quay wall, #2B2F78 / #1E2050 family, slightly darker than the far shore so the two read as two layers with a down-right ink shadow between them. Add 2 or 3 thin masts and furled-sail spars rising from it (flat thin sticks, not cream). Keep exactly 3 tiny amber lamp points in total on the whole shore (the existing ones may be kept) and add small amber window dots on the near shore no larger than 1.5 percent of the width each, max 3.
  3. ADD two moored boats in the side margins only, one at the left (x 0 to 14 percent) and one at the right (x 86 to 100 percent), different sizes and facing slightly different heights, sitting on the lowest water sheet around y 70 to 80 percent: each is a single flat lacquer (#2B1F3A) hull with a smooth curved keel, one thin mast and ONE small furled or triangular sail in a muted #BFA98A paper-shade value no brighter than 20 percent above the water sheet it sits against; hull colour is the same hue as the bottom sheet, only about 10 to 15 percent lighter, with NO cream or tan rim line, and a small down-right ink shadow. Hulls must be closed, symmetric and fully connected (rubric 2); each boat may be partly cropped by the canvas edge. They are decoration; nothing essential.
  4. ADD, only in the bottom band (y 78 to 100 percent), one low quay-wall sheet along the very bottom whose top edge is a row of plain rounded stone-block tops (gentle scallops, like the parapet blocks in `backdrop-bridge`), near-black indigo, value within 6 percent of the existing bottom sheet, thin same-hue paper edge. No posts, no pillars.
  5. Water sheet edges: strengthen the visible paper thickness (thin lighter top-left edge 5 to 8 px, soft down-right shadow) so the edge language matches the accepted lantern, `icon.png` waves and `backdrop-bridge`.
- Safe zones (bible 13): top band y 0 to 16 detail allowed, mid-dark; board zone y 17 to 77 and x 5 to 95 calm: mean luminance 12 to 28 percent, no detail more than 8 percent value difference from its surroundings, no bright glints larger than 1.5 percent of the width; bottom band y 78 to 100 darker, low detail. The two boats occupy only the outer 14 percent, and their parts inside x 5 to 14 percent must stay within 8 percent value difference of the water.
- Mood: still, amber-lit, nautical; lamp-lit docks at dusk.
- Must-nots specific to this asset: everything in section 1, plus: no posts, no coils, no rope, no planks, no stacked bars, no cream or tan lines on any dark shape, no moon, no lantern larger than 7 percent of the width, no strong centre focal point, no warm fill across large areas, no more than 6 layers.
- Self-check: compare at 390 px with the board zone and HUD/control bands overlaid next to `accepted/backdrop-bridge.png`: the Harbor should now be as rich as the Bridge in the top and bottom bands, equally calm in the centre, and clearly nautical (boats, masts, gables) rather than stacked pieces. The brightest things in the bottom band must be dimmer than the control buttons.


### 3.3 `empty-archive` (transparent, 1024 x 1024 RGBA, square)

- Purpose (unchanged): spot illustration for the Archive "Completed" tab empty state, shown at 160 css px (shipped 320 px). Meaning: nothing solved yet, light your first one. Wordless, calm, friendly. A caption is added by code under it.
- Previous failures (b2 rounds 1 to 4): lantern drawn as a squat pumpkin, wider and rounder than `lantern-unlit`, with stray cream cap-corner artefacts; ribbon was a flat C-segment, a horseshoe, a sine squiggle, then a shepherd's crook; tray was a featureless cream slab (about 60 percent of the picture mass) or a trapezoid in top-down perspective with a flat lantern in front; composition split left/right with a dead gap; at 160 px "a lantern on a block with a squiggle".
- SIMPLIFIED composition: a shallow tray seen in strict FRONT ELEVATION (no top-down perspective, no trapezoid), the accepted unlit lantern seated inside it, and ONE ribbon hoop with an obvious gap standing in the tray beside it. Two main shapes plus the tray.
  - Tray (cut paper, three sheets): width about 70 percent of the canvas (x 15 to 85 percent), total height about 17 percent, its bottom edge at about y 77 percent. (a) BACK WALL: a band showing behind and above the front wall, about 6 percent of the canvas height, indigo-light #2B2F78 interior (this is what says "empty inside"), with a thin paper-2 top lip. (b) FRONT WALL: about 11 percent of the canvas height, cream #F6EAD3 with a folded-over top lip (the top 30 percent of the wall is a separate lighter sheet with a visible fold line and a down-right ink shadow beneath it), a paper-2 (#E4D2B0) lower band (bottom 25 percent), and ONE cut-paper structure on the face: a centred rounded-rectangle finger slot (about 14 percent of the tray width wide, about 30 percent of the wall height tall) cut through to the indigo-light colour. Two thin darker paper-shade (#BFA98A) corner creases near the left and right ends. (c) END FLAPS: the two side walls seen edge-on as thin paper-2 vertical strips at the left and right ends, slightly proud of the front wall, with the paper-edge treatment. No grain, no gradient, no gloss.
  - Lantern: the accepted `lantern-unlit.png` pasted unmodified, scaled uniformly so the visible lantern from the cord loop to the bottom cap is about 40 to 45 percent of the canvas height; it is perfectly upright, its axis at x about 38 percent. It sits INSIDE the tray: layer it behind the front wall so the front wall's top edge crosses the lantern at the level of its bottom cap and hides the cap's lower part and the tassel. That occlusion is what says "seated in the box". It gets a small ink contact shadow on the back wall, down-right, internal only. Do not repaint, tint or re-draw any part of it; do not add any cream corner or rim that is not already in the sprite.
  - Ribbon hoop: one cream ribbon, constant width 16 to 20 px at 1024 (reviewers measure the board ribbon at 14 to 16 px; do not exceed 20, and never thicker at the ends), following a rounded-RECTANGLE path (section 1 item 4), standing upright in the tray to the right of the lantern, axis at about x 68 percent, outer size about 20 percent of the canvas width by 26 percent of the canvas height, bottom part hidden behind the front wall like the lantern. It has ONE clear OPEN GAP of about 12 percent of the canvas width in the middle of its upper-right run (a visible break in the loop with two square-cut ends, each end showing the second paper-2 sheet), so it reads as an unfinished loop still to be drawn. The two ends do not touch and are not curled, rolled or ball-tipped. Two stacked sheets as in section 1 item 4, thin top-left edge, ink layer shadow onto the back wall.
  - The lantern group and the ribbon hoop should balance: heights within 5 percent of each other at the top, gap between lantern body and hoop at least 8 percent of the canvas width, no overlap.
- Composition: transparent canvas, whole illustration inside a 78 percent box (x 11 to 89, y 11 to 89), nothing in the top 15 percent, balanced slightly low, content roughly y 28 to 77 percent. Outer 4 percent border and all corners alpha 0, clean anti-aliased silhouette, no semi-transparent pixels inside the silhouette, no halo, no cast shadow outside the silhouette, no ground plane. Verify over #12132E, #1E2050, #F6EAD3 and #0E5A5F.
- Must-nots specific to this asset: everything in section 1, plus: no glow (the lantern is unlit), no face or tears, no cobwebs, no dust, no sparkles, no lock, no check mark, no closed ribbon loop, no hook / curl / worm / squiggle, no trapezoid tray floor, no second lantern, no text.
- Self-check at 160 px on the paper colour and on the indigo colour: it must read at once as "a dull lantern waiting in a paper box, and a ribbon loop that is not finished yet". Put it next to `accepted/lantern-unlit.png`: it must be the same object.

---

## Pre-delivery checklist

1. Both files exist in `out/` with the exact names and sizes below; no other files in `out/` except `manifest.json`.
2. Section 1 items 1 to 11 of the original specification checked one by one on each file; zoom to 200 percent on every dark shape: no cream or tan line; zoom to 400 percent around both harbor boats: no rectangular seam.
3. Contact sheets at real display size: `backdrop-harbor` at 390 px wide with HUD, board and control bands, side by side with `accepted/backdrop-bridge.png`; `empty-archive` at 160 px over #12132E, #1E2050, #F6EAD3 and #0E5A5F (it must NOT read as a letter).
4. Script checks: alpha for empty-archive; board zone x52..971 y261..1182 identical to the round-1 harbor file; lantern identity (accepted unlit sprite pixels).
5. Only then write `out/manifest.json`.

## Delivery contract

- Save each image as PNG to `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/lantern-loops/retry/round-3/out/<assetId>.png` with exactly these ids and sizes:
  - `backdrop-harbor` -> `backdrop-harbor.png`, 1024x1536, opaque
  - `empty-archive` -> `empty-archive.png`, 1024x1024, transparent (8-bit RGBA, straight alpha, corners and outer 4 percent border alpha 0)
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` (`file` is the file name, `prompt` the full final prompt including references used, `size` is `"WIDTHxHEIGHT"`, `notes` records compositing, inpainting method, seeds, rejected attempts). Both assets must be listed; a missing one is rejected.
- Read `../../art-bible.md` first. The round-3 revision notes win over everything else.
