---
epic: 00-foundations
task: 04-root-readme-agents-claude
status: completed
depends_on:
  - 00-foundations/03-docs-setup-skeleton
estimate: S
commit_scope: docs
---

# 04 — Root README + AGENTS.md + CLAUDE.md Updates

## Goal

Update the three root guidance files so that any agent or human developer who clones this repo immediately understands the structure, how to start, and the conventions to follow.

## Context

### Files to update

**`README.md`** — public-facing, should explain what the repo is, how to get started, link to `docs/setup/`.

**`AGENTS.md`** — instructions for AI coding agents (Copilot, Claude, etc.). Must be specific about rules, file locations, and commands.

**`CLAUDE.md`** — already exists with build commands. Needs the new commands, conventions, and links to task system.

### Key things to add

- Link to `tasks/START.md` for task-based implementation
- New packages: `packages/ai`, `packages/analytics`
- New workspace additions: `plugins/expo/*`
- New app: `apps-native/ios-app/` (not a bun workspace)
- Auth architecture change: two-stage JWT
- Bun run commands updated with new scripts
- Codegen script: `bun run scripts/codegen-swift.ts`

## Implementation Checklist

- [x] Update `README.md`
- [x] Create or update `AGENTS.md`
- [x] Update `CLAUDE.md`

## Files Touched

- `README.md` — rewrite
- `AGENTS.md` — create (or rewrite if exists)
- `CLAUDE.md` — update

## Verification

- [ ] `bun run check` exits 0
- [ ] `README.md` contains link to `tasks/START.md`
- [ ] `AGENTS.md` contains the commit message format
- [ ] `CLAUDE.md` mentions `API_JWT_SECRET` and `packages/ai`
- [ ] All three files have valid markdown (no broken headers)

## Commit

```
docs(docs): update README, AGENTS.md, CLAUDE.md with new architecture [00-foundations/04]
```
