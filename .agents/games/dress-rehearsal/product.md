# Dress Rehearsal - product

Fashion puzzles. A client hands you a creative brief; you assemble a look on a styled flat-lay
lookbook board from the pieces in your closet; a transparent rule engine scores it; you export the
finished board as an image and share it. Portrait, offline, no accounts, no ads, no purchases,
English only. Content lists are in `content-plan.md`; every number is in `economy.md`.

## The loop in one minute

1. Pick a challenge (campaign) or open the Daily Fitting.
2. **Brief**: a client card shows the client's portrait, a short brief line and 2 to 4 rule chips.
3. **Style**: the board shows 6 to 8 open slots on a flat-lay page. Drag (or tap) pieces from the
   closet tray into slots. Every rule chip turns met or unmet live and a harmony meter (0 to 100)
   updates live. There is no timer and no move limit; undo and redo are unlimited.
4. **Finish look**: enabled when the look is complete. The result sheet shows 1 to 3 stars, which
   rules passed and why, the harmony breakdown and the client's reaction line.
5. **Save and share**: save the board to the Gallery, export it as an image (canvas) and share it.
   Retry, edit, or go to the next challenge. There is no failure state, only fewer stars.

## Pieces, slots and the board

- A piece is one of 48 closet items (`content-plan.md`). Tags: `category`, `colour`, `era`,
  `formality` (1 to 5), `warmth` (0 to 3), `price` (whole in-game dollars), `features`.
- Eight categories: top, bottom, dress, outer, shoes, bag, hat, accessory. Each category is one
  slot kind; a slot holds exactly one piece.
- Each challenge opens 6 to 8 slots (slot sets A to G in `content-plan.md`). Closed slots are not
  shown. The board is a flat-lay lookbook page: no body, no mannequin, so there is no layer
  alignment. Pieces are shown straight from above at the same scale rules for every category.
- **One-piece rule** (only when `dress` and both `top` and `bottom` are open): a dress replaces
  top and bottom. Placing a dress clears top and bottom; placing a top or a bottom clears the
  dress. The board shows the dress slot spanning the top and bottom positions.
- **Complete look**: every open slot is filled, where "base" counts as filled when the dress slot
  is filled or both top and bottom are filled. If `dress` is open but top/bottom are not, the
  dress is required; if top and bottom are open but not dress, both are required.
- Categories are strict: a piece can only go in the slot of its own category. Dropping it
  elsewhere snaps back (sound and haptic `invalid`, a one-line toast naming the right slot).
- The closet tray has eight tabs (one per category) listing the unlocked pieces; locked themes are
  not listed in the tray (the Closet screen shows them as silhouettes with the stars needed).

## Rules (client constraints)

Each challenge has 2 to 4 rules, all hard rules, each a pure function of the pieces on the board.
Rule codes are what `content-plan.md` stores; the chip text is what the player reads.

| Code | Chip text | Met when |
|---|---|---|
| `palette-warm` | Warm colours only | Every chromatic piece is pink, red, orange or yellow (neutrals are free) |
| `palette-cool` | Cool colours only | Every chromatic piece is mint, teal, sky, blue or violet |
| `max-hues:N` | N = 0 "Neutrals only", 1 "One colour at most", 2 "Two colours at most", 3 "Three colours at most" | Distinct chromatic colours among the pieces <= N |
| `include-colour:C` | Include something C | At least one piece has colour C |
| `avoid-colour:C` | Nothing C | No piece has colour C |
| `era-min:E` | "Only modern pieces" for `now`, else "Nothing older than the E" | Every piece era >= E (order 50s < 70s < 90s < now) |
| `era-max:E` | Nothing newer than the E | Every piece era <= E |
| `formality-min:N` | Every piece formality N or more | min formality >= N |
| `formality-max:N` | Every piece formality N or less | max formality <= N |
| `warmth-min:N` | Total warmth at least N | Sum of warmth over all pieces >= N |
| `warmth-max:N` | Total warmth at most N | Sum of warmth over all pieces <= N |
| `needs-feature:F` | A F piece (F = waterproof, shade, sparkle, sturdy) | At least one piece carries feature F |
| `max-spend:N` | Spend at most $N | Sum of prices <= N |
| `min-spend:N` | Spend at least $N | Sum of prices >= N |
| `include-piece:ID` | Wear the {piece name} | That exact piece is on the board |
| `avoid-piece:ID` | Leave out the {piece name} | That exact piece is not on the board |

