---
epic: 17-city-drive
task: 10-mission-engine
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/09-ai-traffic]
estimate: L
owner: agent
---

# Mission engine: delivery, taxi, time trial, parking; star rating

## Goal

Build a data-driven mission system in core with 4 mission types, a state
machine, 1–3 star scoring, and coin payouts. Add a minimal in-world
presentation (markers, a route line, a basic HUD readout) so missions are
playable. Task 13 restyles the UI.

## Context / Decisions

- **Mission definition** (versioned JSON under
  `apps-games/city-drive-core/content/missions/`):

  ```jsonc
  { "schema_version": 1, "id": "d1-m01", "district": "district-1", "type": "delivery",
    "title": "…", "brief": "…",
    "start": { "lane_point": … },          // where the marker sits in free roam
    "params": { … type-specific … },
    "stars": { "1": …, "2": …, "3": … },   // thresholds (time s / damage / accuracy)
    "reward_coins": { "1": 50, "2": 80, "3": 120 } }
  ```

- **Types** (all positions are lane points or tile anchors validated against
  the map):
  - **delivery:** pick up at A, drop at B (or a chain of 2–3 drops) within a
    time limit. Each collision above an impulse threshold adds +1 damage.
    Stars come from remaining time, and the 3-star rating requires damage ≤ 1.
  - **taxi:** like delivery, plus a passenger comfort meter. Harsh
    acceleration, braking, or turns (thresholds on longitudinal and lateral g
    from the core car state) and collisions reduce comfort. Stars come from
    time and comfort.
  - **time_trial:** an ordered checkpoint list, each a trigger volume with a
    radius. Stars come from the finish time.
  - **parking:** reach a parking box and stop inside it, aligned within ±15°
    and at speed < 1 km/h, held for 1 s. The bay is flanked by static parked
    cars (colliders). Stars come from time and touches.
- **State machine:** `idle → briefing → active → (success | fail) → results`.
  Fail causes:
  - time out
  - damage limit
  - comfort 0
  - the player quits

  Missions pause with the game pause. Everything is pure and driven by the
  fixed step.
- **Triggers:** simple sphere and box checks against the car position in core;
  no physics sensors needed.
- **Routing:** the active objective exposes an A\* route (task 05) from the
  car's nearest lane point. The renderer draws it as a ground ribbon (a thin
  instanced arrow strip) plus a 3D marker beam at the objective.
- **Free-roam integration:**
  - In free roam, the mission start markers of the current district are shown.
  - Driving into one at < 15 km/h opens the briefing (a minimal DOM panel now).
  - Traffic keeps running during missions.
- **Results:** the `MissionResult` contains id, success, stars, time, damage,
  comfort, and coins. The economy (task 12) consumes it. Do not persist
  anything in this task.

## Implementation Checklist

- [ ] Mission schema types, parser, and validator (references to map anchors
      checked, star thresholds monotonic, rewards monotonic).
- [ ] State machine plus the four type evaluators, each with unit tests that
      use scripted car-state streams (no physics needed). Cover each
      success/fail path and each star boundary.
- [ ] One integration test per type: the real core sim with an autopilot
      driving the A\* route. Add a simple autopilot in `test/support/` that
      follows lane polylines with steering control. It must complete the
      sample mission with ≥ 1 star.
- [ ] Renderer: route ribbon, objective beam, start markers, and a minimal
      HUD text (timer, objective).
- [ ] Author 4 sample missions on `district-1` (one per type).

## Files Touched

- `apps-games/city-drive-core/{src/missions/**,content/missions/**,test/missions/**,test/support/autopilot.ts}`
- `apps-games/city-drive/src/{render/mission*.ts,ui/mission-debug/**}`, `test/**`

## Acceptance Criteria

- All the unit and integration tests pass. The autopilot completes all 4
  sample missions deterministically.
- The budget test still passes with the route ribbon and markers visible.

## Out of Scope

- Final mission content (task 11), coins and save (task 12), final UI (task 13).

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:typecheck`
- `bun run city-drive:build`

## Commit message

`feat(city-drive): add mission engine with four mission types [17-city-drive/10]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **Files Touched:** also includes `apps-games/city-drive-core/src/physics/**`. The damage and comfort inputs come from task 03's extended `Car.state()` and impulse queue; extend those only if something is missing. Contacts against **static buildings** count as collisions too.
- **Mission ids** use the scheme `d{n}-m{nn}` (for example `d1-m01`). Lane points are stored as `{ edgeId, s }` from task 05.
- **Files Touched:** add `.agents/resources/2026-10-15/city-drive-qa/10/README.md`.
