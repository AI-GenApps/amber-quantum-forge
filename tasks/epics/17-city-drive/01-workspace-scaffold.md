---
epic: 17-city-drive
task: 01-workspace-scaffold
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/00-knowledge-base-and-decisions]
estimate: M
owner: agent
---

# Workspace scaffold: `apps-games/city-drive` + `apps-games/city-drive-core`

## Goal

Create two Bun workspaces that build, typecheck, lint, and test cleanly. They
should render an empty Babylon scene in the browser (`bun run dev`), with no
gameplay yet.

## Context / Decisions

- **Root `package.json`:** add `"apps-games/*"` to `workspaces`. Add root
  scripts:
  - `"city-drive:dev"`
  - `"city-drive:build"`
  - `"city-drive:test"`, which runs Vitest in both workspaces
  - `"city-drive:typecheck"`

  Do not change the existing `test` script.
- **`apps-games/city-drive-core`** (package name `@city-drive/core`) is pure
  TypeScript with **no DOM and no Babylon imports, ever**. Later tasks add the
  simulation, missions, economy, and save logic here.
  - Deps: `@dimforge/rapier3d-compat`, exact-pinned (check the latest on npm;
    0.21.0 at research time).
  - Dev: `vitest` and `typescript`.
  - Scripts: `test` (`vitest run`), `typecheck` (`tsc --noEmit`), `build` (`tsc -p tsconfig.build.json` into `dist/`).
  - Export a placeholder `version` constant and test it.
- **`apps-games/city-drive`** (package name `@city-drive/app`) is the Vite +
  TypeScript app.
  - Deps (all **exact-pinned**; look up the current stable versions with
    `npm view <pkg> version` and record them in the task's evidence README):
    - `@babylonjs/core`, `@babylonjs/loaders`
    - `preact`
    - `@city-drive/core` (`workspace:*`)
  - Dev: `vite`, `vitest`, `happy-dom`, `typescript`, `@babylonjs/inspector`
    (only for a dev-only `?inspector` URL flag).
  - Scripts: `dev` (Vite on port 4010), `build` (`vite build` into `dist/`),
    `preview`, `test`, `typecheck`.
  - `src/main.ts`: create a canvas, a Babylon `Engine` (WebGL2), and a scene
    with a hemispheric light, a ground plane, and a box, then start the render
    loop. Use **deep ES6 imports only** (`@babylonjs/core/Engines/engine.js`,
    etc.); importing `@babylonjs/core` itself is forbidden.
  - Add a Vitest test that builds the same scene with `NullEngine` and asserts
    the mesh count. This proves headless Babylon works in Node.
- **Biome:** add `"apps-games/**"` to `files.includes`, plus excludes
  `"!apps-games/**/android"` and `"!apps-games/**/ios"` (Capacitor native
  folders arrive in task 17) and `"!apps-games/**/public/assets"`.
- **Knip:** declare the two workspaces with their entry points
  (`src/main.ts`, `vite.config.ts`, `vitest.config.ts`, `src/index.ts`) so Knip
  reports nothing for them.
- Each workspace gets a `tsconfig.json` (strict). The `check:staged-types` hook
  finds the nearest tsconfig. The app needs the DOM lib; the core must not.
- **Turbo:** confirm `build` / `typecheck` pick the new workspaces up (outputs
  are `dist/**`). Add a turbo `test` task only if needed for
  `city-drive:test`; prefer `bun run --filter` instead.
- No `any`; use named imports; no comments unless needed (repo convention).

## Implementation Checklist

- [ ] Add the workspace glob and root scripts; run `bun install` and verify
      that the only `bun.lock` changes are the new dependencies.
- [ ] Scaffold `apps-games/city-drive-core` with its tsconfig, Vitest config,
      and placeholder export + test.
- [ ] Scaffold `apps-games/city-drive` with Vite, the Babylon WebGL2 scene,
      and the `NullEngine` test.
- [ ] Update `biome.json` and `knip.json`.
- [ ] Write `apps-games/city-drive/README.md` (commands, architecture: core
      = simulation, app = render + UI).
- [ ] Record pinned versions in `.agents/resources/2026-10-15/city-drive-qa/01/README.md`.

## Files Touched

- `package.json`, `bun.lock`, `biome.json`, `knip.json`
- `apps-games/city-drive/**`, `apps-games/city-drive-core/**` (new)

## Acceptance Criteria

- `bun run city-drive:test`, `bun run city-drive:typecheck`, and
  `bun run city-drive:build` all pass.
- `bun run check:ci` and `bun run knip` report no issues from `apps-games/`
  (pre-existing issues elsewhere must be proven pre-existing).
- No `from "@babylonjs/core"` barrel import exists
  (`grep -rn "from \"@babylonjs/core\"" apps-games` is empty).
- `city-drive-core` has no `@babylonjs` and no DOM usage.
- The dev server is **not** opened in a browser by the agent (no browser QA).
  Starting it and checking that it responds on port 4010 with `curl` is
  allowed, after which the agent stops it.

## Out of Scope

- Gameplay, assets, Capacitor, registry, CI.

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:typecheck`
- `bun run city-drive:build`
- `bun run check:ci`
- `bun run knip`

## Commit message

`feat(city-drive): scaffold babylon app and core workspaces [17-city-drive/01]`
