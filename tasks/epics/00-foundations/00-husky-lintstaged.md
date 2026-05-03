---
epic: 00-foundations
task: 00-husky-lintstaged
status: completed
depends_on: []
estimate: S
commit_scope: foundations
---

# 00 — Husky + lint-staged Pre-commit Hooks

## Goal

Ensure the existing husky + lint-staged setup is complete, documented, and working correctly. The repo already has a `.husky/pre-commit` file and `bunx lint-staged` wired up, but lint-staged config may be minimal. This task audits and completes it.

## Context

### Existing state

- `.husky/pre-commit` already exists and runs:
  1. `bun run check:max-lines`
  2. `bun run check:no-middleware`
  3. `bun run check:banned-deps`
  4. `bun run check:staged-types`
  5. `bunx lint-staged`
- `package.json` has `"prepare": "husky"` script.
- `bun run check` runs Biome format + lint on the whole repo.

### What may be missing

- A `.lintstagedrc.json` (or `lint-staged` key in package.json) defining which Biome commands run on staged files.
- Husky install may not run automatically for new contributors without `bun install`.

### Related files

- `.husky/pre-commit` — existing hook file
- `package.json` — root scripts
- `biome.json` — Biome config (check what rules are active)

## Implementation Checklist

- [x] Read `.husky/pre-commit` to confirm all 5 checks are present. If any are missing, add them.
- [x] Read `package.json` to find any existing `lint-staged` config.
- [x] Create or update `.lintstagedrc.json` at the repo root:
  ```json
  {
    "*.{ts,tsx,js,jsx}": ["biome check --write --no-errors-on-unmatched"],
    "*.{json,md}": ["biome format --write --no-errors-on-unmatched"]
  }
  ```
- [x] Verify `husky` and `lint-staged` are in `devDependencies` of root `package.json`. If not, run:
  ```bash
  bun add -d husky lint-staged
  ```
- [x] Run `bun run prepare` to ensure husky is initialized (creates `.husky/` if not present).
- [x] Test the hook by staging a `.ts` file with a trivial change and running `git commit --dry-run` (or simply confirm `bunx lint-staged` runs without error).
- [x] Add a `## Pre-commit Hooks` section to `docs/setup/00-overview.md` (that file will be created in task 03; create a placeholder if it doesn't exist yet).

## Files Touched

- `.lintstagedrc.json` — create
- `.husky/pre-commit` — verify/update
- `package.json` — verify devDependencies

## Verification

- [ ] `bun run check` exits 0
- [ ] `bun install` followed by `bun run prepare` exits 0 with no errors
- [ ] `bunx lint-staged --verbose` on a staged TS file runs Biome without errors
- [ ] `bun run check:max-lines` exits 0
- [ ] `bun run check:no-middleware` exits 0
- [ ] `bun run check:banned-deps` exits 0

## Commit

```
chore(foundations): verify and complete husky + lint-staged setup [00-foundations/00]
```
