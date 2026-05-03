---
epic: 00-foundations
task: 01-commitlint
status: completed
depends_on:
  - 00-foundations/00-husky-lintstaged
estimate: S
commit_scope: foundations
---

# 01 — Commitlint (Conventional Commits Enforcement)

## Goal

Enforce the commit message format `<type>(<scope>): <summary> [<epic>/<task>]` via commitlint. This ensures every commit in the repo is traceable to a task and follows Conventional Commits, which enables automated changelogs and keeps history readable.

## Context

### Target commit format

```
feat(auth): add JWT exchange endpoint [01-auth-redesign/02]
```

- `type`: `feat | fix | chore | docs | refactor | test | ci | perf | build`
- `scope`: free-form but should match `commit_scope` from task frontmatter
- `summary`: ≤72 chars, imperative present tense
- `[epic/task]` suffix: optional but strongly recommended for task traceability

### Commitlint config

Use `@commitlint/config-conventional` as base. Allow the bracket suffix in the subject line.

### Files to create

- `commitlint.config.ts` at repo root
- `.husky/commit-msg` hook that runs `bunx --no -- commitlint --edit $1`

### Package versions

Use latest commitlint v19+. Check `https://commitlint.js.org` if needed.

## Implementation Checklist

- [x] Install commitlint packages:
  ```bash
  bun add -d @commitlint/cli @commitlint/config-conventional
  ```
- [x] Create `commitlint.config.ts` at repo root:
  ```typescript
  import type { UserConfig } from "@commitlint/types";

  const config: UserConfig = {
    extends: ["@commitlint/config-conventional"],
    rules: {
      "header-max-length": [2, "always", 120],
      "body-max-line-length": [1, "always", 200],
      "footer-max-line-length": [1, "always", 200],
    },
  };

  export default config;
  ```
- [x] Create `.husky/commit-msg` hook:
  ```bash
  #!/bin/sh
  bunx --no -- commitlint --edit $1
  ```
- [x] Make the hook executable: `chmod +x .husky/commit-msg`
- [x] Test with a valid commit message: `echo "feat(auth): add exchange endpoint [01-auth-redesign/02]" | bunx --no -- commitlint`
- [x] Test with an invalid message to confirm rejection: `echo "added stuff" | bunx --no -- commitlint` should exit non-zero.

## Files Touched

- `commitlint.config.ts` — create
- `.husky/commit-msg` — create
- `package.json` — devDependencies updated by bun add

## Verification

- [ ] `bun run check` exits 0
- [ ] `echo "feat(auth): add exchange endpoint" | bunx --no -- commitlint` exits 0
- [ ] `echo "bad commit message" | bunx --no -- commitlint` exits non-zero
- [ ] `.husky/commit-msg` is executable (`ls -la .husky/commit-msg` shows `-rwxr-xr-x`)

## Commit

```
chore(foundations): add commitlint with conventional commits config [00-foundations/01]
```
