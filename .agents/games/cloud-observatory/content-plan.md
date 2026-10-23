# Cloud Observatory — content plan

The COMPLETE named list of v1 content. It drives the art briefs (task 06 / designer thread), the
content tables (task 02) and the validators. Counts are contractual: 12 constellations, 8
instruments, 24 upgrades, 10 boons, 30 lore entries in 6 chapters, 20 achievements, 1 daily mode.

This game has no customers, cases, levels or maps. Its equivalents are: constellations are the
"levels" (a tap-in-order star pattern each), the Comet is the daily puzzle, and the six lore
chapters are the story acts. Nothing else is required for v1.

Ids are kebab-case and final. Art slot names match `assets-index.md`.

## 1. Constellations (12), in atlas order

Sky map coordinate space: 1000 wide by 1400 tall (portrait), origin top-left. Stars sit inside a
100-unit margin and are at least 140 units apart (so the 48 px tap target never overlaps on a
320 px wide screen). Tracing order is the star order below; consecutive stars are joined by a gold
line as the player progresses, plus any "closing" edge named in the shape. The shapes are original
drawings, not copies of IAU charts.

| # | Id | Name | Stars | Shape of the tracing path | Emblem slot |
|---|---|---|---|---|---|
| 1 | lyre | The Lyre | 5 | A narrow U with a crossbar: left arm top, left base, right base, right arm top, then the crossbar star between the arms. Closing edge from the fifth star to the first | emblem-lyre |
| 2 | crown | The Crown | 6 | A shallow arc of six points, left to right, like a circlet seen from the side; closing edge from the last star back to the first | emblem-crown |
| 3 | key | The Key | 6 | A round bow (three stars in a triangle), then a straight shaft down (two stars), then one tooth | emblem-key |
| 4 | lantern | The Lantern | 6 | A tall hexagon-ish cage: top ring star, four body corners clockwise, then the base star; closing edge base to ring | emblem-lantern |
| 5 | whale | The Whale | 7 | Snout, two back stars, the tail base, a fluke star on each side, and a spout star above the head | emblem-whale |
| 6 | harp | The Harp | 7 | A right-angled frame: top corner, mid-pillar, foot, base end, then three string stars rising across the frame | emblem-harp |
| 7 | fox | The Fox | 7 | Two ear stars, a nose star, then a long brush: back, haunch, tail curl, tail tip | emblem-fox |
| 8 | archer | The Archer | 7 | A bow arc of four stars, the bowstring pulled back by a fifth, the arrow shaft and arrowhead as the last two | emblem-archer |
| 9 | serpent | The Serpent | 8 | An S-curve that crosses the map: head, five coil stars alternating left-right, two tail stars | emblem-serpent |
| 10 | ship | The Ship | 8 | A hull (three stars), mast (two stars up), a sail triangle (two stars) and a pennant star | emblem-ship |
| 11 | tower | The Tower | 9 | A stepped tower: base left, base right, four tier corners (two tiers narrowing upward), a roof star, a spire star and a flag star | emblem-tower |
| 12 | owl | The Owl | 10 | Two ear tufts, two eyes, a beak star, wing tips left and right, two talon stars and the tail star | emblem-owl |

Tracing order note (task 02): the descriptions name the parts of each figure, not a strict walking
order. The coordinates in `cloud-observatory-core/src/content/constellations.ts` use an order in
which the open path never crosses itself: the Whale is traced spout, snout, back, back, tail base,
upper fluke, lower fluke; the Ship is traced pennant, mast top, mast base, hull left, keel, hull
right, sail outer point, sail inner point; the Lantern's base star is the wick inside the cage; the
Harp's three string stars run along the diagonal; the Archer's arrow rises to the upper right.
Only the Lyre, Crown and Lantern are `closed`.

Totals: 86 stars. Each constellation has one lore entry (section 5) and a card in the atlas showing
its emblem (placeholder: code-drawn gold line figure until the emblem art is accepted).

## 2. Instruments (8)

