---
epic: 21-web-cloud-observatory
task: 03-progression-and-save
status: in-progress
commit_scope: cloud-observatory
depends_on: [21-web-cloud-observatory/02-content]
estimate: L
owner: agent
---

# Progression, economy, daily mode, versioned save

## Goal

Add everything that makes the game persistent and long-lived: achievements, lore unlocks,
statistics, the Wandering Comet daily mode, the profile type, and a versioned local save on the
kit save store with migration, recovery and offline-resume tests. After this task the app has a
`GameSession` controller (no UI yet) that loads a profile, applies offline progress, runs the clock,
autosaves, and exposes every action the screens in task 04 need.

## Context / Decisions

- Rules and numbers: `.agents/games/cloud-observatory/product.md` (Comet, offline, autosave) and
  `economy.md`. Do not change numbers here; if the owner QA later needs a change, edit the docs in
  the same commit.
- Core stays pure: the Comet generator takes `{ next(): number }` (the kit `Rng` fits), streak
  steps come in as the kit's `StreakStep` string, and time is a parameter. The app layer owns the
  clock (`now: () => number`), the date key (kit `localDateKey`) and storage (kit save store).
- Save: `createSaveStore(adapter, { key: "cloud-observatory.profile", version, defaults, migrations,
  parse })`. Version 1 is the first shipping version; the migration machinery is exercised with a
  committed golden fixture and a synthetic v1 to v2 chain in tests so the first real migration
  needs no new infrastructure. Corrupt, unreadable or future-version data is backed up by the kit
  and replaced with defaults; the player sees a one-time "your save could not be read" notice.
- Settings (sound, music, haptics, reduced motion, high contrast) use the kit settings store with
  game id `cloud-observatory`; they are not part of the profile.
- Achievement bonuses and the global multiplier use the counts defined in economy.md (+1% each).

## Implementation Checklist

Core (`apps-games/cloud-observatory-core/src/`):

- [x] `progression.ts`: `Stats` type (taps, flawless charts, charts, comets claimed, longest
      streak, best starlight per second, offline seconds collected, full offline collects, active
      seconds, eclipses, shards spent) and `updateStats(stats, event)`.
- [x] `achievement-eval.ts`: `evaluateAchievements(profile, catalog)` returns the ids newly satisfied
      (never re-grants); all 20 conditions from the content plan implemented, including `steady-hand`
      (flawless chart), `long-sleep` (a collect that hit the 8 hour cap), `comet-chaser` (3
      different dates), `seven-nights`, `keeper-of-tales` (all 30 lore unlocked).
- [x] `lore-unlock.ts`: `unlockedLore(profile, catalog)` derives entries from owned
      instruments (first purchase), charted constellations and boons; `newLoreSince(before, after)`;
      chapter progress (`chapterProgress`), `isChapterStarted`.
- [x] `comet.ts`: `generateComet(rng)` (6 stars, margin 100, spacing at least 140, tracing order
      fixed; retry with the same stream until valid, bounded loop), `cometReward(production,
      streak)`, `claimComet(profile, dateKey, step)` returning `{ ok, reward, shards, streak }` or
      `{ ok: false, reason: "locked" | "already-claimed" | "clock-went-back" }`; streak rules:
      first claim 1, next-day +1, gap resets to 1, same-day refused, clock-went-back refused and the
      streak preserved; every 7th streak day awards +1 shard.
- [x] `profile.ts`: `Profile` (game state + stats + `cometLastKey`, `cometStreak`, `cometDays`,
      `loreSeen`, `tutorial` flags, `lastSeenMs`, `createdMs`, `eclipseIntroSeen`), `createProfile`,
      `sanitizeProfile` (rejects `NaN`, negatives, unknown ids; clamps to 1e300),
      `PROFILE_VERSION = 1`.
- [x] `session-rules.ts`: `resume(profile, nowMs, catalog)` computes offline progress from
      `lastSeenMs` (negative or `NaN` elapsed is 0; returns the Welcome Back summary data) and
      `markSeen(profile, nowMs)`.

App (`apps-games/cloud-observatory/src/`):

- [x] `save/profile-store.ts`: `createProfileStore(adapter)` wrapping the kit save store, with
      `parse` = `sanitizeProfile`, `defaults` = `createProfile`, and the migrations table
      (empty for v1, typed for future steps).
- [x] `save/autosave.ts`: `createAutosave({ store, getProfile, schedule })` saving every 10 s of
      play, after every purchase, chart, Eclipse, Comet claim and on the lifecycle pause event
      (injected `schedule` and `onPause`, so tests drive it without timers).
