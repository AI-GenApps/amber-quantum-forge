# 00 — Overview

Setup documentation for `starter-expo-mobile`.

## Pre-commit Hooks

This repository uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to enforce code quality on every commit.

The pre-commit hook runs the following checks in order:

1. `bun run check:max-lines` — no file may exceed 300 lines
2. `bun run check:no-middleware` — `apps/web/middleware.ts` must not exist
3. `bun run check:banned-deps` — no banned npm packages
4. `bun run check:staged-types` — TypeScript type-check on staged files
5. `bunx lint-staged` — Biome format + lint on staged files (config in `.lintstagedrc.json`)

**Never bypass hooks with `--no-verify`.**
