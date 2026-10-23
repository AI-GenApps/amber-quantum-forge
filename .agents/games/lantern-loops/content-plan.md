# Lantern Loops — content plan (v1, complete)

This is the complete named list of v1 content. Task 02 ships exactly this volume; the art briefs for
the designer thread are derived from it. A change here is a decision: log it in `decisions-log.md`.

Totals: **4 chapters, 120 campaign puzzles (4 x 30), 2 tutorial boards, 7 weekday daily tiers,
30-day archive, 5 lantern colours + 1 unlit state, 4 mechanics, 6 streak medallion tiers, 6 how-to-play
pages.** Categories this game does not have (customers, cases and evidence, constellations, lore
entries) are listed at the end as not applicable so nothing is silently missing.

## 1. Mechanics (one introduced per chapter)

| # | Mechanic | Chapter | Clue object | Rule in one line |
|---|---|---|---|---|
| 1 | Lanterns and loops | Harbor | Lantern | Light every lantern; paths close into loops; every loop holds a lantern |
| 2 | Numbered stones | Garden | Stone 0 to 4 | Exactly that many neighbouring cells hold a tile |
| 3 | Mirrors | Bridge | Mirror `/` or `\` | The loop must turn at the mirror, on one of its two diagonals |
| 4 | Colour gates | Sky | Gate + five lantern colours | A gate is crossed straight, only by a loop of its colour; a loop holds one colour |

Every chapter also uses the mechanics before it, and every board may use fixed tiles (anchors) as
needed for uniqueness. Validators enforce the clue ranges below.

## 2. Chapters

| Chapter | Backdrop slot | Mood | Unlock | Mechanic intro |
|---|---|---|---|---|
| Harbor | `backdrop-harbor` | Boats, moorings and lamp-lit docks at dusk, deep indigo water, amber glow | open | Lanterns and loops |
| Garden | `backdrop-garden` | A walled night garden, paper blossoms, teal shadows, rose glow | 45 stars | Numbered stones |
| Bridge | `backdrop-bridge` | Arched bridges over a still river, glints and reflections | 120 stars | Mirrors |
| Sky | `backdrop-sky` | Lanterns released into a violet-azure evening sky | 210 stars | Colour gates and colours |

Chapter blurbs (shown on chapter cards, at most 90 characters):

- Harbor: "Light the moorings and close the ropes of the old harbor."
- Garden: "Count the stones along the quiet paths of the night garden."
- Bridge: "Let the light turn on the mirrors of the river crossings."
- Sky: "Open the gates for every colour and send the lanterns skyward."

### Sizes per chapter (30 each)

| Chapter | 5x5 | 6x6 | 7x7 | 8x8 | 9x9 | Total |
|---|---|---|---|---|---|---|
| Harbor | 10 | 10 | 10 | 0 | 0 | 30 |
| Garden | 5 | 10 | 10 | 5 | 0 | 30 |
| Bridge | 4 | 8 | 8 | 6 | 4 | 30 |
| Sky | 0 | 4 | 8 | 10 | 8 | 30 |

Sizes appear in ascending order inside a chapter (the puzzle number rises with the size and
difficulty). Difficulty rating 1 to 5 is computed by the solver (task 02) and non-decreasing over
the five bands of six puzzles (1 to 6, 7 to 12, 13 to 18, 19 to 24, 25 to 30).

### Clue ranges per board (validator limits)

| Size | Lanterns | Stones (Garden+) | Mirrors (Bridge+) | Gates (Sky) | Fixed tiles |
|---|---|---|---|---|---|
| 5x5 | 2 to 3 | 2 to 3 | 1 to 2 | n/a | target <= 35% of solution tiles, hard limit 50% |
| 6x6 | 3 to 4 | 3 to 5 | 2 to 3 | 1 to 2 | same |
| 7x7 | 3 to 5 | 4 to 6 | 2 to 4 | 2 to 3 | same |
| 8x8 | 4 to 6 | 5 to 8 | 3 to 5 | 2 to 4 | same |
| 9x9 | 5 to 8 | 6 to 9 | 4 to 6 | 3 to 5 | same |

A chapter's mechanic count applies from that chapter on: Harbor has 0 stones, mirrors and gates;
Garden has stones; Bridge adds mirrors; Sky adds gates and uses 2 to 5 lantern colours. Stones in
Bridge and Sky use 60 to 100% of the Garden range for the size. Harbor, Garden and Bridge lanterns
are all amber.

## 3. Campaign puzzles (120)

Ids are `<chapter>-NN` (`harbor-01` to `sky-30`, chapter in lower case). Titles are unique across the game and at most 24 characters. Size ascends with the puzzle number inside each chapter.

### Harbor (30)

| # | Title | Size | # | Title | Size | # | Title | Size |
|---|---|---|---|---|---|---|---|---|
| 01 | First Light | 5x5 | 11 | Bell Buoy | 6x6 | 21 | Breakwater | 7x7 |
| 02 | Mooring Rope | 5x5 | 12 | Salt Wind | 6x6 | 22 | Lighthouse Stair | 7x7 |
| 03 | Little Skiff | 5x5 | 13 | Fish Market | 6x6 | 23 | Tidal Maze | 7x7 |
| 04 | Dock Lamp | 5x5 | 14 | Harbor Steps | 6x6 | 24 | Anchor Chain | 7x7 |
| 05 | Quiet Cove | 5x5 | 15 | Canal Mouth | 6x6 | 25 | Customs House | 7x7 |
| 06 | Rope Coil | 5x5 | 16 | Tar and Twine | 6x6 | 26 | Rope Walk | 7x7 |
| 07 | Gull Rest | 5x5 | 17 | Night Ferry | 6x6 | 27 | Lantern Barge | 7x7 |
| 08 | Ferry Line | 5x5 | 18 | Sail Maker | 6x6 | 28 | Harbor Bells | 7x7 |
| 09 | Net Loft | 5x5 | 19 | Lamp Lighter | 6x6 | 29 | Pier Lanterns | 7x7 |
| 10 | Low Tide | 5x5 | 20 | Moonlit Quay | 6x6 | 30 | Festival Night | 7x7 |

Size bands: 5x5 = 10, 6x6 = 10, 7x7 = 10.

### Garden (30)

| # | Title | Size | # | Title | Size | # | Title | Size |
|---|---|---|---|---|---|---|---|---|
| 01 | Stepping Stones | 5x5 | 11 | Willow Bend | 6x6 | 21 | Hidden Spring | 7x7 |
| 02 | Pebble Path | 5x5 | 12 | Mossy Wall | 6x6 | 22 | Lotus Court | 7x7 |
| 03 | Moss Corner | 5x5 | 13 | Orchid Shade | 6x6 | 23 | Twisting Root | 7x7 |
| 04 | Raked Sand | 5x5 | 14 | Rain Garden | 6x6 | 24 | Maple Path | 7x7 |
| 05 | Plum Blossom | 5x5 | 15 | Wisteria Walk | 6x6 | 25 | Quiet Boulders | 7x7 |
| 06 | Fern Hollow | 6x6 | 16 | Fallen Petals | 7x7 | 26 | Evening Garden | 8x8 |
| 07 | Bamboo Row | 6x6 | 17 | Terrace Steps | 7x7 | 27 | Heron Pool | 8x8 |
| 08 | Lily Pond | 6x6 | 18 | Moon Gate | 7x7 | 28 | Rockery | 8x8 |
| 09 | Tea Arbor | 6x6 | 19 | Cedar Grove | 7x7 | 29 | Lantern Grove | 8x8 |
| 10 | Gravel Court | 6x6 | 20 | Dew Morning | 7x7 | 30 | Garden Festival | 8x8 |

Size bands: 5x5 = 5, 6x6 = 10, 7x7 = 10, 8x8 = 5.

### Bridge (30)

| # | Title | Size | # | Title | Size | # | Title | Size |
|---|---|---|---|---|---|---|---|---|
| 01 | First Crossing | 5x5 | 11 | Moonlit Ford | 6x6 | 21 | Suspension | 8x8 |
| 02 | Glass Pane | 5x5 | 12 | Painted Rail | 6x6 | 22 | Bridge of Lamps | 8x8 |
| 03 | Silver Mirror | 5x5 | 13 | Covered Bridge | 7x7 | 23 | Echoing Keystone | 8x8 |
| 04 | Narrow Span | 5x5 | 14 | Weathered Planks | 7x7 | 24 | Silvered Rail | 8x8 |
| 05 | River Glint | 6x6 | 15 | Ripple | 7x7 | 25 | Midnight Crossing | 8x8 |
| 06 | Echo Arch | 6x6 | 16 | Bright Parapet | 7x7 | 26 | Grand Arch | 8x8 |
| 07 | Reflection | 6x6 | 17 | Cable Walk | 7x7 | 27 | Two Rivers | 9x9 |
| 08 | Rope Bridge | 6x6 | 18 | Mist Crossing | 7x7 | 28 | Aqueduct | 9x9 |
| 09 | Stone Arch | 6x6 | 19 | Mirror Lake | 7x7 | 29 | Mirror Maze | 9x9 |
| 10 | Twin Span | 6x6 | 20 | Long Span | 7x7 | 30 | Bridge Festival | 9x9 |

Size bands: 5x5 = 4, 6x6 = 8, 7x7 = 8, 8x8 = 6, 9x9 = 4.

### Sky (30)

| # | Title | Size | # | Title | Size | # | Title | Size |
|---|---|---|---|---|---|---|---|---|
| 01 | First Gate | 6x6 | 11 | Sunset Sail | 7x7 | 21 | Rainbow Tide | 8x8 |
| 02 | Rose Door | 6x6 | 12 | Feather Fall | 7x7 | 22 | Comet Tail | 8x8 |
| 03 | Jade Latch | 6x6 | 13 | Cirrus | 8x8 | 23 | Observatory Roof | 9x9 |
| 04 | Two Keys | 6x6 | 14 | Sky Pass | 8x8 | 24 | Lantern Armada | 9x9 |
| 05 | Cloud Stairs | 7x7 | 15 | Weather Vane | 8x8 | 25 | Cloud Sea | 9x9 |
| 06 | Kite String | 7x7 | 16 | Star Ladder | 8x8 | 26 | Sky Harbor | 9x9 |
| 07 | Wind Chimes | 7x7 | 17 | Dusk Colours | 8x8 | 27 | Five Colours | 9x9 |
| 08 | Sky Lantern | 7x7 | 18 | Violet Hour | 8x8 | 28 | Zenith | 9x9 |
| 09 | High Terrace | 7x7 | 19 | Aurora Gate | 8x8 | 29 | Midnight Sky | 9x9 |
| 10 | Updraft | 7x7 | 20 | Thunderhead | 8x8 | 30 | Festival of Lanterns | 9x9 |

Size bands: 6x6 = 4, 7x7 = 8, 8x8 = 10, 9x9 = 8.


Mechanic intro puzzles: Harbor 01 (first lantern), Garden 01 (first stones), Bridge 01 (first
mirrors), Sky 01 (first gate, only amber and rose lanterns). Colours arrive in order: rose in Sky 01,
jade in Sky 03 ("Jade Latch"), violet in Sky 04 ("Two Keys"), azure in Sky 05. Sky 27 ("Five
Colours") must use all five colours.
Chapter finale puzzles (30) must use every mechanic of their chapter.

## 4. Tutorial boards (2, outside the campaign)

| Id | Title | Size | Teaches | Guided steps |
|---|---|---|---|---|
| `tutorial-1` | Light one lantern | 4x4 | Drag a loop through a lantern | Highlight the lantern, drag along the shown ribbon, loop closes, lantern glows |
| `tutorial-2` | Count the stones | 4x4 | Stone number clue | Highlight a stone "2", place two neighbouring tiles, check the count turns green |

Tutorial boards use the same solver proof (unique solution) and are stored beside the campaign data
but never count toward stars, statistics or unlocks.

## 5. Daily tiers (7) and archive

The seven weekday templates are in `product.md` (Mon 5x5 to Sun 9x9). Each template fixes the size,
the mechanic set, the lantern count range and the colour count (Saturday 2 to 3 colours, Sunday 3
to 5). Generator version string: `ll-gen-1` (part of the seed text; bump it only with a recorded
decision, because it changes every future daily). The archive covers the 30 dates before today.

## 6. Clue objects and items

| Object | Variants | Art in the board (SVG, code) | Image slot used elsewhere |
|---|---|---|---|
| Lantern | amber, rose, jade, azure, violet; lit and unlit | Paper lantern with glow, glyph on the body | `lantern-<colour>`, `lantern-unlit` |
| Stone | numbers 0, 1, 2, 3, 4 | Rounded paper pebble with a Fraunces numeral | none (code only) |
| Mirror | `/` and `\` | Slanted pane with a silver edge | none |
| Colour gate | 5 colours | Small arch with the colour and glyph | none |
| Fixed tile (anchor) | 6 tile shapes | Pinned paper ribbon tile with a tack | none |
| Path tile | straight H, straight V, corners NE, ES, SW, WN | Layered paper ribbon with offset shadow | none |
| Hint token | 1 kind | Small glowing ember icon (code) | none |
| Streak freeze | 1 kind | Snowflake-lantern icon (code) | none |

## 7. Lantern colours and glyphs (5 + unlit)

| Colour | Hex (dark UI) | Glyph | Art slot | Appears from |
|---|---|---|---|---|
| Amber | #F2A33A | circle | `lantern-amber` | Harbor 01 |
| Rose | #E9657F | diamond | `lantern-rose` | Sky 01 |
| Jade | #3FBF98 | triangle | `lantern-jade` | Sky 03 |
| Azure | #4EA6EA | square | `lantern-azure` | Sky 05 |
| Violet | #9A7DE3 | star | `lantern-violet` | Sky 04 |
| Unlit | #5C6385 | none (outline) | `lantern-unlit` | all chapters |

Base palette for the art bible and design tokens: deep indigo `#12132E` (background), indigo
`#1E2050`, teal `#0E5A5F`, paper cream `#F6EAD3` (text and ribbons), ink `#241B2F`. Task 04 owns
the final token table and its contrast test.

