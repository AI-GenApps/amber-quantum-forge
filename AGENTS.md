# AGENTS.md

Instructions for AI coding agents working in this repository.

## Overview

This is a Turborepo + Bun monorepo producing an Expo mobile app, a native iOS SwiftUI app, and a Next.js web app with a Hono API backend.

## Task execution

**Always start at [`tasks/START.md`](tasks/START.md).** Follow the execution protocol exactly:

1. Open `tasks/STATUS.md` — find the first unchecked epic
2. Open `tasks/epics/XX-<epic>/STATUS.md` — find the first `pending` task
3. Open the task file and implement the checklist step by step
4. Run verification commands
5. Mark complete and commit

Context is lost between sessions. The task files are the single source of truth.

## Commit rules

Format: `<type>(<scope>): <short imperative summary> [<epic-slug>/<task-num>]`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`, `build`

Examples:
```
feat(auth): add JWT exchange endpoint [01-auth-redesign/02]
chore(foundations): add husky + lint-staged pre-commit hooks [00-foundations/00]
```

One task = one commit. **Never use `--no-verify`.**

## Never do

- `--no-verify` or `--no-gpg-sign` on git commands
- `npm install` or `yarn` — use `bun` only
- Edit `*.xcodeproj` directly — edit `project.yml`, then run `xcodegen generate`
- Commit `.env` files
- Add TypeScript `any` — use `unknown` + type guards
- Add code comments unless the task explicitly requires them
- Create files over 300 lines — split if needed
- Default imports for internal modules (except React and Hono route handlers)

## Commands

```bash
bun run check                          # Biome format + lint (must pass before every commit)
bun run typecheck                      # TypeScript check across all packages
bun run test                           # runs @repo/api tests
cd packages/db && bun run db:generate && bun run db:push  # after schema changes
cd apps-native/ios-app && xcodegen generate               # after editing project.yml
bun run scripts/codegen-swift.ts       # generate Swift types from TS
```

## Package manager

Bun only. Commands: `bun add`, `bun remove`, `bun install`, `bunx`.

## Code style

- No comments in source code (unless task explicitly says to)
- No TypeScript `any`
- 300-line limit per file
- Named imports only (except React default import and Hono route handler defaults)
- TypeScript strict mode
- No hardcoded secrets — always read from `process.env`

## Pre-commit hooks

The `.husky/pre-commit` hook runs:
1. `bun run check:max-lines` — no file > 300 lines
2. `bun run check:no-middleware` — `apps/web/middleware.ts` must not exist
3. `bun run check:banned-deps` — no banned npm packages
4. `bun run check:doc-paths` — enforce docs stay only in `docs-internal/` or `docs-public/`
5. `bun run check:staged-docs` — run `mintlify validate` for any staged files under `docs-internal/` or `docs-public/`
6. `bun run check:staged-types` — TypeScript check on staged files
7. `bunx lint-staged` — Biome format/lint + secretlint on staged files

The `.husky/commit-msg` hook runs commitlint to enforce conventional commits.

## Repo layout (target state)

```
apps/
  native/           Expo app
  web/              Next.js + Hono API
apps-native/
  ios-app/          SwiftUI app (NOT a bun workspace)
plugins/
  expo/             TS plugin workspaces (@plugin/expo-*)
  ios/              Swift package plugins
packages/
  api/              Hono routes
  db/               Drizzle ORM
  ui/               Shared React components
  ai/               Vercel AI SDK wrapper
  analytics/        TS event registry
scripts/
  codegen-swift.ts  generates Swift types from TS
docs-internal/
  setup/            11 setup guides
  architecture/      architecture decision docs
  openapi/          OpenAPI spec for internal API docs
docs-public/         public problem-oriented docs
tasks/
  START.md          execution guide
  STATUS.md         global epic checklist
  epics/            per-epic task files
```
