# Merge Relay art provenance

Every file in this directory is **original AI-generated art**, produced for
this game with `~/.local/bin/image-gen` (wraps `codex exec`, model
`gpt-6-luna`) per task
`tasks/epics/16-games-portfolio-wave2/22-mr-logo-final-and-integrate.md`.
No stock, downloaded, or code-drawn asset is presented as generated art
anywhere in this table. Masters, prompts, and full generation logs live at
`.agents/resources/2026-09-25/merge-relay-art/logo/final/`.

| File | Master path | Tool / model | Date | Notes |
|---|---|---|---|---|
| `logoWide.png` | `.agents/resources/2026-09-25/merge-relay-art/logo/final/logo_wide.png` | `image-gen` (`gpt-6-luna`) | 2026-09-27 | The cleaned `wordmark.png` (below), resized (Pillow, no further AI generation). Wordmark-only lockup for the home header (`MergeRelayArtManifest.logoWide`) — the review at orchestrator fix round 1 asked to drop the small tile icon here so the wordmark itself can read as the clear ~55-65%-width brand element without looking cramped next to the settings button. |
| `logoStacked.png` | `.agents/resources/2026-09-25/merge-relay-art/logo/final/logo_stacked.png` | `image-gen` (`gpt-6-luna`) | 2026-09-27 | Composite (Pillow) of `icon_transparent.png` (a key-out of `icon.png`, see below) + `wordmark.png`, stacked. Vertical icon-over-wordmark lockup for the welcome screen (`MergeRelayArtManifest.logoStacked`), sized as the hero element there (~60-70% of screen width). Fix round 2 (orchestrator review): the icon master is opaque RGB, and the first cut of this file composited it straight in at full alpha, which painted a visible pale square behind the glowing tile on `welcome.png`. Now composited from a keyed-out transparent variant instead — see "Post-processing" below. |

## Source renders (not shipped in-app directly; composited into the two files above)

| File | Prompt | Notes |
|---|---|---|
| `icon.png` (1024x1024, opaque) | "Final production-quality app icon, 1:1 square, for a premium casual mobile puzzle game called Glow Rescue. Match the exact style, palette, and composition of the reference image at `.../logo/A-hero-glow/icon.png` as closely as possible (this is the approved direction, being re-rendered at final polish): a single friendly rounded-square tile character, face-forward, warm golden-orange to yellow gradient glossy body, soft warm glow aura around it, simple minimal cute face (closed happy eyes, small smile, rosy cheeks), thick rounded darker-orange outline, warm cream background, no text, no watermark, crisp clean edges, reads clearly at small sizes like 48px, original character design" | Re-render of task 21's picked icon direction A (`mr_icon: A` in `decisions.md`), referencing that dry-run master by absolute path to carry the style over exactly. Also embedded (base64) into `assets/branding/icon.svg` for the launcher icons. |
| `wordmark.png` (transparent, cropped + cleaned) | "Final production-quality wordmark logotype graphic reading exactly 'Glow Rescue' (two words, capital G and R, rest lowercase). Match the exact style, palette, letterforms, and spark accent of the reference image at `.../logo/B-merge-spark/wordmark.png` as closely as possible (this is the approved direction, being re-rendered at final polish): bold rounded friendly display typeface, warm golden-yellow to orange gradient fill, thin dark-navy outline around the letters, a small bright four-point spark/flash icon placed between the two words, on a fully transparent background (PNG with alpha), flat vector illustration, clean crisp edges, premium casual mobile game branding, no other text, no watermark" | Re-render of task 21's picked wordmark direction B (`mr_wordmark: B`). Came back RGBA with real alpha; cropped to its opaque bounding box + margin, then eroded 1px and de-fringed with Pillow (see `.agents/resources/2026-09-25/merge-relay-art/logo/final/README.md`). Spelling verified as exactly "Glow Rescue". |

## Post-processing

