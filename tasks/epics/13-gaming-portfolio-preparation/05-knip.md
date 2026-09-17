---
epic: 13-gaming-portfolio-preparation
task: 05-knip
status: completed
commit_scope: hygiene
depends_on: [02-tooling]
estimate: M
---

# Add Knip stale-code analysis

## Implementation Checklist

- [x] Pin Knip and add a repository configuration covering existing JS/TS workspaces and scripts.
- [x] Run a baseline report before changing source files.
- [x] Remove only findings with static, dynamic, build, and deployment evidence.
- [x] Record retained ambiguous findings and recovery points.
- [x] Make Knip part of the long-term CI maintenance gate.

## Verification

- `bun run knip`
- `bun run knip:ci`
- Migration/deletion log links every removal to evidence.
