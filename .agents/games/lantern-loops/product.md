# Lantern Loops — product

Working title, public name in v1. Portrait, offline, single player, no accounts, no network.

## Pitch and tone

Daily logic puzzles: route light from lanterns through a grid so every lantern is lit, every path
closes into loops, and board constraints are satisfied. Calm, clever, shareable. There is no fail
state, no move limit and no countdown: a puzzle waits as long as the player wants. The only pressure
is the optional daily streak, softened by a weekly freeze.

## Board model (exact)

An N x N grid, N = 5 to 9 (tutorial boards are 4 x 4 and sit outside the campaign). Every cell is
one of:

- **Open cell**: holds no tile or one path tile.
- **Stone cell**: a numbered pebble. It can never hold a tile.

A **path tile** is a bitmask of openings, N=1, E=2, S=4, W=8. Exactly six tiles exist:

| Tile | Mask | Openings |
|---|---|---|
| Straight horizontal | 10 | E, W |
| Straight vertical | 5 | N, S |
| Corner NE | 3 | N, E |
| Corner ES | 6 | E, S |
| Corner SW | 12 | S, W |
| Corner WN | 9 | W, N |

Clues placed by the puzzle author (the generator) and never changed by the player:

- **Lantern**: an open cell that must hold a tile (it is "lit" when a tile sits on it and its loop
  is valid). Lanterns have a colour; in Harbor, Garden and Bridge every lantern is amber.
- **Stone with number k** (0 to 4): exactly k of the stone's orthogonal neighbours hold a tile.
  Neighbours outside the board do not count.