## 8. Streak medallions (6 tiers, art slot `daily-medallion`)

3 days "Spark", 7 days "Week", 14 days "Fortnight", 30 days "Moon", 60 days "Season", 100 days
"Century". The image is one transparent medallion; the tier name and number are drawn by code.

## 9. How-to-play pages (6)

1. Basics (tiles, loops, lanterns, drag and tap). 2. Stones. 3. Mirrors. 4. Gates and colours.
5. Daily and streak. 6. Hints and stars. Each page has a code-drawn mini diagram (static SVG board
fragment) and at most 60 words.

## 10. Audio events (ids shared by task 05 and the assets index)

`ui-tap`, `ui-back`, `sheet-open`, `tile-place`, `tile-rotate`, `tile-erase`, `loop-close`,
`lantern-lit`, `conflict`, `hint`, `undo`, `win-1`, `win-2`, `win-3`, `daily-done`,
`chapter-unlock`, `freeze-used`, plus one optional music loop `calm-loop`. Final CC0 file mapping
is recorded in `assets-index.md`.

## 11. Not applicable to this game

Customers, cases and evidence objects, constellations, shop items and lore entries do not exist in
Lantern Loops. The only text content beyond puzzles is the four chapter blurbs above, the 6
how-to-play pages and the two tutorial scripts.