| # | Id | Name | One-line flavour | Art slot |
|---|---|---|---|---|
| 1 | telescope | Brass Telescope | Aunt Verity's own, found under a dust sheet | instrument-telescope |
| 2 | lens | Lens Array | Ground glass in a brass rack for faint stars | instrument-lens |
| 3 | prism | Prism Spectrograph | Splits starlight into its colours | instrument-prism |
| 4 | orrery | Clockwork Orrery | Turns the planets by hand and gear | instrument-orrery |
| 5 | star-map | Star-Map Press | Prints the sky onto vellum | instrument-star-map |
| 6 | beacon | Signal Beacon | Answers other watchers across the ridges | instrument-beacon |
| 7 | archive | Star Archive | Every night anyone ever watched, shelved | instrument-archive |
| 8 | aurora-coil | Aurora Coil | Copper and quiet current that makes the sky glow back | instrument-aurora-coil |

## 3. Upgrades (24): three per instrument

Thresholds 10 / 25 / 50 owned; multipliers ×2 / ×2 / ×3 (see economy.md).

| Instrument | Tier 1 (id, name) | Tier 2 (id, name) | Tier 3 (id, name) |
|---|---|---|---|
| telescope | u-telescope-1 Polished Objective | u-telescope-2 Steadied Tripod | u-telescope-3 Silvered Mirror |
| lens | u-lens-1 Ground Crown Glass | u-lens-2 Achromatic Doublet | u-lens-3 Coated Element |
| prism | u-prism-1 Flint Prism Cut | u-prism-2 Spectral Slit | u-prism-3 Diffraction Grating |
| orrery | u-orrery-1 Oiled Gears | u-orrery-2 Jewelled Bearings | u-orrery-3 Clockwork Escapement |
| star-map | u-star-map-1 Vellum Charts | u-star-map-2 Gilded Meridians | u-star-map-3 Precession Tables |
| beacon | u-beacon-1 Reflector Cone | u-beacon-2 Signal Lantern Chain | u-beacon-3 Mountaintop Relay |
| archive | u-archive-1 Card Catalogue | u-archive-2 Climate Vault | u-archive-3 Copyist Guild |
| aurora-coil | u-aurora-coil-1 Copper Windings | u-aurora-coil-2 Auroral Resonance | u-aurora-coil-3 Magnetic Cradle |

Upgrades have no art slot; they use a code-drawn gold chip with the instrument's emblem glyph.

## 4. Eclipse boons (10)

| # | Id | Name | Shards | Effect |
|---|---|---|---|---|
| 1 | dark-adapted | Dark-Adapted Eyes | 1 | Start each cycle with 1,000 starlight |
| 2 | brass-polish | Brass Polish | 2 | Brass Telescopes ×2 |
| 3 | clear-glass | Clear Glass | 3 | Instrument and charting costs ×0.95 |
| 4 | night-watch | Night Watch | 4 | Offline efficiency 75% |
| 5 | apprentice | The Apprentice's Bench | 5 | Start with 5 Brass Telescopes and 3 Lens Arrays |
| 6 | atlas-ink | Atlas Ink | 8 | Constellation bonus ×1.5 |
| 7 | long-vigil | Long Vigil | 10 | Offline efficiency 100% |
| 8 | second-sight | Second Sight | 12 | Upgrade costs ×0.75 |
| 9 | corona | Corona | 20 | All starlight ×1.5 |
| 10 | totality | Totality | 40 | All starlight ×2 |

Boons have no art slot; the Eclipse screen draws each as a code-drawn gold ring glyph.

## 5. Lore: 6 chapters, 30 entries

Short original prose (40 to 90 words each), second person, quiet and warm, no jokes at the
player's expense, no real-world brands, no text containing the words "window" or "document". Each
entry is unlocked by its trigger and read in the Journal. Each chapter opens with a chapter card
using that chapter's vignette art slot.

### Chapter 1: The Roof at Dusk (art slot `lore-1`)

Vignette: dusk on a slate rooftop, a brass telescope under a dust sheet, first stars appearing.

