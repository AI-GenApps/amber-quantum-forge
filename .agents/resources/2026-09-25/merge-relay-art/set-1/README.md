# Merge Relay ("Glow Rescue") — art-set dry run (task 20)

Preview bitmap art for the manifest slots from task 07, in two directions, so
the user can pick one in task 21 before any final renders are made.
**Nothing here is final; nothing is wired into `apps-native/`.**

The brand name is **"Glow Rescue"** (`tasks/epics/16-games-portfolio-wave2/decisions.md`).
Mockups use the placeholder wordmark text "Glow Rescue" per the orchestrator's
note for this run (the real logo lockup comes from task 19/22) — this is
already what the current screen goldens under
`apps-native/games/merge_relay/test/goldens/screens/` show, so no extra
wordmark rendering was needed in the mockups.

## Status of the first attempt

The first attempt at this task (2026-09-26, ~01:38-01:43) was **BLOCKED**:
`image-gen`'s wrapped `codex exec` session reported the `imagegen` tool
missing from its tool list three times in a row, with a 4th attempt on the
`gpt-6-astra` fallback model rejected outright (`400 invalid_request_error`,
unsupported on a ChatGPT-account Codex login). No art was produced and
nothing was substituted for it; the folder was left with only an empty
`direction-a/`, `direction-b/`, `raw/` scaffold and a README describing the
outage in full (session log paths etc.), uncommitted, now superseded by this
file.

This run (2026-09-27) re-ran the smoke test per the orchestrator's note that
`image-gen` was fixed; it returned a real 1254x1254 RGBA PNG in ~68s. This
document replaces the blocked README with the actual dry-run results below.

## Tool, model, and one operational note

- Tool: `~/.local/bin/image-gen` (a `codex exec` wrapper). Default model
  `gpt-6-luna` for every generation below (no image needed the `gpt-6-astra`
  fallback).
- Usage: `image-gen --prompt "<prompt>"`. ~40-180s per image, run in the
  background with a >=600s timeout, up to 3 concurrent.
- **Operational note:** on the smoke test, the wrapped `codex exec` session
  did not print a path under `~/.codex/generated_images/` as documented —
  it independently decided to write the output file straight into the repo,
  at `apps-native/games/merge_relay/assets/art/tile-tier-2-sleepy-candidate.png`.
  That is outside this task's scope (`apps-native/` must not gain any file
  from this task). Every generation below was immediately checked with
  `git status --porcelain apps-native/` right after the tool returned; any
  file it wrote there was copied into `raw/` and then deleted from
  `apps-native/` before the next generation started. `git status --porcelain
  apps-native/` is confirmed clean at the end of this task (see
  "Verification" below) — it happened on the smoke test only; every other
  generation printed its path under `~/.codex/generated_images/` as
  documented.

## Directions

- **A — code-drawn continuity**: matches the flat-vector, soft "physical
  card" look of task 08's code-drawn tier faces
  (`.agents/resources/2026-09-25/games-wave2-qa/08/tier_sheet.png`, passed to
  every Direction A prompt by absolute path as the style reference): minimal
  dot-and-line eyes/mouth, single soft flat shading, warm pastel-to-saturated
  per-tier color from `MrTokens.tileTierColors`.
- **B — bolder painted/3D-toy**: a glossier, more dimensional "toy" take —
  thicker specular highlights and ambient-occlusion shadow modeling, chunkier
  proportions, more saturated color, a painterly/glazed-ceramic render pass.
  Still original, still Threes!-grade, not photorealistic.

Both directions are 100% original art; Threes! is the quality bar only
(named style anchors in
`.agents/resources/2026-09-25/merge-relay-visual-reference/README.md`), never
copied or traced.

## Contents of this folder

