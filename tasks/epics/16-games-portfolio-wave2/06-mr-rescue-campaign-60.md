---
epic: 16-games-portfolio-wave2
task: 06-mr-rescue-campaign-60
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/05-mr-solo-v1-scope]
estimate: L
owner: agent
---

# Merge Relay: bounded solver and a 60-board, 6-chapter rescue campaign

## Goal

Grow Rescue from 5 boards to **60 boards in 6 chapters of 10**, each
proven winnable by a deterministic solver, with a smooth difficulty ramp
and chapter progression saved locally.

## Context / Decisions

- User decision: 60 boards, 6 chapters.
- Existing pieces (read them first): `packages/merge_rules/lib/src/merge_rescue_generator.dart`
  (`MergeRescueGenerator`, trace algorithm `merge-rescue-trace-v1`),
  `merge_rescue_content.dart` (`MergeRescueDifficulty`, provenance),
  and `apps-native/games/merge_relay/content/rescue_boards.json` (5 boards with
  `objective`, `target_score`, a `seed`/`rng_state` for deterministic spawns,
  and a 3-move budget in play).
- **Solver** (new, pure Dart, in `merge_rules`): because spawns are
  deterministic from `rng_state`, a depth-bounded search over the four
  directions (≤ the board's move budget; 4^N states, with N ≤ 6 kept cheap)
  decides exactly whether the objective is reachable. It returns the
  minimal winning move list and the count of winning lines. Add a hard cap
  on explored nodes and fail loudly if the cap is hit.
- **Ramp**: chapter N allows a move budget of 3 + ⌊(N−1)/2⌋ (3,3,4,4,5,5).
  Difficulty inside a chapter rises by solver metrics: fewer winning lines
  and higher target score. The **first board of chapter 1 must be solvable
  in one obvious move** (onboarding). Record the ramp formula in
  `rescue_boards.json` metadata.
- Content stays generated plus reviewed. The agent writes a small
  generation script (`packages/merge_rules/tool/generate_rescue_campaign.dart`)
  that seeds the generator, filters by solver metrics, and writes the JSON.
  Titles and subtitles are original, short, and non-generic. They follow
  one theme per chapter (the theme names are placeholders until the art
  task; keep them neutral, e.g. "Harbor", "Orchard").
- Parity: `bun run games:parity` compares the Dart and TypeScript rules. If
  new content or fields break parity, fix the cause and **never edit
  fixtures to make parity pass**; if it can't be fixed within scope,
  return blocked.
- Progress: chapter N+1 unlocks after clearing 7 of chapter N's 10 boards.
  Store the best result per board in the existing local save (add a
  versioned migration so existing saves keep their cleared boards).

## Implementation Checklist

- [ ] Add a solver in `merge_rules` with unit tests (known-winnable,
      known-unwinnable, and node-cap cases).
- [ ] Add the generation tool, then generate and review 60 boards, reading
      titles and objectives for quality.
- [ ] Update `content/rescue_boards.json` (60 boards, `chapter`,
      `index_in_chapter`, and solver metrics per board), and update the
      content validator and schema if `games:content:validate` needs the
      new fields.
- [ ] Add a campaign test: every board is solved by the solver within budget,
      replaying the solver's line through the real `MergeGame`/session
      yields "cleared", IDs are unique, and metrics are non-decreasing in
      difficulty within each chapter (allowing ≤2 local inversions per chapter).
- [ ] Add chapter progression and unlock logic, plus the save migration
      with tests. Keep the UI minimal (a list); task 11 restyles it.
- [ ] Update `.agents/games/merge-relay/product.md`.

## Files Touched

- `apps-native/games/packages/merge_rules/{lib/src/merge_rescue_solver.dart,tool/generate_rescue_campaign.dart,test/**}`
- `apps-native/games/merge_relay/content/rescue_boards.json`
- `apps-native/games/merge_relay/lib/src/{merge_relay_content*.dart,merge_relay_save_state.dart,merge_relay_game_persistence.dart,...}`
- `apps-native/games/merge_relay/test/**`, `scripts/games/content.ts` (only if the schema requires it)

## Acceptance Criteria

- There are exactly 60 boards in 6 chapters of 10, and all are solver-proven
  and replay-proven in tests.
- Board 1 of chapter 1 has a winning first move and ≥2 winning lines.
- An old 5-board save migrates, and previously cleared boards stay cleared.
- `games:parity` passes, and no fixture file was edited to make it pass.
- The rules package and app suites pass; the app test count is ≥ task 05's.

## Verification Commands

- `cd apps-native/games/packages/merge_rules && dart analyze && dart test`
- `bun run games:parity`
- `bun run games:content:validate`
- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run games:validate:strict`

## Out of Scope

- Chapter-map visuals (task 11). Daily or Endless rule changes. Server content.

## Commit message

`feat(merge-relay): add rescue solver and 60-board six-chapter campaign [16-games-portfolio-wave2/06]`
