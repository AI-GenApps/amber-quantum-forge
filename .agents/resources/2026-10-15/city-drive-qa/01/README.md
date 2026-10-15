# Task 01 evidence: workspace scaffold

Date: 2026-10-15. Registry: npm (versions verified in the task's dry-run
amendments and confirmed installed via `node_modules/<pkg>/package.json`).

## Pinned versions

| Package | Version | Workspace |
|---|---|---|
| `@babylonjs/core` | 9.31.0 | `@city-drive/app` (dependency) |
| `@babylonjs/loaders` | 9.31.0 | `@city-drive/app` (dependency) |
| `@babylonjs/inspector` | 9.31.0 | `@city-drive/app` (dev) |
| `preact` | 11.0.1 | `@city-drive/app` (dependency) |
| `@city-drive/core` | `workspace:*` | `@city-drive/app` (dependency) |
| `vite` | 8.3.4 | `@city-drive/app` (dev) |
| `vitest` | 5.0.5 | both (dev) |
| `happy-dom` | 21.0.1 | `@city-drive/app` (dev) |
| `typescript` | 5.9.3 (repo root version; never TS 7, the pre-commit hook uses the TS 5 API) | both (dev) |
| `@dimforge/rapier3d-compat` | 0.21.0 | `@city-drive/core` (dependency) |
| `@types/node` | ^20.11.17 (same range as repo root) | both (dev) |

No version differs from the dry-run table. Bun 1.4.2 ran the install (repo pins
1.3.3; pin untouched).

## bun.lock

`bun install` added the new workspaces and their dependencies. It also
re-resolved the hoisting of the existing `@repo/api` Vitest 2.1.9 tree (vite
5.4.21, esbuild 0.21.5, chai, tinybench, ...): those entries moved from
top-level to nested keys because Vitest 5 / Vite 8 now occupy the hoisted
slots. No existing package version changed.

## Notes and small additions

- `knip.json`: `@dimforge/rapier3d-compat` is `ignoreDependencies` for the core
  workspace because it is declared now but first imported in task 03.
- `apps-games/city-drive/src/scene.ts` holds the scene builder so both
  `main.ts` and the `NullEngine` test share it; `src/devInspector.ts` is the
  dynamically imported dev-only inspector.
- `apps-games/city-drive-core/tsconfig.build.json` is the `tsc` build-check
  config; `exports`/`types` point at `src/index.ts` per the dry-run amendment.
- Production build emits one ~1 MB chunk (Babylon core). Chunk splitting and
  size budgets belong to tasks 06 and 15.

## Verification results

See the task report. Pre-existing failures proven on a throwaway HEAD worktree:

- `bun run test` (`@repo/api`): 1 failed file (`drizzle-store.test.ts`,
  `Failed to load url drizzle-orm`), 377 tests passed. Identical result at HEAD.
- `bun run knip:ci`: fails at HEAD on Ludo / Merge Relay exports and
  `.claude/workflows/city-drive-sequential.js`; nothing reported for `apps-games/`.
- Dev server: `GET /`, `/src/main.ts`, `/src/scene.ts` on port 4010 returned 200
  via curl; the server was stopped afterwards. No browser was opened.
