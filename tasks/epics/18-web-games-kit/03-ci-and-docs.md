---
epic: 18-web-games-kit
task: 03-ci-and-docs
status: pending
commit_scope: web-games-kit
depends_on: [18-web-games-kit/02-game-skeletons-and-registry]
estimate: S
owner: agent
---

# Web-games CI and internal docs

## Goal

Gate every change to the kit and the six games in GitHub Actions, and document
the architecture so game epics 19 to 24 follow the same conventions.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and
  done by the owner at the end; CI therefore runs only typecheck, unit tests and
  build, with no browser or device jobs.
- **Pin rule:** Exact-pin every dependency. Reuse the exact versions already
  used by apps-games/city-drive/package.json for preact, vite, vitest,
  typescript, happy-dom, sharp, @types/node and all @capacitor/* packages it
  uses. @capacitor/share must be the newest 8.x release, exact-pinned. Add no
  other runtime dependency to the kit or any skeleton. This task adds no
  dependency; the docs must state the rule.
- **Workflow** `.github/workflows/web-games-ci.yml` (model it on
  `city-drive-ci.yml`):
  - triggers: `pull_request` and `push` to `main`, with `paths` filters for
    `apps-games/web-kit/**`, the six `apps-games/<slug>/**` dirs and their
    `apps-games/<slug>-core/**` dirs, `bun.lock`, `package.json` and the
    workflow file itself;
  - set up bun using the version from the root `package.json` `packageManager`
    field (`bun-version-file` or reading the field; do not hard-code another
    version);
  - `bun install --frozen-lockfile`, then `bun run web-games:typecheck`, `bun
    run web-games:test`, `bun run web-games:build`;
  - least-privilege `permissions: contents: read`, concurrency group that cancels
    superseded runs, a sensible job timeout.
  - Do not touch `city-drive-ci.yml` or other workflows.
- **Doc** `docs-internal/gaming/web-games-kit.md` (Mintlify page with
  frontmatter `title` and `description`): architecture (kit, app, core split;
  why core is pure TS), the module list from task 01 with one line each, how a
  game is structured (directory tree, scripts, screens through the router, core
  vs app responsibilities), save conventions (versioned schema, migrations,
  Preferences vs localStorage, corrupt recovery), daily conventions
  (`localDateKey`, `dailySeed(gameId, dateKey)`, generated on device, no server),
  audio conventions (CC0 only, source URL and licence per file, unlock on first
  gesture), fonts (OFL, bundled woff2, no platform fallback), the art pipeline
  via the MobileGamesDesigner T3 thread with strict review, the pin rule, the
  scope fence, and that owner QA is browser-only (agents never run a browser).
  Link to `tasks/epics/18-web-games-kit/STATUS.md`.
- Register the page in `docs-internal/docs.json` navigation (next to the other
  gaming pages) so `mintlify validate` passes. If the pre-commit hook fails with
  "Cannot find module", delete the stale cache `rm -rf
  $TMPDIR/bunx-*-mintlify@latest` and retry; it is not a code problem.
- Respect `bun run check:doc-paths`: no `docs/` paths.

## Implementation Checklist

- [ ] Confirm tasks 01 and 02 are complete and `web-games:*` scripts exist.
- [ ] Write `.github/workflows/web-games-ci.yml`; validate the YAML (parse it
      with a script; no network run is possible).
- [ ] Write `docs-internal/gaming/web-games-kit.md`.
- [ ] Add the page to `docs-internal/docs.json`; run `bun run check:doc-paths`.
- [ ] Update `.agents/games/web-games-kit/decisions-log.md` with the CI and doc
      decisions.
- [ ] Write `.agents/resources/2026-10-23/web-games/web-games-kit/03/README.md`
      (workflow trigger table, validation output).
- [ ] Tick task 03 in `STATUS.md`; when 00 to 03 are all done, tick epic 18 in
      `tasks/STATUS.md`.

## Files Touched

- `.github/workflows/web-games-ci.yml` (new)
- `docs-internal/gaming/web-games-kit.md` (new), `docs-internal/docs.json`
- `.agents/games/web-games-kit/decisions-log.md`
- `.agents/resources/2026-10-23/web-games/web-games-kit/03/README.md`
- `tasks/epics/18-web-games-kit/STATUS.md`, `tasks/STATUS.md`

## Acceptance Criteria

- The workflow parses as valid YAML, triggers on the listed paths only, derives
  the bun version from `packageManager`, and runs install, typecheck, test and
  build in that order with `--frozen-lockfile`.
- `docs-internal/gaming/web-games-kit.md` covers every item listed above and is
  reachable from `docs-internal/docs.json`; `mintlify validate` (via the staged
  docs hook) passes.
- `bun run check:doc-paths` passes.
- All five verification commands below pass.

## Verification Commands

- `bun run --filter '@web-games/*' typecheck`
- `bun run --filter '@web-games/*' test`
- `bun run --filter '@web-games/*' build`
- `bunx biome check apps-games scripts/games`
- `bun test --max-concurrency=1 scripts/games/registry-web.test.ts`

## Out of Scope

- Deploy workflows, Vercel projects, store provisioning.
- Android/iOS build jobs, emulator or browser test jobs.
- Per-game docs (each game's own release-readiness task).
- Changing existing workflows or docs pages other than `docs.json`.

## Commit message

`ci(web-games-kit): add web-games CI and internal docs [18-web-games-kit/03]`
