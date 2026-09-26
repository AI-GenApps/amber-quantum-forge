# Merge Relay — logo direction briefs (dry run)

Date: 2026-09-26. Purpose: three original direction briefs (icon + wordmark each) for a
future `gpt_image_2_5` dry-run round, per
`.claude/skills/audit-game-and-prepare-for-release/references/07-brand-name-logo.md`. No
images generated in this pass — prompts only, ready to hand to a rendering round.

Game grounding used for all three: a 4x4 power-of-two merge/2048-style puzzle
(`MR-2D-1`), with a social "relay" layer — challenge codes and reciprocal attempts passed
between players — plus rescue/daily/endless single-player modes. Current in-app palette
(`merge_relay_theme.dart`): Signal theme (deep navy `#10243E` board/ink, powder-blue paper
`#EDF5FB`, mid-blue tile `#3E75B6`, sky `#4E93D3`, coral `#A53B36`, warm-red `#E5534B`) and
Ember theme (deep plum `#2B1C36`, cream paper `#FBF2EA`, rose/mauve `#8D4D85`/`#B76B88`,
rust `#B34D3F`, amber `#D48742`). Tone: clean, flat, high-contrast "scoreboard" feel — not
cartoon/cute, not aggressive/dark.

All directions: must read clearly at 48px (icon), avoid any resemblance to existing brand
marks (no four-color pinwheels/swirls — Chrome; no baton/torch relay-race clichés lifted
from Olympic imagery; no generic "2048" tile-grid copy of the original 2048 branding), and
must be original compositions, not photoreal, not text-only icons.

## Direction 1 — "Baton Chain" (merge chain as a passed token)

Concept: a short diagonal chain of 3–4 rounded-square tiles that increase in size/value
left-to-right, with the last tile mid-flight — implying both "merge" (tiles combining) and
"relay" (something passed forward) in one glyph, without literal baton/torch imagery.

- **Icon prompt**: "Minimalist flat app icon, original design, no text. A tight diagonal
  row of 3 rounded-square tiles of increasing size, deep navy background (#10243E), tiles
  in a mid-blue-to-coral gradient-free flat fill (#3E75B6 to #E5534B) each showing a subtle
  embossed corner highlight, the largest (rightmost) tile overlapping the frame edge to
  suggest forward motion/hand-off. Bold geometric, rounded corners matching Material 3
  radius, high contrast, crisp at small sizes, centered composition, square 1:1 canvas, no
  gradients besides the tile fills, no shadows outside the tiles, no photorealism, not an
  existing brand mark."
- **Wordmark prompt**: "Original flat wordmark logo reading exactly 'Merge Relay', bold
  rounded geometric sans-serif (similar weight/style to a modern Material 3 display face,
  not any specific licensed font), two words in deep navy (#10243E) on a powder-blue
  background (#EDF5FB), with a small inline diagonal 3-tile motif matching the icon
  positioned before or above the wordmark, generous letter spacing, no drop shadows, no
  gradients, legible at small sizes, spell 'Merge Relay' exactly, no other text."

## Direction 2 — "Signal Grid" (radio/relay signal meets number grid)

Concept: a compact 2x2 grid of tiles where the top-right tile emits a small quarter-arc
"signal" mark (like a wifi/relay ping), tying the merge-grid gameplay to the idea of
sending a challenge to a friend. Reads as a badge/app-icon shape, not literal antenna art.

- **Icon prompt**: "Minimalist flat app icon, original design, no text. A centered 2x2 grid
  of four rounded-square tiles on a deep navy background (#10243E), three tiles in muted
  slot-navy (#203754), one tile (top-right) in bright sky-blue (#4E93D3) emitting a single
  small quarter-arc signal ping in the same sky-blue extending past the tile's corner,
  flat design, no gradients, no drop shadow, high contrast, bold and simple enough to read
  at 48px, square 1:1 canvas, not resembling any existing wifi/broadcast or messaging-app
  logo."
- **Wordmark prompt**: "Original flat wordmark logo reading exactly 'Merge Relay', clean
  rounded geometric sans-serif, deep navy (#10243E) text on powder-blue background
  (#EDF5FB), the dot above the 'i' in 'Relay' replaced by a tiny sky-blue (#4E93D3) signal
  ping arc matching the icon, otherwise plain letterforms, no gradients, no shadows,
  legible at small sizes, spell 'Merge Relay' exactly, no other text."

## Direction 3 — "Ember Handoff" (warm alt-theme, two tiles clasping)

Concept: uses the Ember theme instead of Signal, for a warmer store-icon alternative. Two
overlapping rounded-square tiles (one plum, one amber) interlock at a shared rounded
corner, forming a single mark that reads as "two things merging/joining hands" without
using literal hand/handshake imagery.

- **Icon prompt**: "Minimalist flat app icon, original design, no text. Two rounded-square
  tiles overlapping at a shared corner on a deep plum background (#2B1C36): one tile in
  muted mauve (#8D4D85), one tile in warm amber (#D48742), the overlap area rendered as a
  blended solid warm-rust color (#B34D3F) to show a clean merge without gradients, both
  tiles equal size, symmetric composition, bold flat shapes, no shadows, no gradients
  beyond the three flat fills, crisp and legible at 48px, square 1:1 canvas, not resembling
  any existing puzzle-game or dating-app logo."
- **Wordmark prompt**: "Original flat wordmark logo reading exactly 'Merge Relay', bold
  rounded geometric sans-serif, warm cream background (#FBF2EA), text in deep plum
  (#2B1C36), with the small two-tile overlap motif from the icon placed as a compact mark
  to the left of the wordmark, no gradients, no drop shadows, legible at small sizes, spell
  'Merge Relay' exactly, no other text."

## Lookalike checklist (apply before any round-1 render is recommended)

- Direction 1: check against baton/torch relay-race marks and any existing "chain of tiles"
  puzzle-game icon (e.g. Threes!, 2048 clones).
- Direction 2: check against Wi-Fi/broadcast icons, messaging-app pings (e.g. Discord,
  Slack, Signal app — note the in-game theme is *named* "Signal" internally but the
  wordmark/icon must not converge on the Signal messenger's ghost/paper-plane mark).
- Direction 3: check against dating-app or generic "handshake" merge icons; avoid any
  resemblance to Merge Mansion/Merge Inn's existing rounded-object motifs.

## Next step (not performed in this pass)

Render round 1 with `gpt_image_2_5 --quality high --resolution 2k`: icons 1:1 no text;
wordmarks with exact text (spell-check, regenerate once if wrong); assemble a contact
sheet for user approval before any refinement or integration.
