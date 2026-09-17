---
epic: 13-gaming-portfolio-preparation
task: 01-registry
status: completed
commit_scope: gaming
depends_on: [00-shared-contracts]
estimate: M
---

# Add the app and source registry

## Implementation Checklist

- [x] Define stable internal IDs, canonical names, public titles, subtitles, source links, and canonical paths.
- [x] Preserve `snapquest` as the internal ID and `Apps/SnapQuest/` as its canonical Drive path while exposing `Peeklings` as the public title candidate.
- [x] Record finalized technical bundle/application identifiers and unverified store/provider values separately.
- [x] Record capabilities, permissions, rendering surface, save namespace, analytics namespace, and build targets per app.
- [x] Validate uniqueness, path boundaries, identifier syntax, and unresolved production values.
- [x] Generate the Dart registry used by game clients.

## Verification

- `bun run games:list`
- `bun run games:validate:strict`
- `bun run games:codegen`
- `bun run games:analyze`
