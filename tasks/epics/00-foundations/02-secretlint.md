---
epic: 00-foundations
task: 02-secretlint
status: pending
depends_on:
  - 00-foundations/00-husky-lintstaged
estimate: S
commit_scope: foundations
---

# 02 — Secretlint (Secret Leak Prevention)

## Goal

Prevent secrets (API keys, tokens, private keys) from being accidentally committed to the repository. Secretlint scans staged files for known secret patterns before each commit.

## Context

### How secretlint works

Secretlint uses regex-based rule packages to detect secrets. The `@secretlint/secretlint-rule-preset-recommend` package includes rules for AWS, GCP, GitHub tokens, generic private keys, Slack tokens, Stripe keys, etc.

It integrates with lint-staged so it only scans staged files, keeping it fast.

### Pattern of integration

Add secretlint to `.lintstagedrc.json` as a step that runs on all file types (not just TS):

```json
{
  "*": ["secretlint"]
}
```

This must run in addition to (not instead of) the Biome steps.

### Files to create

- `.secretlintrc.json` — secretlint config

## Implementation Checklist

- [ ] Install secretlint:
  ```bash
  bun add -d secretlint @secretlint/secretlint-rule-preset-recommend
  ```
- [ ] Create `.secretlintrc.json` at repo root:
  ```json
  {
    "rules": [
      {
        "id": "@secretlint/secretlint-rule-preset-recommend"
      }
    ],
    "ignoreFilePath": ".secretlintignore"
  }
  ```
- [ ] Create `.secretlintignore` at repo root to avoid scanning generated/vendor files:
  ```
  node_modules/
  .next/
  dist/
  build/
  *.lock
  bun.lockb
  CHANGELOG.md
  docs/
  tasks/
  ```
- [ ] Update `.lintstagedrc.json` to add secretlint as a step for all files. The final `.lintstagedrc.json` should look like:
  ```json
  {
    "*.{ts,tsx,js,jsx}": ["biome check --write --no-errors-on-unmatched"],
    "*.{json,md}": ["biome format --write --no-errors-on-unmatched"],
    "*": ["secretlint --secretlintignore .secretlintignore"]
  }
  ```
- [ ] Test secretlint on a clean file: `bunx secretlint "package.json"` should exit 0.
- [ ] Verify `.env` files are in `.gitignore` (they should be; confirm and add if not).

## Files Touched

- `.secretlintrc.json` — create
- `.secretlintignore` — create
- `.lintstagedrc.json` — update to add secretlint step
- `package.json` — devDependencies updated by bun add

## Verification

- [ ] `bunx secretlint "package.json"` exits 0
- [ ] `bunx secretlint "apps/native/firebase.config.ts"` exits 0 (no hardcoded secrets in existing config)
- [ ] `bun run check` exits 0
- [ ] `.env` is listed in `.gitignore`

## Commit

```
chore(foundations): add secretlint to prevent secret leaks in commits [00-foundations/02]
```
