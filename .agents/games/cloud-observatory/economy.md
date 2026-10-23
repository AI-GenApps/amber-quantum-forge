# Cloud Observatory — economy

Every currency, source, sink and number. These are the starting values proven by a throwaway
balance sketch (`.agents/resources/2026-10-23/web-games/cloud-observatory/00/README.md`). Task 02
turns them into content tables and the headless balance simulator test; the simulator is the
authority and its tuned numbers must be copied back here in the same commit.

No monetization in v1: no ads, no IAP, no accounts, no network. A future IAP layer would sell
cosmetic observatory themes or time-skips; the economy needs no change for that (see
decisions-log).

## Currencies

| Currency | Scope | Sources | Sinks |
|---|---|---|---|
| Starlight | Per cycle (reset by Eclipse) | Gather taps, instruments per second, offline progress, Daily Comet | Instruments, upgrades, charting costs |
| Eclipse shards | Permanent | Eclipse (`floor(sqrt(cycleStarlight / 1e9))`), 7th-day Comet streak (+1) | Boons only |

Not currencies, but permanent progress: charted constellations (global multiplier), achievements
(global multiplier), lore entries (story only).

## Starting state of a new journey

Starlight 10, nothing owned, nothing charted, 0 shards, offline efficiency 50%.

## Instruments (8)

`cost of unit n (owned = n-1) = baseCost * growth^owned`. Total cost of buying k units from `owned`
is the geometric sum `baseCost * growth^owned * (growth^k - 1) / (growth - 1)`.

| # | Id | Name | Base cost | Base starlight/s | Growth |
|---|---|---|---|---|---|
| 1 | telescope | Brass Telescope | 15 | 0.2 | 1.12 |
| 2 | lens | Lens Array | 100 | 1.2 | 1.12 |
| 3 | prism | Prism Spectrograph | 700 | 7.5 | 1.12 |
| 4 | orrery | Clockwork Orrery | 5,000 | 47 | 1.125 |
| 5 | star-map | Star-Map Press | 36,000 | 290 | 1.125 |
| 6 | beacon | Signal Beacon | 250,000 | 1,800 | 1.13 |
| 7 | archive | Star Archive | 1,800,000 | 11,500 | 1.13 |
| 8 | aurora-coil | Aurora Coil | 13,000,000 | 72,000 | 1.135 |

An instrument is shown in Build once the previous one has been bought at least once (the Telescope
is always shown). Nothing is hidden behind a currency the player cannot reach.

## Upgrades (24)

Three per instrument. Unlock when the instrument's owned count reaches the threshold; cost is a
multiple of that instrument's base cost; effect multiplies that instrument's output (and, for the
Telescope, Gather).

| Tier | Owned required | Cost | Multiplier |
|---|---|---|---|
| 1 | 10 | 10 × base cost | ×2 |
| 2 | 25 | 100 × base cost | ×2 |
| 3 | 50 | 1,000 × base cost | ×3 |

A fully upgraded instrument is ×12. Names are in the content plan. With the Second Sight boon all
upgrade costs are ×0.75.

## Constellation charting (12)

Cost is paid on completion of the pattern. Each charted constellation gives +5% global starlight
(×1.5 with Atlas Ink, so +7.5%) and one lore entry. Charted constellations survive the Eclipse.

| # | Constellation | Stars | Cost (starlight) | Prerequisite |
|---|---|---|---|---|
| 1 | The Lyre | 5 | 60 | 2 Brass Telescopes |
| 2 | The Crown | 6 | 400 | 8 Brass Telescopes |
| 3 | The Key | 6 | 1,600 | 6 Lens Arrays |
| 4 | The Lantern | 6 | 6,000 | 5 Prism Spectrographs |
| 5 | The Whale | 7 | 24,000 | 5 Clockwork Orreries |
| 6 | The Harp | 7 | 100,000 | 12 Clockwork Orreries |
| 7 | The Fox | 7 | 400,000 | 8 Star-Map Presses |
| 8 | The Archer | 7 | 1,600,000 | 6 Signal Beacons |
| 9 | The Serpent | 8 | 6,500,000 | 12 Signal Beacons |
| 10 | The Ship | 8 | 26,000,000 | 8 Star Archives |
| 11 | The Tower | 9 | 100,000,000 | 5 Aurora Coils |
| 12 | The Owl | 10 | 400,000,000 | 10 Aurora Coils |

Total 86 stars. A full atlas gives +60% (+90% with Atlas Ink).

