---
epic: 16-games-portfolio-wave2
task: 12-mr-onboarding-and-how-to-play
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/11-mr-screens-restyle]
estimate: M
owner: agent
---

# Merge Relay: first-run onboarding and how-to-play

## Goal

A new player understands the game within ~20 seconds by playing, not
reading: an interactive first handoff on board 1 of chapter 1 with a
gesture hint, a merge, and a goal reached. After that, a how-to-play page
is always reachable from Settings.

## Context / Decisions

- Existing: `lib/src/merge_relay_tutorial.dart` ("First handoff", 2 steps,
  skip and replay). Keep its versioning rule: the tutorial version is saved
  separately from game saves, and an existing save never implies the
  tutorial is complete.
- Flow: splash (logo slot) → a 1-screen welcome (hero tiles, "Slide to
  merge matching tiles") → the tutorial board with an animated swipe-hand
  hint → the merge moment gets extra juice → "Goal reached" → the chapter
  map with board 2 highlighted. Skip is available at every step.
- The how-to-play page has 3 short illustrated cards (swipe, merge, goals
  and move budget) using code-drawn mini boards. Daily and Endless are
  explained in one line each.
- There are no account, network, or notification prompts anywhere in
  onboarding (solo v1).

## Implementation Checklist

- [ ] Add the welcome screen and splash-to-welcome routing for a fresh
      install only.
- [ ] Restyle the tutorial with the hand hint and reduced-motion
      alternative.
- [ ] Add a how-to-play page and an entry in Settings.
- [ ] Add tests: a fresh install walks welcome → tutorial → chapter map;
      skip at each step; replay from Settings; an existing save doesn't mark
      the tutorial done; reduced motion hides the hand animation but keeps
      the text.
- [ ] Add goldens `welcome.png`, `tutorial_hint.png`, and `how_to_play.png`,
      copy them to `.agents/resources/2026-09-25/games-wave2-qa/12/`, and
      VIEW them.

## Files Touched

- `apps-native/games/merge_relay/lib/src/{merge_relay_tutorial,merge_relay_app}.dart`
- `apps-native/games/merge_relay/lib/src/screens/{welcome,how_to_play}*.dart` (new)
- `apps-native/games/merge_relay/test/**`

## Acceptance Criteria

- The flow tests pass, and the goldens look finished (no stock widgets, no
  empty bands > 25% of the screen height).
- The test count is ≥ task 11's.

## Verification Commands

- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- Device check: NOT RUN.

## Out of Scope

- Final logo art (task 22).

## Commit message

`feat(merge-relay): add welcome, interactive first board, and how-to-play [16-games-portfolio-wave2/12]`
