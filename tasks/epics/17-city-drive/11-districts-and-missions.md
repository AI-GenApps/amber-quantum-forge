---
epic: 17-city-drive
task: 11-districts-and-missions
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/10-mission-engine]
estimate: L
owner: agent
---

# Three districts, 24 validated missions, district unlocks

## Goal

Ship the v1 content: **3 districts × 8 missions = 24 missions**, each one
proven completable by the autopilot, with a smooth difficulty ramp and
star-based district unlocks.

## Context / Decisions

- **Districts** (each 12×12 to 16×16 tiles, each with its own map JSON and
  character):

  | District | Mix | Roads |
  |---|---|---|
  | `district-1` "Old Town" | suburban + small commercial | tight corners, low traffic (8) |
  | `district-2` "Harbor" | commercial + plazas | long straights, medium traffic (12) |
  | `district-3` "Downtown" | dense commercial | many intersections, high traffic (16) |

  The names are placeholders until the naming task; keep them neutral.
- **Districts are separate maps** loaded one at a time, not a single seamless
  city. This keeps budgets per district. Switching happens from the map screen
  (task 13).
- **Missions per district:** 2 of each type, ordered by difficulty.
  - Mission 1 of district 1 is the easiest: a short delivery, a generous time
    limit, and the route mostly straight.
  - Titles and briefs are original, short, and have a light personality (no
    generic "Mission 1").
- **Difficulty ramp:** define a scalar per mission with this formula and
  record it in mission metadata:

  difficulty = route length / time-limit ratio + intersection count + traffic density + parking tightness

  Within a district it is non-decreasing, allowing at most 1 local inversion.
  Each district's first mission is easier than the previous district's last
  mission.
- **Validation** (as Merge Relay's solver gate):
  - A `tool/validate-missions.ts` plus a Vitest suite runs the **autopilot**
    on every mission with traffic on (fixed seed).
  - Assert ≥ 1 star, and record the autopilot's time and stars as metrics in
    the mission JSON (`validation` block).
  - 3-star thresholds must be **stricter than the autopilot's result** for at
    least half of the missions, so that skilled humans beat the bot. They must
    never be impossible: the 3-star time must be ≥ 85% of the autopilot's best
    time.
  - Never hand-edit the metrics; only the tool writes them.
- **Unlocks:**
  - District 2 unlocks at 10 total stars.
  - District 3 unlocks at 24 total stars.
  - Within a district, all missions are visible in free roam once the district
    is unlocked. There are no per-mission locks.
  - Put this in `content/progression.json`, with a test that the thresholds
    are reachable with 2-star average play.
- **Budgets:** the task 06/09 budget test runs on all 3 districts at their
  traffic density.

## Implementation Checklist

- [ ] Author `district-2` and `district-3` maps; revise `district-1` if needed
      for 8 missions. All validate.
- [ ] Author 24 missions, replacing the 4 samples from task 10 or folding them
      in.
- [ ] Mission validation tool plus suite; write the metrics.
- [ ] Add `progression.json` and its tests.
- [ ] Budget test over the 3 districts.
- [ ] Print an ASCII render of each district and a mission table (id, type,
      title, difficulty, autopilot time, star thresholds) into the evidence
      README. Update `.agents/games/city-drive/product.md` with the content
      table.

## Files Touched

- `apps-games/city-drive-core/{content/**,tool/validate-missions.ts,test/content/**}`
- `apps-games/city-drive/test/render/**` (budget)
- `.agents/games/city-drive/product.md`, `.agents/resources/2026-10-15/city-drive-qa/11/README.md`

## Acceptance Criteria

- Exactly 24 missions, 8 per district, 2 per type per district. Every one is
  autopilot-proven with ≥ 1 star and has stored metrics.
- The difficulty ramp rules hold (tested).
- The budget test passes for all 3 districts.
- The validation tool is deterministic: running it twice gives no diff.

## Out of Scope

- Coins, save, garage, final UI.

## Verification Commands

- `bun run city-drive:test`
- `bun apps-games/city-drive-core/tool/validate-missions.ts --check` (or the equivalent; fails if the stored metrics are stale)

## Commit message

`feat(city-drive): add three districts and 24 validated missions [17-city-drive/11]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **Difficulty is a function in core:** `missionDifficulty()`, with its own unit test. Each term is normalized to 0..1 against fixed maxima:

  | Term | Normalized against | Weight |
  |---|---|---|
  | route-length / time-limit ratio | 1.0 | 0.4 |
  | intersections on the route | 12 | 0.25 |
  | traffic agents | 16 | 0.2 |
  | parking tightness (bay margin) | 0.2 m (gives 1.0) to 1.5 m (gives 0) | 0.15 |

  Missions without parking get 0 for that term. The weights live in `content/progression.json`.
- **Mission ids:** `d{1..3}-m{01..08}`.
- **Tool output:** the validation tool writes canonical JSON (2-space `JSON.stringify` plus a trailing newline) into `content/`, which Biome excludes.