- `raw/direction-{a,b}_<slot>_v1.png` — the 14 generated PNGs, unedited
  except for alpha cleanup on the transparent tile faces (see "Verifying
  the tile alpha" below).
- `direction-{a,b}/mockups/{home,play_rescue,chapter_map}.png` — the 6
  full-screen mockups, composited over the current screen goldens.
- `contact-sheet.png` — all 14 raw generations side by side (A vs. B).
- This `README.md`.

## Slots (7 per direction, 14 generations total)

`tileFace_2`, `tileFace_16`, `tileFace_128`, `tileFace_2048` (the 4 sample
tiers the task calls for; transparent background, numeral-safe lower-center
third left plain), `homeScene`, `boardFrame`, and one chapter-1 illustration
(chapter 1's theme is **"harbor"** / dawn — read from
`apps-native/games/merge_relay/content/rescue_boards.json`'s first board,
`rescue-harbor-01`, titled "First Light").

## Generation log

Each entry: file, exact prompt, and any regeneration note. All generations
use model `gpt-6-luna`.

### direction-a/tileFace_2.png

> A single game tile character face icon for a mobile puzzle game. Style
> must closely match the reference sheet at
> `/home/.../games-wave2-qa/08/tier_sheet.png`: flat vector illustration,
> soft rounded square card, simple closed sleepy dot-and-line eyes, small
> closed smile, single soft light source from the top-left, warm
> cream-white color like the reference sheet's lowest tier. Fully
> transparent background (PNG with alpha channel, no background color at
> all, no ground shadow). No text, no numerals, no watermark. Leave the
> lower-center third of the square plain and unobstructed (a numeral will
> be added there later by code). Centered, single object, mobile game
> asset icon.

Smoke test (2026-09-27). ~68s. **Operational note:** the tool wrote the PNG
straight into the repo at
`apps-native/games/merge_relay/assets/art/tile-tier-2-sleepy-candidate.png`
instead of printing a `~/.codex/generated_images/...` path — copied to
`raw/direction-a_tileFace_2_v1.png` and the stray repo file deleted
immediately (`git status --porcelain apps-native/` confirmed clean right
after). On-brief on the first try; not regenerated.

### direction-a/tileFace_16.png

> A single game tile character face icon for a mobile puzzle game. Style
> must closely match the reference sheet at
> `/home/.../games-wave2-qa/08/tier_sheet.png`: flat vector illustration,
> soft rounded square card with a slightly darker edge along the bottom,
> simple open dot eyes and a small closed smile drawn only in thin dark
> navy line-and-shape strokes (no other linework or outline), single soft
> flat shading with an implied light source from the top-left, warm
> saturated orange color (like the reference sheet's mid-warm tiers).
> Fully transparent background (PNG with alpha channel, no background
> color at all, no ground shadow). No text, no numerals, no watermark.
> Leave the lower-center third of the square plain and unobstructed (a
> numeral will be added there later by code). Centered, single object,
> mobile game asset icon. Do not save or copy this file into any project
> or repository directory yourself.

### direction-a/tileFace_128.png

Same template as `tileFace_16` above, with: "simple open dot eyes with
tiny white highlight dots and a wide open smiling mouth drawn only in
thin/simple shapes (no other linework or outline) ... warm saturated
magenta-pink color (like the reference sheet's upper-mid tiers)".

### direction-a/tileFace_2048.png

Same template, with: "an excited expression made of two small round
sparkle shapes near the top as eyes, a small round open mouth, and 2-3
tiny four-point sparkle/star accents near the corners, drawn only in
thin/simple cream-white shapes (no other linework or outline) ... deep
saturated teal color (like the reference sheet's high tiers)".

Slight style drift: this render has a faint glossy top-left highlight (a
touch more dimensional than task 08's flatter reference), and a very
faint smudge in the lower-left quadrant. Kept anyway — the expression,
palette, and composition are on-brief and it still reads clearly as
"flat-ish" next to the other three Direction A tiles; not regenerated.

### direction-a/homeScene.png

> A wide flat-vector illustration background scene for a cozy mobile
> puzzle game's home-screen hero banner, in the same flat-vector style as
> the reference sheet at `/home/.../games-wave2-qa/08/tier_sheet.png`: a
> calm dawn harbor, warm cream-to-soft-orange gradient sky, a few soft
> rounded fluffy clouds, a small simple lighthouse and harbor silhouette
> in the distance, two or three small rounded-square rescue-tile
> characters (simple flat vector shapes with tiny dot-and-line sleepy or
> happy faces, cream and soft orange colors, matching the reference
> sheet's character style) floating gently near the top of the frame,
> calm and inviting mood, generous open negative space across the lower
> two-thirds of the frame for headline text to sit on top later. Do not
> render any text, letters, numbers, or watermark anywhere in the image.
> Portrait orientation, roughly 1080 by 1200 pixels. Do not save or copy
> this file into any project or repository directory yourself.

### direction-a/boardFrame.png

> A flat-vector illustration background texture for a cozy mobile puzzle
> game's board panel, in the same flat-vector style as the reference
> sheet at `/home/.../games-wave2-qa/08/tier_sheet.png`: a large soft
> rounded-rectangle warm cream card (hex approximately fff7ea), with a
> very subtle inner drop shadow along its top-left edge and a faint,
> almost imperceptible dot-grid or fine woven-paper texture across the
> surface, no characters, no faces, no text, no numerals, no grid lines,
> no border stroke, just the empty warm cream frame/background texture,
> calm, minimal, flat. Square aspect, roughly 1080 by 1080 pixels. Do not
> save or copy this file into any project or repository directory
> yourself.

### direction-a/chapterCard_1.png

> A landscape banner illustration for 'Chapter 1: Harbor at first light'
> in a cozy mobile puzzle game about rescuing small character tiles, in
> the same flat-vector illustration style as the reference sheet at
> `/home/.../games-wave2-qa/08/tier_sheet.png`: a small dawn harbor scene,
> a simple lighthouse, a calm sea with soft flat-vector wave shapes, warm
> sunrise gradient sky fading from soft peach to cream, one or two small
> rounded-square rescue-tile characters (simple flat vector shapes with
> tiny dot-and-line happy faces, matching the reference sheet's character
> style) sitting on a wooden dock, warm cozy inviting palette. Do not
> render any text, letters, numbers, logo, or watermark anywhere in the
> image. Landscape banner aspect, roughly 1200 by 600 pixels. Do not save
> or copy this file into any project or repository directory yourself.

(Chapter 1's theme, "harbor" / dawn, and its board title "First Light" are
read from `apps-native/games/merge_relay/content/rescue_boards.json`'s
first board, id `rescue-harbor-01`.)

### direction-b/tileFace_2.png, tileFace_16.png, tileFace_128.png, tileFace_2048.png

Shared template (bold glossy 3D-toy direction, no reference image passed —
Direction B is intentionally a different rendering style, not a
continuity match):

> A single game tile character icon for a mobile puzzle game, bold glossy
> 3D-toy rendered illustration style (like a glazed ceramic or vinyl
> collectible figure): a chunky rounded-square puzzle tile with thick
> specular highlight top-left and soft ambient-occlusion shadow modeling
> along the bottom edge, **[expression]**, **[color]**, dimensional not
> flat. Fully transparent background (PNG with alpha channel, no
> background color at all, no ground shadow). No text, no numerals, no
> watermark. Leave the lower-center third of the tile plain and
> unobstructed (a numeral will be added there later by code). Centered,
> single object, original character design, mobile game asset icon. Do
> not save or copy this file into any project or repository directory
> yourself.

- `tileFace_2`: expression "simple closed sleepy dot-and-line eyes, small
  closed smile", color "warm cream-white".
- `tileFace_16`: expression "simple open dot eyes and a small closed
  smile", color "warm saturated orange".
- `tileFace_128`: expression "simple open dot eyes with tiny white
  highlight dots and a wide open smiling mouth", color "warm saturated
  magenta-pink".
- `tileFace_2048`: expression "an excited expression made of two small
  round sparkle shapes as eyes, a small round open mouth, and 2-3 tiny
  four-point sparkle/star accents near the corners", color "deep
  saturated teal". Generated in a second batch after the other three (an
  oversight, not a quality regeneration — the first Direction B batch only
  covered 3 of the 4 required sample tiers, and the miss was caught while
  wiring up the Play mockup compositor, which needs all 4 tiers).

### direction-b/homeScene.png

> A wide bold glossy 3D-toy rendered illustration background scene for a
> cozy mobile puzzle game's home-screen hero banner (like a diorama of
> glazed ceramic and vinyl-toy pieces): a calm dawn harbor, warm saturated
> sunrise sky, soft dimensional clouds, a small glossy lighthouse and
> harbor silhouette in the distance, two or three chunky glossy
> rounded-square rescue-tile characters with simple happy faces and thick
> specular highlights floating near the top of the frame, Threes!-grade
> polish, calm and inviting mood, generous open negative space across the
> lower two-thirds of the frame for headline text to sit on top later. Do
> not render any text, letters, numbers, or watermark anywhere in the
> image. Portrait orientation, roughly 1080 by 1200 pixels. Do not save
> or copy this file into any project or repository directory yourself.

### direction-b/boardFrame.png

> A bold glossy 3D-toy rendered background texture for a cozy mobile
> puzzle game's board panel (like a diorama of glazed ceramic and
> lacquered wood): a large rounded-rectangle warm cream tray/frame with
> soft dimensional ambient-occlusion shading along its inner edge and a
> subtle glossy highlight along the top, no characters, no faces, no
> text, no numerals, no grid lines, just the empty frame/background
> texture, warm cream and soft navy-shadow tones, Threes!-grade polish.
> Square aspect, roughly 1080 by 1080 pixels. Do not save or copy this
> file into any project or repository directory yourself.

This render's warm-cream tray sits on a **navy square background**
(visible in `raw/direction-b_boardFrame_v1.png`) — the mockup compositor
crops 14% off each edge before fitting it into the board panel's own
rounded-rect shape, so the navy never appears in the Play mockup.

### direction-b/chapterCard_1.png

Same chapter-1/harbor brief as Direction A's, restyled: "bold glossy
3D-toy rendered illustration style (like a diorama of glazed ceramic and
vinyl-toy pieces): a small dawn harbor scene, a glossy lighthouse, a
chunky dimensional sea with soft ambient-occlusion shaded wave shapes,
warm sunrise gradient sky, one or two chunky glossy rounded-square
rescue-tile characters with simple happy faces sitting on a dock, thick
specular highlights, saturated warm cozy palette, Threes!-grade polish."
Same no-text/landscape-banner constraints.

## Regenerations

**None were needed against the "off-brief" bar** (checklist item 2: "VIEW
everything, and regenerate off-brief images once") — all 14 generations
were on-brief on the first try. The two footnotes above
(`direction-a/tileFace_2048.png`'s minor style drift, and
`direction-b/tileFace_2048.png`'s late second-batch generation) are the
only things flagged, and neither was a quality-driven regeneration.

## Verifying the tile alpha

Every `tileFace_*` raw file is RGBA with a fully transparent border and a
near-opaque interior (checked with Pillow/numpy: corner alpha mean 0.0,
center alpha mean 252-254 out of 255, for all 8 files across both
directions). The task's own verification command (below) confirms mode
`RGBA` on all 8 `tileFace_*` files and `RGB` (no alpha needed) on the
opaque scene/frame/banner files.

## Mockups (`direction-{a,b}/mockups/*.png`, built with Pillow)

`home.png`, `play_rescue.png`, `chapter_map.png` per direction, composited
over the current screen goldens
(`apps-native/games/merge_relay/test/goldens/screens/{home,play_rescue,
chapter_map}.png`) with `/data/tools/pyenv/bin/python` + Pillow:

- **Home**: the generated `homeScene` art fills the hero card (replacing
  the code-drawn gradient+tile-stack fallback), with a soft dark scrim
  added over its lower half so the existing white headline/tagline/CTA
  stay legible regardless of how light the art's bottom is. Badge,
  title, tagline, and button are re-drawn with the game's own fonts
  (Fredoka/Nunito Sans) at the hero's real coordinates — a close
  approximation of the live widget, not a pixel-exact reproduction.
- **Play (mid-game)**: the generated `boardFrame` art fills the board
  panel; the two existing "2" tiles are re-skinned with the generated
  `tileFace_2` art, and the `tileFace_16`/`128`/`2048` samples are placed
  in three previously-empty cells so all 4 sample tiers are visible
  together. **This is a style-comparison board state, not a legal/
  reachable one** — "First Light"'s goal is 8 points, so a 2048 tile
  could never appear there in real play; the mockup exists purely to
  show what the 4 sample tiers look like sitting on the new board art.
- **Chapter map**: since the chapter card's real layout doesn't have a
  free region to drop an illustration into without reflowing existing
  elements, the mockup instead prepends a new 340px banner (the
  `chapterCard_1` art, captioned "Chapter 1 · Harbor at first light",
  fading into the paper background) above the **unmodified** chapter-map
  golden, which is shifted down to make room. Canvas grows from
  1080x2400 to 1080x2740; nothing below the banner is touched.

Two bugs were caught and fixed while building these:

1. Fredoka and Nunito Sans's variable-font axes are ordered `[Weight,
   Width]` (confirmed with `ImageFont.get_variation_axes()`), not
   `[Width, Weight]` — the first draft passed them in the wrong order,
   which silently sent an out-of-range Width value and drove the
   digit/text glyphs into solid black blobs. Every text render in the
   mockups uses the corrected axis order.
2. Tile art was pasting with solid black corners: Pillow's paste mask
   was the target rounded-rect alone, ignoring the source tile's own
   alpha (which has transparent padding around its card shape that
   doesn't fill the whole target cell). Fixed by intersecting the target
   mask with the source's alpha channel (`ImageChops.multiply`) before
   every paste.

## Asset count and estimated generations for the final set

This dry run: **14 generations** (7 slots x 2 directions), all on-brief,
zero true regenerations (see "Regenerations" above).

The final set (task 23), once the user picks one direction at task 21,
needs the full manifest, not just the 4 sample tiers:

| Slot | Count |
|---|---|
| `tileFace_<tier>` (all 12 tiers in `MrTokens.tileTierColors`, not just the 4 shown here) | 12 |
| `homeScene` | 1 |
| `boardFrame` | 1 |
| chapter-card illustration, one per chapter (6 chapters: harbor / foundry / orchard / bazaar / glacier / observatory, per `content/rescue_boards.json`'s chapter-1 id prefixes) | 6 |
| **Subtotal** | **20** |
| Expected regenerations (this dry run's 0-of-14 miss rate is optimistic for a full run; budgeting ~2-4 off-brief reshoots) | +2-4 |
| **Estimated total for the final set** | **~22-24 generations** |

(`logoWide`/`logoStacked` are out of scope here — task 19/22's logo
dry run and final render cover those slots separately.)
