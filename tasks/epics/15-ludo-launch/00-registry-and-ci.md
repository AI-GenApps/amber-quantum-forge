---
epic: 15-ludo-launch
task: 00-registry-and-ci
status: pending
commit_scope: gaming
depends_on: [13-gaming-portfolio-preparation/01-registry, 13-gaming-portfolio-preparation/02-tooling]
estimate: L
---

<!-- Verified: tasks/epics/13-gaming-portfolio-preparation/STATUS.md reports
     Status: completed and both task 01 (registry) and task 02 (tooling) as
     [x], so this dependency is satisfied and kept as-is. -->

# Register `ludo` as the sixth game and wire tooling/CI

## Goal

Make `ludo` a first-class entry in the TypeScript game registry, the Flutter
Pub workspace, and every CI allowlist, without touching the frozen Unity
project except to add a superseding pointer. This is pure plumbing — no
gameplay code — so every later task can assume the registry, workspace, and
CI already know about `ludo`.

## Context/Decisions

- `apps-native/unity/ludo/` is a separate, earlier 3D effort (see
  `docs-internal/gaming/ludo-implementation-plan.md`). It stays frozen and
  untouched; this task only adds a short "superseded by" note pointing at the
  new Flutter effort. Do not delete, rewrite, or reformat that plan or
  `docs-internal/gaming/ludo-mobile-ui-plan.md`.
- The five-game registry lives in `scripts/games/registry-types.ts`
  (`GameId` union) and `scripts/games/registry-games.ts` (`GAME_REGISTRY`
  array). The `GAME_REGISTRY.length !== 5` check lives separately, at
  `scripts/games/registry.ts:64` inside `validateGameRegistry()` — all three
  files must be updated together (confirmed by reading `scripts/games/
  registry.ts`; do not edit `registry-games.ts` expecting to find the length
  check there).
- The other five games use `source()` (from `registry-types.ts`), which
  builds Google Drive URLs from Drive file/folder IDs recorded in
  `docs-internal/gaming/sources.json` and per-app files under
  `docs-internal/gaming/sources/`. Ludo has no Drive-hosted PRD — its source
  material is the in-repo docs. Add a small `internalSource()` helper next to
  `source()` in `registry-types.ts` that returns the same `{ folderId,
  indexId, prdId, validationId, canonicalDrivePath, links }` shape but with
  `links` pointing at repo-relative doc paths (the two existing Ludo plan
  docs, plus the new `ludo-flutter-plan.md` from task 28) instead of Drive
  URLs. Use it only for the `ludo` registry entry; do not change the other
  five entries.
