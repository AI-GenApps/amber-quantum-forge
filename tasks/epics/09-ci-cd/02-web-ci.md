---
epic: 09-ci-cd
task: 02-web-ci
status: pending
depends_on:
  - 00-foundations/00
estimate: S
commit_scope: ci
---

# 02 — Web CI workflow

## Goal
Create `.github/workflows/web-ci.yml` that runs Biome lint/typecheck and builds the Next.js web app on GitHub-hosted runners for every push and PR.

## Context
- Runner: `ubuntu-latest` (GitHub-hosted)
- Steps: checkout → Bun setup → `bun install` → `bun run check` → `bun run build`
- Build runs in `apps/web`
- Requires `DATABASE_URL` and other env vars for build — use dummy values or `SKIP_ENV_VALIDATION=1`
- Path filter: trigger only on changes to `apps/web/**`, `packages/**`

## Implementation Checklist
- [ ] Create `.github/workflows/web-ci.yml`:
  ```yaml
  name: Web CI
  on:
    push:
      branches: [main]
      paths:
        - 'apps/web/**'
        - 'packages/**'
        - '.github/workflows/web-ci.yml'
    pull_request:
      paths:
        - 'apps/web/**'
        - 'packages/**'
  jobs:
    lint-and-build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: oven-sh/setup-bun@v2
          with:
            bun-version: latest
        - run: bun install
        - run: bun run check
        - run: bun run build
          working-directory: apps/web
          env:
            SKIP_ENV_VALIDATION: "1"
            DATABASE_URL: "postgresql://localhost/ci"
  ```
- [ ] Verify YAML is valid

## Files Touched
- `.github/workflows/web-ci.yml` — create

## Verification
- [ ] YAML parses without error
- [ ] `bun run check` exits 0

## Commit
```
feat(ci): add web CI workflow for Next.js lint and build [09-ci-cd/02]
```
