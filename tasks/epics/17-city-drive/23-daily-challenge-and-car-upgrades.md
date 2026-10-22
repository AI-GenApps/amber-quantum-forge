---
epic: 17-city-drive
task: 23-daily-challenge-and-car-upgrades
status: completed
commit_scope: city-drive
depends_on: [17-city-drive/11-districts-and-missions, 17-city-drive/12-economy-garage-save, 17-city-drive/13-ui-screens-and-hud]
estimate: L
owner: agent
---

# Daily challenge and car upgrades (post-v1)

## Goal

Give players a reason to come back tomorrow (a daily challenge with a streak)
and a use for coins after every car is bought (per-car upgrades). Both stay
fully offline and local: no accounts, no ads, no IAP, no network.

This is post-v1 work. It does **not** block task 22 (the human device
checkpoint). If task 22 is still open, ship this in the version after the first
store build. Do not bump `release.version` here.

## Context / Decisions

Existing code this builds on:

- `apps-games/city-drive-core/src/economy/payout.ts`: `missionPayout` is pure.
- `apps-games/city-drive-core/src/economy/roster.ts`: cars are data
  (`SpecOverrides` over `BASELINE_CAR`), `OVERRIDABLE_FIELDS` is the allowed set.
- `apps-games/city-drive-core/src/save/`: `SAVE_SCHEMA_VERSION = 1`, `MIGRATIONS`
  is empty, `migrateSave` walks one version at a time, `validate.ts` checks shape.
- `apps-games/city-drive-core/src/missions/`: catalog, evaluators, stars.
- UI: `apps-games/city-drive/src/ui/screens/{Home,Garage,Results}.tsx`.

### Daily challenge

- **One daily mission per UTC date.** The date string (`YYYY-MM-DD`) is hashed
  into a seed. The seed picks one mission from the missions the player has
  unlocked (never a locked district). Same date plus same unlocked set gives the
  same mission, so it is testable and replayable.
- **Variant, not new content.** The daily reuses a catalog mission with a
  seeded modifier: a tighter par time (time trials and deliveries) and a traffic
  density step, both bounded so the mission stays passable. No new mission
  files and no new map content.
- **Reward:** a flat coin payout by stars (suggested 1/2/3 stars = 40/80/150
  coins; tune in the affordability test), paid once per date. A failed run pays
  nothing and can be retried the same day until a star is earned.
- **Streak:** consecutive days with a claimed daily. The bonus is capped
  (suggested +10% per streak day up to +50%). Missing a day resets to 1. No
  punishment beyond the reset.
- **Clock handling:** the device clock is the only clock. Store
  `last_claim_date` and refuse to pay a date that is not strictly after it, so
  setting the clock backwards cannot re-claim. Setting it forward is accepted;
  record in `economy.md` that there is no anti-tamper (offline, no real money),
  consistent with task 12.
- **No network.** The daily is derived locally. The no-data audit
  (`test/release/noData.test.ts`) must still pass with no new allowances.

### Car upgrades

- **Three upgrade tracks per car:** `power` (engine force and top speed),
  `grip` (friction slip and side stiffness), `brakes` (brake force). Levels 0 to 3.
- **Applied as bounded multipliers** over the car's roster `SpecOverrides`,
  using only fields already in `OVERRIDABLE_FIELDS`. Per-level gains are small
  (suggested +6% per level) and capped so no field leaves the range the task 03
  sanity tests accept.
- **Cost curve** per level, scaled by the car's price (suggested 15%, 25%, 40%
  of price). Upgrades are a coin sink: they must not make the unlock path
  unaffordable.
- **Affordability rule:** extend the task 12 simulation. Total coins from
  3-starring all 24 missions must still exceed total car prices by at least 15%
  with upgrades excluded, and the full upgrade bill for all cars must exceed
  what a player can earn in the first two weeks of daily play, so upgrades stay
  a long-term goal.
- **Physics safety:** the task 03 handling sanity suite (upright under full
  lock, stops without tunnelling) must run for every car at **max upgrades on
  every track**, not only stock.

### Save

- Bump `SAVE_SCHEMA_VERSION` to 2 and add `MIGRATIONS[1]`:
  - add `upgrades: Record<carId, { power: number; grip: number; brakes: number }>`
    (empty for every owned car),
  - add `daily: { last_claim_date: string | null; streak: number }`.
- Update `validate.ts` and `defaults.ts`; reject unknown car ids and levels
  outside 0 to 3. Keep the v1 fixture test and add a v1 to v2 migration fixture.
- A save from a newer app still errors, never guesses (existing behaviour).

## Implementation Checklist

- [x] Pure daily module in core (`economy/daily.ts`): date to seed, mission
      pick, variant modifiers, reward, streak, clock-backwards guard. Unit
      tests including month/year boundaries and determinism.
- [x] Pure upgrade module in core (`economy/upgrades.ts`): levels, costs,
      purchase rules (no negative balance, no level above 3, car must be
      owned), spec application with caps. Unit tests.
- [x] Save schema v2, `MIGRATIONS[1]`, validation, defaults, and migration
      fixtures. Corrupt-save recovery still works.
- [x] Extend the affordability simulation and the parameterized handling
      sanity suite (max upgrades) as described above.
- [x] Session wiring in `apps-games/city-drive/src/game/session.ts`: the
      selected car's upgraded spec is used on spawn; a daily result credits
      coins and updates the streak, then saves.
- [x] UI: Home daily card (mission, today's reward, streak, "claimed" state),
      Garage upgrade panel (three tracks, level, cost, buy), Results shows the
      daily payout. DOM overlay and Preact only, bundled fonts, no new network.
      Cover with Vitest and happy-dom.
- [x] Docs: update `docs-internal/gaming/city-drive-*` economy notes and the
      knowledge base; record the no-anti-tamper decision.
- [x] Add an owner-human checkpoint note for feel and balance (see below).

> Verified after installing the workspace dependencies: core 601 tests (including the 108-test
> max-upgrade handling suite) and app 707 tests pass, `bun run check` and both City Drive typechecks
> are clean, and the no-data audit passes unchanged. The minimap drawing-rate test is time-dependent:
> it fails in some full runs on HEAD and on this change alike, and passes alone. Visual, feel and
> device checks are NOT RUN (human checkpoint below). See
> `.agents/resources/2026-10-15/city-drive-qa/23/README.md`.

## Verification

```bash
bun run check
bun run city-drive:test
bun run typecheck
```

- `test/release/noData.test.ts` passes unchanged, so no new network, analytics,
  or permissions.
- The Android manifest still declares only `INTERNET`.
- Max-upgrade handling suite passes for every roster car.
- No browser QA, no screenshots (epic rule). Visual and feel judgements are
  reported **NOT RUN**.

## Human checkpoint (not part of this task's completion)

On a phone: does a max-upgraded car still feel controllable, and does a
streak/daily feel fair? Record the result in the epic STATUS notes. Numbers
above are suggestions; tune after this check.

## Out of scope

Ghost cars, leaderboards, cloud save, ads or rewarded doubling, car cosmetics,
weather, new maps and new mission types. These are separate tasks.

## Acceptance

All checklist items done, the three commands above pass, the save migrates from
v1 without data loss, and no new data collection exists.
