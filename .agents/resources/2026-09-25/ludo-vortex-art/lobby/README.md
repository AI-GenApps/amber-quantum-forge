# Ludo Vortex — Lobby Art Set 2

Generated with the `higgsfield` CLI (account `research@w3dev.email`, pro plan), model
`gpt_image_2_5`, `--quality high --resolution 2k --image-references ../logo/token-orbit-icon.png`
for every call (the approved Direction-C icon, used purely for gold-ring/token style
consistency, not for literal reuse). Backgrounds used `--background opaque`, tiles used
`--background transparent`. All generation scripts and raw job JSON (one per image, with the
full params + result URL) live alongside the PNGs in this folder. Mockups and the contact
sheet were composited locally with PIL — no generation involved — by `build_mockups.py`.

No app code was modified. Nothing was committed except this `lobby/` folder.

## Shared style blocks (prepended to every prompt)

**Backgrounds:** "Premium casual mobile game lobby background art, like top-grossing Ludo and
board game apps. Glossy, saturated, 3D-lit atmosphere. Deep royal-blue to navy color palette
with warm gold light accents, matching the reference icon's gold-rimmed token style. Crisp
clean edges, no photorealism, no grain, no banding. ORIGINAL design, do not imitate Ludo King
or any existing game's background, no crowns, never the word King, no Chrome-browser-like
four-color pinwheel/swirl shapes. Portrait 9:16 orientation. Absolutely no text, no letters, no
logos, no UI elements, no watermark. Keep the center third of the frame visually calm and
low-detail (no strong focal shapes) so UI cards can be placed over it."

**Tiles (Style A + initial Style B pass):** "Premium casual mobile game UI tile illustration,
like top-grossing Ludo and board game apps. Glossy, saturated, 3D-rendered casual-game render,
chunky rounded friendly shapes, soft studio lighting with a rim light, subtle drop shadow only
(no background shape, no ground plane). Candy-bright red, green, yellow, blue accents (classic
Ludo colors) plus gold metallic accents, matching the reference icon's gold-rimmed glossy
token style. Crisp clean edges, no photorealism, no grain. ORIGINAL design, do not imitate Ludo
King or any existing game's icon, no crowns, never the word King, no Chrome-browser-like
four-color pinwheel/swirl shapes. Single clear hero object, centered, readable at small size
(300px), absolutely no text, no letters, no watermark, square 1:1 composition, transparent
background, nothing but the object and its soft shadow."

## Backgrounds (9:16, opaque)

- **bg-a.png** — "night carnival". Full prompt = style block + "Concept: night carnival. A deep
  royal-blue to navy gradient background, darker at the bottom, with a soft golden spotlight
  glow radiating down from the top edge. A faint, tilted dice-and-board-grid pattern is
  embossed subtly into the navy in the background, barely visible. Floating soft-focus golden
  bokeh sparkles drift through the scene at varying sizes. A subtle dark vignette frames the
  edges." Job record: `bg-a.json`.
- **bg-b.png** — "vortex galaxy". Full prompt = style block + "Concept: vortex galaxy. A deep
  navy background with a slow, luminous blue vortex swirl glowing softly and centered behind
  the upper third of the frame, like a gentle whirlpool of light. Tiny floating dice and
  map-pin-shaped game tokens are scattered far in the background, small and softly blurred for
  depth. Fine gold dust particles drift through the scene. A subtle dark vignette frames the
  edges." Job record: `bg-b.json`.

