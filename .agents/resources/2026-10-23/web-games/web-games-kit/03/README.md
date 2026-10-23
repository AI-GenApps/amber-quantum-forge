# Task 03: web-games CI and internal docs (evidence)

Date: 2026-10-23. Branch: `feat/web-games-kit`. No browser, screenshot, device or network CI run was used.

## Workflow trigger table (`.github/workflows/web-games-ci.yml`)

| Event | Branch filter | Path filter |
|---|---|---|
| `push` | `main` | `apps-games/web-kit/**`, `apps-games/<slug>/**`, `apps-games/<slug>-core/**` for the six slugs, `bun.lock`, `package.json`, `.github/workflows/web-games-ci.yml` |
| `pull_request` | `main` | identical to `push` |

Slugs: lantern-loops, floodplain-dispatch, cloud-observatory, the-last-window, dress-rehearsal,
lost-parcel-desk. Steps in order: checkout, setup-node 24, read Bun version from `packageManager`
(`1.4.3` today), setup-bun, `bun install --frozen-lockfile`, `bun run web-games:typecheck`,
`bun run web-games:test`, `bun run web-games:build`. Permissions `contents: read`, concurrency
group `web-games-<ref>` with cancel-in-progress, `timeout-minutes: 20`.

## Validation

| Check | Result |
|---|---|
| YAML parse (`Bun.YAML.parse`) | parsed: 2 triggers, 16 path filters each, identical for push and PR |
| `bun test scripts/games/web-games-ci-workflow.test.ts` | 6 pass |
| `bun run check:doc-paths` | exit 0 |
| `mintlify validate` in `docs-internal` | "build validation passed" |
| `bun run --filter '@web-games/*' typecheck` | pass, 13 workspaces |
| `bun run --filter '@web-games/*' test` | pass: kit 243, each core 8, each app 3 |
| `bun run --filter '@web-games/*' build` | pass, 13 workspaces |
| `bunx biome check apps-games scripts/games` | pass (1 pre-existing info in `merge-relay-deploy-workflow.test.ts`) |
| `bun test --max-concurrency=1 scripts/games/registry-web.test.ts` | 16 pass |

Notes:

- One registry run hit the 5 s default test timeout while the machine load average was about 190
  (many concurrent processes); the rerun on a quiet machine passed (16 pass, 0 fail, 6.8 s with the
  workflow test).
- `scripts/games/registry.ts` carries the uncommitted web-validation change described in the task 02
  evidence (accept `dom` rendering for the six games, point `webEngineMessage` at `web-games:build`).
  Without it `registry-web.test.ts` fails 4 tests, so it belongs to the same commit. It is outside the
  listed scope fence and is called out for review.
