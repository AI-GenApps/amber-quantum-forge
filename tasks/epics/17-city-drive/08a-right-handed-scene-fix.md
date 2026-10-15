---
epic: 17-city-drive
task: 08a-right-handed-scene-fix
status: completed
commit_scope: city-drive
depends_on: [17-city-drive/07-player-car-controls-camera]
estimate: S
owner: agent
---

# Render the scene right-handed (remove the mirrored world)

## Goal

Make the rendered world match the simulation's coordinates, so the city is
no longer drawn mirror-imaged. Do this before AI traffic (task 09) is built,
so right-hand traffic appears on the right.

## Context / Decisions

- **Finding from task 07** (`.agents/games/city-drive/open-questions.md` item 7,
  and `decisions-log.md`):
  - Rapier, and therefore the simulation, is **right-handed**. Babylon
    defaults to **left-handed**.
  - The whole scene is drawn mirrored against the map's compass description,
    and right-hand traffic would appear on the screen's left.
  - Task 07 hid this for steering only, by negating the steer in
    `toCarInput` (`apps-games/city-drive/src/input/types.ts`).
- **Decision (orchestrator, 2026-10-15):** set
  `scene.useRightHandedSystem = true` on every scene: the game, the garage
  preview if one exists, and every `NullEngine` test scene. Then remove the
  workarounds:
  - Delete the steer negation in `toCarInput`, so player right maps to the
    simulation's right turn. Update its doc comment and its tests.
  - Review every handedness or mirroring adjustment baked into
    `src/render/templates.ts` and `src/render/carModel.ts`, and any `scaling.z = -1`,
    `rotation.y += Math.PI`, or yaw offsets introduced to compensate. With a
    right-handed scene, Babylon's glTF loader no longer adds the
    `__root__` handedness conversion, so the baked transforms must be
    re-derived, not just deleted. Verify each with a test.
  - Re-check `ROAD_MODEL_YAW_OFFSET` in `road-sockets.ts`. Its offsets were
    tuned while the scene was mirrored, so they may now be wrong.
  - Check the camera maths: chase camera, look-at, and the occlusion ray.
- **Tests that prove the fix** (headless, no browser):
  1. With a right-handed scene, a mesh placed at simulation position
     (x, y, z) has world position (x, y, z). No axis flip.
  2. Project a point that is on the car's right in simulation terms (the
     car faces +Z, the point is at the car's simulation-right side) through
     the chase camera's view-projection matrix. It must land on the right
     half of the screen.
  3. Scripted "player steers right" input makes the car yaw toward its own
     right, and the projected screen-space heading moves right.
  4. Every road tile's rendered sockets line up with its connectivity: for
     each road model and rotation, the rendered mesh's road-surface bounding
     box touches the tile edges its sockets declare.
- **Budgets:** the task 06/07 budget test must still pass.

## Implementation Checklist

- [x] Set `useRightHandedSystem = true` on all scenes, including the tests'
      scene factory.
- [x] Remove the steer negation, and re-derive the template and car-model
      transforms and road yaw offsets.
- [x] Add tests 1–4 above, and update the affected existing tests (never by
      weakening assertions).
- [x] Close open question 7, and add a decisions-log entry.
- [x] Evidence README with before and after projected-point numbers.

## Files Touched

- `apps-games/city-drive/src/{render/**,input/types.ts,game/**,main.ts,scene.ts}`, `test/**`
- `apps-games/city-drive-core/src/city/road-sockets.ts` (only if the offsets change)
- `.agents/games/city-drive/{open-questions.md,decisions-log.md}`
- `.agents/resources/2026-10-15/city-drive-qa/08a/README.md`

## Acceptance Criteria

- No compensating steer negation remains, and tests 1–4 pass.
- All earlier City Drive tests and the budget tests pass.
- Open question 7 is marked resolved.

## Out of Scope

- Any visual restyle; anything for task 08's other human items.

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:typecheck`
- `bun run city-drive:build`

## Commit message

`fix(city-drive): render scene right-handed to match simulation [17-city-drive/08a]`
