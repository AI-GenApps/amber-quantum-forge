---
epic: 17-city-drive
task: 12-economy-garage-save
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/11-districts-and-missions]
estimate: M
owner: agent
---

# Economy: coins, car roster and unlocks, versioned local save

## Goal

Close the loop: missions pay coins, coins unlock cars with different
handling, and progress persists locally with versioned migrations. There is
no real money.

## Context / Decisions

- **Coins:**
  - A mission pays `reward_coins[stars]` on its **first** completion at that
    star level.
  - Replays pay only the **difference** to the best-ever stars, plus a small
    replay bonus of 10% of the 1-star reward.
  - Free-roam driving pays nothing (no grinding exploits).

  All of this is pure logic in `@city-drive/core/src/economy/`.
- **Car roster:** 6 cars from the curated Kenney set (task 04) in
  `content/cars.json`.
  - Fields: id, model id, display name, price, `CarSpec` overrides (mass,
    engine, grip, steer).
  - The starter car is free.
  - Prices are tuned so that a player averaging 2 stars can afford about 1 new
    car per district. Prove this with a simulation test over the 24 missions'
    payouts. The total coins from 3-starring everything must exceed the total
    car prices by ≥ 15%.
  - Handling differences come from data only. Every car must pass the task 03
    sanity tests (upright under full lock, stops without tunnelling), so run
    that test suite parameterized over the roster.
- **Save** (`src/save/` in core, pure; storage is injected):
  - `SaveData v1` holds: coins, owned cars, selected car, best stars and best
    time per mission, settings (audio and haptics toggles, control layout,
    graphics quality), onboarding flags, and a `schema_version`.
  - A `SaveStore` interface with an in-memory implementation in core.
  - The app provides `PreferencesSaveStore`, which uses Capacitor Preferences
    when running natively and `localStorage` on the web. Add
    `@capacitor/preferences` now (exact pin); `Capacitor.isNativePlatform()`
    decides which to use.
  - Writes are debounced and atomic (write to a temp key, then swap).
  - A corrupt save restores to the last good backup key, then to defaults.
    Never crash, and always surface a non-blocking notice.
  - A migration framework: `migrations[n]` maps vN to vN+1, tested with a
    fixture for v1. Add a synthetic v0 → v1 test to prove the framework.
- **Anti-tamper:** none in v1 (offline, no real money). Record this in
  `economy.md`.

## Implementation Checklist

- [ ] Economy rules and tests (first-clear, upgrade-diff, replay bonus, no
      negative balances, purchase rules).
- [ ] `cars.json` with the roster, plus the parameterized handling sanity
      suite.
- [ ] Affordability simulation test.
- [ ] Save schema, store interface, in-memory store, migrations, and
      corruption recovery, each tested.
- [ ] App `PreferencesSaveStore` plus tests with mocked Capacitor and a
      happy-dom `localStorage`.
- [ ] Wire this into the app session: mission results credit coins and save;
      the selected car is used on spawn.
- [ ] Update `.agents/games/city-drive/economy.md` with the final prices and
      payouts table.

## Files Touched

- `apps-games/city-drive-core/{src/economy/**,src/save/**,content/cars.json,test/**}`
- `apps-games/city-drive/{src/save/**,src/game/session*.ts,package.json,test/**}`, `bun.lock`
- `.agents/games/city-drive/economy.md`

## Acceptance Criteria

- All tests pass, including the parameterized handling suite over all 6 cars
  and the affordability simulation.
- Save round-trip, migration, and corruption recovery are tested.
- No network calls anywhere (`grep -rn "fetch(" apps-games/city-drive/src`
  only shows local asset loading).

## Out of Scope

- Garage UI and screens (task 13), cloud save, IAP, ads.

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:typecheck`

## Commit message

`feat(city-drive): add coin economy, car roster and versioned save [17-city-drive/12]`
