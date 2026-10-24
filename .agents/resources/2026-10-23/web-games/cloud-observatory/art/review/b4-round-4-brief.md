# Cloud Observatory - batch b4, round 4 (final round)

Read `../../art-bible.md` first. Only ONE asset remains in this batch: `instrument-aurora-coil`. The other seven instruments (telescope, lens, prism, orrery, star-map, beacon, archive) were ACCEPTED in round 3 and are in `../../accepted/`. Do not redo them. This is the last round; deliver real files.

Style anchors (use as reference images): `../../accepted/instrument-orrery.png` (brass base, satin gold, ink contour, grain) and `../../accepted/instrument-beacon.png` (brass collars, riveted bands), plus `../../accepted/instrument-telescope.png`. The coil must sit in the same set at 112 x 112 px next to them.

## Round-3 review of instrument-aurora-coil: REJECTED

The brass base, glass cylinder, brass cap and ink/brass finish are good and match the set; keep them. Problems to fix:
1. The aurora ribbon reads as SMOKE or STEAM from a chimney, which the brief forbids ("no smoke"). It is a faint, thin, one-hue grey-teal wisp that comes out of a tiny nipple on the cap and drifts sideways. At 48 and 112 px the object reads as "a copper pot with steam", not "a coil with an aurora ribbon". Purpose fail (rubric 8).
2. The ribbon is far too low in contrast and area, and has almost no green or rose edge: only a trace of grey-blue with a pink tip. The brief asks for muted wash-teal, a trace of success green #8FCB9B and a wash-rose edge.
3. The coil body is small and narrow compared with its siblings (about 122k opaque pixels vs 160k to 370k for the others). It looks like a light, squat pot next to the archive and press. Make the coil assembly a little taller and wider so its visual weight matches the set.

## Revision notes (precise)

- Ribbon: draw it as a broad, clearly ribbon-shaped band (a flat flowing curtain with two visible edges, a clear top and underside as it twists), about 40 to 60 px thick at its widest, rising from the cap in an S-curve and curling to the upper right, with a bright, readable body. Use layered translucent watercolour glazes: core wash-teal #6FB3BD, a stripe of success green #8FCB9B on its lower part, and a wash-rose #D98BA0 edge on its upper/far edge. Make it clearly lighter than the navy card (aim at roughly the luminance of the telescope lens glass or brighter) so it still reads on ink-800 at 48 px. Soft edge only at its far tip; no wispy smoke tendrils, no cloudy puffs, no gradients that fade to grey.
- Origin: the ribbon should visibly attach to a small brass terminal or open brass cup on the cap (like a lamp tip), not emerge from a pinhole. It must start thin at the cap and widen as it rises.
- Silhouette: a copper spring with a wavy ribbon. Keep the 14 to 18 even copper turns (copper #B8693F, shade #7E4126) around the glass cylinder, but make the coil taller (about 45 to 50 percent of the canvas height for the cylinder plus coil), keep the round brass base, and let the whole object (base to ribbon tip) span 74 to 82 percent of the canvas on its larger dimension. Ribbon tip stays at least 3 percent inside the canvas.
- Match the accepted set: ink contour 3 to 5 px, satin brass (gold-light/gold-leaf/gold-shade), top-left key light, same paper grain, baseline at 88 percent of the height (y = 901), no ground, no shadow.
- No sparks, no arcs, no neon, no glow halo, no smoke look, no text.
- Verify before delivering: check the 48 px render on ink-800 next to the accepted orrery and beacon; the ribbon must still read as a ribbon and not as smoke or steam.

## Asset

| assetId (file) | Aspect class | Generation size | Background | Used for |
|---|---|---|---|---|
| `instrument-aurora-coil` (`instrument-aurora-coil.png`) | square 1:1 | 1024x1024 | transparent | Build row, Aurora Coil |

## Set rules (unchanged)

- Transparent 1024x1024; product-plate view (eye-level, about 15 degrees from above), object centred, 74 to 82 percent of the canvas on its larger dimension, base line at 88 percent of the height, at least 3 percent transparent margin; ink contour 3 to 5 px, gold ramp per art bible 8.3, parchment/gold-light rim on the top-left edges, soft teal fill in shadows; NO ground, NO table, NO cast shadow; same satin brass finish, line weight and paper grain as the accepted instruments.

## Original spec (unchanged)

## instrument-aurora-coil

- Purpose: Build-row icon for the Aurora Coil: copper and quiet current that makes the sky glow back. It must read as "a copper spring with a wavy ribbon" at 48 px.
- Subject: A vertical copper induction coil: a round brass base, a tall glass cylinder core, a tightly wound copper wire spiral (copper #B8693F, copper-shade #7E4126, 14 to 18 even turns) around it, a brass cap on top, and from the cap a single soft ribbon of aurora (muted wash-teal, a trace of success green #8FCB9B and wash-rose edge, translucent, wavy) rising and curling to the upper right, entirely inside the canvas margin.
- Composition: per the set rules above; silhouette a copper spring with a wavy ribbon; light from the top-left.
- Must-nots: No lightning bolts, no sparks, no electric arc, no neon glow, no smoke, no wires hanging out of frame, no turns that overlap or break, ribbon must not touch the canvas edge, no text. No text, no numbers, no stars baked in, no frame or card, no drop shadow, no mirror gloss, no plastic look.


## Delivery contract

- Save the image as PNG to `b4/round-4/out/instrument-aurora-coil.png` (exact id, 1024x1024, 8-bit straight RGBA). Corners and the outer 3 percent border fully transparent. No extra files in `out/` other than `manifest.json`.
- Write `b4/round-4/out/manifest.json` as a JSON array with one object: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is `instrument-aurora-coil.png`, `model` is the generator used, `prompt` is the full final prompt (and the reference images used), `size` is `"1024x1024"`, `transparent` is true, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know.
- Write the files BEFORE reporting done and verify with `ls -la b4/round-4/out`. Do not write into earlier rounds' folders.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.
