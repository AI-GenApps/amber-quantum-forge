# Merge Relay — Logo Round 1 Concepts

Date: 2026-09-26. Model: `gpt_image_2_5` (Higgsfield CLI), `--quality high --resolution 2k
--background opaque`. Icons at `--aspect-ratio 1:1`, wordmarks at `--aspect-ratio 3:2`. All
6 generations succeeded on the first attempt — no misspellings, no watermarks, no extra
text, no regenerations needed. Prompts are the exact briefs from
`.agents/resources/2026-09-26/merge-relay-brand/logo-briefs.md`, run via `gen.sh` in this
folder.

## Direction 1 — Baton Chain

- **baton-chain-icon.png** — Diagonal chain of 3 rounded-square tiles (blue → orange → red)
  increasing in size, largest tile bleeding off the top-right edge, deep navy background,
  soft embossed highlight on each tile.
  Prompt: "Minimalist flat app icon, original design, no text. A tight diagonal row of 3
  rounded-square tiles of increasing size, deep navy background (#10243E), tiles in a
  mid-blue-to-coral gradient-free flat fill (#3E75B6 to #E5534B) each showing a subtle
  embossed corner highlight, the largest (rightmost) tile overlapping the frame edge to
  suggest forward motion/hand-off. Bold geometric, rounded corners matching Material 3
  radius, high contrast, crisp at small sizes, centered composition, square 1:1 canvas,
  full-bleed background, no gradients besides the tile fills, no shadows outside the
  tiles, no photorealism, not an existing brand mark."
  Critique: Reads clearly at 48px, strong "merge + forward motion" read, on-palette. A
  faint horizontal banding artifact sits near the bottom edge (minor, not distracting at
  icon size).
  Lookalike note: no resemblance to baton/torch relay-race marks or Olympic imagery; the
  size-ascending tile chain is distinct from 2048/Threes' static grid-of-equal-tiles look.
- **baton-chain-wordmark.png** — "Merge Relay" in bold navy rounded sans-serif on
  powder-blue, with a 3-bar diagonal mark (navy/blue/green parallelograms) to the left
  standing in for the tile-chain motif.
  Prompt: "Original flat wordmark logo reading exactly 'Merge Relay', bold rounded
  geometric sans-serif (similar weight/style to a modern Material 3 display face, not any
  specific licensed font), two words in deep navy (#10243E) on a powder-blue background
  (#EDF5FB), with a small inline diagonal 3-tile motif matching the icon positioned before
  or above the wordmark, generous letter spacing, no drop shadows, no gradients, legible at
  small sizes, spell 'Merge Relay' exactly, no other text."
  Critique: Spelling verified exact ("Merge Relay"), clean and legible. The inline motif
  came out as 3 slanted bars/parallelograms rather than literal rounded-square tiles — a
  minor drift from the icon's tile shapes, would want a tighter match in a refinement pass.
  Lookalike note: none; generic geometric wordmark, no resemblance to any existing
  puzzle-game logotype.

## Direction 2 — Signal Grid

- **signal-grid-icon.png** — Centered 2x2 grid of rounded-square tiles on deep navy, three
  tiles muted slot-navy, top-right tile bright sky-blue emitting a small quarter-arc ping
  past its corner.
  Prompt: "Minimalist flat app icon, original design, no text. A centered 2x2 grid of four
  rounded-square tiles on a deep navy background (#10243E), three tiles in muted slot-navy
  (#203754), one tile (top-right) in bright sky-blue (#4E93D3) emitting a single small
  quarter-arc signal ping in the same sky-blue extending past the tile's corner, flat
  design, full-bleed background, no gradients, no drop shadow, high contrast, bold and
  simple enough to read at 48px, square 1:1 canvas, not resembling any existing wifi/
  broadcast or messaging-app logo."
  Critique: Very close match to brief — clean, bold, reads instantly at small size, grid +
  ping concept legible.
  Lookalike note: the ping arc is a generic quarter-circle broadcast mark; it is a common
  UI convention (used across many wifi/notification glyphs) rather than a specific
  brand's mark, but it is the direction most likely to visually rhyme with a "signal/
  broadcast" icon family in general — worth a design tweak (e.g., asymmetric arc) if this
  direction advances.
- **signal-grid-wordmark.png** — "Merge Relay" in navy, with the dot over the "i" in
  "Relay" replaced by a small sky-blue concentric-arc ping.
  Prompt: "Original flat wordmark logo reading exactly 'Merge Relay', clean rounded
  geometric sans-serif, deep navy (#10243E) text on powder-blue background (#EDF5FB), the
  dot above the 'i' in 'Relay' replaced by a tiny sky-blue (#4E93D3) signal ping arc
  matching the icon, otherwise plain letterforms, no gradients, no shadows, legible at
  small sizes, spell 'Merge Relay' exactly, no other text."
  Critique: Spelling verified exact. Clever, legible detail; reads well at small size.
  Lookalike note: the two-arc ping over the "i" resembles a generic Wi-Fi glyph more than
  the icon's single-arc version does — mild resemblance to standard Wi-Fi iconography (not
  a specific brand), flagged per the brief's own lookalike checklist for this direction.

## Direction 3 — Ember Handoff

- **ember-handoff-icon.png** — Two overlapping rounded-square tiles (mauve, amber) on deep
  plum, overlap rendered as a solid warm-rust blend.
  Prompt: "Minimalist flat app icon, original design, no text. Two rounded-square tiles
  overlapping at a shared corner on a deep plum background (#2B1C36): one tile in muted
  mauve (#8D4D85), one tile in warm amber (#D48742), the overlap area rendered as a
  blended solid warm-rust color (#B34D3F) to show a clean merge without gradients, both
  tiles equal size, symmetric composition, bold flat shapes, full-bleed background, no
  shadows, no gradients beyond the three flat fills, crisp and legible at 48px, square 1:1
  canvas, not resembling any existing puzzle-game or dating-app logo."
  Critique: On-palette (Ember theme), simple and warm; the overlap looks slightly
  gradiented/soft rather than a hard flat color block as specified — minor drift from
  "no gradients" instruction, would tighten in a refinement round.
  Lookalike note: two-square overlap composition is a generic "merge/union" motif (seen in
  many diagram/Venn-style icons); no resemblance to any dating-app heart/flame mark or to
  Merge Mansion/Merge Inn's rounded-object clutter style.
- **ember-handoff-wordmark.png** — "Merge Relay" in deep plum on warm cream, with the
  two-tile overlap mark (rendered here in solid plum, single-color) to the left.
  Prompt: "Original flat wordmark logo reading exactly 'Merge Relay', bold rounded
  geometric sans-serif, warm cream background (#FBF2EA), text in deep plum (#2B1C36), with
  the small two-tile overlap motif from the icon placed as a compact mark to the left of
  the wordmark, no gradients, no drop shadows, legible at small sizes, spell 'Merge Relay'
  exactly, no other text."
  Critique: Spelling verified exact. Clean, warm, legible; mark rendered monochrome plum
  rather than mauve/amber two-tone — loses the icon's warm-palette pairing, would want the
  amber accent reinstated in a refinement pass.
  Lookalike note: none; generic geometric wordmark.

## Recommendation

**Signal Grid** is the strongest single direction: the icon is the most legible at 48px,
most distinct from existing merge-puzzle iconography (2048/Threes/Merge Mansion), and best
matches the in-app Signal theme already shipping in `merge_relay_theme.dart`. Recommend a
refinement pass on **signal-grid-icon.png** paired with **baton-chain-wordmark.png**'s
overall wordmark styling (bolder weight, tighter letter spacing) but with the signal-ping
accent from `signal-grid-wordmark.png` — i.e., Signal Grid icon + a wordmark that reuses the
grid tiles (not the wifi-style double-arc) as its accent mark, to avoid the mild Wi-Fi
lookalike flagged above. Baton Chain is a solid backup (best "relay/hand-off" storytelling);
Ember Handoff is the weakest of the three — the overlap read leans more "Venn diagram" than
"puzzle merge" and needs the flat-color-block fix to feel intentional.

## Files

| File | Direction | Type | Aspect |
|---|---|---|---|
| `baton-chain-icon.png` | Baton Chain | icon | 1:1 |
| `baton-chain-wordmark.png` | Baton Chain | wordmark | 3:2 |
| `signal-grid-icon.png` | Signal Grid | icon | 1:1 |
| `signal-grid-wordmark.png` | Signal Grid | wordmark | 3:2 |
| `ember-handoff-icon.png` | Ember Handoff | icon | 1:1 |
| `ember-handoff-wordmark.png` | Ember Handoff | wordmark | 3:2 |
| `contact-sheet.png` | — | contact sheet (PIL, 2 cols x 3 rows) | — |

Generation script: `gen.sh` (same pattern as
`.agents/resources/2026-09-25/ludo-vortex-art/logo/gen.sh`).