- **Mirror** (`/` or `\`): an open cell that must hold a corner tile. `/` allows the corners WN (9)
  or ES (6); `\` allows the corners SW (12) or NE (3). The loop must turn there, the player chooses
  which of the two corners.
- **Colour gate** (colour c): an open cell that must hold a straight tile (10 or 5) on a loop of
  colour c.
- **Fixed tile (anchor)**: any cell with a pre-placed, locked tile. Anchors are how the generator
  makes a puzzle uniquely solvable without hiding information; they are drawn as pinned paper tiles.

### Solved when all of these hold

1. **No loose ends**: every opening of every tile faces an in-bounds, non-stone neighbour whose tile
   has the matching opening. With degree 2 everywhere this means the tiles form disjoint closed
   loops (a loop never crosses or branches).
2. Every lantern cell holds a tile.
3. **Every loop carries at least one lantern.** Loops without a lantern are invalid.
4. Every stone's lit-neighbour count equals its number.
5. Every mirror cell holds one of its two allowed corners.
6. Every gate cell holds a straight tile.
7. **Colour rule**: all lanterns on one loop share one colour (a loop is "that colour"), and a gate
   is only passed by a loop of the gate's colour. The rule is vacuous when all lanterns are amber.
8. Fixed tiles are unchanged.

Several loops per board are allowed and common. Loops may touch side by side. Cells may stay empty.
The solver proves that each shipped puzzle has exactly one board satisfying 1 to 8; the validator
tests re-prove it.

## Player actions

| Action | Behaviour |
|---|---|
| Brush | A HUD toggle: **Straight**, **Corner** or **Erase**. Persisted per profile |
| Tap an empty open cell | Places the first tile of the brush (Straight: horizontal; Corner: NE) |
| Tap a tile of the brush family | Rotates it: Straight H -> V -> empty; Corner NE -> ES -> SW -> WN -> empty |
| Tap a tile of the other family | Converts it to the brush's first tile |
| Drag across cells | Draws a path: each visited cell gets the tile joining the previous and next cell in the drag (the first and last cell get a straight tile pointing along the drag). Overwrites unlocked cells it crosses, skips stones and locked cells |
| Drag with Erase / long-press (500 ms) a tile | Clears cells |
| Undo / Redo | Unlimited per attempt; one drag = one undo step |
| Restart | Clears all unlocked, non-hint tiles after a confirm sheet (only when at least one tile is placed) |
| Hint (1 token) | Reveals and locks one correct tile (see below) |
| Pause / menu | Opens a sheet: resume, restart, how to play, settings, leave |

**Hint rule**: among cells whose tile differs from the solution, prefer one whose correct value is
forced by constraint propagation from the currently correct tiles; otherwise the first mismatched
cell in row-major order. The tile is placed and locked, and counts as one hint for stars. A hint is
refused with a gentle message when the board is already correct or no token is held.

**Live feedback (setting "Show conflicts", default on)**: stones whose count can no longer be met
are outlined in rose; an opening with no matching neighbour is drawn as an open ribbon end; a closed
loop without a lantern is dimmed; mismatched gate and mirror cells get a soft ring. Feedback never
blocks a move and never reveals the solution.

**Win**: the moment rules 1 to 8 hold, the loops light up in sequence (skipped when reduced motion
is on), the win sheet opens with stars, time and the next action.

## Modes

### Campaign

120 puzzles in 4 chapters of 30 (see `content-plan.md`). Each chapter introduces one mechanic and
keeps the earlier ones: Harbor (lanterns and loops), Garden (numbered stones), Bridge (mirrors),
Sky (colour gates and five lantern colours). Inside an unlocked chapter every puzzle is open; the
list is ordered by rising difficulty. Chapters unlock by total stars: Garden 45, Bridge 120,
Sky 210. A locked chapter card shows the missing star count.

Stars: 0 hints = 3, 1 hint = 2, 2 or more hints = 1. The best result per puzzle counts. Replaying is
always allowed and never lowers stars.

### Daily

One puzzle per local date, generated on the device from the date seed by the same generator and
solver as the campaign (never fetched). Everyone on the same date sees the same puzzle. Difficulty
by weekday (device time zone):

| Weekday | Size | Mechanics | Tier |
|---|---|---|---|
| Monday | 5 x 5 | lanterns | 1 (easy) |
| Tuesday | 6 x 6 | lanterns, stones | 2 |
| Wednesday | 7 x 7 | lanterns, stones | 3 |
| Thursday | 7 x 7 | lanterns, stones, mirrors | 4 |
| Friday | 8 x 8 | lanterns, stones, mirrors | 5 |
| Saturday | 8 x 8 | all (gates, colours) | 6 |
| Sunday | 9 x 9 | all | 7 (hardest) |

The daily is available regardless of campaign progress. A "Today uses" strip names the mechanics and
links to their how-to-play page. Daily rewards: see `economy.md`. The streak rules are in
`economy.md`. The in-progress daily board is saved and survives app restarts.

### Archive

The 30 previous local dates (yesterday back to 30 days ago) can be played from the Archive screen,
regenerated from their date seeds. Archive solves count for stars and statistics, give a one-time
token, and never change the streak. Tabs: "To play" and "Completed" (the empty Completed tab shows
the empty-archive illustration).

### Sharing

After a daily or archive solve, "Share result" uses the kit share helper (Capacitor Share, then
`navigator.share`, then clipboard). Text format (sample, 5 x 5):

```
Lantern Loops Daily 2026-10-23
3 stars  1:42
🏮⬛⬛⬛⬛
⬛⬛⬜⬛⬛
⬛⬛⬛⬛🏮
⬛⬜⬛⬛⬛
⬛⬛⬛⬛⬛
```

Setting "Hide path in shared grid" (default on) shows lanterns 🏮, stones ⬜ and empty cells ⬛ so the
share does not spoil the solution; off shows lit tiles as the lantern's colour square
(🟧 amber, 🟥 rose, 🟩 jade, 🟦 azure, 🟪 violet). Stars and time are always included. No URL.

## Screens (13)

1. **Boot**: font and image preload with progress, save load, then Home. Never blocks on missing art.
2. **Home**: title, Play (Campaign), Daily card (today's tier, streak flame, solved tick), Archive,
   Statistics, Settings, How to play.
3. **Chapters**: four cards (Harbor, Garden, Bridge, Sky) with stars earned, solved count, lock state.
4. **Puzzle list**: the 30 puzzles of a chapter as a grid of numbered lantern buttons with stars.
5. **Puzzle**: board (SVG), brush switch, Undo, Redo, Restart, Hint (with token count), Pause. Optional timer.
6. **Win sheet**: stars, time, hints used, tokens earned, Next puzzle / Replay / Share (daily) / Home.
7. **Daily**: today's puzzle summary, streak, freeze status, medallion, Play / Continue.
8. **Archive**: 30-day list with tabs.
9. **Statistics**: solved, stars, per-chapter bars, dailies solved, streaks, best times, solves by weekday.
10. **Settings**: sound, music, haptics, reduced motion, high contrast (kit settings) plus show timer,
    show conflicts, hide path in shared grid, reset progress (two-step confirm).
11. **How to play**: pages Basics, Stones, Mirrors, Gates and colours, Daily and streak, Hints and stars.
12. **Onboarding / tutorial**: two guided 4 x 4 boards then Home (see below).
13. **About and licences**: version, fonts (OFL), audio (CC0, with sources), "no data collected".

Overlays: pause sheet, restart confirm, hint confirm, chapter-unlocked celebration, mechanic coach
card (first Bridge and Sky puzzle), toast for streak freeze used and token cap reached.

## Controls and navigation

Touch first (pointer events, `touch-action: none` on the board, no scrolling during a drag).
Keyboard for desktop browsers: arrow keys move the focus ring, Space or Enter applies the brush to
the focused cell, `S`/`C`/`E` select brush, `Z` undo, `Y` redo, `H` hint, `Escape` pause. Android
back button: closes the topmost sheet, else pops the screen, else asks before exiting from Home.

## Onboarding

First launch only (flag in the save): a welcome card, then two guided 4 x 4 boards outside the
campaign: "Light one lantern" (draw one loop through a lantern with drag) and "Count the stones"
(a stone clue). Each step has a highlighted target and one short sentence; a Skip button is always
visible. Mirrors and gates are introduced by one-time coach cards on Bridge puzzle 1 and Sky puzzle
1. How to play stays reachable from Home and the pause sheet. Replaying the tutorial is a Settings
row.

## Accessibility

- **Contrast**: body and numeral text at least 4.5:1, board lines and glyphs at least 3:1 against
  their background; asserted by a token contrast test.
- **Hit areas**: every button, toggle and tab at least 44 x 44 css px. Board cells are as large as
  the viewport allows with a floor of 36 css px (a 9 x 9 board fits a 340 px wide viewport);
  drag-drawing and unlimited undo compensate for the smaller cells.
- **Colour is never the only cue**: each lantern colour has a glyph (amber circle, rose diamond,
  jade triangle, azure square, violet star) drawn on the lantern and on matching gates; the
  high-contrast setting thickens outlines and adds the glyphs to tiles.
- **Reduced motion**: the kit setting (or system preference) removes the win sequence, tile tweens
  and parallax; state changes still show instantly.
- **Screen readers**: the board is a grid with per-cell labels ("Row 3, column 4, straight
  horizontal, lit"), a polite live region announces conflicts and the win, and every control has an
  accessible name.
- **Keyboard**: full play without a pointer (see Controls).
- **Text size**: layouts use rem and survive 130% system font scaling; no truncated labels in tests.
- **Fonts**: only Fraunces and Nunito render text; no platform default fallback.
- **Haptics and sound** are optional and default on; haptics and audio respect their settings.

## Out of scope for v1

Multiplayer, leaderboards, user-made puzzles, cloud save, notifications, ads, IAP, accounts, a
puzzle editor, localization beyond English.