- [x] `session/game-session.ts`: `createGameSession({ store, settings, clock, rng, catalog })`
      with `load()`, `resume()` (offline summary), `tick(dtSeconds)`, `dispatch(action)` over
      the core reducer, `startChart/tapStar/finishChart`, `claimComet()`, `buyBoon()`, `eclipse()`,
      `subscribe(listener)`, `snapshot()`; it applies achievements and lore after every action and
      returns the new unlocks as toast events.
- [x] `session/clock.ts`: `createClock` with an injected `now()` and a `localDateKey`, plus a fake
      clock for tests.

Tests (all headless; fake clocks and memory adapters, no real timers):

- [x] Core `achievement-eval.test.ts`: one test per achievement id (20) that builds the minimal
      profile satisfying it, asserts it unlocks exactly once, and asserts the neighbour state
      one step short does not unlock it.
- [x] Core `lore-unlock.test.ts`: every trigger unlocks its entry; all 30 reachable; order stable;
      `newLoreSince` reports exactly the new entries; chapter progress counts.
- [x] Core `comet.test.ts`: same seed gives the same pattern (golden for three fixed seeds);
      1,000 different seeds all satisfy margin and spacing; reward numbers for streaks 1 to 7,
      minimum 1,000; streak transitions for first, next-day, gap, same-day, clock-went-back; the
      7th-day shard; locked before the first constellation.
- [x] Core `profile.test.ts`: sanitize accepts a golden profile, rejects each corruption class
      (NaN, negative, wrong type, unknown id, oversized), JSON round trip, stable key order.
- [x] Core `resume.test.ts`: offline cases (1 minute, 3 hours, exactly 8 hours, 30 hours capped,
      clock back, equal timestamps, NaN), efficiency per boon, summary values match
      `applyOffline`, `long-sleep` unlock on a capped collect.
- [x] App `save/profile-store.test.ts`: fresh status; save then load round trip;
      `test/fixtures/profile-v1.json` golden loads as `loaded` and stays byte-identical after a
      load/save cycle; a synthetic registry with a v1 to v2 to v3 chain migrates and reports
      `migrated`; corrupt JSON, bad envelope, future version and failing migration each yield
      `recovered` with the right reason and a backup; `reset()` returns defaults.
- [x] App `save/autosave.test.ts`: saves on the 10 s tick, on each trigger, coalesces bursts, saves
      on pause, never writes during a failed load recovery loop.
- [x] App `session/game-session.test.ts`: scripted sessions through the controller (new game, tap,
      buy, upgrade, chart the Lyre, Comet claim, cross a date boundary, Eclipse) assert profile
      values, toast events (achievement, lore, chapter), and save contents at each step.
- [x] Update `.agents/games/cloud-observatory/product.md` if any resume or Comet detail was
      refined, and `decisions-log.md` with the save version.

## Files Touched

- `apps-games/cloud-observatory-core/src/{progression,achievement-eval,lore-unlock,comet,profile,session-rules,index}.ts`
- `apps-games/cloud-observatory-core/test/*.test.ts`
- `apps-games/cloud-observatory/src/save/*.ts`, `src/session/*.ts`
- `apps-games/cloud-observatory/test/save/*.test.ts`, `test/session/*.test.ts`,
  `test/fixtures/profile-v1.json`
- `.agents/games/cloud-observatory/{product,decisions-log}.md` if refined
- `tasks/epics/21-web-cloud-observatory/STATUS.md` (tick task 03)

## Acceptance Criteria

- All 20 achievements have a passing unlock and a passing near-miss test.
- All 30 lore entries unlock from their triggers in a session test.
- The Comet is deterministic per date key and seed, valid for 1,000 seeds, and cannot be claimed
  twice or after a clock rollback.
- Resume handles every offline edge case in the checklist and never produces `NaN`, negative or
  over-cap gains.
- The golden v1 profile fixture loads unchanged; the synthetic migration chain, corrupt data,
  future version and failed migration paths are covered with the kit's recovery reasons.
- Autosave fires on every listed trigger without timers in tests.
- The core architecture test stays green (no `window`, `document`, `Date.now`, `Math.random`).
- No network or storage API is called outside the kit adapters.

## Verification Commands

- `bun run --filter '@web-games/cloud-observatory*' typecheck`
- `bun run --filter '@web-games/cloud-observatory*' test`
- `bun run --filter '@web-games/cloud-observatory' build`
- `bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core`

## Out of Scope

- Screens, widgets, toasts rendering, onboarding UI (tasks 04 and 05).
- Audio, haptics, art, Capacitor projects.
- Cloud save, accounts, leaderboards, notifications (not in v1).
- Changing the kit, dependencies or other games.

## Commit message

`feat(cloud-observatory): add progression, daily comet and versioned save [21-web-cloud-observatory/03]`
