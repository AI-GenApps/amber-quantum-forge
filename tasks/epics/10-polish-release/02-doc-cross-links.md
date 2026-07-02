---
epic: 10-polish-release
task: 02-doc-cross-links
status: pending
depends_on:
  - 00-foundations/03
  - 00-foundations/04
estimate: M
commit_scope: docs
---

# 02 — Cross-link all documentation

## Goal
Ensure every doc file references related docs, and the root README links to all architecture docs and setup guides.

## Context
- Existing docs structure (after epic 00/03): `docs-internal/setup/`, `docs-internal/architecture/`
- Root `README.md` created in epic 00/04
- Every architecture doc should link to its corresponding setup doc and vice versa
- `tasks/START.md` should link to `docs-internal/architecture/auth.md` and `docs-internal/architecture/ai.md`

## Implementation Checklist
- [ ] Read current `README.md` and all files in `docs-internal/`
- [ ] Add to `README.md` a "Documentation" section with links to:
  - `docs-internal/architecture/auth.md`
  - `docs-internal/architecture/ai.md`
  - `docs-internal/setup/` files (whatever was created in epic 00/03)
- [ ] Add "See also" footer to `docs-internal/architecture/auth.md` linking to relevant setup doc and `tasks/epics/01-auth-redesign/STATUS.md`
- [ ] Add "See also" footer to `docs-internal/architecture/ai.md` linking to relevant setup doc and `tasks/epics/02-ai-server/STATUS.md`
- [ ] Update `tasks/START.md` references section to include links to architecture docs
- [ ] `bun run check` exits 0

## Files Touched
- `README.md` — update
- `docs-internal/architecture/auth.md` — update
- `docs-internal/architecture/ai.md` — update
- `tasks/START.md` — update

## Verification
- [ ] All relative links in markdown files resolve to existing files
- [ ] `bun run check` exits 0

## Commit
```
docs: cross-link architecture docs, setup guides, and README [10-polish-release/02]
```
