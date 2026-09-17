---
epic: 13-gaming-portfolio-preparation
task: 02-tooling
status: completed
commit_scope: gaming
depends_on: [00-shared-contracts, 01-registry]
estimate: L
---

# Implement game developer commands

## Implementation Checklist

- [x] Add bootstrap and environment diagnostics.
- [x] Add listing, formatting, analysis, testing, content/config validation, run, build, and affected-target commands.
- [x] Keep iOS simulator and distribution actions out of default verification; report missing devices and credentials as `NOT RUN`.
- [x] Keep Android/Linux and macOS/iOS checks separate.
- [x] Include root and scoped lockfiles in dependency detection.
- [x] Document every command with a real invocation.

## Verification

- `bun run games:doctor`
- `bun run games:format`
- `bun run games:analyze`
- `bun run games:test`
- `bun run games:validate`
- `bun run games:affected`