Both generated 2048×2048 natively at `aspect_ratio=9:16` and were delivered at 1520×2688
(the model's actual 9:16 output resolution). Both are RGB (opaque as requested), no alpha
channel expected/needed.

## Style A tiles — "3D objects" (1:1, transparent)

Generated on the first pass, no regeneration needed.

- **tile-a-computer.png** — style block + "Hero object: a friendly glossy 3D robot head,
  rounded and cute, with two dice serving as its eyes (each die showing pips), a small antenna
  on top, blue and silver glossy plating with gold accent trim." (`tile-a-computer.json`)
- **tile-a-pass.png** — style block + "Hero object: two glossy stylized 3D hands passing a
  glossy smartphone between them, the phone screen displaying a small glowing mini ludo board
  icon, warm gold highlight on the phone edge." (`tile-a-pass.json`)
- **tile-a-friends.png** — style block + "Hero object: three glossy 3D map-pin shaped game
  tokens (one red, one green, one yellow) huddled close together in a friendly group, with a
  small glossy red heart and a small speech bubble floating just above them."
  (`tile-a-friends.json`)
- **tile-a-online.png** — style block + "Hero object: a glossy 3D globe with soft blue
  continents, wrapped by a thin glowing orbit ring carrying four small colored map-pin tokens
  (red, green, yellow, blue) evenly spaced around the orbit." (`tile-a-online.json`)

## Style B tiles — "badge icons" (1:1, transparent)

First-pass attempt at tile-b-pass/friends/online reused the "matching the reference icon's ring
style" phrasing too literally: the model reproduced the reference icon's four-orbiting-tokens
scene almost verbatim instead of the requested subject (phone hand-off / heart / globe) for
those three (tile-b-computer alone came out correct on the first try). Regenerated all three
with a tightened prompt that isolates the reference to "gold ring bevel/rim-light style only"
and explicitly forbids reproducing pins, star, or orbiting shapes. Second pass matched the
brief; no further regeneration needed.

- **tile-b-computer.png** (kept from first pass) — style block + "Hero object: a chunky round
  gold-rimmed medallion badge emblem, matching the reference icon's ring style exactly, with a
  blue-to-navy gradient face and a bold 3D glossy robot-head-with-dice-eyes symbol embossed at
  its center." (`tile-b-computer.json`)
- **tile-b-pass.png** (regenerated) — style block + "Hero object: A chunky round medallion
  badge emblem: a thick gold metallic ring border (use the reference image ONLY to copy the
  gold ring's bevel and rim-light style, nothing else from the reference), enclosing a solid
  gradient-color circular face. The face is a green-to-teal gradient. Embossed in bold 3D
  glossy relief at the center of the face: two simple stylized hands passing a small glossy
  smartphone between them. Do NOT include any map-pin tokens, do NOT include a star, do NOT
  include orbiting shapes — only the ring and the hands-and-phone symbol." (`tile-b-pass.json`)
- **tile-b-friends.png** (regenerated) — style block + same badge-base sentence + "The face is
  a red-to-pink gradient. Embossed in bold 3D glossy relief at the center of the face: two
  simple rounded friendly figures standing side by side with a small glossy heart floating
  above them. Do NOT include any map-pin tokens, do NOT include a star, do NOT include orbiting
  shapes — only the ring and the two-figures-with-heart symbol." (`tile-b-friends.json`)
- **tile-b-online.png** (regenerated) — style block + same badge-base sentence + "The face is a
  purple-to-blue gradient. Embossed in bold 3D glossy relief at the center of the face: a
  simple glossy globe with latitude and longitude lines, wrapped by one thin orbit ring. Do NOT
  include any map-pin tokens, do NOT include a star — only the ring and the globe symbol."
  (`tile-b-online.json`)

All 8 tiles are 2048×2048 RGBA PNGs with genuine alpha (`getextrema()` on the alpha channel
returns `(0, 254)` for every tile — real transparency, not a chroma-key hack).

## Mockups (PIL composite only, no generation)

`build_mockups.py` composites, at 1080×2400:

- background (bg-a for mockup-a, bg-b for mockup-b), cover-cropped to fill the frame
- `../logo/wordmark-final-v1-transparent.png` at ~80% width, top
- a rounded gold-bordered navy player-name bar placeholder ("Player1000" + avatar circle)
- a 2×2 grid of rounded gold-bordered navy cards, each holding one tile illustration + a bold
  white label; the bottom two cards (Play with Friends / Online) are dimmed (tile desaturated
  and alpha-reduced) with a "Coming soon" pill and "Not available yet" subtext, matching the
  device screenshot's current copy

Outputs: **mockup-a.png** (Style A tiles + bg-a) and **mockup-b.png** (Style B tiles + bg-b).
**contact-sheet.png** lays out all 12 PNGs (both backgrounds, all 8 tiles, both mockups) on a
checkered backdrop so transparency is visible at a glance.

## QA

Every image was viewed with the Read tool and checked against the brief (no text/letters, no
watermark, no crowns, no "King", no Chrome-style four-color swirl, correct subject). Alpha
channels on all 8 tiles were verified programmatically with PIL (`Image.getchannel("A").
getextrema()`), confirming genuine partial transparency, not full-opaque fallback.

One regeneration round was needed (tile-b-pass, tile-b-friends, tile-b-online — wrong
subject on first pass, see above). Everything else passed first try. Total generations used:
**13** (10 initial + 3 regenerated Style-B tiles).

## Recommendation

**Direction B (mockup-b.png / bg-b "vortex galaxy" + badge-icon tiles) is the stronger
option.** The vortex-galaxy background reads as far more premium and on-brand — it directly
echoes the wordmark's swirl motif and the token-orbit icon, keeps the center calm for the
player bar and cards, and has a clear focal glow instead of competing detail. The gold-rimmed
badge tiles are compact, legible at small sizes, and tie visually to the app icon's ring
language, giving the lobby a cohesive icon-to-lobby identity.

Direction A (bg-a "night carnival" + 3D-object tiles) is also usable and the 3D-object tiles
(robot/hands/heart-huddle/globe) are individually charming and characterful, but the carnival
background drifted from the brief (circus tent + balloons rather than the requested dice/board
grid pattern) and its top-heavy ornamentation crowds the wordmark. If a warmer, more playful
tone is wanted over the cooler "vortex" premium tone, A is the fallback — but B is the
recommended ship candidate.
