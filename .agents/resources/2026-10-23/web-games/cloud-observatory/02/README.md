# Task 02 evidence: content, validators and balance simulator

Task 02 adds the full v1 content as typed data in `cloud-observatory-core/src/content/`, the
validators under `cloud-observatory-core/test/content/`, and the headless balance simulator
`cloud-observatory-core/src/simulator.ts`.

## Files

- `simulator-output.txt`: real output of `bun report.ts` (this folder), which runs `simulate` on the
  real `CATALOG`. It is deterministic: running it again prints the same text.
- `report.ts`: the small script that prints that report. Run `bun report.ts` from this folder.

## Method

`simulate(catalog, options)` steps one second at a time against the real rules engine
(`tick`, `gather`, `buyInstrument`, `buyUpgrade`, `completeChart`, `eclipse`, `buyBoon`). The
reference player taps Gather twice a second for the first 600 s of each cycle and once every two
seconds afterwards, decides every 5 s, charts a constellation with a perfect tracing as soon as it
can, otherwise buys the single affordable instrument or upgrade with the best starlight-per-second
(plus tap) gain per cost, Eclipses at 5 pending shards, then buys boons by ascending cost.
Achievements and the Comet are not modelled.

## Result (no number was retuned)

| Target | Required | Result |
|---|---|---|
| First constellation charted | under 180 s | 90 s |
| First cycle to 5 pending shards | 2.5 to 4 h | 10,293 s (2.86 h) |
| Longest gap between purchases, cycles 1 to 3 | at most 360 s | 30 s |
| Constellations charted at the first Eclipse | at least 11 | 11 |
| Cycle 2 to 5 shards (Dark-Adapted + Brass Polish) | at most 85% of cycle 1 | 8,605 s, 83.6% |
| Cycle 3 to 5 shards (+ Clear Glass, Night Watch) | at most 85% of cycle 1 | 8,313 s, 80.8% |
| Pinned: Dark-Adapted + Brass Polish, 11 charted | at most 85% | 82.4% |
| Pinned: + Clear Glass + Apprentice (11 shards) | at most 85% | 80.7% |
| Pinned: + Atlas Ink + Corona (39 shards) | at most 55% | 41.9%, longest gap 20 s |

In the sequential run a cycle after the first reports `first chart never` because no new
constellation is charted in that cycle (the Owl needs 10 Aurora Coils and 4e8 starlight).

The same targets are asserted by `test/content/simulator.test.ts`, which runs in well under a second.

## Content checks

- `counts.test.ts`, `ids.test.ts`, `lore.test.ts` and `stars.test.ts` run the validators on the real
  data and on mutated copies (a removed star, a duplicated id, a bad trigger, a moved star) and
  require the validators to fail.
- `economy-table.test.ts` parses `economy.md` and `content-plan.md` and compares every instrument,
  constellation, boon, upgrade factor, achievement name, upgrade name, chapter title and lore title
  with the code, so docs and code cannot drift.

## Formatting note

The root `biome.json` excludes `apps-games/**/content`, so `bunx biome check` skips
`src/content` and `test/content`. They were formatted once with the repo's own Biome binary in a
scratch copy (`node_modules/.bin/biome check --write` with a config that drops that exclusion, no
version change). The rest of `cloud-observatory-core` is checked normally by the gate.
