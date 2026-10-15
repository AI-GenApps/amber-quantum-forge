---
epic: 17-city-drive
task: 00-knowledge-base-and-decisions
status: pending
commit_scope: city-drive
depends_on: []
estimate: S
owner: agent
---

# City Drive: knowledge base, decisions, competitor notes

## Goal

Create the game's knowledge base at `.agents/games/city-drive/`, the single
source of truth for what the game is and why, before any code exists.

## Context / Decisions

- Template: copy the file set and tone of `.agents/games/merge-relay/` and
  `.agents/games/ludo-vortex/`: `README.md` (quick facts table),
  `product.md`, `economy.md`, `store-listing.md`, `assets-index.md`,
  `decisions-log.md`, `open-questions.md`.
- All user and technical decisions are in `tasks/epics/17-city-drive/STATUS.md`.
  Copy them as dated entries (2026-10-15) into `decisions-log.md`, each with
  its rationale.
- The research findings below (gathered 2026-10-15) must be recorded in
  `decisions-log.md` and `.agents/resources/2026-10-15/city-drive-qa/00/README.md`
  with their source URLs:
  - **Competitors (Google Play tiers, 2026-10-15):**

    | Game | Installs | Rating | Link |
    |---|---|---|---|
    | Dr. Driving | 500M+ | 4.3 | play.google.com/store/apps/details?id=com.ansangha.drdriving |
    | Extreme Car Driving Simulator | 500M+ | 4.3 | id=com.aim.racing |
    | Car Parking Multiplayer | 100M+ | 4.5 | id=com.olzhas.carparking.multyplayer |
    | Drive Zone | 100M+ | 4.5 | id=com.drivezone.car.race.game |
    | Taxi Car Simulator: EVO | 10M+ | 4.5 | id=com.ovilex.taxisim2019 |

    All of them ship ads and IAP.
  - **CrazyGames driving-genre data:** about 8.7 minutes average playtime and
    about 5.7% day-1 retention (docs.crazygames.com/resources/monetizing-driving/).
  - **What drives retention:** missions/career, car unlocks, customization,
    daily challenges, login streaks.
  - **Babylon/Havok has no native vehicle controller** (the 9.31.0 tarball has no
    vehicle code under `Physics/`). Rapier ships `DynamicRayCastVehicleController`
    (rapier.rs/docs/user_guides/javascript/vehicle_controller) and documents
    cross-platform determinism (rapier.rs/docs/user_guides/javascript/determinism).
  - **Android WebView has no WebGPU** (caniuse webgpu `android` column), so WebGL2
    is the baseline.
  - **Kenney City Kit / Car Kit are CC0** (kenney.nl). **Quaternius moved to the
    non-CC0 "Quaternius Asset License" on 2026-08-28** (quaternius.com/license.html),
    so it is excluded.
  - **Capacitor 8** requires Node 22+, minSdk 24 / targetSdk 36, and iOS 15+.
- `product.md` must describe the v1 loop precisely:
  - free roam in a small city with mission markers;
  - 4 mission types (delivery, taxi, time trial, parking);
  - 1–3 stars per mission;
  - 3 districts that unlock by total stars;
  - coins from missions unlock cars;
  - no ads, IAP, accounts, or network;
  - landscape orientation;
  - touch and keyboard controls.

  Mark numbers that later tasks will finalize (car prices, star thresholds) as
  "TBD (task NN)".
- `economy.md`: v1 has only a soft currency (coins), no real money. Record the
  deferred v1.1+ ideas (rewarded ads for payout multipliers, an ad-free IAP)
  as **out of scope** with the CrazyGames guidance as rationale.
- `open-questions.md`: public name (task 19), icon direction (task 19), web
  hosting Vercel project (task 22), and real-device performance on low-end
  Android (task 22).
- Add a City Drive row to any portfolio index under `.agents/games/` if one
  exists (check for an index file first; do not create one if none exists).

## Implementation Checklist

- [ ] Create the 7 knowledge-base files under `.agents/games/city-drive/`.
- [ ] Record every decision from STATUS.md plus the research facts, with URLs,
      in `decisions-log.md`.
- [ ] Write `.agents/resources/2026-10-15/city-drive-qa/00/README.md` with the
      competitor table and research sources.
- [ ] Add epic 17 to `tasks/STATUS.md` as `- [ ] 17 — City Drive (Babylon.js + Capacitor 3D city-driving game)`.

## Files Touched

- `.agents/games/city-drive/*` (new)
- `.agents/resources/2026-10-15/city-drive-qa/00/README.md` (new)
- `tasks/STATUS.md`

## Acceptance Criteria

- All 7 files exist and are non-trivial. `README.md` has a quick-facts table
  covering: working title, registry id `city_drive`, the planned bundle id
  `app.w3dev.citydrive`, code paths, epic, platforms, genre, monetization
  (none), and fonts.
- Every user decision in STATUS.md appears in `decisions-log.md`.
- No code changes.

## Out of Scope

- Any code, assets, or naming research.

## Verification Commands

- `ls .agents/games/city-drive/ | wc -l` (expect 7)
- `bun run check:doc-paths`

## Commit message

`docs(city-drive): add knowledge base and decision log [17-city-drive/00]`