Colour tags: neutrals are black, white, cream, grey, navy, tan (never counted as colours);
chromatic colours sit on a 12-step wheel in this order: red 0, orange 1, yellow 2, lime 3,
green 4, mint 5, teal 6, sky 7, blue 8, violet 9, magenta 10, pink 11. Lime, green and magenta are
neither warm nor cool. Feedback text always shows the actual value next to the limit ("Total
warmth is 9, the limit is 7"; "Colours used: red, blue, mint").

## Harmony (set and colour-theory score, 0 to 100)

Computed on the pieces on the board (partial boards give a live preview using the pieces placed so
far; the official score exists only for complete looks). Five transparent parts, each shown with
its name, value and a one-line reason:

| Part | Max | Rule |
|---|---|---|
| Colour scheme | 40 | Distinct chromatic hues H on the wheel, distance d = shortest steps between two hues. H = 0: "Neutral" 34. H = 1: "Tonal" 40. H = 2: d <= 2 "Analogous" 40; d = 6 "Complementary" 40; d = 4 "Triad pair" 32; d = 3 or 5 "Awkward pair" 20. H = 3: all pairs d = 4 "Triadic" 36; all pairs d <= 3 "Analogous trio" 36; else "Busy" 16. H >= 4: "Too many colours" 4 |
| Neutral anchor | 10 | 10 when at least one piece is neutral, else 0 |
| Dress code | 20 | Formality spread s = max - min: s <= 1: 20; s = 2: 14; s = 3: 6; s = 4: 0 |
| Era match | 15 | Era span e = max - min on the order 50s, 70s, 90s, now: e <= 1: 15; e = 2: 10; e = 3: 4 |
| Season sense | 15 | Warmth spread w = max - min: w <= 1: 15; w = 2: 10; w = 3: 4 |

The numbers were fixed by a prototype over the shipped content (`decisions-log.md`): with the
three-star bar at 70, every campaign challenge has at least 2 three-star looks and the share of
complete looks that earn three stars stays within the per-chapter caps in `content-plan.md`.

## Stars

Let C be the number of rules (2 to 4) and M the number of rules met on a complete look.

| Stars | Name | Condition |
|---|---|---|
| 0 | Not finished | The look is not complete, or M < ceil(C / 2) |
| 1 | Presentable | Complete and M >= ceil(C / 2) |
| 2 | On brief | Complete and M = C |
| 3 | Polished | On brief and harmony >= 70 |

An empty board always scores 0 stars, so no challenge can be passed by doing nothing (the content
validator checks this for all 40 challenges). A challenge is cleared at 1 star or more. Best
stars per challenge are kept; replays never lower them.

## Campaign structure

- 6 chapters, one per theme: Riviera Summer (7 challenges), Rainy City (7), Gala Night (7),
  Mountain Weekend (7), Studio Avant-garde (6), Vintage 70s (6) = 40 challenges, 120 stars.
- Challenge n+1 of a chapter opens when challenge n is cleared (1 star or more). Chapters unlock
  by total campaign stars: Riviera Summer 0, Rainy City 0, Gala Night 12, Mountain Weekend 27,
  Studio Avant-garde 45, Vintage 70s 66.
- **The closet grows with unlocked chapters.** A chapter's 8 pieces join the closet when the
  chapter unlocks. The first two chapters are open from the first launch so the starting closet
  has 16 pieces and every slot has a real choice (a one-theme closet of 8 pieces would allow only
  4 distinct looks, `decisions-log.md`). Every campaign challenge is proven to have a three-star
  look using only the pieces of its own chapter and the chapters before it in order (the closet
  that exists when the chapter unlocks), and replays with a larger closet keep that solution.
- Replaying a cleared challenge is free and only improves stars and score.
- **Client affinity**: each client's affinity level comes from the best stars on their
  challenges: level 1 at 3 stars, level 2 at 9, level 3 at 15. A new level shows a new
  personality line from that client and pays coins (`economy.md`).

## Daily Fitting

- One generated challenge per local calendar day: seed `dailySeed("dress-rehearsal", dateKey)`
  (kit `localDateKey`, `dailySeed`), generated on the device from the player's current closet.
  Daily stars never count towards campaign stars or unlocks.
- Weekday ladder (Monday first). Slot sets are those in `content-plan.md`:

| Day | Slot sets | Rules | Extra requirement |
|---|---|---|---|
| Mon | A, B or C (6 slots) | 2 | none |
| Tue | A, B or C (6 slots) | 3 | none |
| Wed | D, E or F (7 slots) | 3 | none |
| Thu | D, E or F (7 slots) | 3 | one rule about era or formality |
| Fri | G (8 slots) | 3 | none |
| Sat | G (8 slots) | 4 | none |
| Sun | G (8 slots) | 4 | one budget rule |

- **Generator** (`generateDaily(seed, weekday, closet)`): up to 12 attempts, each with a forked
  PRNG. Pick a slot set for the tier; pick a random complete look from the closet whose harmony is
  at least 70 (up to 200 draws); build the candidate rules that this look satisfies (warm or cool
  palette, hue limit, include and avoid a colour, era and formality bounds from the look,
  warmth bounds within one of the look's total, a feature, spend bounds rounded to $10, include a
  piece, avoid a piece of the same category); keep candidates that at least 20 percent of 300
  random complete looks fail; choose the tier's number of rules from distinct rule families
  (palette, era, formality, weather, feature, budget, piece), honouring the extra requirement;
  accept when at most 10 percent of the 300 sampled looks earn three stars. The seed look is the
  stored **reference look**, so a three-star solution exists by construction and is re-verified
  with the real scoring function before the challenge is returned.
- **Fallback**: if 12 attempts fail, a committed template for that weekday is used (7 templates,
  built from the 16-piece starting closet only, each with a reference look, so they are valid for
  any closet). Prototype result: over 365 dates from 2026-01-01 with the starting closet, 10 dates
  needed the fallback (2.7 percent); with every larger closet none did. The test requires at most
  18 fallbacks (5 percent) per closet level.
- The client is picked by the PRNG from the six clients; the brief text is assembled from the
  rule chips ("{Client} needs {rule}, {rule} and {rule}.") because daily briefs are not hand
  written.
- One Daily result counts per date (best stars kept). The streak, freezes and coins are in
  `economy.md`; the device clock moving backwards is neutral (kit `streakStep` returns
  `clock-went-back`).

## Hints

A hint reveals one piece of a three-star look: the closet tab switches to that category, the
piece glows and its slot pulses. The piece is not placed for you. The solver (`solveLook`, a
bounded depth-first search, at most 400,000 visited looks) first looks for a three-star look that
contains every piece already on the board; if none exists it falls back to the stored reference
look and reveals its piece for the first slot (in fixed slot order) where the board differs.
Price: 20 coins on a campaign challenge, 30 on the daily. A hint can be bought while styling, not
on the result sheet, and never removes stars.

## Gallery and export

- **Gallery**: up to 24 saved boards, stored locally (each entry holds the slot-to-piece map,
  the challenge id or date key, stars, harmony and the save date; no pixels). Save is offered on
  the result sheet for looks with 1 star or more; a full gallery asks the player to delete one.
  Each entry can be re-rendered, shared or deleted.
- **Export image**: a Canvas 2D render of the board at 1080 x 1350 px (4:5): linen surface, the
  chapter backdrop when available, the pieces at their slot positions, a footer with challenge or
  date, client name, stars and harmony, and the game title. Four frames: Plain, Paper Border,
  Polaroid and Magazine Cover (client name as the headline). Plain is free; the others are bought
  with coins once (`economy.md`).
- **Share**: the exported PNG blob goes through the Web Share API with files when
  `navigator.canShare({ files })` is true; otherwise the app offers a download link (browser); in
  every case the share text (below) goes through the kit `shareContent` too. Native image
  sharing from the Capacitor WebView needs the Filesystem plugin and is an owner decision
  (`open-questions.md` Q4).

## Screens

1. Boot and loading (fonts and listed art with progress; audio preload starts on the first user
   gesture because browsers keep audio locked until then).
2. Home: Play, Daily Fitting (with streak), Closet, Clients, Gallery, How to play, Settings.
3. Chapters (six cards with stars, lock state and the stars needed).
4. Challenge list (6 or 7 tiles per chapter: name, client avatar, best stars, locked state).
5. Brief sheet (client portrait, line, rule chips, slot count, Start).
6. Styling board (board, closet tray with eight tabs, rule checklist, harmony meter, undo, redo,
   clear, hint, Finish look).
7. Result sheet (stars, rule breakdown, harmony breakdown, client reaction, Save, Export, Next,
   Retry, Edit).
8. Export sheet (frame picker, preview, Share, Save to device).
9. Daily Fitting (today's challenge, streak, freezes with buy button, last 14 days).
10. Closet (all 48 pieces by theme, tags, locked silhouettes with stars needed).
11. Clients (six cards with affinity level, progress and the lines unlocked so far).
12. Gallery (24 slots, share, delete).
13. Settings (sound, music, haptics, reduced motion, high contrast, reset progress with confirm).
14. How to play (six pages) and one-time rule cards.
15. Pause, hint confirm, reset confirm, exit confirm, credits and licences.

## Controls

- **Drag**: press a piece in the tray and drag onto a slot (Pointer Events; drop target highlights
  when the category matches). Releasing outside a slot cancels.
- **Tap**: tap a piece to select it (the matching slot pulses), tap the slot to place it. Tapping
  a placed piece selects it; the Remove button or dragging it out clears the slot. Placing onto an
  occupied slot swaps; the old piece returns to the tray.
- **Keyboard**: Tab moves between tray tabs, pieces and slots; arrow keys move inside the tray;
  Enter places the focused piece into its slot or selects a slot; Backspace clears the focused
  slot; Ctrl+Z / Ctrl+Y undo and redo; Space on Finish look.
- **Android back**: closes sheets, then leaves the board with a confirm if the look has pieces,
  then pops the stack (kit router `handleBack`).

## Onboarding

First launch plays the guided tutorial on `riv-01` (five steps in `content-plan.md`), each
advancing only on the real action, skippable, saved as a flag. Each new rule family shows its
one-time rule card before the first challenge that uses it (nine cards in `content-plan.md`).
How to play can be reopened from Home.

## Accessibility

- Body text 16 px minimum, labels 14 px minimum; text contrast >= 4.5:1 and non-text UI >= 3:1
  for every token pair used (table below, verified by a unit test in task 04).
- Every button, tray piece, tab, toggle and slot has a hit area of at least 44 x 44 CSS px
  (`--wg-hit-min: 44px`); board slots are at least 88 x 88 px at 360 px width.
- Colour is never the only signal: rule chips carry a check or cross icon plus text, every piece
  shows its name and tag icons, colour tags show swatch plus name, high contrast adds hatching to
  swatches and thicker outlines.
- Drag is never required: tap and keyboard paths cover every action.
- Reduced motion (system and in-app) removes pop, slide and star-reveal motion; changes appear at
  once.
- An ARIA live region announces changes ("Hat: Wide-Brim Sun Hat placed. Rules met 2 of 3.
  Harmony 74.") and the result.
- Fonts: Playfair Display (display) and DM Sans (body), both OFL, bundled.

## Art-bible palette (design tokens)

Editorial fashion illustration: gouache and marker on warm paper, one accent per chapter.

| Token | Hex | Use |
|---|---|---|
| ink | #231d1a | text on light, outlines |
| ink-soft | #5a4e46 | secondary text |
| paper | #f6efe4 | card and sheet surface |
| paper-2 | #ebe0cc | secondary surface |
| night | #1c1816 | app background |
| linen | #e2d5be | flat-lay board surface |
| hairline | #78674f | slot outlines, dividers (non-text) |
| good | #2a6540 | rule met |
| warn | #7a4f00 | caution text |
| bad | #a3322b | rule unmet |
| star | #c58a12 | star fill (always outlined in ink) |
| focus | #1d5fa8 | focus ring |
| blush | #e9c9bf | soft highlight panels |
| mist | #d3dde0 | cool highlight panels |

Chapter accents (used for buttons, headers and the chapter backdrop tint): Riviera Summer sky
`#2b6a9a`, Rainy City ochre `#7f5f00`, Gala Night red `#a1281f`, Mountain Weekend green `#2c6a48`,
Studio Avant-garde violet `#6a3fa0`, Vintage 70s rust `#a4491a`.

Measured contrast (WCAG): ink on paper 14.57, ink on paper-2 12.73, ink on linen 11.48,
ink-soft on paper 7.04, ink-soft on linen 5.55, paper on night 15.43, good on paper 6.06, bad on
paper 6.03, warn on paper 6.24, paper on good 6.06, paper on bad 6.03, focus on paper 5.65,
hairline on paper 4.77, hairline on linen 3.76, star on night 5.89, ink on star 5.56 (star on
paper is only 2.62, so stars are always drawn with an ink outline). Accent on paper (paper text
on accent): sky 5.06, ochre 5.19, red 6.48, green 5.64, violet 6.49, rust 5.18; accents on linen
3.99 to 5.12. Accents are never used on `night`.

## Share text

Campaign: `Dress Rehearsal - Gala Night "Cloakroom": 3/3 stars, harmony 84, styled for Dame Ottoline Frost.`
Daily: `Dress Rehearsal Daily 2026-10-23: 2/3 stars, harmony 76. Streak 5.`
Shared through the kit `shareContent` (no URL in v1) together with the image where supported.

## Save data

Profile v1 (key `dress-rehearsal.profile`, kit `createSaveStore`): coins, stars and best per
challenge, chapter bonuses claimed, affinity levels paid, streak freezes, daily record, gallery
(24), frames owned and selected, flags (tutorial, rule cards, how-to), stats. Settings use the kit
settings store with game id `dress-rehearsal`. Details in `economy.md` and task 03.

## Non-goals for v1

Ads, purchases, accounts, leaderboards, multiplayer, user-made challenges, a body or mannequin,
localisation, landscape, tablets, cloud save, notifications, native image sharing through the
Filesystem plugin (owner decision, `open-questions.md`).
