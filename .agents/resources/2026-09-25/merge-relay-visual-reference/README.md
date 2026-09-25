# Merge Relay — visual reference (Threes!-grade target)

Purpose: the concrete visual target every later Merge Relay visual task
(design system, character tiles, home/chapter-map/results restyle, motion,
onboarding) and every verifier must check against. Equivalent role to
Ludo's `ludo-visual-reference/README.md`.

**Internal reference only.** The images cited below in
`../threes-store-reference/` are copyrighted third-party store-listing
screenshots. They are used here only to describe and calibrate a visual
*style* in words — they are **never copied, traced, shipped in the app, or
put in public docs (`docs-public/`)**. Everything Merge Relay ships is
original art commissioned through the `image-gen` pipeline (tasks 19/20/22/23).

## Named style anchors

Three specific files from `../threes-store-reference/`, chosen because each
isolates a different piece of the target look:

1. **`../threes-store-reference/01.png`** (home / mid-game board, tagline "A
   TINY PUZZLE THAT GROWS ON YOU"). Anchor for: the warm off-white/cream
   board frame, soft drop-shadowed "physical card" tiles, and character
   faces appearing on higher-value tiles (see the `96` tile's closed eyes +
   fangs, the `192` tile's full monster face with ears).
2. **`../threes-store-reference/03.png`** (tutorial, "ABOUT MATCHING
   NUMBERS"). Anchor for: the calm mint-green explainer background, rounded
   hand-drawn numerals, and the small mouth/eyebrow expressions on the plain
   white tiles even before they have a "monster" face.
3. **`../threes-store-reference/04.png`** (tutorial, "LEARN IT IN A
   MINUTE"). Anchor for: generous whitespace that still reads as
   *composed* — a large empty board has visible cell outlines, a frame, and
   two or three placed tiles, never a flat dead zone.

## Target description (concrete)

Merge Relay's shipped look should be:

- A warm, off-white/cream play field (not white, not the current flat blue).
- Tiles with an **original face or character per tier** (Merge Relay's own
  designs — never Threes!'s monster faces) — expression should read at a
  glance: calm at low tiers, more excited/mischievous at high tiers.
- Soft drop shadows and rounded corners on every tile — a "physical card"
  feel, not a flat swatch.
- A friendly rounded display font (**Fredoka**, per the epic's font table)
  for all headlines, tile numerals, and buttons — no platform default font
  anywhere (checked in task 07's screen goldens).
- A calm, low-contrast board frame that separates the grid from the
  background without competing with the tiles.
- Generous whitespace that is **composed, not empty**: every large open
  region has at least one deliberate element (a mascot, a soft texture, a
  frame edge, a call-to-action) — never a dead flat band.
- Delight moments on merge: squash/stretch on the merging tiles, a pop/scale
  bounce on the resulting tile, and a matching sound cue (task 09/10).

## Do / Don't checklist (verifiers use this against every screen golden)

**Do:**

1. Tile numerals occupy **≥ 40% of the tile's height** (measured on the
   dominant/center tile of a populated board golden).
2. Every tile has visible **rounded corners** (no sharp-cornered squares)
   and a **soft drop shadow** distinct from the board background.
3. At least the top 2 populated tiers show an **original face/expression**
   distinguishable from a flat color swatch.
4. All body and display text renders in the game's bundled fonts (Fredoka /
   Nunito Sans) — **zero** glyphs fall back to a platform default (Roboto,
   San Francisco, tofu boxes).
5. The board background and frame use the warm cream palette, not
   Material-default indigo/purple or flat saturated blue.
6. No screen region **> 25% of the golden's height** is flat, unfilled, or
   empty of any composed element (texture, mascot, card, button group).
7. Primary buttons/list rows use the game's own component styling — no
   stock Material `ElevatedButton`/`ListTile` chrome bleeding through.
8. Merge feedback (motion/juice, from task 09) is visible in any golden
   captured mid-animation: squash/stretch or scale-pop on the result tile.

**Don't:**

9. Don't ship flat, character-less colored squares (the 2048/current-build
   look) as a "final" tile design.
10. Don't leave any screen with a mostly-empty home/results layout (the
    audit's "mostly empty home screen" failure).
11. Don't copy, trace, or closely paraphrase Threes!'s specific character
    designs, palette values, or wordmark — original art only.
12. Don't let text clip, overflow its container, or show a debug overflow
    stripe in any golden.

## Before state (this repo, pre-epic-16)

- `docs-internal/gaming/evidence/visual/merge-relay-final-real-merge.png` —
  2026-09-17 device capture, real merge in progress. Flat blue/colored
  squares, no character tiles, Material-default chrome.
- `../games-portfolio-audit/renders/merge_relay-01-home.png` — mostly empty
  home screen (the audit's headline failure).
- `../games-portfolio-audit/renders/merge_relay-02-tutorial.png`,
  `merge_relay-03-play.png`, `merge_relay-04-result.png` — tutorial, play,
  and result screens from the 2026-09-25 headless-render audit. Board tile
  digits render as white squares in these renders specifically because the
  audit's headless harness didn't load the app's real fonts (not a device
  bug) — from task 07 onward, screen goldens load real fonts via
  `test/flutter_test_config.dart` so this artifact won't recur.

See `contact-sheet.png` (built below) for a side-by-side of the anchors
against these before-captures.

## Competitor reference folders (this task)

| Folder | Role |
|---|---|
| `../threes-store-reference/` | Primary visual target (see anchors above) |
| `../x2-blocks-store-reference/` | Game-feel reference only (merge combo juice) — not visual style |
| `../2048-cirulli-store-reference/` | Anti-reference: the flat-square look to avoid |
| `../terrarium-garden-idle-store-reference/`, `../pocket-frogs-store-reference/` | Pocket Biome references, not Merge Relay |
| `../hitman-go-store-reference/` | Sixty-Second Heist reference, not Merge Relay |

Full competitor list and rationale:
`.agents/resources/2026-09-25/games-competitor-references/README.md`.