| # | Id | Title | Trigger | Premise |
|---|---|---|---|---|
| 1 | lore-01 | The Key Under the Slate | First Brass Telescope | A key, a note: "Look up. V." You are the new keeper |
| 2 | lore-02 | Verity's Logbook | First Lens Array | Her nightly entries thin out to one line: "quiet again" |
| 3 | lore-03 | The Lyre Rises | Chart The Lyre | The first line drawn; the sky hums back, faintly |
| 4 | lore-04 | A Crown of Six | Chart The Crown | Six stars close a circle; Verity wrote "someone is listening" beside it |
| 5 | lore-05 | Ink and Dew | First Prism Spectrograph | How she mixed her gold ink from dew and lamp soot |

### Chapter 2: The Brass Years (art slot `lore-2`)

Vignette: the observatory interior, brass gears, a lamp, an orrery in the corner.

| # | Id | Title | Trigger | Premise |
|---|---|---|---|---|
| 6 | lore-06 | The Key That Fits | Chart The Key | A drawer opens: letters from the town below |
| 7 | lore-07 | Lantern Nights | Chart The Lantern | The town once hung lanterns for the first clear night each month |
| 8 | lore-08 | The Orrery Turns | First Clockwork Orrery | Built with the clockmaker Anselm, who never looked up again |
| 9 | lore-09 | Whale Song | Chart The Whale | Sailors steered by it and sang to it; a lullaby fragment |
| 10 | lore-10 | Printing the Heavens | First Star-Map Press | Charts sent to schools; children's pencil stars in the margins |

### Chapter 3: The Night Library (art slot `lore-3`)

Vignette: a vaulted archive of star charts, ladders, warm lamplight.

| # | Id | Title | Trigger | Premise |
|---|---|---|---|---|
| 11 | lore-11 | The Harp Strings | Chart The Harp | Each string a night she kept watch alone |
| 12 | lore-12 | The Fox in the Margins | Chart The Fox | Verity's doodles; the one joke in the logbook |
| 13 | lore-13 | A Light on the Ridge | First Signal Beacon | Another beacon blinks back, far away, then another |
| 14 | lore-14 | The Night Library | First Star Archive | Every watched night shelved; the unwatched ones are blank |
| 15 | lore-15 | The Archer's Patience | Chart The Archer | Waiting is also an instrument |

### Chapter 4: The Dimming Hours (art slot `lore-4`)

Vignette: a sky with half-dark patches where stars are returning, a thin aurora.

| # | Id | Title | Trigger | Premise |
|---|---|---|---|---|
| 16 | lore-16 | The Serpent's Coil | Chart The Serpent | It circles the question without asking it |
| 17 | lore-17 | The Ship Sets Out | Chart The Ship | The stars do not die; they drift when unwatched |
| 18 | lore-18 | The Tower Without a Door | Chart The Tower | A constellation you can only enter by looking |
| 19 | lore-19 | The Owl Who Keeps Count | Chart The Owl | The last chart; the count is the sky remembering itself |
| 20 | lore-20 | Aurora Over the Roof | First Aurora Coil | The sky answers back, and for a moment it is not quiet |

### Chapter 5: The Hour of Shadow (art slot `lore-5`)

Vignette: a total eclipse over the rooftop, a thin ring of light, a small figure with a lamp.

| # | Id | Title | Trigger | Premise |
|---|---|---|---|---|
| 21 | lore-21 | Dark-Adapted | Boon Dark-Adapted Eyes | Eyes learn the dark slowly; so does everything else |
| 22 | lore-22 | What Brass Remembers | Boon Brass Polish | Metal keeps the shape of every hand that held it |
| 23 | lore-23 | Clear Glass | Boon Clear Glass | Verity cleaned the glass every night; that was the secret |
| 24 | lore-24 | The Night Watch | Boon Night Watch | Someone keeps watch while you sleep; you are not alone on the roof |
| 25 | lore-25 | The Apprentice's Bench | Boon The Apprentice's Bench | Verity's own first bench, with her initials scratched in |