- Registration status for `ludo` is `"unverified"` (no store listing yet),
  `lifecycle: "concept"`, `rendering: "flame"`, `readiness: scaffoldReadiness`
  (matches the other five scaffolds), `platforms: ["android"]` — Android
  first per product decision, unlike the other five games' `["ios",
  "android"]`. Confirm `validateGameRegistry()` does not hard-code
  `["ios", "android"]`; if it does, extend the check to accept a
  single-platform list rather than special-casing `ludo`.
- `capabilities.specified` for `ludo`: `["game_loop", "guest_identity",
  "save_sync", "sharing"]` (no `billing`/`ads` — no monetization in v1).
  `capabilities.implemented`/`enabled` start empty, filled in by later tasks'
  registry updates (out of scope here — do not mark anything implemented).
- `packages/api/src/games/contracts.ts` exports `GAME_APP_IDS`, a *separate*
  list from the Pub-workspace registry, consumed by the generic `/games/*`
  routes and token verifier. Add `"ludo"` there too. This does not create
  Ludo-specific routes (task 15) — it only makes the id valid for the generic
  contract types.
- CI/tooling locations that hard-code the five-game list (grepped and
  confirmed against the current tree; update every one):
  - `scripts/games/registry.ts:64` — the `GAME_REGISTRY.length !== 5`
    check inside `validateGameRegistry()` (bump to `6`).
  - `.github/workflows/games-android-release.yml` — the `env.GAME_APP` matrix
    list (lines ~11-15) and the `case "$GAME_APP" in
    merge_relay|pocket_biome|sixty_second_heist|meme_court|snapquest)` guard
    (line ~52).
  - `.github/workflows/games-build.yml` — the same `case "$GAME_APP" in ...`
    guard appears twice (lines ~57 and ~121).
  - `scripts/games/generate.ts` — the blocklist regex
    `/merge_relay|pocket_biome|sixty_second_heist|meme_court|snapquest/`
    (line ~132), which stops the generic generator from colliding with a
    real game id.
  - `apps-native/games/pubspec.yaml` — the Pub workspace `workspace:` list;
    add `packages/ludo_rules` and `ludo`.
  - `.github/workflows/games-ci.yml:128` — the `git diff --exit-code`
    invocation lists every game's `game.config.json` path explicitly
    (currently `merge_relay`, `pocket_biome`, `sixty_second_heist`,
    `meme_court`, `snapquest`) plus the generated
    `game_app_registry.dart` path; add
    `apps-native/games/ludo/game.config.json` to that same space-separated
    path list so the generated-file drift check covers Ludo too.
- `bun run games:codegen` regenerates each app's `game.config.json` and the
  Dart registry (`packages/platform_core/lib/src/generated/
  game_app_registry.dart`) from the TypeScript registry. Run it after the
  registry edits above; it will fail loudly if `apps-native/games/ludo/` does
  not exist yet, so this task also creates the minimal directory
  (`apps-native/games/ludo/game.config.json` placeholder plus an empty
  `apps-native/games/packages/ludo_rules/` directory with a `pubspec.yaml`
  stub) — full app/package content is built in tasks 01 and 03. Keep the stub
  buildable: a `pubspec.yaml` with `name: ludo_rules`, no dependencies beyond
  `sdk`, and a placeholder `lib/ludo_rules.dart` exporting nothing yet is
  enough for `games:codegen` and `games:bootstrap` to succeed.
- `.github/workflows/games-ci.yml`'s trigger `paths:` filters (top of the
  file) already match `apps-native/games/**`, `packages/api/**`, and
  `packages/db/**`, so no change is needed there. The separate `git diff
  --exit-code` path list at line ~128 (a drift check, not a trigger filter)
  does need the addition described above.

## Implementation Checklist

- [ ] Add `internalSource()` to `scripts/games/registry-types.ts`.
- [ ] Add `"ludo"` to the `GameId` union in `scripts/games/registry-types.ts`.
- [ ] Add the `ludo` entry to `GAME_REGISTRY` in
  `scripts/games/registry-games.ts` using `internalSource()`,
  `identity("ludo")`, `namespaces("ludo")`, `platforms: ["android"]`,
  `rendering: "flame"`, `lifecycle: "concept"`, `readiness:
  scaffoldReadiness`, and the capability list above.
- [ ] Bump the `GAME_REGISTRY.length !== 5` check to `6` in
  `validateGameRegistry()` (`scripts/games/registry.ts:64`); confirm/extend
  the platform-list assertion so a single-platform game passes.
- [ ] Add `apps-native/games/ludo/game.config.json` to the `git diff
  --exit-code` path list in `.github/workflows/games-ci.yml` (line ~128).
- [ ] Add `"ludo"` to `GAME_APP_IDS` in `packages/api/src/games/contracts.ts`.
- [ ] Update the `GAME_APP` matrix and both `case` guards in
  `.github/workflows/games-android-release.yml` and
  `.github/workflows/games-build.yml` to include `ludo`.
- [ ] Extend the blocklist regex in `scripts/games/generate.ts` to include
  `ludo`.
- [ ] Add `apps-native/games/ludo` and `apps-native/games/packages/ludo_rules`
  to the `workspace:` list in `apps-native/games/pubspec.yaml`.
- [ ] Create the minimal `apps-native/games/packages/ludo_rules/pubspec.yaml`
  stub and an empty `lib/ludo_rules.dart`.
- [ ] Create `docs-internal/gaming/sources/ludo.json` following the shape of
  the other per-app source manifests, pointing at the two existing Ludo docs
  plus a placeholder entry for the not-yet-written
  `docs-internal/gaming/ludo-flutter-plan.md`; add a matching `ludo` entry to
  `docs-internal/gaming/sources.json`.
- [ ] Add a one-paragraph "Superseded" note at the top of
  `docs-internal/gaming/ludo-implementation-plan.md` (below the title, above
  "Status:") stating that `apps-native/games/ludo` (Flutter + Flame) is the
  active v1 target per `tasks/epics/15-ludo-launch/`, that this Unity plan is
  retained as historical record and frozen, and that blockades/Rush Mode as
  described here are explicitly not carried over. Do not otherwise edit this
  file.
- [ ] Run `bun run games:codegen` and commit the generated
  `game.config.json` for `ludo` and the regenerated
  `game_app_registry.dart`.
- [ ] Run `bun run games:bootstrap` to confirm the workspace resolves with
  six apps and seven packages.

## Files Touched

- `scripts/games/registry-types.ts`
- `scripts/games/registry-games.ts`
- `scripts/games/registry.ts`
- `packages/api/src/games/contracts.ts`
- `.github/workflows/games-android-release.yml`
- `.github/workflows/games-build.yml`
- `.github/workflows/games-ci.yml`
- `scripts/games/generate.ts`
- `apps-native/games/pubspec.yaml`
- `apps-native/games/packages/ludo_rules/pubspec.yaml` (new)
- `apps-native/games/packages/ludo_rules/lib/ludo_rules.dart` (new)
- `apps-native/games/ludo/game.config.json` (generated)
- `apps-native/games/packages/platform_core/lib/src/generated/game_app_registry.dart` (generated)
- `docs-internal/gaming/sources.json`
- `docs-internal/gaming/sources/ludo.json` (new)
- `docs-internal/gaming/ludo-implementation-plan.md` (superseding note only)

## Acceptance Criteria

- `bun run games:list` shows six games including `ludo` with production
  application id `app.w3dev.ludo` and debug suffix `.debug`.
- `bun run games:validate:strict` passes with `ludo` present and no
  registry/permission/capability inconsistency errors.
- `bun run games:bootstrap` succeeds against the seven-package, six-app
  workspace.
- `grep -rn "ludo" .github/workflows/games-build.yml
  .github/workflows/games-android-release.yml scripts/games/generate.ts`
  shows `ludo` accepted everywhere the other five ids appear.
- The Unity plan doc still describes the Unity implementation; it only gained
  a short superseding note, nothing else changed (`git diff --stat` shows a
  small insertion, not a rewrite).

## Verification Commands

- `bun run games:codegen`
- `bun run games:bootstrap`
- `bun run games:list`
- `bun run games:validate:strict`
- `bun run check`
- `bun run typecheck`

## Out of Scope

- Any `ludo_rules` gameplay logic (task 01/02).
- Any `apps-native/games/ludo` app content beyond the generated config stub
  (task 03).
- Editing `docs-internal/gaming/ludo-mobile-ui-plan.md` or any Unity source
  file.
- Marking any Ludo capability `implemented` or `enabled`.

## Commit message

`chore(gaming): register ludo as the sixth game and wire CI [15-ludo-launch/00]`
