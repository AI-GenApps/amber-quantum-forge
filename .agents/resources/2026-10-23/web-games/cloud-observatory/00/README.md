# Task 00 evidence: planning, balance sketch, contrast

Task 00 changes no code. This folder records the two calculations behind numbers in the knowledge
base.

## Balance sketch

`balance-sketch.mjs` is a throwaway Node script (not shipped, not linted) that simulates one
second at a time. `balance-sketch-output.txt` is its real output (`node balance-sketch.mjs`).

Reference player: taps Gather twice a second for 10 minutes then once every two seconds, checks
the shop every 5 seconds, buys the affordable item with the best output-per-cost, and charts the
next constellation as soon as it is affordable and its prerequisite is met. Constellation bonus
+5% each. Achievements, the Comet, Second Sight and Totality are not modelled.

Tables used: the instruments, constellation costs and prerequisites in
`.agents/games/cloud-observatory/economy.md` (upgrades at 10/25/50 owned, costs 10/100/1000 × base,
×2/×2/×3). Shards: `floor(sqrt(cycleStarlight / 1e9))`, available at 5.

| Result | Value |
|---|---|
| First constellation charted | 90 s |
| First cycle reaches 5 pending shards | 171.8 min (2.86 h), cycle starlight 2.5e10 |
| 8, 10, 15 pending shards | 220, 255, 318 min |
| Longest gap between any two purchases (cycle 1) | 30 s |
| Constellations charted at 5 shards | 11 of 12 |
| Cycle 2 with Dark-Adapted + Brass Polish | 137 min (80% of cycle 1) |
| Cycle with Dark-Adapted, Brass Polish, Clear Glass, Apprentice | 133 min (77%) |
| Cycle with those plus Atlas Ink and Corona | 68 min (40%) |

An earlier attempt with growth 1.14 to 1.17 and a cost ratio of 8 reached only 9 constellations and
no Aurora Coil after 8 hours, so the growth and ratios in the economy were lowered. Task 02's
simulator test replaces this script and is the authority.

## Contrast of the art-bible palette

WCAG relative-luminance contrast, computed with a short Python script (not kept):

| Colour | on #0B1226 | on #101A33 | on #172445 | on #22335C |
|---|---|---|---|---|
| parchment #F3E9D2 | 15.4 | 14.3 | 12.7 | 10.3 |
| parchment-dim #C9BFA4 | 10.2 | 9.4 | 8.3 | 6.8 |
| muted #A39E8F | 6.9 | 6.4 | 5.7 | 4.6 |
| gold-leaf #D8A94B | 8.6 | 8.0 | 7.1 | 5.7 |
| gold-light #EBCB85 | 11.9 | 11.0 | 9.8 | 7.9 |
| wash-teal #6FB3BD | 7.8 | 7.3 | 6.4 | 5.2 |
| wash-rose #D98BA0 | 7.2 | 6.7 | 5.9 | 4.8 |
| danger #F08A78 | 7.6 | 7.1 | 6.3 | 5.1 |
| success #8FCB9B | 9.9 | 9.2 | 8.1 | 6.6 |

Text on a gold-leaf button: `#0B1226` on `#D8A94B` is 8.6:1. All pairs listed meet 4.5:1.

## Toolchain facts checked

- `pyftsubset` and Python `fontTools` 4.61.1 with `brotli` are available for the woff2 subsetting
  in task 04 (no new repo dependency needed).
- The art inbox `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox` held no delivered art at planning
  time.