### Chapter 6: Morning Star (art slot `lore-6`)

Vignette: dawn on the rooftop, one bright star left, a key held out to a child.

| # | Id | Title | Trigger | Premise |
|---|---|---|---|---|
| 26 | lore-26 | Atlas Ink | Boon Atlas Ink | The atlas is a letter to whoever comes next |
| 27 | lore-27 | The Long Vigil | Boon Long Vigil | Watching is not waiting; it is company |
| 28 | lore-28 | Second Sight | Boon Second Sight | Seeing a thing twice is how it becomes yours |
| 29 | lore-29 | Corona | Boon Corona | The ring of light around the dark is the sky's thank-you |
| 30 | lore-30 | Totality | Boon Totality | The last page: leave the key under the slate for the next keeper |

Lore counts by trigger: 8 instruments, 12 constellations, 10 boons = 30.

## 6. Achievements (20)

Each unlocked achievement adds +1% to the additive global multiplier. Toast on unlock; listed on
the Achievements screen with progress.

| # | Id | Name | Condition |
|---|---|---|---|
| 1 | telescope-row | Telescope Row | Own 10 Brass Telescopes |
| 2 | lens-bench | Lens Bench | Own 10 Lens Arrays |
| 3 | spectrograph-gallery | Spectrograph Gallery | Own 10 Prism Spectrographs |
| 4 | orrery-hall | Orrery Hall | Own 10 Clockwork Orreries |
| 5 | press-room | Press Room | Own 10 Star-Map Presses |
| 6 | beacon-ridge | Beacon Ridge | Own 10 Signal Beacons |
| 7 | reading-room | Reading Room | Own 10 Star Archives |
| 8 | coil-field | Coil Field | Own 10 Aurora Coils |
| 9 | first-ink | First Ink | Chart 1 constellation |
| 10 | cartographer | Cartographer | Chart 6 constellations |
| 11 | whole-sky | The Whole Sky | Chart all 12 constellations |
| 12 | steady-hand | Steady Hand | Chart a constellation with no mistaken taps |
| 13 | million-rays | A Million Rays | 1,000,000 lifetime starlight |
| 14 | billion-fold | Billion-Fold | 1,000,000,000 lifetime starlight |
| 15 | first-shadow | The First Shadow | Perform 1 Eclipse |
| 16 | shadow-keeper | Shadow Keeper | Perform 5 Eclipses |
| 17 | comet-chaser | Comet Chaser | Trace the Wandering Comet on 3 different dates |
| 18 | seven-nights | Seven Nights | Reach a 7-day comet streak |
| 19 | keeper-of-tales | Keeper of Tales | Unlock all 30 lore entries |
| 20 | long-sleep | Long Sleep | Collect a full 8 hours of offline progress |

No achievement grants a currency or an item; the +1% each is the only reward.

## 7. The Wandering Comet (daily mode)

One generated puzzle per local date, not stored content: 6 stars from the seeded kit rng, tracing
order fixed by the same stream, spacing and margin rules as the constellations. Streak rewards are
in economy.md. Art: code-drawn comet (gold head, fading tail); no slot.

## 8. Fixed UI copy that is content (names the validators check)

Chapter titles (6), constellation names (12), instrument names (8), upgrade names (24), boon names
(10), lore titles (30), achievement names (20) are exactly those above. The validators in task 02
fail if any id is duplicated, any name is empty, a lore entry has no trigger, any trigger points at
a missing id, or a count differs from the contract.

## 9. Count checklist

| Item | Count |
|---|---|
| Constellations | 12 (86 stars) |
| Instruments | 8 |
| Upgrades | 24 (8 × 3) |
| Eclipse boons | 10 (105 shards) |
| Lore chapters | 6 |
| Lore entries | 30 (8 instrument, 12 constellation, 10 boon triggers) |
| Achievements | 20 |
| Daily modes | 1 (Wandering Comet) |
| Art image slots | 33 (see assets-index.md) |