## Achievements (20)

Each unlocked achievement adds +1% to the additive part of the global multiplier (up to +20%).
The list is in the content plan. No achievement grants a currency, so no loop can pay for itself.

## Global multiplier (exact)

```
additive   = 1 + 0.05 * atlasInkFactor * constellationsCharted + 0.01 * achievementsUnlocked
boonGlobal = (corona ? 1.5 : 1) * (totality ? 2 : 1)
globalMult = additive * boonGlobal
starlightPerSecond = globalMult * sum(owned_i * baseSps_i * instrumentMult_i)
gatherValue        = globalMult * telescopeUpgradeMult   // base 1 per tap
```

## Eclipse and boons

`pendingShards = floor(sqrt(cycleStarlight / 1e9))`; available at 5 or more (cycle starlight at
least 2.5e10). Cycle starlight counts every starlight earned this cycle (taps, production, offline,
Comet), not the balance.

Boons are bought once each with shards and are permanent.

| # | Id | Name | Cost | Effect |
|---|---|---|---|---|
| 1 | dark-adapted | Dark-Adapted Eyes | 1 | Start each cycle with 1,000 starlight |
| 2 | brass-polish | Brass Polish | 2 | Brass Telescopes ×2 |
| 3 | clear-glass | Clear Glass | 3 | Instrument and charting costs ×0.95 |
| 4 | night-watch | Night Watch | 4 | Offline efficiency 50% to 75% |
| 5 | apprentice | The Apprentice's Bench | 5 | Start each cycle with 5 Brass Telescopes and 3 Lens Arrays |
| 6 | atlas-ink | Atlas Ink | 8 | Constellation bonus ×1.5 (+7.5% each) |
| 7 | long-vigil | Long Vigil | 10 | Offline efficiency 75% to 100% |
| 8 | second-sight | Second Sight | 12 | Upgrade costs ×0.75 |
| 9 | corona | Corona | 20 | All starlight ×1.5 |
| 10 | totality | Totality | 40 | All starlight ×2 |

Total 105 shards. After the last boon the Eclipse remains available (for achievements and
statistics); shards simply accumulate unspent.

## Offline

Cap 8 hours (28,800 s). Starlight gained = production at last save × min(elapsed, 28,800) ×
efficiency. Efficiency 50%, 75% (Night Watch), 100% (Long Vigil). Deterministic; the same inputs
always give the same result. Negative elapsed (clock went back) gives 0.

## Daily Comet

Reward `max(1000, 900 × productionPerSecond) × (1 + 0.1 × min(streak - 1, 4))`; every 7th streak day
+1 shard. Once per local date.

## Pacing targets (proven by the balance simulator in task 02)

Reference player: taps Gather twice a second for the first 10 minutes and once every two seconds
afterwards, checks the shop every 5 seconds, buys the best payback item it can afford, and charts a
constellation as soon as it can.

| Target | Value | Sketch result |
|---|---|---|
| First constellation charted | under 180 s | about 90 s |
| First Eclipse available (5 pending shards) | 2.5 to 4 h active | about 2.9 h |
| Longest gap between two purchases before the first Eclipse | at most 360 s | about 30 s |
| Cycle to 5 shards with Dark-Adapted Eyes + Brass Polish (3 shards, affordable after the first Eclipse) | at most 85% of the first | about 80% |
| Cycle to 5 shards with the four early boons (Dark-Adapted, Brass Polish, Clear Glass, Apprentice: 11 shards) | at most 85% of the first | about 77% |
| Cycle to 5 shards with those four plus Atlas Ink and Corona (39 shards) | at most 55% of the first | about 40% |
| All 12 constellations charted before the first Eclipse | at least 11 | 11 |

Pending shards at the same reference points: 8 at about 3.7 h, 10 at about 4.3 h, 15 at about 5.3 h
(first cycle). Full boon completion (105 shards) is a multi-week idle-session goal.

## Anti-exploit notes

- The clock is only used for offline gains and the Comet. Offline gain is capped at 8 hours and
  never negative. Setting the clock forward gives at most 8 hours at the current efficiency per
  resume (the save stores the last-seen time and updates it on every resume); this is accepted for
  a single-player offline game and recorded in open-questions.
- The Comet is keyed to the local date and recorded as claimed; moving the clock back never allows
  a second claim (`clock-went-back` is ignored).
- All values are clamped to 1e300 and `NaN` is rejected on load (save validation).