- `icon.png`: resized to exactly 1024x1024 (LANCZOS) from the raw
  1254x1254 render; no alpha needed (full-bleed opaque square, matching
  how real premium app icons ship — see task 19's own note on this).
- `wordmark.png`: cropped to its alpha bounding box + 14px margin, then
  eroded 1px and de-fringed (blur-based edge color pull-in) to remove any
  generator fringe. Verified with Pillow: alpha ranges 0–254 (real
  binary-ish alpha), and `wordmark_check.png` (masters folder) shows it
  composited over a checkerboard with no visible fringe.
- `logoWide.png`: the cleaned `wordmark.png` resized so its longest side is
  1024px (no compositing — icon dropped per the fix-round-1 review below).
- `icon_transparent.png` (masters folder only, not shipped in-app): a
  fix-round-2 key-out of the opaque `icon.png`, used only to build
  `logoStacked.png`. Background color sampled from the four corners of
  `icon.png` (avg. `(252.5, 248.5, 232.0)`); a soft, distance-based
  threshold (fully transparent within 10 units of that color, fully
  opaque past 55 units, linearly interpolated between) keys out the flat
  cream field while keeping the tile's own soft glow — a gradient from
  cream into the tile's orange — as smooth partial alpha rather than a
  hard-edged cutout ring, then eroded 1px and de-fringed the same way
  `wordmark.png` was.
- `logoStacked.png`: a pure Pillow composition (no further AI generation)
  of `icon_transparent.png` + `wordmark.png` onto a fully transparent
  canvas, downscaled so it doesn't exceed 1024px on its longest side.
  Verified with Pillow (also asserted by
  `test/merge_relay_art_manifest_test.dart`'s "logoStacked.png background
  alpha" group, which decodes this exact shipped file): all four corners
  and a strip left of the icon are alpha `0`, while the tile's own
  interior still reaches alpha `255` — a real soft key-out, not an
  accidentally all-transparent image. Full script output in
  `.agents/resources/2026-09-25/merge-relay-art/logo/final/README.md`.
- Both in-app files are well under the 600 KB budget (140 KB / 224 KB).

## Task 23 — tile-tier, scene, board, and chapter art

Every file below is also **original AI-generated art**, produced with the
same `~/.local/bin/image-gen` (model `gpt-6-luna`) per
`tasks/epics/16-games-portfolio-wave2/23-mr-art-final-and-integrate.md`,
rendering approved art direction B (`mr_art_direction: B`, "glossy
painted/3D-toy" — `decisions.md`). Masters (unmodified, exactly as
generated), the full per-file prompt log, and post-processing notes live at
`.agents/resources/2026-09-25/merge-relay-art/set-1/final/`. Every in-app
copy here is a Pillow resize/re-encode of its master — no further AI
generation past that resize.

### Tile-tier cards (`tileFace_<tier>.png`, 12 files)

Shared prompt template (`tileFace_2.png` generated first and then passed
back in as the style-continuity reference for the other 11, so all 12 share
one light direction, outline weight, and card proportions):

> Final production-quality game tile card illustration for a mobile puzzle
> game. Match the exact bold glossy 3D-toy rendered style, top-left
> specular highlight, outline weight, rounded-square card silhouette, and
> face placement/scale of the reference image at `<tileFace_2.png master>`
> as closely as possible (this is the already-approved production
> tile-card style; every tier must look like one consistent set). Only
> change: the face in the upper 40 percent of the card has `<expression>`,
> and the whole glossy card body is a solid `<color name>` color
> (approximately hex `<hex>`). The lower 55 percent of the card is a
> smooth plain surface in that same solid color, with absolutely no face
> elements, no text, no shadows there (a numeral is added later by code).
> Fully transparent background outside the rounded-square card (PNG with
> alpha channel, no ground shadow). No text, no numerals, no watermark.
> Centered, single object, original character design, dimensional not
> flat, mobile game asset, crisp clean edges.

| Tier | Expression | Fill (matches `MrTokens.tileTierColors`) |
|---|---|---|
| 2 | sleepy dot-and-line eyes, small closed smile (first render — no reference image, sets the style) | `#ffffff`/cream |
| 4 | sleepy dot-and-line eyes, small closed smile (slightly more awake) | `#ffe9c6` |
| 8 | open oval eyes, small closed smile | `#ffc97a` |
| 16 | open oval eyes, medium open smile | `#f2914b` |
| 32 | round dot eyes + highlight, medium open smile, blush | `#e86b4b` |
| 64 | round dot eyes + highlight, open smiling mouth, blush | `#c03e4f` |
| 128 | wide round eyes + highlight, open smiling mouth, blush | `#b84c7a` |
| 256 | wide round eyes + highlight, wide-open excited mouth, blush, sparkles | `#8b4a9c` |
| 512 | upward crescent happy eyes, wide-open excited mouth, blush, sparkles | `#5c4b9e` |
| 1024 | upward crescent happy eyes, round "o" delighted mouth, blush, sparkles | `#3c5c9e` |
| 2048 | star-shaped eyes, round "o" delighted mouth, blush, sparkles | `#2a7a8c` |
| 4096 | star-shaped eyes, wide-open ecstatic mouth, blush, several sparkles | `#1e2a44` |

Expressions loosely track `mrTileExpressions` (task 08's per-tier
progression) so the bitmap and code-drawn-fallback faces read as the same
character family. Each tier's fill was prompted with its exact
`MrTokens.tileTierColors` hex so the numeral color already picked for that
tier (`MrTokens.tileTierNumeralColorFor`) keeps its WCAG AA contrast against
the art. Every master verified RGBA with a transparent border and an
opaque card interior (Pillow). In-app copies were first resized to 768x768, then (orchestrator follow-up, 2026-09-28) re-encoded to 256x256, since on-screen tiles are ~160 px physical at 3x and the task guideline is <=256 px
(Pillow LANCZOS).

### `homeScene.png`

> Final production-quality wide background scene illustration for a cozy
> mobile puzzle game's home-screen hero banner, bold glossy 3D-toy
> rendered style (like a diorama of glazed ceramic and vinyl-toy pieces).
> Match the palette, mood, and rendering technique of the reference image
> at `direction-b_homeScene_v1.png` (task 20's approved dry run) as closely
> as possible, re-rendered at final production polish: a calm dawn harbor
> at sunrise, warm saturated sky, soft dimensional clouds, a small glossy
> lighthouse and harbor silhouette in the distance, two or three chunky
> glossy rounded-square rescue-tile characters with simple happy faces and
> thick specular highlights floating near the top third of the frame.
> Leave the lower two-thirds of the frame as calm open sky/water with no
> busy detail, since headline text and a button are overlaid there later
> by the app. No text/letters/numbers/logos/watermark. Landscape,
> ~1200x1000.

Master is opaque RGB (no alpha needed — it fills its whole frame). In-app
copy resized so its width is 1080px (the task's scene budget).

### `boardFrame.png`

> Final production-quality background texture illustration for a cozy
> mobile puzzle game's board panel, bold glossy 3D-toy rendered style
> (like a diorama of glazed ceramic and lacquered wood). Match the
> palette and rendering technique of the reference image at
> `direction-b_boardFrame_v1.png` (task 20's approved dry run) as closely
> as possible, re-rendered at final production polish, but this time
> render the warm cream tray filling the ENTIRE square canvas edge to
> edge with rounded corners matching the canvas's own corners (no
> surrounding border/background colour visible) — a large rounded-square
> warm cream panel with soft dimensional ambient-occlusion shading along
> its inner edge and a subtle glossy highlight along the top. No
> characters, faces, text, numerals, or grid lines. Square, 1:1,
> ~1080x1080.

The task 20 dry-run reference sat on a visible navy background (needing a
crop); this final prompt asks the tray to fill the frame directly, so no
crop was needed this time. Drawn by `paintBoardTray` (via
`MrBitmapArtCache`) behind the board's tiles/wells, `BoxFit.cover`-cropped
into the tray's rounded rect. In-app copy resized to 1080x1080.

### Chapter cards (`chapterCard_<1-6>.png`)

Shared prompt template (matching `direction-b_chapterCard_1_v1.png`,
task 20's approved chapter-1/harbor dry run, as the style/lighting
reference for all six):

> Final production-quality small illustrated vignette for a mobile puzzle
> game's chapter-select thumbnail, bold glossy 3D-toy rendered style
> (like a diorama of glazed ceramic and vinyl-toy pieces). Match the
> palette, lighting, and rendering technique of the reference image at
> `direction-b_chapterCard_1_v1.png` as closely as possible, re-rendered
> at final production polish for a different chapter's theme. Scene:
> `<scene>`. Include one small chunky glossy rounded-square rescue-tile
> character with a simple happy face somewhere in the scene, thick
> specular highlights, saturated warm cozy palette, Threes!-grade polish.
> Square, 1:1, ~1080x1080, key subject centered and readable even cropped
> down to a tiny thumbnail. No text/letters/numbers/watermark.

| Chapter | Theme (`content/rescue_boards.json`) | Scene |
|---|---|---|
| 1 | Harbor | dawn harbor dock, glossy lighthouse, sunrise-lit waves |
| 2 | Foundry | warm forge/workshop, glowing lantern, glossy anvil, orange forge-light |
| 3 | Orchard | blossoming orchard at golden hour, glossy fruit tree, pink-white blossoms |
| 4 | Bazaar | bustling market stall, hanging lanterns, colorful fabric awnings |
| 5 | Glacier | icy glacier formations, aurora-tinted sky, soft sparkle highlights |
| 6 | Observatory | nighttime domed telescope on a hill, starry indigo sky, crescent moon |

Shown as a small 28x28 rounded thumbnail beside each chapter's title on the
chapter map (`MergeRelayChapterCard`'s header row). In-app copies resized
to 300x300 opaque RGB.
