# Merge Relay — Logo Round 2 (Premium Glossy Casual)

Date: 2026-09-26. Model: `gpt_image_2_5` (Higgsfield CLI), `--quality high --resolution 2k`.
Style reference images passed via `--image-references` on every generation:
`../../2026-09-25/ludo-vortex-art/logo/token-orbit-icon.png` and
`.../refinement-sheet.png` (the Ludo Vortex quality bar the user asked us to match).
Icons at `--aspect-ratio 1:1`, wordmark-v1 at `16:9`, wordmark-v2 at `4:3`. Opaque
generations used `--background opaque`; transparent versions used `--background
transparent` (native alpha from the model, verified with PIL — see below).

Direction: **Signal Grid** concept from round 1 (`../logo/signal-grid-icon.png`),
re-rendered in a premium glossy 3D style to match the Ludo Vortex brand bar, fixing round
1's flat/corporate look and the wordmark's "l"→arc substitution ("REIAY" misspelling).

## Shared style blocks

Icon: "Premium glossy casual mobile game app icon art, matching the quality bar of a
top-grossing casual puzzle game icon: chunky glossy 3D rendered, deep bevels, bright
specular highlights, soft rim lighting, gold metallic accents. Deep navy background
(#10243E to #0B1D4F) with a soft vignette. Crisp clean edges, no photorealism, no grain, no
flat/corporate minimalism. ORIGINAL design, do not imitate any existing brand or app icon,
no Wi-Fi symbol, no Venn-diagram overlap shape, not resembling 2048, Threes, Candy Crush,
Chrome, or Signal messenger logos. Single bold readable silhouette, full-bleed square 1:1
canvas, nothing clipped or cropped at the edges, centered composition with safe margin so
it reads clearly at 48px, absolutely no text or letters anywhere."

Wordmark: "Premium glossy casual mobile game logo wordmark art, matching the quality bar of
a top-grossing casual puzzle game logo: chunky rounded bold 3D display lettering with deep
bevels, dark outline, and bright glossy specular highlights. White and sky-blue letters
with coral and gold metallic accents. Deep navy background (#10243E to #0B1D4F) with a
soft vignette and warm glow. Crisp clean edges, no photorealism. ORIGINAL design, not
resembling any existing brand logo. Every letter must be a normal, complete, standard
letterform of the Latin alphabet — absolutely no letter may be replaced, altered, or merged
with a symbol, icon, arc, or swoosh; any energy/sparkle/signal accents must be placed
clearly AROUND or BEHIND the lettering, never touching, replacing, or dotting any letter.
The text must read exactly correctly, spelled precisely as instructed, no other text, no
watermark."

## Icons

- **icon-v1.png** — Subject addendum: "a 2x2 grid of four chunky glossy rounded-square 3D
  tiles tightly and symmetrically arranged with even gaps, filling the frame with safe
  margin. Three tiles deep muted slot-navy glossy finish, one tile (top-right) glowing
  bright sky-blue with a warm gold rim, showing a bold numeral '2' embossed in white glossy
  3D on its face. From the glowing tile, a radiating burst of concentric glow rings and
  small gold sparkle particles arcs outward toward the top-right corner, like a comet trail
  — soft round glowing rings and star-shaped sparkles only, not a Wi-Fi/broadcast arc, not
  a signal-bar shape."
  Critique: Chunky glossy 3D tiles read clearly at small size, gold rim + numeral give a
  strong "lit tile" focal point, comet/sparkle burst is clearly distinct from a Wi-Fi arc.
  Nothing clipped, full-bleed, matches the Ludo Vortex glossy quality bar. Strongest icon
  of the two.
  Lookalike note: no resemblance to Wi-Fi/broadcast glyphs, 2048/Threes tile grids, Candy
  Crush, Chrome, or Signal messenger — grid+glow+comet reads as an original "relay ping"
  motif.
- **icon-v2.png** — Same subject prompt, second sampling (framing/glow-intensity
  variation).
  Critique: Slightly bolder gold trim on all four tiles (not just the lit one), sparkle
  burst is a bit more contained/circular than v1's comet trail. Equally clean and glossy,
  very slightly less dynamic "motion" read than v1 but a touch more polished as a static
  badge.
  Lookalike note: same as v1 — no resemblance to Wi-Fi, 2048/Threes, Candy Crush, Chrome,
  or Signal.

## Wordmarks

- **wordmark-v1.png / wordmark-v1-transparent.png** (16:9, single line) — Layout
  addendum: "the words 'MERGE RELAY' on a single horizontal line, both words the same bold
  chunky 3D lettering style, glossy white letters with sky-blue glossy shading, coral
  accents on select letters, thin gold outline trim, dark navy bevel shadow beneath each
  letter. A few small gold sparkle and soft glow ring accents float around the outside
  edges of the text — never overlapping or touching any letter."
  **Spelling check (letter-by-letter, read from the rendered image):** M-E-R-G-E (space)
  R-E-L-A-Y. All 10 letters present, every letterform standard, no letter replaced by a
  symbol. Matches "Merge Relay" exactly.
  Critique: Bold, legible, glossy 3D bevel with strong coral/white contrast; sparkle/swoosh
  accents sit clearly above/below the text, never touching a letter — no repeat of round
  1's "l"→arc substitution.
  Lookalike note: no resemblance to Wi-Fi, 2048, Threes, Candy Crush, Chrome, or Signal
  wordmarks; generic-but-original bold casual-game lettering.
- **wordmark-v2.png / wordmark-v2-transparent.png** (4:3, stacked, icon emblem above) —
  Layout addendum: "a small circular emblem badge centered at the top (a glossy 3D
  gold-rimmed navy medallion containing a simplified version of the 2x2 signal-grid icon:
  three deep slot-navy tiles and one glowing sky-blue tile with a soft radiating glow
  burst, no wifi arcs), and below it two stacked lines of bold chunky glossy 3D lettering:
  'MERGE' on the first line, 'RELAY' on the second line, centered, same lettering style as
  the icon. Small gold sparkle accents float around the emblem and text only, never
  touching or replacing any letter."
  **Spelling check (letter-by-letter):** Line 1: M-E-R-G-E. Line 2: R-E-L-A-Y. Both lines
  read exactly correct, all standard letterforms, no letter replaced or altered.
  Critique: Emblem badge above the stacked wordmark reads as a strong title-lockup (like a
  splash-screen logo); emblem colors/shape match the icon-v1/v2 grid closely; gold ring
  echoes the tile rims. Slightly busier composition than v1 due to the added badge, but
  every element is legible at small size.
  Lookalike note: emblem is a closed gold ring with an internal tile grid — no resemblance
  to Wi-Fi, 2048, Threes, Candy Crush, Chrome, or Signal messenger's speech-bubble mark.

## Transparency verification (PIL)

Both `-transparent.png` files were checked with `PIL.Image.getchannel('A')`:

| File | alpha=0 px | alpha=255 px | partial-alpha px |
|---|---|---|---|
| wordmark-v1-transparent.png | 2,355,788 | 0 | 1,729,972 |
| wordmark-v2-transparent.png | 1,646,406 | 0 | 2,427,578 |

Both have real, non-trivial alpha channels (fully transparent background pixels plus soft
partial-alpha glow edges around the glossy lettering) — not an opaque image with a fake
alpha channel.

## Recommendation

**icon-v1** + **wordmark-v2** is the strongest combo: v1's comet-trail glow gives the icon
the most "signal ping / hand-off" motion read among the four options, and wordmark-v2's
emblem-above-stacked-text lockup doubles as both a home-screen logo and a compact app-icon
companion, reusing the same grid/glow motif as the icon for brand consistency. wordmark-v1
(single line, 16:9) is the better choice for a wide banner/header placement (store listing
top banner, in-app header) where vertical space is limited.

## Files

| File | Purpose | Aspect | Background |
|---|---|---|---|
| `icon-v1.png` | icon | 1:1 | opaque |
| `icon-v2.png` | icon | 1:1 | opaque |
| `wordmark-v1.png` | wordmark (single line) | 16:9 | opaque |
| `wordmark-v1-transparent.png` | wordmark (single line) | 16:9 | transparent |
| `wordmark-v2.png` | wordmark (stacked + emblem) | 4:3 | opaque |
| `wordmark-v2-transparent.png` | wordmark (stacked + emblem) | 4:3 | transparent |
| `contact-sheet.png` | all 6 above, composited on `#0B1D4F` (PIL) | — | — |

Generation script: `gen.sh` (same pattern as
`.agents/resources/2026-09-25/ludo-vortex-art/logo/gen.sh` and
`.agents/resources/2026-09-26/merge-relay-brand/logo/gen.sh`).

## Note on generation runs

The URL-extraction logic in an early version of `gen.sh` picked up a nested reference-image
URL instead of the job's `result_url` for the first three jobs (icon-v1, icon-v2,
wordmark-v1), producing duplicate/wrong PNGs. This was caught immediately (identical MD5s
across supposedly-different files), the script was fixed to read `result_url` directly, and
all affected files were re-downloaded from their already-completed job JSON (no
regeneration/re-spend needed for those three). A later re-run collision (an old backgrounded
job and a fresh invocation overlapping) produced one additional stale file
(`wordmark-v2.png`), which was likewise re-downloaded from its correct job JSON. Total
distinct successful generations: 6 (icon-v1, icon-v2, wordmark-v1, wordmark-v2,
wordmark-v1-transparent, wordmark-v2-transparent) — no prompt regenerations were needed for
quality or spelling reasons.
